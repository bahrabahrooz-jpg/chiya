import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

export const TOTAL_VIEWINGS = 248;

export interface KpiCard {
  key: string;
  label: string;
  icon: IconName;
  tone: StatTone;
  value: string;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", label: "Total viewings", icon: "calendar", tone: "brand", value: "248", sub: "All time" },
  { key: "today", label: "Scheduled today", icon: "calendar-check", tone: "info", value: "12", sub: "3 confirmed, 9 pending" },
  { key: "upcoming", label: "Upcoming", icon: "clock", tone: "gold", value: "34", sub: "Next 7 days" },
  { key: "completed", label: "Completed", icon: "circle-check", tone: "success", value: "186", sub: "Successfully conducted" },
  { key: "cancelled", label: "Cancelled", icon: "circle-x", tone: "brand", value: "28", sub: "Including no-shows" },
];

export const VIEWING_STATUS: Record<string, { variant: BadgeVariant; icon: IconName; cls: string }> = {
  Scheduled: { variant: "info", icon: "clock", cls: "vw-st--scheduled" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vw-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vw-st--cancelled" },
  "No Show": { variant: "warning", icon: "user-x", cls: "vw-st--noshow" },
};
export const STATUSES = Object.keys(VIEWING_STATUS);
export const STATUS_TABS = [{ id: "", label: "All" }, ...STATUSES.map((s) => ({ id: s, label: s }))];
export const AGENTS_LIST = ["Lana Aziz", "Karwan Mahmoud", "Dashne Salar", "Berivan Khalid", "Diyar Salih", "Sirwan Tofiq"];
export const PROPS_LIST = ["Marble Hill Villa", "Olive Grove Estate", "Citadel View Apartment", "Italian Village Duplex", "Ankawa Garden Villa", "Gulan Tower Penthouse", "Dream City Villa", "Sulaymaniyah Heights", "Masike Premium Apartment", "Ranya Riverside Villa", "Downtown Erbil Loft", "Ankawa Luxury Compound"];

export interface ViewingRecord {
  id: string;
  property: { title: string; location: string; img: string };
  member: string;
  agent: string;
  date: string;
  time: string;
  status: string;
}
export const VIEWINGS: ViewingRecord[] = [
  { id: "VW-1025", property: { title: "Marble Hill Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=130&q=72" }, member: "Sara Hassan", agent: "Lana Aziz", date: "Jun 16, 2026", time: "10:00 AM", status: "Scheduled" },
  { id: "VW-1024", property: { title: "Olive Grove Estate", location: "Barzangarty, Erbil", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=130&q=72" }, member: "Ahmad Karimi", agent: "Karwan Mahmoud", date: "Jun 16, 2026", time: "2:30 PM", status: "Confirmed" },
  { id: "VW-1023", property: { title: "Citadel View Apartment", location: "Downtown, Erbil", img: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=130&q=72" }, member: "Nadia Farid", agent: "Berivan Khalid", date: "Jun 15, 2026", time: "11:00 AM", status: "Completed" },
  { id: "VW-1022", property: { title: "Italian Village Duplex", location: "Italian Village, Erbil", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=130&q=72" }, member: "Zana Rashid", agent: "Sirwan Tofiq", date: "Jun 15, 2026", time: "3:00 PM", status: "Cancelled" },
  { id: "VW-1021", property: { title: "Ankawa Garden Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=130&q=72" }, member: "Hana Bakr", agent: "Diyar Salih", date: "Jun 14, 2026", time: "10:30 AM", status: "No Show" },
  { id: "VW-1020", property: { title: "Gulan Tower Penthouse", location: "Gulan St, Erbil", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=130&q=72" }, member: "Rawa Ahmad", agent: "Lana Aziz", date: "Jun 17, 2026", time: "9:00 AM", status: "Scheduled" },
  { id: "VW-1019", property: { title: "Dream City Villa", location: "Dream City, Erbil", img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=130&q=72" }, member: "Karzan Omar", agent: "Berivan Khalid", date: "Jun 17, 2026", time: "1:00 PM", status: "Confirmed" },
  { id: "VW-1018", property: { title: "Sulaymaniyah Heights", location: "Bakhtiari, Sulaymaniyah", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=130&q=72" }, member: "Vian Mustafa", agent: "Dashne Salar", date: "Jun 13, 2026", time: "2:00 PM", status: "Completed" },
  { id: "VW-1017", property: { title: "Masike Premium Apartment", location: "Masike, Duhok", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=130&q=72" }, member: "Dara Karim", agent: "Diyar Salih", date: "Jun 12, 2026", time: "11:30 AM", status: "Completed" },
  { id: "VW-1016", property: { title: "Ranya Riverside Villa", location: "Ranya, Sulaymaniyah", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=130&q=72" }, member: "Shno Jamal", agent: "Sirwan Tofiq", date: "Jun 18, 2026", time: "3:30 PM", status: "Scheduled" },
  { id: "VW-1015", property: { title: "Downtown Erbil Loft", location: "Downtown, Erbil", img: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=130&q=72" }, member: "Bnar Salih", agent: "Karwan Mahmoud", date: "Jun 11, 2026", time: "4:00 PM", status: "Cancelled" },
  { id: "VW-1014", property: { title: "Ankawa Luxury Compound", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=130&q=72" }, member: "Peshawa Omer", agent: "Lana Aziz", date: "Jun 10, 2026", time: "10:00 AM", status: "Completed" },
];

export interface ComboProperty { id: string; title: string; location: string; img: string }
export const PROPERTIES: ComboProperty[] = [
  { id: "p1", title: "Marble Hill Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=130&q=72" },
  { id: "p2", title: "Olive Grove Estate", location: "Barzangarty, Erbil", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=130&q=72" },
  { id: "p3", title: "Citadel View Apartment", location: "Downtown, Erbil", img: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=130&q=72" },
  { id: "p4", title: "Italian Village Duplex", location: "Italian Village, Erbil", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=130&q=72" },
  { id: "p5", title: "Ankawa Garden Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=130&q=72" },
  { id: "p6", title: "Gulan Tower Penthouse", location: "Gulan St, Erbil", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=130&q=72" },
  { id: "p7", title: "Dream City Villa", location: "Dream City, Erbil", img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=130&q=72" },
  { id: "p8", title: "Sulaymaniyah Heights", location: "Bakhtiari, Sulaymaniyah", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=130&q=72" },
  { id: "p9", title: "Masike Premium Apartment", location: "Masike, Duhok", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=130&q=72" },
  { id: "p10", title: "Ranya Riverside Villa", location: "Ranya, Sulaymaniyah", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=130&q=72" },
];

export interface ComboMember { id: string; name: string; phone: string; email: string }
export const MEMBERS: ComboMember[] = [
  { id: "m1", name: "Sara Hassan", phone: "+964 750 112 4408", email: "sara.hassan@gmail.com" },
  { id: "m2", name: "Ahmad Karimi", phone: "+964 751 339 7720", email: "a.karimi@outlook.com" },
  { id: "m3", name: "Nadia Farid", phone: "+964 770 884 1196", email: "nadia.farid@gmail.com" },
  { id: "m4", name: "Zana Rashid", phone: "+964 750 226 5531", email: "zana.rashid@yahoo.com" },
  { id: "m5", name: "Hana Bakr", phone: "+964 751 447 9082", email: "hana.bakr@gmail.com" },
  { id: "m6", name: "Rawa Ahmad", phone: "+964 770 559 3317", email: "rawa.ahmad@gmail.com" },
  { id: "m7", name: "Karzan Omar", phone: "+964 750 663 2204", email: "karzan.omar@outlook.com" },
  { id: "m8", name: "Vian Mustafa", phone: "+964 751 778 6649", email: "vian.m@gmail.com" },
];

export interface ComboAgent { id: string; name: string; phone: string; img: string }
export const AGENTS: ComboAgent[] = [
  { id: "a1", name: "Lana Aziz", phone: "+964 750 901 1245", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&q=80" },
  { id: "a2", name: "Karwan Mahmoud", phone: "+964 751 233 7781", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80" },
  { id: "a3", name: "Dashne Salar", phone: "+964 770 556 2290", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80" },
  { id: "a4", name: "Berivan Khalid", phone: "+964 750 442 8813", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=96&q=80" },
  { id: "a5", name: "Diyar Salih", phone: "+964 751 667 3398", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=80" },
  { id: "a6", name: "Sirwan Tofiq", phone: "+964 770 119 4426", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=96&q=80" },
];

export const AGENT_IMG: Record<string, string> = Object.fromEntries(AGENTS.map((a) => [a.name, a.img]));

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

export const EMPTY_FILTERS = { q: "", status: "", agent: "", property: "", dateRange: "" };
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
