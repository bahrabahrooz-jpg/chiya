"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { Tag } from "@/components/ui/badge";
import "./search-filters.css";

export interface FilterButton {
  label: string;
  icon?: IconName;
  count?: number;
  active?: boolean;
  /** Hide the dropdown chevron. */
  dropdown?: boolean;
  onClick?: () => void;
}

export interface SearchFiltersProps {
  filters?: FilterButton[];
  activeTags?: string[];
  onClear?: () => void;
  onRemoveTag?: (tag: string) => void;
  className?: string;
}

/**
 * SearchFilters — the secondary filter toolbar: quick filter buttons (with
 * counts) plus a row of removable active-filter Tags and a clear-all action.
 */
export function SearchFilters({ filters = [], activeTags = [], onClear, onRemoveTag, className = "" }: SearchFiltersProps) {
  return (
    <div className={["flex flex-col gap-3", className].filter(Boolean).join(" ")}>
      <div className="cx-filterbar">
        {filters.map((f, i) => (
          <button key={i} className={"cx-filterbtn" + (f.active ? " cx-filterbtn--active" : "")} onClick={f.onClick}>
            {f.icon && <Icon name={f.icon} size={16} />}
            {f.label}
            {f.count != null && <span className="cx-filterbtn__count">{f.count}</span>}
            {f.dropdown !== false && <Icon name="chevron-down" size={15} />}
          </button>
        ))}
      </div>
      {activeTags.length > 0 && (
        <div className="cx-filtertags">
          {activeTags.map((t, i) => (
            <Tag key={i} onRemove={onRemoveTag ? () => onRemoveTag(t) : undefined}>
              {t}
            </Tag>
          ))}
          {onClear && (
            <button className="cx-filterbar__clear" onClick={onClear}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
