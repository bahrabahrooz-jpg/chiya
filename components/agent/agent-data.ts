import type { NavGroupDef, NavItemDef } from "@/components/admin/admin-data";
import { AGENT } from "@/lib/agent-permissions";

/* Agent navigation — the same shell nav as admin, filtered to the modules the
   Agent role can view. Locations, Roles and Settings fall away automatically. */
const ALL_GROUPS: NavGroupDef[] = [
  { label: "Overview", labelKey: "agent.nav.overview", items: [{ id: "dashboard", label: "Dashboard", labelKey: "agent.nav.dashboard", icon: "layout-dashboard", href: "/agent" }] },
  {
    label: "Management",
    labelKey: "agent.nav.management",
    items: [
      { id: "properties", label: "My properties", labelKey: "agent.nav.properties", icon: "building-2", href: "/agent/properties" },
      { id: "viewings", label: "My viewings", labelKey: "agent.nav.viewings", icon: "calendar-check", href: "/agent/viewings" },
      { id: "members", label: "Members", labelKey: "agent.nav.members", icon: "users", href: "/agent/members" },
    ],
  },
  { label: "Insights", labelKey: "agent.nav.insights", items: [{ id: "reports", label: "Reports", labelKey: "agent.nav.reports", icon: "chart-column", href: "/agent/reports" }] },
];

const CAN_VIEW: Record<string, boolean> = {
  dashboard: AGENT.dashboard.view,
  properties: AGENT.properties.view,
  viewings: AGENT.viewings.view,
  members: AGENT.members.view,
  reports: AGENT.reports.view,
};

export const AGENT_NAV_GROUPS: NavGroupDef[] = ALL_GROUPS.map((g) => ({
  ...g,
  items: g.items.filter((it) => CAN_VIEW[it.id]),
})).filter((g) => g.items.length > 0);

export const AGENT_NAV_FLAT: NavItemDef[] = AGENT_NAV_GROUPS.flatMap((g) => g.items);

export function activeAgentNavId(pathname: string): string {
  if (pathname === "/agent") return "dashboard";
  const seg = pathname.replace(/^\/agent\/?/, "").split("/")[0];
  return AGENT_NAV_FLAT.find((n) => n.id === seg)?.id || "dashboard";
}
