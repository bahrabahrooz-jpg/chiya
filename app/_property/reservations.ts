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

import { VIEWING_SLOTS, isViewingSlot, buildReservedIndex, seedReservedSlots, type DayStatus, type ReservedSlot, type ReservedIndex } from "@/app/admin/_viewings/data";

/** The hourly slots a viewing can be booked into, plus the reserved-index
 *  helpers and demo seed. Re-exported from the shared viewings data module
 *  (single source of truth) so the public picker and admin/agent scheduler
 *  build reservations identically. */
export { VIEWING_SLOTS, buildReservedIndex, seedReservedSlots };
export type { DayStatus, ReservedSlot, ReservedIndex };

/** True when a "HH:MM" value is one of the offered viewing slots. */
export const isSlot = isViewingSlot;

/** "09:30" → "9:30 AM". */
export function slotLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}
