/** Property Detail — built per-id from the admin catalog's public subset, so the
    public PDP shows the SAME property (and the SAME assigned agent) the admin
    manages. buildPdp(id) returns everything the detail page renders for an
    available (Published) listing, or null for anything not public (Pending /
    Draft / Sold / Rented / unknown id) — the route then 404s.

    Gallery, specs, and amenity chips are reused from the admin property-detail
    generators (app/admin/_property-detail/data) so the public and admin detail
    pages describe each property identically. */

import { getSiteProperty, similarProperties, type SiteProperty } from "@/lib/site-properties";
import { getSiteAgent, portraitUrl } from "@/lib/site-agents";
import { getProperty as getAdminDetail, type DetailProperty } from "@/app/admin/_property-detail/data";

export interface PdpProperty {
  id: string;
  title: string;
  neighborhood: string;
  city: string;
  address: string;
  deal: "buy" | "rent";
  price: number;
  per?: string;
  status: string; // "For Sale" | "For Rent"
  featured: boolean;
  type: string; // display-cased, e.g. "Villa"
  beds: number;
  baths: number;
  area: number;
  photoCount: number;
  hasTour: boolean;
  lat: number;
  lng: number;
}

export interface IconRow {
  icon: string;
  label: string;
  value?: string;
}

export interface PdpAgent {
  id: string; // slug for /agents/[id]
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviews: number;
  phone: string;
}

export interface Similar {
  id: string;
  title: string;
  address: string;
  price: number;
  status: string;
  featured?: boolean;
  beds: number;
  baths: number;
  area: number;
  photoCount: number;
  cover: string;
}

export interface PdpData {
  property: PdpProperty;
  gallery: string[];
  description: string[];
  features: IconRow[];
  amenities: IconRow[];
  agent: PdpAgent;
  similar: Similar[];
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Pull the "lat,lng" a detail record encodes in its Google Maps link. */
function coordsFromDetail(d: DetailProperty): { lat: number; lng: number } {
  const m = /q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(d.specs.mapUrl);
  return m ? { lat: Number(m[1]), lng: Number(m[2]) } : { lat: 36.1901, lng: 43.993 };
}

/* The property "Features" grid mirrors exactly the fields the Add-property
   wizard collects — nothing derived or fabricated. Each row is shown only when
   the property has a value for it (land listings omit beds/floor/etc.). */
function buildFeatures(sp: SiteProperty, d: DetailProperty): IconRow[] {
  const s = d.specs;
  const rows: IconRow[] = [
    { icon: sp.deal === "rent" ? "key" : "tag", label: "Listing type", value: sp.status },
    { icon: "home", label: "Property type", value: cap(sp.type) },
    { icon: "maximize-2", label: "Built-up area", value: `${sp.size} m²` },
  ];
  if (sp.beds > 0) rows.push({ icon: "bed-double", label: "Bedrooms", value: String(sp.beds) });
  if (sp.baths > 0) rows.push({ icon: "bath", label: "Bathrooms", value: String(sp.baths) });
  if (s.garages) rows.push({ icon: "car", label: "Parking", value: `${s.garages} covered` });
  if (s.floor) rows.push({ icon: "layers", label: "Floor", value: s.floor });
  if (s.yearBuilt) rows.push({ icon: "calendar", label: "Year built", value: String(s.yearBuilt) });
  if (s.orientation) rows.push({ icon: "compass", label: "Orientation", value: s.orientation });
  if (s.condition) rows.push({ icon: "badge-check", label: "Property condition", value: s.condition });
  if (s.furnished) rows.push({ icon: "sofa", label: "Furnishing", value: s.furnished });
  return rows;
}

function buildDescription(sp: SiteProperty, d: DetailProperty): string[] {
  const t = sp.type;
  const dealPhrase = sp.deal === "rent" ? "available to rent" : "for sale";
  const amenityLabels = d.specs.amenities.slice(0, 3).map((a) => a.label.toLowerCase());
  const roomLine =
    sp.beds > 0
      ? `${sp.beds} bedroom${sp.beds > 1 ? "s" : ""}${sp.baths > 0 ? ` and ${sp.baths} bathroom${sp.baths > 1 ? "s" : ""}` : ""}`
      : "flexible, open-plan space";
  const paras = [
    `${sp.title} is a ${t} in ${sp.area}, ${sp.city}, ${dealPhrase} through Chiya. Set across ${sp.size} m² in one of ${sp.city}'s established addresses, it pairs a practical layout with the finish buyers expect from a verified Chiya listing.`,
    t === "land"
      ? `The plot spans ${d.specs.landSize ?? sp.size} m² with clear access and services nearby — a ready canvas for a private villa or an investment build in a location that continues to appreciate.`
      : `Inside you'll find ${roomLine}, framed by ${amenityLabels.length ? amenityLabels.join(", ") : "quality fittings"} and natural light throughout. Every room has been kept move-in ready.`,
    `Listed and managed by a verified Chiya agent, ${sp.title} has been reviewed and approved by our team before going live — so what you see is exactly what you'll view. Book a viewing to see it in person.`,
  ];
  return paras;
}

export function buildPdp(id: string): PdpData | null {
  const sp = getSiteProperty(id);
  if (!sp) return null; // not a public (Published) listing → 404
  const d = getAdminDetail(id);
  const a = getSiteAgent(sp.agentId);
  const { lat, lng } = coordsFromDetail(d);

  const agent: PdpAgent = {
    id: a?.id ?? sp.agentId,
    name: a?.name ?? sp.agentName,
    avatar: portraitUrl(a?.photo ?? "", 200),
    verified: a?.verified ?? true,
    rating: a?.rating ?? 0,
    reviews: a?.reviewCount ?? 0,
    phone: a?.phone ?? "",
  };

  const similar: Similar[] = similarProperties(id, 3).map((p) => ({
    id: p.id,
    title: p.title,
    address: p.address,
    price: p.price,
    status: p.status,
    featured: p.featured,
    beds: p.beds,
    baths: p.baths,
    area: p.size,
    photoCount: p.photoCount,
    cover: p.cover,
  }));

  return {
    property: {
      id: sp.id,
      title: sp.title,
      neighborhood: sp.area,
      city: sp.city,
      address: sp.address,
      deal: sp.deal,
      price: sp.price,
      per: sp.per,
      status: sp.status,
      featured: sp.featured,
      type: cap(sp.type),
      beds: sp.beds,
      baths: sp.baths,
      area: sp.size,
      photoCount: sp.photoCount,
      hasTour: sp.type !== "land", // every built property offers a virtual tour
      lat,
      lng,
    },
    gallery: d.gallery,
    description: buildDescription(sp, d),
    features: buildFeatures(sp, d),
    amenities: d.specs.amenities.map((am) => ({ icon: am.icon as string, label: am.label })),
    agent,
    similar,
  };
}
