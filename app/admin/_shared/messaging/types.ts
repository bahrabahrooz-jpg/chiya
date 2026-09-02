import { ANCHOR_ISO, addDays } from "@/lib/dates";
import type { Lang } from "@/lib/i18n";

/* =============================================================================
   Messaging — what the agency SAYS to the two people on a tenancy, and when.

   Two sentences carry this whole feature:

     "Your rent is due on the 15th."           → to the TENANT, a few days early
     "Your rent has arrived, come and get it." → to the LANDLORD, once it has

   Everything in this folder exists to make those two sentences leave on time,
   in the right language, and to leave a record that they did.

   THREE RULES.

   1. A MESSAGE IS DERIVED, NOT STORED. The reminder for June's rent is not a row
      somebody created — it is what the June rent invoice MEANS once a due date
      and a "remind 3 days before" setting are put beside it. So the log is
      computed from the contracts, the invoices and the payments every time it is
      read (see ./outbox). Change the reminder window from 3 days to 1 and the
      whole schedule moves, because nothing was ever written down to disagree.

      The one exception is a message a PERSON sent by hand from the contract
      screen. Nothing in the data implies it, so it is stored — see ./store.

   2. THE TEXT IS DATA, THE INTERFACE IS TRANSLATED. Template bodies live in this
      store in all three languages and are edited by the admin; they are NOT
      i18n keys. The recipient reads the language the agency chose to write to
      customers in (`sendLanguage`), which has nothing to do with the language
      the admin happens to be reading the screen in.

   3. NOTHING IS ACTUALLY DELIVERED. There is no WhatsApp account behind this and
      no server to hold one, so a "sent" row means the message was composed and
      scheduled, not handed to Meta. The one thing here that genuinely reaches a
      phone is the wa.me link a human clicks — see `waLink`. Every place that
      could be mistaken for real delivery says so on screen.
   ========================================================================== */

/* ----------------------------------------------------------------------------
   Templates
   ------------------------------------------------------------------------- */

/**
 * The three things the agency ever says.
 *
 *   payment_reminder  the tenant, N days before rent falls due
 *   payment_received  the landlord, once that rent is in our hands
 *   manual_notice     a person, typed by a person, about one contract
 *
 * A fourth would need a fourth reason to exist. "Lease ending soon" and
 * "deposit returned" are both plausible and neither is in scope here.
 */
export type MsgTemplateId = "payment_reminder" | "payment_received" | "manual_notice";

export const TEMPLATE_IDS: MsgTemplateId[] = ["payment_reminder", "payment_received", "manual_notice"];

/** Who a template is written to. Decides which phone number a row resolves. */
export type MsgAudience = "tenant" | "landlord";

/** Which side each automatic template addresses. `manual_notice` can go to
    either, so it is not in here — the person sending it picks. */
export const TEMPLATE_AUDIENCE: Record<Exclude<MsgTemplateId, "manual_notice">, MsgAudience> = {
  payment_reminder: "tenant",
  payment_received: "landlord",
};

/**
 * The placeholders a template may use, per template.
 *
 * Declared rather than read back out of the body, because the editor offers them
 * as chips to insert and an admin who deletes `{amount}` should still be able to
 * put it back. A token the body never uses costs nothing; a token the renderer
 * cannot fill would leave `{like_this}` on a customer's phone, which is why
 * `renderBody` blanks unknown ones instead of printing them.
 */
export const TEMPLATE_TOKENS: Record<MsgTemplateId, string[]> = {
  payment_reminder: ["tenant_name", "amount", "currency", "due_date", "days_before", "property_label", "contract_no", "landlord_name"],
  payment_received: ["landlord_name", "tenant_name", "amount", "currency", "paid_date", "property_label", "contract_no"],
  manual_notice: ["recipient_name", "property_label", "contract_no", "agency_name", "agent_name", "agent_phone"],
};

export interface MessageTemplate {
  id: MsgTemplateId;
  /** Off means the schedule still computes the message and never sends it —
      the row appears in the log as suppressed, so "why did nobody get this?"
      has an answer on the screen rather than in somebody's memory. */
  enabled: boolean;
  /** The body in every language the platform speaks. Authored, not translated. */
  body: Record<Lang, string>;
}

/* The seeded wording. Plain, short, and it names the property — a landlord with
   four flats cannot act on "your rent has arrived". */
