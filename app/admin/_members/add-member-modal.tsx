"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useLang } from "@/lib/i18n";
import { AM_AGENTS } from "./data";

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

export interface MemberInitial {
  name?: string;
  phone?: string;
  email?: string;
  agentId?: string;
  notes?: string;
}

export interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit?: (v: { name: string; phone: string; email: string; agentId: string; notes: string }) => void;
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

  const agent = AM_AGENTS.find((a) => a.id === agentId) || null;
  const canSubmit = name.trim().length > 0 && phone.trim().length > 0 && email.trim().length > 0;

  const footer = (
    <>
      <Button hierarchy="secondary" size="lg" onClick={onClose}>
        {t("admin.topbar.cancel")}
      </Button>
      <Button
        hierarchy="primary"
        size="lg"
        disabled={!canSubmit}
        onClick={() => onSubmit?.({ name, phone, email, agentId, notes })}
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
              <Input label={t("admin.members.emailAddr")} value={email} iconLeading="mail" type="email" placeholder="name@email.com" onChange={(e) => setEmail(e.target.value)} />
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
