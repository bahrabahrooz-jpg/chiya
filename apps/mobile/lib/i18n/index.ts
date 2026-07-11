import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfile, STORAGE_KEY, type Language } from "@/lib/profile";
import { setActiveLocale, type Locale } from "@/lib/locale-state";
import { en } from "./en";
import { ar } from "./ar";

/**
 * i18n — a tiny translation layer keyed off the member's `profile.language`
 * (the single source of truth). No library: `en` is the reference catalog and
 * `ar` mirrors its shape. Kurdish ("ku") falls back to English for now.
 *
 * Usage: `const { t, locale, isRTL } = useTranslation();` then `t("profile.title")`.
 * Interpolate with `t("stats.results", { count: 12 })` against `{count}` tokens.
 */
export type { Locale } from "@/lib/locale-state";

const catalogs = { en, ar } as const;

/**
 * Map a stored language to a catalog locale. Kurdish ("ku") falls back to English
 * until its scaffold (./ku.ts) is translated and activated — see that file's header.
 */
export function localeFor(language: Language): Locale {
  return language === "ar" ? "ar" : "en";
}

type Params = Record<string, string | number>;

/** Dot-path leaf keys of the reference catalog, for compile-time key safety. */
type Leaves<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Leaves<T[K]>}`;
}[keyof T & string];

export type TKey = Leaves<typeof en>;

function lookup(obj: unknown, path: string): string | undefined {
  const val = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof val === "string" ? val : undefined;
}

function interpolate(str: string, params?: Params): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => (key in params ? String(params[key]) : `{${key}}`));
}

/** Resolve a key for a locale, falling back to English then the raw key. */
export function translate(locale: Locale, key: string, params?: Params): string {
  const value = lookup(catalogs[locale], key) ?? lookup(en, key) ?? key;
  return interpolate(value, params);
}

export function useTranslation() {
  const profile = useProfile();
  const locale = localeFor(profile.language);
  const isRTL = locale === "ar";
  const t = (key: TKey, params?: Params) => translate(locale, key, params);
  return { t, locale, isRTL };
}

/**
 * Read the persisted language directly from storage (before React mounts), so
 * the root layout can set the native layout direction on first paint.
 */
export async function loadPersistedLocale(): Promise<Locale> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { language?: Language };
      if (saved.language) {
        const locale = localeFor(saved.language);
        setActiveLocale(locale);
        return locale;
      }
    }
  } catch {
    // ignore — fall back to English
  }
  setActiveLocale("en");
  return "en";
}

/** Whether switching to `locale` crosses the LTR⇄RTL boundary (needs a reload). */
export function needsDirectionReload(locale: Locale): boolean {
  return I18nManager.isRTL !== (locale === "ar");
}

/** Apply a locale's writing direction to the native layout manager. */
export function applyDirection(locale: Locale): void {
  const rtl = locale === "ar";
  I18nManager.allowRTL(true);
  I18nManager.swapLeftAndRightInRTL(true);
  I18nManager.forceRTL(rtl);
}

/**
 * Restart the app so a just-applied RTL change re-lays-out the whole tree.
 * Uses `expo-updates` in built apps and falls back to the dev-menu reload
 * (Expo Go / development) when that isn't available.
 */
export async function reloadApp(): Promise<void> {
  try {
    const Updates = require("expo-updates") as typeof import("expo-updates");
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
      return;
    }
  } catch {
    // expo-updates unavailable (e.g. Expo Go) — fall through to DevSettings
  }
  try {
    const { DevSettings } = require("react-native") as typeof import("react-native");
    DevSettings.reload();
  } catch {
    // last resort: nothing we can do; the change applies on next manual restart
  }
}
