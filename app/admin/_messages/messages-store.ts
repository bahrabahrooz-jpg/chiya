"use client";

import { useSyncExternalStore } from "react";
import { MESSAGES, sortMessages, type MessageRecord, type MessageSource, type MessageStatus } from "./data";

/* ----------------------------------------------------------------------------
   Contact messages — a module singleton holding the admin's enquiry inbox.

   Unlike the other admin data, this store is WRITTEN from outside the admin:
   the public contact page (app/_contact/contact-app.tsx) calls submitMessage()
   and the inbox picks it up. That rules out the PropertiesProvider context tier
   — that provider wraps app/admin/layout.tsx only, and the public site never
   mounts it. So this follows _shared/audit-log.ts instead: a plain module
   anyone can import, with useSyncExternalStore for the reader.

   DEMO SCOPE: persisted to this browser's localStorage, like everything else
   here. There is no backend, so "Reply" opens the admin's own mail client
   rather than sending anything, and mobile submissions never arrive (see the
   MessageSource note in ./data).
   ------------------------------------------------------------------------- */

const STORAGE_KEY = "chiya:contact-messages:v1";
/** Same-tab change signal. The DOM `storage` event only fires in OTHER tabs, so
    a submission made on the contact page has to be announced explicitly for an
    inbox mounted in the same tab to react. Mirrors properties-store's
    STORE_EVENT. */
const MESSAGES_EVENT = "chiya:contact-messages-changed";

/* SEED is a stable reference: the server snapshot AND the initial client
   snapshot, so hydration matches. localStorage is merged in after mount via
   ensureHydrated(), exactly like the audit log. */
const SEED: MessageRecord[] = MESSAGES;
const SEED_IDS = new Set(SEED.map((m) => m.id));

/**
 * What we keep in storage.
 *
 * The audit log can persist "non-seed rows only" because it only ever appends.
 * This inbox *mutates* the seed — opening MSG-2051 flips it New → Read — so the
 * seed's own changes have to be recorded too. Storing status overrides keyed by
 * id (rather than whole rows) lets the seed's copy, dates and links keep
 * evolving across versions without stale duplicates piling up in storage.
 */
interface Persisted {
  live: MessageRecord[];
  seedStatus: Record<string, MessageStatus>;
  seedDeleted: string[];
}

let messages: MessageRecord[] = SEED;
let seedStatus: Record<string, MessageStatus> = {};
let seedDeleted: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Rebuild the visible list from the seed + whatever has been persisted. */
function rebuild(live: MessageRecord[]) {
  const seedRows = SEED.filter((m) => !seedDeleted.includes(m.id)).map((m) => (seedStatus[m.id] ? { ...m, status: seedStatus[m.id] } : m));
  messages = sortMessages([...live, ...seedRows]);
}

function liveRows(): MessageRecord[] {
  return messages.filter((m) => !SEED_IDS.has(m.id));
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const payload: Persisted = { live: liveRows(), seedStatus, seedDeleted };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Same-tab listeners (the `storage` event won't fire for our own write).
    window.dispatchEvent(new Event(MESSAGES_EVENT));
  } catch {}
}

/** Read persisted state into module memory. Also used by the cross-tab handler,
    which must re-read rather than just re-emit: another tab's write isn't in
    this tab's memory at all. */
function readFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      seedStatus = {};
      seedDeleted = [];
      rebuild([]);
      return;
    }
    const saved = JSON.parse(raw) as Partial<Persisted>;
    seedStatus = saved.seedStatus ?? {};
    seedDeleted = saved.seedDeleted ?? [];
    rebuild(Array.isArray(saved.live) ? saved.live : []);
  } catch {}
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  readFromStorage();
  if (messages !== SEED) emit();
}

let seq = 0;
/** Ids for live submissions can't collide with the seed's MSG-20xx block. */
function nextId() {
  seq += 1;
  return "MSG-" + Date.now().toString(36) + "-" + seq.toString(36);
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Record a contact-form submission. Called from the public website (and, in
 * principle, anywhere else a form exists). Real wall-clock time is correct
 * here: a submission only ever happens client-side, after a user gesture, so
 * it can't desync the server render the way a seed built on `new Date()` would.
 */
export function submitMessage(input: { name: string; email: string; subject: string; body: string; source: MessageSource }): MessageRecord {
  ensureHydrated();
  const now = new Date();
  const rec: MessageRecord = {
    id: nextId(),
    name: input.name,
    email: input.email,
    subject: input.subject,
    body: input.body,
    source: input.source,
    status: "New",
    received: MONTHS_SHORT[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear(),
    receivedTime: pad2(now.getHours()) + ":" + pad2(now.getMinutes()),
    daysAgo: 0,
    sortAt: now.getTime(),
    memberId: null,
    memberImg: null,
  };
  messages = sortMessages([rec, ...messages]);
  persist();
  emit();
  return rec;
}

export function setMessageStatus(id: string, status: MessageStatus) {
  ensureHydrated();
  if (SEED_IDS.has(id)) seedStatus = { ...seedStatus, [id]: status };
  messages = sortMessages(messages.map((m) => (m.id === id ? { ...m, status } : m)));
  persist();
  emit();
}

export function deleteMessage(id: string) {
  ensureHydrated();
  if (SEED_IDS.has(id) && !seedDeleted.includes(id)) seedDeleted = [...seedDeleted, id];
  messages = messages.filter((m) => m.id !== id);
  persist();
  emit();
}

/** Undo a delete — puts the record back exactly as it was. */
export function restoreMessage(rec: MessageRecord) {
  ensureHydrated();
  if (SEED_IDS.has(rec.id)) {
    seedDeleted = seedDeleted.filter((x) => x !== rec.id);
    seedStatus = { ...seedStatus, [rec.id]: rec.status };
  }
  messages = sortMessages([rec, ...messages.filter((m) => m.id !== rec.id)]);
  persist();
  emit();
}

/**
 * Current inbox without subscribing, for non-React callers. Hydrates on first
 * call, so don't reach for it during a React render — useMessages() deliberately
 * hydrates in subscribe (post-mount) to keep the first client render identical
 * to the server's, and an early hydrate here would reintroduce the mismatch.
 */
export function getMessagesSnapshot(): MessageRecord[] {
  ensureHydrated();
  return messages;
}

function getSnapshot(): MessageRecord[] {
  return messages;
}

function getServerSnapshot(): MessageRecord[] {
  return SEED;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  ensureHydrated();
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener(MESSAGES_EVENT, onLocalChange);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener(MESSAGES_EVENT, onLocalChange);
      window.removeEventListener("storage", onStorage);
    }
  };
}

/* A write from elsewhere in THIS tab (e.g. the contact page) — module memory is
   already current, so just tell React. */
function onLocalChange() {
  emit();
}

/* A write from ANOTHER tab — module memory knows nothing about it, so re-read. */
function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  readFromStorage();
  emit();
}

/** Subscribe a component to the inbox. */
export function useMessages(): MessageRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Count of unopened messages — for an inbox badge. */
export function useUnreadCount(): number {
  return useMessages().filter((m) => m.status === "New").length;
}
