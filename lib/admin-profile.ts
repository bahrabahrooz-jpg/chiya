"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ADMIN } from "@/components/admin/admin-data";

/**
 * Admin profile store — the signed-in admin's editable identity.
 *
 * There's no backend, so the profile is seeded from the static ADMIN constant
 * and any edits are persisted to localStorage. Modelled on the theme/auth
 * external-store pattern so the topbar and the profile page read one source and
 * stay in sync (and across tabs). Hydration happens on first client subscribe,
 * so the server render and the first client render both use DEFAULT_PROFILE —
 * no hydration mismatch — then the stored values fill in after mount.
 */

export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  /** Profile photo as a data URL, or "" to fall back to initials. */
  avatar: string;
}

// Bump when the default profile schema/seed changes so stale caches are dropped.
// v2: seeded a default avatar photo.
const KEY = "chiya:admin-profile:v2";

export const DEFAULT_PROFILE: AdminProfile = {
  name: ADMIN.name,
  email: ADMIN.email,
  phone: "+964 750 123 4567",
  location: "Erbil, Kurdistan Region",
  avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=256&h=256&fit=crop",
};

let current: AdminProfile = DEFAULT_PROFILE;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function parse(raw: string | null): AdminProfile {
  try {
    return raw ? { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<AdminProfile>) } : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    current = parse(localStorage.getItem(KEY));
  } catch {
    /* noop */
  }
}

function subscribe(onChange: () => void) {
  hydrate();
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = parse(e.newValue);
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return DEFAULT_PROFILE;
}

export function useAdminProfile() {
  const profile = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((patch: Partial<AdminProfile>) => {
    current = { ...current, ...patch };
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* noop */
    }
    emit();
  }, []);

  return { profile, update };
}
