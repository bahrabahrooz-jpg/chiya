import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import { getAgentByName, daysAgoFrom, type AgentRecord, type MemberRecord as CatalogMember, type PropertyRecord } from "../_data/catalog";
import { VIEWINGS as ALL_VIEWINGS, AGENT_IMG } from "../_viewings/data";

export const ROLE_META: Record<string, { variant: BadgeVariant; cls: string }> = {
  Buyer: { variant: "info", cls: "mp-role--buyer" },
  Seller: { variant: "success", cls: "mp-role--seller" },
  Landlord: { variant: "neutral", cls: "mp-role--landlord" },
  Tenant: { variant: "brand", cls: "mp-role--tenant" },
};
export const PROP_STATUS_META: Record<string, { variant: BadgeVariant; dot?: boolean; icon?: IconName }> = {
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
  Pending: { variant: "warning", dot: true },
  // Member-relationship-only status: a "Sold" property shows as "Bought" from the
  // buyer's perspective. Intentionally NOT part of the global properties table.
  Bought: { variant: "brand", dot: true },
  Archived: { variant: "neutral", icon: "archive" },
};
export const VIEW_STATUS_META: Record<string, { variant: BadgeVariant; icon?: IconName; cls?: string }> = {
  Pending: { variant: "warning", icon: "clock", cls: "vw-st--pending" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vw-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vw-st--cancelled" },
};
// Mirrors the members table status badge so the profile header renders identically.
export const MEMBER_STATUS_META: Record<string, { variant: BadgeVariant; dot?: boolean }> = {
  Active: { variant: "success", dot: true },
  Suspended: { variant: "error", dot: true },
};

export interface MemberAgent { name: string; verified: boolean; phone: string; email: string; img: string; listings?: number; rating?: string; reviews?: number }

export interface MemberRecord {
  id: string; name: string; status: string; types: string[]; joinedShort: string; joinedFull: string;
  email: string; phone: string; language: string; contactMethod: string; img: string; agent: MemberAgent | null;
}

export interface PortfolioRow { id: string; title: string; loc: string; type: string; img: string; rel: string; status: string; price: number; per?: string; agent: string; agentImg: string; date: string }

export interface MpfViewing { id: string; title: string; loc: string; img: string; requested: string; agent: string; agentImg: string; status: string }

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
export const INIT_NOTES: NoteItem[] = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 16, 2026 · 10:18", kind: "review", text: "Verified ID and ownership documents on file. Eligible for the premium concierge tier." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jan 14, 2026 · 09:05", kind: "approval", text: "Account approved and onboarded." },
];

/* Timeline entries are i18n-keyed and parameterized so derived items localize
   like the rest of the admin. */
export interface TLItem { icon: IconName; tone: string; titleKey: string; descKey: string; params?: Record<string, string>; price?: number; per?: string; time: string }

/** Agents offered by the reassign modal = the live verified roster. */
export function buildReassignAgents(agents: AgentRecord[]): MemberAgent[] {
  return agents
    .filter((a) => a.verification === "Verified")
    .map((a) => ({ name: a.name, verified: true, phone: a.phone, email: a.email, img: a.img || "" }));
}

