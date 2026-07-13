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
 *
 * Convention: required fields carry no marker; optional fields say "(optional)"
 * in their label text. So `required` is accepted for API/semantics but renders
 * no visual indicator.
 */
export function Field({ label, hint, error, htmlFor, children }: FieldProps) {
  return (
    <div className="cx-field">
      {label && (
        <label className="cx-field__label" htmlFor={htmlFor}>
          {label}
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
