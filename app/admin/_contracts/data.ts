import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { ANCHOR_ISO } from "@/lib/dates";
import { type Money, type CurrencyCode } from "@/lib/money";
import {
  PLATFORM_CURRENCY,
  contractValue,
  daysToExpiry,
  depositNeedsClosing,
  isActive,
  noticeDaysOf,
  signedValueInMonth,
  type ContractDisplayStatus,
  type ContractKind,
  type ContractRecord,
} from "../_data/contracts";

/* Records, types and selectors come from the shared data layer so this page,
   the contract detail screen and the property page all agree. */
export {
  CONTRACTS,
  contractValue,
  contractsByAgent,
  contractsByProperty,
  displayStatus,
  getContractById,
  invoicesByContract,
  isActive,
  outstandingForContract,
} from "../_data/contracts";
export type { ContractRecord, ContractKind, ContractStatus, ContractDisplayStatus } from "../_data/contracts";
export { AGENTS, PROPERTIES, memberById, agentById } from "../_data/catalog";

export const ITEMS_PER_PAGE = 10;

/* ----------------------------------------------------------------------------
   Status and kind badges
   ------------------------------------------------------------------------- */

export interface StatusMeta {
  variant: BadgeVariant;
  dot?: boolean;
  icon?: IconName;
}

/**
 * Contract status tones, keyed by the DISPLAY status — the five words a person
 * reads, not the four the record stores. See `displayStatus` in
 * _data/contracts for why those are two different lists.
 *
 * They deliberately match the property availability tones a contract in that
 * state produces (see availabilityForContract in _data/property-state) — an
 * active sale is red on both screens, a draft is amber on both — so the colour
 * means the same thing wherever it is seen.
 *
 * `expired` is the only one in error red. It is not a bad contract; it is an
 * unfinished job, and it was invisible for as long as it wore the same green
 * badge as a lease that is actually running.
 */
export const STATUS_META: Record<ContractDisplayStatus, StatusMeta> = {
  draft: { variant: "warning", dot: true },
  active: { variant: "success", icon: "file-signature" },
  expired: { variant: "error", icon: "calendar-x" },
  completed: { variant: "info", icon: "circle-check" },
  cancelled: { variant: "neutral", icon: "ban" },
};

export const KIND_META: Record<ContractKind, StatusMeta> = {
  sale: { variant: "brand" },
  rent: { variant: "info" },
};

/** Invoice badges, in the five states `invoiceStatus` derives. Overdue is the
    only one that carries a number with it — the day count goes in the label. */
export const INVOICE_STATUS_META: Record<string, StatusMeta> = {
  not_due: { variant: "neutral", dot: true },
  due: { variant: "warning", dot: true },
  paid: { variant: "success", icon: "circle-check" },
  overdue: { variant: "error", icon: "triangle-alert" },
  void: { variant: "neutral", icon: "ban" },
};

/* ----------------------------------------------------------------------------
   Filters
   ------------------------------------------------------------------------- */

/** The list's status chips — every contract lands under exactly one, and every
    chip is reachable, because the five display statuses are mutually exclusive.
    They are the same five words the badge uses and the same words the KPI cards
    count, which is the whole point: a card that says "12 active" must have a
    chip you can press to see those twelve. */
export const STATUS_TABS: ({ id: "all" } | { id: ContractDisplayStatus })[] = [
  { id: "all" },
  { id: "draft" },
  { id: "active" },
  { id: "expired" },
  { id: "completed" },
  { id: "cancelled" },
];

export const KIND_OPTIONS: ContractKind[] = ["sale", "rent"];

/**
 * Date-range presets for the signing date.
 *
 * Ranges rather than a single day: nobody looks for contracts signed on one
 * particular date, they look for "this quarter". The values are day counts back
 * from the anchor, and `matchesDateRange` is the one place that reads them.
 *
 * `month` is the odd one out and carries no day count, because it is the
 * CALENDAR month rather than a rolling window. It exists so the "Signed this
 * month" card has somewhere to click into: the card sums `signedOn` by calendar
 * month (see signedValueInMonth), and "last 30 days" would have shown a
 * different set of rows than the figure above it counted.
 */
export const MONTH_RANGE = "month";
export const DATE_RANGES: { value: string; days?: number }[] = [
  { value: MONTH_RANGE },
  { value: "30", days: 30 },
  { value: "90", days: 90 },
  { value: "180", days: 180 },
  { value: "365", days: 365 },
];

