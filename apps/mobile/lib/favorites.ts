import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Favorites — an app-wide store of saved listing/agent ids, shared across the
 * cards, detail screens, and the Saved tab. Persisted to the device so saves
 * survive app restarts and only clear when the member unsaves them.
 */
const STORAGE_KEY = "chiya.favorites.v1";

let favorites = new Set<string>();
let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites])).catch(() => {});
}

async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw) {
      favorites = new Set(JSON.parse(raw) as string[]);
    }
  } catch {
    // ignore
  } finally {
    if (!hydrated) {
      hydrated = true;
      emit();
    }
  }
}
hydrate();

export function toggleFavorite(id: string) {
  hydrated = true;
  const next = new Set(favorites);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  favorites = next;
  persist();
  emit();
}

/** The full set of saved ids (re-renders when it changes). */
export function useFavoriteIds(): Set<string> {
  return useSyncExternalStore(
    subscribe,
    () => favorites,
    () => favorites,
  );
}

/** Whether a single listing is saved. */
export function useIsFavorite(id: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => favorites.has(id),
    () => favorites.has(id),
  );
}
