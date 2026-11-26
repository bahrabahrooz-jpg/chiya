"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { IconName } from "@/components/ui/icon";
import { NOTIFICATIONS, AGENT_NOTIFICATIONS, type NotificationDef } from "@/components/admin/admin-data";
import { useAuditLog, resolveAuditParams, type AuditCategory, type AuditEvent } from "@/app/admin/_shared/audit-log";
import { usePlatformSettings } from "@/lib/platform-settings";
import { useLang } from "@/lib/i18n";
import { timeAgo } from "@/lib/notifications";

/**
 * Admin / Agent notifications store.
 *
 * The admin feed is the static seed plus one live notification for every
 * action an agent takes (read off the audit log, which already records who did
 * what). Super-admin actions never notify the admin — you don't need telling
 * about your own work. The "Agent activity" row of Settings → Notifications
 * switches the live part off.
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
/** One feed entry before read/removed state is applied. */
interface NotifSource {
  id: string;
  icon: IconName;
  title: string;
  desc: string;
  time: string;
  href?: string;
  /** Read by default (until the user marks it otherwise)? */
  readByDefault: boolean;
}

const fromSeed = (n: NotificationDef): NotifSource => ({
  id: String(n.id),
  icon: n.icon,
  title: n.title,
  desc: n.desc,
  time: n.time,
  readByDefault: !n.unread,
});

const noDerived = (): NotifSource[] => [];

function createNotifStore(storageKey: string, seed: NotificationDef[], useDerived: () => NotifSource[] = noDerived) {
  const seedSources = seed.map(fromSeed);
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
    const derived = useDerived();

    const all = useMemo<AdminNotification[]>(() => {
      const removed = new Set(st.removed);
      // Live entries are newest-first already and newer than any seed.
      return [...derived, ...seedSources]
        .filter((n) => !removed.has(n.id))
        .map(({ readByDefault, ...n }) => ({ ...n, read: st.read[n.id] ?? readByDefault }));
    }, [st, derived]);

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

/* ------------------------- agent activity → admin ------------------------- */

const CATEGORY_ICON: Record<AuditCategory, IconName> = {
  property: "building-2",
  member: "user-round",
  agent: "id-card",
  review: "star",
  message: "message-circle",
  location: "map-pin",
  role: "shield",
  settings: "settings",
};

/** Where clicking the notification should land: the record itself when we can
    tell what it is from its id, else the audit log (which always has the row). */
function hrefFor(e: AuditEvent): string {
  const id = e.targetId;
  if (id?.startsWith("CT-")) return `/admin/contracts/${id}`;
  if (id?.startsWith("CH-")) return `/admin/properties/${id}`;
  if (id && e.category === "member") return `/admin/members/${id}`;
  if (id && e.category === "agent") return `/admin/agents/${id}`;
  return "/admin/audit";
}

/** Same caps as the audit store keeps — the bell is not the archive. */
const MAX_LIVE = 50;

function useAgentActivity(): NotifSource[] {
  const events = useAuditLog();
  const { settings } = usePlatformSettings();
  const { t } = useLang();
  const enabled = settings.notifications.matrix.agentActivity?.inApp ?? true;

  return useMemo(() => {
    if (!enabled) return [];
    return events
      // Seed events are dated against the catalog's fixed "today"; only
      // actions taken in this browser are news.
      .filter((e) => e.actor.role === "agent" && !e.id.startsWith("AUD-SEED-"))
      .slice(0, MAX_LIVE)
      .map((e) => {
        const action = t(e.actionKey, resolveAuditParams(e.actionParams, t));
        const meta = e.metaKey ? t(e.metaKey, resolveAuditParams(e.metaParams, t)) : e.meta;
        return {
          id: `aud:${e.id}`,
          icon: CATEGORY_ICON[e.category],
          title: `${e.actor.name} · ${action}`,
          desc: meta ? `${e.target} — ${meta}` : e.target,
          time: timeAgo(new Date(e.at).getTime()),
          href: hrefFor(e),
          readByDefault: false,
        };
      });
  }, [events, enabled, t]);
}

export const useAdminNotifications = createNotifStore("chiya_admin_notif_state_v1", NOTIFICATIONS, useAgentActivity);
export const useAgentNotifications = createNotifStore("chiya_agent_notif_state_v1", AGENT_NOTIFICATIONS);
