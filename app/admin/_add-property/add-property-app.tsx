"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtCurrency, fmtNum, localizeDigits, valueKey } from "@/lib/fmt";
import {
  AMENITIES,
  CONDITIONS,
  COVER_IMG,
  EMPTY_FORM,
  FURNISHING,
  GALLERY_IMGS,
  ORIENTATIONS,
  PROPERTY_TYPES,
  PUBLISHED,
  STEP_KEYS,
  type ApAgent,
  type ApForm,
} from "./data";
import { useProperties } from "../_shared/properties-store";
import type { PropertyRecord } from "../_data/catalog";
import { useListings, type MemberListing } from "@/lib/listings";

export type Opt = { value: string; label: string };

const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function todayLabel(): string {
  const d = new Date();
  return `${MONTHS_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
// Session-unique, catalog-safe id base so listings created across reloads (all
// persisted to localStorage) don't collide on lookup.
const ID_BASE = 10000 + Math.floor(Date.now() % 90000);
let addedSeq = 0;
function formToProperty(f: ApForm, agent: ApAgent | null, photos: PhotoUploader): PropertyRecord {
  const listing: "sale" | "rent" = f.listing === "rent" ? "rent" : "sale";
  const district = f.district || "Ankawa";
  const area = f.project || district; // most specific location (project → district)
  const date = todayLabel();
  const amenIcon: Record<string, IconName> = Object.fromEntries(AMENITIES.map((a) => [a.label, a.icon]));
  // Uploaded photos, cover first, as the gallery. Falls back to nothing → the
  // detail page uses a type-based gallery when the user skipped media.
  const ordered = photos.cover ? [photos.cover, ...photos.photos.filter((x) => x.id !== photos.coverId)] : photos.photos;
  const gallery = ordered.map((x) => x.url);
  const cover = photos.cover?.url || COVER_IMG;
  return {
    id: "CH-" + (ID_BASE + addedSeq++),
    title: f.title || "Untitled property",
    area,
    district,
    city: f.city || "Erbil",
    type: f.type || "Villa",
    img: cover,
    owner: { name: f.ownerName || "New owner", phone: f.ownerPhone || "", type: "Individual owner" },
    agent: agent ? { name: agent.name, verified: true, img: agent.avatar } : null,
    listing,
    // A property can only go live with an assigned agent; without one it stays
    // Pending until an agent is assigned.
    status: agent ? "Published" : "Pending",
    price: Number(String(f.price).replace(/[^0-9.]/g, "")) || 0,
    per: listing === "rent" ? "/mo" : undefined,
    date,
    daysAgo: 0,
    beds: f.beds,
    baths: f.baths,
    size: Number(String(f.area).replace(/[^0-9.]/g, "")) || 0,
    featured: false,
    published: !!agent,
    listingDate: date,
    updated: date,
    details: {
      description: f.description || undefined,
      currency: f.currency,
      areaUnit: f.areaUnit,
      ownerEmail: f.ownerEmail || undefined,
      ownerType: "Individual owner",
      agentPhone: agent?.phone,
      project: f.project || undefined,
      street: f.street || undefined,
      building: f.building || undefined,
      lat: f.lat || undefined,
      lng: f.lng || undefined,
      locNotes: f.locNotes || undefined,
      year: f.year || undefined,
      orientation: f.orientation || undefined,
      condition: f.condition || undefined,
      furnishing: f.furnishing || undefined,
      parking: f.parking,
      floors: f.floors,
      amenities: [
        ...f.amenities.map((label) => ({ icon: amenIcon[label] || ("check" as IconName), label })),
        ...f.customAmenities.map((label) => ({ icon: "sparkles" as IconName, label })),
      ],
      gallery,
      tourUrl: f.tourUrl || undefined,
    },
  };
}

/** Map the shared add-property form to a member-owned listing (Pending Review).
 *  Used by the website's "Submit your property" flow (mode="member"). */
function formToMemberListing(f: ApForm, photos: PhotoUploader, priceStr: string, areaStr: string, id?: string): MemberListing {
  const location = [f.district, f.city].filter(Boolean).join(", ") || f.city || "Kurdistan";
  const ordered = photos.cover ? [photos.cover, ...photos.photos.filter((x) => x.id !== photos.coverId)] : photos.photos;
  const gallery = ordered.map((x) => x.url);
  return {
    id: id || "ml-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: f.title || "Untitled property",
    location,
    city: f.city || undefined,
    deal: f.listing === "rent" ? "rent" : "sale",
    status: "pending",
    cover: photos.cover?.url || gallery[0] || "",
    price: priceStr || undefined,
    beds: f.beds || undefined,
    baths: f.baths || undefined,
    area: areaStr || undefined,
    description: f.description || undefined,
    gallery,
    form: f,
    updatedAt: new Date().toISOString(),
  };
}

interface PublishPreview {
  id: string;
  title: string;
  address: string;
  price: string;
  listing: string;
  beds: number;
  baths: number;
  area: string;
  cover: string;
  published: boolean;
}

export function ProgressStepper({ active }: { active: number }) {
  const { t, lang } = useLang();
  const rtl = isRtl(lang);
  const nextLabel = STEP_KEYS[active + 1];
  return (
    <>
      <ol className="ap-steps" aria-label={t("admin.ap.progress")}>
        {STEP_KEYS.map((key, i) => {
          const done = i < active;
          const isActive = i === active;
          const cls = ["ap-step", done ? "is-done" : "", isActive ? "is-active" : ""].filter(Boolean).join(" ");
          return (
            <Fragment key={key}>
              <li className={cls} aria-current={isActive ? "step" : undefined}>
                <span className="ap-step__dot">{done && <Icon name="check" size={14} strokeWidth={3} />}</span>
                <span className="ap-step__label">{t(key)}</span>
              </li>
              {i < STEP_KEYS.length - 1 && <span className={"ap-conn" + (i < active ? " is-done" : "")} aria-hidden="true" />}
            </Fragment>
          );
        })}
      </ol>
      <div className="ap-steps-mini">
        <svg className="ap-steps-mini__ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border-default)" strokeWidth="3" />
          {/* RTL mirrors the arc about the vertical axis so it fills leading-edge first, like the rest of the layout. */}
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--brand-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - (active + 1) / STEP_KEYS.length)}
            transform={rtl ? "rotate(-90 20 20) scale(-1 1) translate(-40 0)" : "rotate(-90 20 20)"}
          />
          <text x="20" y="20" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, fill: "var(--text-primary)" }}>
            {fmtNum(lang, active + 1)}/{fmtNum(lang, STEP_KEYS.length)}
          </text>
        </svg>
        <div className="ap-steps-mini__txt">
          <span className="ap-steps-mini__now">{t(STEP_KEYS[active])}</span>
          {nextLabel && <span className="ap-steps-mini__next">{t("admin.ap.next", { step: t(nextLabel) })}</span>}
        </div>
      </div>
    </>
  );
}

const MAP_CITY_GEO: Record<string, { lat: number; lng: number; zoom: number }> = {
  Erbil: { lat: 36.1911, lng: 43.993, zoom: 13 },
  Sulaymaniyah: { lat: 35.5556, lng: 45.4329, zoom: 13 },
  Duhok: { lat: 36.8669, lng: 42.9503, zoom: 13 },
};
const MAP_KURDISTAN = { lat: 36.2, lng: 44.1, zoom: 8 };

/** MapPicker — real OpenStreetMap (Leaflet) map with a draggable pin, centred
 *  on the selected city. Loaded client-side only. */
export function MapPicker({ city, lat, lng, onMove }: { city?: string; lat?: string; lng?: string; onMove?: (lat: number, lng: number) => void }) {
  const { t } = useLang();
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // init once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      const nLat = lat ? parseFloat(lat) : NaN;
      const nLng = lng ? parseFloat(lng) : NaN;
      const start = !isNaN(nLat) && !isNaN(nLng) ? { lat: nLat, lng: nLng, zoom: 14 } : (city && MAP_CITY_GEO[city]) || MAP_KURDISTAN;
      const map = L.map(elRef.current, { center: [start.lat, start.lng], zoom: start.zoom, scrollWheelZoom: false, attributionControl: false, zoomControl: false });
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      const icon = L.divIcon({ className: "ap-map__pinwrap", html: '<span class="ap-map__pin2"></span>', iconSize: [26, 26], iconAnchor: [13, 13] });
      const marker = L.marker([start.lat, start.lng], { icon, draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onMoveRef.current?.(p.lat, p.lng);
      });
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onMoveRef.current?.(e.latlng.lat, e.latlng.lng);
      });
      markerRef.current = marker;
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 0);
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // recenter the map when the selected city changes (coordinates are only set
  // once the user actually clicks or drags the pin)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !city) return;
    const c = MAP_CITY_GEO[city] || MAP_KURDISTAN;
    map.setView([c.lat, c.lng], c.zoom, { animate: true });
    marker.setLatLng([c.lat, c.lng]);
  }, [city]);

  return (
    <div className="ap-map" role="application" aria-label={t("admin.ap.mapPicker")}>
      <div className="ap-map__canvas" ref={elRef} />
      <div className="ap-map__hint">
        <Icon name="move" size={14} />
        {t("admin.ap.mapDragHint")}
      </div>
    </div>
  );
}

export function FieldLabel({ children, optional, htmlFor }: { children: React.ReactNode; optional?: boolean; htmlFor?: string }) {
  const { t } = useLang();
  return (
    <label className="ap-label" htmlFor={htmlFor}>
      {children}
      {optional && <span className="ap-label__opt">{t("admin.ap.optional")}</span>}
    </label>
  );
}

export function RadioCards({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; sub: string; icon: IconName }[] }) {
  // Labels and subs arrive already translated from the caller.
  return (
    <div className="ap-cards" role="radiogroup">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className={"ap-rcard" + (on ? " is-on" : "")} onClick={() => onChange(o.value)}>
            <span className="ap-rcard__ic">
              <Icon name={o.icon} size={20} />
            </span>
            <span className="ap-rcard__txt">
              <span className="ap-rcard__title">{o.label}</span>
              <span className="ap-rcard__sub">{o.sub}</span>
            </span>
            <span className="ap-rcard__check">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, suffix }: { value: number; onChange: (v: number) => void; min?: number; suffix?: string }) {
  const { t, lang } = useLang();
  return (
    <div className="ap-stepper">
      <button type="button" className="ap-stepper__btn" aria-label={t("admin.ap.decrease")} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Icon name="minus" size={18} strokeWidth={2.25} />
      </button>
      <span className="ap-stepper__val">
        {fmtNum(lang, value)}
        {suffix && <small>{suffix}</small>}
      </span>
      <button type="button" className="ap-stepper__btn" aria-label={t("admin.ap.increase")} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={18} strokeWidth={2.25} />
      </button>
    </div>
  );
}

export function useTopbarClip(triggerRef: React.RefObject<HTMLElement | null>) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; right: number; clipTop: number } | null>(null);
  const calc = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const nav = document.querySelector(".ax-topbar");
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const top = r.bottom + 8;
    setCoords({ top, left: r.left, width: r.width, right: window.innerWidth - r.right, clipTop: Math.max(0, navBottom - top) });
  };
  return { coords, setCoords, calc };
}

export function Dropdown({ id, options, value, onChange, placeholder, disabled }: { id?: string; options: Opt[]; value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef);

  const openDropdown = () => {
    if (disabled) return;
    calc();
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = options.find((o) => o.value === value);
  return (
    <>
      <button ref={triggerRef} type="button" id={id} disabled={disabled} className={["lc-dd__trigger", open && "is-open", disabled && "is-disabled"].filter(Boolean).join(" ")} onClick={() => (open ? setOpen(false) : openDropdown())} aria-haspopup="listbox" aria-expanded={open}>
        {selected ? (
          <span className="lc-dd__val">
            <span className="lc-dd__val-txt">{selected.label}</span>
          </span>
        ) : (
          <span className="lc-dd__placeholder">{placeholder || t("admin.ap.selectPh")}</span>
        )}
        <Icon name="chevron-down" size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0, transition: "transform .16s ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={panelRef} className="lc-dd__panel" style={{ top: coords.top, left: coords.left, width: coords.width, clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }} role="listbox">
            <div className="lc-dd__scroll">
              {options.map((o) => (
                <button
                  key={o.value || "__empty"}
                  type="button"
                  className={"lc-dd__row" + (value === o.value ? " is-selected" : "")}
                  role="option"
                  aria-selected={value === o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="lc-dd__body">
                    <span className="lc-dd__row-title">{o.label}</span>
                  </span>
                  {value === o.value && <Icon name="check" size={16} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function ComboSelect({ side, value, onChange, options }: { side: "left" | "right"; value: string; onChange: (v: string) => void; options: string[] }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef);

  const openDropdown = () => {
    calc();
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={"ap-combo__sel ap-combo__sel--" + side}>
      <button ref={triggerRef} type="button" className={"ap-combo__sel-btn" + (open ? " is-open" : "")} onClick={() => (open ? setOpen(false) : openDropdown())} aria-haspopup="listbox" aria-expanded={open} aria-label={t("admin.ap.unit")}>
        {value}
      </button>
      <span className={"ap-combo__sel__chev" + (open ? " is-open" : "")}>
        <Icon name="chevron-down" size={16} />
      </span>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            className="lc-dd__panel ap-combo__panel"
            style={{ ...(side === "right" ? { top: coords.top, right: coords.right } : { top: coords.top, left: coords.left }), clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }}
            role="listbox"
          >
            <div className="lc-dd__scroll">
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={"lc-dd__row" + (value === o ? " is-selected" : "")}
                  role="option"
                  aria-selected={value === o}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                >
                  <span className="lc-dd__body">
                    <span className="lc-dd__row-title">{o}</span>
                  </span>
                  {value === o && <Icon name="check" size={16} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

interface UpImg {
  id: string;
  url: string;
  name: string;
}

/** Shared photo state so the Cover-image field and the Gallery stay in sync:
 *  one list of photos + one cover id. Star in the gallery sets the big cover. */
export function usePhotoUploader(demo: boolean) {
  const [photos, setPhotos] = useState<UpImg[]>(() => (demo ? GALLERY_IMGS.map((g) => ({ id: g.id, url: g.url, name: "" })) : []));
  const [coverId, setCoverId] = useState<string | null>(() => (demo ? GALLERY_IMGS.find((g) => g.cover)?.id ?? GALLERY_IMGS[0]?.id ?? null : null));
  const [dragId, setDragId] = useState<string | null>(null);
  const [video, setVideo] = useState<{ name: string; size: string } | null>(() => (demo ? { name: "olive-grove-walkthrough.mp4", size: "84.2 MB" } : null));
  const setVideoFromFiles = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setVideo({ name: f.name, size: (f.size / 1048576).toFixed(1) + " MB" });
  };
  const removeVideo = () => setVideo(null);

  const addPhotos = (files: FileList | null) => {
    if (!files || !files.length) return;
    const next = Array.from(files).map((f, i) => ({ id: `${Date.now()}-${i}`, url: URL.createObjectURL(f), name: f.name }));
    setPhotos((prev) => {
      const merged = [...prev, ...next];
      setCoverId((c) => c ?? merged[0]?.id ?? null);
      return merged;
    });
  };
  const addAsCover = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const img = { id: `${Date.now()}`, url: URL.createObjectURL(f), name: f.name };
    setPhotos((prev) => [...prev, img]);
    setCoverId(img.id);
  };
  const removePhoto = (id: string) =>
    setPhotos((prev) => {
      const nx = prev.filter((x) => x.id !== id);
      setCoverId((c) => (c === id ? nx[0]?.id ?? null : c));
      return nx;
    });
  const reorder = (targetId: string) => {
    setPhotos((prev) => {
      if (!dragId || dragId === targetId) return prev;
      const from = prev.findIndex((x) => x.id === dragId);
      const to = prev.findIndex((x) => x.id === targetId);
      if (from < 0 || to < 0) return prev;
      const nx = prev.slice();
      const [m] = nx.splice(from, 1);
      nx.splice(to, 0, m);
      return nx;
    });
    setDragId(null);
  };
  // Restore a saved gallery (cover first) when reopening a listing to edit.
  const hydrate = (urls: string[]) => {
    const imgs = urls.filter(Boolean).map((url, i) => ({ id: `seed-${i}-${url.slice(-12)}`, url, name: "" }));
    setPhotos(imgs);
    setCoverId(imgs[0]?.id ?? null);
  };
  const cover = photos.find((p) => p.id === coverId) ?? null;
  return { photos, coverId, cover, dragId, setDragId, addPhotos, addAsCover, removePhoto, setCover: setCoverId, reorder, hydrate, video, setVideoFromFiles, removeVideo };
}
export type PhotoUploader = ReturnType<typeof usePhotoUploader>;

export function CoverImage({ cover, onPick, onRemove }: { cover: UpImg | null; onPick: (files: FileList | null) => void; onRemove: () => void }) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onPick(e.target.files);
          e.target.value = "";
        }}
      />
      {cover ? (
        <div className="ap-cover">
          <img className="ap-cover__img" src={cover.url} alt={t("admin.ap.coverPreview")} />
          <div className="ap-cover__grad" />
          <span className="ap-cover__badge">
            <Icon name="star" size={14} strokeWidth={2.5} />
            {t("admin.ap.coverPhoto")}
          </span>
          <div className="ap-cover__actions">
            <IconButton icon="repeat-2" label={t("admin.ap.replaceCover")} variant="glass" onClick={() => inputRef.current?.click()} />
            <IconButton icon="trash-2" label={t("admin.ap.removeCover")} variant="glass" onClick={onRemove} />
          </div>
          <span className="ap-cover__foot">
            <Icon name="image" size={14} />
            {cover.name || "cover.jpg"}
          </span>
        </div>
      ) : (
        <button type="button" className="ap-drop ap-cover--empty" onClick={() => inputRef.current?.click()}>
          <span className="ap-drop__ic">
            <Icon name="image" size={22} />
          </span>
          <span className="ap-drop__title">{t("admin.ap.uploadCover")}</span>
          <span className="ap-drop__sub">PNG or JPG · recommended 1600×900</span>
        </button>
      )}
    </>
  );
}

export function GalleryGrid({ store }: { store: PhotoUploader }) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const { photos, coverId, dragId, setDragId, addPhotos, removePhoto, setCover, reorder } = store;
  return (
    <div className="ap-gal">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          addPhotos(e.target.files);
          e.target.value = "";
        }}
      />
      {photos.map((g) => (
        <div
          className={"ap-gal__item" + (dragId === g.id ? " is-dragging" : "")}
          key={g.id}
          role="group"
          aria-label={t("admin.ap.galleryImage")}
          draggable
          onDragStart={() => setDragId(g.id)}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => reorder(g.id)}
        >
          <img className="ap-gal__img" src={g.url} alt="" />
          <span className="ap-gal__top" />
          <span className="ap-gal__handle" aria-label={t("admin.ap.dragReorder")} title={t("admin.ap.dragReorder")}>
            <Icon name="grip-vertical" size={15} />
          </span>
          <div className="ap-gal__acts">
            <button type="button" className={"ap-gal__abtn" + (coverId === g.id ? " is-on" : "")} aria-label={t("admin.ap.setCover")} title={t("admin.ap.setCover")} onClick={() => setCover(g.id)}>
              <Icon name="star" size={14} strokeWidth={2.25} />
            </button>
            <button type="button" className="ap-gal__abtn ap-gal__abtn--danger" aria-label={t("admin.ap.removeImage")} title={t("admin.ap.remove")} onClick={() => removePhoto(g.id)}>
              <Icon name="x" size={15} strokeWidth={2.5} />
            </button>
          </div>
          {coverId === g.id && (
            <span className="ap-gal__cover">
              <Icon name="star" size={11} strokeWidth={2.5} />
              {t("admin.ap.cover")}
            </span>
          )}
        </div>
      ))}
      <button type="button" className="ap-drop ap-gal__add" aria-label={t("admin.ap.addImages")} onClick={() => inputRef.current?.click()}>
        <span className="ap-drop__ic">
          <Icon name="plus" size={20} strokeWidth={2.25} />
        </span>
        <span className="ap-drop__title">{t(photos.length ? "admin.ap.addMore" : "admin.ap.addPhotos")}</span>
      </button>
    </div>
  );
}

function VideoRow({ name, size, onRemove }: { name: string; size: string; onRemove?: () => void }) {
  const { t } = useLang();
  return (
    <div className="ap-vid">
      <div className="ap-vid__row">
        <span className="ap-vid__ic">
          <Icon name="video" size={22} />
        </span>
        <div className="ap-vid__meta">
          <span className="ap-vid__name">{name}</span>
          <span className="ap-vid__sub">{size} · Uploaded</span>
        </div>
        <button type="button" className="ap-vid__cancel" aria-label={t("admin.ap.removeVideo")} title={t("admin.ap.remove")} onClick={onRemove}>
          <Icon name="x" size={17} strokeWidth={2.25} />
        </button>
      </div>
      <div>
        <div className="ap-vid__track">
          <span className="ap-vid__fill ap-vid__fill--done" style={{ width: "100%" }} />
        </div>
        <div className="ap-vid__pct" style={{ marginTop: 8 }}>
          <span className="ap-vid__done">
            <Icon name="circle-check" size={15} strokeWidth={2.25} />
            {t("admin.ap.uploadComplete")}
          </span>
          <b>100%</b>
        </div>
      </div>
    </div>
  );
}

export function VideoUpload({ store }: { store: PhotoUploader }) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const { video, setVideoFromFiles, removeVideo } = store;
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          setVideoFromFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {video ? (
        <VideoRow name={video.name} size={video.size} onRemove={removeVideo} />
      ) : (
        <button type="button" className="ap-drop ap-vid--empty" onClick={() => inputRef.current?.click()}>
          <span className="ap-drop__ic">
            <Icon name="video" size={22} />
          </span>
          <span className="ap-drop__title">{t("admin.ap.uploadVideo")}</span>
          <span className="ap-drop__sub">{t("admin.ap.videoHint")}</span>
        </button>
      )}
    </>
  );
}

/**
 * Assignable agents = every *verified* agent in the system roster, mapped to the
 * lightweight ApAgent shape the picker/summary/review UI expects. Sourcing from
 * the live store (rather than a hardcoded list) keeps the "Assigned agent" field
 * in sync with the Agents page, and the verification filter guarantees a listing
 * never shows a Pending agent on its card.
 */
export function useAssignableAgents(): ApAgent[] {
  const { agents } = useProperties();
  return useMemo(
    () =>
      agents
        .filter((a) => a.verification === "Verified")
        .map((a) => ({
          id: a.id,
          name: a.name,
          area: a.city ? `${a.city} · ${a.area}` : a.area,
          phone: a.phone,
          avatar: a.img ?? "",
        })),
    [agents],
  );
}

export function AgentSelect({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef);
  const agents = useAssignableAgents();
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter((a) => a.name.toLowerCase().includes(q) || a.area.toLowerCase().includes(q));
  }, [agents, query]);
  const toggle = () => {
    if (!open) {
      setQuery("");
      calc();
    }
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    // focus the search field once the portal is painted
    const t = window.setTimeout(() => searchRef.current?.focus(), 0);
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <button type="button" ref={triggerRef} id={id} className={"ap-agentsel__trigger" + (open ? " is-open" : "")} onClick={toggle} aria-haspopup="listbox" aria-expanded={open}>
        <span className="ap-agentsel__placeholder">
          <Icon name="user" size={17} />
          {t("admin.props.selectAgent")}
        </span>
        <Icon name="chevron-down" size={17} className="ap-agentsel__chev" />
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={panelRef} className="ap-agentsel__drop ap-agentsel__drop--search" style={{ top: coords.top, left: coords.left, width: coords.width, clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }}>
            <div className="ap-agentsel__search">
              <Icon name="search" size={16} className="ap-agentsel__search-ic" />
              <input
                ref={searchRef}
                type="text"
                className="ap-agentsel__search-input"
                placeholder={t("admin.props.searchAgentsPh")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={t("admin.props.searchAgentsAria")}
              />
              {query && (
                <button
                  type="button"
                  className="ap-agentsel__search-clear"
                  aria-label={t("admin.props.clearSearch")}
                  onClick={() => {
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  <Icon name="x" size={15} />
                </button>
              )}
            </div>
            <div className="ap-agentsel__list" role="listbox">
              {filtered.length === 0 ? (
                <div className="ap-agentsel__empty">
                  <Icon name="user-x" size={20} />
                  No verified agents match “{query}”.
                </div>
              ) : (
                filtered.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={"ap-agentsel__row" + (value === a.id ? " is-selected" : "")}
                    role="option"
                    aria-selected={value === a.id}
                    onClick={() => {
                      onChange(value === a.id ? "" : a.id);
                      setOpen(false);
                    }}
                  >
                    <Avatar src={a.avatar || undefined} name={a.name} size="sm" verified />
                    <span className="ap-agentsel__body">
                      <span className="ap-agentsel__name">{a.name}</span>
                      <span className="ap-agentsel__area">{a.area}</span>
                    </span>
                    {value === a.id && (
                      <span className="ap-agentsel__check">
                        <Icon name="check" size={16} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function AgentSummary({ agent, onClear, locked }: { agent: ApAgent; onClear?: () => void; locked?: boolean }) {
  const { t } = useLang();
  return (
    <div className="ap-agentcard">
      <Avatar src={agent.avatar || undefined} name={agent.name} size="lg" verified />
      <div className="ap-agentcard__meta">
        <span className="ap-agentcard__name">
          {agent.name}
          <Badge variant="brand" size="sm" icon="badge-check">
            {t("status.verified")}
          </Badge>
        </span>
        <span className="ap-agentcard__phone">
          <Icon name="phone" size={14} />
          {agent.phone}
        </span>
      </div>
      {locked ? (
        <span className="ap-agentcard__lock" aria-hidden="true">
          <Icon name="lock" size={16} />
        </span>
      ) : (
        <button type="button" className="ap-agentcard__remove" aria-label={t("admin.ap.removeAgent")} onClick={onClear}>
          <Icon name="x" size={17} />
        </button>
      )}
    </div>
  );
}

export function SubHead({ title, desc, optional }: { title: string; desc: string; optional?: boolean }) {
  return (
    <div className="ap-subhead">
      <h3 className="ap-subhead__title">
        {title}
        {optional && (
          <span className="ap-label__opt" style={{ marginLeft: 8 }}>
            (Optional)
          </span>
        )}
      </h3>
      <p className="ap-subhead__desc">{desc}</p>
    </div>
  );
}

export function AmenityGrid({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { t } = useLang();
  const toggle = (label: string) => onChange(value.includes(label) ? value.filter((x) => x !== label) : [...value, label]);
  return (
    <div className="ap-amen" role="group" aria-label={t("admin.pd.amenities")}>
      {AMENITIES.map((a) => {
        const on = value.includes(a.label);
        return (
          <button key={a.label} type="button" aria-pressed={on} className={"ap-amen__item" + (on ? " is-on" : "")} onClick={() => toggle(a.label)}>
            <span className="ap-amen__ic">
              <Icon name={a.icon} size={16} />
            </span>
            <span className="ap-amen__label">{t(a.labelKey)}</span>
            {on && (
              <span className="ap-amen__check">
                <Icon name="check" size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CustomAmenities({ items, onAdd, onRemove }: { items: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void }) {
  const { t } = useLang();
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (!t) return;
    onAdd(t);
    setVal("");
  };
  return (
    <div className="ap-custom-wrap">
      <div className="ap-custom">
        <input
          className="ap-custom__input"
          type="text"
          placeholder={t("admin.ap.customAmenityName")}
          aria-label={t("admin.ap.customAmenityName")}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={add}>
          {t("admin.ap.addAmenity")}
        </Button>
      </div>
      {items.length > 0 && (
        <div className="ap-taglist">
          {items.map((it, i) => (
            <span className="ap-tag" key={it + i}>
              {it}
              <button type="button" className="ap-tag__rm" aria-label={"Remove " + it} onClick={() => onRemove(i)}>
                <Icon name="x" size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewSection({ icon, title, onEdit, children }: { icon: IconName; title: string; onEdit: () => void; children: React.ReactNode }) {
  const { t } = useLang();
  return (
    <div className="ap-rev__sect">
      <div className="ap-rev__head">
        <h3 className="ap-rev__htitle">
          <span className="ap-rev__hic">
            <Icon name={icon} size={18} />
          </span>
          {title}
        </h3>
        <button type="button" className="ap-rev__edit" onClick={onEdit}>
          {t("admin.props.edit")}
          <Icon name="arrow-right" size={15} strokeWidth={2.25} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function RevItem({ k, v, full, price, tnum }: { k: string; v: React.ReactNode; full?: boolean; price?: boolean; tnum?: boolean }) {
  const { t } = useLang();
  const empty = v === undefined || v === null || v === "" || v === "—";
  const cls = ["ap-rev__v", price ? "ap-rev__v--price" : "", tnum ? "cx-tnum" : "", empty ? "ap-rev__v--muted" : ""].filter(Boolean).join(" ");
  return (
    <div className={"ap-rev__item" + (full ? " ap-rev__item--full" : "")}>
      <span className="ap-rev__k">{k}</span>
      <span className={cls}>{empty ? t("admin.ap.notProvided") : v}</span>
    </div>
  );
}

function PublishedSuccess({ preview }: { preview: PublishPreview | null }) {
  const { t } = useLang();
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const view = preview ?? {
    id: "CH-2041",
    title: PUBLISHED.title,
    address: PUBLISHED.address,
    price: PUBLISHED.price,
    listing: PUBLISHED.listing,
    beds: PUBLISHED.beds,
    baths: PUBLISHED.baths,
    area: PUBLISHED.area,
    cover: PUBLISHED.cover,
    published: true,
  };
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      if (document.visibilityState !== "visible" || el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.classList.add("pp-go");
      timer = setTimeout(() => el.classList.remove("pp-go"), 1500);
    };
    reveal();
    document.addEventListener("visibilitychange", reveal);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", reveal);
    };
  }, []);
  return (
    <div className="pp-stage" ref={stageRef}>
      <section className="pp-card" aria-labelledby="pp-title">
        <div className="pp-mark" aria-hidden="true">
          <span className="pp-mark__halo" />
          <span className="pp-mark__ring" />
          <span className="pp-mark__disc">
            <Icon name="check" size={46} strokeWidth={2.4} />
          </span>
          <span className="pp-mark__spark">
            <Icon name="sparkles" size={18} strokeWidth={2} />
          </span>
        </div>
        <h1 className="pp-title" id="pp-title">
          {t(view.published ? "admin.ap.publishedTitle" : "admin.ap.pendingTitle")}
        </h1>
        <p className="pp-desc">
          {view.published
            ? t("admin.ap.publishedBody")
            : t("admin.ap.pendingBody")}
        </p>
        <div className="pp-listing">
          <div className="pp-listing__media">
            <img src={view.cover} alt="" />
            <span className={"pp-listing__badge" + (view.published ? "" : " pp-listing__badge--pending")}>
              <Icon name={view.published ? "circle-check" : "clock"} size={12} strokeWidth={2.5} />
              {view.published ? "Published" : "Pending"}
            </span>
          </div>
          <div className="pp-listing__body">
            <div className="pp-listing__tags">
              <Badge variant="success" size="sm" icon="tag">
                {view.listing}
              </Badge>
              <span className="pp-listing__ref">
                <Icon name="hash" size={12} />
                {view.id}
              </span>
            </div>
            <h2 className="pp-listing__name">{view.title}</h2>
            <span className="pp-listing__addr">
              <Icon name="map-pin" size={14} />
              {view.address}
            </span>
            <div className="pp-listing__row">
              <span className="pp-listing__price cx-tnum">{view.price}</span>
              <span className="pp-listing__specs">
                <span>
                  <Icon name="bed-double" size={15} />
                  {view.beds}
                </span>
                <span>
                  <Icon name="bath" size={15} />
                  {view.baths}
                </span>
                <span className="cx-tnum">
                  <Icon name="maximize-2" size={15} />
                  {view.area}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="pp-actions">
          <Button hierarchy="primary" size="lg" iconLeading="eye" onClick={() => router.push(`/admin/properties/${encodeURIComponent(view.id)}`)}>
            {t("admin.mp.viewProperty")}
          </Button>
          <div className="pp-actions__row">
            <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={() => router.push("/admin/properties/new")}>
              {t("admin.ap.addAnother")}
            </Button>
          </div>
          <div className="pp-actions__back">
            <Button hierarchy="link" size="lg" iconLeading="arrow-left" onClick={() => router.push("/admin/properties")}>
              {t("admin.ap.backToProps")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Member-facing success screen after a "Submit your property" run: the listing
 *  is filed as Pending Review and the member is routed back to My Properties. */
function MemberSubmittedSuccess({ listing, editing }: { listing: MemberListing | null; editing?: boolean }) {
  const { t } = useLang();
  const router = useRouter();
  return (
    <div className="pp-stage">
      <section className="pp-card" aria-labelledby="pp-title">
        <div className="pp-mark" aria-hidden="true">
          <span className="pp-mark__halo" />
          <span className="pp-mark__ring" />
          <span className="pp-mark__disc">
            <Icon name="check" size={46} strokeWidth={2.4} />
          </span>
          <span className="pp-mark__spark">
            <Icon name="sparkles" size={18} strokeWidth={2} />
          </span>
        </div>
        <h1 className="pp-title" id="pp-title">
          {t(editing ? "admin.ap.savedTitle" : "admin.ap.submittedTitle")}
        </h1>
        <p className="pp-desc">
          {editing
            ? t("admin.ap.savedBody")
            : t("admin.ap.submittedBody")}
        </p>
        {listing && (
          <div className="pp-listing">
            <div className="pp-listing__media">
              {listing.cover ? (
                <img src={listing.cover} alt="" />
              ) : (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", color: "var(--text-tertiary)" }}>
                  <Icon name="image" size={26} />
                </span>
              )}
              <span className="pp-listing__badge pp-listing__badge--pending">
                <Icon name="clock" size={12} strokeWidth={2.5} />
                {t("status.pending")}
              </span>
            </div>
            <div className="pp-listing__body">
              <div className="pp-listing__tags">
                <Badge variant="success" size="sm" icon="tag">
                  {listing.deal === "rent" ? "For rent" : "For sale"}
                </Badge>
                <span className="pp-listing__ref">
                  <Icon name="hash" size={12} />
                  {"CH-" + listing.id.replace(/^ml-/, "").toUpperCase()}
                </span>
              </div>
              <h2 className="pp-listing__name">{listing.title}</h2>
              <span className="pp-listing__addr">
                <Icon name="map-pin" size={14} />
                {listing.location}
              </span>
              <div className="pp-listing__row">
                <span className="pp-listing__price cx-tnum">{listing.price || t("admin.ap.priceOnRequest")}</span>
                <span className="pp-listing__specs">
                  <span>
                    <Icon name="bed-double" size={15} />
                    {listing.beds ?? 0}
                  </span>
                  <span>
                    <Icon name="bath" size={15} />
                    {listing.baths ?? 0}
                  </span>
                  <span className="cx-tnum">
                    <Icon name="maximize-2" size={15} />
                    {listing.area || 0}
                  </span>
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="pp-actions">
          <Button hierarchy="primary" size="lg" iconLeading="eye" onClick={() => router.push("/my-listings")}>
            {t("admin.mp.viewProperty")}
          </Button>
          <div className="pp-actions__row">
            <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={() => { window.location.href = "/my-listings/new"; }}>
              {t("admin.ap.addAnother")}
            </Button>
          </div>
          <div className="pp-actions__back">
            <Button hierarchy="link" size="lg" iconLeading="arrow-left" onClick={() => router.push("/my-listings")}>
              {t("admin.ap.backToProps")}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AddPropertyApp({ lockedAgentId, mode = "admin", editListingId }: { lockedAgentId?: string; mode?: "admin" | "member"; editListingId?: string } = {}) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const { addProperty, locationTree } = useProperties();
  const { items: memberListings, add: addMemberListing, update: updateMemberListing } = useListings();
  const member = mode === "member";
  const assignableAgents = useAssignableAgents();
  const photos = usePhotoUploader(false);
  const [f, setF] = useState<ApForm>(() => (lockedAgentId ? { ...EMPTY_FORM, agent: lockedAgentId } : EMPTY_FORM));
  const set = <K extends keyof ApForm>(k: K, v: ApForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState<PublishPreview | null>(null);
  const [submitted, setSubmitted] = useState<MemberListing | null>(null);

  // Member edit mode: reopen an existing listing prefilled. The id is passed in
  // from the server page's `?edit=` search param (falls back to reading the URL
  // directly for client navigations).
  const [editId] = useState<string | null>(() => {
    if (!member) return null;
    if (editListingId) return editListingId;
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("edit");
  });
  const seeded = useRef(false);
  useEffect(() => {
    if (!member || seeded.current || !editId) return;
    const existing = memberListings.find((l) => l.id === editId);
    if (!existing) return;
    seeded.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setF(
      existing.form ?? {
        ...EMPTY_FORM,
        title: existing.title,
        listing: existing.deal === "rent" ? "rent" : "sale",
        description: existing.description ?? "",
        city: existing.city ?? "",
        beds: existing.beds ?? 0,
        baths: existing.baths ?? 0,
      },
    );
    if (existing.gallery?.length) photos.hydrate(existing.gallery);
    else if (existing.cover) photos.hydrate([existing.cover]);
  }, [member, editId, memberListings, photos]);
  const editing = !!editId && memberListings.some((l) => l.id === editId);
  const goTo = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Canonical (English) strings — these get written into the stored listing
  // record, which lib/listings.ts and the public site also read. Keeping them
  // language-neutral stops a record from freezing in whatever language it was
  // submitted in; the review step below renders localized copies instead.
  const CUR: Record<string, string> = { USD: "$", EUR: "€", IQD: "IQD " };
  const groupDigits = (n: string | number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const priceStr = f.price ? (CUR[f.currency] || "") + groupDigits(f.price) : "";
  const areaStr = f.area ? groupDigits(f.area) + " " + (f.areaUnit === "sqm" ? "m²" : f.areaUnit) : "";
  const priceDisplay = f.price ? fmtCurrency(lang, Number(f.price), f.currency) : "";
  const areaDisplay = f.area ? fmtNum(lang, Number(f.area)) + " " + (f.areaUnit === "sqm" ? t("unit.sqm") : f.areaUnit) : "";
  const rev = {
    listing: t(f.listing === "rent" ? "admin.pd.forRent" : "admin.pd.forSale"),
    type: tOr(valueKey("type", f.type), f.type),
    title: f.title,
    price: priceDisplay,
    area: areaDisplay,
    city: tOr(`city.${f.city}`, f.city),
    district: tOr(`loc.${f.district}`, f.district),
    project: tOr(`loc.${f.project}`, f.project),
    street: f.street,
    building: f.building,
    lat: localizeDigits(lang, f.lat),
    lng: localizeDigits(lang, f.lng),
    year: f.year ? localizeDigits(lang, String(f.year)) : "",
    orientation: tOr(valueKey("admin.ap.orient", f.orientation), f.orientation),
    ownerName: f.ownerName,
    ownerPhone: localizeDigits(lang, f.ownerPhone),
    ownerEmail: f.ownerEmail,
  };
  const revAgent = assignableAgents.find((a) => a.id === f.agent) || null;
  const AMEN_IC: Record<string, IconName> = Object.fromEntries(AMENITIES.map((a) => [a.label, a.icon]));

  // City / district options come from the live Locations structure, so a
  // location added on the Locations page shows up here immediately.
  const cityOptions = locationTree.map((c) => c.name);
  const cityNode = locationTree.find((c) => c.name === f.city);
  const districtSource = cityNode ? cityNode.children : locationTree.flatMap((c) => c.children);
  const districtOptions = districtSource.map((d) => d.name);
  const districtNode = districtSource.find((d) => d.name === f.district);
  const projectOptions = districtNode ? districtNode.children.map((p) => p.name) : [];

  if (step === 6) return member ? <MemberSubmittedSuccess listing={submitted} editing={editing} /> : <PublishedSuccess preview={preview} />;

  return (
    <div className="ap-wrap">
      <nav className="ap-crumbs" aria-label={t("admin.common.breadcrumb")}>
        <Link href={member ? "/my-listings" : "/admin/properties"}>
          {!member && <Icon name="building-2" size={14} />}
          {t(member ? "admin.ap.myProperties" : "admin.nav.properties")}
        </Link>
        <span className="ap-crumbs__sep">
          <Icon name="chevron-right" size={14} />
        </span>
        <span className="ap-crumbs__current" aria-current="page">
          {t(member ? (editing ? "admin.props.editProperty" : "admin.ap.submitProperty") : "admin.ap.addProperty")}
        </span>
      </nav>

      <div className="ap-title">
        <h1>{t(member ? (editing ? "admin.ap.editYours" : "admin.ap.submitYours") : "admin.ap.addProperty")}</h1>
        <p>{t(member ? "admin.ap.memberSub" : "admin.ap.adminSub")}</p>
      </div>

      <ProgressStepper active={step} />

      {step === 0 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">{t("admin.ap.step.details")}</h2>
            <p className="ap-card__desc">{t("admin.ap.detailsDesc")}</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>{t("admin.ap.f.listingType")}</FieldLabel>
                <RadioCards
                  value={f.listing}
                  onChange={(v) => set("listing", v)}
                  options={[
                    { value: "sale", label: t("admin.pd.forSale"), sub: t("admin.ap.listForPurchase"), icon: "tag" },
                    { value: "rent", label: t("admin.pd.forRent"), sub: t("admin.ap.offerAsRental"), icon: "key" },
                  ]}
                />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-type">{t("admin.ap.f.type")}</FieldLabel>
                <Dropdown id="ap-type" placeholder={t("admin.ap.selectType")} value={f.type} onChange={(v) => set("type", v)} options={PROPERTY_TYPES.map((v) => ({ value: v, label: tOr(valueKey("type", v), v) }))} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-title">{t("admin.ap.f.title")}</FieldLabel>
                <Input id="ap-title" size="lg" placeholder="e.g. Olive Grove Estate — Ankawa, Erbil" value={f.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-desc">{t("admin.ap.f.description")}</FieldLabel>
                <Textarea id="ap-desc" rows={5} placeholder={t("admin.ap.descPh")} value={f.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-price">{t("admin.props.th.price")}</FieldLabel>
                <div className="ap-combo">
                  <ComboSelect side="left" value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "IQD"]} />
                  <input id="ap-price" className="ap-combo__input" inputMode="numeric" placeholder={t("admin.ap.pricePh")} value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} />
                </div>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-area">{t("admin.ap.f.areaSize")}</FieldLabel>
                <div className="ap-combo">
                  <input id="ap-area" className="ap-combo__input" inputMode="numeric" placeholder={t("admin.ap.areaSizePh")} value={f.area} onChange={(e) => set("area", e.target.value.replace(/[^\d]/g, ""))} />
                  <ComboSelect side="right" value={f.areaUnit} onChange={(v) => set("areaUnit", v)} options={["sqm", "sq ft"]} />
                </div>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" href={member ? "/my-listings" : "/admin/properties"}>
              {t("admin.common.cancel")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(1)}>
                {t("admin.ap.nextBtn")}
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">{t("admin.pd.location")}</h2>
            <p className="ap-card__desc">{t("admin.ap.locationDesc")}</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field">
                <FieldLabel htmlFor="ap-city">{t("admin.pd.f.city")}</FieldLabel>
                <Dropdown id="ap-city" placeholder={t("admin.ap.selectCity")} value={f.city} onChange={(v) => { set("city", v); set("district", ""); set("project", ""); }} options={cityOptions.map((c) => ({ value: c, label: tOr(`city.${c}`, c) }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-district" optional>
                  {t("admin.ap.f.area")}
                </FieldLabel>
                <Dropdown id="ap-district" disabled={districtOptions.length === 0} placeholder={t(districtOptions.length ? "admin.ap.selectDistrict" : "admin.ap.noDistricts")} value={f.district} onChange={(v) => { set("district", v); set("project", ""); }} options={districtOptions.map((d) => ({ value: d, label: tOr(`loc.${d}`, d) }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-project" optional>
                  {t("admin.ap.f.project")}
                </FieldLabel>
                <Dropdown id="ap-project" disabled={projectOptions.length === 0} placeholder={t(!f.district ? "admin.ap.selectAreaFirst" : projectOptions.length ? "admin.ap.selectProject" : "admin.ap.noProjects")} value={f.project} onChange={(v) => set("project", v)} options={projectOptions.map((pr) => ({ value: pr, label: tOr(`loc.${pr}`, pr) }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-street" optional>
                  {t("admin.ap.f.street")}
                </FieldLabel>
                <Input id="ap-street" size="lg" placeholder="e.g. 60 Meter Street, Block 4" value={f.street} onChange={(e) => set("street", e.target.value)} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-building" optional>
                  {t("admin.ap.f.building")}
                </FieldLabel>
                <Input id="ap-building" size="lg" placeholder="e.g. Villa 128 / Tower B" value={f.building} onChange={(e) => set("building", e.target.value)} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel>{t("admin.pd.f.map")}</FieldLabel>
                <MapPicker
                  city={f.city}
                  lat={f.lat}
                  lng={f.lng}
                  onMove={(la, ln) => {
                    set("lat", la.toFixed(5));
                    set("lng", ln.toFixed(5));
                  }}
                />
                <span className="ap-hint">{t("admin.ap.mapHint")}</span>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-lat">{t("admin.ap.f.lat")}</FieldLabel>
                <div className="ap-coord">
                  <span className="ap-coord__tag">
                    <Icon name="compass" size={14} />
                    Lat
                  </span>
                  <input id="ap-lat" inputMode="decimal" placeholder="36.19085" value={f.lat} onChange={(e) => set("lat", e.target.value.replace(/[^\d.\-]/g, ""))} />
                </div>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-lng">{t("admin.ap.f.lng")}</FieldLabel>
                <div className="ap-coord">
                  <span className="ap-coord__tag">
                    <Icon name="compass" size={14} />
                    Lng
                  </span>
                  <input id="ap-lng" inputMode="decimal" placeholder="44.00947" value={f.lng} onChange={(e) => set("lng", e.target.value.replace(/[^\d.\-]/g, ""))} />
                </div>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-locnotes" optional>
                  {t("admin.ap.f.locNotes")}
                </FieldLabel>
                <Textarea id="ap-locnotes" rows={4} placeholder={t("admin.ap.landmarksPh")} value={f.locNotes} onChange={(e) => set("locNotes", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(0)}>
              {t("admin.ap.prev")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(2)}>
                {t("admin.ap.nextBtn")}
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">{t("admin.ap.step.media")}</h2>
            <p className="ap-card__desc">{t("admin.ap.mediaDesc")}</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>{t("admin.pd.coverImage")}</FieldLabel>
                <CoverImage cover={photos.cover} onPick={photos.addAsCover} onRemove={() => photos.cover && photos.removePhoto(photos.cover.id)} />
                <span className="ap-hint">{t("admin.ap.coverHint")}</span>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel>{t("admin.ap.gallery")}</FieldLabel>
                <GalleryGrid store={photos} />
                <span className="ap-hint">{t("admin.ap.galleryHint")}</span>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel optional>{t("admin.ap.video")}</FieldLabel>
                <VideoUpload store={photos} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-tour" optional>
                  {t("admin.ap.f.tourUrl")}
                </FieldLabel>
                <Input id="ap-tour" size="lg" type="url" iconLeading="link" placeholder="https://..." value={f.tourUrl} onChange={(e) => set("tourUrl", e.target.value)} />
                <span className="ap-hint">Link a Matterport, YouTube, or 360° walkthrough.</span>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(1)}>
              {t("admin.ap.prev")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(3)}>
                {t("admin.ap.nextBtn")}
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="ap-card">
          <div className="ap-card__body">
            <div className="ap-sect">
              <SubHead title={t("admin.pd.features")} desc={t("admin.ap.featuresDesc")} />
              <div className="ap-grid">
                <div className="ap-field">
                  <FieldLabel>{t("admin.pd.f.beds")}</FieldLabel>
                  <Stepper value={f.beds} onChange={(v) => set("beds", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel>{t("admin.pd.f.baths")}</FieldLabel>
                  <Stepper value={f.baths} onChange={(v) => set("baths", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel optional>{t("admin.ap.f.parking")}</FieldLabel>
                  <Stepper value={f.parking} onChange={(v) => set("parking", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel optional>{t("admin.ap.f.levels")}</FieldLabel>
                  <Stepper value={f.floors} onChange={(v) => set("floors", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-year" optional>
                    {t("admin.pd.f.yearBuilt")}
                  </FieldLabel>
                  <Input id="ap-year" size="lg" inputMode="numeric" maxLength={4} placeholder="e.g. 2022" value={f.year} onChange={(e) => set("year", e.target.value.replace(/[^\d]/g, "").slice(0, 4))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-orientation" optional>
                    {t("admin.ap.f.orientation")}
                  </FieldLabel>
                  <Dropdown id="ap-orientation" placeholder={t("admin.ap.selectOrientation")} value={f.orientation} onChange={(v) => set("orientation", v)} options={ORIENTATIONS.map((o) => ({ value: o, label: tOr(valueKey("admin.ap.orient", o), o) }))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-condition">{t("admin.ap.f.condition")}</FieldLabel>
                  <Dropdown id="ap-condition" placeholder={t("admin.ap.selectCondition")} value={f.condition} onChange={(v) => set("condition", v)} options={CONDITIONS.map((o) => ({ value: o, label: tOr(valueKey("admin.ap.cond", o), o) }))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-furnishing">{t("admin.ap.f.furnishing")}</FieldLabel>
                  <Dropdown id="ap-furnishing" placeholder={t("admin.ap.selectFurnishing")} value={f.furnishing} onChange={(v) => set("furnishing", v)} options={FURNISHING.map((o) => ({ value: o, label: tOr(valueKey("furnished", o), o) }))} />
                </div>
              </div>
            </div>
            <div className="ap-sect">
              <SubHead title={t("admin.pd.amenities")} desc={t("admin.ap.amenitiesDesc")} />
              <AmenityGrid value={f.amenities} onChange={(v) => set("amenities", v)} />
              <div className="ap-field">
                <FieldLabel optional>{t("admin.ap.customAmenities")}</FieldLabel>
                <CustomAmenities
                  items={f.customAmenities}
                  onAdd={(t) => set("customAmenities", f.customAmenities.includes(t) ? f.customAmenities : [...f.customAmenities, t])}
                  onRemove={(i) => set("customAmenities", f.customAmenities.filter((_, idx) => idx !== i))}
                />
                <span className="ap-hint">Add anything specific to this property that isn&apos;t listed above.</span>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(2)}>
              {t("admin.ap.prev")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(4)}>
                {t("admin.ap.nextBtn")}
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Ownership &amp; assignment</h2>
            <p className="ap-card__desc">{t("admin.ap.ownershipDesc")}</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-owner-name">{t("admin.ap.f.ownerName")}</FieldLabel>
                  <Input id="ap-owner-name" size="lg" iconLeading="user" placeholder="e.g. Hêmin Abdullah" value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-owner-phone">{t("admin.mp.phoneNumber")}</FieldLabel>
                  <Input id="ap-owner-phone" size="lg" type="tel" iconLeading="phone" placeholder="+964 750 000 0000" value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-owner-email">{t("admin.mp.emailAddress")}</FieldLabel>
                  <Input id="ap-owner-email" size="lg" type="email" iconLeading="mail" placeholder="owner@email.com" value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-agent">{t("admin.pd.assignedAgent")}</FieldLabel>
                  {(() => {
                    const sel = assignableAgents.find((a) => a.id === f.agent);
                    if (lockedAgentId) return sel ? <AgentSummary agent={sel} locked /> : null;
                    return sel ? <AgentSummary agent={sel} onClear={() => set("agent", "")} /> : <AgentSelect id="ap-agent" value={f.agent} onChange={(v) => set("agent", v)} />;
                  })()}
                  {lockedAgentId && <p className="ap-lockhint">{t("admin.ap.agentSelfNote")}</p>}
                </div>
              </div>
            </div>
            {!member && (
              <div className="ap-sect ap-sect--flush">
                <div className="ap-grid">
                  <div className="ap-field ap-col-full">
                    <FieldLabel htmlFor="ap-notes" optional>
                      {t("admin.pd.notes")}
                    </FieldLabel>
                    <Textarea id="ap-notes" rows={4} placeholder={t("admin.ap.notesPh")} value={f.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
                    <span className="ap-staffnote">
                      <Icon name="lock" size={14} />
                      {t("admin.ap.notesHint")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(3)}>
              {t("admin.ap.prev")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(5)}>
                {t("admin.ap.nextBtn")}
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">{t(member ? "admin.ap.reviewSubmit" : "admin.ap.step.review")}</h2>
            <p className="ap-card__desc">{t("admin.ap.reviewDesc")}</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-rev">
              <ReviewSection icon="home" title={t("admin.ap.step.details")} onEdit={() => goTo(0)}>
                <div className="ap-rev__grid">
                  <RevItem k={t("admin.ap.f.listingTitle")} v={rev.title} full />
                  <RevItem k={t("admin.ap.f.type")} v={rev.type} />
                  <RevItem k={t("admin.ap.f.listingType")} v={rev.listing} />
                  <RevItem k={t("admin.props.th.price")} v={rev.price} price tnum />
                  <RevItem k={t("admin.ap.f.areaSize")} v={rev.area} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="map-pin" title={t("admin.pd.location")} onEdit={() => goTo(1)}>
                <div className="ap-rev__grid">
                  <RevItem k={t("admin.pd.f.city")} v={rev.city} />
                  <RevItem k={t("admin.ap.f.area")} v={rev.district} />
                  <RevItem k={t("admin.ap.f.project")} v={rev.project} />
                  <RevItem k={t("admin.ap.f.street")} v={rev.street} full />
                  <RevItem k={t("admin.ap.f.building")} v={rev.building} />
                  <RevItem k={t("admin.ap.coordinates")} v={rev.lat && rev.lng ? rev.lat + ", " + rev.lng : ""} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="image" title={t("admin.ap.step.media")} onEdit={() => goTo(2)}>
                {photos.photos.length === 0 && !photos.video ? (
                  <span className="ap-rev__v ap-rev__v--muted">{t("admin.ap.noMedia")}</span>
                ) : (
                  <div className="ap-rev__media">
                    {photos.photos.length > 0 && (
                      <div className="ap-rev__thumbs">
                        {photos.photos.slice(0, 4).map((g) => (
                          <span className={"ap-rev__thumb" + (g.id === photos.coverId ? " ap-rev__thumb--cover" : "")} key={g.id}>
                            <img src={g.url} alt="" />
                            {g.id === photos.coverId && (
                              <span className="ap-rev__thumb-tag">
                                <Icon name="star" size={9} strokeWidth={2.5} />
                                {t("admin.ap.cover")}
                              </span>
                            )}
                          </span>
                        ))}
                        {photos.photos.length > 4 && <span className="ap-rev__more">+{photos.photos.length - 4}</span>}
                      </div>
                    )}
                    <div className="ap-rev__stats">
                      <span className="ap-rev__stat">
                        <Icon name="image" size={16} />
                        <b>{photos.photos.length}</b> photo{photos.photos.length === 1 ? "" : "s"} uploaded
                      </span>
                      <span className="ap-rev__stat">
                        <Icon name="video" size={16} />
                        <b>{photos.video ? 1 : 0}</b> video{photos.video ? "" : "s"} uploaded
                      </span>
                      {photos.cover && (
                        <span className="ap-rev__stat">
                          <Icon name="star" size={16} />
                          {t("admin.ap.coverSelected")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </ReviewSection>
              <ReviewSection icon="ruler" title={t("admin.pd.features")} onEdit={() => goTo(3)}>
                <div className="ap-rev__grid">
                  <RevItem k={t("admin.pd.f.beds")} v={f.beds || ""} tnum />
                  <RevItem k={t("admin.pd.f.baths")} v={f.baths || ""} tnum />
                  <RevItem k={t("admin.ap.f.parking")} v={f.parking || ""} tnum />
                  <RevItem k={t("admin.ap.f.levels")} v={f.floors || ""} tnum />
                  <RevItem k={t("admin.pd.f.yearBuilt")} v={rev.year} tnum />
                  <RevItem k={t("admin.ap.f.orientation")} v={rev.orientation} />
                  <RevItem k={t("admin.ap.f.condition")} v={f.condition} />
                  <RevItem k={t("admin.ap.f.furnishing")} v={f.furnishing} />
                </div>
              </ReviewSection>
              <ReviewSection icon="sparkles" title={t("admin.pd.amenities")} onEdit={() => goTo(3)}>
                <div className="ap-rev__amen">
                  {f.amenities.map((a) => (
                    <span className="ap-rev__pill" key={a}>
                      <Icon name={AMEN_IC[a] || "check"} size={15} />
                      {a}
                    </span>
                  ))}
                  {f.customAmenities.map((a) => (
                    <span className="ap-rev__pill ap-rev__pill--custom" key={"c-" + a}>
                      <Icon name="sparkles" size={14} />
                      {a}
                    </span>
                  ))}
                </div>
              </ReviewSection>
              <ReviewSection icon="user-round" title={t("admin.ap.step.ownership")} onEdit={() => goTo(4)}>
                <div className="ap-rev__grid">
                  <RevItem k={t("admin.props.th.owner")} v={rev.ownerName} />
                  <RevItem k={t("admin.ap.f.ownerPhone")} v={rev.ownerPhone} tnum />
                  <RevItem k={t("admin.ap.f.ownerEmail")} v={rev.ownerEmail} full />
                  <div className="ap-rev__item ap-rev__item--full">
                    <span className="ap-rev__k">{t("admin.pd.assignedAgent")}</span>
                    {revAgent ? (
                      <span className="ap-rev__agent">
                        <Avatar src={revAgent.avatar || undefined} name={revAgent.name} size="xs" verified />
                        <span className="ap-rev__agent-name">
                          {revAgent.name}
                          <Badge variant="brand" size="sm" icon="badge-check">
                            {t("status.verified")}
                          </Badge>
                        </span>
                      </span>
                    ) : (
                      <span className="ap-rev__v ap-rev__v--muted">{t("admin.ap.notProvided")}</span>
                    )}
                  </div>
                </div>
              </ReviewSection>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(4)}>
              {t("admin.ap.prev")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button
                hierarchy="primary"
                size="lg"
                onClick={() => {
                  if (member) {
                    if (editing && editId) {
                      const rec = formToMemberListing(f, photos, priceStr, areaStr, editId);
                      updateMemberListing(editId, rec);
                      setSubmitted(rec);
                    } else {
                      const rec = formToMemberListing(f, photos, priceStr, areaStr);
                      addMemberListing(rec);
                      setSubmitted(rec);
                    }
                    goTo(6);
                    return;
                  }
                  const rec = formToProperty(f, f.agent ? revAgent : null, photos);
                  addProperty(rec);
                  setPreview({
                    id: rec.id,
                    title: rec.title,
                    address: rec.area + ", " + rec.city,
                    price: priceDisplay || fmtCurrency(lang, rec.price, f.currency),
                    listing: t(rec.listing === "rent" ? "admin.pd.forRent" : "admin.pd.forSale"),
                    beds: rec.beds,
                    baths: rec.baths,
                    area: areaStr || String(rec.size),
                    cover: rec.img,
                    published: !!f.agent,
                  });
                  goTo(6);
                }}
              >
                {t(member ? (editing ? "admin.ap.saveChanges" : "admin.ap.submitProperty") : "admin.ap.publishProperty")}
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
