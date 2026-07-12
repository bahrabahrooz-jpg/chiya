import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import { AGENTS as CATALOG_AGENTS, PROPERTIES as CATALOG_PROPERTIES, getAgentByName, type PropertyDetails, type PropertyRecord } from "../_data/catalog";
export { statusRequiresAgent } from "../_data/catalog";

export const STATUS_META: Record<string, { variant: BadgeVariant; dot?: boolean; icon?: IconName }> = {
  Draft: { variant: "neutral", dot: true },
  Pending: { variant: "warning", dot: true },
  Published: { variant: "success", dot: true },
  Sold: { variant: "error", dot: true },
  Rented: { variant: "info", dot: true },
  Archived: { variant: "neutral", icon: "archive" },
};
export const STATUS_OPTIONS = Object.keys(STATUS_META).filter((s) => s !== "Archived");
export const STATUS_DOT_COLOR: Record<string, string> = {
  neutral: "var(--gray-400)", warning: "var(--warning-500)", success: "var(--success-500)",
  error: "var(--error-500)", info: "var(--info-500)", gold: "var(--gold-500)", brand: "var(--brand-primary)",
};

export function fmtUSD(n: number) {
  return "$" + n.toLocaleString("en-US");
}

const GALLERY: Record<string, string[]> = {
  villa: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=72",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=72",
  ],
  penthouse: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=700&q=72",
  ],
  townhouse: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=700&q=72",
  ],
  office: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1462826303086-329426d1aef5?auto=format&fit=crop&w=700&q=72",
  ],
  land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=72",
  ],
};

export interface OwnerRef { name: string; phone: string; type: string; email?: string }
export interface DetailAgent { name: string; verified: boolean; listings?: number; phone: string; img: string; email?: string; rating?: string; reviews?: number }
interface BaseProperty {
  id: string; title: string; area: string; city: string; type: string; img: string;
  owner: OwnerRef; agent: DetailAgent | null; listing: "sale" | "rent"; status: string;
  price: number; per?: string; date: string; beds: number; baths: number; size: number;
  published: boolean; featured: boolean; listingDate: string; updated: string;
}

