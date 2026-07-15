"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AGENTS, TOP_AGENT, type AgentRecord } from "@/app/admin/_data/catalog";

/**
 * Agent session — which agent is signed in to the agent surface.
 *
 * No real auth, so signing in picks a demo agent from the catalog. The default
 * is the verified agent holding the most assigned listings, so "own"-scoped
 * views have plenty of real data. Mirrors the admin-auth external-store pattern.
 */

const KEY = "chiya:agent-session:v1";

export const DEMO_AGENT_ID = TOP_AGENT.id;

interface Session {
  authed: boolean;
  agentId: string;
}
// No agent login screen — the demo agent is always signed in.
const INITIAL: Session = { authed: true, agentId: DEMO_AGENT_ID };

let current: Session = INITIAL;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function coerce(raw: string | null): Session {
  try {
    const s = raw ? (JSON.parse(raw) as Partial<Session>) : null;
    return s ? { authed: !!s.authed, agentId: s.agentId || DEMO_AGENT_ID } : INITIAL;
  } catch {
    return INITIAL;
  }
}
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    current = coerce(localStorage.getItem(KEY));
  } catch {
    /* noop */
  }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* noop */
  }
}
function subscribe(onChange: () => void) {
  hydrate();
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = coerce(e.newValue);
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
  return INITIAL;
}

export function agentById(id: string): AgentRecord | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function useAgentSession() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const agent = agentById(session.agentId) ?? AGENTS[0];

  const login = useCallback((agentId?: string) => {
    current = { authed: true, agentId: agentId || current.agentId || DEMO_AGENT_ID };
    persist();
    emit();
  }, []);
  const logout = useCallback(() => {
    current = { ...current, authed: false };
    persist();
    emit();
  }, []);

  return { authed: session.authed, agent, login, logout };
}
