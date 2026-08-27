"use client";

import { useId, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { DISPLAY_DECIMALS, money, toMajor, type CurrencyCode, type Money } from "@/lib/money";

/* ----------------------------------------------------------------------------
   The handful of controls the finance modals share.

   Not the design system's <Input>/<Select>: those carry their own label and
   hint chrome sized for a full page form, and five of them stacked in a 460px
   modal is a scroll. These are the same tokens at modal density.

   MONEY IS NEVER A NUMBER IN STATE. `MoneyInput` holds the raw TEXT the person
   typed and hands back a `Money` — because "1,4" and "1." are things a half-
   typed amount looks like, and a numeric state would round them into something
   the person did not type while their cursor was still in the field.
   ------------------------------------------------------------------------- */

export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="fm-row">{children}</div>;
}

export function Labelled({
  label,
  optional,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  optional?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="fm-field">
      <label className="fm-label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="fm-label__opt">{optional}</span>}
      </label>
      {children}
      {(error || hint) && <span className={"fm-hint" + (error ? " fm-hint--error" : "")}>{error || hint}</span>}
    </div>
  );
}

/** Segmented control. Two or four options, all visible, one selected. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="fm-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          className={"fm-seg__btn" + (value === o.value ? " is-active" : "")}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Native select at modal density, with the house chevron. */
export function SelectField<T extends string>({
  value,
  options,
  onChange,
  id,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <div className="fm-selectwrap">
      <select
        id={id}
        className="fm-select"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="fm-selectwrap__chev">
        <Icon name="chevron-down" size={18} />
      </span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Money
   ------------------------------------------------------------------------- */

/** What a `Money` looks like in an input: major units, no grouping, no symbol. */
export function moneyToText(m: Money | undefined): string {
  if (!m) return "";
  const decimals = DISPLAY_DECIMALS[m.currency];
  const major = toMajor(m);
  return decimals > 0 ? major.toFixed(decimals) : String(Math.round(major));
}

/**
 * Text → Money, or undefined when it is not a number yet.
 *
 * Tolerant of what people actually type: grouping separators, Arabic-Indic
 * digits, a stray space. Undefined rather than zero for an unparseable string —
 * a half-typed amount is not an amount of nothing, and treating it as zero
 * would make a "Remaining after this" line flicker to the full balance mid-word.
 */
export function textToMoney(text: string, currency: CurrencyCode): Money | undefined {
  const normalised = text
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\s,٬٫]/g, (c) => (c === "٫" ? "." : ""))
    .trim();
  if (!normalised || !/^-?\d*\.?\d*$/.test(normalised)) return undefined;
  const value = Number(normalised);
  if (!Number.isFinite(value)) return undefined;
  return money(value, currency);
}

export function MoneyInput({
  value,
  onChange,
  currency,
  id,
  ariaLabel,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (text: string) => void;
  currency: CurrencyCode;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      className="fm-input fm-input--num"
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder ?? (DISPLAY_DECIMALS[currency] > 0 ? "0.00" : "0")}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * A computed figure sitting beside the input that produced it — the commission
 * next to its rate, the end date next to the term.
 *
 * Shaped exactly like Labelled: label row, then a box the same height as an
 * input. Without the label row it bottom-aligned against its neighbour, so the
 * moment that neighbour grew a hint or an error the figure dropped half a line
 * below the field it belongs to.
 */
export function Computed({ label, value }: { label: string; value: string }) {
  return (
    <div className="fm-field">
      <span className="fm-label">{label}</span>
      <div className="fm-computed">
        <span className="fm-computed__value">{value}</span>
      </div>
    </div>
  );
}

/** ISO date input. Native, because a bespoke calendar in a modal is a popup
    inside a popup — and the browser's own picker is already localised. */
export function DateInput({
  value,
  onChange,
  id,
  ariaLabel,
  placeholder,
}: {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const fallbackId = useId();
  return (
    <input
      id={id ?? fallbackId}
      type="date"
      className="fm-input fm-input--num"
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
