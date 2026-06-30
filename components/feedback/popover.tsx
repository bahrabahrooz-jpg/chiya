"use client";

import {
  cloneElement,
  isValidElement,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { useClickOutside } from "@/lib/use-click-outside";
import "./popover.css";

export type PopoverAlign = "start" | "end";

export interface PopoverProps {
  /**
   * The clickable trigger. If you pass a single React element (e.g. a Button),
   * it is used **as the trigger itself** (asChild) — the toggle handler + ARIA
   * are merged onto it, so no extra <button> wrapper is created. Pass plain
   * text/nodes to get a default button wrapper.
   */
  trigger: ReactNode;
  children: ReactNode;
  align?: PopoverAlign;
  className?: string;
  /** Close the panel when a click happens inside it (e.g. menu actions). */
  closeOnInside?: boolean;
}

/**
 * Popover — click-anchored floating panel. Closes on outside click and Escape.
 * Uses an asChild pattern so the consumer's own button becomes the trigger
 * (avoids nesting a <button> inside another <button>).
 */
export function Popover({ trigger, children, align = "start", className = "", closeOnInside = false }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const toggle = () => setOpen((o) => !o);

  let triggerNode: ReactNode;
  if (isValidElement(trigger)) {
    // asChild — merge our handlers/ARIA onto the provided element.
    const el = trigger as ReactElement<HTMLAttributes<HTMLElement>>;
    triggerNode = cloneElement(el, {
      onClick: (e) => {
        el.props.onClick?.(e);
        toggle();
      },
      "aria-haspopup": "menu",
      "aria-expanded": open,
    });
  } else {
    // Fallback wrapper for non-element triggers (text, etc.).
    triggerNode = (
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        style={{ display: "inline-flex", background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {trigger}
      </button>
    );
  }

  return (
    <div
      ref={ref}
      className={["cx-pop", className].filter(Boolean).join(" ")}
      onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
    >
      {triggerNode}
      {open && (
        <div
          className={`cx-pop__panel cx-pop__panel--${align}`}
          onClick={closeOnInside ? () => setOpen(false) : undefined}
        >
          {children}
        </div>
      )}
    </div>
  );
}
