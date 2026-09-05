/**
 * Locale-aware display formatting for the admin/agent consoles.
 *
 * Pure functions keyed off the active `Lang` (from `lib/i18n`). These format at
 * DISPLAY time only — data is stored canonically in English (e.g. dates like
 * "Jun 30, 2026" round-tripped by the seed catalog), so never feed a formatted
 * string back into a parser.
 *
 * ⚠ EVERY DIGIT ON THE PLATFORM IS WESTERN (0–9), IN ALL THREE LANGUAGES. Arabic
 * and Kurdish used to render Eastern Arabic-Indic digits (٠–٩). They no longer
 * do: money, dates, counts, percentages and reference numbers are all read,
 * quoted down a telephone, typed into a bank slip and compared against a printed
 * contract, and a receipt whose total is written ٣٠٠ is a receipt somebody has
 * to transliterate before they can use it. The switch is `usesArabicDigits` —
 * flipping it back turns the digits over everywhere at once, because every
 * formatter here routes through `localizeDigits`.
 *
 * ⚠ AND EVERY DATE IS NUMERIC — "30/06/2026", day first, the same in all three
 * languages. Month NAMES are still used where a month is a heading rather than
 * a date (calendar pickers, chart axes); see `monthName`.
 */
import type { Lang } from "@/lib/i18n";
/* Type-only, so the "use client" module it lives in is erased at build time and
   no client boundary follows it into the server-rendered callers of this file. */
import type { CurrencyCode } from "@/lib/platform-settings";

const AR_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const;

/**
 * The languages that render Eastern Arabic-Indic digits (٠–٩). DELIBERATELY
 * EMPTY — "ar" and "ku" were in it and were taken out.
 *
 * A list rather than a deleted branch, so the decision has somewhere to live and
 * putting it back is adding two strings here rather than reconstructing a rule.
 * Every formatter in this file routes through `localizeDigits`, so this one line
 * governs money, dates, counts, percentages and reference numbers on all four
 * surfaces at once.
 */
const ARABIC_INDIC_LANGS: readonly Lang[] = [];

/** Whether a language renders Eastern Arabic-Indic digits. Nothing does. */
export function usesArabicDigits(lang: Lang): boolean {
  return ARABIC_INDIC_LANGS.includes(lang);
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

/** Two digits, so a date column lines up: 6 → "06". */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Format a Date for display — ALL NUMERIC, day first, identical in all three
 * languages:
 *  - "mdy" / "dmy": "30/06/2026"
 *  - "wdmy":        "Mon, 30/06/2026" — the weekday is still a word, because a
 *                   weekday IS a name; only the month stopped being one.
 *
 * ⚠ THE MONTH IS A NUMBER NOW. It was a name — "Jun 30, 2026", "٣٠ حزيران
 * ٢٠٢٦" — which meant a due date, the date printed on a receipt and the date on
 * the contract beside it were three different shapes depending on which
 * language the console happened to be in, and none of them could be compared
 * down a column at a glance. Numbers are the same object in every language.
 *
 * ⚠ DAY FIRST, which is what Iraq and the Kurdistan Region write, and what the
 * Arabic and Kurdish forms already did. English was the only one leading with
 * the month, so one order for everybody costs English its old habit and buys
 * three surfaces that agree. Zero-padded so the columns line up.
 *
 * Month names have NOT gone away — see `monthName`, which still dresses
 * calendar-picker headings and chart axes, where a month is a heading and not
 * a date.
 */
export function fmtDate(lang: Lang, date: Date, style: "mdy" | "dmy" | "wdmy" = "mdy"): string {
  const numeric = `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
  const out = style === "wdmy" ? `${weekdayName(lang, date.getDay())}, ${numeric}` : numeric;
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
