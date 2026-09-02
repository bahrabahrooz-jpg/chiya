"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/choice";
import { LANGS, isRtl, useLang, type Lang } from "@/lib/i18n";
import { fmtNum, localizeDigits } from "@/lib/fmt";
import { logAudit } from "../_shared/audit-log";
import { useAutoSave } from "../_shared/use-auto-save";
import {
  NOW_HOUR,
  NOW_ISO,
  PROVIDERS,
  TEMPLATE_IDS,
  hourLabel,
  isDialable,
  logSentMessage,
  maskKey,
  renderBody,
  saveWhatsAppSettings,
  useTemplates,
  useWhatsAppSettings,
  waLink,
  type MsgTemplateId,
  type WhatsAppSettings,
} from "../_shared/messaging";
import { DELAY_HOURS, HOURS, REMINDER_DAYS } from "./data";

/* ============================================================================
   WhatsApp — how and when anything leaves at all.

   Three cards, in the order a person sets them up: whether we send, what the
   timing is, and then a test to prove it. Every row states its consequence in
   words rather than leaving the reader to infer it from a toggle — "Off —
   landlord told straight away" is the kind of line that stops somebody flipping
   a switch to find out what it does.

   ⚠ DRY-RUN IS ON OUT OF THE BOX and the banner at the top says so, loudly.
   There is no WhatsApp account behind this platform; a screen that let an admin
   believe tenants were being texted would be worse than one that sends nothing.
   ========================================================================== */

/** A settings row: what it is and what it does on the left, the control on the
    right. The same shape whether the control is a switch, a select or a number,
    so the pane reads as one column of decisions. */
function SetRow({
  label,
  desc,
  children,
  htmlFor,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="wa-setrow">
      <label className="wa-setrow__text" htmlFor={htmlFor}>
        <span className="wa-setrow__label">{label}</span>
        {desc && <span className="wa-setrow__desc">{desc}</span>}
      </label>
      <div className="wa-setrow__control">{children}</div>
    </div>
  );
}

