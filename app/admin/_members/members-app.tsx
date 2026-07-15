"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtNum, monthName, weekdayName, fmtDate as fmtDateI18n, popupLeft } from "@/lib/fmt";
import { AddMemberModal } from "./add-member-modal";
import {
  EMPTY_FILTERS,
  ITEMS_PER_PAGE,
  KPI_CARDS,
  MEMBER_STATUS,
  MP_MONTHS,
  MP_TODAY,
  MP_WD,
  ROLE_META,
  ROLE_TABS,
  fmtDate,
  sameDay,
  type MemberFilters,
  type MemberRecord,
} from "./data";
import { useProperties } from "../_shared/properties-store";
import { countMembers } from "../_data/catalog";

type SelectOption = { value: string; label: string };

function PaginationFooter({ currentPage, totalItems, onPageChange }: { currentPage: number; totalItems: number; onPageChange: (p: number) => void }) {
  const { t, lang } = useLang();
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const start = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };
  if (totalItems === 0) return null;
  return (
    <div className="mp-tablefooter">
      <span className="mp-pagination__info">
        {t("admin.members.showingRange", { start: fmtNum(lang, start), end: fmtNum(lang, end), total: fmtNum(lang, totalItems) })}
      </span>
      <div className="mp-pagination">
        <button type="button" className="mp-page-btn mp-page-btn--nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />
          {t("admin.props.prev")}
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={"e" + i} className="mp-page-ellipsis">
              …
            </span>
          ) : (
            <button key={p} type="button" className={"mp-page-btn" + (p === currentPage ? " is-active" : "")} onClick={() => onPageChange(p)}>
              {fmtNum(lang, p)}
            </button>
          ),
        )}
        <button type="button" className="mp-page-btn mp-page-btn--nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          {t("admin.props.next")}
          <Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>
  );
}

function MpCustomSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: SelectOption[]; placeholder: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
  };
  const toggle = () => {
    if (!open) calcPos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".mp-custdrop")?.contains(e.target as Node)) return;
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
    <div className="mp-datebtn-wrap" ref={btnRef}>
      <button type="button" className={"mp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")} onClick={toggle}>
        <span className="mp-datebtn__label">{options.find((o) => o.value === value)?.label || placeholder}</span>
        {value && (
          <span
            className="mp-datebtn__clear"
            role="button"
            tabIndex={0}
            aria-label={t("admin.props.clear")}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
          >
            <Icon name="x" size={12} />
          </span>
        )}
        <Icon name="chevron-down" size={14} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div className="mp-custdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={"mp-custdrop__item" + (value === o.value ? " is-selected" : "")}
                onClick={() => {
                  onChange(value === o.value ? "" : o.value);
                  setOpen(false);
                }}
              >
                {o.label}
                {value === o.value && <Icon name="check" size={15} strokeWidth={2.5} />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

function MpDatePicker({ value, onChange, placeholder }: { value: Date | null; onChange: (v: Date | null) => void; placeholder: string }) {
  const { t, lang, dir } = useLang();
  const rtl = dir === "rtl";
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({ y: (value || MP_TODAY).getFullYear(), m: (value || MP_TODAY).getMonth() }));
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  const toggle = () => {
    if (!open) {
      calcPos();
      setView({ y: (value || MP_TODAY).getFullYear(), m: (value || MP_TODAY).getMonth() });
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".mp-cal")?.contains(e.target as Node)) return;
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

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const shift = (delta: number) =>
    setView((v) => {
      const nm = v.m + delta;
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });

  return (
    <div className="mp-datebtn-wrap" ref={btnRef}>
      <button type="button" className={"mp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")} onClick={toggle}>
        <span className="mp-datebtn__label">{value ? fmtDateI18n(lang, value) : placeholder}</span>
        {value && (
          <span
            className="mp-datebtn__clear"
            role="button"
            tabIndex={0}
            aria-label={t("admin.props.clearDate")}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
          >
            <Icon name="x" size={12} />
          </span>
        )}
        <Icon name="calendar" size={15} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div className="mp-cal" style={{ top: pos.top, left: pos.left, width: pos.width }}>
            <div className="mp-cal__head">
              <button type="button" className="mp-cal__nav" onClick={() => shift(-1)} aria-label={t("admin.members.prevMonth")}>
                <Icon name={rtl ? "chevron-right" : "chevron-left"} size={18} />
              </button>
              <span className="mp-cal__title">
                {monthName(lang, view.m, true)} {fmtNum(lang, view.y)}
              </span>
              <button type="button" className="mp-cal__nav" onClick={() => shift(1)} aria-label={t("admin.members.nextMonth")}>
                <Icon name={rtl ? "chevron-left" : "chevron-right"} size={18} />
              </button>
            </div>
            <div className="mp-cal__grid mp-cal__wd">
              {MP_WD.map((w, i) => (
                <span key={w} className="mp-cal__wdcell">
                  {weekdayName(lang, i).slice(0, lang === "en" ? 2 : 3)}
                </span>
              ))}
            </div>
            <div className="mp-cal__grid">
              {cells.map((d, i) => {
                if (d === null) return <span key={"e" + i} />;
                const date = new Date(view.y, view.m, d);
                const cls = ["mp-cal__day"];
                if (sameDay(date, value)) cls.push("is-selected");
                else if (sameDay(date, MP_TODAY)) cls.push("is-today");
                return (
                  <button
                    key={d}
                    type="button"
                    className={cls.join(" ")}
                    onClick={() => {
                      onChange(date);
                      setOpen(false);
                    }}
                  >
                    {fmtNum(lang, d)}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function RowActions({
  open,
  onToggle,
  status,
  onView,
  onEdit,
  onStatus,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  status: string;
  onView: () => void;
  onEdit: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  const { t, lang } = useLang();
  const suspended = status === "Suspended";
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null);
      return;
    }
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: popupLeft(r, 188, isRtl(lang)) });
    };
    update();
  }, [open, lang]);

  const menu =
    pos &&
    createPortal(
      <div className="mp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
        <div className="mp-amenu__sect">
          <button type="button" className="mp-aitem" role="menuitem" onClick={onView}>
            <Icon name="user" size={17} />
            {t("admin.members.viewProfile")}
          </button>
          <button type="button" className="mp-aitem" role="menuitem" onClick={onEdit}>
            <Icon name="pencil" size={17} />
            {t("admin.members.editMember")}
          </button>
          <button type="button" className="mp-aitem mp-aitem--status" role="menuitem" onClick={onStatus}>
            <Icon name={suspended ? "circle-check" : "circle-pause"} size={17} />
            {suspended ? t("admin.members.activate") : t("admin.members.suspend")}
          </button>
        </div>
        <div className="mp-amenu__sect">
          <button type="button" className="mp-aitem mp-aitem--danger" role="menuitem" onClick={onDelete}>
            <Icon name="trash-2" size={17} />
            {t("admin.members.deleteMember")}
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="mp-actions">
      <button ref={btnRef} type="button" className={"mp-kebab" + (open ? " is-open" : "")} aria-label={t("admin.members.actions")} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </div>
  );
}

