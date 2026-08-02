import type { IconName } from "@/components/ui/icon";
import { AGENTS, MEMBERS } from "@/app/admin/_data/catalog";

/* ----------------------------------------------------------------------------
   Roles & permissions — the single source of truth for what each role can see
   and do across the admin console and the member app. Spec:
   docs/roles-permissions-design.md.

   Design notes:
   - Stable string permission ids ("properties.publish"), never positional —
     inserting a permission can't shift the id of any other.
   - Sections mirror the admin sidebar 1:1 (Locations, Roles and Audit log are
     real sections, not riders on Settings).
   - Scope (own/team/org) is one selector per scopeable section; org-only
     sections carry no selector at all.
   - Catalogue covers every action that exists in the product today:
     agent verification, viewing status/reassignment, internal notes, and the
     member-side review submission the mobile app already performs.

   lib/agent-permissions.ts derives the agent surface from the Agent role here,
   so a spec change on this screen flows straight through to what agents can do.
   ------------------------------------------------------------------------- */

export interface PermV2 {
  /** Stable id: "<sectionKey>.<action>" — never derived from position. */
  id: string;
  /** Canonical English label; display resolves via permKey() + t(). */
  label: string;
  desc: string;
}
export interface GroupV2 { id: string; label: string; perms: PermV2[] }
export interface SectionV2 {
  key: string;
  /** i18n key for the section label (staff reuses the sidebar's admin.nav.*). */
  labelKey: string;
  /** Canonical English fallback when labelKey has no catalog entry. */
  label: string;
  /** Sections with an own/team/org reach; org-only sections are false. */
  scopeable: boolean;
  groups: GroupV2[];
}

export type SurfaceV2 = "admin" | "member";
export type ScopeVal = "own" | "team" | "org";

const p = (id: string, label: string, desc: string): PermV2 => ({ id, label, desc });

/* ------------------------------- staff surface -----------------------------
   11 sections, one per sidebar page — if a role can't `view` a section, that
   page simply isn't part of its console. */
