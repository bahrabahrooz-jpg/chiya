"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/choice";
import { LANGS, useLang, type Lang } from "@/lib/i18n";
import type { IdKind } from "../_data/catalog";
import { AM_AGENTS, AM_CITIES, ID_KINDS } from "./data";
import "./add-member-modal.css";

function AmAgentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };
  const toggle = () => {
    if (!open) calcPos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".am-amodal__drop")?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  return (
    <div className="cx-field">
      <label className="cx-field__label">
        {t("admin.props.th.agent")} <span className="am-label__opt">{t("admin.members.optional")}</span>
      </label>
      <button type="button" ref={btnRef} className={"am-amodal__trigger" + (open ? " is-open" : "")} onClick={toggle}>
        <span className="am-amodal__trigger-placeholder">
          <Icon name="user" size={16} />
          {t("admin.props.selectAgent")}
        </span>
        <Icon name="chevron-down" size={15} className="am-amodal__trigger-chev" />
      </button>
      {open &&
        pos &&
        createPortal(
          <div className="am-amodal__drop" style={{ top: pos.top, left: pos.left, width: pos.width }}>
            {AM_AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={"am-amodal__agent" + (value === a.id ? " is-selected" : "")}
                onClick={() => {
                  onChange(value === a.id ? "" : a.id);
                  setOpen(false);
                }}
              >
                <Avatar src={a.img} name={a.name} size="sm" verified />
                <span className="am-amodal__agent-body">
                  <span className="am-amodal__agent-name">{a.name}</span>
                  <span className="am-amodal__agent-area">{a.area}</span>
                </span>
                {value === a.id && (
                  <span className="am-amodal__check">
                    <Icon name="check" size={16} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

/**
 * A switch with its own sentence beside it.
 *
 * The plain <Switch label> puts one line of text next to the control, and one
 * line is not enough for either of these two: "Automatic messages" alone does
 * not tell anybody when to turn it off, and a setting people cannot see the
 * purpose of gets flipped by whoever last took a complaint. The description
 * carries the case, so the row explains itself.
 *
 * The whole row is the label, so the sentence is a tap target too — which is
 * what makes it usable on a phone, where a 20px switch is not.
 */
function AmToggle({ id, label, desc, checked, onChange }: { id: string; label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="am-toggle">
      <label className="am-toggle__text" htmlFor={id}>
        <span className="am-toggle__label">{label}</span>
        <span className="am-toggle__desc">{desc}</span>
      </label>
      <Switch id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}

export interface MemberInitial {
  name?: string;
  phone?: string;
  email?: string;
  agentId?: string;
  notes?: string;
  whatsapp?: boolean;
  msgLang?: Lang | null;
  remindersOn?: boolean;
  idKind?: IdKind | null;
  idNumber?: string;
  city?: string;
  area?: string;
}

/** Everything the modal hands back. The caller turns it into a MemberRecord. */
export interface MemberValues {
  name: string;
  phone: string;
  email: string;
  agentId: string;
  notes: string;
  whatsapp: boolean;
  msgLang: Lang | null;
  remindersOn: boolean;
  idKind: IdKind | null;
  idNumber: string;
  city: string;
  area: string;
}

export interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (v: MemberValues) => void;
  mode?: "add" | "edit";
  initial?: MemberInitial | null;
}

/** Gate on `open` so the inner form remounts (and re-prefills from `initial`) each time. */
export function AddMemberModal(props: AddMemberModalProps) {
  if (!props.open) return null;
  return <MemberForm {...props} />;
}

function MemberForm({ open, onClose, onSubmit, mode = "add", initial = null }: AddMemberModalProps) {
  const { t } = useLang();
  const isEdit = mode === "edit";
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [agentId, setAgentId] = useState(initial?.agentId || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  /* THE DEFAULTS ARE THE ORDINARY CASE, so adding somebody at the counter is
     still four fields and a Save. Every switch below starts where nine tenants
     out of ten belong; the form only costs anything when somebody is unusual. */
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? true);
  const [remindersOn, setRemindersOn] = useState(initial?.remindersOn ?? true);
  /* "" is the follow-the-agency-default option, not a missing value — see the
     first entry in langOptions. It is stored as null. */
  const [msgLang, setMsgLang] = useState<Lang | "">(initial?.msgLang ?? "");
  const [idKind, setIdKind] = useState<IdKind | "">(initial?.idKind ?? "");
  const [idNumber, setIdNumber] = useState(initial?.idNumber || "");
  const [city, setCity] = useState(initial?.city || "");
  const [area, setArea] = useState(initial?.area || "");

  const agent = AM_AGENTS.find((a) => a.id === agentId) || null;
  /**
   * A NAME AND A NUMBER. Nothing else is required.
   *
   * The ID never was: a tenant is usually created off a phone call days before
   * anybody sees their civil ID, and a form that refuses to save without one
   * gets fed a row of zeros. The contract is where an unidentified party
   * actually costs something, and that is where to ask for it.
   *
   * EMAIL USED TO BE, and that requirement is what kept the external-party
   * escape hatch alive. This modal is now the only way to put a counterparty on
   * a contract, and plenty of tenants here have no email at all — so demanding
   * one meant either inventing an address or writing the person down as a
   * string on one contract instead of a person on the platform. The whole point
   * of removing the escape hatch was to make this form as cheap as typing a
   * name and a number. It has to actually be that.
   */
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  const values = (): MemberValues => ({
    name,
    phone,
    email,
    agentId,
    notes,
    whatsapp,
    msgLang: msgLang || null,
    remindersOn,
    idKind: idKind || null,
    idNumber: idNumber.trim(),
    city,
    area: area.trim(),
  });

  const langOptions = [
    { value: "", label: t("admin.members.msgLangDefault") },
    ...LANGS.map((l) => ({ value: l, label: t(`lang.${l}`) })),
  ];

  const footer = (
    <>
      <Button hierarchy="secondary" size="lg" onClick={onClose}>
        {t("admin.topbar.cancel")}
      </Button>
      <Button
        hierarchy="primary"
        size="lg"
        disabled={!canSubmit}
        onClick={() => onSubmit?.(values())}
      >
        {isEdit ? t("admin.profile.save") : t("admin.members.add")}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon="user-plus"
      title={isEdit ? t("admin.members.editMember") : t("admin.members.add")}
      subtitle={isEdit ? t("admin.members.editSub") : t("admin.members.addSub")}
      footer={footer}
      className="am-modal"
    >
      <div className="am-form">
        <section className="am-section">
          <div className="am-grid">
            <Input label={t("admin.members.fullName")} value={name} autoFocus iconLeading="user" placeholder={t("admin.members.namePh")} onChange={(e) => setName(e.target.value)} />
            <div className="am-grid am-grid--2">
              <Input label={t("admin.members.phone")} value={phone} iconLeading="phone" inputMode="tel" placeholder="+964 750 000 0000" onChange={(e) => setPhone(e.target.value)} />
              {/* Marked optional in the label, not merely permitted to be
                  blank: a required-looking field that silently accepts nothing
                  still makes people invent an address. */}
              <Input
                label={
                  <>
                    {t("admin.members.emailAddr")} <span className="am-label__opt">{t("admin.members.optional")}</span>
                  </>
                }
                value={email}
                iconLeading="mail"
                type="email"
                placeholder="name@email.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------
            HOW WE WRITE TO THEM.

            Directly under the phone number, because that is the field it is
            about: whether the number can carry a message, what language the
            message is in, and whether we send one at all. Putting it below the
            relationship agent would separate the two halves of one decision.

            All three are answered by the defaults, so anybody adding an
            ordinary member reads this section once and walks past it.
            ------------------------------------------------------------------ */}
        <section className="am-section">
          <div className="am-section__head">
            <h3 className="am-section__title">{t("admin.members.msgTitle")}</h3>
            <p className="am-section__desc">{t("admin.members.msgDesc")}</p>
          </div>

          <div className="am-grid">
            <AmToggle
              id="am-wa"
              label={t("admin.members.onWhatsapp")}
              desc={t("admin.members.onWhatsappDesc")}
              checked={whatsapp}
              onChange={setWhatsapp}
            />
            <AmToggle
              id="am-remind"
              label={t("admin.members.reminders")}
              /* The description names the case it exists for. A switch labelled
                 only "Automatic messages" gets flipped by whoever last had a
                 complaint; one that says when to flip it does not. */
              desc={t("admin.members.remindersDesc")}
              checked={remindersOn}
              onChange={setRemindersOn}
            />
            <Select
              id="am-msglang"
              label={t("admin.members.msgLang")}
              hint={t("admin.members.msgLangHint")}
              value={msgLang}
              onChange={(e) => setMsgLang(e.target.value as Lang | "")}
              options={langOptions}
            />
          </div>
        </section>

        {/* ------------------------------------------------------------------
            IDENTITY AND WHERE THEY ARE.

            Both optional, and the form has to look comfortable with that: a
            prospective buyer who has been to one viewing has produced a phone
            number and nothing else, and asking for a passport at that moment
            invents data. The contract is where an unidentified party costs
            something, and it asks there.
            ------------------------------------------------------------------ */}
        <section className="am-section">
          <div className="am-section__head">
            <h3 className="am-section__title">
              {t("admin.members.idTitle")} <span className="am-label__opt">{t("admin.members.optional")}</span>
            </h3>
            <p className="am-section__desc">{t("admin.members.idDesc")}</p>
          </div>

          <div className="am-grid">
            <div className="am-grid am-grid--2">
              <Select
                id="am-idkind"
                label={t("admin.members.idKind")}
                value={idKind}
                onChange={(e) => setIdKind(e.target.value as IdKind | "")}
                options={[{ value: "", label: t("admin.members.idKindNone") }, ...ID_KINDS.map((k) => ({ value: k, label: t(`admin.members.idKind.${k}`) }))]}
              />
              <Input
                id="am-idno"
                label={t("admin.members.idNumber")}
                value={idNumber}
                dir="ltr"
                iconLeading="id-card"
                placeholder={t("admin.members.idNumberPh")}
                onChange={(e) => setIdNumber(e.target.value)}
                /* Nothing to number until somebody says which document it is. */
                disabled={!idKind}
              />
            </div>
            <div className="am-grid am-grid--2">
              <Select
                id="am-city"
                label={t("admin.members.city")}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  /* An area belongs to a city. Keeping "Ankawa" after switching
                     to Duhok would store a place that does not exist. */
                  if (!e.target.value) setArea("");
                }}
                options={[{ value: "", label: t("admin.members.cityNone") }, ...AM_CITIES.map((c) => ({ value: c, label: c }))]}
              />
              <Input
                id="am-area"
                label={t("admin.members.area")}
                value={area}
                iconLeading="map-pin"
                placeholder={t("admin.members.areaPh")}
                onChange={(e) => setArea(e.target.value)}
                disabled={!city}
              />
            </div>
          </div>
        </section>

        <section className="am-section">
          {!agent ? (
            <AmAgentSelect value={agentId} onChange={setAgentId} />
          ) : (
            <div className="am-agentcard">
              <Avatar src={agent.img} name={agent.name} size="lg" verified />
              <div className="am-agentcard__body">
                <span className="am-agentcard__name">
                  {agent.name}
                  <Badge variant="brand" size="sm" icon="badge-check">
                    {t("status.verified")}
                  </Badge>
                </span>
                <span className="am-agentcard__phone">
                  <Icon name="phone" size={13} />
                  {agent.phone}
                </span>
              </div>
              <button type="button" className="am-agentcard__remove" aria-label={t("admin.members.removeAgent")} onClick={() => setAgentId("")}>
                <Icon name="x" size={17} />
              </button>
            </div>
          )}
        </section>

        <section className="am-section">
          <Textarea
            label={
              <>
                {t("admin.members.notes")} <span className="am-label__opt">{t("admin.members.optional")}</span>
              </>
            }
            value={notes}
            placeholder={t("admin.members.notesPh")}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <div className="am-note">
            <Icon name="lock" size={14} />
            <span>{t("admin.members.notesHint")}</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