function DeleteMemberModal({ member, onCancel, onConfirm }: { member: MemberRecord; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div
      className="mp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-del-title">
        <div className="mp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="mp-del-title">
          {t("admin.members.deleteTitle")}
        </h2>
        <p className="mp-modal__body">{t("admin.members.deleteBody", { name: member.name })}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </button>
          <button type="button" className="mp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.members.deleteMember")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function StatusMemberModal({ member, onCancel, onConfirm }: { member: MemberRecord; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const suspending = member.status === "Active";
  const copy = suspending
    ? {
        icon: "circle-pause" as IconName,
        iconCls: "mp-modal__icon--warn",
        title: t("admin.members.suspend"),
        body: t("admin.members.suspendBody"),
        cta: t("admin.members.suspend"),
        ctaCls: "mp-modal__confirm--warn",
      }
    : {
        icon: "circle-check" as IconName,
        iconCls: "mp-modal__icon--brand",
        title: t("admin.members.activate"),
        body: t("admin.members.activateBody"),
        cta: t("admin.members.activate"),
        ctaCls: "mp-modal__confirm--brand",
      };
  return createPortal(
    <div
      className="mp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-status-title">
        <div className={"mp-modal__icon " + copy.iconCls}>
          <Icon name={copy.icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="mp-status-title">
          {copy.title}
        </h2>
        <p className="mp-modal__body">{copy.body}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </button>
          <button type="button" className={"mp-modal__confirm " + copy.ctaCls} onClick={onConfirm}>
            {copy.cta}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function MemberRow({
  m,
  openMenu,
  setOpenMenu,
  onView,
  onEditRequest,
  onStatusRequest,
  onDeleteRequest,
  readOnly,
}: {
  m: MemberRecord;
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onView: (m: MemberRecord) => void;
  onEditRequest: (m: MemberRecord) => void;
  onStatusRequest: (m: MemberRecord) => void;
  onDeleteRequest: (m: MemberRecord) => void;
  readOnly: boolean;
}) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const st = MEMBER_STATUS[m.status] || { variant: "neutral" as const, dot: false };
  return (
    <div
      className="mp-row"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={() => onView(m)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(m);
        }
      }}
    >
      <div className="mp-col--member">
        <div className="mp-member">
          <Avatar src={m.img || undefined} name={m.name} size="md" />
          <div className="mp-member__body">
            <span className="mp-member__name">{m.name}</span>
            <span className="mp-member__id">{m.id}</span>
          </div>
        </div>
      </div>
      <div className="mp-col--roles">
        <span className="mp-celllabel">{t("admin.members.th.roles")}</span>
        <div className="mp-roles">
          {m.roles.map((r) => (
            <Badge key={r} variant="neutral" className={(ROLE_META[r] || {}).cls} size="sm">
              {tOr(`role.${r.toLowerCase()}`, r)}
            </Badge>
          ))}
        </div>
      </div>
      <div className="mp-col--phone">
        <span className="mp-celllabel">{t("admin.members.th.phone")}</span>
        <span className="mp-contact mp-contact--phone">
          <Icon name="phone" size={13} />
          {m.phone}
        </span>
      </div>
      <div className="mp-col--props">
        <span className="mp-celllabel">{t("admin.members.th.props")}</span>
        <span className={"mp-propstext" + (m.properties === 0 ? " mp-propstext--zero" : "")}>
          {t("admin.members.related", { count: fmtNum(lang, m.properties) })}
        </span>
      </div>
      <div className="mp-col--joined">
        <span className="mp-celllabel">{t("admin.members.th.joinedShort")}</span>
        <span className="mp-date">{fmtDateI18n(lang, new Date(m.joined))}</span>
      </div>
      <div className="mp-col--status">
        <span className="mp-celllabel">{t("admin.members.th.status")}</span>
        <Badge variant={st.variant} size="sm" dot={st.dot} className="mp-statusbadge">
          {tOr(`status.${m.status.toLowerCase()}`, m.status)}
        </Badge>
      </div>
      {!readOnly && (
        <div className="mp-col--actions" onClick={(e) => e.stopPropagation()}>
          <RowActions
            open={openMenu === m.id}
            onToggle={() => setOpenMenu(openMenu === m.id ? null : m.id)}
            status={m.status}
            onView={() => {
              setOpenMenu(null);
              onView(m);
            }}
            onEdit={() => {
              setOpenMenu(null);
              onEditRequest(m);
            }}
            onStatus={() => {
              setOpenMenu(null);
              onStatusRequest(m);
            }}
            onDelete={() => {
              setOpenMenu(null);
              onDeleteRequest(m);
            }}
          />
        </div>
      )}
    </div>
  );
}

interface ToastData {
  variant?: "danger" | "warn" | "success";
  icon?: IconName;
  title: string;
  message: string;
  onUndo?: () => void;
}
const TOAST_DURATION = 6000;

function Toast({ toast, onDismiss, onViewProfile }: { toast: ToastData; onDismiss: () => void; onViewProfile: () => void }) {
  const { t } = useLang();
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(onDismiss, 340);
  }, [onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const startTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(close, TOAST_DURATION);
  }, [close]);
  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [startTimer]);

  const pause = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const cls = ["mp-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  const danger = toast.variant === "danger";
  const warn = toast.variant === "warn";
  const iconCls = danger ? " mp-toast__icon--danger" : warn ? " mp-toast__icon--warn" : "";
  const iconName = toast.icon || (danger ? "trash-2" : "check");

  return createPortal(
    <div className="mp-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" style={{ ["--mp-toast-dur" as string]: TOAST_DURATION + "ms" }} onMouseEnter={pause} onMouseLeave={startTimer}>
        <span className={"mp-toast__icon" + iconCls}>
          <Icon name={iconName} size={20} strokeWidth={danger ? 1.9 : 2.2} />
        </span>
        <div className="mp-toast__body">
          <p className="mp-toast__title">{toast.title}</p>
          <p className="mp-toast__msg">{toast.message}</p>
          <div className="mp-toast__actions">
            <button type="button" className="mp-toast__btn mp-toast__btn--dismiss" onClick={close}>
              {t("admin.props.dismiss")}
            </button>
            {danger && toast.onUndo && (
              <button
                type="button"
                className="mp-toast__btn mp-toast__btn--undo"
                onClick={() => {
                  toast.onUndo?.();
                  close();
                }}
              >
                <Icon name="undo-2" size={15} />
                {t("admin.props.undo")}
              </button>
            )}
            {!danger && (
              <button type="button" className="mp-toast__btn mp-toast__btn--view" onClick={onViewProfile}>
                {t("admin.members.viewProfile")}
              </button>
            )}
          </div>
        </div>
        <button type="button" className="mp-toast__close" aria-label={t("admin.members.dismissNotif")} onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="mp-toast__progress" />
      </div>
    </div>,
    document.body,
  );
}

