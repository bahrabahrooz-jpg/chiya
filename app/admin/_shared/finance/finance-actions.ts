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
import { collectionEntries, splitCollection, type OwnerLedgerEntry } from "../../_data/owner-ledger";
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
}

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
  cancelContract: (contractId: string, reason: string) => CancelResult;
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
    recordPayment: storeRecordPayment,
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
      const invoiceCount = generateOnSigning(record);
      return { contract: record, invoiceCount };
    },
    [agreedRateFor, transitions, generateOnSigning, contracts],
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
   * to begin with.
   *
   * ⚠ THESE CANNOT BE RECONSTRUCTED. Not written here means never written: the
   * fee rate can change mid-term, the exchange rate belongs to the day the cash
   * was taken, and a part payment splits differently from a full one. See the
   * header of ../../_data/owner-ledger.
   */
  const ownerLedgerFor = useCallback(
    (invoice: InvoiceRecord, payment: PaymentRecord, credited: Money): OwnerLedgerEntry[] | undefined => {
      if (invoice.payee !== "owner") return undefined;
      const contract = contracts.find((c) => c.id === invoice.contractId);
      if (!contract) return undefined;
      const split = splitCollection(credited, contract.price, managementFeeAmount(contract));
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
    (contractId: string, reason: string): CancelResult => {
      const live = invoicesByContract(contractId, invoices).filter((i) => i.status === "issued");
      let voided = 0;
      let leftOwed = 0;
      for (const inv of live) {
        if (!isZero(paidTotal(inv, payments))) continue; // money arrived — untouched
        if (daysBetween(inv.dueOn, TODAY) >= 0) {
          leftOwed += 1; // due or overdue: a real debt, and it stays one
          continue;
        }
        storeVoid(inv.id, t("admin.fin.void.contractCancelled", { reason }), TODAY);
        voided += 1;
      }
      transitions.cancelContract(contractId, reason, TODAY);
      return { voided, leftOwed };
    },
    [invoices, payments, storeVoid, transitions, t],
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
    },
    [contracts, updateContract],
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
   * The charge is the agency's own money — it is a fee the agency levies, not
   * rent passing through — so it is `payee: "agency"`, unlike the invoice it
   * hangs off.
   */
  const addLatePenalty = useCallback(
    (invoiceId: string): InvoiceRecord | undefined => {
      const invoice = invoices.find((i) => i.id === invoiceId);
      if (!invoice || invoice.status !== "issued") return undefined;
      const contract = contracts.find((c) => c.id === invoice.contractId);
      if (!contract) return undefined;

      const penalty = latePenaltyFor(contract, daysOverdue(invoice, payments, TODAY));
      if (!penalty || isZero(penalty.amount)) return undefined;

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
          payee: "agency",
          status: "draft",
          dueOn: TODAY,
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
      addLatePenalty,
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
      addLatePenalty,
      settleEarly,
    ],
  );
}
