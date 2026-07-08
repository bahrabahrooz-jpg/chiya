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

/** Steps of the Add-listing wizard (member flow — no agent assignment). */
export const LISTING_STEPS = ["Details", "Location", "Photos", "Amenities", "Review"];

export const PROPERTY_TYPES = ["Villa", "Apartment", "House", "Land", "Commercial", "Office"];
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Zakho"];
export const DISTRICTS = ["Ankawa", "Italian Village", "Dream City", "Empire World", "English Village", "Downtown", "Naz City"];
export const CURRENCIES = ["USD", "EUR", "IQD"];
export const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", IQD: "IQD " };

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
  listing: "sale" | "rent";
  type: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  area: string;
  beds: number;
  baths: number;
  parking: number;
  city: string;
  district: string;
  street: string;
  amenities: string[];
  photos: string[];
  cover: string | null;
}

export const EMPTY_LISTING_FORM: ListingForm = {
  listing: "sale",
  type: "",
  title: "",
  description: "",
  price: "",
  currency: "USD",
  area: "",
  beds: 0,
  baths: 0,
  parking: 0,
  city: "",
  district: "",
  street: "",
  amenities: [],
  photos: [],
  cover: null,
};

const commas = (n: string) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const formatPrice = (f: ListingForm) => {
  const n = f.price.replace(/[^0-9]/g, "");
  if (!n) return "";
  return `${CURRENCY_SYMBOL[f.currency] || ""}${commas(n)}${f.listing === "rent" ? "/mo" : ""}`;
};
export const formatArea = (f: ListingForm) => {
  const n = f.area.replace(/[^0-9]/g, "");
  return n ? `${commas(n)} m²` : "";
};
