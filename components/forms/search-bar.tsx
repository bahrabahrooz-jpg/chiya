"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import "./search-bar.css";

export interface SearchSegment {
  label: string;
  value: string;
  icon?: IconName;
  placeholder?: boolean;
  onClick?: () => void;
}

export interface SearchBarProps {
  segments?: SearchSegment[];
  ctaLabel?: string;
  onSearch?: () => void;
  className?: string;
}

const DEFAULT_SEGMENTS: SearchSegment[] = [
  { label: "Location", value: "Erbil, Iraq", icon: "map-pin" },
  { label: "Type", value: "Villa", icon: "home" },
  { label: "Price", value: "Any", placeholder: true, icon: "wallet" },
];

/**
 * SearchBar — the marquee location/type/price search pill used on the homepage
 * and listings hero. Segments are triggers; wire each `onClick` to open a
 * picker and `onSearch` to submit.
 */
export function SearchBar({ segments = DEFAULT_SEGMENTS, ctaLabel = "Search", onSearch, className = "" }: SearchBarProps) {
  return (
    <div className={["cx-searchbar", className].filter(Boolean).join(" ")}>
      {segments.map((s, i) => (
        <button key={i} type="button" className="cx-searchbar__seg" onClick={s.onClick}>
          <span className="cx-searchbar__lbl">{s.label}</span>
          <span className={"cx-searchbar__val" + (s.placeholder ? " cx-searchbar__val--ph" : "")}>
            {s.icon && <Icon name={s.icon} size={16} />}
            {s.value}
          </span>
        </button>
      ))}
      <button type="button" className="cx-searchbar__go" onClick={onSearch}>
        <Icon name="search" size={18} />
        {ctaLabel}
      </button>
    </div>
  );
}
