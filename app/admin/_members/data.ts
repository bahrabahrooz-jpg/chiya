import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

export const ITEMS_PER_PAGE = 10;
export const TOTAL_MEMBERS = 1248;

export interface KpiCard {
  key: string;
  label: string;
  icon: IconName;
  tone: StatTone;
  value: string;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", label: "Total members", icon: "users", tone: "brand", value: "12,480", sub: "All registered accounts" },
  { key: "buyers", label: "Buyers", icon: "search", tone: "info", value: "7,240", sub: "Actively looking to buy" },
  { key: "sellers", label: "Sellers", icon: "tag", tone: "success", value: "2,180", sub: "Listing to sell" },
  { key: "landlords", label: "Landlords", icon: "building-2", tone: "gold", value: "1,640", sub: "Renting out property" },
  { key: "tenants", label: "Tenants", icon: "key-round", tone: "brand", value: "1,420", sub: "Currently renting" },
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

export interface MemberRecord {
  id: string;
  name: string;
  roles: string[];
  phone: string;
  email: string;
  properties: number;
  joined: string;
  daysAgo: number;
  status: string;
  img: string | null;
}

export const MEMBERS: MemberRecord[] = [
  { id: "M-4821", name: "Karwan Mahmoud", roles: ["Buyer"], phone: "+964 750 118 4420", email: "karwan.mahmoud@gmail.com", properties: 6, joined: "Jun 11, 2026", daysAgo: 3, status: "Active", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4810", name: "Lana Aziz", roles: ["Seller", "Landlord"], phone: "+964 770 552 1190", email: "lana.aziz@outlook.com", properties: 4, joined: "Jun 8, 2026", daysAgo: 6, status: "Active", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4799", name: "Sirwan Tofiq", roles: ["Buyer"], phone: "+964 751 904 7782", email: "sirwan.t@gmail.com", properties: 0, joined: "Jun 5, 2026", daysAgo: 9, status: "Active", img: null },
  { id: "M-4783", name: "Dashne Salar", roles: ["Landlord"], phone: "+964 773 220 5567", email: "dashne.salar@gmail.com", properties: 11, joined: "Jun 2, 2026", daysAgo: 12, status: "Active", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4771", name: "Awat Rashid", roles: ["Tenant"], phone: "+964 750 600 1234", email: "awat.rashid@outlook.com", properties: 1, joined: "May 29, 2026", daysAgo: 16, status: "Suspended", img: null },
  { id: "M-4760", name: "Hewa Botan", roles: ["Seller"], phone: "+964 751 778 9012", email: "hewa.botan@outlook.com", properties: 2, joined: "May 26, 2026", daysAgo: 19, status: "Active", img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4748", name: "Nyan Faraj", roles: ["Buyer", "Tenant"], phone: "+964 770 415 6688", email: "nyan.faraj@gmail.com", properties: 3, joined: "May 22, 2026", daysAgo: 23, status: "Active", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4732", name: "Shilan Aram", roles: ["Landlord"], phone: "+964 751 209 3341", email: "shilan.aram@gmail.com", properties: 8, joined: "May 18, 2026", daysAgo: 27, status: "Active", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4719", name: "Berivan Khalid", roles: ["Landlord"], phone: "+964 773 884 2210", email: "berivan.k@gmail.com", properties: 14, joined: "May 14, 2026", daysAgo: 31, status: "Active", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4703", name: "Tara Jamal", roles: ["Buyer", "Seller"], phone: "+964 750 332 7799", email: "tara.jamal@outlook.com", properties: 5, joined: "May 9, 2026", daysAgo: 36, status: "Suspended", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=70" },
  { id: "M-4688", name: "Rebwar Aziz", roles: ["Tenant"], phone: "+964 751 660 1925", email: "rebwar.aziz@gmail.com", properties: 0, joined: "May 4, 2026", daysAgo: 41, status: "Active", img: null },
  { id: "M-4671", name: "Diyar Salih", roles: ["Seller"], phone: "+964 770 118 5540", email: "diyar.salih@outlook.com", properties: 9, joined: "Apr 28, 2026", daysAgo: 47, status: "Active", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
];

export interface AmAgent {
  id: string;
  name: string;
  area: string;
  phone: string;
  img: string;
}
export const AM_AGENTS: AmAgent[] = [
  { id: "A-21", name: "Lana Aziz", area: "Erbil · Ankawa", phone: "+964 770 552 1190", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=70" },
  { id: "A-18", name: "Karwan Mahmoud", area: "Erbil · Downtown", phone: "+964 750 118 4420", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { id: "A-15", name: "Dashne Salar", area: "Sulaymaniyah", phone: "+964 773 220 5567", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { id: "A-12", name: "Shilan Aram", area: "Erbil · Italian V.", phone: "+964 751 209 3341", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70" },
  { id: "A-09", name: "Diyar Salih", area: "Duhok", phone: "+964 770 118 5540", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
];

export const MP_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MP_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MP_WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const MP_TODAY = new Date(2026, 5, 18);
export const fmtDate = (d: Date) => MP_MONTHS_SHORT[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
export const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const EMPTY_FILTERS = { q: "", role: "", status: "", date: null as Date | null };
export type MemberFilters = typeof EMPTY_FILTERS;
