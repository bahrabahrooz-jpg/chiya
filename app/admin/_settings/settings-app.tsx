"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch, Checkbox } from "@/components/ui/choice";
import { Badge, Tag } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { AdminSelect } from "../_shared/filter-controls";
import { logAudit } from "../_shared/audit-log";
import { useLang, type Lang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { fmtDate } from "@/lib/fmt";
import {
  usePlatformSettings,
  storedKeyCount,
  type PlatformSettings,
  type StaffMember,
  type StaffRole,
  type NotifChannel,
  type CurrencyCode,
} from "@/lib/platform-settings";
import {
  SETTINGS_GROUPS,
  SECTION_HEADS,
  CURRENCY_OPTIONS,
  AREA_UNIT_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  THEME_OPTIONS,
  SLOT_OPTIONS,
  NEW_LISTING_OPTIONS,
  REVIEW_POLICY_OPTIONS,
  TILE_PROVIDER_OPTIONS,
  STORAGE_OPTIONS,
  ROLE_OPTIONS,
  DENSITY_OPTIONS,
  LANDING_OPTIONS,
  WEEKDAYS,
  NOTIF_CHANNELS,
  NOTIF_EVENT_ROWS,
  LANG_LABEL,
  PASSWORD_RULES,
  computeSlots,
  type SettingsSectionId,
} from "./data";

/* ----------------------------------------------------------------------------
   Settings hub — the platform's admin configuration screen (/admin/settings).
   Grouped left section-nav + right detail pane. It borrows the pf-card /
   pf-toast chrome from profile.css and the st- master-detail layout from
   settings.css, and adds its own sx- namespace for the patterns those don't
   cover (grouped nav, chip inputs, toggle grids, the notification matrix, the
   staff table, etc.).

   Each editable section keeps a local draft and commits the whole settings
   object on Save (persisted via usePlatformSettings, + logAudit + toast). The
   theme/language selectors in Branding and Preferences also apply live through
   lib/theme and lib/i18n.
   ------------------------------------------------------------------------- */

type CommitFn = (patch: Partial<PlatformSettings>, actionKey: string) => void;

/** A single labelled field row inside a card (reuses settings.css st-field). */
function Field({ label, hint, children, full }: { label: string; hint?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"st-field" + (full ? " st-field--full" : "")}>
      <span className="st-field__label">{label}</span>
      {children}
      {hint ? <span className="sx-hint">{hint}</span> : null}
    </label>
  );
}

