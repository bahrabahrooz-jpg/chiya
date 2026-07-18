import type { IconName } from "@/components/ui/icon";

export const STEP_KEYS = [
  "admin.ap.step.details",
  "admin.ap.step.location",
  "admin.ap.step.media",
  "admin.ap.step.amenities",
  "admin.ap.step.ownership",
  "admin.ap.step.review",
];

export const PROPERTY_TYPES = ["Apartment", "House", "Land", "Office", "Villa"];
export const CONDITIONS = ["New", "Good", "Needs renovation"];
export const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Zakho"];
export const DISTRICTS = ["Ankawa", "Italian Village", "Dream City", "Empire World", "English Village", "Downtown", "Naz City"];
export const FURNISHING = ["Unfurnished", "Semi-furnished", "Fully furnished"];
export const ORIENTATIONS = ["North facing", "South facing", "East facing", "West facing"];

/* Assignable agents come from the live roster via useAssignableAgents()
   (add-property-app.tsx) — never from a static list, so the picker always
   matches the Agents page in names, photos, and verification. */
export interface ApAgent { id: string; name: string; area: string; phone: string; avatar: string }

/* Amenity groups — the canonical order + grouping shared 1:1 with the mobile
   listing form (apps/mobile/components/listing/data.ts). Web and mobile are
   separate build roots and can't import a common module, so the two AMENITIES
   lists must be kept in lockstep by hand: same labels, same order, same groups. */
export type AmenityGroup = "comfort" | "security" | "outdoor" | "building";
export const AMENITY_GROUPS: { key: AmenityGroup; labelKey: string }[] = [
  { key: "comfort", labelKey: "admin.ap.am.group.comfort" },
  { key: "security", labelKey: "admin.ap.am.group.security" },
  { key: "outdoor", labelKey: "admin.ap.am.group.outdoor" },
  { key: "building", labelKey: "admin.ap.am.group.building" },
];

export interface Amenity { label: string; icon: IconName; labelKey: string; group: AmenityGroup }
export const AMENITIES: Amenity[] = [
  // Comfort
  { label: "Smart home", icon: "house-wifi", labelKey: "admin.ap.am.smartHome", group: "comfort" },
  { label: "Central AC", icon: "air-vent", labelKey: "admin.ap.am.ac", group: "comfort" },
  { label: "Maid room", icon: "bed-single", labelKey: "admin.ap.am.maid", group: "comfort" },
  { label: "Fireplace", icon: "flame", labelKey: "admin.ap.am.fireplace", group: "comfort" },
  // Security & Utilities
  { label: "Security", icon: "shield-check", labelKey: "admin.ap.am.security", group: "security" },
  { label: "CCTV", icon: "cctv", labelKey: "admin.ap.am.cctv", group: "security" },
  { label: "Generator", icon: "zap", labelKey: "admin.ap.am.generator", group: "security" },
  { label: "Elevator", icon: "arrow-up-down", labelKey: "admin.ap.am.elevator", group: "security" },
  // Outdoor & Leisure
  { label: "Swimming pool", icon: "waves", labelKey: "admin.ap.am.pool", group: "outdoor" },
  { label: "Garden", icon: "trees", labelKey: "admin.ap.am.garden", group: "outdoor" },
  { label: "Gym", icon: "dumbbell", labelKey: "admin.ap.am.gym", group: "outdoor" },
  { label: "Balcony", icon: "fence", labelKey: "admin.ap.am.balcony", group: "outdoor" },
  { label: "BBQ area", icon: "utensils-crossed", labelKey: "admin.ap.am.bbq", group: "outdoor" },
  { label: "Play area", icon: "blocks", labelKey: "admin.ap.am.play", group: "outdoor" },
  // Building & Storage
  { label: "Storage room", icon: "package", labelKey: "admin.ap.am.storage", group: "building" },
  { label: "Laundry room", icon: "washing-machine", labelKey: "admin.ap.am.laundry", group: "building" },
];

export const GUIDELINE_KEYS = [
  "admin.ap.guide.quality",
  "admin.ap.guide.count",
  "admin.ap.guide.lead",
  "admin.ap.guide.blurry",
  "admin.ap.guide.watermark",
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
  project: string;
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
  beds: 0,
  baths: 0,
  parking: 0,
  condition: "",
  furnished: "no",
  year: "",
  short: "",
  furnishing: "",
  floors: 0,
  orientation: "",
  amenities: [],
  customAmenities: [],
  highlights: "",
  city: "",
  district: "",
  project: "",
  street: "",
  building: "",
  lat: "",
  lng: "",
  locNotes: "",
  tourUrl: "",
  ownerName: "",
  ownerPhone: "",
  ownerEmail: "",
  agent: "",
  internalNotes: "",
};
