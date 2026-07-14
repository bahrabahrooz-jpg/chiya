/**
 * Viewing-slot availability for the "Request a viewing" sheet — the native
 * counterpart to the website's app/_property/reservations.ts. Viewings are
 * booked in fixed 1-hour slots during working hours; Fridays are closed. A
 * taken slot is "reserved" and cannot be picked again.
 *
 * There is no backend, so reservations come from two places (see BookViewingSheet):
 *   1. a small seed of demo bookings (so some slots always show as taken), and
 *   2. the member's own requests for this property (so a slot just booked
 *      immediately shows as reserved).
 *
 * Slots are stored/compared as canonical English labels ("3:00 PM"); display
 * is localized via formatTimeSlot.
 */
import { toISODate } from "@/lib/viewings";

/** The hourly slots a viewing can be booked into, as canonical labels. */
export const VIEWING_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const SLOT_SET = new Set(VIEWING_SLOTS);

/** True when a slot label is one of the offered viewing slots. */
export function isSlot(time: string): boolean {
  return SLOT_SET.has(time);
}

/** Fridays (getDay() === 5) are closed — no viewings can be booked. */
export function isClosedDay(d: Date): boolean {
  return d.getDay() === 5;
}

export interface ReservedSlot {
  date: string; // ISO yyyy-mm-dd
  time: string; // slot label
}

/* Demo reservations expressed as day-offsets from "today" so a few always
   fall on upcoming dates. Offset 4 fills every slot to show a fully-booked day. */
const SEED: { offset: number; time: string }[] = [
  { offset: 0, time: "10:00 AM" },
  { offset: 0, time: "2:00 PM" },
  { offset: 2, time: "9:00 AM" },
  { offset: 2, time: "3:00 PM" },
  { offset: 3, time: "11:00 AM" },
  { offset: 3, time: "4:00 PM" },
  ...VIEWING_SLOTS.map((time) => ({ offset: 4, time })), // fully booked day
  { offset: 6, time: "1:00 PM" },
  { offset: 9, time: "10:00 AM" },
  { offset: 9, time: "4:00 PM" },
];

/** Demo reserved slots, anchored to today. Closed (Friday) days are skipped so
 *  the seed never lands on a day that can't be booked anyway. */
export function seedReservedSlots(): ReservedSlot[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return SEED.flatMap(({ offset, time }) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    if (isClosedDay(d)) return [];
    return [{ date: toISODate(d), time }];
  });
}

export type DayStatus = "partial" | "full";

export interface ReservedIndex {
  /** Reserved slot labels per ISO date. */
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