/** Card shell — the same pf-card chrome as Settings and Content. */
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pf-card">
      <div className="pf-card__head">
        <div>
          <h3 className="pf-card__title">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export function WhatsAppSection() {
  const { t, lang: uiLang } = useLang();
  const saved = useWhatsAppSettings();
  const templates = useTemplates();

  /* Auto-saved, like every other editor pane here — no Save bar. The switches
     write through the same draft so the banner and the row labels react
     immediately rather than after the debounce. */
  const [s, setS] = useAutoSave<WhatsAppSettings>(saved, (next) => {
    saveWhatsAppSettings(next);
    logAudit({ category: "settings", actionKey: "audit.action.updatedMessaging", target: t("admin.nav.messaging") });
  });
  const set = <K extends keyof WhatsAppSettings>(key: K, value: WhatsAppSettings[K]) => setS((p) => ({ ...p, [key]: value }));

  const hourOptions = useMemo(
    () => HOURS.map((h) => ({ value: String(h), label: localizeDigits(uiLang, hourLabel(h)) })),
    [uiLang],
  );

  return (
    <div className="wa-stack">
      {s.dryRun && (
        <div className="wa-banner" role="status">
          <Icon name="flask-conical" size={18} />
          <span className="wa-banner__text">
            <span className="wa-banner__title">{t("admin.wa.dryBanner.title")}</span>
            <span className="wa-banner__desc">{t("admin.wa.dryBanner.desc")}</span>
          </span>
        </div>
      )}

      <Card title={t("admin.wa.delivery.title")}>
        <SetRow label={t("admin.wa.delivery.status")} desc={t("admin.wa.delivery.statusDesc")}>
          <span className={"wa-switchstate" + (s.enabled ? " is-on" : "")}>
            {t(s.enabled ? "admin.wa.delivery.on" : "admin.wa.delivery.off")}
          </span>
          <Switch checked={s.enabled} aria-label={t("admin.wa.delivery.status")} onChange={(e) => set("enabled", e.target.checked)} />
        </SetRow>

        <SetRow label={t("admin.wa.delivery.dryRun")} desc={t("admin.wa.delivery.dryRunDesc")}>
          <span className={"wa-switchstate" + (s.dryRun ? " is-warn" : " is-on")}>
            {t(s.dryRun ? "admin.wa.delivery.dryOn" : "admin.wa.delivery.dryOff")}
          </span>
          <Switch checked={s.dryRun} aria-label={t("admin.wa.delivery.dryRun")} onChange={(e) => set("dryRun", e.target.checked)} />
        </SetRow>

        <SetRow label={t("admin.wa.delivery.provider")} desc={t("admin.wa.delivery.providerDesc")} htmlFor="wa-provider">
          <Select
            id="wa-provider"
            value={s.provider}
            onChange={(e) => set("provider", e.target.value as WhatsAppSettings["provider"])}
            options={PROVIDERS.map((p) => ({ value: p, label: t(`admin.wa.provider.${p}`) }))}
          />
        </SetRow>

        <SetRow label={t("admin.wa.delivery.number")} desc={t("admin.wa.delivery.numberDesc")} htmlFor="wa-number">
          <Input
            id="wa-number"
            value={s.businessNumber}
            dir="ltr"
            inputMode="tel"
            onChange={(e) => set("businessNumber", e.target.value)}
          />
        </SetRow>

        <SetRow label={t("admin.wa.delivery.key")} desc={t("admin.wa.delivery.keyDesc")} htmlFor="wa-key">
          <Input
            id="wa-key"
            value={s.apiKey}
            dir="ltr"
            type="password"
            placeholder={saved.apiKey ? maskKey(saved.apiKey) : t("admin.wa.delivery.keyPh")}
            onChange={(e) => set("apiKey", e.target.value)}
          />
        </SetRow>

        <SetRow label={t("admin.wa.delivery.language")} desc={t("admin.wa.delivery.languageDesc")} htmlFor="wa-lang">
          <Select
            id="wa-lang"
            value={s.sendLanguage}
            onChange={(e) => set("sendLanguage", e.target.value as Lang)}
            options={LANGS.map((l) => ({ value: l, label: t(`lang.${l}`) }))}
          />
        </SetRow>
      </Card>

      <Card title={t("admin.wa.timing.title")}>
        <SetRow label={t("admin.wa.timing.daysBefore")} desc={t("admin.wa.timing.daysBeforeDesc")} htmlFor="wa-days">
          <Select
            id="wa-days"
            value={String(s.reminderDaysBefore)}
            onChange={(e) => set("reminderDaysBefore", Number(e.target.value))}
            options={REMINDER_DAYS.map((d) => ({
              value: String(d),
              label: d === 0 ? t("admin.wa.timing.sameDay") : t(d === 1 ? "admin.wa.timing.dayOne" : "admin.wa.timing.days", { count: fmtNum(uiLang, d) }),
            }))}
          />
        </SetRow>

        <SetRow label={t("admin.wa.timing.sendHour")} desc={t("admin.wa.timing.sendHourDesc")} htmlFor="wa-hour">
          <Select id="wa-hour" value={String(s.sendHour)} onChange={(e) => set("sendHour", Number(e.target.value))} options={hourOptions} />
        </SetRow>

        <SetRow label={t("admin.wa.timing.landlordDelay")} desc={t("admin.wa.timing.landlordDelayDesc")}>
          <span className={"wa-switchstate" + (s.landlordDelayOn ? " is-on" : "")}>
            {s.landlordDelayOn
              ? t("admin.wa.timing.delayOn", { count: fmtNum(uiLang, s.landlordDelayHours) })
              : t("admin.wa.timing.delayOff")}
          </span>
          <Switch
            checked={s.landlordDelayOn}
            aria-label={t("admin.wa.timing.landlordDelay")}
            onChange={(e) => set("landlordDelayOn", e.target.checked)}
          />
        </SetRow>

        {s.landlordDelayOn && (
          <SetRow label={t("admin.wa.timing.delayHours")} desc={t("admin.wa.timing.delayHoursDesc")} htmlFor="wa-delay">
            <Select
              id="wa-delay"
              value={String(s.landlordDelayHours)}
              onChange={(e) => set("landlordDelayHours", Number(e.target.value))}
              options={DELAY_HOURS.map((h) => ({
                value: String(h),
                label: t(h === 1 ? "admin.wa.timing.hourOne" : "admin.wa.timing.hours", { count: fmtNum(uiLang, h) }),
              }))}
            />
          </SetRow>
        )}

        <SetRow label={t("admin.wa.timing.quiet")} desc={t("admin.wa.timing.quietDesc")}>
          <span className={"wa-switchstate" + (s.quietHoursOn ? " is-on" : "")}>
            {t(s.quietHoursOn ? "admin.wa.timing.quietOn" : "admin.wa.timing.quietOff")}
          </span>
          <Switch checked={s.quietHoursOn} aria-label={t("admin.wa.timing.quiet")} onChange={(e) => set("quietHoursOn", e.target.checked)} />
        </SetRow>

        {s.quietHoursOn && (
          <>
            <SetRow label={t("admin.wa.timing.quietStart")} desc={t("admin.wa.timing.quietStartDesc")} htmlFor="wa-qs">
              <Select id="wa-qs" value={String(s.quietStart)} onChange={(e) => set("quietStart", Number(e.target.value))} options={hourOptions} />
            </SetRow>
            <SetRow label={t("admin.wa.timing.quietEnd")} desc={t("admin.wa.timing.quietEndDesc")} htmlFor="wa-qe">
              <Select id="wa-qe" value={String(s.quietEnd)} onChange={(e) => set("quietEnd", Number(e.target.value))} options={hourOptions} />
            </SetRow>
          </>
        )}
      </Card>

      <TestCard settings={s} templates={templates} />
    </div>
  );
}

