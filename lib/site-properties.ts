/**
 * Public-facing property catalog, derived from the admin's single source of truth.
 *
 * The website (home, search, property detail) shows the SAME listings the admin
 * manages (app/admin/_data/catalog), filtered to what the public may see:
 *   - Only Published listings appear (the ones actually available to buy/rent).
 *   - Pending / Draft listings never surface here — they're admin-only.
 * Sold / Rented listings are history and show only on agent profiles, not here.
 *
 * Every figure (locations, category counts, the featured hero) is computed from
 * these live records, so adding/removing a property in the catalog updates every
 * public surface consistently. Keep the mobile mirror
 * (apps/mobile/components/home/data.ts) in sync when the catalog changes.
 */

import { PROPERTIES, LOCATION_DEF, slugify, type PropertyRecord } from "@/app/admin/_data/catalog";

/** The public subset: available (Published) listings only. */
export const PUBLIC_PROPERTIES: PropertyRecord[] = PROPERTIES.filter((p) => p.status === "Published");

export interface SiteProperty {
  id: string; // catalog id, e.g. "CH-3200" (also the /property/[id] route)
  title: string;
  area: string; // district / project
  city: string;
  address: string; // "{area}, {city}"
  deal: "buy" | "rent";
  price: number;
  per?: string; // "/mo" for rentals
  status: string; // "For Sale" | "For Rent"
  featured: boolean;
  type: string; // lowercased: villa | apartment | house | office | land
  beds: number;
  baths: number;
  size: number; // m²
  amenities: string[]; // search-filter tags (deterministic per record)
  cover: string;
  photoCount: number;
  agentId: string; // agent slug, e.g. "lana-aziz"
  agentName: string;
}

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** Deterministic photo count so a listing card always shows the same number. */
export const photoCountFor = (id: string) => 12 + (hash(id) % 20);

/** Upscale the catalog's small (w=240) cover to a card-sized image, same photo. */
const coverFrom = (img: string) => img.replace(/w=\d+/, "w=1000");

/** Search-filter amenity tags, derived deterministically from a record so the
    website/mobile amenity filter stays functional and stable. Land carries none. */
const AMENITY_VOCAB = ["parking", "garden", "pool", "balcony", "elevator", "security", "furnished"] as const;
export function amenityTags(rec: PropertyRecord): string[] {
  const t = rec.type.toLowerCase();
  if (t === "land") return [];
  const seed = hash(rec.id);
  const base = t === "villa" || t === "house" ? ["garden", "parking", "security"] : t === "office" ? ["parking", "elevator", "security"] : ["elevator", "parking"];
  const extra: string[] = [];
  if ((t === "villa" || t === "house") && seed % 2 === 0) extra.push("pool");
  if (seed % 3 === 0) extra.push("balcony");
  if (rec.listing === "rent" && seed % 2 === 1) extra.push("furnished");
  const set = new Set([...base, ...extra]);
  return AMENITY_VOCAB.filter((a) => set.has(a));
}

function toSiteProperty(rec: PropertyRecord): SiteProperty {
  return {
    id: rec.id,
    title: rec.title,
    area: rec.area,
    city: rec.city,
    address: `${rec.area}, ${rec.city}`,
    deal: rec.listing === "rent" ? "rent" : "buy",
    price: rec.price,
    per: rec.per,
    status: rec.listing === "rent" ? "For Rent" : "For Sale",
    featured: rec.featured,
    type: rec.type.toLowerCase(),
    beds: rec.beds,
    baths: rec.baths,
    size: rec.size,
    amenities: amenityTags(rec),
    cover: coverFrom(rec.img),
    photoCount: photoCountFor(rec.id),
    agentId: rec.agent ? slugify(rec.agent.name) : "",
    agentName: rec.agent?.name ?? "",
  };
}

export const SITE_PROPERTIES: SiteProperty[] = PUBLIC_PROPERTIES.map(toSiteProperty);

export function getSiteProperty(id: string): SiteProperty | undefined {
  return SITE_PROPERTIES.find((p) => p.id === id);
}

/** Featured available listings (for the home "Featured properties" grid / hero). */
export const FEATURED_SITE_PROPERTIES: SiteProperty[] = SITE_PROPERTIES.filter((p) => p.featured);

/** Similar available listings — same city first, then same type, excluding self. */
export function similarProperties(id: string, limit = 3): SiteProperty[] {
  const self = getSiteProperty(id);
  if (!self) return SITE_PROPERTIES.slice(0, limit);
  const sameCity = SITE_PROPERTIES.filter((p) => p.id !== id && p.city === self.city);
  const sameType = SITE_PROPERTIES.filter((p) => p.id !== id && p.city !== self.city && p.type === self.type);
  const rest = SITE_PROPERTIES.filter((p) => p.id !== id && p.city !== self.city && p.type !== self.type);
  return [...sameCity, ...sameType, ...rest].slice(0, limit);
}

/* ----------------------------------------------------------------------------
   Location + category counts, rolled up from the public (Published) listings.
   ------------------------------------------------------------------------- */
/** Live count of available listings per city (only cities with the catalog def). */
export function publicCountByCity(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of LOCATION_DEF) counts[c.city] = 0;
  for (const p of PUBLIC_PROPERTIES) counts[p.city] = (counts[p.city] ?? 0) + 1;
  return counts;
}

/** Live count of available listings per property type (Villa/Apartment/...). */
export function publicCountByType(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of PUBLIC_PROPERTIES) counts[p.type] = (counts[p.type] ?? 0) + 1;
  return counts;
}

/** The catalog's cities, in definition order (Erbil, Sulaymaniyah, Duhok). */
export const PUBLIC_CITIES: string[] = LOCATION_DEF.map((c) => c.city);

/** Districts / projects that actually carry an available listing, per city —
    used to build the search Location filter so options match the results. */
export function publicPlacesByCity(): Record<string, { areas: string[]; projects: string[] }> {
  const out: Record<string, { areas: string[]; projects: string[] }> = {};
  for (const c of LOCATION_DEF) {
    const areas = new Set<string>();
    const projects = new Set<string>();
    for (const p of PUBLIC_PROPERTIES) {
      if (p.city !== c.city) continue;
      // A listing's `area` is either a district name or a project within one.
      const district = c.districts.find((d) => d.name === p.area || d.projects.includes(p.area));
      if (!district) continue;
      if (district.projects.includes(p.area)) projects.add(p.area);
      else areas.add(p.area);
    }
    out[c.city] = { areas: [...areas], projects: [...projects] };
  }
  return out;
}

/** Every district / project defined in the admin catalog, per city — regardless
    of whether a listing currently exists there. This drives the search Location
    filter so it mirrors the admin's Locations exactly: every location the admin
    defines is selectable, and adding a location in admin surfaces it here (and on
    every public surface derived from this) automatically. */
export function allPlacesByCity(): Record<string, { areas: string[]; projects: string[] }> {
  const out: Record<string, { areas: string[]; projects: string[] }> = {};
  for (const c of LOCATION_DEF) {
    const areas: string[] = [];
    const projects: string[] = [];
    for (const d of c.districts) {
      areas.push(d.name);
      for (const p of d.projects) projects.push(p);
    }
    out[c.city] = { areas, projects };
  }
  return out;
}
