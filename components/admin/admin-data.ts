import type { IconName } from "@/components/ui/icon";

/* ------------------------------------------------------------------
   Shared admin-shell data: navigation, notifications, admin identity,
   languages. Ported from the export's shell.jsx / dashboard.jsx.
------------------------------------------------------------------ */

export interface NavItemDef {
  id: string;
  /** Canonical English label (also the React key); display uses `labelKey` via t(). */
  label: string;
  /** i18n key resolved with `t()` at render time. */
  labelKey: string;
  icon: IconName;
  href: string;
  disabled?: boolean;
  tag?: string;
}

export interface NavGroupDef {
  label: string;
  labelKey: string;
  items: NavItemDef[];
}

/**
 * Canonical nav (dashboard.jsx NAV_GROUPS): no "Admins", Reports enabled.
 * The export's catch-all "Platform" group is split by concern here — Insights
 * (analysis), Website (public-facing copy) and System (access, evidence,
 * configuration) — so each header predicts what it contains.
 */
export const NAV_GROUPS: NavGroupDef[] = [
  {
    label: "Overview",
    labelKey: "admin.nav.overview",
    items: [{ id: "dashboard", label: "Dashboard", labelKey: "admin.nav.dashboard", icon: "layout-dashboard", href: "/admin" }],
  },
  {
    label: "Management",
    labelKey: "admin.nav.management",
    items: [
      { id: "properties", label: "Properties", labelKey: "admin.nav.properties", icon: "building-2", href: "/admin/properties" },
      /* Contracts sits in Management, not a Finance group. Writing a contract is
         operational work an agent does daily — the same shelf as the property it
         is written on — not accounting someone visits at month end. */
      { id: "contracts", label: "Contracts", labelKey: "admin.nav.contracts", icon: "file-signature", href: "/admin/contracts" },
      /* Under Contracts, because every invoice is raised by one. It earns its
         own entry rather than a tab inside the contract screen: a contract
         answers "what does this deal owe", and the question this list answers —
         "who owes us money this week" — spans all of them. */
      { id: "invoices", label: "Invoices", labelKey: "admin.nav.invoices", icon: "receipt", href: "/admin/invoices" },
      /* Beside Invoices and never merged with it. Invoices is what the agency
         is OWED; Payouts is what the agency OWES — other people's rent sitting
         in our account. One screen showing both would invite a single total
         across the two, which is the exact confusion `isAgencyMoney` exists to
         prevent. */
      { id: "payouts", label: "Payouts", labelKey: "admin.nav.payouts", icon: "wallet", href: "/admin/payouts" },
      { id: "members", label: "Members", labelKey: "admin.nav.members", icon: "users", href: "/admin/members" },
      { id: "agents", label: "Agents", labelKey: "admin.nav.agents", icon: "badge-check", href: "/admin/agents" },
      { id: "viewings", label: "Viewings", labelKey: "admin.nav.viewings", icon: "calendar-check", href: "/admin/viewings" },
      { id: "reviews", label: "Reviews", labelKey: "admin.nav.reviews", icon: "star", href: "/admin/reviews" },
      { id: "messages", label: "Inbox", labelKey: "admin.nav.messages", icon: "inbox", href: "/admin/messages" },
      { id: "locations", label: "Locations", labelKey: "admin.nav.locations", icon: "map-pin", href: "/admin/locations" },
    ],
  },
  {
    label: "Insights",
    labelKey: "admin.nav.insights",
    items: [
      { id: "reports", label: "Reports", labelKey: "admin.nav.reports", icon: "chart-column", href: "/admin/reports" },
    ],
  },
  {
    label: "Website",
    labelKey: "admin.nav.website",
    items: [
      { id: "content", label: "Content", labelKey: "admin.nav.content", icon: "file-text", href: "/admin/content" },
    ],
  },
  {
    label: "System",
    labelKey: "admin.nav.system",
    items: [
      /* MESSAGING IS THE OUTBOX; "Messages" up in Management is the INBOX.
         One is what strangers send us through the website contact form, the
         other is what we say to the two people on a contract — a rent reminder
         to a tenant, "your money is here" to a landlord. Merging them would put
         an enquiry from a stranger in the same list as a scheduled reminder, and
         nothing an office does with one it does with the other. They sit in
         different groups so the sidebar itself keeps them apart.

         It is here rather than under Settings because two of its three panes are
         configuration and the third is a LOG, which is the one people open daily
         — the same reason the Audit log is a sidebar entry and not a Settings
         section. */
      { id: "messaging", label: "Messaging", labelKey: "admin.nav.messaging", icon: "message-circle", href: "/admin/messaging" },
      { id: "roles", label: "Roles & permissions", labelKey: "admin.nav.roles", icon: "key-round", href: "/admin/roles" },
      { id: "audit", label: "Audit log", labelKey: "admin.nav.audit", icon: "scroll-text", href: "/admin/audit" },
      { id: "settings", label: "Settings", labelKey: "admin.nav.settings", icon: "settings", href: "/admin/settings" },
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

/* The agent's own feed — things that happen *to* an agent's work, not the
   admin's moderation queue (which the agent can't act on). */
export const AGENT_NOTIFICATIONS: NotificationDef[] = [
  { id: 1, kind: "brand", icon: "calendar-plus", unread: true, title: "New viewing request", desc: "Zana Ibrahim asked to see Marble Hill Villa on Thursday.", time: "15 minutes ago" },
  { id: 2, kind: "gold", icon: "circle-check", unread: true, title: "Listing approved", desc: "Dream City Garden Flat is now live.", time: "1 hour ago" },
  { id: 3, kind: "info", icon: "star", unread: false, title: "New review", desc: "A buyer left you a 5-star review.", time: "Yesterday" },
  { id: 4, kind: "warn", icon: "calendar-x", unread: false, title: "Viewing cancelled", desc: "Naz City Sky Suite — the member cancelled Saturday's viewing.", time: "2 days ago" },
];

export const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate", first: "Rêbin" };
