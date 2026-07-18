/* Approved agent reviews — mirrored from app/admin/_reviews/data.ts.
   Only Approved reviews appear on a public profile (Pending / Rejected never
   surface). Review text and reviewer names are canonical data (English, same as
   the admin and website); the screen localizes only the relative "when" label
   from `daysAgo`. Keep in sync with the admin REVIEW_SPECS. */

export interface AgentReview {
  id: string;
  name: string; // reviewer (member) — canonical spelling, initials avatar
  stars: number;
  daysAgo: number;
  text: string;
}

export const AGENT_REVIEWS: Record<string, AgentReview[]> = {
  "lana-aziz": [
    { id: "RV-4198", name: "Zana Ibrahim", stars: 5, daysAgo: 5, text: "Smooth process from viewing to keys. Deep knowledge of the local market." },
    { id: "RV-4197", name: "Nma Rashid", stars: 4, daysAgo: 12, text: "Kept us updated at every step. Felt like we had someone genuinely on our side." },
    { id: "RV-4194", name: "Shilan Aziz", stars: 5, daysAgo: 45, text: "Great negotiator — got us a price we didn't think was possible. Highly recommend." },
  ],
  "karwan-mahmoud": [
    { id: "RV-4191", name: "Chiman Rasul", stars: 5, daysAgo: 20, text: "Very knowledgeable about the neighbourhood and made the whole process stress-free." },
    { id: "RV-4190", name: "Kani Omar", stars: 4, daysAgo: 15, text: "Solid advice on pricing and timing. We felt well looked after throughout." },
  ],
  "sara-hama": [
    { id: "RV-4196", name: "Aland Tariq", stars: 5, daysAgo: 3, text: "Went above and beyond to arrange viewings around our schedule. Thank you!" },
    { id: "RV-4188", name: "Avan Mustafa", stars: 5, daysAgo: 2, text: "Patient and honest throughout. Would happily recommend to friends and family." },
  ],
  "rawa-jamal": [
    { id: "RV-4195", name: "Tara Botan", stars: 3, daysAgo: 33, text: "Good experience overall. Communication could have been a bit faster at times." },
    { id: "RV-4187", name: "Rebwar Tofiq", stars: 4, daysAgo: 100, text: "Helpful, but the paperwork took a little longer than expected." },
  ],
  "diyar-salih": [
    { id: "RV-4189", name: "Berivan Salar", stars: 4, daysAgo: 40, text: "Friendly and reliable. Handled everything from start to finish with real care." },
  ],
  // Bilal Noori / Hana Rashid — pending agents, no approved reviews yet (empty state).
};

export const reviewsForAgent = (id: string): AgentReview[] => AGENT_REVIEWS[id] ?? [];