export const SECTIONS_V2: SectionV2[] = [
  { key: "dashboard", labelKey: "admin.nav.dashboard", label: "Dashboard", scopeable: true, groups: [
    { id: "overview", label: "Overview", perms: [
      p("dashboard.view", "View dashboard", "Open the main workspace and summary view."),
      p("dashboard.kpis", "View KPI cards", "High-level performance metrics at a glance."),
      p("dashboard.analytics", "View analytics", "Charts and platform trend analytics."),
      p("dashboard.activity", "View recent activity", "The latest actions taken across the platform."),
    ] },
  ] },
  { key: "properties", labelKey: "admin.nav.properties", label: "Properties", scopeable: true, groups: [
    { id: "records", label: "Records", perms: [
      p("properties.view", "View properties", "Browse listings across the platform."),
      p("properties.create", "Create properties", "Add new listings to the catalogue."),
      p("properties.edit", "Edit properties", "Update listing details and media."),
      p("properties.delete", "Delete properties", "Permanently remove a listing."),
    ] },
    { id: "publishing", label: "Publishing", perms: [
      p("properties.publish", "Publish properties", "Make a listing live and visible to buyers."),
      p("properties.archive", "Archive properties", "Move listings out of the active catalogue."),
      p("properties.status", "Manage property status", "Change for-sale, for-rent, sold or pending."),
    ] },
    { id: "assignment", label: "Assignment", perms: [
      p("properties.assign", "Assign agents", "Attach a verified agent to a listing."),
    ] },
    { id: "notes", label: "Notes", perms: [
      p("properties.notes", "Manage property notes", "Add, edit and delete internal notes on a listing."),
    ] },
  ] },
  { key: "members", labelKey: "admin.nav.members", label: "Members", scopeable: true, groups: [
    { id: "records", label: "Records", perms: [
      p("members.view", "View members", "See member profiles and account details."),
      p("members.create", "Create members", "Register a new member account."),
      p("members.edit", "Edit members", "Update member profile information."),
    ] },
    { id: "account", label: "Account control", perms: [
      p("members.suspend", "Suspend members", "Temporarily disable a member account."),
      p("members.delete", "Delete members", "Permanently remove a member account."),
    ] },
    { id: "assignment", label: "Assignment", perms: [
      p("members.assign", "Assign members to agents", "Route members to a managing agent."),
    ] },
    { id: "notes", label: "Notes", perms: [
      p("members.notes", "Manage member notes", "Add, edit and delete internal notes on a member."),
    ] },
  ] },
  { key: "agents", labelKey: "admin.nav.agents", label: "Agents", scopeable: true, groups: [
    { id: "records", label: "Records", perms: [
      p("agents.view", "View agents", "See agent profiles and verification status."),
      p("agents.create", "Create agents", "Onboard a new agent to the platform."),
      p("agents.edit", "Edit agents", "Update agent profiles and credentials."),
    ] },
    { id: "account", label: "Account control", perms: [
      p("agents.suspend", "Suspend agents", "Temporarily disable an agent account."),
      p("agents.delete", "Delete agents", "Permanently remove an agent account."),
    ] },
    { id: "verification", label: "Verification", perms: [
      p("agents.verify", "Verify agents", "Grant or revoke the verified badge that lists an agent publicly."),
    ] },
    { id: "notes", label: "Notes", perms: [
      p("agents.notes", "Manage agent notes", "Add, edit and delete internal notes on an agent."),
    ] },
  ] },
  { key: "viewings", labelKey: "admin.nav.viewings", label: "Viewings", scopeable: true, groups: [
    { id: "scheduling", label: "Scheduling", perms: [
      p("viewings.view", "View viewings", "See scheduled property viewings."),
      p("viewings.schedule", "Schedule viewings", "Book new viewing appointments."),
      p("viewings.edit", "Edit viewings", "Reschedule or update viewing details."),
    ] },
    { id: "control", label: "Control", perms: [
      p("viewings.status", "Change viewing status", "Move a viewing between requested, confirmed, completed and no-show."),
      p("viewings.reassign", "Reassign viewing agent", "Hand a viewing over to a different agent."),
      p("viewings.cancel", "Cancel viewings", "Cancel a booked viewing appointment."),
    ] },
    { id: "notes", label: "Notes", perms: [
      p("viewings.notes", "Manage viewing notes", "Add, edit and delete internal notes on a viewing."),
    ] },
  ] },
  { key: "reviews", labelKey: "admin.nav.reviews", label: "Reviews", scopeable: true, groups: [
    { id: "moderation", label: "Moderation", perms: [
      p("reviews.view", "View reviews", "See reviews members left about agents."),
      p("reviews.approve", "Approve reviews", "Publish a pending review to the agent's profile."),
      p("reviews.reject", "Reject reviews", "Keep a pending review off the platform."),
      p("reviews.delete", "Delete reviews", "Permanently remove a review."),
    ] },
  ] },
  { key: "locations", labelKey: "admin.nav.locations", label: "Locations", scopeable: true, groups: [
    { id: "catalogue", label: "Catalogue", perms: [
      p("locations.view", "View locations", "Open the city, district and project tree."),
      p("locations.create", "Create locations", "Add cities, districts and projects."),
      p("locations.edit", "Edit locations", "Rename or restructure locations."),
      p("locations.delete", "Delete locations", "Remove locations from the tree."),
    ] },
  ] },
  { key: "reports", labelKey: "admin.nav.reports", label: "Reports", scopeable: true, groups: [
    { id: "reporting", label: "Reporting", perms: [
      p("reports.view", "View reports", "Open sales, rental and performance reports."),
      p("reports.export", "Export reports", "Download reports as PDF or spreadsheet."),
    ] },
  ] },
  { key: "roles", labelKey: "admin.nav.roles", label: "Roles & permissions", scopeable: true, groups: [
    { id: "governance", label: "Governance", perms: [
      p("roles.view", "View roles", "Open the roles & permissions screen."),
      p("roles.create", "Create roles", "Add new roles for staff or members."),
      p("roles.edit", "Edit role permissions", "Toggle grants and scopes on a role."),
      p("roles.delete", "Delete roles", "Remove custom roles from the platform."),
    ] },
  ] },
  { key: "audit", labelKey: "admin.nav.audit", label: "Audit log", scopeable: true, groups: [
    { id: "oversight", label: "Oversight", perms: [
      p("audit.view", "View audit logs", "Review the security and activity log."),
    ] },
  ] },
  { key: "settings", labelKey: "admin.nav.settings", label: "Settings", scopeable: true, groups: [
    { id: "platform", label: "Platform", perms: [
      p("settings.view", "View settings", "Access the platform settings area."),
      p("settings.manage", "Manage platform settings", "Change global platform configuration."),
    ] },
  ] },
];

