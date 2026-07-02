"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { StatCard } from "@/components/data/stat-card";
import {
  AGENT,
  INIT_NOTES,
  KPIS,
  LISTINGS,
  LISTING_STATUS_META,
  LISTING_TYPE_META,
  MEMBERS,
  MEMBER_STATUS_META,
  NOTE_KIND,
  RATING_BARS,
  REVIEWS,
  ROLE_META,
  STATUS_DOT,
  TIMELINE,
  VIEWINGS,
  VIEW_STATUS_META,
  buildAgentMembers,
  buildKpis,
  buildListings,
  toDetailAgent,
  type AgentDetail,
  type ListingRow,
  type MemberRow,
  type NoteItem,
  type AvViewing,
} from "./data";
import { EditAgentModal, type AgentEditSeed } from "../_shared/agent-edit-modal";
import { useProperties } from "../_shared/properties-store";

const EXPERIENCE_BUCKETS: { max: number; value: string }[] = [
  { max: 1, value: "<1" },
  { max: 2, value: "1-2" },
  { max: 5, value: "3-5" },
  { max: 10, value: "6-10" },
];
function experienceBucket(years: number): string {
  return EXPERIENCE_BUCKETS.find((b) => years <= b.max)?.value ?? "10+";
}

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
          Change agent status
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

