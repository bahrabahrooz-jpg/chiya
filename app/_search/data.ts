/** Search Results — listings derived from the admin catalog's public subset
    (lib/site-properties) plus the filter/sort configuration. The results are the
    SAME available (Published) listings the admin manages and the homepage shows;
    Pending / Draft / Sold / Rented never appear here. */

import { SITE_PROPERTIES, publicCountByCity, allPlacesByCity, PUBLIC_CITIES, type SiteProperty } from "@/lib/site-properties";
import type { PropertyRecord } from "@/app/admin/_data/catalog";
import type { CurrencyCode, Money } from "@/lib/money";

export interface SrpListing {
  id: string;
  title: string;
  address: string;
  city: string;
  deal: "buy" | "rent";
  /** The listing's real price in its own currency. Cards render THIS. Sorting
      and range filtering normalise it via normaliseFor() and never show that. */
  price: Money;
  status: string;
  featured?: boolean;
  type: string;
  beds?: number;
  baths?: number;
  area: number;
  photoCount: number;
  pstatus: string;
  amenities: string[];
  cover: string;
}

const toSrp = (p: SiteProperty): SrpListing => ({
  id: p.id,
  title: p.title,
  address: p.address,
  city: p.city,
  deal: p.deal,
  price: p.price,
  status: p.status,
  featured: p.featured,
  type: p.type,
  // Land / office carry no bedrooms; drop the field so the card hides it.
  beds: p.type === "land" || p.beds === 0 ? undefined : p.beds,
  baths: p.type === "land" || p.baths === 0 ? undefined : p.baths,
  area: p.size,
  photoCount: p.photoCount,
  pstatus: "ready", // every published listing is available/ready to move
  amenities: p.amenities,
  cover: p.cover,
});

/** Search listings from a live SiteProperty set (or the seed by default). */
export const srpListings = (sites: SiteProperty[] = SITE_PROPERTIES): SrpListing[] => sites.map(toSrp);
export const listings: SrpListing[] = srpListings();

export interface Opt {
  value: string;
  label: string;
  icon?: string;
}

export const propertyTypes: Opt[] = [
  { value: "apartment", label: "Apartment", icon: "building-2" },
  { value: "house", label: "House", icon: "house" },
  { value: "land", label: "Land", icon: "trees" },
  { value: "office", label: "Office", icon: "briefcase" },
  { value: "villa", label: "Villa", icon: "home" },
];
/* ----------------------------------------------------------------------------
   Price buckets — per currency, and NOT converted between them.

   These used to be nine translated strings per language with "$150K" written
   into them, Kurdish Arabic-Indic digits included. That made the dollar a fact
   of the translation: a member browsing in dinars saw dollar buckets in Kurdish
   with no way to correct it. The labels are now GENERATED at render time from
   these boundaries via formatMoney, so the dictionaries hold sentence shapes
   ("Up to {max}") and no figures at all.

   The dinar ladders are chosen, not converted. $150,000 at 1,310 is
   196,500,000 — a number no seller would ever quote and no buyer would pick off
   a list. Each currency gets boundaries that are round IN THAT CURRENCY, landing
   near enough to their dollar counterparts that the two ladders describe the
   same market while each reads as deliberate.

   Boundaries are WHOLE units; the filter converts them to Money for both the
   label and the comparison.
   ------------------------------------------------------------------------- */
export interface Bucket {
  /** Range key, also the URL value: "150000-400000", "1000000-" (open top). */
  value: string;
  lo: number | null;
  hi: number | null;
}

const bucketsFrom = (edges: number[]): Bucket[] => [
  { value: `0-${edges[0]}`, lo: 0, hi: edges[0] },
  ...edges.slice(0, -1).map((lo, i) => ({ value: `${lo}-${edges[i + 1]}`, lo, hi: edges[i + 1] })),
  { value: `${edges[edges.length - 1]}-`, lo: edges[edges.length - 1], hi: null },
];

