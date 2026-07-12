"use client";

import { useMemo } from "react";
import { useProperties } from "@/app/admin/_shared/properties-store";
import { VIEWINGS } from "@/app/admin/_viewings/data";
import { useAgentSession } from "@/lib/agent-session";

/**
 * Scoped data for the signed-in agent. The Agent role is "own"-scoped, so every
 * list is filtered to the agent's own assignments off the same shared store the
 * admin uses — no separate data, just filtered views:
 *   properties → listings assigned to this agent
 *   members    → owners of those listings
 *   viewings   → viewings this agent hosts
 */
export function useAgentData() {
  const { agent } = useAgentSession();
  const store = useProperties();
  const name = agent.name;

  const properties = useMemo(() => store.properties.filter((p) => p.agent?.name === name), [store.properties, name]);
  const ownerNames = useMemo(() => new Set(properties.map((p) => p.owner.name)), [properties]);
  const members = useMemo(() => store.members.filter((m) => ownerNames.has(m.name)), [store.members, ownerNames]);
  const viewings = useMemo(() => VIEWINGS.filter((v) => v.agent === name), [name]);
  // this agent's record enriched with live stats (listings / sold / rented / members)
  const me = useMemo(() => store.agents.find((a) => a.id === agent.id) ?? agent, [store.agents, agent]);

  return { me, properties, members, viewings, store };
}
