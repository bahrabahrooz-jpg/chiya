import type { IconName } from "@/components/ui/icon";
import { ANCHOR_ISO } from "@/lib/dates";
import {
  daysOverdue,
  invoiceStatus,
  invoiceTotals,
  type ContractKind,
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
export type { ContractKind, ContractRecord, InvoiceCategory, InvoiceRecord, InvoiceStatus, PaymentRecord } from "../_data/contracts";
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

/**
 * What a row READS AS on this screen — the one function everything else asks.
 *
 * On a live contract that is the derived status; on a cancelled one it is what
 * `displayStatusOnCancelled` says. Sorting, grouping and the badge all go
 * through here, because a list ordered by a status the screen does not show is
 * a list in no order at all.
 */
export function displayStatus(row: InvoiceRow, cancelled: boolean): InvoiceStatus {
  return cancelled ? displayStatusOnCancelled(row) : row.status;
}

/* ----------------------------------------------------------------------------
   Who a demand is addressed to

   ONE CONTRACT BILLS BOTH SIDES, and until this existed the screen could not
   say which side a row was for. A signing raises TWO commission invoices — the
   landlord's and the tenant's, or the seller's and the buyer's — for two
   different amounts, on two different grounds, to two different people. On the
   card they were two near-identical rows, and every receipt printed off either
   of them was labelled "Tenant's receipt", including the one the landlord paid.
   ------------------------------------------------------------------------- */

/** Which side of the contract an invoice is billed to. An off-platform party
    carries no id, and is always the buyer/tenant side. */
export function billedSide(invoice: InvoiceRecord, ownerId: string): "owner" | "counterparty" {
  return invoice.billToId !== undefined && invoice.billToId === ownerId ? "owner" : "counterparty";
}

/** What to CALL that party — the four words a contract has for its two sides. */
export function partyRoleKey(kind: ContractKind, side: "owner" | "counterparty"): string {
  if (side === "owner") return kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord";
  return kind === "sale" ? "admin.pd.buyer" : "admin.pd.tenant";
}

/**
 * The label on the "print the receipt" link for a payment.
 *
 * ⚠ IT NAMES WHOEVER PAID, which sounds obvious and was not what the screen
 * did: every payment offered "Tenant's receipt", so the landlord's commission —
 * paid by the landlord — printed a paper the link called the tenant's. The
 * receipt document itself was always right; only the link lied.
 *
 * This is NOT the same paper as the owner's receipt beside it on a rent row.
 * That one says the landlord RECEIVED his money; this one says a party PAID.
 * They never carry the same label on one row, because the owner's copy only
 * exists on money that is the owner's, which is never money the owner paid.
 */
export function payerReceiptKey(kind: ContractKind, side: "owner" | "counterparty"): string {
  if (side === "owner") return kind === "sale" ? "admin.rc.forSeller" : "admin.rc.forLandlord";
  return kind === "sale" ? "admin.rc.forBuyer" : "admin.rc.forTenant";
}

/**
 * WHERE THE MONEY ON A DEMAND ENDS UP — the other end of the arrow on a row.
 *
 * `payee` already says whose money it is; this turns that into a party the row
 * can name. Three cases, and the third is the one worth stating:
 *
 *   owner    rent, and a sale’s instalments. It goes to the landlord or the
 *            seller, whoever physically collects it on the day.
 *   agency   commission and the agency’s own charges. Ours.
 *   tenant   a tenancy deposit, and it goes NOWHERE. It stays the tenant’s
 *            money sitting in our account until the lease closes, so there is
 *            no second party to draw an arrow to — null, and the row says
 *            "held" instead of pointing the money at the person who paid it.
 */
export function invoiceRecipient(
  invoice: InvoiceRecord,
  kind: ContractKind,
  ownerName: string,
  agencyName: string,
): { roleKey: string; name: string } | null {
  if (invoice.payee === "owner") return { roleKey: partyRoleKey(kind, "owner"), name: ownerName };
  if (invoice.payee === "agency") return { roleKey: "admin.ct.inv.agency", name: agencyName };
  return null;
}

/* ----------------------------------------------------------------------------
   Grouping the invoices card

   ONE CONTRACT RAISES SEVERAL KINDS OF DEMAND AT ONCE and they used to arrive
   as one flat list in due-date order: twelve months of rent, the deposit and
   the agency's commission interleaved by date, so telling them apart meant
   reading every line. They are separated now — by what the demand IS, which is
   the only division somebody actually holds in their head.
   ------------------------------------------------------------------------- */

/**
 * Urgency. The same order the invoices list sorts by, for the same reason: the
 * question anybody opens this card with is "what has to be paid", so what is
 * late leads, what is due follows, and what is settled or withdrawn sinks.
 */
export const INVOICE_STATUS_ORDER: Record<InvoiceStatus, number> = { overdue: 0, due: 1, not_due: 2, paid: 3, void: 4 };

/** The two states that need somebody to do something this week. */
export const PRESSING_STATUSES = new Set<InvoiceStatus>(["overdue", "due"]);

/**
 * The order the groups fall in when nothing is pressing — rent, then the
 * deposit, then what the agency charged. Roughly the order the money moves in,
 * and fixed, so a card with nothing outstanding does not reshuffle itself.
 */
export const CATEGORY_ORDER: InvoiceCategory[] = ["rent", "deposit", "commission", "fee"];

export interface InvoiceGroup {
  category: InvoiceCategory;
  /** Sorted: most urgent first, oldest due date first inside a status. */
  rows: InvoiceRow[];
  /** How many rows here are overdue or due — the number the heading flags. */
  pressing: number;
}

/** Most urgent first, oldest due date first within one status. */
export function sortByUrgency(rows: InvoiceRow[], cancelled: boolean): InvoiceRow[] {
  return [...rows].sort((a, b) => {
    const byStatus = INVOICE_STATUS_ORDER[displayStatus(a, cancelled)] - INVOICE_STATUS_ORDER[displayStatus(b, cancelled)];
    /* Oldest first inside a group: the longest-overdue demand is the one most
       at risk, and among what is still to come the nearest date is the one to
       plan around. */
    return byStatus !== 0 ? byStatus : a.invoice.dueOn.localeCompare(b.invoice.dueOn);
  });
}

/**
 * Split one contract's invoices into groups, THE MOST URGENT GROUP FIRST.
 *
 * Two rules, and they do not fight: the category decides what goes together,
 * the urgency decides the order — of the rows inside a group, and of the groups
 * themselves. So the overdue rent demand is the first row of the first group,
 * which is what somebody opening this card on the 3rd of the month came for,
 * and the deposit is still its own block rather than a line buried at №7.
 *
 * Empty categories produce no group at all. A contract that raised no deposit
 * gets no Deposit heading, because an empty heading is a claim that something
 * is missing.
 */
export function groupInvoiceRows(rows: InvoiceRow[], cancelled: boolean): InvoiceGroup[] {
  const byCategory = new Map<InvoiceCategory, InvoiceRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.invoice.category);
    if (list) list.push(row);
    else byCategory.set(row.invoice.category, [row]);
  }

  return [...byCategory]
    .map(([category, list]) => {
      const sorted = sortByUrgency(list, cancelled);
      return {
        category,
        rows: sorted,
        pressing: sorted.filter((r) => PRESSING_STATUSES.has(displayStatus(r, cancelled))).length,
        /* The group's own urgency IS its first row's, because the rows are
           already sorted — there is nothing more pressing further down. */
        urgency: INVOICE_STATUS_ORDER[displayStatus(sorted[0], cancelled)],
      };
    })
    .sort((a, b) => a.urgency - b.urgency || CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category))
    .map(({ category, rows: groupRows, pressing }) => ({ category, rows: groupRows, pressing }));
}
