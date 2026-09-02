"use client";

import { useCallback, useMemo } from "react";
import { addDays, daysBetween, fromIso } from "@/lib/dates";
import { fmtDate, fmtNum } from "@/lib/fmt";
import { formatMoney, isZero } from "@/lib/money";
import type { Lang } from "@/lib/i18n";
import { usePlatformSettings } from "@/lib/platform-settings";
import { useContracts } from "../contracts-store";
import { useProperties } from "../properties-store";
import { invoiceTotals, outstanding, type ContractRecord, type InvoiceRecord, type PaymentRecord } from "../../_data/contracts";
import { useMessaging } from "./store";
import {
  NOW_ISO,
  TEMPLATE_AUDIENCE,
  applyQuietHours,
  isDialable,
  isPast,
  renderBody,
  type MessageLogRow,
  type MessageTemplate,
  type MsgStatus,
  type MsgTemplateId,
  type WhatsAppSettings,
} from "./types";

/* ============================================================================
   THE SCHEDULE — every message the platform would send, worked out from the
   records rather than stored anywhere.

   Two rules produce every automatic row:

     RENT FALLS DUE      → remind the TENANT, `reminderDaysBefore` days early
     RENT IS RECEIVED    → tell the LANDLORD it is here and can be collected

   Both are read off the same invoices the money screens read, so a schedule can
   never drift from the demands it is chasing. Change the reminder window and
   twenty-four rows move at once; void an invoice and its landlord notice
   disappears, because it was never a row in the first place.

   ⚠ THE LANDLORD IS ONLY TOLD WHEN THE AGENCY IS HOLDING THE MONEY. On a
   tenancy the landlord collects himself (`rentPaidTo: "owner"`) the cash went
   straight into his hand — "come and collect it" would be nonsense, and telling
   him about a payment he took himself is noise, not service. The invoice is
   still raised there; only the message is not.
   ========================================================================== */

/** What a party looks like once name and number have been resolved. */
interface Party {
  name: string;
  phone: string;
}

/* ----------------------------------------------------------------------------
   Status
   ------------------------------------------------------------------------- */

/**
 * A stable "did the receipt come back?" answer.
 *
 * ⚠ INVENTED, and the only invented thing in this file. There is no provider
 * behind the platform, so nothing can report a real delivery receipt; a log
 * where every past row said the same word would tell an admin nothing about
 * what the screen looks like in use. Hashing the row's own id keeps the answer
 * identical across reloads — the alternative, Math.random(), would reshuffle
 * the log on every render and make the whole screen look broken.
 */
function delivered(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % 100 >= 12;
}

/**
 * WHERE THIS MESSAGE GOT TO — asked in the order the answers matter.
 *
 * Settings first, because "sending is switched off" explains every row on the
 * screen at once and a reader who is not told that will look for twenty other
 * reasons. Then the record's own problems, then the clock.
 */
function statusFor(opts: {
  id: string;
  settings: WhatsAppSettings;
  template: MessageTemplate;
  phone: string;
  on: string;
  hour: number;
  /** The demand this message is about was withdrawn. */
  voided?: boolean;
}): { status: MsgStatus; reason?: MessageLogRow["reason"] } {
  if (!opts.settings.enabled) return { status: "suppressed", reason: "deliveryOff" };
  if (!opts.template.enabled) return { status: "suppressed", reason: "templateOff" };
  if (opts.voided) return { status: "suppressed", reason: "invoiceVoided" };
  if (!isDialable(opts.phone)) return { status: "failed", reason: "noPhone" };
  if (!isPast(opts.on, opts.hour)) return { status: "queued" };
  /* A dry run stops at "sent": the message was composed and handed nowhere. */
  if (opts.settings.dryRun) return { status: "sent", reason: "dryRun" };
  return { status: delivered(opts.id) ? "delivered" : "sent" };
}

/* ----------------------------------------------------------------------------
   Building the rows
   ------------------------------------------------------------------------- */

export interface OutboxInput {
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  templates: Record<MsgTemplateId, MessageTemplate>;
  settings: WhatsAppSettings;
  /** The landlord, by the contract's `ownerId`. */
  ownerOf: (contract: ContractRecord) => Party;
  /** The tenant — a member, an off-platform party, or the invoice's snapshot. */
  tenantOf: (contract: ContractRecord, invoice?: InvoiceRecord) => Party;
  propertyTitle: (propertyId: string) => string;
}

/**
 * Every automatic message, past and future.
 *
 * Pure, and deliberately so: the messaging screen, the contract screen and any
 * test of either all read the same function over the same records, so what one
 * shows about a tenancy is what the other shows.
 */
