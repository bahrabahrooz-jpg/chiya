"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@/components/ui/icon-button";
import type { NavLink } from "./navbar";

const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  links?: NavLink[];
  /** Brand / header slot. */
  header?: ReactNode;
  /** Footer slot (e.g. login button, theme + language controls). */
  footer?: ReactNode;
}

/**
 * MobileNav — slide-in navigation drawer for small screens. Rendered in a
 * portal; closes on Escape, scrim click, and locks body scroll while open.
 */
export function MobileNav({ open, onClose, links = [], header, footer }: MobileNavProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <>
      <div className="cx-mnav__scrim" onClick={onClose} />
      <div className="cx-mnav__sheet" role="dialog" aria-modal="true" aria-label="Navigation">
        <div className="cx-mnav__head">
          {header}
          <IconButton icon="x" label="Close menu" variant="ghost" onClick={onClose} />
        </div>
        <nav className="cx-mnav__links">
          {links.map((l, i) => (
            <a
              key={i}
              href={l.href || "#"}
              className={"cx-mnav__link" + (l.active ? " cx-mnav__link--active" : "")}
              onClick={onClose}
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
