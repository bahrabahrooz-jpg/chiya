/* =============================================================================
   Chiya admin — central data catalog (single source of truth).

   Everything the admin area shows is generated here and cross-linked by name:
   - properties reference a real location (city → district → project), a real
     owner (a Seller/Landlord member) and, usually, a real agent.
   - members carry buyer / seller / landlord / tenant roles; their "properties"
     count is the number of listings they own.
   - agents' listing / sold / rented / members stats are counted from the
     properties assigned to them.

   The records are generated once, deterministically, so the numbers are stable
   across renders. List/KPI pages derive their figures from these helpers, so
   adding or removing a property updates every count consistently.
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
  agency: string;
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
   Deterministic helpers
   ------------------------------------------------------------------------- */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
const pick = <T>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const randInt = (r: () => number, min: number, max: number) => min + Math.floor(r() * (max - min + 1));

const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TODAY = new Date(2026, 5, 30); // Jun 30, 2026
function dateFromDaysAgo(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return `${MONTHS_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* ----------------------------------------------------------------------------
   Name pools
   ------------------------------------------------------------------------- */
const FIRST = [
  "Karwan", "Lana", "Sirwan", "Dashne", "Awat", "Hewa", "Nyan", "Shilan", "Berivan", "Tara",
  "Rebwar", "Diyar", "Aland", "Avan", "Baban", "Chiman", "Darya", "Evar", "Hawre", "Jiyan",
  "Kani", "Lavin", "Media", "Nali", "Peshraw", "Rojan", "Sazan", "Twana", "Zhino", "Aram",
  "Bawar", "Choman", "Delan", "Ezel", "Goran", "Helin", "Karox", "Midya", "Newroz", "Payam",
  "Rezan", "Soran", "Tania", "Viyan", "Warya", "Zana", "Hana", "Shad", "Bahar", "Kosrat",
  "Sara", "Ahmad", "Nadia", "Dara", "Shno", "Bnar", "Peshawa", "Rawa", "Karzan", "Vian",
];
const LAST = [
  "Mahmoud", "Aziz", "Tofiq", "Salar", "Rashid", "Botan", "Faraj", "Aram", "Khalid", "Jamal",
  "Ahmad", "Barzani", "Hama", "Hassan", "Ibrahim", "Karim", "Mustafa", "Omar", "Qadir", "Rasul",
  "Salih", "Tahir", "Wali", "Xoshnaw", "Yusuf", "Zebari", "Amin", "Hawrami", "Mohammed", "Saleh",
];

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
  Penthouse: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=240&q=70",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=240&q=70",
  ],
  Townhouse: [
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

const PORTRAITS: string[] = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=70",
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

interface PlaceableArea {
  area: string;
  district: string;
  city: string;
}
const PLACEABLE: PlaceableArea[] = [];
for (const c of LOCATION_DEF) {
  for (const d of c.districts) {
    if (d.projects.length) {
      for (const p of d.projects) PLACEABLE.push({ area: p, district: d.name, city: c.city });
    } else {
      PLACEABLE.push({ area: d.name, district: d.name, city: c.city });
    }
  }
}
const AREAS_BY_CITY: Record<string, PlaceableArea[]> = {};
for (const a of PLACEABLE) (AREAS_BY_CITY[a.city] ||= []).push(a);
const CITY_WEIGHTED: string[] = [];
for (const c of LOCATION_DEF) for (let k = 0; k < Math.round(c.weight * 100); k++) CITY_WEIGHTED.push(c.city);

/* ----------------------------------------------------------------------------
   Property type config
   ------------------------------------------------------------------------- */
const TYPE_WEIGHTED = ["Villa", "Villa", "Apartment", "Apartment", "Apartment", "Penthouse", "Townhouse", "Townhouse", "Office", "Land"];
const TITLE_ADJ = [
  "Olive Grove", "Marble Hill", "Cedar Court", "Tigris View", "Goizha", "Park View", "Citadel", "Zagros", "Lakeside", "Empire",
  "Dream", "Royal", "Golden", "Crystal", "Garden", "Sunrise", "Hillside", "Riverside", "Pearl", "Emerald",
  "Skyline", "Highland", "Maple", "Rose", "Cypress", "Jasmine", "Almond", "Vineyard", "Summit", "Azadi",
];
const NOUN_BY_TYPE: Record<string, string[]> = {
  Villa: ["Villa", "Estate", "Residence", "Mansion"],
  Apartment: ["Apartment", "Loft", "Flat", "Residences"],
  Penthouse: ["Penthouse", "Sky Suite", "Tower Suite"],
  Townhouse: ["Townhouse", "Court", "Terrace"],
  Office: ["Office", "Business Suite", "Tower", "Plaza"],
  Land: ["Land", "Plot", "Grounds"],
};
const STATUS_WEIGHTED = [
  "Published", "Published", "Published", "Published", "Published", "Published",
  "Pending", "Pending",
  "Sold", "Sold", "Sold",
  "Rented", "Rented",
  "Draft",
];

function phone(r: () => number): string {
  const p = pick(r, ["750", "751", "770", "773"]);
  return `+964 ${p} ${randInt(r, 100, 999)} ${randInt(r, 1000, 9999)}`;
}
function emailFor(name: string, host: string): string {
  return name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@" + host;
}

/* ----------------------------------------------------------------------------
   Roster generation
   ------------------------------------------------------------------------- */
const MEMBER_COUNT = 240;
const AGENT_COUNT = 48;
const PROPERTY_COUNT = 320;

/* Pair indices so every n yields a distinct (first, last) combo: the first name
   cycles fastest, the surname advances once per full pass. 60×30 = 1,800 unique
   names, far more than we need — and, crucially, no unbounded search loop. */
function uniqueName(n: number, firstOffset: number, lastOffset: number): string {
  const first = FIRST[(n + firstOffset) % FIRST.length];
  const last = LAST[(Math.floor(n / FIRST.length) + lastOffset) % LAST.length];
  return `${first} ${last}`;
}

function buildMembers(): MemberRecord[] {
  const r = rng(20260630);
  const out: MemberRecord[] = [];
  for (let n = 0; n < MEMBER_COUNT; n++) {
    const name = uniqueName(n, 0, 0); // surnames 0..3 → the "member" namespace
    const roles: string[] = [];
    if (r() < 0.62) roles.push("Buyer");
    if (r() < 0.3) roles.push("Seller");
    if (r() < 0.22) roles.push("Landlord");
    if (r() < 0.16) roles.push("Tenant");
    if (roles.length === 0) roles.push("Buyer");
    const daysAgo = randInt(r, 1, 720);
    out.push({
      id: "M-" + (5000 - out.length),
      name,
      roles,
      phone: phone(r),
      email: emailFor(name, r() < 0.5 ? "gmail.com" : "outlook.com"),
      properties: 0, // filled in by withMemberCounts
      joined: dateFromDaysAgo(daysAgo),
      daysAgo,
      status: r() < 0.92 ? "Active" : "Suspended",
      img: r() < 0.78 ? PORTRAITS[out.length % PORTRAITS.length] : null,
    });
  }
  return out;
}
export const MEMBERS: MemberRecord[] = buildMembers();

const SELLER_MEMBERS = MEMBERS.filter((m) => m.roles.includes("Seller"));
const LANDLORD_MEMBERS = MEMBERS.filter((m) => m.roles.includes("Landlord"));

function buildAgents(): AgentRecord[] {
  const r = rng(778899);
  const AGENCIES = ["Chiya Prime", "Erbil Realty", "Sulay Homes", "Duhok Estate", "Zagros Living", "Empire Realty", "Naz Properties"];
  const out: AgentRecord[] = [];
  for (let n = 0; n < AGENT_COUNT; n++) {
    // lastOffset 12 keeps agent surnames out of the member surname range (0..3)
    const name = uniqueName(n, 0, 12);
    const place = PLACEABLE[(n * 4) % PLACEABLE.length];
    out.push({
      id: "A-" + (2100 - n),
      name,
      agency: pick(r, AGENCIES),
      phone: phone(r),
      email: emailFor(name, "chiya.estate"),
      city: place.city,
      area: place.area,
      verification: r() < 0.8 ? "Verified" : "Pending",
      listings: 0,
      sold: 0,
      rented: 0,
      members: 0,
      status: r() < 0.94 ? "Active" : "Suspended",
      img: r() < 0.85 ? PORTRAITS[n % PORTRAITS.length] : null,
    });
  }
  return out;
}
export const AGENTS: AgentRecord[] = buildAgents();

function buildProperties(): PropertyRecord[] {
  const r = rng(424242);
  const out: PropertyRecord[] = [];
  let sellerCursor = 0;
  let landlordCursor = 0;
  for (let i = 0; i < PROPERTY_COUNT; i++) {
    const city = CITY_WEIGHTED[Math.floor(r() * CITY_WEIGHTED.length)];
    const place = pick(r, AREAS_BY_CITY[city]);
    const type = pick(r, TYPE_WEIGHTED);
    let status = pick(r, STATUS_WEIGHTED);
    // Land is never "Rented"; offices skew to rent.
    let listing: "sale" | "rent";
    if (type === "Land") {
      listing = "sale";
      if (status === "Rented") status = "Published";
    } else if (type === "Office" || type === "Apartment") {
      listing = r() < 0.55 ? "rent" : "sale";
    } else {
      listing = r() < 0.25 ? "rent" : "sale";
    }
    // Keep status and listing coherent.
    if (status === "Rented") listing = "rent";
    if (status === "Sold") listing = "sale";

    const ownerPool = listing === "rent" ? LANDLORD_MEMBERS : SELLER_MEMBERS;
    const owner = listing === "rent" ? ownerPool[landlordCursor++ % ownerPool.length] : ownerPool[sellerCursor++ % ownerPool.length];

    const hasAgent = r() < 0.85;
    let agentRec: AgentRecord | null = null;
    if (hasAgent) {
      const sameCity = AGENTS.filter((a) => a.city === city);
      agentRec = sameCity.length && r() < 0.7 ? pick(r, sameCity) : pick(r, AGENTS);
    }

    const beds = type === "Land" || type === "Office" ? 0 : randInt(r, 1, 6);
    const baths = type === "Land" ? 0 : Math.max(1, beds - randInt(r, 0, 2));
    const size =
      type === "Land" ? randInt(r, 400, 2400)
      : type === "Villa" ? randInt(r, 280, 620)
      : type === "Townhouse" ? randInt(r, 200, 360)
      : type === "Penthouse" ? randInt(r, 220, 420)
      : type === "Office" ? randInt(r, 90, 360)
      : randInt(r, 90, 240);

    const price =
      listing === "rent"
        ? randInt(r, 6, 45) * 100 // 600 – 4,500 /mo
        : randInt(r, 150, 1600) * 1000; // 150k – 1.6M

    const daysAgo = randInt(r, 1, 540);
    const updatedDaysAgo = Math.max(0, daysAgo - randInt(r, 0, 6));
    const adj = TITLE_ADJ[(i * 3) % TITLE_ADJ.length];
    const noun = pick(r, NOUN_BY_TYPE[type]);
    const published = status === "Published" || status === "Sold" || status === "Rented";

    out.push({
      id: "CH-" + (3200 - i),
      title: `${adj} ${noun}`,
      area: place.area,
      district: place.district,
      city,
      type,
      img: pick(r, PROP_IMG[type]),
      owner: { name: owner.name, phone: owner.phone, type: r() < 0.85 ? "Individual owner" : "Company owner" },
      agent: agentRec ? { name: agentRec.name, verified: agentRec.verification === "Verified", img: agentRec.img || PORTRAITS[0] } : null,
      listing,
      status,
      price,
      per: listing === "rent" ? "/mo" : undefined,
      date: dateFromDaysAgo(daysAgo),
      daysAgo,
      beds,
      baths,
      size,
      featured: r() < 0.15,
      published,
      listingDate: published ? dateFromDaysAgo(daysAgo) : "—",
      updated: dateFromDaysAgo(updatedDaysAgo),
    });
  }
  return out;
}
export const PROPERTIES: PropertyRecord[] = buildProperties();

/* Distinct assignable agents (for the "assign agent" picker). */
export const AGENTS_LIST: AgentRef[] = AGENTS.map((a) => ({ name: a.name, verified: a.verification === "Verified", img: a.img || PORTRAITS[0] })).sort((x, y) =>
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

/** Overlay each member's owned-listing count from the live property list. */
export function withMemberCounts(members: MemberRecord[], list: PropertyRecord[]): MemberRecord[] {
  const owned: Record<string, number> = {};
  for (const p of list) owned[p.owner.name] = (owned[p.owner.name] || 0) + 1;
  return members.map((m) => ({ ...m, properties: owned[m.name] || 0 }));
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

/** Overlay each agent's listing / sold / rented / members stats from properties. */
export function withAgentStats(agents: AgentRecord[], list: PropertyRecord[]): AgentRecord[] {
  const stats: Record<string, { listings: number; sold: number; rented: number; owners: Set<string> }> = {};
  for (const p of list) {
    if (!p.agent) continue;
    const s = (stats[p.agent.name] ||= { listings: 0, sold: 0, rented: 0, owners: new Set() });
    if (p.status === "Published" || p.status === "Pending") s.listings++;
    else if (p.status === "Sold") s.sold++;
    else if (p.status === "Rented") s.rented++;
    s.owners.add(p.owner.name);
  }
  return agents.map((a) => {
    const s = stats[a.name];
    return s ? { ...a, listings: s.listings, sold: s.sold, rented: s.rented, members: s.owners.size } : { ...a, listings: 0, sold: 0, rented: 0, members: 0 };
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