/* ----------------------------------------------------------------------------
   The test send
   ------------------------------------------------------------------------- */

/**
 * SEND ONE TO YOURSELF.
 *
 * The only way to know a template reads right is to see it on a phone, and the
 * only honest way to put it there from here is the same wa.me hand-off the
 * contract screen uses — the sender's own WhatsApp, opened with the text ready.
 * It ignores quiet hours by design: a person pressing this button at midnight
 * is testing, not scheduling.
 */
function TestCard({
  settings,
  templates,
}: {
  settings: WhatsAppSettings;
  templates: ReturnType<typeof useTemplates>;
}) {
  const { t, lang: uiLang } = useLang();
  const [phone, setPhone] = useState(settings.businessNumber);
  const [templateId, setTemplateId] = useState<MsgTemplateId>("payment_reminder");
  const [done, setDone] = useState(false);

  /* Deliberately unfilled tokens: a test proves the SHAPE of the sentence, and
     inventing a tenant to fill it would test a fiction. The chips stay visible
     so the reader can see exactly which values a real send would replace. */
  const body = templates[templateId].body[settings.sendLanguage];
  const canSend = isDialable(phone);

  const send = () => {
    if (!canSend) return;
    logSentMessage({
      templateId,
      audience: "tenant",
      toName: t("admin.wa.test.recipient"),
      toPhone: phone,
      lang: settings.sendLanguage,
      body,
      on: NOW_ISO,
      hour: NOW_HOUR,
      held: false,
      status: "sent",
    });
    window.open(waLink(phone, renderBody(body, {})), "_blank", "noopener,noreferrer");
    setDone(true);
  };

  return (
    <Card title={t("admin.wa.test.title")}>
      <div className="wa-testgrid">
        <div className="wa-tpl__side">
          <SetRow label={t("admin.wa.test.to")} desc={t("admin.wa.test.toDesc")} htmlFor="wa-testphone">
            <Input
              id="wa-testphone"
              value={phone}
              dir="ltr"
              inputMode="tel"
              onChange={(e) => {
                setPhone(e.target.value);
                setDone(false);
              }}
            />
          </SetRow>
          <SetRow label={t("admin.wa.test.template")} htmlFor="wa-testtpl">
            <Select
              id="wa-testtpl"
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value as MsgTemplateId);
                setDone(false);
              }}
              options={TEMPLATE_IDS.map((id) => ({ value: id, label: t(`admin.wa.tpl.${id}.name`) }))}
            />
          </SetRow>
          <div className="sx-cardaction">
            <Button hierarchy="primary" size="md" iconLeading="send" disabled={!canSend} onClick={send}>
              {t("admin.wa.test.action")}
            </Button>
          </div>
          <p className="sx-hint">{done ? t("admin.wa.test.opened") : t("admin.wa.test.hint")}</p>
        </div>

        <div className="wa-tpl__side">
          <span className="wa-tpl__label">{t("admin.wa.preview")}</span>
          <div className="wa-phone">
            <div className="wa-bubble" dir={isRtl(settings.sendLanguage) ? "rtl" : "ltr"}>
              {body}
              <span className="wa-bubble__meta">
                {localizeDigits(uiLang, "09:41")}
                <Icon name="check-check" size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
