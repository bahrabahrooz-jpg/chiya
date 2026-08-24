/**
 * Locale-aware display formatting for the admin/agent consoles.
 *
 * Pure functions keyed off the active `Lang` (from `lib/i18n`). Arabic and
 * Kurdish (Sorani) render Eastern Arabic-Indic digits (٠–٩); English stays
 * Western. These format at DISPLAY time only — data is stored canonically in
 * English (e.g. dates like "Jun 30, 2026" round-tripped by the seed catalog),
 * so never feed a localized string back into a parser.
 *
 * If prices/counts should stay Western digits in ar/ku, flip `usesArabicDigits`.
 */
import type { Lang } from "@/lib/i18n";
/* Type-only, so the "use client" module it lives in is erased at build time and
   no client boundary follows it into the server-rendered callers of this file. */
import type { CurrencyCode } from "@/lib/platform-settings";

const AR_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/** Whether a language renders Eastern Arabic-Indic digits. */
export function usesArabicDigits(lang: Lang): boolean {
  return lang === "ar" || lang === "ku";
}

/**
 * Catalog key for a canonical English data value (status, role, type…).
 * Lowercases and strips spaces, so "No Show" → "status.noshow".
 */
export function valueKey(namespace: string, value: string): string {
  return `${namespace}.${value.toLowerCase().replace(/\s+/g, "")}`;
}

/** "Super Admin" → "superAdmin". Shared by the camelCase key builders below. */
function camelSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Catalog key for a permission, derived from its English label and namespaced by
 * surface: permKey("member", "Cancel viewings") → "perm.member.cancelViewings".
 * The surface matters — the staff and member catalogues share some labels but
 * describe them differently.
 */
export function permKey(surface: "staff" | "member", label: string): string {
  return `perm.${surface}.${camelSlug(label)}`;
}

/**
 * Catalog key for a role: roleKey("Super Admin") → "role.superAdmin".
 * Roles are camelCased, not flattened like `valueKey` — don't swap the two, or
 * multi-word roles silently miss the catalog and fall back to English.
 */
export function roleKey(role: string): string {
  return `role.${camelSlug(role)}`;
}

/**
 * Left offset for a popup that hangs off its trigger's inline-end edge (kebab
 * menus, action dropdowns). LTR anchors the popup's right edge to the trigger's
 * right; RTL mirrors that to the left edge. Portalled popups are positioned in
 * viewport pixels, so CSS logical properties can't do this — the flip has to be
 * computed. `margin` keeps it off the viewport edge.
 */
export function popupLeft(rect: { left: number; right: number }, width: number, rtl: boolean, margin = 12): number {
  if (rtl) return Math.min(rect.left, window.innerWidth - width - margin);
  return Math.max(margin, rect.right - width);
}

/**
 * Resolve interpolation params where a leading "@" marks a catalog key rather
 * than literal data: { status: "@status.sold", name: "Lana" } → the status is
 * translated, the name is passed through. Lets stored/seeded records name a
 * translatable value without committing to the language they were written in.
 */
export function resolveParams(
  params: Record<string, string> | undefined,
  t: (key: string) => string,
): Record<string, string> | undefined {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v.startsWith("@") ? t(v.slice(1)) : v]));
}

/** Convert ASCII digits in an already-formatted string to the locale's digits. */
export function localizeDigits(lang: Lang, s: string): string {
  if (!usesArabicDigits(lang)) return s;
  return s.replace(/[0-9]/g, (d) => AR_INDIC[+d]);
}

/** Integer/number with en-US thousands grouping, digits localized. */
export function fmtNum(lang: Lang, n: number): string {
  return localizeDigits(lang, n.toLocaleString("en-US"));
}

/**
 * How each currency's marker sits against the number — the ONE placement rule.
 *
 * A `Record<CurrencyCode, …>` rather than a lookup with a fallback: the type is
 * closed, so there is no "unknown code" case to fall back for, and adding a
 * currency to the type turns this into a compile error that names exactly what
 * has to be decided. A `?? code` fallback here used to hide that decision by
 * rendering the bare ISO code and calling it done.
 *
 * `$` is a sign and binds tight to the digits; `IQD` is a word and needs air.
 */
const PLACEMENT: Record<CurrencyCode, { marker: string; trails: boolean; space: boolean }> = {
  USD: { marker: "$", trails: false, space: false },
  IQD: { marker: "IQD", trails: true, space: true },
};

/** Just the marker — "$" or "IQD" — for a label or an input adornment that sits
    beside a number rather than wrapping one. Reads the same table as everything
    else, so a standalone marker can never disagree with a formatted price. */
export function currencyMarker(cur: CurrencyCode): string {
  return PLACEMENT[cur].marker;
}

/**
 * Place a currency marker around an already-formatted number string.
 *
 * The one place symbol placement is applied. `fmtCurrency` and `formatMoney`
 * (lib/money) both route through here so a minor-unit amount and a bare number
 * can never render two different ways. Pass `useCode` for multi-currency
 * contexts where "USD 1,200" is clearer than "$1,200" — the code always trails,
 * whatever the currency's own symbol does.
 */
