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
  { key: "reviews", label: "Reviews", groups: [
    { id: "moderation", label: "Moderation", scope: true, perms: [
      { label: "View reviews", desc: "See reviews members left about agents." },
      { label: "Approve reviews", desc: "Publish a pending review to the agent's profile." },
      { label: "Reject reviews", desc: "Keep a pending review off the platform." },
      { label: "Delete reviews", desc: "Permanently remove a review." },
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

// Member-surface permissions. These describe what a member can do across the
// mobile app and the authenticated website member view — a distinct universe
// from the admin-panel catalogue above.
export const MEMBER_CATS: Cat[] = [
  { key: "browse", label: "Browse", groups: [
    { id: "discover", label: "Discover", scope: false, perms: [
      { label: "Browse listings", desc: "Explore properties on the home and search screens." },
      { label: "Search & filter", desc: "Run searches and refine results with filters." },
      { label: "View property details", desc: "Open a listing's full detail page and gallery." },
      { label: "View agent profiles", desc: "See agent profiles and their active listings." },
    ] },
  ] },
  { key: "saved", label: "Saved", groups: [
    { id: "collections", label: "Collections", scope: false, perms: [
      { label: "Save properties", desc: "Add listings to a personal saved collection." },
      { label: "Save agents", desc: "Follow agents and keep them in Saved." },
    ] },
  ] },
  { key: "tours", label: "Viewings", groups: [
    { id: "requests", label: "Requests", scope: false, perms: [
      { label: "Request viewings", desc: "Book a viewing appointment for a listing." },
      { label: "Cancel viewings", desc: "Cancel a viewing they previously requested." },
    ] },
  ] },
  { key: "selling", label: "My listings", groups: [
    { id: "owned", label: "Owned listings", scope: false, perms: [
      { label: "Submit a listing", desc: "List a property for review through the sell flow." },
      { label: "Edit own listings", desc: "Update the details of their own submissions." },
      { label: "Delete own listings", desc: "Remove a listing they created." },
    ] },
  ] },
  { key: "account", label: "Account", groups: [
    { id: "profile", label: "Profile", scope: false, perms: [
      { label: "Edit profile", desc: "Update name, photo, contact and location." },
      { label: "Manage notifications", desc: "Read, mark and clear their notifications." },
    ] },
    { id: "prefs", label: "Security & preferences", scope: false, perms: [
      { label: "Change password", desc: "Update their account password." },
      { label: "Manage preferences", desc: "Set language and appearance options." },
    ] },
  ] },
];

export type Surface = "admin" | "member";

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
function flatMap(cats: Cat[]): Record<string, FlatPerm[]> {
  const map: Record<string, FlatPerm[]> = {};
  cats.forEach((c) => { map[c.key] = flatCat(c); });
  return map;
}
export const CAT_FLAT: Record<string, FlatPerm[]> = flatMap(CATS);
export const MEMBER_CAT_FLAT: Record<string, FlatPerm[]> = flatMap(MEMBER_CATS);
export const TOTAL_PERMS = CATS.reduce((a, c) => a + CAT_FLAT[c.key].length, 0);
export const MEMBER_TOTAL_PERMS = MEMBER_CATS.reduce((a, c) => a + MEMBER_CAT_FLAT[c.key].length, 0);

/** Resolve the catalogue, flat map and total for a role's permission surface. */
export function catsFor(surface: Surface): Cat[] {
  return surface === "member" ? MEMBER_CATS : CATS;
}
export function flatFor(surface: Surface): Record<string, FlatPerm[]> {
  return surface === "member" ? MEMBER_CAT_FLAT : CAT_FLAT;
}
export function totalPermsFor(surface: Surface): number {
  return surface === "member" ? MEMBER_TOTAL_PERMS : TOTAL_PERMS;
}

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
  /** Which permission catalogue this role draws from. Defaults to "admin". */
  surface?: Surface;
  status: string;
  users: number;
  created: string;
  desc: string;
  spec: Record<string, Spec>;
}

export const ROLES_SEED: RoleSeed[] = [
  {
    id: "super-admin", name: "Super admin", tone: "brand", dot: "brand", icon: "shield-check", system: true, locked: true,
    status: "Active", users: 1, created: "Jan 4, 2024",
    desc: "Unrestricted access to every module, setting and permission across the Chiya Estate platform.",
    spec: { dashboard: "all", properties: "all", members: "all", agents: "all", viewings: "all", reviews: "all", reports: "all", settings: "all" },
  },
  {
    id: "agent", name: "Agent", tone: "brand", dot: "brand", icon: "badge-check", system: true,
    status: "Active", users: 35, created: "Jan 11, 2024",
    desc: "Field agent. Manages their own assigned properties, members and viewings.",
    spec: {
      dashboard: { perms: [0, 1], scope: "own" },
      properties: { perms: [0, 1, 2, 7], scope: "own" },
      members: { perms: [0], scope: "own" },
      agents: { perms: [0], scope: "own" },
      viewings: { perms: [0, 1, 2], scope: "own" },
      // Read-only: agents see reviews written about them but never moderate them.
      reviews: { perms: [0], scope: "own" },
      reports: { perms: [0], scope: "own" },
      settings: "none",
    },
  },
  {
    id: "member", name: "Member", tone: "brand", dot: "brand", icon: "user", system: true, surface: "member",
    status: "Active", users: 1240, created: "Jan 18, 2024",
    desc: "Public member. Browses listings, saves favourites, requests viewings and manages their own account across the mobile app and website.",
    spec: { browse: "all", saved: "all", tours: "all", selling: "all", account: "all" },
  },
];

export interface RoleState extends RoleSeed {
  grant: Record<string, boolean>;
  scope: Record<string, string>;
}

export function buildRole(spec: Record<string, Spec>, surface: Surface = "admin"): { grant: Record<string, boolean>; scope: Record<string, string> } {
  const grant: Record<string, boolean> = {};
  const scope: Record<string, string> = {};
  const cats = catsFor(surface);
  const flatByKey = flatFor(surface);
  cats.forEach((cat) => {
    const s = spec[cat.key];
    const flat = flatByKey[cat.key];
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
export function countGrant(grant: Record<string, boolean>, surface: Surface = "admin") {
  // count only permissions that currently exist, so the total can never
  // drift past the surface total (e.g. after a permission is removed)
  let n = 0;
  catsFor(surface).forEach((c) => flatFor(surface)[c.key].forEach((p) => { if (grant[p.permId]) n++; }));
  return n;
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