/** Sale buckets. USD: 150K/400K/600K/1M. IQD: 200M/500M/800M/1.3B. */
export const buyPresets: Record<CurrencyCode, Bucket[]> = {
  USD: bucketsFrom([150_000, 400_000, 600_000, 1_000_000]),
  IQD: bucketsFrom([200_000_000, 500_000_000, 800_000_000, 1_300_000_000]),
};

/** Monthly-rent buckets. USD: 1K/2.5K/5K. IQD: 1.5M/3.5M/7M. */
export const rentPresets: Record<CurrencyCode, Bucket[]> = {
  USD: bucketsFrom([1_000, 2_500, 5_000]),
  IQD: bucketsFrom([1_500_000, 3_500_000, 7_000_000]),
};

/** The bucket ladder for a deal type in a currency — the one lookup callers use. */
export const presetsFor = (deal: "buy" | "rent", cur: CurrencyCode): Bucket[] =>
  (deal === "rent" ? rentPresets : buyPresets)[cur];
/* Size keeps ONE ladder and its own translated labels (preset.size.*): m² is
   not a currency, and 100 m² is 100 m² in every language and every market. */
export const sizePresets: Bucket[] = bucketsFrom([100, 200, 300, 500]);
export const beds: Opt[] = [
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];
export const baths: Opt[] = [
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];
export const amenities: Opt[] = [
  { value: "parking", label: "Parking", icon: "square-parking" },
  { value: "garden", label: "Garden", icon: "trees" },
  { value: "pool", label: "Pool", icon: "waves" },
  { value: "balcony", label: "Balcony", icon: "sun" },
  { value: "elevator", label: "Elevator", icon: "chevrons-up" },
  { value: "security", label: "Security", icon: "shield-check" },
  { value: "furnished", label: "Furnished", icon: "sofa" },
];
/** Listings shown per page in the grid pager. */
export const PAGE_SIZE = 9;

export const sortOptions: Opt[] = [
  { value: "default", label: "Default" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "recommended", label: "Featured" },
];

/** Available-listing counts per city, from the live catalog (drives the SRP
    baseline "N results in {city}" figure). */
/** "N results in {city}" baseline. Pass live public records to reflect admin
    edits; defaults to the seed. */
export const srpBaseCount = (records?: PropertyRecord[]): Record<string, number> => publicCountByCity(records);
export const BASE_COUNT: Record<string, number> = srpBaseCount();

/* ── Location filter (City / Area / Project) — built from the admin catalog's
   Locations, so the filter mirrors the admin definitions exactly: every city,
   district, and project defined in admin is selectable here, and adding one in
   admin surfaces it automatically. Option `value`s are exact substrings of the
   listing addresses ("{area}, {city}") so `address.includes(value)` matches. */
export const searchCities = PUBLIC_CITIES;
export const cityOpts: Opt[] = searchCities.map((c) => ({ value: c, label: c }));

const PLACES = allPlacesByCity();
const toOpts = (names: string[]): Opt[] => names.map((n) => ({ value: n, label: n }));

/** Districts per city (only those with an available listing). */
export const areasByCity: Record<string, Opt[]> = Object.fromEntries(
  searchCities.map((c) => [c, toOpts(PLACES[c]?.areas ?? [])]),
);

/** Named communities / developments per city (only those with a listing). */
export const projectsByCity: Record<string, Opt[]> = Object.fromEntries(
  searchCities.map((c) => [c, toOpts(PLACES[c]?.projects ?? [])]),
);

const flattenByCity = (byCity: Record<string, Opt[]>, cities: string[]): Opt[] => {
  const keys = cities.length ? cities.filter((c) => byCity[c]) : Object.keys(byCity);
  return keys.flatMap((c) => byCity[c] ?? []);
};

/** Area options scoped to the selected cities (all cities when none selected). */
export const areaOptions = (cities: string[]): Opt[] => flattenByCity(areasByCity, cities);
/** Project options scoped to the selected cities (all cities when none selected). */
export const projectOptions = (cities: string[]): Opt[] => flattenByCity(projectsByCity, cities);
