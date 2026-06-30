"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { StatCard } from "@/components/data/stat-card";
import {
  AGENTS,
  AGENTS_LIST,
  AGENT_IMG,
  CAL_DOW,
  DURATIONS,
  EMPTY_FILTERS,
  EMPTY_FORM,
  HOURS_12,
  KPI_CARDS,
  MEMBERS,
  MERIDIEM,
  MINUTES_60,
  MONTHS_FULL,
  PROPERTIES,
  PROPS_LIST,
  STATUSES,
  STATUS_TABS,
  VIEWINGS,
  VIEWINGS_PER_PAGE,
  VIEWING_STATUS,
  computeViewingKpis,
  composeTime,
  fmtDateLabel,
  fmtDateShort,
  fmtTimeLabel,
  parseISODate,
  splitTime,
  toISODate,
  viewingToForm,
  type ScheduleForm,
  type ViewingFilters,
  type ViewingRecord,
} from "./data";

/* ---------------- anchored panel positioning ---------------- */
function useAnchoredPanel(open: boolean, triggerRef: React.RefObject<HTMLButtonElement | null>, onClose: () => void) {
  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxH: number } | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const place = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      setPos({ left: r.left, top: r.bottom + 6, width: r.width, maxH: Math.max(220, below - 24) });
    };
    place();
    const onScroll = () => place();
    const onResize = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, triggerRef]);
  return pos;
}

