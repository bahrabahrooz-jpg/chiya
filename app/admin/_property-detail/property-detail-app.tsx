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
import { fmtNum, fmtDate, fmtStamp, localizeDigits, roleKey, valueKey } from "@/lib/fmt";
import { formatMoney, formatPrice } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import {
  AVAILABILITY_META,
  PUBLICATION_META,
  STATUS_DOT_COLOR,
  VIEWING_STATUS,
  VISIBILITY_OPTIONS,
  getProperty,
  getViewings,
  legacyStatus,
  toDetailProperty,
  type DetailAgent,
  type DetailProperty,
  type NoteItem,
  type Publication,
} from "./data";
import { useProperties } from "../_shared/properties-store";
import { useContracts } from "../_shared/contracts-store";
import { canPublish } from "../_data/property-state";
import { STATUS_META as CONTRACT_STATUS_META } from "../_contracts/data";
import { contractValue, invoiceStatus, type ContractRecord } from "../_data/contracts";

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
/**
 * Change visibility — who may see the listing, and nothing else.
 *
 * Sold and Rented used to be in this list. They are not any more, and that is
 * the point of the whole change: a sale is a contract, not a word someone
 * picks from a dropdown, and there is no way back to it from here.
 */
function ChangeVisibilityModal({ property, onCancel, onConfirm }: { property: DetailProperty; onCancel: () => void; onConfirm: (p: Publication) => void }) {
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const [selected, setSelected] = useState<Publication | null>(null);
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

  const canConfirm = selected && selected !== property.publication;
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <div className="pp-modal__icon pp-modal__icon--status">
          <Icon name="eye" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="status-modal-title">
          {t("admin.props.changeVisibility")}
        </h2>
        <p className="pp-modal__sublabel">{t("admin.props.selectNewVisibility")}</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selected ? (
            <>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[PUBLICATION_META[selected].variant] }} />
              <span className="pp-smodal__label">{tOr(valueKey("status", selected), selected)}</span>
            </>
          ) : (
            <span className="pp-amodal__trigger-placeholder">
              <Icon name="eye" size={16} />
              {t("admin.props.chooseVisibility")}
            </span>
          )}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen &&
          dropPos &&
          createPortal(
            <div className="pp-smodal__drop pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
              {VISIBILITY_OPTIONS.map((pub) => {
                const meta = PUBLICATION_META[pub];
                /* Two ways publishing can be out of reach, each with its own
                   explanation: nobody is assigned, or something has already
                   closed on the property. Never silently ignored. */
                const guard = pub === "published" ? canPublish(property) : ({ ok: true } as const);
                const needsAgent = pub === "published" && !property.agent;
                const blocked = needsAgent || !guard.ok;
                return (
                  <button
                    key={pub}
                    type="button"
                    disabled={blocked}
                    className={"pp-smodal__item" + (selected === pub ? " is-selected" : "") + (blocked ? " is-disabled" : "")}
                    onClick={() => {
                      setSelected(pub);
                      setDropOpen(false);
                    }}
                  >
                    <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[meta.variant] }} />
                    <span className="pp-smodal__label">{tOr(valueKey("status", pub), pub)}</span>
                    <span className="pp-smodal__spacer" />
                    {blocked ? (
                      <span className="pp-smodal__req">{needsAgent ? t("admin.props.needsAgent") : t(guard.ok ? "" : guard.reasonKey)}</span>
                    ) : (
                      <>
                        {property.publication === pub && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
                        {selected === pub && (
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
            <Icon name="eye" size={15} />
            {t("admin.props.changeVisibility")}
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

/* ---------------- create a contract ----------------
   Nothing is rendered here for it. Writing a contract used to open a modal on
   this page; it is a full page now, at /admin/contracts/new, because a lease
   asks about twenty questions and a panel could not hold them.

   The button NAVIGATES, carrying two things the person has already told us by
   standing on this screen: the property (pre-selected and locked) and the
   document type (taken from the listing, so a for-rent property opens the lease
   form with no chooser in front of it). See onCreateContract below. */

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

function FeatureModal({ featured, onCancel, onConfirm }: { featured: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  // featured → the action removes it; otherwise it features.
  const copy = featured
    ? { icon: "sparkle" as IconName, iconCls: " pp-modal__icon--warn", title: t("admin.props.unfeature"), body: t("admin.props.unfeatureBody"), cta: t("admin.props.unfeature"), ctaCls: " pp-modal__confirm--warn" }
    : { icon: "sparkles" as IconName, iconCls: " pp-modal__icon--status", title: t("admin.props.feature"), body: t("admin.props.featureBody"), cta: t("admin.props.feature"), ctaCls: "" };
  return createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="pd-feature-title">
        <div className={"pp-modal__icon" + copy.iconCls}>
          <Icon name={copy.icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="pd-feature-title">
          {copy.title}
        </h2>
        <p className="pp-modal__body">{copy.body}</p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.common.cancel")}
          </button>
          <button type="button" className={"pp-modal__confirm" + copy.ctaCls} onClick={onConfirm}>
            {copy.cta}
          </button>
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
        <Icon name={icon} size={18} />
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

function DetailHeader({ p, onEdit, onChangeVisibility, onAssignAgent, onArchive, onDelete, onFeature, onCreateContract, agentSurface }: { p: DetailProperty; onEdit: () => void; onChangeVisibility: () => void; onAssignAgent: () => void; onArchive: () => void; onDelete: () => void; onFeature: () => void; onCreateContract: () => void; agentSurface?: boolean }) {
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

  /* Two badges, two independent facts. The publication badge always shows; the
     availability badge appears ONLY when something has happened to the property,
     so an ordinary listing gains no extra noise. It carries the lock icon
     because it is derived from contracts — nothing here can set it. */
  const pubMeta = PUBLICATION_META[p.publication];
  const availMeta = AVAILABILITY_META[p.availability];
  const showAvailability = p.availability !== "available";
  return (
    <div className="pd-head__main">
        <div className="pd-head__intro">
          <div className="pd-head__titlerow">
            <h1 className="pd-head__title">{p.title}</h1>
            <span className="pd-head__badges">
              <Badge variant={pubMeta.variant} size="sm" dot={pubMeta.dot} icon={pubMeta.icon}>
                {t(valueKey("status", p.publication))}
              </Badge>
              {showAvailability && (
                <Badge variant={availMeta.variant} size="sm" icon="lock" title={t("admin.pd.availabilityDerived")}>
                  {t(valueKey("status", p.availability))}
                </Badge>
              )}
            </span>
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
          {/* Writing a contract is the second thing you can do to a property,
              in the slot "Change status" used to hold. Visibility moved into the
              ⋯ menu: it is housekeeping, and this is the transaction. */}
          {!agentSurface && (
            <Button hierarchy="secondary" size="md" iconLeading="file-signature" onClick={onCreateContract}>
              {t("admin.pd.createContract")}
            </Button>
          )}
          <Button hierarchy="primary" size="md" iconLeading="pencil" onClick={onEdit}>
            {t("admin.props.editProperty")}
          </Button>
          <div className="pd-morewrap" ref={menuRef}>
            <button type="button" className={"pd-morebtn" + (menuOpen ? " is-open" : "")} aria-label={t("admin.props.actions")} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
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
                    onChangeVisibility();
                  }}
                >
                  <Icon name="eye" size={17} />
                  {t("admin.props.changeVisibility")}
                </button>
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
                {!agentSurface && (
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onFeature();
                    }}
                  >
                    <Icon name={p.featured ? "sparkles" : "sparkle"} size={17} />
                    {t(p.featured ? "admin.props.unfeature" : "admin.props.feature")}
                  </button>
                )}
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
          <Field
            icon="circle-dot"
            label={t("admin.props.th.status")}
            value={t(valueKey("status", p.status))}
          />
          <Field
            icon="sparkles"
            label={t("admin.pd.f.featured")}
            value={t(p.featured ? "admin.pd.featured" : "admin.pd.standard")}
          />
          <Field icon="calendar-plus" label={t("admin.pd.f.dateCreated")} value={fmtDate(lang, new Date(p.specs.dateCreated))} />
          <Field icon="clock" label={t("admin.pd.f.lastUpdated")} value={fmtDate(lang, new Date(p.updated))} />
        </DGroup>

        <DGroup title={t("admin.pd.pricing")} desc={t("admin.pd.pricingDesc")}>
          <Field
            icon="wallet"
            label={t(p.listing === "sale" ? "admin.pd.f.askingPrice" : "admin.pd.f.monthlyRent")}
            /* One formatter, so this field can't disagree with the price shown
               in the header or the list. It used to glue a raw number to the
               spec table's currency LABEL — "720,000 USD · US Dollar". */
            value={formatPrice(lang, p.price) + (p.per ? t("admin.pd.perMonth") : "")}
            em
          />
        </DGroup>

        <DGroup title={t("admin.pd.location")} desc={t("admin.pd.locationDesc")} noRowDivider>
          <Field icon="building" label={t("admin.pd.f.city")} value={tOr(`city.${p.city}`, p.city)} />
          <Field icon="map-pin" label={t("admin.pd.f.area")} value={dash(p.district && tOr(`loc.${p.district}`, p.district))} />
          <Field icon="layers" label={t("admin.ap.f.project")} value={dash(p.project && tOr(`loc.${p.project}`, p.project))} />
          <Field icon="navigation" label={t("admin.ap.f.street")} value={dash(p.street)} />
          <Field icon="hash" label={t("admin.ap.f.building")} value={dash(p.building)} />
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
          <Field icon="car" label={t("admin.pd.f.garages")} value={num(s.garages)} />
          <Field icon="layers" label={t("admin.pd.f.floor")} value={dash(s.floor && localizeDigits(lang, String(s.floor)))} />
          <Field icon="calendar" label={t("admin.pd.f.yearBuilt")} value={s.yearBuilt ? localizeDigits(lang, String(s.yearBuilt)) : "—"} />
          <Field icon="compass" label={t("admin.pd.f.orientation")} value={s.orientation ? tOr(valueKey("admin.ap.orient", s.orientation), s.orientation) : "—"} />
          <Field icon="badge-check" label={t("admin.pd.f.condition")} value={s.condition ? tOr(valueKey("admin.ap.cond", s.condition), s.condition) : "—"} />
          <Field icon="sofa" label={t("admin.pd.f.furnished")} value={s.furnished ? tOr(valueKey("furnished", s.furnished), s.furnished) : "—"} />
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
                  ...(e.price !== undefined ? { price: formatPrice(lang, e.price) + (e.per ? t("admin.pd.perMonth") : "") } : {}),
                })}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

function Ownership({ p, agentSurface }: { p: DetailProperty; agentSurface?: boolean }) {
  const { t, lang } = useLang();
  // Owners are members, so link the profile to the member's detail page — like
  // the assigned-agent card. Fall back to a plain block when the owner has no
  // matching member record (e.g. a listing created with a free-typed owner).
  const { members } = useProperties();
  const member = members.find((m) => m.name === p.owner.name);
  const href = member ? `${agentSurface ? "/agent" : "/admin"}/members/${encodeURIComponent(member.id)}` : null;
  return (
    <SectionCard title={t("admin.pd.ownership")} desc={t("admin.pd.ownershipDesc")} id="owner">
      {href ? (
        <Link className="pd-owner pd-owner--link" href={href} title={t("admin.pd.viewMemberDetails", { name: p.owner.name })}>
          <Avatar name={p.owner.name} size="lg" />
          <div className="pd-owner__id">
            <span className="pd-owner__name">{p.owner.name}</span>
          </div>
          <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={18} className="pd-owner__go" />
        </Link>
      ) : (
        <div className="pd-owner">
          <Avatar name={p.owner.name} size="lg" />
          <div className="pd-owner__id">
            <span className="pd-owner__name">{p.owner.name}</span>
          </div>
        </div>
      )}
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

/**
 * The listing mandate — the agency's agreement with the OWNER.
 *
 * On the Overview tab, under Ownership, deliberately NOT on the Contracts tab.
 * A mandate is not a transaction: it is the permission to market the property
 * at all, and it belongs beside the person who granted it. Its commission rate
 * is the default every sale contract on this property inherits, which is why
 * the rate is called out rather than buried in a list.
 */
function Mandate({ p }: { p: DetailProperty }) {
  const { t, lang } = useLang();
  const m = p.mandate;
  if (!m) {
    return (
      <SectionCard title={t("admin.pd.mandate")} desc={t("admin.pd.mandateDesc")} id="mandate">
        <div className="pd-noagent">
          <span className="pd-noagent__art">
            <Icon name="file-signature" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.pd.mandateEmpty")}</p>
        </div>
      </SectionCard>
    );
  }
  const expired = new Date(m.expiresOn) < new Date(p.updated);
  return (
    <SectionCard title={t("admin.pd.mandate")} desc={t("admin.pd.mandateDesc")} id="mandate">
      <div className="pd-detailgroups">
        <DGroup title={t("admin.pd.mandateTerms")} cols={1} noRowDivider>
          <Field
            icon={m.exclusive ? "lock" : "unlock"}
            label={t("admin.pd.f.exclusivity")}
            value={t(m.exclusive ? "admin.pd.exclusive" : "admin.pd.nonExclusive")}
          />
          <Field icon="percent" label={t("admin.pd.f.commissionRate")} value={localizeDigits(lang, String(m.commissionRate)) + "%"} em />
          <Field icon="calendar-check" label={t("admin.pd.f.signedOn")} value={fmtDate(lang, new Date(m.signedOn))} />
          <Field
            icon={expired ? "calendar-x" : "calendar"}
            label={t("admin.pd.f.expiresOn")}
            value={
              <>
                {fmtDate(lang, new Date(m.expiresOn))}
                {expired && (
                  <>
                    {" "}
                    <Badge variant="warning" size="sm">
                      {t("admin.pd.mandateExpired")}
                    </Badge>
                  </>
                )}
              </>
            }
          />
        </DGroup>
      </div>
    </SectionCard>
  );
}

/* ---------------- contracts tab ---------------- */

/** Who the property changed hands with, on one contract. A member link when
    they have an account, a plain name when they do not — most buyers never
    register — and a dash where nobody has committed yet. */
function counterpartyOf(c: ContractRecord, memberName: (id?: string) => string | undefined): { name: string; id?: string } | null {
  const linked = memberName(c.buyerId);
  if (linked) return { name: linked, id: c.buyerId };
  if (c.buyerExternal) return { name: c.buyerExternal.name };
  return null;
}

function ContractsPanel({ p, agentSurface, onCreateContract }: { p: DetailProperty; agentSurface?: boolean; onCreateContract: () => void }) {
  const { t, lang } = useLang();
  const { payments, contractsByProperty, invoicesByContract, outstandingForContract } = useContracts();
  const { members } = useProperties();
  const rows = contractsByProperty(p.id);
  const memberName = (id?: string) => (id ? members.find((m) => m.id === id)?.name : undefined);
  const base = agentSurface ? "/agent" : "/admin";

  if (rows.length === 0) {
    return (
      <SectionCard title={t("admin.pd.contracts")} desc={t("admin.pd.contractsEmptyDesc")} id="contracts">
        <div className="pd-noagent">
          <span className="pd-noagent__art">
            <Icon name="file-signature" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.pd.contractsEmpty")}</p>
          {!agentSurface && (
            <Button hierarchy="primary" size="sm" iconLeading="file-signature" onClick={onCreateContract}>
              {t("admin.pd.createContract")}
            </Button>
          )}
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("admin.pd.contracts")}
      desc={t(rows.length === 1 ? "admin.pd.contractsCountOne" : "admin.pd.contractsCount", { count: fmtNum(lang, rows.length) })}
      action={
        !agentSurface && (
          <Button hierarchy="secondary" size="sm" iconLeading="file-signature" onClick={onCreateContract}>
            {t("admin.pd.createContract")}
          </Button>
        )
      }
      id="contracts"
    >
      <div className="pd-deals">
        {rows.map((c) => {
          const party = counterpartyOf(c, memberName);
          /* Toned from the SHARED contract-status map, so a status badge looks
             the same here as it does on the contracts list. Toning it by the
             property availability instead (which this panel used to do) made
             one contract read green on one screen and blue on the other. */
          const tone = CONTRACT_STATUS_META[c.status];
          const contractInvoices = invoicesByContract(c.id);
          const owed = outstandingForContract(c.id);
          const href = `${base}/contracts/${encodeURIComponent(c.id)}`;
          return (
            <div className="pd-deal" key={c.id}>
              <div className="pd-deal__head">
                <Link className="pd-deal__id" href={href}>
                  {localizeDigits(lang, c.id)}
                </Link>
                <Badge variant={c.kind === "sale" ? "brand" : "info"} size="sm">
                  {t(`admin.ct.kind.${c.kind}`)}
                </Badge>
                <span className="pd-deal__party">
                  {party ? (
                    party.id ? (
                      <Link href={`${base}/members/${encodeURIComponent(party.id)}`}>{party.name}</Link>
                    ) : (
                      <>
                        {party.name}
                        <span className="pd-deal__ext">{t("admin.pd.externalParty")}</span>
                      </>
                    )
                  ) : (
                    t("admin.pd.noCounterparty")
                  )}
                </span>
                <span className="pd-deal__spacer" />
                <Badge variant={tone.variant} size="sm" icon={"icon" in tone ? tone.icon : undefined}>
                  {t(`admin.ct.status.${c.status}`)}
                </Badge>
                {/* formatMoney, never formatApprox: a contract value is
                    authoritative and must never render as an estimate. */}
                <span className="pd-deal__value">{formatMoney(lang, contractValue(c))}</span>
              </div>

              <div className="pd-deal__line">
                <Icon name="calendar-check" size={15} />
                <span className="pd-deal__linelabel">{t("admin.ct.f.signedOn")}</span>
                <span className="pd-deal__linevalue">{c.signedOn ? fmtDate(lang, fromIso(c.signedOn)) : t("admin.ct.unsigned")}</span>
                <span className="pd-deal__spacer" />
                <Link className="pd-deal__action" href={href}>
                  {t("admin.pd.viewContract")}
                  <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={14} />
                </Link>
              </div>

              <div className="pd-deal__line">
                <Icon name="receipt" size={15} />
                <span className="pd-deal__linelabel">{t("admin.pd.invoices")}</span>
                <span className="pd-deal__linevalue">
                  {contractInvoices.length === 0
                    ? t("admin.pd.noInvoices")
                    : t("admin.pd.invoiceSummary", {
                        count: fmtNum(lang, contractInvoices.length),
                        paid: fmtNum(lang, contractInvoices.filter((i) => invoiceStatus(i, payments) === "paid").length),
                        owed: formatMoney(lang, owed),
                      })}
                </span>
                <span className="pd-deal__spacer" />
                <Link className="pd-deal__action" href={href}>
                  {t("admin.pd.viewInvoices")}
                  <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={14} />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
      <div className="pd-deals__foot">
        <Link className="pd-deals__all" href={`${base}/contracts`}>
          {t("admin.pd.allContracts")}
          <Icon name={isRtl(lang) ? "arrow-left" : "arrow-right"} size={15} />
        </Link>
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
      flush={rows.length > 0}
    >
      {rows.length === 0 ? (
        <div className="pd-noagent">
          <span className="pd-noagent__art">
            <Icon name="calendar" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.pd.viewingsEmpty")}</p>
        </div>
      ) : (
        <div className="pd-vtablewrap">
          <div className="pd-vtable">
            <div className="pd-vthead" role="row">
              <span className="pd-vth">{t("admin.members.th.member")}</span>
              <span className="pd-vth">{t("admin.props.th.agentShort")}</span>
              <span className="pd-vth">{t("admin.viewings.th.dateTime")}</span>
              <span className="pd-vth">{t("admin.props.th.status")}</span>
            </div>
            {rows.map((r) => {
              const st = VIEWING_STATUS[r.status] || { variant: "neutral" as const, icon: "clock" as const };
              return (
                <div className="pd-vrow" key={r.id}>
                  <div className="pd-vcell">
                    <span className="pd-vcell__label">{t("admin.members.th.member")}</span>
                    <div className="pd-vmember">
                      <Avatar src={r.img} name={r.member} size="md" />
                      <div className="pd-vmember__body">
                        <span className="pd-vmember__name">{r.member}</span>
                        {r.phone && r.phone !== "—" && <span className="pd-vmember__phone">{localizeDigits(lang, r.phone)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="pd-vcell">
                    <span className="pd-vcell__label">{t("admin.props.th.agentShort")}</span>
                    <div className="pd-vagent">
                      <Avatar src={r.agentImg || undefined} name={r.agent} size="sm" verified />
                      <span className="pd-vagent__name">{r.agent}</span>
                    </div>
                  </div>
                  <div className="pd-vcell">
                    <span className="pd-vcell__label">{t("admin.viewings.th.dateTime")}</span>
                    <div className="pd-vdt">
                      <span className="pd-vdt__date">{fmtStamp(lang, r.date)}</span>
                      <span className="pd-vdt__time">
                        <Icon name="clock" size={11} />
                        {localizeDigits(lang, r.time)}
                      </span>
                    </div>
                  </div>
                  <div className="pd-vcell">
                    <span className="pd-vcell__label">{t("admin.props.th.status")}</span>
                    <Badge variant={st.variant} size="sm" icon={st.icon}>
                      {t(valueKey("status", r.status))}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
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
  // Real figures only: agents with no approved reviews show no rating line.
  const rating = a.rating ?? "0";
  const reviews = a.reviews ?? 0;
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
          {reviews > 0 && (
            <span className="pd-agent__meta">
              <span className="pd-agent__rate">
                <Icon name="star" size={15} />
                {localizeDigits(lang, String(rating))}
              </span>
              <span className="pd-agent__reviews">({t("admin.pd.reviewsCount", { count: fmtNum(lang, Number(reviews)) })})</span>
            </span>
          )}
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
  const { t, lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { properties, updateProperty } = useProperties();

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
  const [featureOpen, setFeatureOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
  // Contracts sits between Viewings and Activity — the order follows the
  // lifecycle of a property: it is shown, it is transacted, then it is history.
  const [tab, setTab] = useState<"overview" | "viewings" | "contracts" | "activity">("overview");
  const [toasts, pushToast, dismissToast] = useToasts();
  const { contractsByProperty } = useContracts();

  const onEdit = () => router.push(`/admin/properties/${encodeURIComponent(property.id)}/edit?from=details`);

  /**
   * Write a contract on this property.
   *
   * THE TYPE IS NOT ASKED FOR — it comes from the listing. A for-rent property
   * opens the lease form directly; a for-sale one opens the sale form. Putting a
   * Sale/Lease chooser in front of somebody who is standing on a for-rent
   * listing would be asking a question the screen already answers.
   */
  const onCreateContract = () =>
    router.push(`/admin/contracts/new?type=${property.listing}&property=${encodeURIComponent(property.id)}`);

  const toastShown = useRef(false);
  useEffect(() => {
    if (toastShown.current) return;
    if (searchParams.get("toast") === "updated") {
      toastShown.current = true;
      const raf = requestAnimationFrame(() => pushToast({ tone: "success", icon: "circle-check", title: t("admin.props.toast.updatedTitle"), msg: t("admin.pd.toast.updatedMsg", { title: property.title }) }));
      return () => cancelAnimationFrame(raf);
    }
  }, [searchParams, property.title]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Visibility only. Availability is never set here — it is what a contract
     did. */
  const handleVisibility = (publication: Publication) => {
    const next = { publication, availability: property.availability };
    setProperty((p) => ({ ...p, publication, status: legacyStatus(next), published: publication === "published" }));
    updateProperty(property.id, { publication, status: legacyStatus(next), published: publication === "published" });
    setStatusOpen(false);
    pushToast({ tone: "brand", icon: "eye", title: t("admin.props.toast.visibilityTitle"), msg: t("admin.pd.toast.visibilityMsg", { title: property.title, status: t(valueKey("status", publication)) }) });
  };

  const handleAssign = (agent: DetailAgent) => {
    const wasAssigned = !!property.agent;
    const enriched = { ...agent, email: agent.email || agent.name.toLowerCase().replace(/[^a-z ]/g, "").trim().replace(/\s+/g, ".") + "@mail.chiya.estate", listings: agent.listings || 8 };
    setProperty((p) => ({ ...p, agent: enriched }));
    setAgentOpen(false);
    pushToast({ tone: "success", icon: "user-check", title: t(wasAssigned ? "admin.pd.toast.agentChangedTitle" : "admin.pd.toast.agentAssignedTitle"), msg: t("admin.pd.toast.agentMsg", { name: agent.name, title: property.title }) });
  };
  // Feature toggle — updates local view for instant feedback AND the store
  // (audited + persisted), matching the properties-list behaviour.
  const handleFeature = () => {
    const next = !property.featured;
    setProperty((p) => ({ ...p, featured: next }));
    updateProperty(property.id, { featured: next });
    setFeatureOpen(false);
    pushToast({
      tone: next ? "success" : "brand",
      icon: next ? "sparkles" : "sparkle",
      title: t(next ? "admin.props.toast.featuredTitle" : "admin.props.toast.unfeaturedTitle"),
      msg: t(next ? "admin.props.toast.featuredMsg" : "admin.props.toast.unfeaturedMsg", { title: property.title }),
    });
  };
  const handleArchive = () => {
    const next = { publication: "archived" as const, availability: property.availability };
    setProperty((p) => ({ ...p, publication: "archived", status: legacyStatus(next), published: false }));
    updateProperty(property.id, { publication: "archived", status: legacyStatus(next), published: false });
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

  const viewingsCount = getViewings(property.id).length;
  const activityCount = property.timeline.length;
  const contractsCount = contractsByProperty(property.id).length;

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label={t("admin.common.breadcrumb")}>
          <Link href="/admin/properties">{t("admin.nav.properties")}</Link>
          <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={14} />
          <span aria-current="page">{property.title}</span>
        </nav>

        <div className="vwd-panel">
          <div className="vwd-hero">
            <DetailHeader p={property} onEdit={onEdit} onChangeVisibility={() => setStatusOpen(true)} onAssignAgent={() => setAgentOpen(true)} onArchive={() => setConfirm("archive")} onDelete={() => setConfirm("delete")} onFeature={() => setFeatureOpen(true)} onCreateContract={onCreateContract} agentSurface={agentSurface} />
          </div>

          <div className="vwd-segwrap">
            <div className="vwd-seg" role="tablist" aria-label={t("admin.nav.properties")}>
              <button type="button" role="tab" aria-selected={tab === "overview"} className={"vwd-seg__btn" + (tab === "overview" ? " is-active" : "")} onClick={() => setTab("overview")}>
                {t("admin.vd.tab.overview")}
              </button>
              <button type="button" role="tab" aria-selected={tab === "viewings"} className={"vwd-seg__btn" + (tab === "viewings" ? " is-active" : "")} onClick={() => setTab("viewings")}>
                {t("admin.nav.viewings")}
                <span className="vwd-seg__count">{fmtNum(lang, viewingsCount)}</span>
              </button>
              <button type="button" role="tab" aria-selected={tab === "contracts"} className={"vwd-seg__btn" + (tab === "contracts" ? " is-active" : "")} onClick={() => setTab("contracts")}>
                {t("admin.pd.contracts")}
                <span className="vwd-seg__count">{fmtNum(lang, contractsCount)}</span>
              </button>
              <button type="button" role="tab" aria-selected={tab === "activity"} className={"vwd-seg__btn" + (tab === "activity" ? " is-active" : "")} onClick={() => setTab("activity")}>
                {t("admin.vd.tab.audit")}
                <span className="vwd-seg__count">{fmtNum(lang, activityCount)}</span>
              </button>
            </div>
          </div>

          <div className="vwd-panel__body">
            {tab === "overview" && (
              <div className="pd-grid">
                <div className="pd-grid__main">
                  <Gallery p={property} />
                  <PropertyInfo p={property} />
                  <InternalNotes p={property} onAdd={handleAddNote} onEdit={handleEditNote} onDelete={(i) => setNoteToDelete(i)} />
                </div>
                <aside className="pd-grid__aside">
                  <Ownership p={property} agentSurface={agentSurface} />
                  <AssignedAgent p={property} onAssignAgent={() => setAgentOpen(true)} agentSurface={agentSurface} />
                  {/* The mandate is the agreement with the OWNER, so it sits
                      under Ownership — not on the Deals tab. */}
                  <Mandate p={property} />
                </aside>
              </div>
            )}

            {tab === "viewings" && (
              <div className="pd-grid__main">
                <ViewingRequests p={property} onViewAll={() => router.push("/admin/viewings")} />
              </div>
            )}

            {tab === "contracts" && (
              <div className="pd-grid__main">
                <ContractsPanel p={property} agentSurface={agentSurface} onCreateContract={onCreateContract} />
              </div>
            )}

            {tab === "activity" && (
              <div className="pd-grid__main">
                <Timeline p={property} onViewAll={agentSurface ? () => {} : () => router.push("/admin/properties")} />
              </div>
            )}
          </div>
        </div>
      </header>

      {statusOpen && <ChangeVisibilityModal property={property} onCancel={() => setStatusOpen(false)} onConfirm={handleVisibility} />}
      {agentOpen && <AssignAgentModal property={property} onCancel={() => setAgentOpen(false)} onConfirm={handleAssign} />}
      {confirm && <ConfirmModal kind={confirm} property={property} onCancel={() => setConfirm(null)} onConfirm={confirm === "delete" ? handleDelete : handleArchive} />}
      {featureOpen && <FeatureModal featured={property.featured} onCancel={() => setFeatureOpen(false)} onConfirm={handleFeature} />}
      {noteToDelete !== null && property.notes[noteToDelete] && <DeleteNoteModal note={property.notes[noteToDelete]} onCancel={() => setNoteToDelete(null)} onConfirm={handleDeleteNote} />}

      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => (
          <PropToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
