"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import "./tabs.css";

export type TabsVariant = "pill" | "line" | "seg";

export interface TabItem {
  value: string;
  label: string;
  icon?: IconName;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  variant?: TabsVariant;
  className?: string;
}

/**
 * Tabs — view switcher. `variant`: pill (default), line, or segmented (seg).
 */
export function Tabs({ items, value, onChange, variant = "pill", className = "" }: TabsProps) {
  return (
    <div className={["cx-tabs", `cx-tabs--${variant}`, className].filter(Boolean).join(" ")} role="tablist">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={"cx-tab" + (active ? " cx-tab--active" : "")}
            onClick={() => onChange?.(it.value)}
          >
            {it.icon && <Icon name={it.icon} size={16} />}
            {it.label}
            {it.count != null && <span className="cx-tab__count">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
