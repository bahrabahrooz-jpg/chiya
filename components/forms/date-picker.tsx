"use client";

import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import "@/components/ui/forms.css";

export type DatePickerSize = "sm" | "md" | "lg";

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  size?: DatePickerSize;
  /** "date" (default), "time", or "datetime-local". */
  mode?: "date" | "time" | "datetime-local";
}

/**
 * DatePicker — a thin wrapper over the native date/time input, styled to match
 * the design system's Input with a calendar affordance. Uses the platform
 * picker (accessible, localized, zero-dependency); swap the inner input later
 * for a custom calendar if needed.
 */
export function DatePicker({
  label,
  hint,
  error,
  required,
  size = "md",
  mode = "date",
  id,
  className = "",
  ...rest
}: DatePickerProps) {
  const cls = ["cx-input", `cx-input--${size}`, "cx-input--hastrail", error ? "cx-input--error" : "", className]
    .filter(Boolean)
    .join(" ");
  const control = (
    <div className="cx-inputwrap">
      <input id={id} type={mode} className={cls} {...rest} />
      <span className="cx-input__icon cx-input__icon--trail">
        <Icon name={mode === "time" ? "clock" : "calendar"} size={size === "sm" ? 16 : 18} />
      </span>
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={id}>
      {control}
    </Field>
  );
}
