import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

export const ITEMS_PER_PAGE = 10;
export const TOTAL_PROPERTIES = 1486;

export interface KpiCard {
  key: string;
  label: string;
  icon: IconName;
  tone: StatTone;
  value: string;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", label: "Total properties", icon: "building-2", tone: "brand", value: "1,486", sub: "All listings on Chiya" },
  { key: "available", label: "Available properties", icon: "home", tone: "success", value: "942", sub: "Published & on market" },
  { key: "pending", label: "Pending approval", icon: "clock", tone: "gold", value: "18", sub: "Awaiting your review" },
  { key: "sold", label: "Sold properties", icon: "key", tone: "info", value: "388", sub: "Closed sales all-time" },
  { key: "rented", label: "Rented properties", icon: "key-round", tone: "brand", value: "156", sub: "Active rental contracts" },
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
export const CITY_OPTIONS = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk"];
export const PRICE_RANGES = ["Under $500K", "$500K – $1M", "Over $1M", "Under $2,000/mo", "Over $2,000/mo"];
export const DATE_PRESETS = ["Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months"];

export const STATUS_TABS = [
  { id: "all", label: "View all" },
  { id: "published", label: "Published" },
  { id: "sold", label: "Sold" },
  { id: "rented", label: "Rented" },
  { id: "pending", label: "Pending" },
];

export interface AgentRef {
  name: string;
  verified: boolean;
  img: string;
}
export interface PropertyRecord {
  id: string;
  title: string;
  area: string;
  city: string;
  type: string;
  img: string;
  owner: { name: string; contact: string; icon: IconName };
  agent: AgentRef | null;
  listing: "sale" | "rent";
  status: string;
  price: number;
  per?: string;
  date: string;
  daysAgo: number;
}

export function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

export const PROPERTIES: PropertyRecord[] = [
  { id: "CH-2041", title: "Olive Grove Estate", area: "Ankawa", city: "Erbil", type: "Villa", img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=240&q=70", owner: { name: "Karwan Mahmoud", contact: "+964 750 118 4420", icon: "phone" }, agent: { name: "Lana Aziz", verified: false, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Pending", price: 1200000, date: "Jun 12, 2026", daysAgo: 2 },
  { id: "CH-2038", title: "Marble Hill Villa", area: "Empire World", city: "Erbil", type: "Villa", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=240&q=70", owner: { name: "Sirwan Tofiq", contact: "+964 750 234 5678", icon: "phone" }, agent: { name: "Ahmed Karim", verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Published", price: 620000, date: "Jun 9, 2026", daysAgo: 5 },
  { id: "CH-2035", title: "Cedar Court Residence", area: "Italian Village", city: "Erbil", type: "Townhouse", img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=240&q=70", owner: { name: "Dashne Salar", contact: "+964 770 552 1190", icon: "phone" }, agent: { name: "Sara Hama", verified: true, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Sold", price: 845000, date: "Jun 6, 2026", daysAgo: 8 },
  { id: "CH-2031", title: "Tigris View Apartment", area: "Dream City", city: "Erbil", type: "Apartment", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=240&q=70", owner: { name: "Awat Rashid", contact: "+964 751 904 7782", icon: "phone" }, agent: { name: "Rawa Jalal", verified: true, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" }, listing: "rent", status: "Rented", price: 1800, per: "/mo", date: "Jun 4, 2026", daysAgo: 10 },
  { id: "CH-2029", title: "Naz City Penthouse", area: "Naz City", city: "Erbil", type: "Penthouse", img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&q=70", owner: { name: "Hewa Botan", contact: "+964 751 345 6789", icon: "phone" }, agent: { name: "Diyar Salih", verified: false, img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Published", price: 980000, date: "Jun 2, 2026", daysAgo: 12 },
  { id: "CH-2026", title: "Goizha Mountain House", area: "Goizha", city: "Sulaymaniyah", type: "Villa", img: "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=240&q=70", owner: { name: "Nyan Faraj", contact: "+964 773 220 5567", icon: "phone" }, agent: null, listing: "sale", status: "Draft", price: 540000, date: "Jun 1, 2026", daysAgo: 13 },
  { id: "CH-2022", title: "Park View Loft", area: "Salim Street", city: "Sulaymaniyah", type: "Apartment", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=240&q=70", owner: { name: "Shilan Aram", contact: "+964 770 456 7890", icon: "phone" }, agent: { name: "Hawre Ako", verified: true, img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" }, listing: "rent", status: "Published", price: 1100, per: "/mo", date: "May 28, 2026", daysAgo: 17 },
  { id: "CH-2018", title: "Family Mall Office Suite", area: "100m Road", city: "Erbil", type: "Office", img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=70", owner: { name: "Rebwar Group", contact: "+964 750 600 1234", icon: "phone" }, agent: { name: "Ahmed Karim", verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" }, listing: "rent", status: "Pending", price: 3200, per: "/mo", date: "May 26, 2026", daysAgo: 19 },
  { id: "CH-2014", title: "Zagros Garden Townhouse", area: "Masif", city: "Duhok", type: "Townhouse", img: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=240&q=70", owner: { name: "Berivan Khalid", contact: "+964 773 567 8901", icon: "phone" }, agent: { name: "Sara Hama", verified: true, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Published", price: 410000, date: "May 22, 2026", daysAgo: 23 },
  { id: "CH-2009", title: "Citadel Heights Land", area: "Qalat", city: "Erbil", type: "Land", img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=240&q=70", owner: { name: "Aland Property Co.", contact: "+964 751 778 9012", icon: "phone" }, agent: { name: "Diyar Salih", verified: false, img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Draft", price: 290000, date: "May 18, 2026", daysAgo: 27 },
  { id: "CH-2004", title: "Lakeside Apartment", area: "Dukan", city: "Sulaymaniyah", type: "Apartment", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=240&q=70", owner: { name: "Tara Jamal", contact: "+964 751 678 9012", icon: "phone" }, agent: { name: "Rawa Jalal", verified: true, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" }, listing: "sale", status: "Sold", price: 365000, date: "May 14, 2026", daysAgo: 31 },
];

export const AGENTS_LIST: AgentRef[] = Object.values(
  PROPERTIES.reduce<Record<string, AgentRef>>((acc, p) => {
    if (p.agent && !acc[p.agent.name]) acc[p.agent.name] = { ...p.agent };
    return acc;
  }, {}),
).sort((a, b) => a.name.localeCompare(b.name));

export const EMPTY_ADV = { type: "", city: "", agent: "", priceRange: "", dateAdded: "" };
export type AdvFilters = typeof EMPTY_ADV;
