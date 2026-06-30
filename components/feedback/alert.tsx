import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import "./alert.css";

export type AlertVariant = "brand" | "info" | "success" | "warning" | "error";

const DEFAULT_ICON: Record<AlertVariant, IconName> = {
  brand: "info",
  info: "info",
  success: "circle-check",
  warning: "triangle-alert",
  error: "circle-alert",
};

export interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  /** Override the default variant icon. */
  icon?: IconName;
  /** Show a close button → calls onDismiss. */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Alert — inline contextual banner (info / success / warning / error / brand)
 * with an icon, optional title + body, and an optional dismiss button.
 */
export function Alert({ variant = "info", title, children, icon, onDismiss, className = "" }: AlertProps) {
  return (
    <div className={["cx-alert", `cx-alert--${variant}`, className].filter(Boolean).join(" ")} role="alert">
      <span className="cx-alert__icon">
        <Icon name={icon ?? DEFAULT_ICON[variant]} size={18} />
      </span>
      <div className="cx-alert__body">
        {title && <div className="cx-alert__title">{title}</div>}
        {children && <div className="cx-alert__desc">{children}</div>}
      </div>
      {onDismiss && (
        <button type="button" className="cx-alert__close" aria-label="Dismiss" onClick={onDismiss}>
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
