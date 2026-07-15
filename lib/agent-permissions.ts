/**
 * Agent permissions — derived from the "Agent" role defined on the Roles &
 * permissions page, so that screen is the single source of truth for what the
 * agent surface can do. If the role spec changes there, this surface follows.
 *
 * The Agent role (app/admin/_roles/data.ts) grants, all scoped to "own":
 *   dashboard  view, KPI cards            (not analytics)
 *   properties view, create, edit, status (not delete/publish/archive/assign)
 *   members    view
 *   agents     view
 *   viewings   view, schedule, edit       (not cancel)
 *   reviews    view                       (not approve/reject/delete)
 *   reports    view                       (not export)
 *   settings   —  (none)   locations —  (not in role)
 */

import { ROLES_SEED, buildRole } from "@/app/admin/_roles/data";

const AGENT_SPEC = ROLES_SEED.find((r) => r.id === "agent")!.spec;
const { grant, scope } = buildRole(AGENT_SPEC);

/** Raw check: does the agent hold permission #idx in a category? */
export function can(catKey: string, idx: number): boolean {
  return grant[`${catKey}:${idx}`] === true;
}

/** Access scope for a category ("own" | "team" | "org"). */
export function scopeOf(catKey: string): string {
  // every scopeable group in a category shares the same scope for this role
  const key = Object.keys(scope).find((k) => k.startsWith(catKey + "/"));
  return key ? scope[key] : "org";
}

/** Named permission flags used across the agent surface (readability). */
export const AGENT = {
  dashboard: { view: can("dashboard", 0), kpis: can("dashboard", 1), analytics: can("dashboard", 2) },
  properties: {
    view: can("properties", 0),
    create: can("properties", 1),
    edit: can("properties", 2),
    delete: can("properties", 3),
    publish: can("properties", 4),
    archive: can("properties", 5),
    assign: can("properties", 6),
    status: can("properties", 7),
  },
  members: { view: can("members", 0), create: can("members", 1), edit: can("members", 2) },
  agents: { view: can("agents", 0), create: can("agents", 1), edit: can("agents", 2) },
  viewings: { view: can("viewings", 0), schedule: can("viewings", 1), edit: can("viewings", 2), cancel: can("viewings", 3) },
  reviews: { view: can("reviews", 0), approve: can("reviews", 1), reject: can("reviews", 2), delete: can("reviews", 3) },
  reports: { view: can("reports", 0), export: can("reports", 1) },
} as const;

/** Whether the agent works only on their own records. */
export const OWN_SCOPE = scopeOf("properties") === "own";
