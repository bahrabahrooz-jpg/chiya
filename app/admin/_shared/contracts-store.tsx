"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { formatMoney, isZero, type CurrencyCode, type Money } from "@/lib/money";
import { toIso } from "@/lib/dates";
import {
  CONTRACTS,
  INVOICES,
  LEDGER,
  PAYMENTS,
  buildCreditNote,
  contractValue,
  contractsByAgent as contractsByAgentOf,
  contractsByProperty as contractsByPropertyOf,
  getContractById as getContractByIdOf,
  invoiceTotals,
  invoicesByContract as invoicesByContractOf,
  nextContractNumber,
  nextInvoiceNumber,
  outstanding,
  outstandingForContract as outstandingForContractOf,
  paidTotal,
  paymentsByInvoice as paymentsByInvoiceOf,
  previousContract as previousContractOf,
  receivablesAging as receivablesAgingOf,
  replacedBy as replacedByOf,
  type AgingBuckets,
  type ContractAmendment,
  type ContractKind,
  type ContractRecord,
  type InvoiceRecord,
  type PaymentRecord,
} from "../_data/contracts";
import { ledgerForContract as ledgerForContractOf, ledgerForOwner as ledgerForOwnerOf, ownerBalance as ownerBalanceOf, ownerTotals as ownerTotalsOf, type OwnerLedgerEntry, type OwnerTotals } from "../_data/owner-ledger";
import { logAudit } from "./audit-log";

/* ----------------------------------------------------------------------------
   Contracts store — the finance slice of the admin: contracts, invoices and
   payments. Modelled directly on properties-store.tsx (context + per-slice
   state, hydrate once on mount, persist on change) so the two behave the same
   and can be merged behind one provider later.

   IMMUTABILITY IS STRUCTURAL. There is deliberately no `updateInvoice` and no
   `deleteInvoice`. A draft is built by the caller and handed to issueInvoice();
   after that an invoice can only be voided — which leaves the record in place
   and writes a reversing credit note — or POSTPONED, which moves its due date
   and appends to a trail and may touch nothing else. Those two are the whole
   surface, and both are named mutations with their own guards rather than a
   general patch. If you find yourself wanting to change what an issued invoice
   CHARGES, the answer is a credit note.

   The same goes for contracts: `updateContract` refuses anything but a draft
   (see below), and there is no delete at all.
   ------------------------------------------------------------------------- */