/** Card shell used by every section (reuses profile.css pf-card). */
function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="pf-card">
      <div className="pf-card__head">
        <div>
          <h3 className="pf-card__title">{title}</h3>
          {desc ? <p className="pf-card__desc">{desc}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Sticky Save/Cancel bar (reuses settings.css st-savebar). */
function SaveBar({ dirty, onCancel, onSave }: { dirty: boolean; onCancel: () => void; onSave: () => void }) {
  const { t } = useLang();
  return (
    <div className={"st-savebar" + (dirty ? " is-dirty" : "")}>
      <span className="st-savebar__note">{dirty ? t("admin.settings.unsaved") : t("admin.settings.allSaved")}</span>
      <div className="st-savebar__actions">
        <Button hierarchy="secondary" onClick={onCancel} disabled={!dirty}>
          {t("admin.topbar.cancel")}
        </Button>
        <Button hierarchy="primary" iconLeading="check" onClick={onSave} disabled={!dirty}>
          {t("admin.settings.save")}
        </Button>
      </div>
    </div>
  );
}

/** A single switch row with label + description (reuses st-switchrow). */
function SwitchRow({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="st-switchrow">
      <div className="st-switchrow__text">
        <span className="st-switchrow__label">{label}</span>
        {desc ? <span className="st-switchrow__desc">{desc}</span> : null}
      </div>
      <Switch checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

/** Info banner. */
function Note({ icon = "info", children }: { icon?: string; children: React.ReactNode }) {
  return (
    <p className="sx-note">
      <Icon name={icon as never} size={16} />
      <span>{children}</span>
    </p>
  );
}

/** Removable-chip vocabulary editor: chips + an "Add" text field. */
function ChipEditor({
  label,
  placeholder,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  const add = () => {
    const v = text.trim();
    if (!v || values.includes(v)) {
      setText("");
      return;
    }
    onChange([...values, v]);
    setText("");
  };
  return (
    <div className="sx-vocab">
      <span className="st-field__label">{label}</span>
      <div className="sx-chips">
        {values.map((v) => (
          <Tag key={v} onRemove={() => onChange(values.filter((x) => x !== v))}>
            {v}
          </Tag>
        ))}
      </div>
      <div className="sx-chipadd">
        <Input
          value={text}
          placeholder={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button hierarchy="secondary" iconLeading="plus" onClick={add}>
          {t("admin.psettings.addBtn")}
        </Button>
      </div>
    </div>
  );
}

/* --------------------------------- General -------------------------------- */

function GeneralSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.general);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.general), [draft, settings.general]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <Card title={t("admin.psettings.general.identity")} desc={t("admin.psettings.general.identityDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.general.platformName")}>
            <Input value={draft.platformName} onChange={(e) => set("platformName", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.general.tagline")}>
            <Input value={draft.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.general.contact")} desc={t("admin.psettings.general.contactDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.general.contactEmail")}>
            <Input type="email" value={draft.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.general.contactPhone")}>
            <Input value={draft.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.general.officeAddress")} full>
            <Input value={draft.officeAddress} onChange={(e) => set("officeAddress", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.general.social")} desc={t("admin.psettings.general.socialDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.general.facebook")}>
            <Input value={draft.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.general.instagram")}>
            <Input value={draft.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.general.linkedin")}>
            <Input value={draft.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.general.regional")} desc={t("admin.psettings.general.regionalDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.general.defaultCurrency")} hint={t("admin.psettings.general.currencyHint")}>
            <AdminSelect
              value={draft.defaultCurrency}
              onChange={(v) => set("defaultCurrency", (v || "USD") as CurrencyCode)}
              placeholder={t("admin.psettings.general.defaultCurrency")}
              ariaLabel={t("admin.psettings.general.defaultCurrency")}
              options={CURRENCY_OPTIONS.map((c) => ({ value: c.value, label: `${t(c.nameKey)} (${c.symbol})` }))}
            />
          </Field>
          <Field label={t("admin.psettings.general.areaUnit")}>
            <AdminSelect
              value={draft.areaUnit}
              onChange={(v) => set("areaUnit", (v || "sqm") as typeof draft.areaUnit)}
              placeholder={t("admin.psettings.general.areaUnit")}
              ariaLabel={t("admin.psettings.general.areaUnit")}
              options={AREA_UNIT_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.general.timezone")}>
            <AdminSelect
              value={draft.timezone}
              onChange={(v) => set("timezone", v || "Asia/Baghdad")}
              placeholder={t("admin.psettings.general.timezone")}
              ariaLabel={t("admin.psettings.general.timezone")}
              options={TIMEZONE_OPTIONS}
            />
          </Field>
          <Field label={t("admin.psettings.general.dateFormat")}>
            <AdminSelect
              value={draft.dateFormat}
              onChange={(v) => set("dateFormat", v || "MMM d, yyyy")}
              placeholder={t("admin.psettings.general.dateFormat")}
              ariaLabel={t("admin.psettings.general.dateFormat")}
              options={DATE_FORMAT_OPTIONS}
            />
          </Field>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.general)}
        onSave={() => onSave({ general: draft }, "audit.action.updatedPlatformGeneral")}
      />
    </>
  );
}

/* ------------------------------- Branding --------------------------------- */

function BrandingSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.branding);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.branding), [draft, settings.branding]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <Card title={t("admin.psettings.branding.logos")} desc={t("admin.psettings.branding.logosDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.branding.logoLight")} hint={t("admin.psettings.branding.logoLightHint")}>
            <Input placeholder="https://…" value={draft.logoLightUrl} onChange={(e) => set("logoLightUrl", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.branding.logoDark")} hint={t("admin.psettings.branding.logoDarkHint")}>
            <Input placeholder="https://…" value={draft.logoDarkUrl} onChange={(e) => set("logoDarkUrl", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.branding.brandColour")} desc={t("admin.psettings.branding.brandColourDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.branding.primaryColour")}>
            <div className="sx-color">
              <input
                type="color"
                className="sx-color__swatch"
                aria-label={t("admin.psettings.branding.primaryColour")}
                value={draft.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
              />
              <Input
                className="sx-color__hex"
                value={draft.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
              />
            </div>
          </Field>
          <Field label={t("admin.psettings.branding.defaultTheme")} hint={t("admin.psettings.branding.defaultThemeHint")}>
            <AdminSelect
              value={draft.defaultTheme}
              onChange={(v) => set("defaultTheme", (v || "system") as typeof draft.defaultTheme)}
              placeholder={t("admin.psettings.branding.defaultTheme")}
              ariaLabel={t("admin.psettings.branding.defaultTheme")}
              options={THEME_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
        </div>
        <Note>{t("admin.psettings.branding.storedLocally")}</Note>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.branding)}
        onSave={() => onSave({ branding: draft }, "audit.action.updatedBranding")}
      />
    </>
  );
}

/* ------------------------------- Listings --------------------------------- */

function ListingsSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.listings);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.listings), [draft, settings.listings]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const enabledAmenities = draft.amenities.filter((a) => a.enabled).length;
  const toggleAmenity = (key: string) =>
    set(
      "amenities",
      draft.amenities.map((a) => (a.key === key ? { ...a, enabled: !a.enabled } : a)),
    );
  const toggleCurrency = (code: CurrencyCode) =>
    set(
      "currencies",
      draft.currencies.map((c) => (c.code === code ? { ...c, enabled: !c.enabled } : c)),
    );

  return (
    <>
      <Card title={t("admin.psettings.listings.vocab")} desc={t("admin.psettings.listings.vocabDesc")}>
        <div className="sx-vocablist">
          <ChipEditor
            label={t("admin.psettings.listings.propertyTypes")}
            placeholder={t("admin.psettings.listings.addPropertyType")}
            values={draft.propertyTypes}
            onChange={(v) => set("propertyTypes", v)}
          />
          <ChipEditor
            label={t("admin.psettings.listings.conditions")}
            placeholder={t("admin.psettings.listings.addCondition")}
            values={draft.conditions}
            onChange={(v) => set("conditions", v)}
          />
          <ChipEditor
            label={t("admin.psettings.listings.furnishing")}
            placeholder={t("admin.psettings.listings.addFurnishing")}
            values={draft.furnishing}
            onChange={(v) => set("furnishing", v)}
          />
          <ChipEditor
            label={t("admin.psettings.listings.orientations")}
            placeholder={t("admin.psettings.listings.addOrientation")}
            values={draft.orientations}
            onChange={(v) => set("orientations", v)}
          />
        </div>
        <Note icon="languages">{t("admin.psettings.listings.customNote")}</Note>
      </Card>

      <Card title={t("admin.psettings.listings.amenities")} desc={t("admin.psettings.listings.amenitiesDesc")}>
        <span className="st-field__label">{t("admin.psettings.listings.offeredAmenities")}</span>
        <p className="sx-togglegrid__count">
          {t("admin.psettings.listings.enabledCount", { n: enabledAmenities, total: draft.amenities.length })}
        </p>
        <div className="sx-togglegrid">
          {draft.amenities.map((a) => (
            <button
              key={a.key}
              type="button"
              className={"sx-togglechip" + (a.enabled ? " is-on" : "")}
              aria-pressed={a.enabled}
              onClick={() => toggleAmenity(a.key)}
            >
              {a.enabled ? <Icon name="check" size={15} /> : null}
              {t(`admin.psettings.amenity.${a.key}`)}
            </button>
          ))}
        </div>
        <Note icon="smartphone">{t("admin.psettings.listings.mobileNote")}</Note>
      </Card>

      <Card title={t("admin.psettings.listings.currencies")} desc={t("admin.psettings.listings.currenciesDesc")}>
        <span className="st-field__label">{t("admin.psettings.listings.enabledCurrencies")}</span>
        <div className="sx-togglegrid">
          {draft.currencies.map((c) => (
            <button
              key={c.code}
              type="button"
              className={"sx-togglechip" + (c.enabled ? " is-on" : "")}
              aria-pressed={c.enabled}
              onClick={() => toggleCurrency(c.code)}
            >
              {c.enabled ? <Icon name="check" size={15} /> : null}
              {c.code}
            </button>
          ))}
        </div>
      </Card>

      <Card title={t("admin.psettings.listings.publishing")} desc={t("admin.psettings.listings.publishingDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.listings.newListings")} hint={t("admin.psettings.listings.newListingsHint")}>
            <AdminSelect
              value={draft.newListingStatus}
              onChange={(v) => set("newListingStatus", (v || "pending") as typeof draft.newListingStatus)}
              placeholder={t("admin.psettings.listings.newListings")}
              ariaLabel={t("admin.psettings.listings.newListings")}
              options={NEW_LISTING_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.listings.expiry")} hint={t("admin.psettings.listings.expiryHint")}>
            <Input
              type="number"
              min={0}
              value={String(draft.expiryDays)}
              onChange={(e) => set("expiryDays", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("admin.psettings.listings.maxGallery")}>
            <Input
              type="number"
              min={1}
              value={String(draft.maxGalleryImages)}
              onChange={(e) => set("maxGalleryImages", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("admin.psettings.listings.featuredSlots")} hint={t("admin.psettings.listings.featuredSlotsHint")}>
            <Input
              type="number"
              min={0}
              value={String(draft.featuredSlots)}
              onChange={(e) => set("featuredSlots", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.listings)}
        onSave={() => onSave({ listings: draft }, "audit.action.updatedListings")}
      />
    </>
  );
}

/* ------------------------------- Viewings --------------------------------- */

function ViewingsSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.viewings);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.viewings), [draft, settings.viewings]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const slots = useMemo(
    () => computeSlots(draft.opensAt, draft.closesAt, draft.slotMinutes, draft.breaks),
    [draft.opensAt, draft.closesAt, draft.slotMinutes, draft.breaks],
  );

  const toggleDay = (id: (typeof WEEKDAYS)[number]["id"]) =>
    set("workingDays", draft.workingDays.includes(id) ? draft.workingDays.filter((d) => d !== id) : [...draft.workingDays, id]);

  return (
    <>
      <Card title={t("admin.psettings.viewings.hours")} desc={t("admin.psettings.viewings.hoursDesc")}>
        <span className="st-field__label">{t("admin.psettings.viewings.workingDays")}</span>
        <p className="sx-hint">{t("admin.psettings.viewings.workingDaysHint")}</p>
        <div className="sx-togglegrid sx-togglegrid--days">
          {WEEKDAYS.map((d) => {
            const on = draft.workingDays.includes(d.id);
            return (
              <button
                key={d.id}
                type="button"
                className={"sx-togglechip" + (on ? " is-on" : "")}
                aria-pressed={on}
                onClick={() => toggleDay(d.id)}
              >
                {on ? <Icon name="check" size={15} /> : null}
                {t(d.labelKey)}
              </button>
            );
          })}
        </div>

        <div className="st-grid sx-mt">
          <Field label={t("admin.psettings.viewings.opensAt")}>
            <Input type="time" value={draft.opensAt} onChange={(e) => set("opensAt", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.viewings.closesAt")}>
            <Input type="time" value={draft.closesAt} onChange={(e) => set("closesAt", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.viewings.slotLength")}>
            <AdminSelect
              value={String(draft.slotMinutes)}
              onChange={(v) => set("slotMinutes", Number(v) || 60)}
              placeholder={t("admin.psettings.viewings.slotLength")}
              ariaLabel={t("admin.psettings.viewings.slotLength")}
              options={SLOT_OPTIONS.map((o) => ({ value: String(o.value), label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.viewings.breaks")} hint={t("admin.psettings.viewings.breaksHint")}>
            <Input value={draft.breaks} onChange={(e) => set("breaks", e.target.value)} />
          </Field>
        </div>

        <div className="sx-mt">
          <span className="st-field__label">{t("admin.psettings.viewings.bookable", { n: slots.length })}</span>
          <div className="sx-timechips">
            {slots.length === 0 ? (
              <span className="sx-hint">{t("admin.psettings.viewings.noSlots")}</span>
            ) : (
              slots.map((s) => (
                <span key={s} className="sx-timechip">
                  {s}
                </span>
              ))
            )}
          </div>
        </div>
      </Card>

      <Card title={t("admin.psettings.viewings.bookingRules")} desc={t("admin.psettings.viewings.bookingRulesDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.viewings.bookAhead")} hint={t("admin.psettings.viewings.bookAheadHint")}>
            <Input
              type="number"
              min={0}
              value={String(draft.bookAheadDays)}
              onChange={(e) => set("bookAheadDays", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("admin.psettings.viewings.cancelWindow")} hint={t("admin.psettings.viewings.cancelWindowHint")}>
            <Input
              type="number"
              min={0}
              value={String(draft.cancellationHours)}
              onChange={(e) => set("cancellationHours", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
        <div className="sx-mt">
          <SwitchRow
            label={t("admin.psettings.viewings.autoConfirm")}
            desc={t("admin.psettings.viewings.autoConfirmDesc")}
            checked={draft.autoConfirm}
            onChange={(v) => set("autoConfirm", v)}
          />
        </div>
        <Note icon="history">{t("admin.psettings.viewings.keepTimeNote")}</Note>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.viewings)}
        onSave={() => onSave({ viewings: draft }, "audit.action.updatedViewings")}
      />
    </>
  );
}

/* -------------------------------- Members --------------------------------- */

function MembersSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.members);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.members), [draft, settings.members]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <Card title={t("admin.psettings.members.registration")} desc={t("admin.psettings.members.registrationDesc")}>
        <div className="st-switchlist">
          <SwitchRow
            label={t("admin.psettings.members.selfReg")}
            desc={t("admin.psettings.members.selfRegDesc")}
            checked={draft.allowSelfRegistration}
            onChange={(v) => set("allowSelfRegistration", v)}
          />
          <SwitchRow
            label={t("admin.psettings.members.emailVerify")}
            desc={t("admin.psettings.members.emailVerifyDesc")}
            checked={draft.requireEmailVerification}
            onChange={(v) => set("requireEmailVerification", v)}
          />
          <SwitchRow
            label={t("admin.psettings.members.phoneVerify")}
            desc={t("admin.psettings.members.phoneVerifyDesc")}
            checked={draft.requirePhoneVerification}
            onChange={(v) => set("requirePhoneVerification", v)}
          />
        </div>
      </Card>

      <Card title={t("admin.psettings.members.agentVerify")} desc={t("admin.psettings.members.agentVerifyDesc")}>
        <div className="st-switchlist">
          <SwitchRow
            label={t("admin.psettings.members.idDoc")}
            desc={t("admin.psettings.members.idDocDesc")}
            checked={draft.agentRequireIdDoc}
            onChange={(v) => set("agentRequireIdDoc", v)}
          />
          <SwitchRow
            label={t("admin.psettings.members.licence")}
            desc={t("admin.psettings.members.licenceDesc")}
            checked={draft.agentRequireLicence}
            onChange={(v) => set("agentRequireLicence", v)}
          />
        </div>
      </Card>

      <Card title={t("admin.psettings.members.reviews")} desc={t("admin.psettings.members.reviewsDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.members.newReviews")} hint={t("admin.psettings.members.newReviewsHint")}>
            <AdminSelect
              value={draft.newReviewPolicy}
              onChange={(v) => set("newReviewPolicy", (v || "manual") as typeof draft.newReviewPolicy)}
              placeholder={t("admin.psettings.members.newReviews")}
              ariaLabel={t("admin.psettings.members.newReviews")}
              options={REVIEW_POLICY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.members.minLength")} hint={t("admin.psettings.members.minLengthHint")}>
            <Input
              type="number"
              min={0}
              value={String(draft.reviewMinLength)}
              onChange={(e) => set("reviewMinLength", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.members)}
        onSave={() => onSave({ members: draft }, "audit.action.updatedMembers")}
      />
    </>
  );
}

/* ----------------------------- Notifications ------------------------------ */

function NotificationsSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.notifications);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.notifications),
    [draft, settings.notifications],
  );

  const toggleCell = (event: string, channel: NotifChannel) =>
    setDraft((d) => ({
      ...d,
      matrix: {
        ...d.matrix,
        [event]: { ...d.matrix[event], [channel]: !d.matrix[event]?.[channel] },
      },
    }));

  return (
    <>
      <Card title={t("admin.psettings.notif.matrix")} desc={t("admin.psettings.notif.matrixDesc")}>
        <div className="sx-matrix-wrap">
          <table className="sx-matrix">
            <thead>
              <tr>
                <th className="sx-matrix__event">{t("admin.psettings.notif.event")}</th>
                {NOTIF_CHANNELS.map((c) => (
                  <th key={c.id} className="sx-matrix__ch">
                    {t(c.labelKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTIF_EVENT_ROWS.map((row) => (
                <tr key={row.id} className="sx-matrix__row">
                  <td className="sx-matrix__event">{t(row.labelKey)}</td>
                  {NOTIF_CHANNELS.map((c) => (
                    <td key={c.id} className="sx-matrix__cell">
                      <Checkbox
                        checked={!!draft.matrix[row.id]?.[c.id]}
                        aria-label={`${t(row.labelKey)} — ${t(c.labelKey)}`}
                        onChange={() => toggleCell(row.id, c.id)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t("admin.psettings.notif.sender")} desc={t("admin.psettings.notif.senderDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.notif.senderName")}>
            <Input value={draft.senderName} onChange={(e) => setDraft((d) => ({ ...d, senderName: e.target.value }))} />
          </Field>
          <Field label={t("admin.psettings.notif.replyTo")}>
            <Input type="email" value={draft.replyTo} onChange={(e) => setDraft((d) => ({ ...d, replyTo: e.target.value }))} />
          </Field>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.notifications)}
        onSave={() => onSave({ notifications: draft }, "audit.action.updatedNotifMatrix")}
      />
    </>
  );
}

/* ----------------------------- Localization ------------------------------- */

function LocalizationSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.localization);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.localization),
    [draft, settings.localization],
  );

  const toggleLang = (code: string) =>
    setDraft((d) => ({
      ...d,
      languages: d.languages.map((l) => (l.code === code && code !== "en" ? { ...l, enabled: !l.enabled } : l)),
    }));

  return (
    <>
      <Card title={t("admin.psettings.localization.languages")} desc={t("admin.psettings.localization.languagesDesc")}>
        <div className="st-switchlist">
          {draft.languages.map((l) => {
            const locked = l.code === "en";
            return (
              <div key={l.code} className="sx-langrow">
                <div className="st-switchrow__text">
                  <span className="st-switchrow__label">
                    {LANG_LABEL[l.code].native} · {t(LANG_LABEL[l.code].enKey)}
                  </span>
                  <span className="sx-langrow__pct">
                    {t("admin.psettings.localization.translated", { pct: l.translatedPct })}
                  </span>
                </div>
                <Switch checked={l.enabled} disabled={locked} onChange={() => toggleLang(l.code)} />
              </div>
            );
          })}
        </div>

        <div className="sx-mt st-grid">
          <Field label={t("admin.psettings.localization.defaultLang")} hint={t("admin.psettings.localization.defaultLangHint")}>
            <AdminSelect
              value={draft.defaultLanguage}
              onChange={(v) => setDraft((d) => ({ ...d, defaultLanguage: (v || "en") as typeof d.defaultLanguage }))}
              placeholder={t("admin.psettings.localization.defaultLang")}
              ariaLabel={t("admin.psettings.localization.defaultLang")}
              options={draft.languages.map((l) => ({ value: l.code, label: t(LANG_LABEL[l.code].enKey) }))}
            />
          </Field>
        </div>
        <Note icon="triangle-alert">{t("admin.psettings.localization.machineNote")}</Note>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.localization)}
        onSave={() => onSave({ localization: draft }, "audit.action.updatedLocalization")}
      />
    </>
  );
}

/* ------------------------------ Legal & content --------------------------- */

function LegalSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.legal);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.legal), [draft, settings.legal]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <Card title={t("admin.psettings.legal.pageContent")} desc={t("admin.psettings.legal.pageContentDesc")}>
        <div className="sx-stack">
          <Field label={t("admin.psettings.legal.about")} full>
            <Textarea rows={3} value={draft.about} onChange={(e) => set("about", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.legal.terms")} full>
            <Textarea rows={3} value={draft.terms} onChange={(e) => set("terms", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.legal.privacy")} full>
            <Textarea rows={3} value={draft.privacy} onChange={(e) => set("privacy", e.target.value)} />
          </Field>
        </div>
        <Note>
          {t("admin.psettings.legal.wiringNote")}{" "}
          <a className="sx-link" href="/admin/content">
            /admin/content
          </a>
        </Note>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.legal)}
        onSave={() => onSave({ legal: draft }, "audit.action.updatedLegal")}
      />
    </>
  );
}

/* ---------------------------- Integrations & API -------------------------- */

function IntegrationsSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.integrations);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.integrations),
    [draft, settings.integrations],
  );
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <Note icon="triangle-alert">{t("admin.psettings.integrations.noBackend")}</Note>

      <Card title={t("admin.psettings.integrations.maps")} desc={t("admin.psettings.integrations.mapsDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.integrations.tileProvider")}>
            <AdminSelect
              value={draft.tileProvider}
              onChange={(v) => set("tileProvider", (v || "osm") as typeof draft.tileProvider)}
              placeholder={t("admin.psettings.integrations.tileProvider")}
              ariaLabel={t("admin.psettings.integrations.tileProvider")}
              options={TILE_PROVIDER_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field
            label={t("admin.psettings.integrations.apiKey")}
            hint={draft.tileProvider === "osm" ? t("admin.psettings.integrations.osmNoKey") : undefined}
          >
            <Input value={draft.mapsApiKey} onChange={(e) => set("mapsApiKey", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.integrations.emailSms")} desc={t("admin.psettings.integrations.emailSmsDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.integrations.smtpHost")}>
            <Input placeholder="smtp.example.com" value={draft.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.integrations.smtpPort")}>
            <Input
              type="number"
              value={String(draft.smtpPort)}
              onChange={(e) => set("smtpPort", Number(e.target.value) || 0)}
            />
          </Field>
          <Field label={t("admin.psettings.integrations.smtpUser")}>
            <Input value={draft.smtpUsername} onChange={(e) => set("smtpUsername", e.target.value)} />
          </Field>
          <Field label={t("admin.psettings.integrations.smsGateway")} hint={t("admin.psettings.integrations.smsGatewayHint")}>
            <Input value={draft.smsGateway} onChange={(e) => set("smsGateway", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.integrations.storageAnalytics")} desc={t("admin.psettings.integrations.storageAnalyticsDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.integrations.storageProvider")}>
            <AdminSelect
              value={draft.storageProvider}
              onChange={(v) => set("storageProvider", (v || "local") as typeof draft.storageProvider)}
              placeholder={t("admin.psettings.integrations.storageProvider")}
              ariaLabel={t("admin.psettings.integrations.storageProvider")}
              options={STORAGE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.integrations.analyticsId")}>
            <Input placeholder="G-XXXXXXXXXX" value={draft.analyticsId} onChange={(e) => set("analyticsId", e.target.value)} />
          </Field>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.integrations)}
        onSave={() => onSave({ integrations: draft }, "audit.action.updatedIntegrations")}
      />
    </>
  );
}

/* ---------------------------- Data & maintenance -------------------------- */

function MaintenanceSection({
  settings,
  onSave,
  onReset,
}: {
  settings: PlatformSettings;
  onSave: CommitFn;
  onReset: (alsoAppearance: boolean) => void;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.maintenance);
  const [confirmReset, setConfirmReset] = useState(false);
  const [alsoAppearance, setAlsoAppearance] = useState(false);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.maintenance),
    [draft, settings.maintenance],
  );
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const exportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chiya-platform-settings.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* noop in the demo */
    }
  };

  return (
    <>
      <Card title={t("admin.psettings.maintenance.mode")} desc={t("admin.psettings.maintenance.modeDesc")}>
        <SwitchRow
          label={t("admin.psettings.maintenance.enable")}
          desc={t("admin.psettings.maintenance.enableDesc")}
          checked={draft.maintenanceMode}
          onChange={(v) => set("maintenanceMode", v)}
        />
        <div className="sx-mt">
          <Field label={t("admin.psettings.maintenance.message")} full>
            <Textarea rows={2} value={draft.maintenanceMessage} onChange={(e) => set("maintenanceMessage", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.maintenance.retention")} desc={t("admin.psettings.maintenance.retentionDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.maintenance.retentionDays")} hint={t("admin.psettings.maintenance.retentionHint")}>
            <Input
              type="number"
              min={0}
              value={String(draft.retentionDays)}
              onChange={(e) => set("retentionDays", Number(e.target.value) || 0)}
            />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.psettings.maintenance.export")} desc={t("admin.psettings.maintenance.exportDesc")}>
        <div className="sx-cardaction">
          <Button hierarchy="secondary" iconLeading="download" onClick={exportJson}>
            {t("admin.psettings.maintenance.exportBtn")}
          </Button>
        </div>
        <Note>{t("admin.psettings.maintenance.exportNote")}</Note>
      </Card>

      <Card title={t("admin.psettings.maintenance.reset")} desc={t("admin.psettings.maintenance.resetDesc")}>
        <div className="sx-danger">
          <div className="sx-danger__text">
            <span className="sx-danger__title">
              <Icon name="triangle-alert" size={16} />
              {t("admin.psettings.maintenance.cannotUndo")}
            </span>
            <span className="sx-danger__desc">
              {t("admin.psettings.maintenance.willClear", { n: storedKeyCount() })}
            </span>
          </div>
          <Button hierarchy="destructive" iconLeading="rotate-ccw" onClick={() => setConfirmReset(true)}>
            {t("admin.psettings.maintenance.resetBtn")}
          </Button>
        </div>
        <div className="sx-mt">
          <SwitchRow
            label={t("admin.psettings.maintenance.alsoAppearance")}
            desc={t("admin.psettings.maintenance.alsoAppearanceDesc")}
            checked={alsoAppearance}
            onChange={setAlsoAppearance}
          />
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.maintenance)}
        onSave={() => onSave({ maintenance: draft }, "audit.action.updatedMaintenance")}
      />

      {confirmReset && (
        <Modal
          open
          onClose={() => setConfirmReset(false)}
          icon="rotate-ccw"
          title={t("admin.psettings.maintenance.resetConfirmTitle")}
          subtitle={t("admin.psettings.maintenance.resetConfirmBody")}
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setConfirmReset(false)}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button
                hierarchy="destructive"
                iconLeading="rotate-ccw"
                onClick={() => {
                  onReset(alsoAppearance);
                  setConfirmReset(false);
                }}
              >
                {t("admin.psettings.maintenance.resetBtn")}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

/* ------------------------------- Team & access ---------------------------- */

function TeamSection({ settings, onSave, lang }: { settings: PlatformSettings; onSave: CommitFn; lang: Lang }) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.team);
  const [invite, setInvite] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<StaffRole>("agent");
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.team), [draft, settings.team]);

  const updateStaff = (id: string, patch: Partial<StaffMember>) =>
    setDraft((d) => ({ ...d, staff: d.staff.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  const removeStaff = (id: string) => setDraft((d) => ({ ...d, staff: d.staff.filter((s) => s.id !== id) }));

  const statusVariant = (s: StaffMember["status"]) =>
    s === "active" ? "success" : s === "suspended" ? "error" : "info";

  const addInvite = () => {
    const name = inviteName.trim();
    const email = inviteEmail.trim();
    if (!name || !email) return;
    const member: StaffMember = {
      id: "u-" + Math.random().toString(36).slice(2, 9),
      name,
      email,
      role: inviteRole,
      status: "invited",
      addedAt: new Date().toISOString().slice(0, 10),
    };
    setDraft((d) => ({ ...d, staff: [...d.staff, member] }));
    setInvite(false);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("agent");
  };

  return (
    <>
      <Card title={t("admin.psettings.team.staff")} desc={t("admin.psettings.team.staffDesc")}>
        <div className="sx-cardaction sx-cardaction--top">
          <Button hierarchy="primary" iconLeading="user-plus" onClick={() => setInvite(true)}>
            {t("admin.psettings.team.invite")}
          </Button>
        </div>

        <div className="sx-table-wrap">
          <table className="sx-table">
            <thead>
              <tr>
                <th>{t("admin.psettings.team.person")}</th>
                <th>{t("admin.psettings.team.role")}</th>
                <th>{t("admin.psettings.team.status")}</th>
                <th>{t("admin.psettings.team.added")}</th>
                <th aria-label={t("admin.psettings.team.actions")} />
              </tr>
            </thead>
            <tbody>
              {draft.staff.map((s) => {
                const isOwner = s.role === "owner";
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="sx-person">
                        <Avatar size="sm" name={s.name} src={s.avatarUrl} />
                        <div className="sx-person__text">
                          <span className="sx-person__name">{s.name}</span>
                          <span className="sx-person__email">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isOwner ? (
                        <Badge variant="brand" icon="shield-check">
                          {t("admin.psettings.team.roleOwner")}
                        </Badge>
                      ) : (
                        <AdminSelect
                          value={s.role}
                          onChange={(v) => updateStaff(s.id, { role: (v || "agent") as StaffRole })}
                          placeholder={t("admin.psettings.team.role")}
                          ariaLabel={t("admin.psettings.team.role")}
                          options={ROLE_OPTIONS.filter((r) => r.value !== "owner").map((r) => ({
                            value: r.value,
                            label: t(r.labelKey),
                          }))}
                        />
                      )}
                    </td>
                    <td>
                      <Badge variant={statusVariant(s.status)} dot>
                        {t(`admin.psettings.team.status.${s.status}`)}
                      </Badge>
                    </td>
                    <td className="sx-table__muted">{fmtDate(lang, new Date(s.addedAt), "mdy")}</td>
                    <td>
                      {!isOwner && (
                        <div className="sx-rowactions">
                          <button
                            type="button"
                            className="sx-linkbtn"
                            onClick={() =>
                              updateStaff(s.id, { status: s.status === "suspended" ? "active" : "suspended" })
                            }
                          >
                            {t(s.status === "suspended" ? "admin.psettings.team.activate" : "admin.psettings.team.suspend")}
                          </button>
                          <button
                            type="button"
                            className="sx-iconbtn"
                            aria-label={t("admin.psettings.team.remove")}
                            onClick={() => removeStaff(s.id)}
                          >
                            <Icon name="trash-2" size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Note icon="key-round">
          {t("admin.psettings.team.rolesNote")}{" "}
          <a className="sx-link" href="/admin/roles">
            {t("admin.psettings.team.rolesLink")}
          </a>
        </Note>
      </Card>

      <SaveBar dirty={dirty} onCancel={() => setDraft(settings.team)} onSave={() => onSave({ team: draft }, "audit.action.updatedTeam")} />

      {invite && (
        <Modal
          open
          onClose={() => setInvite(false)}
          icon="user-plus"
          title={t("admin.psettings.team.inviteTitle")}
          subtitle={t("admin.psettings.team.inviteBody")}
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setInvite(false)}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button hierarchy="primary" iconLeading="user-plus" onClick={addInvite} disabled={!inviteName.trim() || !inviteEmail.trim()}>
                {t("admin.psettings.team.sendInvite")}
              </Button>
            </>
          }
        >
          <div className="sx-stack">
            <Field label={t("admin.psettings.team.fullName")} full>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </Field>
            <Field label={t("admin.psettings.team.email")} full>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </Field>
            <Field label={t("admin.psettings.team.role")} full>
              <AdminSelect
                value={inviteRole}
                onChange={(v) => setInviteRole((v || "agent") as StaffRole)}
                placeholder={t("admin.psettings.team.role")}
                ariaLabel={t("admin.psettings.team.role")}
                options={ROLE_OPTIONS.filter((r) => r.value !== "owner").map((r) => ({ value: r.value, label: t(r.labelKey) }))}
              />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}

/* -------------------------------- Security -------------------------------- */

function SecuritySection({
  settings,
  onSave,
  onPasswordUpdate,
}: {
  settings: PlatformSettings;
  onSave: CommitFn;
  onPasswordUpdate: () => void;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.security);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.security), [draft, settings.security]);

  // Password fields are LOCAL ONLY — never persisted (there is no backend).
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [reveal, setReveal] = useState(false);
  const rules = useMemo(() => PASSWORD_RULES.map((r) => ({ ...r, met: r.test(pw.next) })), [pw.next]);
  const canUpdate =
    pw.current.length > 0 && pw.next.length > 0 && pw.next === pw.confirm && rules.every((r) => r.met);

  return (
    <>
      <Card title={t("admin.psettings.security.password")} desc={t("admin.psettings.security.passwordDesc")}>
        <div className="sx-stack">
          <Field label={t("admin.psettings.security.current")} full>
            <Input
              type={reveal ? "text" : "password"}
              value={pw.current}
              onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
            />
          </Field>
          <div className="st-grid">
            <Field label={t("admin.psettings.security.new")}>
              <Input
                type={reveal ? "text" : "password"}
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
              />
            </Field>
            <Field label={t("admin.psettings.security.confirm")}>
              <Input
                type={reveal ? "text" : "password"}
                value={pw.confirm}
                onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              />
            </Field>
          </div>
          <ul className="sx-rules">
            {rules.map((r) => (
              <li key={r.id} className={"sx-rule" + (r.met ? " is-met" : "")}>
                <Icon name={r.met ? "circle-check" : "circle"} size={15} className="sx-rule__icon" />
                {t(r.labelKey)}
              </li>
            ))}
          </ul>
        </div>
        <div className="sx-cardaction">
          <button type="button" className="sx-linkbtn" onClick={() => setReveal((v) => !v)}>
            <Icon name={reveal ? "eye-off" : "eye"} size={16} />
            {t(reveal ? "admin.psettings.security.hide" : "admin.psettings.security.show")}
          </button>
          <Button
            hierarchy="primary"
            iconLeading="check"
            disabled={!canUpdate}
            onClick={() => {
              onPasswordUpdate();
              setPw({ current: "", next: "", confirm: "" });
            }}
          >
            {t("admin.psettings.security.updateBtn")}
          </Button>
        </div>
      </Card>

      <Card title={t("admin.psettings.security.twoFactor")} desc={t("admin.psettings.security.twoFactorDesc")}>
        <SwitchRow
          label={t("admin.psettings.security.require2fa")}
          desc={t("admin.psettings.security.require2faDesc")}
          checked={draft.twoFactorEnabled}
          onChange={(v) => setDraft((d) => ({ ...d, twoFactorEnabled: v }))}
        />
        <Note>{t("admin.psettings.security.twoFactorNote")}</Note>
      </Card>

      <Card title={t("admin.psettings.security.sessions")} desc={t("admin.psettings.security.sessionsDesc")}>
        <div className="sx-cardaction sx-cardaction--top">
          <Button
            hierarchy="secondary"
            iconLeading="log-out"
            onClick={() => setDraft((d) => ({ ...d, sessions: d.sessions.filter((s) => s.current) }))}
          >
            {t("admin.psettings.security.signOutAll")}
          </Button>
        </div>
        <div className="st-switchlist">
          {draft.sessions.map((s) => (
            <div key={s.id} className="sx-session">
              <div className="st-switchrow__text">
                <span className="st-switchrow__label">{s.device}</span>
                <span className="st-switchrow__desc">
                  {s.location} · {s.browser}
                </span>
              </div>
              {s.current ? (
                <Badge variant="success" dot>
                  {t("admin.psettings.security.current2")}
                </Badge>
              ) : (
                <button
                  type="button"
                  className="sx-linkbtn"
                  onClick={() => setDraft((d) => ({ ...d, sessions: d.sessions.filter((x) => x.id !== s.id) }))}
                >
                  {t("admin.psettings.security.signOut")}
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.security)}
        onSave={() => onSave({ security: draft }, "audit.action.updatedSecurity")}
      />
    </>
  );
}

/* ------------------------------- Preferences ------------------------------ */

function PreferencesSection({ settings, onSave }: { settings: PlatformSettings; onSave: CommitFn }) {
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();
  const [draft, setDraft] = useState(settings.preferences);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.preferences),
    [draft, settings.preferences],
  );
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  // Theme + language apply live. The stored value tracks the live engines; only
  // light/dark are live-applicable (the theme engine has no "system" state).
  const themeValue = draft.theme === "system" ? theme : draft.theme;

  return (
    <>
      <Card title={t("admin.psettings.preferences.appearance")} desc={t("admin.psettings.preferences.appearanceDesc")}>
        <div className="st-grid">
          <Field label={t("admin.psettings.preferences.theme")}>
            <AdminSelect
              value={themeValue}
              onChange={(v) => {
                const next = (v || "light") as typeof draft.theme;
                set("theme", next);
                if (next === "light" || next === "dark") setTheme(next);
              }}
              placeholder={t("admin.psettings.preferences.theme")}
              ariaLabel={t("admin.psettings.preferences.theme")}
              options={THEME_OPTIONS.filter((o) => o.value !== "system").map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.preferences.language")}>
            <AdminSelect
              value={lang}
              onChange={(v) => {
                const next = (v || "en") as typeof draft.language;
                set("language", next);
                setLang(next);
              }}
              placeholder={t("admin.psettings.preferences.language")}
              ariaLabel={t("admin.psettings.preferences.language")}
              options={(["en", "ku", "ar"] as const).map((c) => ({ value: c, label: `${LANG_LABEL[c].native} · ${t(LANG_LABEL[c].enKey)}` }))}
            />
          </Field>
          <Field label={t("admin.psettings.preferences.density")} hint={t("admin.psettings.preferences.densityHint")}>
            <AdminSelect
              value={draft.density}
              onChange={(v) => set("density", (v || "comfortable") as typeof draft.density)}
              placeholder={t("admin.psettings.preferences.density")}
              ariaLabel={t("admin.psettings.preferences.density")}
              options={DENSITY_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
          <Field label={t("admin.psettings.preferences.landing")} hint={t("admin.psettings.preferences.landingHint")}>
            <AdminSelect
              value={draft.landingPage}
              onChange={(v) => set("landingPage", (v || "dashboard") as typeof draft.landingPage)}
              placeholder={t("admin.psettings.preferences.landing")}
              ariaLabel={t("admin.psettings.preferences.landing")}
              options={LANDING_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))}
            />
          </Field>
        </div>
        <Note>{t("admin.psettings.preferences.liveNote")}</Note>
      </Card>

      <Card title={t("admin.psettings.preferences.delivery")} desc={t("admin.psettings.preferences.deliveryDesc")}>
        <div className="st-switchlist">
          <SwitchRow
            label={t("admin.psettings.preferences.weeklyEmail")}
            desc={t("admin.psettings.preferences.weeklyEmailDesc")}
            checked={draft.notifyWeeklyEmail}
            onChange={(v) => set("notifyWeeklyEmail", v)}
          />
          <SwitchRow
            label={t("admin.psettings.preferences.sound")}
            desc={t("admin.psettings.preferences.soundDesc")}
            checked={draft.notifySound}
            onChange={(v) => set("notifySound", v)}
          />
        </div>
      </Card>

      <Card title={t("admin.psettings.preferences.muted")} desc={t("admin.psettings.preferences.mutedDesc")}>
        <div className="st-switchlist">
          {NOTIF_EVENT_ROWS.map((row) => {
            const on = !draft.mutedEvents.includes(row.id);
            return (
              <SwitchRow
                key={row.id}
                label={t(row.labelKey)}
                checked={on}
                onChange={(v) =>
                  set("mutedEvents", v ? draft.mutedEvents.filter((e) => e !== row.id) : [...draft.mutedEvents, row.id])
                }
              />
            );
          })}
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.preferences)}
        onSave={() => onSave({ preferences: draft }, "audit.action.updatedPreferences")}
      />
    </>
  );
}

/* ----------------------------------- Hub ---------------------------------- */

export function SettingsApp() {
  const { t, lang, setLang } = useLang();
  const { setTheme } = useTheme();
  const { settings, save, reset } = usePlatformSettings();
  const [active, setActive] = useState<SettingsSectionId>("general");
  const [toast, setToast] = useState<string | null>(null);

  const flash = (key: string) => {
    setToast(key);
    setTimeout(() => setToast(null), 2200);
  };

  const commit: CommitFn = (patch, actionKey) => {
    save({ ...settings, ...patch });
    logAudit({ category: "settings", actionKey, target: t("admin.nav.settings") });
    flash("admin.psettings.saved");
  };

  const onReset = (alsoAppearance: boolean) => {
    reset();
    if (alsoAppearance) {
      setTheme("light");
      setLang("en");
    }
    logAudit({ category: "settings", actionKey: "audit.action.resetPlatformData", target: t("admin.nav.settings") });
    flash("admin.psettings.resetDone");
  };

  const onPasswordUpdate = () => {
    logAudit({ category: "settings", actionKey: "audit.action.updatedPassword", target: t("admin.nav.settings") });
    flash("admin.psettings.passwordUpdated");
  };

  const head = SECTION_HEADS[active];

  return (
    <>
      <div className="pf-head">
        <div className="pf-head__intro">
          <h1 className="pf-head__title">{t("admin.psettings.pageTitle")}</h1>
          <p className="pf-head__sub">{t("admin.psettings.pageSub")}</p>
        </div>
      </div>

      <div className="st-split">
        <nav className="st-nav sx-nav" aria-label={t("admin.psettings.pageTitle")}>
          {SETTINGS_GROUPS.map((g) => (
            <div className="sx-navgroup" key={g.labelKey}>
              <div className="sx-navgroup__label">{t(g.labelKey)}</div>
              {g.items.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={"st-navitem sx-navitem" + (active === s.id ? " is-active" : "")}
                  onClick={() => setActive(s.id)}
                  aria-current={active === s.id}
                >
                  <span className="st-navitem__icon">
                    <Icon name={s.icon} size={18} />
                  </span>
                  <span className="st-navitem__body">
                    <span className="st-navitem__label">{t(s.labelKey)}</span>
                  </span>
                </button>
              ))}
              {g.links?.map((l) => (
                <a key={l.href} href={l.href} className="st-navitem sx-navitem sx-navitem--external">
                  <span className="st-navitem__icon">
                    <Icon name={l.icon} size={18} />
                  </span>
                  <span className="st-navitem__body">
                    <span className="st-navitem__label">{t(l.labelKey)}</span>
                  </span>
                  <Icon name="arrow-up-right" size={15} className="sx-navitem__ext" />
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="st-detail">
          <div className="sx-sectionhead">
            <span className="sx-sectionhead__icon">
              <Icon name={head.icon} size={22} />
            </span>
            <div>
              <h2 className="sx-sectionhead__title">{t(head.titleKey)}</h2>
              <p className="sx-sectionhead__sub">{t(head.subKey)}</p>
            </div>
          </div>

          {active === "general" && <GeneralSection settings={settings} onSave={commit} />}
          {active === "branding" && <BrandingSection settings={settings} onSave={commit} />}
          {active === "listings" && <ListingsSection settings={settings} onSave={commit} />}
          {active === "viewings" && <ViewingsSection settings={settings} onSave={commit} />}
          {active === "members" && <MembersSection settings={settings} onSave={commit} />}
          {active === "notifications" && <NotificationsSection settings={settings} onSave={commit} />}
          {active === "localization" && <LocalizationSection settings={settings} onSave={commit} />}
          {active === "legal" && <LegalSection settings={settings} onSave={commit} />}
          {active === "integrations" && <IntegrationsSection settings={settings} onSave={commit} />}
          {active === "maintenance" && <MaintenanceSection settings={settings} onSave={commit} onReset={onReset} />}
          {active === "team" && <TeamSection settings={settings} onSave={commit} lang={lang} />}
          {active === "security" && <SecuritySection settings={settings} onSave={commit} onPasswordUpdate={onPasswordUpdate} />}
          {active === "preferences" && <PreferencesSection settings={settings} onSave={commit} />}
        </div>
      </div>

      {toast && (
        <div className="pf-toast" role="status">
          <Icon name="circle-check" size={18} />
          {t(toast)}
        </div>
      )}
    </>
  );
}