/**
 * `expiring` and `depositsToClose` are TOGGLES, not values — the two jobs on
 * this screen rather than two ways of narrowing a list.
 *
 * Both exist because the number was already on a KPI card and there was no way
 * to see WHICH contracts it counted — you had to know the answer before you
 * could look it up, which is the opposite of a worklist. Every card on this
 * screen now sets one of these or a status chip.
 */
export const EMPTY_FILTERS = { kind: "", agent: "", dateRange: "", expiring: "", depositsToClose: "" };
export type ContractFilters = typeof EMPTY_FILTERS;

/** Does a contract fall inside a date-range preset? Measured on the SIGNING
    date, because that is the date the column shows and the date that matters —
    a draft has none and so never matches a range. */
export function matchesDateRange(c: ContractRecord, range: string, asOf: string = ANCHOR_ISO): boolean {
  if (!range) return true;
  if (!c.signedOn) return false;
  /* The calendar month, matched on the ISO prefix, exactly as
     signedValueInMonth slices it — one definition, so the card's figure and the
     rows it filters to can never drift apart. */
  if (range === MONTH_RANGE) return c.signedOn.slice(0, 7) === asOf.slice(0, 7);
  const days = DATE_RANGES.find((r) => r.value === range)?.days;
  if (!days) return true;
  const ago = Math.round((new Date(asOf).getTime() - new Date(c.signedOn).getTime()) / 86_400_000);
  return ago >= 0 && ago <= days;
}

/* ----------------------------------------------------------------------------
   KPI cards
   ------------------------------------------------------------------------- */

export interface ContractKpis {
  active: number;
  drafts: number;
  /** Active contracts inside their OWN notice window — see isExpiringSoon. The
      card and the row flag read the same function, so the count and the rows
      can never disagree. */
  expiring: number;
  /**
   * TENANCIES THAT ENDED WHILE WE WERE STILL HOLDING THE DEPOSIT.
   *
   * The outstanding item the whole deposit lifecycle exists for. A lease runs
   * out, the tenant moves on, and their money stays in the agency's account
   * with nothing anywhere saying so — until they ring up a year later. Derived
   * from dates and the deposit's own status; nothing rewrites a record at
   * midnight to produce it. See depositNeedsClosing.
   *
   * Not a card. The MONEY held sits on the finance report, where the rest of
   * the agency's balances are (see heldDeposits in _reports/money-data); the
   * COUNT is a filter toggle on this screen, because it is a job rather than a
   * headline. It had a card here for a while and that card is what pushed the
   * row to five — a number that never divides into a grid.
   */
  depositsToClose: number;
  signedThisMonth: Money;
  /** Contracts signed this month in some OTHER currency, and therefore not in
      the figure above. Shown as a footnote rather than converted — see
      signedValueInMonth. */
  excludedFromSigned: number;
}

/**
 * The four numbers across the top of the list.
 *
 * Scoped to whatever list is on screen, so an agent-scoped view counts only
 * their own — the same discipline the properties page uses for its KPIs.
 */
export function buildKpis(contracts: ContractRecord[], currency: CurrencyCode = PLATFORM_CURRENCY, asOf: string = ANCHOR_ISO): ContractKpis {
  const signed = signedValueInMonth(currency, asOf, contracts);
  return {
    active: contracts.filter((c) => isActive(c, asOf)).length,
    drafts: contracts.filter((c) => c.status === "draft").length,
    expiring: contracts.filter((c) => isExpiringSoon(c, asOf)).length,
    depositsToClose: contracts.filter((c) => depositNeedsClosing(c, asOf)).length,
    signedThisMonth: signed.total,
    excludedFromSigned: signed.excluded,
  };
}

export interface KpiCardDef {
  key: "active" | "drafts" | "expiring" | "signedThisMonth";
  icon: IconName;
  tone: StatTone;
}

/**
 * FOUR CARDS, AND EVERY ONE OF THEM IS A FILTER YOU CAN PRESS.
 *
 * That is the rule this row is built on, and it is why there are four. A fifth
 * card (deposits held) wrapped onto a second line at every width, because five
 * divides into nothing; it has gone to the finance report where the money
 * belongs. Four goes 4 / 2 / 1 cleanly from desktop to phone.
 *
 * The older row also counted things the table could not show. "Active
 * contracts" was a number with no matching status, no matching badge and no
 * matching chip — you could read it and had no way to go and look at it. Each
 * key below now names a status chip or a filter toggle, and the click-through
 * is wired in contracts-app.
 *
 * Expiring takes the gold (amber) tone rather than drafts: a draft is ordinary
 * work in progress, while a term running out is the only one of the four that
 * is a deadline. StatTone has no "warning", and gold is the closest thing to
 * one the card component offers.
 */