export const NOTE_KIND: Record<string, { icon: IconName; cls: string }> = {
  approval: { icon: "circle-check", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" },
};
export const STATUS_DOT: Record<string, string> = { Active: "var(--success-500)", Suspended: "var(--error-500)" };

/* ---------------- catalog resolvers (real, per-id data) ---------------- */
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ABBR_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseJoined(s: string): { short: string; full: string } {
  const m = /^([A-Za-z]+)\s+(\d+),\s*(\d+)$/.exec(s);
  if (!m) return { short: s, full: s };
  const mi = ABBR_MONTHS.indexOf(m[1].slice(0, 3));
  const full = mi >= 0 ? `${FULL_MONTHS[mi]} ${Number(m[2])}, ${m[3]}` : s;
  const short = mi >= 0 ? `${ABBR_MONTHS[mi]} ${m[3]}` : s;
  return { short, full };
}

/** The relationship agent for a member, by strength of the relationship: the
    agent on one of their listings, else the agent who closed their purchase /
    tenancy, else the agent who hosted a viewing for them; null when none. */
export function memberAgentFor(properties: PropertyRecord[], name: string): MemberAgent | null {
  const owned = properties.find((p) => p.owner.name === name && p.agent);
  const dealt = properties.find((p) => (p.buyer === name || p.tenant === name) && p.agent);
  const agentName = owned?.agent?.name ?? dealt?.agent?.name ?? ALL_VIEWINGS.find((v) => v.member === name)?.agent;
  if (!agentName) return null;
  const roster = getAgentByName(agentName);
  return {
    name: agentName,
    verified: roster ? roster.verification === "Verified" : true,
    phone: roster?.phone || "—",
    email: roster?.email || agentName.toLowerCase().replace(/\s+/g, ".") + "@chiya.estate",
    img: roster?.img || owned?.agent?.img || dealt?.agent?.img || AGENT_IMG[agentName] || "",
  };
}

export function toDetailMember(m: CatalogMember, properties: PropertyRecord[]): MemberRecord {
  const { short, full } = parseJoined(m.joined);
  return {
    id: m.id,
    name: m.name,
    status: m.status,
    types: m.roles,
    joinedShort: short,
    joinedFull: full,
    email: m.email,
    phone: m.phone,
    language: "Kurdish (Sorani)",
    contactMethod: "Phone call",
    img: m.img ?? "",
    agent: memberAgentFor(properties, m.name),
  };
}

/** Every property connected to this member: listings they own (seller /
    landlord side) plus properties they bought or rent (counterparty side).
    Bought / renting rows date from when the deal closed (p.updated). */
export function buildPortfolio(properties: PropertyRecord[], name: string): PortfolioRow[] {
  const row = (p: PropertyRecord, rel: string, date: string): PortfolioRow => ({
    id: p.id,
    title: p.title,
    loc: `${p.area}, ${p.city}`,
    type: p.type,
    img: p.img,
    rel,
    status: p.status,
    price: p.price,
    per: p.per,
    agent: p.agent?.name || "Unassigned",
    agentImg: p.agent?.img || "",
    date,
  });
  const rows: PortfolioRow[] = [];
  for (const p of properties) {
    if (p.owner.name === name) rows.push(row(p, p.listing === "rent" ? "Landlord" : "Seller", p.date));
    if (p.buyer === name) rows.push(row(p, "Buyer", p.updated));
    if (p.tenant === name) rows.push(row(p, "Tenant", p.updated));
  }
  return rows;
}

/* Shared viewings ledger status → member-profile badge vocabulary. */
const VIEW_SMAP: Record<string, string> = { Requested: "Pending", Confirmed: "Confirmed", Completed: "Completed", Cancelled: "Cancelled", "No Show": "Cancelled" };

/** Viewings this member requested, from the shared viewings ledger — the same
    records the Viewings page shows, so both surfaces always agree. */
export function buildMemberViewings(properties: PropertyRecord[], name: string): MpfViewing[] {
  const propId = new Map(properties.map((p) => [p.title, p.id]));
  return ALL_VIEWINGS.filter((v) => v.member === name).map((v) => ({
    id: propId.get(v.property.title) || v.id,
    title: v.property.title,
    loc: v.property.location,
    img: v.property.img,
    requested: `${v.date} · ${v.time}`,
    agent: v.agent,
    agentImg: AGENT_IMG[v.agent] || "",
    status: VIEW_SMAP[v.status] || v.status,
  }));
}

/** Activity timeline derived from this member's real records: their listings
    (listed / sold / rented), purchases and tenancies they closed, their
    viewing requests, agent assignment, and account creation — newest first. */
export function buildMemberTimeline(properties: PropertyRecord[], member: CatalogMember): TLItem[] {
  interface Ev { item: TLItem; ago: number }
  const events: Ev[] = [];
  for (const p of properties) {
    const updatedAgo = daysAgoFrom(p.updated);
    if (p.owner.name === member.name) {
      events.push({ item: { icon: "building-2", tone: "brand", titleKey: "admin.mp.tl.listed", descKey: p.listing === "rent" ? "admin.mp.tl.listedRentDesc" : "admin.mp.tl.listedSaleDesc", params: { title: p.title }, price: p.price, per: p.per, time: p.date }, ago: p.daysAgo });
      if (p.status === "Sold" && updatedAgo != null) {
        events.push({ item: { icon: "key", tone: "error", titleKey: "admin.mp.tl.sold", descKey: "admin.mp.tl.soldDesc", params: { title: p.title }, price: p.price, time: p.updated }, ago: updatedAgo });
      } else if (p.status === "Rented" && updatedAgo != null) {
        events.push({ item: { icon: "key-round", tone: "info", titleKey: "admin.mp.tl.rented", descKey: "admin.mp.tl.rentedDesc", params: { title: p.title }, price: p.price, per: p.per, time: p.updated }, ago: updatedAgo });
      }
    }
    if (p.buyer === member.name && updatedAgo != null) {
      events.push({ item: { icon: "circle-check", tone: "success", titleKey: "admin.mp.tl.purchased", descKey: "admin.mp.tl.purchasedDesc", params: { title: p.title }, price: p.price, time: p.updated }, ago: updatedAgo });
    }
    if (p.tenant === member.name && updatedAgo != null) {
      events.push({ item: { icon: "key-round", tone: "info", titleKey: "admin.mp.tl.moved", descKey: "admin.mp.tl.movedDesc", params: { title: p.title }, price: p.price, per: p.per, time: p.updated }, ago: updatedAgo });
    }
  }
  for (const v of ALL_VIEWINGS) {
    if (v.member !== member.name) continue;
    const ago = daysAgoFrom(v.date);
    if (ago == null) continue;
    if (v.status === "Completed" && ago >= 0) {
      events.push({ item: { icon: "calendar-check", tone: "success", titleKey: "admin.mp.tl.viewingDone", descKey: "admin.mp.tl.viewingDoneDesc", params: { title: v.property.title }, time: v.date }, ago });
    } else if (v.status === "Requested" || v.status === "Confirmed") {
      events.push({ item: { icon: "calendar-plus", tone: "brand", titleKey: "admin.mp.tl.viewingReq", descKey: "admin.mp.tl.viewingReqDesc", params: { title: v.property.title }, time: v.date }, ago: Math.max(ago, 0) });
    }
  }
  events.sort((a, b) => a.ago - b.ago);
  const items = events.slice(0, 7).map((e) => e.item);
  const agent = memberAgentFor(properties, member.name);
  if (agent) items.push({ icon: "user-check", tone: "brand", titleKey: "admin.mp.tl.agent", descKey: "admin.mp.tl.agentDesc", params: { name: agent.name }, time: member.joined });
  items.push({ icon: "user-plus", tone: "neutral", titleKey: "admin.mp.tl.created", descKey: "admin.mp.tl.createdDesc", time: member.joined });
  return items;
}
