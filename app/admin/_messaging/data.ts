import type { BadgeVariant } from "@/components/ui/badge";
import type { IconName } from "@/components/ui/icon";
import { isDialable, isPast, phoneDigits, type MessageLogRow, type MsgStatus, type MsgTemplateId } from "../_shared/messaging";

/* ----------------------------------------------------------------------------
   Static metadata behind the Messaging hub — the three panes, the badge each
   status wears, and the counts above the log. Labels are i18n keys resolved at
   render time (admin.wa.*). Kept out of messaging-app.tsx so the screen and its
   options cannot drift apart.
   ------------------------------------------------------------------------- */

export type MessagingSectionId = "log" | "templates" | "whatsapp";

export interface MessagingSection {
  id: MessagingSectionId;
  labelKey: string;
  descKey: string;
  icon: IconName;
}

/**
 * THE LOG COMES FIRST, and the settings last.
 *
 * The order is how often each is opened. An office looks at this screen to
 * answer "did the reminder go out?" most days; it edits the wording a few times
 * a year and touches the provider key once. Settings screens that lead with
 * configuration make the daily question the deepest click.
 */
export const MESSAGING_SECTIONS: MessagingSection[] = [
  { id: "log", labelKey: "admin.wa.nav.log", descKey: "admin.wa.nav.logDesc", icon: "inbox" },
  { id: "templates", labelKey: "admin.wa.nav.templates", descKey: "admin.wa.nav.templatesDesc", icon: "message-square-text" },
  { id: "whatsapp", labelKey: "admin.wa.nav.whatsapp", descKey: "admin.wa.nav.whatsappDesc", icon: "phone" },
];

/** How each status reads on a row. */
export const STATUS_META: Record<MsgStatus, { variant: BadgeVariant; icon: IconName }> = {
  queued: { variant: "info", icon: "clock" },
  sent: { variant: "brand", icon: "check" },
  delivered: { variant: "success", icon: "check-check" },
  suppressed: { variant: "neutral", icon: "ban" },
  failed: { variant: "error", icon: "triangle-alert" },
};

export const TEMPLATE_ICON: Record<MsgTemplateId, IconName> = {
  payment_reminder: "bell-ring",
  payment_received: "hand-coins",
  manual_notice: "message-circle",
};

/* ----------------------------------------------------------------------------
   THE TAB ROW — the one split that runs this screen
   ------------------------------------------------------------------------- */

/**
 * ONE ROW OF TABS: what is still coming, then what each finished message did.
 *
 *   upcoming              the forecast. "What is this office about to say,
 *                         and to whom?"
 *   sent / delivered /    what already had its moment, split by how it went.
 *   suppressed / failed   "Did the reminder go out?"
 *
 * This was two rows for a while — Upcoming/History on top, an All-plus-statuses
 * chip row underneath — and the top row was doing almost no work. "History" is
 * not a thing anybody looks for; the four outcomes inside it are. Naming the
 * outcomes directly costs one click less and one row of chrome less, and the
 * tabs still add up: every message sits in exactly one of them.
 *
 * `queued` is deliberately not a tab. It is the ordinary state of everything in
 * the forecast — a twelve-month tenancy schedules twelve reminders the day it
 * is signed — so a "Scheduled 18" tab beside "Upcoming 18" would be the same
 * list wearing a second name.
 */
export type LogTab = "upcoming" | MsgStatus;

/**
 * The four outcomes a message that has already had its moment can wear.
 *
 * Deliberately not built from MSG_STATUSES: `queued` is not an outcome, and a
 * status list that quietly grew one would put it back in front of the reader.
 */
export const HISTORY_STATUSES: MsgStatus[] = ["sent", "delivered", "suppressed", "failed"];

/** UPCOMING LEADS. The tab order is the reading order, and what the office is
    about to say is the half somebody can still change. The rest is a lookup. */
export const LOG_TABS: LogTab[] = ["upcoming", ...HISTORY_STATUSES];

/**
 * THE SPLIT IS THE CLOCK, NOT THE STATUS.
 *
 * Tempting to say upcoming === queued, and wrong. Switch sending off and every
 * future row becomes `suppressed` instead — the schedule has not moved, it has
 * only been silenced, and an office needs to see those months sitting there
 * about to say nothing. Asking the clock instead puts them where they belong,
 * still wearing the badge that explains why they will not leave. It also keeps
 * the outcome tabs honest: they hold finished messages only, never a forecast
 * that happens to share a badge with one.
 */
export function isUpcoming(row: MessageLogRow): boolean {
  return !isPast(row.on, row.hour);
}