/* Bump when the seed schema/semantics change so stale caches are discarded.
   v1: deals + contracts + invoices + payments.
   v2: deals carried `dualCurrency` + `agreedRate`; payments recorded
   `receivedAmount` / `receivedCurrency` / `rateApplied`.
   v3: DealRecord is gone. The contract IS the transaction, and it carries the
   property, the parties, the money and the dates that used to sit on the deal;
   invoices point at `contractId` rather than `dealId`. A v2 cache has no record
   that could be read as a v3 contract, so it is discarded rather than migrated.
   v4: invoices carry `payee` — whose money the invoice is — and the owner
   ledger is persisted alongside them. THIS BUMP IS NOT OPTIONAL. A v3 invoice
   has no `payee`, so `isAgencyMoney` would read undefined and every rent demand
   on an agency-collected tenancy would drop out of the figures (or, with the
   test written the other way, land in them). Either way the finance page would
   be wrong by the whole rent roll and would look entirely normal.
   v5: contracts carry a `template`, a commission PER PARTY, clause variables,
   an insurance deposit with its own lifecycle, and instalment terms — and their
   ids are now the printed contract number (S-2026-0009). Every new field reads
   through a fallback, so a v4 record would technically load; the bump is for the
   ids. A v4 cache holds `CT-<timestamp>` contracts, and leaving those beside
   numbered ones would show two id formats in one list with no way to tell which
   was which.
   v6: owner-ledger PAYOUTS now name the collection they settle (`paymentId`,
   `invoiceId`). A v5 payout carries neither, so the payouts screen — which
   lines each month's rent up against the hand-off that cleared it — would read
   every one of those months as still unpaid and invite somebody to hand the
   money over a second time. Discarded rather than migrated: there is no way to
   work out afterwards which collection an old payout was for.
   v7: a payout now names the CREDIT it clears (`settles`) rather than the
   payment, so it can settle a deposit deduction as readily as a month of rent —
   and the ledger gained an `expense` kind and a `deposit` one. A v6 payout has
   no `settles`, so it would match nothing and every month it cleared would read
   as unpaid again. Same reasoning as v6: discarded, not migrated.
   v8: the SEED gained rent payments and a seeded owner ledger. A v7 cache was
   saved before either existed, so restoring it would show a book where no rent
   has ever been collected while the code says otherwise.
   v9: the two tenancies the app had never invoiced — CT-0204 and CT-0206 — got
   the rent schedules the generator says every tenancy has, along with the
   twelve payments that settle them. A v8 cache holds neither, and because the
   message log is DERIVED from these records rather than stored, restoring one
   leaves the log with three months of history and three of its five states
   permanently empty. The screen looks broken and the data is the reason, which
   is precisely the case a version bump exists for.

   v10 adds CT-0213, the EXPIRED tenancy, with its commission invoice and the
   payment that settled it. A v9 cache holds none of the three, and the failure
   is the same shape as the one above: the Expired status chip, the End the
   tenancy action and the second deposit-to-settle all had nothing to act on, so
   three working features read as broken ones. Bumped alongside the properties
   store, which gained the property CT-0213 sits on. */
export const CONTRACTS_STORAGE_KEY = "chiya:admin-contracts:v10";

/* Same-tab change signal, like properties-store's STORE_EVENT: the browser
   `storage` event only fires in OTHER tabs. */
export const CONTRACTS_EVENT = "chiya:admin-contracts-changed";

/* Amounts in the audit log are formatted with "en" on purpose. The log stores
   i18n KEYS so the sentence follows the reader's language, but a money value is
   data, not copy — freezing it in Western digits keeps a stored event stable and
   means the amount reads the same to everyone reviewing the trail. */
const auditMoney = (m: Money) => formatMoney("en", m, { useCode: true });

/**
 * WHAT MAY STILL BE WRITTEN TO A CONTRACT THAT IS NO LONGER A DRAFT.
 *
 * Not terms — those are frozen, and changing one is an amendment (see
 * `amendContract`). These are the things that HAPPEN TO a contract that stands:
 * it gets signed, keys change hands, it is cancelled, it runs to completion,
 * and at the end of a tenancy somebody decides what becomes of the deposit.
 *
 * The deposit fields are on this list rather than the frozen side deliberately.
 * Where the deposit went is not a term of the agreement — nobody knows the
 * answer on the day of signing, which is exactly why closing a lease is an
 * action on the contract screen and not a field on the creation form.
 */
const LIFECYCLE_FIELDS: string[] = [
  "status",
  "signedOn",
  "handoverOn",
  "cancelledOn",
  "cancelReason",
  "notes",
  "previousPublication",
  "depositStatus",
  "depositReturnedOn",
  "depositDeduction",
  "depositDeductionReason",
  "depositCarriedToContractId",
];

/* Infer a specific audit verb from a contract patch so the log reads naturally
   ("Signed contract") instead of a generic "updated" — same approach, and the
   same i18n-key return, as propertyAction() in properties-store.tsx. */
function contractAction(patch: Partial<ContractRecord>): string {
  if (patch.status === "signed") return "audit.action.signedContract";
  if (patch.status === "completed") return "audit.action.completedContract";
  if (patch.status === "cancelled") return "audit.action.cancelledContract";
  return "audit.action.updatedContract";
}

let seq = 0;
/** Ids for records created live, kept clear of the seed's own id blocks.
    Module-level on purpose: it reads the clock, so it must not be called from a
    component body — React may re-run one, and an id that changes on re-render is
    not an id. */
