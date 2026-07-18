"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtCurrency, fmtDate, fmtNum, localizeDigits, monthName, weekdayName, popupLeft } from "@/lib/fmt";
import {
  AGENT_ASSIGNED,
  AGENT_FILTER_OPTIONS,
  AGENT_UNASSIGNED,
  EMPTY_ADV,
  ITEMS_PER_PAGE,
  KPI_CARDS,
  PRICE_RANGES,
  STATUS_DOT_COLOR,
  STATUS_META,
  STATUS_OPTIONS,
  STATUS_TABS,
  TYPE_OPTIONS,
  statusRequiresAgent,
  type AdvFilters,
  type AgentRef,
  type PropertyRecord,
} from "./data";
import { useProperties } from "../_shared/properties-store";
import { countProperties } from "../_data/catalog";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type SelectOption = { value: string; label: string };

/* ---------------- Pagination ---------------- */
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
    <div className="pp-tablefooter">
      <span className="pp-pagination__info">
        {t("admin.props.showingRange", {
          start: fmtNum(lang, start),
          end: fmtNum(lang, end),
          total: fmtNum(lang, totalItems),
        })}
      </span>
      <div className="pp-pagination">
        <button type="button" className="pp-page-btn pp-page-btn--nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />
          {t("admin.props.prev")}
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={"e" + i} className="pp-page-ellipsis">
              …
            </span>
          ) : (
            <button key={p} type="button" className={"pp-page-btn" + (p === currentPage ? " is-active" : "")} onClick={() => onPageChange(p)}>
              {fmtNum(lang, p)}
            </button>
          ),
        )}
        <button type="button" className="pp-page-btn pp-page-btn--nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          {t("admin.props.next")}
          <Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Custom select (filter) ---------------- */
