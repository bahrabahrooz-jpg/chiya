"use client";

import { useCallback, useMemo } from "react";
import { AGENTS, AGENT_IMG } from "@/app/admin/_viewings/data";
import { updateViewing, useViewingRecords } from "@/app/admin/_viewings/viewings-store";
import { useAuth } from "./auth";

/**
 * Chiya Estate — the member's own viewings.
 *
 * NOT A SEPARATE LIST. This used to be one: viewing requests were written to a
 * key in the visitor's browser that nothing in the admin ever read, so the
 * member saw a booking the agency had never heard of. Now it is a VIEW over the
 * agency's diary (app/admin/_viewings/viewings-store), filtered to the signed-in
 * member and projected into the shape these cards want. One list, two windows
 * onto it, and no way for the two to disagree.
 *
 * The web counterpart of the mobile app's `lib/viewings` store, which is still
 * a standalone on-device list — mobile has no route into the admin's stores.
 */

export interface Viewing {
  id: string;
  propertyId: string;
  title: string;
  address: string;
  cover: string;
  agentId: string;
  agentName: string;
  agentPhoto: string;
  /** Display date as the agency records it, e.g. "Jun 30, 2026". */
  date: string;
  /** Display time as the agency records it, e.g. "10:00 AM". */
  time: string;
  /** The agency's live status — Requested, Confirmed, Completed, Cancelled,
      No Show. It used to be pinned to "Requested" because nothing could ever
      change it; now a confirmation in the office reaches the member's card. */
  status: string;
}

/** Statuses a member may still call off themselves. A completed viewing has
    already happened and a cancelled one already is: offering Cancel on either
    would be a button that cannot mean anything. */
const CANCELLABLE = new Set(["Requested", "Confirmed"]);

export function canCancel(v: Viewing): boolean {
  return CANCELLABLE.has(v.status);
}

/**
 * The signed-in member's viewings.
 *
 * Matching is by `memberId` where the booking has one, and by name otherwise.
 * The name fallback exists for bookings made before accounts carried a member
 * id, and for a viewing staff entered by hand on somebody's behalf — a member
 * who rings the office should still see it on their own page.
 */
export function useViewings() {
  const { user } = useAuth();
  const all = useViewingRecords();

  const items = useMemo(() => {
    if (!user) return [];
    const mine = all.filter((v) => (user.memberId && v.memberId ? v.memberId === user.memberId : v.member === user.name));
    return mine.map((v): Viewing => {
      const agent = AGENTS.find((a) => a.name === v.agent);
      return {
        id: v.id,
        propertyId: v.propertyId,
        title: v.property.title,
        address: v.property.location,
        cover: v.property.img,
        agentId: agent?.id ?? "",
        agentName: v.agent,
        agentPhoto: agent?.img || AGENT_IMG[v.agent] || "",
        date: v.date,
        time: v.time,
        status: v.status,
      };
    });
  }, [all, user]);

  return {
    items,
    /**
     * Call off a viewing.
     *
     * Marks it Cancelled rather than deleting it. The agency has this booking
     * in its diary and may have blocked an hour for it; a row that silently
     * disappeared would leave somebody turning up to an empty flat. The member
     * sees "Cancelled", and so does the office.
     */
    cancel: useCallback((id: string) => updateViewing(id, { status: "Cancelled" }), []),
  };
}
