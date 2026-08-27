/* =============================================================================
   Chiya admin — what a contract turns into when it is signed.

   ONE FUNCTION DECIDES, AND BOTH CALLERS USE IT. `plannedInvoices()` returns the
   invoices a contract produces. The consequence bar on the creation form counts
   that list; signing the contract issues that list. They cannot disagree,
   because there is nothing for them to disagree about.

   That is the whole reason the preview is worth building. An agent who can see
   "13 invoices, the first due 15 Jul 2027" before they sign catches a start date
   typed as next year. A preview computed separately from the real generation
   would eventually show one thing and do another, which is worse than no preview
   at all — it would be a check people trust.

   FOUR THINGS THIS FILE WILL NOT DO, each of them deliberate:

   · A DRAFT GENERATES NOTHING. Not one invoice, not a placeholder. Generation
     fires on the transition INTO signed and nowhere else.
   · THE INSURANCE DEPOSIT IS NOT AN INVOICE. It is the tenant's money held
     against damage — a liability, not a demand and not income. It is recorded
     against the contract and surfaced as "Deposits held".
   · COMMISSION IS CHARGED ONCE, AT SIGNING. Never per cycle, never per
     instalment. Twelve rent invoices raise ONE commission between them.
   · NOTHING HERE IS THE AGENCY'S MONEY UNLESS IT SAYS SO. Rent and instalments
     carry `payee: "owner"` — see the note on each — and `isAgencyMoney`
     filters them out of every finance figure.

   NOTHING HERE TOUCHES A STORE, and nothing here reads a clock. Every input is
   a parameter, every output is a plain record. The wiring that issues them,
   writes the audit trail and moves the property lives in ./finance-actions.
   ========================================================================== */

