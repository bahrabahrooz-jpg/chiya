"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/choice";
import { Modal } from "@/components/ui/modal";
import { AdminSelect } from "../_shared/filter-controls";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
// Endonyms — each language's name in its own script. Static, not translated.
const LANG_NATIVE: Record<Lang, string> = { en: "English", ar: "العربية", ku: "کوردی" };
import { useTheme, type Theme } from "@/lib/theme";
import { logAudit } from "../_shared/audit-log";
import { useAdminSettings, type AdminSettings } from "@/lib/admin-settings";
import {
  SETTINGS_SECTIONS,
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  DATE_FORMAT_OPTIONS,
  NOTIF_GROUPS,
  type SettingsSectionId,
} from "./data";

/* ----------------------------------------------------------------------------
   Settings hub — the platform-level configuration that has no other screen
   (organisation identity, notification preferences, demo integrations). Left
   section-nav + right detail pane, following the Roles screen's master-detail
   language (st- namespace) and the profile screen's pf-card / pf-toast chrome.

   Each section edits a local draft and commits the whole settings object on
   Save (persisted via useAdminSettings, with a logAudit entry + toast). The
   Appearance section is the exception: theme and language apply live through
   their own engines (lib/theme, lib/i18n), so it has no draft or Save bar.
   ------------------------------------------------------------------------- */

/** A single labelled field row inside a card. */
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={"st-field" + (full ? " st-field--full" : "")}>
      <span className="st-field__label">{label}</span>
      {children}
    </label>
  );
}

/** Card shell used by every section. */
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

/* --------------------------------- General -------------------------------- */

function GeneralSection({
  settings,
  onSave,
}: {
  settings: AdminSettings;
  onSave: (patch: Partial<AdminSettings>, actionKey: string) => void;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.org);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings.org), [draft, settings.org]);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <>
      <Card title={t("admin.settings.general.orgTitle")} desc={t("admin.settings.general.orgDesc")}>
        <div className="st-grid">
          <Field label={t("admin.settings.general.name")} full>
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label={t("admin.settings.general.email")}>
            <Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label={t("admin.settings.general.phone")}>
            <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
          <Field label={t("admin.settings.general.address")} full>
            <Textarea rows={2} value={draft.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </div>
      </Card>

      <Card title={t("admin.settings.general.regionTitle")} desc={t("admin.settings.general.regionDesc")}>
        <div className="st-grid">
          <Field label={t("admin.settings.general.currency")}>
            <AdminSelect
              value={draft.currency}
              onChange={(v) => set("currency", (v || "USD") as typeof draft.currency)}
              placeholder={t("admin.settings.general.currency")}
              ariaLabel={t("admin.settings.general.currency")}
              options={CURRENCY_OPTIONS.map((c) => ({ value: c.value, label: `${t(c.nameKey)} (${c.symbol})` }))}
            />
          </Field>
          <Field label={t("admin.settings.general.timezone")}>
            <AdminSelect
              value={draft.timezone}
              onChange={(v) => set("timezone", v || "Asia/Baghdad")}
              placeholder={t("admin.settings.general.timezone")}
              ariaLabel={t("admin.settings.general.timezone")}
              options={TIMEZONE_OPTIONS}
            />
          </Field>
          <Field label={t("admin.settings.general.dateFormat")}>
            <AdminSelect
              value={draft.dateFormat}
              onChange={(v) => set("dateFormat", v || "DD/MM/YYYY")}
              placeholder={t("admin.settings.general.dateFormat")}
              ariaLabel={t("admin.settings.general.dateFormat")}
              options={DATE_FORMAT_OPTIONS}
            />
          </Field>
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.org)}
        onSave={() => onSave({ org: draft }, "audit.action.updatedOrgSettings")}
      />
    </>
  );
}

/* ------------------------------- Appearance ------------------------------- */

const THEME_OPTS: { value: Theme; icon: "sun" | "moon"; labelKey: string }[] = [
  { value: "light", icon: "sun", labelKey: "admin.settings.appearance.light" },
  { value: "dark", icon: "moon", labelKey: "admin.settings.appearance.dark" },
];

