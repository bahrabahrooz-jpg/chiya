import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { PROPERTIES as CAT_PROPS, MEMBERS as CAT_MEMBERS, AGENTS as CAT_AGENTS, deriveMemberRoles } from "../_data/catalog";

export const VIEWINGS_PER_PAGE = 10;

/* ---------------- bookable slots ----------------
   Viewings are booked in fixed 1-hour slots during working hours; Fridays are
   closed. This is the single source of truth shared by every booking surface
   (public PDP, admin/agent scheduler, mobile) so the experience is identical. */
export const VIEWING_SLOTS = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const VIEWING_SLOT_SET = new Set(VIEWING_SLOTS);
/** True when a "HH:MM" value is one of the offered viewing slots. */
export function isViewingSlot(time: string): boolean {
  return VIEWING_SLOT_SET.has(time);
}
/** Fridays (getDay() === 5) are closed — no viewings can be booked. */
export function isClosedDay(d: Date): boolean {
  return d.getDay() === 5;
}
export type DayStatus = "partial" | "full";

export const VIEWING_STATUS: Record<string, { variant: BadgeVariant; icon: IconName; cls: string }> = {
  Requested: { variant: "info", icon: "clock", cls: "vw-st--scheduled" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vw-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vw-st--cancelled" },
  "No Show": { variant: "warning", icon: "user-x", cls: "vw-st--noshow" },
};
export const STATUSES = Object.keys(VIEWING_STATUS);
export const STATUS_TABS = [{ id: "", label: "All" }, ...STATUSES.map((s) => ({ id: s, label: s }))];

/* ---------------- combo picker sources (drawn from the shared catalog) ---------------- */
export interface ComboProperty { id: string; title: string; location: string; img: string }
export const PROPERTIES: ComboProperty[] = CAT_PROPS.map((p) => ({ id: p.id, title: p.title, location: `${p.area}, ${p.city}`, img: p.img }));

export interface ComboMember { id: string; name: string; phone: string; email: string }
export const MEMBERS: ComboMember[] = CAT_MEMBERS.map((m) => ({ id: m.id, name: m.name, phone: m.phone, email: m.email }));

export interface ComboAgent { id: string; name: string; phone: string; img: string }
/* Only verified agents can host viewings, so an unverified agent is never
   assignable in the schedule form or generated onto a viewing. */
const VERIFIED_CAT_AGENTS = CAT_AGENTS.filter((a) => a.verification === "Verified");
/* Photo comes straight from the roster; agents without one show initials. */
export const AGENTS: ComboAgent[] = VERIFIED_CAT_AGENTS.map((a) => ({ id: a.id, name: a.name, phone: a.phone, img: a.img || "" }));

export const AGENT_IMG: Record<string, string> = Object.fromEntries(AGENTS.map((a) => [a.name, a.img]));

/* ---------------- viewings (generated from real properties / members / agents) ---------------- */
export interface ViewingRecord {
  id: string;
  property: { title: string; location: string; img: string };
  member: string;
  agent: string;
  date: string;
  time: string;
  status: string;
}

const GEN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/* Generated viewings sit on the same fixed hourly slots the booking pickers
   offer, so an existing record always maps back to a selectable slot on edit. */
const GEN_TIMES = VIEWING_SLOTS.map((s) => fmtTimeLabel(s)!);
const GEN_TODAY = new Date(2026, 5, 30);
function gvDate(offset: number): string {
  const d = new Date(GEN_TODAY);
  d.setDate(d.getDate() + offset);
  if (isClosedDay(d)) d.setDate(d.getDate() + 1); // no Friday viewings — bump to Saturday
  return `${GEN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* Hand-curated viewings (13) — every status at least once, spread across
   today / upcoming / past so each KPI card is non-zero. Six belong to the
   TOP_AGENT (Lana Aziz) so the agent console's schedule looks populated.
   Property title/location/img are looked up from the curated catalog by id,
   so they can never drift out of sync; a bad id throws at module load. */
interface ViewingSpec {
  id: string;
  propertyId: string;
  member: string;
  agent: string;
  offset: number; // days from "today" (negative = past); Fridays auto-bump
  slot: number; // index into VIEWING_SLOTS
  status: string;
}
const VIEWING_SPECS: ViewingSpec[] = [
  { id: "VW-1100", propertyId: "CH-3200", member: "Dara Kamal", agent: "Lana Aziz", offset: 0, slot: 1, status: "Confirmed" },
  { id: "VW-1099", propertyId: "CH-3199", member: "Sara Amin", agent: "Lana Aziz", offset: 2, slot: 3, status: "Requested" },
  { id: "VW-1098", propertyId: "CH-3194", member: "Avan Mustafa", agent: "Sara Hama", offset: 5, slot: 0, status: "Confirmed" },
  { id: "VW-1097", propertyId: "CH-3192", member: "Aland Tariq", agent: "Rawa Jamal", offset: 9, slot: 5, status: "Requested" },
  { id: "VW-1096", propertyId: "CH-3198", member: "Zana Ibrahim", agent: "Lana Aziz", offset: -3, slot: 2, status: "Completed" },
  { id: "VW-1095", propertyId: "CH-3197", member: "Dara Kamal", agent: "Karwan Mahmoud", offset: -6, slot: 4, status: "Completed" },
  { id: "VW-1094", propertyId: "CH-3193", member: "Sara Amin", agent: "Sara Hama", offset: -8, slot: 6, status: "Cancelled" },
  { id: "VW-1093", propertyId: "CH-3191", member: "Avan Mustafa", agent: "Rawa Jamal", offset: -10, slot: 1, status: "No Show" },
  { id: "VW-1092", propertyId: "CH-3196", member: "Aland Tariq", agent: "Karwan Mahmoud", offset: -1, slot: 7, status: "Completed" },
  { id: "VW-1091", propertyId: "CH-3187", member: "Berivan Salar", agent: "Lana Aziz", offset: -4, slot: 3, status: "Completed" },
  { id: "VW-1090", propertyId: "CH-3190", member: "Avan Mustafa", agent: "Lana Aziz", offset: 1, slot: 2, status: "Requested" },
  { id: "VW-1089", propertyId: "CH-3183", member: "Sara Amin", agent: "Lana Aziz", offset: -12, slot: 5, status: "Cancelled" },
  /* Hosted by Diyar Salih before his suspension — grounds his review (RV-4189).
     He is Verified (suspension is a status, not a verification state), so the
     verified-agent guard accepts him. */
  { id: "VW-1088", propertyId: "CH-3196", member: "Berivan Salar", agent: "Diyar Salih", offset: -45, slot: 2, status: "Completed" },
];
function buildViewings(): ViewingRecord[] {
  return VIEWING_SPECS.map((s) => {
    const p = CAT_PROPS.find((cp) => cp.id === s.propertyId);
    if (!p) throw new Error(`viewings: unknown property "${s.propertyId}"`);
    if (!CAT_MEMBERS.some((m) => m.name === s.member)) throw new Error(`viewings: unknown member "${s.member}"`);
    if (!VERIFIED_CAT_AGENTS.some((a) => a.name === s.agent)) throw new Error(`viewings: agent "${s.agent}" is not a verified agent`);
    return {
      id: s.id,
      property: { title: p.title, location: `${p.area}, ${p.city}`, img: p.img },
      member: s.member,
      agent: s.agent,
      date: gvDate(s.offset),
      time: GEN_TIMES[s.slot],
      status: s.status,
    };
  });
}
export const VIEWINGS: ViewingRecord[] = buildViewings();
export const TOTAL_VIEWINGS = VIEWINGS.length;

/* Roles are derived from property links, so a member with no links carries no
   role — they're a prospective looker. A looker must at least appear in one
   viewing; a member with zero activity anywhere is a seed bug. */
for (const m of CAT_MEMBERS) {
  if (deriveMemberRoles(m.name, CAT_PROPS).length === 0 && !VIEWINGS.some((v) => v.member === m.name)) {
    throw new Error(`viewings: member "${m.name}" has no property link and no viewing — dead seed record`);
  }
}

/* Filter option lists — the agents, properties and locations in viewings. */
export const AGENTS_LIST: string[] = [...new Set(VIEWINGS.map((v) => v.agent))].sort();
export const PROPS_LIST: string[] = [...new Set(VIEWINGS.map((v) => v.property.title))].sort();
export const CITIES_LIST: string[] = [...new Set(VIEWINGS.map((v) => v.property.location.split(",").pop()!.trim()))].sort();

/* Live KPI counts derived from a viewings list — so add / delete / status
   changes update the cards (see ViewingsApp). */
export interface ViewKpiCounts { total: number; today: number; upcoming: number; completed: number; cancelled: number }
function parseViewDate(s: string): Date | null {
  const m = /^([A-Za-z]+)\s+(\d+),\s*(\d+)$/.exec(s);
  if (!m) return null;
  const mi = GEN_MONTHS.indexOf(m[1].slice(0, 3));
  if (mi < 0) return null;
  return new Date(Number(m[3]), mi, Number(m[2]));
}
export function computeViewingKpis(list: ViewingRecord[]): ViewKpiCounts {
  const c: ViewKpiCounts = { total: list.length, today: 0, upcoming: 0, completed: 0, cancelled: 0 };
  for (const v of list) {
    const d = parseViewDate(v.date);
    if (d) {
      const diff = Math.round((d.getTime() - GEN_TODAY.getTime()) / 86400000);
      if (diff === 0) c.today++;
      if (diff >= 1 && diff <= 7 && (v.status === "Requested" || v.status === "Confirmed")) c.upcoming++;
    }
    if (v.status === "Completed") c.completed++;
    if (v.status === "Cancelled" || v.status === "No Show") c.cancelled++;
  }
  return c;
}

export interface KpiCard {
  key: string;
  field: keyof ViewKpiCounts;
  label: string;
  icon: IconName;
  tone: StatTone;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", field: "total", label: "Total viewings", icon: "calendar", tone: "brand", sub: "All time" },
  { key: "today", field: "today", label: "Scheduled today", icon: "calendar-check", tone: "info", sub: "Appointments today" },
  { key: "upcoming", field: "upcoming", label: "Upcoming", icon: "clock", tone: "gold", sub: "Next 7 days" },
  { key: "completed", field: "completed", label: "Completed", icon: "circle-check", tone: "success", sub: "Successfully conducted" },
  { key: "cancelled", field: "cancelled", label: "Cancelled", icon: "circle-x", tone: "brand", sub: "Including no-shows" },
];

export interface ScheduleForm {
  property: string | null;
  member: string | null;
  agent: string | null;
  date: string;
  time: string;
  contact: string;
  notes: string;
}
export const EMPTY_FORM: ScheduleForm = { property: null, member: null, agent: null, date: "", time: "", contact: "phone", notes: "" };

export interface RescheduleForm {
  date: string;
  time: string;
  agent: string | null;
  notify: boolean;
  reason: string;
}

export const EMPTY_FILTERS = { q: "", status: "", location: "", dateRange: "" };
export type ViewingFilters = typeof EMPTY_FILTERS;

export const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WD_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const CAL_DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
export const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
export const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);
export const MERIDIEM = ["AM", "PM"];

export function parseISODate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d);
}
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
export function fmtDateLabel(s: string): string | null {
  const d = parseISODate(s);
  if (!d) return null;
  return `${WD_ABBR[d.getDay()]}, ${d.getDate()} ${MONTHS_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}
export function fmtTimeLabel(s: string): string | null {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}
export function splitTime(value: string): { h: number | null; m: number | null; ap: string | null } {
  if (!value) return { h: null, m: null, ap: null };
  const [H, M] = value.split(":").map(Number);
  return { h: H % 12 === 0 ? 12 : H % 12, m: M, ap: H < 12 ? "AM" : "PM" };
}
export function composeTime(h: number | null, m: number | null, ap: string | null): string {
  if (h == null || m == null || !ap) return "";
  let H = h % 12;
  if (ap === "PM") H += 12;
  return `${String(H).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
export function fmtDateShort(s: string): string | null {
  const d = parseISODate(s);
  if (!d) return null;
  return `${MONTHS_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function viewingToForm(v: ViewingRecord): ScheduleForm {
  const prop = PROPERTIES.find((p) => p.title === v.property.title);
  const mem = MEMBERS.find((m) => m.name === v.member);
  const agt = AGENTS.find((a) => a.name === v.agent);
  let date = "";
  const dm = /^([A-Za-z]+)\s+(\d+),\s*(\d+)$/.exec(v.date || "");
  if (dm) {
    const mi = MONTHS_ABBR.indexOf(dm[1].slice(0, 3));
    if (mi >= 0) date = `${dm[3]}-${String(mi + 1).padStart(2, "0")}-${String(Number(dm[2])).padStart(2, "0")}`;
  }
  let time = "";
  const tm = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(v.time || "");
  if (tm) {
    let H = Number(tm[1]) % 12;
    if (/pm/i.test(tm[3])) H += 12;
    time = `${String(H).padStart(2, "0")}:${tm[2]}`;
  }
  return { ...EMPTY_FORM, property: prop ? prop.id : null, member: mem ? mem.id : null, agent: agt ? agt.id : null, date, time };
}
/** "9:00 AM" → "09:00" (24h slot value), or "" when unparseable. */
export function timeLabelToSlot(label: string): string {
  const tm = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(label || "");
  if (!tm) return "";
  let H = Number(tm[1]) % 12;
  if (/pm/i.test(tm[3])) H += 12;
  return `${String(H).padStart(2, "0")}:${tm[2]}`;
}

/** Reserved slots per ISO date + each day's booked/full status, for one
 *  property. Only live bookings (Requested / Confirmed) hold a slot; an
 *  optional viewing id is excluded so editing a record never blocks its own
 *  slot. Mirrors the public PDP's buildReservedIndex, scoped to a property. */
export interface PropertyReservedIndex {
  byDate: Map<string, Set<string>>;
  dayStatus: Map<string, DayStatus>;
}
const SLOT_HOLDING_STATUS = new Set(["Requested", "Confirmed"]);
export function buildPropertyReservedIndex(list: ViewingRecord[], propertyTitle: string | null, excludeId?: string): PropertyReservedIndex {
  const byDate = new Map<string, Set<string>>();
  if (propertyTitle) {
    for (const v of list) {
      if (v.id === excludeId) continue;
      if (v.property.title !== propertyTitle) continue;
      if (!SLOT_HOLDING_STATUS.has(v.status)) continue;
      const d = parseViewDate(v.date);
      const slot = timeLabelToSlot(v.time);
      if (!d || !isViewingSlot(slot)) continue;
      const iso = toISODate(d);
      let set = byDate.get(iso);
      if (!set) byDate.set(iso, (set = new Set()));
      set.add(slot);
    }
  }
  const dayStatus = new Map<string, DayStatus>();
  for (const [iso, set] of byDate) {
    dayStatus.set(iso, set.size >= VIEWING_SLOTS.length ? "full" : "partial");
  }
  return { byDate, dayStatus };
}

export function viewingToReschedule(v: ViewingRecord): RescheduleForm {
  const base = viewingToForm(v);
  return { date: base.date, time: base.time, agent: base.agent, notify: true, reason: "" };
}