function nextId(prefix: string) {
  seq += 1;
  return prefix + "-" + Date.now().toString(36) + "-" + seq.toString(36);
}

/**
 * The id for a contract created through the UI — AND its contract number.
 *
 * They are the same string on purpose. A contract has exactly one identifier
 * that anyone outside this system will ever use: the number printed on the
 * document, quoted down the telephone and written on the notary's file. Keeping
 * a separate opaque id beside it would mean every screen had to decide which of
 * the two to show, and the invoices and receipts pointing at a contract would
 * name something no party recognises.
 *
 * This REPLACES the generic `CT-<timestamp>` counter this store shipped with.
 * That one produced ids nobody could read, in no order, with no year in them —
 * fine as a placeholder, useless on paper. Format and the per-browser caveat
 * both live in `nextContractNumber`; this is the seam that gives it the live
 * records so a number cannot collide with one already in the store.
 */
export function nextContractId(kind: ContractKind, contracts: ContractRecord[], year: number): string {
  return nextContractNumber(kind, year, contracts);
}

/**
 * An id for any other record created through the UI — an invoice, a payment, a
 * ledger line.
 *
 * Exported from HERE rather than re-implemented in the finance module so every
 * live id comes off one counter. Two modules each keeping their own `seq` would
 * hand out the same suffix inside the same millisecond, and duplicate invoice
 * ids are the kind of bug that only shows up under the exact conditions nobody
 * tests. Never call it during render — it reads the clock.
 */
export function nextRecordId(prefix: "INV" | "PAY" | "LED"): string {
  return nextId(prefix);
}

interface ContractsContextValue {
  /* live records */
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  ledger: OwnerLedgerEntry[];
  /* mutations */
  createContract: (contract: ContractRecord) => void;
  updateContract: (id: string, patch: Partial<ContractRecord>) => void;
  /** Change a SIGNED contract’s terms, keeping its number. See amendContract. */
  amendContract: (id: string, patch: Partial<ContractRecord>, amendment: ContractAmendment) => void;
  issueInvoice: (invoice: InvoiceRecord, issuedOn?: string) => InvoiceRecord;
  voidInvoice: (id: string, reason: string, voidedOn?: string) => InvoiceRecord | undefined;
  /** Move a live demand's due date, keeping the trail. The ONLY field on an
      issued invoice that may change — see postponeInvoice. */
  postponeInvoice: (id: string, to: string, reason: string, on?: string) => InvoiceRecord | undefined;
  recordPayment: (payment: PaymentRecord, ledgerEntries?: OwnerLedgerEntry[]) => void;
  /** Money handed to an owner. The only thing that reduces what we owe one. */
  recordPayout: (entries: OwnerLedgerEntry[]) => void;
  /** Money the agency spent on an owner's behalf — a repair, a clean. */
  recordExpense: (entry: OwnerLedgerEntry) => void;
  /** The day an owner acknowledged rent a tenant paid him direct. See
      PaymentRecord.ownerReceiptedOn — it is what lets his receipt exist. */
  receiptOwner: (paymentId: string, on: string) => void;
  /** A damages deduction moved from the tenant's deposit to the owner. */
  recordDepositClaim: (entry: OwnerLedgerEntry) => void;
  /** Money handed back to whoever paid it — a holding deposit on a dead sale. */
  recordRefund: (entry: OwnerLedgerEntry) => void;
  /* derived selectors, all reading the live records */
  getContract: (id: string) => ContractRecord | undefined;
  contractsByProperty: (propertyId: string) => ContractRecord[];
  contractsByAgent: (agentId: string) => ContractRecord[];
  previousContract: (contract: ContractRecord) => ContractRecord | undefined;
  replacedBy: (contract: ContractRecord) => ContractRecord | undefined;
  invoicesByContract: (contractId: string) => InvoiceRecord[];
  paymentsByInvoice: (invoiceId: string) => PaymentRecord[];
  outstandingForContract: (contractId: string) => Money;
  receivablesAging: (currency?: CurrencyCode, asOf?: string) => AgingBuckets;
  ledgerForOwner: (ownerId: string) => OwnerLedgerEntry[];
  ledgerForContract: (contractId: string) => OwnerLedgerEntry[];
  ownerBalance: (ownerId: string, currency: CurrencyCode) => Money;
  ownerTotals: (ownerId: string, currency: CurrencyCode) => OwnerTotals;
}

