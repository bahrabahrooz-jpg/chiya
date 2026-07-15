"use client";

import { Fragment, createElement, useCallback, useSyncExternalStore, type ReactNode } from "react";
import { LANG_KEY, dirFor, type Dict, type Lang } from "./config";
import { en } from "./en";
import { ar } from "./ar";
import { ku } from "./ku";

/**
 * Chiya Estate — i18n engine.
 *
 * English (en) · Arabic (ar, RTL) · Kurdish (ku, RTL).
 * State lives on <html lang/dir> and localStorage, read via useSyncExternalStore
 * (consistent with the theme engine); ./config's LANG_INIT_SCRIPT sets both
 * before hydration. Catalogs are one file per language — see ./en, ./ar, ./ku.
 */

/**
 * Annotated Record<Lang, Dict> on purpose: it widens away en's literal key union
 * so translate() can index with an arbitrary runtime string. Dropping the
 * annotation breaks every dynamic call site (`t(\`city.\${x}\`)`, `t(roleKey(r))`).
 * Private, like the mobile catalogs — nothing outside needs the raw dicts.
 */
const catalogs: Record<Lang, Dict> = { en, ar, ku };

/** Values interpolated into a string's `{token}` placeholders. */
export type TParams = Record<string, string | number>;

/**
 * Translate a key for a given language, falling back to English then the key.
 * Optionally interpolates `{token}` placeholders from `params` (unknown tokens
 * are left as-is), matching the mobile catalog's behaviour.
 */
export function translate(lang: Lang, key: string, params?: TParams): string {
  const raw = catalogs[lang]?.[key] ?? catalogs.en[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`));
}

/**
 * Interpolate a translated string with React nodes instead of text — for the
 * cases where part of a sentence is emphasised or linked:
 *
 *   interleave(t("admin.agents.showing"), { range: <b>{r}</b>, total: <b>{n}</b> })
 *
 * Splitting the *translated* string on its `{slot}` tokens (rather than
 * concatenating prefix/suffix keys) lets each language put the slots wherever
 * its grammar wants them, which pre/post key pairs cannot express.
 */
export function interleave(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  // createElement rather than JSX because this module is .ts. Renaming it to
  // index.tsx would resolve fine under @/lib/i18n — left as a separate change.
  return text.split(/(\{\w+\})/g).map((part, i) => {
    const m = /^\{(\w+)\}$/.exec(part);
    return createElement(Fragment, { key: i }, m && m[1] in nodes ? nodes[m[1]] : part);
  });
}

/* ---- external store ---- */

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === LANG_KEY) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Lang {
  const l = document.documentElement.lang;
  return l === "ar" || l === "ku" ? l : "en";
}
function getServerSnapshot(): Lang {
  return "en";
}

function applyLang(lang: Lang) {
  const el = document.documentElement;
  el.lang = lang;
  el.dir = dirFor(lang);
}

/**
 * useLang — reactive language hook: active language, a setter (persists +
 * updates <html dir/lang>), the current direction, and a bound translate fn.
 */
export function useLang() {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLang = useCallback((next: Lang) => {
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* noop */
    }
    applyLang(next);
    emit();
  }, []);

  const t = useCallback((key: string, params?: TParams) => translate(lang, key, params), [lang]);

  return { lang, setLang, dir: dirFor(lang), t };
}

/* ---- public surface ---- */
export { LANG_KEY, LANGS, LANG_READY, isRtl, dirFor, LANG_INIT_SCRIPT } from "./config";
export type { Lang, Dict } from "./config";
export type { TKey, Catalog } from "./en";
