"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeSize } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import {
  INIT_NOTES,
  NOTE_KIND,
  TIMELINE,
  VIEW_STATUS_DOT,
  VIEW_STATUS_META,
  getViewingDetail,
  noteRoleLabel,
  type NoteItem,
  type ViewingDetail,
} from "./data";
import { ScheduleModal } from "../_viewings/viewings-app";
import type { ViewingRecord } from "../_viewings/data";

const NOTE_MAX = 500;

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
function ConfirmModal({ icon, title, body, confirmLabel, confirmIcon, tone, onCancel, onConfirm }: { icon: IconName; title: string; body: ReactNode; confirmLabel: string; confirmIcon: IconName; tone: string; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const danger = tone === "danger";
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="vwd-confirm-title">
        <div className={"pp-modal__icon" + (danger ? "" : " pp-modal__icon--status")}>
          <Icon name={icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="vwd-confirm-title">
          {title}
        </h2>
        <p className="pp-modal__body">{body}</p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          {danger ? (
            <button type="button" className="pp-modal__delete" onClick={onConfirm}>
              <Icon name={confirmIcon} size={15} />
              {confirmLabel}
            </button>
          ) : (
            <button type="button" className="pp-modal__confirm" onClick={onConfirm}>
              <Icon name={confirmIcon} size={15} />
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ViewingStatusModal({ current, onCancel, onConfirm }: { current: string; onCancel: () => void; onConfirm: (s: string) => void }) {
  const [selected, setSelected] = useState<string>(current);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const options = Object.keys(VIEW_STATUS_META);
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
      if (document.querySelector(".pp-smodal__drop")?.contains(e.target as Node)) return;
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
  const canConfirm = selected && selected !== current;
  const warn = selected === "Cancelled" || selected === "No Show";
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="vwd-status-title">
        <div className="pp-modal__icon pp-modal__icon--status">
          <Icon name="refresh-cw" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="vwd-status-title">
          Change viewing status
        </h2>
        <p className="pp-modal__sublabel">Select new status</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} style={{ marginBottom: 22 }} aria-haspopup="listbox" aria-expanded={dropOpen} onClick={toggleDrop}>
          {selected ? (
            <>
              <span className="pp-smodal__dot" style={{ background: VIEW_STATUS_DOT[selected] }} />
              <span className="pp-smodal__label">{selected}</span>
            </>
          ) : (
            <span className="pp-amodal__trigger-placeholder">
              <Icon name="tag" size={16} />
              Choose a status…
            </span>
          )}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen && dropPos && (
          <div className="pp-smodal__drop pp-amodal__drop" role="listbox" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {options.map((s) => (
              <button
                key={s}
                type="button"
                className={"pp-smodal__item" + (selected === s ? " is-selected" : "")}
                onClick={() => {
                  setSelected(s);
                  setDropOpen(false);
                }}
              >
                <span className="pp-smodal__dot" style={{ background: VIEW_STATUS_DOT[s] }} />
                <span className="pp-smodal__label">{s}</span>
                <span className="pp-smodal__spacer" />
                {current === s && <span className="pp-amodal__current-tag">Current</span>}
                {selected === s && current !== s && (
                  <span className="pp-smodal__check">
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
          <button type="button" className={"pp-modal__confirm" + (warn ? " pp-modal__confirm--warn" : "")} disabled={!canConfirm} onClick={() => onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />
            Change status
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
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="vwd-delnote-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="vwd-delnote-title">
          Delete note?
        </h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone and will permanently remove it from this viewing.
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
function SectionCard({ title, count, desc, action, flush, children }: { title: string; count?: number; desc?: string; action?: ReactNode; flush?: boolean; children: ReactNode }) {
  return (
    <section className="pd-card">
      <header className="pd-card__head">
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
      </header>
      <div className={"pd-card__body" + (flush ? " pd-card__body--flush" : "")}>{children}</div>
    </section>
  );
}

function StatusBadge({ status, size }: { status: string; size?: BadgeSize }) {
  const m = VIEW_STATUS_META[status] || { variant: "neutral" as const, icon: undefined, cls: undefined };
  return (
    <Badge variant={m.variant} size={size || "sm"} icon={m.icon} className={m.cls}>
      {status}
    </Badge>
  );
}

function Fact({ icon, label, children, mono }: { icon: IconName; label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="vwd-fact">
      <span className="vwd-fact__icon">
        <Icon name={icon} size={17} />
      </span>
      <div className="vwd-fact__text">
        <span className="vwd-fact__label">{label}</span>
        <span className={"vwd-fact__value" + (mono ? " vwd-fact__value--mono" : "")}>{children}</span>
      </div>
    </div>
  );
}

function Overview({ v, status }: { v: ViewingDetail; status: string }) {
  return (
    <SectionCard title="Viewing overview" desc="Appointment summary, schedule, and record history.">
      <div className="vwd-facts">
        <Fact icon="hash" label="Viewing ID" mono>
          {v.id}
        </Fact>
        <Fact icon="circle-dot" label="Status">
          <StatusBadge status={status} />
        </Fact>
        <Fact icon="calendar" label="Date">
          {v.date}
        </Fact>
        <Fact icon="map-pin" label="Meeting location">
          {v.meetingLocation}
        </Fact>
        <Fact icon="alarm-clock" label="Time">
          {v.time} – {v.endTime}
        </Fact>
        <Fact icon="calendar-plus" label="Created">
          {v.created}
        </Fact>
        <Fact icon="clock" label="Duration">
          {v.duration}
        </Fact>
        <Fact icon="history" label="Last updated">
          {v.updated}
        </Fact>
      </div>
    </SectionCard>
  );
}

function PropertyInfo({ p, onView }: { p: ViewingDetail["property"]; onView: () => void }) {
  return (
    <SectionCard
      title="Property information"
      desc="The listing this viewing is scheduled for."
      action={
        <Button hierarchy="secondary" size="sm" iconTrailing="arrow-up-right" onClick={onView}>
          View property
        </Button>
      }
    >
      <div className="vwd-prop">
        <img className="vwd-prop__media" src={p.img} alt={p.name} loading="lazy" />
        <div className="vwd-prop__body">
          <div className="vwd-prop__titlerow">
            <span className="vwd-prop__name">{p.name}</span>
            <Badge variant={p.listing === "For sale" ? "brand" : "info"} size="sm" icon={p.listing === "For sale" ? "tag" : "key"}>
              {p.listing}
            </Badge>
          </div>
          <span className="vwd-prop__loc">
            <Icon name="map-pin" size={14} />
            {p.location}
          </span>
          <div className="vwd-prop__grid">
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Property ID</span>
              <span className="vwd-prop__cellvalue vwd-prop__cellvalue--mono">{p.id}</span>
            </div>
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Property type</span>
              <span className="vwd-prop__cellvalue">{p.type}</span>
            </div>
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Listing type</span>
              <span className="vwd-prop__cellvalue">{p.listing}</span>
            </div>
            <div className="vwd-prop__cell">
              <span className="vwd-prop__celllabel">Price</span>
              <span className="vwd-prop__cellvalue vwd-prop__price">{p.price}</span>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function ContactRow({ icon, label, value, href }: { icon: IconName; label: string; value: string; href: string }) {
  return (
    <a className="pd-contact" href={href}>
      <span className="pd-contact__icon">
        <Icon name={icon} size={16} />
      </span>
      <div className="pd-contact__text">
        <span className="pd-contact__label">{label}</span>
        <span className="pd-contact__value">{value}</span>
      </div>
      <Icon name="external-link" size={15} className="pd-contact__go" />
    </a>
  );
}

function MemberCard({ m }: { m: ViewingDetail["member"] }) {
  return (
    <SectionCard title="Member information" desc="The member who requested this viewing.">
      <div className="pd-owner">
        <Avatar name={m.name} size="lg" />
        <div className="pd-owner__id">
          <span className="pd-owner__name">{m.name}</span>
          <span className="pd-owner__type">
            <Icon name="user" size={13} />
            {m.role}
          </span>
        </div>
      </div>
      <div className="pd-contactlist">
        <ContactRow icon="phone" label="Phone" value={m.phone} href={"tel:" + m.phone.replace(/\s/g, "")} />
        <ContactRow icon="mail" label="Email" value={m.email} href={"mailto:" + m.email} />
      </div>
    </SectionCard>
  );
}

function AgentCard({ a, href, onReassign }: { a: ViewingDetail["agent"]; href: string; onReassign: () => void }) {
  const phoneHref = "tel:" + a.phone.replace(/\s/g, "");
  const waHref = "https://wa.me/" + a.phone.replace(/[^\d]/g, "");
  return (
    <SectionCard
      title="Assigned agent"
      desc="Manages viewings and enquiries."
      action={
        <Button hierarchy="tertiary" size="sm" iconLeading="user-cog" onClick={onReassign}>
          Reassign
        </Button>
      }
    >
      <Link className="pd-agent pd-agent--link" href={href} title={"View " + a.name + "’s details"}>
        <Avatar src={a.img} name={a.name} size="xl" verified={a.verified} />
        <div className="pd-agent__id">
          <span className="pd-agent__nrow">
            <span className="pd-agent__name">{a.name}</span>
            {a.verified ? (
              <Badge variant="brand" size="sm" icon="badge-check">
                Verified
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" icon="clock">
                Pending
              </Badge>
            )}
          </span>
          <span className="pd-agent__meta">
            <span className="pd-agent__broker">
              <Icon name="building-2" size={15} />
              {a.agency}
            </span>
            <span className="pd-agent__rate">
              <Icon name="star" size={15} />
              {a.rating}
            </span>
            <span className="pd-agent__reviews">({a.reviews} reviews)</span>
          </span>
        </div>
        <Icon name="chevron-right" size={18} className="pd-agent__go" />
      </Link>
      <div className="pd-agent__actions">
        <a className="pd-agentbtn" href={phoneHref}>
          <Icon name="phone" size={18} />
          Call
        </a>
        <a className="pd-agentbtn" href={waHref} target="_blank" rel="noopener noreferrer">
          <Icon name="message-circle" size={18} />
          WhatsApp
        </a>
      </div>
      <p className="pd-agent__trust">
        <Icon name="shield-check" size={15} />
        Verified agent · no obligation · ID-checked
      </p>
    </SectionCard>
  );
}

const TL_TONE: Record<string, string> = { brand: "var(--green-700)", gold: "var(--gold-500)", success: "var(--success-600)", info: "var(--info-600)", error: "var(--error-600)", neutral: "var(--gray-500)" };
function Timeline() {
  return (
    <ul className="pd-timeline">
      {TIMELINE.map((it, i) => (
        <li className="pd-tl" key={i}>
          <span className="pd-tl__dot" style={{ background: TL_TONE[it.tone] }}>
            <Icon name={it.icon} size={14} strokeWidth={2.2} />
          </span>
          <div className="pd-tl__body">
            <div className="pd-tl__top">
              <span className="pd-tl__title">{it.title}</span>
              <span className="pd-tl__time">{it.time}</span>
            </div>
            <p className="pd-tl__desc">{it.desc}</p>
            <span className="pd-tl__by">
              <Icon name="user-round" size={13} />
              by <b>{it.by}</b>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AppointmentDetails({ v }: { v: ViewingDetail }) {
  return (
    <SectionCard title="Appointment details" desc="How the viewing will be conducted.">
      <div className="vwd-appt">
        <div className="vwd-apptgrid">
          <div className="vwd-apptitem">
            <span className="vwd-apptitem__icon">
              <Icon name={v.contactIcon} size={17} />
            </span>
            <div className="vwd-apptitem__text">
              <span className="vwd-apptitem__label">Preferred contact method</span>
              <span className="vwd-apptitem__value">{v.contactMethod}</span>
            </div>
          </div>
          <div className="vwd-apptitem">
            <span className="vwd-apptitem__icon">
              <Icon name="bell" size={17} />
            </span>
            <div className="vwd-apptitem__text">
              <span className="vwd-apptitem__label">Reminder sent</span>
              <span className="vwd-apptitem__value">
                {v.reminderSent ? (
                  <Badge variant="success" size="sm" icon="check">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">
                    No
                  </Badge>
                )}
              </span>
            </div>
          </div>
          <div className="vwd-apptitem">
            <span className="vwd-apptitem__icon">
              <Icon name="calendar-clock" size={17} />
            </span>
            <div className="vwd-apptitem__text">
              <span className="vwd-apptitem__label">Reminder time</span>
              <span className="vwd-apptitem__value" style={{ fontVariantNumeric: "tabular-nums" }}>
                {v.reminderSent ? v.reminderWhen : "—"}
              </span>
            </div>
          </div>
        </div>
        <div className="vwd-noteblock">
          <span className="vwd-noteblock__label">
            <Icon name="message-square-text" size={13} />
            Notes
          </span>
          <p className="vwd-noteblock__text">{v.notes}</p>
        </div>
      </div>
    </SectionCard>
  );
}

function NoteComposer({ spaced, initial, submitLabel, onSave, onCancel }: { spaced?: boolean; initial?: string; submitLabel?: string; onSave: (t: string) => void; onCancel: () => void }) {
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
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label="Internal note" placeholder="Add an admin-only note about this viewing — access arrangements, member preferences, reminders…" />
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
      desc="Admin-only remarks. Never visible to the member or the agent."
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
              <p>No internal notes yet. Add an admin-only note to track access details, member preferences, or reminders for this viewing.</p>
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
                          aria-label="Edit note"
                          title="Edit note"
                          onClick={() => {
                            setComposing(false);
                            setEditing(i);
                          }}
                        >
                          <Icon name="pencil" size={14} />
                        </button>
                        <button type="button" className="pd-note__delete" aria-label="Delete note" title="Delete note" onClick={() => onDelete(i)}>
                          <Icon name="trash-2" size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="pd-note">
                      <div className="pd-note__body">
                        <p className="pd-note__text">{n.text}</p>
                        <span className="pd-note__time">
                          {n.author} · {n.time}
                        </span>
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

export function ViewingDetailApp() {
  const router = useRouter();
  const params = useParams();
  const id = String((params?.id as string) ?? "");
  const base = useMemo(() => getViewingDetail(id), [id]);
  const [v, setV] = useState<ViewingDetail>(base);
  const [status, setStatus] = useState(base.status);
  // reset when navigating to a different viewing
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setV(base);
    setStatus(base.status);
  }
  const [modal, setModal] = useState<"status" | "cancel" | "delete" | "edit" | null>(null);
  const [notes, setNotes] = useState<NoteItem[]>(INIT_NOTES);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
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

  const editViewing = () => {
    setMoreOpen(false);
    setModal("edit");
  };
  const editRecord: ViewingRecord = {
    id: v.id,
    property: { title: v.property.name, location: v.property.location, img: v.property.img },
    member: v.member.name,
    agent: v.agent.name,
    date: v.date,
    time: v.time,
    status,
  };
  const closed = status === "Completed" || status === "Cancelled";

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link href="/admin/viewings">Viewings</Link>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page">{v.id}</span>
        </nav>

        <div className="pd-head__main">
          <div className="pd-head__intro">
            <div className="pd-head__titlerow">
              <h1 className="pd-head__title">{v.id}</h1>
              <StatusBadge status={status} size="md" />
            </div>
            <div className="pd-head__meta">
              <span className="pd-head__metaitem pd-head__metaitem--accent">
                <Icon name="calendar" size={14} />
                {v.dateLong}
              </span>
              <span className="pd-head__sep" />
              <span className="pd-head__metaitem pd-head__metaitem--accent">
                <Icon name="clock" size={14} />
                {v.time} – {v.endTime}
              </span>
              <span className="pd-head__sep" />
              <span className="pd-head__metaitem">
                <Icon name="hourglass" size={14} />
                {v.duration}
              </span>
            </div>
          </div>

          <div className="pd-head__actions">
            <Button
              hierarchy="secondary"
              size="md"
              iconLeading="refresh-cw"
              onClick={() => {
                setMoreOpen(false);
                setModal("status");
              }}
            >
              Change status
            </Button>
            <Button hierarchy="primary" size="md" iconLeading="pencil" onClick={editViewing}>
              Edit viewing
            </Button>
            <div className="pd-morewrap" ref={moreRef}>
              <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen((x) => !x)}>
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
                      editViewing();
                    }}
                  >
                    <Icon name="calendar-range" size={17} />
                    Reschedule
                  </button>
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    onClick={() => {
                      setMoreOpen(false);
                      pushToast({ tone: "default", icon: "send", title: "Reminder sent", msg: "A reminder was sent to " + v.member.name + "." });
                    }}
                  >
                    <Icon name="bell" size={17} />
                    Send reminder
                  </button>
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    disabled={closed}
                    onClick={() => {
                      setMoreOpen(false);
                      setModal("cancel");
                    }}
                  >
                    <Icon name="circle-x" size={17} />
                    Cancel viewing
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
                    Delete viewing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="pd-grid">
        <div className="pd-grid__main">
          <PropertyInfo p={v.property} onView={() => router.push(`/admin/properties/${v.property.id}`)} />
          <Overview v={v} status={status} />
          <AppointmentDetails v={v} />
          <SectionCard title="Timeline" desc="Chronological history of this viewing.">
            <Timeline />
          </SectionCard>
          <NotesSection
            notes={notes}
            onAdd={(text) => {
              setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "Just now", kind: "note", text }, ...ns]);
              pushToast({ tone: "brand", icon: "check", title: "Note added", msg: "Your internal note was saved to this viewing." });
            }}
            onEdit={(i, text) => {
              setNotes((ns) => ns.map((n, idx) => (idx === i ? { ...n, text, time: "Edited just now" } : n)));
              pushToast({ tone: "brand", icon: "pencil", title: "Note updated", msg: "Your changes to the internal note were saved." });
            }}
            onDelete={(i) => setNoteToDelete(i)}
          />
        </div>

        <aside className="pd-grid__aside">
          <MemberCard m={v.member} />
          <AgentCard a={v.agent} href={`/admin/agents/${v.agent.id}`} onReassign={() => pushToast({ tone: "default", icon: "user-cog", title: "Reassign agent", msg: "Use the property page to reassign the agent for this listing." })} />
        </aside>
      </div>

      <ScheduleModal
        open={modal === "edit"}
        editViewing={editRecord}
        onClose={() => setModal(null)}
        onSuccess={(rec) => {
          setV((prev) => ({
            ...prev,
            date: rec.date,
            time: rec.time,
            property: { ...prev.property, name: rec.property.title, location: rec.property.location, img: rec.property.img },
            member: { ...prev.member, name: rec.member },
            agent: { ...prev.agent, name: rec.agent },
          }));
          pushToast({ tone: "brand", icon: "badge-check", title: "Viewing updated", msg: v.id + "’s details have been updated." });
        }}
      />
      {modal === "status" && (
        <ViewingStatusModal
          current={status}
          onCancel={() => setModal(null)}
          onConfirm={(next) => {
            setStatus(next);
            setModal(null);
            const meta = VIEW_STATUS_META[next] || {};
            const danger = next === "Cancelled" || next === "No Show";
            pushToast({ tone: danger ? "danger" : "brand", icon: meta.icon || "refresh-cw", title: "Status updated", msg: v.id + " is now marked as " + next + "." });
          }}
        />
      )}
      {modal === "cancel" && (
        <ConfirmModal
          icon="circle-x"
          title="Cancel this viewing?"
          body={
            <>
              This will cancel the viewing of <strong>{v.property.name}</strong> scheduled for{" "}
              <strong>
                {v.date}, {v.time}
              </strong>
              . The member and agent will be notified.
            </>
          }
          confirmLabel="Cancel viewing"
          confirmIcon="circle-x"
          tone="danger"
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setStatus("Cancelled");
            setModal(null);
            pushToast({ tone: "danger", icon: "circle-x", title: "Viewing cancelled", msg: v.id + " has been cancelled." });
          }}
        />
      )}
      {modal === "delete" && (
        <ConfirmModal
          icon="trash-2"
          title="Delete viewing?"
          body={
            <>
              Are you sure you want to delete <strong>{v.id}</strong>? This action cannot be undone and will permanently remove the appointment and its history.
            </>
          }
          confirmLabel="Delete viewing"
          confirmIcon="trash-2"
          tone="danger"
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Viewing deleted", msg: v.id + " has been removed. Returning to Viewings…" });
            setTimeout(() => router.push("/admin/viewings"), 1400);
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
