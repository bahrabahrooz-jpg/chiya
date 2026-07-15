"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtNum, monthName, weekdayName, fmtDate, localizeDigits } from "@/lib/fmt";

/* ----------------------------------------------------------------------------
   Shared admin filter controls — the dropdown and the day picker behind the
   `mp-datebtn` / `mp-custdrop` / `mp-cal` chrome in members.css. Lifted out of
   the Members page when the Audit log needed the same three filters; both pages
   render one implementation rather than two that drift.

   `today` is a prop rather than a module constant because each page seeds its
   own demo "now" (Members sits in June, the audit log in July) and reading the
   real wall clock here would desync the server and client renders.
   ------------------------------------------------------------------------- */

export type SelectOption = { value: string; label: string };

const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Close on outside click, and keep the portal glued to the trigger on scroll/resize. */
function useAnchoredPopup(open: boolean, btnRef: React.RefObject<HTMLDivElement | null>, popupSel: string, calcPos: () => void, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(popupSel)?.contains(e.target as Node)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- calcPos/close are re-created every render; re-binding the listeners on each would defeat the effect
  }, [open]);
}

/** Single-select dropdown. Re-picking the active option clears the filter. */
export function AdminSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  ariaLabel?: string;
}) {
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
  useAnchoredPopup(open, btnRef, ".mp-custdrop", calcPos, () => setOpen(false));

  return (
    <div className="mp-datebtn-wrap" ref={btnRef}>
      <button
        type="button"
        className={"mp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
        onClick={toggle}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
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
          <div className="mp-custdrop" role="listbox" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={value === o.value}
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

/** Single-day picker. `today` is the page's demo "now" (see module note). */
export function AdminDatePicker({
  value,
  onChange,
  placeholder,
  today,
  ariaLabel,
}: {
  value: Date | null;
  onChange: (v: Date | null) => void;
  placeholder: string;
  today: Date;
  ariaLabel?: string;
}) {
  const { t, lang, dir } = useLang();
  const rtl = dir === "rtl";
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({ y: (value || today).getFullYear(), m: (value || today).getMonth() }));
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
      setView({ y: (value || today).getFullYear(), m: (value || today).getMonth() });
    }
    setOpen((v) => !v);
  };
  useAnchoredPopup(open, btnRef, ".mp-cal", calcPos, () => setOpen(false));

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
      <button
        type="button"
        className={"mp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
        onClick={toggle}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <span className="mp-datebtn__label">{value ? fmtDate(lang, value) : placeholder}</span>
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
                {/* localizeDigits, not fmtNum: a year is not a quantity and must
                    not pick up a thousands separator ("July 2,026"). */}
                {monthName(lang, view.m, true)} {localizeDigits(lang, String(view.y))}
              </span>
              <button type="button" className="mp-cal__nav" onClick={() => shift(1)} aria-label={t("admin.members.nextMonth")}>
                <Icon name={rtl ? "chevron-left" : "chevron-right"} size={18} />
              </button>
            </div>
            <div className="mp-cal__grid mp-cal__wd">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <span key={i} className="mp-cal__wdcell">
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
                else if (sameDay(date, today)) cls.push("is-today");
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
