import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import { VIEWINGS, PROPERTIES as VW_PROPS } from "../_viewings/data";
import { AGENTS as CAT_AGENTS, MEMBERS as CAT_MEMBERS, fmtUSD, getAgentByName, getPropertyById } from "../_data/catalog";

export const VIEW_STATUS_META: Record<string, { variant: BadgeVariant; icon: IconName; cls: string }> = {
  Requested: { variant: "info", icon: "clock", cls: "vwd-st--scheduled" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vwd-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vwd-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vwd-st--cancelled" },
  "No Show": { variant: "warning", icon: "user-x", cls: "vwd-st--noshow" },
};
export const VIEW_STATUS_DOT: Record<string, string> = {
  Requested: "var(--info-500)",
  Confirmed: "var(--success-500)",
  Completed: "var(--green-600)",
  Cancelled: "var(--error-500)",
  "No Show": "var(--warning-500)",
};
export const ROLE_META: Record<string, { variant: BadgeVariant }> = {
  Buyer: { variant: "info" },
  Seller: { variant: "success" },
  Landlord: { variant: "neutral" },
  Tenant: { variant: "brand" },
};

export interface ViewingDetail {
  id: string;
  status: string;
  date: string;
  dateLong: string;
  time: string;
  endTime: string;
  created: string;
  updated: string;
  contactMethod: string;
  contactIcon: IconName;
  meetingLocation: string;
  notes: string;
  reminderSent: boolean;
  reminderWhen: string;
  property: { id: string; name: string; location: string; listing: string; type: string; price: string; img: string };
  member: { id: string; name: string; role: string; phone: string; email: string };
  agent: { id: string; name: string; phone: string; email: string; experience: number; img: string; rating: number; reviews: number; verified: boolean };
}

export const VIEWING: ViewingDetail = {
  id: "VW-1025",
  status: "Requested",
  date: "Jun 16, 2026",
  dateLong: "Monday, June 16, 2026",
  time: "10:00 AM",
  endTime: "10:45 AM",
  created: "Jun 12, 2026 · 2:10 PM",
  updated: "Jun 15, 2026 · 9:02 AM",
  contactMethod: "Phone call",
  contactIcon: "phone",
  meetingLocation: "On-site — Marble Hill Villa, Ankawa",
  notes: "Member is relocating from Dubai and wants to see the master suite, the garden, and the rooftop terrace. Prefers a morning appointment and asked whether the price is negotiable.",
  reminderSent: true,
  reminderWhen: "Jun 15, 2026 · 9:00 AM",
  property: { id: "CH-1042", name: "Marble Hill Villa", location: "Ankawa, Erbil", listing: "For sale", type: "Villa", price: "$1,450,000", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=520&q=75" },
  member: { id: "MEM-1087", name: "Sara Hassan", role: "Buyer", phone: "+964 750 112 4408", email: "sara.hassan@gmail.com" },
  agent: { id: "A-2041", name: "Lana Aziz", phone: "+964 770 552 1190", email: "lana.aziz@chiya.estate", experience: 8, img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=75", rating: 4.9, reviews: 87, verified: true },
};

/* Resolve a real viewing (by id) into the rich detail shape, enriching the
   property / member / agent from the shared catalog. Falls back to the demo
   fixture above when the id isn't a generated viewing. */
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ABBR_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseDetailDate(s: string): Date | null {
  const m = /^([A-Za-z]+)\s+(\d+),\s*(\d+)$/.exec(s);
  if (!m) return null;
  const mi = ABBR_MONTHS.indexOf(m[1].slice(0, 3));
  if (mi < 0) return null;
  return new Date(Number(m[3]), mi, Number(m[2]));
}
function longDate(s: string): string {
  const d = parseDetailDate(s);
  return d ? `${WEEKDAYS[d.getDay()]}, ${FULL_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : s;
}
function addMinutes(time: string, mins: number): string {
  const m = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(time);
  if (!m) return time;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  const total = h * 60 + Number(m[2]) + mins;
  const H = Math.floor(total / 60) % 24;
  const M = total % 60;
  const ap = H < 12 ? "AM" : "PM";
  const h12 = H % 12 === 0 ? 12 : H % 12;
  return `${h12}:${String(M).padStart(2, "0")} ${ap}`;
}

/* Enrich a bare agent name into the viewing's rich agent shape, pulling real
   contact details from the catalog roster and deriving stable rating/experience
   figures from the name. Shared by getViewingDetail and the reassign flow. */
export function buildViewingAgent(name: string): ViewingDetail["agent"] {
  const catAgent = getAgentByName(name);
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return {
    id: catAgent?.id ?? VIEWING.agent.id,
    name,
    phone: catAgent?.phone ?? VIEWING.agent.phone,
    email: catAgent?.email ?? VIEWING.agent.email,
    experience: catAgent?.experience ? Number(String(catAgent.experience).replace(/\D/g, "")) || 5 : 3 + (h % 8),
    img: catAgent?.img ?? VIEWING.agent.img,
    rating: Number((4.4 + (h % 6) / 10).toFixed(1)),
    reviews: 20 + (h % 80),
    // Only verified agents can host a viewing, so the card is never "Pending".
    verified: true,
  };
}

/* Verified roster for the reassign picker (searchable). Unverified agents are
   excluded — only verified agents can be assigned. */
export interface AssignableAgent { name: string; img: string; verified: boolean }
export const ASSIGNABLE_AGENTS: AssignableAgent[] = CAT_AGENTS.filter((a) => a.verification === "Verified")
  .map((a) => ({
    name: a.name,
    img: a.img || "",
    verified: true,
  }))
  .sort((x, y) => x.name.localeCompare(y.name));

export function getViewingDetail(id: string): ViewingDetail {
  const real = VIEWINGS.find((x) => x.id === id);
  if (!real) return VIEWING;

  const comboProp = VW_PROPS.find((p) => p.title === real.property.title && p.location === real.property.location);
  const fullProp = comboProp ? getPropertyById(comboProp.id) : undefined;
  const catMember = CAT_MEMBERS.find((m) => m.name === real.member);

  return {
    ...VIEWING,
    id: real.id,
    status: real.status,
    date: real.date,
    dateLong: longDate(real.date),
    time: real.time,
    endTime: addMinutes(real.time, 45),
    meetingLocation: `On-site — ${real.property.title}, ${real.property.location}`,
    property: {
      id: comboProp?.id ?? VIEWING.property.id,
      name: real.property.title,
      location: real.property.location,
      listing: fullProp ? (fullProp.listing === "rent" ? "For rent" : "For sale") : VIEWING.property.listing,
      type: fullProp?.type ?? VIEWING.property.type,
      price: fullProp ? fmtUSD(fullProp.price) + (fullProp.per ?? "") : VIEWING.property.price,
      img: real.property.img,
    },
    member: {
      id: catMember?.id ?? VIEWING.member.id,
      name: real.member,
      role: catMember?.roles[0] ?? VIEWING.member.role,
      phone: catMember?.phone ?? VIEWING.member.phone,
      email: catMember?.email ?? VIEWING.member.email,
    },
    agent: buildViewingAgent(real.agent),
  };
}

export interface TLItem { icon: IconName; tone: string; title: string; desc: string; time: string; by: string }
export const TIMELINE: TLItem[] = [
  { icon: "bell", tone: "gold", title: "Reminder sent", desc: "Automated viewing reminder delivered to the member by SMS and email.", time: "Jun 15, 2026 · 9:00 AM", by: "System" },
  { icon: "user-plus", tone: "brand", title: "Agent assigned", desc: "Lana Aziz assigned to host this viewing.", time: "Jun 12, 2026 · 2:15 PM", by: "Rêbîn Kawa" },
  { icon: "calendar-plus", tone: "info", title: "Viewing created", desc: "Viewing appointment created for Marble Hill Villa.", time: "Jun 12, 2026 · 2:10 PM", by: "Rêbîn Kawa" },
];

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
export const INIT_NOTES: NoteItem[] = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 15, 2026 · 9:05 AM", kind: "note", text: "Serious buyer — pre-approved financing confirmed by the bank. Lana should bring the full spec sheet and the garden survey to the viewing." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 12, 2026 · 2:12 PM", kind: "review", text: "Member requested a morning slot. Confirmed 10:00 AM with the owner; gate access arranged with the building manager." },
];

export const NOTE_KIND: Record<string, { icon: IconName; cls: string }> = {
  approval: { icon: "circle-check", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" },
};

export function noteRoleLabel(role: string) {
  const r = (role || "").trim();
  if (!r) return "Note";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
}
