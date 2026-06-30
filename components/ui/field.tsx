import type { ReactNode } from "react";
import "./forms.css";

export interface FieldProps {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}

/**
 * Field — shared label / hint / error wrapper for form controls. Internal to
 * the form primitives (Input, Textarea, Select) so they share one contract.
 */
export function Field({ label, required, hint, error, htmlFor, children }: FieldProps) {
  return (
    <div className="cx-field">
      {label && (
        <label className="cx-field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="cx-field__req">*</span>}
        </label>
      )}
      {children}
      {(error || hint) && (
        <span className={"cx-field__hint" + (error ? " cx-field__hint--error" : "")}>
          {error || hint}
        </span>
      )}
    </div>
  );
}
