/** Search Results — listings derived from the admin catalog's public subset
    (lib/site-properties) plus the filter/sort configuration. The results are the
    SAME available (Published) listings the admin manages and the homepage shows;
    Pending / Draft / Sold / Rented never appear here. */

import { SITE_PROPERTIES, publicCountByCity, allPlacesByCity, PUBLIC_CITIES, type SiteProperty } from "@/lib/site-properties";

export interface SrpListing {
  id: string;
  title: string;
  address: string;
  city: string;
  deal: "buy" | "rent";
  price: number;
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

export const listings: SrpListing[] = SITE_PROPERTIES.map(toSrp);

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
export const buyPresets: Opt[] = [
  { value: "0-150000", label: "Up to $150K" },
  { value: "150000-400000", label: "$150K – $400K" },
  { value: "300000-600000", label: "$300K – $600K" },
  { value: "600000-1000000", label: "$600K – $1M" },
  { value: "1000000-", label: "$1M and above" },
];
export const rentPresets: Opt[] = [
  { value: "0-1000", label: "Up to $1,000/mo" },
  { value: "1000-2500", label: "$1,000 – $2,500/mo" },
  { value: "2500-5000", label: "$2,500 – $5,000/mo" },
  { value: "5000-", label: "$5,000/mo and above" },
];
export const sizePresets: Opt[] = [
  { value: "0-100", label: "Up to 100 m²" },
  { value: "100-200", label: "100 – 200 m²" },
  { value: "200-300", label: "200 – 300 m²" },
  { value: "300-500", label: "300 – 500 m²" },
  { value: "500-", label: "500 m² and above" },
];
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
export const BASE_COUNT: Record<string, number> = publicCountByCity();

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
