import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

/* Records, types and selectors come from the shared catalog so the properties
   page, dashboard, locations, members and agents pages all agree. */
export {
  PROPERTIES,
  AGENTS_LIST,
  countProperties,
  fmtUSD,
} from "../_data/catalog";
export type { PropertyRecord, AgentRef, OwnerRef, PropertyCounts } from "../_data/catalog";

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

export const STATUS_DOT_COLOR: Record<string, string> = {
  neutral: "var(--gray-400)",
  warning: "var(--warning-500)",
  success: "var(--success-500)",
  error: "var(--error-500)",
  info: "var(--info-500)",
  gold: "var(--gold-500)",
  brand: "var(--brand-primary)",
};

export const TYPE_OPTIONS = ["Villa", "Apartment", "Penthouse", "Townhouse", "Office", "Land"];
export const CITY_OPTIONS = ["Erbil", "Sulaymaniyah", "Duhok"];
export const PRICE_RANGES = ["Under $500K", "$500K – $1M", "Over $1M", "Under $2,000/mo", "Over $2,000/mo"];
export const DATE_PRESETS = ["Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months"];

export const STATUS_TABS = [
  { id: "all", label: "View all" },
  { id: "published", label: "Published" },
  { id: "sold", label: "Sold" },
  { id: "rented", label: "Rented" },
  { id: "pending", label: "Pending" },
];

export const EMPTY_ADV = { type: "", city: "", agent: "", priceRange: "", dateAdded: "" };
export type AdvFilters = typeof EMPTY_ADV;
