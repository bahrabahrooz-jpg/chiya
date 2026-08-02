/**
 * Agent permissions — derived from the "Agent" role defined on the Roles &
 * permissions page, so that screen is the single source of truth for what the
 * agent surface can do. If the role spec changes there, this surface follows.
 *
 * The Agent role (app/admin/_roles/data.ts) grants, all scoped to "own":
 *   dashboard  view, KPI cards                 (not analytics/activity)
 *   properties view, create, edit, status, notes (not delete/publish/archive/assign)
 *   members    view
 *   agents     view
 *   viewings   view, schedule, edit, status, notes (not reassign/cancel)
 *   reviews    view                            (not approve/reject/delete)
 *   reports    view                            (not export)
 *   locations / roles / audit / settings — none
 */

import { ROLES_SEED_V2, buildRoleV2 } from "@/app/admin/_roles/data";

const AGENT_ROLE = ROLES_SEED_V2.find((r) => r.id === "agent")!;
const { grant, scope } = buildRoleV2(AGENT_ROLE.spec, AGENT_ROLE.surface);

/** Raw check: does the agent hold this permission? id is "<section>.<action>". */
export function can(permId: string): boolean {
  return grant[permId] === true;
}

/** Access scope for a section ("own" | "team" | "org"). */
export function scopeOf(sectionKey: string): string {
  return scope[sectionKey] ?? "org";
}

/** Named permission flags used across the agent surface (readability). */
export const AGENT = {
  dashboard: { view: can("dashboard.view"), kpis: can("dashboard.kpis"), analytics: can("dashboard.analytics") },
  properties: {
    view: can("properties.view"),
    create: can("properties.create"),
    edit: can("properties.edit"),
    delete: can("properties.delete"),
    publish: can("properties.publish"),
    archive: can("properties.archive"),
    assign: can("properties.assign"),
    status: can("properties.status"),
  },
  members: { view: can("members.view"), create: can("members.create"), edit: can("members.edit") },
  agents: { view: can("agents.view"), create: can("agents.create"), edit: can("agents.edit") },
  viewings: { view: can("viewings.view"), schedule: can("viewings.schedule"), edit: can("viewings.edit"), cancel: can("viewings.cancel") },
  reviews: { view: can("reviews.view"), approve: can("reviews.approve"), reject: can("reviews.reject"), delete: can("reviews.delete") },
  reports: { view: can("reports.view"), export: can("reports.export") },
} as const;

/** Whether the agent works only on their own records. */
export const OWN_SCOPE = scopeOf("properties") === "own";
