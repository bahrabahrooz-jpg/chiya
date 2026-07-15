import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { type AgentRecord, type MemberRecord as CatalogMember, type PropertyRecord } from "../_data/catalog";

export const ROLE_META: Record<string, { variant: BadgeVariant; cls: string }> = {
  Buyer: { variant: "info", cls: "mp-role--buyer" },
  Seller: { variant: "success", cls: "mp-role--seller" },
  Landlord: { variant: "neutral", cls: "mp-role--landlord" },
  Tenant: { variant: "brand", cls: "mp-role--tenant" },
};
export const LISTING_STATUS_META: Record<string, { variant: BadgeVariant; dot?: boolean; icon?: IconName }> = {
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
  Pending: { variant: "warning", dot: true },
};
export const LISTING_TYPE_META: Record<string, { variant: BadgeVariant }> = {
  "For sale": { variant: "brand" },
  "For rent": { variant: "info" },
};
export const MEMBER_STATUS_META: Record<string, { variant: BadgeVariant; dot?: boolean; cls?: string }> = {
  Active: { variant: "success", dot: true, cls: "mp-statusbadge" },
  Inactive: { variant: "neutral", dot: true, cls: "mp-statusbadge" },
};
export const VIEW_STATUS_META: Record<string, { variant: BadgeVariant; icon?: IconName; cls?: string }> = {
  Pending: { variant: "warning", icon: "clock", cls: "vw-st--pending" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vw-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vw-st--cancelled" },
};

export interface AgentDetail {
  id: string;
  name: string;
  title: string;
  status: string;
  verification: string;
  joinedShort: string;
  joinedFull: string;
  phone: string;
  email: string;
  experience: number;
  languages: string[];
  areas: string[];
  rating: number;
  reviews: number;
  img: string;
}
export const AGENT: AgentDetail = {
  id: "A-2041",
  name: "Lana Aziz",
  title: "Senior Property Consultant",
  status: "Active",
  verification: "Verified",
  joinedShort: "Mar 2023",
  joinedFull: "March 12, 2023",
  phone: "+964 770 552 1190",
  email: "lana.aziz@chiya.estate",
  experience: 8,
  languages: ["Kurdish", "English", "Arabic"],
  areas: ["Ankawa", "Dream City", "Italian Village", "Empire World"],
  rating: 4.9,
  reviews: 64,
  img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=75",
};

export interface KpiCard { key: string; labelKey: string; value: number; percent?: boolean; icon: IconName; tone: StatTone; subKey: string }
export const KPIS: KpiCard[] = [
  { key: "active", labelKey: "admin.ad.kpi.active", value: 14, icon: "building-2", tone: "brand", subKey: "admin.ad.kpi.activeSub" },
  { key: "sold", labelKey: "admin.ad.kpi.sold", value: 32, icon: "badge-check", tone: "success", subKey: "admin.ad.kpi.soldSub" },
  { key: "rented", labelKey: "admin.ad.kpi.rented", value: 19, icon: "key-round", tone: "gold", subKey: "admin.ad.kpi.rentedSub" },
  { key: "viewings", labelKey: "admin.ad.kpi.viewings", value: 148, icon: "calendar-check", tone: "info", subKey: "admin.ad.kpi.viewingsSub" },
  { key: "conv", labelKey: "admin.ad.kpi.conv", value: 38, percent: true, icon: "trending-up", tone: "brand", subKey: "admin.ad.kpi.convSub" },
];

const TH = (w: string) => "https://images.unsplash.com/" + w + "?auto=format&fit=crop&w=160&q=70";

export interface ListingRow { id: string; title: string; loc: string; img: string; propertyType: string; type: string; owner: string; status: string; price: number; per?: string; date: string }
export const LISTINGS: ListingRow[] = [
  { id: "CH-2041", title: "Olive Grove Estate", loc: "Ankawa, Erbil", img: TH("photo-1613490493576-7fde63acd811"), propertyType: "Villa", type: "For sale", owner: "Rawa Jalal", status: "Published", price: 1200000, date: "Jun 12, 2026" },
  { id: "CH-2017", title: "Empire Tower Suite", loc: "Empire World, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"), propertyType: "Apartment", type: "For rent", owner: "Dilan Rashid", status: "Published", price: 1650, per: "/mo", date: "Jun 4, 2026" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"), propertyType: "Penthouse", type: "For sale", owner: "Sara Hama", status: "Sold", price: 980000, date: "May 30, 2026" },
  { id: "CH-2008", title: "Lakeside Apartment", loc: "Dukan, Sulaymaniyah", img: TH("photo-1560448204-e02f11c3d0e2"), propertyType: "Apartment", type: "For sale", owner: "Ahmed Karim", status: "Pending", price: 365000, date: "May 22, 2026" },
  { id: "CH-2022", title: "Park View Loft", loc: "Dream City, Erbil", img: TH("photo-1502672260266-1c1ef2d93688"), propertyType: "Apartment", type: "For rent", owner: "Dilan Rashid", status: "Rented", price: 1100, per: "/mo", date: "May 18, 2026" },
  { id: "CH-2035", title: "Cedar Court Residence", loc: "Italian Village, Erbil", img: TH("photo-1568605114967-8130f3a36994"), propertyType: "Villa", type: "For sale", owner: "Rawa Jalal", status: "Published", price: 845000, date: "May 9, 2026" },
];

export interface MemberRow { id: string; name: string; phone: string; img: string; roles: string[]; status: string; activity: string }
export const MEMBERS: MemberRow[] = [
  { id: "MEM-2041", name: "Ahmed Karim", phone: "+964 750 441 7788", img: TH("photo-1507003211169-0a1dd7228f2d"), roles: ["Buyer", "Seller"], status: "Active", activity: "Jun 17, 2026" },
  { id: "MEM-2033", name: "Dilan Rashid", phone: "+964 770 118 3320", img: TH("photo-1438761681033-6461ffad8d80"), roles: ["Landlord"], status: "Active", activity: "Jun 14, 2026" },
  { id: "MEM-2026", name: "Hawre Ako", phone: "+964 751 904 2218", img: TH("photo-1506794778202-cad84cf45f1d"), roles: ["Tenant"], status: "Active", activity: "Jun 9, 2026" },
  { id: "MEM-2014", name: "Sara Hama", phone: "+964 773 220 5567", img: TH("photo-1544005313-94ddf0286df2"), roles: ["Buyer"], status: "Inactive", activity: "May 28, 2026" },
  { id: "MEM-2009", name: "Rawa Jalal", phone: "+964 750 600 1234", img: TH("photo-1487412720507-e7ab37603c6f"), roles: ["Seller", "Landlord"], status: "Active", activity: "May 21, 2026" },
];

export interface AvViewing { id: string; title: string; loc: string; img: string; member: string; memberImg: string; when: string; status: string }
export const VIEWINGS: AvViewing[] = [
  { id: "CH-2041", title: "Olive Grove Estate", loc: "Ankawa, Erbil", img: TH("photo-1613490493576-7fde63acd811"), member: "Ahmed Karim", memberImg: TH("photo-1507003211169-0a1dd7228f2d"), when: "Jun 24, 2026 · 14:00", status: "Confirmed" },
  { id: "CH-2017", title: "Empire Tower Suite", loc: "Empire World, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"), member: "Hawre Ako", memberImg: TH("photo-1506794778202-cad84cf45f1d"), when: "Jun 22, 2026 · 11:30", status: "Pending" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"), member: "Dilan Rashid", memberImg: TH("photo-1438761681033-6461ffad8d80"), when: "Jun 8, 2026 · 16:00", status: "Completed" },
  { id: "CH-2035", title: "Cedar Court Residence", loc: "Italian Village, Erbil", img: TH("photo-1568605114967-8130f3a36994"), member: "Sara Hama", memberImg: TH("photo-1544005313-94ddf0286df2"), when: "Jun 5, 2026 · 10:00", status: "Completed" },
  { id: "CH-2022", title: "Park View Loft", loc: "Dream City, Erbil", img: TH("photo-1502672260266-1c1ef2d93688"), member: "Rawa Jalal", memberImg: TH("photo-1487412720507-e7ab37603c6f"), when: "May 30, 2026 · 13:00", status: "Cancelled" },
];

export const RATING_BARS = [
  { star: 5, pct: 86 }, { star: 4, pct: 10 }, { star: 3, pct: 3 }, { star: 2, pct: 1 }, { star: 1, pct: 0 },
];

export interface Review { name: string; deal: string; stars: number; when: string; text: string }
export const REVIEWS: Review[] = [
  { name: "Ahmed Karim", deal: "Bought Naz City Penthouse", stars: 5, when: "Jun 2026", text: "Lana made the entire purchase effortless. She knew every detail about the property and negotiated a fair price on my behalf." },
  { name: "Dilan Rashid", deal: "Listed Park View Loft", stars: 5, when: "May 2026", text: "Professional, responsive, and genuinely cares about getting the right tenant. My loft was rented within two weeks." },
  { name: "Sara Hama", deal: "Viewing — Cedar Court", stars: 4, when: "May 2026", text: "Punctual and knowledgeable during the viewing. Answered all of my questions clearly and followed up the same day." },
];

export interface TLItem { icon: IconName; tone: string; titleKey: string; descKey: string; params?: Record<string, string>; price?: number; per?: string; time: string }
export const TIMELINE: TLItem[] = [
  { icon: "refresh-cw", tone: "brand", titleKey: "admin.ad.tl.status", descKey: "admin.ad.tl.statusDesc", params: { status: "@status.active", by: "Rêbîn Kawa" }, time: "Jun 18, 2026" },
  { icon: "calendar-check", tone: "success", titleKey: "admin.ad.tl.viewing", descKey: "admin.ad.tl.viewingDesc", params: { title: "Naz City Penthouse", member: "Dilan Rashid" }, time: "Jun 8, 2026" },
  { icon: "key", tone: "error", titleKey: "admin.ad.tl.sold", descKey: "admin.ad.tl.soldDesc", params: { title: "Naz City Penthouse" }, price: 980000, time: "May 30, 2026" },
  { icon: "key-round", tone: "info", titleKey: "admin.ad.tl.rented", descKey: "admin.ad.tl.rentedDesc", params: { title: "Park View Loft" }, price: 1100, per: "/mo", time: "May 18, 2026" },
  { icon: "user-plus", tone: "brand", titleKey: "admin.ad.tl.member", descKey: "admin.ad.tl.memberDesc", params: { name: "Ahmed Karim" }, time: "May 14, 2026" },
  { icon: "building-2", tone: "brand", titleKey: "admin.ad.tl.property", descKey: "admin.ad.tl.propertyDesc", params: { title: "Cedar Court Residence" }, time: "May 9, 2026" },
  { icon: "pencil", tone: "neutral", titleKey: "admin.ad.tl.profile", descKey: "admin.ad.tl.profileDesc", time: "Apr 2, 2026" },
  { icon: "badge-check", tone: "gold", titleKey: "admin.ad.tl.verified", descKey: "admin.ad.tl.verifiedDesc", time: "Mar 14, 2023" },
  { icon: "user-round-plus", tone: "neutral", titleKey: "admin.ad.tl.created", descKey: "admin.ad.tl.createdDesc", time: "Mar 12, 2023" },
];

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
export const INIT_NOTES: NoteItem[] = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 18, 2026 · 11:24", kind: "review", text: "Top-performing senior consultant with a strong sale and rental pipeline across Erbil. Licence and ID documents verified and on file. Cleared for premium listings and high-value clients." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "May 30, 2026 · 16:10", kind: "note", text: "Closed the Naz City Penthouse sale ahead of schedule. Consistently responsive and keeps members updated. Consider for the featured-agent program next quarter." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Mar 14, 2023 · 09:05", kind: "approval", text: "Agent profile approved and verified. Assigned to the Chiya Prime team as a Senior Property Consultant." },
];

