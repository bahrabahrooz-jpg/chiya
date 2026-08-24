/** Agent Profile — built per-agent from the shared catalog so the public
    profile shows the same person, listings, and approved reviews the admin
    manages. profileFor(slug) returns everything the profile page renders, or
    null for an unknown slug (the route then 404s). */

import { PROPERTIES } from "@/app/admin/_data/catalog";
import type { Money } from "@/lib/money";
import { getSiteAgent, portraitUrl, siteReviewsFor, type SiteAgent } from "@/lib/site-agents";

/* ---- shapes the profile page renders ---- */
export interface ProfileAgent {
  id: string;
  name: string;
  verified: boolean;
  city: string;
  title: string;
  photo: string;
  languages: string[];
  experience: number;
  rating: number;
  reviews: number;
  listings: number;
  sold: number;
  phone: string;
  whatsapp: string;
  email: string;
}

export interface Metric {
  icon: string;
  value: string;
}

export interface Area {
  name: string;
}

export interface ProListing {
  id: string;
  title: string;
  address: string;
  deal: "buy" | "rent";
  price: Money;
  status: string;
  featured?: boolean;
  beds: number;
  baths: number;
  area: number;
  photoCount: number;
  since: number;
  cover: string;
}

export interface Sold {
  id: string;
  title: string;
  address: string;
  price: Money;
  deal: string;
  beds: number;
  baths: number;
  area: number;
  when: string;
  cover: string;
}

/** A review card. The component renders the star rating under the name and the
    relative "when"; the deal that prompted the review is no longer shown. */
export interface Review {
  id: string;
  name: string;
  avatar?: string;
  stars: number;
  daysAgo: number;
  when: string; // formatted date fallback
  text: string;
}

export interface SortOpt {
  value: string;
  label: string;
  icon: string;
}
export const sortOptions: SortOpt[] = [
  { value: "default", label: "Default", icon: "sparkles" },
  { value: "newest", label: "Newest", icon: "sparkles" },
  { value: "price-asc", label: "Price: low to high", icon: "arrow-up-wide-narrow" },
  { value: "price-desc", label: "Price: high to low", icon: "arrow-down-wide-narrow" },
  { value: "recommended", label: "Featured", icon: "sparkles" },
];

export interface AgentProfile {
  agent: ProfileAgent;
  metrics: Metric[];
  about: string[];
  intro: string;
  specialties: string[];
  areas: Area[];
  listings: ProListing[];
  sold: Sold[];
  reviews: Review[];
}

/* Property type → the specialty chip label shown on the profile. */
const TYPE_SPECIALTY: Record<string, string> = {
  Villa: "Luxury villas",
  Apartment: "Apartments",
  House: "Houses",
  Office: "Commercial properties",
  Land: "Land & investment",
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};
/* Deterministic photo count so a listing card always shows the same number. */
const photoCountFor = (id: string) => 12 + (hash(id) % 20);
/** Authored bio → paragraphs (blank line separates), or null when it's empty
    and the caller should fall back to the generated copy. */
export function splitParagraphs(bio: string): string[] | null {
  const paras = bio
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.length ? paras : null;
}

/* "Jun 20, 2026" → "Jun 2026" for the recently-sold "when" line. */
const monthYear = (date: string) => {
  const m = /^([A-Za-z]{3})\s+\d+,\s*(\d+)$/.exec(date);
  return m ? `${m[1]} ${m[2]}` : date;
};

function buildProfile(a: SiteAgent): AgentProfile {
  const handled = PROPERTIES.filter((p) => p.agent?.name === a.name);
  const live = handled.filter((p) => p.status === "Published");
  const closed = handled.filter((p) => p.status === "Sold" || p.status === "Rented");
  const firstName = a.name.split(" ")[0];

  const specialties = [...new Set(handled.map((p) => TYPE_SPECIALTY[p.type]).filter(Boolean))];
  if (!specialties.length) specialties.push("Residential properties");

  const areaNames = [...new Set([a.area, ...handled.map((p) => p.area)])].slice(0, 6);

  const listings: ProListing[] = live.map((p) => ({
    id: p.id,
    title: p.title,
    address: `${p.area}, ${p.city}`,
    deal: p.listing === "rent" ? "rent" : "buy",
    price: p.price,
    // Card pill only ever shows the deal (For Sale / For Rent) — the featured
    // flag drives the sort, not the badge.
    status: p.listing === "rent" ? "For Rent" : "For Sale",
    featured: p.featured,
    beds: p.beds,
    baths: p.baths,
    area: p.size,
    photoCount: photoCountFor(p.id),
    since: p.daysAgo,
    cover: p.img,
  }));

  const sold: Sold[] = closed.map((p) => ({
    id: p.id,
    title: p.title,
    address: `${p.area}, ${p.city}`,
    price: p.price,
    deal: p.status, // "Sold" | "Rented"
    beds: p.beds,
    baths: p.baths,
    area: p.size,
    when: monthYear(p.updated),
    cover: p.img,
  }));

  const reviews: Review[] = siteReviewsFor(a.name).map((r) => ({
    id: r.id,
    name: r.name,
    stars: r.stars,
    daysAgo: r.daysAgo,
    when: r.when,
    text: r.text,
  }));

  const dealsCount = a.sold + a.rented;
  const specialtyList = specialties.map((s) => s.toLowerCase()).join(", ");
  /* Fallbacks: agents whose profile copy hasn't been written in the admin still
     get a readable About section, derived from their live record. */
  const generatedAbout = [
    `${a.name} is a verified property consultant based in ${a.city}, specialising in ${specialtyList} across the Kurdistan Region. With ${a.experience} years of experience${dealsCount ? ` and ${dealsCount} completed ${dealsCount === 1 ? "deal" : "deals"} on Chiya` : ""}, ${firstName} guides buyers, sellers, and renters through confident, well-informed moves — from first viewing to handover of keys.`,
    `${firstName}'s approach is straightforward and client-first: clear advice backed by real local market knowledge, and steady communication at every step. Clients value ${firstName}'s honesty, responsiveness, and deep familiarity with ${a.area} and the surrounding districts of ${a.city}.`,
  ];
  const generatedIntro = `${a.name} specialises in ${specialtyList} across ${a.city} and the wider Kurdistan Region, backed by ${a.experience} years of local market experience.`;

  const intro = a.headline.trim() || generatedIntro;
  const about = splitParagraphs(a.bio) ?? generatedAbout;

  return {
    agent: {
      id: a.id,
      name: a.name,
      verified: a.verified,
      city: `${a.city}, Kurdistan`,
      title: a.verified ? "Senior property consultant" : "Property consultant",
      photo: portraitUrl(a.photo, 640, 720),
      languages: a.languages,
      experience: a.experience,
      rating: a.rating,
      reviews: a.reviewCount,
      listings: live.length,
      sold: dealsCount,
      phone: a.phone,
      whatsapp: a.whatsapp,
      email: a.email,
    },
    metrics: [
      { icon: "building-2", value: String(live.length) },
      { icon: "key", value: String(dealsCount) },
      { icon: "calendar-check", value: String(a.experience) },
      { icon: "star", value: a.rating > 0 ? a.rating.toFixed(1) : "—" },
    ],
    about,
    intro,
    specialties,
    areas: areaNames.map((name) => ({ name })),
    listings,
    sold,
    reviews,
  };
}

export function profileFor(id: string): AgentProfile | null {
  const a = getSiteAgent(id);
  return a ? buildProfile(a) : null;
}
