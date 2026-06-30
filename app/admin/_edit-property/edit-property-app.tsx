"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import {
  AGENTS,
  AMENITIES,
  CITIES,
  CONDITIONS,
  DISTRICTS,
  FURNISHING,
  GALLERY_IMGS,
  INITIAL,
  ORIENTATIONS,
  PROPERTY_TYPES,
  type ApForm,
} from "./data";
import {
  AgentSelect,
  AgentSummary,
  AmenityGrid,
  ComboSelect,
  CoverImage,
  CustomAmenities,
  Dropdown,
  FieldLabel,
  GalleryGrid,
  MapPicker,
  ProgressStepper,
  RadioCards,
  ReviewSection,
  RevItem,
  Stepper,
  SubHead,
  VideoUpload,
} from "../_add-property/add-property-app";

export function EditPropertyApp({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [f, setF] = useState<ApForm>(INITIAL);
  const set = <K extends keyof ApForm>(k: K, v: ApForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const [step, setStep] = useState(0);
  const goTo = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [pristine, setPristine] = useState(JSON.stringify(INITIAL));
  const savedRef = useRef(false);
  const dirty = JSON.stringify(f) !== pristine;
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  // native guard for refresh / browser-level navigation
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty && !savedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const guardedNav = (href: string) => {
    if (dirty) setPendingNav(href);
    else router.push(href);
  };

  const onUpdate = () => {
    setPristine(JSON.stringify(f));
    savedRef.current = true;
    const from = searchParams.get("from");
    const dest = from === "details" ? `/admin/properties/${encodeURIComponent(id)}?toast=updated` : "/admin/properties?toast=updated";
    router.push(dest);
  };

  const CUR: Record<string, string> = { USD: "$", EUR: "€", IQD: "IQD " };
  const fmtNum = (n: string | number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const priceStr = f.price ? (CUR[f.currency] || "") + fmtNum(f.price) : "$450,000";
  const areaStr = f.area ? fmtNum(f.area) + " " + (f.areaUnit === "sqm" ? "m²" : f.areaUnit) : "420 m²";
  const rev = {
    listing: f.listing === "rent" ? "For rent" : "For sale",
    type: f.type || "Villa",
    title: f.title || "Olive Grove Estate",
    price: priceStr,
    area: areaStr,
    city: f.city || "Erbil",
    district: f.district || "Ankawa",
    street: f.street || "60 Meter Street, Block 4",
    building: f.building || "Villa 128",
    lat: f.lat || "36.19085",
    lng: f.lng || "44.00947",
    year: f.year || "2022",
    orientation: f.orientation || "South facing",
    ownerName: f.ownerName || "Hêmin Abdullah",
    ownerPhone: f.ownerPhone || "+964 750 412 8890",
    ownerEmail: f.ownerEmail || "hemin@email.com",
  };
  const revAgent = AGENTS.find((a) => a.id === f.agent) || AGENTS[0];
  const AMEN_IC: Record<string, IconName> = Object.fromEntries(AMENITIES.map((a) => [a.label, a.icon]));

  return (
    <div className="ap-wrap">
      <nav className="ap-crumbs" aria-label="Breadcrumb">
        <Link
          href="/admin/properties"
          onClick={(e) => {
            e.preventDefault();
            guardedNav("/admin/properties");
          }}
        >
          <Icon name="building-2" size={14} />
          Properties
        </Link>
        <span className="ap-crumbs__sep">
          <Icon name="chevron-right" size={14} />
        </span>
        <Link
          href={`/admin/properties/${id}`}
          onClick={(e) => {
            e.preventDefault();
            guardedNav(`/admin/properties/${id}`);
          }}
        >
          {rev.title}
        </Link>
        <span className="ap-crumbs__sep">
          <Icon name="chevron-right" size={14} />
        </span>
        <span className="ap-crumbs__current" aria-current="page">
          Edit property
        </span>
      </nav>

      <div className="ap-title">
        <h1>Edit property</h1>
        <p>Update this property listing&apos;s information step by step.</p>
      </div>

      <ProgressStepper active={step} />

      {step === 0 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Property details</h2>
            <p className="ap-card__desc">Provide the basic information about the property listing.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>Listing type</FieldLabel>
                <RadioCards
                  value={f.listing}
                  onChange={(v) => set("listing", v)}
                  options={[
                    { value: "sale", label: "For sale", sub: "List for purchase", icon: "tag" },
                    { value: "rent", label: "For rent", sub: "Offer as a rental", icon: "key" },
                  ]}
                />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-type">Property type</FieldLabel>
                <Dropdown id="ap-type" placeholder="Select property type" value={f.type} onChange={(v) => set("type", v)} options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-title">Property title</FieldLabel>
                <Input id="ap-title" size="lg" placeholder="e.g. Olive Grove Estate — Ankawa, Erbil" value={f.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-desc">Property description</FieldLabel>
                <Textarea id="ap-desc" rows={5} placeholder="Describe the home, the lifestyle, and what makes it special…" value={f.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-price">Price</FieldLabel>
                <div className="ap-combo">
                  <ComboSelect side="left" value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "IQD"]} />
                  <input id="ap-price" className="ap-combo__input" inputMode="numeric" placeholder="Enter price" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} />
                </div>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-area">Area size</FieldLabel>
                <div className="ap-combo">
                  <input id="ap-area" className="ap-combo__input" inputMode="numeric" placeholder="Enter area size" value={f.area} onChange={(e) => set("area", e.target.value.replace(/[^\d]/g, ""))} />
                  <ComboSelect side="right" value={f.areaUnit} onChange={(v) => set("areaUnit", v)} options={["sqm", "sq ft"]} />
                </div>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => guardedNav("/admin/properties")}>
              Cancel
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(1)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Location</h2>
            <p className="ap-card__desc">Add the property location and map details.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field">
                <FieldLabel htmlFor="ap-city">City</FieldLabel>
                <Dropdown id="ap-city" placeholder="Select city" value={f.city} onChange={(v) => set("city", v)} options={CITIES.map((c) => ({ value: c, label: c }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-district">Area / district</FieldLabel>
                <Dropdown id="ap-district" placeholder="Select area or district" value={f.district} onChange={(v) => set("district", v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-street">Street address</FieldLabel>
                <Input id="ap-street" size="lg" placeholder="e.g. 60 Meter Street, Block 4" value={f.street} onChange={(e) => set("street", e.target.value)} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-building" optional>
                  Building number
                </FieldLabel>
                <Input id="ap-building" size="lg" placeholder="e.g. Villa 128 / Tower B" value={f.building} onChange={(e) => set("building", e.target.value)} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel>Map location</FieldLabel>
                <MapPicker />
                <span className="ap-hint">Search for an address or drag the map to drop the pin precisely on the property.</span>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-lat">Latitude</FieldLabel>
                <div className="ap-coord">
                  <span className="ap-coord__tag">
                    <Icon name="compass" size={14} />
                    Lat
                  </span>
                  <input id="ap-lat" inputMode="decimal" placeholder="36.19085" value={f.lat} onChange={(e) => set("lat", e.target.value.replace(/[^\d.\-]/g, ""))} />
                </div>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-lng">Longitude</FieldLabel>
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
                  Location notes
                </FieldLabel>
                <Textarea id="ap-locnotes" rows={4} placeholder="Landmarks, access instructions, or directions…" value={f.locNotes} onChange={(e) => set("locNotes", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(0)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(2)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Media</h2>
            <p className="ap-card__desc">Upload property photos, videos, and visual assets for the listing.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>Cover image</FieldLabel>
                <CoverImage />
                <span className="ap-hint">The cover photo headlines the listing across search results and the property page.</span>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel>Gallery images</FieldLabel>
                <GalleryGrid />
                <span className="ap-hint">Drag to reorder · hover an image to set it as cover or remove it.</span>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel optional>Video upload</FieldLabel>
                <VideoUpload />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-tour" optional>
                  Virtual tour URL
                </FieldLabel>
                <Input id="ap-tour" size="lg" type="url" iconLeading="link" placeholder="https://..." value={f.tourUrl} onChange={(e) => set("tourUrl", e.target.value)} />
                <span className="ap-hint">Link a Matterport, YouTube, or 360° walkthrough.</span>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(1)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(3)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="ap-card">
          <div className="ap-card__body">
            <div className="ap-sect">
              <SubHead title="Property features" desc="Enter the property's specifications and characteristics." />
              <div className="ap-grid">
                <div className="ap-field">
                  <FieldLabel>Bedrooms</FieldLabel>
                  <Stepper value={f.beds} onChange={(v) => set("beds", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel>Bathrooms</FieldLabel>
                  <Stepper value={f.baths} onChange={(v) => set("baths", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel optional>Parking spaces</FieldLabel>
                  <Stepper value={f.parking} onChange={(v) => set("parking", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel optional>Levels / floors</FieldLabel>
                  <Stepper value={f.floors} onChange={(v) => set("floors", v)} min={1} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-year" optional>
                    Year built
                  </FieldLabel>
                  <Input id="ap-year" size="lg" inputMode="numeric" maxLength={4} placeholder="e.g. 2022" value={f.year} onChange={(e) => set("year", e.target.value.replace(/[^\d]/g, "").slice(0, 4))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-orientation" optional>
                    Orientation
                  </FieldLabel>
                  <Dropdown id="ap-orientation" placeholder="Select orientation" value={f.orientation} onChange={(v) => set("orientation", v)} options={ORIENTATIONS.map((o) => ({ value: o, label: o }))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-condition">Property condition</FieldLabel>
                  <Dropdown id="ap-condition" placeholder="Select condition" value={f.condition} onChange={(v) => set("condition", v)} options={CONDITIONS.map((o) => ({ value: o, label: o }))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-furnishing">Furnishing</FieldLabel>
                  <Dropdown id="ap-furnishing" placeholder="Select furnishing" value={f.furnishing} onChange={(v) => set("furnishing", v)} options={FURNISHING.map((o) => ({ value: o, label: o }))} />
                </div>
              </div>
            </div>
            <div className="ap-sect">
              <SubHead title="Amenities" desc="Select all amenities available for this property." />
              <AmenityGrid value={f.amenities} onChange={(v) => set("amenities", v)} />
              <div className="ap-field">
                <FieldLabel optional>Custom amenities</FieldLabel>
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
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(4)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Ownership &amp; assignment</h2>
            <p className="ap-card__desc">Add the property owner information and assign the property to an agent.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-owner-name">Owner full name</FieldLabel>
                  <Input id="ap-owner-name" size="lg" iconLeading="user" placeholder="e.g. Hêmin Abdullah" value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-owner-phone">Phone number</FieldLabel>
                  <Input id="ap-owner-phone" size="lg" type="tel" iconLeading="phone" placeholder="+964 750 000 0000" value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-owner-email">Email address</FieldLabel>
                  <Input id="ap-owner-email" size="lg" type="email" iconLeading="mail" placeholder="owner@email.com" value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-agent">Assigned agent</FieldLabel>
                  {(() => {
                    const sel = AGENTS.find((a) => a.id === f.agent);
                    return sel ? <AgentSummary agent={sel} onClear={() => set("agent", "")} /> : <AgentSelect id="ap-agent" value={f.agent} onChange={(v) => set("agent", v)} />;
                  })()}
                </div>
              </div>
            </div>
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-notes" optional>
                    Internal notes
                  </FieldLabel>
                  <Textarea id="ap-notes" rows={4} placeholder="Pricing flexibility, owner availability, key handover details…" value={f.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
                  <span className="ap-staffnote">
                    <Icon name="lock" size={14} />
                    Visible only to staff and administrators. Not displayed on the public website.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(3)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(5)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Review &amp; publish</h2>
            <p className="ap-card__desc">Review all property information before saving the listing.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-rev">
              <ReviewSection icon="home" title="Property details" onEdit={() => goTo(0)}>
                <div className="ap-rev__grid">
                  <RevItem k="Listing title" v={rev.title} full />
                  <RevItem k="Property type" v={rev.type} />
                  <RevItem k="Listing type" v={rev.listing} />
                  <RevItem k="Price" v={rev.price} price tnum />
                  <RevItem k="Area size" v={rev.area} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="map-pin" title="Location" onEdit={() => goTo(1)}>
                <div className="ap-rev__grid">
                  <RevItem k="City" v={rev.city} />
                  <RevItem k="Area / district" v={rev.district} />
                  <RevItem k="Street address" v={rev.street} full />
                  <RevItem k="Building number" v={rev.building} />
                  <RevItem k="Coordinates" v={rev.lat + ", " + rev.lng} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="image" title="Media" onEdit={() => goTo(2)}>
                <div className="ap-rev__media">
                  <div className="ap-rev__thumbs">
                    {GALLERY_IMGS.slice(0, 4).map((g, i) => (
                      <span className={"ap-rev__thumb" + (i === 0 ? " ap-rev__thumb--cover" : "")} key={g.id}>
                        <img src={g.url} alt="" />
                        {i === 0 && (
                          <span className="ap-rev__thumb-tag">
                            <Icon name="star" size={9} strokeWidth={2.5} />
                            Cover
                          </span>
                        )}
                      </span>
                    ))}
                    <span className="ap-rev__more">+8</span>
                  </div>
                  <div className="ap-rev__stats">
                    <span className="ap-rev__stat">
                      <Icon name="image" size={16} />
                      <b>12</b> photos uploaded
                    </span>
                    <span className="ap-rev__stat">
                      <Icon name="video" size={16} />
                      <b>1</b> video uploaded
                    </span>
                    <span className="ap-rev__stat">
                      <Icon name="star" size={16} />
                      Cover photo selected
                    </span>
                  </div>
                </div>
              </ReviewSection>
              <ReviewSection icon="ruler" title="Property features" onEdit={() => goTo(3)}>
                <div className="ap-rev__grid">
                  <RevItem k="Bedrooms" v={f.beds} tnum />
                  <RevItem k="Bathrooms" v={f.baths} tnum />
                  <RevItem k="Parking spaces" v={f.parking} tnum />
                  <RevItem k="Levels / floors" v={f.floors} tnum />
                  <RevItem k="Year built" v={rev.year} tnum />
                  <RevItem k="Orientation" v={rev.orientation} />
                  <RevItem k="Condition" v={f.condition} />
                  <RevItem k="Furnishing" v={f.furnishing} />
                </div>
              </ReviewSection>
              <ReviewSection icon="sparkles" title="Amenities" onEdit={() => goTo(3)}>
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
              <ReviewSection icon="user-round" title="Ownership & assignment" onEdit={() => goTo(4)}>
                <div className="ap-rev__grid">
                  <RevItem k="Owner" v={rev.ownerName} />
                  <RevItem k="Owner phone" v={rev.ownerPhone} tnum />
                  <RevItem k="Owner email" v={rev.ownerEmail} full />
                  <div className="ap-rev__item ap-rev__item--full">
                    <span className="ap-rev__k">Assigned agent</span>
                    <span className="ap-rev__agent">
                      <Avatar src={revAgent.avatar} name={revAgent.name} size="xs" verified />
                      <span className="ap-rev__agent-name">
                        {revAgent.name}
                        <Badge variant="brand" size="sm" icon="badge-check">
                          Verified
                        </Badge>
                      </span>
                    </span>
                  </div>
                </div>
              </ReviewSection>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(4)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="tertiary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconLeading="check" onClick={onUpdate}>
                Update property
              </Button>
            </div>
          </div>
        </section>
      )}

      <Modal
        open={!!pendingNav}
        onClose={() => setPendingNav(null)}
        icon="triangle-alert"
        className="ep-warn-modal"
        title="Discard changes?"
        subtitle="This property has unsaved edits."
        size="sm"
        footer={
          <>
            <Button hierarchy="secondary" size="md" onClick={() => setPendingNav(null)}>
              Cancel
            </Button>
            <Button
              hierarchy="primary"
              size="md"
              onClick={() => {
                setPristine(JSON.stringify(f));
                savedRef.current = true;
                const h = pendingNav;
                setPendingNav(null);
                if (h) router.push(h);
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        If you leave now, the changes you made to this listing won&apos;t be saved.
      </Modal>
    </div>
  );
}
