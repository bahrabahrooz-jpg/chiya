"use client";

import { useCallback, useMemo } from "react";
import { ANCHOR_ISO, daysBetween } from "@/lib/dates";
import { useLang } from "@/lib/i18n";
import { convert, formatMoney, isZero, subtract, sumMoney, type CurrencyCode, type Money } from "@/lib/money";
import { rateFor, usePlatformSettings } from "@/lib/platform-settings";
import { ADMIN } from "@/components/admin/admin-data";
import {
  PLATFORM_CURRENCY,
  daysOverdue,
  invoiceCurrency,
  invoicesByContract,
  latePenaltyFor,
  managementFeeAmount,
  outstanding,
  paidTotal,
  templateKind,
  type BillTo,
  type ContractRecord,
  type InvoiceCategory,
  type InvoicePayee,
  type InvoiceRecord,
  type DepositStatus,
  type PaymentMethod,
  type PaymentRecord,
} from "../../_data/contracts";
import { collectionEntries, depositClaimEntry, expenseEntry, payoutEntry, refundEntry, splitCollection, type OwnerLedgerEntry } from "../../_data/owner-ledger";
import { nextContractId, nextRecordId, useContracts } from "../contracts-store";
import { logAudit } from "../audit-log";
import { useProperties } from "../properties-store";
import { useContractTransitions } from "../contract-transitions";
import {
  billToFromExternal,
  billToFromMember,
  draftPrice,
  plannedInvoices,
  toContractRecord,
  toInvoiceDrafts,
  type ContractDraft,
  type PlanContext,
  type PlannedInvoice,
} from "./invoice-generation";

/* =============================================================================
   Chiya admin — the finance write layer.

   Every modal in this folder collects a form and hands it here. Nothing in a
   modal writes to a store, decides whether an invoice is due, or works out what
   a property should read afterwards: those are rules, and a rule enforced in a
   click handler is a rule that will be enforced in three of the five places it
   is needed.

   The four things this file is responsible for keeping together:

     1. A contract and its property move as one. (Delegated to
        ../contract-transitions, which is the seam that already owns it.)
     2. Signing generates invoices; drafting generates none.
     3. Money received against somebody else's invoice writes the owner ledger
        in the same breath.
     4. Every one of those events leaves its own audit entry, with its own verb.

   WHAT "TODAY" MEANS HERE. It is ANCHOR_ISO, not the wall clock — the same day
   `invoiceStatus`, `isOverdue` and every seeded record measure from. Reading the
   real clock would date a new contract months away from the data it sits beside,
   so a screen would show a freshly signed tenancy whose entire schedule was
   already overdue. See the header of lib/dates.
   ========================================================================== */

/** The demo's "today". One constant, so every default date on every modal and
    every due-date comparison below agrees with what the screens render. */
export const TODAY = ANCHOR_ISO;

/* Amounts in the audit log are formatted with "en" on purpose — the same rule,
   and the same helper, as the contracts store. The log stores i18n KEYS so the
   sentence follows the reader's language, but a money value is data: freezing it
   in Western digits keeps a stored event stable and means the amount reads the
   same to everyone reviewing the trail. */
const auditAmount = (m: Money) => formatMoney("en", m, { useCode: true });

/* ----------------------------------------------------------------------------
   Inputs
   ------------------------------------------------------------------------- */

export interface PaymentInput {
  invoice: InvoiceRecord;
  /** What actually arrived, in the currency it arrived in. */
  receivedAmount: Money;
  /** Only when that currency differs from the invoice's. */
  rateApplied?: number;
  receivedOn: string;
  method: PaymentMethod;
  reference: string;
}

export interface ExtraInvoiceLine {
  description: string;
  amount: Money;
}

export interface ExtraInvoiceInput {
  contract: ContractRecord;
  /** Which party is being charged. Either can be. */
  billTo: "counterparty" | "owner";
  lines: ExtraInvoiceLine[];
  dueOn: string;
}

export interface CancelResult {
  /** Invoices withdrawn because nothing was owed on them yet. */
  voided: number;
  /** Invoices left standing because the money is genuinely owed. */
  leftOwed: number;
  /** A holding deposit handed back to the buyer, when that is what was chosen. */
  refunded?: Money;
}

/**
 * WHO KEEPS THE HOLDING DEPOSIT WHEN A SALE FALLS THROUGH.
 *
 * The deposit is the *arboun*: money down to take the property off the market,
 * and the answer turns on who walked away. A buyer who pulls out forfeits it to
 * the seller; a seller who pulls out gives it back. It is a decision somebody
 * makes, never a default, which is why cancelling a sale asks — exactly as
 * closing a tenancy asks what became of the insurance deposit.
 *
 * The three answers reduce to two money outcomes, and the third one is still
 * worth recording separately: "nobody's fault" and "the seller pulled out" both
 * return the money, but only one of them is an accusation. A statement a year
 * later has to be able to say which.
 *
 * ⚠ NOTHING HERE DOUBLES ANYTHING. Iraqi practice has a seller who withdraws
 * repay twice what he took, but that is a term the parties agree in the
 * contract, not a rule this system can assume. If it belongs here it belongs as
 * a clause with a figure, like every other penalty on the document.
 */
export type SaleDepositOutcome = "buyer_withdrew" | "seller_withdrew" | "no_fault";

/**
 * WHAT HAPPENED TO THE INSURANCE DEPOSIT at the end of a tenancy.
 *
 * Three outcomes, and the third is not a payment at all — carrying a deposit
 * into a renewal moves no money, which is precisely why it has to be recorded:
 * nothing in the bank statements would ever show it.
 */
export type DepositOutcome =
  | { kind: "returned" }
  | { kind: "partly_returned"; deduction: Money; reason: string }
  | { kind: "carried_forward"; toContractId: string };

