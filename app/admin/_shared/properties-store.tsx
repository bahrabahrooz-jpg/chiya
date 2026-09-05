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
  legacyStatus,
  requiresAgent,
  withAgentStats,
  withMemberCounts,
  withMemberRoles,
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
import { isRegistration, removeRegistration, restoreRegistration, updateRegistration, useRegistrations } from "../_members/registrations";
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
/* Availability is derived from contracts, so each transition gets its own verb.
   "Changed status to Sold" would read as though a person chose it. */
const AVAILABILITY_ACTION: Record<string, string> = {
  reserved: "audit.action.reservedProperty",
  sold: "audit.action.markedSold",
  rented: "audit.action.markedRented",
  available: "audit.action.releasedProperty",
};

function propertyAction(patch: Partial<PropertyRecord>): AuditVerb {
  if (patch.featured !== undefined) {
    return { actionKey: patch.featured ? "audit.action.featuredProperty" : "audit.action.unfeaturedProperty" };
  }
  /* Availability first: a patch that moves both fields at once (a deal closing
     unpublishes AND marks sold) is logged as the transaction, and the shared
     transition hook emits the visibility event separately. Collapsing them into
     one "changed status" line is exactly what this split exists to prevent. */
  if (patch.availability !== undefined) {
    return { actionKey: AVAILABILITY_ACTION[patch.availability] ?? "audit.action.updatedProperty" };
  }
  if (patch.publication !== undefined) {
    if (patch.publication === "archived") return { actionKey: "audit.action.archivedProperty" };
    // "@" marks a value that is itself a catalog key, resolved when rendered.
    return { actionKey: "audit.action.changedVisibility", actionParams: { status: "@" + valueKey("status", patch.publication) } };
  }
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
  if (patch.featured !== undefined) return patch.featured ? "audit.action.featuredAgent" : "audit.action.unfeaturedAgent";
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

/**
 * Enforce the core invariant on any property set we load: a live listing must
 * have an assigned agent. Anything that violates it — stale cached data, or a
 * record from an older schema — is pulled back to "pending" until an agent is
 * assigned. Runs on the seed and on every hydrate so the UI can trust that no
 * live listing is ever unassigned.
 *
 * It downgrades PUBLICATION ONLY, never availability. An agent-less sold record
 * is a data problem, but resetting its availability would erase a transaction —
 * far worse than the problem it fixes. It cannot arise from the UI either: a
 * deal names its agent, so anything sold or rented has one.
 */
export function normalizeProperties(list: PropertyRecord[]): PropertyRecord[] {
  return list.map((p) => {
    if (p.agent || !requiresAgent(p)) return p;
    const next = { ...p, publication: "pending" as const };
    return { ...next, status: legacyStatus(next), published: false };
  });
}

/* The admin store lives in memory, but several actions (e.g. the "Add property"
   button) trigger a full-page navigation that would otherwise reset it. We
   persist the mutable slices to localStorage so changes survive reloads. */
/* Bump the version whenever the seed schema/semantics change so stale caches are
   discarded. v2: only verified agents can be assigned (no "Pending" agent cards).
   v3: sold/rented "updated" dates spread between listing and today (period KPIs).
   v4: live listings (Published/Sold/Rented) always have an assigned agent.
   v5: hand-curated seed — 24 properties / 14 members / 7 agents, one record per
   scenario (replaces the old 320/240/48 generated dataset).
   v6: transactional roles — Sold records carry a buyer, Rented may carry a
   tenant, and member roles are derived from those links instead of declared.
   v7: agents carry authored profile copy (headline + bio) shown on their public
   profile; a v6 cache would pin every agent to the generated summary.
   v8: `status` split into `publication` + `availability`, and every property
   carries a listing mandate. A v7 record has neither field, so it would read as
   undefined everywhere and quietly vanish from every filter.
   v9: `price` is a `Money` ({ amount, currency }) instead of a bare number. A v8
   record's price is `850000`, so `price.currency` is undefined and every
   formatter throws on it — this is not a field that degrades quietly, it takes
   the homepage down.
   v10: a member carries how to WRITE to them — `whatsapp`, `msgLang` and
   `remindersOn`. A v9 record has none of the three, and reachBlock() reads a
   missing field as the ordinary case on purpose (absence must mean reachable,
   never a silent block). So a stale cache does not throw and does not look
   wrong: it quietly makes everybody reachable, and the message log loses every
   "Not sent" and every "Failed" row while still showing the ones that went
   out. The whole point of those two states is that somebody notices them, so
   this is the worst kind of stale cache — the kind that degrades into good
   news.

   v11 adds CH-3176, the property whose tenancy expired and was never closed —
   still marked `rented` two months after the term ended, which is the state
   that makes it impossible to re-list. A v10 cache does not have it, so the
   contract seeded against it (CT-0213) resolves to no property at all. Bumped
   together with the contracts store; the two seeds reference each other and a
   cache that holds one but not the other is worse than either being stale. */
export const STORAGE_KEY = "chiya:admin-store:v11";

/* Same-tab change signal. The browser `storage` event only fires in OTHER tabs,
   so we dispatch this on every persist to let same-tab listeners (the public
   site's live-catalog bridge, lib/public-catalog.ts) react without a reload. */
export const STORE_EVENT = "chiya:admin-store-changed";

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

  /* Members who signed themselves up on the website. They live in their own
     module store (see ../_members/registrations) because the public site cannot
     reach this context to call addMember, and they are merged in for READING
     only — never folded into memberRoster, which would persist a second copy of
     each under the admin's own storage key and let the two drift apart. Newest
     first, ahead of the roster: a registration nobody has called yet is the one
     worth seeing. */
  const registered = useRegistrations();
  const fullRoster = useMemo(() => [...registered, ...memberRoster], [registered, memberRoster]);

  const counts = useMemo(() => countProperties(properties), [properties]);
  /* Roles are derived live from property links (owner / buyer / tenant), so a
     role can never exist without a backing record. Roles set explicitly on a
     roster record (e.g. via Add member) are kept as a base. */
  const members = useMemo(() => withMemberCounts(withMemberRoles(fullRoster, properties), properties), [fullRoster, properties]);
  const agents = useMemo(() => withAgentStats(agentRoster, properties), [agentRoster, properties]);
  const locationTree = useMemo(() => buildLocationTree(locationDefs, properties), [locationDefs, properties]);
  const memberCounts = useMemo(() => countMembers(members), [members]);
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
  /* A member edit has to land in the store that OWNS the record. A
     self-registered member belongs to the registrations store for its whole
     life; writing it into memberRoster instead would leave two copies of the
     same person, one in each key, disagreeing from the next edit onwards. The
     undo path (restoreMember) has the same fork for the same reason. */
  const addMember = useCallback((m: MemberRecord) => {
    logAudit({ category: "member", actionKey: "audit.action.addedMember", target: m.name, targetId: m.id });
    if (m.source === "website") {
      restoreRegistration(m);
      return;
    }
    setMemberRoster((prev) => [m, ...prev]);
  }, []);
  const removeMember = useCallback(
    (id: string) => {
      const rec = fullRoster.find((m) => m.id === id);
      logAudit({ category: "member", actionKey: "audit.action.removedMember", target: rec?.name ?? id, targetId: id });
      if (isRegistration(id)) {
        removeRegistration(id);
        return;
      }
      setMemberRoster((prev) => prev.filter((m) => m.id !== id));
    },
    [fullRoster],
  );
  const updateMember = useCallback(
    (id: string, patch: Partial<MemberRecord>) => {
      const rec = fullRoster.find((m) => m.id === id);
      logAudit({ category: "member", actionKey: memberAction(patch), target: rec?.name ?? id, targetId: id });
      if (isRegistration(id)) {
        updateRegistration(id, patch);
        return;
      }
      setMemberRoster((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    },
    [fullRoster],
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
      // Notify same-tab listeners (public site live-catalog); `storage` only
      // fires in other tabs, so a custom event covers the same-tab case.
      window.dispatchEvent(new Event(STORE_EVENT));
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
