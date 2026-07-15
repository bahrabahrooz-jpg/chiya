"use client";

import { useSyncExternalStore } from "react";
import { ADMIN } from "@/components/admin/admin-data";

/* ----------------------------------------------------------------------------
   Audit log — a module singleton that records *who did what, when* across the
   admin. Any action site (the properties store, the reviews app, the roles app)
   calls `logAudit(...)`; the audit page subscribes via `useAuditLog()`.

   DEMO SCOPE: this is a UI/design feature, not a real security control. The
   "actor" is the hardcoded ADMIN identity (there is no auth yet) and events are
   persisted only to this browser's localStorage — a real, tamper-resistant
   audit trail is deferred until a backend + authentication exist. Kept as a
   standalone module (like lib/listings.ts / lib/notifications.ts) so emit is
   decoupled from display without provider plumbing.
   ------------------------------------------------------------------------- */

export type AuditCategory = "review" | "property" | "member" | "agent" | "location" | "role";

/** The kind of change an action made — the audit table's "Action" column. */
export type AuditVerb = "create" | "update" | "delete" | "approve" | "reject";

/**
 * The platform's three roles — the system roles in ROLES_SEED (../_roles/data)
 * and nothing else. Stored as the `role.*` catalog suffix rather than a display
 * string so the User column can't drift from the role catalogue and translates
 * with the rest of the page.
 */
export type AuditRole = "superAdmin" | "agent" | "member";

export interface AuditActor {
  name: string;
  role: AuditRole;
}

export interface AuditEvent {
  id: string;
  at: string; // ISO timestamp
  actor: AuditActor;
  category: AuditCategory;
  /** i18n key for the verb phrase, e.g. "audit.action.approvedReview". */
  actionKey: string;
  /** Params for `actionKey`. A value prefixed with "@" is itself a catalog key
      (e.g. "@status.sold") and is resolved at render time — so a stored event
      still reads correctly after the viewer switches language. */
  actionParams?: Record<string, string>;
  target: string; // human label (real data — never translated), e.g. "Marble Hill Villa"
  targetId?: string;
  /** i18n key for the optional detail line (translated). */
  metaKey?: string;
  metaParams?: Record<string, string>;
  /** Raw detail line for real data (e.g. "Ankawa, Erbil") — not translated. */
  meta?: string;
}

/**
 * Resolve "@key" param values through the catalog; plain values pass through.
 * Re-exported from lib/fmt so audit callers keep their existing import.
 */
export { resolveParams as resolveAuditParams } from "@/lib/fmt";

/* --------------------------- action presentation ---------------------------
   The verb and the long description both hang off `actionKey`, derived rather
   than stored on the event: emit sites stay a one-liner, the mapping lives in
   one place, and events already sitting in localStorage pick up new entries
   without another storage version bump. */

/** Only the actions that aren't a plain modification are listed. */
const ACTION_VERB: Record<string, AuditVerb> = {
  "audit.action.approvedReview": "approve",
  "audit.action.verifiedAgent": "approve",
  "audit.action.rejectedReview": "reject",
  "audit.action.revokedVerification": "reject",
  "audit.action.createdProperty": "create",
  "audit.action.addedMember": "create",
  "audit.action.onboardedAgent": "create",
  "audit.action.createdRole": "create",
  "audit.action.addedCity": "create",
  "audit.action.addedDistrict": "create",
  "audit.action.addedProject": "create",
  "audit.action.deletedReview": "delete",
  "audit.action.deletedProperty": "delete",
  "audit.action.removedMember": "delete",
  "audit.action.removedAgent": "delete",
  "audit.action.deletedRole": "delete",
  "audit.action.removedCity": "delete",
  "audit.action.removedDistrict": "delete",
  "audit.action.removedProject": "delete",
};

/** Anything unlisted edits an existing record: update, archive, assign, suspend… */
export function verbOf(actionKey: string): AuditVerb {
  return ACTION_VERB[actionKey] ?? "update";
}