/**
 * One hand-off of an owner's money, across however many months it settles.
 *
 * `lines` is PER CREDIT, not per contract — one month's rent that came in from a
 * tenant, or one damages deduction off a deposit. That is the unit an agency
 * works in and the unit the payouts list shows a row for. A landlord taking June
 * and July on two flats is one visit, one receipt and four lines. See
 * `payoutEntry` for why the link matters.
 */
export interface OwnerPayoutInput {
  ownerId: string;
  /** ISO — the day the money actually changed hands, not the day it was typed. */
  on: string;
  method: PaymentMethod;
  /** Bank reference, cheque number, receipt number. Optional, like a payment's. */
  reference: string;
  /** `settles` is the ledger id of the credit being handed over. */
  lines: { contractId: string; settles: string; invoiceId?: string; amount: Money }[];
}

/**
 * One thing the agency paid for on an owner's behalf.
 *
 * ⚠ NOT AN INVOICE TO HIM. This is a cost taken off money already held, which
 * is what full management means: the agency spends the owner's money within an
 * agreed limit and accounts for it. Billing an owner who is holding nothing
 * with us is a different act — see `issueExtraInvoice`.
 */
export interface OwnerExpenseInput {
  contractId: string;
  /** ISO — the day the contractor was paid, not the day it was typed. */
  on: string;
  amount: Money;
  /** "Plumber — leaking tap, kitchen". Frozen onto the statement. */
  what: string;
}

export interface EarlySettlementInput {
  contract: ContractRecord;
  receivedOn: string;
  method: PaymentMethod;
  reference: string;
}

export interface EarlySettlementResult {
  /** What the buyer handed over to clear the balance. */
  paid: Money;
  /** Future instalments withdrawn. Voided, never deleted. */
  voided: number;
}

/** One line of an amendment, before it is formatted for the record. */
export interface AmendmentChange {
  /** An i18n KEY, not a label — the field name follows the reader's language,
      the way every stored audit event does. The VALUES are frozen text. */
  field: string;
  from: string;
  to: string;
}

export interface FinanceActions {
  /** Write a contract — as a draft, or signed and invoiced, in one act. */
  saveContract: (draft: ContractDraft) => { contract: ContractRecord; invoiceCount: number };
  /** Sign a contract that was saved as a draft. Generates its invoices. */
  signContract: (contractId: string, signedOn: string) => number;
  /** Replace a draft contract's terms. Refuses anything that is not a draft. */
  updateDraft: (contractId: string, draft: ContractDraft) => void;
  recordPayment: (input: PaymentInput) => void;
  issueExtraInvoice: (input: ExtraInvoiceInput) => InvoiceRecord | undefined;
  voidInvoice: (invoiceId: string, reason: string) => void;
  /**
   * Give a live demand more time: moves its due date and appends to its trail,
   * and can touch nothing else. Any penalty already raised stands — see the
   * note on the action.
   */
  postponeInvoice: (invoiceId: string, to: string, reason: string) => InvoiceRecord | undefined;
  cancelContract: (contractId: string, reason: string, deposit?: SaleDepositOutcome) => CancelResult;
  /**
   * The invoices a draft WOULD raise if it were signed.
   *
   * The schedule preview renders this and the consequence bar counts it — the
   * same list `generateOnSigning` issues, so what the agent checks before
   * signing is what signing produces.
   */
  previewPlan: (draft: ContractDraft) => PlannedInvoice[];

  /**
   * MAY THIS CONTRACT'S MONEY STILL BE AMENDED?
   *
   * False once anything has been paid against it. Amending a price that has
   * already been part-collected would leave invoices demanding one figure,
   * receipts proving another, and no record of which was agreed — the exact
   * mess the cancel-and-replace route exists to avoid. See `amendContract`.
   */
  moneyAmendable: (contractId: string) => boolean;
  /**
   * Change a signed contract's terms, keeping its number. Returns false when
   * the change touches money that has already been paid against.
   */
  amendContract: (contractId: string, draft: ContractDraft, reason: string) => boolean;
  /** Close out a tenancy's insurance deposit. See DepositOutcome. */
  closeLease: (contractId: string, outcome: DepositOutcome) => void;
  /**
   * Hand an owner the money we have been holding for him. Writes one ledger
   * line per tenancy settled and returns how many — see OwnerPayoutInput.
   */
  payOwner: (input: OwnerPayoutInput) => number;
  /**
   * Record money the agency spent for an owner — a repair, a clean. Comes
   * straight off what we owe him. See OwnerExpenseInput.
   */
  spendForOwner: (input: OwnerExpenseInput) => boolean;
  /**
   * Add a late-rent charge to an overdue invoice, AS A DELIBERATE ACT.
   * Returns the invoice raised, or undefined when the contract states no
   * penalty or nothing is actually late. Nothing calls this on a timer.
   */
  addLatePenalty: (invoiceId: string) => InvoiceRecord | undefined;
  /** Clear an instalment sale's whole remaining balance in one payment. */
  settleEarly: (input: EarlySettlementInput) => EarlySettlementResult | undefined;
}

/* ----------------------------------------------------------------------------
   The hook
   ------------------------------------------------------------------------- */

