"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { valueKey } from "@/lib/fmt";
import {
  AGENTS,
  LOCATION_DEF,
  MEMBERS,
  PROPERTIES,
  addLocationDef,
  buildLocationTree,
  cloneLocationDefs,
  removeLocationDef,
  countAgents,
  countLocations,
  countMembers,
  countProperties,
  statusRequiresAgent,
  withAgentStats,
  withMemberCounts,
  type AgentCounts,
  type AgentRecord,
  type CityDef,
  type LocationCounts,
  type LocationNode,
  type MemberCounts,
  type MemberRecord,
  type PropertyCounts,
  type PropertyRecord,
} from "../_data/catalog";
import { logAudit } from "./audit-log";

/* Infer a specific audit verb from a mutation patch so the log reads naturally
   ("Changed status to Sold") instead of a generic "updated". Returns i18n keys —
   the audit feed resolves them at render time, so the log follows the viewer's
   language rather than the language it was recorded in. */
interface AuditVerb {
  actionKey: string;
  actionParams?: Record<string, string>;
  metaKey?: string;
  metaParams?: Record<string, string>;
}
function propertyAction(patch: Partial<PropertyRecord>): AuditVerb {
  if (patch.status !== undefined) {
    const status = String(patch.status);
    if (status.toLowerCase() === "archived") return { actionKey: "audit.action.archivedProperty" };
    // "@" marks a value that is itself a catalog key, resolved when rendered.
    return { actionKey: "audit.action.changedStatus", actionParams: { status: "@" + valueKey("status", status) } };
  }
  if (patch.agent !== undefined) {
    const name = patch.agent && typeof patch.agent === "object" && "name" in patch.agent ? (patch.agent as { name?: string }).name : undefined;
    return patch.agent
      ? { actionKey: "audit.action.assignedAgent", ...(name ? { metaKey: "audit.meta.assignedTo", metaParams: { name } } : {}) }
      : { actionKey: "audit.action.unassignedAgent" };
  }
  return { actionKey: "audit.action.updatedProperty" };
}
function memberAction(patch: Partial<MemberRecord>): string {
  if (patch.status !== undefined) return String(patch.status).toLowerCase() === "suspended" ? "audit.action.suspendedMember" : "audit.action.activatedMember";
  return "audit.action.updatedMember";
}
function agentAction(patch: Partial<AgentRecord>): string {
  if (patch.verification !== undefined) return String(patch.verification).toLowerCase() === "verified" ? "audit.action.verifiedAgent" : "audit.action.revokedVerification";
  if (patch.status !== undefined) return String(patch.status).toLowerCase() === "suspended" ? "audit.action.suspendedAgent" : "audit.action.activatedAgent";
  return "audit.action.updatedAgent";
}
/* One key per location type — avoids interpolating an untranslated type word. */
const LOCATION_ADD_KEY = { city: "audit.action.addedCity", district: "audit.action.addedDistrict", project: "audit.action.addedProject" } as const;
const LOCATION_REMOVE_KEY = { city: "audit.action.removedCity", district: "audit.action.removedDistrict", project: "audit.action.removedProject" } as const;

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
  /* location structure mutations (flow to the tree + add-property dropdowns) */
  locationDefs: CityDef[];
  addLocation: (name: string, type: "city" | "district" | "project", parentId: string) => void;
  removeLocation: (type: "city" | "district" | "project", id: string) => void;
  restoreLocations: (defs: CityDef[]) => void;
}

const PropertiesContext = createContext<PropertiesContextValue | null>(null);

/* Enforce the core invariant on any property set we load: a live listing
   (Published / Sold / Rented) must have an assigned agent. Anything that
   violates it — stale cached data, or a record from an older schema — is pulled
   back to "Pending" until an agent is assigned. Runs on the seed and on every
   hydrate so the UI can trust that no live listing is ever unassigned. */
function normalizeProperties(list: PropertyRecord[]): PropertyRecord[] {
  return list.map((p) => (!p.agent && statusRequiresAgent(p.status) ? { ...p, status: "Pending", published: false } : p));
}

/* The admin store lives in memory, but several actions (e.g. the "Add property"
   button) trigger a full-page navigation that would otherwise reset it. We
   persist the mutable slices to localStorage so changes survive reloads. */
/* Bump the version whenever the seed schema/semantics change so stale caches are
   discarded. v2: only verified agents can be assigned (no "Pending" agent cards).
   v3: sold/rented "updated" dates spread between listing and today (period KPIs).
   v4: live listings (Published/Sold/Rented) always have an assigned agent. */
const STORAGE_KEY = "chiya:admin-store:v4";

/**
 * Single source of truth for the whole admin area. Properties, members, and
 * agents all live here, so the dashboard, properties, locations, members, and
 * agents pages read the same data. Mutating a property (add / remove / status
 * change) updates every derived KPI consistently.
 */
