import {
  Waves,
  Trees,
  Dumbbell,
  ArrowUpDown,
  Fence,
  ShieldCheck,
  Cctv,
  HouseWifi,
  Zap,
  Package,
  BedSingle,
  Flame,
  Blocks,
  UtensilsCrossed,
  WashingMachine,
  AirVent,
  type LucideIcon,
} from "lucide-react-native";
import { getActiveLocale } from "@/lib/locale-state";

/**
 * Arabic display labels for the wizard's option strings. The form stores the
 * English label as its value (and submits it), so we keep values English and
 * only translate what's shown via `listingLabel`.
 */
const LISTING_AR: Record<string, string> = {
  // steps
  "Property details": "تفاصيل العقار",
  Location: "الموقع",
  Media: "الوسائط",
  "Amenities & features": "المرافق والمميزات",
  "Ownership & assignment": "الملكية والإسناد",
  Review: "المراجعة",
  // property types
  Villa: "فيلا",
  Apartment: "شقة",
  House: "منزل",
  Land: "أرض",
  Office: "مكتب",
  // cities
  Erbil: "أربيل",
  Sulaymaniyah: "السليمانية",
  Duhok: "دهوك",
  // districts and projects are city-scoped and sourced (with their own ar/ku
  // labels) from components/home/data.ts — see areasByCity / projectsByCity.
  // conditions
  New: "جديد",
  Good: "جيد",
  "Needs renovation": "يحتاج إلى تجديد",
  // furnishing
  Unfurnished: "غير مفروش",
  "Semi-furnished": "نصف مفروش",
  "Fully furnished": "مفروش بالكامل",
  // orientation
  "North facing": "واجهة شمالية",
  "South facing": "واجهة جنوبية",
  "East facing": "واجهة شرقية",
  "West facing": "واجهة غربية",
  // amenities
  "Swimming pool": "مسبح",
  Garden: "حديقة",
  Gym: "صالة رياضية",
  Elevator: "مصعد",
  Balcony: "شرفة",
  Security: "أمن",
  CCTV: "كاميرات مراقبة",
  "Smart home": "منزل ذكي",
  Generator: "مولّد كهرباء",
  "Storage room": "غرفة تخزين",
  "Maid room": "غرفة خادمة",
  Fireplace: "مدفأة",
  "Play area": "منطقة لعب",
  "BBQ area": "منطقة شواء",
  "Laundry room": "غرفة غسيل",
  "Central AC": "تكييف مركزي",
};

/** Locale-aware display for a wizard option string (value stays English). */
export const listingLabel = (s: string): string => (getActiveLocale() === "ar" ? LISTING_AR[s] ?? s : s);

/** Steps of the Add-listing wizard — mirrors the website's member submit flow. */
export const LISTING_STEPS = ["Property details", "Location", "Media", "Amenities & features", "Ownership & assignment", "Review"];

export const PROPERTY_TYPES = ["Apartment", "House", "Land", "Office", "Villa"];
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok"];
// Districts (areas) and projects are city-scoped; the wizard sources them from
// the shared catalog mirror in components/home/data.ts (areasByCity /
// projectsByCity) so they stay in lockstep with the web LOCATION_DEF.
export const CURRENCIES = ["USD", "IQD"];
export const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", IQD: "IQD " };
export const CONDITIONS = ["New", "Good", "Needs renovation"];
export const FURNISHING = ["Unfurnished", "Semi-furnished", "Fully furnished"];
export const ORIENTATIONS = ["North facing", "South facing", "East facing", "West facing"];

export type AmenityGroup = "comfort" | "security" | "outdoor" | "building";
/** Amenity group headers shown in the picker sheet — order matches the list below. */
export const AMENITY_GROUPS: { key: AmenityGroup; label: string }[] = [
  { key: "comfort", label: "Comfort" },
  { key: "security", label: "Security & Utilities" },
  { key: "outdoor", label: "Outdoor & Leisure" },
  { key: "building", label: "Building & Storage" },
];

export interface AmenityOpt {
  label: string;
  Icon: LucideIcon;
  group: AmenityGroup;
}
/* Canonical order + grouping is kept in lockstep with the web admin form
   (app/admin/_add-property/data.ts) — same labels, order, and groups. The two
   apps are separate build roots and can't share a module, so edit both together. */
export const AMENITIES: AmenityOpt[] = [
  // Comfort
  { label: "Smart home", Icon: HouseWifi, group: "comfort" },
  { label: "Central AC", Icon: AirVent, group: "comfort" },
  { label: "Maid room", Icon: BedSingle, group: "comfort" },
  { label: "Fireplace", Icon: Flame, group: "comfort" },
  // Security & Utilities
  { label: "Security", Icon: ShieldCheck, group: "security" },
  { label: "CCTV", Icon: Cctv, group: "security" },
  { label: "Generator", Icon: Zap, group: "security" },
  { label: "Elevator", Icon: ArrowUpDown, group: "security" },
  // Outdoor & Leisure
  { label: "Swimming pool", Icon: Waves, group: "outdoor" },
  { label: "Garden", Icon: Trees, group: "outdoor" },
  { label: "Gym", Icon: Dumbbell, group: "outdoor" },
  { label: "Balcony", Icon: Fence, group: "outdoor" },
  { label: "BBQ area", Icon: UtensilsCrossed, group: "outdoor" },
  { label: "Play area", Icon: Blocks, group: "outdoor" },
  // Building & Storage
  { label: "Storage room", Icon: Package, group: "building" },
  { label: "Laundry room", Icon: WashingMachine, group: "building" },
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
  videos: string[];
  videoUrl: string;
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
  assignedAgent: string;
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
  videos: [],
  videoUrl: "",
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
  assignedAgent: "",
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
