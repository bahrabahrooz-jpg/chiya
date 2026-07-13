"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Chiya Estate — member viewings store.
 *
 * Viewing requests a signed-in member has sent to agents from the property-detail
 * "Request a viewing" modal, persisted to localStorage (there is no real backend).
 * Powers the My Viewings page. The web counterpart of the mobile app's
 * `lib/viewings` store — same record shape so the two surfaces stay in step.
 */

export const VIEWINGS_KEY = "chiya_member_viewings_v1";

export interface Viewing {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  cover: string;
  agentId: string;
  agentName: string;
  agentPhoto: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** 24h slot, "HH:MM" (the value the PDP TimePicker produces). */
  time: string;
  status: "requested";
  createdAt: number;
}

function read(): Viewing[] {
  try {
    const raw = JSON.parse(localStorage.getItem(VIEWINGS_KEY) || "[]");
    return Array.isArray(raw) ? (raw as Viewing[]) : [];
  } catch {
    return [];
  }
}

let state: Viewing[] = [];
let hydrated = false;

const listeners = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(VIEWINGS_KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    state = read();
  }
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === VIEWINGS_KEY) {
      state = read();
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
const EMPTY: Viewing[] = [];
const getServerSnapshot = () => EMPTY;

export function addViewing(viewing: Viewing) {
  state = [viewing, ...state];
  persist();
}
export function cancelViewing(id: string) {
  state = state.filter((v) => v.id !== id);
  persist();
}

export function useViewings() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    items,
    add: useCallback((v: Viewing) => addViewing(v), []),
    cancel: useCallback((id: string) => cancelViewing(id), []),
  };
}
