"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import {
  AGENTS_LIST,
  STATUS_DOT_COLOR,
  STATUS_META,
  STATUS_OPTIONS,
  VIEWING_STATUS,
  fmtUSD,
  getProperty,
  getViewings,
  type DetailAgent,
  type DetailProperty,
  type NoteItem,
} from "./data";

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin" };

function nowStamp() {
  const d = new Date();
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/* ---------------- toast ---------------- */
interface ToastData { id: number; tone?: "danger" | "brand" | "success"; icon: IconName; title: string; msg: string; out?: boolean; onUndo?: () => void }
function PropToast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
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
        {toast.onUndo && (
          <div className="pp-toast__actions">
            <button type="button" className="pp-toast__btn pp-toast__btn--dismiss" onClick={onDismiss}>
              Dismiss
            </button>
            <button
              type="button"
              className="pp-toast__btn pp-toast__btn--undo"
              onClick={() => {
                toast.onUndo?.();
                onDismiss();
              }}
            >
              <Icon name="undo-2" size={15} />
              Undo
            </button>
          </div>
        )}
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
function ChangeStatusModal({ property, onCancel, onConfirm }: { property: DetailProperty; onCancel: () => void; onConfirm: (s: string) => void }) {
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

  const canConfirm = selected && selected !== property.status;
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <div className="pp-modal__icon pp-modal__icon--status">
          <Icon name="refresh-cw" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="status-modal-title">
          Change status
        </h2>
        <p className="pp-modal__sublabel">Select new status</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selected ? (
            <>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[STATUS_META[selected].variant] }} />
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
        {dropOpen &&
          dropPos &&
          createPortal(
            <div className="pp-smodal__drop pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
              {STATUS_OPTIONS.map((status) => {
                const meta = STATUS_META[status];
                return (
                  <button
                    key={status}
                    type="button"
                    className={"pp-smodal__item" + (selected === status ? " is-selected" : "")}
                    onClick={() => {
                      setSelected(status);
                      setDropOpen(false);
                    }}
                  >
                    <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[meta.variant] }} />
                    <span className="pp-smodal__label">{status}</span>
                    <span className="pp-smodal__spacer" />
                    {property.status === status && <span className="pp-amodal__current-tag">Current</span>}
                    {selected === status && (
                      <span className="pp-smodal__check">
                        <Icon name="check" size={16} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm} onClick={() => selected && onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />
            Change status
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AssignAgentModal({ property, onCancel, onConfirm }: { property: DetailProperty; onCancel: () => void; onConfirm: (a: DetailAgent) => void }) {
  const hasAgent = !!property.agent;
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

  const selectedAgent = selected ? AGENTS_LIST.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== (property.agent?.name ?? null);
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign">
          <Icon name={hasAgent ? "user-cog" : "user-plus"} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="agent-modal-title">
          {hasAgent ? "Change assigned agent" : "Assign agent"}
        </h2>
        <p className="pp-modal__sublabel">{hasAgent ? "Select new agent" : "Select agent"}</p>
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
        {dropOpen &&
          dropPos &&
          createPortal(
            <div className="pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
              {AGENTS_LIST.map((agent) => (
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
                  {property.agent?.name === agent.name && <span className="pp-amodal__current-tag">Current</span>}
                  {selected === agent.name && (
                    <span className="pp-amodal__check">
                      <Icon name="check" size={16} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              ))}
            </div>,
            document.body,
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
              const a = AGENTS_LIST.find((x) => x.name === selected);
              if (a) onConfirm(a);
            }}
          >
            <Icon name={hasAgent ? "user-check" : "user-plus"} size={15} />
            {hasAgent ? "Change agent" : "Assign agent"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ConfirmModal({ kind, property, onCancel, onConfirm }: { kind: "archive" | "delete"; property: DetailProperty; onCancel: () => void; onConfirm: () => void }) {
  const danger = kind === "delete";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className={"pp-modal__icon" + (danger ? "" : " pp-modal__icon--status")}>
          <Icon name={danger ? "trash-2" : "archive"} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="confirm-modal-title">
          {danger ? "Delete property?" : "Archive property?"}
        </h2>
        <p className="pp-modal__body">
          {danger ? (
            <>
              Are you sure you want to delete <strong>{property.title}</strong>? This action cannot be undone and will permanently remove the listing.
            </>
          ) : (
            <>
              Archive <strong>{property.title}</strong>? It will be hidden from active search and moved to the archive. You can restore it at any time.
            </>
          )}
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          {danger ? (
            <button type="button" className="pp-modal__delete" onClick={onConfirm}>
              <Icon name="trash-2" size={15} />
              Delete property
            </button>
          ) : (
            <button type="button" className="pp-modal__confirm" onClick={onConfirm}>
              <Icon name="archive" size={15} />
              Archive property
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
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
  const r = (note.role || "").trim();
  const roleLabel = r ? r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note" : "note";
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="delnote-modal-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="delnote-modal-title">
          Delete note?
        </h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{roleLabel.toLowerCase()}</strong>? This action cannot be undone and will permanently remove it from this property.
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
    </div>,
    document.body,
  );
}

/* ---------------- building blocks ---------------- */
function SectionCard({ title, desc, action, children, id, flush }: { title: string; desc?: string; action?: ReactNode; children: ReactNode; id?: string; flush?: boolean }) {
  return (
    <section className="pd-card" id={id}>
      <header className="pd-card__head">
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">{title}</h2>
            {desc && <p className="pd-card__desc">{desc}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className={"pd-card__body" + (flush ? " pd-card__body--flush" : "")}>{children}</div>
    </section>
  );
}

function Field({ icon, label, value, mono, em }: { icon: IconName; label: string; value: ReactNode; mono?: boolean; em?: boolean }) {
  return (
    <div className={"pd-field" + (em ? " pd-field--em" : "")}>
      <span className="pd-field__icon">
        <Icon name={icon} size={15} />
      </span>
      <div className="pd-field__text">
        <span className="pd-field__label">{label}</span>
        <span className={"pd-field__value" + (mono ? " pd-field__value--mono" : "")}>{value}</span>
      </div>
    </div>
  );
}

function DGroup({ title, desc, children, cols, noRowDivider }: { title: string; desc?: string; children: ReactNode; cols?: number; noRowDivider?: boolean }) {
  return (
    <section className="pd-dgroup">
      <header className="pd-dgroup__head">
        <h3 className="pd-dgroup__title">{title}</h3>
        {desc && <p className="pd-dgroup__desc">{desc}</p>}
      </header>
      <div className={"pd-dl" + (cols === 1 ? " pd-dl--one" : "") + (noRowDivider ? " pd-dl--no-divider" : "")}>{children}</div>
    </section>
  );
}

function DetailHeader({ p, onEdit, onChangeStatus, onAssignAgent, onArchive, onDelete }: { p: DetailProperty; onEdit: () => void; onChangeStatus: () => void; onAssignAgent: () => void; onArchive: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const st = STATUS_META[p.status] || { variant: "neutral" as const };
  return (
    <header className="pd-head">
      <nav className="pd-breadcrumb" aria-label="Breadcrumb">
        <Link href="/admin/properties">Properties</Link>
        <Icon name="chevron-right" size={14} />
        <span aria-current="page">{p.title}</span>
      </nav>

      <div className="pd-head__main">
        <div className="pd-head__intro">
          <div className="pd-head__titlerow">
            <h1 className="pd-head__title">{p.title}</h1>
            <Badge variant={st.variant} size="md" dot={st.dot} icon={st.icon}>
              {p.status}
            </Badge>
          </div>
          <div className="pd-head__meta">
            <span className="pd-head__metaitem pd-head__metaitem--id">
              <Icon name="hash" size={14} />
              {p.id}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name="building-2" size={14} />
              {p.type}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name={p.listing === "sale" ? "tag" : "key"} size={14} />
              {p.listing === "sale" ? "For sale" : "For rent"}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name="map-pin" size={14} />
              {p.location}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name="calendar" size={14} />
              Added {p.date}
            </span>
          </div>
        </div>

        <div className="pd-head__actions">
          <Button hierarchy="secondary" size="md" iconLeading="refresh-cw" onClick={onChangeStatus}>
            Change status
          </Button>
          <Button hierarchy="primary" size="md" iconLeading="pencil" onClick={onEdit}>
            Edit property
          </Button>
          <div className="pd-morewrap" ref={menuRef}>
            <button type="button" className={"pd-morebtn" + (menuOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              <Icon name="more-horizontal" size={19} />
            </button>
            {menuOpen && (
              <div className="pd-moremenu" role="menu">
                <button
                  type="button"
                  className="pd-moreitem"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onAssignAgent();
                  }}
                >
                  <Icon name={p.agent ? "user-cog" : "user-plus"} size={17} />
                  {p.agent ? "Reassign agent" : "Assign agent"}
                </button>
                <button
                  type="button"
                  className="pd-moreitem"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onArchive();
                  }}
                >
                  <Icon name="archive" size={17} />
                  Archive property
                </button>
                <div className="pd-moremenu__sep" />
                <button
                  type="button"
                  className="pd-moreitem pd-moreitem--danger"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  <Icon name="trash-2" size={17} />
                  Delete property
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function Gallery({ p }: { p: DetailProperty }) {
  const [active, setActive] = useState(0);
  const imgs = p.gallery;
  return (
    <SectionCard title="Property gallery" desc={`${imgs.length} photos · cover image set`} id="gallery">
      <div className="pd-gallery">
        <div className="pd-gallery__main">
          <img src={imgs[active]} alt={p.title} />
          <span className="pd-gallery__cover">
            <Icon name="star" size={13} />
            {active === 0 ? "Cover image" : "Photo " + (active + 1)}
          </span>
        </div>
        <div className="pd-gallery__thumbs">
          {imgs.map((src, i) => (
            <button key={i} type="button" className={"pd-gallery__thumb" + (i === active ? " is-active" : "")} onClick={() => setActive(i)} aria-label={"View photo " + (i + 1)}>
              <img src={src} alt="" loading="lazy" />
              {i === 0 && (
                <span className="pd-gallery__thumbtag">
                  <Icon name="star" size={11} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function PropertyInfo({ p }: { p: DetailProperty }) {
  const s = p.specs;
  const dash = (v: ReactNode) => (v || v === 0 ? v : "—");
  const num = (v: number | null, suffix?: string) => (v || v === 0 ? v.toLocaleString("en-US") + (suffix || "") : "—");
  return (
    <SectionCard title="Property information" desc="Core attributes, location, and specifications for this listing." id="info" flush>
      <div className="pd-detailgroups">
        <DGroup title="Basic information" desc="Identity and how the listing is classified." noRowDivider>
          <Field icon="type" label="Property name" value={p.title} />
          <Field icon="hash" label="Property ID" value={p.id} mono />
          <Field icon="building-2" label="Property type" value={p.type} />
          <Field icon={p.listing === "sale" ? "tag" : "key"} label="Listing type" value={p.listing === "sale" ? "For sale" : "For rent"} />
        </DGroup>

        <DGroup title="Pricing" desc="Listed price and valuation.">
          <Field icon="wallet" label={p.listing === "sale" ? "Asking price" : "Monthly rent"} value={fmtUSD(p.price) + (p.per || "")} em />
          <Field icon="banknote" label="Currency" value={s.currency} />
        </DGroup>

        <DGroup title="Location" desc="Where this property sits on the map." noRowDivider>
          <Field icon="building" label="City" value={p.city} />
          <Field icon="map-pin" label="Area / District" value={p.area} />
          <Field icon="navigation" label="Full address" value={s.address} />
          <Field
            icon="map"
            label="Map location"
            value={
              <a className="pd-maplink" href={s.mapUrl} target="_blank" rel="noopener noreferrer">
                {s.coords}
                <Icon name="external-link" size={13} />
              </a>
            }
          />
        </DGroup>

        <DGroup title="Property features" desc="Size, layout, and build details." noRowDivider>
          <Field icon="bed-double" label="Bedrooms" value={p.beds ? p.beds : "—"} />
          <Field icon="bath" label="Bathrooms" value={p.baths ? p.baths : "—"} />
          <Field icon="maximize-2" label="Area" value={num(p.size, " m²")} />
          <Field icon="land-plot" label="Land size" value={num(s.landSize, " m²")} />
          <Field icon="car" label="Garage spaces" value={dash(s.garages)} />
          <Field icon="calendar" label="Year built" value={dash(s.yearBuilt)} />
          <Field icon="sofa" label="Furnished" value={dash(s.furnished)} />
          <Field icon="layers" label="Floor" value={dash(s.floor)} />
        </DGroup>

        {s.amenities && s.amenities.length > 0 && (
          <section className="pd-dgroup">
            <header className="pd-dgroup__head">
              <h3 className="pd-dgroup__title">Amenities</h3>
              <p className="pd-dgroup__desc">Features and facilities included with this property.</p>
            </header>
            <div className="pd-amen">
              {s.amenities.map((a) => (
                <div className="pd-amenrow" key={a.label}>
                  <span className="pd-amenrow__ic">
                    <Icon name={a.icon} size={17} />
                  </span>
                  {a.label}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </SectionCard>
  );
}

function ListingInfo({ p }: { p: DetailProperty }) {
  const st = STATUS_META[p.status] || { variant: "neutral" as const };
  return (
    <SectionCard title="Listing information" desc="Visibility, placement, and listing timeline." id="listing" flush>
      <div className="pd-detailgroups">
        <DGroup title="Listing details" desc="How and when this listing is presented." noRowDivider>
          <Field
            icon={p.listing === "sale" ? "tag" : "key"}
            label="Listing type"
            value={
              <Badge variant={p.listing === "sale" ? "brand" : "info"} size="sm" icon={p.listing === "sale" ? "tag" : "key"}>
                {p.listing === "sale" ? "For sale" : "For rent"}
              </Badge>
            }
          />
          <Field icon="calendar-plus" label="Date created" value={p.specs.dateCreated} />
          <Field
            icon="sparkles"
            label="Featured"
            value={
              p.featured ? (
                <Badge variant="gold" size="sm" icon="sparkles">
                  Featured
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm" icon="minus">
                  Standard
                </Badge>
              )
            }
          />
          <Field icon="clock" label="Last updated" value={p.updated} />
          <Field
            icon="circle-dot"
            label="Status"
            value={
              <Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon}>
                {p.status}
              </Badge>
            }
          />
        </DGroup>
      </div>
    </SectionCard>
  );
}

const NOTE_KIND: Record<string, { icon: IconName; cls: string }> = {
  approval: { icon: "circle-check", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" },
};
const NOTE_MAX = 500;
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
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label="New internal note" placeholder="Write a note about verification, approvals, pricing, or reminders for this listing…" />
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

function InternalNotes({ p, onAdd, onEdit, onDelete }: { p: DetailProperty; onAdd: (t: string) => void; onEdit: (i: number, t: string) => void; onDelete: (i: number) => void }) {
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const roleLabel = (role: string) => {
    const r = (role || "").trim();
    if (!r) return "Note";
    return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
  };
  const handleSave = (text: string) => {
    onAdd(text);
    setComposing(false);
  };
  return (
    <SectionCard
      title="Internal notes"
      desc="Staff-only. Not visible to members or on the public site."
      action={
        !composing &&
        editing == null && (
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>
            Add note
          </Button>
        )
      }
      id="notes"
    >
      {composing && <NoteComposer spaced={p.notes.length > 0} onSave={handleSave} onCancel={() => setComposing(false)} />}
      {p.notes.length === 0
        ? !composing && (
            <div className="pd-noagent">
              <span className="pd-noagent__art">
                <Icon name="sticky-note" size={24} strokeWidth={1.6} />
              </span>
              <p>No internal notes yet. Add a staff-only note to track verification, approvals, or reminders for this listing.</p>
            </div>
          )
        : (
            <div className="pd-notes">
              {p.notes.map((n, i) => {
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
                      <span className="pd-note__label">{roleLabel(n.role)}</span>
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
function Timeline({ p, onViewAll }: { p: DetailProperty; onViewAll: () => void }) {
  return (
    <SectionCard
      title="Activity timeline"
      desc="Chronological log of every change to this listing."
      action={
        <Button hierarchy="link" size="sm" iconTrailing="arrow-right" style={{ color: "var(--text-secondary)" }} onClick={onViewAll}>
          View all
        </Button>
      }
      id="activity"
    >
      <ol className="pd-timeline">
        {p.timeline.map((e, i) => (
          <li className="pd-tl" key={i}>
            <span className="pd-tl__dot" style={{ background: TL_TONE[e.tone], boxShadow: `0 0 0 4px color-mix(in srgb, ${TL_TONE[e.tone]} 16%, transparent)` }}>
              <Icon name={e.icon} size={13} strokeWidth={2.2} />
            </span>
            <div className="pd-tl__body">
              <div className="pd-tl__top">
                <span className="pd-tl__title">{e.title}</span>
                <span className="pd-tl__time">{e.time}</span>
              </div>
              <p className="pd-tl__desc">{e.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

function Ownership({ p }: { p: DetailProperty }) {
  return (
    <SectionCard title="Ownership" desc="Private owner contact details." id="owner">
      <div className="pd-owner">
        <Avatar name={p.owner.name} size="lg" />
        <div className="pd-owner__id">
          <span className="pd-owner__name">{p.owner.name}</span>
          <span className="pd-owner__type">
            <Icon name={p.owner.type.startsWith("Company") ? "building" : "user"} size={13} />
            {p.owner.type}
          </span>
        </div>
      </div>
      <div className="pd-contactlist">
        <a className="pd-contact" href={"tel:" + p.owner.phone.replace(/\s/g, "")}>
          <span className="pd-contact__icon">
            <Icon name="phone" size={16} />
          </span>
          <div className="pd-contact__text">
            <span className="pd-contact__label">Phone</span>
            <span className="pd-contact__value">{p.owner.phone}</span>
          </div>
          <Icon name="external-link" size={15} className="pd-contact__go" />
        </a>
        <a className="pd-contact" href={"mailto:" + p.owner.email}>
          <span className="pd-contact__icon">
            <Icon name="mail" size={16} />
          </span>
          <div className="pd-contact__text">
            <span className="pd-contact__label">Email</span>
            <span className="pd-contact__value">{p.owner.email}</span>
          </div>
          <Icon name="external-link" size={15} className="pd-contact__go" />
        </a>
      </div>
    </SectionCard>
  );
}

function ViewingRequests({ p, onViewAll }: { p: DetailProperty; onViewAll: () => void }) {
  const rows = getViewings(p.id);
  const upcoming = rows.filter((r) => r.status === "Scheduled" || r.status === "Confirmed").length;
  return (
    <SectionCard
      title="Viewing requests"
      desc={rows.length ? `${rows.length} request${rows.length > 1 ? "s" : ""} · ${upcoming} upcoming` : "Requests to view this property will appear here."}
      action={
        rows.length ? (
          <Button hierarchy="link" size="sm" iconTrailing="arrow-right" style={{ color: "var(--text-secondary)" }} onClick={onViewAll}>
            View all
          </Button>
        ) : null
      }
      id="viewings"
    >
      {rows.length === 0 ? (
        <div className="pd-noagent">
          <span className="pd-noagent__art">
            <Icon name="calendar" size={24} strokeWidth={1.6} />
          </span>
          <p>No viewing requests yet. New requests from members and agents will show up here.</p>
        </div>
      ) : (
        <div className="pd-viewings">
          {rows.map((r) => {
            const st = VIEWING_STATUS[r.status] || { variant: "neutral" as const, icon: "clock" as const };
            return (
              <div className="pd-viewing" key={r.id}>
                <Avatar src={r.img} name={r.member} size="lg" />
                <div className="pd-viewing__main">
                  <span className="pd-viewing__name">{r.member}</span>
                  <span className="pd-viewing__meta">{r.date + " · " + r.time}</span>
                </div>
                <Badge variant={st.variant} size="sm" icon={st.icon}>
                  {r.status}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function AssignedAgent({ p, onAssignAgent }: { p: DetailProperty; onAssignAgent: () => void }) {
  if (!p.agent) {
    return (
      <SectionCard title="Assigned agent" desc="No agent is managing this listing yet." id="agent">
        <div className="pd-noagent">
          <span className="pd-noagent__art">
            <Icon name="user-plus" size={24} strokeWidth={1.6} />
          </span>
          <p>Assign a verified agent to handle viewings, enquiries, and the sale.</p>
          <Button hierarchy="primary" size="sm" iconLeading="user-plus" onClick={onAssignAgent}>
            Assign agent
          </Button>
        </div>
      </SectionCard>
    );
  }
  const a = p.agent;
  const phoneHref = "tel:" + a.phone.replace(/\s/g, "");
  const waHref = "https://wa.me/" + a.phone.replace(/[^\d]/g, "");
  const broker = a.agency || "Chiya Premier";
  const rating = a.rating || "4.8";
  const reviews = a.reviews || 96;
  return (
    <SectionCard
      title="Assigned agent"
      desc="Manages viewings and enquiries."
      action={
        <Button hierarchy="tertiary" size="sm" iconLeading="user-cog" onClick={onAssignAgent}>
          Reassign
        </Button>
      }
      id="agent"
    >
      <Link className="pd-agent pd-agent--link" href="/admin/agents" title={"View " + a.name + "’s details"}>
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
              {broker}
            </span>
            <span className="pd-agent__rate">
              <Icon name="star" size={15} />
              {rating}
            </span>
            <span className="pd-agent__reviews">({reviews} reviews)</span>
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

export function PropertyDetailApp({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [property, setProperty] = useState<DetailProperty>(() => getProperty(id));
  const [statusOpen, setStatusOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | "delete" | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  const [toasts, pushToast, dismissToast] = useToasts();

  const onEdit = () => router.push(`/admin/properties/${encodeURIComponent(property.id)}/edit?from=details`);

  const toastShown = useRef(false);
  useEffect(() => {
    if (toastShown.current) return;
    if (searchParams.get("toast") === "updated") {
      toastShown.current = true;
      const raf = requestAnimationFrame(() => pushToast({ tone: "success", icon: "circle-check", title: "Property updated", msg: `“${property.title}” has been updated successfully.` }));
      return () => cancelAnimationFrame(raf);
    }
  }, [searchParams, property.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatus = (status: string) => {
    setProperty((p) => ({ ...p, status, published: status === "Published" ? true : p.published }));
    setStatusOpen(false);
    pushToast({ tone: "brand", icon: "refresh-cw", title: "Status updated", msg: `“${property.title}” is now marked as ${status}.` });
  };
  const handleAssign = (agent: DetailAgent) => {
    const wasAssigned = !!property.agent;
    const enriched = { ...agent, email: agent.email || agent.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@mail.chiya.estate", listings: agent.listings || 8 };
    setProperty((p) => ({ ...p, agent: enriched }));
    setAgentOpen(false);
    pushToast({ tone: "success", icon: "user-check", title: wasAssigned ? "Agent changed" : "Agent assigned", msg: `${agent.name} is now the assigned agent for “${property.title}”.` });
  };
  const handleArchive = () => {
    setProperty((p) => ({ ...p, status: "Archived", published: false }));
    setConfirm(null);
    pushToast({ tone: "brand", icon: "archive", title: "Property archived", msg: `“${property.title}” has been moved to the archive.` });
  };
  const handleDelete = () => {
    setConfirm(null);
    pushToast({ tone: "danger", icon: "trash-2", title: "Property deleted", msg: `“${property.title}” has been permanently removed. Returning to Properties…` });
    setTimeout(() => router.push("/admin/properties"), 1400);
  };
  const handleAddNote = (text: string) => {
    const note: NoteItem = { author: ADMIN.name, role: ADMIN.role, kind: "note", time: nowStamp(), text };
    setProperty((p) => ({ ...p, notes: [note, ...p.notes] }));
    pushToast({ tone: "success", icon: "circle-check", title: "Note added", msg: "Your internal note has been added to this property." });
  };
  const handleEditNote = (idx: number, text: string) => {
    setProperty((p) => ({ ...p, notes: p.notes.map((n, i) => (i === idx ? { ...n, text, time: "Edited just now" } : n)) }));
    pushToast({ tone: "brand", icon: "pencil", title: "Note updated", msg: "Your changes to the internal note were saved." });
  };
  const handleDeleteNote = () => {
    const idx = noteToDelete!;
    const removed = property.notes[idx];
    setProperty((p) => ({ ...p, notes: p.notes.filter((_, i) => i !== idx) }));
    setNoteToDelete(null);
    pushToast({
      tone: "danger",
      icon: "trash-2",
      title: "Note deleted",
      msg: "The internal note has been removed.",
      onUndo: () =>
        setProperty((p) => {
          const notes = [...p.notes];
          notes.splice(idx, 0, removed);
          return { ...p, notes };
        }),
    });
  };

  return (
    <>
      <DetailHeader p={property} onEdit={onEdit} onChangeStatus={() => setStatusOpen(true)} onAssignAgent={() => setAgentOpen(true)} onArchive={() => setConfirm("archive")} onDelete={() => setConfirm("delete")} />

      <div className="pd-grid">
        <div className="pd-grid__main">
          <Gallery p={property} />
          <PropertyInfo p={property} />
          <ListingInfo p={property} />
          <InternalNotes p={property} onAdd={handleAddNote} onEdit={handleEditNote} onDelete={(i) => setNoteToDelete(i)} />
          <ViewingRequests p={property} onViewAll={() => router.push("/admin/viewings")} />
          <Timeline p={property} onViewAll={() => router.push("/admin/properties")} />
        </div>
        <aside className="pd-grid__aside">
          <Ownership p={property} />
          <AssignedAgent p={property} onAssignAgent={() => setAgentOpen(true)} />
        </aside>
      </div>

      {statusOpen && <ChangeStatusModal property={property} onCancel={() => setStatusOpen(false)} onConfirm={handleStatus} />}
      {agentOpen && <AssignAgentModal property={property} onCancel={() => setAgentOpen(false)} onConfirm={handleAssign} />}
      {confirm && <ConfirmModal kind={confirm} property={property} onCancel={() => setConfirm(null)} onConfirm={confirm === "delete" ? handleDelete : handleArchive} />}
      {noteToDelete !== null && property.notes[noteToDelete] && <DeleteNoteModal note={property.notes[noteToDelete]} onCancel={() => setNoteToDelete(null)} onConfirm={handleDeleteNote} />}

      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => (
          <PropToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
