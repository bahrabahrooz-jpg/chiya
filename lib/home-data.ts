/**
 * Chiya Estate — homepage content.
 *
 * Property-backed content (featured listings, category counts, city counts) is
 * derived from the admin catalog's public subset (lib/site-properties), so the
 * homepage always matches the admin and the search results. Agents likewise come
 * from lib/site-agents. Only the marketing copy (pillars, testimonials) and the
 * decorative tile imagery are authored here.
 */

import { SITE_PROPERTIES, publicCountByCity, publicCountByType, type SiteProperty } from "@/lib/site-properties";
import { FEATURED_SITE_AGENTS, portraitUrl, type SiteAgent } from "@/lib/site-agents";

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
const toHomeAgent = (a: SiteAgent): Agent => ({
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
export const agents: Agent[] = FEATURED_SITE_AGENTS.map(toHomeAgent);

export interface Listing {
  id: string;
  title: string;
  address: string;
  price: string;
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

const commas = (n: number) => "$" + n.toLocaleString("en-US");

/* Featured grid = the available (Published) catalog listings, featured first,
   capped at six. Same records the admin manages and the search page shows. */
const toHomeListing = (p: SiteProperty): Listing => ({
  id: p.id,
  title: p.title,
  address: p.address,
  price: commas(p.price),
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
export const listings: Listing[] = [...SITE_PROPERTIES]
  .sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
  .slice(0, 6)
  .map(toHomeListing);

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
const typeCounts = publicCountByType();
export const categories: Category[] = CATEGORY_DEFS.map((c) => ({
  name: c.name,
  count: typeCounts[c.type] ?? 0,
  icon: c.icon,
  image: c.image,
}));

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
const cityCounts = publicCountByCity();
export const locations: Location[] = ["Erbil", "Sulaymaniyah", "Duhok"].map((city) => ({
  city,
  count: cityCounts[city] ?? 0,
  image: CITY_IMAGES[city],
}));

export interface Pillar {
  icon: string;
  title: string;
  desc: string;
}

export const pillars: Pillar[] = [
  { icon: "badge-check", title: "Verified agents", desc: "Every agent is ID-checked and licence-verified before they can list with Chiya." },
  { icon: "shield-check", title: "Admin-approved listings", desc: "Each property is reviewed and approved by our team — no duplicates, no ghost listings." },
  { icon: "sparkles", title: "Luxury properties", desc: "A hand-curated collection of Kurdistan's most exceptional homes and estates." },
  { icon: "lock", title: "Secure platform", desc: "Encrypted messaging, protected viewings, and no-obligation enquiries throughout." },
];

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  avatar: string;
  quote: string;
}

export const testimonials: Testimonial[] = [
  { name: "Hawar & Nyan", location: "Bought in Dream City, Erbil", rating: 5, avatar: "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=160&h=160&fit=crop", quote: "Our Chiya agent understood exactly what we wanted. Every viewing was a home we genuinely loved — we signed within three weeks." },
  { name: "Sara Aziz", location: "Rented in Italian Village, Erbil", rating: 5, avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=160&h=160&fit=crop", quote: "As someone relocating from abroad, the verified listings gave me real confidence. No surprises, no wasted trips." },
  { name: "Karwan Jamal", location: "Sold a villa in Sarchnar, Sulaymaniyah", rating: 5, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&h=160&fit=crop", quote: "Listing with Chiya brought serious, pre-qualified buyers only. The whole process felt premium from start to finish." },
];
