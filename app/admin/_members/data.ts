import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { AGENTS } from "../_data/catalog";

export { MEMBERS } from "../_data/catalog";
export type { MemberRecord } from "../_data/catalog";

export const ITEMS_PER_PAGE = 10;

/* KPI tiles — values come from the live member counts (see MembersApp). */
export interface KpiCard {
  key: string;
  field: "total" | "buyers" | "sellers" | "landlords" | "tenants";
  label: string;
  icon: IconName;
  tone: StatTone;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", field: "total", label: "Total members", icon: "users", tone: "brand", sub: "All registered accounts" },
  { key: "buyers", field: "buyers", label: "Buyers", icon: "search", tone: "info", sub: "Actively looking to buy" },
  { key: "sellers", field: "sellers", label: "Sellers", icon: "tag", tone: "success", sub: "Listing to sell" },
  { key: "landlords", field: "landlords", label: "Landlords", icon: "building-2", tone: "gold", sub: "Renting out property" },
  { key: "tenants", field: "tenants", label: "Tenants", icon: "key-round", tone: "brand", sub: "Currently renting" },
];

export const ROLE_META: Record<string, { cls: string }> = {
  Buyer: { cls: "mp-role--buyer" },
  Seller: { cls: "mp-role--seller" },
  Landlord: { cls: "mp-role--landlord" },
  Tenant: { cls: "mp-role--tenant" },
};
export const ROLE_OPTIONS = ["Buyer", "Seller", "Landlord", "Tenant"];
export const ROLE_TABS = [{ id: "", label: "All" }, ...ROLE_OPTIONS.map((r) => ({ id: r, label: r }))];

export const MEMBER_STATUS: Record<string, { variant: BadgeVariant; dot: boolean }> = {
  Active: { variant: "success", dot: true },
  Suspended: { variant: "error", dot: true },
};

export interface AmAgent {
  id: string;
  name: string;
  area: string;
  phone: string;
  img: string;
}
/* Relationship-agent picker for the add-member modal — the verified roster.
   Agents without a photo render as initials (never someone else's portrait). */
export const AM_AGENTS: AmAgent[] = AGENTS.filter((a) => a.verification === "Verified").map((a) => ({
  id: a.id,
  name: a.name,
  area: `${a.city} · ${a.area}`,
  phone: a.phone,
  img: a.img || "",
}));

export const MP_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MP_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MP_WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const MP_TODAY = new Date(2026, 5, 18);
export const fmtDate = (d: Date) => MP_MONTHS_SHORT[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
export const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const EMPTY_FILTERS = { q: "", role: "", status: "", date: null as Date | null };
export type MemberFilters = typeof EMPTY_FILTERS;
