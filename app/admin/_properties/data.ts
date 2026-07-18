import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

/* Records, types and selectors come from the shared catalog so the properties
   page, dashboard, locations, members and agents pages all agree. */
import { AGENTS as CAT_AGENTS } from "../_data/catalog";
export {
  PROPERTIES,
  AGENTS_LIST,
  countProperties,
} from "../_data/catalog";
export type { PropertyRecord, AgentRef, OwnerRef, PropertyCounts } from "../_data/catalog";

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
export const STATUS_META: Record<string, StatusMeta> = {
  Draft: { variant: "neutral", dot: true },
  Pending: { variant: "warning", dot: true },
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
  Archived: { variant: "neutral", icon: "archive" },
};

export const STATUS_OPTIONS = Object.keys(STATUS_META).filter((s) => s !== "Archived");

/* A live listing (Published / Sold / Rented) must have an assigned agent —
   canonical rule lives in the shared catalog so every page agrees. */
export { AGENT_REQUIRED_STATUSES, statusRequiresAgent } from "../_data/catalog";

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

export const STATUS_TABS = [
  { id: "all", label: "View all" },
  { id: "published", label: "Published" },
  { id: "sold", label: "Sold" },
  { id: "rented", label: "Rented" },
  { id: "pending", label: "Pending" },
  { id: "draft", label: "Draft" },
];

export const EMPTY_ADV = { type: "", city: "", agent: "", priceRange: "", dateAdded: "" };
export type AdvFilters = typeof EMPTY_ADV;