function MembersTableCard(props: {
  filters: MemberFilters;
  setFilter: (k: keyof MemberFilters, v: string | Date | null) => void;
  onClear: () => void;
  hasActive: boolean;
  rows: MemberRecord[];
  totalRows: number;
  totalCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onView: (m: MemberRecord) => void;
  onEditRequest: (m: MemberRecord) => void;
  onStatusRequest: (m: MemberRecord) => void;
  onDeleteRequest: (m: MemberRecord) => void;
  readOnly: boolean;
}) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const [filtersOpen, setFiltersOpen] = useState(false);
  const shown = props.hasActive ? props.totalRows : props.totalCount;
  const activeAdvCount = [props.filters.status, props.filters.date].filter(Boolean).length;
  return (
    <section className="mp-tablecard">
      <header className="mp-tablecard__head">
        <div className="mp-tablecard__titlerow">
          <div className="mp-tablecard__heading">
            <h2 className="mp-tablecard__title">{t("admin.members.tableTitle")}</h2>
            <span className="mp-tablecard__count">{fmtNum(lang, shown)}</span>
          </div>
          {props.hasActive && (
            <div className="mp-tablecard__resultnote">
              <span>{t("admin.props.shownOf", { shown: fmtNum(lang, props.totalRows), total: fmtNum(lang, props.totalCount) })}</span>
            </div>
          )}
        </div>

        <div className="mp-tabrow">
          <div className="mp-tabs" role="tablist" aria-label={t("admin.members.tabsAria")}>
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={props.filters.role === tab.id}
                className={"mp-tab" + (props.filters.role === tab.id ? " is-active" : "")}
                onClick={() => props.setFilter("role", tab.id)}
              >
                {tab.id === "" ? t("admin.members.tabAll") : tOr(`role.${tab.id.toLowerCase()}`, tab.label)}
              </button>
            ))}
          </div>
          <div className="mp-tabrow__right">
            <div className="mp-tabsearch">
              <span className="mp-tabsearch__lead">
                <Icon name="search" size={16} />
              </span>
              <input type="text" value={props.filters.q} onChange={(e) => props.setFilter("q", e.target.value)} placeholder={t("admin.members.searchPh")} aria-label={t("admin.members.searchAria")} />
            </div>
            <button
              type="button"
              className={"mp-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              <Icon name="sliders-horizontal" size={15} />
              {t("admin.props.filters")}
              {activeAdvCount > 0 && <span className="mp-filterbtn__badge">{fmtNum(lang, activeAdvCount)}</span>}
            </button>
          </div>
        </div>

        <div className={"mp-filterbar" + (filtersOpen ? " is-open" : "")}>
          <div className="mp-filterbar__inner">
            <div className="mp-filterbar__row">
              <MpCustomSelect
                value={props.filters.status}
                onChange={(v) => props.setFilter("status", v)}
                options={["Active", "Suspended"].map((v) => ({ value: v, label: t(`status.${v.toLowerCase()}`) }))}
                placeholder={t("admin.members.filter.status")}
              />
              <MpDatePicker value={props.filters.date} onChange={(v) => props.setFilter("date", v)} placeholder={t("admin.members.filter.date")} />
              <div className="mp-filterbar__actions">
                <button type="button" className="mp-clearbtn" onClick={props.onClear}>
                  <Icon name="x" size={14} />
                  {t("admin.props.clearAll")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className={"mp-table" + (props.readOnly ? " mp-table--noactions" : "")}>
        <div className="mp-thead" role="row">
          <span className="mp-th mp-col--member">Member</span>
          <span className="mp-th mp-col--roles">Roles</span>
          <span className="mp-th mp-col--phone">{t("admin.members.th.phone")}</span>
          <span className="mp-th mp-col--props">{t("admin.members.th.props")}</span>
          <span className="mp-th mp-col--joined">{t("admin.members.th.joined")}</span>
          <span className="mp-th mp-col--status">{t("admin.members.th.status")}</span>
          {!props.readOnly && <span className="mp-th mp-col--actions">{t("admin.members.th.actions")}</span>}
        </div>
        {props.rows.length > 0 ? (
          props.rows.map((m) => (
            <MemberRow
              key={m.id}
              m={m}
              openMenu={props.openMenu}
              setOpenMenu={props.setOpenMenu}
              onView={props.onView}
              onEditRequest={props.onEditRequest}
              onStatusRequest={props.onStatusRequest}
              onDeleteRequest={props.onDeleteRequest}
              readOnly={props.readOnly}
            />
          ))
        ) : (
          <div className="mp-noresults">
            <span className="mp-noresults__art">
              <Icon name="search-x" size={26} strokeWidth={1.6} />
            </span>
            <h3>{t("admin.members.empty.title")}</h3>
            <p>{t("admin.members.empty.sub")}</p>
          </div>
        )}
      </div>
      <PaginationFooter currentPage={props.currentPage} totalItems={props.totalRows} onPageChange={props.onPageChange} />
    </section>
  );
}

