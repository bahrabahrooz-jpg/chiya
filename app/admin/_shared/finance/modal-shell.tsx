"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import "./finance-modals.css";

/* ----------------------------------------------------------------------------
   The chrome every finance modal wears.

   Lifted straight from AssignAgentModal in ../../_properties/properties-app —
   same portal, same backdrop-click, same Escape, same cancel-then-confirm
   footer — so a person who has used one of these has used all of them. The one
   thing added is a scrolling body: the rent schedule preview is taller than a
   laptop viewport, and a modal that pushes its own buttons off the bottom of
   the screen cannot be finished.

   MODALS CONFIRM AND STAY. None of these navigate. The person clicking is in
   the middle of something — a walk-in at the desk, a row on a list — and
   throwing them onto another screen loses whatever they were about to do next.
   ------------------------------------------------------------------------- */

export type ModalTone = "brand" | "danger" | "warning";

export interface FinanceModalProps {
  icon: IconName;
  tone?: ModalTone;
  title: string;
  sub?: string;
  /** Wider panel, for the two-column contract form. */
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Sits above the buttons: the consequence bar, or the remaining-balance line. */
  footNote?: ReactNode;
  actions: ReactNode;
}

export function FinanceModal({ icon, tone = "brand", title, sub, wide, onClose, children, footNote, actions }: FinanceModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* The page behind must not scroll while a modal is open — on a touch screen
     the backdrop otherwise drags the list underneath it. */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return createPortal(
    <div
      className="fm-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={"fm-modal" + (wide ? " fm-modal--wide" : "")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="fm-modal__head">
          <div className={"fm-modal__icon" + (tone === "danger" ? " fm-modal__icon--danger" : tone === "warning" ? " fm-modal__icon--warning" : "")}>
            <Icon name={icon} size={24} strokeWidth={1.8} />
          </div>
          <h2 className="fm-modal__title" id={titleId}>
            {title}
          </h2>
          {sub && <p className="fm-modal__sub">{sub}</p>}
        </header>

        <div className="fm-modal__body">{children}</div>

        <div className="fm-modal__foot">
          {footNote}
          <div className="fm-modal__actions">{actions}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** The cancel button every one of these carries, so the word is the same word. */
export function CancelButton({ onClick }: { onClick: () => void }) {
  const { t } = useLang();
  return (
    <button type="button" className="fm-btn fm-btn--ghost" onClick={onClick}>
      {t("admin.topbar.cancel")}
    </button>
  );
}
