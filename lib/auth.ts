"use client";

import { useCallback, useSyncExternalStore } from "react";
import { findRegistrationByEmail, registerMember } from "@/app/admin/_members/registrations";

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

  /**
   * The member record this account belongs to, in the agency's own books.
   *
   * A website account and a member record are two different things and used to
   * be entirely unconnected: registering here created neither a member nor any
   * trace the agency could see. `register()` now creates the member and stamps
   * its id here, which is what lets a booking made on a property page arrive in
   * the admin diary attached to a person rather than to a bare name.
   *
   * Optional because an account saved before this existed has no id, and
   * because the demo sign-in path accepts any credentials — somebody who signs
   * in with an address that never registered has no record to point at. Every
   * consumer must handle its absence; nothing may assume it is there.
   */
  memberId?: string;
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
/**
 * Sign in an existing account.
 *
 * Reconnects the session to a member record when the email matches one that
 * registered before, so a returning member keeps the same identity — and the
 * same viewing history — instead of arriving as a stranger. No match is a
 * perfectly normal outcome in the demo, where sign-in accepts anything typed
 * into it; the session simply carries no member id and the booking gate says so.
 */
export function login(user: AuthUser) {
  const linked: AuthUser = user.memberId ? user : { ...user, ...matchMemberId(user.email) };
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(linked));
  } catch {
    /* noop */
  }
  state = { ...state, user: linked, open: false, intent: null };
  emit();
}

function matchMemberId(email: string): { memberId?: string } {
  const found = email ? findRegistrationByEmail(email) : null;
  return found ? { memberId: found.id } : {};
}

/**
 * Create an account — and, with it, the member record the agency works from.
 *
 * This is the seam that used to be missing. Registration collected a name, an
 * email and a phone, kept them in this browser, and told the business nothing;
 * the Members list only grew when staff typed somebody in themselves. Now the
 * same three fields become a real member marked as self-registered, and the
 * session points at it.
 *
 * Separate from login() on purpose: signing in must never mint a second record
 * for somebody who already exists.
 */
export function register(user: AuthUser) {
  const member = registerMember({ name: user.name, email: user.email, phone: user.phone });
  login({ ...user, memberId: member.id });
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
    register: useCallback((user: AuthUser) => register(user), []),
    logout: useCallback(() => logout(), []),
  };
}
