import type { IconName } from "@/components/ui/icon";
import type { StatTone } from "@/components/data/stat-card";
import { ANCHOR_ISO, daysBetween } from "@/lib/dates";
import { add, isZero, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";
import {
  PLATFORM_CURRENCY,
  daysOverdue,
  invoiceCurrency,
  invoiceStatus,
  invoiceTotals,
  isAgencyMoney,
  outstanding,
  receivablesAging,
  type AgingBuckets,
  type ContractRecord,
  type InvoiceCategory,
  type InvoicePayee,
  type InvoiceRecord,
  type InvoiceStatus,
  type PaymentRecord,
} from "../_data/contracts";

/* The badge tones and the category icons are the contract screens' own — one
   set of invoice colours across the app, not a second set that happens to
   match today. */
export { INVOICE_STATUS_META } from "../_contracts/data";
export { CATEGORY_ICON } from "../_contract-detail/data";
import { displayStatusOnCancelled } from "../_contract-detail/data";
export type { InvoiceCategory, InvoicePayee, InvoiceRecord, InvoiceStatus } from "../_data/contracts";

export const ITEMS_PER_PAGE = 12;

/* ----------------------------------------------------------------------------
   Filters

   THE STATUS CHIPS ARE THE FIVE STATES `invoiceStatus` DERIVES, and nothing
   else. Every invoice lands under exactly one of them and every chip is
   reachable — the same rule the contracts list follows. A tempting "Unpaid"
   chip spanning three of them would overlap the ones beside it, and overlapping
   chips make a count that cannot be checked against the list under it.
   ------------------------------------------------------------------------- */

export const STATUS_TABS: ({ id: "all" } | { id: InvoiceStatus })[] = [
  { id: "all" },
  { id: "overdue" },
  { id: "due" },
  { id: "not_due" },
  { id: "paid" },
  { id: "void" },
];

export const CATEGORY_OPTIONS: InvoiceCategory[] = ["commission", "rent", "deposit", "fee"];

/**
 * The two categories whose NAME does not settle whose money it is.
 *
 * A "Fee" is either an instalment of a sale price — the seller's — or an extra
 * charge the agency raised, which is the agency's. A "Deposit" is either a
 * tenancy's insurance deposit, which stays the tenant's, or a sale's holding
 * deposit, which is the seller's. Same word on the row, different owner, and
 * no way to tell them apart without being told.
 *
 * Rent and commission are not on this list because they need no telling: rent
 * is the landlord's and commission is the agency's, on every contract, and
 * labelling them would put a chip beside a word that already says it.
 */
export const AMBIGUOUS_CATEGORIES = new Set<InvoiceCategory>(["fee", "deposit"]);
export const PAYEE_OPTIONS: InvoicePayee[] = ["agency", "owner", "tenant"];

/**
 * Due-date windows, forward only.
 *
 * A collections list is read looking ahead — "what falls due before the end of
 * the month" — while everything already late is a chip, not a range. Values are
 * day counts from the anchor, and `matchesDueWindow` is the one place that
 * reads them.
 */
export const DUE_WINDOWS: { value: string; days: number }[] = [
  { value: "7", days: 7 },
  { value: "30", days: 30 },
  { value: "90", days: 90 },
];

export const EMPTY_FILTERS = { category: "", payee: "", dueWindow: "" };
export type InvoiceFilters = typeof EMPTY_FILTERS;

/** Does this invoice fall due inside a window? Past-due invoices never match:
    a window is a look ahead, and "overdue" is a chip of its own. */
export function matchesDueWindow(inv: InvoiceRecord, window: string, asOf: string = ANCHOR_ISO): boolean {
  if (!window) return true;
  const days = DUE_WINDOWS.find((w) => w.value === window)?.days;
  if (!days) return true;
  const until = daysBetween(asOf, inv.dueOn);
  return until >= 0 && until <= days;
}

/* ----------------------------------------------------------------------------
   KPI cards
   ------------------------------------------------------------------------- */

export interface InvoiceKpis {
  /** The agency's own money still owed — see the note on `buildKpis`. */
  outstanding: Money;
  overdue: Money;
  over90: Money;
  dueSoon: Money;
  overdueCount: number;
  dueSoonCount: number;
  /** Invoices left out of every figure above because they are in another
      currency. Shown as a footnote, never converted. */
  otherCurrency: number;
}

/** How far ahead the "due soon" card looks. A month is the rhythm rent and
    instalments fall in, so it is the window somebody plans a week around. */
export const DUE_SOON_DAYS = 30;

/**
 * The four figures across the top.
 *
 * ⚠ THESE ARE THE AGENCY'S RECEIVABLES, NOT THE SUM OF THE LIST BELOW, and the
 * difference is deliberate. `receivablesAging` counts only agency money: rent
 * demanded on an agency-collected tenancy is the landlord's the moment it
 * arrives, so it is not a debt owed to this business however late it is. The
 * table still lists those demands — collecting them is the office's job — which
 * is why every card says whose money it is counting and the table carries a
 * payee column. Drop that distinction and the headline inflates by the whole
 * rent roll while looking entirely ordinary.
 *
 * Single-currency, like every other total in this app: `currency` says which
 * slice of the book is being read, and anything else is counted as a footnote
 * rather than converted at a rate nobody agreed.
 */
export function buildKpis(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  currency: CurrencyCode = PLATFORM_CURRENCY,
  asOf: string = ANCHOR_ISO,
): InvoiceKpis {
  const aging: AgingBuckets = receivablesAging(currency, asOf, invoices, payments);
  const overdue = [aging.d1to30, aging.d31to60, aging.d61to90, aging.d90plus].reduce(add, zeroMoney(currency));

  let overdueCount = 0;
  let dueSoonCount = 0;
  let dueSoon = zeroMoney(currency);
  let otherCurrency = 0;

  for (const inv of invoices) {
    if (inv.status !== "issued" || !isAgencyMoney(inv)) continue;
    const owed = outstanding(inv, payments);
    if (isZero(owed)) continue;
    if (invoiceCurrency(inv) !== currency) {
      otherCurrency += 1;
      continue;
    }
    const until = daysBetween(asOf, inv.dueOn);
    if (until < 0) {
      overdueCount += 1;
    } else if (until <= DUE_SOON_DAYS) {
      dueSoonCount += 1;
      dueSoon = add(dueSoon, owed);
    }
  }

  return { outstanding: aging.total, overdue, over90: aging.d90plus, dueSoon, overdueCount, dueSoonCount, otherCurrency };
}

export interface KpiCardDef {
  key: "outstanding" | "overdue" | "over90" | "dueSoon";
  icon: IconName;
  tone: StatTone;
}

/* Overdue and over-90 both take gold: StatTone offers no warning step, and gold
   is the closest the card has. Outstanding stays brand — it is the headline,
   not an alarm — and what falls due next is information, so it is info. */
export const KPI_CARDS: KpiCardDef[] = [
  { key: "outstanding", icon: "receipt", tone: "brand" },
  { key: "overdue", icon: "triangle-alert", tone: "gold" },
  { key: "over90", icon: "calendar-clock", tone: "gold" },
  { key: "dueSoon", icon: "banknote", tone: "info" },
];

/* ----------------------------------------------------------------------------
   Row shape — everything the table needs, resolved once
   ------------------------------------------------------------------------- */

export interface InvoiceListRow {
  invoice: InvoiceRecord;
  /** What it READS AS today, cancelled contracts included. Never stored. */
  status: InvoiceStatus;
  /** Days past due — 0 unless `status` is "overdue". */
  lateDays: number;
  total: Money;
  owed: Money;
  /** Missing only if a contract were deleted out from under an invoice, which
      the store does not do. Kept optional so the row degrades instead of
      throwing. */
  contract?: ContractRecord;
  propertyTitle: string;
  propertyId: string;
  billToName: string;
  /**
   * THE TWO SIDES OF THE CONTRACT THE DEMAND CAME FROM.
   *
   * `billToName` says who is being chased and nothing else. It does not say
   * whether that person is the one renting or the one being paid, and on a
   * commission invoice it is often neither — the agency bills a seller and a
   * buyer separately out of one sale. So the row carries the agreement's own
   * parties beside it: the seller (or landlord) and the buyer (or tenant),
   * resolved from the live members exactly as the contracts list resolves them.
   *
   * `counterpartyName` is the only one that can be missing — a contract can be
   * written before the other side is found. The owner always exists.
   */
  ownerName: string;
  counterpartyName: string | null;
}

/**
 * The order a collections list is read in.
 *
 * NOT by date, and not newest first. The question this screen answers is "who
 * do I chase", so what is late leads, what is due follows, and what is settled
 * or withdrawn sinks — sorting purely by due date buries the one overdue demand
 * under a page of invoices nobody has to do anything about yet.
 */
const STATUS_ORDER: Record<InvoiceStatus, number> = { overdue: 0, due: 1, not_due: 2, paid: 3, void: 4 };

/**
 * Resolve every invoice for the list, the most pressing demand first.
 *
 * Status, lateness and the outstanding balance are DERIVED here on every render
 * from the live payments — "overdue" is a fact about today, and a stored copy
 * would be wrong by the next morning. Recording a payment therefore updates the
 * row it was recorded against without anything having to remember to refresh.
 */
export function toListRows(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  contractById: (id: string) => ContractRecord | undefined,
  propertyTitle: (id: string) => string,
  memberName: (id?: string) => string | undefined,
  asOf: string = ANCHOR_ISO,
): InvoiceListRow[] {
  return invoices
    .map((invoice) => {
      const contract = contractById(invoice.contractId);
      const total = invoiceTotals(invoice).total;
      const lateDays = daysOverdue(invoice, payments, asOf);
      const live = invoiceStatus(invoice, payments, asOf);
      /* Nothing is hidden when a contract is cancelled: money that arrived stays
         listed, and a demand that will never be collected reads as Void here
         exactly as it does on the contract's own page. One rule, one function —
         see displayStatusOnCancelled. */
      const status = contract?.status === "cancelled" ? displayStatusOnCancelled({ invoice, status: live, lateDays, total }) : live;
      return {
        invoice,
        status,
        lateDays,
        total,
        owed: outstanding(invoice, payments),
        contract,
        propertyTitle: contract ? propertyTitle(contract.propertyId) : "",
        propertyId: contract?.propertyId ?? "",
        billToName: invoice.billTo.name,
        /* Off the LIVE members, like every other name in the app, and not off
           the invoice's frozen `billTo` block: that snapshot exists so a
           reprint shows what it showed on the day, while these two are context
           for the demand and should follow a member who was renamed since. */
        ownerName: (contract && memberName(contract.ownerId)) || contract?.ownerId || "",
        counterpartyName: contract ? (memberName(contract.buyerId) ?? contract.buyerExternal?.name ?? null) : null,
      };
    })
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      /* Oldest first inside a group: the longest-overdue demand is the one at
         most risk, and among what is still to come the nearest date is the one
         to plan around. */
      return byStatus !== 0 ? byStatus : a.invoice.dueOn.localeCompare(b.invoice.dueOn);
    });
}
