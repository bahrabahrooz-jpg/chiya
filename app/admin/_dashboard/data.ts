import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import type { PropertyCounts } from "../_properties/data";
import { AGENTS as CATALOG_AGENTS, PROPERTIES as CATALOG_PROPERTIES } from "../_data/catalog";

/* KPI periods + cards (Section 2) */
export interface KpiPeriod {
  id: "today" | "week" | "month" | "year";
  label: string;
  short: string;
  compare: string;
}
export const KPI_PERIODS: KpiPeriod[] = [
  { id: "today", label: "Today", short: "Today", compare: "Compared to yesterday" },
  { id: "week", label: "This week", short: "Week", compare: "Compared to last week" },
  { id: "month", label: "This month", short: "Month", compare: "Compared to last month" },
  { id: "year", label: "This year", short: "Year", compare: "Compared to last year" },
];

export interface KpiCard {
  key: string;
  /** When set, the value is read live from the shared property counts so the
      dashboard always matches the Properties page (incl. sold/rented changes). */
  field?: keyof PropertyCounts;
  label: string;
  icon: IconName;
  tone: StatTone;
  values: Record<string, string>;
  delta: Record<string, string>;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", field: "total", label: "Total properties", icon: "building-2", tone: "brand", values: { today: "1,284", week: "1,284", month: "1,284", year: "1,284" }, delta: { today: "+0.3%", week: "+2.4%", month: "+6.8%", year: "+16.0%" } },
  { key: "available", field: "available", label: "Available properties", icon: "home", tone: "success", values: { today: "1,284", week: "1,284", month: "1,284", year: "1,284" }, delta: { today: "+0.2%", week: "+1.8%", month: "+5.2%", year: "+14.0%" } },
  { key: "sold", field: "sold", label: "Properties sold", icon: "key", tone: "gold", values: { today: "3", week: "18", month: "84", year: "1,042" }, delta: { today: "+0.6%", week: "+6.0%", month: "+12.0%", year: "+21.0%" } },
  { key: "rented", field: "rented", label: "Properties rented", icon: "home", tone: "info", values: { today: "5", week: "27", month: "132", year: "1,560" }, delta: { today: "+0.5%", week: "+4.0%", month: "+8.0%", year: "+11.0%" } },
];

/* Action required + recent activity (Section 3) */
export interface ActionItem {
  key: string;
  icon: IconName;
  tone: "brand" | "gold" | "info" | "success";
  title: string;
  unit: string;
  desc: string;
  cta: string;
}
export const ACTION_ITEMS: ActionItem[] = [
  { key: "properties", icon: "building-2", tone: "brand", title: "Pending property approvals", unit: "Listings waiting review", desc: "New agent submissions need your approval before they go live on Chiya.", cta: "Review listings" },
  { key: "agents", icon: "badge-check", tone: "gold", title: "Pending agent verifications", unit: "Applications waiting review", desc: "Confirm ID documents and credentials before agents can list properties.", cta: "Review agents" },
];

export interface ActivityItem {
  id: number;
  icon: IconName;
  tone: "brand" | "gold" | "info" | "success";
  /** i18n key for the line (e.g. "admin.dash.activity.1") + its interpolation params. */
  timeKey: string;
  timeParams?: { count: number };
  params?: Record<string, string | number>;
}
/* Names/places reference the curated catalog roster so the feed matches
   records visible on the other admin pages. */
export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 1, icon: "file-plus-2", tone: "info", timeKey: "time.minsAgo", timeParams: { count: 2 }, params: { name: "Karwan Mahmoud" } },
  { id: 2, icon: "user-plus", tone: "gold", timeKey: "time.hrsAgo", timeParams: { count: 1 }, params: { name: "Sara Hama" } },
  { id: 3, icon: "badge-check", tone: "success", timeKey: "time.today", params: { place: "Empire World" } },
  { id: 4, icon: "key", tone: "brand", timeKey: "time.today", params: { name: "Olive Grove Estate" } },
  { id: 5, icon: "shield-check", tone: "success", timeKey: "time.yesterday", params: { name: "Lana Aziz" } },
  { id: 6, icon: "calendar-check", tone: "info", timeKey: "time.yesterday", params: { count: 12, place: "Erbil" } },
];