/* Adapt the shared catalog records into the richer detail-page shape. */
function toBase(p: PropertyRecord): BaseProperty {
  const roster = p.agent ? getAgentByName(p.agent.name) : undefined;
  return {
    id: p.id,
    title: p.title,
    area: p.area,
    city: p.city,
    type: p.type,
    img: p.img,
    owner: { name: p.owner.name, phone: p.owner.phone, type: p.owner.type },
    agent: p.agent
      // Only verified agents can be assigned, so an assigned agent is always
      // shown as verified — never "Pending" — regardless of any stale record.
      ? { name: p.agent.name, verified: true, phone: roster?.phone || "+964 750 000 0000", img: p.agent.img, listings: roster?.listings }
      : null,
    listing: p.listing,
    status: p.status,
    price: p.price,
    per: p.per,
    date: p.date,
    beds: p.beds,
    baths: p.baths,
    size: p.size,
    published: p.published,
    featured: p.featured,
    listingDate: p.listingDate,
    updated: p.updated,
  };
}
function emailFromName(name: string) {
  return name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@mail.chiya.estate";
}

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
function buildNotes(p: BaseProperty): NoteItem[] {
  const notes: NoteItem[] = [];
  if (p.status === "Pending") {
    notes.push({ author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 14, 2026 · 09:42", kind: "review", text: "Ownership documents verified. Awaiting final pricing confirmation from the owner before publishing." });
    notes.push({ author: "Lana Aziz", role: "Agent", time: "Jun 13, 2026 · 16:08", kind: "note", text: "Owner requested the listing go live before the weekend. Photography set is complete and approved." });
  } else if (p.status === "Published") {
    notes.push({ author: "Rêbîn Kawa", role: "Super Admin", time: p.updated + " · 11:20", kind: "approval", text: "Listing approved and published. Featured placement granted for the Erbil premium collection." });
    notes.push({ author: p.agent ? p.agent.name : "Listing team", role: "Agent", time: p.listingDate + " · 10:05", kind: "note", text: "All media uploaded and ownership confirmed. Ready for the public site." });
  } else if (p.status === "Sold" || p.status === "Rented") {
    notes.push({ author: "Rêbîn Kawa", role: "Super Admin", time: p.updated + " · 14:30", kind: "approval", text: `Deal closed and archived from active search. Marked as ${p.status.toLowerCase()} by the assigned agent.` });
    notes.push({ author: p.agent ? p.agent.name : "Listing team", role: "Agent", time: p.listingDate + " · 09:15", kind: "note", text: "Final paperwork submitted to operations. Commission recorded against this listing." });
  } else {
    notes.push({ author: p.agent ? p.agent.name : "Listing team", role: "Agent", time: p.updated + " · 12:00", kind: "note", text: "Draft created. Pending media upload and ownership verification before submitting for approval." });
  }
  return notes;
}

export interface TimelineEvent { icon: IconName; tone: string; title: string; desc: string; time: string }
function buildTimeline(p: BaseProperty): TimelineEvent[] {
  const t: TimelineEvent[] = [{ icon: "plus-circle", tone: "brand", title: "Property created", desc: `Listing ${p.id} added to the platform.`, time: p.date }];
  if (p.agent) t.push({ icon: "user-check", tone: "info", title: "Agent assigned", desc: `${p.agent.name} assigned as the listing agent.`, time: p.date });
  t.push({ icon: "image", tone: "neutral", title: "Media uploaded", desc: "Cover image and gallery set added.", time: p.date });
  t.push({ icon: "dollar-sign", tone: "gold", title: "Price updated", desc: `Asking price set to ${fmtUSD(p.price)}${p.per || ""}.`, time: p.listingDate !== "—" ? p.listingDate : p.date });
  if (p.published) t.push({ icon: "globe", tone: "success", title: "Listing published", desc: "Made visible on the public website and apps.", time: p.listingDate });
  if (p.status === "Pending") t.push({ icon: "clock", tone: "warning", title: "Submitted for approval", desc: "Awaiting admin review before publishing.", time: p.updated });
  if (p.status === "Sold") t.push({ icon: "key", tone: "error", title: "Marked as sold", desc: "Closed and removed from active search.", time: p.updated });
  if (p.status === "Rented") t.push({ icon: "key-round", tone: "info", title: "Marked as rented", desc: "Active rental contract recorded.", time: p.updated });
  return t.reverse();
}

const CITY_COORDS: Record<string, [number, number]> = { Erbil: [36.1901, 43.993], Sulaymaniyah: [35.5616, 45.4329], Duhok: [36.8674, 42.988] };

export interface Amenity { icon: IconName; label: string }
const AMENITY_POOL: Amenity[] = [
  { icon: "waves", label: "Swimming pool" }, { icon: "trees", label: "Private garden" }, { icon: "shield-check", label: "24/7 gated security" },
  { icon: "sun", label: "Terraces & balconies" }, { icon: "chevrons-up", label: "Elevator" }, { icon: "cpu", label: "Smart-home system" },
  { icon: "dumbbell", label: "Home gym" }, { icon: "thermometer-sun", label: "Central heating & cooling" }, { icon: "square-parking", label: "Covered parking" },
  { icon: "cctv", label: "CCTV surveillance" }, { icon: "zap", label: "Backup generator" }, { icon: "wifi", label: "High-speed internet" },
  { icon: "flame", label: "Fireplace" }, { icon: "droplets", label: "Water tank & filtration" },
];
function buildAmenities(p: BaseProperty, seed: number): Amenity[] {
  const t = p.type.toLowerCase();
  if (t === "land") return [];
  const count = t === "villa" || t === "penthouse" || t === "townhouse" ? 9 : t === "office" ? 6 : 7;
  const out: Amenity[] = [];
  for (let i = 0; i < AMENITY_POOL.length && out.length < count; i++) {
    if ((seed + i * 3) % 7 < 5) out.push(AMENITY_POOL[(seed + i) % AMENITY_POOL.length]);
  }
  const seen = new Set<string>();
  const uniq = out.filter((a) => (seen.has(a.label) ? false : seen.add(a.label)));
  let i = 0;
  while (uniq.length < count && i < AMENITY_POOL.length) {
    const a = AMENITY_POOL[i++];
    if (!seen.has(a.label)) {
      seen.add(a.label);
      uniq.push(a);
    }
  }
  return uniq;
}

export interface Specs {
  address: string; coords: string; mapUrl: string; landSize: number | null; garages: number | null;
  yearBuilt: number | null; furnished: string | null; floor: string | null; currency: string;
  pricePerM2: number | null; dateCreated: string; amenities: Amenity[];
}
function buildSpecs(p: BaseProperty): Specs {
  const t = p.type.toLowerCase();
  const isUnit = t === "apartment" || t === "office" || t === "penthouse";
  const seed = (p.id.charCodeAt(4) || 0) + (p.id.charCodeAt(5) || 0);
  const base = CITY_COORDS[p.city] || CITY_COORDS["Erbil"];
  const lat = (base[0] + ((seed % 20) - 10) / 1000).toFixed(4);
  const lng = (base[1] + ((seed % 14) - 7) / 1000).toFixed(4);
  return {
    address: `${p.area}, ${p.city}, Kurdistan Region, Iraq`,
    coords: `${lat}° N, ${lng}° E`,
    mapUrl: `https://www.google.com/maps?q=${lat},${lng}`,
    landSize: t === "villa" || t === "townhouse" ? Math.round(p.size * (1.6 + (seed % 6) / 10)) : t === "land" ? p.size : null,
    garages: t === "land" ? null : p.beds >= 4 ? 2 : p.beds >= 1 ? 1 : t === "office" ? 3 : null,
    yearBuilt: t === "land" ? null : 2014 + (seed % 11),
    furnished: t === "land" ? null : t === "office" ? "Unfurnished" : ["Furnished", "Semi-furnished", "Unfurnished"][seed % 3],
    floor: isUnit ? (t === "penthouse" ? "Top floor · Penthouse" : "Floor " + (2 + (seed % 14))) : null,
    currency: "USD · US Dollar",
    pricePerM2: p.listing === "sale" && p.size ? Math.round(p.price / p.size) : null,
    dateCreated: p.date,
    amenities: buildAmenities(p, seed),
  };
}

const CURRENCY_LABEL: Record<string, string> = { USD: "USD · US Dollar", IQD: "IQD · Iraqi Dinar", EUR: "EUR · Euro" };

/* Start from the deterministic specs and overlay whatever the user actually
   entered in the Add-property wizard, so only unfilled fields stay generated. */
function buildSpecsWith(p: BaseProperty, d: PropertyDetails): Specs {
  const base = buildSpecs(p);
  const address = [d.building, d.street, d.project, p.area, p.city, "Kurdistan Region, Iraq"].filter(Boolean).join(", ");
  const hasCoords = !!(d.lat && d.lng);
  return {
    ...base,
    address: address || base.address,
    coords: hasCoords ? `${d.lat}° N, ${d.lng}° E` : base.coords,
    mapUrl: hasCoords ? `https://www.google.com/maps?q=${d.lat},${d.lng}` : base.mapUrl,
    garages: typeof d.parking === "number" ? d.parking || null : base.garages,
    yearBuilt: d.year ? Number(d.year) || base.yearBuilt : base.yearBuilt,
    furnished: d.furnishing || base.furnished,
    floor: typeof d.floors === "number" && d.floors > 0 ? `${d.floors} floor${d.floors > 1 ? "s" : ""}` : base.floor,
    currency: d.currency ? CURRENCY_LABEL[d.currency] || base.currency : base.currency,
    amenities: d.amenities && d.amenities.length ? d.amenities : base.amenities,
  };
}

export interface DetailProperty extends Omit<BaseProperty, "agent"> {
  location: string;
  gallery: string[];
  owner: Required<OwnerRef>;
  agent: DetailAgent | null;
  specs: Specs;
  notes: NoteItem[];
  timeline: TimelineEvent[];
}

/* Adapt a catalog / store record into the full detail-page shape. Records that
   carry `details` (created via the wizard) render exactly what was entered;
   seed records fall back to the deterministic generators. */
export function toDetailProperty(rec: PropertyRecord): DetailProperty {
  const p = toBase(rec);
  const d = rec.details;
  const agent: DetailAgent | null = p.agent
    ? { ...p.agent, email: emailFromName(p.agent.name), phone: d?.agentPhone || p.agent.phone, listings: p.agent.listings ?? 6 + ((rec.id.charCodeAt(5) || 0) % 12) }
    : null;
  return {
    ...p,
    location: p.area + ", " + p.city,
    gallery: d?.gallery && d.gallery.length ? d.gallery : GALLERY[p.type.toLowerCase()] || GALLERY.villa,
    owner: { ...p.owner, type: d?.ownerType || p.owner.type, email: d?.ownerEmail || emailFromName(p.owner.name) },
    agent,
    specs: d ? buildSpecsWith({ ...p, agent }, d) : buildSpecs({ ...p, agent }),
    notes: buildNotes({ ...p, agent }),
    timeline: buildTimeline({ ...p, agent }),
  };
}

export const PROPERTIES: DetailProperty[] = CATALOG_PROPERTIES.map(toDetailProperty);

/* Assignable agents: the full verified roster (not just those already on a
   listing), so the reassign picker can search the whole team. Unverified agents
   are excluded — only verified agents can be assigned. */
export const AGENTS_LIST: DetailAgent[] = CATALOG_AGENTS.filter((a) => a.verification === "Verified")
  .map((a) => ({
    name: a.name,
    verified: true,
    phone: a.phone,
    img: a.img || "",
    email: a.email,
    listings: a.listings,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function getProperty(id: string): DetailProperty {
  return PROPERTIES.find((p) => p.id === id) || PROPERTIES[0];
}

export const VIEWING_STATUS: Record<string, { variant: BadgeVariant; icon: IconName }> = {
  Scheduled: { variant: "info", icon: "clock" },
  Confirmed: { variant: "success", icon: "circle-check" },
  Completed: { variant: "brand", icon: "check" },
  Cancelled: { variant: "error", icon: "circle-x" },
  "No Show": { variant: "warning", icon: "user-x" },
};

export interface ViewingReq { id: string; member: string; img: string; phone: string; date: string; time: string; status: string }
const VIEWING_REQUESTS: Record<string, ViewingReq[]> = {
  "CH-2041": [
    { id: "VW-1042", member: "Sara Hassan", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70", phone: "+964 750 112 4408", date: "Jun 24, 2026", time: "11:00 AM", status: "Confirmed" },
    { id: "VW-1039", member: "Karzan Omar", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70", phone: "+964 750 663 2204", date: "Jun 25, 2026", time: "2:30 PM", status: "Scheduled" },
    { id: "VW-1031", member: "Nadia Farid", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70", phone: "+964 770 884 1196", date: "Jun 20, 2026", time: "10:00 AM", status: "Completed" },
    { id: "VW-1024", member: "Ahmad Karimi", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=70", phone: "+964 751 339 7720", date: "Jun 16, 2026", time: "4:00 PM", status: "Cancelled" },
  ],
  "CH-2038": [
    { id: "VW-1040", member: "Zana Rashid", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70", phone: "+964 750 226 5531", date: "Jun 24, 2026", time: "9:30 AM", status: "Scheduled" },
    { id: "VW-1033", member: "Hana Bakr", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=70", phone: "+964 751 447 9082", date: "Jun 21, 2026", time: "1:00 PM", status: "Completed" },
  ],
  "CH-2029": [{ id: "VW-1037", member: "Dara Karim", img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=70", phone: "+964 750 770 1184", date: "Jun 23, 2026", time: "3:30 PM", status: "Confirmed" }],
};
export const getViewings = (id: string): ViewingReq[] => VIEWING_REQUESTS[id] || [];