/* ------------------------------ member surface -----------------------------
   The website and mobile app share this catalogue; every permission is
   implicitly scoped to the member's own account, so there is no scope axis. */
export const MEMBER_SECTIONS_V2: SectionV2[] = [
  { key: "browse", labelKey: "admin.rolesV2.section.browse", label: "Browse", scopeable: false, groups: [
    { id: "discover", label: "Discover", perms: [
      p("browse.search", "Browse listings", "Explore properties on the home and search screens."),
      p("browse.property", "View property details", "Open a listing's full detail page and gallery."),
      p("browse.agents", "View agent profiles", "See agent profiles and their active listings."),
    ] },
  ] },
  { key: "saved", labelKey: "admin.rolesV2.section.saved", label: "Saved", scopeable: false, groups: [
    { id: "collections", label: "Collections", perms: [
      p("saved.properties", "Save properties", "Add listings to a personal saved collection."),
      p("saved.agents", "Save agents", "Follow agents and keep them in Saved."),
    ] },
  ] },
  { key: "tours", labelKey: "admin.rolesV2.section.tours", label: "Viewings", scopeable: false, groups: [
    { id: "requests", label: "Requests", perms: [
      p("tours.request", "Request viewings", "Book a viewing appointment for a listing."),
      p("tours.cancel", "Cancel viewings", "Cancel a viewing they previously requested."),
    ] },
  ] },
  { key: "selling", labelKey: "admin.rolesV2.section.selling", label: "My listings", scopeable: false, groups: [
    { id: "owned", label: "Owned listings", perms: [
      p("selling.submit", "Submit a listing", "List a property for review through the sell flow."),
      p("selling.edit", "Edit own listings", "Update the details of their own submissions."),
      p("selling.delete", "Delete own listings", "Remove a listing they created."),
    ] },
  ] },
  { key: "memberReviews", labelKey: "admin.rolesV2.section.memberReviews", label: "Reviews", scopeable: false, groups: [
    { id: "feedback", label: "Feedback", perms: [
      p("memberReviews.submit", "Submit agent reviews", "Rate an agent after a viewing; published once approved."),
    ] },
  ] },
  { key: "account", labelKey: "admin.rolesV2.section.account", label: "Account", scopeable: false, groups: [
    { id: "profile", label: "Profile", perms: [
      p("account.profile", "Edit profile", "Update name, photo, contact and location."),
      p("account.password", "Change password", "Update their account password."),
      p("account.notifications", "Manage notifications", "Read, mark and clear their notifications."),
    ] },
  ] },
];

/* --------------------------------- lookups -------------------------------- */

export interface FlatPermV2 extends PermV2 { sectionKey: string; groupId: string }

function flatten(sections: SectionV2[]): FlatPermV2[] {
  return sections.flatMap((s) => s.groups.flatMap((g) => g.perms.map((perm) => ({ ...perm, sectionKey: s.key, groupId: g.id }))));
}
export const FLAT_V2: FlatPermV2[] = flatten(SECTIONS_V2);
export const MEMBER_FLAT_V2: FlatPermV2[] = flatten(MEMBER_SECTIONS_V2);

export function sectionsFor(surface: SurfaceV2): SectionV2[] {
  return surface === "member" ? MEMBER_SECTIONS_V2 : SECTIONS_V2;
}
export function flatFor(surface: SurfaceV2): FlatPermV2[] {
  return surface === "member" ? MEMBER_FLAT_V2 : FLAT_V2;
}
export function totalFor(surface: SurfaceV2): number {
  return flatFor(surface).length;
}
/** Every permission of one section, in catalogue order. */
export function sectionPerms(surface: SurfaceV2, sectionKey: string): FlatPermV2[] {
  return flatFor(surface).filter((perm) => perm.sectionKey === sectionKey);
}
/** The root permission of a section — granting anything else implies it. */
export function viewIdOf(sectionKey: string): string {
  return sectionKey + ".view";
}

export const SCOPE_OPTS_V2: { value: ScopeVal; labelKey: string }[] = [
  { value: "own", labelKey: "admin.rolesV2.scope.own" },
  { value: "team", labelKey: "admin.rolesV2.scope.team" },
  { value: "org", labelKey: "admin.rolesV2.scope.org" },
];