function AppearanceSection() {
  const { t, lang, setLang } = useLang();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Card title={t("admin.settings.appearance.themeTitle")} desc={t("admin.settings.appearance.themeDesc")}>
        <div className="st-choicegrid" role="radiogroup" aria-label={t("admin.settings.appearance.themeTitle")}>
          {THEME_OPTS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={theme === o.value}
              className={"st-choice" + (theme === o.value ? " is-active" : "")}
              onClick={() => setTheme(o.value)}
            >
              <span className="st-choice__icon">
                <Icon name={o.icon} size={20} />
              </span>
              <span className="st-choice__label">{t(o.labelKey)}</span>
              {theme === o.value ? <Icon name="circle-check" size={18} className="st-choice__tick" /> : null}
            </button>
          ))}
        </div>
      </Card>

      <Card title={t("admin.settings.appearance.langTitle")} desc={t("admin.settings.appearance.langDesc")}>
        <div className="st-choicegrid" role="radiogroup" aria-label={t("admin.settings.appearance.langTitle")}>
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={lang === l}
              className={"st-choice" + (lang === l ? " is-active" : "")}
              onClick={() => setLang(l)}
            >
              <span className="st-choice__label">{LANG_NATIVE[l]}</span>
              <span className="st-choice__sub">{t("lang." + l)}</span>
              {lang === l ? <Icon name="circle-check" size={18} className="st-choice__tick" /> : null}
            </button>
          ))}
        </div>
      </Card>

      <p className="st-livehint">
        <Icon name="info" size={15} />
        {t("admin.settings.appearance.liveHint")}
      </p>
    </>
  );
}

/* ------------------------------ Notifications ----------------------------- */

function NotificationsSection({
  settings,
  onSave,
}: {
  settings: AdminSettings;
  onSave: (patch: Partial<AdminSettings>, actionKey: string) => void;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.notifications);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.notifications),
    [draft, settings.notifications],
  );

  return (
    <>
      {NOTIF_GROUPS.map((g) => (
        <Card key={g.titleKey} title={t(g.titleKey)}>
          <div className="st-switchlist">
            {g.rows.map((r) => (
              <div key={r.key} className="st-switchrow">
                <div className="st-switchrow__text">
                  <span className="st-switchrow__label">{t(r.labelKey)}</span>
                  <span className="st-switchrow__desc">{t(r.descKey)}</span>
                </div>
                <Switch
                  checked={draft[r.key]}
                  onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.checked }))}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.notifications)}
        onSave={() => onSave({ notifications: draft }, "audit.action.updatedNotifSettings")}
      />
    </>
  );
}

/* ------------------------------ Integrations ------------------------------ */

function randomKey() {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 16; i++) s += hex[Math.floor(Math.random() * 16)];
  return "chiya_sk_live_" + s;
}

