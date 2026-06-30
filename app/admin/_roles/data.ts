import type { IconName } from "@/components/ui/icon";

export interface Perm { label: string; desc: string }
export interface Group { id: string; label: string; scope: boolean; perms: Perm[] }
export interface Cat { key: string; label: string; groups: Group[] }

export const CATS: Cat[] = [
  { key: "dashboard", label: "Dashboard", groups: [
    { id: "overview", label: "Overview", scope: true, perms: [
      { label: "View dashboard", desc: "Open the main workspace and summary view." },
      { label: "View KPI cards", desc: "High-level performance metrics at a glance." },
      { label: "View analytics", desc: "Charts and platform trend analytics." },
    ] },
    { id: "personal", label: "Personal", scope: false, perms: [{ label: "View personal performance", desc: "See their own performance metrics only." }] },
  ] },
  { key: "properties", label: "Properties", groups: [
    { id: "listings", label: "Listings", scope: true, perms: [
      { label: "View properties", desc: "Browse listings across the platform." },
      { label: "Create properties", desc: "Add new listings to the catalogue." },
      { label: "Edit properties", desc: "Update listing details and media." },
      { label: "Delete properties", desc: "Permanently remove a listing." },
    ] },
    { id: "publishing", label: "Publishing", scope: false, perms: [
      { label: "Publish properties", desc: "Make a listing live and visible to buyers." },
      { label: "Archive properties", desc: "Move listings out of the active catalogue." },
    ] },
    { id: "assignment", label: "Assignment", scope: false, perms: [
      { label: "Assign agents", desc: "Attach a verified agent to a listing." },
      { label: "Manage property status", desc: "Change for-sale, for-rent, sold or pending." },
    ] },
  ] },
  { key: "members", label: "Members", groups: [
    { id: "records", label: "Records", scope: true, perms: [
      { label: "View members", desc: "See member profiles and account details." },
      { label: "Create members", desc: "Register a new member account." },
      { label: "Edit members", desc: "Update member profile information." },
    ] },
    { id: "account", label: "Account control", scope: false, perms: [
      { label: "Suspend members", desc: "Temporarily disable a member account." },
      { label: "Delete members", desc: "Permanently remove a member account." },
      { label: "Assign members to agents", desc: "Route members to a managing agent." },
    ] },
  ] },
  { key: "agents", label: "Agents", groups: [
    { id: "records", label: "Records", scope: true, perms: [
      { label: "View agents", desc: "See agent profiles and verification status." },
      { label: "Create agents", desc: "Onboard a new agent to the platform." },
      { label: "Edit agents", desc: "Update agent profiles and credentials." },
    ] },
    { id: "account", label: "Account control", scope: false, perms: [
      { label: "Suspend agents", desc: "Temporarily disable an agent account." },
      { label: "Delete agents", desc: "Permanently remove an agent account." },
    ] },
  ] },
  { key: "viewings", label: "Viewings", groups: [
    { id: "scheduling", label: "Scheduling", scope: true, perms: [
      { label: "View viewings", desc: "See scheduled property viewings." },
      { label: "Schedule viewings", desc: "Book new viewing appointments." },
      { label: "Edit viewings", desc: "Reschedule or update viewing details." },
      { label: "Cancel viewings", desc: "Cancel a booked viewing appointment." },
    ] },
  ] },
  { key: "reports", label: "Reports", groups: [
    { id: "reporting", label: "Reporting", scope: true, perms: [
      { label: "View reports", desc: "Open sales, rental and performance reports." },
      { label: "Export reports", desc: "Download reports as PDF or spreadsheet." },
    ] },
  ] },
  { key: "settings", label: "Settings", groups: [
    { id: "general", label: "General", scope: false, perms: [{ label: "View settings", desc: "Access the platform settings area." }] },
    { id: "security", label: "Security", scope: false, perms: [
      { label: "Manage roles & permissions", desc: "Create roles and edit access levels." },
      { label: "View audit logs", desc: "Review the security and activity log." },
      { label: "Manage platform settings", desc: "Change global platform configuration." },
    ] },
  ] },
];

export interface FlatPerm extends Perm { permId: string; localIndex: number; groupId: string; scopeable: boolean }
function flatCat(cat: Cat): FlatPerm[] {
  const out: FlatPerm[] = [];
  let i = 0;
  cat.groups.forEach((g) => {
    g.perms.forEach((p) => {
      out.push({ ...p, permId: cat.key + ":" + i, localIndex: i, groupId: g.id, scopeable: g.scope });
      i++;
    });
  });
  return out;
}
export const CAT_FLAT: Record<string, FlatPerm[]> = {};
CATS.forEach((c) => {
  CAT_FLAT[c.key] = flatCat(c);
});
export const TOTAL_PERMS = CATS.reduce((a, c) => a + CAT_FLAT[c.key].length, 0);

export const SCOPE_OPTS = [
  { value: "own", label: "Own" },
  { value: "team", label: "Team" },
  { value: "org", label: "Organisational" },
];

type Spec = "all" | "none" | { perms: "all" | number[]; scope?: string };
export interface RoleSeed {
  id: string;
  name: string;
  tone: string;
  dot: string;
  icon: IconName;
  system: boolean;
  locked?: boolean;
  status: string;
  users: number;
  created: string;
  desc: string;
  spec: Record<string, Spec>;
}

