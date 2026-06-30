"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Chiya Estate theme engine (light / dark).
 *
 * Ported from the original export's vanilla `theme.js`:
 *  - localStorage persistence under `cx-theme`
 *  - system-preference fallback until the user picks explicitly
 *  - applies `data-theme` + `color-scheme` to <html>
 *
 * Implemented as an external store read via `useSyncExternalStore`, which is
 * the hydration-safe React 19 pattern for DOM/localStorage-backed state. The
 * pre-paint init (no flash of wrong theme) runs from THEME_INIT_SCRIPT in
 * `app/layout.tsx` before React hydrates.
 */

export const THEME_KEY = "cx-theme";

export type Theme = "light" | "dark";

/** Minified inline script injected in <head> to set the theme before first paint. */
export const THEME_INIT_SCRIPT = `(function(){try{var k="${THEME_KEY}";var s=localStorage.getItem(k);var t=(s==="dark"||s==="light")?s:(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var e=document.documentElement;e.setAttribute("data-theme",t);e.style.colorScheme=t;}catch(e){}})();`;

function systemPref(): Theme {
  return typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme) {
  const el = document.documentElement;
  el.setAttribute("data-theme", theme);
  try {
    el.style.colorScheme = theme;
  } catch {
    /* noop */
  }
}

/* ---- external store ---- */

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) emit();
  };
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onMq = () => {
    // Follow the system only until the user has chosen explicitly.
    if (!readStored()) {
      applyTheme(systemPref());
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  mq?.addEventListener?.("change", onMq);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
    mq?.removeEventListener?.("change", onMq);
  };
}

function getSnapshot(): Theme {
  // Trust the attribute the pre-paint script already applied.
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return readStored() ?? systemPref();
}

function getServerSnapshot(): Theme {
  return "light";
}

/**
 * Reactive theme hook. Reflects whatever the pre-paint script applied, stays
 * in sync across tabs and system-preference changes, and persists user choice.
 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* noop */
    }
    applyTheme(next);
    emit();
  }, []);

  const toggle = useCallback(() => {
    setTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
