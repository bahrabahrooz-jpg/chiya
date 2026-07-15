import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import type { PropertyCounts } from "../_properties/data";

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
export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 1, icon: "file-plus-2", tone: "info", timeKey: "time.minsAgo", timeParams: { count: 2 }, params: { name: "Ahmed Karim" } },
  { id: 2, icon: "user-plus", tone: "gold", timeKey: "time.hrsAgo", timeParams: { count: 1 }, params: { name: "Sara Hama" } },
  { id: 3, icon: "badge-check", tone: "success", timeKey: "time.today", params: { place: "Empire World" } },
  { id: 4, icon: "key", tone: "brand", timeKey: "time.today", params: { name: "Marble Hill Villa" } },
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
  id: number;
  title: string;
  location: string;
  agent: string;
  status: string;
  img: string;
}
export const RECENT_PROPERTIES: RecentProperty[] = [
  { id: 1, title: "Olive Grove Estate", location: "Ankawa, Erbil", agent: "Lana Aziz", status: "Pending", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=200&q=70" },
  { id: 2, title: "Marble Hill Villa", location: "Empire World, Erbil", agent: "Ahmed Karim", status: "Published", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=70" },
  { id: 3, title: "Cedar Court Residence", location: "Italian Village, Erbil", agent: "Sara Hama", status: "Published", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=200&q=70" },
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
