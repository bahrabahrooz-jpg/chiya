import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import { Field } from "./field";
import "./forms.css";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  size?: InputSize;
  iconLeading?: IconName;
  iconTrailing?: IconName;
}

/**
 * Input — text field with optional label, hint/error, and leading/trailing
 * icons. When no label/hint/error is given, renders the bare control.
 */
export function Input({
  label,
  hint,
  error,
  required,
  size = "md",
  iconLeading,
  iconTrailing,
  id,
  className = "",
  ...rest
}: InputProps) {
  const cls = [
    "cx-input",
    `cx-input--${size}`,
    iconLeading ? "cx-input--haslead" : "",
    iconTrailing ? "cx-input--hastrail" : "",
    error ? "cx-input--error" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const field = (
    <div className="cx-inputwrap">
      {iconLeading && (
        <span className="cx-input__icon cx-input__icon--lead">
          <Icon name={iconLeading} size={size === "sm" ? 16 : 18} />
        </span>
      )}
      <input id={id} className={[cls, className].filter(Boolean).join(" ")} {...rest} />
      {iconTrailing && (
        <span className="cx-input__icon cx-input__icon--trail">
          <Icon name={iconTrailing} size={size === "sm" ? 16 : 18} />
        </span>
      )}
    </div>
  );

  if (!label && !hint && !error) return field;
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={id}>
      {field}
    </Field>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
}

/** Textarea — multi-line field sharing Input's label/hint/error contract. */
export function Textarea({
  label,
  hint,
  error,
  required,
  id,
  className = "",
  ...rest
}: TextareaProps) {
  const cls = ["cx-input", "cx-textarea", error ? "cx-input--error" : "", className]
    .filter(Boolean)
    .join(" ");
  const field = <textarea id={id} className={cls} {...rest} />;
  if (!label && !hint && !error) return field;
  return (
    <Field label={label} required={required} hint={hint} error={error} htmlFor={id}>
      {field}
    </Field>
  );
}
