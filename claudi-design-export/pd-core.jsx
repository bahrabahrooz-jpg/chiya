/* ==================================================================
   PROPERTY DETAILS — CORE
   Shell (sidebar/topbar), enriched property dataset, shared modals
   + toast. Everything is exported to window for the page script.
================================================================== */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge } = DS;

const LOGO = "assets/chiya-logomark.svg";

/* ------------------------------------------------------------------
   SHELL DATA  (matches the approved Properties page shell)
------------------------------------------------------------------ */
const NAV_GROUPS = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard" }] },
  { label: "Management", items: [
    { id: "properties", label: "Properties", icon: "building-2" },
    { id: "members", label: "Members", icon: "users" },
    { id: "agents", label: "Agents", icon: "badge-check" },
    { id: "viewings", label: "Viewings", icon: "calendar-check" },
    { id: "locations", label: "Locations", icon: "map-pin" }] },
  { label: "Platform", items: [
    { id: "reports", label: "Reports", icon: "chart-column" },
    { id: "roles", label: "Roles & permissions", icon: "key-round" },
    { id: "settings", label: "Settings", icon: "settings" }] }];

const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items);

const PAGE_MAP = {
  dashboard: "Admin-Dashboard page.html",
  properties: "Admin-Properties Page.html",
  members: "Admin-Members Page.html",
  agents: "Admin-Agents Page.html",
  viewings: "Admin-Viewings Page.html",
  activity: "Admin-Activity Page.html",
  locations: "Admin-Locations Page.html",
  reports: "Admin-Reports Page.html",
  roles: "Admin-Roles & permissions page.html"
};

