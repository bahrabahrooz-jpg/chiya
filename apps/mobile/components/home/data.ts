import {
  LayoutGrid,
  Tag,
  Key,
  House,
  Building2,
  Home,
  Trees,
  Store,
  SquareParking,
  Waves,
  Sun,
  ChevronsUp,
  ShieldCheck,
  Sofa,
  type LucideIcon,
} from "lucide-react-native";

/** Demo signed-in member (no auth backend yet). */
export const user = {
  name: "Bahra",
  fullName: "Bahra Bahroz",
  location: "Erbil, Kurdistan",
};

export interface Opt {
  value: string;
  label: string;
  Icon?: LucideIcon;
}

/** Quick deal/category chips shown under the search bar. */
export const dealCategories: Opt[] = [
  { value: "all", label: "All", Icon: LayoutGrid },
  { value: "buy", label: "For Sale", Icon: Tag },
  { value: "rent", label: "For Rent", Icon: Key },
];

/** Filter options — ported from the website search (app/_search/data.ts). */
export const propertyTypes: Opt[] = [
  { value: "villa", label: "Villa", Icon: House },
  { value: "apartment", label: "Apartment", Icon: Building2 },
  { value: "house", label: "House", Icon: Home },
  { value: "land", label: "Land", Icon: Trees },
  { value: "commercial", label: "Commercial", Icon: Store },
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

export const beds: Opt[] = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

export const baths: Opt[] = [
  { value: "", label: "Any" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
];

export const amenities: Opt[] = [
  { value: "parking", label: "Parking", Icon: SquareParking },
  { value: "garden", label: "Garden", Icon: Trees },
  { value: "pool", label: "Pool", Icon: Waves },
  { value: "balcony", label: "Balcony", Icon: Sun },
  { value: "elevator", label: "Elevator", Icon: ChevronsUp },
  { value: "security", label: "Security", Icon: ShieldCheck },
  { value: "furnished", label: "Furnished", Icon: Sofa },
];

/** Cities available in the listings (for the Location filter). */
export const searchCities = ["Erbil", "Sulaymaniyah", "Duhok"];

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
}

export const emptyFilters: Filters = {
  types: [],
  price: null,
  size: null,
  beds: "",
  baths: "",
  amenities: [],
  cities: [],
};

export const countFilters = (f: Filters): number =>
  f.types.length + (f.price ? 1 : 0) + (f.size ? 1 : 0) + (f.beds ? 1 : 0) + (f.baths ? 1 : 0) + f.amenities.length + f.cities.length;

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
  { id: "skyline-pent", title: "Skyline Penthouse", address: "Downtown, Erbil", city: "Erbil", deal: "rent", price: 2800, type: "apartment", beds: 3, baths: 3, area: 210, status: "For Rent", amenities: ["balcony", "elevator", "parking", "furnished", "security"], cover: img("1600607687939-ce8a6c25118c") },
  { id: "cedarwood-villa", title: "Cedarwood Villa", address: "Dream City, Erbil", city: "Erbil", deal: "buy", price: 485000, type: "villa", beds: 4, baths: 3, area: 265, status: "For Sale", amenities: ["garden", "parking", "security"], cover: img("1580587771525-78b9dba3b914") },
  { id: "azadi-villa", title: "Azadi Heights Villa", address: "Azadi, Duhok", city: "Duhok", deal: "buy", price: 760000, type: "villa", beds: 5, baths: 4, area: 520, status: "For Sale", amenities: ["pool", "garden", "parking", "security"], cover: img("1600585154340-be6161a56a0c") },
  { id: "italian-village", title: "Italian Village Apartment", address: "Italian Village, Erbil", city: "Erbil", deal: "rent", price: 1850, type: "apartment", beds: 2, baths: 2, area: 115, status: "For Rent", amenities: ["balcony", "elevator", "parking"], cover: img("1493809842364-78817add7ffb") },
];

/** Featured feed for the "Recommended for you" carousel. */
export const recommended = listings;

const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const priceLabel = (l: Listing) => (l.deal === "rent" ? `$${commas(l.price)}/mo` : `$${commas(l.price)}`);

