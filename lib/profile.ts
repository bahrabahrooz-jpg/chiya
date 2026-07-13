"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AUTH_KEY, type AuthUser } from "./auth";

/**
 * Chiya Estate — member profile store.
 *
 * The signed-in member's editable profile (name, contact, location, avatar).
 * Persisted to localStorage; there is no real backend. Seeded from the auth
 * user on first read so a fresh member sees their sign-up details. Name / email
 * / phone edits are mirrored back into the auth session so the header avatar and
 * greeting stay in sync. Mirrors the mobile app's `lib/profile`.
 */

export const PROFILE_KEY = "chiya_member_profile_v1";

export interface MemberProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  /** Data/remote URL of the chosen avatar image, or null for the initials chip. */
  avatar: string | null;
}

const EMPTY_PROFILE: MemberProfile = { fullName: "", email: "", phone: "", location: "", avatar: null };

function readAuth(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

/** Read the stored profile, falling back to (and seeding from) the auth user. */
function read(): MemberProfile {
  let stored: Partial<MemberProfile> | null = null;
  try {
    stored = JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
  } catch {
    stored = null;
  }
  const auth = readAuth();
  return {
    fullName: stored?.fullName ?? auth?.name ?? "",
    email: stored?.email ?? auth?.email ?? "",
    phone: stored?.phone ?? auth?.phone ?? "",
    location: stored?.location ?? "",
    avatar: stored?.avatar ?? null,
  };
}

let state: MemberProfile = EMPTY_PROFILE;
let hydrated = false;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = read();
  }
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROFILE_KEY || e.key === AUTH_KEY) {
      state = read();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY_PROFILE;

export function updateProfile(patch: Partial<MemberProfile>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(state));
    // Keep the auth session (header avatar + greeting) in sync with identity edits.
    const auth = readAuth();
    if (auth) {
      const next: AuthUser = {
        ...auth,
        name: state.fullName || auth.name,
        email: state.email || auth.email,
        phone: state.phone || auth.phone,
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    }
  } catch {
    /* noop */
  }
  emit();
  // Nudge auth subscribers (same tab) — the storage event only fires cross-tab.
  window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
}

export function useProfile() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    profile,
    update: useCallback((patch: Partial<MemberProfile>) => updateProfile(patch), []),
  };
}
