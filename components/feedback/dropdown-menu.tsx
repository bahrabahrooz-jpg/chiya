"use client";

import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Popover, type PopoverAlign } from "./popover";

export interface MenuItem {
  type?: "item";
  label: ReactNode;
  icon?: IconName;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}
export interface MenuSeparator {
  type: "separator";
}
export type DropdownMenuEntry = MenuItem | MenuSeparator;

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuEntry[];
  align?: PopoverAlign;
  className?: string;
}

/**
 * DropdownMenu — a click-triggered action menu built on Popover. Items support
 * icons, keyboard-shortcut hints, danger styling, disabled state, separators.
 */
export function DropdownMenu({ trigger, items, align = "end", className = "" }: DropdownMenuProps) {
  return (
    <Popover trigger={trigger} align={align} className={className} closeOnInside>
      <div className="cx-menu" role="menu">
        {items.map((it, i) =>
          it.type === "separator" ? (
            <div key={i} className="cx-menu__sep" role="separator" />
          ) : (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              className={"cx-menu__item" + (it.danger ? " cx-menu__item--danger" : "")}
              onClick={it.onSelect}
            >
              {it.icon && <Icon name={it.icon} size={16} />}
              <span>{it.label}</span>
              {it.shortcut && <span className="cx-menu__shortcut">{it.shortcut}</span>}
            </button>
          ),
        )}
      </div>
    </Popover>
  );
}
