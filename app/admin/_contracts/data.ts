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
  depositsHeld,
  isActive,
  noticeDaysOf,
  signedValueInMonth,
  type ContractKind,
  type ContractRecord,
  type ContractStatus,
} from "../_data/contracts";

/* Records, types and selectors come from the shared data layer so this page,
   the contract detail screen and the property page all agree. */
export {
  CONTRACTS,
  contractValue,
  contractsByAgent,
  contractsByProperty,
  getContractById,
  invoicesByContract,
  isActive,
  outstandingForContract,
} from "../_data/contracts";
export type { ContractRecord, ContractKind, ContractStatus } from "../_data/contracts";
export { AGENTS, PROPERTIES, memberById, agentById } from "../_data/catalog";

export const ITEMS_PER_PAGE = 10;

/** How far ahead the "expiring soon" card looks. Sixty days is roughly the
    notice period a tenancy renewal needs to be agreed in — long enough to act,
    short enough that the number means something. */
export const EXPIRY_WINDOW_DAYS = 60;

/* ----------------------------------------------------------------------------
   Status and kind badges
   ------------------------------------------------------------------------- */

export interface StatusMeta {
  variant: BadgeVariant;
  dot?: boolean;
  icon?: IconName;
}

/**
 * Contract status tones. They deliberately match the property availability
 * tones a contract in that state produces (see availabilityForContract in
 * _data/property-state) — a signed sale is red on both screens, a draft is
 * amber on both — so the colour means the same thing wherever it is seen.
 */
export const STATUS_META: Record<ContractStatus, StatusMeta> = {
  draft: { variant: "warning", dot: true },
  signed: { variant: "success", icon: "file-signature" },
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

/** The list's status chips — every contract lands under exactly one, and
    every chip is reachable, because the four statuses are mutually exclusive. */
export const STATUS_TABS: ({ id: "all" } | { id: ContractStatus })[] = [
  { id: "all" },
  { id: "draft" },
  { id: "signed" },
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
 */
export const DATE_RANGES: { value: string; days: number }[] = [
  { value: "30", days: 30 },
  { value: "90", days: 90 },
  { value: "180", days: 180 },
  { value: "365", days: 365 },
];

export const EMPTY_FILTERS = { kind: "", agent: "", dateRange: "" };
export type ContractFilters = typeof EMPTY_FILTERS;

/** Does a contract fall inside a date-range preset? Measured on the SIGNING
    date, because that is the date the column shows and the date that matters —
    a draft has none and so never matches a range. */
export function matchesDateRange(c: ContractRecord, range: string, asOf: string = ANCHOR_ISO): boolean {
  if (!range) return true;
  if (!c.signedOn) return false;
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
  expiring: number;
  /**
   * TENANCIES THAT ENDED WHILE WE WERE STILL HOLDING THE DEPOSIT.
   *
   * The outstanding item the whole deposit lifecycle exists for. A lease runs
   * out, the tenant moves on, and their money stays in the agency's account
   * with nothing anywhere saying so — until they ring up a year later. Derived
   * from dates and the deposit's own status; nothing rewrites a record at
   * midnight to produce it. See depositNeedsClosing.
   */
  depositsToClose: number;
  /**
   * TOTAL DEPOSIT MONEY THE AGENCY IS SITTING ON.
   *
   * ⚠ A LIABILITY, NOT REVENUE, AND NEVER ADDED TO ONE. It is the tenants'
   * money in our account. It is given its own card, away from every income
   * figure, precisely so the two can never be read as one number — the failure
   * mode is not a wrong total, it is a total that looks entirely plausible.
   */
  depositsHeld: Money;
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
    expiring: contracts.filter((c) => {
      if (!isActive(c, asOf)) return false;
      const left = daysToExpiry(c, asOf);
      return left !== undefined && left >= 0 && left <= EXPIRY_WINDOW_DAYS;
    }).length,
    depositsToClose: contracts.filter((c) => depositNeedsClosing(c, asOf)).length,
    depositsHeld: depositsHeld(currency, contracts),
    signedThisMonth: signed.total,
    excludedFromSigned: signed.excluded,
  };
}

export interface KpiCardDef {
  key: "active" | "drafts" | "expiring" | "depositsHeld" | "signedThisMonth";
  icon: IconName;
  tone: StatTone;
}
/* Expiring takes the gold (amber) tone rather than drafts: a draft is ordinary
   work in progress, while a term running out is the only one of the four that
   is a deadline. StatTone has no "warning", and gold is the closest thing to
   one the card component offers. */
export const KPI_CARDS: KpiCardDef[] = [
  { key: "active", icon: "file-signature", tone: "brand" },
  { key: "drafts", icon: "file-pen", tone: "info" },
  { key: "expiring", icon: "calendar-clock", tone: "gold" },
  /* Deposits held earns a card rather than a footnote because it is money in
     the agency's account that belongs to somebody else. Its sub-line carries
     the count that actually needs acting on. */
  { key: "depositsHeld", icon: "wallet", tone: "gold" },
  { key: "signedThisMonth", icon: "banknote", tone: "success" },
];

/* ----------------------------------------------------------------------------
   Row shape — everything the table needs, resolved once
   ------------------------------------------------------------------------- */

export interface ContractRow {
  contract: ContractRecord;
  propertyTitle: string;
  propertyId: string;
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
 * 30). A lease asking for ninety days is not "expiring soon" when the KPI's
 * sixty-day window says so — it is already late. So the row flag reads the
 * contract, while the KPI card keeps its single window for a headline number.
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
    counterparty: linked ?? c.buyerExternal?.name ?? null,
    counterpartyId: linked ? c.buyerId : undefined,
    agentName: agentName(c.agentId),
    value: contractValue(c),
    expiring: isExpiringSoon(c, asOf),
    depositHeld: depositNeedsClosing(c, asOf),
  };
}
