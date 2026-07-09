import {
  Waves,
  Trees,
  Dumbbell,
  ChevronsUp,
  Sun,
  ShieldCheck,
  Cctv,
  Wifi,
  Zap,
  Package,
  Flame,
  AirVent,
  type LucideIcon,
} from "lucide-react-native";

/** Steps of the Add-listing wizard — mirrors the website's member submit flow. */
export const LISTING_STEPS = ["Property details", "Location", "Media", "Amenities & features", "Ownership & assignment", "Review"];

export const PROPERTY_TYPES = ["Villa", "Apartment", "House", "Land", "Commercial", "Office", "Building"];
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Zakho"];
export const DISTRICTS = ["Ankawa", "Italian Village", "Dream City", "Empire World", "English Village", "Downtown", "Naz City"];
export const CURRENCIES = ["USD", "IQD"];
export const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", IQD: "IQD " };
export const CONDITIONS = ["New", "Good", "Needs renovation"];
export const FURNISHING = ["Unfurnished", "Semi-furnished", "Fully furnished"];
export const ORIENTATIONS = ["North facing", "South facing", "East facing", "West facing"];

export interface AmenityOpt {
  label: string;
  Icon: LucideIcon;
}
export const AMENITIES: AmenityOpt[] = [
  { label: "Swimming pool", Icon: Waves },
  { label: "Garden", Icon: Trees },
  { label: "Gym", Icon: Dumbbell },
  { label: "Elevator", Icon: ChevronsUp },
  { label: "Balcony", Icon: Sun },
  { label: "Security", Icon: ShieldCheck },
  { label: "CCTV", Icon: Cctv },
  { label: "Smart home", Icon: Wifi },
  { label: "Generator", Icon: Zap },
  { label: "Storage room", Icon: Package },
  { label: "Fireplace", Icon: Flame },
  { label: "Central AC", Icon: AirVent },
];

export interface ListingForm {
  // Property details
  listing: "sale" | "rent";
  type: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  area: string;
  areaUnit: "sqm" | "sqft";
  // Location
  city: string;
  district: string;
  project: string;
  street: string;
  building: string;
  lat: string;
  lng: string;
  locNotes: string;
  // Media
  photos: string[];
  cover: string | null;
  // Amenities & features
  beds: number;
  baths: number;
  parking: number;
  floors: number;
  year: string;
  orientation: string;
  condition: string;
  furnishing: string;
  amenities: string[];
  customAmenities: string[];
  // Ownership
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
}

export const EMPTY_LISTING_FORM: ListingForm = {
  listing: "sale",
  type: "",
  title: "",
  description: "",
  price: "",
  currency: "USD",
  area: "",
  areaUnit: "sqm",
  city: "",
  district: "",
  project: "",
  street: "",
  building: "",
  lat: "",
  lng: "",
  locNotes: "",
  photos: [],
  cover: null,
  beds: 0,
  baths: 0,
  parking: 0,
  floors: 0,
  year: "",
  orientation: "",
  condition: "",
  furnishing: "",
  amenities: [],
  customAmenities: [],
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
};

const commas = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const formatPrice = (f: ListingForm) => {
  const n = f.price.replace(/[^0-9]/g, "");
  if (!n) return "";
  return `${CURRENCY_SYMBOL[f.currency] || ""}${commas(n)}${f.listing === "rent" ? "/mo" : ""}`;
};
export const formatArea = (f: ListingForm) => {
  const n = f.area.replace(/[^0-9]/g, "");
  return n ? `${commas(n)} ${f.areaUnit === "sqft" ? "ft²" : "m²"}` : "";
};
