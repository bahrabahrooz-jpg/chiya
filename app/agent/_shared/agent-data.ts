"use client";

import { useMemo } from "react";
import { useProperties } from "@/app/admin/_shared/properties-store";
import { useContracts } from "@/app/admin/_shared/contracts-store";
import { VIEWINGS } from "@/app/admin/_viewings/data";
import { useAgentSession } from "@/lib/agent-session";

/**
 * Scoped data for the signed-in agent. The Agent role is "own"-scoped, so every
 * list is filtered to the agent's own assignments off the same shared store the
 * admin uses — no separate data, just filtered views:
 *   properties → listings assigned to this agent
 *   members    → owners of those listings
 *   viewings   → viewings this agent hosts
 *   contracts  → transactions this agent is running
 *
 * Contracts scope by the contract's OWN agentId, not by the property's assigned
 * agent. A listing reassigned after a sale still belongs, in the reports, to
 * whoever actually closed it.
 */
export function useAgentData() {
  const { agent } = useAgentSession();
  const store = useProperties();
  const contractsStore = useContracts();
  const name = agent.name;

  const properties = useMemo(() => store.properties.filter((p) => p.agent?.name === name), [store.properties, name]);
  /* Ids, not names — two owners called the same thing were one entry here. */
  const ownerIds = useMemo(() => new Set(properties.map((p) => p.ownerId).filter(Boolean) as string[]), [properties]);
  const members = useMemo(() => store.members.filter((m) => ownerIds.has(m.id)), [store.members, ownerIds]);
  const viewings = useMemo(() => VIEWINGS.filter((v) => v.agent === name), [name]);
  const contracts = useMemo(() => contractsStore.contracts.filter((c) => c.agentId === agent.id), [contractsStore.contracts, agent.id]);
  // this agent's record enriched with live stats (listings / sold / rented / members)
  const me = useMemo(() => store.agents.find((a) => a.id === agent.id) ?? agent, [store.agents, agent]);

  return { me, properties, members, viewings, contracts, store };
}