function Combobox<T extends { id: string }>({
  id,
  items,
  value,
  onSelect,
  placeholder,
  searchPlaceholder,
  filterKeys,
  renderValue,
  renderOption,
  createLabel,
  onCreate,
}: {
  id: string;
  items: T[];
  value: string | null;
  onSelect: (v: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  filterKeys: string[];
  renderValue: (it: T) => ReactNode;
  renderOption: (it: T) => ReactNode;
  createLabel?: string;
  onCreate?: (q: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState<{ left: number; top: number; width: number; maxH: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const place = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setPos({ left: r.left, top: r.bottom + 6, width: r.width, maxH: Math.max(220, below - 24) });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    const t = setTimeout(() => searchRef.current?.focus(), 30);
    const onScroll = () => place();
    const onResize = () => place();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, place]);

  const selected = items.find((it) => it.id === value) || null;
  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter((it) => filterKeys.some((k) => String((it as Record<string, unknown>)[k] || "").toLowerCase().includes(q))) : items;
  const choose = (it: T) => {
    onSelect(it.id);
    setOpen(false);
  };

  const panel =
    open &&
    pos &&
    createPortal(
      <>
        <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }} onMouseDown={() => setOpen(false)} />
        <div className="vw-combo__panel" role="listbox" style={{ left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxH }} onMouseDown={(e) => e.stopPropagation()}>
          <div className="vw-combo__searchbar">
            <Icon name="search" size={17} />
            <input ref={searchRef} type="text" className="vw-combo__searchinput" placeholder={searchPlaceholder} value={query} onChange={(e) => setQuery(e.target.value)} aria-label={searchPlaceholder} />
          </div>
          <div className="vw-combo__list">
            {filtered.length > 0 ? (
              filtered.map((it) => (
                <button key={it.id} type="button" role="option" aria-selected={it.id === value} className={"vw-combo__opt" + (it.id === value ? " is-selected" : "")} onClick={() => choose(it)}>
                  {renderOption(it)}
                  {it.id === value && <Icon name="check" size={17} className="vw-combo__opt-check" />}
                </button>
              ))
            ) : (
              <div className="vw-combo__empty">No matches found</div>
            )}
          </div>
          {createLabel && (
            <div className="vw-combo__foot">
              <button
                type="button"
                className="vw-combo__create"
                onClick={() => {
                  onCreate?.(query);
                  setOpen(false);
                }}
              >
                <Icon name="plus" size={17} />
                {query ? (
                  <span>
                    Create new member “<b>{query}</b>”
                  </span>
                ) : (
                  <span>{createLabel}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </>,
      document.body,
    );

  return (
    <div className="vw-combo">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={"vw-combo__trigger" + (open ? " is-open" : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (!open) setQuery("");
          setOpen((o) => !o);
        }}
      >
        {selected ? <span className="vw-combo__value">{renderValue(selected)}</span> : <span className="vw-combo__placeholder">{placeholder}</span>}
        <Icon name="chevron-down" size={18} className="vw-combo__chev" />
      </button>
      {panel}
    </div>
  );
}

function SegControl({ options, value, onChange, ariaLabel }: { options: { value: string; label: string; icon?: string }[]; value: string; onChange: (v: string) => void; ariaLabel: string }) {
  return (
    <div className="vw-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={"vw-seg__btn" + (value === o.value ? " is-active" : "")} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon as never} size={16} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DatePicker({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));
  const selDate = parseISODate(value);
  const [view, setView] = useState(() => selDate || new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = view.getFullYear(),
    month = view.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const choose = (d: Date) => {
    onChange(toISODate(d));
    setOpen(false);
  };

  const panel =
    open &&
    pos &&
    createPortal(
      <>
        <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }} onMouseDown={() => setOpen(false)} />
        <div className="vw-pop vw-cal" style={{ left: pos.left, top: pos.top, width: pos.width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose date">
          <div className="vw-cal__head">
            <button type="button" className="vw-cal__nav" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>
              <Icon name="chevron-left" size={18} />
            </button>
            <span className="vw-cal__title">
              {MONTHS_FULL[month]} {year}
            </span>
            <button type="button" className="vw-cal__nav" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
          <div className="vw-cal__grid vw-cal__dow">
            {CAL_DOW.map((w) => (
              <span key={w} className="vw-cal__dowcell">
                {w}
              </span>
            ))}
          </div>
          <div className="vw-cal__grid">
            {cells.map((d, i) => {
              if (!d) return <span key={"e" + i} className="vw-cal__pad" />;
              const iso = toISODate(d);
              const past = d < today;
              const cls = "vw-cal__day" + (selDate && iso === toISODate(selDate) ? " is-selected" : "") + (iso === toISODate(today) ? " is-today" : "") + (past ? " is-past" : "");
              return (
                <button key={iso} type="button" className={cls} disabled={past} onClick={() => !past && choose(d)}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div className="vw-combo">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={"vw-combo__trigger" + (open ? " is-open" : "")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setView(parseISODate(value) || new Date());
          setOpen((o) => !o);
        }}
      >
        {value ? <span className="vw-combo__value">{fmtDateLabel(value)}</span> : <span className="vw-combo__placeholder">{placeholder}</span>}
        <Icon name="calendar" size={17} className="vw-combo__trail" />
      </button>
      {panel}
    </div>
  );
}

function FilterDatePicker({ value, onChange, placeholder = "Date" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));
  const selDate = parseISODate(value);
  const [view, setView] = useState(() => selDate || new Date());
  const year = view.getFullYear(),
    month = view.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const todayISO = toISODate(new Date());
  const choose = (d: Date) => {
    onChange(toISODate(d));
    setOpen(false);
  };

  const panel =
    open &&
    pos &&
    createPortal(
      <>
        <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }} onMouseDown={() => setOpen(false)} />
        <div className="vw-pop vw-cal" style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 264) }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Filter by date">
          <div className="vw-cal__head">
            <button type="button" className="vw-cal__nav" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>
              <Icon name="chevron-left" size={18} />
            </button>
            <span className="vw-cal__title">
              {MONTHS_FULL[month]} {year}
            </span>
            <button type="button" className="vw-cal__nav" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
          <div className="vw-cal__grid vw-cal__dow">
            {CAL_DOW.map((w) => (
              <span key={w} className="vw-cal__dowcell">
                {w}
              </span>
            ))}
          </div>
          <div className="vw-cal__grid">
            {cells.map((d, i) => {
              if (!d) return <span key={"e" + i} className="vw-cal__pad" />;
              const iso = toISODate(d);
              const cls = "vw-cal__day" + (value && iso === value ? " is-selected" : "") + (iso === todayISO ? " is-today" : "");
              return (
                <button key={iso} type="button" className={cls} onClick={() => choose(d)}>
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div className="vw-filterdate-wrap">
      <button
        ref={triggerRef}
        type="button"
        className={"vw-filterdate" + (open ? " is-open" : "") + (value ? "" : " is-placeholder")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setView(parseISODate(value) || new Date());
          setOpen((o) => !o);
        }}
      >
        <span className="vw-filterdate__label">{value ? fmtDateShort(value) : placeholder}</span>
        {value && (
          <span
            className="vw-filterdate__clear"
            role="button"
            tabIndex={0}
            aria-label="Clear date"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
          >
            <Icon name="x" size={12} />
          </span>
        )}
        <Icon name="calendar" size={15} className="vw-filterdate__icon" />
      </button>
      {panel}
    </div>
  );
}

function TimePicker({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hRef = useRef<HTMLDivElement>(null),
    mRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));
  const { h, m, ap } = splitTime(value);

  useEffect(() => {
    if (!open) return;
    [hRef, mRef].forEach((ref) => {
      if (!ref.current) return;
      const el = ref.current.querySelector<HTMLElement>(".is-selected");
      if (el) ref.current.scrollTop = el.offsetTop - ref.current.clientHeight / 2 + el.clientHeight / 2;
    });
  }, [open]);

  const update = (nh: number, nm: number, nap: string) => {
    const next = composeTime(nh, nm, nap);
    if (next) onChange(next);
  };
  const pickH = (v: number) => update(v, m == null ? 0 : m, ap || "AM");
  const pickM = (v: number) => update(h == null ? 12 : h, v, ap || "AM");
  const pickAp = (v: string) => update(h == null ? 12 : h, m == null ? 0 : m, v);

  const panel =
    open &&
    pos &&
    createPortal(
      <>
        <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }} onMouseDown={() => setOpen(false)} />
        <div className="vw-pop vw-timepop" style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 236) }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose time">
          <div className="vw-timepop__cols">
            <div className="vw-timepop__col" ref={hRef}>
              <div className="vw-timepop__colhd">Hour</div>
              {HOURS_12.map((v) => (
                <button key={v} type="button" className={"vw-timeopt" + (v === h ? " is-selected" : "")} aria-pressed={v === h} onClick={() => pickH(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="vw-timepop__col" ref={mRef}>
              <div className="vw-timepop__colhd">Min</div>
              {MINUTES_60.map((v) => (
                <button key={v} type="button" className={"vw-timeopt" + (v === m ? " is-selected" : "")} aria-pressed={v === m} onClick={() => pickM(v)}>
                  {String(v).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="vw-timepop__col vw-timepop__col--ap">
              <div className="vw-timepop__colhd">AM/PM</div>
              {MERIDIEM.map((v) => (
                <button key={v} type="button" className={"vw-timeopt" + (v === ap ? " is-selected" : "")} aria-pressed={v === ap} onClick={() => pickAp(v)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div className="vw-combo">
      <button ref={triggerRef} type="button" id={id} className={"vw-combo__trigger" + (open ? " is-open" : "")} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {value ? <span className="vw-combo__value">{fmtTimeLabel(value)}</span> : <span className="vw-combo__placeholder">{placeholder}</span>}
        <Icon name="clock" size={17} className="vw-combo__trail" />
      </button>
      {panel}
    </div>
  );
}

/* ---------------- Discard-changes confirmation ---------------- */
function DiscardDialog({ onCancel, onDiscard }: { onCancel: () => void; onDiscard: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel]);
  return createPortal(
    <div className="vw-confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="vw-confirm" role="alertdialog" aria-modal="true" aria-labelledby="vw-discard-ttl">
        <span className="vw-confirm__icon">
          <Icon name="triangle-alert" size={22} strokeWidth={1.9} />
        </span>
        <h3 id="vw-discard-ttl" className="vw-confirm__title">
          Discard changes?
        </h3>
        <p className="vw-confirm__msg">You have unsaved changes. Are you sure you want to leave without saving?</p>
        <div className="vw-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>
            Continue editing
          </Button>
          <Button hierarchy="destructive" size="md" type="button" iconLeading="trash-2" onClick={onDiscard}>
            Discard changes
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Schedule modal ---------------- */
export function ScheduleModal({ open, editViewing, onClose, onSuccess }: { open: boolean; editViewing: ViewingRecord | null; onClose: () => void; onSuccess: (record: ViewingRecord, isEdit: boolean) => void }) {
  if (!open) return null;
  return <ScheduleModalInner key={editViewing?.id || "new"} editViewing={editViewing} onClose={onClose} onSuccess={onSuccess} />;
}

function ScheduleModalInner({ editViewing, onClose, onSuccess }: { editViewing: ViewingRecord | null; onClose: () => void; onSuccess: (record: ViewingRecord, isEdit: boolean) => void }) {
  const isEdit = !!editViewing;
  const initial = useMemo(() => (editViewing ? viewingToForm(editViewing) : EMPTY_FORM), [editViewing]);
  const [form, setForm] = useState<ScheduleForm>(initial);
  const [confirm, setConfirm] = useState(false);
  const set = (k: keyof ScheduleForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // mandatory: property, member, agent, date, time (duration has a default; notes is optional)
  const isValid = !!form.property && !!form.member && !!form.agent && !!form.date && !!form.time;
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  // editing requires an actual change before saving; scheduling just needs the required fields
  const canSubmit = isValid && (!isEdit || dirty);

  const attemptClose = useCallback(() => {
    if (dirty) setConfirm(true);
    else onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (confirm) {
        setConfirm(false);
        return;
      }
      attemptClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirm, attemptClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const prop = PROPERTIES.find((p) => p.id === form.property);
    const mem = MEMBERS.find((m) => m.id === form.member);
    const agt = AGENTS.find((a) => a.id === form.agent);
    const record: ViewingRecord = {
      id: editViewing ? editViewing.id : "VW-" + (Date.now() % 1000000),
      property: prop ? { title: prop.title, location: prop.location, img: prop.img } : (editViewing?.property ?? { title: "", location: "", img: "" }),
      member: mem?.name ?? editViewing?.member ?? "",
      agent: agt?.name ?? editViewing?.agent ?? "",
      date: fmtDateShort(form.date) ?? editViewing?.date ?? "",
      time: fmtTimeLabel(form.time) ?? editViewing?.time ?? "",
      status: editViewing ? editViewing.status : "Scheduled",
    };
    onSuccess(record, isEdit);
    onClose();
  };

  return createPortal(
    <div
      className="vw-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) attemptClose();
      }}
    >
      <div className="vw-modal" role="dialog" aria-modal="true" aria-labelledby="vw-modal-ttl">
        <header className="vw-modal__head">
          <div className="vw-modal__headmain">
            <span className="vw-modal__icon">
              <Icon name={isEdit ? "pencil" : "calendar-check"} size={22} strokeWidth={1.9} />
            </span>
            <div className="vw-modal__heading">
              <h2 id="vw-modal-ttl" className="vw-modal__title">
                {isEdit ? "Edit viewing" : "Schedule viewing"}
              </h2>
              <p className="vw-modal__desc">{isEdit ? "Update this viewing's details, agent assignment, or schedule." : "Create a property viewing appointment and assign it to an agent."}</p>
            </div>
          </div>
          <button type="button" className="vw-modal__close" aria-label="Close" onClick={attemptClose}>
            <Icon name="x" size={20} />
          </button>
        </header>
        <form className="vw-modal__form" onSubmit={submit}>
          <div className="vw-modal__body">
            <section className="vw-section">
              <p className="vw-section__label">Viewing information</p>
              <div className="vw-fields">
                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="cb-property">
                    Property
                  </label>
                  <Combobox
                    id="cb-property"
                    items={PROPERTIES}
                    value={form.property}
                    onSelect={(v) => set("property", v)}
                    placeholder="Search for a property"
                    searchPlaceholder="Search by title or location…"
                    filterKeys={["title", "location"]}
                    renderValue={(p) => (
                      <span className="vw-combo__prop">
                        <img src={p.img} alt="" />
                        <span className="vw-combo__prop-body">
                          <span className="vw-combo__prop-title">{p.title}</span>
                          <span className="vw-combo__prop-loc">
                            <Icon name="map-pin" size={11} />
                            {p.location}
                          </span>
                        </span>
                      </span>
                    )}
                    renderOption={(p) => (
                      <>
                        <img src={p.img} alt="" className="vw-combo__thumb" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{p.title}</span>
                          <span className="vw-combo__opt-meta">
                            <span>
                              <Icon name="map-pin" size={11} />
                              {p.location}
                            </span>
                          </span>
                        </span>
                      </>
                    )}
                  />
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="cb-member">
                    Member
                  </label>
                  <Combobox
                    id="cb-member"
                    items={MEMBERS}
                    value={form.member}
                    onSelect={(v) => set("member", v)}
                    placeholder="Search for a member"
                    searchPlaceholder="Search by name, phone, or email…"
                    filterKeys={["name", "phone", "email"]}
                    createLabel="Create new member"
                    onCreate={() => {}}
                    renderValue={(m) => (
                      <span className="vw-combo__person">
                        <Avatar name={m.name} size="sm" />
                        <span className="vw-combo__person-body">
                          <span className="vw-combo__person-name">{m.name}</span>
                          <span className="vw-combo__person-meta">{m.phone}</span>
                        </span>
                      </span>
                    )}
                    renderOption={(m) => (
                      <>
                        <Avatar name={m.name} size="sm" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{m.name}</span>
                          <span className="vw-combo__opt-meta">
                            <span>
                              <Icon name="phone" size={11} />
                              {m.phone}
                            </span>
                            <span>
                              <Icon name="mail" size={11} />
                              {m.email}
                            </span>
                          </span>
                        </span>
                      </>
                    )}
                  />
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="cb-agent">
                    Assigned agent
                  </label>
                  <Combobox
                    id="cb-agent"
                    items={AGENTS}
                    value={form.agent}
                    onSelect={(v) => set("agent", v)}
                    placeholder="Assign an agent"
                    searchPlaceholder="Search agents…"
                    filterKeys={["name", "phone"]}
                    renderValue={(a) => (
                      <span className="vw-combo__person">
                        <Avatar src={a.img} name={a.name} size="sm" />
                        <span className="vw-combo__person-body">
                          <span className="vw-combo__person-name">{a.name}</span>
                          <span className="vw-combo__person-meta">
                            <Icon name="phone" size={11} />
                            {a.phone}
                          </span>
                        </span>
                      </span>
                    )}
                    renderOption={(a) => (
                      <>
                        <Avatar src={a.img} name={a.name} size="sm" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{a.name}</span>
                          <span className="vw-combo__opt-meta">
                            <span>
                              <Icon name="phone" size={11} />
                              {a.phone}
                            </span>
                          </span>
                        </span>
                      </>
                    )}
                  />
                </div>
              </div>
            </section>

            <section className="vw-section">
              <p className="vw-section__label">Date &amp; time</p>
              <div className="vw-fields">
                <div className="vw-field-row">
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="vw-date">
                      Viewing date
                    </label>
                    <DatePicker id="vw-date" value={form.date} onChange={(v) => set("date", v)} placeholder="Select date" />
                  </div>
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="vw-time">
                      Viewing time
                    </label>
                    <TimePicker id="vw-time" value={form.time} onChange={(v) => set("time", v)} placeholder="Select time" />
                  </div>
                </div>
                <div className="vw-field">
                  <label className="vw-field__label">Duration</label>
                  <SegControl options={DURATIONS} value={form.duration} onChange={(v) => set("duration", v)} ariaLabel="Viewing duration" />
                </div>
              </div>
            </section>

            <section className="vw-section">
              <p className="vw-section__label">Notes</p>
              <div className="vw-fields">
                <div className="vw-field">
                  <label className="vw-field__label">
                    Notes <span className="vw-optional">(Optional)</span>
                  </label>
                  <textarea className="vw-textarea" rows={3} placeholder="Any special requirements or notes for this viewing…" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
              </div>
            </section>
          </div>
          <footer className="vw-modal__foot">
            <Button hierarchy="secondary" size="md" type="button" onClick={attemptClose}>
              Cancel
            </Button>
            <div className="vw-modal__foot-right">
              <Button hierarchy="primary" size="md" type="submit" disabled={!canSubmit}>
                {isEdit ? "Save changes" : "Schedule viewing"}
              </Button>
            </div>
          </footer>
        </form>
      </div>

      {confirm && <DiscardDialog onCancel={() => setConfirm(false)} onDiscard={onClose} />}
    </div>,
    document.body,
  );
}


/* ---------------- Row action menu ---------------- */
function RowActionMenu({ open, onToggle, onEdit, onView, onChangeStatus, onDelete }: { open: boolean; onToggle: () => void; onEdit: () => void; onView: () => void; onChangeStatus: () => void; onDelete: () => void }) {
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
      setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 204) });
    };
    update();
  }, [open]);

  const menu =
    pos &&
    createPortal(
      <div className="vw-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
        <div className="vw-amenu__sect">
          <button type="button" className="vw-aitem" role="menuitem" onClick={onView}>
            <Icon name="eye" size={16} />
            View details
          </button>
          <button type="button" className="vw-aitem" role="menuitem" onClick={onEdit}>
            <Icon name="pencil" size={16} />
            Edit viewing
          </button>
          <button type="button" className="vw-aitem" role="menuitem" onClick={onChangeStatus}>
            <Icon name="refresh-cw" size={16} />
            Change status
          </button>
        </div>
        <div className="vw-amenu__sect">
          <button type="button" className="vw-aitem vw-aitem--danger" role="menuitem" onClick={onDelete}>
            <Icon name="trash-2" size={16} />
            Delete viewing
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <>
      <button ref={btnRef} type="button" className={"vw-act-icon" + (open ? " is-open" : "")} aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={18} />
      </button>
      {open && menu}
    </>
  );
}

function ViewingRow({ v, openMenu, setOpenMenu, onEdit, onView, onChangeStatus, onDelete }: { v: ViewingRecord; openMenu: string | null; setOpenMenu: (x: string | null) => void; onEdit: (v: ViewingRecord) => void; onView: (v: ViewingRecord) => void; onChangeStatus: (v: ViewingRecord) => void; onDelete: (v: ViewingRecord) => void }) {
  const st = VIEWING_STATUS[v.status] || { variant: "neutral" as const, icon: "circle" as const, cls: "" };
  const city = v.property.location.split(",").pop()?.trim();
  return (
    <div
      className="vw-row"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={() => onView(v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(v);
        }
      }}
    >
      <div className="vw-col--prop">
        <div className="vw-prop">
          <img src={v.property.img} alt={v.property.title} className="vw-prop__thumb" loading="lazy" />
          <div className="vw-prop__body">
            <div className="vw-prop__title">{v.property.title}</div>
            <div className="vw-prop__vid">{v.id}</div>
          </div>
        </div>
      </div>
      <div className="vw-col--loc">
        <span className="vw-celllabel">Location</span>
        <div className="vw-loc">
          <Icon name="map-pin" size={13} />
          {city}
        </div>
      </div>
      <div className="vw-col--member">
        <span className="vw-celllabel">Member</span>
        <div className="vw-person">
          <Avatar name={v.member} size="sm" />
          <span className="vw-person__name">{v.member}</span>
        </div>
      </div>
      <div className="vw-col--agent">
        <span className="vw-celllabel">Agent</span>
        <div className="vw-person">
          <Avatar src={AGENT_IMG[v.agent] || undefined} name={v.agent} size="sm" verified />
          <span className="vw-person__name">{v.agent}</span>
        </div>
      </div>
      <div className="vw-col--dt">
        <span className="vw-celllabel">Date &amp; Time</span>
        <div className="vw-dt">
          <span className="vw-dt__date">{v.date}</span>
          <span className="vw-dt__time">
            <Icon name="clock" size={11} />
            {v.time}
          </span>
        </div>
      </div>
      <div className="vw-col--status">
        <span className="vw-celllabel">Status</span>
        <Badge variant={st.variant} size="sm" icon={st.icon} className={st.cls}>
          {v.status}
        </Badge>
      </div>
      <div className="vw-col--acts" onClick={(e) => e.stopPropagation()}>
        <div className="vw-acts">
          <RowActionMenu
            open={openMenu === v.id}
            onToggle={() => setOpenMenu(openMenu === v.id ? null : v.id)}
            onEdit={() => onEdit(v)}
            onView={() => onView(v)}
            onChangeStatus={() => onChangeStatus(v)}
            onDelete={() => onDelete(v)}
          />
        </div>
      </div>
    </div>
  );
}

function NoResults() {
  return (
    <div className="vw-empty">
      <span className="vw-empty__art">
        <Icon name="calendar-x" size={26} strokeWidth={1.6} />
      </span>
      <h3>No viewings found</h3>
      <p>Try adjusting your search or clearing the filters to see more viewings.</p>
    </div>
  );
}

function ViewingsTable({ rows, openMenu, setOpenMenu, onEdit, onView, onChangeStatus, onDelete }: { rows: ViewingRecord[]; openMenu: string | null; setOpenMenu: (x: string | null) => void; onEdit: (v: ViewingRecord) => void; onView: (v: ViewingRecord) => void; onChangeStatus: (v: ViewingRecord) => void; onDelete: (v: ViewingRecord) => void }) {
  return (
    <div className="vw-table">
      <div className="vw-thead" role="row">
        <span className="vw-th vw-col--prop">Property</span>
        <span className="vw-th vw-col--loc">Location</span>
        <span className="vw-th vw-col--member">Member</span>
        <span className="vw-th vw-col--agent">Agent</span>
        <span className="vw-th vw-col--dt">Date &amp; Time</span>
        <span className="vw-th vw-col--status">Status</span>
        <span className="vw-th vw-col--acts">Actions</span>
      </div>
      {rows.length > 0 ? rows.map((v) => <ViewingRow key={v.id} v={v} openMenu={openMenu} setOpenMenu={setOpenMenu} onEdit={onEdit} onView={onView} onChangeStatus={onChangeStatus} onDelete={onDelete} />) : <NoResults />}
    </div>
  );
}

function PaginationFooter({ currentPage, totalItems, onPageChange }: { currentPage: number; totalItems: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / VIEWINGS_PER_PAGE));
  const start = Math.min((currentPage - 1) * VIEWINGS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * VIEWINGS_PER_PAGE, totalItems);

  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };

  if (totalItems === 0) return null;
  return (
    <div className="vw-tablefooter">
      <span className="vw-pagination__info">
        Showing{" "}
        <b>
          {start.toLocaleString("en-US")}–{end.toLocaleString("en-US")}
        </b>{" "}
        of <b>{totalItems.toLocaleString("en-US")}</b> viewings
      </span>
      <div className="vw-pagination">
        <button type="button" className="vw-page-btn vw-page-btn--nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />
          Previous
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={"e" + i} className="vw-page-ellipsis">
              …
            </span>
          ) : (
            <button key={p} type="button" className={"vw-page-btn" + (p === currentPage ? " is-active" : "")} onClick={() => onPageChange(p)}>
              {p}
            </button>
          ),
        )}
        <button type="button" className="vw-page-btn vw-page-btn--nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
          <Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>
  );
}

function ViewingsPanel({ filters, setFilter, onClear, hasActive, filteredCount, totalAll }: { filters: ViewingFilters; setFilter: (k: keyof ViewingFilters, v: string) => void; onClear: () => void; hasActive: boolean; filteredCount: number; totalAll: number }) {
  const opt = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));
  const shown = hasActive ? filteredCount : totalAll;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeAdvCount = [filters.agent, filters.property, filters.dateRange].filter(Boolean).length;
  return (
    <header className="vw-tablecard__head">
      <div className="vw-tablecard__titlerow">
        <div className="vw-tablecard__heading">
          <h2 className="vw-tablecard__title">All viewings</h2>
          <span className="vw-tablecard__count">{shown.toLocaleString("en-US")}</span>
        </div>
        {hasActive && (
          <div className="vw-tablecard__resultnote">
            Showing <b>{filteredCount.toLocaleString("en-US")}</b> of {totalAll.toLocaleString("en-US")} viewings
          </div>
        )}
      </div>

      <div className="vw-tabrow">
        <div className="vw-tabs" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={filters.status === tab.id} className={"vw-tab" + (filters.status === tab.id ? " is-active" : "")} onClick={() => setFilter("status", tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="vw-tabrow__right">
          <div className="vw-tabsearch">
            <span className="vw-tabsearch__lead">
              <Icon name="search" size={16} />
            </span>
            <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Search viewings…" aria-label="Search viewings" />
          </div>
          <button type="button" className={"vw-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
            <Icon name="sliders-horizontal" size={15} />
            Filters
            {activeAdvCount > 0 && <span className="vw-filterbtn__badge">{activeAdvCount}</span>}
          </button>
        </div>
      </div>

      <div className={"vw-filterbar" + (filtersOpen ? " is-open" : "")}>
        <div className="vw-filterbar__inner">
          <div className="vw-filterbar__row">
            <Select size="md" value={filters.agent} onChange={(e) => setFilter("agent", e.target.value)} options={[{ value: "", label: "Agent" }, ...opt(AGENTS_LIST)]} />
            <Select size="md" value={filters.property} onChange={(e) => setFilter("property", e.target.value)} options={[{ value: "", label: "Property" }, ...opt(PROPS_LIST)]} />
            <FilterDatePicker value={filters.dateRange} onChange={(v) => setFilter("dateRange", v)} placeholder="Date" />
            <div className="vw-filterbar__actions">
              <button type="button" className="vw-clearbtn" onClick={onClear}>
                <Icon name="x" size={14} />
                Clear all
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const TOAST_DUR = 6000;
function Toast({ toast, onDismiss }: { toast: { title: string; message: string }; onDismiss: () => void }) {
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
  useEffect(() => {
    timer.current = setTimeout(close, TOAST_DUR);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [close]);
  const pause = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const resume = () => {
    timer.current = setTimeout(close, TOAST_DUR);
  };
  const cls = ["vw-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  return createPortal(
    <div className="vw-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" onMouseEnter={pause} onMouseLeave={resume}>
        <span className="vw-toast__icon">
          <Icon name="check" size={20} strokeWidth={2.5} />
        </span>
        <div className="vw-toast__body">
          <p className="vw-toast__title">{toast.title}</p>
          <p className="vw-toast__msg">{toast.message}</p>
          <div className="vw-toast__actions">
            <button type="button" className="vw-toast__btn vw-toast__btn--dismiss" onClick={close}>
              Dismiss
            </button>
            <button type="button" className="vw-toast__btn vw-toast__btn--view" onClick={close}>
              View details
            </button>
          </div>
        </div>
        <button type="button" className="vw-toast__close" aria-label="Dismiss" onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="vw-toast__progress" />
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Change status modal ---------------- */
function ChangeStatusModal({ viewing, onCancel, onConfirm }: { viewing: ViewingRecord; onCancel: () => void; onConfirm: (status: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open) setOpen(false);
      else onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!fieldRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const canConfirm = selected && selected !== viewing.status;
  const selMeta = selected ? VIEWING_STATUS[selected] : null;

  return createPortal(
    <div className="vw-confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="vw-confirm vw-confirm--status" role="dialog" aria-modal="true" aria-labelledby="vw-status-ttl">
        <span className="vw-confirm__icon vw-confirm__icon--brand">
          <Icon name="refresh-cw" size={22} strokeWidth={1.9} />
        </span>
        <h3 id="vw-status-ttl" className="vw-confirm__title">
          Change viewing status
        </h3>
        <p className="vw-confirm__msg">Select a new status for {viewing.id}.</p>

        <div className="vw-statusfield" ref={fieldRef}>
          <button type="button" className={"vw-statustrigger" + (open ? " is-open" : "")} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {selected && selMeta ? (
              <Badge variant={selMeta.variant} size="sm" icon={selMeta.icon} className={selMeta.cls}>
                {selected}
              </Badge>
            ) : (
              <span className="vw-statustrigger__placeholder">Choose a status…</span>
            )}
            <Icon name="chevron-down" size={16} className="vw-statustrigger__chev" />
          </button>
          {open && (
            <div className="vw-statusdrop" role="listbox" aria-label="Viewing status">
              {STATUSES.map((s) => {
                const meta = VIEWING_STATUS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    role="option"
                    aria-selected={selected === s}
                    className={"vw-statopt" + (selected === s ? " is-selected" : "")}
                    onClick={() => {
                      setSelected(s);
                      setOpen(false);
                    }}
                  >
                    <Badge variant={meta.variant} size="sm" icon={meta.icon} className={meta.cls}>
                      {s}
                    </Badge>
                    <span className="vw-statopt__spacer" />
                    {viewing.status === s && <span className="vw-statopt__current">Current</span>}
                    {selected === s && <Icon name="check" size={16} strokeWidth={2.5} className="vw-statopt__check" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="vw-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button hierarchy="primary" size="md" type="button" iconLeading="refresh-cw" disabled={!canConfirm} onClick={() => selected && onConfirm(selected)}>
            Change status
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------------- Delete viewing modal ---------------- */
function DeleteViewingModal({ viewing, onCancel, onConfirm }: { viewing: ViewingRecord; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div className="vw-confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="vw-confirm" role="alertdialog" aria-modal="true" aria-labelledby="vw-del-ttl">
        <span className="vw-confirm__icon vw-confirm__icon--danger">
          <Icon name="trash-2" size={22} strokeWidth={1.9} />
        </span>
        <h3 id="vw-del-ttl" className="vw-confirm__title">
          Delete viewing?
        </h3>
        <p className="vw-confirm__msg">
          Are you sure you want to delete the viewing for <strong>{viewing.property.title}</strong> ({viewing.id})? This action cannot be undone.
        </p>
        <div className="vw-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button hierarchy="destructive" size="md" type="button" iconLeading="trash-2" onClick={onConfirm}>
            Delete viewing
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function ViewingsApp() {
  const router = useRouter();
  const [viewings, setViewings] = useState<ViewingRecord[]>(VIEWINGS);
  const [filters, setFilters] = useState<ViewingFilters>(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<ViewingRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ViewingRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editViewing, setEditViewing] = useState<ViewingRecord | null>(null);
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  const openView = (v: ViewingRecord) => {
    setOpenMenu(null);
    router.push(`/admin/viewings/${encodeURIComponent(v.id)}`);
  };
  const openSchedule = () => {
    setEditViewing(null);
    setModalOpen(true);
  };
  const openEdit = (v: ViewingRecord) => {
    setOpenMenu(null);
    setEditViewing(v);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => setEditViewing(null), 300);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const setFilter = (k: keyof ViewingFilters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCurrentPage(1);
  };
  const clear = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };
  const hasActive = Object.values(filters).some(Boolean);

  const handleScheduled = (record: ViewingRecord, isEdit: boolean) => {
    if (isEdit) {
      setViewings((prev) => prev.map((v) => (v.id === record.id ? record : v)));
      setToast({ title: "Viewing Updated Successfully", message: "The viewing details have been saved and the schedule refreshed." });
    } else {
      setViewings((prev) => [record, ...prev]);
      setToast({ title: "Viewing Scheduled Successfully", message: "The viewing appointment has been created and added to the schedule." });
    }
  };
  const handleStatusConfirm = (status: string) => {
    const target = statusTarget!;
    setViewings((prev) => prev.map((v) => (v.id === target.id ? { ...v, status } : v)));
    setStatusTarget(null);
    setToast({ title: "Status updated", message: `“${target.property.title}” (${target.id}) is now marked as ${status}.` });
  };
  const handleDeleteConfirm = () => {
    const target = deleteTarget!;
    setViewings((prev) => prev.filter((v) => v.id !== target.id));
    setDeleteTarget(null);
    setToast({ title: "Viewing deleted", message: `The viewing for “${target.property.title}” (${target.id}) has been removed.` });
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return viewings.filter((v) => {
      if (filters.status && v.status !== filters.status) return false;
      if (filters.agent && v.agent !== filters.agent) return false;
      if (filters.property && v.property.title !== filters.property) return false;
      if (filters.dateRange && v.date !== fmtDateShort(filters.dateRange)) return false;
      if (q) {
        const hay = [v.id, v.property.title, v.member, v.agent].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, viewings]);

  const kpiCounts = useMemo(() => computeViewingKpis(viewings), [viewings]);

  const totalPages = Math.max(1, Math.ceil(rows.length / VIEWINGS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((page - 1) * VIEWINGS_PER_PAGE, page * VIEWINGS_PER_PAGE);

  return (
    <>
      <header className="vw-head">
        <div className="vw-head__intro">
          <h1 className="vw-head__title">Viewings</h1>
          <p className="vw-head__sub">Manage property viewing appointments, schedules, and follow-ups.</p>
        </div>
        <div className="vw-head__action">
          <Button hierarchy="primary" size="lg" iconLeading="calendar-plus" onClick={openSchedule}>
            Schedule viewing
          </Button>
        </div>
      </header>

      <div className="vw-kpis">
        {KPI_CARDS.map((c) => (
          <StatCard key={c.key} label={c.label} value={kpiCounts[c.field].toLocaleString("en-US")} icon={c.icon} tone={c.tone} sub={c.sub} />
        ))}
      </div>

      <section className="vw-tablecard">
        <ViewingsPanel filters={filters} setFilter={setFilter} onClear={clear} hasActive={hasActive} filteredCount={rows.length} totalAll={viewings.length} />
        <ViewingsTable rows={pagedRows} openMenu={openMenu} setOpenMenu={setOpenMenu} onEdit={openEdit} onView={openView} onChangeStatus={(v) => { setOpenMenu(null); setStatusTarget(v); }} onDelete={(v) => { setOpenMenu(null); setDeleteTarget(v); }} />
        <PaginationFooter currentPage={page} totalItems={rows.length} onPageChange={setCurrentPage} />
      </section>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      <ScheduleModal open={modalOpen} editViewing={editViewing} onClose={closeModal} onSuccess={handleScheduled} />
      {statusTarget && <ChangeStatusModal viewing={statusTarget} onCancel={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />}
      {deleteTarget && <DeleteViewingModal viewing={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
