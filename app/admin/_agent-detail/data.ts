import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { type AgentRecord, type MemberRecord as CatalogMember, type PropertyRecord, MEMBERS as CAT_MEMBERS, daysAgoFrom } from "../_data/catalog";
import { VIEWINGS as ALL_VIEWINGS, type ViewingRecord } from "../_viewings/data";
import { REVIEWS as ALL_REVIEWS, type ReviewRecord } from "../_reviews/data";

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
export interface KpiCard { key: string; labelKey: string; value: number; percent?: boolean; icon: IconName; tone: StatTone; subKey: string }

export interface ListingRow { id: string; title: string; loc: string; img: string; propertyType: string; type: string; owner: string; status: string; price: number; per?: string; date: string }

export interface MemberRow { id: string; name: string; phone: string; img: string; roles: string[]; status: string; activity: string }

export interface AvViewing { id: string; title: string; loc: string; img: string; member: string; memberImg: string; when: string; status: string }

export interface Review { name: string; img: string | null; deal: { key: string; title: string } | null; stars: number; when: string; text: string }

export interface TLItem { icon: IconName; tone: string; titleKey: string; descKey: string; params?: Record<string, string>; price?: number; per?: string; time: string }

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
export const INIT_NOTES: NoteItem[] = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 18, 2026 · 11:24", kind: "review", text: "Top-performing senior consultant with a strong sale and rental pipeline across Erbil. Licence and ID documents verified and on file. Cleared for premium listings and high-value clients." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "May 30, 2026 · 16:10", kind: "note", text: "Closed the most recent sale ahead of schedule. Consistently responsive and keeps members updated. Consider for the featured-agent program next quarter." },
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

/* Reviews shown on an agent profile = approved reviews about that agent, from
   the shared reviews queue. Pending / Rejected submissions never surface here. */
export function approvedReviewsFor(name: string): ReviewRecord[] {
  return ALL_REVIEWS.filter((r) => r.agentName === name && r.status === "Approved");
}
/* Viewings shown on an agent profile = the shared viewings ledger filtered to
   this agent, so the schedule always matches the Viewings page. */
export function viewingsFor(name: string): ViewingRecord[] {
  return ALL_VIEWINGS.filter((v) => v.agent === name);
}

export function toDetailAgent(a: AgentRecord): AgentDetail {
  const h = hash(a.id);
  const reviews = approvedReviewsFor(a.name);
  const rating = reviews.length ? Number((reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)) : 0;
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
    rating,
    reviews: reviews.length,
    img: a.img || "", // no photo → initials, matching every other surface
  };
}

