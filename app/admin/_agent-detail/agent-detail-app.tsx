"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/input";
import { StatCard } from "@/components/data/stat-card";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtCurrency, fmtDate, fmtNum, fmtPercent, fmtStamp, localizeDigits, resolveParams, roleKey, valueKey, popupLeft } from "@/lib/fmt";
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
          {t("admin.ad.changeAgentStatus")}
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

function DeleteAgentModal({ agent, onCancel, onConfirm }: { agent: AgentDetail; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  const [before, after] = t("admin.ad.deleteBody").split("{name}");
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
          {t("admin.ad.deleteTitle")}
        </h2>
        <p className="pp-modal__body">
          {before}
          <strong>{agent.name}</strong>
          {after}
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.common.cancel")}
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.ad.deleteConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteNoteModal({ note, onCancel, onConfirm }: { note: NoteItem; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  const [before, after] = t("admin.ad.deleteNoteBody").split("{note}");
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
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="ad-delnote-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="ad-delnote-title">
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
function StatusBadge({ value, meta }: { value: string; meta: Record<string, { variant: import("@/components/ui/badge").BadgeVariant; icon?: IconName; dot?: boolean; cls?: string }> }) {
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

function SectionCard({ title, count, desc, action, feature, flush, children }: { title: string; count?: number; desc?: string; action?: ReactNode; feature?: boolean; flush?: boolean; children: ReactNode }) {
  const { lang } = useLang();
  return (
    <section className={"pd-card" + (feature ? " pd-card--feature" : "")}>
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

function PropCell({ row }: { row: ListingRow }) {
  const { lang } = useLang();
  return (
    <div className="mpf-prop">
      <img className="mpf-prop__thumb" src={row.img} alt="" loading="lazy" />
      <div className="mpf-prop__body">
        <div className="mpf-prop__title">{row.title}</div>
        <div className="mpf-prop__sub mpf-prop__sub--mono">{localizeDigits(lang, row.id)}</div>
      </div>
    </div>
  );
}

function ProfileHero({ agent, pushToast }: { agent: AgentDetail; pushToast: (t: Omit<ToastData, "id">) => void }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
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
            <h2 className="pd-card__title">{t("admin.pd.basic")}</h2>
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
              <span className="adh__detail__label">{t("admin.mp.phoneNumber")}</span>
              <span className="adh__detail__value">
                <span>{agent.phone}</span>
                <button type="button" className="adh__copy" title={t("admin.mp.copyPhone")} aria-label={t("admin.mp.copyPhone")} onClick={() => copy("Phone number", agent.phone)}>
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
              <span className="adh__detail__label">{t("admin.ad.serviceAreas")}</span>
              <div className="adh__detailchips">
                {agent.areas.map((a) => (
                  <span className="adh__chip" key={a}>
                    {tOr(`city.${a}`, a)}
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
                <span>{agent.email}</span>
                <button type="button" className="adh__copy" title={t("admin.mp.copyEmail")} aria-label={t("admin.mp.copyEmail")} onClick={() => copy("Email address", agent.email)}>
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
              <span className="adh__detail__label">{t("admin.ad.languages")}</span>
              <div className="adh__detailchips">
                {agent.languages.map((l) => (
                  <span className="adh__chip" key={l}>
                    {tOr(valueKey("admin.ad.lang", l), l)}
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
              <span className="adh__detail__label">{t("admin.ad.experience")}</span>
              <span className="adh__detail__value">
                <span>{t("admin.ad.years", { count: fmtNum(lang, agent.experience) })}</span>
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
                <span>{fmtDate(lang, new Date(agent.joinedFull))}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListingsTable({ rows }: { rows: ListingRow[] }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--listings">
        <div className="mpf-thead">
          <span className="mpf-th">{t("admin.props.th.property")}</span>
          <span className="mpf-th">{t("admin.props.th.location")}</span>
          <span className="mpf-th">{t("admin.props.th.type")}</span>
          <span className="mpf-th">{t("admin.props.th.owner")}</span>
          <span className="mpf-th">{t("admin.props.th.listing")}</span>
          <span className="mpf-th">{t("admin.props.th.status")}</span>
          <span className="mpf-th">{t("admin.props.th.price")}</span>
          <span className="mpf-th">{t("admin.props.th.date")}</span>
          <span className="mpf-th mpf-th--end">{t("admin.props.actions")}</span>
        </div>
        {rows.map((row) => {
          // "area, city" → city only, to match the main properties table.
          const city = row.loc.split(",").pop()?.trim() || row.loc;
          return (
            <div className="mpf-trow" key={row.id}>
              <PropCell row={row} />
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.location")}</span>
                <span className="mpf-prop__sub mpf-loc">
                  <Icon name="map-pin" size={12} />
                  {city}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.type")}</span>
                <span className="mpf-type">{tOr(valueKey("type", row.propertyType), row.propertyType)}</span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.owner")}</span>
                <span className="mpf-owner">{row.owner}</span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.listing")}</span>
                <Badge variant={(LISTING_TYPE_META[row.type] || {}).variant} size="sm">
                  {t(row.type === "For sale" ? "admin.pd.forSale" : "admin.pd.forRent")}
                </Badge>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.status")}</span>
                <StatusBadge value={row.status} meta={LISTING_STATUS_META} />
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.price")}</span>
                <span className="mpf-price">
                  {fmtCurrency(lang, row.price)}
                  {row.per && <span className="mpf-price__per">{t("admin.mp.perMo")}</span>}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.date")}</span>
                <span className="mpf-date">{fmtDate(lang, new Date(row.date))}</span>
              </div>
              <div className="mpf-cell mpf-cell--end mpf-cell--action">
                <RowMenu href={`/admin/properties/${row.id}`} label={t("admin.mp.viewProperty")} icon="building-2" ariaName={row.title} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MembersTable({ rows }: { rows: MemberRow[] }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--amembers">
        <div className="mpf-thead">
          <span className="mpf-th">{t("admin.members.th.member")}</span>
          <span className="mpf-th">{t("admin.members.th.roles")}</span>
          <span className="mpf-th">{t("admin.members.th.phone")}</span>
          <span className="mpf-th">{t("admin.members.th.joined")}</span>
          <span className="mpf-th">{t("admin.props.th.status")}</span>
          <span className="mpf-th mpf-th--end">{t("admin.props.actions")}</span>
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
              <span className="mpf-cell__label">{t("admin.members.th.roles")}</span>
              <span className="mpf-roletags">
                {row.roles.map((r) => (
                  <Badge key={r} variant="neutral" className={(ROLE_META[r] || {}).cls} size="sm">
                    {tOr(roleKey(r), r)}
                  </Badge>
                ))}
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">{t("admin.members.th.phone")}</span>
              <span className="mpf-memphone">
                <Icon name="phone" size={13} />
                {row.phone}
              </span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">{t("admin.members.th.joined")}</span>
              <span className="mpf-date">{fmtStamp(lang, row.activity)}</span>
            </div>
            <div className="mpf-cell">
              <span className="mpf-cell__label">{t("admin.props.th.status")}</span>
              <StatusBadge value={row.status} meta={MEMBER_STATUS_META} />
            </div>
            <div className="mpf-cell mpf-cell--end mpf-cell--action">
              <RowMenu href={`/admin/members/${row.id}`} label={t("admin.ad.viewMember")} icon="user" ariaName={row.name} />
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
      <button ref={btnRef} type="button" className="mpf-kebab" aria-label={t("admin.ad.actionsFor", { name: ariaName })} aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
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
  const { t, lang } = useLang();
  return (
    <div className="mpf-tablewrap">
      <div className="mpf-table mpf-table--aviewings">
        <div className="mpf-thead">
          <span className="mpf-th">{t("admin.props.th.property")}</span>
          <span className="mpf-th">{t("admin.props.th.location")}</span>
          <span className="mpf-th">{t("admin.members.th.member")}</span>
          <span className="mpf-th">Date &amp; time</span>
          <span className="mpf-th">{t("admin.props.th.status")}</span>
          <span className="mpf-th mpf-th--end">{t("admin.props.actions")}</span>
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
                  <div className="mpf-prop__sub mpf-prop__sub--mono">{localizeDigits(lang, row.id)}</div>
                </div>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.props.th.location")}</span>
                <span className="mpf-prop__sub mpf-loc">
                  <Icon name="map-pin" size={12} />
                  {city}
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">{t("admin.members.th.member")}</span>
                <span className="mpf-memcell">
                  <Avatar src={row.memberImg} name={row.member} size="sm" />
                  <span className="mpf-memcell__name">{row.member}</span>
                </span>
              </div>
              <div className="mpf-cell">
                <span className="mpf-cell__label">Date &amp; time</span>
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
                <RowMenu href={`/admin/properties/${row.id}`} label={t("admin.mp.viewProperty")} icon="building-2" ariaName={row.title} />
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
  const { t, lang } = useLang();
  return (
    <div className="adr">
      <div className="adr__summary">
        <div className="adr__big">{localizeDigits(lang, String(agent.rating))}</div>
        <span className="adr__stars">
          {[1, 2, 3, 4, 5].map((i) => (
            <Icon key={i} name="star" size={17} strokeWidth={1.6} className={i <= Math.round(agent.rating) ? "" : "is-off"} style={{ fill: i <= Math.round(agent.rating) ? "var(--brand-accent)" : "transparent" }} />
          ))}
        </span>
        <div className="adr__count">{t("admin.ad.basedOn", { count: fmtNum(lang, agent.reviews) })}</div>
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
                <div className="adr-card__when">{fmtStamp(lang, r.when)}</div>
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
  const { t, lang } = useLang();
  return (
    <ul className="pd-timeline">
      {TIMELINE.map((it, i) => (
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
                ...resolveParams(it.params, t),
                ...(it.price !== undefined ? { price: fmtCurrency(lang, it.price) + (it.per ? t("admin.mp.perMo") : "") } : {}),
              })}
            </p>
          </div>
        </li>
      ))}
    </ul>
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
      <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} rows={3} maxLength={NOTE_MAX} aria-label={t("admin.pd.noteAria")} placeholder={t("admin.ad.notePh")} />
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
      desc={t("admin.ad.notesDesc")}
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
              <p>{t("admin.ad.notesEmpty")}</p>
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

export function AgentDetailApp() {
  const { t, lang } = useLang();
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
    pushToast({ tone: "brand", icon: "badge-check", title: t("admin.ad.toast.updatedTitle"), msg: t("admin.ad.toast.updatedMsg", { name: values.name }) });
  };
  const statusVariant = status === "Active" ? "success" : "error";

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label={t("admin.common.breadcrumb")}>
          <Link href="/admin/agents">{t("admin.nav.agents")}</Link>
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
                  {t(valueKey("status", a.verification))}
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
              {t("admin.props.changeStatus")}
            </Button>
            <Button hierarchy="primary" iconLeading="pencil" onClick={editAgent}>
              {t("admin.ad.editAgent")}
            </Button>
            <div className="pd-morewrap" ref={moreRef}>
              <button type="button" className={"pd-morebtn" + (moreOpen ? " is-open" : "")} aria-label={t("admin.props.actions")} aria-haspopup="true" aria-expanded={moreOpen} onClick={() => setMoreOpen((v) => !v)}>
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
                      pushToast({ tone: "brand", icon: "badge-check", title: t("admin.ad.toast.verifyTitle"), msg: t("admin.ad.toast.verifyMsg", { name: a.name }) });
                    }}
                  >
                    <Icon name="shield-check" size={17} />
                    {t("admin.ad.manageVerification")}
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
                    {t("admin.ad.deleteConfirm")}
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

      <SectionCard title={t("admin.ad.perfSummary")} desc={t("admin.ad.perfSummaryDesc")}>
        <div className="adk">
          {kpis.map((k) => (
            <StatCard key={k.key} label={t(k.labelKey)} value={k.percent ? fmtPercent(lang, k.value) : fmtNum(lang, k.value)} icon={k.icon} tone={k.tone} sub={t(k.subKey)} />
          ))}
        </div>
      </SectionCard>

      <div style={{ height: 22 }} />

      <div className="pd-grid__main">
        <SectionCard
          title={t("admin.ad.listings")}
          count={listings.length}
          desc={t("admin.ad.listingsDesc")}
          action={
            <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href="/admin/properties" className="agt-linkbtn">
              {t("admin.common.viewAll")}
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
              <p>{t("admin.ad.listingsEmpty")}</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t("admin.ad.members")}
          count={agentMembers.length}
          desc={t("admin.ad.membersDesc")}
          action={
            <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href="/admin/members" className="agt-linkbtn">
              {t("admin.common.viewAll")}
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
              <p>{t("admin.ad.membersEmpty")}</p>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title={t("admin.nav.viewings")}
          count={VIEWINGS.length}
          desc={t("admin.ad.viewingsDesc")}
          action={
            <Button hierarchy="link" size="sm" iconTrailing="arrow-right" href="/admin/viewings" className="agt-linkbtn">
              {t("admin.common.viewAll")}
            </Button>
          }
          flush
        >
          <ViewingsTable rows={VIEWINGS} />
        </SectionCard>

        <SectionCard
          title={t("admin.nav.reviews")}
          count={a.reviews}
          desc={t("admin.ad.reviewsDesc")}
          action={
            <Button
              hierarchy="link"
              size="sm"
              iconTrailing="arrow-right"
              className="agt-linkbtn"
              onClick={() => pushToast({ tone: "brand", icon: "star", title: t("admin.nav.reviews"), msg: t("admin.ad.toast.reviewsMsg", { name: a.name }) })}
            >
              {t("admin.common.viewAll")}
            </Button>
          }
        >
          <Reviews agent={a} />
        </SectionCard>

        <NotesSection
          notes={notes}
          onAdd={(text) => {
            setNotes((ns) => [{ author: "Rêbîn Kawa", role: "Super Admin", time: "@time.now", kind: "note", text }, ...ns]);
            pushToast({ tone: "brand", icon: "check", title: t("admin.vd.toast.noteAddedTitle"), msg: t("admin.ad.toast.noteAddedMsg") });
          }}
          onEdit={(i, text) => {
            setNotes((ns) => ns.map((n, idx) => (idx === i ? { ...n, text, time: "@admin.vd.editedJustNow" } : n)));
            pushToast({ tone: "brand", icon: "pencil", title: t("admin.vd.toast.noteUpdatedTitle"), msg: t("admin.vd.toast.noteUpdatedMsg") });
          }}
          onDelete={(i) => setNoteToDelete(i)}
        />

        <SectionCard
          title={t("admin.pd.timeline")}
          desc={t("admin.ad.timelineDesc")}
          action={
            <Button
              hierarchy="link"
              size="sm"
              iconTrailing="arrow-right"
              className="agt-linkbtn"
              onClick={() => pushToast({ tone: "brand", icon: "history", title: t("admin.mp.toast.activityTitle"), msg: t("admin.mp.toast.activityMsg", { name: a.name }) })}
            >
              {t("admin.common.viewAll")}
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
            pushToast({ tone: s === "Suspended" ? "danger" : "brand", icon: s === "Suspended" ? "circle-pause" : "circle-check", title: t("admin.props.toast.statusTitle"), msg: t("admin.mp.toast.statusMsg", { name: a.name, status: t(valueKey("status", s)) }) });
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
            pushToast({ tone: "danger", icon: "trash-2", title: t("admin.ad.toast.deletedTitle"), msg: t("admin.ad.toast.deletedMsg", { name: a.name }) });
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