export const KPI_CARDS: KpiCardDef[] = [
  { key: "active", icon: "file-signature", tone: "brand" },
  { key: "drafts", icon: "file-pen", tone: "info" },
  { key: "expiring", icon: "calendar-clock", tone: "gold" },
  { key: "signedThisMonth", icon: "banknote", tone: "success" },
];

/* ----------------------------------------------------------------------------
   Row shape — everything the table needs, resolved once
   ------------------------------------------------------------------------- */

export interface ContractRow {
  contract: ContractRecord;
  propertyTitle: string;
  propertyId: string;
  /**
   * BOTH SIDES OF THE AGREEMENT, not only the side that pays.
   *
   * `ownerName` is the seller on a sale and the landlord on a tenancy — always
   * the property's owner, and always a member, because a property cannot be
   * listed without one. `counterparty` is the buyer or the tenant, and is the
   * only one of the two that can be missing: a draft written before a buyer was
   * found has nobody on the other side of it yet.
   *
   * The list named only the counterparty for a while, under the heading
   * "Counterparty" — which left half of every agreement off the screen, and
   * never said whether the person named was renting or buying. Both are named
   * now, each in the role THIS contract gives them.
   */
  ownerId: string;
  ownerName: string;
  counterparty: string | null;
  /** Set when the counterparty holds a member account, so the cell can link. */
  counterpartyId?: string;
  agentName: string;
  value: Money;
  /**
   * The two things about a contract that need somebody to DO something, both
   * derived from the calendar rather than stored.
   *
   *   expiring   inside its own stated notice window — the point at which a
   *              renewal has to be discussed. Derived per contract from
   *              `noticeDays`, not from one global number, because a lease that
   *              asks for ninety days' notice is not "expiring soon" at sixty.
   *   depositHeld the term ended and the deposit is still ours to deal with.
   *
   * ⚠ NO SCHEDULER. Nothing rewrites a record when a date passes; both are
   * computed when the list renders. See the note on expireLease in
   * ../_shared/contract-transitions.
   */
  expiring: boolean;
  depositHeld: boolean;
}

/** Resolve the display fields for one row. The names come off the live records
    rather than being stored on the contract (reference, not snapshot — see the
    header of _data/contracts), so a renamed member follows everywhere. */
/**
 * Is this tenancy inside its own notice window?
 *
 * The contract states how much notice a renewal needs (`noticeDays`, default
 * 30), and this reads that number off the contract rather than applying one
 * global window to all of them. A lease asking for ninety days' notice is not
 * "expiring soon" at sixty — it is already late.
 *
 * THE ONE DEFINITION. The KPI card, the filter toggle and the row badge all
 * call this. They used to disagree: the card counted a flat sixty-day window
 * while the row flagged the contract's own, so the card could say four and the
 * list show six. A headline number that does not match the rows under it is
 * worse than no headline number.
 */
export function isExpiringSoon(c: ContractRecord, asOf: string = ANCHOR_ISO): boolean {
  if (!isActive(c, asOf)) return false;
  const left = daysToExpiry(c, asOf);
  return left !== undefined && left >= 0 && left <= noticeDaysOf(c);
}

export function toRow(
  c: ContractRecord,
  propertyTitle: (id: string) => string,
  memberName: (id?: string) => string | undefined,
  agentName: (id: string) => string,
  asOf: string = ANCHOR_ISO,
): ContractRow {
  const linked = memberName(c.buyerId);
  return {
    contract: c,
    propertyTitle: propertyTitle(c.propertyId),
    propertyId: c.propertyId,
    ownerId: c.ownerId,
    /* Falls back to the id rather than to an empty cell: an owner whose name
       will not resolve is a data problem worth seeing, not one worth hiding. */
    ownerName: memberName(c.ownerId) ?? c.ownerId,
    counterparty: linked ?? null,
    counterpartyId: linked ? c.buyerId : undefined,
    agentName: agentName(c.agentId),
    value: contractValue(c),
    expiring: isExpiringSoon(c, asOf),
    depositHeld: depositNeedsClosing(c, asOf),
  };
}
