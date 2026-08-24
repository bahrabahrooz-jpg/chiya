"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Legacy admin settings store — organisation identity and notification
 * preferences. The /admin/settings screen has since moved to
 * lib/platform-settings.ts; what survives here is the one slice still read by a
 * feature screen: `org.currency`, used by _add-property to pick a default.
 *
 * Do not add to this file. New settings belong in lib/platform-settings.ts.
 *
 * Modelled on lib/admin-profile.ts: an external store read via
 * useSyncExternalStore, persisted to localStorage, seeded from a deterministic
 * default so the server render and the first client render agree (no hydration
 * mismatch), then the stored values fill in after mount. There is no backend.
 */

/* Currency has ONE definition, in lib/platform-settings. This module used to
   carry its own three-code copy; `org.currency` meant exactly the same thing
   (the default currency for a new listing), so the two were merged rather than
   reconciled. Re-exported because existing importers read it from here. */
export type { CurrencyCode } from "@/lib/platform-settings";
import type { CurrencyCode } from "@/lib/platform-settings";

export interface OrgSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  currency: CurrencyCode;
  timezone: string;
  dateFormat: string;
}

export interface NotificationSettings {
  viewingBooked: boolean;
  viewingCancelled: boolean;
  reviewSubmitted: boolean;
  reviewNeedsModeration: boolean;
  memberRegistered: boolean;
  propertySubmitted: boolean;
}

export interface AdminSettings {
  org: OrgSettings;
  notifications: NotificationSettings;
}

// Bump when the default schema/seed changes so stale caches are dropped.
const KEY = "chiya:admin-settings:v1";

export const DEFAULT_SETTINGS: AdminSettings = {
  org: {
    name: "Chiya Estate",
    email: "hello@chiya.estate",
    phone: "+964 750 000 0000",
    address: "Empire Business Towers, Erbil, Kurdistan Region, Iraq",
    currency: "USD",
    timezone: "Asia/Baghdad",
    dateFormat: "DD/MM/YYYY",
  },
  notifications: {
    viewingBooked: true,
    viewingCancelled: true,
    reviewSubmitted: true,
    reviewNeedsModeration: true,
    memberRegistered: false,
    propertySubmitted: true,
  },
};

let current: AdminSettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Deep-merge stored partials over defaults so a new field added in a later
    build is present even when the stored blob predates it. */
function parse(raw: string | null): AdminSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const p = JSON.parse(raw) as Partial<AdminSettings>;
    return {
      org: { ...DEFAULT_SETTINGS.org, ...p.org },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...p.notifications },
    };
  } catch {
    return DEFAULT_SETTINGS;
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
  return DEFAULT_SETTINGS;
}

export function useAdminSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Persist a whole settings object (used by the Save action on a section). */
  const save = useCallback((next: AdminSettings) => {
    current = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* noop */
    }
    emit();
  }, []);

  return { settings, save };
}
