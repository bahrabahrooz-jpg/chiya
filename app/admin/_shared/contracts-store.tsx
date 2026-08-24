"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { formatMoney, type CurrencyCode, type Money } from "@/lib/money";
import { toIso } from "@/lib/dates";
import {
  CONTRACTS,
  INVOICES,
  PAYMENTS,
  buildCreditNote,
  contractValue,
  contractsByAgent as contractsByAgentOf,
  contractsByProperty as contractsByPropertyOf,
  getContractById as getContractByIdOf,
  invoiceTotals,
  invoicesByContract as invoicesByContractOf,
  nextInvoiceNumber,
  outstandingForContract as outstandingForContractOf,
  paymentsByInvoice as paymentsByInvoiceOf,
  previousContract as previousContractOf,
  receivablesAging as receivablesAgingOf,
  replacedBy as replacedByOf,
  type AgingBuckets,
  type ContractRecord,
  type InvoiceRecord,
  type PaymentRecord,
} from "../_data/contracts";
import { logAudit } from "./audit-log";

/* ----------------------------------------------------------------------------
   Contracts store — the finance slice of the admin: contracts, invoices and
   payments. Modelled directly on properties-store.tsx (context + per-slice
   state, hydrate once on mount, persist on change) so the two behave the same
   and can be merged behind one provider later.

   IMMUTABILITY IS STRUCTURAL. There is deliberately no `updateInvoice` and no
   `deleteInvoice`. A draft is built by the caller and handed to issueInvoice();
   after that the only thing that can happen to an invoice is voidInvoice(),
   which leaves the record in place and writes a reversing credit note. If you
   find yourself wanting to edit an issued invoice, the answer is a credit note.

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
   that could be read as a v3 contract, so it is discarded rather than migrated. */
export const CONTRACTS_STORAGE_KEY = "chiya:admin-contracts:v3";

/* Same-tab change signal, like properties-store's STORE_EVENT: the browser
   `storage` event only fires in OTHER tabs. */
export const CONTRACTS_EVENT = "chiya:admin-contracts-changed";

/* Amounts in the audit log are formatted with "en" on purpose. The log stores
   i18n KEYS so the sentence follows the reader's language, but a money value is
   data, not copy — freezing it in Western digits keeps a stored event stable and
   means the amount reads the same to everyone reviewing the trail. */
const auditMoney = (m: Money) => formatMoney("en", m, { useCode: true });

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

/** The id for a contract created through the UI. Exported so the screens that
    open one do not each invent their own format — or call the clock during
    render. */
export function nextContractId(): string {
  return nextId("CT");
}

interface ContractsContextValue {
  /* live records */
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  /* mutations */
  createContract: (contract: ContractRecord) => void;
  updateContract: (id: string, patch: Partial<ContractRecord>) => void;
  issueInvoice: (invoice: InvoiceRecord, issuedOn?: string) => InvoiceRecord;
  voidInvoice: (id: string, reason: string, voidedOn?: string) => InvoiceRecord | undefined;
  recordPayment: (payment: PaymentRecord) => void;
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
}

const ContractsContext = createContext<ContractsContextValue | null>(null);

interface PersistedContracts {
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
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
        const lifecycleOnly = keys.every((k) =>
          ["status", "signedOn", "handoverOn", "cancelledOn", "cancelReason", "notes", "previousPublication"].includes(k),
        );
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
    [invoices],
  );

  const recordPayment = useCallback(
    (payment: PaymentRecord) => {
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
    },
    [invoices],
  );

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
    }),
    [contracts, invoices, payments],
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
      window.localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify({ contracts, invoices, payments }));
      window.dispatchEvent(new Event(CONTRACTS_EVENT));
    } catch {}
  }, [contracts, invoices, payments]);

  const value = useMemo(
    () => ({
      contracts,
      invoices,
      payments,
      createContract,
      updateContract,
      issueInvoice,
      voidInvoice,
      recordPayment,
      ...selectors,
    }),
    [contracts, invoices, payments, createContract, updateContract, issueInvoice, voidInvoice, recordPayment, selectors],
  );

  return <ContractsContext.Provider value={value}>{children}</ContractsContext.Provider>;
}

export function useContracts() {
  const ctx = useContext(ContractsContext);
  if (!ctx) throw new Error("useContracts must be used within a ContractsProvider");
  return ctx;
}
