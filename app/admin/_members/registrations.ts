"use client";

import { useSyncExternalStore } from "react";
import type { MemberRecord } from "../_data/catalog";
/* ./new-member, not ./data — ./data pulls the whole admin catalogue at module
   scope, and lib/auth.ts imports this file, which the site header imports on
   every page of the public website. See the note at the top of ./new-member. */
import { newMemberRecord } from "./new-member";

/* ----------------------------------------------------------------------------
   Self-registered members — people who signed themselves up on the website.

   WHY THIS EXISTS. Registering on the public site used to produce nothing the
   agency could see: a name, email and phone written to a key in the visitor's
   own browser, and no member record anywhere. The Members list only ever grew
   when staff typed somebody in by hand. So a person could create an account,
   ask for a viewing, and remain invisible to the business that was supposed to
   call them back.

   WHY NOT JUST CALL addMember(). Members live in PropertiesProvider, a React
   context mounted by app/admin/layout.tsx. The public site never mounts it, so
   there is no addMember to call from a registration form. Same wall the contact
   inbox hit (app/admin/_messages/messages-store.ts) and the same way through:
   a module singleton both surfaces can import.

   WHY A SEPARATE STORE RATHER THAN WRITING INTO THE ADMIN'S. The admin store
   persists its whole member roster under its own key. If registrations were
   merged into that roster they would be saved twice — once here, once there —
   and the two copies would drift the first time anybody edited one. So this
   store OWNS these records for their whole life, and the provider merges them
   in for reading. A registered member edited in the admin is written back
   here, not copied across. One record, one home.

   DEMO SCOPE: localStorage, like everything else. No backend, no password
   storage, no email verification — registering is a demonstration that the
   record reaches the agency, not an account system.
   ------------------------------------------------------------------------- */

const STORAGE_KEY = "chiya:member-registrations:v1";

/** Same-tab change signal — the `storage` event only fires in OTHER tabs, so a
    registration made on the website has to be announced for an admin members
    list mounted in the same tab to react. Mirrors messages-store. */
const REGISTRATIONS_EVENT = "chiya:member-registrations-changed";

/* Empty is the server snapshot AND the initial client snapshot, so hydration
   matches. There is no seed here by design: every record in this store is
   somebody who actually registered. */
const EMPTY: MemberRecord[] = [];

let registrations: MemberRecord[] = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations));
    window.dispatchEvent(new Event(REGISTRATIONS_EVENT));
  } catch {}
}

function readFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? JSON.parse(raw) : null;
    registrations = Array.isArray(saved) ? (saved as MemberRecord[]) : EMPTY;
  } catch {}
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  readFromStorage();
  if (registrations !== EMPTY) emit();
}

/** Case-insensitive, because an email is not case-sensitive and a member who
    signs in as `Sara@…` having registered as `sara@…` is the same person. */
function sameEmail(a: string, b: string) {
  return !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * The member record for an email, if this person already registered.
 *
 * Used on SIGN-IN so a returning member is reconnected to the record they made
 * the first time, instead of a second one appearing on the members list every
 * time they come back.
 */
export function findRegistrationByEmail(email: string): MemberRecord | null {
  ensureHydrated();
  return registrations.find((m) => sameEmail(m.email, email)) ?? null;
}

/**
 * Somebody registered on the website.
 *
 * Idempotent on email: registering with an address that already has a record
 * returns that record rather than making a twin.
 *
 * The defaults are the honest reading of what a registration form actually
 * tells us:
 *   whatsapp    true  — the number given is a mobile they typed themselves.
 *   msgLang     null  — follow the agency's send language; nobody has asked
 *                       this person what they prefer.
 *   remindersOn true  — the ordinary case, and they can be muted per person.
 *   idKind      null  — see below.
 *
 * NO ID, DELIBERATELY. Somebody browsing homes should not have to produce a
 * national ID to look at one, and the seed already models this exact person:
 * a prospective buyer who has been to two viewings and produced nothing but a
 * phone number. The ID is collected when paper is signed, which is where the
 * contract takes its own frozen copy of it.
 */
export function registerMember(input: { name: string; email: string; phone: string }): MemberRecord {
  ensureHydrated();
  const existing = findRegistrationByEmail(input.email);
  if (existing) return existing;

  const rec: MemberRecord = {
    ...newMemberRecord({
      name: input.name,
      phone: input.phone,
      email: input.email,
      whatsapp: true,
      msgLang: null,
      remindersOn: true,
      idKind: null,
      idNumber: "",
      city: "",
      area: "",
    }),
    source: "website",
  };
  registrations = [rec, ...registrations];
  persist();
  emit();
  return rec;
}

/** True when this id belongs to a self-registered member — the provider asks
    before deciding which store a member edit should be written to. */
export function isRegistration(id: string): boolean {
  ensureHydrated();
  return registrations.some((m) => m.id === id);
}

export function updateRegistration(id: string, patch: Partial<MemberRecord>) {
  ensureHydrated();
  registrations = registrations.map((m) => (m.id === id ? { ...m, ...patch } : m));
  persist();
  emit();
}

export function removeRegistration(id: string) {
  ensureHydrated();
  registrations = registrations.filter((m) => m.id !== id);
  persist();
  emit();
}

/** Undo a delete — puts the record back exactly as it was. */
export function restoreRegistration(rec: MemberRecord) {
  ensureHydrated();
  registrations = [rec, ...registrations.filter((m) => m.id !== rec.id)];
  persist();
  emit();
}

/**
 * Current registrations without subscribing, for non-React callers. Hydrates on
 * first call, so don't reach for it during a React render — useRegistrations()
 * hydrates in subscribe (post-mount) to keep the first client render identical
 * to the server's.
 */
export function getRegistrationsSnapshot(): MemberRecord[] {
  ensureHydrated();
  return registrations;
}

function getSnapshot(): MemberRecord[] {
  return registrations;
}

function getServerSnapshot(): MemberRecord[] {
  return EMPTY;
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  ensureHydrated();
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener(REGISTRATIONS_EVENT, onLocalChange);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener(REGISTRATIONS_EVENT, onLocalChange);
      window.removeEventListener("storage", onStorage);
    }
  };
}

function onLocalChange() {
  emit();
}

function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  readFromStorage();
  emit();
}

/** Subscribe a component to the self-registered members. */
export function useRegistrations(): MemberRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