function DeleteAgentModal({ agent, onCancel, onConfirm }: { agent: AgentDetail; onCancel: () => void; onConfirm: () => void }) {
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
          Delete agent?
        </h2>
        <p className="pp-modal__body">
          Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone and will permanently remove the agent profile and unassign their listings and members.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            Delete agent
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
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="ad-delnote-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="ad-delnote-title">
          Delete note?
        </h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone and will permanently remove it from this agent.
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
function StatusBadge({ value, meta }: { value: string; meta: Record<string, { variant: import("@/components/ui/badge").BadgeVariant; icon?: IconName; dot?: boolean; cls?: string }> }) {
  const m = (meta && meta[value]) || { variant: "neutral" as const };
  return (
    <Badge variant={m.variant} size="sm" icon={m.icon} dot={m.dot} className={m.cls}>
      {value}
    </Badge>
  );
}

function SectionCard({ title, count, desc, action, feature, flush, children }: { title: string; count?: number; desc?: string; action?: ReactNode; feature?: boolean; flush?: boolean; children: ReactNode }) {
  return (
    <section className={"pd-card" + (feature ? " pd-card--feature" : "")}>
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

function PropCell({ row }: { row: ListingRow }) {
  return (
    <div className="mpf-prop">
      <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
      <div className="mpf-prop__body">
        <div className="mpf-prop__title">{row.title}</div>
        <div className="mpf-prop__sub mpf-prop__sub--mono">{row.id}</div>
      </div>
    </div>
  );
}

function ProfileHero({ agent, pushToast }: { agent: AgentDetail; pushToast: (t: Omit<ToastData, "id">) => void }) {
  const copy = (label: string, text: string) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    pushToast({ tone: "default", icon: "copy", title: label + " copied", msg: text });
  };
  return (
    <div className="adh">
      <div className="pd-card__head" style={{ margin: "-26px -26px 0", padding: "18px 22px", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">Basic informations</h2>
            <p className="pd-card__desc">Identity, contact details and verification for this agent.</p>
          </div>
        </div>
      </div>
      <div className="adh__body">
        <div className="adh__details adh__details--top">
          <div className="adh__detail">
            <span className="adh__detail__icon">
              <Icon name="phone" size={17} />
            </span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Phone number</span>
              <span className="adh__detail__value">
                <span>{agent.phone}</span>
                <button type="button" className="adh__copy" title="Copy phone number" aria-label="Copy phone number" onClick={() => copy("Phone number", agent.phone)}>
                  <Icon name="copy" size={13} />
                </button>
              </span>
            </div>
          </div>
          <div className="adh__detail">
            <span className="adh__detail__icon">
              <Icon name="map-pin" size={17} />
            </span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Service areas</span>
              <div className="adh__detailchips">
                {agent.areas.map((a) => (
                  <span className="adh__chip" key={a}>
                    {a}
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
                <span>{agent.email}</span>
                <button type="button" className="adh__copy" title="Copy email address" aria-label="Copy email address" onClick={() => copy("Email address", agent.email)}>
                  <Icon name="copy" size={13} />
                </button>
              </span>
            </div>
          </div>
          <div className="adh__detail">
            <span className="adh__detail__icon">
              <Icon name="languages" size={17} />
            </span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Languages</span>
              <div className="adh__detailchips">
                {agent.languages.map((l) => (
                  <span className="adh__chip" key={l}>
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="adh__detail">
            <span className="adh__detail__icon">
              <Icon name="award" size={17} />
            </span>
            <div className="adh__detail__text">
              <span className="adh__detail__label">Experience</span>
              <span className="adh__detail__value">
                <span>{agent.experience} years</span>
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
                <span>{agent.joinedFull}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsTable({ rows }: { rows: ListingRow[] }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--listings">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Location</span>
          <span className="mpf-th">Type</span>
          <span className="mpf-th">Owner</span>
          <span className="mpf-th">Listing</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th">Price</span>
          <span className="mpf-th">Date added</span>
          <span className="mpf-th mpf-th--end">Actions</span>
        </div>
        {rows.map((row) => {
          // "area, city" → city only, to match the main properties table.
          const city = row.loc.split(",").pop()?.trim() || row.loc;
          return (
            <div className="mpf-trow" key={row.id}>
              <PropCell row={row} />
              <div className="mpf-cell">
                <span className="mpf-cell__label">Location</span>
                <span className="mpf-prop__sub mpf-loc">
                  <Icon name="map-pin" size={12} />
                  {city}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Type</span>
                <span className="mpf-type">{row.propertyType}</span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Owner</span>
                <span className="mpf-owner">{row.owner}</span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Listing</span>
                <Badge variant={(LISTING_TYPE_META[row.type] || {}).variant} size="sm">
                  {row.type}
                </Badge>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Status</span>
                <StatusBadge value={row.status} meta={LISTING_STATUS_META} />
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Price</span>
                <span className="mpf-price">
                  {row.price}
                  {row.per && <span className="mpf-price__per">{row.per}</span>}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Date added</span>
                <span className="mpf-date">{row.date}</span>
              </div>
              <div className="mpf-cell mpf-cell--end mpf-cell--action">
                <RowMenu href={`/admin/properties/${row.id}`} label="View property" icon="building-2" ariaName={row.title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MembersTable({ rows }: { rows: MemberRow[] }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--amembers">
        <div className="mpf-thead">
          <span className="mpf-th">Member</span>
          <span className="mpf-th">Roles</span>
          <span className="mpf-th">Phone</span>
          <span className="mpf-th">Joined</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th mpf-th--end">Actions</span>
        </div>
        {rows.map((row) => (
          <div className="mpf-trow" key={row.id}>
            <div className="mpf-person">
              <Avatar src={row.img} name={row.name} size="md" />
              <div className="mpf-person__body">
                <span className="mpf-person__name">{row.name}</span>
                <span className="mpf-person__id">{row.id}</span>
              </div>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Roles</span>
              <span className="mpf-roletags">
                {row.roles.map((r) => (
                  <Badge key={r} variant="neutral" className={(ROLE_META[r] || {}).cls} size="sm">
                    {r}
                  </Badge>
                ))}
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Phone</span>
              <span className="mpf-memphone">
                <Icon name="phone" size={13} />
                {row.phone}
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Joined</span>
              <span className="mpf-date">{row.activity}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">Status</span>
              <StatusBadge value={row.status} meta={MEMBER_STATUS_META} />
            </div>
            <div className="mpf-cell mpf-cell--end mpf-cell--action">
              <RowMenu href={`/admin/members/${row.id}`} label="View member" icon="user" ariaName={row.name} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Per-row kebab menu (mirrors the main properties / members tables). Portalled
   to <body> so the horizontally-scrolling table can't clip it. */
function RowMenu({ href, label, icon, ariaName }: { href: string; label: string; icon: IconName; ariaName: string }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const calc = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 200) });
  };
  const toggle = () => {
    if (!open) calc();
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".mpf-rowmenu")?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]);
  return (
    <>
      <button ref={btnRef} type="button" className="mpf-kebab" aria-label={"Actions for " + ariaName} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
        <Icon name="more-horizontal" size={18} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div className="ax-menu mpf-rowmenu" role="menu" style={{ position: "fixed", top: pos.top, left: pos.left, width: 200 }}>
            <div className="ax-menu__sect">
              <Link className="ax-menu-item" role="menuitem" href={href} onClick={() => setOpen(false)}>
                <Icon name={icon} size={17} />
                {label}
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function ViewingsTable({ rows }: { rows: AvViewing[] }) {
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--aviewings">
        <div className="mpf-thead">
          <span className="mpf-th">Property</span>
          <span className="mpf-th">Location</span>
          <span className="mpf-th">Member</span>
          <span className="mpf-th">Date &amp; time</span>
          <span className="mpf-th">Status</span>
          <span className="mpf-th mpf-th--end">Actions</span>
        </div>
        {rows.map((row, i) => {
          const [date, time] = row.when.split(" · ");
          // "area, city" → city only, to match the other tables.
          const city = row.loc.split(",").pop()?.trim() || row.loc;
          return (
            <div className="mpf-trow" key={row.id + i}>
              <div className="mpf-prop">
                <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
                <div className="mpf-prop__body">
                  <div className="mpf-prop__title">{row.title}</div>
                  <div className="mpf-prop__sub mpf-prop__sub--mono">{row.id}</div>
                </div>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Location</span>
                <span className="mpf-prop__sub mpf-loc">
                  <Icon name="map-pin" size={12} />
                  {city}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Member</span>
                <span className="mpf-memcell">
                  <Avatar src={row.memberImg} name={row.member} size="sm" />
                  <span className="mpf-memcell__name">{row.member}</span>
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Date &amp; time</span>
                <span className="mpf-dt">
                  <span className="mpf-dt__date">{date}</span>
                  {time && (
                    <span className="mpf-dt__time">
                      <Icon name="clock" size={11} />
                      {time}
                    </span>
                  )}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Status</span>
                <StatusBadge value={row.status} meta={VIEW_STATUS_META} />
              </div>
              <div className="mpf-cell mpf-cell--end mpf-cell--action">
                <RowMenu href={`/admin/properties/${row.id}`} label="View property" icon="building-2" ariaName={row.title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stars({ n, size }: { n: number; size?: number }) {
  return (
    <span className="adr-card__stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size || 15} strokeWidth={1.6} style={{ color: i <= n ? "var(--brand-accent)" : "var(--gray-300)", fill: i <= n ? "var(--brand-accent)" : "transparent" }} />
      ))}
    </span>
  );
}

function Reviews({ agent }: { agent: AgentDetail }) {
  return (
    <div className="adr">
      <div className="adr__summary">
        <div className="adr__big">{agent.rating}</div>
        <span className="adr__stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <Icon key={i} name="star" size={17} strokeWidth={1.6} className={i <= Math.round(agent.rating) ? "" : "is-off"} style={{ fill: i <= Math.round(agent.rating) ? "var(--brand-accent)" : "transparent" }} />
          ))}
        </span>
        <div className="adr__count">Based on {agent.reviews} reviews</div>
        <div className="adr__bars">
          {RATING_BARS.map((b) => (
            <div className="adr__barrow" key={b.star}>
              <span className="adr__barlbl">
                {b.star}
                <Icon name="star" size={11} style={{ fill: "var(--brand-accent)" }} />
              </span>
              <span className="adr__bartrack">
                <span className="adr__barfill" style={{ width: b.pct + "%" }} />
              </span>
              <span className="adr__barpct">{b.pct}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="adr__list">
        {REVIEWS.map((r, i) => (
          <article className="adr-card" key={i}>
            <div className="adr-card__head">
              <Avatar name={r.name} size="md" />
              <div className="adr-card__id">
                <div className="adr-card__name">{r.name}</div>
                <div className="adr-card__deal">{r.deal}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Stars n={r.stars} size={14} />
                <div className="adr-card__when">{r.when}</div>
              </div>
            </div>
            <p className="adr-card__text">“{r.text}”</p>
          </article>
        ))}
      </div>
    </div>
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
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label="New internal note" placeholder="Add a note about verification, performance, or reminders for this agent…" />
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
      desc="Admin-only remarks and history. Never visible to the agent."
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
              <p>No internal notes yet. Add an admin-only note to track verification, performance, or reminders for this agent.</p>
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

export function AgentDetailApp() {
  const { agents, members, properties } = useProperties();
  const params = useParams();
  const id = String((params?.id as string) ?? "");
  const catalogAgent = useMemo(() => agents.find((ag) => ag.id === id), [agents, id]);
  const resolved = useMemo(() => (catalogAgent ? toDetailAgent(catalogAgent) : AGENT), [catalogAgent]);
  const kpis = useMemo(() => (catalogAgent ? buildKpis(catalogAgent) : KPIS), [catalogAgent]);
  const listings = useMemo(() => (catalogAgent ? buildListings(properties, catalogAgent.name) : LISTINGS), [catalogAgent, properties]);
  const agentMembers = useMemo(() => (catalogAgent ? buildAgentMembers(properties, members, catalogAgent.name) : MEMBERS), [catalogAgent, properties, members]);

  const [a, setA] = useState<AgentDetail>(resolved);
  const [status, setStatus] = useState(resolved.status);
  const [modal, setModal] = useState<"status" | "delete" | "edit" | null>(null);
  // reset editable state when navigating to a different agent
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setA(resolved);
    setStatus(resolved.status);
  }
  const [moreOpen, setMoreOpen] = useState(false);
  const [notes, setNotes] = useState<NoteItem[]>(INIT_NOTES);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
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

  const editAgent = () => {
    setMoreOpen(false);
    setModal("edit");
  };
  const handleSaveEdit = (values: AgentEditSeed) => {
    setA((prev) => ({ ...prev, name: values.name, email: values.email, phone: values.phone || prev.phone, img: values.img ?? prev.img, languages: values.languages, areas: values.areas, status: values.status }));
    setStatus(values.status);
    setModal(null);
    pushToast({ tone: "brand", icon: "badge-check", title: "Agent updated", msg: values.name + "’s profile has been updated." });
  };
  const statusVariant = status === "Active" ? "success" : "error";

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link href="/admin/agents">Agents</Link>
          <Icon name="chevron-right" size={14} />
          <span aria-current="page">{a.name}</span>
        </nav>

        <div className="pd-head__main">
          <div className="pd-head__lead">
            <Avatar src={a.img} name={a.name} size="xl" verified />
            <div className="pd-head__intro">
              <div className="pd-head__titlerow">
                <h1 className="pd-head__title">{a.name}</h1>
                <Badge variant={statusVariant} dot>
                  {status}
                </Badge>
                <Badge variant={a.verification === "Verified" ? "brand" : "warning"} icon={a.verification === "Verified" ? "badge-check" : "clock"}>
                  {a.verification}
                </Badge>
              </div>
              <div className="pd-head__meta">
                <span className="pd-head__metaitem pd-head__metaitem--id">
                  <Icon name="hash" size={13} />
                  {a.id}
                </span>
                <span className="pd-head__sep" />
                <span className="pd-head__metaitem">
                  <Icon name="briefcase" size={14} />
                  {a.title}
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
            <Button hierarchy="primary" iconLeading="pencil" onClick={editAgent}>
              Edit agent
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
                      pushToast({ tone: "brand", icon: "badge-check", title: "Verification", msg: "Opening verification review for " + a.name + "." });
                    }}
                  >
                    <Icon name="shield-check" size={17} />
                    Manage verification
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
                    Delete agent
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="pd-card" style={{ marginBottom: 22 }}>
        <ProfileHero agent={a} pushToast={pushToast} />
      </section>

      <SectionCard title="Performance summary" desc="Listing, transaction, and conversion metrics for this agent.">
        <div className="adk">
          {kpis.map((k) => (
            <StatCard key={k.key} label={k.label} value={k.value} icon={k.icon} tone={k.tone} sub={k.sub} />
          ))}
        </div>
      </SectionCard>

      <div style={{ height: 22 }} />

      <div className="pd-grid__main">
        <SectionCard
          title="Assigned listings"
          count={listings.length}
          desc="Properties currently managed by this agent."
          action={
            <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href="/admin/properties" className="agt-linkbtn">
              View all
            </Button>
          }
          flush
        >
          {listings.length > 0 ? (
            <ListingsTable rows={listings} />
          ) : (
            <div className="pd-noagent">
              <span className="pd-noagent__art">
                <Icon name="building-2" size={24} strokeWidth={1.6} />
              </span>
              <p>No listings are assigned to this agent yet.</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Assigned members"
          count={agentMembers.length}
          desc="Clients this agent manages across buying, selling, and renting."
          action={
            <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href="/admin/members" className="agt-linkbtn">
              View all
            </Button>
          }
          flush
        >
          {agentMembers.length > 0 ? (
            <MembersTable rows={agentMembers} />
          ) : (
            <div className="pd-noagent">
              <span className="pd-noagent__art">
                <Icon name="users" size={24} strokeWidth={1.6} />
              </span>
              <p>No members are linked to this agent yet.</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Viewings"
          count={VIEWINGS.length}
          desc="Scheduled and completed property viewings hosted by this agent."
          action={
            <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href="/admin/viewings" className="agt-linkbtn">
              View all
            </Button>
          }
          flush
        >
          <ViewingsTable rows={VIEWINGS} />
        </SectionCard>

        <SectionCard
          title="Reviews"
          count={a.reviews}
          desc="Feedback from members this agent has worked with."
          action={
            <Button
              hierarchy="link"
              size="sm"
              iconTrailing="arrow-right"
              className="agt-linkbtn"
              onClick={() => pushToast({ tone: "brand", icon: "star", title: "Reviews", msg: "Opening all reviews for " + a.name + "." })}
            >
              View all
            </Button>
          }
        >
          <Reviews agent={a} />
        </SectionCard>

        <NotesSection
          notes={notes}
          onAdd={(text) => {
            setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "Just now", kind: "note", text }, ...ns]);
            pushToast({ tone: "brand", icon: "check", title: "Note added", msg: "Your internal note was saved to this agent." });
          }}
          onEdit={(i, text) => {
            setNotes((ns) => ns.map((n, idx) => (idx === i ? { ...n, text, time: "Edited just now" } : n)));
            pushToast({ tone: "brand", icon: "pencil", title: "Note updated", msg: "Your changes to the internal note were saved." });
          }}
          onDelete={(i) => setNoteToDelete(i)}
        />

        <SectionCard
          title="Activity timeline"
          desc="Chronological admin history for this agent."
          action={
            <Button
              hierarchy="link"
              size="sm"
              iconTrailing="arrow-right"
              className="agt-linkbtn"
              onClick={() => pushToast({ tone: "brand", icon: "history", title: "Activity", msg: "Opening full activity history for " + a.name + "." })}
            >
              View all
            </Button>
          }
        >
          <Timeline />
        </SectionCard>
      </div>

      {modal === "status" && (
        <ChangeStatusModal
          current={status}
          onCancel={() => setModal(null)}
          onConfirm={(s) => {
            setStatus(s);
            setModal(null);
            pushToast({ tone: s === "Suspended" ? "danger" : "brand", icon: s === "Suspended" ? "circle-pause" : "circle-check", title: "Status updated", msg: a.name + " is now " + s + "." });
          }}
        />
      )}
      {modal === "edit" && (
        <EditAgentModal
          seed={{
            img: a.img || null,
            name: a.name,
            phone: a.phone,
            email: a.email,
            experience: experienceBucket(a.experience),
            languages: a.languages,
            areas: a.areas,
            status,
          }}
          onCancel={() => setModal(null)}
          onSave={handleSaveEdit}
        />
      )}
      {modal === "delete" && (
        <DeleteAgentModal
          agent={a}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            pushToast({ tone: "danger", icon: "trash-2", title: "Agent deleted", msg: a.name + " has been removed from Chiya Estate." });
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
