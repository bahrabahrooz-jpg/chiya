"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import {
  INIT_NOTES,
  MEMBER,
  NOTE_KIND,
  PORTFOLIO,
  PROP_STATUS_META,
  REASSIGN_AGENTS,
  ROLE_META,
  STATUS_DOT,
  TIMELINE,
  VIEWINGS,
  VIEW_STATUS_META,
  type MemberAgent,
  type MemberRecord,
  type NoteItem,
  type PortfolioRow,
  type MpfViewing,
} from "./data";
import { AddMemberModal } from "../_members/add-member-modal";

const NOTE_MAX = 500;
function noteRoleLabel(role: string) {
  const r = (role || "").trim();
  if (!r) return "Note";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
}

/* ---------------- toast ---------------- */
interface ToastData { id: number; tone?: string; icon: IconName; title: string; msg: string; out?: boolean }
function ProfToast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const iconCls = "pp-toast__icon" + (toast.tone === "danger" ? " pp-toast__icon--danger" : toast.tone === "brand" ? " pp-toast__icon--brand" : "");
  return (
    <div className={`pp-toast${toast.tone === "danger" ? " pp-toast--danger" : ""}${visible && !toast.out ? " is-in" : ""}${toast.out ? " is-out" : ""}`}>
      <span className={iconCls}>
        <Icon name={toast.icon} size={20} strokeWidth={2.25} />
      </span>
      <div className="pp-toast__body">
        <p className="pp-toast__title">{toast.title}</p>
        <p className="pp-toast__msg">{toast.msg}</p>
      </div>
      <button type="button" className="pp-toast__close" aria-label="Close" onClick={onDismiss}>
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
      <div className="pp-toast__progress" />
    </div>
  );
}
function useToasts(): [ToastData[], (t: Omit<ToastData, "id">) => void, (id: number) => void] {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const push = (toast: Omit<ToastData, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t))), 5000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5380);
  };
  const dismiss = (id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  };
  return [toasts, push, dismiss];
}

