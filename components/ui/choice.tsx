import type { ReactNode } from "react";
import { Icon } from "./icon";
import "./choice.css";

interface ChoiceProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  description?: ReactNode;
}

function ChoiceBase({
  kind,
  label,
  description,
  disabled,
  className = "",
  id,
  ...rest
}: ChoiceProps & { kind: "check" | "radio" }) {
  return (
    <label
      className={["cx-choice", disabled ? "cx-choice--disabled" : "", className]
        .filter(Boolean)
        .join(" ")}
      htmlFor={id}
    >
      <input id={id} type={kind === "radio" ? "radio" : "checkbox"} disabled={disabled} {...rest} />
      <span className={`cx-choice__box cx-choice__box--${kind === "radio" ? "radio" : "check"}`}>
        {kind !== "radio" && (
          <Icon name="check" size={14} strokeWidth={3} className="cx-choice__tick" />
        )}
      </span>
      {(label || description) && (
        <span className="cx-choice__text">
          {label && <span className="cx-choice__label">{label}</span>}
          {description && <span className="cx-choice__desc">{description}</span>}
        </span>
      )}
    </label>
  );
}

/** Checkbox — square check control with optional label + description. */
export function Checkbox(props: ChoiceProps) {
  return <ChoiceBase kind="check" {...props} />;
}

/** Radio — circular single-choice control. Group via a shared `name`. */
export function Radio(props: ChoiceProps) {
  return <ChoiceBase kind="radio" {...props} />;
}

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
}

/** Switch — on/off toggle for settings and filters. */
export function Switch({ label, disabled, className = "", id, ...rest }: SwitchProps) {
  return (
    <label
      className={["cx-switch", disabled ? "cx-switch--disabled" : "", className]
        .filter(Boolean)
        .join(" ")}
      htmlFor={id}
    >
      <input id={id} type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="cx-switch__track">
        <span className="cx-switch__thumb" />
      </span>
      {label && <span className="cx-choice__label">{label}</span>}
    </label>
  );
}
