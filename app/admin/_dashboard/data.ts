import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

/* KPI periods + cards (Section 2) */
export interface KpiPeriod {
  id: "week" | "month" | "year";
  label: string;
  short: string;
  compare: string;
}
export const KPI_PERIODS: KpiPeriod[] = [
  { id: "week", label: "This week", short: "Week", compare: "Compared to last week" },
  { id: "month", label: "This month", short: "Month", compare: "Compared to last month" },
  { id: "year", label: "This year", short: "Year", compare: "Compared to last year" },
];

export interface KpiCard {
  key: string;
  label: string;
  icon: IconName;
  tone: StatTone;
  values: Record<string, string>;
  delta: Record<string, string>;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "available", label: "Available properties", icon: "building-2", tone: "brand", values: { week: "1,284", month: "1,284", year: "1,284" }, delta: { week: "+1.8%", month: "+5.2%", year: "+14.0%" } },
  { key: "sold", label: "Properties sold", icon: "key", tone: "gold", values: { week: "18", month: "84", year: "1,042" }, delta: { week: "+6.0%", month: "+12.0%", year: "+21.0%" } },
  { key: "rented", label: "Properties rented", icon: "home", tone: "info", values: { week: "27", month: "132", year: "1,560" }, delta: { week: "+4.0%", month: "+8.0%", year: "+11.0%" } },
  { key: "members", label: "New members", icon: "users", tone: "success", values: { week: "21", month: "96", year: "1,180" }, delta: { week: "+9.0%", month: "+15.0%", year: "+18.0%" } },
];

/* Action required + recent activity (Section 3) */
export interface ActionItem {
  key: string;
  icon: IconName;
  tone: "brand" | "gold" | "info" | "success";
  title: string;
  count: string;
  unit: string;
  desc: string;
  cta: string;
}
export const ACTION_ITEMS: ActionItem[] = [
  { key: "properties", icon: "building-2", tone: "brand", title: "Pending property approvals", count: "18", unit: "Listings waiting review", desc: "New agent submissions need your approval before they go live on Chiya.", cta: "Review listings" },
  { key: "agents", icon: "badge-check", tone: "gold", title: "Pending agent verifications", count: "7", unit: "Applications waiting review", desc: "Confirm ID documents and credentials before agents can list properties.", cta: "Review agents" },
];

export interface ActivityPart {
  b?: string;
  t?: string;
}
export interface ActivityItem {
  id: number;
  icon: IconName;
  tone: "brand" | "gold" | "info" | "success";
  time: string;
  parts: ActivityPart[];
}
export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 1, icon: "file-plus-2", tone: "info", time: "2 minutes ago", parts: [{ b: "Ahmed Karim" }, { t: " submitted a new property" }] },
  { id: 2, icon: "user-plus", tone: "gold", time: "1 hour ago", parts: [{ b: "Sara Hama" }, { t: " registered as an agent" }] },
  { id: 3, icon: "badge-check", tone: "success", time: "Today", parts: [{ t: "Villa in " }, { b: "Empire World" }, { t: " was approved" }] },
  { id: 4, icon: "key", tone: "brand", time: "Today", parts: [{ b: "Marble Hill Villa" }, { t: " was marked as sold" }] },
  { id: 5, icon: "shield-check", tone: "success", time: "Yesterday", parts: [{ b: "Lana Aziz" }, { t: "’s agent profile was verified" }] },
  { id: 6, icon: "calendar-check", tone: "info", time: "Yesterday", parts: [{ t: "12 viewings confirmed across " }, { b: "Erbil" }] },
];

/* Performance chart (Section 4) */
export const PERF_AXIS: Record<string, string[]> = {
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
  { key: "listings", label: "New listings", color: "var(--green-700)", data: { week: [9, 11, 8, 13, 15, 12, 7], month: [48, 55, 62, 58, 66], year: [180, 195, 210, 230, 205, 240, 260, 250, 275, 290, 270, 310] } },
  { key: "sold", label: "Properties sold", color: "var(--gold-500)", data: { week: [3, 4, 2, 5, 4, 6, 3], month: [18, 22, 26, 21, 24], year: [60, 66, 72, 80, 75, 84, 90, 86, 92, 98, 94, 104] } },
  { key: "rented", label: "Properties rented", color: "var(--info-600)", data: { week: [5, 6, 4, 7, 6, 8, 5], month: [30, 34, 38, 33, 40], year: [95, 102, 110, 120, 115, 125, 132, 128, 138, 145, 140, 152] } },
  { key: "members", label: "New members", color: "var(--green-300)", data: { week: [4, 5, 3, 6, 5, 7, 4], month: [22, 26, 30, 25, 29], year: [70, 75, 82, 88, 84, 92, 96, 93, 100, 108, 104, 116] } },
];

/* Recent properties + agents (Section 5) */
export const PROP_STATUS: Record<string, { variant: BadgeVariant; dot: boolean }> = {
  "Pending Approval": { variant: "warning", dot: true },
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
};

export interface RecentProperty {
  id: number;
  title: string;
  location: string;
  agent: string;
  status: string;
  img: string;
}
export const RECENT_PROPERTIES: RecentProperty[] = [
  { id: 1, title: "Olive Grove Estate", location: "Ankawa, Erbil", agent: "Lana Aziz", status: "Pending Approval", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=200&q=70" },
  { id: 2, title: "Marble Hill Villa", location: "Empire World, Erbil", agent: "Ahmed Karim", status: "Published", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=70" },
  { id: 3, title: "Cedar Court Residence", location: "Italian Village, Erbil", agent: "Sara Hama", status: "Sold", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=200&q=70" },
  { id: 4, title: "Tigris View Apartment", location: "Dream City, Erbil", agent: "Rawa Jalal", status: "Rented", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=70" },
  { id: 5, title: "Naz City Penthouse", location: "Naz City, Erbil", agent: "Diyar Salih", status: "Published", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=200&q=70" },
];

export interface RecentAgent {
  id: number;
  name: string;
  team: string;
  verified: boolean;
  joined: string;
  img: string;
}
export const RECENT_AGENTS: RecentAgent[] = [
  { id: 1, name: "Lana Aziz", team: "Chiya Select · Erbil", verified: false, joined: "Jun 12, 2026", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { id: 2, name: "Ahmed Karim", team: "Empire Realty", verified: true, joined: "Jun 10, 2026", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { id: 3, name: "Sara Hama", team: "Independent agent", verified: true, joined: "Jun 8, 2026", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { id: 4, name: "Rawa Jalal", team: "Dream City Homes", verified: true, joined: "Jun 5, 2026", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { id: 5, name: "Diyar Salih", team: "Naz Properties", verified: false, joined: "Jun 3, 2026", img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
];
