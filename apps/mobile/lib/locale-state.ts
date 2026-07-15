/**
 * Active locale — a dependency-free holder for the session's UI language, set
 * at startup from the persisted preference and again whenever the member picks
 * a language. Kept separate from `lib/i18n` (and importable by
 * `components/home/data.ts`) so non-React helpers like `labelFor` can localize
 * option labels without a circular import. Writes always precede the profile
 * store's emit, so subscribers re-render after the locale is current.
 */
export type Locale = "en" | "ar" | "ku";

let active: Locale = "en";

export const getActiveLocale = (): Locale => active;
export const setActiveLocale = (locale: Locale): void => {
  active = locale;
};