/* Performance chart (Section 4) */
export const PERF_AXIS: Record<string, string[]> = {
  today: ["8a", "9a", "10a", "11a", "12p", "1p", "2p", "3p", "4p", "5p", "6p", "7p"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"],
  year: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export interface PerfSeries {
  key: string;
  label: string;
  color: string;
  data: Record<string, number[]>;
}
export const PERF_SERIES: PerfSeries[] = [
  { key: "listings", label: "New listings", color: "var(--green-700)", data: { today: [1, 0, 2, 1, 3, 2, 1, 2, 1, 0, 1, 0], week: [9, 11, 8, 13, 15, 12, 7], month: [48, 55, 62, 58, 66], year: [180, 195, 210, 230, 205, 240, 260, 250, 275, 290, 270, 310] } },
  { key: "sold", label: "Properties sold", color: "var(--gold-500)", data: { today: [0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 0, 0], week: [3, 4, 2, 5, 4, 6, 3], month: [18, 22, 26, 21, 24], year: [60, 66, 72, 80, 75, 84, 90, 86, 92, 98, 94, 104] } },
  { key: "rented", label: "Properties rented", color: "var(--info-600)", data: { today: [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0], week: [5, 6, 4, 7, 6, 8, 5], month: [30, 34, 38, 33, 40], year: [95, 102, 110, 120, 115, 125, 132, 128, 138, 145, 140, 152] } },
];

/* Recent properties + agents (Section 5) */
export const PROP_STATUS: Record<string, { variant: BadgeVariant; dot: boolean }> = {
  Pending: { variant: "warning", dot: true },
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
};

export interface RecentProperty {
  id: string;
  title: string;
  location: string;
  agent: string;
  agentImg: string;
  status: string;
  img: string;
}
/* Latest listed properties, resolved from the shared catalog by id so title /
   location / agent (name + photo) / status / thumbnail always match the
   Properties page, and the row links to the real property. */
const RECENT_PROPERTY_IDS = ["CH-3190", "CH-3200", "CH-3194", "CH-3183", "CH-3198"];
export const RECENT_PROPERTIES: RecentProperty[] = RECENT_PROPERTY_IDS.map((id) => {
  const p = CATALOG_PROPERTIES.find((cp) => cp.id === id);
  if (!p) throw new Error(`dashboard: unknown recent property "${id}"`);
  return { id: p.id, title: p.title, location: `${p.area}, ${p.city}`, agent: p.agent?.name ?? "Unassigned", agentImg: p.agent?.img ?? "", status: p.status, img: p.img };
});

export interface RecentAgent {
  id: string;
  name: string;
  team: string;
  verified: boolean;
  joined: string;
  img: string;
}
/* Recently joined agents, resolved from the shared roster by name so the
   photo / verification always match the Agents page (no photo → initials)
   and the row links to the real agent profile. */
const RECENT_AGENT_ROWS: { name: string; team: string; joined: string }[] = [
  { name: "Hana Rashid", team: "Independent agent · Duhok", joined: "Jun 12, 2026" },
  { name: "Bilal Noori", team: "Raparin Homes", joined: "Jun 10, 2026" },
  { name: "Sara Hama", team: "Independent agent", joined: "Jun 8, 2026" },
  { name: "Rawa Jamal", team: "Malta Properties", joined: "Jun 5, 2026" },
  { name: "Karwan Mahmoud", team: "Ankawa Estates", joined: "Jun 3, 2026" },
];
export const RECENT_AGENTS: RecentAgent[] = RECENT_AGENT_ROWS.map((r) => {
  const a = CATALOG_AGENTS.find((ca) => ca.name === r.name);
  if (!a) throw new Error(`dashboard: unknown recent agent "${r.name}"`);
  return { id: a.id, name: a.name, team: r.team, verified: a.verification === "Verified", joined: r.joined, img: a.img || "" };
});