export function MembersApp({ scopeAgent, basePath = "/admin/members" }: { scopeAgent?: string; basePath?: string } = {}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const { members, memberCounts, properties, addMember, removeMember, updateMember } = useProperties();
  const readOnly = !!scopeAgent;
  // Agent scope: members = owners of the listings assigned to that agent, and the
  // "Properties" count reflects only their listings handled by THIS agent.
  const baseMembers = useMemo(() => {
    if (!scopeAgent) return members;
    const ownCount: Record<string, number> = {};
    for (const p of properties) {
      if (p.agent?.name === scopeAgent) ownCount[p.owner.name] = (ownCount[p.owner.name] || 0) + 1;
    }
    return members.filter((m) => ownCount[m.name] > 0).map((m) => ({ ...m, properties: ownCount[m.name] }));
  }, [scopeAgent, properties, members]);
  const effCounts = useMemo(() => (scopeAgent ? countMembers(baseMembers) : memberCounts), [scopeAgent, baseMembers, memberCounts]);
  const [filters, setFilters] = useState<MemberFilters>(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MemberRecord | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<MemberRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<MemberRecord | null>(null);

  const setFilter = (k: keyof MemberFilters, v: string | Date | null) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCurrentPage(1);
  };
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };
  const hasActive = Object.values(filters).some(Boolean);

  const viewMember = (m: MemberRecord) => router.push(`${basePath}/${encodeURIComponent(m.id)}`);
  const viewProfile = () => router.push(basePath);

  const handleAddMember = (v: { name: string; phone: string; email: string; agentId: string; notes: string }) => {
    setAddOpen(false);
    const now = new Date();
    const joined = `${MP_MONTHS[now.getMonth()].slice(0, 3)} ${now.getDate()}, ${now.getFullYear()}`;
    addMember({
      id: "M-" + (6000 + Math.floor(Math.random() * 9000)),
      name: v.name.trim() || "New member",
      roles: ["Buyer"],
      phone: v.phone.trim(),
      email: v.email.trim(),
      properties: 0,
      joined,
      daysAgo: 0,
      status: "Active",
      img: null,
    });
    setToast({ title: t("admin.members.toast.addedTitle"), message: t("admin.members.toast.addedMsg") });
  };
  const handleEditMember = (v: { name: string; phone: string; email: string }) => {
    if (editTarget) updateMember(editTarget.id, { name: v.name.trim(), phone: v.phone.trim(), email: v.email.trim() });
    setEditTarget(null);
    setToast({ title: t("admin.members.toast.updatedTitle"), message: t("admin.members.toast.updatedMsg") });
  };

  const handleDeleteConfirm = () => {
    const target = deleteTarget!;
    removeMember(target.id);
    setDeleteTarget(null);
    setToast({
      variant: "danger",
      title: t("admin.members.toast.deletedTitle"),
      message: t("admin.members.toast.deletedMsg", { name: target.name }),
      onUndo: () => addMember(target),
    });
  };

  const handleStatusConfirm = () => {
    const target = statusTarget!;
    const suspending = target.status === "Active";
    const next = suspending ? "Suspended" : "Active";
    updateMember(target.id, { status: next });
    setStatusTarget(null);
    setToast(
      suspending
        ? { variant: "warn", icon: "circle-pause", title: t("admin.members.toast.suspendedTitle"), message: t("admin.members.toast.suspendedMsg") }
        : { variant: "success", icon: "circle-check", title: t("admin.members.toast.activatedTitle"), message: t("admin.members.toast.activatedMsg") },
    );
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return baseMembers.filter((m) => {
      if (filters.role && !m.roles.includes(filters.role)) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.date && m.joined !== fmtDate(filters.date)) return false;
      if (q) {
        const hay = [m.name, m.phone, m.email, m.id].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, baseMembers]);

  const totalRows = hasActive ? rows.length : baseMembers.length;
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <header className="mp-head">
        <div className="mp-head__intro">
          <h1 className="mp-head__title">{t("admin.members.title")}</h1>
          <p className="mp-head__sub">{t("admin.members.sub")}</p>
        </div>
        {!readOnly && (
          <div className="mp-head__action">
            <Button hierarchy="primary" size="lg" iconLeading="user-plus" onClick={() => setAddOpen(true)}>
              {t("admin.members.add")}
            </Button>
          </div>
        )}
      </header>

      <div className="mp-kpis">
        {KPI_CARDS.map((c) => (
          <StatCard
            key={c.key}
            label={t(`admin.members.kpi.${c.key}`)}
            value={fmtNum(lang, effCounts[c.field])}
            icon={c.icon}
            tone={c.tone}
            sub={t(`admin.members.kpiSub.${c.key}`)}
          />
        ))}
      </div>

      <MembersTableCard
        filters={filters}
        setFilter={setFilter}
        onClear={clear}
        hasActive={hasActive}
        rows={pagedRows}
        totalRows={totalRows}
        totalCount={baseMembers.length}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        onView={viewMember}
        onEditRequest={setEditTarget}
        onStatusRequest={setStatusTarget}
        onDeleteRequest={setDeleteTarget}
        readOnly={readOnly}
      />

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddMember} />
      <AddMemberModal
        open={!!editTarget}
        mode="edit"
        initial={editTarget ? { name: editTarget.name, phone: editTarget.phone, email: editTarget.email } : null}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditMember}
      />
      {deleteTarget && <DeleteMemberModal member={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {statusTarget && <StatusMemberModal member={statusTarget} onCancel={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} onViewProfile={viewProfile} />}
    </>
  );
}