export function buildOutbox(input: OutboxInput): MessageLogRow[] {
  const { contracts, invoices, payments, templates, settings } = input;
  const lang = settings.sendLanguage;
  const rows: MessageLogRow[] = [];

  const contractById = new Map(contracts.map((c) => [c.id, c]));

  /* ---- the tenant's reminder, one per rent demand ---- */
  for (const invoice of invoices) {
    if (invoice.category !== "rent") continue;
    const contract = contractById.get(invoice.contractId);
    if (!contract || contract.kind !== "rent") continue;
    /* A draft has demanded nothing of anybody and a cancelled tenancy is over.
       Reminding either would be chasing money nobody owes. */
    if (contract.status === "draft" || contract.status === "cancelled") continue;

    const on0 = addDays(invoice.dueOn, -settings.reminderDaysBefore);
    const { on, hour, held } = applyQuietHours(on0, settings.sendHour, settings);

    /* ALREADY PAID BEFORE THE REMINDER WAS DUE → no reminder. A tenant who pays
       in advance being nagged three days later is the fastest way to get the
       whole feature switched off. Measured against the payments that had landed
       BY that day, not against today, so the schedule reads the same in a month
       as it did when it ran. */
    const paidByThen = payments.filter((p) => p.invoiceId === invoice.id && p.receivedOn <= on);
    if (isZero(outstanding(invoice, paidByThen))) continue;

    const tenant = input.tenantOf(contract, invoice);
    const owner = input.ownerOf(contract);
    const property = input.propertyTitle(contract.propertyId);
    const id = `auto:rem:${invoice.id}`;
    const template = templates.payment_reminder;

    rows.push({
      id,
      templateId: "payment_reminder",
      audience: TEMPLATE_AUDIENCE.payment_reminder,
      toName: tenant.name,
      toPhone: tenant.phone,
      lang,
      body: renderBody(template.body[lang], {
        tenant_name: tenant.name,
        landlord_name: owner.name,
        amount: formatMoney(lang, invoiceTotals(invoice).total),
        currency: invoice.lines[0]?.unitPrice.currency ?? contract.price.currency,
        due_date: fmtDate(lang, fromIso(invoice.dueOn)),
        days_before: fmtNum(lang, Math.max(0, daysBetween(on, invoice.dueOn))),
        property_label: property,
        contract_no: contract.id,
      }),
      on,
      hour,
      held,
      ...statusFor({ id, settings, template, phone: tenant.phone, on, hour, voided: invoice.status === "void" }),
      contractId: contract.id,
      invoiceId: invoice.id,
      propertyTitle: property,
    });
  }

  /* ---- the landlord's "your money is here", one per rent payment ---- */
  for (const payment of payments) {
    const invoice = invoices.find((i) => i.id === payment.invoiceId);
    if (!invoice || invoice.category !== "rent") continue;
    const contract = contractById.get(invoice.contractId);
    if (!contract || contract.kind !== "rent") continue;
    /* See the header: nothing to collect when he collected it himself. */
    if (contract.rentPaidTo !== "agency") continue;

    /* Midday, because a payment is taken during office hours and the record
       carries a day but no time. The configured delay is what an office
       actually tunes; the base hour is just a sane place to start from. */
    const baseHour = 12 + (settings.landlordDelayOn ? settings.landlordDelayHours : 0);
    const on0 = addDays(payment.receivedOn, Math.floor(baseHour / 24));
    const { on, hour, held } = applyQuietHours(on0, baseHour % 24, settings);

    const owner = input.ownerOf(contract);
    const tenant = input.tenantOf(contract, invoice);
    const property = input.propertyTitle(contract.propertyId);
    const id = `auto:rec:${payment.id}`;
    const template = templates.payment_received;

    rows.push({
      id,
      templateId: "payment_received",
      audience: TEMPLATE_AUDIENCE.payment_received,
      toName: owner.name,
      toPhone: owner.phone,
      lang,
      body: renderBody(template.body[lang], {
        landlord_name: owner.name,
        tenant_name: tenant.name,
        amount: formatMoney(lang, payment.amount),
        currency: payment.amount.currency,
        paid_date: fmtDate(lang, fromIso(payment.receivedOn)),
        property_label: property,
        contract_no: contract.id,
      }),
      on,
      hour,
      held,
      ...statusFor({ id, settings, template, phone: owner.phone, on, hour, voided: invoice.status === "void" }),
      contractId: contract.id,
      invoiceId: invoice.id,
      propertyTitle: property,
    });
  }

  return rows;
}

