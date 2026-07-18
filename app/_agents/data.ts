/** Agent Directory — the admin catalog's roster, derived via lib/site-agents
    so the directory always matches the admin: same people, and rating /
    reviews / listings counted from live records (approved reviews, assigned
    properties) instead of invented aggregates. */

import { SITE_AGENTS, portraitUrl } from "@/lib/site-agents";

export interface DirAgent {
  id: string;
  name: string;
  city: string;
  photo: string;
  verified: boolean;
  rating: number;
  reviews: number;
  listings: number;
  sold: number;
  experience: number;
  since: number;
  languages: string[];
  phone: string;
  whatsapp: string;
}

export const agents: DirAgent[] = SITE_AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  city: a.city,
  photo: portraitUrl(a.photo, 240),
  verified: a.verified,
  rating: a.rating,
  reviews: a.reviewCount,
  listings: a.listings,
  sold: a.sold + a.rented,
  experience: a.experience,
  since: a.since,
  languages: a.languages,
  phone: a.phone,
  whatsapp: a.whatsapp,
}));

export const cities = ["Erbil", "Sulaymaniyah", "Duhok"];

/* Language + experience filter vocab — mirrors the mobile Agents tab
   (apps/mobile/components/home/data.ts) so both surfaces filter identically.
   Language labels reuse the admin i18n keys `admin.agents.langOpt.<Value>`. */
export const languageOpts = ["Kurdish", "Arabic", "English", "Turkish", "Persian"];

export interface ExpBand {
  value: string;
}
export const experienceBands: ExpBand[] = [
  { value: "0-5" },
  { value: "5-10" },
  { value: "10-15" },
  { value: "15+" },
];

/** True when an agent's years of experience fall within the selected band. */
export const experienceMatch = (years: number, band: string) => {
  if (band === "0-5") return years < 5;
  if (band === "5-10") return years >= 5 && years < 10;
  if (band === "10-15") return years >= 10 && years < 15;
  if (band === "15+") return years >= 15;
  return true;
};

/* Filter state — same shape as the mobile Agents tab's AgentFilters. */
export interface AgentFilters {
  cities: string[];
  languages: string[];
  experience: string;
}
export const emptyAgentFilters: AgentFilters = { cities: [], languages: [], experience: "" };
export const countAgentFilters = (f: AgentFilters) =>
  f.cities.length + f.languages.length + (f.experience ? 1 : 0);

/** Handlers passed to the left filter panel (and mobile drawer). */
export interface AgentFilterHandlers {
  toggleCity: (v: string) => void;
  toggleLanguage: (v: string) => void;
  setExperience: (v: string) => void;
}

export interface SortOpt {
  value: string;
  label: string;
  icon: string;
}
export const sortOptions: SortOpt[] = [
  { value: "default", label: "Default", icon: "sparkles" },
  { value: "rating", label: "Highest ratings", icon: "star" },
  { value: "experience", label: "Most experience", icon: "calendar-check" },
  { value: "listings", label: "Most listings", icon: "building-2" },
];
