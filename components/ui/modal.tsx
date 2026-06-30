"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "./icon";
import "./modal.css";

const noopSubscribe = () => () => {};
/** True only on the client — gates the portal without setState-in-effect. */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export type ModalSize = "sm" | "md" | "lg" | "xl";

export interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Lucide icon name shown in the header badge. */
  icon?: IconName;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
  footerSpread?: boolean;
  className?: string;
}

/**
 * Modal — centered dialog with overlay, optional header icon, and a footer
 * actions slot. Controlled via `open` + `onClose`.
 *
 * Faithful to the design system, with accessibility improvements: rendered in
 * a portal, closes on Escape, and locks body scroll while open.
 */
export function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  children,
  footer,
  footerSpread = false,
  className = "",
}: ModalProps) {
  const isClient = useIsClient();

  // Escape-to-close + body scroll lock while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <div
      className="cx-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className={["cx-modal", `cx-modal--${size}`, className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
      >
        {(title || icon) && (
          <div className="cx-modal__head">
            {icon && (
              <div className="cx-modal__headicon">
                <Icon name={icon} size={22} />
              </div>
            )}
            <div className="cx-modal__titles">
              {title && <div className="cx-modal__title">{title}</div>}
              {subtitle && <div className="cx-modal__sub">{subtitle}</div>}
            </div>
            {onClose && (
              <button
                type="button"
                className="cx-modal__close"
                aria-label="Close"
                onClick={onClose}
              >
                <Icon name="x" size={20} />
              </button>
            )}
          </div>
        )}
        <div className="cx-modal__body">{children}</div>
        {footer && (
          <div className={"cx-modal__foot" + (footerSpread ? " cx-modal__foot--spread" : "")}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
