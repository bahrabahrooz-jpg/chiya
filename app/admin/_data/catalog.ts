/* =============================================================================
   Chiya admin — central data catalog (single source of truth).

   Everything the admin area shows lives here and is cross-linked by name:
   - properties reference a real location (city → district → project), a real
     owner (a Seller/Landlord member) and, usually, a real agent.
   - members carry buyer / seller / landlord / tenant roles; their "properties"
     count is the number of listings they own.
   - agents' listing / sold / rented / members stats are counted from the
     properties assigned to them.

   The dataset is a small, hand-curated set of records: every scenario appears
   exactly once (each valid status × listing combo, each property type, each
   city, agents/members in every state) so nothing is duplicated and every
   record exists for a reason. List/KPI pages derive their figures from these
   helpers, so adding or removing a property updates every count consistently.
   ========================================================================== */

import type { IconName } from "@/components/ui/icon";
import { ANCHOR_DATE, ANCHOR_ISO, addDays, addMonths } from "@/lib/dates";
import { money, type CurrencyCode, type Money } from "@/lib/money";

/* ----------------------------------------------------------------------------
   Shared types
   ------------------------------------------------------------------------- */
export interface AgentRef {
  name: string;
  verified: boolean;
  img: string;
}
export interface OwnerRef {
  name: string;
  phone: string;
  type: string;
}

/* ----------------------------------------------------------------------------
   Reference vs snapshot — the rule that governs every party link downstream.

   A LIVE record *references* a party by id: a property points at `ownerId`, a
   contract at `buyerId`. The name is resolved through memberById() at render time,
   so when a member edits their profile every live record follows.

   An ISSUED document *snapshots* the party instead: an invoice carries the
   `buyerId` AND a frozen `billTo` block copied at issue time, so reprinting it
   years later shows exactly what it showed on the day it was issued. A document
   that silently changed when someone renamed themselves would not be a record.

   The name fields on PropertyRecord (`owner.name`, `buyer`, `tenant`) predate
   the ids and are kept for the screens that still read them; new code resolves
   through the id.
   ------------------------------------------------------------------------- */
/** Amenity captured from the Add-property form (label + its icon). */
export interface PropertyAmenity {
  icon: IconName;
  label: string;
}
/** Rich, user-entered detail carried from the Add-property wizard. Every field
    is optional: the curated seed records omit it and the detail page falls
    back to its deterministic generators, while a listing created through the
    form fills it in so the detail page shows exactly what was entered. */
export interface PropertyDetails {
  description?: string;
  /* NO `currency` here. The listing's currency lives on `price`, which is a
     Money — one field, one place. This block used to carry a second copy that
     the form wrote and nothing ever read, which is exactly how the two drift. */
  areaUnit?: string; // "sqm" | "sq ft"
  ownerEmail?: string;
  ownerType?: string;
  agentPhone?: string;
  project?: string;
  street?: string;
  building?: string;
  lat?: string;
  lng?: string;
  locNotes?: string;
  year?: string;
  orientation?: string;
  condition?: string;
  furnishing?: string;
  parking?: number;
  floors?: number;
  amenities?: PropertyAmenity[];
  gallery?: string[];
  tourUrl?: string;
}
/* ----------------------------------------------------------------------------
   Publication vs availability — the split that replaced `status`.

   `status` used to answer two unrelated questions with one string. "Published"
   is a decision a person makes about the website; "Sold" is something that
   happened between two parties. Merging them meant a sale could be faked by
   picking a word from a dropdown, and un-selling was a dropdown away too.

   They are two fields now, with two different owners:

     publication   who may see the listing. Set by staff, freely, both ways.
     availability  what has happened to the property. DERIVED FROM CONTRACTS — no
                   screen sets it by hand, and ChangeVisibilityModal cannot
                   reach it. The transitions live in ./property-state.ts.

   `status` survives as a derived string (legacyStatus) for the consumers not
   yet migrated. It is deprecated and a later task removes it.
   ------------------------------------------------------------------------- */

/** Website visibility. Set by staff. */
export type Publication = "draft" | "pending" | "published" | "unpublished" | "archived";

/** Transaction state. DERIVED from contracts — never set by hand. */
export type Availability = "available" | "reserved" | "sold" | "rented";

/**
 * The agency's agreement with the OWNER — not a transaction.
 *
 * It is the reason the agency may market the property at all, and its
 * `commissionRate` is what the OWNER signed up to when they listed.
 *
 * NOT WHAT A CONTRACT ON THIS PROPERTY CHARGES. A deal is written at the house
 * standard (DEFAULT_SALE_COMMISSION_RATE), the same on both sides, months after
 * this was signed and by people who never saw it. The two used to be one number
 * and the contract form defaulted from here; they are separate now, so a rate
 * negotiated on a mandate does not quietly reprice a deal — and the seed's
 * older contracts, which do still follow their mandates, are held to it by the
 * cross-check in contracts.ts.
 */
export interface ListingMandate {
  /** Sole agency. A non-exclusive mandate means rival agencies hold it too. */
  exclusive: boolean;
  /** Percentage — 2.5 means 2.5%, matching ContractRecord.commissionRate. */
  commissionRate: number;
  signedOn: string; // ISO
  expiresOn: string; // ISO
}

export interface PropertyRecord {
  id: string;
  title: string;
  area: string;
  district: string;
  city: string;
  type: string;
  img: string;
  owner: OwnerRef;
  /** MemberRecord id of the owner — the id a contract's owner resolves to. */
  ownerId?: string;
  agent: AgentRef | null;
  /** Member who bought this property — present on every Sold record. */
  buyer?: string;
  /** MemberRecord id of the buyer. Set wherever `buyer` is. */
  buyerId?: string;
  /** Member renting this property — optional on Rented (tenant may be off-platform). */
  tenant?: string;
  /** MemberRecord id of the tenant. Set wherever `tenant` is. */
  tenantId?: string;
  listing: "sale" | "rent";
  /**
   * The unit as the DEVELOPER numbers it — "ES3-4-2": block, floor, door.
   *
   * Prints on the contract, and it is the identifier the parties actually use.
   * Nobody at a signing says "CH-3198"; they say "the flat is ES3-4-2". It is
   * also what the property search on the contract form matches against, because
   * that is the string an agent has in front of them on a scrap of paper.
   *
   * Free text on purpose — every developer numbers differently and there is no
   * scheme worth enforcing across them.
   *
   * The other half of that identity, the project name, is NOT a field: it is
   * already on the record twice over (`area` when it names a project, and
   * `details.project`). Read it through `projectNameOf` rather than adding a
   * third copy that can disagree with the other two.
   */
  unitNumber?: string;
  /** Website visibility. Set by staff. */
  publication: Publication;
  /** Transaction state. DERIVED from contracts — never set by hand. */
  availability: Availability;
  /**
   * @deprecated One string doing two jobs — read `publication` / `availability`
   * instead. Kept in sync by `withDerivedStatus()` so unmigrated consumers keep
   * working; removed once they are all migrated.
   */
  status: string;
  /** The agency's agreement with the owner. Absent on records that predate it. */
  mandate?: ListingMandate;
  /**
   * The asking price, in the currency the property was actually LISTED in.
   *
   * A `Money`, never a bare number: property here is quoted in dollars and in
   * dinars, and a figure with no currency on it is one someone has to guess at.
   * This is the ONLY place a listing's currency is decided — the contract struck
   * on it inherits this, and its invoices inherit that.
   *
   * For a rental this is the amount per `per` (i.e. monthly), not a total.
   */
  price: Money;
  per?: string;
  date: string;
  daysAgo: number;
  /** The listing date as a stored ISO day (`yyyy-mm-dd`) — the comparable form
      of `date`/`daysAgo`. Always a real date, even while unpublished (where the
      display field `listingDate` shows "—"). */
  listedOn: string;
  /** Last activity as a stored ISO day — the comparable form of `updated`. */
  updatedOn: string;
  beds: number;
  baths: number;
  size: number;
  featured: boolean;
  published: boolean;
  listingDate: string;
  updated: string;
  /** Present only for listings created through the Add-property wizard. */
  details?: PropertyDetails;
}

