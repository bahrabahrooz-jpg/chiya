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

const CUR_SYMBOL: Record<string, string> = { USD: "$", EUR: "€", IQD: "IQD" };

/** Currency amount. $/€ lead the number; IQD trails it. Digits localized. */
export function fmtCurrency(lang: Lang, n: number, cur = "USD"): string {
  const sym = CUR_SYMBOL[cur] ?? cur;
  const num = fmtNum(lang, n);
  return cur === "IQD" ? `${num} ${sym}` : `${sym}${num}`;
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
