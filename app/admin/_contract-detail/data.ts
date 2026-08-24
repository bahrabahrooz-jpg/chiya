import type { IconName } from "@/components/ui/icon";
import { ANCHOR_ISO } from "@/lib/dates";
import {
  daysOverdue,
  invoiceStatus,
  invoiceTotals,
  type InvoiceCategory,
  type InvoiceRecord,
  type InvoiceStatus,
  type PaymentRecord,
} from "../_data/contracts";

/* Everything the detail screen reads comes from the shared data layer; this
   module only holds what is specific to rendering ONE contract. */
export {
  CONTRACTS,
  activeFrom,
  contractValue,
  cycleCount,
  daysOverdue,
  daysToExpiry,
  getContractById,
  hasExpired,
  invoiceStatus,
  invoiceTotals,
  invoicesByContract,
  isActive,
  isEditable,
  managementFeeAmount,
  outstanding,
  outstandingForContract,
  paidTotal,
  previousContract,
  replacedBy,
  termStart,
} from "../_data/contracts";
export type { ContractRecord, InvoiceRecord, InvoiceStatus, PaymentRecord } from "../_data/contracts";
export { INVOICE_STATUS_META, KIND_META, STATUS_META } from "../_contracts/data";

/**
 * How many invoice rows show before the list collapses.
 *
 * An agency-collected tenancy raises thirteen invoices at signing — twelve rent
 * demands plus the commission — and thirteen near-identical rows bury the two
 * that actually need attention. Four is enough to show the shape of the
 * schedule and the first thing that is overdue; the rest are one click away.
 */
export const INVOICE_COLLAPSE_AT = 4;

/** The icon for one invoice's reason for existing. */
export const CATEGORY_ICON: Record<InvoiceCategory, IconName> = {
  commission: "percent",
  rent: "calendar-days",
  deposit: "wallet",
  fee: "receipt",
};

export interface InvoiceRow {
  invoice: InvoiceRecord;
  status: InvoiceStatus;
  /** Days past due — 0 unless `status` is "overdue". */
  lateDays: number;
  total: ReturnType<typeof invoiceTotals>["total"];
}

/**
 * Resolve every invoice on a contract for display, in due-date order.
 *
 * Status and the day count are DERIVED here rather than stored (see
 * `invoiceStatus` in _data/contracts): "overdue" is a fact about today, and a
 * stored copy would be wrong by the next morning.
 */
export function toInvoiceRows(invoices: InvoiceRecord[], payments: PaymentRecord[], asOf: string = ANCHOR_ISO): InvoiceRow[] {
  return invoices.map((invoice) => ({
    invoice,
    status: invoiceStatus(invoice, payments, asOf),
    lateDays: daysOverdue(invoice, payments, asOf),
    total: invoiceTotals(invoice).total,
  }));
}

/**
 * What a CANCELLED contract's unpaid invoices should read as.
 *
 * Nothing is hidden when a contract is cancelled. Money that arrived stays
 * listed against the contract that explains it, and a demand that will never be
 * collected reads as Void rather than quietly disappearing — a row that vanishes
 * is a row nobody can ask about later.
 *
 * A paid invoice is never re-labelled: it was paid, and cancelling the contract
 * afterwards does not un-receive the money.
 */
export function displayStatusOnCancelled(row: InvoiceRow): InvoiceStatus {
  if (row.status === "paid" || row.status === "void") return row.status;
  return "void";
}