export interface MemberRecord {
  id: string;
  name: string;
  roles: string[];
  phone: string;
  email: string;
  properties: number;
  joined: string;
  daysAgo: number;
  /** The join date as a stored ISO day — the comparable form of `joined`. */
  joinedOn: string;
  status: string;
  img: string | null;
}

export interface AgentRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  area: string;
  verification: string;
  listings: number;
  sold: number;
  rented: number;
  members: number;
  status: string;
  /** Admin curation flag — featured agents lead the homepage "Featured agents". */
  featured: boolean;
  img: string | null;
  experience?: string;
  languages?: string[];
  areas?: string[];
  /** Public-facing copy, authored in the admin. Both are optional: the curated
      seed records mostly omit them and the public profile falls back to its
      generated summary (app/_profile/data.ts), while an agent edited through the
      admin shows exactly what was written. */
  headline?: string; // one line, sits under the name on /agents/[id]
  bio?: string; // the "About" body; a blank line starts a new paragraph
}

/* ----------------------------------------------------------------------------
   Derivations over the two fields. Every one of them is a named function rather
   than a condition written out at each call site: these rules decide what the
   public sees and whether a transaction can be undone, and they must read the
   same everywhere.
   ------------------------------------------------------------------------- */

/** The publication values `legacyStatus` reports, in the old vocabulary. */
const LEGACY_PUBLICATION: Record<Publication, string> = {
  draft: "Draft",
  pending: "Pending",
  published: "Published",
  unpublished: "Unpublished",
  archived: "Archived",
};

/**
 * The old single-string status, rebuilt from the two fields.
 *
 * @deprecated Read `publication` / `availability`. Removed in a later task.
 *
 * Precedence, and why:
 *   1. archived   — a visibility end-state a person chose deliberately; it is
 *                   what someone looking for the record needs to see first.
 *   2. sold/rented — the transaction outranks the remaining visibility words,
 *                   because that is what "Sold" meant in the old vocabulary.
 *   3. the publication word.
 *
 * "Unpublished" is a value the old vocabulary never had. Consumers that look a
 * status up in a tone map all fall back to a neutral tone on an unknown key, so
 * it degrades rather than breaking — but it is a reason to migrate them.
 */
export function legacyStatus(p: Pick<PropertyRecord, "publication" | "availability">): string {
  if (p.publication === "archived") return "Archived";
  if (p.availability === "sold") return "Sold";
  if (p.availability === "rented") return "Rented";
  return LEGACY_PUBLICATION[p.publication];
}

/** Re-derive the deprecated `status` (and `published`) after a state change.
    Every mutation touching publication or availability goes through this, so the
    compatibility field can never disagree with the fields it mirrors. */
export function withDerivedStatus<T extends Pick<PropertyRecord, "publication" | "availability">>(p: T): T & { status: string; published: boolean } {
  return { ...p, status: legacyStatus(p), published: p.publication === "published" };
}

/* A live listing must have an assigned agent — you can't publish, sell, or rent a
   property with nobody on it. Only Draft / Pending listings may be unassigned. */
/** Does this state require an assigned agent? The canonical rule. */
export const requiresAgent = (p: Pick<PropertyRecord, "publication" | "availability">) => p.publication === "published" || p.availability !== "available";

/** Publication values that can only be reached with an agent assigned. */
export const AGENT_REQUIRED_PUBLICATIONS: Publication[] = ["published"];

/** @deprecated String form of `requiresAgent`, for callers still on `status`. */
export const AGENT_REQUIRED_STATUSES = ["Published", "Sold", "Rented"];
/** @deprecated Use `requiresAgent(property)`. */
export const statusRequiresAgent = (status: string) => AGENT_REQUIRED_STATUSES.includes(status);

export interface LocationNode {
  id: string;
  name: string;
  type: "city" | "district" | "project";
  properties: number;
  created: string;
  updated: string;
  description: string;
  parent?: string;
  children: LocationNode[];
  _depth?: number;
}

/* ----------------------------------------------------------------------------
   Date helpers (all record dates anchor to a fixed "today")
   ------------------------------------------------------------------------- */
const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/* The anchor lives in lib/dates.ts now — every seed file imports the same one so
   they cannot drift apart (they were five separate literals). */