const ContractsContext = createContext<ContractsContextValue | null>(null);

interface PersistedContracts {
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  ledger: OwnerLedgerEntry[];
}

/**
 * Single source of truth for the admin's finance records. Every mutation writes
 * an audit event, because money moving with no record of who moved it is the one
 * thing a finance module cannot do.
 */
export function ContractsProvider({ children }: { children: React.ReactNode }) {
  const [contracts, setContracts] = useState<ContractRecord[]>(CONTRACTS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INVOICES);
  const [payments, setPayments] = useState<PaymentRecord[]>(PAYMENTS);
  /* The ledger IS seeded now — the seed has a rent payment on an
     agency-collected tenancy (PAY-6009), so money really has passed through
     the agency on a landlord's behalf and the lines saying so have to exist.
     It also carries a rent payment the landlord took himself, which correctly
     produces no lines at all. See LEDGER. */
  const [ledger, setLedger] = useState<OwnerLedgerEntry[]>(LEDGER);

  /* Audit events name the record a human would recognise. Contracts have no
     title of their own, so they are logged by id — which is what the contract
     screens show as the heading too. */
  const createContract = useCallback((contract: ContractRecord) => {
    logAudit({
      category: "property",
      actionKey: "audit.action.createdContract",
      target: contract.id,
      targetId: contract.id,
      metaKey: "audit.meta.contractValue",
      metaParams: { amount: auditMoney(contractValue(contract)) },
    });
    setContracts((prev) => [contract, ...prev]);
  }, []);

  /**
   * Patch a contract — with the draft-only rule enforced HERE, not in a modal.
   *
   * A signed contract is an agreement between people. Correcting one means
   * cancelling it and creating a replacement linked by `replacesContractId`,
   * and this is the place that can actually guarantee it: a disabled input on
   * one screen is a courtesy to whoever is looking at that screen, and does
   * nothing about another screen, a later feature, or a bulk edit.
   *
   * The two exceptions are the transitions OUT of `signed` — completing and
   * cancelling. Those are not edits to the terms; they are what happens to a
   * contract that stands. Everything else on a signed record is frozen, and
   * throwing (rather than dropping the fields quietly) means a caller that
   * tries cannot mistake the refusal for success.
   */
  const updateContract = useCallback(
    (id: string, patch: Partial<ContractRecord>) => {
      const existing = contracts.find((c) => c.id === id);
      if (existing && existing.status !== "draft") {
        const keys = Object.keys(patch);
        const lifecycleOnly = keys.every((k) => LIFECYCLE_FIELDS.includes(k));
        if (!lifecycleOnly) {
          throw new Error(
            `contracts-store: ${id} is ${existing.status} and its terms are frozen. Cancel it and create a replacement carrying replacesContractId: "${id}".`,
          );
        }
      }
      logAudit({ category: "property", actionKey: contractAction(patch), target: id, targetId: id });
      setContracts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    },
    [contracts],
  );

  /**
   * AMEND A SIGNED CONTRACT — the one sanctioned way its terms ever change.
   *
   * `updateContract` refuses this outright, and rightly: a signed contract is
   * an agreement between people, not a form. But the parties DO agree changes —
   * a rent reduction, a start date pushed back a fortnight — and the choice is
   * between recording that properly and having somebody cancel and re-paper a
   * contract that both sides are perfectly happy with.
   *
   * The difference between an amendment and an edit is the record it leaves:
   *
   *   · IT KEEPS THE CONTRACT NUMBER. Renumbering would orphan every invoice
   *     and receipt that names it, and both parties are holding paper with the
   *     old number printed on it.
   *   · The change is APPENDED to `amendments`, never rewritten, so a contract
   *     amended three times shows all three in order.
   *   · A REASON IS REQUIRED, and it is refused without one.
   *
   * Drafts are refused too, from the other direction: a draft is edited through
   * `updateContract`, and calling it an amendment would put a ceremony in the
   * trail for something nobody had agreed to yet.
   */
  const amendContract = useCallback(
    (id: string, patch: Partial<ContractRecord>, amendment: ContractAmendment) => {
      const existing = contracts.find((c) => c.id === id);
      if (!existing) return;
      if (existing.status === "draft") {
        throw new Error(`contracts-store: ${id} is a draft — edit it with updateContract rather than amending it.`);
      }
      if (!amendment.reason.trim()) {
        throw new Error(`contracts-store: amending ${id} requires a reason.`);
      }
      logAudit({
        category: "property",
        actionKey: "audit.action.amendedContract",
        target: id,
        targetId: id,
        // Free text an admin typed — real data, so it goes in the untranslated
        // `meta` slot rather than through a catalog key.
        meta: amendment.reason,
      });
      setContracts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch, id: c.id, amendments: [...(c.amendments ?? []), amendment] } : c)),
      );
    },
    [contracts],
  );

  /**
   * Issue an invoice — the moment it stops being editable.
   *
   * This is the only caller of nextInvoiceNumber(), so numbering stays in one
   * place. Works for a brand-new invoice and for a draft already in the store:
   * an id that already exists is replaced in place, so a draft becomes its own
   * issued invoice rather than a duplicate.
   */
  const issueInvoice = useCallback((invoice: InvoiceRecord, issuedOn?: string): InvoiceRecord => {
    const issued: InvoiceRecord = {
      ...invoice,
      status: "issued",
      // A draft carries no number; re-issuing an already-numbered record keeps
      // the number it was issued under.
      number: invoice.number || nextInvoiceNumber(),
      issuedOn: issuedOn ?? invoice.issuedOn ?? toIso(new Date()),
    };
    logAudit({
      category: "property",
      actionKey: "audit.action.issuedInvoice",
      target: issued.number,
      targetId: issued.id,
      metaKey: "audit.meta.invoiceTotal",
      metaParams: { amount: auditMoney(invoiceTotals(issued).total) },
    });
    setInvoices((prev) => (prev.some((i) => i.id === issued.id) ? prev.map((i) => (i.id === issued.id ? issued : i)) : [issued, ...prev]));
    return issued;
  }, []);

  /**
   * Void an issued invoice and write the credit note that reverses it.
   *
   * The credit note is generated here rather than left to the caller: it must
   * mirror the original exactly — same billTo snapshot, same lines with the sign
   * flipped — and a hand-built one that does not is how a ledger stops
   * balancing. Drafts and already-voided invoices are refused: a draft is simply
   * discarded, and voiding twice would issue a second credit note.
   */
  const voidInvoice = useCallback(
    (id: string, reason: string, voidedOn?: string): InvoiceRecord | undefined => {
      const original = invoices.find((i) => i.id === id);
      if (!original || original.status !== "issued") return undefined;
      /**
       * ⚠ MONEY THAT ARRIVED IS NEVER VOIDED AWAY.
       *
       * Voiding writes a credit note for the FULL invoice, so doing it to a
       * demand somebody has already paid reverses a charge while the cash sits
       * in the account — and `outstanding` skips voided invoices, so the party
       * who paid becomes a creditor nothing on any screen counts. That is the
       * quiet kind of wrong this app is built to avoid.
       *
       * The rule is not new: cancelContract has always stepped over paid
       * invoices for exactly this reason. What was missing was the guard HERE,
       * so the void button on a row could do what the bulk path refused to. The
       * correct move on a paid demand is a refund, not a void.
       */
      if (!isZero(paidTotal(original, payments))) return undefined;
      const on = voidedOn ?? toIso(new Date());
      const creditNote = buildCreditNote(original, { id: nextId("INV"), number: nextInvoiceNumber(), on });
      const voided: InvoiceRecord = { ...original, status: "void", voidedOn: on, voidReason: reason, creditNoteId: creditNote.id };
      logAudit({
        category: "property",
        actionKey: "audit.action.voidedInvoice",
        target: original.number,
        targetId: original.id,
        // The reason is free text typed by an admin — real data, so it goes in
        // the untranslated `meta` slot rather than through a catalog key.
        meta: reason,
      });
      setInvoices((prev) => [creditNote, ...prev.map((i) => (i.id === id ? voided : i))]);
      return creditNote;
    },
    [invoices, payments],
  );

  /**
   * Give a demand more time.
   *
   * ⚠ THE ONE NARROW EXCEPTION TO INVOICE IMMUTABILITY, and it is narrow on
   * purpose: `dueOn` moves and a line is appended to the trail. Nothing else on
   * the record can be reached from here — not the amount, not the party, not
   * the lines. Extending the terms of collection is not reissuing the document,
   * which is why this is not a credit note: voiding and re-raising a demand
   * because a tenant asked for a week would burn an invoice number, break the
   * link to any penalty hanging off it, and tell a landlord reading the file
   * that his rent was cancelled.
   *
   * REFUSED ON ANYTHING THAT IS NOT A LIVE, UNSETTLED DEMAND, and refused
   * backwards: a date earlier than the one it already carries is not an
   * extension, it is a rewrite of when the money was owed.
   */
  const postponeInvoice = useCallback(
    (id: string, to: string, reason: string, on?: string): InvoiceRecord | undefined => {
      const original = invoices.find((i) => i.id === id);
      if (!original || original.status !== "issued" || original.creditNoteFor) return undefined;
      if (!(to > original.dueOn)) return undefined;
      /* A demand that has been settled has nothing left to fall due. A PART-paid
         one still does, so it is allowed. */
      if (isZero(outstanding(original, payments))) return undefined;

      const agreedOn = on ?? toIso(new Date());
      const moved: InvoiceRecord = {
        ...original,
        dueOn: to,
        postponements: [...(original.postponements ?? []), { from: original.dueOn, to, on: agreedOn, reason }],
      };
      logAudit({
        category: "property",
        actionKey: "audit.action.postponedInvoice",
        target: original.number || original.id,
        targetId: original.id,
        metaKey: "audit.meta.postponed",
        metaParams: { from: original.dueOn, to },
      });
      setInvoices((prev) => prev.map((i) => (i.id === id ? moved : i)));
      return moved;
    },
    [invoices, payments],
  );

  /**
   * Record money received — and, when it was somebody else's money, the fact
   * that we are now holding it.
   *
   * THE TWO ARE ONE EVENT AND ARE WRITTEN TOGETHER. A payment against an
   * owner-payee invoice means the agency has taken in rent that belongs to the
   * landlord; the ledger lines saying so cannot be worked out again afterwards
   * (see ../_data/owner-ledger for why). Letting a caller record the payment and
   * forget the ledger would lose them silently, so the ledger travels in the
   * same call rather than in a second one somebody has to remember.
   */
  const recordPayment = useCallback(
    (payment: PaymentRecord, ledgerEntries?: OwnerLedgerEntry[]) => {
      const invoice = invoices.find((i) => i.id === payment.invoiceId);
      logAudit({
        category: "property",
        actionKey: "audit.action.recordedPayment",
        target: invoice?.number || payment.invoiceId,
        targetId: payment.id,
        metaKey: "audit.meta.paidAmount",
        metaParams: { amount: auditMoney(payment.amount) },
      });
      setPayments((prev) => [payment, ...prev]);
      if (ledgerEntries?.length) setLedger((prev) => [...ledgerEntries, ...prev]);
    },
    [invoices],
  );

  /**
   * Money handed to an owner — the mirror of the collection above, and the only
   * thing that reduces what we owe one.
   *
   * TAKES A LIST because one hand-off can settle several tenancies at once: a
   * landlord with three flats takes what he is owed on all three in one visit,
   * and that is one act, one receipt, and three ledger lines. Writing them in
   * one call keeps them from half-landing.
   *
   * Audited like every other movement. Money leaving the agency with no record
   * of who released it is the one thing a finance module cannot do.
   *
   * ⚠ NOTHING IS RECONCILED AGAINST A BANK HERE. This records that a hand-off
   * happened, exactly as recordPayment records that money arrived. Matching it
   * to a client account is trust accounting, and that is a larger job.
   */
  const recordPayout = useCallback((entries: OwnerLedgerEntry[]) => {
    if (!entries.length) return;
    /* Summed PER CURRENCY and joined, never added across them. A landlord with
       a dollar flat and a dinar one takes both in one visit, and one number
       covering the two would need a rate that belongs to a day rather than to
       an audit line. Same rule as every other total in this system. */
    const byCurrency = new Map<CurrencyCode, number>();
    for (const e of entries) {
      byCurrency.set(e.amount.currency, (byCurrency.get(e.amount.currency) ?? 0) + Math.abs(e.amount.amount));
    }
    const total = [...byCurrency].map(([currency, amount]) => auditMoney({ amount, currency })).join(" + ");
    logAudit({
      category: "property",
      actionKey: "audit.action.paidOwner",
      /* The contract a human would recognise. Several lines settle under one
         act, so the log names the first and counts the rest. */
      target: entries[0].contractId,
      targetId: entries[0].id,
      metaKey: "audit.meta.paidOut",
      metaParams: { amount: total, count: String(entries.length) },
    });
    setLedger((prev) => [...entries, ...prev]);
  }, []);

  /**
   * Money the agency spent for an owner — a plumber, a clean.
   *
   * One line, not a list: a repair is one invoice from one contractor against
   * one property, unlike a payout which can settle several months at once.
   *
   * Audited like every other movement. Money leaving the agency's account
   * against somebody else's balance is exactly the act that has to be
   * attributable to a person a year later.
   */
  const recordExpense = useCallback((entry: OwnerLedgerEntry) => {
    logAudit({
      category: "property",
      actionKey: "audit.action.ownerExpense",
      target: entry.contractId,
      targetId: entry.id,
      metaKey: "audit.meta.spentFor",
      metaParams: { amount: auditMoney({ amount: Math.abs(entry.amount.amount), currency: entry.amount.currency }) },
    });
    setLedger((prev) => [entry, ...prev]);
  }, []);

  /**
   * A damages deduction, moved off the tenant's deposit onto the landlord.
   *
   * Its own verb in the log because it is the one movement a tenant rings up
   * about a year later — "you kept two hundred, where did it go" — and the
   * answer has to name a person and a day.
   */
  /**
   * Money given back to whoever paid it.
   *
   * Its own verb because it is the opposite of every other movement on this
   * ledger: the balance goes down and nobody was paid. A year later somebody
   * will ask why the seller's figure dropped without a hand-off, and the log
   * has to answer.
   */
  const recordRefund = useCallback((entry: OwnerLedgerEntry) => {
    logAudit({
      category: "property",
      actionKey: "audit.action.refunded",
      target: entry.contractId,
      targetId: entry.id,
      metaKey: "audit.meta.spentFor",
      metaParams: { amount: auditMoney({ amount: Math.abs(entry.amount.amount), currency: entry.amount.currency }) },
    });
    setLedger((prev) => [entry, ...prev]);
  }, []);

  /**
   * The owner has acknowledged rent his tenant paid him direct.
   *
   * The ONE thing that may be written to a payment after the fact, and it adds
   * a date rather than changing one: the payment itself — what arrived, when,
   * from whom — stays frozen, exactly like an issued invoice. What this records
   * is a second, later event about the same money.
   */
  const receiptOwner = useCallback((paymentId: string, on: string) => {
    logAudit({
      category: "property",
      actionKey: "audit.action.ownerReceipted",
      target: paymentId,
      targetId: paymentId,
    });
    setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, ownerReceiptedOn: on } : p)));
  }, []);

  const recordDepositClaim = useCallback((entry: OwnerLedgerEntry) => {
    logAudit({
      category: "property",
      actionKey: "audit.action.depositClaim",
      target: entry.contractId,
      targetId: entry.id,
      metaKey: "audit.meta.spentFor",
      metaParams: { amount: auditMoney(entry.amount) },
    });
    setLedger((prev) => [entry, ...prev]);
  }, []);

  /* ---- derived selectors (live records passed through the pure helpers) ---- */
  const selectors = useMemo(
    () => ({
      getContract: (id: string) => getContractByIdOf(id, contracts),
      contractsByProperty: (propertyId: string) => contractsByPropertyOf(propertyId, contracts),
      contractsByAgent: (agentId: string) => contractsByAgentOf(agentId, contracts),
      previousContract: (contract: ContractRecord) => previousContractOf(contract, contracts),
      replacedBy: (contract: ContractRecord) => replacedByOf(contract, contracts),
      invoicesByContract: (contractId: string) => invoicesByContractOf(contractId, invoices),
      paymentsByInvoice: (invoiceId: string) => paymentsByInvoiceOf(invoiceId, payments),
      outstandingForContract: (contractId: string) => outstandingForContractOf(contractId, invoices, payments),
      receivablesAging: (currency?: CurrencyCode, asOf?: string) => receivablesAgingOf(currency, asOf, invoices, payments),
      ledgerForOwner: (ownerId: string) => ledgerForOwnerOf(ownerId, ledger),
      ledgerForContract: (contractId: string) => ledgerForContractOf(contractId, ledger),
      ownerBalance: (ownerId: string, currency: CurrencyCode) => ownerBalanceOf(ownerId, currency, ledger),
      ownerTotals: (ownerId: string, currency: CurrencyCode) => ownerTotalsOf(ownerId, currency, ledger),
    }),
    [contracts, invoices, payments, ledger],
  );

  // Hydrate from localStorage once on mount (client only) — same reasoning as
  // properties-store: doing it during render would break SSR hydration.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CONTRACTS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<PersistedContracts>;
      /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage after mount avoids an SSR hydration mismatch */
      if (Array.isArray(data.contracts)) setContracts(data.contracts);
      if (Array.isArray(data.invoices)) setInvoices(data.invoices);
      if (Array.isArray(data.payments)) setPayments(data.payments);
      if (Array.isArray(data.ledger)) setLedger(data.ledger);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);

  // Persist on change (skip the first run so we don't clobber before hydration).
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify({ contracts, invoices, payments, ledger }));
      window.dispatchEvent(new Event(CONTRACTS_EVENT));
    } catch {}
  }, [contracts, invoices, payments, ledger]);

  const value = useMemo(
    () => ({
      contracts,
      invoices,
      payments,
      ledger,
      createContract,
      updateContract,
      amendContract,
      issueInvoice,
      voidInvoice,
      postponeInvoice,
      recordPayment,
      recordPayout,
      recordExpense,
      receiptOwner,
      recordDepositClaim,
      recordRefund,
      ...selectors,
    }),
    [contracts, invoices, payments, ledger, createContract, updateContract, amendContract, issueInvoice, voidInvoice, postponeInvoice, recordPayment, recordPayout, recordExpense, receiptOwner, recordDepositClaim, recordRefund, selectors],
  );

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within a ContractsProvider");
  return ctx;
}
