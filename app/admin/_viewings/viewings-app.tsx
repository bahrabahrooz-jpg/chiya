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
import { Checkbox } from "@/components/ui/choice";
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
  RESCHED_DURATIONS,
  STATUS_TABS,
  TOTAL_VIEWINGS,
  VIEWINGS,
  VIEWING_STATUS,
  composeTime,
  fmtDateLabel,
  fmtDateShort,
  fmtTimeLabel,
  parseISODate,
  splitTime,
  toISODate,
  viewingToForm,
  viewingToReschedule,
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

/* ---------------- Schedule modal ---------------- */
export function ScheduleModal({ open, editViewing, onClose, onSuccess }: { open: boolean; editViewing: ViewingRecord | null; onClose: () => void; onSuccess: (isEdit: boolean) => void }) {
  if (!open) return null;
  return <ScheduleModalInner key={editViewing?.id || "new"} editViewing={editViewing} onClose={onClose} onSuccess={onSuccess} />;
}

function ScheduleModalInner({ editViewing, onClose, onSuccess }: { editViewing: ViewingRecord | null; onClose: () => void; onSuccess: (isEdit: boolean) => void }) {
  const isEdit = !!editViewing;
  const [form, setForm] = useState<ScheduleForm>(editViewing ? viewingToForm(editViewing) : EMPTY_FORM);
  const set = (k: keyof ScheduleForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // mandatory: property, member, agent, date, time (duration has a default; notes is optional)
  const isValid = !!form.property && !!form.member && !!form.agent && !!form.date && !!form.time;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(isEdit);
    onClose();
  };

  return createPortal(
    <div
      className="vw-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
          <button type="button" className="vw-modal__close" aria-label="Close" onClick={onClose}>
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
            <Button hierarchy="secondary" size="md" type="button" onClick={onClose}>
              Cancel
            </Button>
            <div className="vw-modal__foot-right">
              <Button hierarchy="primary" size="md" type="submit" disabled={!isValid}>
                {isEdit ? "Save changes" : "Schedule viewing"}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>,
    document.body,
  );
}