/**
 * The `audit.desc.*` key paired with an `audit.action.*` key — the sentence
 * explaining what the action actually did, for the table's Details column.
 */
export function descKeyOf(actionKey: string): string {
  return actionKey.replace("audit.action.", "audit.desc.");
}

// v2: events store `actionKey`/`actionParams` instead of an English `action`
// sentence, so persisted v1 events are dropped rather than rendered as keys.
// v3: `actor.role` is a `role.*` catalog suffix ("superAdmin") rather than a
// display string ("Super Admin"), for the same reason — a stored v2 role would
// resolve to no key and render raw.
const STORAGE_KEY = "chiya:admin-audit:v3";
const MAX_EVENTS = 500;

/* Default actor for anything emitted by the current admin session — the only
   admin login in the demo is the platform's single super admin. */
function currentActor(): AuditActor {
  return { name: ADMIN.name, role: "superAdmin" };
}

/* ----------------------------- deterministic seed -------------------------- */
/* Fixed base so module-load produces identical output on server + client (no
   hydration mismatch). Mirrors the deterministic buildReviews() seed. */
const SEED_BASE = new Date("2026-07-15T14:30:00").getTime();
const HOUR = 3_600_000;
const seedAt = (hoursAgo: number) => new Date(SEED_BASE - hoursAgo * HOUR).toISOString();

/** The log's demo "today" — what the date filter's calendar opens on and marks.
    A constant, not `new Date()`, so the server and client renders agree. */
export const AUDIT_TODAY = new Date(SEED_BASE);

interface SeedSpec {
  h: number; // hours ago
  actor: AuditActor;
  category: AuditCategory;
  actionKey: string;
  actionParams?: Record<string, string>;
  target: string;
  metaKey?: string;
  metaParams?: Record<string, string>;
  meta?: string;
}

/* Who acts, and on what. The split mirrors the roles' actual permissions rather
   than being decorative: an Agent's grants stop at their own listings
   (properties [0,1,2,7] — view/create/edit/manage status, scope "own") and are
   read-only everywhere else, so every moderation, account-control, role and
   location event below belongs to the super admin. */
const ADMIN_ACTOR: AuditActor = { name: ADMIN.name, role: "superAdmin" };
const REEM: AuditActor = { name: "Reem Salih", role: "agent" };
const LANA: AuditActor = { name: "Lana Aziz", role: "agent" };

const SEED_SPECS: SeedSpec[] = [
  { h: 1, actor: ADMIN_ACTOR, category: "review", actionKey: "audit.action.approvedReview", target: "Dara Kamal → Rawa Jamal" },
  { h: 2, actor: REEM, category: "property", actionKey: "audit.action.changedStatus", actionParams: { status: "@status.sold" }, target: "Marble Hill Villa" },
  { h: 3, actor: ADMIN_ACTOR, category: "agent", actionKey: "audit.action.verifiedAgent", target: "Lana Aziz" },
  { h: 5, actor: LANA, category: "property", actionKey: "audit.action.createdProperty", target: "Olive Grove Estate", meta: "Ankawa, Erbil" },
  { h: 7, actor: ADMIN_ACTOR, category: "review", actionKey: "audit.action.rejectedReview", target: "Sara Amin → Karwan Ali", metaKey: "audit.meta.flaggedSpam" },
  { h: 9, actor: ADMIN_ACTOR, category: "member", actionKey: "audit.action.suspendedMember", target: "Hersh Qadir" },
  { h: 26, actor: ADMIN_ACTOR, category: "role", actionKey: "audit.action.createdRole", target: "Senior Agent" },
  { h: 28, actor: ADMIN_ACTOR, category: "property", actionKey: "audit.action.assignedAgent", target: "Cedar Court Apartments", metaKey: "audit.meta.assignedTo", metaParams: { name: "Rawa Jamal" } },
  { h: 30, actor: ADMIN_ACTOR, category: "agent", actionKey: "audit.action.suspendedAgent", target: "Bilal Noori" },
  { h: 49, actor: ADMIN_ACTOR, category: "location", actionKey: "audit.action.addedDistrict", target: "Ankawa · Erbil" },
  { h: 52, actor: LANA, category: "property", actionKey: "audit.action.updatedProperty", target: "Riverside Loft" },
  { h: 54, actor: ADMIN_ACTOR, category: "member", actionKey: "audit.action.activatedMember", target: "Nma Rashid" },
  { h: 73, actor: ADMIN_ACTOR, category: "review", actionKey: "audit.action.deletedReview", target: "Aland Tariq → Shad Omar" },
  { h: 78, actor: ADMIN_ACTOR, category: "property", actionKey: "audit.action.archivedProperty", target: "Sunset Terrace" },
];