export function PropertiesProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<PropertyRecord[]>(() => normalizeProperties(PROPERTIES));
  const [memberRoster, setMemberRoster] = useState<MemberRecord[]>(MEMBERS);
  const [agentRoster, setAgentRoster] = useState<AgentRecord[]>(AGENTS);
  const [locationDefs, setLocationDefs] = useState<CityDef[]>(() => cloneLocationDefs(LOCATION_DEF));

  const counts = useMemo(() => countProperties(properties), [properties]);
  const members = useMemo(() => withMemberCounts(memberRoster, properties), [memberRoster, properties]);
  const agents = useMemo(() => withAgentStats(agentRoster, properties), [agentRoster, properties]);
  const locationTree = useMemo(() => buildLocationTree(locationDefs, properties), [locationDefs, properties]);
  const memberCounts = useMemo(() => countMembers(memberRoster), [memberRoster]);
  const agentCounts = useMemo(() => countAgents(agentRoster), [agentRoster]);
  const locationCounts = useMemo(() => countLocations(locationDefs, properties), [locationDefs, properties]);

  const addProperty = useCallback((p: PropertyRecord) => {
    logAudit({ category: "property", actionKey: "audit.action.createdProperty", target: p.title, targetId: p.id });
    setProperties((prev) => [p, ...prev]);
  }, []);
  const removeProperty = useCallback(
    (id: string) => {
      const rec = properties.find((p) => p.id === id);
      logAudit({ category: "property", actionKey: "audit.action.deletedProperty", target: rec?.title ?? id, targetId: id });
      setProperties((prev) => prev.filter((p) => p.id !== id));
    },
    [properties],
  );
  const updateProperty = useCallback(
    (id: string, patch: Partial<PropertyRecord>) => {
      const rec = properties.find((p) => p.id === id);
      logAudit({ category: "property", target: rec?.title ?? id, targetId: id, ...propertyAction(patch) });
      setProperties((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    },
    [properties],
  );
  const addMember = useCallback((m: MemberRecord) => {
    logAudit({ category: "member", actionKey: "audit.action.addedMember", target: m.name, targetId: m.id });
    setMemberRoster((prev) => [m, ...prev]);
  }, []);
  const removeMember = useCallback(
    (id: string) => {
      const rec = memberRoster.find((m) => m.id === id);
      logAudit({ category: "member", actionKey: "audit.action.removedMember", target: rec?.name ?? id, targetId: id });
      setMemberRoster((prev) => prev.filter((m) => m.id !== id));
    },
    [memberRoster],
  );
  const updateMember = useCallback(
    (id: string, patch: Partial<MemberRecord>) => {
      const rec = memberRoster.find((m) => m.id === id);
      logAudit({ category: "member", actionKey: memberAction(patch), target: rec?.name ?? id, targetId: id });
      setMemberRoster((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    [memberRoster],
  );
  const addAgent = useCallback((a: AgentRecord) => {
    logAudit({ category: "agent", actionKey: "audit.action.onboardedAgent", target: a.name, targetId: a.id });
    setAgentRoster((prev) => [a, ...prev]);
  }, []);
  const removeAgent = useCallback(
    (id: string) => {
      const rec = agentRoster.find((a) => a.id === id);
      logAudit({ category: "agent", actionKey: "audit.action.removedAgent", target: rec?.name ?? id, targetId: id });
      setAgentRoster((prev) => prev.filter((a) => a.id !== id));
    },
    [agentRoster],
  );
  const updateAgent = useCallback(
    (id: string, patch: Partial<AgentRecord>) => {
      const rec = agentRoster.find((a) => a.id === id);
      logAudit({ category: "agent", actionKey: agentAction(patch), target: rec?.name ?? id, targetId: id });
      setAgentRoster((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    },
    [agentRoster],
  );
  const addLocation = useCallback((name: string, type: "city" | "district" | "project", parentId: string) => {
    logAudit({ category: "location", actionKey: LOCATION_ADD_KEY[type], target: name });
    setLocationDefs((prev) => addLocationDef(prev, name, type, parentId));
  }, []);
  const removeLocation = useCallback((type: "city" | "district" | "project", id: string) => {
    logAudit({ category: "location", actionKey: LOCATION_REMOVE_KEY[type], target: id });
    setLocationDefs((prev) => removeLocationDef(prev, type, id));
  }, []);
  const restoreLocations = useCallback((defs: CityDef[]) => setLocationDefs(cloneLocationDefs(defs)), []);

  // Hydrate from localStorage once on mount (client only).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as Partial<{ properties: PropertyRecord[]; members: MemberRecord[]; agents: AgentRecord[]; locations: CityDef[] }>;
      /* eslint-disable react-hooks/set-state-in-effect -- hydrating from localStorage after mount avoids an SSR hydration mismatch */
      if (Array.isArray(data.properties)) setProperties(normalizeProperties(data.properties));
      if (Array.isArray(data.members)) setMemberRoster(data.members);
      if (Array.isArray(data.agents)) setAgentRoster(data.agents);
      if (Array.isArray(data.locations)) setLocationDefs(data.locations);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch {}
  }, []);

  // Persist on change (skip the first run so we don't clobber before hydration).
  const skipFirstSave = useRef(true);
  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ properties, members: memberRoster, agents: agentRoster, locations: locationDefs }));
    } catch {}
  }, [properties, memberRoster, agentRoster, locationDefs]);

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
      locationDefs,
      addLocation,
      removeLocation,
      restoreLocations,
    }),
    [properties, members, agents, locationTree, counts, memberCounts, agentCounts, locationCounts, addProperty, removeProperty, updateProperty, addMember, removeMember, updateMember, addAgent, removeAgent, updateAgent, locationDefs, addLocation, removeLocation, restoreLocations],
  );

  return <PropertiesContext.Provider value={value}>{children}</PropertiesContext.Provider>;
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used within a PropertiesProvider");
  return ctx;
}
