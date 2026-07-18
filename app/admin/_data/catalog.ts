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
  currency?: string; // "USD" | "IQD" | "EUR"
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
export interface PropertyRecord {
  id: string;
  title: string;
  area: string;
  district: string;
  city: string;
  type: string;
  img: string;
  owner: OwnerRef;
  agent: AgentRef | null;
  /** Member who bought this property — present on every Sold record. */
  buyer?: string;
  /** Member renting this property — optional on Rented (tenant may be off-platform). */
  tenant?: string;
  listing: "sale" | "rent";
  status: string;
  price: number;
  per?: string;
  date: string;
  daysAgo: number;
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
  img: string | null;
  experience?: string;
  languages?: string[];
  areas?: string[];
}

/* A live listing must have an assigned agent — you can't publish, sell, or rent a
   property with nobody on it. Only Draft / Pending listings may be unassigned. */
export const AGENT_REQUIRED_STATUSES = ["Published", "Sold", "Rented"];
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
const TODAY = new Date(2026, 5, 30); // Jun 30, 2026
function dateFromDaysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return `${MONTHS_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

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
  img?: number | null;
  phone: string;
  experience: string; // years in the field, e.g. "9"
  languages: string[];
}
const AGENT_SPECS: AgentSpec[] = [
  /* TOP_AGENT — must keep strictly the most assigned listings: the agent
     surface signs in as pickTopAgent(), and its demo data (viewings, reviews)
     is scoped to this agent. Reducing Lana's listings below everyone else's
     breaks the agent console demo. */
  { id: "A-2107", name: "Lana Aziz", area: "Empire World", img: 1, phone: "+964 750 118 2044", experience: "9", languages: ["Kurdish", "English", "Arabic"] },
  { id: "A-2106", name: "Karwan Mahmoud", area: "Ankawa", img: 2, phone: "+964 770 236 7180", experience: "7", languages: ["Kurdish", "English"] },
  { id: "A-2105", name: "Sara Hama", area: "Bakhtiari", img: 3, phone: "+964 751 342 9066", experience: "6", languages: ["Kurdish", "Arabic"] },
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
    img: s.img === null ? null : PORTRAITS[s.img ?? 0],
    experience: s.experience,
    languages: s.languages,
    areas: [s.area],
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
  type: string;
  listing: "sale" | "rent";
  status: string;
  agent: string | null; // agent name — Published/Sold/Rented must have one
  owner: string; // member name — owning makes them a Seller (sale) / Landlord (rent)
  buyer?: string; // member name — required on Sold, makes them a Buyer
  tenant?: string; // member name — optional on Rented (may be off-platform), makes them a Tenant
  companyOwner?: boolean;
  price: number;
  beds: number;
  baths: number;
  size: number;
  featured?: boolean;
  daysAgo: number; // listed
  updatedDaysAgo: number; // last activity (status change / edit)
  img?: number; // index into PROP_IMG[type]
}
const PROP_SPECS: PropSpec[] = [
  /* -------- Published (6 sale + 4 rent) -------- */
  { id: "CH-3200", title: "Marble Hill Villa", area: "Empire World", type: "Villa", listing: "sale", status: "Published", agent: "Lana Aziz", owner: "Shilan Aziz", price: 850000, beds: 5, baths: 4, size: 480, featured: true, daysAgo: 34, updatedDaysAgo: 10 },
  { id: "CH-3199", title: "Dream City Garden Flat", area: "Dream City", type: "Apartment", listing: "rent", status: "Published", agent: "Lana Aziz", owner: "Nma Rashid", price: 1400, beds: 2, baths: 2, size: 130, featured: true, daysAgo: 18, updatedDaysAgo: 5, img: 1 },
  { id: "CH-3198", title: "Naz City Sky Suite", area: "Naz City", type: "Apartment", listing: "sale", status: "Published", agent: "Lana Aziz", owner: "Berivan Salar", price: 690000, beds: 3, baths: 3, size: 300, daysAgo: 60, updatedDaysAgo: 12 },
  { id: "CH-3197", title: "English Village Court", area: "English Village", type: "House", listing: "sale", status: "Published", agent: "Karwan Mahmoud", owner: "Chiman Rasul", price: 420000, beds: 4, baths: 3, size: 260, daysAgo: 90, updatedDaysAgo: 15, img: 1 },
  { id: "CH-3196", title: "Gulan Business Suite", area: "Gulan", type: "Office", listing: "rent", status: "Published", agent: "Karwan Mahmoud", owner: "Awat Faraj", companyOwner: true, price: 2800, beds: 0, baths: 1, size: 210, daysAgo: 45, updatedDaysAgo: 8 },
  { id: "CH-3195", title: "Ankawa Olive Grove Land", area: "Ankawa", type: "Land", listing: "sale", status: "Published", agent: "Lana Aziz", owner: "Hersh Qadir", price: 320000, beds: 0, baths: 0, size: 1200, daysAgo: 120, updatedDaysAgo: 20 },
  { id: "CH-3194", title: "Cedar Court Apartments", area: "Salim Street", type: "Apartment", listing: "sale", status: "Published", agent: "Sara Hama", owner: "Shilan Aziz", price: 210000, beds: 3, baths: 2, size: 150, featured: true, daysAgo: 25, updatedDaysAgo: 18, img: 2 },
  { id: "CH-3193", title: "Sarchnar Hillside Villa", area: "Sarchnar", type: "Villa", listing: "rent", status: "Published", agent: "Sara Hama", owner: "Kani Omar", price: 2200, beds: 4, baths: 3, size: 380, daysAgo: 30, updatedDaysAgo: 6, img: 2 },
  { id: "CH-3192", title: "Masike Highland Villa", area: "Masike", type: "Villa", listing: "sale", status: "Published", agent: "Rawa Jamal", owner: "Chiman Rasul", price: 380000, beds: 4, baths: 3, size: 340, daysAgo: 150, updatedDaysAgo: 22, img: 3 },
  { id: "CH-3191", title: "Malta Riverside Loft", area: "Malta", type: "Apartment", listing: "rent", status: "Published", agent: "Rawa Jamal", owner: "Tara Botan", price: 900, beds: 1, baths: 1, size: 95, daysAgo: 12, updatedDaysAgo: 4, img: 3 },
  /* -------- Pending (3: sale+agent, rent+no agent, land sale) -------- */
  { id: "CH-3190", title: "Italian Village Rose Flat", area: "Italian Village", type: "Apartment", listing: "sale", status: "Pending", agent: "Lana Aziz", owner: "Berivan Salar", price: 260000, beds: 2, baths: 2, size: 140, daysAgo: 3, updatedDaysAgo: 3 },
  { id: "CH-3189", title: "Raparin Terrace House", area: "Raparin", type: "House", listing: "rent", status: "Pending", agent: null, owner: "Nma Rashid", price: 1100, beds: 3, baths: 2, size: 220, daysAgo: 2, updatedDaysAgo: 2, img: 2 },
  { id: "CH-3188", title: "Nizarke Vineyard Plot", area: "Nizarke", type: "Land", listing: "sale", status: "Pending", agent: "Rawa Jamal", owner: "Awat Faraj", companyOwner: true, price: 180000, beds: 0, baths: 0, size: 800, daysAgo: 7, updatedDaysAgo: 7, img: 1 },
  /* -------- Sold (4, sale only) — updated: today / week / month / year --------
     Every Sold record links its buyer; buyers must have joined before the sale
     closed (buyer joined-daysAgo ≥ updatedDaysAgo, validated in buildProperty). */
  { id: "CH-3187", title: "Olive Grove Estate", area: "Italian Village", type: "Villa", listing: "sale", status: "Sold", agent: "Lana Aziz", owner: "Shilan Aziz", buyer: "Berivan Salar", price: 720000, beds: 5, baths: 4, size: 520, daysAgo: 200, updatedDaysAgo: 0 },
  { id: "CH-3186", title: "Bakhtiari Pearl Flat", area: "Bakhtiari", type: "Apartment", listing: "sale", status: "Sold", agent: "Sara Hama", owner: "Chiman Rasul", buyer: "Avan Mustafa", price: 195000, beds: 2, baths: 1, size: 120, daysAgo: 160, updatedDaysAgo: 4 },
  { id: "CH-3185", title: "Gulan Tower Office", area: "Gulan", type: "Office", listing: "sale", status: "Sold", agent: "Lana Aziz", owner: "Awat Faraj", buyer: "Zana Ibrahim", companyOwner: true, price: 540000, beds: 0, baths: 2, size: 320, daysAgo: 240, updatedDaysAgo: 18, img: 1 },
  { id: "CH-3184", title: "Malta Summit Grounds", area: "Malta", type: "Land", listing: "sale", status: "Sold", agent: "Rawa Jamal", owner: "Zana Ibrahim", buyer: "Rebwar Tofiq", price: 260000, beds: 0, baths: 0, size: 1600, daysAgo: 400, updatedDaysAgo: 140 },
  /* -------- Rented (4, rent only) — updated: today / week / month / year --------
     Tenants link like buyers but are optional: CH-3183 is deliberately rented to
     an off-platform tenant so the "looker with viewings but no tenancy" members
     (Dara, Sara) stay prospective. */
  { id: "CH-3183", title: "Empire World Loft", area: "Empire World", type: "Apartment", listing: "rent", status: "Rented", agent: "Lana Aziz", owner: "Nma Rashid", price: 1600, beds: 2, baths: 2, size: 125, daysAgo: 80, updatedDaysAgo: 0 },
  { id: "CH-3182", title: "Sarchnar Cypress Villa", area: "Sarchnar", type: "Villa", listing: "rent", status: "Rented", agent: "Sara Hama", owner: "Kani Omar", tenant: "Aland Tariq", price: 2600, beds: 4, baths: 4, size: 420, daysAgo: 110, updatedDaysAgo: 5, img: 1 },
  { id: "CH-3181", title: "Ankawa Tower Suite", area: "Ankawa", type: "Apartment", listing: "rent", status: "Rented", agent: "Karwan Mahmoud", owner: "Awat Faraj", tenant: "Kani Omar", price: 3400, beds: 3, baths: 3, size: 280, daysAgo: 140, updatedDaysAgo: 25, img: 1 },
  { id: "CH-3180", title: "Nizarke Sunset Terrace", area: "Nizarke", type: "House", listing: "rent", status: "Rented", agent: "Rawa Jamal", owner: "Tara Botan", tenant: "Zana Ibrahim", price: 850, beds: 3, baths: 2, size: 230, daysAgo: 380, updatedDaysAgo: 258 },
  /* -------- Draft (3: sale+agent, rent+no agent, sale+no agent) -------- */
  { id: "CH-3179", title: "Gulan Emerald Suite", area: "Gulan", type: "Apartment", listing: "sale", status: "Draft", agent: "Karwan Mahmoud", owner: "Zana Ibrahim", price: 610000, beds: 3, baths: 3, size: 340, daysAgo: 1, updatedDaysAgo: 1, img: 2 },
  { id: "CH-3178", title: "Salim Street Studio", area: "Salim Street", type: "Apartment", listing: "rent", status: "Draft", agent: null, owner: "Zana Ibrahim", price: 600, beds: 1, baths: 1, size: 90, daysAgo: 9, updatedDaysAgo: 9 },
  { id: "CH-3177", title: "Masike Zagros Villa", area: "Masike", type: "Villa", listing: "sale", status: "Draft", agent: null, owner: "Hersh Qadir", price: 450000, beds: 5, baths: 3, size: 400, daysAgo: 13, updatedDaysAgo: 13 },
];

function buildProperty(s: PropSpec): PropertyRecord {
  const place = resolvePlace(s.area);
  const owner = MEMBER_BY_NAME.get(s.owner);
  if (!owner) throw new Error(`catalog: property ${s.id} has unknown owner "${s.owner}"`);
  /* Buyer / tenant counterparty links. Every Sold record must name its buyer;
     Rented may omit the tenant (off-platform). Either link must be a real
     member, not the owner, and must have joined before the deal closed. */
  if (s.status === "Sold" && !s.buyer) throw new Error(`catalog: property ${s.id} is Sold but has no buyer`);
  if (s.buyer && s.status !== "Sold") throw new Error(`catalog: property ${s.id} has a buyer but is not Sold`);
  if (s.tenant && s.status !== "Rented") throw new Error(`catalog: property ${s.id} has a tenant but is not Rented`);
  for (const [kind, name] of [["buyer", s.buyer], ["tenant", s.tenant]] as const) {
    if (!name) continue;
    const m = MEMBER_BY_NAME.get(name);
    if (!m) throw new Error(`catalog: property ${s.id} has unknown ${kind} "${name}"`);
    if (name === s.owner) throw new Error(`catalog: property ${s.id} ${kind} "${name}" is also the owner`);
    if (m.daysAgo < s.updatedDaysAgo) throw new Error(`catalog: property ${s.id} ${kind} "${name}" joined after the deal closed`);
  }
  let agent: AgentRef | null = null;
  if (s.agent) {
    const rec = AGENT_BY_NAME.get(s.agent);
    if (!rec) throw new Error(`catalog: property ${s.id} has unknown agent "${s.agent}"`);
    if (rec.verification !== "Verified") throw new Error(`catalog: property ${s.id} agent "${s.agent}" is not verified`);
    agent = { name: rec.name, verified: true, img: rec.img || "" };
  } else if (statusRequiresAgent(s.status)) {
    throw new Error(`catalog: property ${s.id} is ${s.status} but has no agent`);
  }
  const published = s.status === "Published" || s.status === "Sold" || s.status === "Rented";
  return {
    id: s.id,
    title: s.title,
    area: place.area,
    district: place.district,
    city: place.city,
    type: s.type,
    img: PROP_IMG[s.type][(s.img ?? 0) % PROP_IMG[s.type].length],
    owner: { name: owner.name, phone: owner.phone, type: s.companyOwner ? "Company owner" : "Individual owner" },
    agent,
    buyer: s.buyer,
    tenant: s.tenant,
    listing: s.listing,
    status: s.status,
    price: s.price,
    per: s.listing === "rent" ? "/mo" : undefined,
    date: dateFromDaysAgo(s.daysAgo),
    daysAgo: s.daysAgo,
    beds: s.beds,
    baths: s.baths,
    size: s.size,
    featured: s.featured ?? false,
    published,
    listingDate: published ? dateFromDaysAgo(s.daysAgo) : "—",
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
export function countProperties(list: PropertyRecord[]): PropertyCounts {
  const counts: PropertyCounts = { total: list.length, available: 0, pending: 0, sold: 0, rented: 0 };
  for (const p of list) {
    if (p.status === "Published") counts.available++;
    else if (p.status === "Pending") counts.pending++;
    else if (p.status === "Sold") counts.sold++;
    else if (p.status === "Rented") counts.rented++;
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

/* Count Sold / Rented listings whose last status change (p.updated) falls inside
   the selected rolling window — i.e. how many properties actually sold or rented
   in that period. Drawn from the same live records as every other KPI. */
export function countSoldRentedInPeriod(list: PropertyRecord[], period: CountPeriod): { sold: number; rented: number } {
  const max = PERIOD_MAX_DAYS[period];
  let sold = 0;
  let rented = 0;
  for (const p of list) {
    if (p.status !== "Sold" && p.status !== "Rented") continue;
    const ago = daysAgoFrom(p.updated);
    if (ago == null || ago < 0 || ago > max) continue;
    if (p.status === "Sold") sold++;
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
    agent closed deals with. */
export function withAgentStats(agents: AgentRecord[], list: PropertyRecord[]): AgentRecord[] {
  const stats: Record<string, { listings: number; sold: number; rented: number; clients: Set<string> }> = {};
  for (const p of list) {
    if (!p.agent) continue;
    const s = (stats[p.agent.name] ||= { listings: 0, sold: 0, rented: 0, clients: new Set() });
    if (p.status === "Published" || p.status === "Pending") s.listings++;
    else if (p.status === "Sold") s.sold++;
    else if (p.status === "Rented") s.rented++;
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

export const fmtUSD = (n: number) => "$" + n.toLocaleString("en-US");
export const ICON_PHONE: IconName = "phone";
