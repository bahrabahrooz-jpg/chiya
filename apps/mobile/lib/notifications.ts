import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { type Href } from "expo-router";

/**
 * Notifications — the member's notification feed (inbox). Seeded with a few mock
 * items; new ones are pushed by the app (e.g. when a viewing is requested).
 * Persisted to the device so the feed and its read state survive app restarts.
 */
export type NotificationType = "viewing" | "message" | "listing" | "saved" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** epoch ms */
  createdAt: number;
  read: boolean;
  /** Related screen to open on tap (expo-router href). Omitted → tap only marks read. */
  href?: Href;
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Short relative time: "now", "5m", "2h", "3d", else a date. */
export function timeAgo(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  if (diff < MIN) return "now";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}m`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

const now = Date.now();
let items: AppNotification[] = [
  {
    id: "seed-1",
    type: "message",
    title: "New message from Lana Aziz",
    body: "Thanks for reaching out — happy to arrange a tour of Olive Grove Estate this week.",
    createdAt: now - 35 * MIN,
    read: false,
    href: { pathname: "/agents/[id]", params: { id: "lana-aziz" } },
  },
  {
    id: "seed-2",
    type: "saved",
    title: "Price drop on a saved home",
    body: "Marble Hill Villa just dropped by $20,000. Take another look.",
    createdAt: now - 5 * HOUR,
    read: false,
    href: "/saved",
  },
  {
    id: "seed-3",
    type: "listing",
    title: "New listing in Erbil",
    body: "A 3-bed townhouse in Empire City matches your recent searches.",
    createdAt: now - 2 * DAY,
    read: true,
    href: { pathname: "/property/[id]", params: { id: "garden-townhouse" } },
  },
  {
    id: "seed-4",
    type: "system",
    title: "Welcome to Chiya",
    body: "Save homes, follow agents, and book viewings — all in one place.",
    createdAt: now - 6 * DAY,
    read: true,
  },
];

const STORAGE_KEY = "chiya.notifications.v1";
let hydrated = false;
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
}

async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw) {
      items = JSON.parse(raw) as AppNotification[];
    }
  } catch {
    // ignore — keep the seeded feed
  } finally {
    if (!hydrated) {
      hydrated = true;
      emit();
    }
  }
}
hydrate();

export function addNotification(n: Omit<AppNotification, "id" | "createdAt" | "read"> & { id?: string }) {
  hydrated = true;
  const item: AppNotification = {
    id: n.id ?? `n-${Date.now()}`,
    type: n.type,
    title: n.title,
    body: n.body,
    createdAt: Date.now(),
    read: false,
    href: n.href,
  };
  items = [item, ...items];
  persist();
  emit();
}

export function markRead(id: string) {
  hydrated = true;
  items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
  persist();
  emit();
}

export function markUnread(id: string) {
  hydrated = true;
  items = items.map((n) => (n.id === id ? { ...n, read: false } : n));
  persist();
  emit();
}

export function markAllRead() {
  hydrated = true;
  items = items.map((n) => (n.read ? n : { ...n, read: true }));
  persist();
  emit();
}

/** Remove a single notification (swipe-to-delete / overflow → Delete). */
export function removeNotification(id: string) {
  hydrated = true;
  items = items.filter((n) => n.id !== id);
  persist();
  emit();
}

export function clearNotifications() {
  hydrated = true;
  items = [];
  persist();
  emit();
}

export function useNotifications(): AppNotification[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
}

export function useUnreadCount(): number {
  return useSyncExternalStore(
    subscribe,
    () => items.reduce((n, x) => n + (x.read ? 0 : 1), 0),
    () => items.reduce((n, x) => n + (x.read ? 0 : 1), 0),
  );
}