function DiscardDialog({ onCancel, onDiscard }: { onCancel: () => void; onDiscard: () => void }) {
  return createPortal(
    <div
      className="vw-confirm-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
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

/* ---------------- Reschedule modal ---------------- */
function RescheduleModal({ open, viewing, onClose, onSuccess }: { open: boolean; viewing: ViewingRecord | null; onClose: () => void; onSuccess: () => void }) {
  if (!open || !viewing) return null;
  return <RescheduleModalInner key={viewing.id} viewing={viewing} onClose={onClose} onSuccess={onSuccess} />;
}

function RescheduleModalInner({ viewing, onClose, onSuccess }: { viewing: ViewingRecord; onClose: () => void; onSuccess: () => void }) {
  const initial = useMemo(() => viewingToReschedule(viewing), [viewing]);
  const [form, setForm] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  // mandatory: date, time, agent — and only enable once something actually changed
  const canSave = dirty && !!form.date && !!form.time && !!form.agent;
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

  const agentImg = AGENT_IMG[viewing.agent];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess();
    onClose();
  };

  return createPortal(
    <div
      className="vw-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) attemptClose();
      }}
    >
      <div className="vw-modal" role="dialog" aria-modal="true" aria-labelledby="vw-resched-ttl">
        <header className="vw-modal__head">
          <div className="vw-modal__headmain">
            <span className="vw-modal__icon">
              <Icon name="calendar-clock" size={22} strokeWidth={1.9} />
            </span>
            <div className="vw-modal__heading">
              <h2 id="vw-resched-ttl" className="vw-modal__title">
                Reschedule viewing
              </h2>
              <p className="vw-modal__desc">Update the viewing appointment by selecting a new date, time, or assigned agent.</p>
            </div>
          </div>
          <button type="button" className="vw-modal__close" aria-label="Close" onClick={attemptClose}>
            <Icon name="x" size={20} />
          </button>
        </header>

        <form className="vw-modal__form" onSubmit={submit}>
          <div className="vw-modal__body">
            <section className="vw-section">
              <p className="vw-section__label">Current appointment</p>
              <div className="vw-summary">
                <div className="vw-summary__top">
                  <img src={viewing.property.img} alt="" className="vw-summary__thumb" />
                  <div className="vw-summary__head">
                    <span className="vw-summary__name">{viewing.property.title}</span>
                    <span className="vw-summary__loc">
                      <Icon name="map-pin" size={12} />
                      {viewing.property.location}
                    </span>
                  </div>
                  <span className="vw-summary__tag">
                    <Icon name="lock" size={12} />
                    {viewing.id}
                  </span>
                </div>
                <div className="vw-summary__grid">
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Member</span>
                    <span className="vw-summary__v">
                      <Avatar name={viewing.member} size="xs" />
                      <span className="vw-summary__vtxt">{viewing.member}</span>
                    </span>
                  </div>
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Assigned agent</span>
                    <span className="vw-summary__v">
                      <Avatar src={agentImg || undefined} name={viewing.agent} size="xs" verified />
                      <span className="vw-summary__vtxt">{viewing.agent}</span>
                    </span>
                  </div>
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Current date</span>
                    <span className="vw-summary__v">
                      <Icon name="calendar" size={14} />
                      {viewing.date}
                    </span>
                  </div>
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Current time</span>
                    <span className="vw-summary__v">
                      <Icon name="clock" size={14} />
                      {viewing.time}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="vw-section">
              <p className="vw-section__label">Reschedule details</p>
              <div className="vw-fields">
                <div className="vw-field-row">
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="rs-date">
                      Viewing date
                    </label>
                    <DatePicker id="rs-date" value={form.date} onChange={(v) => set("date", v)} placeholder="Select date" />
                  </div>
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="rs-time">
                      Viewing time
                    </label>
                    <TimePicker id="rs-time" value={form.time} onChange={(v) => set("time", v)} placeholder="Select time" />
                  </div>
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="rs-duration">
                    Duration
                  </label>
                  <Select id="rs-duration" size="md" value={form.duration} onChange={(e) => set("duration", e.target.value)} options={RESCHED_DURATIONS} />
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="rs-agent">
                    Assigned agent
                  </label>
                  <Combobox
                    id="rs-agent"
                    items={AGENTS}
                    value={form.agent}
                    onSelect={(v) => set("agent", v)}
                    placeholder="Assign an agent"
                    searchPlaceholder="Search agents by name or phone…"
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
              <p className="vw-section__label">Notification</p>
              <div className={"vw-notify" + (form.notify ? " is-on" : "")}>
                <Checkbox
                  id="rs-notify"
                  checked={form.notify}
                  onChange={(e) => set("notify", e.target.checked)}
                  label="Notify member"
                  description="Send an email and SMS/WhatsApp notification informing the member about the updated viewing schedule."
                />
              </div>
            </section>

            <section className="vw-section">
              <p className="vw-section__label">Reason</p>
              <div className="vw-field">
                <label className="vw-field__label" htmlFor="rs-reason">
                  Reason for rescheduling <span className="vw-optional">(Optional)</span>
                </label>
                <textarea id="rs-reason" className="vw-textarea" rows={3} placeholder="e.g. Member requested a different time." value={form.reason} onChange={(e) => set("reason", e.target.value)} />
              </div>
            </section>
          </div>

          <footer className="vw-modal__foot">
            <Button hierarchy="secondary" size="md" type="button" onClick={attemptClose}>
              Cancel
            </Button>
            <div className="vw-modal__foot-right">
              <Button hierarchy="primary" size="md" type="submit" disabled={!canSave}>
                Save changes
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
function RowActionMenu({ open, onToggle, onClose, onEdit, onView, onReschedule }: { open: boolean; onToggle: () => void; onClose: () => void; onEdit: () => void; onView: () => void; onReschedule: () => void }) {
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
          <button type="button" className="vw-aitem" role="menuitem" onClick={onReschedule}>
            <Icon name="calendar-clock" size={16} />
            Reschedule
          </button>
        </div>
        <div className="vw-amenu__sect">
          <button type="button" className="vw-aitem vw-aitem--danger" role="menuitem" onClick={onClose}>
            <Icon name="circle-x" size={16} />
            Cancel viewing
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

function ViewingRow({ v, openMenu, setOpenMenu, onEdit, onView, onReschedule }: { v: ViewingRecord; openMenu: string | null; setOpenMenu: (x: string | null) => void; onEdit: (v: ViewingRecord) => void; onView: (v: ViewingRecord) => void; onReschedule: (v: ViewingRecord) => void }) {
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
            onReschedule={() => onReschedule(v)}
            onClose={() => setOpenMenu(null)}
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

function ViewingsTable({ rows, openMenu, setOpenMenu, onEdit, onView, onReschedule }: { rows: ViewingRecord[]; openMenu: string | null; setOpenMenu: (x: string | null) => void; onEdit: (v: ViewingRecord) => void; onView: (v: ViewingRecord) => void; onReschedule: (v: ViewingRecord) => void }) {
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
      {rows.length > 0 ? rows.map((v) => <ViewingRow key={v.id} v={v} openMenu={openMenu} setOpenMenu={setOpenMenu} onEdit={onEdit} onView={onView} onReschedule={onReschedule} />) : <NoResults />}
    </div>
  );
}

function ViewingsPanel({ filters, setFilter, onClear, hasActive, rows }: { filters: ViewingFilters; setFilter: (k: keyof ViewingFilters, v: string) => void; onClear: () => void; hasActive: boolean; rows: ViewingRecord[] }) {
  const opt = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));
  const shown = hasActive ? rows.length : TOTAL_VIEWINGS;
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
            Showing <b>{rows.length}</b> of {TOTAL_VIEWINGS.toLocaleString("en-US")} viewings
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

export function ViewingsApp() {
  const router = useRouter();
  const [filters, setFilters] = useState<ViewingFilters>(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editViewing, setEditViewing] = useState<ViewingRecord | null>(null);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedView, setReschedView] = useState<ViewingRecord | null>(null);
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
  const openReschedule = (v: ViewingRecord) => {
    setOpenMenu(null);
    setReschedView(v);
    setReschedOpen(true);
  };
  const closeReschedule = () => {
    setReschedOpen(false);
    setTimeout(() => setReschedView(null), 300);
  };

  const setFilter = (k: keyof ViewingFilters, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters(EMPTY_FILTERS);
  const hasActive = Object.values(filters).some(Boolean);

  const handleScheduled = (isEdit: boolean) =>
    setToast(
      isEdit
        ? { title: "Viewing Updated Successfully", message: "The viewing details have been saved and the schedule refreshed." }
        : { title: "Viewing Scheduled Successfully", message: "The viewing appointment has been created and added to the schedule." },
    );
  const handleRescheduled = () => setToast({ title: "Viewing Rescheduled Successfully", message: "The viewing has been updated and the participant has been notified." });

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return VIEWINGS.filter((v) => {
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
  }, [filters]);

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
          <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
        ))}
      </div>

      <section className="vw-tablecard">
        <ViewingsPanel filters={filters} setFilter={setFilter} onClear={clear} hasActive={hasActive} rows={rows} />
        <ViewingsTable rows={rows} openMenu={openMenu} setOpenMenu={setOpenMenu} onEdit={openEdit} onView={openView} onReschedule={openReschedule} />
      </section>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      <ScheduleModal open={modalOpen} editViewing={editViewing} onClose={closeModal} onSuccess={handleScheduled} />
      <RescheduleModal open={reschedOpen} viewing={reschedView} onClose={closeReschedule} onSuccess={handleRescheduled} />
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
