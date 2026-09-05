"use client";

import { useSyncExternalStore } from "react";
import { PROPERTIES, VIEWINGS, fmtDateShort, fmtTimeLabel, type ViewingRecord } from "./data";

/* ----------------------------------------------------------------------------
   Viewings — the agency's diary, and the only copy of it.

   WHY THIS EXISTS. There used to be two lists both called "viewings". The
   admin page built its rows from the seed and held them in component state.
   The public property page wrote a booking into lib/viewings.ts, a separate
   store on the visitor's own machine that nothing in the admin ever read. So a
   member could book a viewing, see it confirmed on their own My Viewings page,
   and the agency would never learn it happened. The nav item was right; the
   wiring behind it was missing.

   This is that wiring. One list. The website writes to it, the admin reads and
   works it, and the member's My Viewings page is a filtered view of the same
   rows rather than a second ledger that is allowed to disagree.

   WHY A MODULE SINGLETON AND NOT THE PROVIDER. Members and properties live in
   PropertiesProvider, a React context mounted by app/admin/layout.tsx. The
   public site never mounts it, so a context cannot be written to from a
   property page. app/admin/_messages/messages-store.ts hit exactly this wall
   for the contact inbox and solved it this way; this follows that file closely
   enough that the two should be read together.

   DEMO SCOPE: persisted to this browser's localStorage, like everything else
   here. There is no backend, so a booking made on one machine is not visible
   on another — the loop closes within a browser, which is what makes it
   demonstrable, not what makes it shipped.
   ------------------------------------------------------------------------- */

const STORAGE_KEY = "chiya:viewings:v1";

/** Same-tab change signal. The DOM `storage` event only fires in OTHER tabs, so
    a booking made on the property page has to be announced explicitly for an
    admin list mounted in the same tab to react. Mirrors messages-store. */
const VIEWINGS_EVENT = "chiya:viewings-changed";

/* SEED is a stable reference: the server snapshot AND the initial client
   snapshot, so hydration matches. localStorage is merged in after mount via
   ensureHydrated(), exactly like the message inbox and the audit log. */
const SEED: ViewingRecord[] = VIEWINGS;
const SEED_IDS = new Set(SEED.map((v) => v.id));

/**
 * What we keep in storage.
 *
 * Bookings are `live` rows and are stored whole. Seed rows are stored as
 * PATCHES keyed by id, never as copies: staff reschedule and re-status the
 * seed constantly, and a stored copy would freeze that row's property title,
 * image and location at whatever the catalogue said the day it was touched.
 * Patching lets the curated seed keep evolving underneath the changes made to
 * it.
 */
interface Persisted {
  live: ViewingRecord[];
  seedPatch: Record<string, Partial<ViewingRecord>>;
  seedDeleted: string[];
}

let viewings: ViewingRecord[] = SEED;
let seedPatch: Record<string, Partial<ViewingRecord>> = {};
let seedDeleted: string[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Rebuild the visible list from the seed + whatever has been persisted.
    Live rows lead: a request that just came in is the one staff want to see. */
function rebuild(live: ViewingRecord[]) {
  const seedRows = SEED.filter((v) => !seedDeleted.includes(v.id)).map((v) => (seedPatch[v.id] ? { ...v, ...seedPatch[v.id] } : v));
  viewings = [...live, ...seedRows];
}

function liveRows(): ViewingRecord[] {
  return viewings.filter((v) => !SEED_IDS.has(v.id));
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const payload: Persisted = { live: liveRows(), seedPatch, seedDeleted };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    // Same-tab listeners (the `storage` event won't fire for our own write).
    window.dispatchEvent(new Event(VIEWINGS_EVENT));
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
      seedPatch = {};
      seedDeleted = [];
      rebuild([]);
      return;
    }
    const saved = JSON.parse(raw) as Partial<Persisted>;
    seedPatch = saved.seedPatch ?? {};
    seedDeleted = saved.seedDeleted ?? [];
    rebuild(Array.isArray(saved.live) ? saved.live : []);
  } catch {}
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  readFromStorage();
  if (viewings !== SEED) emit();
}

let seq = 0;
/** Ids for live bookings can't collide with the seed's VW-10xx block. */
function nextId() {
  seq += 1;
  return "VW-" + Date.now().toString(36) + "-" + seq.toString(36);
}

/* -------------------------------------------------------------------------
   Writing
   ---------------------------------------------------------------------- */