/**
 * How many DISTINCT humans a set of messages reaches.
 *
 * The count that matters on the KPI strip. Twelve messages to three landlords
 * is three phone calls if something is wrong, not twelve — and a landlord with
 * four flats earns four rows and one line in this number.
 *
 * Keyed on the dialable number where there is one, because the same person can
 * be typed onto two contracts with their name spelled differently. Where there
 * is no number the name has to do, which is exactly the case the `failed` badge
 * is already shouting about.
 */
export function countPeople(rows: MessageLogRow[]): number {
  const seen = new Set<string>();
  for (const r of rows) seen.add(isDialable(r.toPhone) ? `p:${phoneDigits(r.toPhone)}` : `n:${r.toName}`);
  return seen.size;
}

/**
 * ONE FLAT TABLE PER TAB, and a date filter instead of grouping.
 *
 * The forecast was folded into month accordions for a while. It grouped the
 * right way — rent is monthly — but a fold is a thing to open before you can
 * read anything, and it hid the rows that matter most: a scheduled message
 * already marked failed reads as a plain "2 messages" until somebody clicks.
 * A flat list shows every one of those on arrival, and the date filter answers
 * "just show me July" without hiding anything to do it.
 */
export const ITEMS_PER_PAGE = 12;

/** Inclusive both ends, and blind to whichever end is not set — the two date
    filters are independent, so "from July" and "up to July" are both whole
    answers rather than half a range waiting on its other half. */
export function withinDates(iso: string, from: string | null, to: string | null): boolean {
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

/** Every hour of the day, for the send-time and quiet-hours selects. */
export const HOURS: number[] = Array.from({ length: 24 }, (_, i) => i);

/** The reminder window an office can choose. Zero is "on the day itself" and is
    a real answer, not a disabled state — some agencies only warn same-day. */
export const REMINDER_DAYS: number[] = [0, 1, 2, 3, 5, 7, 10, 14];

export const DELAY_HOURS: number[] = [1, 2, 4, 6, 12, 24];

/* ----------------------------------------------------------------------------
   The four counts above the log
   ------------------------------------------------------------------------- */

export interface LogKpis {
  /**
   * EVERYTHING THAT HAS LEFT — sent plus delivered, not delivered alone.
   *
   * The headline card counted only confirmed deliveries at first, which reads
   * as a broken system for the whole time the platform is in test mode: no
   * provider can confirm anything, so the number every office would see on
   * day one was a zero beside 21 waiting messages. What somebody actually
   * wants to know is whether the schedule is running. The delivered SHARE is
   * still on the card, under it, where it means something.
   */
  gone: number;
  delivered: number;
  /**
   * THE NEXT RENT CYCLE, and nothing beyond it.
   *
   * This card used to read "Waiting — 21", which is the whole schedule to the
   * end of every tenancy on the books — not a number an office can act on, just
   * a property of how long its leases are.
   *
   * ⚠ THIRTY DAYS, NOT SEVEN, and the reason is the business rather than taste.
   * Rent falls monthly, so a seven-day window is structurally empty for three
   * weeks out of every four — a card that reads zero most of the time teaches
   * an office to stop looking at it. Thirty days always holds exactly one
   * cycle: every tenant who will be chased and every landlord who will be told,
   * once each, which is the shape of the month's work.
   */
  next30: { messages: number; people: number };
  /** Everything still ahead, however far — the Upcoming tab's own count. */
  upcoming: number;
  suppressed: number;
  failed: number;
  /** Delivered as a share of everything that has already left. Rows still ahead
      are excluded from the denominator: a message that has not been sent yet has
      not failed to arrive, and counting it as one would drag the rate down
      every time somebody lengthened the reminder window. Null while nothing
      has gone out at all, and while a dry run means nothing can be confirmed. */
  deliveryRate: number | null;
}

export function buildLogKpis(rows: MessageLogRow[], horizonEnd: string): LogKpis {
  const past = rows.filter((r) => !isUpcoming(r));
  const ahead = rows.filter(isUpcoming);
  const count = (s: MsgStatus) => past.filter((r) => r.status === s).length;
  const delivered = count("delivered");
  const sent = count("sent");
  const failed = count("failed");
  const gone = delivered + sent;
  /* Inclusive of the last day: a reminder leaving on the thirtieth morning is
     inside "the next 30 days" to everybody except a date library. */
  const soon = ahead.filter((r) => r.on <= horizonEnd);
  return {
    gone,
    delivered,
    next30: { messages: soon.length, people: countPeople(soon) },
    upcoming: ahead.length,
    suppressed: count("suppressed"),
    failed,
    deliveryRate: delivered === 0 ? null : Math.round((delivered / (gone + failed)) * 100),
  };
}
