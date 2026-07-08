import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Viewings — an app-wide store for viewing requests the member creates from the
 * property detail "Book a viewing" sheet. Persisted to the device so requested
 * viewings survive app restarts and only clear when the member cancels them.
 */
export interface Viewing {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  cover: string;
  agentId: string;
  agentName: string;
  agentPhoto: string;
  agentAgency: string;
  /** ISO date, yyyy-mm-dd. */
  date: string;
  /** Slot label, e.g. "3:00 PM". */
  time: string;
  status: "requested";
  createdAt: number;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO (yyyy-mm-dd) for a Date, using local time. */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "Mon, Jul 14" from an ISO date. */
export function formatViewingDate(iso: string): string {
  const [y, m, day] = iso.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  return `${DOW[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`;
}

const STORAGE_KEY = "chiya.viewings.v1";

let items: Viewing[] = [];
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

async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw) {
      items = JSON.parse(raw) as Viewing[];
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

export function addViewing(viewing: Viewing) {
  hydrated = true;
  items = [viewing, ...items];
  persist();
  emit();
}

export function cancelViewing(id: string) {
  hydrated = true;
  items = items.filter((v) => v.id !== id);
  persist();
  emit();
}

export function useViewings(): Viewing[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
}
