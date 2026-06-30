import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { PROPERTIES, buildLocationTree, type LocationNode } from "../_data/catalog";

export type { LocationNode } from "../_data/catalog";

/* KPI tiles — values come from the live location counts (see LocationsApp). */
export interface KpiCard {
  key: string;
  field: "cities" | "districts" | "projects" | "assigned";
  label: string;
  icon: IconName;
  tone: StatTone;
  sub: string;
}
export const KPI_META: KpiCard[] = [
  { key: "cities", field: "cities", label: "Cities", icon: "map", tone: "brand", sub: "Kurdistan Region" },
  { key: "districts", field: "districts", label: "Districts & Areas", icon: "map-pin", tone: "info", sub: "Across all cities" },
  { key: "projects", field: "projects", label: "Projects & Communities", icon: "building-2", tone: "gold", sub: "Active developments" },
  { key: "properties", field: "assigned", label: "Properties Assigned", icon: "home", tone: "success", sub: "Mapped to locations" },
];

export const TYPE_CONFIG: Record<string, { label: string; variant: BadgeVariant; icon: IconName }> = {
  city: { label: "City", variant: "brand", icon: "map" },
  district: { label: "District / Area", variant: "info", icon: "map-pin" },
  project: { label: "Project / Community", variant: "success", icon: "building-2" },
};

export interface TypeOption {
  value: string;
  label: string;
  icon: IconName;
  sub: string;
}
export const TYPE_OPTIONS: TypeOption[] = [
  { value: "city", label: "City", icon: "map", sub: "Top-level location" },
  { value: "district", label: "District / Area", icon: "map-pin", sub: "Belongs to a city" },
  { value: "project", label: "Project / Community", icon: "building-2", sub: "Residential development" },
];

export function flattenTree(nodes: LocationNode[], depth = 0): LocationNode[] {
  const out: LocationNode[] = [];
  for (const n of nodes) {
    out.push({ ...n, _depth: depth });
    if (n.children?.length) out.push(...flattenTree(n.children, depth + 1));
  }
  return out;
}

export function nodeMatchesSearch(node: LocationNode, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  return node.children?.some((c) => nodeMatchesSearch(c, q)) || false;
}

export function countNodes(nodes: LocationNode[]): number {
  return nodes.reduce((s, n) => s + 1 + countNodes(n.children || []), 0);
}

/* Static structure (counts here don't matter) for the "parent location" picker. */
const STATIC_TREE = buildLocationTree(PROPERTIES);
export const ALL_FLAT = flattenTree(STATIC_TREE);

export function getParentOptions(type: string): LocationNode[] {
  if (!type || type === "city") return [];
  const allowed =
    (
      {
        district: ["city"],
        project: ["city", "district"],
      } as Record<string, string[]>
    )[type] || [];
  return ALL_FLAT.filter((n) => allowed.includes(n.type));
}
