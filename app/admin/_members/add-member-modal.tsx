"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { AM_AGENTS } from "./data";

function AmAgentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
        Assigned agent <span className="am-label__opt">(Optional)</span>
      </label>
      <button type="button" ref={btnRef} className={"am-amodal__trigger" + (open ? " is-open" : "")} onClick={toggle}>
        <span className="am-amodal__trigger-placeholder">
          <Icon name="user" size={16} />
          Select agent
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
        Cancel
      </Button>
      <Button
        hierarchy="primary"
        size="lg"
        disabled={!canSubmit}
        onClick={() => onSubmit?.({ name, phone, email, agentId, notes })}
      >
        {isEdit ? "Save changes" : "Add member"}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      icon="user-plus"
      title={isEdit ? "Edit member" : "Add member"}
      subtitle={isEdit ? "Update member information and assignments." : "Create a new member profile."}
      footer={footer}
      className="am-modal"
    >
      <div className="am-form">
        <section className="am-section">
          <div className="am-grid">
            <Input label="Full name" value={name} autoFocus iconLeading="user" placeholder="e.g. Karwan Mahmoud" onChange={(e) => setName(e.target.value)} />
            <div className="am-grid am-grid--2">
              <Input label="Phone number" value={phone} iconLeading="phone" inputMode="tel" placeholder="+964 750 000 0000" onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email address" value={email} iconLeading="mail" type="email" placeholder="name@email.com" onChange={(e) => setEmail(e.target.value)} />
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
                    Verified
                  </Badge>
                </span>
                <span className="am-agentcard__phone">
                  <Icon name="phone" size={13} />
                  {agent.phone}
                </span>
              </div>
              <button type="button" className="am-agentcard__remove" aria-label="Remove assigned agent" onClick={() => setAgentId("")}>
                <Icon name="x" size={17} />
              </button>
            </div>
          )}
        </section>

        <section className="am-section">
          <Textarea
            label={
              <>
                Notes <span className="am-label__opt">(Optional)</span>
              </>
            }
            value={notes}
            placeholder="Add context about this member — preferences, history, or anything the team should know."
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
          <div className="am-note">
            <Icon name="lock" size={14} />
            <span>Optional · visible only to staff and administrators.</span>
          </div>
        </section>
      </div>
    </Modal>
  );
}
