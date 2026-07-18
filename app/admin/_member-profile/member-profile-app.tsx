"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtCurrency, fmtDate, fmtNum, fmtStamp, localizeDigits, roleKey, valueKey, popupLeft } from "@/lib/fmt";
import {
  INIT_NOTES,
  MEMBER_STATUS_META,
  NOTE_KIND,
  PROP_STATUS_META,
  ROLE_META,
  STATUS_DOT,
  VIEW_STATUS_META,
  buildMemberTimeline,
  buildMemberViewings,
  buildPortfolio,
  buildReassignAgents,
  toDetailMember,
  type MemberAgent,
  type MemberRecord,
  type NoteItem,
  type PortfolioRow,
  type MpfViewing,
  type TLItem,
} from "./data";
import { AddMemberModal } from "../_members/add-member-modal";
import { useProperties } from "../_shared/properties-store";
import { VIEWINGS as ALL_VIEWINGS } from "../_viewings/data";

const NOTE_MAX = 500;
function noteRoleLabel(role: string, t: (k: string, p?: Record<string, string | number>) => string) {
  const r = (role || "").trim();
  if (!r) return t("admin.pd.noteLabel");
  const key = roleKey(r);
  const name = t(key);
  return t("admin.pd.roleNote", { role: name === key ? r : name });
}

