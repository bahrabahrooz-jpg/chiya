"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/choice";
import { LANGS, isRtl, useLang, type Lang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { formatMoney } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { usePlatformSettings } from "@/lib/platform-settings";
import { logAudit } from "../_shared/audit-log";
import { useAutoSave } from "../_shared/use-auto-save";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { invoiceTotals } from "../_data/contracts";
import {
  DEFAULT_TEMPLATES,
  NOW_ISO,
  TEMPLATE_IDS,
  TEMPLATE_TOKENS,
  renderBody,
  saveTemplate,
  useMessageParties,
  useTemplates,
  useWhatsAppSettings,
  type MessageTemplate,
  type MsgTemplateId,
} from "../_shared/messaging";
import { TEMPLATE_ICON } from "./data";

/* The shipped wording, read straight off the defaults so "reset" cannot drift
   from what a fresh install gets. */
const DEFAULT_BODY = (id: MsgTemplateId) => DEFAULT_TEMPLATES[id].body;

/* ============================================================================
   Templates — what each message says, in all three languages.

   One card per template rather than a list-then-editor: there are three of
   them, they are short, and a master-detail inside a pane that is already the
   detail half of a master-detail would put the wording three clicks from the
   screen it belongs to.

   THE PREVIEW USES A REAL TENANCY. Filling the tokens with "{tenant_name}" or
   with invented placeholder names hides the only mistake this editor can make
   — a sentence that reads fine as a template and badly once a 24-character
   property title and a dinar amount are dropped into it. The card composes the
   sentence against a live contract, so what is on the right is what a customer
   would actually receive.

   No Save bar: each card auto-saves shortly after typing stops, the house rule
   for every editor screen here (see _shared/use-auto-save).
   ========================================================================== */

/** The EN/AR/KU strip, borrowed class-for-class from the Content editor's
    LocField so both editors switch language with the same control. */
function LangSwitch({ label, value, onChange, empty }: { label: string; value: Lang; onChange: (l: Lang) => void; empty: (l: Lang) => boolean }) {
  const LABEL: Record<Lang, string> = { en: "EN", ar: "AR", ku: "KU" };
  return (
    <div className="ct-langsw" role="tablist" aria-label={label}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={value === l}
          className={"ct-langsw__btn" + (value === l ? " is-active" : "") + (empty(l) ? " is-empty" : "")}
          onClick={() => onChange(l)}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}

/**
 * The values the preview fills its tokens with, taken off a real tenancy.
 *
 * Prefers a signed lease that actually has a rent demand behind it, because
 * that is the only case where every token — amount, due date, days before —
 * has a truthful answer. Falls back to the contract's own figures, and finally
 * to blanks, which is honest: an office with no tenancies has nothing to show.
 */
function usePreviewValues(): { values: Record<string, string>; sample: string | null } {
  const { lang } = useLang();
  const { contracts, invoices } = useContracts();
  const { properties, agents } = useProperties();
  const { settings: platform } = usePlatformSettings();
  const settings = useWhatsAppSettings();
  const { ownerOf, tenantOf } = useMessageParties();

  return useMemo(() => {
    /* Prefer a tenancy with rent STILL TO FALL DUE. Any signed lease would fill
       the tokens, but one whose last demand was settled in 2025 previews as
       "due on Aug 20, 2025, 3 days from now" — a sentence that reads as a bug
       and sends an editor looking for one. */
    const upcoming = invoices.find((i) => i.category === "rent" && i.status === "issued" && i.dueOn >= NOW_ISO);
    const lease =
      (upcoming && contracts.find((c) => c.id === upcoming.contractId && c.kind === "rent")) ??
      contracts.find((c) => c.kind === "rent" && c.status === "signed");
    if (!lease) return { values: {} as Record<string, string>, sample: null };
    const invoice =
      upcoming?.contractId === lease.id
        ? upcoming
        : invoices.find((i) => i.contractId === lease.id && i.category === "rent");
    const tenant = tenantOf(lease, invoice);
    const owner = ownerOf(lease);
    const agent = agents.find((a) => a.id === lease.agentId);
    const property = properties.find((p) => p.id === lease.propertyId)?.title ?? lease.propertyId;
    const amount = invoice ? invoiceTotals(invoice).total : lease.price;
    return {
      sample: property,
      values: {
        tenant_name: tenant.name,
        recipient_name: tenant.name,
        landlord_name: owner.name,
        property_label: property,
        contract_no: lease.id,
        amount: formatMoney(lang, amount),
        currency: amount.currency,
        due_date: fmtDate(lang, fromIso(invoice?.dueOn ?? lease.startsOn ?? NOW_ISO)),
        paid_date: fmtDate(lang, fromIso(NOW_ISO)),
        days_before: fmtNum(lang, settings.reminderDaysBefore),
        agency_name: platform.general.platformName,
        agent_name: agent?.name ?? "",
        agent_phone: agent?.phone ?? platform.general.contactPhone,
      },
    };
  }, [contracts, invoices, properties, agents, platform, settings.reminderDaysBefore, lang, ownerOf, tenantOf]);
}

function TemplateCard({ template, values }: { template: MessageTemplate; values: Record<string, string> }) {
  const { t } = useLang();
  const settings = useWhatsAppSettings();

  /* The pane remounts when the nav switches, so the draft re-seeds naturally —
     the same arrangement Settings and Content use. */
  const [body, setBody] = useAutoSave(template.body, (next) => {
    saveTemplate(template.id, { body: next });
    logAudit({ category: "settings", actionKey: "audit.action.updatedTemplate", target: template.id });
  });

  /* Which language is being EDITED. Independent of the interface language: an
     English-speaking manager still has to be able to fix the Kurdish wording,
     and it starts on the language customers are actually written to. */
  const [editing, setEditing] = useState<Lang>(settings.sendLanguage);
  const rtl = isRtl(editing);

  const preview = renderBody(body[editing], values);

  return (
    <section className={"pf-card" + (template.enabled ? "" : " wa-tpl--off")}>
      <header className="wa-tpl__head">
        <span className="wa-tpl__icon">
          <Icon name={TEMPLATE_ICON[template.id]} size={20} />
        </span>
        <span className="wa-tpl__titles">
          <span className="wa-tpl__name">{t(`admin.wa.tpl.${template.id}.name`)}</span>
          <span className="wa-tpl__desc">{t(`admin.wa.tpl.${template.id}.desc`)}</span>
        </span>
        <span className="wa-tpl__switch">
          <span className={"wa-tpl__state" + (template.enabled ? " is-on" : "")}>
            {t(template.enabled ? "admin.wa.tpl.on" : "admin.wa.tpl.off")}
          </span>
          <Switch
            checked={template.enabled}
            aria-label={t(`admin.wa.tpl.${template.id}.name`)}
            onChange={(e) => {
              saveTemplate(template.id, { enabled: e.target.checked });
              logAudit({
                category: "settings",
                actionKey: e.target.checked ? "audit.action.enabledTemplate" : "audit.action.disabledTemplate",
                target: template.id,
              });
            }}
          />
        </span>
      </header>

      <div className="wa-tpl__body">
        <div className="wa-tpl__side">
          <div className="wa-tpl__sidehead">
            <span className="wa-tpl__label">{t("admin.wa.tpl.bodyLabel")}</span>
            <LangSwitch
              label={t("admin.wa.tpl.bodyLabel")}
              value={editing}
              onChange={setEditing}
              empty={(l) => !body[l]?.trim()}
            />
          </div>

          <div className="wa-tokens">
            {TEMPLATE_TOKENS[template.id].map((tok) => (
              <button
                key={tok}
                type="button"
                className="wa-token"
                onClick={() => setBody({ ...body, [editing]: `${body[editing]}{${tok}}` })}
              >
                <Icon name="plus" size={12} strokeWidth={2.4} />
                <span dir="ltr">{`{${tok}}`}</span>
              </button>
            ))}
          </div>

          <textarea
            className="wa-editor"
            rows={5}
            dir={rtl ? "rtl" : "ltr"}
            value={body[editing]}
            aria-label={t("admin.wa.tpl.bodyLabel")}
            onChange={(e) => setBody({ ...body, [editing]: e.target.value })}
          />
        </div>

        <div className="wa-tpl__side">
          <div className="wa-tpl__sidehead">
            <span className="wa-tpl__label">{t("admin.wa.preview")}</span>
          </div>
          <div className="wa-phone">
            <div className={"wa-bubble" + (preview.trim() ? "" : " wa-bubble--empty")} dir={rtl ? "rtl" : "ltr"}>
              {preview.trim() || t("admin.wa.preview.empty")}
              <span className="wa-bubble__meta">
                {localizeDigits(editing, "09:41")}
                <Icon name="check-check" size={13} />
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="wa-tpl__foot">
        <span className="wa-saved">
          <Icon name="circle-check" size={15} />
          {t("admin.wa.savedAuto")}
        </span>
        <Button
          hierarchy="tertiary"
          size="sm"
          iconLeading="rotate-ccw"
          onClick={() => setBody({ ...body, [editing]: DEFAULT_BODY(template.id)[editing] })}
        >
          {t("admin.wa.tpl.resetOne")}
        </Button>
      </div>
    </section>
  );
}

export function TemplatesSection() {
  const { t } = useLang();
  const templates = useTemplates();
  const { values, sample } = usePreviewValues();

  return (
    <div className="wa-stack">
      <p className="sx-hint">{sample ? t("admin.wa.tpl.previewFrom", { property: sample }) : t("admin.wa.tpl.previewNone")}</p>
      {TEMPLATE_IDS.map((id) => (
        <TemplateCard key={id} template={templates[id]} values={values} />
      ))}
    </div>
  );
}
