"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import "./icon-button.css";

export type IconButtonVariant = "default" | "ghost" | "brand" | "glass";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Lucide icon name, or a custom node. */
  icon: IconName | ReactNode;
  /** Accessible label (required — icon-only control). */
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  active?: boolean;
}

const ICON_SIZE: Record<IconButtonSize, number> = { sm: 16, md: 20, lg: 20 };

/**
 * IconButton — square, icon-only control. The `glass` variant is tuned for
 * floating over property photography (favorite / share), and fills the glyph
 * when `active` (e.g. a saved heart).
 */
export function IconButton({
  icon,
  label,
  variant = "default",
  size = "md",
  active = false,
  disabled = false,
  className = "",
  ...rest
}: IconButtonProps) {
  const iSize = ICON_SIZE[size];
  const cls = [
    "cx-iconbtn",
    `cx-iconbtn--${variant}`,
    `cx-iconbtn--${size}`,
    active ? "cx-iconbtn--active" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={cls}
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      disabled={disabled}
      {...rest}
    >
      {typeof icon === "string" ? (
        <Icon
          name={icon as IconName}
          size={iSize}
          fill={active && variant === "glass" ? "currentColor" : "none"}
        />
      ) : (
        icon
      )}
    </button>
  );
}
