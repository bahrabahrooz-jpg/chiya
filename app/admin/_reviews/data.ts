import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { MEMBERS, AGENTS } from "../_data/catalog";

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

/* KPI tiles — values are derived live from the review list (see ReviewsApp). */
export interface KpiCard {
  key: string;
  field: "total" | "pending" | "approved" | "rejected";
  label: string;
  icon: IconName;
  tone: StatTone;
  sub: string;
}
export const KPI_CARDS: KpiCard[] = [
  { key: "total", field: "total", label: "Total reviews", icon: "star", tone: "brand", sub: "All submitted reviews" },
  { key: "pending", field: "pending", label: "Pending approval", icon: "clock", tone: "gold", sub: "Awaiting admin review" },
  { key: "approved", field: "approved", label: "Approved", icon: "circle-check", tone: "success", sub: "Published to agents" },
  { key: "rejected", field: "rejected", label: "Rejected", icon: "circle-x", tone: "info", sub: "Not published" },
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const TODAY = new Date(2026, 6, 14);
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
];

/* Deterministic seed reviews built from the real member + agent roster so the
   names, avatars and cross-links stay consistent with the rest of the admin. */
function buildReviews(): ReviewRecord[] {
  const members = MEMBERS.filter((m) => m.img).slice(0, 40);
  const agents = AGENTS.filter((a) => a.img && a.verification === "Verified").slice(0, 20);
  const statuses: ReviewStatus[] = ["Pending", "Pending", "Approved", "Approved", "Approved", "Rejected"];
  const out: ReviewRecord[] = [];
  for (let n = 0; n < 24; n++) {
    const m = members[n % members.length];
    const a = agents[(n * 3) % agents.length];
    const daysAgo = 1 + ((n * 7 + 3) % 90);
    out.push({
      id: "RV-" + (4200 - n),
      memberName: m.name,
      memberId: m.id,
      memberImg: m.img,
      agentName: a.name,
      agentImg: a.img,
      stars: [5, 5, 4, 5, 4, 3, 5, 4][n % 8],
      text: REVIEW_TEXTS[n % REVIEW_TEXTS.length],
      submitted: dateFromDaysAgo(daysAgo),
      daysAgo,
      status: statuses[n % statuses.length],
    });
  }
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
