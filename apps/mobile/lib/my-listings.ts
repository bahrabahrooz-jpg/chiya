import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type ListingForm } from "@/components/listing/data";

/**
 * My Listings — an app-wide store for the member's submitted properties.
 * Persisted to the device via AsyncStorage, so listings behave like real data:
 * they survive app restarts and only disappear when the member deletes them.
 */
export interface MyListing {
  id: string;
  title: string;
  location: string;
  deal: "sale" | "rent";
  price: string;
  beds: number;
  baths: number;
  area: string;
  cover: string | null;
  status: "pending" | "published";
  createdAt: number;
  /** Source wizard form, kept so the listing can be re-opened for editing. */
  form: ListingForm;
}

const STORAGE_KEY = "chiya.my-listings.v1";

let items: MyListing[] = [];
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
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
}

/** Load persisted listings once at startup. A mutation before this resolves wins
 *  (we skip the stale load) so a freshly added listing is never clobbered. */
async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw) {
      items = JSON.parse(raw) as MyListing[];
    }
  } catch {
    // ignore corrupt/unavailable storage — start empty
  } finally {
    if (!hydrated) {
      hydrated = true;
      emit();
    }
  }
}
hydrate();

export function addMyListing(listing: MyListing) {
  hydrated = true;
  items = [listing, ...items];
  persist();
  emit();
}

/** Replace an existing listing in place (keeps its position in the list). */
export function updateMyListing(listing: MyListing) {
  hydrated = true;
  items = items.map((l) => (l.id === listing.id ? listing : l));
  persist();
  emit();
}

export function removeMyListing(id: string) {
  hydrated = true;
  items = items.filter((l) => l.id !== id);
  persist();
  emit();
}

/** Non-hook read for one listing (e.g. to prefill the edit wizard). */
export function getMyListing(id: string): MyListing | undefined {
  return items.find((l) => l.id === id);
}

export function useMyListings(): MyListing[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
}