/* ---------------- modals ---------------- */
function ChangeStatusModal({ current, onCancel, onConfirm }: { current: string; onCancel: () => void; onConfirm: (s: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const options = ["Active", "Suspended"];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const canConfirm = selected && selected !== current;
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <div className="pp-modal__icon pp-modal__icon--status">
          <Icon name="refresh-cw" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="status-modal-title">
          Change member status
        </h2>
        <p className="pp-modal__sublabel">Select new status</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
          {options.map((s) => (
            <button key={s} type="button" className={"pp-smodal__item" + (selected === s ? " is-selected" : "")} onClick={() => setSelected(s)}>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT[s] }} />
              <span className="pp-smodal__label">{s}</span>
              <span className="pp-smodal__spacer" />
              {current === s && <span className="pp-amodal__current-tag">Current</span>}
              {selected === s && (
                <span className="pp-smodal__check">
                  <Icon name="check" size={16} strokeWidth={2.5} />
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={"pp-modal__confirm" + (selected === "Suspended" ? " pp-modal__confirm--warn" : "")} disabled={!canConfirm} onClick={() => selected && onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />
            Change status
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignAgentModal({ current, onCancel, onConfirm }: { current: string; onCancel: () => void; onConfirm: (a: MemberAgent) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dropOpen) setDropOpen(false);
        else onCancel();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, dropOpen]);
  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  const toggleDrop = () => {
    if (!dropOpen) calcPos();
    setDropOpen((v) => !v);
  };
  useEffect(() => {
    if (!dropOpen) return;
    const close = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".pp-amodal__drop")?.contains(e.target as Node)) return;
      setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [dropOpen]);
  const selectedAgent = selected ? REASSIGN_AGENTS.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== current;
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign">
          <Icon name="user-cog" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="agent-modal-title">
          Reassign relationship agent
        </h2>
        <p className="pp-modal__sublabel">Select new agent</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selectedAgent ? (
            <>
              <Avatar src={selectedAgent.img} name={selectedAgent.name} size="sm" verified={selectedAgent.verified} />
              <span className="pp-amodal__trigger-name">{selectedAgent.name}</span>
            </>
          ) : (
            <span className="pp-amodal__trigger-placeholder">
              <Icon name="user" size={16} />
              Choose an agent…
            </span>
          )}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen && dropPos && (
          <div className="pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {REASSIGN_AGENTS.map((agent) => (
              <button
                key={agent.name}
                type="button"
                className={"pp-amodal__agent" + (selected === agent.name ? " is-selected" : "")}
                onClick={() => {
                  setSelected(agent.name);
                  setDropOpen(false);
                }}
              >
                <Avatar src={agent.img} name={agent.name} size="sm" verified={agent.verified} />
                <span className="pp-amodal__agent-name">{agent.name}</span>
                {current === agent.name && <span className="pp-amodal__current-tag">Current</span>}
                {selected === agent.name && (
                  <span className="pp-amodal__check">
                    <Icon name="check" size={16} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="pp-modal__confirm"
            disabled={!canConfirm}
            onClick={() => {
              const a = REASSIGN_AGENTS.find((x) => x.name === selected);
              if (a) onConfirm(a);
            }}
          >
            <Icon name="user-check" size={15} />
            Reassign agent
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteMemberModal({ member, onCancel, onConfirm }: { member: MemberRecord; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="del-modal-title">
          Delete member?
        </h2>
        <p className="pp-modal__body">
          Are you sure you want to delete <strong>{member.name}</strong>? This action cannot be undone and will permanently remove the account and its history.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            Delete member
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteNoteModal({ note, onCancel, onConfirm }: { note: NoteItem; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const label = noteRoleLabel(note.role).toLowerCase();
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="mpf-delnote-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="mpf-delnote-title">
          Delete note?
        </h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone and will permanently remove it from this member.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            Delete note
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- building blocks ---------------- */
function StatusBadge({ value, meta }: { value: string; meta: Record<string, { variant: BadgeVariant; icon?: IconName; dot?: boolean; cls?: string }> }) {
  const m = (meta && meta[value]) || { variant: "neutral" as const };
  return (
    <Badge variant={m.variant} size="sm" icon={m.icon} dot={m.dot} className={m.cls}>
      {value}
    </Badge>
  );
}

function SectionCard({ title, count, desc, action, flush, children }: { title: string; count?: number; desc?: string; action?: ReactNode; flush?: boolean; children: ReactNode }) {
  return (
    <section className="pd-card">
      <div className="pd-card__head">
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">
              {title}
              {count != null && <span className="pd-card__count">{count}</span>}
            </h2>
            {desc && <p className="pd-card__desc">{desc}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className={"pd-card__body" + (flush ? " pd-card__body--flush" : "")}>{children}</div>
    </section>
  );
}

function PropCell({ row, mono }: { row: { img: string; title: string; id: string; loc: string }; mono?: boolean }) {
  return (
    <div className="mpf-prop">
      <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
      <div className="mpf-prop__body">
        <div className="mpf-prop__title">{row.title}</div>
        <div className={"mpf-prop__sub" + (mono ? " mpf-prop__sub--mono" : "")}>
          {mono ? (
            row.id
          ) : (
            <>
              <Icon name="map-pin" size={12} />
              {row.loc}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceCell({ price, per }: { price: string; per?: string }) {
  return (
    <span className="mpf-price">
      {price}
      {per && <span className="mpf-price__per">{per}</span>}
    </span>
  );
}

function BasicInfo({ member, pushToast }: { member: MemberRecord; pushToast: (t: Omit<ToastData, "id">) => void }) {
  const copy = (label: string, text: string) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    pushToast({ tone: "default", icon: "copy", title: label + " copied", msg: text });
  };
  return (
    <div className="adh__details">
      <div className="adh__detail">
        <span className="adh__detail__icon">
          <Icon name="phone" size={17} />
        </span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Phone number</span>
          <span className="adh__detail__value">
            <span>{member.phone}</span>
            <button type="button" className="adh__copy" title="Copy phone number" aria-label="Copy phone number" onClick={() => copy("Phone number", member.phone)}>
              <Icon name="copy" size={13} />
            </button>
          </span>
        </div>
      </div>
      <div className="adh__detail">
        <span className="adh__detail__icon">
          <Icon name="users" size={17} />
        </span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Member types</span>
          <div className="adh__detailchips">
            {member.types.map((t) => (
              <span className={"adh__chip adh__chip--" + t.toLowerCase()} key={t}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="adh__detail">
        <span className="adh__detail__icon">
          <Icon name="mail" size={17} />
        </span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Email address</span>
          <span className="adh__detail__value">
            <span>{member.email}</span>
            <button type="button" className="adh__copy" title="Copy email address" aria-label="Copy email address" onClick={() => copy("Email address", member.email)}>
              <Icon name="copy" size={13} />
            </button>
          </span>
        </div>
      </div>
      <div className="adh__detail">
        <span className="adh__detail__icon">
          <Icon name="calendar" size={17} />
        </span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">Date added</span>
          <span className="adh__detail__value">
            <span>{member.joinedFull}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function PortfolioTable({ rows }: { rows: PortfolioRow[] }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--portfolio">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Relationship</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th">Price</span>
          <span className="mpf-th">Agent</span>
          <span className="mpf-th">Date</span>
          <span className="mpf-th mpf-th--end">Action</span>
        </div>
        {rows.map((row) => (
          <div className="mpf-trow" key={row.id + row.rel}>
            <PropCell row={row} />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Relationship</span>
              <Badge variant={(ROLE_META[row.rel] || {}).variant} size="sm">
                {row.rel}
              </Badge>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={PROP_STATUS_META} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Price</span>
              <PriceCell price={row.price} per={row.per} />
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Agent</span>
              <span className="mpf-agentcell">
                <Avatar name={row.agent} size="xs" />
                <span className="mpf-agentcell__name">{row.agent}</span>
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Date</span>
              <span className="mpf-date">{row.date}</span>
            </div>
            <div className="mpf-cell mpf-cell--end mpf-cell--action">
              <Link className="mpf-viewbtn" href={`/admin/properties/${row.id}`} title="View property" aria-label={"View " + row.title}>
                <Icon name="arrow-up-right" size={17} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewingsTable({ rows }: { rows: MpfViewing[] }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--viewings">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Requested date</span>
          <span className="mpf-th">Assigned agent</span>
          <span className="mpf-th">Status</span>
        </div>
        {rows.map((row, i) => (
          <div className="mpf-trow" key={row.id + i}>
            <PropCell row={row} />
            <div className="mpf-cell">
              <span className="mpf-cell__label">Requested date</span>
              <span className="mpf-date">{row.requested}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Assigned agent</span>
              <span className="mpf-agentcell">
                <Avatar name={row.agent} size="xs" />
                <span className="mpf-agentcell__name">{row.agent}</span>
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={VIEW_STATUS_META} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoteComposer({ spaced, initial, submitLabel, onSave, onCancel }: { spaced: boolean; initial?: string; submitLabel?: string; onSave: (t: string) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState(initial || "");
  const text = draft.trim();
  const remaining = NOTE_MAX - draft.length;
  const save = () => {
    if (text) onSave(text);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save();
    }
  };
  return (
    <div className={"pd-notecomposer" + (spaced ? " is-spaced" : "")}>
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label="New internal note" placeholder="Add a note about verification, approvals, or reminders for this member…" />
      <div className="pd-notecomposer__foot">
        <span className={"pd-notecomposer__hint" + (remaining <= 50 ? " is-low" : "")}>{remaining} characters left</span>
        <div className="pd-notecomposer__actions">
          <Button hierarchy="tertiary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button hierarchy="primary" size="sm" disabled={!text} onClick={save}>
            {submitLabel || "Add note"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotesSection({ notes, onAdd, onEdit, onDelete }: { notes: NoteItem[]; onAdd: (t: string) => void; onEdit: (i: number, t: string) => void; onDelete: (i: number) => void }) {
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const handleSave = (text: string) => {
    onAdd(text);
    setComposing(false);
  };
  return (
    <SectionCard
      title="Internal notes"
      count={notes.length}
      desc="Admin-only remarks and history. Never visible to the member."
      action={
        !composing &&
        editing == null && (
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>
            Add note
          </Button>
        )
      }
    >
      {composing && <NoteComposer spaced={notes.length > 0} onSave={handleSave} onCancel={() => setComposing(false)} />}
      {notes.length === 0
        ? !composing && (
            <div className="pd-noagent">
              <span className="pd-noagent__art">
                <Icon name="sticky-note" size={24} strokeWidth={1.6} />
              </span>
              <p>No internal notes yet. Add an admin-only note to track verification, approvals, or reminders for this member.</p>
            </div>
          )
        : (
            <div className="pd-notes">
              {notes.map((n, i) => {
                const k = NOTE_KIND[n.kind] || NOTE_KIND.note;
                if (editing === i) {
                  return (
                    <div className={"pd-noteitem " + k.cls} key={i}>
                      <NoteComposer
                        spaced={false}
                        initial={n.text}
                        submitLabel="Save note"
                        onSave={(text) => {
                          onEdit(i, text);
                          setEditing(null);
                        }}
                        onCancel={() => setEditing(null)}
                      />
                    </div>
                  );
                }
                return (
                  <div className={"pd-noteitem " + k.cls} key={i}>
                    <div className="pd-note__head">
                      <span className="pd-note__label">{noteRoleLabel(n.role)}</span>
                      <div style={{ display: "flex", gap: 2 }}>
                        <button
                          type="button"
                          className="pd-note__delete pd-note__edit"
                          aria-label={"Edit note from " + n.author}
                          title="Edit note"
                          onClick={() => {
                            setComposing(false);
                            setEditing(i);
                          }}
                        >
                          <Icon name="pencil" size={14} />
                        </button>
                        <button type="button" className="pd-note__delete" aria-label={"Delete note from " + n.author} title="Delete note" onClick={() => onDelete(i)}>
                          <Icon name="trash-2" size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="pd-note">
                      <div className="pd-note__body">
                        <p className="pd-note__text">{n.text}</p>
                        <span className="pd-note__time">{n.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
    </SectionCard>
  );
}

const TL_TONE: Record<string, string> = { brand: "#7F56D9", success: "#15B79E", info: "#2E90FA", warning: "#EAB308", error: "#F04438", gold: "#EE46BC", neutral: "#6172F3" };
function Timeline() {
  return (
    <ul className="pd-timeline">
      {TIMELINE.map((it, i) => (
        <li className="pd-tl" key={i}>
          <span className="pd-tl__dot" style={{ background: TL_TONE[it.tone], boxShadow: `0 0 0 4px color-mix(in srgb, ${TL_TONE[it.tone]} 16%, transparent)` }}>
            <Icon name={it.icon} size={13} strokeWidth={2.2} />
          </span>
          <div className="pd-tl__body">
            <div className="pd-tl__top">
              <span className="pd-tl__title">{it.title}</span>
              <span className="pd-tl__time">{it.time}</span>
            </div>
            <p className="pd-tl__desc">{it.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MemberProfileApp() {
  const [m, setM] = useState<MemberRecord>(MEMBER);
  const [status, setStatus] = useState(m.status);
  const [, setAgent] = useState<MemberAgent>(m.agent);
  const [notes, setNotes] = useState<NoteItem[]>(INIT_NOTES);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [modal, setModal] = useState<"status" | "assign" | "delete" | "edit" | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toasts, pushToast, dismissToast] = useToasts();
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [moreOpen]);

  const statusVariant: BadgeVariant = status === "Active" ? "success" : status === "Suspended" ? "error" : "neutral";

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link href="/admin/members">Members</Link>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page">{m.name}</span>
        </nav>

        <div className="pd-head__main">
          <div className="pd-head__identity">
            <Avatar src={m.img} name={m.name} size="xl" className="pd-head__avatar" />
            <div className="pd-head__intro">
              <div className="pd-head__titlerow">
                <h1 className="pd-head__title">{m.name}</h1>
                <Badge variant={statusVariant} dot>
                  {status}
                </Badge>
              </div>
              <div className="pd-head__meta">
                <span className="pd-head__metaitem pd-head__metaitem--id">
                  <Icon name="hash" size={13} />
                  {m.id}
                </span>
                <span className="pd-head__sep" />
                <span className="pd-head__metaitem">
                  <Icon name="calendar" size={14} />
                  Member since {m.joinedShort}
                </span>
              </div>
            </div>
          </div>

          <div className="pd-head__actions">
            <Button
              hierarchy="secondary"
              iconLeading="refresh-cw"
              onClick={() => {
                setMoreOpen(false);
                setModal("status");
              }}
            >
              Change status
            </Button>
            <Button
              hierarchy="primary"
              iconLeading="pencil"
              onClick={() => {
                setMoreOpen(false);
                setModal("edit");
              }}
            >
              Edit member
            </Button>
            <div className="pd-morewrap" ref={moreRef}>
              <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="true" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
                <Icon name="ellipsis" size={20} />
              </button>
              {moreOpen && (
                <div className="pd-moremenu" role="menu">
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      setModal("assign");
                    }}
                  >
                    <Icon name="user-cog" size={17} />
                    Assign agent
                  </button>
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      pushToast({ tone: "default", icon: "download", title: "Export started", msg: "Preparing a CRM summary for " + m.name + "." });
                    }}
                  >
                    <Icon name="download" size={17} />
                    Export summary
                  </button>
                  <div className="pd-moremenu__sep" />
                  <button
                    type="button"
                    className="pd-moreitem pd-moreitem--danger"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      setModal("delete");
                    }}
                  >
                    <Icon name="trash-2" size={17} />
                    Delete member
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pd-grid pd-grid--full">
        <div className="pd-grid__main">
          <SectionCard title="Basic information" desc="Identity, contact details, and preferences for this member.">
            <BasicInfo member={m} pushToast={pushToast} />
          </SectionCard>

          <SectionCard title="Real estate portfolio" count={PORTFOLIO.length} desc="Every property connected to this member as buyer, seller, landlord, or tenant." flush>
            <PortfolioTable rows={PORTFOLIO} />
          </SectionCard>

          <SectionCard title="Viewing requests" count={VIEWINGS.length} desc="Scheduled and past property viewings." flush>
            <ViewingsTable rows={VIEWINGS} />
          </SectionCard>

          <NotesSection
            notes={notes}
            onAdd={(text) => {
              setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "Just now", kind: "note", text }, ...ns]);
              pushToast({ tone: "brand", icon: "check", title: "Note added", msg: "Your internal note was saved to this member." });
            }}
            onEdit={(i, text) => {
              setNotes((ns) => ns.map((n, idx) => (idx === i ? { ...n, text, time: "Edited just now" } : n)));
              pushToast({ tone: "brand", icon: "pencil", title: "Note updated", msg: "Your changes to the internal note were saved." });
            }}
            onDelete={(i) => setNoteToDelete(i)}
          />

          <SectionCard title="Activity timeline" desc="Chronological history of this member's account.">
            <Timeline />
          </SectionCard>
        </div>
      </div>

      {modal === "status" && (
        <ChangeStatusModal
          current={status}
          onCancel={() => setModal(null)}
          onConfirm={(s) => {
            setStatus(s);
            setModal(null);
            pushToast({ tone: s === "Suspended" ? "danger" : "brand", icon: s === "Suspended" ? "circle-pause" : "circle-check", title: "Status updated", msg: m.name + " is now " + s + "." });
          }}
        />
      )}
      {modal === "assign" && (
        <AssignAgentModal
          current={m.agent.name}
          onCancel={() => setModal(null)}
          onConfirm={(a) => {
            setAgent(a);
            setModal(null);
            pushToast({ tone: "brand", icon: "user-check", title: "Agent reassigned", msg: a.name + " is now the relationship agent for " + m.name + "." });
          }}
        />
      )}
      <AddMemberModal
        open={modal === "edit"}
        mode="edit"
        initial={{ name: m.name, phone: m.phone, email: m.email }}
        onClose={() => setModal(null)}
        onSubmit={(v) => {
          setM((prev) => ({ ...prev, name: v.name.trim() || prev.name, phone: v.phone.trim() || prev.phone, email: v.email.trim() || prev.email }));
          setModal(null);
          pushToast({ tone: "brand", icon: "badge-check", title: "Member updated", msg: (v.name.trim() || m.name) + "’s profile has been updated." });
        }}
      />
      {modal === "delete" && (
        <DeleteMemberModal
          member={m}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Member deleted", msg: m.name + " has been removed from Chiya Estate." });
          }}
        />
      )}
      {noteToDelete != null && notes[noteToDelete] && (
        <DeleteNoteModal
          note={notes[noteToDelete]}
          onCancel={() => setNoteToDelete(null)}
          onConfirm={() => {
            const removed = notes[noteToDelete];
            setNotes((ns) => ns.filter((_, i) => i !== noteToDelete));
            setNoteToDelete(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Note deleted", msg: "The internal note from " + removed.author + " was removed." });
          }}
        />
      )}

      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => (
          <ProfToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
