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
  Sofa,
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
  Icon?: LucideIcon;
}

/** Locale-aware label for an option (Arabic when the active locale is Arabic). */
export const optLabel = (o: Opt): string => (getActiveLocale() === "ar" ? o.ar ?? o.label : o.label);

/** Quick deal/category chips shown under the search bar. */
export const dealCategories: Opt[] = [
  { value: "all", label: "All", ar: "الكل", Icon: LayoutGrid },
  { value: "buy", label: "For Sale", ar: "للبيع", Icon: Tag },
  { value: "rent", label: "For Rent", ar: "للإيجار", Icon: Key },
];

/** Filter options — ported from the website search (app/_search/data.ts). */
export const propertyTypes: Opt[] = [
  { value: "villa", label: "Villa", ar: "فيلا", Icon: House },
  { value: "apartment", label: "Apartment", ar: "شقة", Icon: Building2 },
  { value: "house", label: "House", ar: "منزل", Icon: Home },
  { value: "land", label: "Land", ar: "أرض", Icon: Trees },
  { value: "office", label: "Office", ar: "مكتب", Icon: Briefcase },
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

export const amenities: Opt[] = [
  { value: "parking", label: "Parking", ar: "موقف سيارات", Icon: SquareParking },
  { value: "garden", label: "Garden", ar: "حديقة", Icon: Trees },
  { value: "pool", label: "Pool", ar: "مسبح", Icon: Waves },
  { value: "balcony", label: "Balcony", ar: "شرفة", Icon: Sun },
  { value: "elevator", label: "Elevator", ar: "مصعد", Icon: ChevronsUp },
  { value: "security", label: "Security", ar: "أمن", Icon: ShieldCheck },
  { value: "furnished", label: "Furnished", ar: "مفروش", Icon: Sofa },
];

/** Cities available in the listings (for the Location filter). */
export const searchCities = ["Erbil", "Sulaymaniyah", "Duhok"];

/** Locale-aware display names for cities and agent languages (values stay English). */
const CITY_AR: Record<string, string> = { Erbil: "أربيل", Sulaymaniyah: "السليمانية", Duhok: "دهوك" };
export const cityLabel = (c: string): string => (getActiveLocale() === "ar" ? CITY_AR[c] ?? c : c);

/** City options for the searchable Location picker. */
export const cityOpts: Opt[] = searchCities.map((c) => ({ value: c, label: c, ar: CITY_AR[c] }));

/** Areas / districts per city (values match the listing addresses). */
export const areasByCity: Record<string, Opt[]> = {
  Erbil: [
    { value: "Ankawa", label: "Ankawa", ar: "عنكاوا" },
    { value: "Downtown", label: "Downtown", ar: "وسط المدينة" },
    { value: "Shaqlawa Hills", label: "Shaqlawa Hills", ar: "تلال شقلاوة" },
    { value: "Gulan", label: "Gulan", ar: "كولان" },
  ],
  Sulaymaniyah: [
    { value: "Salim Street", label: "Salim Street", ar: "شارع سالم" },
    { value: "Bakhtiari", label: "Bakhtiari", ar: "بختياري" },
    { value: "Sarchinar", label: "Sarchinar", ar: "سرجنار" },
  ],
  Duhok: [
    { value: "Azadi", label: "Azadi", ar: "آزادي" },
    { value: "Malta", label: "Malta", ar: "مالطا" },
    { value: "Shindokha", label: "Shindokha", ar: "شندوخا" },
  ],
};

/** Projects / communities per city (values match the listing addresses). */
export const projectsByCity: Record<string, Opt[]> = {
  Erbil: [
    { value: "Dream City", label: "Dream City", ar: "دريم سيتي" },
    { value: "Empire City", label: "Empire City", ar: "إمباير سيتي" },
    { value: "Italian Village", label: "Italian Village", ar: "القرية الإيطالية" },
    { value: "Park View", label: "Park View", ar: "بارك فيو" },
  ],
  Sulaymaniyah: [
    { value: "Pak City", label: "Pak City", ar: "باك سيتي" },
    { value: "Qaiwan City", label: "Qaiwan City", ar: "قيوان سيتي" },
  ],
  Duhok: [{ value: "Avro City", label: "Avro City", ar: "آفرو سيتي" }],
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

/** Listings — ported from the website search demo data (Kurdistan). */
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
}

export const listings: Listing[] = [
  { id: "olive-grove", title: "Olive Grove Estate", address: "Shaqlawa Hills, Erbil", city: "Erbil", deal: "buy", price: 1240000, type: "villa", beds: 6, baths: 5, area: 680, status: "For Sale", featured: true, amenities: ["pool", "garden", "parking", "security"], cover: img("1613490493576-7fde63acd811") },
  { id: "marble-hill", title: "Marble Hill Villa", address: "Ankawa, Erbil", city: "Erbil", deal: "buy", price: 620000, type: "villa", beds: 4, baths: 3, area: 420, status: "For Sale", featured: true, amenities: ["pool", "garden", "parking"], cover: img("1613977257363-707ba9348227") },
  { id: "rowanberry-villa", title: "Rowanberry Villa", address: "Italian Village, Erbil", city: "Erbil", deal: "buy", price: 560000, type: "villa", beds: 3, baths: 3, area: 240, status: "For Sale", featured: true, amenities: ["pool", "garden", "parking"], cover: img("1605276374104-dee2a0ed3cd6") },
  { id: "garden-townhouse", title: "Garden Townhouse", address: "Empire City, Erbil", city: "Erbil", deal: "buy", price: 430000, type: "house", beds: 3, baths: 3, area: 240, status: "For Sale", featured: true, amenities: ["garden", "parking", "balcony"], cover: img("1568605114967-8130f3a36994") },
  { id: "skyline-pent", title: "Skyline Penthouse", address: "Downtown, Erbil", city: "Erbil", deal: "rent", price: 2800, type: "apartment", beds: 3, baths: 3, area: 210, status: "For Rent", amenities: ["balcony", "elevator", "parking", "furnished", "security"], cover: img("1545324418-cc1a3fa10c00") },
  { id: "cedarwood-villa", title: "Cedarwood Villa", address: "Dream City, Erbil", city: "Erbil", deal: "buy", price: 485000, type: "villa", beds: 4, baths: 3, area: 265, status: "For Sale", amenities: ["garden", "parking", "security"], cover: img("1580587771525-78b9dba3b914") },
  { id: "azadi-villa", title: "Azadi Heights Villa", address: "Azadi, Duhok", city: "Duhok", deal: "buy", price: 760000, type: "villa", beds: 5, baths: 4, area: 520, status: "For Sale", amenities: ["pool", "garden", "parking", "security"], cover: img("1600585154340-be6161a56a0c") },
  { id: "italian-village", title: "Italian Village Apartment", address: "Italian Village, Erbil", city: "Erbil", deal: "rent", price: 1850, type: "apartment", beds: 2, baths: 2, area: 115, status: "For Rent", amenities: ["balcony", "elevator", "parking"], cover: img("1460317442991-0ec209397118") },
  { id: "park-view-villa", title: "Park View Villa", address: "Park View, Erbil", city: "Erbil", deal: "buy", price: 890000, type: "villa", beds: 5, baths: 4, area: 480, status: "For Sale", featured: true, amenities: ["pool", "garden", "parking", "security"], cover: img("1564013799919-ab600027ffc6") },
  { id: "gulan-residence", title: "Gulan Residence", address: "Gulan, Erbil", city: "Erbil", deal: "rent", price: 2200, type: "apartment", beds: 2, baths: 2, area: 130, status: "For Rent", amenities: ["balcony", "elevator", "parking", "furnished"], cover: img("1479839672679-a46483c0e7c8") },
  { id: "downtown-office", title: "Downtown Office Floor", address: "Downtown, Erbil", city: "Erbil", deal: "rent", price: 4500, type: "office", baths: 2, area: 320, status: "For Rent", amenities: ["parking", "elevator", "security"], cover: img("1486406146926-c627a92ad1ab") },
  { id: "ankawa-land", title: "Ankawa Building Plot", address: "Ankawa, Erbil", city: "Erbil", deal: "buy", price: 320000, type: "land", area: 500, status: "For Sale", amenities: [], cover: img("1500382017468-9049fed747ef") },
  { id: "shaqlawa-land", title: "Shaqlawa Hillside Land", address: "Shaqlawa Hills, Erbil", city: "Erbil", deal: "buy", price: 180000, type: "land", area: 800, status: "For Sale", amenities: [], cover: img("1434725039720-aaad6dd32dfe") },
  { id: "sarchinar-villa", title: "Sarchinar Garden Villa", address: "Sarchinar, Sulaymaniyah", city: "Sulaymaniyah", deal: "buy", price: 540000, type: "villa", beds: 4, baths: 3, area: 300, status: "For Sale", amenities: ["garden", "parking", "security"], cover: img("1523217582562-09d0def993a6") },
  { id: "pak-city-apartment", title: "Pak City Apartment", address: "Pak City, Sulaymaniyah", city: "Sulaymaniyah", deal: "buy", price: 210000, type: "apartment", beds: 3, baths: 2, area: 150, status: "For Sale", amenities: ["elevator", "parking", "balcony"], cover: img("1481253127861-534498168948") },
  { id: "qaiwan-penthouse", title: "Qaiwan Sky Penthouse", address: "Qaiwan City, Sulaymaniyah", city: "Sulaymaniyah", deal: "rent", price: 3200, type: "apartment", beds: 3, baths: 3, area: 220, status: "For Rent", featured: true, amenities: ["pool", "balcony", "elevator", "parking", "furnished", "security"], cover: img("1545324418-cc1a3fa10c00") },
  { id: "salim-townhouse", title: "Salim Street Townhouse", address: "Salim Street, Sulaymaniyah", city: "Sulaymaniyah", deal: "buy", price: 380000, type: "house", beds: 4, baths: 3, area: 280, status: "For Sale", amenities: ["garden", "parking", "balcony"], cover: img("1570129477492-45c003edd2be") },
  { id: "bakhtiari-house", title: "Bakhtiari Family Home", address: "Bakhtiari, Sulaymaniyah", city: "Sulaymaniyah", deal: "rent", price: 1500, type: "house", beds: 3, baths: 2, area: 200, status: "For Rent", amenities: ["garden", "parking"], cover: img("1583608205776-bfd35f0d9f83") },
  { id: "suli-office", title: "Salim Street Office Suite", address: "Salim Street, Sulaymaniyah", city: "Sulaymaniyah", deal: "buy", price: 460000, type: "office", baths: 2, area: 260, status: "For Sale", amenities: ["parking", "elevator", "security"], cover: img("1533090161767-e6ffed986c88") },
  { id: "malta-villa", title: "Malta Panorama Villa", address: "Malta, Duhok", city: "Duhok", deal: "buy", price: 650000, type: "villa", beds: 5, baths: 4, area: 460, status: "For Sale", featured: true, amenities: ["pool", "garden", "parking", "security"], cover: img("1512917774080-9991f1c4c750") },
  { id: "shindokha-house", title: "Shindokha Cottage", address: "Shindokha, Duhok", city: "Duhok", deal: "buy", price: 295000, type: "house", beds: 3, baths: 2, area: 210, status: "For Sale", amenities: ["garden", "parking"], cover: img("1449844908441-8829872d2607") },
  { id: "avro-apartment", title: "Avro City Apartment", address: "Avro City, Duhok", city: "Duhok", deal: "rent", price: 1200, type: "apartment", beds: 2, baths: 1, area: 105, status: "For Rent", amenities: ["elevator", "parking"], cover: img("1479839672679-a46483c0e7c8") },
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

/** Popular locations — city counts mirror the website's BASE_COUNT. */
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
  { id: "erbil", name: "Erbil, Kurdistan", nameAr: "أربيل، كردستان", count: "248+ Properties", countAr: "أكثر من 248 عقارًا", subtitle: "Villas, Apartments, Family Homes", subtitleAr: "فلل، شقق، منازل عائلية", cover: img("1613490493576-7fde63acd811", 240, 240) },
  { id: "sulaymaniyah", name: "Sulaymaniyah", nameAr: "السليمانية", count: "154+ Properties", countAr: "أكثر من 154 عقارًا", subtitle: "Apartments, Townhouses, Villas", subtitleAr: "شقق، منازل متلاصقة، فلل", cover: img("1600607687939-ce8a6c25118c", 240, 240) },
  { id: "duhok", name: "Duhok", nameAr: "دهوك", count: "86+ Properties", countAr: "أكثر من 86 عقارًا", subtitle: "Houses, Villas, Land", subtitleAr: "منازل، فلل، أراضٍ", cover: img("1600585154340-be6161a56a0c", 240, 240) },
];

/** Locale-aware display fields for a popular location. */
export function locationDisplay(l: Location): { name: string; count: string; subtitle: string } {
  if (getActiveLocale() !== "ar") return l;
  return { name: l.nameAr ?? l.name, count: l.countAr ?? l.count, subtitle: l.subtitleAr ?? l.subtitle };
}

/** Featured agents — ported from the website agent directory.
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
  photo: string;
  verified: boolean;
  rating: number;
  reviews: number;
  listings: number;
  languages: string[];
  /** Years of experience. */
  experience: number;
}

