"use client";

import { useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { LANGS, isRtl, useLang, type Lang } from "@/lib/i18n";
import { localizeDigits } from "@/lib/fmt";
import { CancelButton, FinanceModal } from "../finance/modal-shell";
import { Labelled, Segmented } from "../finance/controls";
import type { ContractRecord } from "../../_data/contracts";
import { useTokenValues } from "./outbox";
import { logSentMessage } from "./store";
import { useTemplates, useWhatsAppSettings } from "./store";
import {
  NOW_HOUR,
  NOW_ISO,
  TEMPLATE_TOKENS,
  isDialable,
  renderBody,
  telLink,
  waLink,
  type MsgAudience,
  type MsgTemplateId,
} from "./types";
import "./messaging.css";

/* ============================================================================
   SendMessageModal — the manual half of messaging.

   The schedule covers the two moments that repeat. Everything else an office
   says to a tenant — "the plumber is coming Thursday", "please bring the ID
   copy" — is a person typing a sentence, and a system with no room for that is
   a system people work around with their own phone and no record.

   WHAT PRESSING SEND ACTUALLY DOES: it opens WhatsApp on the sender's own
   device with the text already written (a wa.me link), and records that they
   did. It does NOT deliver anything from the platform — there is no account
   behind this to deliver from, and a button that implied otherwise would have
   an agent believing a tenant had been told. The footnote on the modal says so
   in the same words.
   ========================================================================== */

/** Which template a hand-written message starts from. Free text first: it is
    what somebody opening this from a contract almost always wants. */
const PICKABLE: MsgTemplateId[] = ["manual_notice", "payment_reminder", "payment_received"];

export interface SendMessageModalProps {
  contract: ContractRecord;
  /** Who the sender pressed the button next to. They can still switch. */
  audience: MsgAudience;
  /** Resolved by the caller, which already has both parties on screen. */
  tenant: { name: string; phone: string };
  landlord: { name: string; phone: string };
  propertyTitle: string;
  onClose: () => void;
  onSent: (info: { name: string }) => void;
}

export function SendMessageModal({ contract, audience: initialAudience, tenant, landlord, propertyTitle, onClose, onSent }: SendMessageModalProps) {
  const { t, lang: uiLang } = useLang();
  const templates = useTemplates();
  const settings = useWhatsAppSettings();
  const tokenValues = useTokenValues();

  const [audience, setAudience] = useState<MsgAudience>(initialAudience);
  const [templateId, setTemplateId] = useState<MsgTemplateId>("manual_notice");
  /* The language the CUSTOMER reads, seeded from the platform's send language —
     not from whatever the admin has the interface set to. An English-speaking
     manager still writes to a Kurdish tenant in Kurdish. */
  const [sendLang, setSendLang] = useState<Lang>(settings.sendLanguage);
  /* Null until the sender types: the composed text is derived from the three
     pickers above, and freezing it on mount would mean switching template or
     language changed nothing. Once they type, their words win. */
  const [edited, setEdited] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const party = audience === "landlord" ? landlord : tenant;
  const canSend = isDialable(party.phone);

  const composed = useMemo(
    () => renderBody(templates[templateId].body[sendLang], tokenValues({ contract, audience, lang: sendLang })),
    [templates, templateId, sendLang, tokenValues, contract, audience],
  );

  const text = edited ?? composed;

  /** Drop a `{token}` in at the cursor — the editor's one affordance. */
  const insertToken = (token: string) => {
    const el = bodyRef.current;
    const chunk = `{${token}}`;
    if (!el) {
      setEdited(text + chunk);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? start;
    const next = text.slice(0, start) + chunk + text.slice(end);
    setEdited(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + chunk.length, start + chunk.length);
    });
  };

  /* What actually leaves: the tokens filled in, whether they came from the
     template or from something the sender typed by hand. */
  const finalText = renderBody(text, tokenValues({ contract, audience, lang: sendLang })).trim();

  const send = () => {
    if (!canSend || !finalText) return;
    logSentMessage({
      templateId,
      audience,
      toName: party.name,
      toPhone: party.phone,
      lang: sendLang,
      body: finalText,
      on: NOW_ISO,
      hour: NOW_HOUR,
      held: false,
      /* "sent", never "delivered" — see the MsgStatus note in ./types. */
      status: "sent",
      contractId: contract.id,
      propertyTitle,
    });
    window.open(waLink(party.phone, finalText), "_blank", "noopener,noreferrer");
    onSent({ name: party.name });
  };

  const audienceOptions = [
    { value: "tenant" as const, label: t("admin.wa.party.tenant") },
    { value: "landlord" as const, label: t("admin.wa.party.landlord") },
  ];

  return (
    <FinanceModal
      icon="message-circle"
      title={t("admin.wa.send.title")}
      sub={t("admin.wa.send.sub", { property: propertyTitle, id: localizeDigits(uiLang, contract.id) })}
      wide
      onClose={onClose}
      footNote={
        <p className={"fm-note" + (canSend ? "" : " fm-note--warning")}>
          <Icon name={canSend ? "info" : "triangle-alert"} size={15} />
          {canSend ? t("admin.wa.send.handoff") : t("admin.wa.send.noPhone")}
        </p>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!canSend || !finalText} onClick={send}>
            <Icon name="send" size={16} />
            {t("admin.wa.send.action")}
          </button>
        </>
      }
    >
      <Labelled label={t("admin.wa.send.to")}>
        <Segmented value={audience} options={audienceOptions} onChange={setAudience} ariaLabel={t("admin.wa.send.to")} />
      </Labelled>

      <div className="wa-recipient">
        <span className="wa-recipient__avatar" aria-hidden="true">
          {party.name.trim().charAt(0) || "?"}
        </span>
        <span className="wa-recipient__body">
          <span className="wa-recipient__name">{party.name || t("admin.wa.party.unknown")}</span>
          {canSend ? (
            <a className="wa-recipient__phone" href={telLink(party.phone)} dir="ltr">
              {party.phone}
            </a>
          ) : (
            <span className="wa-recipient__phone wa-recipient__phone--none">{t("admin.wa.noPhone")}</span>
          )}
        </span>
      </div>

      <Labelled label={t("admin.wa.send.template")}>
        <Segmented
          value={templateId}
          options={PICKABLE.map((id) => ({ value: id, label: t(`admin.wa.tpl.${id}.name`) }))}
          onChange={(id) => {
            setTemplateId(id);
            setEdited(null);
          }}
          ariaLabel={t("admin.wa.send.template")}
        />
      </Labelled>

      <Labelled label={t("admin.wa.send.language")} hint={t("admin.wa.send.languageHint")}>
        <Segmented
          value={sendLang}
          options={LANGS.map((l) => ({ value: l, label: t(`lang.${l}`) }))}
          onChange={(l) => {
            setSendLang(l);
            setEdited(null);
          }}
          ariaLabel={t("admin.wa.send.language")}
        />
      </Labelled>

      <Labelled label={t("admin.wa.send.message")}>
        <div className="wa-tokens">
          {TEMPLATE_TOKENS[templateId].map((tok) => (
            <button key={tok} type="button" className="wa-token" onClick={() => insertToken(tok)}>
              <Icon name="plus" size={12} strokeWidth={2.4} />
              <span dir="ltr">{`{${tok}}`}</span>
            </button>
          ))}
        </div>
        <textarea
          ref={bodyRef}
          className="wa-editor"
          rows={4}
          dir={isRtl(sendLang) ? "rtl" : "ltr"}
          value={text}
          onChange={(e) => setEdited(e.target.value)}
          aria-label={t("admin.wa.send.message")}
        />
      </Labelled>

      <Labelled label={t("admin.wa.preview")}>
        <div className="wa-phone">
          <div className="wa-bubble" dir={isRtl(sendLang) ? "rtl" : "ltr"}>
            {finalText || t("admin.wa.preview.empty")}
            <span className="wa-bubble__meta">
              {localizeDigits(uiLang, "09:41")}
              <Icon name="check-check" size={13} />
            </span>
          </div>
        </div>
      </Labelled>
    </FinanceModal>
  );
}
