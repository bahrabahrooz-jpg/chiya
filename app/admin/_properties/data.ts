import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

/* Records, types and selectors come from the shared catalog so the properties
   page, dashboard, locations, members and agents pages all agree. */
import { AGENTS as CAT_AGENTS, type Availability, type Publication, type PropertyRecord } from "../_data/catalog";
export {
  PROPERTIES,
  AGENTS_LIST,
  countProperties,
} from "../_data/catalog";
export type { PropertyRecord, AgentRef, OwnerRef, PropertyCounts, Publication, Availability } from "../_data/catalog";

/* Verified roster for the "Assign agent" quick action (searchable). Unverified
   agents are excluded — only verified agents can be assigned. */
export interface AssignableAgent { name: string; verified: boolean; img: string }
export const ASSIGNABLE_AGENTS: AssignableAgent[] = CAT_AGENTS.filter((a) => a.verification === "Verified")
  .map((a) => ({ name: a.name, verified: true, img: a.img || "" }))
  .sort((x, y) => x.name.localeCompare(y.name));

/* Assigned-agent filter — filter the table by assignment status only
   (Assigned / Unassigned), not by individual agent. */
export const AGENT_UNASSIGNED = "__unassigned__";
export const AGENT_ASSIGNED = "__assigned__";
export const AGENT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: AGENT_ASSIGNED, label: "Assigned" },
  { value: AGENT_UNASSIGNED, label: "Unassigned" },
];

export const ITEMS_PER_PAGE = 10;

export interface KpiCard {
  key: string;
  field: "total" | "available" | "pending" | "sold" | "rented";
  label: string;
  icon: IconName;
  tone: StatTone;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", field: "total", label: "Total properties", icon: "building-2", tone: "brand", sub: "All listings on Chiya" },
  { key: "available", field: "available", label: "Available properties", icon: "home", tone: "success", sub: "Published & on market" },
  { key: "pending", field: "pending", label: "Pending approval", icon: "clock", tone: "gold", sub: "Awaiting your review" },
  { key: "sold", field: "sold", label: "Sold properties", icon: "key", tone: "info", sub: "Closed sales all-time" },
  { key: "rented", field: "rented", label: "Rented properties", icon: "key-round", tone: "brand", sub: "Active rental contracts" },
];

export interface StatusMeta {
  variant: BadgeVariant;
  dot?: boolean;
  icon?: IconName;
}

/* ----------------------------------------------------------------------------
   Two fields, two tone maps.

   A property's badge used to come from one string. It now has two independent
   states, so it has two maps — and `toneFor` decides which one a single badge
   should show when there is only room for one. Availability wins there: what
   happened to the property matters more than who can see it.

   Availability carries the LOCK icon everywhere it appears. It is derived from
   deals and nothing in the UI can set it, and the icon is how a person learns
   that without having to be told.
   ------------------------------------------------------------------------- */

export const PUBLICATION_META: Record<Publication, StatusMeta> = {
  draft: { variant: "neutral", dot: true },
  pending: { variant: "warning", dot: true },
  published: { variant: "success", dot: true },
  unpublished: { variant: "neutral", icon: "eye-off" },
  archived: { variant: "neutral", icon: "archive" },
};

export const AVAILABILITY_META: Record<Availability, StatusMeta> = {
  available: { variant: "success", dot: true },
  reserved: { variant: "warning", icon: "lock" },
  sold: { variant: "error", icon: "lock" },
  rented: { variant: "info", icon: "lock" },
};

/** The single badge to show for a property in a list, where there is room for
    one. Availability first when something has happened to it; otherwise the
    publication state, which is the only thing left to say. */
export function toneFor(p: Pick<PropertyRecord, "publication" | "availability">): StatusMeta {
  if (p.availability !== "available") return AVAILABILITY_META[p.availability];
  return PUBLICATION_META[p.publication];
}

