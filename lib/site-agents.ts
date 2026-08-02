/**
 * Public-facing agent catalog, derived from the admin's single source of truth.
 *
 * The website shows the same 7 agents the admin manages (app/admin/_data/catalog),
 * and every number on an agent card/profile is computed from live records:
 * - rating / review count ← approved reviews in the shared moderation queue
 * - listings / sold / rented ← the properties assigned to the agent
 * Pending / Rejected reviews never surface here — same rule as the admin
 * agent-detail page (approvedReviewsFor).
 */

import { AGENTS, PROPERTIES, withAgentStats, slugify, type AgentRecord, type PropertyRecord } from "@/app/admin/_data/catalog";
import { approvedReviewsFor, buildAgentReviews } from "@/app/admin/_agent-detail/data";

export interface SiteAgent {
  id: string; // route slug, e.g. "lana-aziz"
  name: string;
  city: string;
  area: string;
  photo: string; // base Unsplash URL without params; "" → initials avatar
  verified: boolean;
  active: boolean;
  featured: boolean; // admin curation flag — leads the homepage "Featured agents"
  rating: number; // mean of approved review stars (0 when none)
  reviewCount: number;
  listings: number;
  sold: number;
  rented: number;
  experience: number; // years
  since: number; // year they started
  languages: string[];
  phone: string;
  whatsapp: string; // digits only, for wa.me links
  email: string;
}

const THIS_YEAR = 2026; // catalog anchor year (TODAY = Jun 30, 2026)

/** Bare photo URL (no sizing params) so each surface can pick its own crop. */
const basePhoto = (img: string | null) => (img ? img.split("?")[0] : "");
/** Size a base Unsplash photo URL as a face-cropped portrait. */
export const portraitUrl = (photo: string, w: number, h = w) =>
  photo ? `${photo}?auto=format&fit=crop&crop=faces&w=${w}&h=${h}&q=70` : "";

/* Public listing count per agent = their Published (available) listings only.
   Pending listings are admin-only and never shown publicly, so they don't count
   toward the agent's public "listings" figure either — keeping the directory,
   home cards, profile, and mobile all in agreement. */
function publishedCountByAgent(properties: PropertyRecord[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of properties) {
    if (p.status === "Published" && p.agent) counts[p.agent.name] = (counts[p.agent.name] ?? 0) + 1;
  }
  return counts;
}

/* ----------------------------------------------------------------------------
   Record-parameterized derivation — the SAME transform, taking live agent +
   property records so the public site reflects admin edits without a reload
   (lib/public-catalog.ts). The seed constants below apply it to the static
   catalog, so the seed-based Server-Component pages keep working unchanged.

   Only Verified agents are public. Pending agents (still under review) are
   admin-only — they never appear in the directory or get a public profile, so a
   Pending slug resolves to `undefined` here and its /agents/[id] route 404s. */
export function deriveSiteAgents(agents: AgentRecord[], properties: PropertyRecord[]): SiteAgent[] {
  const publishedListingCount = publishedCountByAgent(properties);
  return withAgentStats(agents, properties)
    .filter((a) => a.verification === "Verified")
    .map((a) => {
      const reviews = approvedReviewsFor(a.name);
      const rating = reviews.length ? Number((reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)) : 0;
      const experience = Number(a.experience) || 1;
      return {
        id: slugify(a.name),
        name: a.name,
        city: a.city,
        area: a.area,
        photo: basePhoto(a.img),
        verified: a.verification === "Verified",
        active: a.status === "Active",
        featured: a.featured,
        rating,
        reviewCount: reviews.length,
        listings: publishedListingCount[a.name] ?? 0,
        sold: a.sold,
        rented: a.rented,
        experience,
        since: THIS_YEAR - experience,
        languages: a.languages ?? [],
        phone: a.phone,
        whatsapp: a.phone.replace(/\D/g, ""),
        email: a.email,
      };
    });
}

/* Home-page "Featured agents" — verified, active agents the admin has curated
   as featured (admin.agents Feature action). Pure curation: no auto-fill. */
export const deriveFeaturedAgents = (agents: SiteAgent[]): SiteAgent[] => agents.filter((a) => a.verified && a.active && a.featured);

export const SITE_AGENTS: SiteAgent[] = deriveSiteAgents(AGENTS, PROPERTIES);

export function getSiteAgent(id: string): SiteAgent | undefined {
  return SITE_AGENTS.find((a) => a.id === id);
}

export const FEATURED_SITE_AGENTS: SiteAgent[] = deriveFeaturedAgents(SITE_AGENTS);

/* ----------------------------------------------------------------------------
   Review cards for a public agent profile — the agent's approved reviews with
   the same deal-context line the admin agent-detail resolves from live records
   (dealKey is an i18n key like "admin.ad.deal.bought", present in en/ar/ku).
   ------------------------------------------------------------------------- */
export interface SiteReview {
  id: string;
  name: string; // reviewer (member) — members carry no photo, initials render
  stars: number;
  daysAgo: number;
  when: string; // formatted submit date, fallback when no relative label
  dealKey?: string;
  dealTitle?: string;
  text: string;
}

export function siteReviewsFor(name: string): SiteReview[] {
  const records = approvedReviewsFor(name);
  const { reviews } = buildAgentReviews(PROPERTIES, name); // same order as records
  return records.map((r, i) => ({
    id: r.id,
    name: r.memberName,
    stars: r.stars,
    daysAgo: r.daysAgo,
    when: r.submitted,
    dealKey: reviews[i]?.deal?.key,
    dealTitle: reviews[i]?.deal?.title,
    text: r.text,
  }));
}