export const DEFAULT_TEMPLATES: Record<MsgTemplateId, MessageTemplate> = {
  payment_reminder: {
    id: "payment_reminder",
    enabled: true,
    body: {
      en: "Hello {tenant_name}, this is a reminder that your rent of {amount} for {property_label} is due on {due_date}, {days_before} days from now. Please have the payment ready. Thank you.",
      ar: "مرحباً {tenant_name}، هذا تذكير بأن إيجارك البالغ {amount} عن {property_label} يستحق في {due_date}، بعد {days_before} أيام من الآن. يرجى تجهيز المبلغ. شكراً لك.",
      ku: "سڵاو {tenant_name}، ئەمە بیرخستنەوەیەکە کە کرێی {amount} بۆ {property_label} لە {due_date} دەبێت بدرێت، دوای {days_before} ڕۆژ لە ئێستاوە. تکایە پارەکە ئامادە بکە. سوپاس.",
    },
  },
  payment_received: {
    id: "payment_received",
    enabled: true,
    body: {
      en: "Hello {landlord_name}, the rent of {amount} from {tenant_name} for {property_label} was received on {paid_date}. The money is ready for you to collect from our office. Thank you.",
      ar: "مرحباً {landlord_name}، تم استلام إيجار {amount} من {tenant_name} عن {property_label} بتاريخ {paid_date}. المبلغ جاهز لاستلامه من مكتبنا. شكراً لك.",
      ku: "سڵاو {landlord_name}، کرێی {amount} لە {tenant_name} بۆ {property_label} لە {paid_date} وەرگیرا. پارەکە ئامادەیە بۆ وەرگرتنی لە نووسینگەکەمانەوە. سوپاس.",
    },
  },
  manual_notice: {
    id: "manual_notice",
    enabled: true,
    body: {
      en: "Hello {recipient_name}, this is {agent_name} from {agency_name} about {property_label}, contract {contract_no}. ",
      ar: "مرحباً {recipient_name}، معك {agent_name} من {agency_name} بخصوص {property_label}، العقد {contract_no}. ",
      ku: "سڵاو {recipient_name}، من {agent_name}م لە {agency_name} سەبارەت بە {property_label}، گرێبەستی {contract_no}. ",
    },
  },
};

/* ----------------------------------------------------------------------------
   Delivery settings
   ------------------------------------------------------------------------- */

export type MsgProvider = "meta" | "twilio" | "dialog360";
export const PROVIDERS: MsgProvider[] = ["meta", "twilio", "dialog360"];

export interface WhatsAppSettings {
  /** The master switch. Off means nothing leaves, for any template. */
  enabled: boolean;
  /**
   * Compose and log every message, deliver none.
   *
   * ON BY DEFAULT, and deliberately: this platform has no WhatsApp account
   * behind it, so a default of "live" would be a screen claiming to text real
   * people. Turning it off is a decision somebody takes with a provider key in
   * front of them.
   */
  dryRun: boolean;
  provider: MsgProvider;
  /** The number the messages come FROM — what a tenant sees calling back. */
  businessNumber: string;
  /** Never shown in full once saved. See `maskKey`. */
  apiKey: string;
  /** Which language customers are written to in. Not the admin's own. */
  sendLanguage: Lang;

  /** How many days before a rent due date the tenant is reminded. 0 = same day. */
  reminderDaysBefore: number;
  /** The hour of the day reminders go out, so nobody is texted at 03:00. */
  sendHour: number;
  /**
   * HOLD THE LANDLORD'S "money has arrived" FOR A WHILE.
   *
   * An invoice raised by mistake is usually spotted within minutes of being
   * paid, and a landlord who has already driven to the office is a harder thing
   * to undo than a message that never left. Voiding the invoice inside this
   * window cancels the message — see the `invoiceVoided` branch in ./outbox.
   */
  landlordDelayOn: boolean;
  landlordDelayHours: number;

  /** Nothing scheduled is delivered between these hours; it waits for the end of
      the window. A test message a human presses send on still goes. */
  quietHoursOn: boolean;
  quietStart: number;
  quietEnd: number;
}

export const DEFAULT_WHATSAPP: WhatsAppSettings = {
  enabled: true,
  dryRun: true,
  provider: "meta",
  businessNumber: "+964 750 123 4567",
  apiKey: "",
  sendLanguage: "en",
  reminderDaysBefore: 3,
  sendHour: 10,
  landlordDelayOn: false,
  landlordDelayHours: 2,
  quietHoursOn: true,
  quietStart: 22,
  quietEnd: 8,
};

/* ----------------------------------------------------------------------------
   The log row
   ------------------------------------------------------------------------- */

/**
 * WHERE A MESSAGE GOT TO.
 *
 *   queued      composed, its moment has not arrived yet
 *   sent        handed over, no delivery receipt back (a dry run stops here)
 *   delivered   confirmed on the recipient's phone
 *   suppressed  deliberately not sent — sending off, template off, invoice void
 *   failed      could not be sent — no phone number on the record
 *
 * `suppressed` and `failed` are kept apart because one is a setting and the
 * other is missing data, and the person reading the log does something
 * different about each.
 */
export type MsgStatus = "queued" | "sent" | "delivered" | "suppressed" | "failed";

export const MSG_STATUSES: MsgStatus[] = ["queued", "sent", "delivered", "suppressed", "failed"];

