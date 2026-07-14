"use client";

/**
 * Viewing-slot availability for the public "Request a viewing" modal.
 *
 * Property viewings are booked in discrete 1-hour slots during working
 * hours. A slot that is already taken is "reserved" and cannot be picked
 * again — the calendar marks the day and the time picker blocks the slot
 * (shown red), while the selectable / selected state stays green.
 *
 * There is no backend in this build, so reservations come from two places:
 *   1. a small seed of demo bookings (so the calendar always shows some), and
 *   2. the signed-in member's own requests for this property (so a slot the
 *      member just booked immediately shows as reserved) — see BookModal.
 */

import { VIEWING_SLOTS, isViewingSlot, toISODate, type DayStatus } from "@/app/admin/_viewings/data";

/** The hourly slots a viewing can be booked into, as 24h "HH:MM" values.
 *  Re-exported from the shared viewings data module (single source of truth). */
export { VIEWING_SLOTS };
export type { DayStatus };

/** True when a "HH:MM" value is one of the offered viewing slots. */
export const isSlot = isViewingSlot;

/** "09:30" → "9:30 AM". */
export function slotLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

export interface ReservedSlot {
  date: string; // ISO yyyy-mm-dd
  time: string; // "HH:MM"
}

/* Demo reservations expressed as day-offsets from "today" so a few always
   fall on upcoming, selectable dates. Offset 4 fills every slot to show a
   fully-booked (red, disabled) day. */
const SEED: { offset: number; time: string }[] = [
  { offset: 0, time: "10:00" },
  { offset: 0, time: "14:00" },
  { offset: 2, time: "09:00" },
  { offset: 2, time: "15:00" },
  { offset: 3, time: "11:00" },
  { offset: 3, time: "16:00" },
  ...VIEWING_SLOTS.map((time) => ({ offset: 4, time })), // fully booked day
  { offset: 6, time: "13:00" },
  { offset: 9, time: "10:00" },
  { offset: 9, time: "16:00" },
];

/** Demo reserved slots, anchored to today (computed client-side). */
export function seedReservedSlots(): ReservedSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return SEED.map(({ offset, time }) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return { date: toISODate(d), time };
  });
}

export interface ReservedIndex {
  /** Reserved slot times per ISO date. */
  byDate: Map<string, Set<string>>;
  /** Whether a date is partially or fully booked. */
  dayStatus: Map<string, DayStatus>;
}

/** Group reserved slots by date and flag fully-booked days. */
export function buildReservedIndex(slots: ReservedSlot[]): ReservedIndex {
  const byDate = new Map<string, Set<string>>();
  for (const { date, time } of slots) {
    if (!isSlot(time)) continue;
    let set = byDate.get(date);
    if (!set) byDate.set(date, (set = new Set()));
    set.add(time);
  }
  const dayStatus = new Map<string, DayStatus>();
  for (const [date, set] of byDate) {
    dayStatus.set(date, set.size >= VIEWING_SLOTS.length ? "full" : "partial");
  }
  return { byDate, dayStatus };
}
