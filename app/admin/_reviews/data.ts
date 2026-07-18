import type { BadgeVariant } from "@/components/ui/badge";
import { MEMBERS, AGENTS, TOP_AGENT, PROPERTIES, daysAgoFrom } from "../_data/catalog";
import { VIEWINGS } from "../_viewings/data";

export const ITEMS_PER_PAGE = 10;

/* ----------------------------------------------------------------------------
   Review record. Reviews are submitted by members from the app/website about an
   agent. A submitted review is NOT public until an admin approves it — every new
   review lands here as "Pending".
   ------------------------------------------------------------------------- */
export type ReviewStatus = "Pending" | "Approved" | "Rejected";

export interface ReviewRecord {
  id: string;
  memberName: string;
  memberId: string;
  memberImg: string | null;
  agentName: string;
  agentImg: string | null;
  stars: number; // 1..5
  text: string;
  submitted: string; // formatted date
  daysAgo: number;
  status: ReviewStatus;
}

export const REVIEW_STATUS: Record<ReviewStatus, { variant: BadgeVariant; dot: boolean }> = {
  Pending: { variant: "warning", dot: true },
  Approved: { variant: "success", dot: true },
  Rejected: { variant: "error", dot: true },
};

export const STATUS_TABS: { id: string; label: string }[] = [
  { id: "", label: "All" },
  { id: "Pending", label: "Pending" },
  { id: "Approved", label: "Approved" },
  { id: "Rejected", label: "Rejected" },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const TODAY = new Date(2026, 5, 30); // matches the catalog anchor (Jun 30, 2026)
const dateFromDaysAgo = (d: number) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() - d);
  return MONTHS_SHORT[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear();
};

const REVIEW_TEXTS = [
  "Incredibly professional and responsive — found us the perfect home within days.",
  "Smooth process from viewing to keys. Deep knowledge of the local market.",
  "Patient and honest throughout. Would happily recommend to friends and family.",
  "Answered every question quickly and never pushed us toward anything. Truly helpful.",
  "Great negotiator — got us a price we didn't think was possible. Highly recommend.",
  "Very knowledgeable about the neighbourhood and made the whole process stress-free.",
  "Kept us updated at every step. Felt like we had someone genuinely on our side.",
  "Helpful, but the paperwork took a little longer than expected.",
  "Good experience overall. Communication could have been a bit faster at times.",
  "Went above and beyond to arrange viewings around our schedule. Thank you!",
  "Friendly and reliable. Handled everything from start to finish with real care.",
  "Solid advice on pricing and timing. We felt well looked after throughout.",
  // Rejection-worthy submissions (12+): gibberish / spam with no relation to the
  // agent or the platform — negative-but-genuine feedback is NOT rejected.
  "asdf sdfgh test test 123 ,,,,, jkjkjk hhhhhh ok ok ok",
  "Best prices on furniture!! Call 0750 555 0123 or visit dijla-deals.example for 50% OFF sofas and beds!!!",
];

/* Hand-curated seed reviews (14) built on the real member + agent roster so the
   names, avatars and cross-links stay consistent with the rest of the admin.
   Coverage: Pending / Approved / Rejected each present, star ratings 1–5.
   Rejected entries carry rejection-worthy text (gibberish / spam) so the
   moderation decision is self-explanatory — honest negative feedback stays.
   Invariant: the agent surface signs in as TOP_AGENT and shows them reviews
   about themselves, so several reviews (spanning all three statuses) must
   target TOP_AGENT — here that's Lana Aziz by construction. */
interface ReviewSpec {
  id: string;
  member: string;
  agent: string;
  stars: number;
  status: ReviewStatus;
  daysAgo: number;
  text: number; // index into REVIEW_TEXTS
}
/* Every review is grounded: the member has a real relationship with the agent
   (a listing the agent handles, a purchase/tenancy the agent closed, or a past
   viewing the agent hosted) that predates the review — validated below. */
