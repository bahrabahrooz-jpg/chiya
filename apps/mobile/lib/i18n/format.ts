import { getActiveLocale } from "@/lib/locale-state";
import { isRtlLocale } from "@/lib/i18n";

/**
 * Locale-aware date/time display helpers. Depends only on locale-state so it
 * can be used from non-React modules (stores, share, notifications).
 *
 * Numbers stay Western digits in every locale (the convention across the app's
 * prices and counts). Arabic uses the Iraqi/Levantine month set; Kurdish
 * (Sorani) uses the Kurdish Gregorian month names.
 */
const DOW = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  ku: ["یەکشەممە", "دووشەممە", "سێشەممە", "چوارشەممە", "پێنجشەممە", "هەینی", "شەممە"],
} as const;

const MON = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"],
  ku: ["کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران", "تەمووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم"],
} as const;

// Full month names for the calendar header (e.g. "July 2026").
const MON_FULL = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"],
  ku: ["کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران", "تەمووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم"],
} as const;

// Short weekday headers (Sun→Sat) for the calendar grid.
const DOW_NARROW = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  ar: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
  ku: ["یەک", "دوو", "سێ", "چوار", "پێن", "هەی", "شەم"],
} as const;

export const dayName = (d: Date): string => DOW[getActiveLocale()][d.getDay()];
export const monthName = (d: Date): string => MON[getActiveLocale()][d.getMonth()];
export const monthNameFull = (d: Date): string => MON_FULL[getActiveLocale()][d.getMonth()];
export const weekdayHeaders = (): readonly string[] => DOW_NARROW[getActiveLocale()];

/** "Mon, Jul 14" / "الاثنين، 14 تموز" / "دووشەممە، ١٤ تەمووز" for a Date. */
export function formatDayMonth(d: Date): string {
  return isRtlLocale(getActiveLocale())
    ? `${dayName(d)}، ${d.getDate()} ${monthName(d)}`
    : `${dayName(d)}, ${monthName(d)} ${d.getDate()}`;
}

/**
 * Localize a stored time-slot label for display. Slots are stored canonically
 * in English ("3:00 PM"); Arabic swaps the meridiem for ص/م and Kurdish for
 * پ.ن/د.ن (پێش نیوەڕۆ / دوای نیوەڕۆ).
 */
export function formatTimeSlot(slot: string): string {
  const locale = getActiveLocale();
  if (locale === "ar") return slot.replace(/\s*AM\b/i, " ص").replace(/\s*PM\b/i, " م");
  if (locale === "ku") return slot.replace(/\s*AM\b/i, " پ.ن").replace(/\s*PM\b/i, " د.ن");
  return slot;
}
