/**
 * Chiya Estate — homepage content.
 *
 * Property-backed content (featured listings, category counts, city counts) is
 * derived from the admin catalog's public subset (lib/site-properties), so the
 * homepage always matches the admin and the search results. Agents likewise come
 * from lib/site-agents. Only the marketing copy (pillars, testimonials) and the
 * decorative tile imagery are authored here.
 */

import type { IconName } from "@/components/ui/icon";
import { SITE_PROPERTIES, publicCountByCity, publicCountByType, type SiteProperty } from "@/lib/site-properties";
import { FEATURED_SITE_AGENTS, portraitUrl, type SiteAgent } from "@/lib/site-agents";
import type { Money } from "@/lib/money";

const img = (id: string, w = 1000, h = 750) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;

export interface Agent {
  id: string;
  name: string;
  city: string;
  verified: boolean;
  avatar: string;
  rating: number;
  reviews: number;
  listings: number;
  sales: number;
  experience: number;
}

/* Homepage agents = the admin catalog's verified agents in good standing,
   with rating / reviews / listings counted from live records (lib/site-agents). */
export const toHomeAgent = (a: SiteAgent): Agent => ({
  id: a.id,
  name: a.name,
  city: a.city,
  verified: a.verified,
  avatar: portraitUrl(a.photo, 200),
  rating: a.rating,
  reviews: a.reviewCount,
  listings: a.listings,
  sales: a.sold + a.rented,
  experience: a.experience,
});
/** Home "Featured agents" from a derived featured-agent set (live or seed). */
export const homeAgents = (featured: SiteAgent[]): Agent[] => featured.map(toHomeAgent);
export const agents: Agent[] = homeAgents(FEATURED_SITE_AGENTS);

export interface Listing {
  id: string;
  title: string;
  address: string;
  /** The listing's own price. A `Money`, not a pre-rendered string: this module
      is evaluated once at import time, with no language in scope, so a string
      built here could never localise its digits or place the right marker. */
  price: Money;
  period?: string;
  status: string;
  featured?: boolean;
  beds: number;
  baths: number;
  area: number;
  type: string;
  photoCount: number;
  cover: string;
}

/* Featured grid = the available (Published) catalog listings, featured first,
   capped at six. Same records the admin manages and the search page shows. */
const toHomeListing = (p: SiteProperty): Listing => ({
  id: p.id,
  title: p.title,
  address: p.address,
  price: p.price,
  period: p.deal === "rent" ? "mo" : undefined,
  status: p.status,
  featured: p.featured,
  beds: p.beds,
  baths: p.baths,
  area: p.size,
  type: p.type,
  photoCount: p.photoCount,
  cover: p.cover,
});
/* Pure curation: only admin-featured Published listings appear, capped at six.
   No auto-fill — an empty result hides the homepage "Featured" section. */
/** Home "Featured properties" grid from a derived featured-listing set. */
export const homeListings = (featured: SiteProperty[]): Listing[] => featured.slice(0, 6).map(toHomeListing);
export const listings: Listing[] = homeListings(SITE_PROPERTIES.filter((p) => p.featured));

export interface Category {
  name: string;
  count: number;
  icon: string;
  image: string;
}

/* Category tiles — the five property types with counts from the available
   listings (the Categories component keys `TYPE_BY_CAT` off these names). */
const CATEGORY_DEFS: { name: string; type: string; icon: string; image: string }[] = [
  { name: "Apartments", type: "apartment", icon: "building-2", image: img("1545324418-cc1a3fa10c00", 700, 900) },
  { name: "Houses", type: "house", icon: "house", image: img("1568605114967-8130f3a36994", 700, 900) },
  { name: "Land", type: "land", icon: "trees", image: img("1500382017468-9049fed747ef", 700, 900) },
  { name: "Office", type: "office", icon: "briefcase", image: img("1497366754035-f200968a6e72", 700, 900) },
  { name: "Villas", type: "villa", icon: "home", image: img("1613490493576-7fde63acd811", 700, 900) },
];
/** Category tiles with counts from a per-type tally (live or seed). */
export const homeCategories = (typeCounts: Record<string, number>): Category[] =>
  CATEGORY_DEFS.map((c) => ({
    name: c.name,
    count: typeCounts[c.type] ?? 0,
    icon: c.icon,
    image: c.image,
  }));
export const categories: Category[] = homeCategories(publicCountByType());

export interface Location {
  city: string;
  count: number;
  image: string;
}

/* City tiles — the three catalog cities with live available-listing counts.
   The Locations component pulls the display name + blurb from i18n by city. */
const CITY_IMAGES: Record<string, string> = {
  Erbil: img("1599423300746-b62533397364", 900, 700),
  Duhok: img("1570168007204-dfb528c6958f", 900, 700),
  Sulaymaniyah: img("1518684079-3c830dcef090", 900, 700),
};
const HOME_CITIES = ["Erbil", "Sulaymaniyah", "Duhok"];
/** City tiles with counts from a per-city tally (live or seed). */
export const homeLocations = (cityCounts: Record<string, number>): Location[] =>
  HOME_CITIES.map((city) => ({
    city,
    count: cityCounts[city] ?? 0,
    image: CITY_IMAGES[city],
  }));
export const locations: Location[] = homeLocations(publicCountByCity());

/* The "Why Chiya" pillar copy is now CMS-managed (lib/site-content, edited at
   /admin/content). Only the fixed pillar icons live here, in card order. */
export const PILLAR_ICONS: IconName[] = ["badge-check", "shield-check", "sparkles", "lock"];

/* The testimonial band carries no data here any more: it shows real approved
   reviews the admin featured (lib/site-reviews), and its reviewers are members,
   who deliberately carry no photo — the stock portraits that used to sit here
   were dressing on invented quotes. */
