/**
 * Featured reviews — the pool the homepage testimonial band draws from.
 *
 * That band used to be free text an admin typed at /admin/content: invented
 * names, stock faces, five hardcoded stars, under a heading promising "real
 * stories". It now shows real approved reviews, so the admin curates *which*
 * reviews lead the homepage and can no longer author the words, the name, or
 * the rating.
 *
 * Composed entirely from the existing public derivation (siteReviewsFor), so a
 * featured card and the same review on the agent's own profile can never
 * disagree. Moderation still happens in one place — /admin/reviews.
 */

import { SITE_AGENTS, siteReviewsFor, type SiteReview } from "./site-agents";

export interface FeaturedReview extends SiteReview {
  agentName: string; // who the review is about — the card's fallback context line
}

/** Every approved review about a public (Verified) agent, newest first.
    Reviews about Pending agents stay admin-only, so they aren't featurable. */
export const APPROVED_REVIEW_POOL: FeaturedReview[] = SITE_AGENTS.flatMap((a) =>
  siteReviewsFor(a.name).map((r) => ({ ...r, agentName: a.name })),
).sort((x, y) => x.daysAgo - y.daysAgo);

/** How many cards the homepage band holds (its grid is three across). */
export const HOME_FEATURED_COUNT = 3;

/** Resolve chosen ids into cards, in the order they were chosen. An id that no
    longer names an approved review — rejected since, deleted, or an agent that
    lost Verified — is skipped rather than rendered stale. */
export function featuredReviews(ids: string[]): FeaturedReview[] {
  return ids
    .map((id) => APPROVED_REVIEW_POOL.find((r) => r.id === id))
    .filter((r): r is FeaturedReview => !!r);
}

/* The band's out-of-the-box selection: the most recent 5-star reviews, each
   about a different agent so it doesn't read as one agent's fan mail. Topped up
   from the rest of the pool if distinct-agent 5-stars run short. Deterministic,
   because SSR and the first client render have to agree (lib/site-content). */
function seedFeatured(): string[] {
  const picked: FeaturedReview[] = [];
  const take = (candidates: FeaturedReview[], distinctAgents: boolean) => {
    for (const r of candidates) {
      if (picked.length === HOME_FEATURED_COUNT) return;
      if (picked.some((p) => p.id === r.id)) continue;
      if (distinctAgents && picked.some((p) => p.agentName === r.agentName)) continue;
      picked.push(r);
    }
  };
  take(APPROVED_REVIEW_POOL.filter((r) => r.stars === 5), true);
  take(APPROVED_REVIEW_POOL, false);
  return picked.map((r) => r.id);
}

export const DEFAULT_FEATURED_REVIEW_IDS: string[] = seedFeatured();

/** Resolve the CMS field (lib/site-content `home.featuredReviews`) into cards.
    `null` means the admin never curated the band and gets the default pick;
    `[]` is a deliberate "show nothing" and stays empty. */
export function homeFeaturedReviews(ids: string[] | null): FeaturedReview[] {
  return featuredReviews(ids ?? DEFAULT_FEATURED_REVIEW_IDS);
}
