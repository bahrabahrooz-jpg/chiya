import { getActiveLocale } from "@/lib/locale-state";

/**
 * Locale-aware date/time display helpers. Depends only on locale-state so it
 * can be used from non-React modules (stores, share, notifications).
 *
 * Numbers stay Western digits in both locales (the convention across the app's
 * prices and counts). Month names use the Iraqi/Levantine Arabic set.
 */
const DOW = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
} as const;

const MON = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"],
} as const;

// Full month names for the calendar header (e.g. "July 2026").
const MON_FULL = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ar: ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول"],
} as const;

// Short weekday headers (Sun→Sat) for the calendar grid.
const DOW_NARROW = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  ar: ["أحد", "اثن", "ثلا", "أرب", "خمي", "جمع", "سبت"],
} as const;

export const dayName = (d: Date): string => DOW[getActiveLocale()][d.getDay()];
export const monthName = (d: Date): string => MON[getActiveLocale()][d.getMonth()];
export const monthNameFull = (d: Date): string => MON_FULL[getActiveLocale()][d.getMonth()];
export const weekdayHeaders = (): readonly string[] => DOW_NARROW[getActiveLocale()];

/** "Mon, Jul 14" / "الاثنين، 14 تموز" for a Date. */
export function formatDayMonth(d: Date): string {
  return getActiveLocale() === "ar"
    ? `${dayName(d)}، ${d.getDate()} ${monthName(d)}`
    : `${dayName(d)}, ${monthName(d)} ${d.getDate()}`;
}

/**
 * Localize a stored time-slot label for display. Slots are stored canonically
 * in English ("3:00 PM"); Arabic swaps the meridiem for م/ص.
 */
export function formatTimeSlot(slot: string): string {
  if (getActiveLocale() !== "ar") return slot;
  return slot.replace(/\s*AM\b/i, " ص").replace(/\s*PM\b/i, " م");
}