export function useFinanceActions(): FinanceActions {
  const { t, lang } = useLang();
  const { settings } = usePlatformSettings();
  const { properties, members } = useProperties();
  const {
    contracts,
    invoices,
    payments,
    issueInvoice,
    voidInvoice: storeVoid,
    postponeInvoice: storePostpone,
    recordPayment: storeRecordPayment,
    recordPayout,
    recordExpense,
    recordDepositClaim,
    recordRefund,
    updateContract,
    amendContract: storeAmend,
  } = useContracts();
  const transitions = useContractTransitions();

  /* Whoever is at the keyboard. There is one admin login in the demo, so this
     resolves to the same staff row every time; it is looked up rather than
     hardcoded so a real session drops in without touching every payment. */
  const recordedBy = useMemo(() => {
    const match = settings.team.staff.find((s) => s.email === ADMIN.email || s.name === ADMIN.name);
    return match?.id ?? settings.team.staff[0]?.id ?? "u-rebin";
  }, [settings.team.staff]);

  const memberById = useCallback((id?: string) => (id ? members.find((m) => m.id === id) : undefined), [members]);
  const propertyById = useCallback((id: string) => properties.find((p) => p.id === id), [properties]);

  /**
   * The frozen snapshots and the property title an invoice needs.
   *
   * Resolved ONCE per generation and passed down, rather than looked up inside
   * the loop that builds twelve rent invoices: a snapshot taken thirteen times
   * is thirteen chances for one of them to differ.
   */
  const planContextFor = useCallback(
    (c: Pick<ContractRecord, "propertyId" | "ownerId" | "buyerId" | "buyerExternal">): PlanContext => {
      const owner = memberById(c.ownerId);
      const buyer = memberById(c.buyerId);
      const counterparty: BillTo | undefined = buyer
        ? billToFromMember(buyer)
        : c.buyerExternal
          ? billToFromExternal(c.buyerExternal)
          : undefined;
      return {
        lang,
        t,
        propertyTitle: propertyById(c.propertyId)?.title ?? c.propertyId,
        owner: owner ? billToFromMember(owner) : { name: c.ownerId, phone: "", email: "", address: "" },
        ownerId: c.ownerId,
        counterparty,
        counterpartyId: buyer ? c.buyerId : undefined,
      };
    },
    [lang, t, memberById, propertyById],
  );

  /**
   * THE GENERATION STEP, and the only caller of it in the app.
   *
   * Fires on the transition INTO signed and nowhere else. A draft that generated
   * invoices would leave a dozen phantom demands behind the moment a deal fell
   * through — and unlike a draft contract, an issued invoice cannot simply be
   * deleted, so cleaning them up would mean voiding thirteen records one at a
   * time and explaining each one.
   */
  const generateOnSigning = useCallback(
    (contract: ContractRecord): number => {
      if (contract.status !== "signed") return 0;
      const plan = plannedInvoices(contract, planContextFor(contract));
      if (!plan.length) return 0;
      const drafts = toInvoiceDrafts(plan, {
        contractId: contract.id,
        ids: plan.map(() => nextRecordId("INV")),
      });
      /* Issued one at a time through the store, which is the single caller of
         nextInvoiceNumber() — numbering stays in one place even when thirteen
         documents are raised in one click. */
      for (const draft of drafts) issueInvoice(draft, contract.signedOn);
      return drafts.length;
    },
    [planContextFor, issueInvoice],
  );

  /**
   * The exchange rate frozen onto a new contract.
   *
   * Required when the contract is not in the platform currency, so its value can
   * be reported alongside everything else. Read from settings ONCE, here, at the
   * moment the contract is written — and never again. `agreedRate` reads as
   * units of the other currency per 1 unit of the contract's own, so a dinar
   * contract carries the reciprocal of the familiar 1,310.
   */
  const agreedRateFor = useCallback(
    (currency: CurrencyCode): number | undefined => {
      if (currency === PLATFORM_CURRENCY) return undefined;
      const perDefault = rateFor(settings, currency);
      return perDefault > 0 ? 1 / perDefault : undefined;
    },
    [settings],
  );

  const previewPlan = useCallback(
    (draft: ContractDraft): PlannedInvoice[] => {
      /* Built off a hypothetical SIGNED record so the preview says what signing
         would do, whichever button the person is about to press. A draft raises
         nothing; the question the preview answers is what happens if it does not
         stay one. */
      const record = toContractRecord({ ...draft, signingDate: draft.signingDate || TODAY }, { id: "preview", createdOn: TODAY });
      return plannedInvoices(record as ContractRecord, planContextFor(record));
    },
    [planContextFor],
  );

  const saveContract = useCallback(
    (draft: ContractDraft) => {
      const price = draftPrice(draft);
      const record = toContractRecord(draft, {
        /* The number is allocated from the LIVE records, not the seed, so a
           contract written today cannot be handed a number one written an hour
           ago already carries. Year comes from TODAY for the same reason every
           other date here does — see the header note on the anchor. */
        id: nextContractId(templateKind(draft.template), contracts, Number(TODAY.slice(0, 4))),
        createdOn: TODAY,
        agreedRate: price ? agreedRateFor(price.currency) : undefined,
      }) as ContractRecord;
      /* One call: the transition writes the contract, moves the property and
         records where the listing was before it did. Both audit lines — the
         contract and the visibility change — come from there. */
      transitions.createContract(record);
      /* A contract written and signed in one action is still two things that
         happened, and §8 wants them distinguishable: "Wrote contract" comes
         from the transition above, and the signature gets its own line here.
         Collapsing them would leave a signed contract with no signing event in
         the trail, which is the one event a financial audit looks for. */
      if (record.status === "signed") {
        logAudit({
          category: "property",
          actionKey: "audit.action.signedContract",
          target: record.id,
          targetId: record.id,
        });
      }
      /* A RENEWAL RETIRES THE TENANCY IT FOLLOWS, and only once it is actually
         signed. Saving a renewal as a draft must leave the old one running —
         the tenant is still living there and the rent is still falling due
         until the new paper is signed. The old contract goes to `completed`
         rather than `cancelled`: it ran its full term and was honoured, which
         is a different thing from being broken off, and the two read
         differently on every list. The property is left alone; the new contract
         holds it, and freeing it here would put the flat back on the market
         between two tenancies that never had a gap. */
      if (record.replacesContractId && record.status === "signed") {
        updateContract(record.replacesContractId, { status: "completed" });
      }
      const invoiceCount = generateOnSigning(record);
      return { contract: record, invoiceCount };
    },
    [agreedRateFor, transitions, generateOnSigning, contracts, updateContract],
  );

  const signContract = useCallback(
    (contractId: string, signedOn: string): number => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract || contract.status !== "draft") return 0;
      transitions.signContract(contractId, signedOn);
      /* Generated from the contract as it WILL be, not as the store currently
         holds it: the state update above lands on the next render, and the
         invoices have to carry the signing date the person just confirmed. */
      return generateOnSigning({ ...contract, status: "signed", signedOn });
    },
    [contracts, transitions, generateOnSigning],
  );

  const updateDraft = useCallback(
    (contractId: string, draft: ContractDraft) => {
      const existing = contracts.find((c) => c.id === contractId);
      if (!existing) return;
      const price = draftPrice(draft);
      const next = toContractRecord(draft, {
        id: contractId,
        createdOn: existing.createdOn,
        agreedRate: price ? agreedRateFor(price.currency) : undefined,
      });
      /* Terms first, and WITHOUT the status: editing a draft and signing it are
         two separate events, and writing status here as well would log the
         signature twice — once as an "updated" and once as a "signed". The
         store refuses the whole thing outright unless this is still a draft,
         which is where that rule belongs. */
      const { id: _id, status: _status, signedOn, ...terms } = next;
      void _id;
      void _status;
      updateContract(contractId, terms);
      /* Gaining a signing date is the transition into signed — the property
         moves and the invoices are raised, exactly as they would be from the
         contract detail screen. */
      if (signedOn) {
        transitions.signContract(contractId, signedOn);
        generateOnSigning({ ...(next as ContractRecord), status: "signed", signedOn });
      }
    },
    [contracts, agreedRateFor, updateContract, transitions, generateOnSigning],
  );

  /**
   * The ledger lines one collection produces — or none, when the money was ours
   * to begin with, or when it never came through us at all.
   *
   * ⚠ THESE CANNOT BE RECONSTRUCTED. Not written here means never written: the
   * fee rate can change mid-term, the exchange rate belongs to the day the cash
   * was taken, and a part payment splits differently from a full one. See the
   * header of ../../_data/owner-ledger.
   *
   * TWO TESTS, NOT ONE, AND THEY ASK DIFFERENT THINGS.
   *
   *   payee      whose money is it? Owner money is the landlord's or the
   *              seller's; ours produces no ledger line because there is
   *              nobody to owe it to.
   *   who collected it? A tenancy where the landlord takes his own rent — or an
   *              instalment sale where the buyer pays the seller direct — is
   *              still invoiced and still marked paid, which is the whole point
   *              of invoicing every one of them. But the cash went straight to
   *              the owner. Writing "collected" for money that never entered the
   *              agency's account would invent a debt to somebody who has
   *              already been paid, and the payouts screen would then ask for it
   *              to be handed over a second time.
   *
   * THE MANAGEMENT FEE COMES OUT OF RENT AND NOTHING ELSE. It is what the
   * agency charges for collecting the rent, so a late-rent charge or an
   * instalment of a sale price passes to the owner whole. Taking a slice of a
   * penalty would be charging for work the fee does not describe.
   */
  const ownerLedgerFor = useCallback(
    (invoice: InvoiceRecord, payment: PaymentRecord, credited: Money): OwnerLedgerEntry[] | undefined => {
      if (invoice.payee !== "owner") return undefined;
      const contract = contracts.find((c) => c.id === invoice.contractId);
      if (!contract) return undefined;
      /* A SALE'S HOLDING DEPOSIT IS ALWAYS OURS TO HOLD. `installmentsPaidTo`
         says who takes the INSTALMENTS; no field says who takes the deposit,
         and in practice it is the agency — the deposit is what the office
         collects to take the property off the market, before any schedule
         exists. If that ever stops being true it needs its own term on the
         contract rather than an assumption here. */
      const collectedByUs =
        contract.kind === "rent"
          ? contract.rentPaidTo === "agency"
          : invoice.category === "deposit" || contract.installmentsPaidTo === "agency";
      if (!collectedByUs) return undefined;
      const feeBasis = invoice.category === "rent" ? managementFeeAmount(contract) : undefined;
      const split = splitCollection(credited, contract.price, feeBasis);
      return collectionEntries({
        ownerId: contract.ownerId,
        contractId: contract.id,
        invoiceId: invoice.id,
        paymentId: payment.id,
        on: payment.receivedOn,
        received: credited,
        split,
        /* The invoice's own line, so the statement and the invoice describe the
           same event in the same words. */
        description: invoice.lines[0]?.description ?? "",
        feeDescription: t("admin.fin.ledger.fee", { invoice: invoice.number }),
        ids: { collected: nextRecordId("LED"), fee: nextRecordId("LED") },
      });
    },
    [contracts, t],
  );

  /**
   * Record money received — and, when it was the landlord's money, the ledger
   * lines that say we are holding it.
   *
   * A payment in a different currency from the invoice is ordinary here: a
   * tenant settling a dollar invoice with cash dinars is how most tenancies get
   * paid. What arrived is stored as it arrived, the rate used on the day is
   * stored beside it, and the credit against the invoice is derived from the
   * two — so "why was 3,406,000 IQD only worth $2,600?" always has an answer.
   */
  const recordPayment = useCallback(
    (input: PaymentInput) => {
      const { invoice } = input;
      const cur = invoiceCurrency(invoice);
      const converted = input.receivedAmount.currency !== cur;
      const amount = converted && input.rateApplied ? convert(input.receivedAmount, cur, input.rateApplied) : input.receivedAmount;

      const payment: PaymentRecord = {
        id: nextRecordId("PAY"),
        invoiceId: invoice.id,
        receivedAmount: input.receivedAmount,
        receivedCurrency: input.receivedAmount.currency,
        ...(converted && input.rateApplied ? { rateApplied: input.rateApplied } : {}),
        amount,
        receivedOn: input.receivedOn,
        method: input.method,
        reference: input.reference,
        recordedBy,
      };

      storeRecordPayment(payment, ownerLedgerFor(invoice, payment, amount));
    },
    [recordedBy, storeRecordPayment, ownerLedgerFor],
  );


  /**
   * An unpredicted charge — a repair, a late fee, a cleaning bill.
   *
   * Always the agency's own money. These are raised by the agency for something
   * the agency did or arranged, so they are revenue, unlike the rent passing
   * through beside them. Rent is the only pass-through this system has.
   */
  const issueExtraInvoice = useCallback(
    (input: ExtraInvoiceInput): InvoiceRecord | undefined => {
      const { contract } = input;
      if (!input.lines.length) return undefined;
      const ctx = planContextFor(contract);
      const toOwner = input.billTo === "owner";
      const billTo = toOwner ? ctx.owner : (ctx.counterparty ?? ctx.owner);
      const billToId = toOwner ? ctx.ownerId : ctx.counterpartyId;
      const category: InvoiceCategory = "fee";
      const payee: InvoicePayee = "agency";
      return issueInvoice(
        {
          id: nextRecordId("INV"),
          number: "",
          contractId: contract.id,
          category,
          payee,
          status: "draft",
          dueOn: input.dueOn,
          ...(billToId ? { billToId } : {}),
          billTo,
          lines: input.lines.map((l, i) => ({
            id: `L${i + 1}`,
            description: l.description,
            quantity: 1,
            unitPrice: l.amount,
            taxRate: 0,
          })),
        },
        TODAY,
      );
    },
    [planContextFor, issueInvoice],
  );

  const voidInvoice = useCallback(
    (invoiceId: string, reason: string) => {
      storeVoid(invoiceId, reason, TODAY);
    },
    [storeVoid],
  );

  /**
   * "He asked for a week."
   *
   * The commonest sentence in a letting office, and until now the screen had no
   * answer to it: an agent could leave the demand sitting there red, which says
   * the tenant is in default when he is not, or void it, which says the rent was
   * never owed. Both are lies about the same week.
   *
   * WHAT MOVES IS THE DATE AND NOTHING ELSE — see the guards in the store's
   * postponeInvoice. Any penalty already raised STAYS raised: the invoice was
   * genuinely late before the extension was agreed, and quietly withdrawing a
   * charge because the date later changed would rewrite what happened. Waiving
   * it is its own decision, taken by voiding that fee.
   */
  const postponeInvoice = useCallback(
    (invoiceId: string, to: string, reason: string) => storePostpone(invoiceId, to, reason, TODAY),
    [storePostpone],
  );

  /**
   * THE OTHER HALF OF THE RENT ROLL — the landlord comes in and takes his money.
   *
   * Until this existed the ledger only ever grew: every tenant payment added to
   * what we owe an owner and nothing ever took it away, so the balance on the
   * statement was the total ever collected rather than what is actually still
   * in the drawer.
   *
   * ⚠ NO INVOICE IS RAISED, and that is not an omission. An invoice is a demand,
   * and nobody is demanding anything of the landlord — this is his own money
   * going back to him. The paper he signs for it is a RECEIPT, which is a
   * separate task; what this writes is the record that the hand-off happened.
   *
   * Zero and negative lines are dropped rather than rejected: the screen
   * pre-fills every tenancy the owner is owed on, and leaving one at zero is how
   * somebody says "not that one today".
   */
  const payOwner = useCallback(
    (input: OwnerPayoutInput): number => {
      const entries = input.lines
        .filter((l) => l.amount.amount > 0)
        .map((l) =>
          payoutEntry({
            id: nextRecordId("LED"),
            ownerId: input.ownerId,
            contractId: l.contractId,
            settles: l.settles,
            ...(l.invoiceId ? { invoiceId: l.invoiceId } : {}),
            on: input.on,
            amount: l.amount,
            /* Frozen at the moment of writing, like the fee line above: it
               describes one event that happened once. */
            description: input.reference.trim()
              ? t("admin.fin.ledger.payoutRef", { method: t(`admin.fin.method.${input.method}`), reference: input.reference.trim() })
              : t("admin.fin.ledger.payout", { method: t(`admin.fin.method.${input.method}`) }),
          }),
        );
      if (!entries.length) return 0;
      recordPayout(entries);
      return entries.length;
    },
    [recordPayout, t],
  );

  /**
   * THE AGENCY PAID SOMEBODY FOR THE LANDLORD — a plumber, a locksmith, a clean.
   *
   * Only where the agency is actually holding his money, which is the same test
   * everything else on that ledger uses. On a tenancy the landlord collects
   * himself there is nothing of his here to spend, so the cost has to be
   * invoiced to him instead — a different act, and `issueExtraInvoice` is it.
   *
   * ⚠ NO INVOICE, NO PAYMENT RECORD. Nothing was demanded of anybody and no
   * money arrived; money LEFT, against a balance we hold. The contractor is not
   * a party to any contract here, which is why the supplier lives in the
   * description rather than becoming a record of its own.
   */
  const spendForOwner = useCallback(
    (input: OwnerExpenseInput): boolean => {
      if (input.amount.amount <= 0 || !input.what.trim()) return false;
      const contract = contracts.find((c) => c.id === input.contractId);
      if (!contract) return false;
      const collectedByUs = contract.kind === "rent" ? contract.rentPaidTo === "agency" : contract.installmentsPaidTo === "agency";
      if (!collectedByUs) return false;

      recordExpense(
        expenseEntry({
          id: nextRecordId("LED"),
          ownerId: contract.ownerId,
          contractId: contract.id,
          on: input.on,
          amount: input.amount,
          description: input.what.trim(),
        }),
      );
      return true;
    },
    [contracts, recordExpense],
  );

  /**
   * Cancel a contract — and be careful about what that does to the money.
   *
   * UNPAID IS NOT ONE CATEGORY. A demand that had not fallen due yet was for
   * something that never happened, so it is withdrawn. A demand that WAS due is
   * a debt: the tenant lived in the flat those months, and cancelling the
   * paperwork does not un-live them. Writing that off is a separate, deliberate
   * act with its own reason attached — not a side effect of pressing Cancel.
   *
   * Anything with money already against it is left exactly as it is, paid or
   * part-paid. Voiding writes a credit note for the FULL invoice, which would
   * hand back cash that genuinely arrived.
   */
  const cancelContract = useCallback(
    (contractId: string, reason: string, deposit?: SaleDepositOutcome): CancelResult => {
      const contract = contracts.find((c) => c.id === contractId);
      const live = invoicesByContract(contractId, invoices).filter((i) => i.status === "issued");
      const giveBack = deposit === "seller_withdrew" || deposit === "no_fault";

      let voided = 0;
      let leftOwed = 0;
      let refunded: Money | undefined;

      for (const inv of live) {
        const paid = paidTotal(inv, payments);
        if (!isZero(paid)) {
          /* MONEY THAT ARRIVED IS NORMALLY UNTOUCHED — voiding writes a credit
             note for the whole invoice and would hand back cash that genuinely
             came in. The holding deposit is the one exception, and only when
             somebody has decided it goes back: the buyer paid it to hold a
             property he is not getting, and on a sale the seller walked away
             from he is entitled to it. Recorded as a refund off the seller's
             balance rather than by unpicking the invoice, because the demand
             was real and so was the payment. */
          if (giveBack && inv.category === "deposit" && contract) {
            recordRefund(
              refundEntry({
                id: nextRecordId("LED"),
                ownerId: contract.ownerId,
                contractId,
                on: TODAY,
                amount: paid,
                description: t("admin.fin.ledger.depositRefund", { reason }),
              }),
            );
            refunded = paid;
          }
          continue;
        }
        /* An unpaid deposit on a sale that is going back is withdrawn outright,
           even if it had fallen due: nobody owes a deposit on a deal that is
           over. Every other due demand stays a debt — see the modal. */
        if (daysBetween(inv.dueOn, TODAY) >= 0 && !(giveBack && inv.category === "deposit")) {
          leftOwed += 1; // due or overdue: a real debt, and it stays one
          continue;
        }
        storeVoid(inv.id, t("admin.fin.void.contractCancelled", { reason }), TODAY);
        voided += 1;
      }
      transitions.cancelContract(contractId, reason, TODAY);
      return { voided, leftOwed, ...(refunded ? { refunded } : {}) };
    },
    [contracts, invoices, payments, storeVoid, transitions, recordRefund, t],
  );

  /* ---------------------------------------------------------------------------
     Amendments — §10
     ------------------------------------------------------------------------ */

  /** Has any money actually arrived against this contract? The test behind
      `moneyAmendable`, written once so the guard and the message agree. */
  const hasBeenPaid = useCallback(
    (contractId: string) =>
      invoicesByContract(contractId, invoices).some((inv) => inv.status !== "void" && !isZero(paidTotal(inv, payments))),
    [invoices, payments],
  );

  const moneyAmendable = useCallback((contractId: string) => !hasBeenPaid(contractId), [hasBeenPaid]);

  /**
   * The fields whose values are MONEY, and therefore frozen once paid.
   *
   * Dates, cities and copy counts stay amendable throughout: correcting a
   * misspelled city on a contract nobody disputes is a clerical fix, and
   * forcing a cancel-and-replace for it would leave two documents in the file
   * over a typo. What cannot move is anything an invoice was computed from.
   */
  const MONEY_FIELDS = useMemo(
    () =>
      new Set([
        "price", "monthlyRent", "insuranceDeposit", "downPayment", "commission", "installmentCount", "cycle", "termMonths",
        /* A sale's holding deposit is part of the price. */
        "deposit",
        /* The frozen rate restates every converted figure on the contract, so
           it is as unmovable as the price once a receipt exists quoting it. */
        "agreedRate",
      ]),
    [],
  );

  /**
   * What changed, field by field, as text a person can read.
   *
   * Formatted HERE, at the moment of the amendment, and stored — not
   * re-rendered later. An amendment line is a record of what the terms were and
   * what they became, and re-deriving "from" from a record that no longer holds
   * that value is impossible anyway.
   */
  const describeChanges = useCallback(
    (before: ContractRecord, after: Omit<ContractRecord, "previousPublication">): AmendmentChange[] => {
      const asText = (value: unknown): string => {
        if (value === undefined || value === null || value === "") return "—";
        if (typeof value === "object" && value !== null && "amount" in value && "currency" in value) {
          return formatMoney(lang, value as Money);
        }
        return String(value);
      };
      const fields: Array<keyof ContractRecord> = [
        "price",
        "monthlyRent",
        "insuranceDeposit",
        "downPayment",
        "cycle",
        "termMonths",
        "startsOn",
        "endsOn",
        "rentPaidTo",
        "expectedPaymentMethod",
        "handoverOn",
        "city",
        "copies",
        "installmentCount",
        "installmentFrequency",
        "firstInstallmentOn",
        "installmentsPaidTo",
        /* A sale's holding deposit is consideration, so moving it moves the
           terms — it belongs in the diff exactly as `price` does. */
        "deposit",
        /* The frozen rate is a TERM. Amending it restates every figure the
           contract converts, which is precisely why it has to leave a line. */
        "agreedRate",
        "dualCurrency",
        "externalPaperwork",
      ];
      const changes: AmendmentChange[] = [];
      for (const field of fields) {
        const from = asText(before[field]);
        const to = asText((after as ContractRecord)[field]);
        if (from !== to) changes.push({ field: `admin.ct.f.${String(field)}`, from, to });
      }
      return changes;
    },
    [lang],
  );

  const amendContractAction = useCallback(
    (contractId: string, draft: ContractDraft, reason: string): boolean => {
      const existing = contracts.find((c) => c.id === contractId);
      if (!existing || existing.status === "draft") return false;

      const price = draftPrice(draft);
      const next = toContractRecord(draft, {
        /* THE NUMBER DOES NOT CHANGE. Both parties are holding paper with it
           printed on, and every invoice and receipt names it. */
        id: contractId,
        createdOn: existing.createdOn,
        agreedRate: price ? agreedRateFor(price.currency) : undefined,
      });

      const changes = describeChanges(existing, next);
      if (!changes.length) return true; // nothing moved — no amendment to record
      if (changes.some((c) => MONEY_FIELDS.has(c.field.replace("admin.ct.f.", ""))) && hasBeenPaid(contractId)) {
        return false;
      }

      /* Status and the signing date are not amendable terms — an amendment
         changes what was agreed, not whether it was agreed. */
      const { id: _id, status: _status, signedOn: _signedOn, ...terms } = next;
      void _id;
      void _status;
      void _signedOn;

      storeAmend(contractId, terms, { amendedOn: TODAY, amendedBy: recordedBy, reason, changes });
      return true;
    },
    [contracts, agreedRateFor, describeChanges, MONEY_FIELDS, hasBeenPaid, storeAmend, recordedBy],
  );

  /* ---------------------------------------------------------------------------
     The insurance deposit — §8
     ------------------------------------------------------------------------ */

  /**
   * DECIDE WHAT BECAME OF THE DEPOSIT. The end of the lifecycle that started
   * when the tenancy was signed.
   *
   * NO INVOICE IS RAISED BY ANY OF THE THREE OUTCOMES, and none of them touches
   * a revenue figure. Returning a deposit hands back money that was never ours;
   * a damages deduction goes to the landlord to put the damage right, not to the
   * agency; and carrying one forward moves nothing at all. The record of what
   * happened lives on the contract, which is why these fields are on the
   * store's lifecycle list rather than behind the frozen-terms rule.
   *
   * ⚠ A DEDUCTION NOW LANDS SOMEWHERE. It used to be recorded on the contract as
   * an amount and a reason and go to nobody — the money sat in the agency's
   * account belonging, on paper, to no one. It is the LANDLORD'S: his property
   * was damaged and his cost to repair. So it is written onto his ledger and
   * goes out to him through the payouts screen like any other credit. If the
   * agency did the repair itself, the cost comes back off through
   * `spendForOwner` — two plain movements, not one netted figure.
   */
  const closeLease = useCallback(
    (contractId: string, outcome: DepositOutcome) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract || !contract.insuranceDeposit) return;

      const shared = { depositReturnedOn: TODAY };
      const patch: Partial<ContractRecord> =
        outcome.kind === "returned"
          ? { ...shared, depositStatus: "returned" as DepositStatus }
          : outcome.kind === "partly_returned"
            ? {
                ...shared,
                depositStatus: "partly_returned" as DepositStatus,
                depositDeduction: outcome.deduction,
                depositDeductionReason: outcome.reason,
              }
            : {
                ...shared,
                depositStatus: "carried_forward" as DepositStatus,
                depositCarriedToContractId: outcome.toContractId,
              };

      /* Its own verb. "Updated contract" would bury the one event a tenant
         rings up about a year later. */
      logAudit({
        category: "property",
        actionKey: "audit.action.closedDeposit",
        target: contractId,
        targetId: contractId,
        metaKey: "audit.meta.depositOutcome",
        metaParams: {
          outcome: "@deposit." + outcome.kind,
          amount: auditAmount(
            outcome.kind === "partly_returned" ? subtract(contract.insuranceDeposit, outcome.deduction) : contract.insuranceDeposit,
          ),
        },
      });
      updateContract(contractId, patch);

      /* Only where the agency was holding the money in the first place. On a
         tenancy the landlord collected himself the deposit never came through
         us, so there is nothing here to move onto his ledger. */
      if (outcome.kind === "partly_returned" && !isZero(outcome.deduction) && contract.rentPaidTo === "agency") {
        recordDepositClaim(
          depositClaimEntry({
            id: nextRecordId("LED"),
            ownerId: contract.ownerId,
            contractId: contract.id,
            on: TODAY,
            amount: outcome.deduction,
            /* Frozen with the reason the person typed: an owner querying this
               line a year later is querying those words. */
            description: t("admin.fin.ledger.depositClaim", { reason: outcome.reason }),
          }),
        );
      }
    },
    [contracts, updateContract, recordDepositClaim, t],
  );

  /* ---------------------------------------------------------------------------
     Late rent — §9
     ------------------------------------------------------------------------ */

  /**
   * Raise a late-rent charge on an overdue invoice — BECAUSE SOMEBODY PRESSED
   * A BUTTON.
   *
   * ⚠ THERE IS NO AUTOMATIC PATH TO THIS FUNCTION, and that is the design. The
   * invoice row calculates what the penalty WOULD come to and offers it; a
   * person decides whether a tenant four days late for the first time in two
   * years should be charged. Automating it would make that judgement by default,
   * silently, in the agency's favour, on the one class of record where the
   * agency profits from the answer.
   *
   * ⚠ THE CHARGE IS THE LANDLORD'S MONEY, not the agency's — `payee: "owner"`,
   * the same as the rent invoice it hangs off. It used to be booked as agency
   * income, and that was wrong: the late-rent charge comes from a clause in the
   * TENANCY, which is an agreement between the landlord and the tenant. The
   * agency wrote the paper and does the chasing, but the money compensates the
   * landlord for being paid late, exactly as the rent does. Marking it "agency"
   * put a slice of the rent roll's penalties into revenue and left the landlord
   * short by every charge ever raised.
   */
  const addLatePenalty = useCallback(
    (invoiceId: string): InvoiceRecord | undefined => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice || invoice.status !== "issued") return undefined;
      const contract = contracts.find((c) => c.id === invoice.contractId);
      if (!contract) return undefined;

      const penalty = latePenaltyFor(contract, daysOverdue(invoice, payments, TODAY));
      if (!penalty || isZero(penalty.amount)) return undefined;

      /* ⚠ ONE PENALTY PER LATE DEMAND. Nothing used to stop this being pressed
         twice — the offer was computed from the days late and knew nothing about
         what it had already produced — so a second press charged the tenant
         again for the same lateness, in a second invoice that looked exactly as
         legitimate as the first. The link on the fee is what makes the check
         possible; a withdrawn one does not block a fresh charge, because voiding
         it is how somebody says "not this time". */
      if (invoices.some((i) => i.penaltyForInvoiceId === invoice.id && i.status !== "void")) return undefined;

      logAudit({
        category: "property",
        actionKey: "audit.action.addedLatePenalty",
        target: invoice.number || invoice.id,
        targetId: invoice.id,
        metaKey: "audit.meta.latePenalty",
        metaParams: { days: String(penalty.days), amount: auditAmount(penalty.amount) },
      });

      return issueInvoice(
        {
          id: nextRecordId("INV"),
          number: "",
          contractId: contract.id,
          category: "fee",
          payee: "owner",
          status: "draft",
          dueOn: TODAY,
          penaltyForInvoiceId: invoice.id,
          ...(invoice.billToId ? { billToId: invoice.billToId } : {}),
          billTo: invoice.billTo,
          lines: [
            {
              id: "L1",
              description: t("admin.fin.desc.latePenalty", { days: penalty.days, invoice: invoice.number || invoice.id }),
              quantity: 1,
              unitPrice: penalty.amount,
              taxRate: 0,
            },
          ],
        },
        TODAY,
      );
    },
    [invoices, contracts, payments, issueInvoice, t],
  );

  /* ---------------------------------------------------------------------------
     Early settlement — §11
     ------------------------------------------------------------------------ */

  /**
   * The buyer clears the whole remaining balance in one go.
   *
   * One payment for what is still owed, every future instalment WITHDRAWN — and
   * withdrawn means voided with a credit note, never deleted. An instalment
   * invoice that simply vanished would leave the schedule on the contract
   * disagreeing with the invoices behind it, and nothing to say why.
   *
   * Instalments that are already due or overdue are left standing, for the same
   * reason `cancelContract` leaves them: they were owed, and the settlement
   * payment is what clears them. Only the FUTURE ones are withdrawn.
   */
  const settleEarly = useCallback(
    (input: EarlySettlementInput): EarlySettlementResult | undefined => {
      const { contract } = input;
      const live = invoicesByContract(contract.id, invoices).filter((i) => i.status === "issued");
      const currency = contract.price.currency;

      /* What is genuinely still owed right now — the invoices already demanded.
         Future instalments are not a debt yet; they are withdrawn instead. */
      const dueNow = live.filter((i) => daysBetween(i.dueOn, TODAY) >= 0);
      const owed = sumMoney(
        dueNow.map((inv) => outstanding(inv, payments)).filter((m) => m.currency === currency),
        currency,
      );

      /* One payment per still-open invoice, so each one closes properly. A
         single lump payment against one invoice would leave the others reading
         as unpaid forever. */
      for (const inv of dueNow) {
        const balance = outstanding(inv, payments);
        if (isZero(balance)) continue;
        recordPayment({
          invoice: inv,
          receivedAmount: balance,
          receivedOn: input.receivedOn,
          method: input.method,
          reference: input.reference,
        });
      }

      let voided = 0;
      for (const inv of live) {
        if (daysBetween(inv.dueOn, TODAY) >= 0) continue; // already demanded — settled above
        if (!isZero(paidTotal(inv, payments))) continue; // money against it — leave it alone
        storeVoid(inv.id, t("admin.fin.void.settledEarly"), TODAY);
        voided += 1;
      }

      logAudit({
        category: "property",
        actionKey: "audit.action.settledEarly",
        target: contract.id,
        targetId: contract.id,
        metaKey: "audit.meta.settledEarly",
        metaParams: { amount: auditAmount(owed), voided: String(voided) },
      });
      /* Completed, not cancelled: the buyer did everything they agreed to, and
         faster. `updateContract` allows the status transition out of signed. */
      updateContract(contract.id, { status: "completed" });
      return { paid: owed, voided };
    },
    [invoices, payments, recordPayment, storeVoid, updateContract, t],
  );

  return useMemo(
    () => ({
      saveContract,
      signContract,
      updateDraft,
      recordPayment,
      issueExtraInvoice,
      voidInvoice,
      cancelContract,
      previewPlan,
      moneyAmendable,
      amendContract: amendContractAction,
      closeLease,
      payOwner,
      spendForOwner,
      addLatePenalty,
      postponeInvoice,
      settleEarly,
    }),
    [
      saveContract,
      signContract,
      updateDraft,
      recordPayment,
      issueExtraInvoice,
      voidInvoice,
      cancelContract,
      previewPlan,
      moneyAmendable,
      amendContractAction,
      closeLease,
      payOwner,
      spendForOwner,
      addLatePenalty,
      postponeInvoice,
      settleEarly,
    ],
  );
}
