import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";

export interface LocationNode {
  id: string;
  name: string;
  type: "city" | "district" | "project";
  properties: number;
  created: string;
  updated: string;
  description: string;
  parent?: string;
  children: LocationNode[];
  _depth?: number;
}

export const LOCATION_TREE: LocationNode[] = [
  {
    id: "erbil", name: "Erbil", type: "city", properties: 1842, created: "Jan 12, 2023", updated: "Jun 10, 2026",
    description: "Capital city of the Kurdistan Region and the most developed urban center, with a diverse real estate market spanning luxury villas, apartments, and commercial properties.",
    children: [
      {
        id: "100-meter", name: "100 Meter", type: "district", parent: "Erbil", properties: 312, created: "Feb 3, 2023", updated: "May 28, 2026",
        description: "A major commercial and residential district in central Erbil, known for its wide boulevard and premium developments.",
        children: [
          { id: "empire-world", name: "Empire World", type: "project", parent: "100 Meter", properties: 86, created: "Mar 15, 2023", updated: "Jun 2, 2026", description: "Premium residential project within 100 Meter district, featuring luxury villas and modern apartments.", children: [] },
          { id: "dream-city", name: "Dream City", type: "project", parent: "100 Meter", properties: 134, created: "Mar 15, 2023", updated: "Jun 5, 2026", description: "Large mixed-use residential community offering a wide range of property types.", children: [] },
          { id: "naz-city", name: "Naz City", type: "project", parent: "100 Meter", properties: 92, created: "Apr 1, 2023", updated: "Jun 1, 2026", description: "Upscale residential project offering luxury villas, townhouses, and modern apartments.", children: [] },
        ],
      },
      { id: "gulan", name: "Gulan", type: "district", parent: "Erbil", properties: 178, created: "Feb 3, 2023", updated: "May 20, 2026", description: "A well-established district along Gulan Street — one of Erbil's primary commercial and residential corridors.", children: [] },
    ],
  },
  {
    id: "duhok", name: "Duhok", type: "city", properties: 614, created: "Jan 12, 2023", updated: "Jun 3, 2026",
    description: "Capital of Duhok Governorate, situated in the northern part of the Kurdistan Region with growing real estate demand across residential and commercial sectors.",
    children: [
      { id: "malta", name: "Malta", type: "district", parent: "Duhok", properties: 88, created: "Feb 20, 2023", updated: "May 15, 2026", description: "A central residential and commercial district in Duhok, offering diverse property options across villa and apartment segments.", children: [] },
    ],
  },
  {
    id: "sulaymaniyah", name: "Sulaymaniyah", type: "city", properties: 391, created: "Jan 12, 2023", updated: "May 25, 2026",
    description: "The second largest city of the Kurdistan Region, known for its cultural heritage, universities, and a growing commercial real estate market.",
    children: [
      { id: "raparin", name: "Raparin", type: "district", parent: "Sulaymaniyah", properties: 89, created: "Mar 1, 2023", updated: "Apr 20, 2026", description: "A major district in Sulaymaniyah with a diverse mix of residential and commercial properties at various price points.", children: [] },
    ],
  },
];

export interface KpiCard {
  key: string;
  label: string;
  icon: IconName;
  tone: StatTone;
  value: string;
  sub: string;
}
export const KPI_DATA: KpiCard[] = [
  { key: "cities", label: "Cities", icon: "map", tone: "brand", value: "3", sub: "Kurdistan Region" },
  { key: "districts", label: "Districts & Areas", icon: "map-pin", tone: "info", value: "8", sub: "Across all cities" },
  { key: "projects", label: "Projects & Communities", icon: "building-2", tone: "gold", value: "12", sub: "Active developments" },
  { key: "properties", label: "Properties Assigned", icon: "home", tone: "success", value: "2,847", sub: "Mapped to locations" },
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

export const ALL_FLAT = flattenTree(LOCATION_TREE);
export const TOTAL_NODES = countNodes(LOCATION_TREE);

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