function CustomSelect({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: SelectOption[]; placeholder: string }) {
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
      if (document.querySelector(".pp-custdrop")?.contains(e.target as Node)) return;
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
    <div className="pp-datebtn-wrap" ref={btnRef}>
      <button type="button" className={"pp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")} onClick={toggle}>
        <span className="pp-datebtn__label">{options.find((o) => o.value === value)?.label || placeholder}</span>
        {value && (
          <span
            className="pp-datebtn__clear"
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
          <div className="pp-custdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={"pp-custdrop__item" + (value === o.value ? " is-selected" : "")}
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

/* ---------------- Calendar picker ---------------- */
function CalendarPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const calcCalPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };
  const toggle = () => {
    if (!open) calcCalPos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".pp-calpop")?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcCalPos, true);
    window.addEventListener("resize", calcCalPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcCalPos, true);
      window.removeEventListener("resize", calcCalPos);
    };
  }, [open]);

  const year = viewDate.getFullYear();
  const mon = viewDate.getMonth();
  const firstDow = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setViewDate(new Date(year, mon - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, mon + 1, 1));

  const sel = value ? new Date(value) : null;
  const isSelected = (d: number) => sel && sel.getFullYear() === year && sel.getMonth() === mon && sel.getDate() === d;
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === mon && today.getDate() === d;
  // The stored filter value stays canonical English ("Jun 12, 2026") so it can be
  // matched against record dates — only the display below is localized.
  const selectDay = (d: number) => {
    onChange(MONTH_NAMES[mon].slice(0, 3) + " " + d + ", " + year);
    setOpen(false);
  };

  const cells: (number | null)[] = Array(firstDow).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  return (
    <div className="pp-datebtn-wrap" ref={btnRef}>
      <button type="button" className={"pp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")} onClick={toggle}>
        <span className="pp-datebtn__label">{value ? fmtDate(lang, new Date(value)) : t("admin.props.th.date")}</span>
        {value && (
          <span
            className="pp-datebtn__clear"
            role="button"
            tabIndex={0}
            aria-label={t("admin.props.clearDate")}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
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
          <div className="pp-calpop" style={{ top: pos.top, left: pos.left, width: pos.width }}>
            <div className="pp-cal__head">
              <button type="button" className="pp-cal__nav" onClick={prevMonth}>
                <Icon name="chevron-left" size={16} />
              </button>
              <span className="pp-cal__title">
                {monthName(lang, mon, true)} {localizeDigits(lang, String(year))}
              </span>
              <button type="button" className="pp-cal__nav" onClick={nextMonth}>
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
            <div className="pp-cal__grid">
              {DAY_ABBR.map((d, i) => (
                <span key={d} className="pp-cal__daylabel">
                  {weekdayName(lang, i).slice(0, lang === "en" ? 2 : 3)}
                </span>
              ))}
              {cells.map((day, i) =>
                day === null ? (
                  <span key={"e" + i} />
                ) : (
                  <button
                    key={day}
                    type="button"
                    className={"pp-cal__day" + (isSelected(day) ? " is-selected" : "") + (isToday(day) ? " is-today" : "")}
                    onClick={() => selectDay(day)}
                  >
                    {fmtNum(lang, day)}
                  </button>
                ),
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ---------------- Change status modal ---------------- */
function ChangeStatusModal({ property, onCancel, onConfirm }: { property: PropertyRecord; onCancel: () => void; onConfirm: (s: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

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
    <div
      className="pp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
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
              <span className="pp-smodal__label">{tOr(`status.${selected.toLowerCase()}`, selected)}</span>
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
                const isCurrent = property.status === status;
                const isSelected = selected === status;
                // A property with no agent can't move to a live status.
                const blocked = !property.agent && statusRequiresAgent(status);
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={blocked}
                    className={"pp-smodal__item" + (isSelected ? " is-selected" : "") + (blocked ? " is-disabled" : "")}
                    onClick={() => {
                      setSelected(status);
                      setDropOpen(false);
                    }}
                  >
                    <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[meta.variant] }} />
                    <span className="pp-smodal__label">{tOr(`status.${status.toLowerCase()}`, status)}</span>
                    <span className="pp-smodal__spacer" />
                    {blocked ? (
                      <span className="pp-smodal__req">{t("admin.props.needsAgent")}</span>
                    ) : (
                      <>
                        {isCurrent && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
                        {isSelected && (
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
            {t("admin.topbar.cancel")}
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

/* ---------------- Assign / change agent modal ---------------- */
function AssignAgentModal({ property, onCancel, onConfirm }: { property: PropertyRecord; onCancel: () => void; onConfirm: (a: AgentRef) => void }) {
  const hasAgent = !!property.agent;
  const { t } = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);

  // Assignable = the verified agents in the live roster, so an agent promoted
  // from Pending → Verified on the Agents page becomes selectable here at once.
  const { agents } = useProperties();
  const verifiedAgents = useMemo(
    () =>
      agents
        .filter((a) => a.verification === "Verified")
        .map((a) => ({ name: a.name, img: a.img || "" }))
        .sort((x, y) => x.name.localeCompare(y.name)),
    [agents],
  );

  const q = query.trim().toLowerCase();
  const filtered = q ? verifiedAgents.filter((a) => a.name.toLowerCase().includes(q)) : verifiedAgents;

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
    <div
      className="pp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign">
          <Icon name={hasAgent ? "user-cog" : "user-plus"} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="agent-modal-title">
          {hasAgent ? t("admin.props.changeAssignedAgent") : t("admin.props.assignAgent")}
        </h2>
        <p className="pp-modal__sublabel">{hasAgent ? t("admin.props.selectNewAgent") : t("admin.props.selectAgent")}</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selectedAgent ? (
            <>
              <Avatar src={selectedAgent.img} name={selectedAgent.name} size="sm" verified />
              <span className="pp-amodal__trigger-name">{selectedAgent.name}</span>
            </>
          ) : (
            <span className="pp-amodal__trigger-placeholder">
              <Icon name="user" size={16} />
              {t("admin.props.chooseAgent")}
            </span>
          )}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen &&
          dropPos &&
          createPortal(
            <div className="pp-amodal__drop pp-amodal__drop--search" role="listbox" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
              <div className="pp-amodal__search">
                <Icon name="search" size={15} className="pp-amodal__search-ic" />
                <input className="pp-amodal__search-input" type="text" autoFocus placeholder={t("admin.props.searchAgentsPh")} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={t("admin.props.searchAgentsAria")} />
                {query && (
                  <button type="button" className="pp-amodal__search-clear" aria-label={t("admin.props.clearSearch")} onClick={() => setQuery("")}>
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
              <div className="pp-amodal__list">
                {filtered.length === 0 ? (
                  <div className="pp-amodal__empty">
                    <Icon name="user-x" size={18} />
                    {t("admin.props.noAgentsMatch", { query })}
                  </div>
                ) : (
                  filtered.map((agent) => {
                    const isCurrent = property.agent?.name === agent.name;
                    const isSelected = selected === agent.name;
                    return (
                      <button
                        key={agent.name}
                        type="button"
                        className={"pp-amodal__agent" + (isSelected ? " is-selected" : "")}
                        onClick={() => {
                          setSelected(agent.name);
                          setDropOpen(false);
                        }}
                      >
                        <Avatar src={agent.img} name={agent.name} size="sm" verified />
                        <span className="pp-amodal__agent-body">
                          <span className="pp-amodal__agent-name">{agent.name}</span>
                        </span>
                        {isCurrent && <span className="pp-amodal__current-tag">{t("admin.props.current")}</span>}
                        {isSelected && (
                          <span className="pp-amodal__check">
                            <Icon name="check" size={16} strokeWidth={2.5} />
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </button>
          <button
            type="button"
            className="pp-modal__confirm"
            disabled={!canConfirm}
            onClick={() => {
              const a = verifiedAgents.find((x) => x.name === selected);
              if (a) onConfirm({ name: a.name, verified: true, img: a.img });
            }}
          >
            <Icon name={hasAgent ? "user-check" : "user-plus"} size={15} />
            {hasAgent ? t("admin.props.changeAgent") : t("admin.props.assignAgent")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Delete confirm modal ---------------- */
function DeleteConfirmModal({ property, onCancel, onConfirm }: { property: PropertyRecord; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div
      className="pp-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="del-modal-title">
          {t("admin.props.deleteTitle")}
        </h2>
        <p className="pp-modal__body">{t("admin.props.deleteBody", { title: property.title })}</p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.props.deleteConfirm")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Row actions menu ---------------- */
function RowActions({
  propId,
  hasAgent,
  open,
  onToggle,
  onDelete,
  onAssignAgent,
  onChangeStatus,
  basePath,
  hideAgent,
}: {
  propId: string;
  hasAgent: boolean;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onAssignAgent: () => void;
  onChangeStatus: () => void;
  basePath: string;
  hideAgent: boolean;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const goDetails = () => router.push(`${basePath}/${encodeURIComponent(propId)}`);
  const goEdit = () => router.push(`${basePath}/${encodeURIComponent(propId)}/edit?from=properties`);
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
      setPos({ top: r.bottom + 6, left: popupLeft(r, 210, isRtl(lang)) });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, lang]);

  const menu =
    pos &&
    createPortal(
      <div className="pp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
        <div className="pp-amenu__sect">
          <button type="button" className="pp-aitem" role="menuitem" onClick={goDetails}>
            <Icon name="eye" size={17} />
            {t("admin.props.viewDetails")}
          </button>
          <button type="button" className="pp-aitem" role="menuitem" onClick={goEdit}>
            <Icon name="pencil" size={17} />
            {t("admin.props.edit")}
          </button>
          {!hideAgent &&
            (hasAgent ? (
              <button type="button" className="pp-aitem" role="menuitem" onClick={onAssignAgent}>
                <Icon name="user-cog" size={17} />
                {t("admin.props.changeAssignedAgent")}
              </button>
            ) : (
              <button type="button" className="pp-aitem" role="menuitem" onClick={onAssignAgent}>
                <Icon name="user-plus" size={17} />
                {t("admin.props.assignAgent")}
              </button>
            ))}
          <button type="button" className="pp-aitem" role="menuitem" onClick={onChangeStatus}>
            <Icon name="refresh-cw" size={17} />
            {t("admin.props.changeStatus")}
          </button>
        </div>
        <div className="pp-amenu__sect">
          <button type="button" className="pp-aitem pp-aitem--danger" role="menuitem" onClick={onDelete}>
            <Icon name="trash-2" size={17} />
            {t("admin.props.delete")}
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="pp-actions">
      <button ref={btnRef} type="button" className={"pp-kebab" + (open ? " is-open" : "")} aria-label={t("admin.props.actions")} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </div>
  );
}

/* ---------------- Table row ---------------- */
function PropertyRow({
  p,
  openMenu,
  setOpenMenu,
  onDeleteRequest,
  onAssignAgentRequest,
  onChangeStatusRequest,
  hideAgent,
  basePath,
}: {
  p: PropertyRecord;
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onDeleteRequest: (p: PropertyRecord) => void;
  onAssignAgentRequest: (p: PropertyRecord) => void;
  onChangeStatusRequest: (p: PropertyRecord) => void;
  hideAgent: boolean;
  basePath: string;
}) {
  const st = STATUS_META[p.status] || { variant: "neutral" as const };
  const router = useRouter();
  const { t, lang } = useLang();
  /** Translate a data-driven value, falling back to the raw value if unmapped. */
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const goDetails = () => router.push(`${basePath}/${encodeURIComponent(p.id)}`);
  return (
    <div
      className="pp-row"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={goDetails}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goDetails();
        }
      }}
    >
      <div className="pp-col--prop">
        <div className="pp-prop">
          <img className="pp-prop__thumb" src={p.img} alt="" loading="lazy" />
          <div className="pp-prop__body">
            <span className="pp-prop__title">{p.title}</span>
            <span className="pp-prop__id">{p.id}</span>
          </div>
        </div>
      </div>
      <div className="pp-col--location">
        <span className="pp-celllabel">{t("admin.props.th.location")}</span>
        <span className="pp-prop__loc">
          <Icon name="map-pin" size={14} />
          {tOr(`city.${p.city}`, p.city)}
        </span>
      </div>
      <div className="pp-col--type">
        <span className="pp-celllabel">{t("admin.props.th.type")}</span>
        <span className="pp-prop__type">{tOr(`type.${p.type.toLowerCase()}`, p.type)}</span>
      </div>
      <div className="pp-col--owner">
        <span className="pp-celllabel">{t("admin.props.th.owner")}</span>
        <div className="pp-owner">
          <span className="pp-owner__name">{p.owner.name}</span>
        </div>
      </div>
      {!hideAgent && (
        <div className="pp-col--agent">
          <span className="pp-celllabel">{t("admin.props.th.agentShort")}</span>
          {p.agent ? (
            <div className="pp-agent">
              <Avatar src={p.agent.img} name={p.agent.name} size="sm" verified />
              <span className="pp-agent__name">{p.agent.name}</span>
            </div>
          ) : (
            <span className="pp-agent__unassigned">
              <Icon name="user-plus" size={15} />
              {t("status.unassigned")}
            </span>
          )}
        </div>
      )}
      <div className="pp-col--listing">
        <Badge variant={p.listing === "sale" ? "brand" : "info"} size="sm">
          {p.listing === "sale" ? t("admin.props.forSale") : t("admin.props.forRent")}
        </Badge>
      </div>
      <div className="pp-col--status">
        <Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon} style={{ height: "19px", flexDirection: "row" }}>
          {tOr(`status.${p.status.toLowerCase()}`, p.status)}
        </Badge>
      </div>
      <div className="pp-col--price">
        <span className="pp-celllabel">{t("admin.props.th.price")}</span>
        <div className="pp-price">
          <span className="pp-price__val">
            {fmtCurrency(lang, p.price)}
            {p.per && <span className="pp-price__per">{p.per}</span>}
          </span>
        </div>
      </div>
      <div className="pp-col--date">
        <span className="pp-celllabel">{t("admin.props.th.date")}</span>
        <span className="pp-date">{fmtDate(lang, new Date(p.date))}</span>
      </div>
      <div className="pp-col--actions" onClick={(e) => e.stopPropagation()}>
        <RowActions
          propId={p.id}
          basePath={basePath}
          hideAgent={hideAgent}
          hasAgent={!!p.agent}
          open={openMenu === p.id}
          onToggle={() => setOpenMenu(openMenu === p.id ? null : p.id)}
          onDelete={() => {
            setOpenMenu(null);
            onDeleteRequest(p);
          }}
          onAssignAgent={() => {
            setOpenMenu(null);
            onAssignAgentRequest(p);
          }}
          onChangeStatus={() => {
            setOpenMenu(null);
            onChangeStatusRequest(p);
          }}
        />
      </div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
interface ToastData {
  id: number;
  tone?: "danger" | "brand" | "success";
  icon: IconName;
  title: string;
  msg: string;
  onUndo?: () => void;
  out?: boolean;
}
function PropToast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
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

/* ---------------- Table card ---------------- */
function PropertiesTableCard(props: {
  activeTab: string;
  onTabChange: (id: string) => void;
  q: string;
  onQChange: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  advFilters: AdvFilters;
  onAdvFilter: (k: keyof AdvFilters, v: string) => void;
  onClearFilters: () => void;
  cityOptions: string[];
  rows: PropertyRecord[];
  totalRows: number;
  totalCount: number;
  currentPage: number;
  onPageChange: (p: number) => void;
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onDeleteRequest: (p: PropertyRecord) => void;
  onAssignAgentRequest: (p: PropertyRecord) => void;
  onChangeStatusRequest: (p: PropertyRecord) => void;
  hideAgent: boolean;
  basePath: string;
}) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const activeAdvCount = Object.values(props.advFilters).filter(Boolean).length;
  const isFiltered = props.activeTab !== "all" || !!props.q || activeAdvCount > 0;
  const shown = isFiltered ? props.totalRows : props.totalCount;

  return (
    <section className="pp-tablecard">
      <header className="pp-tablecard__head">
        <div className="pp-tablecard__titlerow">
          <div className="pp-tablecard__heading">
            <h2 className="pp-tablecard__title">{t("admin.props.title")}</h2>
            <span className="pp-tablecard__count">{fmtNum(lang, shown)}</span>
          </div>
          {isFiltered && (
            <div className="pp-tablecard__resultnote">
              <span>{t("admin.props.shownOf", { shown: fmtNum(lang, props.totalRows), total: fmtNum(lang, props.totalCount) })}</span>
            </div>
          )}
        </div>

        <div className="pp-tabrow">
          <div className="pp-tabs" role="tablist" aria-label={t("admin.props.tabsAria")}>
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={props.activeTab === tab.id}
                className={"pp-tab" + (props.activeTab === tab.id ? " is-active" : "")}
                onClick={() => props.onTabChange(tab.id)}
              >
                {tab.id === "all" ? t("admin.props.tab.all") : tOr(`status.${tab.id}`, tab.label)}
              </button>
            ))}
          </div>
          <div className="pp-tabrow__right">
            <div className="pp-tabsearch">
              <span className="pp-tabsearch__lead">
                <Icon name="search" size={16} />
              </span>
              <input type="text" value={props.q} onChange={(e) => props.onQChange(e.target.value)} placeholder={t("admin.props.searchPh")} aria-label={t("admin.props.searchAria")} />
            </div>
            <button
              type="button"
              className={"pp-filterbtn" + (props.filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !props.filtersOpen ? " has-active" : "")}
              aria-expanded={props.filtersOpen}
              onClick={props.onToggleFilters}
            >
              <Icon name="sliders-horizontal" size={15} />
              {t("admin.props.filters")}
              {activeAdvCount > 0 && <span className="pp-filterbtn__badge">{fmtNum(lang, activeAdvCount)}</span>}
            </button>
          </div>
        </div>

        <div className={"pp-filterbar" + (props.filtersOpen ? " is-open" : "")}>
          <div className="pp-filterbar__inner">
            <div className="pp-filterbar__row">
              <CustomSelect
                value={props.advFilters.type}
                onChange={(v) => props.onAdvFilter("type", v)}
                options={TYPE_OPTIONS.map((v) => ({ value: v, label: tOr(`type.${v.toLowerCase()}`, v) }))}
                placeholder={t("admin.props.filter.type")}
              />
              <CustomSelect
                value={props.advFilters.city}
                onChange={(v) => props.onAdvFilter("city", v)}
                options={props.cityOptions.map((v) => ({ value: v, label: tOr(`city.${v}`, v) }))}
                placeholder={t("admin.props.filter.city")}
              />
              {!props.hideAgent && (
                <CustomSelect
                  value={props.advFilters.agent}
                  onChange={(v) => props.onAdvFilter("agent", v)}
                  options={AGENT_FILTER_OPTIONS.map((o) => ({ value: o.value, label: t(o.value === AGENT_ASSIGNED ? "status.assigned" : "status.unassigned") }))}
                  placeholder={t("admin.props.filter.agent")}
                />
              )}
              <CustomSelect
                value={props.advFilters.priceRange}
                onChange={(v) => props.onAdvFilter("priceRange", v)}
                options={PRICE_RANGES.map((v, i) => ({ value: v, label: t(`admin.props.price.${i}`) }))}
                placeholder={t("admin.props.filter.price")}
              />
              <CalendarPicker value={props.advFilters.dateAdded} onChange={(v) => props.onAdvFilter("dateAdded", v)} />
              <div className="pp-filterbar__actions">
                <button type="button" className="pp-clearbtn" onClick={props.onClearFilters}>
                  <Icon name="x" size={14} />
                  {t("admin.props.clearAll")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className={"pp-table" + (props.hideAgent ? " pp-table--noagent" : "")}>
        <div className="pp-thead" role="row">
          <span className="pp-th pp-col--prop">{t("admin.props.th.property")}</span>
          <span className="pp-th pp-col--location">{t("admin.props.th.location")}</span>
          <span className="pp-th pp-col--type">{t("admin.props.th.type")}</span>
          <span className="pp-th pp-col--owner">{t("admin.props.th.owner")}</span>
          {!props.hideAgent && <span className="pp-th pp-col--agent">{t("admin.props.th.agent")}</span>}
          <span className="pp-th pp-col--listing">{t("admin.props.th.listing")}</span>
          <span className="pp-th pp-col--status">{t("admin.props.th.status")}</span>
          <span className="pp-th pp-col--price">{t("admin.props.th.price")}</span>
          <span className="pp-th pp-col--date">{t("admin.props.th.date")}</span>
          <span className="pp-th pp-col--actions">{t("admin.props.th.action")}</span>
        </div>
        {props.rows.length > 0 ? (
          props.rows.map((p) => (
            <PropertyRow
              key={p.id}
              p={p}
              openMenu={props.openMenu}
              setOpenMenu={props.setOpenMenu}
              onDeleteRequest={props.onDeleteRequest}
              onAssignAgentRequest={props.onAssignAgentRequest}
              onChangeStatusRequest={props.onChangeStatusRequest}
              hideAgent={props.hideAgent}
              basePath={props.basePath}
            />
          ))
        ) : (
          <div className="pp-noresults">
            <span className="pp-noresults__art">
              <Icon name="search-x" size={26} strokeWidth={1.6} />
            </span>
            <h3>{t("admin.props.empty.title")}</h3>
            <p>{t("admin.props.empty.sub")}</p>
          </div>
        )}
      </div>
      <PaginationFooter currentPage={props.currentPage} totalItems={props.totalRows} onPageChange={props.onPageChange} />
    </section>
  );
}

/* ---------------- Page ---------------- */
export function PropertiesApp({ scopeAgent, basePath = "/admin/properties" }: { scopeAgent?: string; basePath?: string } = {}) {
  const { t, lang } = useLang();
  const searchParams = useSearchParams();
  const { properties, setProperties, counts, locationTree } = useProperties();
  const hideAgent = !!scopeAgent;
  // When scoped to an agent, every count/list reflects only that agent's listings.
  const baseList = useMemo(() => (scopeAgent ? properties.filter((p) => p.agent?.name === scopeAgent) : properties), [properties, scopeAgent]);
  const effCounts = useMemo(() => (scopeAgent ? countProperties(baseList) : counts), [scopeAgent, baseList, counts]);
  const cityOptions = useMemo(() => locationTree.map((c) => c.name).sort((a, b) => a.localeCompare(b)), [locationTree]);
  const [activeTab, setActiveTab] = useState(() => {
    const s = searchParams.get("status");
    return s && STATUS_TABS.some((t) => t.id === s) ? s : "all";
  });
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState<AdvFilters>(EMPTY_ADV);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyRecord | null>(null);
  const [agentTarget, setAgentTarget] = useState<PropertyRecord | null>(null);
  const [statusTarget, setStatusTarget] = useState<PropertyRecord | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const setAdvFilter = (k: keyof AdvFilters, v: string) => {
    setAdvFilters((f) => ({ ...f, [k]: v }));
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setAdvFilters(EMPTY_ADV);
    setCurrentPage(1);
  };
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };
  const handleQChange = (val: string) => {
    setQ(val);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const pushToast = (toast: Omit<ToastData, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t))), 5000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5380);
  };
  const dismissToast = (id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  };

  // success toast when returning after an edit (?toast=updated)
  const toastShown = useRef(false);
  useEffect(() => {
    if (toastShown.current) return;
    if (searchParams.get("toast") === "updated") {
      toastShown.current = true;
      // defer out of the effect body to avoid a synchronous cascading render
      const raf = requestAnimationFrame(() =>
        pushToast({ tone: "success", icon: "circle-check", title: t("admin.props.toast.updatedTitle"), msg: t("admin.props.toast.updatedMsg") }),
      );
      return () => cancelAnimationFrame(raf);
    }
    // `toastShown` guards against re-firing, so re-running on a language change is safe.
  }, [searchParams, t]);

  const handleStatusConfirm = (status: string) => {
    const prop = statusTarget!;
    setProperties((prev) => prev.map((p) => (p.id === prop.id ? { ...p, status } : p)));
    setStatusTarget(null);
    pushToast({
      tone: "brand",
      icon: "refresh-cw",
      title: t("admin.props.toast.statusTitle"),
      msg: t("admin.props.toast.statusMsg", { title: prop.title, status: t(`status.${status.toLowerCase()}`) }),
    });
  };

  const handleAssignConfirm = (agent: AgentRef) => {
    const prop = agentTarget!;
    const wasAssigned = !!prop.agent;
    setProperties((prev) => prev.map((p) => (p.id === prop.id ? { ...p, agent } : p)));
    setAgentTarget(null);
    pushToast({
      tone: "success",
      icon: "user-check",
      title: wasAssigned ? t("admin.props.toast.agentChanged") : t("admin.props.toast.agentAssigned"),
      msg: t(wasAssigned ? "admin.props.toast.agentChangedMsg" : "admin.props.toast.agentAssignedMsg", { name: agent.name, title: prop.title }),
    });
  };

  const handleDeleteConfirm = () => {
    const prop = deleteTarget!;
    let removedIndex = -1;
    setProperties((prev) => {
      removedIndex = prev.findIndex((p) => p.id === prop.id);
      return prev.filter((p) => p.id !== prop.id);
    });
    setDeleteTarget(null);
    pushToast({
      tone: "danger",
      icon: "trash-2",
      title: t("admin.props.toast.deletedTitle"),
      msg: t("admin.props.toast.deletedMsg", { title: prop.title }),
      onUndo: () => {
        setProperties((prev) => {
          if (prev.some((p) => p.id === prop.id)) return prev;
          const next = prev.slice();
          next.splice(removedIndex < 0 ? next.length : removedIndex, 0, prop);
          return next;
        });
      },
    });
  };

  const rows = useMemo(() => {
    const sq = q.trim().toLowerCase();
    return baseList.filter((p) => {
      if (activeTab === "published" && p.status !== "Published") return false;
      if (activeTab === "sold" && p.status !== "Sold") return false;
      if (activeTab === "rented" && p.status !== "Rented") return false;
      if (activeTab === "pending" && p.status !== "Pending") return false;
      if (activeTab === "draft" && p.status !== "Draft") return false;
      if (advFilters.type && p.type !== advFilters.type) return false;
      if (advFilters.city && p.city !== advFilters.city) return false;
      if (advFilters.agent === AGENT_ASSIGNED && !p.agent) return false;
      if (advFilters.agent === AGENT_UNASSIGNED && p.agent) return false;
      if (sq) {
        const hay = [p.title, p.area, p.city, p.owner.name, p.agent ? p.agent.name : "", p.id].join(" ").toLowerCase();
        if (!hay.includes(sq)) return false;
      }
      return true;
    });
  }, [baseList, activeTab, q, advFilters]);

  const isFiltered = activeTab !== "all" || !!q.trim() || Object.values(advFilters).some(Boolean);
  const totalRows = isFiltered ? rows.length : effCounts.total;
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <>
      <header className="pp-head">
        <div className="pp-head__intro">
          <h1 className="pp-head__title">{t("admin.props.title")}</h1>
          <p className="pp-head__sub">{t("admin.props.sub")}</p>
        </div>
        <div className="pp-head__action">
          <Button href={`${basePath}/new`} hierarchy="primary" size="lg" iconLeading="plus">
            {t("admin.props.add")}
          </Button>
        </div>
      </header>

      <div className="pp-kpis">
        {KPI_CARDS.map((c) => (
          <StatCard
            key={c.key}
            label={t(`admin.props.kpi.${c.key}`)}
            value={fmtNum(lang, effCounts[c.field])}
            icon={c.icon}
            tone={c.tone}
            sub={t(`admin.props.kpiSub.${c.key}`)}
          />
        ))}
      </div>

      <PropertiesTableCard
        activeTab={activeTab}
        onTabChange={handleTabChange}
        q={q}
        onQChange={handleQChange}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((v) => !v)}
        advFilters={advFilters}
        onAdvFilter={setAdvFilter}
        onClearFilters={clearFilters}
        cityOptions={cityOptions}
        hideAgent={hideAgent}
        basePath={basePath}
        rows={pagedRows}
        totalRows={totalRows}
        totalCount={effCounts.total}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        onDeleteRequest={(p) => setDeleteTarget(p)}
        onAssignAgentRequest={(p) => setAgentTarget(p)}
        onChangeStatusRequest={(p) => setStatusTarget(p)}
      />

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      {statusTarget && <ChangeStatusModal property={statusTarget} onCancel={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />}
      {deleteTarget && <DeleteConfirmModal property={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {agentTarget && <AssignAgentModal property={agentTarget} onCancel={() => setAgentTarget(null)} onConfirm={handleAssignConfirm} />}

      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) => (
          <PropToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
