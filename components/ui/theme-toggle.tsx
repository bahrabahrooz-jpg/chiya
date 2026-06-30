"use client";

import { useTheme } from "@/lib/theme";
import { Icon } from "./icon";
import "./theme-toggle.css";

export interface ThemeToggleProps {
  /** Use the translucent variant when floating over hero photography. */
  variant?: "glass";
  className?: string;
}

/**
 * ThemeToggle — segmented sun/moon control bound to the Phase 0 theme engine.
 * Faithful to the design system's `.cx-thtog`, with an animated thumb.
 */
export function ThemeToggle({ variant, className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={["cx-thtog", isDark ? "is-dark" : "", variant ? `cx-thtog--${variant}` : "", className]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label="Color theme"
    >
      <span className="cx-thtog__thumb" aria-hidden="true" />
      <button
        type="button"
        className={"cx-thtog__opt" + (!isDark ? " is-on" : "")}
        aria-pressed={!isDark}
        aria-label="Light mode"
        onClick={() => setTheme("light")}
      >
        <Icon name="sun" size={15} />
      </button>
      <button
        type="button"
        className={"cx-thtog__opt" + (isDark ? " is-on" : "")}
        aria-pressed={isDark}
        aria-label="Dark mode"
        onClick={() => setTheme("dark")}
      >
        <Icon name="moon" size={15} />
      </button>
    </div>
  );
}
