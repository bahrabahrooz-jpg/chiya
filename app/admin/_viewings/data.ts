import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { PROPERTIES as CAT_PROPS, MEMBERS as CAT_MEMBERS, AGENTS as CAT_AGENTS } from "../_data/catalog";

export const VIEWINGS_PER_PAGE = 10;
const FALLBACK_PORTRAIT = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&q=80";

export const VIEWING_STATUS: Record<string, { variant: BadgeVariant; icon: IconName; cls: string }> = {
  Scheduled: { variant: "info", icon: "clock", cls: "vw-st--scheduled" },
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
export const AGENTS: ComboAgent[] = VERIFIED_CAT_AGENTS.map((a) => ({ id: a.id, name: a.name, phone: a.phone, img: a.img || FALLBACK_PORTRAIT }));

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
const GEN_TIMES = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];
const GEN_STATUS = ["Scheduled", "Scheduled", "Confirmed", "Confirmed", "Completed", "Completed", "Completed", "Cancelled", "No Show"];
const GEN_TODAY = new Date(2026, 5, 30);
function gvRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function gvDate(offset: number): string {
  const d = new Date(GEN_TODAY);
  d.setDate(d.getDate() + offset);
  return `${GEN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const VIEWING_COUNT = 96;
function buildViewings(): ViewingRecord[] {
  const r = gvRng(606060);
  const list: ViewingRecord[] = [];
  for (let n = 0; n < VIEWING_COUNT; n++) {
    const p = CAT_PROPS[(n * 7 + 3) % CAT_PROPS.length];
    const m = CAT_MEMBERS[(n * 5 + 1) % CAT_MEMBERS.length];
    const agent = p.agent ? p.agent.name : VERIFIED_CAT_AGENTS[(n * 3) % VERIFIED_CAT_AGENTS.length].name;
    const status = GEN_STATUS[Math.floor(r() * GEN_STATUS.length)];
    const offset = Math.floor(r() * 43) - 14; // -14 … +28 days around "today"
    list.push({
      id: "VW-" + (1100 - n),
      property: { title: p.title, location: `${p.area}, ${p.city}`, img: p.img },
      member: m.name,
      agent,
      date: gvDate(offset),
      time: GEN_TIMES[Math.floor(r() * GEN_TIMES.length)],
      status,
    });
  }
  return list;
}
export const VIEWINGS: ViewingRecord[] = buildViewings();
export const TOTAL_VIEWINGS = VIEWINGS.length;

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
      if (diff >= 1 && diff <= 7 && (v.status === "Scheduled" || v.status === "Confirmed")) c.upcoming++;
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

export const DURATIONS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hr" },
];
export const RESCHED_DURATIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
];

export interface ScheduleForm {
  property: string | null;
  member: string | null;
  agent: string | null;
  date: string;
  time: string;
  duration: string;
  contact: string;
  notes: string;
}
export const EMPTY_FORM: ScheduleForm = { property: null, member: null, agent: null, date: "", time: "", duration: "60", contact: "phone", notes: "" };

export interface RescheduleForm {
  date: string;
  time: string;
  duration: string;
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
export function viewingToReschedule(v: ViewingRecord): RescheduleForm {
  const base = viewingToForm(v);
  return { date: base.date, time: base.time, duration: "60", agent: base.agent, notify: true, reason: "" };
}