/** Sort options for the search results (mirrors the website SRP). */
export const searchSort: Opt[] = [
  { value: "recommended", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

/** Full search + filter + sort over the listings (mirrors the website SRP logic). */
export function searchListings(opts: { query: string; deal: string; filters: Filters; sort: string }): Listing[] {
  const { query, deal, filters, sort } = opts;
  const q = query.trim().toLowerCase();
  const list = listings.filter((l) => {
    if (deal === "buy" && l.deal !== "buy") return false;
    if (deal === "rent" && l.deal !== "rent") return false;
    if (q && !`${l.title} ${l.address} ${l.city} ${l.type}`.toLowerCase().includes(q)) return false;
    if (filters.cities.length && !filters.cities.includes(l.city)) return false;
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
  else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); // featured / newest → featured first
  return list;
}

/** Label lookup for an option list (used by the active-filter chips). */
export const labelFor = (opts: Opt[], value: string) => opts.find((o) => o.value === value)?.label ?? value;

export const getListing = (id: string) => listings.find((l) => l.id === id);

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
}

export const locations: Location[] = [
  { id: "erbil", name: "Erbil, Kurdistan", count: "248+ Properties", subtitle: "Villas, Apartments, Family Homes", cover: img("1613490493576-7fde63acd811", 240, 240) },
  { id: "sulaymaniyah", name: "Sulaymaniyah", count: "154+ Properties", subtitle: "Apartments, Townhouses, Villas", cover: img("1600607687939-ce8a6c25118c", 240, 240) },
  { id: "duhok", name: "Duhok", count: "86+ Properties", subtitle: "Houses, Villas, Land", cover: img("1600585154340-be6161a56a0c", 240, 240) },
];

/** Featured agents — ported from the website agent directory. */
const portrait = (id: string) => `https://images.unsplash.com/photo-${id}?w=240&h=240&fit=crop&crop=faces`;

export interface Agent {
  id: string;
  name: string;
  agency: string;
  city: string;
  photo: string;
  verified: boolean;
  rating: number;
  reviews: number;
  listings: number;
}

export const agents: Agent[] = [
  { id: "lana-hassan", name: "Lana Hassan", agency: "Chiya Premier", city: "Erbil", photo: portrait("1573496359142-b8d87734a5a2"), verified: true, rating: 4.9, reviews: 128, listings: 42 },
  { id: "avan-mahmood", name: "Avan Mahmood", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1544005313-94ddf0286df2"), verified: true, rating: 4.9, reviews: 112, listings: 37 },
  { id: "daban-ali", name: "Daban Ali", agency: "Chiya Premier", city: "Erbil", photo: portrait("1500648767791-00dcc994a43e"), verified: true, rating: 4.8, reviews: 96, listings: 31 },
  { id: "nyan-salih", name: "Nyan Salih", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1573497019940-1c28c88b4f3e"), verified: true, rating: 4.9, reviews: 88, listings: 29 },
  { id: "dilan-aziz", name: "Dilan Aziz", agency: "Erbil Estates", city: "Erbil", photo: portrait("1487412720507-e7ab37603c6f"), verified: true, rating: 4.8, reviews: 77, listings: 26 },
  { id: "aram-botani", name: "Aram Botani", agency: "Chiya Premier", city: "Erbil", photo: portrait("1507003211169-0a1dd7228f2d"), verified: true, rating: 4.7, reviews: 73, listings: 24 },
  { id: "sipan-rashid", name: "Sipan Rashid", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1519085360753-af0119f7cbe7"), verified: true, rating: 4.8, reviews: 66, listings: 23 },
  { id: "rebin-tofiq", name: "Rebin Tofiq", agency: "Duhok Homes", city: "Duhok", photo: portrait("1633332755192-727a05c4013d"), verified: true, rating: 4.8, reviews: 58, listings: 21 },
  { id: "shene-karim", name: "Shene Karim", agency: "Erbil Estates", city: "Erbil", photo: portrait("1438761681033-6461ffad8d80"), verified: true, rating: 5.0, reviews: 64, listings: 18 },
  { id: "karwan-jamal", name: "Karwan Jamal", agency: "Empire Realty", city: "Erbil", photo: portrait("1506794778202-cad84cf45f1d"), verified: true, rating: 4.6, reviews: 51, listings: 19 },
  { id: "hawre-sabir", name: "Hawre Sabir", agency: "Duhok Homes", city: "Duhok", photo: portrait("1472099645785-5658abf4ff4e"), verified: true, rating: 4.7, reviews: 44, listings: 15 },
  { id: "tara-qadir", name: "Tara Qadir", agency: "Ankawa Properties", city: "Erbil", photo: portrait("1534528741775-53994a69daeb"), verified: true, rating: 5.0, reviews: 39, listings: 12 },
];

export const featuredAgents: Agent[] = agents.slice(0, 6);
export const agentCities = ["Erbil", "Sulaymaniyah", "Duhok"];
export const agentSort: Opt[] = [
  { value: "listings", label: "Most listings" },
  { value: "rating", label: "Highest rating" },
  { value: "reviews", label: "Most reviews" },
];

export const getAgent = (id: string) => agents.find((a) => a.id === id);
