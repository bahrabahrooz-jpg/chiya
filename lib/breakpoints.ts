"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Responsive breakpoints — mirror the Phase 0 grid tokens (--bp-*) and the
 * Tailwind theme (sm/md/lg/xl/2xl). Use these for JS-driven responsive logic
 * (e.g. swapping desktop nav for the mobile drawer).
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1440,
} as const;

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

/** Subscribe to a CSS media query and re-render on change (SSR-safe). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange, { passive: true });
  return () => window.removeEventListener("resize", onChange);
}
function getWidth() {
  return window.innerWidth;
}

/** Current active breakpoint name, updated on resize. Returns "lg" on the server. */
export function useBreakpoint(): Breakpoint {
  const w = useSyncExternalStore(subscribeResize, getWidth, () => BREAKPOINTS.lg);
  if (w >= BREAKPOINTS["2xl"]) return "2xl";
  if (w >= BREAKPOINTS.xl) return "xl";
  if (w >= BREAKPOINTS.lg) return "lg";
  if (w >= BREAKPOINTS.md) return "md";
  if (w >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

/** True below the `md` breakpoint (where the mobile nav / drawers take over). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}
