import type { IconName } from "@/components/ui/icon";
import type { StatTone } from "@/components/data/stat-card";
import { daysAgoFrom } from "../_data/catalog";
import type { AgentRecord, MemberRecord, PropertyRecord } from "../_data/catalog";
import type { ViewingRecord } from "../_viewings/data";

/* Chart palette — brand-aligned tokens shared by every report visual. */
export const C = {
  green: "var(--green-700)",
  greenLt: "var(--green-300)",
  gold: "var(--gold-500)",
  info: "var(--info-600)",
  amber: "var(--warning-500)",
  gray: "var(--gray-400)",
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* Reporting period — segmented steps. `days` is the rolling window that scopes
   every section; deltas compare it to the immediately preceding equal window. */
export interface PeriodDef { short: string; label: string; days: number }
export const PERIODS: PeriodDef[] = [
  { short: "Today", label: "day", days: 1 },
  { short: "Week", label: "week", days: 7 },
  { short: "Month", label: "month", days: 30 },
  { short: "Year", label: "year", days: 365 },
];

/* Mirrors the catalog's TODAY anchor (Jun 30, 2026) so day-bucket labels line up
   with daysAgoFrom, which measures distance from that same anchor. */
const TODAY = new Date(2026, 5, 30);
function dayLabel(daysAgo: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - daysAgo);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/** Is a date inside the current rolling window [0, days)? (future dates excluded) */
function inCurrent(dateStr: string, days: number): boolean {
  const a = daysAgoFrom(dateStr);
  return a != null && a >= 0 && a < days;
}

/** Bucket granularity + count for the trend charts, chosen to fit the window. */
function bucketsFor(days: number): { unit: "day" | "month"; count: number } {
  if (days <= 7) return { unit: "day", count: 7 };
  if (days <= 31) return { unit: "day", count: 30 };
  return { unit: "month", count: 12 };
}

/** Count each date set into aligned buckets spanning the selected window. */
function bucketSeries(inputs: SeriesInput[], days: number): { labels: string[]; series: Series[] } {
  const b = bucketsFor(days);
  if (b.unit === "month") return monthlyMulti(inputs, b.count);
  const count = b.count;
  const labels = Array.from({ length: count }, (_, i) => dayLabel(count - 1 - i));
  const series = inputs.map((s) => {
    const data = new Array(count).fill(0);
    for (const ds of s.dates) {
      const a = daysAgoFrom(ds);
      if (a == null || a < 0 || a >= count) continue;
      data[count - 1 - a]++;
    }
    return { key: s.key, label: s.label, color: s.color, data };
  });
  return { labels, series };
}

/* Portrait fallback for agents that have no avatar set. */
const AGENT_FALLBACK = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=70";

/* -------------------------------------------------------------------------
   Month-bucketing helpers — turn the catalog's "Mon D, YYYY" date strings
   into aligned monthly series. Mirrors the parser style in catalog.ts /
   _viewings/data.ts (3-letter month abbreviation).
   ------------------------------------------------------------------------- */
const MON_IDX: Record<string, number> = Object.fromEntries(MONTHS.map((m, i) => [m, i]));

function parseMonYear(dateStr: string): { y: number; m: number } | null {
  const mm = /^([A-Za-z]{3})\s+\d+,\s*(\d+)$/.exec(dateStr.trim());
  if (!mm) return null;
  const m = MON_IDX[mm[1]];
  if (m == null) return null;
  return { y: Number(mm[2]), m };
}

/* Count occurrences per month across one or more date sets, over a shared
   axis of the last `n` months ending at the latest month present in the data.
   Returns month labels plus one data array per input series. */
interface SeriesInput { key: string; label: string; color: string; dates: string[] }
function monthlyMulti(inputs: SeriesInput[], n: number): { labels: string[]; series: Series[] } {
  let maxKey = -Infinity;
  const maps = inputs.map((s) => {
    const map = new Map<number, number>();
    for (const ds of s.dates) {
      const p = parseMonYear(ds);
      if (!p) continue;
      const k = p.y * 12 + p.m;
      map.set(k, (map.get(k) || 0) + 1);
      if (k > maxKey) maxKey = k;
    }
    return map;
  });
  if (maxKey === -Infinity) {
    return { labels: Array(n).fill(""), series: inputs.map((s) => ({ key: s.key, label: s.label, color: s.color, data: Array(n).fill(0) })) };
  }
  const keys = Array.from({ length: n }, (_, i) => maxKey - (n - 1) + i);
  const labels = keys.map((k) => MONTHS[((k % 12) + 12) % 12]);
  const series = inputs.map((s, idx) => ({ key: s.key, label: s.label, color: s.color, data: keys.map((k) => maps[idx].get(k) || 0) }));
  return { labels, series };
}

/* Period-over-period delta from a monthly series (last month vs the previous). */
export interface DeltaInfo { text: string; dir: "up" | "down" }
export function lastDelta(data: number[]): DeltaInfo | undefined {
  if (data.length < 2) return undefined;
  const cur = data[data.length - 1];
  const prev = data[data.length - 2];
  if (prev === 0) return undefined;
  const pct = ((cur - prev) / prev) * 100;
  return { text: (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%", dir: pct >= 0 ? "up" : "down" };
}

/* -------------------------------------------------------------------------
   KPI summary row — scoped to the selected rolling window
   ------------------------------------------------------------------------- */
export interface KpiCard { key: string; label: string; icon: IconName; tone: StatTone; value: string; sub?: string; delta?: string; dir?: "up" | "down" }

/* Classify a date into the current window [0, days), the preceding window
   [days, 2·days), or neither. Future dates (daysAgo < 0) are ignored. */
function windowOf(dateStr: string, days: number): "cur" | "prev" | null {
  const a = daysAgoFrom(dateStr);
  if (a == null || a < 0) return null;
  if (a < days) return "cur";
  if (a < days * 2) return "prev";
  return null;
}

/* Count events in the current window and the delta vs the preceding window. */
function windowCount(dates: string[], days: number): { value: number; delta?: DeltaInfo } {
  let cur = 0;
  let prev = 0;
  for (const d of dates) {
    const w = windowOf(d, days);
    if (w === "cur") cur++;
    else if (w === "prev") prev++;
  }
  if (prev === 0) return { value: cur };
  const pct = ((cur - prev) / prev) * 100;
  return { value: cur, delta: { text: (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%", dir: pct >= 0 ? "up" : "down" } };
}

export function buildPeriodKpis(properties: PropertyRecord[], members: MemberRecord[], viewings: ViewingRecord[], days: number, periodLabel: string): KpiCard[] {
  const listed = windowCount(properties.map((p) => p.listingDate), days);
  const sold = windowCount(properties.filter((p) => p.status === "Sold").map((p) => p.updated), days);
  const rented = windowCount(properties.filter((p) => p.status === "Rented").map((p) => p.updated), days);
  const joined = windowCount(members.map((m) => m.joined), days);
  const views = windowCount(viewings.map((v) => v.date), days);

  // Agents with a listing created or a deal closed inside the current window.
  const activeAgents = new Set<string>();
  for (const p of properties) {
    if (!p.agent) continue;
    if (windowOf(p.listingDate, days) === "cur" || windowOf(p.updated, days) === "cur") activeAgents.add(p.agent.name);
  }

  const vs = `vs previous ${periodLabel}`;
  return [
    { key: "listed", label: "New listings", icon: "building-2", tone: "brand", value: listed.value.toLocaleString(), delta: listed.delta?.text, dir: listed.delta?.dir, sub: vs },
    { key: "sold", label: "Properties sold", icon: "key", tone: "gold", value: sold.value.toLocaleString(), delta: sold.delta?.text, dir: sold.delta?.dir, sub: vs },
    { key: "rented", label: "Properties rented", icon: "home", tone: "info", value: rented.value.toLocaleString(), delta: rented.delta?.text, dir: rented.delta?.dir, sub: vs },
    { key: "members", label: "New members", icon: "users", tone: "success", value: joined.value.toLocaleString(), delta: joined.delta?.text, dir: joined.delta?.dir, sub: vs },
    { key: "agents", label: "Active agents", icon: "badge-check", tone: "brand", value: activeAgents.size.toLocaleString(), sub: `In the last ${periodLabel}` },
    { key: "viewings", label: "Viewings", icon: "calendar-check", tone: "gold", value: views.value.toLocaleString(), delta: views.delta?.text, dir: views.delta?.dir, sub: vs },
  ];
}

/* -------------------------------------------------------------------------
   Charts
   ------------------------------------------------------------------------- */
export interface Series { key: string; label: string; color: string; data: number[] }

/** Property performance line chart — new listings bucketed across the window. */
export function buildListingsTrend(properties: PropertyRecord[], days: number): { labels: string[]; series: Series[] } {
  return bucketSeries([{ key: "new", label: "New listings", color: C.green, dates: properties.map((p) => p.listingDate) }], days);
}

export interface StatusSlice { key: string; label: string; value: number; color: string }
/** Property status breakdown donut — statuses of properties active in the window. */
export function buildStatusSlices(properties: PropertyRecord[], days: number): StatusSlice[] {
  const inWin = properties.filter((p) => inCurrent(p.listingDate, days) || inCurrent(p.updated, days));
  const defs: { key: string; label: string; status: string; color: string }[] = [
    { key: "published", label: "Published", status: "Published", color: C.green },
    { key: "pending", label: "Pending approval", status: "Pending", color: C.amber },
    { key: "sold", label: "Sold", status: "Sold", color: C.gold },
    { key: "rented", label: "Rented", status: "Rented", color: C.info },
    { key: "draft", label: "Draft", status: "Draft", color: C.gray },
  ];
  return defs.map((d) => ({ key: d.key, label: d.label, color: d.color, value: inWin.filter((p) => p.status === d.status).length }));
}

/** Sales & rentals grouped bars — closed sold vs rented bucketed across the window. */
export function buildSalesRentals(properties: PropertyRecord[], days: number): { labels: string[]; series: Series[] } {
  return bucketSeries(
    [
      { key: "sold", label: "Sold", color: C.gold, dates: properties.filter((p) => p.status === "Sold").map((p) => p.updated) },
      { key: "rented", label: "Rented", color: C.info, dates: properties.filter((p) => p.status === "Rented").map((p) => p.updated) },
    ],
    days,
  );
}

export interface LocationRow { name: string; value: number }
/** Top locations — properties active in the window, ranked by geography. */
export function buildTopLocations(properties: PropertyRecord[], days: number): Record<string, LocationRow[]> {
  const inWin = properties.filter((p) => inCurrent(p.listingDate, days) || inCurrent(p.updated, days));
  const tally = (key: (p: PropertyRecord) => string) => {
    const m: Record<string, number> = {};
    for (const p of inWin) m[key(p)] = (m[key(p)] || 0) + 1;
    return Object.entries(m)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };
  return { Cities: tally((p) => p.city), Areas: tally((p) => p.district), Projects: tally((p) => p.area) };
}

export interface AgentRow { name: string; team: string; active: number; sold: number; rented: number; viewings: number; completed: number; verified: boolean; img: string }
/** Agent performance table — per-agent activity within the window. Ranked by
   completion rate (completed viewings ÷ all viewings), which is always 0–100%. */
export function buildAgentRows(agents: AgentRecord[], properties: PropertyRecord[], viewings: ViewingRecord[], days: number): AgentRow[] {
  const vtotal: Record<string, number> = {};
  const vdone: Record<string, number> = {};
  for (const v of viewings) {
    if (!inCurrent(v.date, days)) continue;
    vtotal[v.agent] = (vtotal[v.agent] || 0) + 1;
    if (v.status === "Completed") vdone[v.agent] = (vdone[v.agent] || 0) + 1;
  }
  const deals: Record<string, { active: number; sold: number; rented: number }> = {};
  for (const p of properties) {
    if (!p.agent) continue;
    const rec = (deals[p.agent.name] ||= { active: 0, sold: 0, rented: 0 });
    if (inCurrent(p.listingDate, days)) rec.active++;
    if (p.status === "Sold" && inCurrent(p.updated, days)) rec.sold++;
    if (p.status === "Rented" && inCurrent(p.updated, days)) rec.rented++;
  }
  const rate = (r: AgentRow) => (r.viewings ? r.completed / r.viewings : 0);
  return agents
    .map((a) => {
      const d = deals[a.name] || { active: 0, sold: 0, rented: 0 };
      return {
        name: a.name,
        team: a.city,
        active: d.active,
        sold: d.sold,
        rented: d.rented,
        viewings: vtotal[a.name] || 0,
        completed: vdone[a.name] || 0,
        verified: a.verification === "Verified",
        img: a.img || AGENT_FALLBACK,
      };
    })
    .filter((r) => r.viewings > 0) // rate is only defined with viewings
    .sort((x, y) => rate(y) - rate(x) || y.completed - x.completed)
    .slice(0, 5);
}

export interface MemberTrend { key: string; label: string; icon: IconName; tone: "success" | "info" | "gold" | "brand"; value: string; delta: string; color: string; data: number[] }
/** Member activity — four real trend tiles bucketed across the window. */
export function buildMemberTrends(members: MemberRecord[], viewings: ViewingRecord[], days: number): MemberTrend[] {
  const tile = (key: string, label: string, icon: IconName, tone: MemberTrend["tone"], color: string, dates: string[]): MemberTrend => {
    const { series } = bucketSeries([{ key, label, color, dates }], days);
    const data = series[0].data;
    const d = lastDelta(data);
    return { key, label, icon, tone, color, data, value: data.reduce((a, b) => a + b, 0).toLocaleString(), delta: d?.text ?? "—" };
  };
  return [
    tile("new", "New members", "user-plus", "success", C.green, members.map((m) => m.joined)),
    tile("buyers", "New buyers", "user-check", "info", C.info, members.filter((m) => m.roles.includes("Buyer")).map((m) => m.joined)),
    tile("sellers", "New sellers", "tag", "gold", C.gold, members.filter((m) => m.roles.includes("Seller")).map((m) => m.joined)),
    tile("viewings", "Scheduled viewings", "calendar-check", "brand", C.greenLt, viewings.map((v) => v.date)),
  ];
}

/* -------------------------------------------------------------------------
   Chart math (unchanged)
   ------------------------------------------------------------------------- */
export function niceNum(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}
export function smoothPath(pts: { x: number; y: number }[]) {
  if (!pts.length) return "";
  if (pts.length < 2) return `M${pts[0].x},${pts[0].y}`;
  const t = 0.18;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) * t,
      c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t,
      c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}
