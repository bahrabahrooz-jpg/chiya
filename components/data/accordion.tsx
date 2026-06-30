"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import "./accordion.css";

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple panels open at once. */
  multiple?: boolean;
  /** Initially open item id(s). */
  defaultOpen?: string | string[];
  className?: string;
}

/**
 * Accordion — collapsible disclosure list with smooth height animation
 * (via CSS grid-template-rows). Single or multiple open panels.
 */
export function Accordion({ items, multiple = false, defaultOpen, className = "" }: AccordionProps) {
  const [open, setOpen] = useState<string[]>(
    defaultOpen ? (Array.isArray(defaultOpen) ? defaultOpen : [defaultOpen]) : [],
  );

  const toggle = (id: string) =>
    setOpen((cur) => {
      const isOpen = cur.includes(id);
      if (multiple) return isOpen ? cur.filter((x) => x !== id) : [...cur, id];
      return isOpen ? [] : [id];
    });

  return (
    <div className={["cx-acc", className].filter(Boolean).join(" ")}>
      {items.map((it) => {
        const isOpen = open.includes(it.id);
        return (
          <div key={it.id} className={"cx-acc__item" + (isOpen ? " cx-acc__item--open" : "")}>
            <button
              type="button"
              className="cx-acc__trigger"
              aria-expanded={isOpen}
              onClick={() => toggle(it.id)}
            >
              <span>{it.title}</span>
              <Icon name="chevron-down" size={20} className="cx-acc__chev" />
            </button>
            <div className="cx-acc__panel" role="region">
              <div className="cx-acc__panelinner">
                <div className="cx-acc__body">{it.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
