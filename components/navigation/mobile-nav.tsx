"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { NavLink } from "./navbar";
import "./mobile-nav.css";

const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links?: NavLink[];
  /** Footer slot (e.g. login button, theme + language controls). */
  footer?: ReactNode;
}

/**
 * MobileNav — navigation dropdown for small screens: a compact panel anchored to
 * the top-right under the burger. Rendered in a portal; closes on Escape and on
 * an outside (scrim) click.
 */
export function MobileNav({ open, onClose, links = [], footer }: MobileNavProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <>
      <div className="cx-mnav__scrim" onClick={onClose} />
      <div className="cx-mnav__menu" role="dialog" aria-modal="true" aria-label="Navigation">
        <nav className="cx-mnav__links">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href || "#"}
              className={"cx-mnav__link" + (l.active ? " cx-mnav__link--active" : "")}
              onClick={(e) => {
                l.onClick?.(e);
                onClose();
              }}
            >
              {l.label}
            </a>
          ))}
        </nav>
        {footer && <div className="cx-mnav__foot">{footer}</div>}
      </div>
    </>,
    document.body,
  );
}
