import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

import type { AgentRecord } from "../_data/catalog";
export { AGENTS } from "../_data/catalog";
export type { AgentRecord };

export const AGENTS_PER_PAGE = 10;

/* KPI tiles — values come from the live agent counts (see AgentsApp). */
export interface KpiCard {
  key: string;
  field: "total" | "verified" | "pending";
  label: string;
  icon: IconName;
  tone: StatTone;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", field: "total", label: "Total agents", icon: "badge-check", tone: "brand", sub: "Across all cities" },
  { key: "verified", field: "verified", label: "Verified agents", icon: "shield-check", tone: "success", sub: "ID-checked · active" },
  { key: "pending", field: "pending", label: "Pending verification", icon: "clock", tone: "gold", sub: "Awaiting document review" },
];

export const VERIFICATION: Record<string, { variant: BadgeVariant; icon: IconName; label: string }> = {
  Verified: { variant: "brand", icon: "badge-check", label: "Verified" },
  Pending: { variant: "warning", icon: "clock", label: "Pending" },
};
export const VERIFICATION_TABS = [
  { id: "", label: "View all" },
  { id: "Verified", label: "Verified" },
  { id: "Pending", label: "Pending" },
];

export const AGENT_STATUS: Record<string, { variant: BadgeVariant; dot: boolean }> = {
  Active: { variant: "success", dot: true },
  Suspended: { variant: "error", dot: true },
};
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok"];

export const EXPERIENCE_OPTIONS = [
  { value: "<1", label: "Less than 1 year", labelKey: "admin.aem.exp.lt1" },
  { value: "1-2", label: "1–2 years", labelKey: "admin.aem.exp.1to2" },
  { value: "3-5", label: "3–5 years", labelKey: "admin.aem.exp.3to5" },
  { value: "6-10", label: "6–10 years", labelKey: "admin.aem.exp.6to10" },
  { value: "10+", label: "10+ years", labelKey: "admin.aem.exp.10plus" },
];
export const LANGUAGE_OPTIONS = ["English", "Kurdish", "Arabic", "Turkish", "Persian"];
export const SERVICE_AREA_OPTIONS = ["Erbil", "Ankawa", "Dream City", "Italian Village", "Gulan", "Empire", "Sulaymaniyah", "Duhok", "Halabja", "Zakho"];

export const EMPTY_FILTERS = { q: "", verification: "", city: "", listings: "", status: "" };
export type AgentFilters = typeof EMPTY_FILTERS;

export function deriveAreas(a: AgentRecord): string[] {
  const set: string[] = [];
  [a.area, a.city].forEach((x) => {
    if (SERVICE_AREA_OPTIONS.includes(x) && !set.includes(x)) set.push(x);
  });
  if (set.length === 0) set.push("Erbil");
  return set;
}