export const ROLES_SEED: RoleSeed[] = [
  {
    id: "super-admin", name: "Super admin", tone: "gold", dot: "gold", icon: "shield-check", system: true, locked: true,
    status: "Active", users: 2, created: "Jan 4, 2024",
    desc: "Unrestricted access to every module, setting and permission across the Chiya Estate platform.",
    spec: { dashboard: "all", properties: "all", members: "all", agents: "all", viewings: "all", reports: "all", settings: "all" },
  },
  {
    id: "admin", name: "Admin", tone: "brand", dot: "brand", icon: "shield", system: true,
    status: "Active", users: 5, created: "Jan 4, 2024",
    desc: "Full operational control of listings, members and agents. Cannot manage platform roles or global settings.",
    spec: {
      dashboard: { perms: "all", scope: "org" }, properties: { perms: "all", scope: "org" },
      members: { perms: "all", scope: "org" }, agents: { perms: "all", scope: "org" },
      viewings: { perms: "all", scope: "org" }, reports: { perms: "all", scope: "org" },
      settings: { perms: [0], scope: "org" },
    },
  },
  {
    id: "agent", name: "Agent", tone: "amber", dot: "amber", icon: "badge-check", system: true,
    status: "Active", users: 120, created: "Jan 11, 2024",
    desc: "Field agent. Manages their own assigned properties, members and viewings.",
    spec: {
      dashboard: { perms: [0, 1, 3], scope: "own" },
      properties: { perms: [0, 1, 2, 7], scope: "own" },
      members: { perms: [0], scope: "own" },
      agents: { perms: [0], scope: "own" },
      viewings: { perms: [0, 1, 2], scope: "own" },
      reports: { perms: [0], scope: "own" },
      settings: "none",
    },
  },
];

export interface RoleState extends RoleSeed {
  grant: Record<string, boolean>;
  scope: Record<string, string>;
}

export function buildRole(spec: Record<string, Spec>): { grant: Record<string, boolean>; scope: Record<string, string> } {
  const grant: Record<string, boolean> = {};
  const scope: Record<string, string> = {};
  CATS.forEach((cat) => {
    const s = spec[cat.key];
    const flat = CAT_FLAT[cat.key];
    const onAll = s === "all";
    const cfg = s && typeof s === "object" ? s : null;
    const onSet: "all" | "none" | number[] = onAll ? "all" : cfg ? cfg.perms : "none";
    const sc = onAll ? "org" : cfg ? cfg.scope || "org" : "org";
    cat.groups.forEach((g) => {
      scope[cat.key + "/" + g.id] = g.scope ? sc : "org";
    });
    flat.forEach((p) => {
      grant[p.permId] = onSet === "all" ? true : Array.isArray(onSet) ? onSet.includes(p.localIndex) : false;
    });
  });
  return { grant, scope };
}
export function countGrant(grant: Record<string, boolean>) {
  return Object.values(grant).filter(Boolean).length;
}

export const PEOPLE = [
  { name: "Rêbîn Kawa", src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { name: "Lana Aziz", src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { name: "Hewa Rashid", src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
  { name: "Rawa Jalal", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { name: "Ahmed Karim", src: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  { name: "Sara Hama", src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
];
export function usersFor(role: RoleState, n: number) {
  const start = role.id.length % PEOPLE.length;
  const count = Math.min(role.users, n);
  return Array.from({ length: count }, (_, k) => PEOPLE[(start + k) % PEOPLE.length]);
}

export interface MatrixRow { label: string; cat: string; idx: number; group: string }
export const MATRIX_ROWS: MatrixRow[] = [
  { label: "View properties", cat: "properties", idx: 0, group: "Properties" },
  { label: "Create properties", cat: "properties", idx: 1, group: "Properties" },
  { label: "Edit properties", cat: "properties", idx: 2, group: "Properties" },
  { label: "Delete properties", cat: "properties", idx: 3, group: "Properties" },
  { label: "Publish properties", cat: "properties", idx: 4, group: "Properties" },
  { label: "Assign agents", cat: "properties", idx: 6, group: "Properties" },
  { label: "View members", cat: "members", idx: 0, group: "Members" },
  { label: "Edit members", cat: "members", idx: 2, group: "Members" },
  { label: "Suspend members", cat: "members", idx: 3, group: "Members" },
  { label: "View agents", cat: "agents", idx: 0, group: "Agents" },
  { label: "Edit agents", cat: "agents", idx: 2, group: "Agents" },
  { label: "View viewings", cat: "viewings", idx: 0, group: "Viewings" },
  { label: "Schedule viewings", cat: "viewings", idx: 1, group: "Viewings" },
  { label: "View reports", cat: "reports", idx: 0, group: "Reports" },
  { label: "Export reports", cat: "reports", idx: 1, group: "Reports" },
  { label: "Manage roles & permissions", cat: "settings", idx: 1, group: "Settings" },
  { label: "Manage platform settings", cat: "settings", idx: 3, group: "Settings" },
];

export function cellLevel(role: RoleState, catKey: string, idx: number): "full" | "none" {
  const meta = CAT_FLAT[catKey].find((p) => p.localIndex === idx);
  if (!meta) return "none";
  if (!role.grant[meta.permId]) return "none";
  return "full";
}
