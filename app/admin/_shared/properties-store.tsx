"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  AGENTS,
  MEMBERS,
  PROPERTIES,
  buildLocationTree,
  countAgents,
  countLocations,
  countMembers,
  countProperties,
  withAgentStats,
  withMemberCounts,
  type AgentCounts,
  type AgentRecord,
  type LocationCounts,
  type LocationNode,
  type MemberCounts,
  type MemberRecord,
  type PropertyCounts,
  type PropertyRecord,
} from "../_data/catalog";

interface PropertiesContextValue {
  /* live records */
  properties: PropertyRecord[];
  members: MemberRecord[]; // base roster (with live owned-property counts)
  agents: AgentRecord[]; // base roster (with live listing/sold/rented stats)
  locationTree: LocationNode[];
  /* derived counts */
  counts: PropertyCounts;
  memberCounts: MemberCounts;
  agentCounts: AgentCounts;
  locationCounts: LocationCounts;
  /* property mutations (ripple through every derived count) */
  setProperties: React.Dispatch<React.SetStateAction<PropertyRecord[]>>;
  addProperty: (p: PropertyRecord) => void;
  removeProperty: (id: string) => void;
  updateProperty: (id: string, patch: Partial<PropertyRecord>) => void;
  /* member / agent roster mutations */
  addMember: (m: MemberRecord) => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, patch: Partial<MemberRecord>) => void;
  addAgent: (a: AgentRecord) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, patch: Partial<AgentRecord>) => void;
}

const PropertiesContext = createContext<PropertiesContextValue | null>(null);

/**
 * Single source of truth for the whole admin area. Properties, members, and
 * agents all live here, so the dashboard, properties, locations, members, and
 * agents pages read the same data. Mutating a property (add / remove / status
 * change) updates every derived KPI consistently.
 */
export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<PropertyRecord[]>(PROPERTIES);
  const [memberRoster, setMemberRoster] = useState<MemberRecord[]>(MEMBERS);
  const [agentRoster, setAgentRoster] = useState<AgentRecord[]>(AGENTS);

  const counts = useMemo(() => countProperties(properties), [properties]);
  const members = useMemo(() => withMemberCounts(memberRoster, properties), [memberRoster, properties]);
  const agents = useMemo(() => withAgentStats(agentRoster, properties), [agentRoster, properties]);
  const locationTree = useMemo(() => buildLocationTree(properties), [properties]);
  const memberCounts = useMemo(() => countMembers(memberRoster), [memberRoster]);
  const agentCounts = useMemo(() => countAgents(agentRoster), [agentRoster]);
  const locationCounts = useMemo(() => countLocations(properties), [properties]);

  const addProperty = useCallback((p: PropertyRecord) => setProperties((prev) => [p, ...prev]), []);
  const removeProperty = useCallback((id: string) => setProperties((prev) => prev.filter((p) => p.id !== id)), []);
  const updateProperty = useCallback(
    (id: string, patch: Partial<PropertyRecord>) => setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [],
  );
  const addMember = useCallback((m: MemberRecord) => setMemberRoster((prev) => [m, ...prev]), []);
  const removeMember = useCallback((id: string) => setMemberRoster((prev) => prev.filter((m) => m.id !== id)), []);
  const updateMember = useCallback(
    (id: string, patch: Partial<MemberRecord>) => setMemberRoster((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m))),
    [],
  );
  const addAgent = useCallback((a: AgentRecord) => setAgentRoster((prev) => [a, ...prev]), []);
  const removeAgent = useCallback((id: string) => setAgentRoster((prev) => prev.filter((a) => a.id !== id)), []);
  const updateAgent = useCallback(
    (id: string, patch: Partial<AgentRecord>) => setAgentRoster((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    [],
  );

  const value = useMemo(
    () => ({
      properties,
      members,
      agents,
      locationTree,
      counts,
      memberCounts,
      agentCounts,
      locationCounts,
      setProperties,
      addProperty,
      removeProperty,
      updateProperty,
      addMember,
      removeMember,
      updateMember,
      addAgent,
      removeAgent,
      updateAgent,
    }),
    [properties, members, agents, locationTree, counts, memberCounts, agentCounts, locationCounts, addProperty, removeProperty, updateProperty, addMember, removeMember, updateMember, addAgent, removeAgent, updateAgent],
  );

  return <PropertiesContext.Provider value={value}>{children}</PropertiesContext.Provider>;
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used within a PropertiesProvider");
  return ctx;
}