function buildSeed(): AuditEvent[] {
  return SEED_SPECS.map((s, i) => ({
    id: "AUD-SEED-" + (SEED_SPECS.length - i),
    at: seedAt(s.h),
    actor: s.actor,
    category: s.category,
    actionKey: s.actionKey,
    actionParams: s.actionParams,
    target: s.target,
    metaKey: s.metaKey,
    metaParams: s.metaParams,
    meta: s.meta,
  }));
}

/* SEED is a stable reference: it is the server snapshot AND the initial client
   snapshot, so hydration matches. localStorage (if any) is merged in after mount
   via ensureHydrated(), exactly like the properties store. */
const SEED: AuditEvent[] = buildSeed();

/* ------------------------------- module state ------------------------------ */
let events: AuditEvent[] = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    // Persist only the live (non-seed) events so the seed can evolve across
    // versions without stale copies piling up in storage.
    const live = events.filter((e) => !e.id.startsWith("AUD-SEED-"));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(live));
  } catch {}
}

/* Read persisted live events once (client only) and prepend them to the seed. */
function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const live = JSON.parse(raw) as AuditEvent[];
    if (Array.isArray(live) && live.length) {
      events = [...live, ...SEED].slice(0, MAX_EVENTS);
      emit();
    }
  } catch {}
}

let seq = 0;
function nextId() {
  seq += 1;
  return "AUD-" + Date.now().toString(36) + "-" + seq.toString(36);
}

/**
 * Record an admin action. `actor` defaults to the current admin session.
 * No-ops nothing — always appends. Newest event is first.
 */
export function logAudit(input: {
  category: AuditCategory;
  actionKey: string;
  actionParams?: Record<string, string>;
  target: string;
  targetId?: string;
  metaKey?: string;
  metaParams?: Record<string, string>;
  meta?: string;
  actor?: AuditActor;
}) {
  const event: AuditEvent = {
    id: nextId(),
    at: new Date().toISOString(),
    actor: input.actor ?? currentActor(),
    category: input.category,
    actionKey: input.actionKey,
    actionParams: input.actionParams,
    target: input.target,
    targetId: input.targetId,
    metaKey: input.metaKey,
    metaParams: input.metaParams,
    meta: input.meta,
  };
  events = [event, ...events].slice(0, MAX_EVENTS);
  persist();
  emit();
}

export function getAuditSnapshot(): AuditEvent[] {
  return events;
}

function getServerSnapshot(): AuditEvent[] {
  return SEED;
}

export function subscribeAudit(cb: () => void): () => void {
  listeners.add(cb);
  // Hydrate from localStorage the first time anyone subscribes (client only).
  ensureHydrated();
  return () => {
    listeners.delete(cb);
  };
}

/** Subscribe the audit page to the live event list. */
export function useAuditLog(): AuditEvent[] {
  return useSyncExternalStore(subscribeAudit, getAuditSnapshot, getServerSnapshot);
}

export const CURRENT_ACTOR_NAME = ADMIN.name;
