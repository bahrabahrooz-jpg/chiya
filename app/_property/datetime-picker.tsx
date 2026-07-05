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
  HOURS_12,
  MERIDIEM,
  MINUTES_60,
  MONTHS_FULL,
  composeTime,
  fmtDateLabel,
  fmtTimeLabel,
  parseISODate,
  splitTime,
  toISODate,
} from "@/app/admin/_viewings/data";
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

export function DatePicker({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
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
              const cls = "cx-cal__day" + (selDate && iso === toISODate(selDate) ? " is-selected" : "") + (iso === toISODate(today) ? " is-today" : "") + (past ? " is-past" : "");
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

export function TimePicker({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder: string }) {
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
        <div className="cx-dtp__backdrop" style={{ position: "fixed", inset: 0, zIndex: 1090 }} onMouseDown={() => setOpen(false)} />
        <div className="cx-dtp__pop cx-timepop" style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 236) }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose time">
          <div className="cx-timepop__cols">
            <div className="cx-timepop__col" ref={hRef}>
              <div className="cx-timepop__colhd">Hour</div>
              {HOURS_12.map((v) => (
                <button key={v} type="button" className={"cx-timeopt" + (v === h ? " is-selected" : "")} aria-pressed={v === h} onClick={() => pickH(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="cx-timepop__col" ref={mRef}>
              <div className="cx-timepop__colhd">Min</div>
              {MINUTES_60.map((v) => (
                <button key={v} type="button" className={"cx-timeopt" + (v === m ? " is-selected" : "")} aria-pressed={v === m} onClick={() => pickM(v)}>
                  {String(v).padStart(2, "0")}
                </button>
              ))}
            </div>
            <div className="cx-timepop__col cx-timepop__col--ap">
              <div className="cx-timepop__colhd">AM/PM</div>
              {MERIDIEM.map((v) => (
                <button key={v} type="button" className={"cx-timeopt" + (v === ap ? " is-selected" : "")} aria-pressed={v === ap} onClick={() => pickAp(v)}>
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
    <div className="cx-dtp">
      <button ref={triggerRef} type="button" id={id} className={"cx-dtp__trigger" + (open ? " is-open" : "")} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {value ? <span className="cx-dtp__value">{fmtTimeLabel(value)}</span> : <span className="cx-dtp__placeholder">{placeholder}</span>}
        <Icon name="clock" size={17} className="cx-dtp__trail" />
      </button>
      {panel}
    </div>
  );
}