export const agents: Agent[] = [
  { id: "lana-hassan", name: "Lana Hassan", city: "Erbil", photo: portrait("1573496359142-b8d87734a5a2"), verified: true, rating: 4.9, reviews: 128, listings: 42, languages: ["Kurdish", "English", "Arabic"], experience: 12 },
  { id: "avan-mahmood", name: "Avan Mahmood", city: "Sulaymaniyah", photo: portrait("1573497019236-17f8177b81e8"), verified: true, rating: 4.9, reviews: 112, listings: 37, languages: ["Kurdish", "Arabic"], experience: 9 },
  { id: "daban-ali", name: "Daban Ali", city: "Erbil", photo: portrait("1472099645785-5658abf4ff4e"), verified: true, rating: 4.8, reviews: 96, listings: 31, languages: ["Kurdish", "English"], experience: 15 },
  { id: "nyan-salih", name: "Nyan Salih", city: "Sulaymaniyah", photo: portrait("1573497161161-c3e73707e25c"), verified: true, rating: 4.9, reviews: 88, listings: 29, languages: ["Kurdish", "Arabic", "English"], experience: 7 },
  { id: "dilan-aziz", name: "Dilan Aziz", city: "Erbil", photo: portrait("1573496527892-904f897eb744"), verified: true, rating: 4.8, reviews: 77, listings: 26, languages: ["Kurdish", "English"], experience: 18 },
  { id: "aram-botani", name: "Aram Botani", city: "Erbil", photo: portrait("1537368910025-700350fe46c7"), verified: true, rating: 4.7, reviews: 73, listings: 24, languages: ["Kurdish", "Turkish"], experience: 6 },
  { id: "sipan-rashid", name: "Sipan Rashid", city: "Sulaymaniyah", photo: portrait("1519085360753-af0119f7cbe7"), verified: true, rating: 4.8, reviews: 66, listings: 23, languages: ["Kurdish", "Arabic"], experience: 11 },
  { id: "rebin-tofiq", name: "Rebin Tofiq", city: "Duhok", photo: portrait("1537511446984-935f663eb1f4"), verified: true, rating: 4.8, reviews: 58, listings: 21, languages: ["Kurdish", "English"], experience: 4 },
  { id: "shene-karim", name: "Shene Karim", city: "Erbil", photo: portrait("1573165850883-9b0e18c44bd2"), verified: true, rating: 5.0, reviews: 64, listings: 18, languages: ["Kurdish", "Arabic", "English"], experience: 20 },
  { id: "karwan-jamal", name: "Karwan Jamal", city: "Erbil", photo: portrait("1556157382-97eda2d62296"), verified: true, rating: 4.6, reviews: 51, listings: 19, languages: ["Kurdish", "English", "Turkish"], experience: 8 },
  { id: "hawre-sabir", name: "Hawre Sabir", city: "Duhok", photo: portrait("1544717297-fa95b6ee9643"), verified: true, rating: 4.7, reviews: 44, listings: 15, languages: ["Kurdish", "Arabic"], experience: 5 },
  { id: "tara-qadir", name: "Tara Qadir", city: "Erbil", photo: portrait("1587559070757-f72a388edbba"), verified: true, rating: 5.0, reviews: 39, listings: 12, languages: ["Kurdish", "English", "Persian"], experience: 3 },
];

export const featuredAgents: Agent[] = agents.slice(0, 6);
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
