"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { IconName } from "@/components/ui/icon";
import { useListings, type MemberListing } from "./listings";

/**
 * Chiya Estate — member notifications.
 *
 * Notifications are *derived* from the member's own listings (status updates)
 * plus a standing welcome, so the feed reflects real activity rather than fake
 * data. Read / dismissed state is the only thing we persist (a pair of id sets
 * in localStorage). The header bell and the Notifications page both read through
 * this one source. Mirrors the mobile app's notifications flow.
 */

export const NOTIF_STATE_KEY = "chiya_member_notif_state_v1";

export type NotifKind = "info" | "success" | "warning" | "error";

export interface AppNotification {
  id: string;
  icon: IconName;
  kind: NotifKind;
  title: string;
  desc: string;
  /** Epoch ms; 0 = evergreen (welcome), sorted last. */
  ts: number;
  href?: string;
  read: boolean;
}

/** Localized-ish relative time: "Just now", "5 min ago", "3 hours ago", "2 days ago". */
export function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/** Map a member listing's current status to its notification content. */
function statusNotif(l: MemberListing): Omit<AppNotification, "read"> {
  const ts = new Date(l.updatedAt).getTime() || Date.now();
  const map: Record<MemberListing["status"], Omit<AppNotification, "id" | "ts" | "read">> = {
    pending: {
      icon: "clock",
      kind: "warning",
      title: `“${l.title}” is pending review`,
      desc: "Our team is verifying the details before it goes live.",
      href: "/my-listings",
    },
    published: {
      icon: "circle-check",
      kind: "success",
      title: `“${l.title}” is now live`,
      desc: "Your listing is published and visible to buyers and renters.",
      href: "/my-listings",
    },
    rejected: {
      icon: "circle-alert",
      kind: "error",
      title: `“${l.title}” needs changes`,
      desc: "Review the feedback and resubmit your listing.",
      href: "/my-listings",
    },
    draft: {
      icon: "file-pen",
      kind: "info",
      title: `“${l.title}” saved as draft`,
      desc: "Finish and submit it whenever you're ready.",
      href: "/my-listings",
    },
  };
  return { id: `${l.id}-${l.status}`, ts, ...map[l.status] };
}

const WELCOME: Omit<AppNotification, "read"> = {
  id: "welcome",
  icon: "sparkles",
  kind: "info",
  title: "Welcome to Chiya",
  desc: "Submit a property to reach qualified buyers and renters across Kurdistan.",
  ts: 0,
};

/**
 * Standing demo notifications — activity that isn't derived from the member's
 * own listings (a message, a saved-home price drop, a new match). Mirrors the
 * mobile app's seeded feed so the website surface has real content to show.
 * Timestamps are fixed at module load so relative times stay stable.
 */
const SEED_NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const SEEDS: Omit<AppNotification, "read">[] = [
  {
    id: "seed-message",
    icon: "message-circle",
    kind: "info",
    title: "New message from Lana Aziz",
    desc: "Happy to arrange a tour of Olive Grove Estate this week — let me know what suits you.",
    ts: SEED_NOW - 35 * MIN,
    href: "/agents/lana-aziz",
  },
  {
    id: "seed-saved",
    icon: "heart",
    kind: "success",
    title: "Price drop on a saved home",
    desc: "Marble Hill Villa just dropped by $20,000. Take another look.",
    ts: SEED_NOW - 5 * HOUR,
    href: "/saved",
  },
  {
    id: "seed-listing",
    icon: "building-2",
    kind: "info",
    title: "New listing in Erbil",
    desc: "A 3-bed townhouse in Empire City matches your recent searches.",
    ts: SEED_NOW - 2 * DAY,
    href: "/search",
  },
];

// --- persisted read / removed state --------------------------------------

interface NotifState {
  read: string[];
  removed: string[];
}
const EMPTY: NotifState = { read: [], removed: [] };

function read(): NotifState {
  try {
    const raw = JSON.parse(localStorage.getItem(NOTIF_STATE_KEY) || "null");
    return { read: Array.isArray(raw?.read) ? raw.read : [], removed: Array.isArray(raw?.removed) ? raw.removed : [] };
  } catch {
    return EMPTY;
  }
}

let state: NotifState = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(NOTIF_STATE_KEY, JSON.stringify(state));
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
    if (e.key === NOTIF_STATE_KEY) {
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

/**
 * useNotifications — the derived feed plus mutators. `all` reflects every active
 * notification; membership of the read/removed sets is applied on top of the
 * live derivation from listings.
 */
export function useNotifications() {
  const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { items: listings } = useListings();

  const all = useMemo<AppNotification[]>(() => {
    const removed = new Set(st.removed);
    const readSet = new Set(st.read);
    const base = [
      ...[...listings]
        .sort((a, b) => (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0))
        .slice(0, 8)
        .map(statusNotif),
      ...SEEDS,
      WELCOME,
    ]
      // Newest first; welcome (ts 0) always sorts last.
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return base
      .filter((n) => !removed.has(n.id))
      .map((n) => ({ ...n, read: readSet.has(n.id) }));
  }, [listings, st]);

  const unread = all.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    if (state.read.includes(id)) return;
    state = { ...state, read: [...state.read, id] };
    persist();
  }, []);
  const markUnread = useCallback((id: string) => {
    state = { ...state, read: state.read.filter((x) => x !== id) };
    persist();
  }, []);
  const markAllRead = useCallback((ids: string[]) => {
    state = { ...state, read: Array.from(new Set([...state.read, ...ids])) };
    persist();
  }, []);
  const remove = useCallback((id: string) => {
    state = { read: state.read.filter((x) => x !== id), removed: Array.from(new Set([...state.removed, id])) };
    persist();
  }, []);
  const clear = useCallback((ids: string[]) => {
    state = { read: [], removed: Array.from(new Set([...state.removed, ...ids])) };
    persist();
  }, []);

  return { all, unread, markRead, markUnread, markAllRead, remove, clear };
}