/* --------------------------------- roles ---------------------------------- */

/** Per-section grant spec: everything, nothing, or named actions (+ scope). */
type SpecV2 = "all" | "none" | { perms: string[]; scope?: ScopeVal };

export interface RoleSeedV2 {
  id: string;
  name: string;
  dot: string;
  icon: IconName;
  system: boolean;
  locked?: boolean;
  surface: SurfaceV2;
  users: number;
  desc: string;
  spec: Record<string, SpecV2>;
}

export interface RoleStateV2 extends RoleSeedV2 {
  grant: Record<string, boolean>;
  /** One scope per scopeable section; org-only sections are pinned to "org". */
  scope: Record<string, ScopeVal>;
}

export function buildRoleV2(spec: Record<string, SpecV2>, surface: SurfaceV2): { grant: Record<string, boolean>; scope: Record<string, ScopeVal> } {
  const grant: Record<string, boolean> = {};
  const scope: Record<string, ScopeVal> = {};
  sectionsFor(surface).forEach((section) => {
    const s = spec[section.key];
    const cfg = s && typeof s === "object" ? s : null;
    scope[section.key] = section.scopeable ? (cfg?.scope ?? "org") : "org";
    sectionPerms(surface, section.key).forEach((perm) => {
      const action = perm.id.slice(section.key.length + 1);
      grant[perm.id] = s === "all" ? true : cfg ? cfg.perms.includes(action) : false;
    });
  });
  return { grant, scope };
}

export function countGrantV2(grant: Record<string, boolean>, surface: SurfaceV2): number {
  return flatFor(surface).reduce((n, perm) => n + (grant[perm.id] ? 1 : 0), 0);
}

/* Assigned-user counts come straight from the curated catalog rather than
   being typed in, so the badge on each role can't drift from the real records:
   one super admin (the single admin account), one row per agent and member. */
const SUPER_ADMIN_COUNT = 1;

/* Seeds mirror docs/roles-permissions-design.md §4: Super admin holds all 51,
   the Agent keeps full pipeline control over their own book of business and
   read-only reach elsewhere (16 grants, scope "own"), the Member holds the
   whole member catalogue. */
export const ROLES_SEED_V2: RoleSeedV2[] = [
  {
    id: "super-admin", name: "Super admin", dot: "brand", icon: "shield-check", system: true, locked: true, surface: "admin",
    users: SUPER_ADMIN_COUNT,
    desc: "Unrestricted access to every module, setting and permission across the Chiya Estate platform.",
    spec: { dashboard: "all", properties: "all", members: "all", agents: "all", viewings: "all", reviews: "all", locations: "all", reports: "all", roles: "all", audit: "all", settings: "all" },
  },
  {
    id: "agent", name: "Agent", dot: "brand", icon: "badge-check", system: true, surface: "admin",
    users: AGENTS.length,
    desc: "Field agent. Manages their own assigned properties, members and viewings.",
    spec: {
      dashboard: { perms: ["view", "kpis"], scope: "own" },
      properties: { perms: ["view", "create", "edit", "status", "notes"], scope: "own" },
      members: { perms: ["view"], scope: "own" },
      agents: { perms: ["view"], scope: "own" },
      viewings: { perms: ["view", "schedule", "edit", "status", "notes"], scope: "own" },
      // Read-only: agents see reviews written about them but never moderate them.
      reviews: { perms: ["view"], scope: "own" },
      reports: { perms: ["view"], scope: "own" },
      locations: "none",
      roles: "none",
      audit: "none",
      settings: "none",
    },
  },
  {
    id: "member", name: "Member", dot: "brand", icon: "user", system: true, surface: "member",
    users: MEMBERS.length,
    desc: "Public member. Browses listings, saves favourites, requests viewings and manages their own account across the mobile app and website.",
    spec: { browse: "all", saved: "all", tours: "all", selling: "all", memberReviews: "all", account: "all" },
  },
];

/* --------------------------------- matrix --------------------------------- */

/** A matrix cell: not granted, or granted at the section's current reach. */
export type CellV2 = "none" | ScopeVal;

export function cellOf(role: RoleStateV2, perm: FlatPermV2): CellV2 {
  if (!role.grant[perm.id]) return "none";
  return role.scope[perm.sectionKey] ?? "org";
}
