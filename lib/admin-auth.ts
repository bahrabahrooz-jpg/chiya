"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Admin auth — a soft, client-only session flag for the prototype admin console.
 *
 * There's no real backend, so "being signed in" is just a localStorage flag.
 * It defaults to signed-in so the dashboard opens directly for demos; only an
 * explicit logout writes "out", which the admin layout guard uses to redirect
 * to /admin/login. Modelled on the theme engine's external-store pattern so it
 * stays in sync across tabs and is hydration-safe.
 */

export const ADMIN_AUTH_KEY = "chiya:admin-auth";

function readAuthed(): boolean {
  try {
    // Absence of the key (or any value that isn't "out") means signed in.
    return localStorage.getItem(ADMIN_AUTH_KEY) !== "out";
  } catch {
    return true;
  }
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_AUTH_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): boolean {
  return readAuthed();
}

function getServerSnapshot(): boolean {
  return true;
}

export function useAdminAuth() {
  const authed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const login = useCallback(() => {
    try {
      localStorage.setItem(ADMIN_AUTH_KEY, "in");
    } catch {
      /* noop */
    }
    emit();
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.setItem(ADMIN_AUTH_KEY, "out");
    } catch {
      /* noop */
    }
    emit();
  }, []);

  return { authed, login, logout };
}
