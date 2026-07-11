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
  Commercial: "تجاري",
  Office: "مكتب",
  Building: "مبنى",
  // cities
  Erbil: "أربيل",
  Sulaymaniyah: "السليمانية",
  Duhok: "دهوك",
  Halabja: "حلبجة",
  Kirkuk: "كركوك",
  Zakho: "زاخو",
  // districts
  Ankawa: "عنكاوة",
  "Italian Village": "القرية الإيطالية",
  "Dream City": "دريم سيتي",
  "Empire World": "إمباير وورلد",
  "English Village": "القرية الإنجليزية",
  Downtown: "وسط المدينة",
  "Naz City": "ناز سيتي",
  // projects / communities
  "Park View": "بارك فيو",
  "Lalav City": "لالاف سيتي",
  "Atlantic City": "أتلانتيك سيتي",
  "Ster Towers": "أبراج ستير",
  "Royal City": "رويال سيتي",
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
  Fireplace: "مدفأة",
  "Central AC": "تكييف مركزي",
};

/** Locale-aware display for a wizard option string (value stays English). */
export const listingLabel = (s: string): string => (getActiveLocale() === "ar" ? LISTING_AR[s] ?? s : s);

/** Steps of the Add-listing wizard — mirrors the website's member submit flow. */
export const LISTING_STEPS = ["Property details", "Location", "Media", "Amenities & features", "Ownership & assignment", "Review"];

export const PROPERTY_TYPES = ["Villa", "Apartment", "House", "Land", "Commercial", "Office", "Building"];
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Zakho"];
export const DISTRICTS = ["Ankawa", "Italian Village", "Dream City", "Empire World", "English Village", "Downtown", "Naz City"];
export const PROJECTS = ["Dream City", "Empire World", "Italian Village", "Park View", "Lalav City", "Atlantic City", "Ster Towers", "Royal City"];
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
