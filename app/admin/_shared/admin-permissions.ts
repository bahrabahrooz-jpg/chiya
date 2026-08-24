/**
 * What the person using the ADMIN console is allowed to do.
 *
 * Resolved from the signed-in actor's role against the Roles & permissions
 * catalogue (app/admin/_roles/data), so that screen stays the single source of
 * truth for both surfaces — the agent console reads the same catalogue through
 * lib/agent-permissions.
 *
 * ⚠ DEMO SCOPE, exactly like the audit log. There is no authentication yet, so
 * the "signed-in actor" is the hardcoded ADMIN identity in
 * components/admin/admin-data, which holds the Super admin role and therefore
 * passes every check. That does NOT make these gates decorative: they put the
 * decision in one place, expressed against real permission ids, so when auth
 * arrives the only thing that changes is where `currentRoleId` gets its answer.
 * A gate written now is a gate that works then; a `true` sprinkled inline is not.
 *
 * This is a UI affordance either way. Anything that must actually hold — an
 * immutable agreed rate, an issued invoice — is enforced in the store.
 */

import { ROLES_SEED_V2, buildRoleV2 } from "@/app/admin/_roles/data";
import { ADMIN } from "@/components/admin/admin-data";

/** The role the current admin actor holds. See the DEMO SCOPE note above. */
function currentRoleId(): string {
  return ADMIN.role.toLowerCase().replace(/\s+/g, "-");
}

const role = ROLES_SEED_V2.find((r) => r.id === currentRoleId()) ?? ROLES_SEED_V2.find((r) => r.id === "super-admin")!;
const { grant } = buildRoleV2(role.spec, role.surface);

/** Does the current admin actor hold this permission? id is "<section>.<action>". */
export function adminCan(permId: string): boolean {
  return grant[permId] === true;
}

/**
 * Named flags for the admin console.
 *
 * `settings.manage` — "Change global platform configuration" — is what gates
 * the exchange-rate panel. Owner and admin hold it; the Agent role is
 * `settings: "none"` and holds nothing here. Rates decide what price every
 * visitor sees converted and how the public price filter matches, so it is not
 * something an individual agent should be able to move.
 */
export const ADMIN_PERMS = {
  settings: { view: adminCan("settings.view"), manage: adminCan("settings.manage") },
} as const;