export const NOTE_KIND: Record<string, { icon: IconName; cls: string }> = {
  approval: { icon: "circle-check", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" },
};
export const STATUS_DOT: Record<string, string> = { Active: "var(--success-500)", Suspended: "var(--error-500)" };

/* ---------------- catalog resolvers (real, per-id data) ---------------- */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function toDetailAgent(a: AgentRecord): AgentDetail {
  const h = hash(a.id);
  return {
    id: a.id,
    name: a.name,
    title: a.verification === "Verified" ? "Senior Property Consultant" : "Property Consultant",
    status: a.status,
    verification: a.verification,
    joinedShort: "Mar 2023",
    joinedFull: "March 12, 2023",
    phone: a.phone,
    email: a.email,
    experience: a.experience ? Number(String(a.experience).replace(/\D/g, "")) || 5 : 3 + (h % 8),
    languages: a.languages && a.languages.length ? a.languages : ["Kurdish", "English"],
    areas: a.areas && a.areas.length ? a.areas : [a.area, a.city].filter((x, i, arr) => x && arr.indexOf(x) === i),
    rating: Number((4.4 + (h % 6) / 10).toFixed(1)),
    reviews: 20 + (h % 80),
    img: a.img || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=75",
  };
}

/** KPI tiles computed from the agent's live property stats. */
export function buildKpis(a: AgentRecord): KpiCard[] {
  const deals = a.sold + a.rented;
  const viewings = deals * 4 + a.listings * 2;
  const conv = viewings ? Math.round((deals / viewings) * 100) : 0;
  return [
    { key: "active", labelKey: "admin.ad.kpi.active", value: a.listings, icon: "building-2", tone: "brand", subKey: "admin.ad.kpi.activeSub" },
    { key: "sold", labelKey: "admin.ad.kpi.sold", value: a.sold, icon: "badge-check", tone: "success", subKey: "admin.ad.kpi.soldSub" },
    { key: "rented", labelKey: "admin.ad.kpi.rented", value: a.rented, icon: "key-round", tone: "gold", subKey: "admin.ad.kpi.rentedSub" },
    { key: "viewings", labelKey: "admin.ad.kpi.viewings", value: viewings, icon: "calendar-check", tone: "info", subKey: "admin.ad.kpi.viewingsSub" },
    { key: "conv", labelKey: "admin.ad.kpi.conv", value: conv, percent: true, icon: "trending-up", tone: "brand", subKey: "admin.ad.kpi.convSub" },
  ];
}

/** Listings assigned to this agent. */
export function buildListings(properties: PropertyRecord[], name: string): ListingRow[] {
  return properties
    .filter((p) => p.agent?.name === name)
    .map((p) => ({
      id: p.id,
      title: p.title,
      loc: `${p.area}, ${p.city}`,
      img: p.img,
      propertyType: p.type,
      type: p.listing === "rent" ? "For rent" : "For sale",
      owner: p.owner.name,
      status: p.status,
      price: p.price,
      per: p.per,
      date: p.date,
    }));
}

/** Members this agent works with = owners of the listings they handle. */
export function buildAgentMembers(properties: PropertyRecord[], members: CatalogMember[], name: string): MemberRow[] {
  const owners = new Set<string>();
  for (const p of properties) if (p.agent?.name === name) owners.add(p.owner.name);
  const byName: Record<string, CatalogMember> = {};
  for (const m of members) byName[m.name] = m;
  return [...owners].map((owner, i) => {
    const m = byName[owner];
    return {
      id: m?.id || "M-" + i,
      name: owner,
      phone: m?.phone || "—",
      img: m?.img || TH("photo-1507003211169-0a1dd7228f2d"),
      roles: m?.roles || ["Seller"],
      status: m?.status === "Suspended" ? "Inactive" : "Active",
      activity: m?.joined || "—",
    };
  });
}
