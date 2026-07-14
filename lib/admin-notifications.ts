"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { IconName } from "@/components/ui/icon";
import { NOTIFICATIONS, type NotificationDef } from "@/components/admin/admin-data";

/**
 * Admin / Agent notifications store.
 *
 * The internal-app counterpart of the member `lib/notifications.ts` store, so
 * the admin & agent topbar bell and their full Notifications screens share the
 * same visual language as the public website. Seeded from the static
 * `NOTIFICATIONS` list; only read / removed state is persisted (per-scope, in
 * localStorage) so a demo always starts with the same feed but remembers what
 * you've read or cleared. Admin and agent each get an independent scope.
 */

export interface AdminNotification {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
  /** Human relative time (e.g. "8 minutes ago"), carried from the seed. */
  time: string;
  href?: string;
  read: boolean;
}

interface NotifState {
  /** Per-id read override; absent = fall back to the seed's `unread` flag. */
  read: Record<string, boolean>;
  removed: string[];
}
const EMPTY: NotifState = { read: {}, removed: [] };

/**
 * Build an independent notifications store (module singleton) for one scope.
 * Returns a hook exposing the derived feed plus mutators — mirrors the shape of
 * the member `useNotifications`.
 */
function createNotifStore(storageKey: string, seed: NotificationDef[]) {
  let state: NotifState = EMPTY;
  let hydrated = false;
  const listeners = new Set<() => void>();

  const readLS = (): NotifState => {
    try {
      const raw = JSON.parse(localStorage.getItem(storageKey) || "null");
      return {
        read: raw && typeof raw.read === "object" && raw.read ? raw.read : {},
        removed: Array.isArray(raw?.removed) ? raw.removed : [],
      };
    } catch {
      return EMPTY;
    }
  };

  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* noop */
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (cb: () => void) => {
    if (!hydrated) {
      hydrated = true;
      state = readLS();
    }
    listeners.add(cb);
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        state = readLS();
        listeners.forEach((l) => l());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(cb);
      window.removeEventListener("storage", onStorage);
    };
  };
  const getSnapshot = () => state;
  const getServerSnapshot = () => EMPTY;

  return function useNotifStore() {
    const st = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    const all = useMemo<AdminNotification[]>(() => {
      const removed = new Set(st.removed);
      return seed
        .filter((n) => !removed.has(String(n.id)))
        .map((n) => {
          const id = String(n.id);
          return {
            id,
            icon: n.icon,
            title: n.title,
            desc: n.desc,
            time: n.time,
            read: st.read[id] ?? !n.unread,
          };
        });
    }, [st]);

    const unread = all.filter((n) => !n.read).length;

    const markRead = useCallback((id: string) => {
      state = { ...state, read: { ...state.read, [id]: true } };
      persist();
    }, []);
    const markUnread = useCallback((id: string) => {
      state = { ...state, read: { ...state.read, [id]: false } };
      persist();
    }, []);
    const markAllRead = useCallback((ids: string[]) => {
      const read = { ...state.read };
      ids.forEach((id) => (read[id] = true));
      state = { ...state, read };
      persist();
    }, []);
    const remove = useCallback((id: string) => {
      const read = { ...state.read };
      delete read[id];
      state = { read, removed: Array.from(new Set([...state.removed, id])) };
      persist();
    }, []);
    const clear = useCallback((ids: string[]) => {
      state = { read: {}, removed: Array.from(new Set([...state.removed, ...ids])) };
      persist();
    }, []);

    return { all, unread, markRead, markUnread, markAllRead, remove, clear };
  };
}

export type NotifStore = ReturnType<typeof createNotifStore>;

export const useAdminNotifications = createNotifStore("chiya_admin_notif_state_v1", NOTIFICATIONS);
export const useAgentNotifications = createNotifStore("chiya_agent_notif_state_v1", NOTIFICATIONS);
