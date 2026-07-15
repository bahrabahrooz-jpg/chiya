"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtNum, fmtCurrency, fmtDate, fmtStamp, localizeDigits, roleKey, valueKey } from "@/lib/fmt";
import {
  STATUS_DOT_COLOR,
  STATUS_META,
  STATUS_OPTIONS,
  VIEWING_STATUS,
  statusRequiresAgent,
  getProperty,
  getViewings,
  toDetailProperty,
  type DetailAgent,
  type DetailProperty,
  type NoteItem,
} from "./data";
import { useProperties } from "../_shared/properties-store";

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin" };

/**
 * Note timestamps are usually parseable stamps ("Jun 14, 2026 · 09:42"), but an
 * edit records a relative marker instead. Store it as a catalog key behind "@" —
 * the same convention the audit log uses — so it renders in whatever language is
 * active when the note is read, not the one it was edited in.
 */
const EDITED_STAMP = "@admin.vd.editedJustNow";

function nowStamp() {
  const d = new Date();
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${M[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

/* ---------------- toast ---------------- */
interface ToastData { id: number; tone?: "danger" | "brand" | "success"; icon: IconName; title: string; msg: string; out?: boolean; onUndo?: () => void }
function PropToast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const { t } = useLang();
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
              {t("admin.props.dismiss")}
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
              {t("admin.props.undo")}
            </button>
          </div>
        )}
      </div>
      <button type="button" className="pp-toast__close" aria-label={t("admin.props.close")} onClick={onDismiss}>
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
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
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
          {t("admin.props.changeStatus")}
        </h2>
        <p className="pp-modal__sublabel">{t("admin.props.selectNewStatus")}</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selected ? (
            <>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[STATUS_META[selected].variant] }} />
              <span className="pp-smodal__label">{tOr(valueKey("status", selected), selected)}</span>
            </>
          ) : (
            <span className="pp-amodal__trigger-placeholder">
              <Icon name="tag" size={16} />
              {t("admin.props.chooseStatus")}
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
                // A property with no agent can't move to a live status.
                const blocked = !property.agent && statusRequiresAgent(status);
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={blocked}
                    className={"pp-smodal__item" + (selected === status ? " is-selected" : "") + (blocked ? " is-disabled" : "")}
                    onClick={() => {
                      setSelected(status);
                      setDropOpen(false);
                    }}
                  >
                    <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[meta.variant] }} />
                    <span className="pp-smodal__label">{status}</span>
                    <span className="pp-smodal__spacer" />
                    {blocked ? (
                      <span className="pp-smodal__req">{t("admin.props.needsAgent")}</span>
                    ) : (
                      <>
                        {property.status === status && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
                        {selected === status && (
                          <span className="pp-smodal__check">
                            <Icon name="check" size={16} strokeWidth={2.5} />
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.common.cancel")}
          </button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm} onClick={() => selected && onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />
            {t("admin.props.changeStatus")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function AssignAgentModal({ property, onCancel, onConfirm }: { property: DetailProperty; onCancel: () => void; onConfirm: (a: DetailAgent) => void }) {
  const { t } = useLang();
  const hasAgent = !!property.agent;
  const [selected, setSelected] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Assignable = verified agents in the live roster, so a Pending → Verified
  // change on the Agents page is reflected here immediately.
  const { agents } = useProperties();
  const verifiedAgents = useMemo<DetailAgent[]>(
    () =>
      agents
        .filter((a) => a.verification === "Verified")
        .map((a) => ({ name: a.name, verified: true, img: a.img || "", phone: a.phone, email: a.email, listings: a.listings }))
        .sort((x, y) => x.name.localeCompare(y.name)),
    [agents],
  );

  const q = query.trim().toLowerCase();
  const filteredAgents = q ? verifiedAgents.filter((a) => a.name.toLowerCase().includes(q)) : verifiedAgents;

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
    if (!dropOpen) {
      calcPos();
      setQuery("");
    }
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

  const selectedAgent = selected ? verifiedAgents.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== (property.agent?.name ?? null);
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign">
          <Icon name={hasAgent ? "user-cog" : "user-plus"} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="agent-modal-title">
          {t(hasAgent ? "admin.pd.changeAssignedAgent" : "admin.props.assignAgent")}
        </h2>
        <p className="pp-modal__sublabel">{t(hasAgent ? "admin.props.selectNewAgent" : "admin.props.selectAgent")}</p>
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
            <div className="pp-amodal__drop pp-amodal__drop--search" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
              <div className="pp-amodal__search">
                <Icon name="search" size={15} className="pp-amodal__search-ic" />
                <input className="pp-amodal__search-input" type="text" autoFocus placeholder="Search agents by name…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search agents" />
                {query && (
                  <button type="button" className="pp-amodal__search-clear" aria-label="Clear search" onClick={() => setQuery("")}>
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
              <div className="pp-amodal__list">
                {filteredAgents.length === 0 ? (
                  <div className="pp-amodal__empty">
                    <Icon name="user-x" size={18} />
                    No agents match “{query}”.
                  </div>
                ) : (
                  filteredAgents.map((agent) => (
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
                      <span className="pp-amodal__agent-body">
                        <span className="pp-amodal__agent-name">{agent.name}</span>
                      </span>
                      {property.agent?.name === agent.name && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
                      {selected === agent.name && (
                        <span className="pp-amodal__check">
                          <Icon name="check" size={16} strokeWidth={2.5} />
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.common.cancel")}
          </button>
          <button
            type="button"
            className="pp-modal__confirm"
            disabled={!canConfirm}
            onClick={() => {
              const a = verifiedAgents.find((x) => x.name === selected);
              if (a) onConfirm(a);
            }}
          >
            <Icon name={hasAgent ? "user-check" : "user-plus"} size={15} />
            {t(hasAgent ? "admin.props.changeAgent" : "admin.props.assignAgent")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ConfirmModal({ kind, property, onCancel, onConfirm }: { kind: "archive" | "delete"; property: DetailProperty; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
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
          {t(danger ? "admin.props.deleteTitle" : "admin.props.archiveTitle")}
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
            {t("admin.common.cancel")}
          </button>
          {danger ? (
            <button type="button" className="pp-modal__delete" onClick={onConfirm}>
              <Icon name="trash-2" size={15} />
              {t("admin.props.deleteConfirm")}
            </button>
          ) : (
            <button type="button" className="pp-modal__confirm" onClick={onConfirm}>
              <Icon name="archive" size={15} />
              {t("admin.props.archiveProperty")}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DeleteNoteModal({ note, onCancel, onConfirm }: { note: NoteItem; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const r = (note.role || "").trim();
  const roleLabel = r ? t("admin.pd.roleNote", { role: tOr(roleKey(r), r) }) : t("admin.pd.noteLabel");
  // Split the translated sentence on its {note} slot so each language decides where
  // the emphasised phrase sits, rather than inheriting English word order.
  const [before, after] = t("admin.pd.deleteNoteBody").split("{note}");
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="delnote-modal-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="delnote-modal-title">
          {t("admin.vd.deleteNoteTitle")}
        </h2>
        <p className="pp-modal__body">
          {before}
          <strong>{roleLabel.toLowerCase()}</strong>
          {after}
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.common.cancel")}
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.vd.deleteNote")}
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

function DetailHeader({ p, onEdit, onChangeStatus, onAssignAgent, onArchive, onDelete, agentSurface }: { p: DetailProperty; onEdit: () => void; onChangeStatus: () => void; onAssignAgent: () => void; onArchive: () => void; onDelete: () => void; agentSurface?: boolean }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
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
      <nav className="pd-breadcrumb" aria-label={t("admin.common.breadcrumb")}>
        <Link href="/admin/properties">{t("admin.nav.properties")}</Link>
        <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={14} />
        <span aria-current="page">{p.title}</span>
      </nav>

      <div className="pd-head__main">
        <div className="pd-head__intro">
          <div className="pd-head__titlerow">
            <h1 className="pd-head__title">{p.title}</h1>
            <Badge variant={st.variant} size="md" dot={st.dot} icon={st.icon}>
              {t(valueKey("status", p.status))}
            </Badge>
          </div>
          <div className="pd-head__meta">
            <span className="pd-head__metaitem pd-head__metaitem--id">
              <Icon name="hash" size={14} />
              {localizeDigits(lang, p.id)}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name="building-2" size={14} />
              {tOr(valueKey("type", p.type), p.type)}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name={p.listing === "sale" ? "tag" : "key"} size={14} />
              {t(p.listing === "sale" ? "admin.pd.forSale" : "admin.pd.forRent")}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name="map-pin" size={14} />
              {tOr(`loc.${p.location}`, p.location)}
            </span>
            <span className="pd-head__sep" />
            <span className="pd-head__metaitem">
              <Icon name="calendar" size={14} />
              {t("admin.pd.addedOn", { date: fmtDate(lang, new Date(p.date)) })}
            </span>
          </div>
        </div>

        <div className="pd-head__actions">
          <Button hierarchy="secondary" size="md" iconLeading="refresh-cw" onClick={onChangeStatus}>
            {t("admin.props.changeStatus")}
          </Button>
          <Button hierarchy="primary" size="md" iconLeading="pencil" onClick={onEdit}>
            {t("admin.props.editProperty")}
          </Button>
          <div className="pd-morewrap" ref={menuRef}>
            <button type="button" className={"pd-morebtn" + (menuOpen ? " is-open" : "")} aria-label={t("admin.props.actions")} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
              <Icon name="more-horizontal" size={19} />
            </button>
            {menuOpen && (
              <div className="pd-moremenu" role="menu">
                {!agentSurface && (
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
                    {t(p.agent ? "admin.pd.reassignAgent" : "admin.props.assignAgent")}
                  </button>
                )}
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
                  {t("admin.props.archiveProperty")}
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
                  {t("admin.props.deleteConfirm")}
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
  const { t, lang } = useLang();
  const [active, setActive] = useState(0);
  const imgs = p.gallery;
  return (
    <SectionCard title={t("admin.pd.gallery")} desc={t("admin.pd.galleryDesc", { count: fmtNum(lang, imgs.length) })} id="gallery">
      <div className="pd-gallery">
        <div className="pd-gallery__main">
          <img src={imgs[active]} alt={p.title} />
          <span className="pd-gallery__cover">
            <Icon name="star" size={13} />
            {active === 0 ? t("admin.pd.coverImage") : t("admin.pd.photoN", { n: fmtNum(lang, active + 1) })}
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
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const s = p.specs;
  const dash = (v: ReactNode) => (v || v === 0 ? v : "—");
  const num = (v: number | null, unitKey?: string) =>
    v || v === 0 ? fmtNum(lang, v) + (unitKey ? " " + t(unitKey) : "") : "—";
  return (
    <SectionCard title={t("admin.pd.info")} desc={t("admin.pd.infoDesc")} id="info" flush>
      <div className="pd-detailgroups">
        <DGroup title={t("admin.pd.basic")} desc={t("admin.pd.basicDesc")} noRowDivider>
          <Field icon="type" label={t("admin.pd.f.name")} value={p.title} />
          <Field icon="hash" label={t("admin.pd.f.id")} value={p.id} mono />
          <Field icon="building-2" label={t("admin.pd.f.type")} value={tOr(valueKey("type", p.type), p.type)} />
          <Field
            icon={p.listing === "sale" ? "tag" : "key"}
            label={t("admin.pd.f.listingType")}
            value={t(p.listing === "sale" ? "admin.pd.forSale" : "admin.pd.forRent")}
          />
        </DGroup>

        <DGroup title={t("admin.pd.pricing")} desc={t("admin.pd.pricingDesc")}>
          <Field
            icon="wallet"
            label={t(p.listing === "sale" ? "admin.pd.f.askingPrice" : "admin.pd.f.monthlyRent")}
            value={fmtCurrency(lang, p.price, s.currency) + (p.per ? t("admin.pd.perMonth") : "")}
            em
          />
          <Field icon="banknote" label={t("admin.pd.f.currency")} value={s.currency} />
        </DGroup>

        <DGroup title={t("admin.pd.location")} desc={t("admin.pd.locationDesc")} noRowDivider>
          <Field icon="building" label={t("admin.pd.f.city")} value={tOr(`city.${p.city}`, p.city)} />
          <Field icon="map-pin" label={t("admin.pd.f.area")} value={tOr(`loc.${p.area}`, p.area)} />
          <Field icon="navigation" label={t("admin.pd.f.address")} value={s.address} />
          <Field
            icon="map"
            label={t("admin.pd.f.map")}
            value={
              <a className="pd-maplink" href={s.mapUrl} target="_blank" rel="noopener noreferrer">
                {s.coords}
                <Icon name="external-link" size={13} />
              </a>
            }
          />
        </DGroup>

        <DGroup title={t("admin.pd.features")} desc={t("admin.pd.featuresDesc")} noRowDivider>
          <Field icon="bed-double" label={t("admin.pd.f.beds")} value={p.beds ? fmtNum(lang, p.beds) : "—"} />
          <Field icon="bath" label={t("admin.pd.f.baths")} value={p.baths ? fmtNum(lang, p.baths) : "—"} />
          <Field icon="maximize-2" label={t("admin.pd.f.size")} value={num(p.size, "unit.sqm")} />
          <Field icon="land-plot" label={t("admin.pd.f.landSize")} value={num(s.landSize, "unit.sqm")} />
          <Field icon="car" label={t("admin.pd.f.garages")} value={num(s.garages)} />
          <Field icon="calendar" label={t("admin.pd.f.yearBuilt")} value={s.yearBuilt ? localizeDigits(lang, String(s.yearBuilt)) : "—"} />
          <Field icon="sofa" label={t("admin.pd.f.furnished")} value={s.furnished ? tOr(valueKey("furnished", s.furnished), s.furnished) : "—"} />
          <Field icon="layers" label={t("admin.pd.f.floor")} value={dash(s.floor && localizeDigits(lang, String(s.floor)))} />
        </DGroup>

        {s.amenities && s.amenities.length > 0 && (
          <section className="pd-dgroup">
            <header className="pd-dgroup__head">
              <h3 className="pd-dgroup__title">{t("admin.pd.amenities")}</h3>
              <p className="pd-dgroup__desc">{t("admin.pd.amenitiesDesc")}</p>
            </header>
            <div className="pd-amen">
              {s.amenities.map((a) => (
                <div className="pd-amenrow" key={a.label}>
                  <span className="pd-amenrow__ic">
                    <Icon name={a.icon} size={17} />
                  </span>
                  {a.labelKey ? t(a.labelKey) : a.label}
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
  const { t, lang } = useLang();
  const st = STATUS_META[p.status] || { variant: "neutral" as const };
  return (
    <SectionCard title={t("admin.pd.listingInfo")} desc={t("admin.pd.listingInfoDesc")} id="listing" flush>
      <div className="pd-detailgroups">
        <DGroup title={t("admin.pd.listingDetails")} desc={t("admin.pd.listingDetailsDesc")} noRowDivider>
          <Field
            icon={p.listing === "sale" ? "tag" : "key"}
            label={t("admin.pd.f.listingType")}
            value={
              <Badge variant={p.listing === "sale" ? "brand" : "info"} size="sm" icon={p.listing === "sale" ? "tag" : "key"}>
                {t(p.listing === "sale" ? "admin.pd.forSale" : "admin.pd.forRent")}
              </Badge>
            }
          />
          <Field icon="calendar-plus" label={t("admin.pd.f.dateCreated")} value={fmtDate(lang, new Date(p.specs.dateCreated))} />
          <Field
            icon="sparkles"
            label={t("admin.pd.f.featured")}
            value={
              p.featured ? (
                <Badge variant="gold" size="sm" icon="sparkles">
                  {t("admin.pd.featured")}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm" icon="minus">
                  {t("admin.pd.standard")}
                </Badge>
              )
            }
          />
          <Field icon="clock" label={t("admin.pd.f.lastUpdated")} value={fmtDate(lang, new Date(p.updated))} />
          <Field
            icon="circle-dot"
            label={t("admin.props.th.status")}
            value={
              <Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon}>
                {t(valueKey("status", p.status))}
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
  const { t, lang } = useLang();
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
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label={t("admin.pd.noteAria")} placeholder={t("admin.pd.notePh")} />
      <div className="pd-notecomposer__foot">
        <span className={"pd-notecomposer__hint" + (remaining <= 50 ? " is-low" : "")}>
          {t("admin.pd.charsLeft", { count: fmtNum(lang, remaining) })}
        </span>
        <div className="pd-notecomposer__actions">
          <Button hierarchy="tertiary" size="sm" onClick={onCancel}>
            {t("admin.common.cancel")}
          </Button>
          <Button hierarchy="primary" size="sm" disabled={!text} onClick={save}>
            {submitLabel || t("admin.pd.addNote")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function InternalNotes({ p, onAdd, onEdit, onDelete }: { p: DetailProperty; onAdd: (t: string) => void; onEdit: (i: number, t: string) => void; onDelete: (i: number) => void }) {
  const { t, lang } = useLang();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const roleLabel = (role: string) => {
    const r = (role || "").trim();
    if (!r) return t("admin.pd.noteLabel");
    const key = roleKey(r);
    const name = t(key);
    return t("admin.pd.roleNote", { role: name === key ? r : name });
  };
  const handleSave = (text: string) => {
    onAdd(text);
    setComposing(false);
  };
  return (
    <SectionCard
      title={t("admin.pd.notes")}
      desc={t("admin.pd.notesDesc")}
      action={
        !composing &&
        editing == null && (
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>
            {t("admin.pd.addNote")}
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
              <p>{t("admin.pd.notesEmpty")}</p>
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
                        submitLabel={t("admin.vd.saveNote")}
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
                          aria-label={t("admin.pd.editNoteFrom", { author: n.author })}
                          title={t("admin.vd.editNote")}
                          onClick={() => {
                            setComposing(false);
                            setEditing(i);
                          }}
                        >
                          <Icon name="pencil" size={14} />
                        </button>
                        <button type="button" className="pd-note__delete" aria-label={t("admin.pd.deleteNoteFrom", { author: n.author })} title={t("admin.vd.deleteNote")} onClick={() => onDelete(i)}>
                          <Icon name="trash-2" size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="pd-note">
                      <div className="pd-note__body">
                        <p className="pd-note__text">{n.text}</p>
                        <span className="pd-note__time">{n.time.startsWith("@") ? t(n.time.slice(1)) : fmtStamp(lang, n.time)}</span>
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
  const { t, lang } = useLang();
  return (
    <SectionCard
      title={t("admin.pd.timeline")}
      desc={t("admin.pd.timelineDesc")}
      action={
        <Button hierarchy="link" size="sm" iconTrailing="arrow-right" style={{ color: "var(--text-secondary)" }} onClick={onViewAll}>
          {t("admin.common.viewAll")}
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
                <span className="pd-tl__title">{t(e.titleKey)}</span>
                <span className="pd-tl__time">{fmtStamp(lang, e.time)}</span>
              </div>
              <p className="pd-tl__desc">
                {t(e.descKey, {
                  ...e.params,
                  ...(e.price !== undefined ? { price: fmtCurrency(lang, e.price) + (e.per ? t("admin.pd.perMonth") : "") } : {}),
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

function Ownership({ p }: { p: DetailProperty }) {
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const { t } = useLang();
  return (
    <SectionCard title={t("admin.pd.ownership")} desc={t("admin.pd.ownershipDesc")} id="owner">
      <div className="pd-owner">
        <Avatar name={p.owner.name} size="lg" />
        <div className="pd-owner__id">
          <span className="pd-owner__name">{p.owner.name}</span>
          <span className="pd-owner__type">
            <Icon name={p.owner.type.startsWith("Company") ? "building" : "user"} size={13} />
            {tOr(valueKey("admin.pd.ownerType", p.owner.type), p.owner.type)}
          </span>
        </div>
      </div>
      <div className="pd-contactlist">
        <a className="pd-contact" href={"tel:" + p.owner.phone.replace(/\s/g, "")}>
          <span className="pd-contact__icon">
            <Icon name="phone" size={16} />
          </span>
          <div className="pd-contact__text">
            <span className="pd-contact__label">{t("admin.pd.phone")}</span>
            <span className="pd-contact__value">{p.owner.phone}</span>
          </div>
          <Icon name="external-link" size={15} className="pd-contact__go" />
        </a>
        <a className="pd-contact" href={"mailto:" + p.owner.email}>
          <span className="pd-contact__icon">
            <Icon name="mail" size={16} />
          </span>
          <div className="pd-contact__text">
            <span className="pd-contact__label">{t("admin.pd.email")}</span>
            <span className="pd-contact__value">{p.owner.email}</span>
          </div>
          <Icon name="external-link" size={15} className="pd-contact__go" />
        </a>
      </div>
    </SectionCard>
  );
}

function ViewingRequests({ p, onViewAll }: { p: DetailProperty; onViewAll: () => void }) {
  const { t, lang } = useLang();
  const rows = getViewings(p.id);
  const upcoming = rows.filter((r) => r.status === "Requested" || r.status === "Confirmed").length;
  return (
    <SectionCard
      title={t("admin.pd.viewingRequests")}
      desc={
        rows.length
          ? t(rows.length === 1 ? "admin.pd.viewingsCountOne" : "admin.pd.viewingsCount", {
              count: fmtNum(lang, rows.length),
              upcoming: fmtNum(lang, upcoming),
            })
          : t("admin.pd.viewingsEmptyDesc")
      }
      action={
        rows.length ? (
          <Button hierarchy="link" size="sm" iconTrailing="arrow-right" style={{ color: "var(--text-secondary)" }} onClick={onViewAll}>
            {t("admin.common.viewAll")}
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
          <p>{t("admin.pd.viewingsEmpty")}</p>
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
                  <span className="pd-viewing__meta">{fmtStamp(lang, r.date) + " · " + localizeDigits(lang, r.time)}</span>
                </div>
                <Badge variant={st.variant} size="sm" icon={st.icon}>
                  {t(valueKey("status", r.status))}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function AssignedAgent({ p, onAssignAgent, agentSurface }: { p: DetailProperty; onAssignAgent: () => void; agentSurface?: boolean }) {
  const { t, lang } = useLang();
  if (!p.agent) {
    return (
      <SectionCard title={t("admin.pd.assignedAgent")} desc={t("admin.pd.noAgentDesc")} id="agent">
        <div className="pd-noagent">
          <span className="pd-noagent__art">
            <Icon name="user-plus" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.pd.noAgentBody")}</p>
          {!agentSurface && (
            <Button hierarchy="primary" size="sm" iconLeading="user-plus" onClick={onAssignAgent}>
              {t("admin.props.assignAgent")}
            </Button>
          )}
        </div>
      </SectionCard>
    );
  }
  const a = p.agent;
  const phoneHref = "tel:" + a.phone.replace(/\s/g, "");
  const waHref = "https://wa.me/" + a.phone.replace(/[^\d]/g, "");
  const rating = a.rating || "4.8";
  const reviews = a.reviews || 96;
  return (
    <SectionCard
      title={t("admin.pd.assignedAgent")}
      desc={t("admin.pd.agentDesc")}
      action={
        agentSurface ? undefined : (
          <Button hierarchy="tertiary" size="sm" iconLeading="user-cog" onClick={onAssignAgent}>
            {t("admin.pd.reassign")}
          </Button>
        )
      }
      id="agent"
    >
      <Link className="pd-agent pd-agent--link" href="/admin/agents" title={t("admin.pd.viewAgentDetails", { name: a.name })}>
        <Avatar src={a.img} name={a.name} size="xl" verified={a.verified} />
        <div className="pd-agent__id">
          <span className="pd-agent__nrow">
            <span className="pd-agent__name">{a.name}</span>
            {a.verified ? (
              <Badge variant="brand" size="sm" icon="badge-check">
                {t("status.verified")}
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" icon="clock">
                {t("status.pending")}
              </Badge>
            )}
          </span>
          <span className="pd-agent__meta">
            <span className="pd-agent__rate">
              <Icon name="star" size={15} />
              {localizeDigits(lang, String(rating))}
            </span>
            <span className="pd-agent__reviews">({t("admin.pd.reviewsCount", { count: fmtNum(lang, Number(reviews)) })})</span>
          </span>
        </div>
        <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={18} className="pd-agent__go" />
      </Link>
      <div className="pd-agent__actions">
        <a className="pd-agentbtn" href={phoneHref}>
          <Icon name="phone" size={18} />
          {t("admin.pd.call")}
        </a>
        <a className="pd-agentbtn" href={waHref} target="_blank" rel="noopener noreferrer">
          <Icon name="message-circle" size={18} />
          WhatsApp
        </a>
      </div>
      <p className="pd-agent__trust">
        <Icon name="shield-check" size={15} />
        {t("admin.pd.trustLine")}
      </p>
    </SectionCard>
  );
}

export function PropertyDetailApp({ id, agentSurface }: { id: string; agentSurface?: boolean }) {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { properties } = useProperties();

  // Prefer the live record from the admin store — a property created through the
  // Add-property wizard lives only there (and in localStorage). Fall back to the
  // static seed data if it isn't found (e.g. an unknown id).
  const storeRecord = properties.find((p) => p.id === id);
  const [property, setProperty] = useState<DetailProperty>(() => (storeRecord ? toDetailProperty(storeRecord) : getProperty(id)));

  // The store hydrates from localStorage after mount, so a freshly-added id may
  // be absent on the first render. Sync once its real record becomes available.
  const syncedId = useRef<string | null>(storeRecord ? id : null);
  useEffect(() => {
    if (syncedId.current === id || !storeRecord) return;
    syncedId.current = id;
    setProperty(toDetailProperty(storeRecord));
  }, [id, storeRecord]);

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
      const raf = requestAnimationFrame(() => pushToast({ tone: "success", icon: "circle-check", title: t("admin.props.toast.updatedTitle"), msg: t("admin.pd.toast.updatedMsg", { title: property.title }) }));
      return () => cancelAnimationFrame(raf);
    }
  }, [searchParams, property.title]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatus = (status: string) => {
    setProperty((p) => ({ ...p, status, published: status === "Published" ? true : p.published }));
    setStatusOpen(false);
    pushToast({ tone: "brand", icon: "refresh-cw", title: t("admin.props.toast.statusTitle"), msg: t("admin.pd.toast.statusMsg", { title: property.title, status: t(valueKey("status", status)) }) });
  };
  const handleAssign = (agent: DetailAgent) => {
    const wasAssigned = !!property.agent;
    const enriched = { ...agent, email: agent.email || agent.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@mail.chiya.estate", listings: agent.listings || 8 };
    setProperty((p) => ({ ...p, agent: enriched }));
    setAgentOpen(false);
    pushToast({ tone: "success", icon: "user-check", title: t(wasAssigned ? "admin.pd.toast.agentChangedTitle" : "admin.pd.toast.agentAssignedTitle"), msg: t("admin.pd.toast.agentMsg", { name: agent.name, title: property.title }) });
  };
  const handleArchive = () => {
    setProperty((p) => ({ ...p, status: "Archived", published: false }));
    setConfirm(null);
    pushToast({ tone: "brand", icon: "archive", title: t("admin.pd.toast.archivedTitle"), msg: t("admin.pd.toast.archivedMsg", { title: property.title }) });
  };
  const handleDelete = () => {
    setConfirm(null);
    pushToast({ tone: "danger", icon: "trash-2", title: t("admin.props.toast.deletedTitle"), msg: t("admin.pd.toast.deletedMsg", { title: property.title }) });
    setTimeout(() => router.push("/admin/properties"), 1400);
  };
  const handleAddNote = (text: string) => {
    const note: NoteItem = { author: ADMIN.name, role: ADMIN.role, kind: "note", time: nowStamp(), text };
    setProperty((p) => ({ ...p, notes: [note, ...p.notes] }));
    pushToast({ tone: "success", icon: "circle-check", title: t("admin.vd.toast.noteAddedTitle"), msg: t("admin.pd.toast.noteAddedMsg") });
  };
  const handleEditNote = (idx: number, text: string) => {
    setProperty((p) => ({ ...p, notes: p.notes.map((n, i) => (i === idx ? { ...n, text, time: EDITED_STAMP } : n)) }));
    pushToast({ tone: "brand", icon: "pencil", title: t("admin.vd.toast.noteUpdatedTitle"), msg: t("admin.vd.toast.noteUpdatedMsg") });
  };
  const handleDeleteNote = () => {
    const idx = noteToDelete!;
    const removed = property.notes[idx];
    setProperty((p) => ({ ...p, notes: p.notes.filter((_, i) => i !== idx) }));
    setNoteToDelete(null);
    pushToast({
      tone: "danger",
      icon: "trash-2",
      title: t("admin.vd.toast.noteDeletedTitle"),
      msg: t("admin.pd.toast.noteDeletedMsg"),
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
      <DetailHeader p={property} onEdit={onEdit} onChangeStatus={() => setStatusOpen(true)} onAssignAgent={() => setAgentOpen(true)} onArchive={() => setConfirm("archive")} onDelete={() => setConfirm("delete")} agentSurface={agentSurface} />

      <div className="pd-grid">
        <div className="pd-grid__main">
          <Gallery p={property} />
          <PropertyInfo p={property} />
          <ListingInfo p={property} />
          <InternalNotes p={property} onAdd={handleAddNote} onEdit={handleEditNote} onDelete={(i) => setNoteToDelete(i)} />
          <ViewingRequests p={property} onViewAll={() => router.push("/admin/viewings")} />
          <Timeline p={property} onViewAll={agentSurface ? () => {} : () => router.push("/admin/properties")} />
        </div>
        <aside className="pd-grid__aside">
          <Ownership p={property} />
          <AssignedAgent p={property} onAssignAgent={() => setAgentOpen(true)} agentSurface={agentSurface} />
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
