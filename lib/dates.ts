/**
 * Chiya Estate — the single source of date truth.
 *
 * Every stored date in this codebase is an ISO calendar day, `yyyy-mm-dd`, and
 * never a `Date` object: a Date is an instant, carries a timezone, and does not
 * survive `JSON.stringify` → `JSON.parse` round-trips through localStorage
 * unchanged. Records store the string; only the helpers here turn one into a
 * Date, and only to do arithmetic.
 *
 * The seeds are anchored to a FIXED "today" (ANCHOR_ISO) rather than the real
 * clock. That is deliberate and load-bearing: the admin renders on the server
 * and again on the client, and a `new Date()` in seed data would produce two
 * different trees and a hydration mismatch. Everything demo-dated measures from
 * this anchor.
 *
 * No imports — this module sits at the bottom of the dependency graph so any
 * data file can use it without risking a cycle.
 */

/** The seeds' fixed "today" — Jun 30, 2026. Every `daysAgo` offset counts back
    from here, and every derived ISO date in the catalog is built off it. */
export const ANCHOR_ISO = "2026-06-30";

/** The same anchor as a Date, for the few consumers that need one (calendar
    pickers, `fmtRelative`). Local midnight, matching `fromIso`. */
export const ANCHOR_DATE = fromIso(ANCHOR_ISO);

const pad2 = (n: number) => String(n).padStart(2, "0");

/** A Date → its calendar day as `yyyy-mm-dd`, read in LOCAL time. */
export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * `yyyy-mm-dd` → a Date at LOCAL midnight on that day.
 *
 * Built field by field on purpose. `new Date("2026-06-30")` parses the string as
 * UTC midnight, which is the *previous* day everywhere west of Greenwich — so a
 * date read back would silently shift by one and every day-count derived from it
 * would be off by one. Never swap this for the string constructor.
 */
export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / 86_400_000);
}

/** How many days ago `iso` was, measured from the anchor (0 = that day, negative
    = still in the future). Pass `asOf` to measure from another day instead. */
export function daysAgo(iso: string, asOf: string = ANCHOR_ISO): number {
  return daysBetween(iso, asOf);
}

/** `iso` shifted by `n` days — negative goes backwards. Month/year roll over. */
export function addDays(iso: string, n: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + n);
  return toIso(d);
}

/**
 * Has a due date passed? Strictly after: something due today is not yet overdue.
 *
 * `asOfIso` defaults to the anchor, NOT the real clock. Overdue is a derived
 * value rendered on both the server and the client, so a wall-clock default
 * would make it a hydration mismatch waiting to happen — and would drift the
 * seeds out of the scenario they were written to show. Pass the real day
 * explicitly if a caller genuinely wants it.
 */
export function isOverdue(dueIso: string, asOfIso: string = ANCHOR_ISO): boolean {
  return daysBetween(dueIso, asOfIso) > 0;
}