import { monthName } from "@/lib/fmt";
import type { Lang } from "@/lib/i18n/config";
import { addDays, addMonths, cycleDueDates, fromIso } from "@/lib/dates";
import { isZero, multiply, percentOf, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";
import {
  CYCLE_MONTHS,
  PLATFORM_CURRENCY,
  clauseKeysFor,
  commissionAmountFor,
  cycleCount,
  deriveEndsOn,
  hasInstallments,
  installmentSchedule,
  ownerCommissionOf,
  templateKind,
  templateOf,
  tenantCommissionOf,
  type BillTo,
  type ClauseKey,
  type CommissionTerm,
  type ContractRecord,
  type ContractTemplate,
  type ExpectedPaymentMethod,
  type ExternalParty,
  type InstallmentFrequency,
  type InstallmentsPaidTo,
  type InvoiceCategory,
  type InvoicePayee,
  type InvoiceRecord,
  type ManagementFee,
  type RentCycle,
  type RentPaidTo,
  type SignerOverride,
} from "../../_data/contracts";
import type { MemberRecord } from "../../_data/catalog";

/** Translate-and-interpolate, as `useLang().t` provides it. Passed in rather
    than imported so this module stays free of React and of a language choice. */
export type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * How long the agency's own fee gets before it falls due.
 *
 * A constant, not a field on the form. The commission due date is the agency's
 * own credit terms — it is the same on every contract, nobody negotiates it at
 * the desk, and putting it on the form would be one more thing to read past on
 * a screen that already asks a lot. Change it here and every future contract
 * follows; the ones already issued keep the date they were issued under.
 */
export const COMMISSION_DUE_DAYS = 14;

/* ----------------------------------------------------------------------------
   The draft a form holds
   ------------------------------------------------------------------------- */

/**
 * What the contract form is editing, before it becomes a record.
 *
 * Deliberately NOT a `Partial<ContractRecord>`. A form is a different thing
 * from a record: `signingDate` is empty string rather than undefined (an input
 * has no undefined), the derived fields are absent because they are derived,
 * and the lease block may be half-filled while someone is typing. Modelling it
 * as a partial record would mean every reader had to guess which of those two
 * things it was holding.
 *
 * `template` is fixed for the life of the draft — it is chosen before the form
 * opens (see §1) and there is no control on any step that changes it.
 */
export interface ContractDraft {
  template: ContractTemplate;
  propertyId: string;
  ownerId: string;
  /** Present when the person signing is not the registered owner. */
  signerOverride?: SignerOverride;
  /** …and when it was not the buyer or tenant either. */
  buyerSignerOverride?: SignerOverride;
  /** Set when the counterparty holds an account. Never alongside the next one. */
  buyerId?: string;
  buyerExternal?: ExternalParty;
  agentId: string;

  /* ---- sale ---- */
  /** The sale price. On a lease this is DERIVED — see `draftPrice`. */
  salePrice?: Money;
  downPayment?: Money;
  installmentCount?: number;
  installmentFrequency?: InstallmentFrequency;
  firstInstallmentOn?: string;
  installmentsPaidTo?: InstallmentsPaidTo;

  /* ---- lease ---- */
  /** The monthly rate the contract states. The per-cycle figure is derived. */
  monthlyRent?: Money;
  cycle?: RentCycle;
  termMonths?: number;
  startsOn?: string;
  insuranceDeposit?: Money;
  expectedPaymentMethod?: ExpectedPaymentMethod;
  rentPaidTo?: RentPaidTo;
  managementFee?: ManagementFee;

  /* ---- commission, both sides ---- */
  ownerCommission: CommissionTerm;
  tenantCommission: CommissionTerm;
  commissionOverrideReason?: string;

  /** Clause variables, keyed — see ContractRecord.clauses. */
  clauses: Record<string, string | number>;

  /**
   * A SALE'S HOLDING DEPOSIT — money down to take the property off the market.
   *
   * Nothing like `insuranceDeposit`, which is a tenant's money held against
   * damage. This one IS consideration: it is part of the price, and it is the
   * seller's from the moment it is paid.
   *
   * ⚠ RECORDED AS A TERM, NOT INVOICED. `plannedInvoices` does not raise a line
   * for it and this field does not change that. Whether it should is a real
   * question and a separate decision — see the note there.
   */
  deposit?: Money;

  /* ---- signing ---- */
  /** Empty means draft. THE field that decides draft vs signed. */
  signingDate: string;
  /** Keys handed over. Defaults to the signing date; editable because a lease
      routinely gives the tenant a couple of days to pay before the keys move. */
  handoverOn?: string;
  city: string;
  copies: number;
  organizerId: string;
  /** The signed original is kept elsewhere — a notary, a solicitor, the owner's
      own file. A fact about the day of signing, unrecoverable later. */
  externalPaperwork?: boolean;
  /** Free-text context for the admin. Never shown to a counterparty. */
  notes?: string;

  /* ---- currency ----------------------------------------------------------
     See ContractRecord.agreedRate: the rate is a CONTRACTUAL TERM, not a market
     reading. It is pre-filled from settings when the form opens, but the number
     the parties actually shook hands on is the one that binds, so it is typed
     here rather than looked up at save time. */
  /** Units of the other currency per 1 unit of the price's currency. */
  agreedRate?: number;
  /** Whether the parties agreed to SETTLE in a second currency. */
  dualCurrency?: boolean;
}

/**
 * THE CONTRACTUAL FIGURE — the sale price, or ONE CYCLE'S rent.
 *
 * A lease's price is derived from the monthly rate and the cycle rather than
 * typed: the tenant agreed to a monthly rent, and a quarterly invoice is three
 * of those. Asking for both would let them disagree, and the invoice would then
 * charge something the document does not state.
 */
export function draftPrice(draft: ContractDraft): Money | undefined {
  if (draft.template !== "lease") return draft.salePrice;
  if (!draft.monthlyRent || !draft.cycle) return draft.monthlyRent;
  return multiply(draft.monthlyRent, CYCLE_MONTHS[draft.cycle]);
}

/** What one commission comes to, from the draft's own figures. The form's live
    total and the invoice raised at signing both read this. */
export function draftCommissionAmount(draft: ContractDraft, term: Pick<CommissionTerm, "basis" | "value">): Money {
  const price = draftPrice(draft);
  if (!price) return zeroMoney(draft.monthlyRent?.currency ?? draft.salePrice?.currency ?? "USD");
  return commissionAmountFor(term.basis, term.value, { price, monthlyRent: draft.monthlyRent });
}

/** The day a lease's term runs out, from the form's own start and length. */
export function draftEndsOn(draft: Pick<ContractDraft, "template" | "startsOn" | "termMonths">): string | undefined {
  if (draft.template !== "lease" || !draft.startsOn || !draft.termMonths) return undefined;
  return deriveEndsOn(draft.startsOn, draft.termMonths);
}

/**
 * The legacy headline commission RATE, expressed as a percentage of the price.
 *
 * `ownerCommission` is the authority now; this exists because `commissionRate`
 * is still on the record and still read — by the mandate cross-check, and by
 * every screen written before commissions were split in two.
 *
 * For a percentage basis it is exactly the stated rate. For the month-based
 * bases it is the equivalent percentage, which is rarely round: half a month's
 * rent on a quarterly cycle is 16.67% of the cycle. That is descriptive rather
 * than authoritative, and `ownerCommission.amount` is what actually gets billed.
 */
export function draftCommissionRate(draft: ContractDraft): number {
  if (draft.ownerCommission.basis === "percent") return draft.ownerCommission.value ?? 0;
  const price = draftPrice(draft);
  const amount = draftCommissionAmount(draft, draft.ownerCommission);
  if (!price || price.amount === 0) return 0;
  return (amount.amount / price.amount) * 100;
}

/** Only the clause variables this template actually prints. A value left behind
    from a template the user never chose would be stored and never rendered. */
function clausesForTemplate(template: ContractTemplate, clauses: Record<string, string | number>): Record<string, string | number> {
  const allowed = clauseKeysFor(template);
  const out: Record<string, string | number> = {};
  for (const key of allowed) {
    const value = clauses[key];
    if (value !== undefined && value !== "") out[key] = value;
  }
  return out;
}

/**
 * THE FOUR CURRENCY RULES, applied to a record being built.
 *
 * `contracts.ts` asserts exactly these at module load, but that block walks the
 * SEED — a contract somebody writes in the app never passes through it. Left to
 * `toContractRecord` alone the record would simply come out inconsistent and
 * nothing would say so, so the rules are enforced here as well:
 *
 *   1  a rate is REQUIRED when the price is not in the platform currency, or
 *      when the parties agreed to settle in a second one
 *   2  a rate is FORBIDDEN when nothing on the contract uses one — a stale
 *      number sitting on a record is worse than no number
 *   3  a rate always carries the day it was agreed; a rate with no date is not
 *      a term
 *   4  dual currency names its second currency, and it is never the first
 *
 * Returns the currency fields to spread onto the record.
 */
function currencyTerms(
  price: Money,
  createdOn: string,
  agreedRate: number | undefined,
  dualCurrency: boolean,
): Pick<ContractRecord, "dualCurrency" | "secondaryCurrency" | "agreedRate" | "agreedRateSetOn"> {
  const needsRate = price.currency !== PLATFORM_CURRENCY || dualCurrency;
  /* Only two currencies exist (see MINOR_UNITS in lib/money), so the second one
     is not a question worth asking — it is whichever this contract is not. */
  const secondary: CurrencyCode = price.currency === "USD" ? "IQD" : "USD";
  return {
    dualCurrency,
    ...(dualCurrency ? { secondaryCurrency: secondary } : {}),
    ...(needsRate && agreedRate && agreedRate > 0
      ? { agreedRate, agreedRateSetOn: createdOn }
      : {}),
  };
}

/**
 * Turn a completed draft into the record that gets stored.
 *
 * `signingDate` becomes both the status and the date: a contract with one is
 * signed, a contract without one is a draft. There is no third way to say it,
 * which is what stops a record ending up signed with no signing date on it.
 */
export function toContractRecord(
  draft: ContractDraft,
  opts: { id: string; createdOn: string; agreedRate?: number },
): Omit<ContractRecord, "previousPublication"> {
  const signed = !!draft.signingDate;
  const lease = draft.template === "lease";
  const price = draftPrice(draft) ?? zeroMoney("USD");
  const ownerCommission: CommissionTerm = { ...draft.ownerCommission, amount: draftCommissionAmount(draft, draft.ownerCommission) };
  const tenantCommission: CommissionTerm = { ...draft.tenantCommission, amount: draftCommissionAmount(draft, draft.tenantCommission) };
  const clauses = clausesForTemplate(draft.template, draft.clauses);

  return {
    id: opts.id,
    kind: templateKind(draft.template),
    template: draft.template,
    status: signed ? "signed" : "draft",
    propertyId: draft.propertyId,
    ownerId: draft.ownerId,
    ...(draft.signerOverride ? { signerOverride: draft.signerOverride } : {}),
    ...(draft.buyerSignerOverride ? { buyerSignerOverride: draft.buyerSignerOverride } : {}),
    ...(draft.buyerId ? { buyerId: draft.buyerId } : {}),
    ...(draft.buyerExternal ? { buyerExternal: draft.buyerExternal } : {}),
    agentId: draft.agentId,
    price,
    /* `commission` stays the OWNER's side on every record — see the note on
       ContractRecord.ownerCommission. The agency's whole earning is
       `totalCommission`, which adds the tenant's side to it. */
    commission: ownerCommission.amount,
    commissionRate: draftCommissionRate(draft),
    ...(draft.commissionOverrideReason ? { commissionOverrideReason: draft.commissionOverrideReason } : {}),
    ownerCommission,
    tenantCommission,
    ...(Object.keys(clauses).length ? { clauses } : {}),
    createdOn: opts.createdOn,
    ...(signed ? { signedOn: draft.signingDate } : {}),
    /* Handover defaults to the day of signing and is stored only once there is
       a signing date to default from — a draft has no handover. */
    ...(signed ? { handoverOn: draft.handoverOn || draft.signingDate } : {}),
    ...(draft.city ? { city: draft.city } : {}),
    ...(draft.copies ? { copies: draft.copies } : {}),
    ...(draft.organizerId ? { organizerId: draft.organizerId } : {}),
    ...(draft.externalPaperwork ? { externalPaperwork: true } : {}),
    ...(draft.notes?.trim() ? { notes: draft.notes.trim() } : {}),
    ...(lease
      ? {
          cycle: draft.cycle,
          termMonths: draft.termMonths,
          startsOn: draft.startsOn,
          endsOn: draftEndsOn(draft),
          monthlyRent: draft.monthlyRent,
          rentPaidTo: draft.rentPaidTo,
          ...(draft.insuranceDeposit && !isZero(draft.insuranceDeposit)
            ? /* Held from the moment it is taken. Not an invoice, not income —
                 see the header note and ContractRecord.insuranceDeposit. */
              { insuranceDeposit: draft.insuranceDeposit, depositStatus: "held" as const }
            : {}),
          ...(draft.expectedPaymentMethod ? { expectedPaymentMethod: draft.expectedPaymentMethod } : {}),
          /* A management fee only means anything when the agency collects — the
             seed validation refuses one otherwise, and so does this. */
          ...(draft.rentPaidTo === "agency" && draft.managementFee ? { managementFee: draft.managementFee } : {}),
        }
      : {}),
    /* A sale's holding deposit — consideration, unlike the tenancy deposit
       above. Recorded as a term; see the note on ContractDraft.deposit. */
    ...(!lease && draft.deposit && !isZero(draft.deposit) ? { deposit: draft.deposit } : {}),
    ...(draft.template === "sale_installments"
      ? {
          ...(draft.downPayment && !isZero(draft.downPayment) ? { downPayment: draft.downPayment } : {}),
          installmentCount: draft.installmentCount,
          installmentFrequency: draft.installmentFrequency,
          firstInstallmentOn: draft.firstInstallmentOn,
          installmentsPaidTo: draft.installmentsPaidTo ?? "seller",
        }
      : {}),
    /* The typed rate wins over the pre-filled one: `opts.agreedRate` is what
       settings said when the form opened, `draft.agreedRate` is what the parties
       agreed. Only the second is a contractual term. */
    ...currencyTerms(price, opts.createdOn, draft.agreedRate ?? opts.agreedRate, draft.dualCurrency ?? false),
  };
}

/* ----------------------------------------------------------------------------
   Bill-to snapshots
   ------------------------------------------------------------------------- */

/**
 * Freeze a party onto a document.
 *
 * A COPY, not a lookup, and that is the point: this block is what the invoice
 * says forever. Someone who moves house next year has moved house; the invoice
 * they were sent last year was sent to the old address, and reprinting it with
 * the new one would make the copy on screen disagree with the copy in their
 * file. The live link is kept separately as `billToId`.
 */
export function billToFromMember(m: MemberRecord): BillTo {
  /* No address: MemberRecord does not carry one. Blank rather than a
     placeholder — an invoice that says nothing about the address is honest,
     and one that says "N/A" reads as though somebody checked. */
  return { name: m.name, phone: m.phone, email: m.email, address: "" };
}

/** The same snapshot for a counterparty with no account — most buyers and
    tenants here. Their ID number is the only identifying detail captured
    anywhere, so it travels onto the document. */
export function billToFromExternal(p: ExternalParty): BillTo {
  return { name: p.name, phone: p.phone, email: "", address: "", ...(p.idNumber ? { idNumber: p.idNumber } : {}) };
}

/* ----------------------------------------------------------------------------
   Descriptions — written once, in the language of the day, then frozen
   ------------------------------------------------------------------------- */

/**
 * The period one rent demand covers, as a person reads it: "Jun 2026", or
 * "Jun – Aug 2026" on a quarterly cycle.
 *
 * Built through the catalog so a Kurdish office issues Kurdish invoices, and
 * then FROZEN onto the line. Re-rendering it later through the catalog would
 * change what a document from last year says the moment somebody switched the
 * interface language — a document has to keep saying what it said.
 */
export function periodLabel(lang: Lang, t: Translate, dueOn: string, cycleMonths: number): string {
  const start = fromIso(dueOn);
  const from = `${monthName(lang, start.getMonth())} ${start.getFullYear()}`;
  if (cycleMonths <= 1) return from;
  const last = fromIso(addMonths(dueOn, cycleMonths - 1));
  const to = `${monthName(lang, last.getMonth())} ${last.getFullYear()}`;
  return t("admin.fin.periodRange", { from, to });
}

/* ----------------------------------------------------------------------------
   The plan
   ------------------------------------------------------------------------- */

/**
 * One invoice a contract WILL produce. Not yet a record: no id, no number, no
 * issue date, because none of those exist until somebody signs.
 */
export interface PlannedInvoice {
  category: InvoiceCategory;
  payee: InvoicePayee;
  dueOn: string;
  amount: Money;
  description: string;
  billToId?: string;
  billTo: BillTo;
}

/** Everything the plan needs that is not on the contract itself. */
export interface PlanContext {
  lang: Lang;
  t: Translate;
  propertyTitle: string;
  /** Frozen snapshot of the owner — the seller or the landlord. */
  owner: BillTo;
  ownerId: string;
  /** Frozen snapshot of the buyer or tenant. Rent and instalments bill here. */
  counterparty?: BillTo;
  counterpartyId?: string;
}

/** The contract fields the plan actually reads. Narrow on purpose: it makes the
    preview callable with a hypothetical record rather than a stored one. */
export type PlannableContract = Pick<
  ContractRecord,
  | "kind"
  | "template"
  | "price"
  | "commission"
  | "commissionRate"
  | "ownerCommission"
  | "tenantCommission"
  | "signedOn"
  | "cycle"
  | "termMonths"
  | "startsOn"
  | "rentPaidTo"
  | "downPayment"
  | "installmentCount"
  | "installmentFrequency"
  | "firstInstallmentOn"
  | "installmentsPaidTo"
>;

/**
 * THE GENERATION RULE. Four shapes, and the difference between them is the
 * template plus one field.
 *
 *   sale_full                      1  — the agency's commission
 *   sale_installments, 24 monthly  25 — 24 instalments + 1 commission
 *   lease, landlord collects       2  — landlord's commission + tenant's
 *   lease, agency collects, 12mo   6  — 4 quarterly rent + 2 commission
 *                     quarterly
 *
 * A QUARTERLY TWELVE-MONTH TERM PRODUCES FOUR RENT INVOICES, NOT TWELVE. The
 * cycle is how often rent falls due, the term is how long the tenancy runs, and
 * the count is the division — done once, in `cycleCount`, and never inline.
 *
 * BOTH PARTIES PAY COMMISSION ON A TENANCY, so a lease raises two commission
 * invoices rather than one — to two different people, for two different
 * reasons. A commission whose basis is `none` raises nothing at all, which is
 * how a sale (where the buyer pays no fee) comes out at one.
 */
export function plannedInvoices(contract: PlannableContract, ctx: PlanContext): PlannedInvoice[] {
  /* Nothing is dated off the clock: an unsigned draft being previewed has no
     signing date yet, so the preview dates the commission from the term start,
     which is the date the agent is actually looking at. */
  const anchor = contract.signedOn || contract.startsOn || contract.firstInstallmentOn || "";
  if (!anchor) return [];

  const template = templateOf(contract);
  const lease = template === "lease";
  const plan: PlannedInvoice[] = [];

  /* ---- commission: once, at signing, to whoever agreed to pay it ---- */
  const commissionDue = addDays(anchor, COMMISSION_DUE_DAYS);
  const owner = ownerCommissionOf(contract as ContractRecord);
  const tenant = tenantCommissionOf(contract as ContractRecord);

  if (owner.basis !== "none" && !isZero(owner.amount)) {
    plan.push({
      category: "commission",
      /* Commission is what the agency earned. Always ours, on every contract. */
      payee: "agency",
      dueOn: commissionDue,
      amount: owner.amount,
      description: lease
        ? ctx.t("admin.fin.desc.commissionLandlord", { months: contract.termMonths ?? 0, property: ctx.propertyTitle })
        : ctx.t("admin.fin.desc.commissionSale", { property: ctx.propertyTitle }),
      billToId: ctx.ownerId,
      billTo: ctx.owner,
    });
  }

  /* The tenant's side. Billed to the tenant, not the landlord — it is a
     different party paying for a different thing, and one invoice covering both
     would be addressed to somebody who only owes half of it. */
  if (lease && tenant.basis !== "none" && !isZero(tenant.amount)) {
    plan.push({
      category: "commission",
      payee: "agency",
      dueOn: commissionDue,
      amount: tenant.amount,
      description: ctx.t("admin.fin.desc.commissionTenant", { property: ctx.propertyTitle }),
      billToId: ctx.counterpartyId,
      billTo: ctx.counterparty ?? ctx.owner,
    });
  }

  /* ---- a sale paid in instalments ---- */
  if (hasInstallments(contract)) {
    const schedule = installmentSchedule(contract);
    const billTo = ctx.counterparty ?? ctx.owner;
    const billToId = ctx.counterparty ? ctx.counterpartyId : ctx.ownerId;
    for (const line of schedule) {
      plan.push({
        category: "fee",
        /**
         * ⚠ THE SELLER'S MONEY, however it reaches them.
         *
         * `installmentsPaidTo` decides who physically collects; it does NOT
         * decide whose money it is. A buyer paying the agency in instalments is
         * handing over the seller's proceeds for us to pass on, exactly as an
         * agency-collected tenant hands over the landlord's rent. Marking these
         * "agency" would put the entire sale price into revenue — on the seed
         * alone that is $98,000 across twenty-four invoices, each one of them
         * individually unremarkable. See InvoicePayee and `isAgencyMoney`.
         */
        payee: "owner",
        dueOn: line.dueOn,
        amount: line.amount,
        description: ctx.t("admin.fin.desc.installment", {
          index: line.index,
          count: schedule.length,
          property: ctx.propertyTitle,
        }),
        billToId,
        billTo,
      });
    }
    return plan;
  }

  /* ---- rent, when the agency collects it ---- */
  if (!lease || contract.rentPaidTo !== "agency") return plan;
  if (!contract.cycle || !contract.termMonths || !contract.startsOn) return plan;

  const step = CYCLE_MONTHS[contract.cycle];
  const count = cycleCount(contract);
  const billTo = ctx.counterparty ?? ctx.owner;
  const billToId = ctx.counterparty ? ctx.counterpartyId : ctx.ownerId;

  for (const dueOn of cycleDueDates(contract.startsOn, step, count)) {
    plan.push({
      category: "rent",
      /* THE LANDLORD'S MONEY. We collect it; we never earn it. Marking these
         "agency" would put the whole rent roll into revenue — see InvoicePayee. */
      payee: "owner",
      dueOn,
      /* One cycle's rent — `price` already IS the per-cycle figure, derived from
         the monthly rate at `draftPrice`. Multiplying again here would bill a
         quarterly tenant nine months at a time. */
      amount: contract.price,
      description: ctx.t("admin.fin.desc.rentPeriod", {
        property: ctx.propertyTitle,
        period: periodLabel(ctx.lang, ctx.t, dueOn, step),
      }),
      billToId,
      billTo,
    });
  }
  return plan;
}

/**
 * The plan as storable drafts, ready for the store's `issueInvoice`.
 *
 * They go out UNNUMBERED. Numbering happens at issue and nowhere else, because
 * a number handed to something that is later discarded leaves a hole in the
 * sequence — see `nextInvoiceNumber`.
 */
export function toInvoiceDrafts(plan: PlannedInvoice[], opts: { contractId: string; ids: string[] }): InvoiceRecord[] {
  return plan.map((p, i) => ({
    id: opts.ids[i],
    number: "",
    contractId: opts.contractId,
    category: p.category,
    payee: p.payee,
    status: "draft" as const,
    dueOn: p.dueOn,
    ...(p.billToId ? { billToId: p.billToId } : {}),
    billTo: p.billTo,
    /* One line, no tax. Tax on a generated invoice would be a rate nobody was
       asked for; the seed's taxed invoice was hand-written, and AddInvoiceModal
       is where a person states one deliberately. */
    lines: [{ id: "L1", description: p.description, quantity: 1, unitPrice: p.amount, taxRate: 0 }],
  }));
}

/* Re-exported so the form does not need a second import path just to name the
   clause keys it renders. */
export type { ClauseKey };
export { clauseKeysFor, percentOf };
