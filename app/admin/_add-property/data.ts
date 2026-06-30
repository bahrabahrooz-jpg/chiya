import type { IconName } from "@/components/ui/icon";

export const STEPS = ["Property details", "Location", "Media", "Amenities & features", "Ownership & assignment", "Review & publish"];

export const PROPERTY_TYPES = ["Villa", "Apartment", "House", "Land", "Commercial", "Office", "Building"];
export const CONDITIONS = ["New", "Good", "Needs renovation"];
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Zakho"];
export const DISTRICTS = ["Ankawa", "Italian Village", "Dream City", "Empire World", "English Village", "Downtown", "Naz City"];
export const FURNISHING = ["Unfurnished", "Semi-furnished", "Fully furnished"];
export const ORIENTATIONS = ["North facing", "South facing", "East facing", "West facing"];

export interface ApAgent { id: string; name: string; area: string; phone: string; avatar: string }
export const AGENTS: ApAgent[] = [
  { id: "lana", name: "Lana Aziz", area: "Erbil · Ankawa", phone: "+964 770 552 1190", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=70" },
  { id: "karwan", name: "Karwan Mahmoud", area: "Erbil · Downtown", phone: "+964 750 118 4420", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70" },
  { id: "dashne", name: "Dashne Salar", area: "Sulaymaniyah", phone: "+964 773 220 5567", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70" },
  { id: "shilan", name: "Shilan Aram", area: "Erbil · Italian V.", phone: "+964 751 209 3341", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70" },
  { id: "diyar", name: "Diyar Salih", area: "Duhok", phone: "+964 770 118 5540", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
];

export interface Amenity { label: string; icon: IconName }
export const AMENITIES: Amenity[] = [
  { label: "Swimming pool", icon: "waves" },
  { label: "Garden", icon: "trees" },
  { label: "Gym", icon: "dumbbell" },
  { label: "Elevator", icon: "arrow-up-down" },
  { label: "Balcony", icon: "fence" },
  { label: "Security", icon: "shield-check" },
  { label: "CCTV", icon: "cctv" },
  { label: "Smart home", icon: "house-wifi" },
  { label: "Generator", icon: "zap" },
  { label: "Storage room", icon: "package" },
  { label: "Maid room", icon: "bed-single" },
  { label: "Fireplace", icon: "flame" },
  { label: "Play area", icon: "blocks" },
  { label: "BBQ area", icon: "utensils-crossed" },
  { label: "Laundry room", icon: "washing-machine" },
  { label: "Central AC", icon: "air-vent" },
];

export const GUIDELINES = [
  "Use high-quality, well-lit images",
  "Upload at least 5 photos (minimum recommended)",
  "Lead with the strongest exterior or interior shot",
  "Avoid blurry, dark, or low-resolution images",
  "Do not upload images with watermarks",
];

export const COVER_IMG = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1280&q=70";
export interface GalleryImg { id: string; url: string; cover?: boolean }
export const GALLERY_IMGS: GalleryImg[] = [
  { id: "g1", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=70", cover: true },
  { id: "g2", url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=640&q=70" },
  { id: "g3", url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=640&q=70" },
  { id: "g4", url: "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=640&q=70" },
  { id: "g5", url: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=640&q=70" },
];

export const PUBLISHED = {
  title: "Olive Grove Estate",
  address: "Ankawa, Erbil",
  price: "$450,000",
  listing: "For sale",
  beds: 3,
  baths: 2,
  area: "420 m²",
  ref: "CHE-2026-0418",
  cover: COVER_IMG,
  agent: AGENTS[0],
};

export interface ApForm {
  listing: string;
  type: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  area: string;
  areaUnit: string;
  beds: number;
  baths: number;
  parking: number;
  condition: string;
  furnished: string;
  year: string;
  short: string;
  furnishing: string;
  floors: number;
  orientation: string;
  amenities: string[];
  customAmenities: string[];
  highlights: string;
  city: string;
  district: string;
  street: string;
  building: string;
  lat: string;
  lng: string;
  locNotes: string;
  tourUrl: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  agent: string;
  internalNotes: string;
}

export const EMPTY_FORM: ApForm = {
  listing: "sale",
  type: "",
  title: "",
  description: "",
  price: "",
  currency: "USD",
  area: "",
  areaUnit: "sqm",
  beds: 3,
  baths: 2,
  parking: 1,
  condition: "Good",
  furnished: "no",
  year: "",
  short: "",
  furnishing: "Semi-furnished",
  floors: 2,
  orientation: "",
  amenities: ["Swimming pool", "Garden", "Security", "Central AC"],
  customAmenities: ["Rooftop terrace"],
  highlights: "",
  city: "Erbil",
  district: "",
  street: "",
  building: "",
  lat: "36.19085",
  lng: "44.00947",
  locNotes: "",
  tourUrl: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  agent: "",
  internalNotes: "",
};