/** The catalog key for that same badge's label. */
export function labelKeyFor(p: Pick<PropertyRecord, "publication" | "availability">): string {
  return "status." + (p.availability !== "available" ? p.availability : p.publication);
}

/** @deprecated Keyed by the old single string. Use `toneFor`. */
export const STATUS_META: Record<string, StatusMeta> = {
  Draft: { variant: "neutral", dot: true },
  Pending: { variant: "warning", dot: true },
  Published: { variant: "success", dot: true },
  Unpublished: { variant: "neutral", icon: "eye-off" },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
  Archived: { variant: "neutral", icon: "archive" },
};

/**
 * What "Change visibility" may set. Sold and Rented are deliberately absent —
 * they are consequences of a deal, and no dropdown may reach them. Archived is
 * absent too: it has its own confirm flow.
 */
export const VISIBILITY_OPTIONS: Publication[] = ["draft", "pending", "published", "unpublished"];

/* The canonical agent rule lives in the shared catalog so every page agrees. */
export { AGENT_REQUIRED_STATUSES, statusRequiresAgent, requiresAgent } from "../_data/catalog";

export const STATUS_DOT_COLOR: Record<string, string> = {
  neutral: "var(--gray-400)",
  warning: "var(--warning-500)",
  success: "var(--success-500)",
  error: "var(--error-500)",
  info: "var(--info-500)",
  gold: "var(--gold-500)",
  brand: "var(--brand-primary)",
};

export const TYPE_OPTIONS = ["Apartment", "House", "Land", "Office", "Villa"];
export const CITY_OPTIONS = ["Erbil", "Sulaymaniyah", "Duhok"];
export const PRICE_RANGES = ["Under $500K", "$500K – $1M", "Over $1M", "Under $2,000/mo", "Over $2,000/mo"];
export const DATE_PRESETS = ["Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months"];

/**
 * The list's filter chips.
 *
 * They follow the SAME precedence as the badge (`toneFor`): availability first,
 * publication only for a property nothing has happened to. That is what keeps
 * the chips from overlapping — without it a sold property is both "Sold" and
 * "Unpublished", it appears under two chips, and the counts stop adding up
 * while the row's own badge says only one of the two words.
 *
 * So every property lands under exactly one chip, and every chip is reachable.
 * "Reserved" and "Unpublished" exist because the split created both states:
 * without a chip each, a held listing or one taken off the website would sit in
 * "View all" and nowhere else.
 */
export interface StatusTab {
  id: string;
  label: string;
  field: "publication" | "availability";
  value: Publication | Availability;
}
export const STATUS_TABS: ({ id: "all"; label: string } | StatusTab)[] = [
  { id: "all", label: "View all" },
  { id: "published", label: "Published", field: "publication", value: "published" },
  { id: "reserved", label: "Reserved", field: "availability", value: "reserved" },
  { id: "sold", label: "Sold", field: "availability", value: "sold" },
  { id: "rented", label: "Rented", field: "availability", value: "rented" },
  { id: "pending", label: "Pending", field: "publication", value: "pending" },
  { id: "draft", label: "Draft", field: "publication", value: "draft" },
  { id: "unpublished", label: "Unpublished", field: "publication", value: "unpublished" },
];

/** Does a property belong under this chip? Availability first, exactly as
    `toneFor` decides which word the row's badge shows. */
export function matchesTab(p: Pick<PropertyRecord, "publication" | "availability">, tabId: string): boolean {
  if (tabId === "all") return true;
  const tab = STATUS_TABS.find((t) => t.id === tabId);
  if (!tab || !("field" in tab)) return true;
  if (tab.field === "availability") return p.availability === tab.value;
  // A publication chip describes a property nothing has happened to yet.
  return p.availability === "available" && p.publication === tab.value;
}

export const EMPTY_ADV = { type: "", city: "", agent: "", priceRange: "", dateAdded: "" };
export type AdvFilters = typeof EMPTY_ADV;
