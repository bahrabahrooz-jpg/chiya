import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Search history — the member's recent searches, shown as suggestions when the
 * search field is empty. Each surface keeps its own list (property searches and
 * agent searches don't mix). Persisted to the device.
 */
const MAX = 8;

function createSearchHistory(storageKey: string) {
  let items: string[] = [];
  let hydrated = false;
  const listeners = new Set<() => void>();

  const emit = () => listeners.forEach((l) => l());
  const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  };
  const persist = () => {
    AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch(() => {});
  };

  (async function hydrate() {
    try {
      const raw = await AsyncStorage.getItem(storageKey);
      if (!hydrated && raw) items = JSON.parse(raw) as string[];
    } catch {
      // ignore
    } finally {
      if (!hydrated) {
        hydrated = true;
        emit();
      }
    }
  })();

  return {
    add(query: string) {
      const t = query.trim();
      if (!t) return;
      hydrated = true;
      items = [t, ...items.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, MAX);
      persist();
      emit();
    },
    remove(query: string) {
      hydrated = true;
      items = items.filter((x) => x !== query);
      persist();
      emit();
    },
    clear() {
      hydrated = true;
      items = [];
      persist();
      emit();
    },
    useHistory(): string[] {
      return useSyncExternalStore(
        subscribe,
        () => items,
        () => items,
      );
    },
  };
}

export const propertySearchHistory = createSearchHistory("chiya.search-history.properties.v1");
export const agentSearchHistory = createSearchHistory("chiya.search-history.agents.v1");
