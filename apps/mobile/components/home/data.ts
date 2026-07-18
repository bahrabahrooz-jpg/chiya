import {
  LayoutGrid,
  Tag,
  Key,
  House,
  Building2,
  Home,
  Trees,
  Briefcase,
  SquareParking,
  Waves,
  Sun,
  ChevronsUp,
  ShieldCheck,
  Cpu,
  Dumbbell,
  ThermometerSun,
  Cctv,
  Zap,
  Wifi,
  Flame,
  Droplets,
  type LucideIcon,
} from "lucide-react-native";
import { getActiveLocale } from "@/lib/locale-state";

/** Demo signed-in member (no auth backend yet). */
export const user = {
  name: "Bahra",
  fullName: "Bahra Bahroz",
  location: "Erbil, Kurdistan",
};

export interface Opt {
  value: string;
  label: string;
  /** Arabic label; falls back to `label` when absent. */
  ar?: string;
  /** Kurdish label; falls back to `label` when absent. */
  ku?: string;
  Icon?: LucideIcon;
  /** Optional group header label; rendered above the first option of each group
   *  in multi-select sheets (hidden while searching). */
  group?: string;
}

/** Locale-aware label for an option (Arabic/Kurdish when that locale is active). */
export const optLabel = (o: Opt): string => {
  const loc = getActiveLocale();
  if (loc === "ar") return o.ar ?? o.label;
  if (loc === "ku") return o.ku ?? o.label;
  return o.label;
};

/** Quick deal/category chips shown under the search bar. */
export const dealCategories: Opt[] = [
  { value: "all", label: "All", ar: "الكل", Icon: LayoutGrid },
  { value: "buy", label: "For Sale", ar: "للبيع", Icon: Tag },
  { value: "rent", label: "For Rent", ar: "للإيجار", Icon: Key },
];

/** Filter options — ported from the website search (app/_search/data.ts). */
export const propertyTypes: Opt[] = [
  { value: "apartment", label: "Apartment", ar: "شقة", Icon: Building2 },
  { value: "house", label: "House", ar: "منزل", Icon: Home },
  { value: "land", label: "Land", ar: "أرض", Icon: Trees },
  { value: "office", label: "Office", ar: "مكتب", Icon: Briefcase },
  { value: "villa", label: "Villa", ar: "فيلا", Icon: House },
];

export const buyPresets: Opt[] = [
  { value: "0-150000", label: "Up to $150K", ar: "حتى 150 ألف $" },
  { value: "150000-400000", label: "$150K – $400K", ar: "150 – 400 ألف $" },
  { value: "300000-600000", label: "$300K – $600K", ar: "300 – 600 ألف $" },
  { value: "600000-1000000", label: "$600K – $1M", ar: "600 ألف – مليون $" },
  { value: "1000000-", label: "$1M and above", ar: "مليون $ فأكثر" },
];

export const rentPresets: Opt[] = [
  { value: "0-1000", label: "Up to $1,000/mo", ar: "حتى 1,000 $/شهر" },
  { value: "1000-2500", label: "$1,000 – $2,500/mo", ar: "1,000 – 2,500 $/شهر" },
  { value: "2500-5000", label: "$2,500 – $5,000/mo", ar: "2,500 – 5,000 $/شهر" },
  { value: "5000-", label: "$5,000/mo and above", ar: "5,000 $/شهر فأكثر" },
];