const TODAY = ANCHOR_DATE; // Jun 30, 2026
function dateFromDaysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return `${MONTHS_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
/* The same day as a stored ISO date. Display strings ("Jun 30, 2026") are for
   rendering; anything that has to be compared, sorted or counted against uses
   the ISO form. */
const isoFromDaysAgo = (days: number): string => addDays(ANCHOR_ISO, -days);


/* ----------------------------------------------------------------------------
   Image pools
   ------------------------------------------------------------------------- */
const PROP_IMG: Record<string, string[]> = {
  Villa: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=240&q=70",
  ],
  Apartment: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=240&q=70",
  ],
  House: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=240&q=70",
  ],
  Office: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=240&q=70",
  ],
  Land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=240&q=70",
  ],
};

/* Agent portraits only — exactly one photo per photographed agent, each index
   used by at most one agent. Members deliberately carry NO photo (img: null →
   initials avatar everywhere), so a member can never share a face with an
   agent and every surface renders the same thing for the same person. The
   admin user's portrait (lib/admin-profile.ts) is intentionally NOT in this
   pool either. */
const PORTRAITS: string[] = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70", // Diyar Salih
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70", // Lana Aziz
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70", // Karwan Mahmoud
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70", // Sara Hama
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70", // Rawa Jamal
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=70", // Bilal Noori
];

/* ----------------------------------------------------------------------------
   Location structure (placeable areas roll up into districts and cities)
   ------------------------------------------------------------------------- */
export interface DistrictDef {
  name: string;
  projects: string[];
  desc: string;
}
export interface CityDef {
  city: string;
  weight: number;
  desc: string;
  districts: DistrictDef[];
}
export const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");
/** Deep copy of the location structure so it can be mutated in state safely. */
export function cloneLocationDefs(defs: CityDef[]): CityDef[] {
  return defs.map((c) => ({ ...c, districts: c.districts.map((d) => ({ ...d, projects: [...d.projects] })) }));
}
export const LOCATION_DEF: CityDef[] = [
  {
    city: "Erbil",
    weight: 0.55,
    desc: "Capital of the Kurdistan Region and its most developed market, spanning luxury villas, apartments, and commercial property.",
    districts: [
      { name: "100 Meter", projects: ["Empire World", "Dream City", "Naz City"], desc: "Central commercial and residential district along the 100 Meter boulevard, home to several premium developments." },
      { name: "Gulan", projects: [], desc: "Established corridor along Gulan Street — one of Erbil's primary commercial and residential streets." },
      { name: "Ankawa", projects: [], desc: "Vibrant northern district known for villas, restaurants, and a strong rental market." },
      { name: "Italian Village", projects: [], desc: "Gated villa community popular with families and expatriates." },
      { name: "English Village", projects: [], desc: "Upscale residential compound with townhouses and detached villas." },
    ],
  },
  {
    city: "Sulaymaniyah",
    weight: 0.28,
    desc: "The region's second city, known for culture, universities, and a growing commercial real estate market.",
    districts: [
      { name: "Raparin", projects: [], desc: "Major district with a diverse mix of residential and commercial property at various price points." },
      { name: "Salim Street", projects: [], desc: "Busy central street lined with apartments and retail." },
      { name: "Bakhtiari", projects: [], desc: "Sought-after residential area in the hills above the city." },
      { name: "Sarchnar", projects: [], desc: "Green, family-oriented district on the western edge of the city." },
    ],
  },
  {
    city: "Duhok",
    weight: 0.17,
    desc: "Northern governorate capital with growing demand across residential and commercial sectors.",
    districts: [
      { name: "Malta", projects: [], desc: "Central residential and commercial district with diverse property options." },
      { name: "Masike", projects: [], desc: "Hillside residential district overlooking the city." },
      { name: "Nizarke", projects: [], desc: "Developing district with new apartment and villa projects." },
    ],
  },
];

/**
 * THE DEVELOPMENT A PROPERTY SITS IN — "Empire World", "Naz City" — or
 * undefined for one that sits on an ordinary street.
 *
 * Derived rather than stored, because the answer is already on the record in
 * two places and a third copy would be the one that goes stale. `area` holds
 * either a district or a project (see `resolvePlace`), and the two are told
 * apart by comparing it with `district`: a property placed in a district has
 * the same string in both, a property placed in a project does not.
 * `details.project`, written by the add-property wizard, wins when it is set.
 *
 * Read by the contract form's property search and printed on the contract
 * beside the unit number.
 */
export function projectNameOf(p: Pick<PropertyRecord, "area" | "district" | "details">): string | undefined {
  const fromDetails = p.details?.project?.trim();
  if (fromDetails) return fromDetails;
  return p.area !== p.district ? p.area : undefined;
}

/* Resolve a placeable area name (project or district) to its district + city.
   Throws at module load on a typo so a bad cross-link fails the dev server
   immediately instead of rendering a broken record. */
function resolvePlace(area: string): { area: string; district: string; city: string } {
  for (const c of LOCATION_DEF) {
    for (const d of c.districts) {
      if (d.name === area) return { area, district: d.name, city: c.city };
      if (d.projects.includes(area)) return { area, district: d.name, city: c.city };
    }
  }
  throw new Error(`catalog: unknown area "${area}"`);
}

/* ----------------------------------------------------------------------------
   Curated members (14) — every role state exactly once.
   Roles are NOT declared here: a member is a Buyer/Seller/Landlord/Tenant only
   because a property record links them (owner of a sale/rent listing, buyer of
   a Sold, tenant of a Rented). deriveMemberRoles() fills roles after
   PROPERTIES is built, so a role can never exist without a backing record.
   Members with no property link at all (empty roles) are prospective lookers —
   they must appear in at least one viewing (checked in _viewings/data).
   Covers: each single role, multi-role combos (incl. one all-four member and a
   Landlord+Tenant), no-role prospectives, Active/Suspended, with/without avatar.
   ------------------------------------------------------------------------- */
interface MemberSpec {
  id: string;
  name: string;
  status?: string; // default Active
  daysAgo: number; // joined
  phone: string;
}
const MEMBER_SPECS: MemberSpec[] = [
  { id: "M-5014", name: "Dara Kamal", daysAgo: 12, phone: "+964 750 214 3308" }, // prospective buyer (viewings only)
  { id: "M-5013", name: "Shilan Aziz", daysAgo: 420, phone: "+964 770 331 5124" },
  { id: "M-5012", name: "Hersh Qadir", status: "Suspended", daysAgo: 510, phone: "+964 751 448 2019" },
  { id: "M-5011", name: "Nma Rashid", daysAgo: 260, phone: "+964 773 902 6641" },
  { id: "M-5010", name: "Tara Botan", daysAgo: 190, phone: "+964 750 605 7812" },
  { id: "M-5009", name: "Aland Tariq", daysAgo: 75, phone: "+964 770 128 9903" },
  { id: "M-5008", name: "Sara Amin", daysAgo: 44, phone: "+964 751 776 4530" }, // prospective tenant (viewings only)
  { id: "M-5007", name: "Awat Faraj", daysAgo: 610, phone: "+964 773 350 1287" },
  { id: "M-5006", name: "Berivan Salar", daysAgo: 150, phone: "+964 750 491 8256" },
  { id: "M-5005", name: "Rebwar Tofiq", status: "Suspended", daysAgo: 330, phone: "+964 770 883 4471" },
  { id: "M-5004", name: "Chiman Rasul", daysAgo: 490, phone: "+964 751 267 9145" },
  { id: "M-5003", name: "Kani Omar", daysAgo: 220, phone: "+964 773 514 6098" },
  { id: "M-5002", name: "Zana Ibrahim", daysAgo: 700, phone: "+964 750 739 2264" }, // all four roles via links
  { id: "M-5001", name: "Avan Mustafa", daysAgo: 28, phone: "+964 770 460 1173" },
];
export const MEMBERS: MemberRecord[] = MEMBER_SPECS.map((s) => ({
  id: s.id,
  name: s.name,
  roles: [], // derived from property links after PROPERTIES is built
  phone: s.phone,
  email: s.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@gmail.com",
  properties: 0, // filled in by withMemberCounts
  joined: dateFromDaysAgo(s.daysAgo),
  daysAgo: s.daysAgo,
  joinedOn: isoFromDaysAgo(s.daysAgo),
  status: s.status ?? "Active",
  img: null, // members never carry a photo — initials avatars everywhere
}));

/* ----------------------------------------------------------------------------
   Curated agents (7) — every state exactly once.
   Verified+Active (one per city + a second in Erbil), Verified+Suspended,
   Pending+Active, Pending+no-avatar. Only Verified agents may appear on
   properties or viewings.
   ------------------------------------------------------------------------- */
interface AgentSpec {
  id: string;
  name: string;
  area: string;
  verification?: string; // default Verified
  status?: string; // default Active
  featured?: boolean; // default false — admin curation flag
  img?: number | null;
  phone: string;
  experience: string; // years in the field, e.g. "9"
  languages: string[];
  /* Authored profile copy. Left off most specs on purpose so the public profile
     exercises both branches — written copy for Lana, generated summaries for
     everyone else. */
  headline?: string;
  bio?: string;
}
const AGENT_SPECS: AgentSpec[] = [
  /* TOP_AGENT — must keep strictly the most assigned listings: the agent
     surface signs in as pickTopAgent(), and its demo data (viewings, reviews)
     is scoped to this agent. Reducing Lana's listings below everyone else's
     breaks the agent console demo. */
  {
    id: "A-2107",
    name: "Lana Aziz",
    area: "Empire World",
    featured: true,
    img: 1,
    phone: "+964 750 118 2044",
    experience: "9",
    languages: ["Kurdish", "English", "Arabic"],
    headline: "Villa and investment-land specialist working Erbil's Empire World, Italian Village and Dream City addresses.",
    bio: "Lana has spent nine years in Erbil real estate and knows the north-side compounds street by street — which blocks hold their value, which builders finish on time, and what a fair number looks like before the negotiation starts.\n\nShe works a deliberately small book of listings so every client gets the same thing: honest pricing advice, viewings arranged around your schedule, and one point of contact from first visit through to handover of keys. Kurdish, English and Arabic throughout.",
  },
  { id: "A-2106", name: "Karwan Mahmoud", area: "Ankawa", featured: true, img: 2, phone: "+964 770 236 7180", experience: "7", languages: ["Kurdish", "English"] },
  { id: "A-2105", name: "Sara Hama", area: "Bakhtiari", featured: true, img: 3, phone: "+964 751 342 9066", experience: "6", languages: ["Kurdish", "Arabic"] },
  { id: "A-2104", name: "Rawa Jamal", area: "Malta", img: 4, phone: "+964 773 458 1237", experience: "5", languages: ["Kurdish", "English"] },
  { id: "A-2103", name: "Diyar Salih", area: "Gulan", status: "Suspended", img: 0, phone: "+964 750 561 8829", experience: "8", languages: ["Kurdish", "Arabic"] },
  { id: "A-2102", name: "Bilal Noori", area: "Raparin", verification: "Pending", img: 5, phone: "+964 770 674 3315", experience: "3", languages: ["Kurdish"] },
  { id: "A-2101", name: "Hana Rashid", area: "Nizarke", verification: "Pending", img: null, phone: "+964 751 785 9402", experience: "2", languages: ["Kurdish", "English"] },
];
export const AGENTS: AgentRecord[] = AGENT_SPECS.map((s) => {
  const place = resolvePlace(s.area);
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    email: s.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@chiya.estate",
    city: place.city,
    area: s.area,
    verification: s.verification ?? "Verified",
    listings: 0, // filled in by withAgentStats
    sold: 0,
    rented: 0,
    members: 0,
    status: s.status ?? "Active",
    featured: s.featured ?? false,
    img: s.img === null ? null : PORTRAITS[s.img ?? 0],
    experience: s.experience,
    languages: s.languages,
    areas: [s.area],
    headline: s.headline ?? "",
    bio: s.bio ?? "",
  };
});

/* No two agents may share a portrait — a face must identify exactly one person. */
{
  const seen = new Map<string, string>();
  for (const a of AGENTS) {
    if (!a.img) continue;
    const other = seen.get(a.img);
    if (other) throw new Error(`catalog: agents "${other}" and "${a.name}" share the same portrait`);
    seen.set(a.img, a.name);
  }
}

const MEMBER_BY_NAME = new Map(MEMBERS.map((m) => [m.name, m]));
const AGENT_BY_NAME = new Map(AGENTS.map((a) => [a.name, a]));

/* Member names must be unique. The seed links parties by name and resolves them
   to ids in buildProperty; two members sharing a name would make that resolution
   silently pick one of them. Fail at module load instead. */
if (MEMBER_BY_NAME.size !== MEMBERS.length) throw new Error("catalog: two members share a name — party links cannot resolve to one id");

/** Members and agents keyed by id — the lookup new code should reach for. */
export const MEMBER_BY_ID = new Map(MEMBERS.map((m) => [m.id, m]));
const AGENT_BY_ID = new Map(AGENTS.map((a) => [a.id, a]));

/** Resolve a member from the id a record stores. Undefined if they are gone. */
export function memberById(id: string | undefined): MemberRecord | undefined {
  return id ? MEMBER_BY_ID.get(id) : undefined;
}
/** Resolve a member by display name — for the seed links written by name. */
export function memberByName(name: string | undefined): MemberRecord | undefined {
  return name ? MEMBER_BY_NAME.get(name) : undefined;
}
/** Resolve an agent from the id a record stores. */
export function agentById(id: string | undefined): AgentRecord | undefined {
  return id ? AGENT_BY_ID.get(id) : undefined;
}

/* ----------------------------------------------------------------------------
   Curated properties (24) — every scenario exactly once.
   Coverage: each valid status × listing combo (Published sale/rent, Pending
   sale/rent, Sold [sale only], Rented [rent only], Draft sale/rent), each type
   at least once, Erbil/Sulaymaniyah/Duhok all represented, project locations,
   featured, Company owners, agent-less Pending + Drafts. The Sold/Rented rows
   spread `updated` across today / this week / this month / this year so every
   dashboard period KPI is non-zero.
   ------------------------------------------------------------------------- */
interface PropSpec {
  id: string;
  title: string;
  area: string; // placeable: district or project name
  /** Developer's unit reference, on the rows that sit in a numbered development.
      Prints on the contract — see PropertyRecord.unitNumber. */
  unit?: string;
  type: string;
  listing: "sale" | "rent";
  status: string;
  agent: string | null; // agent name — Published/Sold/Rented must have one
  owner: string; // member name — owning makes them a Seller (sale) / Landlord (rent)
  buyer?: string; // member name — required on Sold, makes them a Buyer
  tenant?: string; // member name — optional on Rented (may be off-platform), makes them a Tenant
  companyOwner?: boolean;
  /* Whole units as a human would quote them — 850000, or 900000000 for a dinar
     listing — converted to minor units by buildProperty. Writing the seed in
     minor units would make every row unreadable and every edit a trap.
     For a rental this is the MONTHLY figure. */
  price: number;
  /** Omitted means USD. Set on the rows quoted in dinars. */
  currency?: CurrencyCode;
  beds: number;
  baths: number;
  size: number;
  featured?: boolean;
  daysAgo: number; // listed
  updatedDaysAgo: number; // last activity (status change / edit)
  img?: number; // index into PROP_IMG[type]
  /* ---- listing mandate ---- */
  /** Sole agency. Exclusive mandates run a shorter term (see buildMandate). */
  exclusive?: boolean;
  /** Commission the mandate sets, when it differs from the per-listing default
      (sale 2.5%, rent 5%). Every property carrying a SALE contract in
      _data/contracts.ts states the rate that contract was struck at — the two
      must agree, and contracts.ts asserts it at module load. A tenancy states
      its fee against one cycle of rent instead, so it is not cross-checked. */
  mandateRate?: number;
}
const PROP_SPECS: PropSpec[] = [
  /* -------- Published (6 sale + 4 rent) -------- */
  { id: "CH-3200", title: "Marble Hill Villa", area: "Empire World", unit: "EW-V12", type: "Villa", listing: "sale", status: "Published", agent: "Lana Aziz", owner: "Shilan Aziz", price: 850000, beds: 5, baths: 4, size: 480, featured: true, daysAgo: 34, updatedDaysAgo: 10, exclusive: true },
  { id: "CH-3199", title: "Dream City Garden Flat", area: "Dream City", unit: "DC-B4-0902", type: "Apartment", listing: "rent", status: "Published", agent: "Lana Aziz", owner: "Nma Rashid", price: 1400, beds: 2, baths: 2, size: 130, featured: true, daysAgo: 18, updatedDaysAgo: 5, img: 1, exclusive: true },
  { id: "CH-3198", title: "Naz City Sky Suite", area: "Naz City", unit: "NC-T2-1704", type: "Apartment", listing: "sale", status: "Published", agent: "Lana Aziz", owner: "Berivan Salar", price: 690000, beds: 3, baths: 3, size: 300, daysAgo: 60, updatedDaysAgo: 12 },
  { id: "CH-3197", title: "English Village Court", area: "English Village", type: "House", listing: "sale", status: "Published", agent: "Karwan Mahmoud", owner: "Chiman Rasul", price: 420000, beds: 4, baths: 3, size: 260, daysAgo: 90, updatedDaysAgo: 15, img: 1 },
  { id: "CH-3196", title: "Gulan Business Suite", area: "Gulan", type: "Office", listing: "rent", status: "Published", agent: "Karwan Mahmoud", owner: "Awat Faraj", companyOwner: true, price: 2800, beds: 0, baths: 1, size: 210, daysAgo: 45, updatedDaysAgo: 8, mandateRate: 4 },
  { id: "CH-3195", title: "Ankawa Olive Grove Land", area: "Ankawa", type: "Land", listing: "sale", status: "Published", agent: "Lana Aziz", owner: "Hersh Qadir", price: 320000, beds: 0, baths: 0, size: 1200, daysAgo: 120, updatedDaysAgo: 20 },
  { id: "CH-3194", title: "Cedar Court Apartments", area: "Salim Street", unit: "CC-A-0301", type: "Apartment", listing: "sale", status: "Published", agent: "Sara Hama", owner: "Shilan Aziz", price: 210000, beds: 3, baths: 2, size: 150, featured: true, daysAgo: 25, updatedDaysAgo: 18, img: 2, exclusive: true },
  { id: "CH-3193", title: "Sarchnar Hillside Villa", area: "Sarchnar", type: "Villa", listing: "rent", status: "Published", agent: "Sara Hama", owner: "Kani Omar", price: 2200, beds: 4, baths: 3, size: 380, daysAgo: 30, updatedDaysAgo: 6, img: 2 },
  { id: "CH-3192", title: "Masike Highland Villa", area: "Masike", type: "Villa", listing: "sale", status: "Published", agent: "Rawa Jamal", owner: "Chiman Rasul", price: 380000, beds: 4, baths: 3, size: 340, daysAgo: 150, updatedDaysAgo: 22, img: 3 },
  { id: "CH-3191", title: "Malta Riverside Loft", area: "Malta", unit: "MR-3-1102", type: "Apartment", listing: "rent", status: "Published", agent: "Rawa Jamal", owner: "Tara Botan", price: 900, beds: 1, baths: 1, size: 95, daysAgo: 12, updatedDaysAgo: 4, img: 3 },
  /* -------- Pending (3: sale+agent, rent+no agent, land sale) -------- */
  { id: "CH-3190", title: "Italian Village Rose Flat", area: "Italian Village", type: "Apartment", listing: "sale", status: "Pending", agent: "Lana Aziz", owner: "Berivan Salar", price: 260000, beds: 2, baths: 2, size: 140, daysAgo: 3, updatedDaysAgo: 3 },
  { id: "CH-3189", title: "Raparin Terrace House", area: "Raparin", type: "House", listing: "rent", status: "Pending", agent: null, owner: "Nma Rashid", price: 1100, beds: 3, baths: 2, size: 220, daysAgo: 2, updatedDaysAgo: 2, img: 2 },
  { id: "CH-3188", title: "Nizarke Vineyard Plot", area: "Nizarke", type: "Land", listing: "sale", status: "Pending", agent: "Rawa Jamal", owner: "Awat Faraj", companyOwner: true, price: 180000, beds: 0, baths: 0, size: 800, daysAgo: 7, updatedDaysAgo: 7, img: 1 },
  /* -------- Sold (4, sale only) — updated: today / week / month / year --------
     Every Sold record links its buyer; buyers must have joined before the sale
     closed (buyer joined-daysAgo ≥ updatedDaysAgo, validated in buildProperty). */
  { id: "CH-3187", title: "Olive Grove Estate", area: "Italian Village", unit: "IV-24", type: "Villa", listing: "sale", status: "Sold", agent: "Lana Aziz", owner: "Shilan Aziz", buyer: "Berivan Salar", price: 720000, beds: 5, baths: 4, size: 520, daysAgo: 200, updatedDaysAgo: 0, exclusive: true },
  { id: "CH-3186", title: "Bakhtiari Pearl Flat", area: "Bakhtiari", type: "Apartment", listing: "sale", status: "Sold", agent: "Sara Hama", owner: "Chiman Rasul", buyer: "Avan Mustafa", price: 195000, beds: 2, baths: 1, size: 120, daysAgo: 160, updatedDaysAgo: 4, mandateRate: 3 },
  { id: "CH-3185", title: "Gulan Tower Office", area: "Gulan", type: "Office", listing: "sale", status: "Sold", agent: "Lana Aziz", owner: "Awat Faraj", buyer: "Zana Ibrahim", companyOwner: true, price: 540000, beds: 0, baths: 2, size: 320, daysAgo: 240, updatedDaysAgo: 18, img: 1, exclusive: true },
  { id: "CH-3184", title: "Malta Summit Grounds", area: "Malta", type: "Land", listing: "sale", status: "Sold", agent: "Rawa Jamal", owner: "Zana Ibrahim", buyer: "Rebwar Tofiq", price: 260000, beds: 0, baths: 0, size: 1600, daysAgo: 400, updatedDaysAgo: 140 },
  /* -------- Rented (4, rent only) — updated: today / week / month / year --------
     Tenants link like buyers but are optional: CH-3183 is deliberately rented to
     an off-platform tenant so the "looker with viewings but no tenancy" members
     (Dara, Sara) stay prospective. */
  { id: "CH-3183", title: "Empire World Loft", area: "Empire World", type: "Apartment", listing: "rent", status: "Rented", agent: "Lana Aziz", owner: "Nma Rashid", price: 1600, beds: 2, baths: 2, size: 125, daysAgo: 80, updatedDaysAgo: 0 },
  { id: "CH-3182", title: "Sarchnar Cypress Villa", area: "Sarchnar", type: "Villa", listing: "rent", status: "Rented", agent: "Sara Hama", owner: "Kani Omar", tenant: "Aland Tariq", price: 2600, beds: 4, baths: 4, size: 420, daysAgo: 110, updatedDaysAgo: 5, img: 1 },
  { id: "CH-3181", title: "Ankawa Tower Suite", area: "Ankawa", type: "Apartment", listing: "rent", status: "Rented", agent: "Karwan Mahmoud", owner: "Awat Faraj", tenant: "Kani Omar", price: 3400, beds: 3, baths: 3, size: 280, daysAgo: 140, updatedDaysAgo: 25, img: 1, mandateRate: 4 },
  { id: "CH-3180", title: "Nizarke Sunset Terrace", area: "Nizarke", type: "House", listing: "rent", status: "Rented", agent: "Rawa Jamal", owner: "Tara Botan", tenant: "Zana Ibrahim", price: 850, beds: 3, baths: 2, size: 230, daysAgo: 380, updatedDaysAgo: 258 },
  /* -------- Draft (3: sale+agent, rent+no agent, sale+no agent) -------- */
  { id: "CH-3179", title: "Gulan Emerald Suite", area: "Gulan", type: "Apartment", listing: "sale", status: "Draft", agent: "Karwan Mahmoud", owner: "Zana Ibrahim", price: 610000, beds: 3, baths: 3, size: 340, daysAgo: 1, updatedDaysAgo: 1, img: 2 },
  { id: "CH-3178", title: "Salim Street Studio", area: "Salim Street", type: "Apartment", listing: "rent", status: "Draft", agent: null, owner: "Zana Ibrahim", price: 600, beds: 1, baths: 1, size: 90, daysAgo: 9, updatedDaysAgo: 9 },
  { id: "CH-3177", title: "Masike Zagros Villa", area: "Masike", type: "Villa", listing: "sale", status: "Draft", agent: null, owner: "Hersh Qadir", price: 450000, beds: 5, baths: 3, size: 400, daysAgo: 13, updatedDaysAgo: 13 },
];

/* The seed's `status` string, split into the two fields that replaced it.
   Sold and Rented records become `unpublished`: they are history, and a closed
   transaction must not stay live on the website. */
const STATUS_SPLIT: Record<string, { publication: Publication; availability: Availability }> = {
  Draft: { publication: "draft", availability: "available" },
  Pending: { publication: "pending", availability: "available" },
  Published: { publication: "published", availability: "available" },
  Sold: { publication: "unpublished", availability: "sold" },
  Rented: { publication: "unpublished", availability: "rented" },
  Archived: { publication: "archived", availability: "available" },
};

/** The agency's standard commission by listing type. What a mandate charges
    unless someone negotiated otherwise. */
export const DEFAULT_MANDATE_RATE: Record<"sale" | "rent", number> = { sale: 2.5, rent: 5 };

/**
 * Build a mandate on the agency's standard terms.
 *
 * Signed the day the property was listed, which is when the agency's authority
 * to market it actually starts. Exclusive mandates run 6 months, non-exclusive
 * 12: sole agency is the stronger commitment, so it is granted for less time.
 *
 * Exported because a listing created through the Add-property wizard needs the
 * same default — hand-rolling one there would let the two drift.
 */
export function buildMandate(
  listing: "sale" | "rent",
  signedOn: string,
  opts: { exclusive?: boolean; commissionRate?: number } = {},
): ListingMandate {
  const exclusive = opts.exclusive ?? false;
  return {
    exclusive,
    commissionRate: opts.commissionRate ?? DEFAULT_MANDATE_RATE[listing],
    signedOn,
    expiresOn: addMonths(signedOn, exclusive ? 6 : 12),
  };
}

function buildProperty(s: PropSpec): PropertyRecord {
  const place = resolvePlace(s.area);
  const owner = MEMBER_BY_NAME.get(s.owner);
  if (!owner) throw new Error(`catalog: property ${s.id} has unknown owner "${s.owner}"`);
  /* Buyer / tenant counterparty links. Every Sold record must name its buyer;
     Rented may omit the tenant (off-platform). Either link must be a real
     member, not the owner, and must have joined before the contract closed. */
  if (s.status === "Sold" && !s.buyer) throw new Error(`catalog: property ${s.id} is Sold but has no buyer`);
  if (s.buyer && s.status !== "Sold") throw new Error(`catalog: property ${s.id} has a buyer but is not Sold`);
  if (s.tenant && s.status !== "Rented") throw new Error(`catalog: property ${s.id} has a tenant but is not Rented`);
  /* Ids are resolved HERE, from the same lookup that validates the name — so the
     id and the name can never point at two different people. Member names are
     unique (asserted below), which is what makes the name → id backfill exact. */
  let buyerId: string | undefined;
  let tenantId: string | undefined;
  for (const [kind, name] of [["buyer", s.buyer], ["tenant", s.tenant]] as const) {
    if (!name) continue;
    const m = MEMBER_BY_NAME.get(name);
    if (!m) throw new Error(`catalog: property ${s.id} has unknown ${kind} "${name}"`);
    if (name === s.owner) throw new Error(`catalog: property ${s.id} ${kind} "${name}" is also the owner`);
    if (m.daysAgo < s.updatedDaysAgo) throw new Error(`catalog: property ${s.id} ${kind} "${name}" joined after the contract closed`);
    if (kind === "buyer") buyerId = m.id;
    else tenantId = m.id;
  }
  const split = STATUS_SPLIT[s.status];
  if (!split) throw new Error(`catalog: property ${s.id} has unknown status "${s.status}"`);
  let agent: AgentRef | null = null;
  if (s.agent) {
    const rec = AGENT_BY_NAME.get(s.agent);
    if (!rec) throw new Error(`catalog: property ${s.id} has unknown agent "${s.agent}"`);
    if (rec.verification !== "Verified") throw new Error(`catalog: property ${s.id} agent "${s.agent}" is not verified`);
    agent = { name: rec.name, verified: true, img: rec.img || "" };
  } else if (requiresAgent(split)) {
    throw new Error(`catalog: property ${s.id} is ${s.status} but has no agent`);
  }
  /* Sold / Rented records are unpublished but were live once, so they keep a
     real listing date — `published` says whether they are live NOW. */
  const wasLive = s.status === "Published" || s.status === "Sold" || s.status === "Rented";
  const listedOn = isoFromDaysAgo(s.daysAgo);
  return {
    id: s.id,
    title: s.title,
    area: place.area,
    ...(s.unit ? { unitNumber: s.unit } : {}),
    district: place.district,
    city: place.city,
    type: s.type,
    img: PROP_IMG[s.type][(s.img ?? 0) % PROP_IMG[s.type].length],
    owner: { name: owner.name, phone: owner.phone, type: s.companyOwner ? "Company owner" : "Individual owner" },
    ownerId: owner.id,
    agent,
    buyer: s.buyer,
    buyerId,
    tenant: s.tenant,
    tenantId,
    listing: s.listing,
    publication: split.publication,
    availability: split.availability,
    status: legacyStatus(split),
    mandate: buildMandate(s.listing, listedOn, { exclusive: s.exclusive, commissionRate: s.mandateRate }),
    price: money(s.price, s.currency ?? "USD"),
    per: s.listing === "rent" ? "/mo" : undefined,
    date: dateFromDaysAgo(s.daysAgo),
    daysAgo: s.daysAgo,
    listedOn,
    updatedOn: isoFromDaysAgo(s.updatedDaysAgo),
    beds: s.beds,
    baths: s.baths,
    size: s.size,
    featured: s.featured ?? false,
    published: split.publication === "published",
    listingDate: wasLive ? dateFromDaysAgo(s.daysAgo) : "—",
    updated: dateFromDaysAgo(s.updatedDaysAgo),
  };
}
export const PROPERTIES: PropertyRecord[] = PROP_SPECS.map(buildProperty);

/* ----------------------------------------------------------------------------
   Derived roles — a role exists only because a property record backs it:
   Seller = owns a sale listing · Landlord = owns a rent listing ·
   Buyer = bought a Sold property · Tenant = rents a Rented property.
   `base` preserves roles set explicitly through the UI (e.g. Add member).
   ------------------------------------------------------------------------- */
const ROLE_ORDER = ["Buyer", "Seller", "Landlord", "Tenant"];
export function deriveMemberRoles(name: string, list: PropertyRecord[], base: string[] = []): string[] {
  const roles = new Set(base);
  for (const p of list) {
    if (p.owner.name === name) roles.add(p.listing === "rent" ? "Landlord" : "Seller");
    if (p.buyer === name) roles.add("Buyer");
    if (p.tenant === name) roles.add("Tenant");
  }
  return ROLE_ORDER.filter((r) => roles.has(r));
}
/* Raw MEMBERS keeps roles empty — the store overlays live-derived roles via
   withMemberRoles so they always track the current property list. Consumers
   needing roles for the raw seed call deriveMemberRoles(name, PROPERTIES). */
export function withMemberRoles(members: MemberRecord[], list: PropertyRecord[]): MemberRecord[] {
  return members.map((m) => ({ ...m, roles: deriveMemberRoles(m.name, list, m.roles) }));
}

/* The verified agent holding the most assigned listings. The agent surface signs
   this agent in by default (lib/agent-session), so any seed that should look
   populated for them — reviews, viewings — resolves the same agent from here
   rather than re-deriving it. */
function pickTopAgent(): AgentRecord {
  const counts: Record<string, number> = {};
  for (const p of PROPERTIES) if (p.agent) counts[p.agent.name] = (counts[p.agent.name] || 0) + 1;
  const ranked = AGENTS.filter((a) => a.verification === "Verified")
    .map((a) => ({ a, n: counts[a.name] || 0 }))
    .sort((x, y) => y.n - x.n);
  return ranked[0]?.a ?? AGENTS[0];
}
export const TOP_AGENT: AgentRecord = pickTopAgent();

/* Distinct assignable agents (for the "assign agent" picker). */
/* Empty img falls back to an initials avatar — never to another agent's photo. */
export const AGENTS_LIST: AgentRef[] = AGENTS.map((a) => ({ name: a.name, verified: a.verification === "Verified", img: a.img || "" })).sort((x, y) =>
  x.name.localeCompare(y.name),
);

/* ----------------------------------------------------------------------------
   Selectors — derive live figures from a property list
   ------------------------------------------------------------------------- */
export interface PropertyCounts {
  total: number;
  available: number;
  pending: number;
  sold: number;
  rented: number;
}
/**
 * How many properties sit in each state RIGHT NOW.
 *
 * Note the difference from the contract-sourced figures in ./property-state.ts:
 * this counts properties currently sold or rented, while `closedContractCounts`
 * counts transactions closed. They differ once a property has been let more
 * than once — one property, two closed tenancies — which is why the KPI cards
 * that say "closed sales all-time" read the contract count, not this one.
 */
export function countProperties(list: PropertyRecord[]): PropertyCounts {
  const counts: PropertyCounts = { total: list.length, available: 0, pending: 0, sold: 0, rented: 0 };
  for (const p of list) {
    if (p.availability === "sold") counts.sold++;
    else if (p.availability === "rented") counts.rented++;
    else if (p.publication === "published") counts.available++;
    else if (p.publication === "pending") counts.pending++;
  }
  return counts;
}

/* Days between a "Mon D, YYYY" date string and the catalog's TODAY (0 = today,
   negative = future). Returns null for an unparseable string (e.g. "—"). */
export function daysAgoFrom(dateStr: string): number | null {
  const m = /^([A-Za-z]{3})\s+(\d+),\s*(\d+)$/.exec(dateStr.trim());
  if (!m) return null;
  const mi = MONTHS_ABBR.indexOf(m[1]);
  if (mi < 0) return null;
  const d = new Date(Number(m[3]), mi, Number(m[2]));
  return Math.round((TODAY.getTime() - d.getTime()) / 86400000);
}

export type CountPeriod = "today" | "week" | "month" | "year";
/* Inclusive rolling window, in days ago, for each dashboard period. */
const PERIOD_MAX_DAYS: Record<CountPeriod, number> = { today: 0, week: 6, month: 29, year: 364 };

/** The inclusive day window each dashboard period covers. Exported so the
    contract-sourced counter in ./property-state.ts measures the same windows. */
export const periodWindow = (period: CountPeriod): number => PERIOD_MAX_DAYS[period];

/**
 * Count Sold / Rented listings whose last status change (p.updated) falls inside
 * the selected rolling window.
 *
 * @deprecated A sale is a contract now, not a word on a property, and `p.updated` is
 * the day the record was last touched rather than the day anything closed. Use
 * `closedContractsInPeriod` in ./property-state.ts, which reads the contract's own
 * `closedOn`. Kept only until the last caller moves over.
 */
export function countSoldRentedInPeriod(list: PropertyRecord[], period: CountPeriod): { sold: number; rented: number } {
  const max = PERIOD_MAX_DAYS[period];
  let sold = 0;
  let rented = 0;
  for (const p of list) {
    if (p.availability !== "sold" && p.availability !== "rented") continue;
    const ago = daysAgoFrom(p.updated);
    if (ago == null || ago < 0 || ago > max) continue;
    if (p.availability === "sold") sold++;
    else rented++;
  }
  return { sold, rented };
}

/** Overlay each member's related-property count (owned + bought + renting)
    from the live property list — the members page shows "{n} related". */
export function withMemberCounts(members: MemberRecord[], list: PropertyRecord[]): MemberRecord[] {
  const related: Record<string, number> = {};
  const add = (name: string | undefined) => {
    if (name) related[name] = (related[name] || 0) + 1;
  };
  for (const p of list) {
    add(p.owner.name);
    add(p.buyer);
    add(p.tenant);
  }
  return members.map((m) => ({ ...m, properties: related[m.name] || 0 }));
}
export interface MemberCounts {
  total: number;
  buyers: number;
  sellers: number;
  landlords: number;
  tenants: number;
}
export function countMembers(members: MemberRecord[]): MemberCounts {
  const c: MemberCounts = { total: members.length, buyers: 0, sellers: 0, landlords: 0, tenants: 0 };
  for (const m of members) {
    if (m.roles.includes("Buyer")) c.buyers++;
    if (m.roles.includes("Seller")) c.sellers++;
    if (m.roles.includes("Landlord")) c.landlords++;
    if (m.roles.includes("Tenant")) c.tenants++;
  }
  return c;
}

/** Overlay each agent's listing / sold / rented / members stats from properties.
    `members` counts every distinct client: owners plus the buyers / tenants the
    agent closed contracts with. */
export function withAgentStats(agents: AgentRecord[], list: PropertyRecord[]): AgentRecord[] {
  const stats: Record<string, { listings: number; sold: number; rented: number; clients: Set<string> }> = {};
  for (const p of list) {
    if (!p.agent) continue;
    const s = (stats[p.agent.name] ||= { listings: 0, sold: 0, rented: 0, clients: new Set() });
    /* "Listings" means what the agent is currently working: live or awaiting
       approval, and not yet transacted. A reserved property still counts — it
       is under offer, not gone. */
    if (p.availability === "sold") s.sold++;
    else if (p.availability === "rented") s.rented++;
    else if (p.publication === "published" || p.publication === "pending") s.listings++;
    s.clients.add(p.owner.name);
    if (p.buyer) s.clients.add(p.buyer);
    if (p.tenant) s.clients.add(p.tenant);
  }
  return agents.map((a) => {
    const s = stats[a.name];
    return s ? { ...a, listings: s.listings, sold: s.sold, rented: s.rented, members: s.clients.size } : { ...a, listings: 0, sold: 0, rented: 0, members: 0 };
  });
}
export interface AgentCounts {
  total: number;
  verified: number;
  pending: number;
}
export function countAgents(agents: AgentRecord[]): AgentCounts {
  const c: AgentCounts = { total: agents.length, verified: 0, pending: 0 };
  for (const a of agents) {
    if (a.verification === "Verified") c.verified++;
    else c.pending++;
  }
  return c;
}

/** Build the location tree with property counts rolled up from the live list. */
const NODE_CREATED = "Jan 12, 2023";
export function buildLocationTree(defs: CityDef[], list: PropertyRecord[]): LocationNode[] {
  const byArea: Record<string, number> = {};
  for (const p of list) byArea[p.area] = (byArea[p.area] || 0) + 1;

  return defs.map((c) => {
    const districts: LocationNode[] = c.districts.map((d) => {
      const projects: LocationNode[] = d.projects.map((pName) => ({
        id: pName.toLowerCase().replace(/\s+/g, "-"),
        name: pName,
        type: "project" as const,
        parent: d.name,
        properties: byArea[pName] || 0,
        created: NODE_CREATED,
        updated: "Jun 10, 2026",
        description: `${pName} — residential development within the ${d.name} district of ${c.city}.`,
        children: [],
      }));
      const distCount = d.projects.length ? projects.reduce((s, p) => s + p.properties, 0) : byArea[d.name] || 0;
      return {
        id: d.name.toLowerCase().replace(/\s+/g, "-"),
        name: d.name,
        type: "district" as const,
        parent: c.city,
        properties: distCount,
        created: NODE_CREATED,
        updated: "Jun 8, 2026",
        description: d.desc,
        children: projects,
      };
    });
    return {
      id: c.city.toLowerCase().replace(/\s+/g, "-"),
      name: c.city,
      type: "city" as const,
      properties: districts.reduce((s, d) => s + d.properties, 0),
      created: NODE_CREATED,
      updated: "Jun 10, 2026",
      description: c.desc,
      children: districts,
    };
  });
}

export interface LocationCounts {
  cities: number;
  districts: number;
  projects: number;
  assigned: number;
}
export function countLocations(defs: CityDef[], list: PropertyRecord[]): LocationCounts {
  let cities = 0;
  let districts = 0;
  let projects = 0;
  for (const c of defs) {
    cities++;
    for (const d of c.districts) {
      districts++;
      projects += d.projects.length;
    }
  }
  return { cities, districts, projects, assigned: list.length };
}

/** Remove a location node (and its descendants) from a (cloned) structure. */
export function removeLocationDef(defs: CityDef[], type: "city" | "district" | "project", id: string): CityDef[] {
  const next = cloneLocationDefs(defs);
  if (type === "city") return next.filter((c) => slugify(c.city) !== id);
  if (type === "district") {
    for (const c of next) c.districts = c.districts.filter((d) => slugify(d.name) !== id);
    return next;
  }
  for (const c of next) for (const d of c.districts) d.projects = d.projects.filter((p) => slugify(p) !== id);
  return next;
}

/** Insert a new location node into a (cloned) structure. Parent ids are slugs. */
export function addLocationDef(defs: CityDef[], name: string, type: "city" | "district" | "project", parentId: string): CityDef[] {
  const next = cloneLocationDefs(defs);
  const key = slugify(name);
  if (type === "city") {
    if (!next.some((c) => slugify(c.city) === key)) next.push({ city: name, weight: 0, desc: "", districts: [] });
  } else if (type === "district") {
    const city = next.find((c) => slugify(c.city) === parentId);
    if (city && !city.districts.some((d) => slugify(d.name) === key)) city.districts.push({ name, projects: [], desc: "" });
  } else if (type === "project") {
    for (const c of next) {
      const d = c.districts.find((dd) => slugify(dd.name) === parentId);
      if (d) {
        if (!d.projects.some((p) => slugify(p) === key)) d.projects.push(name);
        break;
      }
    }
  }
  return next;
}

/* Lookup helpers for detail pages. */
export function getPropertyById(id: string): PropertyRecord | undefined {
  return PROPERTIES.find((p) => p.id === id);
}
export function getAgentByName(name: string): AgentRecord | undefined {
  return AGENTS.find((a) => a.name === name);
}

export const ICON_PHONE: IconName = "phone";