/**
 * A member booked a viewing on the public website.
 *
 * Takes the machine forms — an ISO day and a 24h slot, which is what the
 * pickers produce — and stores the display forms the admin list is written
 * against, so a booked row and a seeded row are the same kind of thing on
 * arrival. Doing that conversion anywhere else would leave the admin table
 * formatting two date formats.
 *
 * Lands as "Requested", never "Confirmed": nobody at the agency has agreed to
 * it yet, and the whole reason the request is worth routing here is so that a
 * person can.
 */
export function bookViewing(input: {
  propertyId: string;
  /** Display fallback, used only if the id is not in the catalogue. */
  property: { title: string; location: string; img: string };
  agent: string;
  member: string;
  memberId?: string;
  /** ISO day, yyyy-mm-dd. */
  date: string;
  /** 24h slot, "HH:MM". */
  time: string;
}): ViewingRecord {
  ensureHydrated();
  /* Resolve the property from the catalogue rather than trusting what the
     caller passed. The public page renders a TRANSLATED title in Arabic and
     Kurdish; storing that would put Kurdish property names into the agency's
     diary depending on which language the visitor happened to be browsing in.
     The catalogue holds the canonical English the rest of the admin is written
     against. The caller's snapshot is only a fallback for an id the catalogue
     does not know, which the public page cannot actually produce. */
  const known = PROPERTIES.find((p) => p.id === input.propertyId);
  const property = known ? { title: known.title, location: known.location, img: known.img } : input.property;

  const rec: ViewingRecord = {
    id: nextId(),
    propertyId: input.propertyId,
    property,
    member: input.member,
    agent: input.agent,
    date: fmtDateShort(input.date) ?? input.date,
    time: fmtTimeLabel(input.time) ?? input.time,
    status: "Requested",
    ...(input.memberId ? { memberId: input.memberId } : {}),
    source: "website",
  };
  viewings = [rec, ...viewings];
  persist();
  emit();
  return rec;
}

/** Staff scheduled one from the admin form. Already in display shape. */
export function addViewing(rec: ViewingRecord) {
  ensureHydrated();
  viewings = [rec, ...viewings.filter((v) => v.id !== rec.id)];
  persist();
  emit();
}

export function updateViewing(id: string, patch: Partial<ViewingRecord>) {
  ensureHydrated();
  if (SEED_IDS.has(id)) seedPatch = { ...seedPatch, [id]: { ...seedPatch[id], ...patch } };
  viewings = viewings.map((v) => (v.id === id ? { ...v, ...patch } : v));
  persist();
  emit();
}

/** Replace a row wholesale — the reschedule form rebuilds the whole record. */
export function replaceViewing(rec: ViewingRecord) {
  ensureHydrated();
  if (SEED_IDS.has(rec.id)) seedPatch = { ...seedPatch, [rec.id]: rec };
  viewings = viewings.map((v) => (v.id === rec.id ? rec : v));
  persist();
  emit();
}

export function deleteViewing(id: string) {
  ensureHydrated();
  if (SEED_IDS.has(id) && !seedDeleted.includes(id)) seedDeleted = [...seedDeleted, id];
  viewings = viewings.filter((v) => v.id !== id);
  persist();
  emit();
}

/* -------------------------------------------------------------------------
   Reading
   ---------------------------------------------------------------------- */

/**
 * Current diary without subscribing, for non-React callers. Hydrates on first
 * call, so don't reach for it during a React render — useViewingRecords()
 * deliberately hydrates in subscribe (post-mount) to keep the first client
 * render identical to the server's, and an early hydrate here would
 * reintroduce the mismatch.
 */
export function getViewingsSnapshot(): ViewingRecord[] {
  ensureHydrated();
  return viewings;
}

function getSnapshot(): ViewingRecord[] {
  return viewings;
}

function getServerSnapshot(): ViewingRecord[] {
  return SEED;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  ensureHydrated();
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener(VIEWINGS_EVENT, onLocalChange);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener(VIEWINGS_EVENT, onLocalChange);
      window.removeEventListener("storage", onStorage);
    }
  };
}

/* A write from elsewhere in THIS tab (e.g. the property page) — module memory
   is already current, so just tell React. */
function onLocalChange() {
  emit();
}

/* A write from ANOTHER tab — module memory knows nothing about it, so re-read. */
function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  readFromStorage();
  emit();
}

/** Subscribe a component to the diary. */
export function useViewingRecords(): ViewingRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