export const beds: Opt[] = [
  { value: "", label: "Any", ar: "أي" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

export const baths: Opt[] = [
  { value: "", label: "Any", ar: "أي" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

// Canonical amenity vocabulary — mirrors the web catalog's AMENITY_POOL
// (app/admin/_property-detail/data.ts) so the website, admin and mobile
// property-detail screens describe amenities identically in all three languages.
export const amenities: Opt[] = [
  { value: "pool", label: "Swimming pool", ar: "مسبح", ku: "مەلەوانگە", Icon: Waves },
  { value: "garden", label: "Private garden", ar: "حديقة خاصة", ku: "باخچەی تایبەت", Icon: Trees },
  { value: "security", label: "24/7 gated security", ar: "أمن مسوَّر على مدار الساعة", ku: "ئاسایشی دیواردراو ٢٤/٧", Icon: ShieldCheck },
  { value: "terraces", label: "Terraces & balconies", ar: "تراسات وشرفات", ku: "تەراس و بەلکۆن", Icon: Sun },
  { value: "elevator", label: "Elevator", ar: "مصعد", ku: "ئاسانسۆر", Icon: ChevronsUp },
  { value: "smartHome", label: "Smart-home system", ar: "نظام منزل ذكي", ku: "سیستەمی ماڵی زیرەک", Icon: Cpu },
  { value: "gym", label: "Home gym", ar: "صالة رياضية منزلية", ku: "هۆڵی وەرزشی ماڵەوە", Icon: Dumbbell },
  { value: "hvac", label: "Central heating & cooling", ar: "تدفئة وتبريد مركزي", ku: "گەرمکەرەوە و فێنککەرەوەی ناوەندی", Icon: ThermometerSun },
  { value: "parking", label: "Covered parking", ar: "موقف مغطى", ku: "پارکینگی داپۆشراو", Icon: SquareParking },
  { value: "cctv", label: "CCTV surveillance", ar: "مراقبة بالكاميرات", ku: "چاودێری کامێرا", Icon: Cctv },
  { value: "generator", label: "Backup generator", ar: "مولّد احتياطي", ku: "مۆلیدەی یەدەگ", Icon: Zap },
  { value: "internet", label: "High-speed internet", ar: "إنترنت عالي السرعة", ku: "ئینتەرنێتی خێرا", Icon: Wifi },
  { value: "fireplace", label: "Fireplace", ar: "مدفأة", ku: "ئاگردان", Icon: Flame },
  { value: "water", label: "Water tank & filtration", ar: "خزان مياه وترشيح", ku: "تانکی ئاو و پاڵاوتن", Icon: Droplets },
];

/** Cities available in the listings (for the Location filter). */
export const searchCities = ["Erbil", "Sulaymaniyah", "Duhok"];

/** Locale-aware display names for cities and agent languages (values stay English). */
const CITY_AR: Record<string, string> = { Erbil: "أربيل", Sulaymaniyah: "السليمانية", Duhok: "دهوك" };
export const cityLabel = (c: string): string => (getActiveLocale() === "ar" ? CITY_AR[c] ?? c : c);

/** City options for the searchable Location picker. */
export const cityOpts: Opt[] = searchCities.map((c) => ({ value: c, label: c, ar: CITY_AR[c] }));

/** Areas / districts per city — mirrors the admin catalog's Locations
    (app/admin/_data/catalog LOCATION_DEF), so every district defined in admin is
    selectable here. Keep in sync when admin locations change. */
export const areasByCity: Record<string, Opt[]> = {
  Erbil: [
    { value: "100 Meter", label: "100 Meter", ar: "شارع 100 متر" },
    { value: "Gulan", label: "Gulan", ar: "كولان" },
    { value: "Ankawa", label: "Ankawa", ar: "عنكاوا" },
    { value: "Italian Village", label: "Italian Village", ar: "القرية الإيطالية" },
    { value: "English Village", label: "English Village", ar: "القرية الإنجليزية" },
  ],
  Sulaymaniyah: [
    { value: "Raparin", label: "Raparin", ar: "رابرين" },
    { value: "Salim Street", label: "Salim Street", ar: "شارع سالم" },
    { value: "Bakhtiari", label: "Bakhtiari", ar: "بختياري" },
    { value: "Sarchnar", label: "Sarchnar", ar: "سرجنار" },
  ],
  Duhok: [
    { value: "Malta", label: "Malta", ar: "مالطا" },
    { value: "Masike", label: "Masike", ar: "ماسيكه" },
    { value: "Nizarke", label: "Nizarke", ar: "نزاركي" },
  ],
};

/** Projects / communities per city — mirrors the admin catalog's Locations. */
export const projectsByCity: Record<string, Opt[]> = {
  Erbil: [
    { value: "Empire World", label: "Empire World", ar: "إمباير وورلد" },
    { value: "Dream City", label: "Dream City", ar: "دريم سيتي" },
    { value: "Naz City", label: "Naz City", ar: "ناز سيتي" },
  ],
  Sulaymaniyah: [],
  Duhok: [],
};

const flatten = (byCity: Record<string, Opt[]>, cities: string[]): Opt[] => {
  const keys = cities.length ? cities.filter((c) => byCity[c]) : Object.keys(byCity);
  return keys.flatMap((c) => byCity[c]);
};

/** Area options scoped to the selected cities (all cities when none selected). */
export const areaOptions = (cities: string[]): Opt[] => flatten(areasByCity, cities);
/** Project options scoped to the selected cities (all cities when none selected). */
export const projectOptions = (cities: string[]): Opt[] => flatten(projectsByCity, cities);

/** Flat lists for label lookups (active-filter chips). */
export const allAreas: Opt[] = areaOptions([]);
export const allProjects: Opt[] = projectOptions([]);

const LANG_AR: Record<string, string> = {
  Kurdish: "الكردية",
  Arabic: "العربية",
  English: "الإنجليزية",
  Turkish: "التركية",
  Persian: "الفارسية",
};
export const agentLanguageLabel = (l: string): string => (getActiveLocale() === "ar" ? LANG_AR[l] ?? l : l);

/** Active search filters (mirrors the website's SRP filter shape). */
/** Approx. exchange rate for the price filter's dinar option. */
export const IQD_PER_USD = 1310;
export const SQFT_PER_SQM = 10.7639;
export interface PriceFilter {
  min: number;
  max: number;
  currency: "USD" | "IQD";
}
export interface SizeFilter {
  min: number;
  max: number;
  unit: "sqm" | "sqft";
}

export interface Filters {
  types: string[];
  price: PriceFilter | null;
  size: SizeFilter | null;
  beds: string;
  baths: string;
  amenities: string[];
  cities: string[];
  areas: string[];
  projects: string[];
}

export const emptyFilters: Filters = {
  types: [],
  price: null,
  size: null,
  beds: "",
  baths: "",
  amenities: [],
  cities: [],
  areas: [],
  projects: [],
};

export const countFilters = (f: Filters): number =>
  f.types.length +
  (f.price ? 1 : 0) +
  (f.size ? 1 : 0) +
  (f.beds ? 1 : 0) +
  (f.baths ? 1 : 0) +
  f.amenities.length +
  f.cities.length +
  f.areas.length +
  f.projects.length;

/** Listings — mirrored from the admin catalog's public subset
 *  (app/admin/_data/catalog.ts → the 10 Published listings). Same id / title /
 *  address / price / agent the admin manages and the website shows; Pending /
 *  Draft / Sold / Rented never appear here. Keep in sync when the catalog changes. */
const img = (id: string, w = 800, h = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

export interface Listing {
  id: string;
  title: string;
  address: string;
  city: string;
  deal: "buy" | "rent";
  price: number;
  type: string;
  beds?: number;
  baths?: number;
  area: number;
  status: string;
  featured?: boolean;
  amenities: string[];
  cover: string;
  /** Slug of the assigned agent (matches agents[].id) — same assignment as admin. */
  agentId: string;
  /* Canonical property features (mirror the Add-property wizard's fields).
     Stored as the raw English enum values; land listings omit the ones that
     don't apply. Each is optional so the detail grid shows only what's set. */
  furnishing?: string; // "Unfurnished" | "Semi-furnished" | "Fully furnished"
  parking?: number; // covered spaces
  floor?: number; // apartments/offices only
  year?: number; // year built
  orientation?: string; // "North facing" | "South facing" | "East facing" | "West facing"
  condition?: string; // "New" | "Good" | "Needs renovation"
}

export const listings: Listing[] = [
  { id: "CH-3200", title: "Marble Hill Villa", address: "Empire World, Erbil", city: "Erbil", deal: "buy", price: 850000, type: "villa", beds: 5, baths: 4, area: 480, status: "For Sale", featured: true, amenities: ["pool", "garden", "security", "terraces", "parking", "smartHome", "gym", "hvac", "cctv"], cover: img("1613490493576-7fde63acd811"), agentId: "lana-aziz", furnishing: "Fully furnished", parking: 2, year: 2019, orientation: "South facing", condition: "New" },
  { id: "CH-3199", title: "Dream City Garden Flat", address: "Dream City, Erbil", city: "Erbil", deal: "rent", price: 1400, type: "apartment", beds: 2, baths: 2, area: 130, status: "For Rent", featured: true, amenities: ["terraces", "elevator", "parking", "security", "internet", "hvac", "cctv"], cover: img("1502672260266-1c1ef2d93688"), agentId: "lana-aziz", furnishing: "Fully furnished", parking: 1, floor: 4, year: 2020, orientation: "East facing", condition: "Good" },
  { id: "CH-3198", title: "Naz City Sky Suite", address: "Naz City, Erbil", city: "Erbil", deal: "buy", price: 690000, type: "apartment", beds: 3, baths: 3, area: 300, status: "For Sale", amenities: ["terraces", "elevator", "parking", "security", "smartHome", "internet", "hvac"], cover: img("1545324418-cc1a3fa10c00"), agentId: "lana-aziz", furnishing: "Semi-furnished", parking: 1, floor: 8, year: 2018, orientation: "North facing", condition: "New" },
  { id: "CH-3197", title: "English Village Court", address: "English Village, Erbil", city: "Erbil", deal: "buy", price: 420000, type: "house", beds: 4, baths: 3, area: 260, status: "For Sale", amenities: ["garden", "parking", "security", "terraces", "fireplace", "hvac", "cctv"], cover: img("1576941089067-2de3c901e126"), agentId: "karwan-mahmoud", furnishing: "Unfurnished", parking: 2, year: 2016, orientation: "West facing", condition: "Good" },
  { id: "CH-3196", title: "Gulan Business Suite", address: "Gulan, Erbil", city: "Erbil", deal: "rent", price: 2800, type: "office", baths: 1, area: 210, status: "For Rent", amenities: ["parking", "elevator", "security", "internet", "hvac", "cctv"], cover: img("1497366754035-f200968a6e72"), agentId: "karwan-mahmoud", furnishing: "Unfurnished", parking: 3, floor: 5, year: 2021, orientation: "South facing", condition: "New" },
  { id: "CH-3195", title: "Ankawa Olive Grove Land", address: "Ankawa, Erbil", city: "Erbil", deal: "buy", price: 320000, type: "land", area: 1200, status: "For Sale", amenities: [], cover: img("1500382017468-9049fed747ef"), agentId: "lana-aziz", orientation: "West facing" },
  { id: "CH-3194", title: "Cedar Court Apartments", address: "Salim Street, Sulaymaniyah", city: "Sulaymaniyah", deal: "buy", price: 210000, type: "apartment", beds: 3, baths: 2, area: 150, status: "For Sale", featured: true, amenities: ["elevator", "parking", "terraces", "security", "internet", "hvac", "water"], cover: img("1493809842364-78817add7ffb"), agentId: "sara-hama", furnishing: "Semi-furnished", parking: 1, floor: 3, year: 2015, orientation: "East facing", condition: "Good" },
  { id: "CH-3193", title: "Sarchnar Hillside Villa", address: "Sarchnar, Sulaymaniyah", city: "Sulaymaniyah", deal: "rent", price: 2200, type: "villa", beds: 4, baths: 3, area: 380, status: "For Rent", amenities: ["garden", "parking", "security", "pool", "terraces", "gym", "hvac", "generator", "cctv"], cover: img("1599809275671-b5942cabc7a2"), agentId: "sara-hama", furnishing: "Fully furnished", parking: 2, year: 2017, orientation: "North facing", condition: "Good" },
  { id: "CH-3192", title: "Masike Highland Villa", address: "Masike, Duhok", city: "Duhok", deal: "buy", price: 380000, type: "villa", beds: 4, baths: 3, area: 340, status: "For Sale", amenities: ["pool", "garden", "parking", "security", "terraces", "smartHome", "hvac", "generator", "fireplace"], cover: img("1512917774080-9991f1c4c750"), agentId: "rawa-jamal", furnishing: "Semi-furnished", parking: 2, year: 2019, orientation: "West facing", condition: "New" },
  { id: "CH-3191", title: "Malta Riverside Loft", address: "Malta, Duhok", city: "Duhok", deal: "rent", price: 900, type: "apartment", beds: 1, baths: 1, area: 95, status: "For Rent", amenities: ["elevator", "parking", "internet", "security", "water"], cover: img("1560448204-e02f11c3d0e2"), agentId: "rawa-jamal", furnishing: "Unfurnished", parking: 1, floor: 6, year: 2014, orientation: "South facing", condition: "Good" },
];

/** Featured feed for the Home "Featured Properties" carousel. */
export const recommended = listings.filter((l) => l.featured);

/** Newest-first feed for the Home "Recently Added" carousel. */
export const recentlyAdded = [...listings].reverse().slice(0, 10);

const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const perMonth = () => (getActiveLocale() === "ar" ? "/شهر" : "/mo");
export const priceLabel = (l: Listing) => (l.deal === "rent" ? `$${commas(l.price)}${perMonth()}` : `$${commas(l.price)}`);

/** Sort options for the search results. "" = Default (the app's natural order). */
export const searchSort: Opt[] = [
  { value: "", label: "Default", ar: "افتراضي" },
  { value: "newest", label: "Newest", ar: "الأحدث" },
  { value: "price-asc", label: "Price: Low → High", ar: "السعر: من الأقل للأعلى" },
  { value: "price-desc", label: "Price: High → Low", ar: "السعر: من الأعلى للأقل" },
  { value: "featured", label: "Featured", ar: "المميزة" },
];

/** Compact labels for the Sort pill button (shorter than the sheet labels). */
const SORT_SHORT: Record<string, { en: string; ar: string }> = {
  newest: { en: "Newest", ar: "الأحدث" },
  "price-asc": { en: "Price ↑", ar: "السعر ↑" },
  "price-desc": { en: "Price ↓", ar: "السعر ↓" },
  featured: { en: "Featured", ar: "المميزة" },
};
/** Localized short label for a non-default sort (empty string for Default). */
export const sortShortLabel = (value: string): string => {
  const s = SORT_SHORT[value];
  return s ? (getActiveLocale() === "ar" ? s.ar : s.en) : "";
};

/** Full search + filter + sort over the listings (mirrors the website SRP logic). */
export function searchListings(opts: { query: string; deal: string; filters: Filters; sort: string }): Listing[] {
  const { query, deal, filters, sort } = opts;
  const q = query.trim().toLowerCase();
  const list = listings.filter((l) => {
    if (deal === "buy" && l.deal !== "buy") return false;
    if (deal === "rent" && l.deal !== "rent") return false;
    if (q && !`${l.title} ${l.address} ${l.city} ${l.type}`.toLowerCase().includes(q)) return false;
    if (filters.cities.length && !filters.cities.includes(l.city)) return false;
    const addr = l.address.toLowerCase();
    if (filters.areas.length && !filters.areas.some((a) => addr.includes(a.toLowerCase()))) return false;
    if (filters.projects.length && !filters.projects.some((p) => addr.includes(p.toLowerCase()))) return false;
    if (filters.types.length && !filters.types.includes(l.type)) return false;
    if (filters.price) {
      const rate = filters.price.currency === "IQD" ? IQD_PER_USD : 1;
      if (l.price < filters.price.min / rate || l.price > filters.price.max / rate) return false;
    }
    if (filters.size) {
      const factor = filters.size.unit === "sqft" ? SQFT_PER_SQM : 1;
      if (l.area < filters.size.min / factor || l.area > filters.size.max / factor) return false;
    }
    if (filters.beds && (l.beds ?? 0) < Number(filters.beds)) return false;
    if (filters.baths && (l.baths ?? 0) < Number(filters.baths)) return false;
    if (filters.amenities.length && !filters.amenities.every((a) => l.amenities.includes(a))) return false;
    return true;
  });
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "newest") { /* keep source order (newest-first demo data) */ }
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); // "featured" and "" default
  return list;
}

/** Locale-aware label lookup for an option list (used by the active-filter chips). */
export const labelFor = (opts: Opt[], value: string) => {
  const o = opts.find((x) => x.value === value);
  return o ? optLabel(o) : value;
};

export const getListing = (id: string) => listings.find((l) => l.id === id);

/** Sort suggestions: names starting with the query first, then alphabetically. */
function sortSuggestions(values: string[], q: string): string[] {
  return values.sort((a, b) => {
    const ap = a.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.toLowerCase().startsWith(q) ? 0 : 1;
    return ap - bp || a.localeCompare(b);
  });
}

/** Location suggestions (cities + listing areas) matching a query, for the search field. */
export function suggestPlaces(query: string, limit = 6): string[] {
  const s = query.trim().toLowerCase();
  if (!s) return [];
  const set = new Set<string>();
  for (const c of searchCities) if (c.toLowerCase().includes(s)) set.add(c);
  for (const l of listings) if (l.address.toLowerCase().includes(s)) set.add(l.address);
  return sortSuggestions(Array.from(set), s).slice(0, limit);
}

/** Extra interior shots reused across detail galleries (ported from the web PDP). */
const galleryPool = [
  img("1600596542815-ffad4c1539a9"),
  img("1600607687939-ce8a6c25118c"),
  img("1600566753086-00f18fb6b3ea"),
  img("1556912173-3bb406ef7e77"),
  img("1505693416388-ac5ce068fe85"),
  img("1584622650111-993a426fbf0a"),
];
export const galleryFor = (l: Listing) => [l.cover, ...galleryPool];

/** City centres in the Kurdistan region, for the property-detail map. */
const cityGeo: Record<string, { lat: number; lng: number }> = {
  Erbil: { lat: 36.1911, lng: 43.993 },
  Sulaymaniyah: { lat: 35.5556, lng: 45.4329 },
  Duhok: { lat: 36.8669, lng: 42.9503 },
};
/** Deterministic coordinates for a listing (city centre + a small per-listing offset). */
export function listingCoords(l: Listing): { lat: number; lng: number } {
  const base = cityGeo[l.city] ?? { lat: 36.2, lng: 44.1 };
  const h = [...l.id].reduce((s, c) => s + c.charCodeAt(0), 0);
  return { lat: base.lat + ((h % 20) - 10) / 500, lng: base.lng + (((h * 7) % 20) - 10) / 500 };
}

/** Popular locations — city counts mirror the admin catalog's available listings. */
export interface Location {
  id: string;
  name: string;
  count: string;
  subtitle: string;
  cover: string;
  /** Arabic display fields; fall back to the English ones when absent. */
  nameAr?: string;
  countAr?: string;
  subtitleAr?: string;
}

export const locations: Location[] = [
  { id: "erbil", name: "Erbil, Kurdistan", nameAr: "أربيل، كردستان", count: "6 Properties", countAr: "6 عقارات", subtitle: "Villas, Apartments, Family Homes", subtitleAr: "فلل، شقق، منازل عائلية", cover: img("1613490493576-7fde63acd811", 240, 240) },
  { id: "sulaymaniyah", name: "Sulaymaniyah", nameAr: "السليمانية", count: "2 Properties", countAr: "عقاران", subtitle: "Apartments, Townhouses, Villas", subtitleAr: "شقق، منازل متلاصقة، فلل", cover: img("1600607687939-ce8a6c25118c", 240, 240) },
  { id: "duhok", name: "Duhok", nameAr: "دهوك", count: "2 Properties", countAr: "عقاران", subtitle: "Houses, Villas, Land", subtitleAr: "منازل، فلل، أراضٍ", cover: img("1600585154340-be6161a56a0c", 240, 240) },
];

/** Locale-aware display fields for a popular location. */
export function locationDisplay(l: Location): { name: string; count: string; subtitle: string } {
  if (getActiveLocale() !== "ar") return l;
  return { name: l.nameAr ?? l.name, count: l.countAr ?? l.count, subtitle: l.subtitleAr ?? l.subtitle };
}

/** Featured agents — mirrored from the admin catalog.
 *  `fit=facearea&facepad=3` frames the crop around the face with generous padding
 *  (head and shoulders, not a zoomed-in face) — the standard headshot framing. */
const portrait = (id: string) => `https://images.unsplash.com/photo-${id}?w=480&h=480&fit=facearea&facepad=3`;

/** Landscape variant for the agent card banner — `crop=faces` keeps the face in
 *  frame while taking the widest possible region at the target aspect, so the
 *  banner reads as a half-body shot rather than a face close-up. */
export function agentBannerPhoto(photo: string): string {
  if (!photo.includes("images.unsplash.com")) return photo;
  return photo.replace(/\?.*$/, "?w=900&h=450&fit=crop&crop=faces");
}

export interface Agent {
  id: string;
  name: string;
  city: string;
  photo: string; // "" → initials avatar
  verified: boolean;
  /** Active (in good standing) vs suspended — only Active+verified agents are assignable. */
  active: boolean;
  rating: number; // mean of approved reviews (0 when none)
  reviews: number;
  listings: number;
  sold: number;
  languages: string[];
  /** Years of experience. */
  experience: number;
}

/* Mirrored from app/admin/_data/catalog.ts + _reviews/data.ts — the five VERIFIED
   agents the admin manages, so the app, website, and admin show one roster. Pending
   agents (Bilal Noori, Hana Rashid) are admin-only and never appear publicly. Every
   figure is derived from the admin records (approved reviews, assigned properties);
   keep in sync when the catalog changes. Diyar is verified but suspended (active:
   false) — listed in the directory, excluded from featured. */
export const agents: Agent[] = [
  { id: "lana-aziz", name: "Lana Aziz", city: "Erbil", photo: portrait("1494790108377-be9c29b29330"), verified: true, active: true, rating: 4.7, reviews: 3, listings: 4, sold: 3, languages: ["Kurdish", "English", "Arabic"], experience: 9 },
  { id: "karwan-mahmoud", name: "Karwan Mahmoud", city: "Erbil", photo: portrait("1507003211169-0a1dd7228f2d"), verified: true, active: true, rating: 4.5, reviews: 2, listings: 2, sold: 1, languages: ["Kurdish", "English"], experience: 7 },
  { id: "sara-hama", name: "Sara Hama", city: "Sulaymaniyah", photo: portrait("1544005313-94ddf0286df2"), verified: true, active: true, rating: 5.0, reviews: 2, listings: 2, sold: 2, languages: ["Kurdish", "Arabic"], experience: 6 },
  { id: "rawa-jamal", name: "Rawa Jamal", city: "Duhok", photo: portrait("1633332755192-727a05c4013d"), verified: true, active: true, rating: 3.5, reviews: 2, listings: 2, sold: 2, languages: ["Kurdish", "English"], experience: 5 },
  { id: "diyar-salih", name: "Diyar Salih", city: "Erbil", photo: portrait("1500648767791-00dcc994a43e"), verified: true, active: false, rating: 4.0, reviews: 1, listings: 0, sold: 0, languages: ["Kurdish", "Arabic"], experience: 8 },
];

/* Featured on the home tab — verified agents in good standing. */
export const featuredAgents: Agent[] = agents.filter((a) => a.verified && a.active);
export const agentCities = ["Erbil", "Sulaymaniyah", "Duhok"];
export const agentLanguages = ["Kurdish", "Arabic", "English", "Turkish", "Persian"];

/** Language options for the searchable agent Language picker. */
export const agentLanguageOpts: Opt[] = agentLanguages.map((l) => ({ value: l, label: l, ar: LANG_AR[l] }));
export const agentExperience: Opt[] = [
  { value: "0-5", label: "Under 5 years", ar: "أقل من 5 سنوات" },
  { value: "5-10", label: "5–10 years", ar: "5–10 سنوات" },
  { value: "10-15", label: "10–15 years", ar: "10–15 سنة" },
  { value: "15+", label: "15+ years", ar: "أكثر من 15 سنة" },
];
/** Agent sort options. "" = Default (the app's natural order). */
export const agentSort: Opt[] = [
  { value: "", label: "Default", ar: "افتراضي" },
  { value: "rating", label: "Highest ratings", ar: "الأعلى تقييمًا" },
  { value: "experience", label: "Most experience", ar: "الأكثر خبرة" },
  { value: "listings", label: "Most listings", ar: "الأكثر إعلانات" },
];

/** Compact labels for the agent Sort pill button. */
const AGENT_SORT_SHORT: Record<string, { en: string; ar: string }> = {
  rating: { en: "Top rated", ar: "الأعلى تقييمًا" },
  experience: { en: "Experience", ar: "الخبرة" },
  listings: { en: "Listings", ar: "الإعلانات" },
};
/** Localized short label for a non-default agent sort (empty for Default). */
export const agentSortShortLabel = (value: string): string => {
  const s = AGENT_SORT_SHORT[value];
  return s ? (getActiveLocale() === "ar" ? s.ar : s.en) : "";
};

export interface AgentFilters {
  cities: string[];
  languages: string[];
  experience: string;
}
export const emptyAgentFilters: AgentFilters = { cities: [], languages: [], experience: "" };
export const countAgentFilters = (f: AgentFilters) =>
  f.cities.length + f.languages.length + (f.experience ? 1 : 0);

const experienceMatch = (years: number, range: string) => {
  if (range === "0-5") return years < 5;
  if (range === "5-10") return years >= 5 && years < 10;
  if (range === "10-15") return years >= 10 && years < 15;
  if (range === "15+") return years >= 15;
  return true;
};

/** Filter + sort agents by query, filters (city/language/experience), and sort. */
export function filterAgents({ query, filters, sort }: { query: string; filters: AgentFilters; sort: string }): Agent[] {
  const q = query.trim().toLowerCase();
  const list = agents.filter((a) => {
    if (filters.cities.length && !filters.cities.includes(a.city)) return false;
    if (filters.languages.length && !filters.languages.some((l) => a.languages.includes(l))) return false;
    if (filters.experience && !experienceMatch(a.experience, filters.experience)) return false;
    if (q && !`${a.name} ${a.city}`.toLowerCase().includes(q)) return false;
    return true;
  });
  if (sort === "rating") list.sort((x, y) => y.rating - x.rating);
  else if (sort === "experience") list.sort((x, y) => y.experience - x.experience);
  else if (sort === "listings") list.sort((x, y) => y.listings - x.listings);
  // "" default → source order (the app's natural ordering)
  return list;
}

export const getAgent = (id: string) => agents.find((a) => a.id === id);

/** Agent name suggestions matching a query, for the agents search field. */
export function suggestAgents(query: string, limit = 6): string[] {
  const s = query.trim().toLowerCase();
  if (!s) return [];
  const set = new Set<string>();
  for (const a of agents) if (a.name.toLowerCase().includes(s)) set.add(a.name);
  return sortSuggestions(Array.from(set), s).slice(0, limit);
}
