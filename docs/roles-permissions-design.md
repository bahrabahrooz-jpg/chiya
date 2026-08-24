# Chiya — Roles & Permissions Design

**Status:** Design spec (v1) · **Scope:** all four surfaces (admin web, agent console, member website, mobile app)
**Owner screen:** `/admin/roles` ([app/admin/_roles/roles-app.tsx](../app/admin/_roles/roles-app.tsx), catalogue in [app/admin/_roles/data.ts](../app/admin/_roles/data.ts))

This document is the definitive specification for the Chiya permission system: the concepts, the full permission catalogue for every page and action that exists in the product today, the default grants for the three system roles, the target design of the Roles & Permissions screen, and the gaps between this spec and the current code.

---

## 1. Concepts & model

The system is a four-level hierarchy with one orthogonal axis:

```
Surface ─► Section ─► Group ─► Permission        + Scope (own / team / org)
```

| Concept | Definition | Rule |
|---|---|---|
| **Surface** | Which product a role belongs to: `staff` (admin web + agent console) or `member` (public website + mobile app). | A role binds to exactly **one** surface. Matches the existing `Surface` type in `data.ts`. |
| **Section** | One per page/module, mirroring the admin sidebar **1:1**. If a page appears in the nav, it is a section; if a role has no `view` grant in a section, that page disappears from its nav. | 12 staff sections, 6 member sections (below). |
| **Group** | A logical cluster of related actions inside a section (e.g. *Records*, *Publishing*, *Moderation*). Groups exist for UI legibility and master-toggle behaviour — they carry no identity of their own. | Every permission belongs to exactly one group. |
| **Permission** | One atomic action a user can perform, granted as a boolean. | Named with a **stable string ID** (`properties.create`), never a positional index. |
| **Scope** | *Staff surface only.* How far a granted permission reaches: `own` (records assigned to me) / `team` (my team's records) / `org` (everything). Set per scopeable section, orthogonal to the boolean grants. | Matches today's `SCOPE_OPTS`. Member permissions are implicitly self-scoped and carry no scope selector. |

### Role types

| Type | Examples | Rename | Edit permissions | Delete |
|---|---|---|---|---|
| **Locked system role** | Super admin | ✕ | ✕ | ✕ |
| **System role** | Agent, Member | ✕ | ✓ | ✕ |
| **Custom role** | anything created on the screen | ✓ | ✓ | ✓ (guarded) |

### Permission ID convention

> **Recommendation — stable IDs.** Today permissions are addressed positionally (`"properties:2"` = the third perm in the properties category). This is fragile: inserting one permission shifts every index after it, silently corrupting role specs and the enforcement map in [lib/agent-permissions.ts](../lib/agent-permissions.ts). This spec names every permission `section.action` (e.g. `properties.publish`). The implementation pass should migrate `permId` from `cat:index` to these strings; `localIndex` may remain as a display-order hint only.

### Dependency rule

`*.view` is the **root permission of every section**:

- Granting any other permission in a section auto-grants `view` (you can't approve reviews you can't see).
- Revoking `view` revokes the entire section and removes the page from that role's nav.
- The UI enforces this as a cascade at toggle time (see §5).

---

## 2. Staff catalogue — 12 sections, 55 permissions

Sections mirror `NAV_GROUPS` in [components/admin/admin-data.ts](../components/admin/admin-data.ts) exactly. *Evidence* points at the code that implements each action today, so this catalogue stays verifiable against the product.

**Legend for the role columns:** SA = Super admin, AG = Agent (scope `own` everywhere it has grants). ✓* marks a **new proposed default** for a permission that doesn't exist in today's catalogue.

### 2.1 Dashboard (`dashboard`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Overview | `dashboard.view` | View dashboard | `app/admin/page.tsx`, `_dashboard/*` | ✓ | ✓ |
| Overview | `dashboard.kpis` | View KPI cards | KPI cards in `_dashboard` | ✓ | ✓ |
| Overview | `dashboard.analytics` | View analytics charts | performance charts in `_dashboard` | ✓ | ✕ |
| Overview | `dashboard.activity` | View recent activity | recent-activity feed in `_dashboard` | ✓ | ✕ |

### 2.2 Properties (`properties`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Records | `properties.view` | View properties (list + detail) | `PropertiesApp`, `PropertyDetailApp` | ✓ | ✓ |
| Records | `properties.create` | Create properties | `addProperty` via `AddPropertyApp` | ✓ | ✓ |
| Records | `properties.edit` | Edit properties | `updateProperty` via `EditPropertyApp` | ✓ | ✓ |
| Records | `properties.delete` | Delete properties | `removeProperty`, `DeleteConfirmModal` | ✓ | ✕ |
| Publishing | `properties.publish` | Publish properties | status → Published (`ChangeStatusModal`) | ✓ | ✕ |
| Publishing | `properties.archive` | Archive properties | `handleArchive` in `_property-detail` | ✓ | ✕ |
| Publishing | `properties.status` | Change listing status | `ChangeStatusModal` / `handleStatusConfirm` | ✓ | ✓ |
| Assignment | `properties.assign` | Assign / reassign agent | `AssignAgentModal` | ✓ | ✕ |
| Notes | `properties.notes` | Manage internal notes | `handleAddNote/EditNote/DeleteNote` in `_property-detail` | ✓ | ✓* |

> `publish` and `archive` are deliberately separate from `status`: `status` covers the day-to-day pipeline (Available ↔ Under offer ↔ Sold/Rented), while `publish`/`archive` control public visibility and are the two transitions with outward consequences. A role holding `status` but not `publish` can move a listing through the pipeline but cannot make it publicly visible.

### 2.3 Members (`members`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Records | `members.view` | View members | `MembersApp`, `MemberProfileApp` | ✓ | ✓ |
| Records | `members.create` | Create members | `addMember` | ✓ | ✕ |
| Records | `members.edit` | Edit members | `updateMember` | ✓ | ✕ |
| Account control | `members.suspend` | Suspend / activate members | `StatusMemberModal` → `updateMember(status)` | ✓ | ✕ |
| Account control | `members.delete` | Delete members | `removeMember` | ✓ | ✕ |
| Assignment | `members.assign` | Assign members to agents | `AssignAgentModal` in `_member-profile` | ✓ | ✕ |
| Notes | `members.notes` | Manage internal notes | notes handlers in `_member-profile` | ✓ | ✕ |

### 2.4 Agents (`agents`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Records | `agents.view` | View agents | `AgentsApp`, `AgentDetailApp` | ✓ | ✓ |
| Records | `agents.create` | Onboard agents | `addAgent` (starts `verification: "Pending"`) | ✓ | ✕ |
| Records | `agents.edit` | Edit agents | `updateAgent` | ✓ | ✕ |
| Account control | `agents.suspend` | Suspend / activate agents | `handleStatusConfirm` → `updateAgent(status)` | ✓ | ✕ |
| Account control | `agents.delete` | Delete agents | `removeAgent` | ✓ | ✕ |
| Verification | `agents.verify` | Verify / revoke verification | `handleVerifyToggle` → `updateAgent(verification)` | ✓ | ✕ |
| Notes | `agents.notes` | Manage internal notes | notes handlers in `_agent-detail` | ✓ | ✕ |

> `agents.verify` is its own group because verification is a trust decision with public consequences (only Verified agents appear on the website/mobile — see `lib/site-properties.ts`), distinct from ordinary record editing.

### 2.5 Viewings (`viewings`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Scheduling | `viewings.view` | View viewings | `ViewingsApp`, `ViewingDetailApp` | ✓ | ✓ |
| Scheduling | `viewings.schedule` | Schedule viewings | `ScheduleModal` → `handleScheduled` | ✓ | ✓ |
| Scheduling | `viewings.edit` | Edit / reschedule viewings | `openEdit` → `handleScheduled(isEdit)` | ✓ | ✓ |
| Control | `viewings.status` | Change viewing status | `ChangeStatusModal` / `ViewingStatusModal` | ✓ | ✓* |
| Control | `viewings.reassign` | Reassign viewing agent | `ReassignAgentModal` in `_viewing-detail` | ✓ | ✕ |
| Control | `viewings.cancel` | Cancel / delete viewings | `DeleteViewingModal` | ✓ | ✕ |
| Notes | `viewings.notes` | Manage internal notes | notes handlers in `_viewing-detail` | ✓ | ✓* |

> `viewings.status` (Requested → Confirmed → Completed / No-show) is proposed for agents at `own` scope: an agent must be able to mark the outcome of their own appointments. `cancel` stays admin-only; an agent who can't make a viewing edits/reschedules it instead.

### 2.6 Reviews (`reviews`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Moderation | `reviews.view` | View reviews | `ReviewsApp` (agent gets `readOnly`) | ✓ | ✓ |
| Moderation | `reviews.approve` | Approve reviews | `approve()` + `logAudit(approvedReview)` | ✓ | ✕ |
| Moderation | `reviews.reject` | Reject reviews | `reject()` + `logAudit(rejectedReview)` | ✓ | ✕ |
| Moderation | `reviews.delete` | Delete reviews | `confirmDelete()` + `logAudit(deletedReview)` | ✓ | ✕ |

> Agents never moderate reviews about themselves — that's a structural conflict of interest, not a per-role choice. Even a custom staff role scoped `own` should not combine `reviews.approve` with own-scope; the screen should warn on this combination (§5, guardrails).

### 2.7 Messages (`messages`) — org-only *(new section)*

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Inbox | `messages.view` | View messages | `MessagesApp` | ✓ | ✕ |
| Inbox | `messages.reply` | Reply to messages | `reply()` + `logAudit(repliedMessage)` | ✓ | ✕ |
| Inbox | `messages.archive` | Archive messages | `archive()` + `logAudit(archivedMessage)` | ✓ | ✕ |
| Inbox | `messages.delete` | Delete messages | `confirmDelete()` + `logAudit(deletedMessage)` | ✓ | ✕ |

> Org-only, unlike the record sections: contact enquiries are addressed to the platform, and a message from a stranger belongs to no agent — there is no "own" subset for a scope selector to pick out.

### 2.8 Locations (`locations`) — scopeable *(new section)*

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Catalogue | `locations.view` | View location tree | `LocationsApp` | ✓ | ✕ |
| Catalogue | `locations.create` | Create locations | `addLocation(name, type, parentId)` | ✓ | ✕ |
| Catalogue | `locations.edit` | Edit locations | `LocationModal` (edit mode) | ✓ | ✕ |
| Catalogue | `locations.delete` | Delete locations | `removeLocation` / `restoreLocations` | ✓ | ✕ |

> Scopeable: the section carries an own/team/org reach selector like the other record sections. Note that *reading* the tree inside the Add-property form is **not** gated by `locations.view` — that gate covers the management page only.

### 2.9 Reports (`reports`) — scopeable

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Analytics | `reports.view` | View reports | `ReportsApp` (KPIs, charts, period switch) | ✓ | ✓ |
| Analytics | `reports.export` | Export data | `onExport("data")` | ✓ | ✕ |

### 2.10 Roles & permissions (`roles`) — org-only *(new section; was `settings:1`)*

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Governance | `roles.view` | View roles | `RolesApp` (list + matrix) | ✓ | ✕ |
| Governance | `roles.create` | Create roles | `createRole` + `logAudit(createdRole)` | ✓ | ✕ |
| Governance | `roles.edit` | Edit role permissions | `toggle(permId)` / scope selectors | ✓ | ✕ |
| Governance | `roles.delete` | Delete roles | `deleteRole` + `logAudit(deletedRole)` | ✓ | ✕ |

### 2.11 Audit log (`audit`) — org-only *(new section; was `settings:2`)*

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Oversight | `audit.view` | View audit log | `AuditApp` / `useAuditLog()` | ✓ | ✕ |

### 2.12 Settings (`settings`) — org-only

| Group | Permission ID | Label | Evidence | SA | AG |
|---|---|---|---|---|---|
| Platform | `settings.view` | View settings | `app/admin/settings` (placeholder today) | ✓ | ✕ |
| Platform | `settings.manage` | Manage platform settings | reserved — page not built yet | ✓ | ✕ |

### Out of scope (self-service, never permission-gated)

Own profile editing (`/admin/profile`, `/agent/profile`), own password change, own notification inbox (`/admin/notifications`), theme and language. Every signed-in user gets these; they never appear in the catalogue.

---

## 3. Member catalogue — 6 sections, 14 permissions

Applies to the public website and the mobile app identically (the mobile app is a hand-mirror of the member web experience). All member permissions are implicitly **self-scoped** — no scope selector.

**M = Member default.**

### 3.1 Browse (`browse`)

| Permission ID | Label | Evidence | M |
|---|---|---|---|
| `browse.search` | Search & browse properties | `/search`, mobile `search` tab | ✓ |
| `browse.property` | View property details | `/property/[id]`, mobile `property/[id]` | ✓ |
| `browse.agents` | View agent profiles | `/agents`, `/agents/[id]`, mobile `agents` tab | ✓ |

### 3.2 Saved (`saved`)

| Permission ID | Label | Evidence | M |
|---|---|---|---|
| `saved.properties` | Save / unsave properties | `favorite-button.tsx`, `lib/favorites.ts` (web + mobile) | ✓ |
| `saved.agents` | Save agents | favorites on agent cards | ✓ |

### 3.3 Viewings (`tours`)

| Permission ID | Label | Evidence | M |
|---|---|---|---|
| `tours.request` | Request a viewing | `BookModal` in `pdp-aside.tsx`, mobile `BookViewingSheet` → `lib/viewings.ts` | ✓ |
| `tours.track` | Track / cancel own viewings | `/viewings`, mobile `viewings` tab | ✓ |

### 3.4 Selling (`selling`)

| Permission ID | Label | Evidence | M |
|---|---|---|---|
| `selling.submit` | Submit a listing | `/my-listings/new` (`AddPropertyApp mode="member"`), `lib/listings.ts`; mobile `my-listings/new` | ✓ |
| `selling.edit` | Edit own listings | `my-listings-app.tsx` edit flow | ✓ |
| `selling.delete` | Delete own listings | `my-listings-app.tsx` delete confirm | ✓ |

### 3.5 Reviews (`memberReviews`) *(new section)*

| Permission ID | Label | Evidence | M |
|---|---|---|---|
| `memberReviews.submit` | Submit an agent review (goes to moderation as *Pending*) | mobile review submission → admin Reviews tab | ✓ |

> The member side of the moderation pipeline: members submit, staff with `reviews.approve`/`reviews.reject` moderate. The web app has no submission form yet (mobile does) — the permission exists now so both surfaces gate on the same flag when web catches up.

### 3.6 Account (`account`)

| Permission ID | Label | Evidence | M |
|---|---|---|---|
| `account.profile` | Edit own profile | `/account/profile`, mobile `account/edit` | ✓ |
| `account.password` | Change password | `/account/change-password`, mobile `account/change-password` | ✓ |
| `account.notifications` | Manage notification preferences | `/notifications`, mobile `account/notifications` | ✓ |

> Why gate member actions at all, when the Member role grants everything? Because the same switches are the **enforcement points for account states**: a suspended member keeps `browse.*` but loses `selling.submit` and `tours.request`; a future "restricted" custom role can be modelled without new code. The catalogue is the vocabulary; roles are sentences.

---

## 4. Default role matrix

| Role | Surface | Type | Grants | Scope |
|---|---|---|---|---|
| **Super admin** | staff | locked system | **55 / 55** — everything | `org` |
| **Agent** | staff | system | **16 / 55** (below) | `own` on every scopeable section |
| **Member** | member | system | **14 / 14** — everything | self (implicit) |

**Agent — the 16 grants** (preserves today's `ROLES_SEED` spec; ✓* = new perms with proposed defaults):

| Section | Granted | Withheld |
|---|---|---|
| Dashboard | view, kpis | analytics, activity |
| Properties | view, create, edit, status, notes✓* | delete, publish, archive, assign |
| Members | view | everything else |
| Agents | view | everything else |
| Viewings | view, schedule, edit, status✓*, notes✓* | reassign, cancel |
| Reviews | view | approve, reject, delete |
| Reports | view | export |
| Messages / Locations / Roles / Audit / Settings | — | all (sections hidden from nav) |

The shape of the Agent role: *full pipeline control over their own book of business, read-only visibility into adjacent records, zero reach into governance.* An agent can create and work a listing but can't make it public (`publish`), can't remove records (`delete`, `cancel`), can't move work between agents (`assign`, `reassign`), and never sees platform administration.

---

## 5. The Roles & Permissions screen — target design

Most of this is already built in `roles-app.tsx`; items marked **(new)** are additions this spec introduces.

### Layout — two views, one segmented control

**A. Role detail editor** (default view)

```
┌────────────────────────────────────────────────────────────────────┐
│  Roles & permissions                        [ Detail | Matrix ]    │
├──────────────┬─────────────────────────────────────────────────────┤
│ ROLE LIST    │  ⛨ Agent          system · 35 users    16/55 granted│
│ ⛨ Super admin│  [ Permissions | Settings ]                         │
│ ⛨ Agent    ● │ ┌───────────┐ ┌────────────────────────────────────┐│
│ ⛨ Member     │ │ SECTIONS  │ │ Properties            Scope: [Own ▾]││
│              │ │ Dashboard │ │ ┌─ Records ──────────────── [◉]──┐ ││
│ + New role   │ │ Properties│ │ │  View properties         [◉]  │ ││
│              │ │ Members   │ │ │  Create properties       [◉]  │ ││
│              │ │ Agents    │ │ │  Edit properties         [◉]  │ ││
│              │ │ Viewings  │ │ │  Delete properties       [○]  │ ││
│              │ │ Reviews   │ │ └────────────────────────────────┘ ││
│              │ │ Locations │ │ ┌─ Publishing ────────────── [○]──┐ ││
│              │ │ Reports   │ │ │  Publish properties      [○]  │ ││
│              │ │ Roles     │ │ │  ...                           │ ││
│              │ │ Audit log │ │ └────────────────────────────────┘ ││
│              │ │ Settings  │ └────────────────────────────────────┘│
└──────────────┴─┴───────────┴──────────────────────────────────────┘
```

- **Left rail:** role list with icon, tone dot, user count; locked roles show a lock glyph. `+ New role` at the bottom.
- **Section nav:** one entry per sidebar page (the 1:1 mapping made visible). Each entry shows a mini-count (`5/9`).
- **Section panel:** one card per group. Group header carries a **master toggle** (on = all perms in group; mixed state shown as intermediate). Each row: label, one-line description, switch. Scopeable sections show one **scope selector** (Own / Team / Organisational) in the section header. Header shows the role's total granted count against the surface total.
- **Settings tab:** name, description, icon picker, danger zone (delete role).

**B. Matrix view** — roles as columns, permissions as rows grouped by section; cells are ✓/✕ (with scope letter for scopeable sections, e.g. ✓ᵒ = granted at own scope). Read-only comparison; clicking a column header jumps to that role's editor.

### Interaction rules

1. **Dependency cascade (new):** toggling on any perm in a section auto-enables `view` (with a subtle flash on the row it enabled); toggling off `view` prompts *"This hides the entire &lt;section&gt; page for this role"* and clears the section on confirm.
2. **Master toggles:** group toggle sets all children; child changes recompute the master (on / off / mixed).
3. **Counts update live** — section mini-counts, header total, role-list badge.
4. **Every change is audited (extend):** grant toggles and scope changes log to the audit trail (`role` category), not just create/delete as today.

### Guardrails

| Guardrail | Rule |
|---|---|
| Locked role | Super admin: all toggles disabled, no rename, no delete. |
| System roles | Agent, Member: editable permissions, but no rename/delete. |
| Lock-out prevention **(new)** | A role cannot remove its own `roles.edit` grant — the last role able to manage permissions can never lock everyone out. |
| Conflict warning **(new)** | Warn when a staff role combines `reviews.approve`/`reject` with `own` scope (self-moderation conflict, §2.6). |
| Delete guard | Custom roles only; confirm modal states the assigned-user count and requires choosing a reassignment target role if > 0. |
| Surface integrity | A role's surface is fixed at creation; staff perms never appear on a member role or vice versa. |

---

## 6. Flows

### 6.1 Create role
1. `+ New role` → modal: **surface** (Staff / Member — fixed after creation), name, icon, tone, description.
2. **Start from** *(new)*: Blank, or **clone an existing role** of the same surface (copies grants + scopes — the common real-world path: "like Agent, but can also export reports").
3. Create → lands in the detail editor on the new role → toggle permissions → audit event `createdRole`.

### 6.2 Edit permissions
Toggle a switch → dependency cascade (§5) → counts update → audit event (perm id, old → new). Scope change → audit event. No save button — edits apply immediately (current screen behaviour), with audit as the record.

### 6.3 Delete role
Settings tab → danger zone → confirm modal (blocked for system/locked; shows assigned-user count and reassignment picker) → delete → audit event `deletedRole`.

### 6.4 From grant to enforcement (the runtime path)

The pattern already proven by the agent console, generalized:

```
catalogue (data.ts) ─► role spec ─► buildRole() ─► { grant, scope }
                                        │
                          can("properties", …) / scopeOf("properties")
                                        │
        ┌───────────────────────────────┼──────────────────────────────┐
   nav filtering                 action gating                  data scoping
   (hide pages the role     (hide/disable buttons the       (own → filter records
    can't view — as          role lacks — as `readOnly`/     by assignee — as
    agent-data.ts does)      hidden moderation controls)     useAgentData() does)
```

Every permission is enforced at up to three layers: **nav** (can I see the page), **action** (can I see the button), **scope** (which records the page shows). `lib/agent-permissions.ts` + the `scopeAgent`/`readOnly`/`lockedAgentId` props on the shared admin apps are the existing reference implementation for all three.

---

## 7. Gap list — current code vs this spec

Checklist for the future implementation pass, in rough dependency order:

| # | Gap | Where | What changes |
|---|---|---|---|
| 1 | Positional perm IDs (`properties:2`) | `data.ts`, `lib/agent-permissions.ts`, `MATRIX_ROWS` | Migrate to stable `section.action` IDs; update every consumer in the same commit. |
| 2 | Missing staff sections | `data.ts` `CATS` | Add `locations`, `roles`, `audit`; shrink `settings` to view/manage. Sidebar↔section mapping becomes 1:1. |
| 3 | Missing staff permissions | `data.ts` | Add `agents.verify`, `viewings.status`, `viewings.reassign`, `*.notes` (properties/members/agents/viewings), split `properties.publish`/`archive`/`status` per §2.2. |
| 4 | Missing member section | `data.ts` `MEMBER_CATS` | Add `memberReviews.submit` (mobile already submits reviews as pending). |
| 5 | i18n | `lib/i18n/{en,ar,ku}.ts` | New `perm.*` keys for every added permission/section, in all three languages (`permKey` in `lib/fmt.ts` derives keys from labels). |
| 6 | Agent spec update | `ROLES_SEED` | Re-express the Agent role against the new catalogue (16 grants, §4); verify `lib/agent-permissions.ts` output is unchanged for existing behaviour. |
| 7 | Grant-toggle auditing | `roles-app.tsx`, `audit-log.ts` | Log toggle/scope changes, not just create/delete; new action keys + verbs. |
| 8 | Dependency cascade + guardrails | `roles-app.tsx` | View-root cascade, lock-out prevention, conflict warning, clone-on-create. |
| 9 | No admin-surface enforcement | all `app/admin/_*/**-app.tsx` | Admin renders every action unconditionally today. Introduce a `useCan(permId)` hook (generalizing `agent-permissions.ts`) consumed by nav + action sites. |
| 10 | Role edits not persisted | `roles-app.tsx` | Role state is `useState` from `ROLES_SEED` — toggles vanish on reload. Persist (localStorage store, same pattern as `audit-log.ts`) so edits actually drive enforcement. |
| 11 | Hard-coded identities | `lib/admin-auth.ts`, `lib/agent-session.ts`, `lib/auth.ts` | Each surface assumes its role; agent console has no auth guard; website only ever creates `customer` users; mobile has no session/role layer. Real RBAC needs role attached to the session, resolved at login. |
| 12 | Ungated member flows | `pdp-aside.tsx` | Viewing requests skip the auth gate today; `tours.request` should require sign-in like `selling.submit` does. |

Items 1–8 are contained within the roles screen + catalogue + i18n. Items 9–12 are the enforcement programme — a separate, larger effort this document intentionally only frames.
