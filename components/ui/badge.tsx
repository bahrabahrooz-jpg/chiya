import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import "./badge.css";

export type BadgeVariant =
  | "neutral"
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "solid"
  | "gold";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Show a leading status dot. */
  dot?: boolean;
  /** Leading Lucide icon name. */
  icon?: IconName;
  children?: ReactNode;
}

/**
 * Badge — compact status / category label (listing states like "Verified",
 * "New", "For Rent", metric deltas).
 */
export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  className = "",
  ...rest
}: BadgeProps) {
  const cls = ["cx-badge", `cx-badge--${variant}`, `cx-badge--${size}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="cx-badge__dot" />}
      {icon && <Icon name={icon} size={size === "lg" ? 14 : 12} />}
      {children}
    </span>
  );
}

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** When provided, renders a removable "x" affordance. */
  onRemove?: () => void;
  children?: ReactNode;
}

/** Tag — removable filter chip used in the search filter bar. */
export function Tag({ children, onRemove, className = "", ...rest }: TagProps) {
  return (
    <span className={["cx-tag", className].filter(Boolean).join(" ")} {...rest}>
      {children}
      {onRemove && (
        <button type="button" className="cx-tag__x" aria-label="Remove" onClick={onRemove}>
          <Icon name="x" size={13} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}
