"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AgentRecord } from "@/app/admin/_data/catalog";
import { useAgentSession } from "@/lib/agent-session";

/**
 * Agent profile store — the signed-in agent's editable identity.
 *
 * Mirrors the admin-profile store, with one difference: an agent's identity is
 * seeded from their catalog record rather than a single constant, and the demo
 * can sign in as any agent. So what's persisted is a map of per-agent *patches*
 * keyed by agent id, merged over the catalog seed on read — switching agents
 * still shows the right person, and only the edited fields are stored.
 *
 * Note this profile is display-only: `useAgentData` deliberately keeps scoping
 * listings/viewings by the canonical catalog name, so renaming yourself here
 * can't orphan your own assignments.
 */

export interface AgentProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  /** Profile photo as a data URL or remote src, or "" to fall back to initials. */
  avatar: string;
}

const KEY = "chiya:agent-profile:v1";

type Patches = Record<string, Partial<AgentProfile>>;

// Stable empty reference — useSyncExternalStore requires getServerSnapshot and
// the pre-hydration snapshot to be referentially stable.
const EMPTY: Patches = {};

let current: Patches = EMPTY;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function parse(raw: string | null): Patches {
  try {
    return raw ? ((JSON.parse(raw) as Patches) ?? EMPTY) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    current = parse(localStorage.getItem(KEY));
  } catch {
    /* noop */
  }
}

function subscribe(onChange: () => void) {
  hydrate();
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = parse(e.newValue);
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return EMPTY;
}

/** The unedited profile as it exists in the catalog. */
export function seedProfile(a: AgentRecord): AgentProfile {
  return { name: a.name, email: a.email, phone: a.phone, city: a.city, avatar: a.img || "" };
}

export function useAgentProfile() {
  const { agent } = useAgentSession();
  const patches = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const profile = useMemo<AgentProfile>(() => ({ ...seedProfile(agent), ...patches[agent.id] }), [agent, patches]);

  const update = useCallback(
    (patch: Partial<AgentProfile>) => {
      current = { ...current, [agent.id]: { ...current[agent.id], ...patch } };
      try {
        localStorage.setItem(KEY, JSON.stringify(current));
      } catch {
        /* noop */
      }
      emit();
    },
    [agent.id],
  );

  return { profile, update };
}
