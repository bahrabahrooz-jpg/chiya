"use client";

import { Field } from "@/components/ui/field";

export interface RangeValue {
  min: number | "";
  max: number | "";
}

export interface RangeInputProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  value: RangeValue;
  onChange: (value: RangeValue) => void;
  /** Prefix shown inside each input, e.g. "$". */
  prefix?: string;
  /** Suffix shown inside each input, e.g. "m²". */
  suffix?: string;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  step?: number;
  id?: string;
}

function NumCell({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  step,
  ariaLabel,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  step?: number;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex flex-1 items-center gap-1.5 rounded-md border px-3"
      style={{ borderColor: "var(--border-default)", background: "var(--surface-card)", height: 42 }}
    >
      {prefix && <span className="cx-text-sm" style={{ color: "var(--text-tertiary)" }}>{prefix}</span>}
      <input
        type="number"
        inputMode="numeric"
        step={step}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="cx-tnum w-full bg-transparent text-[15px] outline-none"
        style={{ color: "var(--text-primary)", border: "none" }}
      />
      {suffix && <span className="cx-text-sm" style={{ color: "var(--text-tertiary)" }}>{suffix}</span>}
    </div>
  );
}

/**
 * RangeInput — a min/max numeric range (price, area). Renders two number
 * fields with an en-dash separator and optional currency / unit affixes.
 */
export function RangeInput({
  label,
  hint,
  error,
  value,
  onChange,
  prefix,
  suffix,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  step,
  id,
}: RangeInputProps) {
  const control = (
    <div className="flex items-center gap-2">
      <NumCell
        value={value.min}
        onChange={(min) => onChange({ ...value, min })}
        placeholder={minPlaceholder}
        prefix={prefix}
        suffix={suffix}
        step={step}
        ariaLabel="Minimum"
      />
      <span style={{ color: "var(--text-tertiary)" }}>–</span>
      <NumCell
        value={value.max}
        onChange={(max) => onChange({ ...value, max })}
        placeholder={maxPlaceholder}
        prefix={prefix}
        suffix={suffix}
        step={step}
        ariaLabel="Maximum"
      />
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      {control}
    </Field>
  );
}
