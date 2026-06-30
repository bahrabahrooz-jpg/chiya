import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";

export const ROLE_META: Record<string, { variant: BadgeVariant }> = {
  Buyer: { variant: "info" },
  Seller: { variant: "success" },
  Landlord: { variant: "neutral" },
  Tenant: { variant: "brand" },
};
export const PROP_STATUS_META: Record<string, { variant: BadgeVariant; dot?: boolean; icon?: IconName }> = {
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
  Pending: { variant: "warning", dot: true },
  Archived: { variant: "neutral", icon: "archive" },
};
export const VIEW_STATUS_META: Record<string, { variant: BadgeVariant; icon?: IconName; cls?: string }> = {
  Pending: { variant: "warning", icon: "clock", cls: "vw-st--pending" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vw-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vw-st--cancelled" },
};

export interface MemberAgent { name: string; verified: boolean; phone: string; email: string; img: string; agency?: string; listings?: number; rating?: string; reviews?: number }
export const AGENT: MemberAgent = {
  name: "Lana Aziz", verified: true, phone: "+964 751 880 2200", email: "lana.aziz@mail.chiya.estate",
  img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=70",
  agency: "Chiya Premier", listings: 14, rating: "4.9", reviews: 87,
};

export interface MemberRecord {
  id: string; name: string; status: string; types: string[]; joinedShort: string; joinedFull: string;
  email: string; phone: string; language: string; contactMethod: string; img: string; agent: MemberAgent;
}
export const MEMBER: MemberRecord = {
  id: "MEM-2041",
  name: "Ahmed Karim",
  status: "Active",
  types: ["Buyer", "Seller", "Landlord"],
  joinedShort: "Jan 2026",
  joinedFull: "January 14, 2026",
  email: "ahmed.karim@gmail.com",
  phone: "+964 750 441 7788",
  language: "Kurdish (Sorani)",
  contactMethod: "Phone call",
  img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=75",
  agent: AGENT,
};

const TH = (w: string) => "https://images.unsplash.com/" + w + "?auto=format&fit=crop&w=160&q=70";

export interface PortfolioRow { id: string; title: string; loc: string; img: string; rel: string; status: string; price: string; per?: string; agent: string; date: string }
export const PORTFOLIO: PortfolioRow[] = [
  { id: "CH-2041", title: "Olive Grove Estate", loc: "Ankawa, Erbil", img: TH("photo-1613490493576-7fde63acd811"), rel: "Seller", status: "Published", price: "$1,200,000", agent: "Lana Aziz", date: "Jun 12, 2026" },
  { id: "CH-2035", title: "Cedar Court Residence", loc: "Italian Village, Erbil", img: TH("photo-1568605114967-8130f3a36994"), rel: "Seller", status: "Sold", price: "$845,000", agent: "Sara Hama", date: "Jun 6, 2026" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"), rel: "Buyer", status: "Sold", price: "$980,000", agent: "Lana Aziz", date: "May 30, 2026" },
  { id: "CH-2022", title: "Park View Loft", loc: "Salim Street, Sulaymaniyah", img: TH("photo-1502672260266-1c1ef2d93688"), rel: "Landlord", status: "Rented", price: "$1,100", per: "/mo", agent: "Hawre Ako", date: "May 28, 2026" },
  { id: "CH-2017", title: "Empire Tower Suite", loc: "Empire World, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"), rel: "Landlord", status: "Published", price: "$1,650", per: "/mo", agent: "Lana Aziz", date: "May 21, 2026" },
  { id: "CH-2008", title: "Lakeside Apartment", loc: "Dukan, Sulaymaniyah", img: TH("photo-1560448204-e02f11c3d0e2"), rel: "Buyer", status: "Pending", price: "$365,000", agent: "Lana Aziz", date: "Jun 15, 2026" },
];

export interface MpfViewing { id: string; title: string; loc: string; img: string; requested: string; agent: string; status: string }
export const VIEWINGS: MpfViewing[] = [
  { id: "CH-2038", title: "Marble Hill Villa", loc: "Empire World, Erbil", img: TH("photo-1600596542815-ffad4c1539a9"), requested: "Jun 24, 2026 · 14:00", agent: "Ahmed Karim", status: "Confirmed" },
  { id: "CH-2026", title: "Goizha Mountain House", loc: "Goizha, Sulaymaniyah", img: TH("photo-1599809275671-b5942cabc7a2"), requested: "Jun 22, 2026 · 11:30", agent: "Lana Aziz", status: "Pending" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"), requested: "Jun 8, 2026 · 16:00", agent: "Lana Aziz", status: "Completed" },
  { id: "CH-2014", title: "Zagros Garden Townhouse", loc: "Masif, Duhok", img: TH("photo-1576941089067-2de3c901e126"), requested: "Jun 5, 2026 · 10:00", agent: "Sara Hama", status: "Completed" },
  { id: "CH-2009", title: "Citadel Heights Land", loc: "Qalat, Erbil", img: TH("photo-1500382017468-9049fed747ef"), requested: "May 30, 2026 · 13:00", agent: "Diyar Salih", status: "Cancelled" },
];

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
export const INIT_NOTES: NoteItem[] = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 16, 2026 · 10:18", kind: "review", text: "High-value member managing both sale and rental portfolios. Verified ID and ownership documents on file. Eligible for the premium concierge tier." },
  { author: "Lana Aziz", role: "Agent", time: "Jun 11, 2026 · 15:42", kind: "note", text: "Spoke with Ahmed about listing the Olive Grove Estate. He prefers phone contact in the afternoons and responds quickly. Photography for the villa is scheduled." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jan 14, 2026 · 09:05", kind: "approval", text: "Account approved and onboarded. Assigned Lana Aziz as the primary relationship agent." },
];

export interface TLItem { icon: IconName; tone: string; title: string; desc: string; time: string }
export const TIMELINE: TLItem[] = [
  { icon: "shopping-bag", tone: "info", title: "Inquiry submitted", desc: "Purchase offer sent for Lakeside Apartment.", time: "Jun 17, 2026" },
  { icon: "calendar-plus", tone: "brand", title: "Viewing requested", desc: "Requested a viewing for Marble Hill Villa.", time: "Jun 16, 2026" },
  { icon: "heart", tone: "gold", title: "Property saved", desc: "Saved Marble Hill Villa to favourites.", time: "Jun 16, 2026" },
  { icon: "building-2", tone: "brand", title: "Property listed", desc: "Listed Olive Grove Estate for sale at $1,200,000.", time: "Jun 12, 2026" },
  { icon: "key", tone: "error", title: "Property sold", desc: "Cedar Court Residence sold for $845,000.", time: "Jun 6, 2026" },
  { icon: "circle-check", tone: "success", title: "Property purchased", desc: "Completed purchase of Naz City Penthouse.", time: "May 30, 2026" },
  { icon: "key-round", tone: "info", title: "Property rented", desc: "Park View Loft rented out at $1,100/mo.", time: "May 28, 2026" },
  { icon: "user-check", tone: "brand", title: "Agent assigned", desc: "Lana Aziz assigned as the relationship agent.", time: "Jan 14, 2026" },
  { icon: "user-plus", tone: "neutral", title: "Account created", desc: "Member registered on Chiya Estate.", time: "Jan 14, 2026" },
];

export const REASSIGN_AGENTS: MemberAgent[] = [
  AGENT,
  { name: "Ahmed Karim", verified: true, phone: "+964 750 441 7788", email: "ahmed.karim@mail.chiya.estate", img: TH("photo-1507003211169-0a1dd7228f2d") },
  { name: "Sara Hama", verified: true, phone: "+964 770 220 9911", email: "sara.hama@mail.chiya.estate", img: TH("photo-1438761681033-6461ffad8d80") },
  { name: "Rawa Jalal", verified: true, phone: "+964 751 330 6655", email: "rawa.jalal@mail.chiya.estate", img: TH("photo-1500648767791-00dcc994a43e") },
  { name: "Hawre Ako", verified: true, phone: "+964 770 118 9090", email: "hawre.ako@mail.chiya.estate", img: TH("photo-1506794778202-cad84cf45f1d") },
];

export const NOTE_KIND: Record<string, { icon: IconName; cls: string }> = {
  approval: { icon: "circle-check", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" },
};
export const STATUS_DOT: Record<string, string> = { Active: "var(--success-500)", Suspended: "var(--error-500)" };
