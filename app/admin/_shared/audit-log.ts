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

export interface AuditActor {
  name: string;
  role: string;
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

// v2: events store `actionKey`/`actionParams` instead of an English `action`
// sentence, so persisted v1 events are dropped rather than rendered as keys.
const STORAGE_KEY = "chiya:admin-audit:v2";
const MAX_EVENTS = 500;

/* Default actor for anything emitted by the current admin session. */
function currentActor(): AuditActor {
  return { name: ADMIN.name, role: ADMIN.role };
}

/* ----------------------------- deterministic seed -------------------------- */
/* Fixed base so module-load produces identical output on server + client (no
   hydration mismatch). Mirrors the deterministic buildReviews() seed. */
const SEED_BASE = new Date("2026-07-15T14:30:00").getTime();
const HOUR = 3_600_000;
const seedAt = (hoursAgo: number) => new Date(SEED_BASE - hoursAgo * HOUR).toISOString();

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

const ADMIN_ACTOR: AuditActor = { name: ADMIN.name, role: ADMIN.role };
const REEM: AuditActor = { name: "Reem Salih", role: "Admin" };
const LANA: AuditActor = { name: "Lana Aziz", role: "Agent" };

const SEED_SPECS: SeedSpec[] = [
  { h: 1, actor: ADMIN_ACTOR, category: "review", actionKey: "audit.action.approvedReview", target: "Dara Kamal → Rawa Jamal", metaKey: "audit.meta.nowPublished" },
  { h: 2, actor: REEM, category: "property", actionKey: "audit.action.changedStatus", actionParams: { status: "@status.sold" }, target: "Marble Hill Villa" },
  { h: 3, actor: ADMIN_ACTOR, category: "agent", actionKey: "audit.action.verifiedAgent", target: "Lana Aziz" },
  { h: 5, actor: LANA, category: "property", actionKey: "audit.action.createdProperty", target: "Olive Grove Estate", meta: "Ankawa, Erbil" },
  { h: 7, actor: ADMIN_ACTOR, category: "review", actionKey: "audit.action.rejectedReview", target: "Sara Amin → Karwan Ali", metaKey: "audit.meta.flaggedSpam" },
  { h: 9, actor: REEM, category: "member", actionKey: "audit.action.suspendedMember", target: "Hersh Qadir" },
  { h: 26, actor: ADMIN_ACTOR, category: "role", actionKey: "audit.action.createdRole", target: "Senior Agent" },
  { h: 28, actor: ADMIN_ACTOR, category: "property", actionKey: "audit.action.assignedAgent", target: "Cedar Court Apartments", metaKey: "audit.meta.assignedTo", metaParams: { name: "Rawa Jamal" } },
  { h: 30, actor: REEM, category: "agent", actionKey: "audit.action.suspendedAgent", target: "Bilal Noori" },
  { h: 49, actor: ADMIN_ACTOR, category: "location", actionKey: "audit.action.addedDistrict", target: "Ankawa · Erbil" },
  { h: 52, actor: LANA, category: "property", actionKey: "audit.action.updatedProperty", target: "Riverside Loft" },
  { h: 54, actor: ADMIN_ACTOR, category: "member", actionKey: "audit.action.activatedMember", target: "Nma Rashid" },
  { h: 73, actor: REEM, category: "review", actionKey: "audit.action.deletedReview", target: "Aland Tariq → Shad Omar" },
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