/**
 * NEAREST TO NOW FIRST, in either direction.
 *
 * Not newest-first, and the reason is the shape of the data. A twelve-month
 * tenancy schedules twelve reminders the day it is signed, so a plain
 * newest-first log opens on a full page of next spring and buries what went out
 * this week three pages down — the exact rows somebody came to check.
 *
 * Sorting by distance from today puts the days either side of now at the top:
 * yesterday's reminder, this morning's payment notice, the one due on Thursday.
 * It gives the right answer on every tab without a second rule — the Waiting tab
 * reads soonest-first, the Sent tab reads most-recent-first — and the far future
 * sinks to the bottom, where it belongs.
 *
 * Ties break toward the future: a message somebody can still stop is more
 * actionable than one that has already gone.
 */
export function sortMessages(rows: MessageLogRow[]): MessageLogRow[] {
  const distance = (r: MessageLogRow) => Math.abs(daysBetween(r.on, NOW_ISO));
  return [...rows].sort((a, b) => {
    const d = distance(a) - distance(b);
    if (d !== 0) return d;
    if (a.on !== b.on) return b.on.localeCompare(a.on);
    return b.hour - a.hour;
  });
}

/* ----------------------------------------------------------------------------
   Hooks
   ------------------------------------------------------------------------- */

/** Resolve the two parties and the property title off the live catalogue. */
export function useMessageParties() {
  const { members } = useProperties();

  const ownerOf = useCallback(
    (contract: ContractRecord): Party => {
      const m = members.find((x) => x.id === contract.ownerId);
      return { name: m?.name ?? contract.ownerId, phone: m?.phone ?? "" };
    },
    [members],
  );

  /**
   * The tenant, however the contract holds them: a member account, an
   * off-platform party typed onto the contract, or — failing both — the party
   * snapshot frozen onto the invoice at issue time. The snapshot is last
   * because it is a copy; the live records win while they exist.
   */
  const tenantOf = useCallback(
    (contract: ContractRecord, invoice?: InvoiceRecord): Party => {
      if (contract.buyerId) {
        const m = members.find((x) => x.id === contract.buyerId);
        if (m) return { name: m.name, phone: m.phone };
      }
      if (contract.buyerExternal) return { name: contract.buyerExternal.name, phone: contract.buyerExternal.phone };
      if (invoice) return { name: invoice.billTo.name, phone: invoice.billTo.phone };
      return { name: "", phone: "" };
    },
    [members],
  );

  return { ownerOf, tenantOf };
}

/**
 * THE MESSAGE LOG — every automatic message plus every one a person sent by
 * hand, in one list.
 */
export function useMessageLog(): MessageLogRow[] {
  const { contracts, invoices, payments } = useContracts();
  const { properties } = useProperties();
  const { settings, templates, sent } = useMessaging();
  const { ownerOf, tenantOf } = useMessageParties();

  const propertyTitle = useCallback(
    (id: string) => properties.find((p) => p.id === id)?.title ?? id,
    [properties],
  );

  return useMemo(
    () =>
      sortMessages([
        ...buildOutbox({ contracts, invoices, payments, templates, settings, ownerOf, tenantOf, propertyTitle }),
        ...sent,
      ]),
    [contracts, invoices, payments, templates, settings, sent, ownerOf, tenantOf, propertyTitle],
  );
}

/** The same list, narrowed to one contract — what the contract screen shows. */
export function useContractMessages(contractId: string): MessageLogRow[] {
  const all = useMessageLog();
  return useMemo(() => all.filter((m) => m.contractId === contractId), [all, contractId]);
}

/**
 * The values a hand-written message can use, for one contract.
 *
 * Shared by the send modal and the template preview so the sentence an admin
 * checks in Templates is the sentence the contract screen composes.
 */
export function useTokenValues(): (opts: {
  contract: ContractRecord;
  audience: "tenant" | "landlord";
  lang: Lang;
}) => Record<string, string> {
  const { properties, agents } = useProperties();
  const { settings: platform } = usePlatformSettings();
  const { ownerOf, tenantOf } = useMessageParties();

  return useCallback(
    ({ contract, audience, lang }) => {
      const owner = ownerOf(contract);
      const tenant = tenantOf(contract);
      const agent = agents.find((a) => a.id === contract.agentId);
      const property = properties.find((p) => p.id === contract.propertyId)?.title ?? contract.propertyId;
      const recipient = audience === "landlord" ? owner : tenant;
      return {
        recipient_name: recipient.name,
        tenant_name: tenant.name,
        landlord_name: owner.name,
        property_label: property,
        contract_no: contract.id,
        agency_name: platform.general.platformName,
        agent_name: agent?.name ?? "",
        agent_phone: agent?.phone ?? platform.general.contactPhone,
        amount: formatMoney(lang, contract.price),
        currency: contract.price.currency,
        due_date: contract.endsOn ? fmtDate(lang, fromIso(contract.endsOn)) : "",
        paid_date: "",
        days_before: "",
      };
    },
    [ownerOf, tenantOf, agents, properties, platform],
  );
}
