"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Chiya Estate — auth modal store (login / register).
 *
 * Ported from the export's `auth/auth-modal.js`: a single modal with two modes,
 * opened from anywhere (header, gated actions). The "session" is a demo user
 * persisted to localStorage; there is no real backend.
 */

export const AUTH_KEY = "chiya_auth_user_v1";

export type AuthMode = "login" | "register";
export type UserType = "customer" | "agent";

export interface AuthUser {
  name: string;
  email: string;
  phone: string;
  type: UserType;
}

export interface AuthIntent {
  /** Contextual note shown in the modal (e.g. "Sign in to save this home"). */
  note?: string;
  /** Toast message after a successful auth. */
  toast?: string;
  /** Path to navigate to after a successful auth (e.g. "/my-listings"). */
  next?: string;
}

interface AuthState {
  open: boolean;
  mode: AuthMode;
  intent: AuthIntent | null;
  user: AuthUser | null;
}

function readUser(): AuthUser | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

let state: AuthState = { open: false, mode: "login", intent: null, user: null };
let hydrated = false;

const listeners = new Set<() => void>();
function emit() {
  state = { ...state };
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = { ...state, user: readUser() };
  }
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === AUTH_KEY) {
      state = { ...state, user: readUser() };
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}
const getSnapshot = () => state;
const SERVER_STATE: AuthState = { open: false, mode: "login", intent: null, user: null };
const getServerSnapshot = () => SERVER_STATE;

/** Open the auth modal. If already signed in, this is a no-op. */
export function openAuth(mode: AuthMode = "login", intent?: AuthIntent) {
  if (state.user) return;
  state = { ...state, open: true, mode, intent: intent ?? null };
  emit();
}
export function closeAuth() {
  state = { ...state, open: false, intent: null };
  emit();
}
export function setAuthMode(mode: AuthMode) {
  state = { ...state, mode };
  emit();
}
export function login(user: AuthUser) {
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } catch {
    /* noop */
  }
  state = { ...state, user, open: false, intent: null };
  emit();
}
export function logout() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    /* noop */
  }
  state = { ...state, user: null };
  emit();
}

export function useAuth() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    ...snap,
    openAuth: useCallback((mode?: AuthMode, intent?: AuthIntent) => openAuth(mode, intent), []),
    closeAuth: useCallback(() => closeAuth(), []),
    setMode: useCallback((mode: AuthMode) => setAuthMode(mode), []),
    login: useCallback((user: AuthUser) => login(user), []),
    logout: useCallback(() => logout(), []),
  };
}