/* ---------------- toast ---------------- */
interface ToastData { id: number; tone?: string; icon: IconName; title: string; msg: string; out?: boolean }
function ProfToast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
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
function ChangeStatusModal({ current, onCancel, onConfirm }: { current: string; onCancel: () => void; onConfirm: (s: string) => void }) {
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
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
          {t("admin.mp.changeMemberStatus")}
        </h2>
        <p className="pp-modal__sublabel">{t("admin.props.selectNewStatus")}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
          {options.map((s) => (
            <button key={s} type="button" className={"pp-smodal__item" + (selected === s ? " is-selected" : "")} onClick={() => setSelected(s)}>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT[s] }} />
              <span className="pp-smodal__label">{tOr(valueKey("status", s), s)}</span>
              <span className="pp-smodal__spacer" />
              {current === s && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
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
            {t("admin.common.cancel")}
          </button>
          <button type="button" className={"pp-modal__confirm" + (selected === "Suspended" ? " pp-modal__confirm--warn" : "")} disabled={!canConfirm} onClick={() => selected && onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />
            {t("admin.props.changeStatus")}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignAgentModal({ current, agents, onCancel, onConfirm }: { current: string; agents: MemberAgent[]; onCancel: () => void; onConfirm: (a: MemberAgent) => void }) {
  const { t } = useLang();
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
  const selectedAgent = selected ? agents.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== current;
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign">
          <Icon name="user-cog" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="agent-modal-title">
          {t("admin.mp.reassignRelAgent")}
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
            {agents.map((agent) => (
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
                {current === agent.name && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
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
            {t("admin.common.cancel")}
          </button>
          <button
            type="button"
            className="pp-modal__confirm"
            disabled={!canConfirm}
            onClick={() => {
              const a = agents.find((x) => x.name === selected);
              if (a) onConfirm(a);
            }}
          >
            <Icon name="user-check" size={15} />
            {t("admin.pd.reassignAgent")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteMemberModal({ member, onCancel, onConfirm }: { member: MemberRecord; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  // Split on the {name} slot so each language places the emphasised name itself.
  const [before, after] = t("admin.mp.deleteBody").split("{name}");
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
          {t("admin.mp.deleteTitle")}
        </h2>
        <p className="pp-modal__body">
          {before}
          <strong>{member.name}</strong>
          {after}
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.common.cancel")}
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.mp.deleteConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteNoteModal({ note, onCancel, onConfirm }: { note: NoteItem; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  const [before, after] = t("admin.mp.deleteNoteBody").split("{note}");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const label = noteRoleLabel(note.role, t).toLowerCase();
  return (
    <div className="pp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="mpf-delnote-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="mpf-delnote-title">
          {t("admin.vd.deleteNoteTitle")}
        </h2>
        <p className="pp-modal__body">
          {before}
          <strong>{label}</strong>
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
    </div>
  );
}

/* ---------------- building blocks ---------------- */
function StatusBadge({ value, meta }: { value: string; meta: Record<string, { variant: BadgeVariant; icon?: IconName; dot?: boolean; cls?: string }> }) {
  const { t } = useLang();
  const m = (meta && meta[value]) || { variant: "neutral" as const };
  const key = valueKey("status", value);
  const label = t(key);
  return (
    <Badge variant={m.variant} size="sm" icon={m.icon} dot={m.dot} className={m.cls}>
      {label === key ? value : label}
    </Badge>
  );
}

function SectionCard({ title, count, desc, action, flush, children }: { title: string; count?: number; desc?: string; action?: ReactNode; flush?: boolean; children: ReactNode }) {
  const { lang } = useLang();
  return (
    <section className="pd-card">
      <div className="pd-card__head">
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">
              {title}
              {count != null && <span className="pd-card__count">{fmtNum(lang, count)}</span>}
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
  const { t, lang } = useLang();
  const loc = t(`loc.${row.loc}`) === `loc.${row.loc}` ? row.loc : t(`loc.${row.loc}`);
  return (
    <div className="mpf-prop">
      <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
      <div className="mpf-prop__body">
        <div className="mpf-prop__title">{row.title}</div>
        <div className={"mpf-prop__sub" + (mono ? " mpf-prop__sub--mono" : "")}>
          {mono ? (
            localizeDigits(lang, row.id)
          ) : (
            <>
              <Icon name="map-pin" size={12} />
              {loc}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceCell({ price, per }: { price: number; per?: string }) {
  const { t, lang } = useLang();
  return (
    <span className="mpf-price">
      {fmtCurrency(lang, price)}
      {per && <span className="mpf-price__per">{t("admin.mp.perMo")}</span>}
    </span>
  );
}

function BasicInfo({ member, pushToast }: { member: MemberRecord; pushToast: (t: Omit<ToastData, "id">) => void }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const copy = (labelKey: string, text: string) => {
    try {
      navigator.clipboard?.writeText(text);
    } catch {}
    pushToast({ tone: "default", icon: "copy", title: t("admin.mp.copied", { label: t(labelKey) }), msg: text });
  };
  return (
    <div className="adh__details">
      <div className="adh__detail">
        <span className="adh__detail__icon">
          <Icon name="phone" size={17} />
        </span>
        <div className="adh__detail__text">
          <span className="adh__detail__label">{t("admin.mp.phoneNumber")}</span>
          <span className="adh__detail__value">
            <span>{member.phone}</span>
            <button type="button" className="adh__copy" title={t("admin.mp.copyPhone")} aria-label={t("admin.mp.copyPhone")} onClick={() => copy("admin.mp.phoneNumber", member.phone)}>
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
          <span className="adh__detail__label">{t("admin.mp.memberTypes")}</span>
          <div className="adh__detailchips">
            {member.types.length === 0 && <span className="adh__detail__value">—</span>}
            {member.types.map((mt) => (
              <span className={"adh__chip adh__chip--" + mt.toLowerCase()} key={mt}>
                {tOr(roleKey(mt), mt)}
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
          <span className="adh__detail__label">{t("admin.mp.emailAddress")}</span>
          <span className="adh__detail__value">
            <span>{member.email}</span>
            <button type="button" className="adh__copy" title={t("admin.mp.copyEmail")} aria-label={t("admin.mp.copyEmail")} onClick={() => copy("admin.mp.emailAddress", member.email)}>
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
          <span className="adh__detail__label">{t("admin.props.th.date")}</span>
          <span className="adh__detail__value">
            <span>{fmtDate(lang, new Date(member.joinedFull))}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function PortfolioTable({ rows, hideAgent }: { rows: PortfolioRow[]; hideAgent?: boolean }) {
  const { t, lang } = useLang();
  return (
    <div className="mpf-tablewrap">
      <div className={"mpf-table mpf-table--portfolio" + (hideAgent ? " mpf-table--noagent" : "")}>
        <div className="mpf-thead">
          <span className="mpf-th">{t("admin.props.th.property")}</span>
          <span className="mpf-th">{t("admin.props.th.location")}</span>
          <span className="mpf-th">{t("admin.props.th.type")}</span>
          <span className="mpf-th">{t("admin.mp.th.role")}</span>
          {!hideAgent && <span className="mpf-th">{t("admin.mp.th.agent")}</span>}
          <span className="mpf-th">{t("admin.props.th.status")}</span>
          <span className="mpf-th">{t("admin.props.th.price")}</span>
          <span className="mpf-th">Date added</span>
          <span className="mpf-th mpf-th--end">Action</span>
        </div>
        {rows.map((row) => {
          // From the member's side, a property they bought reads "Bought" rather
          // than "Sold" (which is the seller-side / global label).
          const status = row.rel === "Buyer" && row.status === "Sold" ? "Bought" : row.status;
          // "area, city" → city only, to match the main properties table.
          const city = row.loc.split(",").pop()?.trim() || row.loc;
          return (
            <div className="mpf-trow" key={row.id + row.rel}>
              <PropCell row={row} mono />
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.location")}</span>
                <span className="mpf-prop__sub mpf-loc">
                  <Icon name="map-pin" size={12} />
                  {city}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.type")}</span>
                <span className="mpf-type">{row.type}</span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.mp.th.role")}</span>
                <Badge variant={(ROLE_META[row.rel] || {}).variant} className={(ROLE_META[row.rel] || {}).cls} size="sm">
                  {row.rel}
                </Badge>
              </div>
              {!hideAgent && (
                <div className="mpf-cell">
                  <span className="mpf-cell__label">{t("admin.mp.th.agent")}</span>
                  <span className="mpf-agentcell">
                    <Avatar src={row.agentImg || undefined} name={row.agent} size="sm" verified />
                    <span className="mpf-agentcell__name">{row.agent}</span>
                  </span>
                </div>
              )}
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.status")}</span>
                <StatusBadge value={status} meta={PROP_STATUS_META} />
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.price")}</span>
                <PriceCell price={row.price} per={row.per} />
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.date")}</span>
                <span className="mpf-date">{fmtDate(lang, new Date(row.date))}</span>
              </div>
              <div className="mpf-cell mpf-cell--end mpf-cell--action">
                <PropertyRowMenu propertyId={row.id} propertyTitle={row.title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Per-row kebab menu (mirrors the main properties / viewings tables). Portalled
   to <body> so the horizontally-scrolling table can't clip it. */
function PropertyRowMenu({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  // useCallback + a lang dep: calc closes over the reading direction, so a
  // stale copy would re-anchor the menu to the wrong edge after a switch.
  const calc = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, left: popupLeft(r, 200, isRtl(lang)) });
  }, [lang]);
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
  }, [open, calc]);
  return (
    <>
      <button ref={btnRef} type="button" className="mpf-kebab" aria-label={"Actions for " + propertyTitle} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
        <Icon name="more-horizontal" size={18} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div className="ax-menu mpf-rowmenu" role="menu" style={{ position: "fixed", top: pos.top, left: pos.left, width: 200 }}>
            <div className="ax-menu__sect">
              <Link className="ax-menu-item" role="menuitem" href={`/admin/properties/${propertyId}`} onClick={() => setOpen(false)}>
                <Icon name="building-2" size={17} />
                {t("admin.mp.viewProperty")}
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function ViewingsTable({ rows, hideAgent }: { rows: MpfViewing[]; hideAgent?: boolean }) {
  const { t, lang } = useLang();
  return (
    <div className="mpf-tablewrap">
      <div className={"mpf-table mpf-table--viewings" + (hideAgent ? " mpf-table--noagent" : "")}>
        <div className="mpf-thead">
          <span className="mpf-th">{t("admin.props.th.property")}</span>
          <span className="mpf-th">{t("admin.props.th.location")}</span>
          {!hideAgent && <span className="mpf-th">{t("admin.mp.th.agent")}</span>}
          <span className="mpf-th">{t("admin.mp.th.dateTime")}</span>
          <span className="mpf-th">{t("admin.props.th.status")}</span>
          <span className="mpf-th mpf-th--end">{t("admin.props.actions")}</span>
        </div>
        {rows.map((row, i) => {
          const [date, time] = row.requested.split(" · ");
          // "area, city" → city only, to match the main properties table.
          const city = row.loc.split(",").pop()?.trim() || row.loc;
          return (
            <div className="mpf-trow" key={row.id + i}>
              <PropCell row={row} mono />
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.location")}</span>
                <span className="mpf-prop__sub mpf-loc">
                  <Icon name="map-pin" size={12} />
                  {city}
                </span>
              </div>
              {!hideAgent && (
                <div className="mpf-cell">
                  <span className="mpf-cell__label">{t("admin.mp.th.agent")}</span>
                  <span className="mpf-agentcell">
                    <Avatar src={row.agentImg || undefined} name={row.agent} size="sm" verified />
                    <span className="mpf-agentcell__name">{row.agent}</span>
                  </span>
                </div>
              )}
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.mp.th.dateTime")}</span>
                <span className="mpf-dt">
                  <span className="mpf-dt__date">{fmtDate(lang, new Date(date))}</span>
                  {time && (
                    <span className="mpf-dt__time">
                      <Icon name="clock" size={11} />
                      {localizeDigits(lang, time)}
                    </span>
                  )}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.status")}</span>
                <StatusBadge value={row.status} meta={VIEW_STATUS_META} />
              </div>
              <div className="mpf-cell mpf-cell--end mpf-cell--action">
                <PropertyRowMenu propertyId={row.id} propertyTitle={row.title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label={t("admin.pd.noteAria")} placeholder={t("admin.mp.notePh")} />
      <div className="pd-notecomposer__foot">
        <span className={"pd-notecomposer__hint" + (remaining <= 50 ? " is-low" : "")}>{t("admin.pd.charsLeft", { count: fmtNum(lang, remaining) })}</span>
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

function NotesSection({ notes, onAdd, onEdit, onDelete }: { notes: NoteItem[]; onAdd: (t: string) => void; onEdit: (i: number, t: string) => void; onDelete: (i: number) => void }) {
  const { t, lang } = useLang();
  const [composing, setComposing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const handleSave = (text: string) => {
    onAdd(text);
    setComposing(false);
  };
  return (
    <SectionCard
      title={t("admin.pd.notes")}
      count={notes.length}
      desc={t("admin.mp.notesDesc")}
      action={
        !composing &&
        editing == null && (
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setComposing(true)}>
            {t("admin.pd.addNote")}
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
              <p>{t("admin.mp.notesEmpty")}</p>
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
                      <span className="pd-note__label">{noteRoleLabel(n.role, t)}</span>
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
                        <button type="button" className="pd-note__delete" aria-label={"Delete note from " + n.author} title="Delete note" onClick={() => onDelete(i)}>
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
function Timeline({ items }: { items: TLItem[] }) {
  const { t, lang } = useLang();
  return (
    <ul className="pd-timeline">
      {items.map((it, i) => (
        <li className="pd-tl" key={i}>
          <span className="pd-tl__dot" style={{ background: TL_TONE[it.tone], boxShadow: `0 0 0 4px color-mix(in srgb, ${TL_TONE[it.tone]} 16%, transparent)` }}>
            <Icon name={it.icon} size={13} strokeWidth={2.2} />
          </span>
          <div className="pd-tl__body">
            <div className="pd-tl__top">
              <span className="pd-tl__title">{t(it.titleKey)}</span>
              <span className="pd-tl__time">{fmtStamp(lang, it.time)}</span>
            </div>
            <p className="pd-tl__desc">
              {t(it.descKey, {
                ...(it.params || {}),
                ...(it.price !== undefined ? { price: fmtCurrency(lang, it.price) + (it.per ? t("admin.mp.perMo") : "") } : {}),
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function MemberProfileApp({ scopeAgent }: { scopeAgent?: string } = {}) {
  const { t, lang } = useLang();
  const { members, properties, agents } = useProperties();
  // In the agent surface, list-level links point at the agent's own routes.
  const surfaceBase = scopeAgent ? "/agent" : "/admin";
  const params = useParams();
  const id = String((params?.id as string) ?? "");
  // Unknown ids fall back to the first member on the roster so the page always
  // renders a real, catalog-consistent record.
  const catalogMember = useMemo(() => members.find((mm) => mm.id === id) ?? members[0], [members, id]);
  const resolved = useMemo(() => toDetailMember(catalogMember, properties), [catalogMember, properties]);
  const portfolio = useMemo(() => buildPortfolio(properties, catalogMember.name), [catalogMember, properties]);
  const timeline = useMemo(() => buildMemberTimeline(properties, catalogMember), [catalogMember, properties]);
  const reassignAgents = useMemo(() => buildReassignAgents(agents), [agents]);

  // Agent scope: portfolio + viewing requests show only what involves this agent.
  const shownPortfolio = useMemo(() => (scopeAgent ? portfolio.filter((r) => r.agent === scopeAgent) : portfolio), [portfolio, scopeAgent]);
  const shownViewings = useMemo(() => {
    if (!scopeAgent) return buildMemberViewings(properties, catalogMember.name);
    const SMAP: Record<string, string> = { Requested: "Pending", Confirmed: "Confirmed", Completed: "Completed", Cancelled: "Cancelled", "No Show": "Cancelled" };
    // Viewings under this agent that touch this member: on the member's own
    // listings (same properties as the portfolio) or requested by the member.
    const memberTitles = new Set(shownPortfolio.map((r) => r.title));
    return ALL_VIEWINGS.filter((v) => v.agent === scopeAgent && (v.member === resolved.name || memberTitles.has(v.property.title))).map((v) => ({
      id: v.id,
      title: v.property.title,
      loc: v.property.location,
      img: v.property.img,
      requested: `${v.date} · ${v.time}`,
      agent: v.agent,
      agentImg: "",
      status: SMAP[v.status] || v.status,
    }));
  }, [scopeAgent, resolved.name, shownPortfolio, properties, catalogMember.name]);

  const [m, setM] = useState<MemberRecord>(resolved);
  const [status, setStatus] = useState(resolved.status);
  const [, setAgent] = useState<MemberAgent | null>(resolved.agent);
  // reset editable state when navigating to a different member
  const [prevId, setPrevId] = useState(id);
  if (prevId !== id) {
    setPrevId(id);
    setM(resolved);
    setStatus(resolved.status);
    setAgent(resolved.agent);
  }
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
                <StatusBadge value={status} meta={MEMBER_STATUS_META} />
              </div>
              <div className="pd-head__meta">
                <span className="pd-head__metaitem pd-head__metaitem--id">
                  <Icon name="hash" size={13} />
                  {localizeDigits(lang, m.id)}
                </span>
                <span className="pd-head__sep" />
                <span className="pd-head__metaitem">
                  <Icon name="calendar" size={14} />
                  {t("admin.mp.memberSince", { date: fmtDate(lang, new Date(m.joinedShort)) })}
                </span>
              </div>
            </div>
          </div>

          <div className="pd-head__actions">
            {!scopeAgent && (
              <Button
                hierarchy="secondary"
                iconLeading="refresh-cw"
                onClick={() => {
                  setMoreOpen(false);
                  setModal("status");
                }}
              >
                {t("admin.props.changeStatus")}
              </Button>
            )}
            {!scopeAgent && (
              <Button
                hierarchy="primary"
                iconLeading="pencil"
                onClick={() => {
                  setMoreOpen(false);
                  setModal("edit");
                }}
              >
                {t("admin.mp.editMember")}
              </Button>
            )}
            {!scopeAgent && (
            <div className="pd-morewrap" ref={moreRef}>
              <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label="More actions" aria-haspopup="true" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
                <Icon name="ellipsis" size={20} />
              </button>
              {moreOpen && (
                <div className="pd-moremenu" role="menu">
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
                    {t("admin.mp.deleteConfirm")}
                  </button>
                </div>
              )}
            </div>
            )}
          </div>
        </div>
      </header>

      <div className="pd-grid pd-grid--full">
        <div className="pd-grid__main">
          <SectionCard title={t("admin.pd.basic")} desc={t("admin.mp.basicDesc")}>
            <BasicInfo member={m} pushToast={pushToast} />
          </SectionCard>

          <SectionCard
            title={t("admin.mp.portfolio")}
            count={shownPortfolio.length}
            desc={t("admin.mp.portfolioDesc")}
            action={
              <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href={`${surfaceBase}/properties`} style={{ color: "var(--text-secondary)" }}>
                {t("admin.common.viewAll")}
              </Button>
            }
            flush
          >
            {shownPortfolio.length > 0 ? (
              <PortfolioTable rows={shownPortfolio} hideAgent={!!scopeAgent} />
            ) : (
              <div className="pd-noagent">
                <span className="pd-noagent__art">
                  <Icon name="building-2" size={24} strokeWidth={1.6} />
                </span>
                <p>{t("admin.mp.portfolioEmpty")}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={t("admin.pd.viewingRequests")}
            count={shownViewings.length}
            desc={t("admin.mp.viewingsDesc")}
            action={
              <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href={`${surfaceBase}/viewings`} style={{ color: "var(--text-secondary)" }}>
                {t("admin.common.viewAll")}
              </Button>
            }
            flush
          >
            {shownViewings.length > 0 ? (
              <ViewingsTable rows={shownViewings} hideAgent={!!scopeAgent} />
            ) : (
              <div className="pd-noagent">
                <span className="pd-noagent__art">
                  <Icon name="calendar" size={24} strokeWidth={1.6} />
                </span>
                <p>{t("admin.mp.viewingsEmpty")}</p>
              </div>
            )}
          </SectionCard>

          <NotesSection
            notes={notes}
            onAdd={(text) => {
              setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "@time.now", kind: "note", text }, ...ns]);
              pushToast({ tone: "brand", icon: "check", title: t("admin.vd.toast.noteAddedTitle"), msg: t("admin.mp.toast.noteAddedMsg") });
            }}
            onEdit={(i, text) => {
              setNotes((ns) => ns.map((n, idx) => (idx === i ? { ...n, text, time: "@admin.vd.editedJustNow" } : n)));
              pushToast({ tone: "brand", icon: "pencil", title: t("admin.vd.toast.noteUpdatedTitle"), msg: t("admin.vd.toast.noteUpdatedMsg") });
            }}
            onDelete={(i) => setNoteToDelete(i)}
          />

          <SectionCard
            title={t("admin.pd.timeline")}
            desc={t("admin.mp.timelineDesc")}
            action={
              <Button
                hierarchy="link"
                size="sm"
                iconTrailing="arrow-right"
                style={{ color: "var(--text-secondary)" }}
                onClick={() => pushToast({ tone: "brand", icon: "history", title: t("admin.mp.toast.activityTitle"), msg: t("admin.mp.toast.activityMsg", { name: m.name }) })}
              >
                {t("admin.common.viewAll")}
              </Button>
            }
          >
            <Timeline items={timeline} />
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
            pushToast({ tone: s === "Suspended" ? "danger" : "brand", icon: s === "Suspended" ? "circle-pause" : "circle-check", title: t("admin.props.toast.statusTitle"), msg: t("admin.mp.toast.statusMsg", { name: m.name, status: t(valueKey("status", s)) }) });
          }}
        />
      )}
      {modal === "assign" && (
        <AssignAgentModal
          current={m.agent?.name ?? ""}
          agents={reassignAgents}
          onCancel={() => setModal(null)}
          onConfirm={(a) => {
            setAgent(a);
            setModal(null);
            pushToast({ tone: "brand", icon: "user-check", title: t("admin.mp.toast.agentTitle"), msg: t("admin.mp.toast.agentMsg", { agent: a.name, name: m.name }) });
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
          pushToast({ tone: "brand", icon: "badge-check", title: t("admin.mp.toast.updatedTitle"), msg: t("admin.mp.toast.updatedMsg", { name: v.name.trim() || m.name }) });
        }}
      />
      {modal === "delete" && (
        <DeleteMemberModal
          member={m}
          onCancel={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            pushToast({ tone: "danger", icon: "trash-2", title: t("admin.mp.toast.deletedTitle"), msg: t("admin.mp.toast.deletedMsg", { name: m.name }) });
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
            pushToast({ tone: "danger", icon: "trash-2", title: t("admin.vd.toast.noteDeletedTitle"), msg: t("admin.vd.toast.noteDeletedMsg", { author: removed.author }) });
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
