"use client";

import { useTheme } from "@/lib/theme";
import { IconButton, type IconButtonVariant } from "./icon-button";

export interface ThemeToggleProps {
  /** Button variant — `glass` when floating over hero photography. */
  variant?: IconButtonVariant;
  className?: string;
}

/**
 * ThemeToggle — a single icon button bound to the theme engine's `toggle()`.
 * The glyph reflects the current theme (sun in light, moon in dark) and the
 * accessible label names the action; theme is a low-frequency setting, so one
 * compact control beats a segmented pill.
 */
export function ThemeToggle({ variant = "ghost", className }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <IconButton
      icon={isDark ? "moon" : "sun"}
      label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      variant={variant}
      className={className}
      onClick={toggle}
    />
  );
}
