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
import { useLang } from "@/lib/i18n";
import { fmtCurrency, fmtNum, localizeDigits, valueKey } from "@/lib/fmt";
import {
  AMENITIES,
  CONDITIONS,
  FURNISHING,
  GALLERY_IMGS,
  INITIAL,
  ORIENTATIONS,
  PROPERTY_TYPES,
  type ApForm,
} from "./data";
import { useProperties } from "../_shared/properties-store";
import {
  AgentSelect,
  AgentSummary,
  useAssignableAgents,
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
  usePhotoUploader,
} from "../_add-property/add-property-app";

export function EditPropertyApp({ id, lockedAgentId }: { id: string; lockedAgentId?: string }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const [f, setF] = useState<ApForm>(INITIAL);
  const set = <K extends keyof ApForm>(k: K, v: ApForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const [step, setStep] = useState(0);
  const photos = usePhotoUploader(true);
  const { locationTree } = useProperties();
  const assignableAgents = useAssignableAgents();
  const cityOptions = locationTree.map((c) => c.name);
  const cityNode = locationTree.find((c) => c.name === f.city);
  const districtSource = cityNode ? cityNode.children : locationTree.flatMap((c) => c.children);
  const districtOptions = districtSource.map((d) => d.name);
  const districtNode = districtSource.find((d) => d.name === f.district);
  const projectOptions = districtNode ? districtNode.children.map((p) => p.name) : [];
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

  const priceStr = fmtCurrency(lang, Number(f.price) || 450000, f.currency);
  const areaStr = fmtNum(lang, Number(f.area) || 420) + " " + (f.areaUnit === "sqm" ? t("unit.sqm") : f.areaUnit);
  const rev = {
    listing: t(f.listing === "rent" ? "admin.pd.forRent" : "admin.pd.forSale"),
    type: tOr(valueKey("type", f.type || "Villa"), f.type || "Villa"),
    title: f.title || "Olive Grove Estate",
    price: priceStr,
    area: areaStr,
    city: tOr(`city.${f.city || "Erbil"}`, f.city || "Erbil"),
    district: tOr(`loc.${f.district || "Ankawa"}`, f.district || "Ankawa"),
    project: tOr(`loc.${f.project}`, f.project),
    street: f.street || "60 Meter Street, Block 4",
    building: f.building || "Villa 128",
    lat: localizeDigits(lang, f.lat || "36.19085"),
    lng: localizeDigits(lang, f.lng || "44.00947"),
    year: localizeDigits(lang, f.year || "2022"),
    orientation: tOr(valueKey("admin.ap.orient", f.orientation || "South facing"), f.orientation || "South facing"),
    ownerName: f.ownerName || "Hêmin Abdullah",
    ownerPhone: localizeDigits(lang, f.ownerPhone || "+964 750 412 8890"),
    ownerEmail: f.ownerEmail || "hemin@email.com",
  };
  const revAgent = assignableAgents.find((a) => a.id === f.agent) || assignableAgents[0];
  const AMEN_IC: Record<string, IconName> = Object.fromEntries(AMENITIES.map((a) => [a.label, a.icon]));

  return (
    <div className="ap-wrap">
      <nav className="ap-crumbs" aria-label={t("admin.common.breadcrumb")}>
        <Link
          href="/admin/properties"
          onClick={(e) => {
            e.preventDefault();
            guardedNav("/admin/properties");
          }}
        >
          <Icon name="building-2" size={14} />
          {t("admin.nav.properties")}
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
          {t("admin.props.editProperty")}
        </span>
      </nav>

      <div className="ap-title">
        <h1>{t("admin.props.editProperty")}</h1>
        <p>{t("admin.ep.sub")}</p>
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
                <Textarea id="ap-desc" rows={5} placeholder={t("admin.ep.descPh")} value={f.description} onChange={(e) => set("description", e.target.value)} />
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
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => guardedNav("/admin/properties")}>
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
                <Textarea id="ap-locnotes" rows={4} placeholder={t("admin.ep.landmarksPh")} value={f.locNotes} onChange={(e) => set("locNotes", e.target.value)} />
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
            <p className="ap-card__desc">Upload property photos, videos, and visual assets for the listing.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>{t("admin.pd.coverImage")}</FieldLabel>
                <CoverImage cover={photos.cover} onPick={photos.addAsCover} onRemove={() => photos.cover && photos.removePhoto(photos.cover.id)} />
                <span className="ap-hint">The cover photo headlines the listing across search results and the property page. Set any gallery image as the cover with its star.</span>
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
                  {lockedAgentId && <p className="ap-lockhint">You are the assigned agent for this listing.</p>}
                </div>
              </div>
            </div>
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-notes" optional>
                    {t("admin.pd.notes")}
                  </FieldLabel>
                  <Textarea id="ap-notes" rows={4} placeholder={t("admin.ep.notesPh")} value={f.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
                  <span className="ap-staffnote">
                    <Icon name="lock" size={14} />
                    {t("admin.ap.notesHint")}
                  </span>
                </div>
              </div>
            </div>
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
            <h2 className="ap-card__title">Review &amp; publish</h2>
            <p className="ap-card__desc">Review all property information before saving the listing.</p>
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
                  <RevItem k={t("admin.ap.coordinates")} v={rev.lat + ", " + rev.lng} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="image" title={t("admin.ap.step.media")} onEdit={() => goTo(2)}>
                <div className="ap-rev__media">
                  <div className="ap-rev__thumbs">
                    {GALLERY_IMGS.slice(0, 4).map((g, i) => (
                      <span className={"ap-rev__thumb" + (i === 0 ? " ap-rev__thumb--cover" : "")} key={g.id}>
                        <img src={g.url} alt="" />
                        {i === 0 && (
                          <span className="ap-rev__thumb-tag">
                            <Icon name="star" size={9} strokeWidth={2.5} />
                            {t("admin.ap.cover")}
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
                      {t("admin.ap.coverSelected")}
                    </span>
                  </div>
                </div>
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
                    <span className="ap-rev__agent">
                      <Avatar src={revAgent.avatar || undefined} name={revAgent.name} size="xs" verified />
                      <span className="ap-rev__agent-name">
                        {revAgent.name}
                        <Badge variant="brand" size="sm" icon="badge-check">
                          {t("status.verified")}
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
              {t("admin.ap.prev")}
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                {t("admin.ap.saveDraft")}
              </Button>
              <Button hierarchy="primary" size="lg" iconLeading="check" onClick={onUpdate}>
                {t("admin.ep.updateProperty")}
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
        title={t("admin.ep.discardTitle")}
        subtitle={t("admin.ep.unsaved")}
        size="sm"
        footer={
          <>
            <Button hierarchy="secondary" size="md" onClick={() => setPendingNav(null)}>
              {t("admin.common.cancel")}
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
              {t("admin.ap.saveChanges")}
            </Button>
          </>
        }
      >
        If you leave now, the changes you made to this listing won&apos;t be saved.
      </Modal>
    </div>
  );
}