function IntegrationsSection({
  settings,
  onSave,
}: {
  settings: AdminSettings;
  onSave: (patch: Partial<AdminSettings>, actionKey: string) => void;
}) {
  const { t } = useLang();
  const [draft, setDraft] = useState(settings.integrations);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings.integrations),
    [draft, settings.integrations],
  );

  const masked = draft.apiKey.slice(0, 14) + "•".repeat(16);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(draft.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — no-op in the demo */
    }
  };

  return (
    <>
      <div className="st-demobanner">
        <Icon name="flask-conical" size={16} />
        {t("admin.settings.integrations.demoNote")}
      </div>

      <Card title={t("admin.settings.integrations.apiTitle")} desc={t("admin.settings.integrations.apiDesc")}>
        <Field label={t("admin.settings.integrations.apiKey")} full>
          <div className="st-key">
            <code className="st-key__value">{revealed ? draft.apiKey : masked}</code>
            <button type="button" className="st-key__btn" onClick={() => setRevealed((v) => !v)} aria-label={t(revealed ? "admin.auth.hidePw" : "admin.auth.showPw")}>
              <Icon name={revealed ? "eye-off" : "eye"} size={16} />
            </button>
            <button type="button" className="st-key__btn" onClick={copy} aria-label={t("admin.settings.integrations.copy")}>
              <Icon name={copied ? "check" : "copy"} size={16} />
            </button>
          </div>
        </Field>
        <div className="st-actions">
          <Button hierarchy="secondary" size="sm" iconLeading="refresh-cw" onClick={() => setConfirmRegen(true)}>
            {t("admin.settings.integrations.regenerate")}
          </Button>
        </div>
      </Card>

      <Card title={t("admin.settings.integrations.webhookTitle")} desc={t("admin.settings.integrations.webhookDesc")}>
        <Field label={t("admin.settings.integrations.webhookUrl")} full>
          <Input
            placeholder="https://example.com/webhooks/chiya"
            value={draft.webhookUrl}
            onChange={(e) => setDraft((d) => ({ ...d, webhookUrl: e.target.value }))}
          />
        </Field>
        <div className="st-switchrow st-switchrow--tight">
          <div className="st-switchrow__text">
            <span className="st-switchrow__label">{t("admin.settings.integrations.webhookEnabled")}</span>
            <span className="st-switchrow__desc">{t("admin.settings.integrations.webhookEnabledDesc")}</span>
          </div>
          <Switch
            checked={draft.webhookEnabled}
            onChange={(e) => setDraft((d) => ({ ...d, webhookEnabled: e.target.checked }))}
          />
        </div>
      </Card>

      <Card title={t("admin.settings.integrations.servicesTitle")} desc={t("admin.settings.integrations.servicesDesc")}>
        <div className="st-svclist">
          <ServiceRow
            icon="message-circle"
            name={t("admin.settings.integrations.whatsapp")}
            desc={t("admin.settings.integrations.whatsappDesc")}
            connected={draft.whatsappConnected}
            onToggle={() => setDraft((d) => ({ ...d, whatsappConnected: !d.whatsappConnected }))}
          />
          <ServiceRow
            icon="mail"
            name={t("admin.settings.integrations.email")}
            desc={t("admin.settings.integrations.emailDesc")}
            connected={draft.emailConnected}
            onToggle={() => setDraft((d) => ({ ...d, emailConnected: !d.emailConnected }))}
          />
        </div>
      </Card>

      <SaveBar
        dirty={dirty}
        onCancel={() => setDraft(settings.integrations)}
        onSave={() => onSave({ integrations: draft }, "audit.action.updatedIntegrations")}
      />

      {confirmRegen && (
        <Modal
          open
          onClose={() => setConfirmRegen(false)}
          icon="refresh-cw"
          title={t("admin.settings.integrations.regenTitle")}
          subtitle={t("admin.settings.integrations.regenBody")}
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setConfirmRegen(false)}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button
                hierarchy="primary"
                iconLeading="refresh-cw"
                onClick={() => {
                  setDraft((d) => ({ ...d, apiKey: randomKey() }));
                  setRevealed(true);
                  setConfirmRegen(false);
                }}
              >
                {t("admin.settings.integrations.regenerate")}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

function ServiceRow({
  icon,
  name,
  desc,
  connected,
  onToggle,
}: {
  icon: "message-circle" | "mail";
  name: string;
  desc: string;
  connected: boolean;
  onToggle: () => void;
}) {
  const { t } = useLang();
  return (
    <div className="st-svc">
      <span className="st-svc__icon">
        <Icon name={icon} size={18} />
      </span>
      <div className="st-svc__text">
        <span className="st-svc__name">{name}</span>
        <span className="st-svc__desc">{desc}</span>
      </div>
      <span className={"st-svc__status" + (connected ? " is-on" : "")}>
        {t(connected ? "admin.settings.integrations.connected" : "admin.settings.integrations.disconnected")}
      </span>
      <Button hierarchy={connected ? "secondary-destructive" : "secondary"} size="sm" onClick={onToggle}>
        {t(connected ? "admin.settings.integrations.disconnect" : "admin.settings.integrations.connect")}
      </Button>
    </div>
  );
}

/* --------------------------------- Save bar ------------------------------- */

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

/* ----------------------------------- Hub ---------------------------------- */

export function SettingsApp() {
  const { t } = useLang();
  const { settings, save } = useAdminSettings();
  const [active, setActive] = useState<SettingsSectionId>("general");
  const [toast, setToast] = useState(false);

  const commit = (patch: Partial<AdminSettings>, actionKey: string) => {
    save({ ...settings, ...patch });
    logAudit({ category: "settings", actionKey, target: t("admin.nav.settings") });
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  return (
    <>
      <div className="pf-head">
        <div className="pf-head__intro">
          <h1 className="pf-head__title">{t("admin.settings.pageTitle")}</h1>
          <p className="pf-head__sub">{t("admin.settings.pageSub")}</p>
        </div>
      </div>

      <div className="st-split">
        <nav className="st-nav" aria-label={t("admin.settings.pageTitle")}>
          {SETTINGS_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"st-navitem" + (active === s.id ? " is-active" : "")}
              onClick={() => setActive(s.id)}
              aria-current={active === s.id}
            >
              <span className="st-navitem__icon">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="st-navitem__body">
                <span className="st-navitem__label">{t(s.labelKey)}</span>
                <span className="st-navitem__desc">{t(s.descKey)}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="st-detail">
          {active === "general" && <GeneralSection settings={settings} onSave={commit} />}
          {active === "appearance" && <AppearanceSection />}
          {active === "notifications" && <NotificationsSection settings={settings} onSave={commit} />}
          {active === "integrations" && <IntegrationsSection settings={settings} onSave={commit} />}
        </div>
      </div>

      {toast && (
        <div className="pf-toast" role="status">
          <Icon name="circle-check" size={18} />
          {t("admin.settings.saved")}
        </div>
      )}
    </>
  );
}
