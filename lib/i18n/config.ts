/**
 * Chiya Estate — i18n configuration: the language set, direction helpers, and the
 * pre-paint script. Deliberately free of React and of the catalogs, so the root
 * layout (a server component) can read LANG_INIT_SCRIPT without crossing a
 * "use client" boundary or pulling ~5,700 lines of translations into its graph.
 */

export const LANG_KEY = "cx-lang";

export type Lang = "en" | "ar" | "ku";
export const LANGS: Lang[] = ["en", "ar", "ku"];

/**
 * Which languages have a complete UI dictionary. All three are ready; the
 * switcher reads this to decide whether to show a "Soon" pill.
 */
export const LANG_READY: Record<Lang, boolean> = { en: true, ar: true, ku: true };

export function isRtl(lang: Lang): boolean {
  return lang === "ar" || lang === "ku";
}
export function dirFor(lang: Lang): "rtl" | "ltr" {
  return isRtl(lang) ? "rtl" : "ltr";
}

/** A flat, dotted-key catalog. Loose by design — see translate()'s `key: string`. */
export type Dict = Record<string, string>;

/**
 * Runs before first paint to set <html lang/dir> from localStorage, so an RTL
 * language doesn't flash LTR English on load. Interpolates LANG_KEY, so the two
 * must stay in the same file.
 */
export const LANG_INIT_SCRIPT = `(function(){try{var k="${LANG_KEY}";var l=localStorage.getItem(k);if(l!=="en"&&l!=="ar"&&l!=="ku")l="en";var e=document.documentElement;e.lang=l;e.dir=(l==="ar"||l==="ku")?"rtl":"ltr";}catch(e){}})();`;
