import type { ReactNode } from "react";
import { Icon } from "./icon";
import { Field } from "./field";
import "./forms.css";

export type SelectSize = "sm" | "md" | "lg";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  size?: SelectSize;
  placeholder?: string;
  /** Options as [{value,label}] — or pass <option> children. */
  options?: SelectOption[];
}

/**
 * Select — native select styled to match Input, with a chevron affordance.
 */
export function Select({
  label,
  hint,
  error,
  required,
  size = "md",
  placeholder,
  options,
  value,
  defaultValue,
  id,
  className = "",
  children,
  ...rest
}: SelectProps) {
  const isPlaceholder = (value ?? defaultValue ?? "") === "" && !!placeholder;
  const cls = [
    "cx-select",
    `cx-select--${size}`,
    isPlaceholder ? "cx-select--placeholder" : "",
    error ? "cx-select--error" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const control = (
    <div className="cx-selectwrap">
      <select
        id={id}
        className={cls}
        value={value}
        defaultValue={value == null ? defaultValue : undefined}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {(options || []).map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <span className="cx-select__chev">
        <Icon name="chevron-down" size={18} />
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
