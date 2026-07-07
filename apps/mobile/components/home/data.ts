import {
  LayoutGrid,
  Tag,
  Key,
  Sparkles,
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
  { value: "new", label: "New", Icon: Sparkles },
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
  { value: "0", label: "Studio" },
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

/** Active search filters (mirrors the website's SRP filter shape). */
export interface Filters {
  types: string[];
  price: string | null;
  beds: string;
  baths: string;
  amenities: string[];
}

export const emptyFilters: Filters = {
  types: [],
  price: null,
  beds: "",
  baths: "",
  amenities: [],
};

export const countFilters = (f: Filters): number =>
  f.types.length + (f.price ? 1 : 0) + (f.beds ? 1 : 0) + (f.baths ? 1 : 0) + f.amenities.length;

/** Listings — ported from the website search demo data (Kurdistan). */
const img = (id: string, w = 800, h = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

export interface Listing {
  id: string;
  title: string;
  address: string;
  city: string;
  deal: "buy" | "rent";
  price: number;
  beds?: number;
  baths?: number;
  area: number;
  status: string;
  featured?: boolean;
  cover: string;
}

export const listings: Listing[] = [
  { id: "olive-grove", title: "Olive Grove Estate", address: "Shaqlawa Hills, Erbil", city: "Erbil", deal: "buy", price: 1240000, beds: 6, baths: 5, area: 680, status: "For Sale", featured: true, cover: img("1613490493576-7fde63acd811") },
  { id: "marble-hill", title: "Marble Hill Villa", address: "Ankawa, Erbil", city: "Erbil", deal: "buy", price: 620000, beds: 4, baths: 3, area: 420, status: "For Sale", featured: true, cover: img("1613977257363-707ba9348227") },
  { id: "rowanberry-villa", title: "Rowanberry Villa", address: "Italian Village, Erbil", city: "Erbil", deal: "buy", price: 560000, beds: 3, baths: 3, area: 240, status: "For Sale", featured: true, cover: img("1605276374104-dee2a0ed3cd6") },
  { id: "garden-townhouse", title: "Garden Townhouse", address: "Empire City, Erbil", city: "Erbil", deal: "buy", price: 430000, beds: 3, baths: 3, area: 240, status: "For Sale", featured: true, cover: img("1568605114967-8130f3a36994") },
  { id: "skyline-pent", title: "Skyline Penthouse", address: "Downtown, Erbil", city: "Erbil", deal: "rent", price: 2800, beds: 3, baths: 3, area: 210, status: "For Rent", cover: img("1600607687939-ce8a6c25118c") },
  { id: "cedarwood-villa", title: "Cedarwood Villa", address: "Dream City, Erbil", city: "Erbil", deal: "buy", price: 485000, beds: 4, baths: 3, area: 265, status: "For Sale", cover: img("1580587771525-78b9dba3b914") },
  { id: "azadi-villa", title: "Azadi Heights Villa", address: "Azadi, Duhok", city: "Duhok", deal: "buy", price: 760000, beds: 5, baths: 4, area: 520, status: "For Sale", cover: img("1600585154340-be6161a56a0c") },
  { id: "italian-village", title: "Italian Village Apartment", address: "Italian Village, Erbil", city: "Erbil", deal: "rent", price: 1850, beds: 2, baths: 2, area: 115, status: "For Rent", cover: img("1493809842364-78817add7ffb") },
];

/** Featured feed for the "Recommended for you" carousel. */
export const recommended = listings;

const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const priceLabel = (l: Listing) => (l.deal === "rent" ? `$${commas(l.price)}/mo` : `$${commas(l.price)}`);

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
  listings: number;
}

export const featuredAgents: Agent[] = [
  { id: "lana-hassan", name: "Lana Hassan", agency: "Chiya Premier", city: "Erbil", photo: portrait("1573496359142-b8d87734a5a2"), verified: true, rating: 4.9, listings: 42 },
  { id: "avan-mahmood", name: "Avan Mahmood", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1544005313-94ddf0286df2"), verified: true, rating: 4.9, listings: 37 },
  { id: "shene-karim", name: "Shene Karim", agency: "Erbil Estates", city: "Erbil", photo: portrait("1438761681033-6461ffad8d80"), verified: true, rating: 5.0, listings: 18 },
  { id: "daban-ali", name: "Daban Ali", agency: "Chiya Premier", city: "Erbil", photo: portrait("1500648767791-00dcc994a43e"), verified: true, rating: 4.8, listings: 31 },
  { id: "nyan-salih", name: "Nyan Salih", agency: "Suli Signature", city: "Sulaymaniyah", photo: portrait("1573497019940-1c28c88b4f3e"), verified: true, rating: 4.9, listings: 29 },
  { id: "zhin-faraj", name: "Zhin Faraj", agency: "Chiya Premier", city: "Erbil", photo: portrait("1544723795-3fb6469f5b39"), verified: true, rating: 4.9, listings: 28 },
];
