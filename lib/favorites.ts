"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Chiya Estate — saved (favorited) properties & agents store.
 *
 * A shared, localStorage-backed store powering the heart toggles across the site
 * and the Saved page. Because the site's property/agent data is spread across
 * several page-local sources, we persist a lightweight display *snapshot* of each
 * saved item (not just an id) — that way the Saved page can render cards without
 * re-resolving ids against fragmented data. Mirrors the mobile app's favorites.
 */

export const FAVORITES_KEY = "chiya_member_favorites_v1";

export interface SavedProperty {
  id: string;
  image: string;
  price: string;
  period?: string;
  title: string;
  address: string;
  beds?: number;
  baths?: number;
  area?: number;
  areaUnit?: string;
  status?: string;
  href?: string;
}

export interface SavedAgent {
  id: string;
  name: string;
  photo?: string;
  city?: string;
  verified?: boolean;
  rating?: number;
  listings?: number;
  href?: string;
}

interface FavoritesState {
  properties: SavedProperty[];
  agents: SavedAgent[];
}

const EMPTY: FavoritesState = { properties: [], agents: [] };

function read(): FavoritesState {
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "null");
    return {
      properties: Array.isArray(raw?.properties) ? raw.properties : [],
      agents: Array.isArray(raw?.agents) ? raw.agents : [],
    };
  } catch {
    return EMPTY;
  }
}

let state: FavoritesState = EMPTY;
let hydrated = false;

const listeners = new Set<() => void>();
function persist() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(state));
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
    if (e.key === FAVORITES_KEY) {
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
const getServerSnapshot = () => EMPTY;

/** Toggle a property's saved state; pass the display snapshot used when saving. */
export function toggleSavedProperty(p: SavedProperty) {
  const has = state.properties.some((x) => x.id === p.id);
  state = {
    ...state,
    properties: has ? state.properties.filter((x) => x.id !== p.id) : [p, ...state.properties],
  };
  persist();
}

export function toggleSavedAgent(a: SavedAgent) {
  const has = state.agents.some((x) => x.id === a.id);
  state = {
    ...state,
    agents: has ? state.agents.filter((x) => x.id !== a.id) : [a, ...state.agents],
  };
  persist();
}

export function removeSavedProperty(id: string) {
  state = { ...state, properties: state.properties.filter((x) => x.id !== id) };
  persist();
}
export function removeSavedAgent(id: string) {
  state = { ...state, agents: state.agents.filter((x) => x.id !== id) };
  persist();
}

/** Reactive hook: saved lists + membership test + toggles. */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    properties: favorites.properties,
    agents: favorites.agents,
    isPropertySaved: useCallback((id: string) => favorites.properties.some((x) => x.id === id), [favorites.properties]),
    isAgentSaved: useCallback((id: string) => favorites.agents.some((x) => x.id === id), [favorites.agents]),
    toggleProperty: useCallback((p: SavedProperty) => toggleSavedProperty(p), []),
    toggleAgent: useCallback((a: SavedAgent) => toggleSavedAgent(a), []),
  };
}