/** Why a message is not simply on its way. Rendered as the row's second line. */
export type MsgReason = "deliveryOff" | "templateOff" | "invoiceVoided" | "noPhone" | "dryRun" | "quietHours";

export interface MessageLogRow {
  id: string;
  templateId: MsgTemplateId;
  audience: MsgAudience;
  /** Recipient as the message addresses them — canonical name, never translated. */
  toName: string;
  /** Empty when the record carries no number; that is what `failed` means here. */
  toPhone: string;
  /** The language the body was written in. */
  lang: Lang;
  /** The finished text, tokens already filled. What the phone would show. */
  body: string;

  /** ISO day the message is due to leave. */
  on: string;
  /** Hour of that day, 0–23. */
  hour: number;
  /** True when quiet hours pushed it off its natural moment. */
  held: boolean;

  status: MsgStatus;
  reason?: MsgReason;

  /** What the message is about. All optional — a test message is about nothing. */
  contractId?: string;
  invoiceId?: string;
  propertyTitle?: string;
  /** A person pressed send. Stored rather than derived — see rule 1. */
  manual?: boolean;
}

/* ----------------------------------------------------------------------------
   Pure helpers
   ------------------------------------------------------------------------- */

/**
 * Fill a template's `{tokens}`.
 *
 * An unknown token renders as nothing rather than as itself. A customer seeing
 * `{tenant_name}` on their phone is a worse failure than a sentence with a gap
 * in it, and the preview in the editor shows the admin exactly which one they
 * are about to send.
 */
export function renderBody(body: string, values: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (_, k: string) => (k in values ? values[k] : ""));
}

/** Digits only, no leading zeros or plus — the form wa.me wants. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^00/, "");
}

/** Enough of a number to dial. Guards the wa.me / tel links from a blank field
    and from the "—" placeholders the seed uses where nobody left a number. */
export function isDialable(phone: string | undefined): phone is string {
  return !!phone && phoneDigits(phone).length >= 7;
}

/**
 * A link that opens WhatsApp on the reader's own device with the text ready to
 * send. THE ONLY THING IN THIS FEATURE THAT REACHES A REAL PHONE — and it
 * reaches it because a human clicked, from their own account.
 */
export function waLink(phone: string, text?: string): string {
  return `https://wa.me/${phoneDigits(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** A dialable href for the same number. */
export function telLink(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** Show the last four characters of a saved key and nothing else. */
export function maskKey(key: string): string {
  if (!key) return "";
  return "•".repeat(Math.max(4, Math.min(20, key.length - 4))) + key.slice(-4);
}

/* ---- the demo clock ----

   Every date in this app is measured from ANCHOR_ISO rather than the wall clock
   (see lib/dates), and messaging has to agree with it, or a reminder for a rent
   demand the invoices screen calls "due next week" would show here as long gone.
   The HOUR is this module's own addition: a log needs a time of day to decide
   what has already left, and 09:00 puts the morning's messages behind us and
   the evening's still ahead. */
export const NOW_ISO = ANCHOR_ISO;
export const NOW_HOUR = 9;

/** Is this moment already behind the demo clock? */
export function isPast(on: string, hour: number): boolean {
  if (on < NOW_ISO) return true;
  if (on > NOW_ISO) return false;
  return hour <= NOW_HOUR;
}

/** Format an hour as "10:00" / "22:00". Digits are localized at render time. */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

/**
 * Is this hour inside the quiet window? Handles the ordinary wrap across
 * midnight (22:00 → 08:00) and the degenerate equal case (no quiet time at all).
 */
export function inQuietHours(hour: number, s: WhatsAppSettings): boolean {
  if (!s.quietHoursOn || s.quietStart === s.quietEnd) return false;
  return s.quietStart < s.quietEnd
    ? hour >= s.quietStart && hour < s.quietEnd
    : hour >= s.quietStart || hour < s.quietEnd;
}

/**
 * MOVE A MOMENT OUT OF THE QUIET WINDOW.
 *
 * A message due at 23:00 waits for 08:00 the next morning; one due at 02:00
 * waits for 08:00 the same morning. Returns the moment it will actually leave
 * AND whether it had to be moved, because the log says so on the row — a
 * reminder that looks a day late is otherwise indistinguishable from a bug.
 */
export function applyQuietHours(on: string, hour: number, s: WhatsAppSettings): { on: string; hour: number; held: boolean } {
  if (!inQuietHours(hour, s)) return { on, hour, held: false };
  /* The day only changes when the message was due at or after the window
     opened — 23:00 waits for tomorrow, 02:00 waits for this morning. */
  const spillsToNextDay = s.quietStart > s.quietEnd && hour >= s.quietStart;
  return { on: spillsToNextDay ? addDays(on, 1) : on, hour: s.quietEnd, held: true };
}
