"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  PROPERTIES,
  AGENTS,
  type PropertyRecord,
  type AgentRecord,
} from "@/app/admin/_data/catalog";
import { STORAGE_KEY, STORE_EVENT, normalizeProperties } from "@/app/admin/_shared/properties-store";
import { deriveSiteProperties, deriveFeatured, publicRecords, type SiteProperty } from "@/lib/site-properties";
import { deriveSiteAgents, deriveFeaturedAgents, type SiteAgent } from "@/lib/site-agents";

/**
 * Live public catalog — a read-only bridge that lets the public site reflect
 * admin edits (featured toggles, status changes, new listings) without a reload.
 *
 * The admin store (app/admin/_shared/properties-store) persists its records to
 * `chiya:admin-store:v7`; the public site is never inside that React provider,
 * so this reads the same localStorage blob via useSyncExternalStore — the same
 * external-store pattern as lib/favorites.ts. It subscribes to the native
 * `storage` event (cross-tab) AND the admin store's same-tab `STORE_EVENT`.
 *
 * SCOPE: consumed only by the client-rendered public surfaces (homepage,
 * search, agents directory). The async Server-Component detail/profile pages
 * (/property/[id], /agents/[id]) can't read client localStorage during SSR, so
 * they stay seed-based by design.
 *
 * Seed fallback: with no stored data (a fresh browser), every slice falls back
 * to the static catalog, so the public site is identical to today until an
 * admin edits something. getServerSnapshot returns the seed too, so SSR and the
 * first client render agree — no hydration mismatch.
 */

interface RawRecords {
  properties: PropertyRecord[];
  agents: AgentRecord[];
}

const SEED: RawRecords = { properties: PROPERTIES, agents: AGENTS };

let current: RawRecords = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function read(): RawRecords {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    const data = JSON.parse(raw) as Partial<{ properties: PropertyRecord[]; agents: AgentRecord[] }>;
    return {
      // normalizeProperties enforces the same "live listing must have an agent"
      // invariant the admin store applies on hydrate.
      properties: Array.isArray(data.properties) ? normalizeProperties(data.properties) : PROPERTIES,
      agents: Array.isArray(data.agents) ? data.agents : AGENTS,
    };
  } catch {
    return SEED;
  }
}

function refresh() {
  current = read();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  if (!hydrated) {
    hydrated = true;
    current = read();
  }
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) refresh();
  };
  window.addEventListener("storage", onStorage); // cross-tab
  window.addEventListener(STORE_EVENT, refresh); // same-tab (admin store persist)
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(STORE_EVENT, refresh);
  };
}

const getSnapshot = () => current;
const getServerSnapshot = () => SEED;

export interface PublicCatalog {
  /** All public (Published) listings, live. */
  siteProperties: SiteProperty[];
  /** Featured public listings (admin-curated). */
  featuredProperties: SiteProperty[];
  /** Public (Verified) agents, live. */
  siteAgents: SiteAgent[];
  /** Featured public agents (admin-curated). */
  featuredAgents: SiteAgent[];
  /** The live public PropertyRecord subset (for count/place helpers). */
  publicRecords: PropertyRecord[];
}

/**
 * Reactive public catalog. Re-derives the public views whenever the admin store
 * changes (same tab or cross-tab). Memoized on the raw record references so the
 * transforms only re-run on an actual change.
 */
export function usePublicCatalog(): PublicCatalog {
  const records = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => {
    const siteProperties = deriveSiteProperties(records.properties);
    const siteAgents = deriveSiteAgents(records.agents, records.properties);
    return {
      siteProperties,
      featuredProperties: deriveFeatured(siteProperties),
      siteAgents,
      featuredAgents: deriveFeaturedAgents(siteAgents),
      publicRecords: publicRecords(records.properties),
    };
  }, [records]);
}
