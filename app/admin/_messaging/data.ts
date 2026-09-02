import type { BadgeVariant } from "@/components/ui/badge";
import type { IconName } from "@/components/ui/icon";
import { MSG_STATUSES, type MessageLogRow, type MsgStatus, type MsgTemplateId } from "../_shared/messaging";

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

/** Tabs across the log, "all" first, then every status in the order they
    happen. Built from MSG_STATUSES rather than retyped, so a status added to
    the union gets a tab instead of quietly having none. */
export const STATUS_TABS: (MsgStatus | "all")[] = ["all", ...MSG_STATUSES];

export const ITEMS_PER_PAGE = 12;

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
  queued: number;
  suppressed: number;
  failed: number;
  /** Delivered as a share of everything that has already left. Queued rows are
      excluded from the denominator: a message that has not been sent yet has
      not failed to arrive, and counting it as one would drag the rate down
      every time somebody lengthened the reminder window. Null while nothing
      has gone out at all, and while a dry run means nothing can be confirmed. */
  deliveryRate: number | null;
}

export function buildLogKpis(rows: MessageLogRow[]): LogKpis {
  const count = (s: MsgStatus) => rows.filter((r) => r.status === s).length;
  const delivered = count("delivered");
  const sent = count("sent");
  const failed = count("failed");
  const gone = delivered + sent;
  return {
    gone,
    delivered,
    queued: count("queued"),
    suppressed: count("suppressed"),
    failed,
    deliveryRate: delivered === 0 ? null : Math.round((delivered / (gone + failed)) * 100),
  };
}