const REVIEW_SPECS: ReviewSpec[] = [
  { id: "RV-4200", member: "Berivan Salar", agent: "Lana Aziz", stars: 5, status: "Pending", daysAgo: 1, text: 0 }, // viewed CH-3187 with Lana 4d ago, bought it today
  { id: "RV-4199", member: "Dara Kamal", agent: "Karwan Mahmoud", stars: 4, status: "Pending", daysAgo: 2, text: 3 }, // completed viewing VW-1095 6d ago (prospective looker)
  { id: "RV-4198", member: "Zana Ibrahim", agent: "Lana Aziz", stars: 5, status: "Approved", daysAgo: 5, text: 1 }, // bought CH-3185 via Lana 18d ago
  { id: "RV-4197", member: "Nma Rashid", agent: "Lana Aziz", stars: 4, status: "Approved", daysAgo: 12, text: 6 }, // landlord of Lana-handled CH-3199 / CH-3183
  { id: "RV-4196", member: "Aland Tariq", agent: "Sara Hama", stars: 5, status: "Approved", daysAgo: 3, text: 9 }, // moved into CH-3182 (Sara Hama) 5d ago
  { id: "RV-4195", member: "Tara Botan", agent: "Rawa Jamal", stars: 3, status: "Approved", daysAgo: 33, text: 8 }, // landlord of Rawa-handled CH-3191 / CH-3180
  { id: "RV-4194", member: "Shilan Aziz", agent: "Lana Aziz", stars: 5, status: "Approved", daysAgo: 45, text: 4 }, // seller of Lana-handled CH-3200 / CH-3187
  { id: "RV-4193", member: "Sara Amin", agent: "Lana Aziz", stars: 1, status: "Rejected", daysAgo: 8, text: 12 }, // her viewing VW-1089 with Lana was cancelled 12d ago — rejected as gibberish, not for being negative
  { id: "RV-4192", member: "Kani Omar", agent: "Sara Hama", stars: 5, status: "Rejected", daysAgo: 60, text: 13 }, // landlord of Sara Hama-handled CH-3182 — rejected as ad spam
  /* Approved coverage for the public agent profiles: every Verified agent gets
     at least one approved review (Bilal / Hana are Pending — they can never be
     grounded, their profiles show an empty state by design). */
  { id: "RV-4191", member: "Chiman Rasul", agent: "Karwan Mahmoud", stars: 5, status: "Approved", daysAgo: 20, text: 5 }, // owner of Karwan-handled CH-3197 (listed 90d)
  { id: "RV-4190", member: "Kani Omar", agent: "Karwan Mahmoud", stars: 4, status: "Approved", daysAgo: 15, text: 11 }, // tenant of CH-3181, Karwan closed it 25d ago
  { id: "RV-4189", member: "Berivan Salar", agent: "Diyar Salih", stars: 4, status: "Approved", daysAgo: 40, text: 10 }, // completed viewing VW-1088 with Diyar 45d ago
  { id: "RV-4188", member: "Avan Mustafa", agent: "Sara Hama", stars: 5, status: "Approved", daysAgo: 2, text: 2 }, // bought CH-3186 via Sara 4d ago
  { id: "RV-4187", member: "Rebwar Tofiq", agent: "Rawa Jamal", stars: 4, status: "Approved", daysAgo: 100, text: 7 }, // bought CH-3184 via Rawa 140d ago
];
/* True when the member has a relationship with the agent that predates the
   review: a listing of theirs the agent has handled since before the review,
   a purchase / tenancy the agent closed for them, or a past viewing hosted by
   the agent. */
function isGrounded(member: string, agent: string, reviewDaysAgo: number): boolean {
  for (const p of PROPERTIES) {
    if (p.agent?.name !== agent) continue;
    if (p.owner.name === member && p.daysAgo >= reviewDaysAgo) return true;
    const closedAgo = daysAgoFrom(p.updated);
    if (closedAgo != null && closedAgo >= reviewDaysAgo && (p.buyer === member || p.tenant === member)) return true;
  }
  return VIEWINGS.some((v) => {
    if (v.member !== member || v.agent !== agent) return false;
    const ago = daysAgoFrom(v.date);
    return ago != null && ago >= reviewDaysAgo;
  });
}

function buildReviews(): ReviewRecord[] {
  if (!REVIEW_SPECS.some((s) => s.agent === TOP_AGENT.name)) throw new Error("reviews: TOP_AGENT has no reviews — agent My Reviews would be empty");
  const out = REVIEW_SPECS.map((s) => {
    const m = MEMBERS.find((mm) => mm.name === s.member);
    if (!m) throw new Error(`reviews: unknown member "${s.member}"`);
    const a = AGENTS.find((aa) => aa.name === s.agent);
    if (!a) throw new Error(`reviews: unknown agent "${s.agent}"`);
    if (!isGrounded(s.member, s.agent, s.daysAgo)) throw new Error(`reviews: ${s.id} — "${s.member}" has no prior relationship with agent "${s.agent}"`);
    return {
      id: s.id,
      memberName: m.name,
      memberId: m.id,
      memberImg: m.img,
      agentName: a.name,
      agentImg: a.img,
      stars: s.stars,
      text: REVIEW_TEXTS[s.text],
      submitted: dateFromDaysAgo(s.daysAgo),
      daysAgo: s.daysAgo,
      status: s.status,
    };
  });
  // Newest (smallest daysAgo) and pending first so the queue reads naturally.
  return out.sort((x, y) => {
    if (x.status === "Pending" && y.status !== "Pending") return -1;
    if (y.status === "Pending" && x.status !== "Pending") return 1;
    return x.daysAgo - y.daysAgo;
  });
}

export const REVIEWS: ReviewRecord[] = buildReviews();

export const EMPTY_FILTERS = { q: "", status: "" };
export type ReviewFilters = typeof EMPTY_FILTERS;
