"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";
import "./button.css";

export type ButtonHierarchy =
  | "primary"
  | "accent"
  | "secondary"
  | "tertiary"
  | "link"
  | "destructive"
  | "secondary-destructive";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

type IconProp = IconName | ReactNode;

interface ButtonOwnProps {
  hierarchy?: ButtonHierarchy;
  size?: ButtonSize;
  iconLeading?: IconProp;
  iconTrailing?: IconProp;
  iconOnly?: IconProp;
  loading?: boolean;
  fullWidth?: boolean;
  /** Render as an anchor instead of a button. */
  href?: string;
}

export type ButtonProps = ButtonOwnProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement> & React.AnchorHTMLAttributes<HTMLAnchorElement>, "type"> & {
    type?: "button" | "submit" | "reset";
  };

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 18, lg: 20, xl: 20 };

function renderIcon(icon: IconProp | undefined, size: number, key: string) {
  if (!icon) return null;
  if (typeof icon === "string") return <Icon key={key} name={icon as IconName} size={size} />;
  return <span key={key}>{icon}</span>;
}

/**
 * Button — primary action control. Six hierarchies, four sizes, leading /
 * trailing / icon-only glyphs, and a loading spinner. Renders an <a> when
 * `href` is provided, otherwise a <button>.
 */
export function Button({
  children,
  hierarchy = "primary",
  size = "md",
  iconLeading,
  iconTrailing,
  iconOnly,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  href,
  className = "",
  ...rest
}: ButtonProps) {
  const iSize = ICON_SIZE[size];
  const cls = [
    "cx-btn",
    `cx-btn--${hierarchy}`,
    `cx-btn--${size}`,
    iconOnly ? "cx-btn--icon" : "",
    fullWidth ? "cx-btn--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = loading ? (
    <>
      <Icon name="loader-circle" size={iSize} className="cx-btn__spin" />
      {!iconOnly && children != null ? <span>{children}</span> : null}
    </>
  ) : iconOnly ? (
    renderIcon(iconOnly, iSize, "i")
  ) : (
    <>
      {renderIcon(iconLeading, iSize, "l")}
      {children != null ? <span>{children}</span> : null}
      {renderIcon(iconTrailing, iSize, "r")}
    </>
  );

  const ariaDisabled = disabled || loading || undefined;

  if (href) {
    return (
      <a className={cls} href={href} aria-disabled={ariaDisabled} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button
      className={cls}
      type={type}
      disabled={disabled || loading}
      aria-disabled={ariaDisabled}
      {...rest}
    >
      {content}
    </button>
  );
}
