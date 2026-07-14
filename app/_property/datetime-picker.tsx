"use client";

/**
 * DatePicker / TimePicker for the public "request a viewing" modal.
 *
 * These mirror the calendar + hour/minute/meridiem popovers used by the
 * admin & agent "Schedule viewing" modal, so the booking flow across
 * surfaces shares the same date/time picking experience. The pure date
 * helpers are reused from the admin viewings data module; the visual
 * styles live in ./datetime-picker.css (a scoped copy — the public PDP
 * never loads the admin viewings stylesheet).
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import {
  CAL_DOW,
  MONTHS_FULL,
  fmtDateLabel,
  fmtTimeLabel,
  parseISODate,
  toISODate,
} from "@/app/admin/_viewings/data";
import { VIEWING_SLOTS, slotLabel, type DayStatus } from "./reservations";
import "./datetime-picker.css";

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

export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  dayStatus,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** ISO date → whether that day is partially or fully booked. */
  dayStatus?: Map<string, DayStatus>;
}) {
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
        <div className="cx-dtp__backdrop" style={{ position: "fixed", inset: 0, zIndex: 1090 }} onMouseDown={() => setOpen(false)} />
        <div className="cx-dtp__pop cx-cal" style={{ left: pos.left, top: pos.top, width: pos.width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose date">
          <div className="cx-cal__head">
            <button type="button" className="cx-cal__nav" aria-label="Previous month" onClick={() => setView(new Date(year, month - 1, 1))}>
              <Icon name="chevron-left" size={18} />
            </button>
            <span className="cx-cal__title">
              {MONTHS_FULL[month]} {year}
            </span>
            <button type="button" className="cx-cal__nav" aria-label="Next month" onClick={() => setView(new Date(year, month + 1, 1))}>
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
          <div className="cx-cal__grid cx-cal__dow">
            {CAL_DOW.map((w) => (
              <span key={w} className="cx-cal__dowcell">
                {w}
              </span>
            ))}
          </div>
          <div className="cx-cal__grid">
            {cells.map((d, i) => {
              if (!d) return <span key={"e" + i} className="cx-cal__pad" />;
              const iso = toISODate(d);
              const past = d < today;
              const closed = d.getDay() === 5; // Fridays are off
              const status = dayStatus?.get(iso);
              const full = status === "full";
              const disabled = past || closed || full;
              const cls =
                "cx-cal__day" +
                (selDate && iso === toISODate(selDate) ? " is-selected" : "") +
                (iso === toISODate(today) ? " is-today" : "") +
                (past || closed ? " is-past" : "") +
                (full ? " is-full" : status === "partial" ? " is-reserved" : "");
              return (
                <button
                  key={iso}
                  type="button"
                  className={cls}
                  disabled={disabled}
                  aria-label={closed ? `${d.getDate()} — closed` : full ? `${d.getDate()} — fully booked` : status === "partial" ? `${d.getDate()} — some times reserved` : undefined}
                  onClick={() => !disabled && choose(d)}
                >
                  {d.getDate()}
                  {!closed && status === "partial" && <span className="cx-cal__dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div className="cx-dtp">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={"cx-dtp__trigger" + (open ? " is-open" : "")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) setView(parseISODate(value) || new Date());
          setOpen((o) => !o);
        }}
      >
        {value ? <span className="cx-dtp__value">{fmtDateLabel(value)}</span> : <span className="cx-dtp__placeholder">{placeholder}</span>}
        <Icon name="calendar" size={17} className="cx-dtp__trail" />
      </button>
      {panel}
    </div>
  );
}

export function TimePicker({
  id,
  value,
  onChange,
  placeholder,
  disabled,
  reservedTimes,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Disabled until a viewing date is chosen. */
  disabled?: boolean;
  /** Slot times ("HH:MM") already reserved on the selected date. */
  reservedTimes?: Set<string>;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(".is-selected");
    if (el) listRef.current.scrollTop = el.offsetTop - listRef.current.clientHeight / 2 + el.clientHeight / 2;
  }, [open]);

  const choose = (slot: string) => {
    onChange(slot);
    setOpen(false);
  };

  const panel =
    open &&
    pos &&
    createPortal(
      <>
        <div className="cx-dtp__backdrop" style={{ position: "fixed", inset: 0, zIndex: 1090 }} onMouseDown={() => setOpen(false)} />
        <div className="cx-dtp__pop cx-slotpop" style={{ left: pos.left, top: pos.top, width: pos.width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose time">
          <div className="cx-slotpop__list" ref={listRef}>
            {VIEWING_SLOTS.map((slot) => {
              const reserved = reservedTimes?.has(slot) ?? false;
              const selected = slot === value;
              return (
                <button
                  key={slot}
                  type="button"
                  className={"cx-slot" + (selected ? " is-selected" : "") + (reserved ? " is-reserved" : "")}
                  aria-pressed={selected}
                  disabled={reserved}
                  onClick={() => !reserved && choose(slot)}
                >
                  <span className="cx-slot__time">{slotLabel(slot)}</span>
                  {reserved && <span className="cx-slot__tag">Reserved</span>}
                </button>
              );
            })}
          </div>
        </div>
      </>,
      document.body,
    );

  return (
    <div className="cx-dtp">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={"cx-dtp__trigger" + (open ? " is-open" : "")}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {value ? <span className="cx-dtp__value">{fmtTimeLabel(value)}</span> : <span className="cx-dtp__placeholder">{placeholder}</span>}
        <Icon name="clock" size={17} className="cx-dtp__trail" />
      </button>
      {panel}
    </div>
  );
}
