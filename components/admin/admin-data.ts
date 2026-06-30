import type { IconName } from "@/components/ui/icon";

/* ------------------------------------------------------------------
   Shared admin-shell data: navigation, notifications, admin identity,
   languages. Ported from the export's shell.jsx / dashboard.jsx.
------------------------------------------------------------------ */

export interface NavItemDef {
  id: string;
  label: string;
  icon: IconName;
  href: string;
  disabled?: boolean;
  tag?: string;
}

export interface NavGroupDef {
  label: string;
  items: NavItemDef[];
}

/** Canonical nav (dashboard.jsx NAV_GROUPS): no "Admins", Reports enabled. */
export const NAV_GROUPS: NavGroupDef[] = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard", href: "/admin" }],
  },
  {
    label: "Management",
    items: [
      { id: "properties", label: "Properties", icon: "building-2", href: "/admin/properties" },
      { id: "members", label: "Members", icon: "users", href: "/admin/members" },
      { id: "agents", label: "Agents", icon: "badge-check", href: "/admin/agents" },
      { id: "viewings", label: "Viewings", icon: "calendar-check", href: "/admin/viewings" },
      { id: "locations", label: "Locations", icon: "map-pin", href: "/admin/locations" },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "reports", label: "Reports", icon: "chart-column", href: "/admin/reports" },
      { id: "roles", label: "Roles & permissions", icon: "key-round", href: "/admin/roles" },
      { id: "settings", label: "Settings", icon: "settings", href: "/admin/settings" },
    ],
  },
];

export const NAV_FLAT: NavItemDef[] = NAV_GROUPS.flatMap((g) => g.items);

/** Map a pathname to the active nav id. */
export function activeNavId(pathname: string): string {
  if (pathname === "/admin") return "dashboard";
  const seg = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  return NAV_FLAT.find((n) => n.id === seg)?.id || "dashboard";
}

export interface LanguageDef {
  code: string;
  label: string;
  native: string;
}

export const LANGUAGES: LanguageDef[] = [
  { code: "EN", label: "English", native: "English" },
  { code: "KU", label: "Kurdî", native: "Soranî · سۆرانی" },
  { code: "AR", label: "العربية", native: "Arabic" },
];

export interface NotificationDef {
  id: number;
  kind: "gold" | "brand" | "warn" | "info";
  icon: IconName;
  unread: boolean;
  title: string;
  desc: string;
  time: string;
}

export const NOTIFICATIONS: NotificationDef[] = [
  { id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
  { id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
  { id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
  { id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" },
];

export const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate", first: "Rêbin" };