/** KPI tiles computed from the agent's live property stats + real viewings. */
export function buildKpis(a: AgentRecord): KpiCard[] {
  const deals = a.sold + a.rented;
  const viewings = viewingsFor(a.name).length;
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

/** Members this agent works with = owners of the listings they handle, plus
    the buyers / tenants they closed deals with. */
export function buildAgentMembers(properties: PropertyRecord[], members: CatalogMember[], name: string): MemberRow[] {
  const owners = new Set<string>();
  for (const p of properties) {
    if (p.agent?.name !== name) continue;
    owners.add(p.owner.name);
    if (p.buyer) owners.add(p.buyer);
    if (p.tenant) owners.add(p.tenant);
  }
  const byName: Record<string, CatalogMember> = {};
  for (const m of members) byName[m.name] = m;
  return [...owners].map((owner, i) => {
    const m = byName[owner];
    return {
      id: m?.id || "M-" + i,
      name: owner,
      phone: m?.phone || "—",
      img: m?.img || "",
      roles: m?.roles || [],
      status: m?.status === "Suspended" ? "Inactive" : "Active",
      activity: m?.joined || "—",
    };
  });
}

/** Viewing rows for this agent, drawn from the shared viewings ledger. The row
    id is the property id so the row action links to the real property page. */
export function buildAgentViewings(properties: PropertyRecord[], name: string): AvViewing[] {
  const memberImg = new Map(CAT_MEMBERS.map((m) => [m.name, m.img || ""]));
  const propId = new Map(properties.map((p) => [p.title, p.id]));
  return viewingsFor(name).map((v) => ({
    id: propId.get(v.property.title) || v.id,
    title: v.property.title,
    loc: v.property.location,
    img: v.property.img,
    member: v.member,
    memberImg: memberImg.get(v.member) || "",
    when: `${v.date} · ${v.time}`,
    status: v.status === "Requested" ? "Pending" : v.status === "No Show" ? "Cancelled" : v.status,
  }));
}

/** Review cards + star-distribution bars from this agent's approved reviews.
    Each card's "deal" line is resolved from the reviewer's real relationship
    with the agent: a listing of theirs the agent handles, else a viewing the
    agent hosted for them — so the context always matches live records. */
export function buildAgentReviews(properties: PropertyRecord[], name: string): { reviews: Review[]; bars: { star: number; pct: number }[] } {
  const list = approvedReviewsFor(name);
  const viewings = viewingsFor(name);
  const dealFor = (member: string): { key: string; title: string } | null => {
    const handled = properties.filter((p) => p.agent?.name === name);
    const owned = handled.filter((p) => p.owner.name === member);
    const closed = owned.find((p) => p.status === "Sold" || p.status === "Rented");
    if (closed) return { key: closed.status === "Sold" ? "admin.ad.deal.sold" : "admin.ad.deal.rented", title: closed.title };
    const bought = handled.find((p) => p.buyer === member);
    if (bought) return { key: "admin.ad.deal.bought", title: bought.title };
    const renting = handled.find((p) => p.tenant === member);
    if (renting) return { key: "admin.ad.deal.renting", title: renting.title };
    if (owned[0]) return { key: "admin.ad.deal.listed", title: owned[0].title };
    const viewed = viewings.find((v) => v.member === member);
    if (viewed) return { key: "admin.ad.deal.viewing", title: viewed.property.title };
    return null;
  };
  const reviews: Review[] = list.map((r) => ({
    name: r.memberName,
    img: r.memberImg,
    deal: dealFor(r.memberName),
    stars: r.stars,
    when: r.submitted,
    text: r.text,
  }));
  const bars = [5, 4, 3, 2, 1].map((star) => {
    const n = list.filter((r) => r.stars === star).length;
    return { star, pct: list.length ? Math.round((n / list.length) * 100) : 0 };
  });
  return { reviews, bars };
}

/** Activity timeline derived from this agent's real records: property
    assignments, closed sales / rentals (by last update), and completed
    viewings — newest first, capped to keep the card scannable. */
export function buildAgentTimeline(properties: PropertyRecord[], name: string): TLItem[] {
  interface Ev { item: TLItem; ago: number }
  const events: Ev[] = [];
  for (const p of properties) {
    if (p.agent?.name !== name) continue;
    events.push({ item: { icon: "building-2", tone: "brand", titleKey: "admin.ad.tl.property", descKey: "admin.ad.tl.propertyDesc", params: { title: p.title }, time: p.date }, ago: p.daysAgo });
    const updatedAgo = daysAgoFrom(p.updated);
    if (p.status === "Sold" && updatedAgo != null) {
      events.push({ item: { icon: "key", tone: "error", titleKey: "admin.ad.tl.sold", descKey: "admin.ad.tl.soldDesc", params: { title: p.title }, price: p.price, time: p.updated }, ago: updatedAgo });
    } else if (p.status === "Rented" && updatedAgo != null) {
      events.push({ item: { icon: "key-round", tone: "info", titleKey: "admin.ad.tl.rented", descKey: "admin.ad.tl.rentedDesc", params: { title: p.title }, price: p.price, per: p.per, time: p.updated }, ago: updatedAgo });
    }
  }
  for (const v of viewingsFor(name)) {
    if (v.status !== "Completed") continue;
    const ago = daysAgoFrom(v.date);
    if (ago == null || ago < 0) continue; // future viewings aren't history
    events.push({ item: { icon: "calendar-check", tone: "success", titleKey: "admin.ad.tl.viewing", descKey: "admin.ad.tl.viewingDesc", params: { title: v.property.title, member: v.member }, time: v.date }, ago });
  }
  events.sort((a, b) => a.ago - b.ago);
  const items = events.slice(0, 7).map((e) => e.item);
  // Anchor rows every agent shares — verification + account creation.
  items.push({ icon: "badge-check", tone: "gold", titleKey: "admin.ad.tl.verified", descKey: "admin.ad.tl.verifiedDesc", time: "Mar 14, 2023" });
  items.push({ icon: "user-round-plus", tone: "neutral", titleKey: "admin.ad.tl.created", descKey: "admin.ad.tl.createdDesc", time: "Mar 12, 2023" });
  return items;
}