const NOTIFICATIONS = [
  { id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
  { id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
  { id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
  { id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" }];

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };

const STATUS_META = {
  "Draft": { variant: "neutral", dot: true },
  "Pending": { variant: "warning", dot: true },
  "Published": { variant: "success", dot: true },
  "Sold": { variant: "error", dot: true },
  "Rented": { variant: "info", dot: true },
  "Archived": { variant: "neutral", icon: "archive" }
};
const STATUS_OPTIONS = Object.keys(STATUS_META).filter((s) => s !== "Archived");
const STATUS_DOT_COLOR = {
  neutral: "var(--gray-400)", warning: "var(--warning-500)", success: "var(--success-500)",
  error: "var(--error-500)", info: "var(--info-500)", gold: "var(--gold-500)", brand: "var(--brand-primary)"
};

function fmtUSD(n) { return "$" + n.toLocaleString("en-US"); }

/* ------------------------------------------------------------------
   PROPERTY DATASET  (enriched for the detail view)
   Base rows mirror the Properties table; detail fields are layered on.
------------------------------------------------------------------ */
const GALLERY = {
  villa: [
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=700&q=72"],
  apartment: [
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=72"],
  penthouse: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=700&q=72"],
  townhouse: [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=700&q=72"],
  office: [
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1462826303086-329426d1aef5?auto=format&fit=crop&w=700&q=72"],
  land: [
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1100&q=75",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=700&q=72",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=700&q=72"]
};

const BASE = [
  { id: "CH-2041", title: "Olive Grove Estate", area: "Ankawa", city: "Erbil", type: "Villa",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Karwan Mahmoud", phone: "+964 750 118 4420", type: "Individual owner" },
    agent: { name: "Daban Ali", verified: true, listings: 31, phone: "+964 751 880 2200", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Pending", price: 1200000, date: "Jun 12, 2026",
    beds: 5, baths: 4, size: 480, published: false, featured: true, listingDate: "Jun 12, 2026", updated: "Jun 14, 2026" },

  { id: "CH-2038", title: "Marble Hill Villa", area: "Empire World", city: "Erbil", type: "Villa",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Sirwan Tofiq", phone: "+964 750 234 5678", type: "Individual owner" },
    agent: { name: "Ahmed Karim", verified: true, phone: "+964 750 441 7788", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Published", price: 620000, date: "Jun 9, 2026",
    beds: 4, baths: 3, size: 420, published: true, featured: true, listingDate: "Jun 9, 2026", updated: "Jun 11, 2026" },

  { id: "CH-2035", title: "Cedar Court Residence", area: "Italian Village", city: "Erbil", type: "Townhouse",
    img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Dashne Salar", phone: "+964 770 552 1190", type: "Individual owner" },
    agent: { name: "Sara Hama", verified: true, phone: "+964 770 220 9911", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Sold", price: 845000, date: "Jun 6, 2026",
    beds: 3, baths: 3, size: 265, published: true, featured: false, listingDate: "Jun 6, 2026", updated: "Jun 10, 2026" },

  { id: "CH-2031", title: "Tigris View Apartment", area: "Dream City", city: "Erbil", type: "Apartment",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Awat Rashid", phone: "+964 751 904 7782", type: "Individual owner" },
    agent: { name: "Rawa Jalal", verified: true, phone: "+964 751 330 6655", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70" },
    listing: "rent", status: "Rented", price: 1800, per: "/mo", date: "Jun 4, 2026",
    beds: 3, baths: 2, size: 160, published: true, featured: false, listingDate: "Jun 4, 2026", updated: "Jun 5, 2026" },

  { id: "CH-2029", title: "Naz City Penthouse", area: "Naz City", city: "Erbil", type: "Penthouse",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Hewa Botan", phone: "+964 751 345 6789", type: "Individual owner" },
    agent: { name: "Diyar Salih", verified: false, phone: "+964 751 770 4321", img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Published", price: 980000, date: "Jun 2, 2026",
    beds: 4, baths: 3, size: 300, published: true, featured: true, listingDate: "Jun 2, 2026", updated: "Jun 8, 2026" },

  { id: "CH-2026", title: "Goizha Mountain House", area: "Goizha", city: "Sulaymaniyah", type: "Villa",
    img: "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Nyan Faraj", phone: "+964 773 220 5567", type: "Individual owner" },
    agent: null,
    listing: "sale", status: "Draft", price: 540000, date: "Jun 1, 2026",
    beds: 4, baths: 3, size: 390, published: false, featured: false, listingDate: "—", updated: "Jun 1, 2026" },

  { id: "CH-2022", title: "Park View Loft", area: "Salim Street", city: "Sulaymaniyah", type: "Apartment",
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Shilan Aram", phone: "+964 770 456 7890", type: "Individual owner" },
    agent: { name: "Hawre Ako", verified: true, phone: "+964 770 118 9090", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=70" },
    listing: "rent", status: "Published", price: 1100, per: "/mo", date: "May 28, 2026",
    beds: 2, baths: 2, size: 135, published: true, featured: false, listingDate: "May 28, 2026", updated: "Jun 1, 2026" },

  { id: "CH-2018", title: "Family Mall Office Suite", area: "100m Road", city: "Erbil", type: "Office",
    img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Rebwar Group", phone: "+964 750 600 1234", type: "Company owner" },
    agent: { name: "Ahmed Karim", verified: true, phone: "+964 750 441 7788", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
    listing: "rent", status: "Pending", price: 3200, per: "/mo", date: "May 26, 2026",
    beds: 0, baths: 2, size: 220, published: false, featured: false, listingDate: "May 26, 2026", updated: "May 27, 2026" },

  { id: "CH-2014", title: "Zagros Garden Townhouse", area: "Masif", city: "Duhok", type: "Townhouse",
    img: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Berivan Khalid", phone: "+964 773 567 8901", type: "Individual owner" },
    agent: { name: "Sara Hama", verified: true, phone: "+964 770 220 9911", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Published", price: 410000, date: "May 22, 2026",
    beds: 3, baths: 2, size: 240, published: true, featured: false, listingDate: "May 22, 2026", updated: "May 30, 2026" },

  { id: "CH-2009", title: "Citadel Heights Land", area: "Qalat", city: "Erbil", type: "Land",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Aland Property Co.", phone: "+964 751 778 9012", type: "Company owner" },
    agent: { name: "Diyar Salih", verified: false, phone: "+964 751 770 4321", img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Draft", price: 290000, date: "May 18, 2026",
    beds: 0, baths: 0, size: 1200, published: false, featured: false, listingDate: "—", updated: "May 18, 2026" },

  { id: "CH-2004", title: "Lakeside Apartment", area: "Dukan", city: "Sulaymaniyah", type: "Apartment",
    img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Tara Jamal", phone: "+964 751 678 9012", type: "Individual owner" },
    agent: { name: "Rawa Jalal", verified: true, phone: "+964 751 330 6655", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70" },
    listing: "sale", status: "Sold", price: 365000, date: "May 14, 2026",
    beds: 2, baths: 2, size: 150, published: true, featured: false, listingDate: "May 14, 2026", updated: "May 26, 2026" }];

function emailFromName(name) {
  return name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@mail.chiya.estate";
}

function buildNotes(p) {
  const notes = [];
  if (p.status === "Pending") {
    notes.push({ author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 14, 2026 · 09:42", kind: "review",
      text: "Ownership documents verified. Awaiting final pricing confirmation from the owner before publishing." });
    notes.push({ author: "Lana Aziz", role: "Agent", time: "Jun 13, 2026 · 16:08", kind: "note",
      text: "Owner requested the listing go live before the weekend. Photography set is complete and approved." });
  } else if (p.status === "Published") {
    notes.push({ author: "Rêbîn Kawa", role: "Super Admin", time: p.updated + " · 11:20", kind: "approval",
      text: "Listing approved and published. Featured placement granted for the Erbil premium collection." });
    notes.push({ author: p.agent ? p.agent.name : "Listing team", role: "Agent", time: p.listingDate + " · 10:05", kind: "note",
      text: "All media uploaded and ownership confirmed. Ready for the public site." });
  } else if (p.status === "Sold" || p.status === "Rented") {
    notes.push({ author: "Rêbîn Kawa", role: "Super Admin", time: p.updated + " · 14:30", kind: "approval",
      text: `Deal closed and archived from active search. Marked as ${p.status.toLowerCase()} by the assigned agent.` });
    notes.push({ author: p.agent ? p.agent.name : "Listing team", role: "Agent", time: p.listingDate + " · 09:15", kind: "note",
      text: "Final paperwork submitted to operations. Commission recorded against this listing." });
  } else {
    notes.push({ author: p.agent ? p.agent.name : "Listing team", role: "Agent", time: p.updated + " · 12:00", kind: "note",
      text: "Draft created. Pending media upload and ownership verification before submitting for approval." });
  }
  return notes;
}

function buildTimeline(p) {
  const t = [
    { icon: "plus-circle", tone: "brand", title: "Property created", desc: `Listing ${p.id} added to the platform.`, time: p.date }];
  if (p.agent) t.push({ icon: "user-check", tone: "info", title: "Agent assigned", desc: `${p.agent.name} assigned as the listing agent.`, time: p.date });
  t.push({ icon: "image", tone: "neutral", title: "Media uploaded", desc: "Cover image and gallery set added.", time: p.date });
  t.push({ icon: "dollar-sign", tone: "gold", title: "Price updated", desc: `Asking price set to ${fmtUSD(p.price)}${p.per || ""}.`, time: p.listingDate !== "—" ? p.listingDate : p.date });
  if (p.published) t.push({ icon: "globe", tone: "success", title: "Listing published", desc: "Made visible on the public website and apps.", time: p.listingDate });
  if (p.status === "Pending") t.push({ icon: "clock", tone: "warning", title: "Submitted for approval", desc: "Awaiting admin review before publishing.", time: p.updated });
  if (p.status === "Sold") t.push({ icon: "key", tone: "error", title: "Marked as sold", desc: "Closed and removed from active search.", time: p.updated });
  if (p.status === "Rented") t.push({ icon: "key-round", tone: "info", title: "Marked as rented", desc: "Active rental contract recorded.", time: p.updated });
  return t.reverse();
}

/* Derived specification + location + pricing fields for the detail view.
   Deterministic per-id so the page stays stable across reloads. */
const CITY_COORDS = {
  "Erbil": [36.1901, 43.9930],
  "Sulaymaniyah": [35.5616, 45.4329],
  "Duhok": [36.8674, 42.9880]
};
function buildSpecs(p) {
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
    amenities: buildAmenities(p, seed)
  };
}

const AMENITY_POOL = [
  { icon: "waves", label: "Swimming pool" },
  { icon: "trees", label: "Private garden" },
  { icon: "shield-check", label: "24/7 gated security" },
  { icon: "sun", label: "Terraces & balconies" },
  { icon: "chevrons-up", label: "Elevator" },
  { icon: "cpu", label: "Smart-home system" },
  { icon: "dumbbell", label: "Home gym" },
  { icon: "thermometer-sun", label: "Central heating & cooling" },
  { icon: "square-parking", label: "Covered parking" },
  { icon: "cctv", label: "CCTV surveillance" },
  { icon: "zap", label: "Backup generator" },
  { icon: "wifi", label: "High-speed internet" },
  { icon: "flame", label: "Fireplace" },
  { icon: "droplets", label: "Water tank & filtration" },
];
function buildAmenities(p, seed) {
  const t = p.type.toLowerCase();
  if (t === "land") return [];
  const count = t === "villa" || t === "penthouse" || t === "townhouse" ? 9 : t === "office" ? 6 : 7;
  const out = [];
  for (let i = 0; i < AMENITY_POOL.length && out.length < count; i++) {
    if ((seed + i * 3) % 7 < 5) out.push(AMENITY_POOL[(seed + i) % AMENITY_POOL.length]);
  }
  // de-dup by label, ensure we reach count
  const seen = new Set();
  const uniq = out.filter((a) => (seen.has(a.label) ? false : seen.add(a.label)));
  let i = 0;
  while (uniq.length < count && i < AMENITY_POOL.length) {
    const a = AMENITY_POOL[i++];
    if (!seen.has(a.label)) { seen.add(a.label); uniq.push(a); }
  }
  return uniq;
}

const PROPERTIES = BASE.map((p) => ({
  ...p,
  location: p.area + ", " + p.city,
  gallery: GALLERY[p.type.toLowerCase()] || GALLERY.villa,
  owner: { ...p.owner, email: emailFromName(p.owner.name) },
  agent: p.agent ? { ...p.agent, email: emailFromName(p.agent.name), listings: 6 + (p.id.charCodeAt(5) % 12) } : null,
  specs: buildSpecs(p),
  notes: buildNotes(p),
  timeline: buildTimeline(p)
}));

const AGENTS_LIST = Object.values(
  PROPERTIES.reduce((acc, p) => { if (p.agent && !acc[p.agent.name]) acc[p.agent.name] = { ...p.agent }; return acc; }, {})
).sort((a, b) => a.name.localeCompare(b.name));

function getProperty(id) {
  return PROPERTIES.find((p) => p.id === id) || PROPERTIES[0];
}

/* ------------------------------------------------------------------
   VIEWING REQUESTS  (per-property; mirrors the Viewings page model)
------------------------------------------------------------------ */
const VIEWING_STATUS = {
  "Scheduled": { variant: "info",    icon: "clock"        },
  "Confirmed": { variant: "success", icon: "check-circle" },
  "Completed": { variant: "brand",   icon: "check"        },
  "Cancelled": { variant: "error",   icon: "x-circle"     },
  "No Show":   { variant: "warning", icon: "user-x"       },
};

const VIEWING_REQUESTS = {
  "CH-2041": [
    { id: "VW-1042", member: "Sara Hassan",  img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70", phone: "+964 750 112 4408", date: "Jun 24, 2026", time: "11:00 AM", status: "Confirmed" },
    { id: "VW-1039", member: "Karzan Omar",  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70", phone: "+964 750 663 2204", date: "Jun 25, 2026", time: "2:30 PM",  status: "Scheduled" },
    { id: "VW-1031", member: "Nadia Farid",  img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70", phone: "+964 770 884 1196", date: "Jun 20, 2026", time: "10:00 AM", status: "Completed" },
    { id: "VW-1024", member: "Ahmad Karimi", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=70", phone: "+964 751 339 7720", date: "Jun 16, 2026", time: "4:00 PM",  status: "Cancelled" },
  ],
  "CH-2038": [
    { id: "VW-1040", member: "Zana Rashid",  img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70", phone: "+964 750 226 5531", date: "Jun 24, 2026", time: "9:30 AM",  status: "Scheduled" },
    { id: "VW-1033", member: "Hana Bakr",    img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=70", phone: "+964 751 447 9082", date: "Jun 21, 2026", time: "1:00 PM",  status: "Completed" },
  ],
  "CH-2029": [
    { id: "VW-1037", member: "Dara Karim",   img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=70", phone: "+964 750 770 1184", date: "Jun 23, 2026", time: "3:30 PM",  status: "Confirmed" },
  ],
};
const getViewings = (id) => VIEWING_REQUESTS[id] || [];

/* ==================================================================
   SIDEBAR
================================================================== */
function NavItem({ item, active, collapsed, onSelect }) {
  const cls = ["ax-nav-item", active ? "is-active" : "", item.disabled ? "is-disabled" : ""].filter(Boolean).join(" ");
  const btnRef = useRef(null);
  const [tip, setTip] = useState(null);
  const showTip = () => {
    if (!collapsed || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setTip({ top: r.top + r.height / 2, left: r.right + 14 });
  };
  const hideTip = () => setTip(null);
  useEffect(() => { if (!collapsed) setTip(null); }, [collapsed]);
  return (
    <button ref={btnRef} type="button" className={cls} disabled={item.disabled || undefined}
      aria-current={active ? "page" : undefined}
      onClick={() => !item.disabled && onSelect(item.id)}
      onMouseEnter={showTip} onMouseLeave={hideTip} onFocus={showTip} onBlur={hideTip}>
      <Icon name={item.icon} size={20} />
      <span className="ax-nav-text">{item.label}</span>
      {item.tag && <span className="ax-nav-item__tag">{item.tag}</span>}
      {tip && ReactDOM.createPortal(
        <span className="ax-nav-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>{item.label}</span>,
        document.body)}
    </button>);
}

function Sidebar({ collapsed, drawerOpen, active, onSelect, onToggleCollapse }) {
  const cls = ["ax-sidebar", collapsed ? "is-collapsed" : "", drawerOpen ? "is-drawer-open" : ""].filter(Boolean).join(" ");
  return (
    <aside className={cls} aria-label="Primary navigation">
      <div className="ax-sb-head">
        <a className="ax-sb-logo" href="#" onClick={(e) => e.preventDefault()}>
          <img src={LOGO} alt="Chiya Estate" />
          <span className="ax-sb-logo__txt"><span className="ax-sb-logo__name">Chiya<span> Estate</span></span></span>
        </a>
      </div>
      <button type="button" className="ax-collapse-btn"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleCollapse}>
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={15} strokeWidth={2.25} />
      </button>
      <nav className="ax-nav">
        {NAV_GROUPS.map((g) =>
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map((it) =>
              <NavItem key={it.id} item={it} active={active === it.id} collapsed={collapsed} onSelect={onSelect} />)}
          </div>)}
      </nav>
    </aside>);
}

/* ==================================================================
   TOPBAR
================================================================== */
function ProfileMenu({ onClose }) {
  const items = [{ icon: "user", label: "My profile" }, { icon: "settings", label: "Account settings" }];
  return (
    <div className="ax-menu ax-menu--profile" role="menu">
      <div className="ax-menu-profilecard">
        <Avatar name={ADMIN.name} size="lg" verified />
        <span className="ax-menu-profilecard__meta">
          <span className="ax-menu-profilecard__name">{ADMIN.name}</span>
          <span className="ax-menu-profilecard__mail">{ADMIN.email}</span>
          <span style={{ marginTop: 6 }}><Badge variant="gold" size="sm" icon="shield-check">Super Admin</Badge></span>
        </span>
      </div>
      <div className="ax-menu__sect">
        {items.map((it) =>
          <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={onClose}>
            <Icon name={it.icon} size={18} />{it.label}
          </button>)}
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onClose}>
          <Icon name="log-out" size={18} />Log out
        </button>
      </div>
    </div>);
}

function NotifMenu({ onClose }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <div className="ax-menu ax-menu--notif" role="menu">
      <div className="ax-menu__head">
        <h4>Notifications</h4>
        {unread > 0 && <Badge variant="brand" size="sm">{unread} new</Badge>}
      </div>
      <div className="ax-notif-list">
        {NOTIFICATIONS.map((n) =>
          <div key={n.id} className={"ax-notif" + (n.unread ? " is-unread" : "")} onClick={onClose}>
            <span className={"ax-notif__ic ax-notif__ic--" + n.kind}><Icon name={n.icon} size={18} /></span>
            <div className="ax-notif__body">
              <p className="ax-notif__title">{n.title}</p>
              <p className="ax-notif__desc">{n.desc}</p>
              <div className="ax-notif__time">{n.time}</div>
            </div>
            {n.unread && <span className="ax-notif__udot" />}
          </div>)}
      </div>
      <div className="ax-menu__foot">
        <Button hierarchy="secondary" size="sm" onClick={onClose}>Mark all as read</Button>
      </div>
    </div>);
}

function Topbar({ openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>
      <div className="ax-tb-search ax-tb-search--lead">
        <span className="ax-tb-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>
      <div className="ax-tb-spacer" />
      <div className="ax-tb-actions">
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-btn" + (openMenu === "notif" ? " is-open" : "")} aria-label="Notifications" aria-haspopup="true" aria-expanded={openMenu === "notif"} onClick={() => toggle("notif")}>
            <Icon name="bell" size={20} /><span className="ax-tb-dot" />
          </button>
          {openMenu === "notif" && <NotifMenu onClose={() => setOpenMenu(null)} />}
        </div>
        <div className="ax-tb-divider" />
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-profile" + (openMenu === "profile" ? " is-open" : "")} aria-haspopup="true" aria-expanded={openMenu === "profile"} onClick={() => toggle("profile")}>
            <Avatar name={ADMIN.name} size="sm" verified />
            <span className="ax-tb-profile__meta">
              <span className="ax-tb-profile__name">{ADMIN.name}</span>
              <span className="ax-tb-profile__role">{ADMIN.role}</span>
            </span>
            <Icon name="chevron-down" size={16} />
          </button>
          {openMenu === "profile" && <ProfileMenu onClose={() => setOpenMenu(null)} />}
        </div>
      </div>
    </header>);
}

/* ==================================================================
   MODALS — Change status / Assign agent / Archive / Delete
================================================================== */
function ChangeStatusModal({ property, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (dropOpen) setDropOpen(false); else onCancel(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, dropOpen]);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  const toggleDrop = () => { if (!dropOpen) calcPos(); setDropOpen((v) => !v); };
  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (document.querySelector(".pp-smodal__drop")?.contains(e.target)) return;
      setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [dropOpen]);

  const canConfirm = selected && selected !== property.status;
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <div className="pp-modal__icon pp-modal__icon--status"><Icon name="refresh-cw" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="status-modal-title">Change status</h2>
        <p className="pp-modal__sublabel">Select new status</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selected ?
            <React.Fragment>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[STATUS_META[selected].variant] }} />
              <span className="pp-smodal__label">{selected}</span>
            </React.Fragment> :
            <span className="pp-amodal__trigger-placeholder"><Icon name="tag" size={16} />Choose a status…</span>}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen && dropPos && ReactDOM.createPortal(
          <div className="pp-smodal__drop pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {STATUS_OPTIONS.map((status) => {
              const meta = STATUS_META[status];
              return (
                <button key={status} type="button" className={"pp-smodal__item" + (selected === status ? " is-selected" : "")}
                  onClick={() => { setSelected(status); setDropOpen(false); }}>
                  <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[meta.variant] }} />
                  <span className="pp-smodal__label">{status}</span>
                  <span className="pp-smodal__spacer" />
                  {property.status === status && <span className="pp-amodal__current-tag">Current</span>}
                  {selected === status && <span className="pp-smodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
                </button>);
            })}
          </div>,
          document.body)}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm} onClick={() => onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />Change status
          </button>
        </div>
      </div>
    </div>,
    document.body);
}

function AssignAgentModal({ property, onCancel, onConfirm }) {
  const hasAgent = !!property.agent;
  const [selected, setSelected] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (dropOpen) setDropOpen(false); else onCancel(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, dropOpen]);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  const toggleDrop = () => { if (!dropOpen) calcPos(); setDropOpen((v) => !v); };
  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (document.querySelector(".pp-amodal__drop")?.contains(e.target)) return;
      setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [dropOpen]);

  const selectedAgent = selected ? AGENTS_LIST.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== (property.agent?.name ?? null);
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign"><Icon name={hasAgent ? "user-cog" : "user-plus"} size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="agent-modal-title">{hasAgent ? "Change assigned agent" : "Assign agent"}</h2>
        <p className="pp-modal__sublabel">{hasAgent ? "Select new agent" : "Select agent"}</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selectedAgent ?
            <React.Fragment>
              <Avatar src={selectedAgent.img} name={selectedAgent.name} size="sm" verified={selectedAgent.verified} />
              <span className="pp-amodal__trigger-name">{selectedAgent.name}</span>
            </React.Fragment> :
            <span className="pp-amodal__trigger-placeholder"><Icon name="user" size={16} />Choose an agent…</span>}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen && dropPos && ReactDOM.createPortal(
          <div className="pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {AGENTS_LIST.map((agent) =>
              <button key={agent.name} type="button" className={"pp-amodal__agent" + (selected === agent.name ? " is-selected" : "")}
                onClick={() => { setSelected(agent.name); setDropOpen(false); }}>
                <Avatar src={agent.img} name={agent.name} size="sm" verified={agent.verified} />
                <span className="pp-amodal__agent-name">{agent.name}</span>
                {property.agent?.name === agent.name && <span className="pp-amodal__current-tag">Current</span>}
                {selected === agent.name && <span className="pp-amodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
              </button>)}
          </div>,
          document.body)}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm}
            onClick={() => onConfirm(AGENTS_LIST.find((a) => a.name === selected))}>
            <Icon name={hasAgent ? "user-check" : "user-plus"} size={15} />{hasAgent ? "Change agent" : "Assign agent"}
          </button>
        </div>
      </div>
    </div>,
    document.body);
}

/* generic confirm modal for Archive + Delete */
function ConfirmModal({ kind, property, onCancel, onConfirm }) {
  const danger = kind === "delete";
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className={"pp-modal__icon" + (danger ? "" : " pp-modal__icon--status")}>
          <Icon name={danger ? "trash-2" : "archive"} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="confirm-modal-title">{danger ? "Delete property?" : "Archive property?"}</h2>
        <p className="pp-modal__body">
          {danger ?
            <React.Fragment>Are you sure you want to delete <strong>{property.title}</strong>? This action cannot be undone and will permanently remove the listing.</React.Fragment> :
            <React.Fragment>Archive <strong>{property.title}</strong>? It will be hidden from active search and moved to the archive. You can restore it at any time.</React.Fragment>}
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          {danger ?
            <button type="button" className="pp-modal__delete" onClick={onConfirm}><Icon name="trash-2" size={15} />Delete property</button> :
            <button type="button" className="pp-modal__confirm" onClick={onConfirm}><Icon name="archive" size={15} />Archive property</button>}
        </div>
      </div>
    </div>,
    document.body);
}

/* ==================================================================
   TOAST
================================================================== */
function PropToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const iconCls = "pp-toast__icon" + (toast.tone === "danger" ? " pp-toast__icon--danger" : toast.tone === "brand" ? " pp-toast__icon--brand" : "");
  return (
    <div className={`pp-toast${toast.tone === "danger" ? " pp-toast--danger" : ""}${visible && !toast.out ? " is-in" : ""}${toast.out ? " is-out" : ""}`}>
      <span className={iconCls}><Icon name={toast.icon} size={20} strokeWidth={2.25} /></span>
      <div className="pp-toast__body">
        <p className="pp-toast__title">{toast.title}</p>
        <p className="pp-toast__msg">{toast.msg}</p>
        {toast.onUndo &&
        <div className="pp-toast__actions">
          <button type="button" className="pp-toast__btn pp-toast__btn--dismiss" onClick={onDismiss}>Dismiss</button>
          <button type="button" className="pp-toast__btn pp-toast__btn--undo" onClick={() => { toast.onUndo(); onDismiss(); }}>
            <Icon name="undo-2" size={15} />Undo
          </button>
        </div>}
      </div>
      <button type="button" className="pp-toast__close" aria-label="Close" onClick={onDismiss}><Icon name="x" size={16} strokeWidth={2} /></button>
      <div className="pp-toast__progress" />
    </div>);
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => t.id === id ? { ...t, out: true } : t)), 5000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5380);
  };
  const dismiss = (id) => {
    setToasts((ts) => ts.map((t) => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  };
  return [toasts, push, dismiss];
}

/* ------------------------------------------------------------------
   EXPORT
------------------------------------------------------------------ */
Object.assign(window, {
  PD_DS: DS, PD_LOGO: LOGO, PD_ADMIN: ADMIN,
  PD_NAV_FLAT: NAV_FLAT, PD_PAGE_MAP: PAGE_MAP,
  PD_STATUS_META: STATUS_META, PD_STATUS_DOT_COLOR: STATUS_DOT_COLOR, PD_fmtUSD: fmtUSD,
  PD_PROPERTIES: PROPERTIES, PD_getProperty: getProperty,
  PD_VIEWING_STATUS: VIEWING_STATUS, PD_getViewings: getViewings,
  Sidebar, Topbar,
  ChangeStatusModal, AssignAgentModal, ConfirmModal,
  PropToast, useToasts
});
