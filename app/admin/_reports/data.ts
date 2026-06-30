import type { IconName } from "@/components/ui/icon";
import type { StatTone } from "@/components/data/stat-card";

export const C = {
  green: "var(--green-700)",
  greenLt: "var(--green-300)",
  gold: "var(--gold-500)",
  info: "var(--info-600)",
  amber: "var(--warning-500)",
  gray: "var(--gray-400)",
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DateRangeDef { id: string; label: string; custom?: boolean }
export const DATE_RANGES: DateRangeDef[] = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom range", custom: true },
];

export interface KpiCard { key: string; label: string; icon: IconName; tone: StatTone; value: string; delta: string; dir: "up" | "down" }
export const KPI_CARDS: KpiCard[] = [
  { key: "props", label: "Total properties", icon: "building-2", tone: "brand", value: "1,284", delta: "+5.2%", dir: "up" },
  { key: "sold", label: "Properties sold", icon: "key", tone: "gold", value: "1,042", delta: "+12.0%", dir: "up" },
  { key: "rented", label: "Properties rented", icon: "home", tone: "info", value: "1,560", delta: "+8.4%", dir: "up" },
  { key: "members", label: "Total members", icon: "users", tone: "success", value: "8,640", delta: "+15.0%", dir: "up" },
  { key: "agents", label: "Total agents", icon: "badge-check", tone: "brand", value: "214", delta: "+6.5%", dir: "up" },
  { key: "viewings", label: "Total viewings", icon: "calendar-check", tone: "gold", value: "4,820", delta: "+9.3%", dir: "up" },
];

export interface Series { key: string; label: string; color: string; data: number[] }
export const PERF_SERIES: Series[] = [
  { key: "thisYear", label: "This year", color: C.green, data: [180, 195, 210, 230, 205, 240, 260, 250, 275, 290, 270, 310] },
  { key: "lastYear", label: "Last year", color: C.gold, data: [150, 160, 175, 190, 180, 205, 215, 210, 230, 245, 235, 260] },
];

export interface StatusSlice { key: string; label: string; value: number; color: string }
export const STATUS: StatusSlice[] = [
  { key: "published", label: "Published", value: 612, color: C.green },
  { key: "sold", label: "Sold", value: 268, color: C.gold },
  { key: "rented", label: "Rented", value: 232, color: C.info },
  { key: "pending", label: "Pending approval", value: 104, color: C.amber },
  { key: "archived", label: "Archived", value: 68, color: C.gray },
];

export const SR_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
export const SR_SERIES: Series[] = [
  { key: "sold", label: "Sold", color: C.gold, data: [72, 80, 75, 84, 90, 86, 94] },
  { key: "rented", label: "Rented", color: C.info, data: [110, 120, 115, 125, 132, 128, 140] },
];

export interface LocationRow { name: string; value: number }
export const LOCATIONS: Record<string, LocationRow[]> = {
  Cities: [
    { name: "Erbil", value: 842 },
    { name: "Sulaymaniyah", value: 458 },
    { name: "Duhok", value: 326 },
    { name: "Halabja", value: 124 },
    { name: "Kirkuk", value: 96 },
  ],
  Areas: [
    { name: "Ankawa", value: 312 },
    { name: "Italian Village", value: 244 },
    { name: "Dream City", value: 198 },
    { name: "Bakhtiari", value: 142 },
    { name: "Iskan", value: 88 },
  ],
  Projects: [
    { name: "Empire World", value: 286 },
    { name: "Dream City", value: 232 },
    { name: "Naz City", value: 188 },
    { name: "Italian Village", value: 156 },
    { name: "Lalav City", value: 104 },
  ],
};

export interface AgentRow { name: string; team: string; active: number; sold: number; rented: number; viewings: number; verified: boolean; img: string }
export const AGENTS: AgentRow[] = [
  { name: "Hewa Rashid", team: "Chiya Select · Erbil", active: 22, sold: 14, rented: 13, viewings: 72, verified: true, img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
  { name: "Lana Aziz", team: "Chiya Select · Erbil", active: 24, sold: 12, rented: 18, viewings: 96, verified: true, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { name: "Rawa Jalal", team: "Dream City Homes", active: 27, sold: 15, rented: 16, viewings: 110, verified: true, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { name: "Ahmed Karim", team: "Empire Realty", active: 31, sold: 18, rented: 14, viewings: 120, verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { name: "Diyar Salih", team: "Naz Properties", active: 15, sold: 7, rented: 9, viewings: 58, verified: false, img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  { name: "Sara Hama", team: "Independent agent", active: 19, sold: 9, rented: 11, viewings: 64, verified: true, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { name: "Navin Omar", team: "Lalav Living", active: 12, sold: 5, rented: 8, viewings: 50, verified: false, img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=120&q=70" },
];

export interface MemberTrend { key: string; label: string; icon: IconName; tone: "success" | "info" | "gold" | "brand"; value: string; delta: string; color: string; data: number[] }
export const MEMBER_TRENDS: MemberTrend[] = [
  { key: "new", label: "New members", icon: "user-plus", tone: "success", value: "1,180", delta: "+15.0%", color: C.green, data: [60, 68, 64, 75, 82, 78, 90, 96, 93, 100, 108, 116] },
  { key: "viewings", label: "Scheduled viewings", icon: "calendar-check", tone: "info", value: "4,820", delta: "+9.3%", color: C.info, data: [320, 345, 360, 355, 390, 410, 400, 430, 452, 448, 470, 498] },
  { key: "inquiries", label: "Property inquiries", icon: "message-square", tone: "gold", value: "2,640", delta: "+11.2%", color: C.gold, data: [160, 175, 190, 185, 205, 220, 232, 228, 245, 252, 260, 278] },
  { key: "saved", label: "Saved properties", icon: "heart", tone: "brand", value: "6,210", delta: "+18.5%", color: C.greenLt, data: [380, 410, 440, 460, 500, 540, 560, 590, 610, 640, 660, 702] },
];

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