export function fmtCurrencyParts(lang: Lang, numText: string, cur: CurrencyCode, useCode = false): string {
  const place = PLACEMENT[cur];
  /* The type says this cannot happen, so if it does the value did not come from
     typed code — it came from JSON: a localStorage blob written before `price`
     became a Money, a hand-built record, or a currency added to the type without
     a row here. Say so. Without this the failure is
     "Cannot read properties of undefined (reading 'space')" thrown from a
     formatter, which names neither the record nor the real cause.

     It throws rather than falling back to a default currency ON PURPOSE. A
     guessed marker prints a plausible price in the wrong currency, which is the
     precise bug this module exists to prevent — and it prints it silently. */
  if (!place) {
    throw new Error(
      `fmt: no placement rule for currency ${JSON.stringify(cur)}. ` +
        `Supported: ${Object.keys(PLACEMENT).join(", ")}. ` +
        `An undefined currency usually means a stored record predates the Money migration — bump the store's version key rather than coercing it to a default.`,
    );
  }
  const num = localizeDigits(lang, numText);
  if (useCode) return `${num} ${cur}`;
  const gap = place.space ? " " : "";
  return place.trails ? `${num}${gap}${place.marker}` : `${place.marker}${gap}${num}`;
}

/**
 * Currency amount from a WHOLE-UNIT number. `$` leads, `IQD` trails.
 *
 * `cur` is required and has no default. It used to default to "USD", which
 * meant every call site that simply forgot to pass one silently printed dollars
 * — including the entire public website, on a platform where half the market
 * quotes dinars. Making it required is what forces each caller to name the
 * currency it actually means.
 *
 * @deprecated NOTHING CALLS THIS ANY MORE, and new code should not start.
 * Every price on the platform is a stored `Money`, so use `formatPrice`
 * (listings) or `formatMoney` (financial documents) from lib/money instead:
 * they format from the integer minor units, so no float ever touches a printed
 * amount, and they cannot be handed a number whose currency is a guess.
 *
 * Kept only for a caller that genuinely has a bare whole-unit figure and a
 * currency to go with it. If you are reaching for it because you have a number
 * and are not sure what currency it is in, that is the bug — fix that instead.
 */
export function fmtCurrency(lang: Lang, n: number, cur: CurrencyCode): string {
  return fmtCurrencyParts(lang, n.toLocaleString("en-US"), cur);
}

/** Percentage. Pass `signed` to keep a leading + on positives (deltas). */
export function fmtPercent(lang: Lang, n: number, signed = false): string {
  const sign = signed && n > 0 ? "+" : "";
  return localizeDigits(lang, `${sign}${n}%`);
}

/* ---- dates ---- */

const MON_ABBR: Record<Lang, readonly string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"],
  ku: ["کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران", "تەمووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم"],
};

const MON_FULL: Record<Lang, readonly string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ar: MON_ABBR.ar,
  ku: MON_ABBR.ku,
};

const WD_ABBR: Record<Lang, readonly string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  ku: ["یەکشەممە", "دووشەممە", "سێشەممە", "چوارشەممە", "پێنجشەممە", "هەینی", "شەممە"],
};

/** Localized month name — `full` for the long form (calendar headers). */
export function monthName(lang: Lang, monthIndex: number, full = false): string {
  return (full ? MON_FULL : MON_ABBR)[lang][monthIndex] ?? "";
}
export function weekdayName(lang: Lang, dowIndex: number): string {
  return WD_ABBR[lang][dowIndex] ?? "";
}

/**
 * Format a Date for display. Styles:
 *  - "mdy":  "Jun 30, 2026" / "٣٠ حزيران ٢٠٢٦"  (RTL puts the day first)
 *  - "dmy":  "30 Jun 2026"  / "٣٠ حزيران ٢٠٢٦"
 *  - "wdmy": "Mon, 30 Jun 2026" with weekday
 */
export function fmtDate(lang: Lang, date: Date, style: "mdy" | "dmy" | "wdmy" = "mdy"): string {
  const d = date.getDate();
  const mo = monthName(lang, date.getMonth());
  const y = date.getFullYear();
  const rtl = usesArabicDigits(lang);
  let out: string;
  if (style === "wdmy") {
    out = `${weekdayName(lang, date.getDay())}, ${d} ${mo} ${y}`;
  } else if (style === "dmy" || rtl) {
    out = `${d} ${mo} ${y}`;
  } else {
    out = `${mo} ${d}, ${y}`;
  }
  return localizeDigits(lang, out);
}

/**
 * Format a seed timestamp of the shape `"Jun 14, 2026 · 09:42"` (date, optional
 * " · " separator, then a clock part). The date half is re-rendered via `fmtDate`
 * so month names and digits follow `lang`; the clock half only has its digits
 * converted, since 24h/12h markers are already language-neutral here.
 * An unparseable stamp is returned with digits localized and nothing else changed.
 */
export function fmtStamp(lang: Lang, stamp: string, style: "mdy" | "dmy" | "wdmy" = "mdy"): string {
  const [datePart, ...rest] = stamp.split(" · ");
  const parsed = new Date(datePart);
  if (Number.isNaN(parsed.getTime())) return localizeDigits(lang, stamp);
  const tail = rest.length ? " · " + localizeDigits(lang, rest.join(" · ")) : "";
  return fmtDate(lang, parsed, style) + tail;
}

/** Relative time from `date` to now (or a supplied `now`), localized via `t`. */
export function fmtRelative(
  lang: Lang,
  date: Date,
  t: (key: string, params?: Record<string, string | number>) => string,
  now: Date = new Date(),
): string {
  const secs = Math.max(0, Math.round((now.getTime() - date.getTime()) / 1000));
  const mins = Math.round(secs / 60);
  const hrs = Math.round(mins / 60);
  const days = Math.round(hrs / 24);
  if (secs < 60) return t("time.now");
  if (mins < 60) return t("time.minsAgo", { count: fmtNum(lang, mins) });
  if (hrs < 24) return t("time.hrsAgo", { count: fmtNum(lang, hrs) });
  if (days === 1) return t("time.yesterday");
  return t("time.daysAgo", { count: fmtNum(lang, days) });
}
