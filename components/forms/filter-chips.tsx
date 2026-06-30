"use client";

import { Tag } from "@/components/ui/badge";

export interface FilterChip {
  key: string;
  label: string;
  onRemove?: () => void;
}

export interface FilterChipsProps {
  chips: FilterChip[];
  onClearAll?: () => void;
  clearLabel?: string;
  className?: string;
}

/**
 * FilterChips — a row of removable active-filter chips with an optional
 * "Clear all" affordance. Built on the Tag primitive.
 */
export function FilterChips({ chips, onClearAll, clearLabel = "Clear all", className = "" }: FilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <div className={["flex flex-wrap items-center gap-2", className].filter(Boolean).join(" ")}>
      {chips.map((c) => (
        <Tag key={c.key} onRemove={c.onRemove}>
          {c.label}
        </Tag>
      ))}
      {onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="px-1 text-sm font-semibold hover:underline"
          style={{ color: "var(--text-brand)" }}
        >
          {clearLabel}
        </button>
      )}
    </div>
  );
}
