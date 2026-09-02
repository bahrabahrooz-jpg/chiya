"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useLang, interleave, isRtl } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtPercent, localizeDigits, valueKey } from "@/lib/fmt";
import { formatMoney, subtract, sumMoney, zeroMoney, type Money } from "@/lib/money";
import { ANCHOR_ISO, daysBetween, fromIso } from "@/lib/dates";
import { usePlatformSettings } from "@/lib/platform-settings";
import type { PropertyRecord } from "../_data/catalog";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { AddInvoiceModal, CancelContractModal, CloseLeaseModal, RecordPaymentModal, SettleEarlyModal, VoidInvoiceModal, invoiceLineText, useFinanceActions } from "../_shared/finance";
import { FinanceToaster, useFinanceToasts } from "../_shared/finance/toaster";
import { useAuditLog, type AuditEvent } from "../_shared/audit-log";
import type { OwnerLedgerEntry } from "../_data/owner-ledger";
import { PLATFORM_CURRENCY, depositNeedsClosing, hasInstallments, isDepositHeld, latePenaltyFor, outstanding, type InvoiceRecord, type PaymentRecord } from "../_data/contracts";
/* The payouts screen's helpers and its modal, imported rather than reproduced:
   the landlord's side of one tenancy has to read the same here as it does on
   the list, and one hand-off writes one set of ledger lines wherever it is
   recorded from. */
import { LEDGER_META, buildPayoutRows, statementFor, type StatementLine } from "../_payouts/data";
import { RecordPayoutModal } from "../_payouts/record-payout-modal";
import { RecordExpenseModal } from "../_payouts/record-expense-modal";
import { OwnerReceiptModal } from "./owner-receipt-modal";
/* Messaging — the parties' phone numbers, what the platform has already said to
   them, and the modal for saying something by hand. See _shared/messaging. */
import { SendMessageModal, isDialable, telLink, useContractMessages, waLink, type MsgAudience } from "../_shared/messaging";
import {
  CATEGORY_ICON,
  INVOICE_COLLAPSE_AT,
  INVOICE_STATUS_META,
  KIND_META,
  STATUS_META,
  billedSide,
  contractValue,
  cycleCount,
  displayStatus,
  groupInvoiceRows,
  invoiceRecipient,
  isEditable,
  partyRoleKey,
  payerReceiptKey,
  managementFeeAmount,
  toInvoiceRows,
  type ContractKind,
  type ContractRecord,
  type InvoiceCategory,
  type InvoiceRow,
} from "./data";

/* ============================================================================
   Contract detail.

   Modelled on the property detail screen (app/admin/_property-detail): the same
   pd-head header shape, the same section cards, the same ⋯ menu.

   THE TERMS BLOCK IS PLAIN TEXT WHENEVER THE CONTRACT IS NOT A DRAFT. Not
   disabled inputs — text. A signed contract is an agreement between people, and
   a screen full of greyed-out fields says "you could edit this if you had
   permission", which is the wrong idea entirely: correcting a signed contract
   means cancelling it and writing a replacement. See `isEditable`.

   The actions live in ../_shared/finance and are shared with the contracts
   list, the property page and the add-property wizard — one implementation of
   "write a contract", not four. Everything they do lands through
   useFinanceActions, which is the only thing in the app that generates invoices
   or writes the owner ledger.

   PRINT IS STILL DISABLED. Rendering a document is its own task.
   ========================================================================== */

/* ---------------- shared bits ---------------- */

/**
 * `wide` makes the card span both columns of the overview's two-across grid.
 *
 * It is a prop on the card and NOT a wrapper <div> around it at the call site,
 * because several of these cards return null when they have nothing to say — a
 * contract with no deposit, no renewal chain, no note. A wrapper would still
 * occupy its grid cell and leave a hole in the layout; a class on the card
 * itself disappears with the card.
 */
function SectionCard({ title, desc, action, children, id, wide }: { title: string; desc?: string; action?: ReactNode; children: ReactNode; id?: string; wide?: boolean }) {
  return (
    <section className={"pd-card" + (wide ? " ctd-cards__wide" : "")} id={id}>
      <header className="pd-card__head">
        <div className="pd-card__heading">
          <div className="pd-card__titles">
            <h2 className="pd-card__title">{title}</h2>
            {desc && <p className="pd-card__desc">{desc}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="pd-card__body">{children}</div>
    </section>
  );
}

/* Field and DGroup — the icon/label/value row and the titled grid that wrapped
   it — used to live here. Nothing renders them any more: the terms card that
   was their only caller is now a money statement and a timeline, and the
   deposit and provenance cards always had markup of their own. Deleted rather
   than left as two unused helpers that the next person would reach for. */


/* ---------------- header ---------------- */

function DetailHeader({
  c,
  basePath,
  counterparty,
  onRecordPayment,
  onRenew,
  onCancel,
  onSettleEarly,
  canRecordPayment,
  canRenew,
  canWrite,
}: {
  c: ContractRecord;
  /** So Print can link to the document on whichever surface this is. */
  basePath: string;
  counterparty: string | null;
  onRecordPayment: () => void;
  onRenew: () => void;
  onCancel: () => void;
  onSettleEarly: () => void;
  canRecordPayment: boolean;
  /** A signed tenancy nothing has replaced yet. See the button. */
  canRenew: boolean;
  canWrite: boolean;
}) {
  const { t, lang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const st = STATUS_META[c.status];
  const kind = KIND_META[c.kind];

  return (
    <div className="pd-head__main">
      <div className="pd-head__intro">
        <div className="pd-head__titlerow">
          <h1 className="pd-head__title">{localizeDigits(lang, c.id)}</h1>
          <span className="pd-head__badges">
            <Badge variant={kind.variant} size="md">
              {t(`admin.ct.kind.${c.kind}`)}
            </Badge>
            <Badge variant={st.variant} size="md" dot={st.dot} icon={st.icon}>
              {t(`admin.ct.status.${c.status}`)}
            </Badge>
          </span>
        </div>
        <div className="pd-head__meta">
          <span className="pd-head__metaitem">
            <Icon name="user-round" size={15} />
            {counterparty ?? t("admin.pd.noCounterparty")}
          </span>
          <span className="pd-head__sep" />
          <span className="pd-head__metaitem">
            <Icon name="calendar-check" size={15} />
            {c.signedOn ? t("admin.ct.signedOnDate", { date: fmtDate(lang, fromIso(c.signedOn)) }) : t("admin.ct.unsigned")}
          </span>
          <span className="pd-head__sep" />
          <span className="pd-head__metaitem">
            <Icon name="file-pen" size={15} />
            {t("admin.ct.writtenOnDate", { date: fmtDate(lang, fromIso(c.createdOn)) })}
          </span>
        </div>
      </div>

      <div className="pd-head__actions">
        {/* The document exists now — app/admin/contracts/[id]/print. It has been
            a disabled button since this screen was written. */}
        <Button hierarchy="secondary" size="md" iconLeading="printer" href={`${basePath}/${encodeURIComponent(c.id)}/print`}>
          {t("admin.ct.print")}
        </Button>
        {/* Every item in this menu writes something, so on a read-only surface
            the menu is not there at all rather than sitting full of disabled
            rows that imply a permission you might be granted. */}
        {canWrite && (
          <div className="pd-morewrap" ref={menuRef}>
            <button
              type="button"
              className={"pd-morebtn" + (menuOpen ? " is-open" : "")}
              aria-label={t("admin.props.actions")}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name="more-horizontal" size={19} />
            </button>
            {menuOpen && (
              <div className="pd-moremenu" role="menu">
                {/* Record payment here targets the oldest thing still owed — the
                    one somebody walking in is almost always paying. An individual
                    row has its own button when it is not that one. */}
                <button
                  type="button"
                  className="pd-moreitem"
                  role="menuitem"
                  disabled={!canRecordPayment}
                  onClick={() => {
                    setMenuOpen(false);
                    onRecordPayment();
                  }}
                >
                  <Icon name="banknote" size={17} />
                  {t("admin.ct.recordPayment")}
                </button>
                {/* RENEW — writes a NEW contract carrying replacesContractId,
                    never an extension of this one: rent almost always changes,
                    and overwriting the old record would destroy the document a
                    dispute is settled against.

                    ⚠ NOTHING RENEWS ITSELF. There is no timer and no automatic
                    roll-on; a renewal happens because somebody sat down with
                    both parties and agreed next year's rent. The list flags a
                    tenancy inside its own notice window so the conversation
                    starts on time — see isExpiringSoon — and this button is
                    where it ends up. */}
                <button
                  type="button"
                  className="pd-moreitem"
                  role="menuitem"
                  disabled={!canRenew}
                  onClick={() => {
                    setMenuOpen(false);
                    onRenew();
                  }}
                >
                  <Icon name="repeat" size={17} />
                  {t("admin.ct.renew")}
                </button>
                {/* SETTLE EARLY — clear an instalment plan in one payment. Only
                    on an instalment sale that is actually running; on anything
                    else there is no balance to settle, so the row is absent
                    rather than greyed out. */}
                {hasInstallments(c) && c.status === "signed" && (
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onSettleEarly();
                    }}
                  >
                    <Icon name="circle-check" size={17} />
                    {t("admin.ct.settleEarly")}
                  </button>
                )}
                {/* CLOSE LEASE IS NOT IN THIS MENU. It sits on the deposit card
                    on the Overview instead — beside the amount, the state and the
                    date it is answering — because "what became of the deposit" is
                    a question about a specific figure, and the only screen that
                    shows that figure is the one that should offer to settle it.
                    See the Deposit card. */}
                <div className="pd-moremenu__sep" />
                <button
                  type="button"
                  className="pd-moreitem pd-moreitem--danger"
                  role="menuitem"
                  disabled={c.status === "cancelled" || c.status === "completed"}
                  onClick={() => {
                    setMenuOpen(false);
                    onCancel();
                  }}
                >
                  <Icon name="ban" size={17} />
                  {t("admin.ct.cancelContract")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- cancelled banner ---------------- */

function CancelledBanner({ c }: { c: ContractRecord }) {
  const { t, lang } = useLang();
  return (
    <div className="ctd-banner" role="status">
      <span className="ctd-banner__icon">
        <Icon name="ban" size={20} />
      </span>
      <div className="ctd-banner__body">
        <p className="ctd-banner__title">
          {c.cancelledOn ? t("admin.ct.cancelledOnDate", { date: fmtDate(lang, fromIso(c.cancelledOn)) }) : t("admin.ct.status.cancelled")}
        </p>
        {c.cancelReason && <p className="ctd-banner__reason">{c.cancelReason}</p>}
        <p className="ctd-banner__note">{t("admin.ct.cancelledNote")}</p>
      </div>
    </div>
  );
}

/* ---------------- who to ring ---------------- */

/**
 * THE PARTIES, WITH THEIR PHONE NUMBERS AND A BUTTON THAT DIALS THEM.
 *
 * The Terms card below names the same three people, and naming them is all it
 * does — a contract states who agreed to what, and a phone number is not a
 * term. But the reason somebody opens a contract on a Tuesday afternoon is
 * almost never to re-read the term: it is that rent is late, or a tap is
 * leaking, and what they need is the tenant's number in the next two seconds.
 * That is why this sits ABOVE the document rather than inside it.
 *
 * WhatsApp is the filled button because it is how this office actually reaches
 * people; call and copy sit beside it as outlines. All three are plain links —
 * wa.me, tel:, and the clipboard — so they work from a desk browser and from a
 * phone without anything in between.
 *
 * Under each customer, one line about what the PLATFORM has already said to
 * them on its own. It answers the question that otherwise gets asked by
 * ringing: "has anybody told them yet?"
 */
function CopyButton({ phone, label }: { phone: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ctd-pty__ic"
      title={label}
      aria-label={label}
      onClick={() => {
        navigator.clipboard?.writeText(phone).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          },
          /* A browser that refuses clipboard access must not throw into the
             page — the number is on screen and can still be read off it. */
          () => {},
        );
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={16} />
    </button>
  );
}

interface ContactParty {
  role: string;
  /** Colour of the role pill. Owner green, counterparty blue, staff grey. */
  tone: BadgeVariant;
  /** Which side of the contract this is, for the send modal. Absent on staff. */
  audience?: MsgAudience;
  name: string;
  phone: string;
  /** Members and agents both carry one; a party typed onto the contract as an
      ExternalParty has no account and therefore no address. */
  email?: string;
  /** Set when they hold a member account, so the name links to their profile. */
  memberId?: string;
  /**
   * Mark a named party who holds NO member account.
   *
   * Only meaningful on a customer: a tenant typed straight onto the contract as
   * an ExternalParty exists nowhere else in the system, and the difference
   * between "this name is not a link" and "this person has no account" is a
   * thing the office needs told rather than left to infer from a missing
   * underline. Never set on the agent, who is staff and never a member.
   */
  external?: boolean;
  /** Staff, not a customer — quieter row, no WhatsApp, no message button. */
  staff?: boolean;
  /** The automatic-message line, when there is one to say. */
  note?: { text: ReactNode; warn?: boolean };
}

/**
 * One party: who they are, how to reach them, and what we have already said.
 *
 * THIS IS A LIST ROW, NOT A CARD. It was a card — a bordered, tinted box with
 * its own hover state, holding a 44px avatar, three 40px round buttons and a
 * labelled Message button on one line. Three of those inside a card produced
 * boxes inside a box, made the parties card twice the height of the property
 * card beside it, and gave a phone number the same visual weight as the whole
 * contract's status. The border did no work: the rows are already a list and a
 * hairline between them says so more quietly than four borders and a fill.
 *
 * So: no box, no tint, no hover. A divider between rows. The role is a small
 * coloured pill rather than grey capitals, because the role is the first thing
 * you look for and "which one is the tenant" should be answerable by colour.
 * Phone and email sit together on one wrapping line under the name — the email
 * is new here; it was on the member record all along and this screen simply
 * never showed it, so anybody wanting to write to a landlord had to open their
 * profile in another tab.
 *
 * The actions stay, small and top-right. Dropping them would look tidier and
 * cost the office the thing it opens this screen to do.
 */
function PartyLine({ party, basePath, onSend }: { party: ContactParty; basePath: string; onSend?: () => void }) {
  const { t } = useLang();
  const memberBase = basePath.replace(/\/contracts$/, "/members");
  const dialable = isDialable(party.phone);

  return (
    <li className={"ctd-pty" + (party.staff ? " ctd-pty--staff" : "")}>
      <span className="ctd-pty__avatar" aria-hidden="true">
        {party.name.trim().charAt(0) || "?"}
      </span>

      <div className="ctd-pty__body">
        <span className="ctd-pty__top">
          <Badge variant={party.tone} size="sm">
            {party.role}
          </Badge>
          {party.external && party.name && <span className="ctd-pty__ext">{t("admin.pd.externalParty")}</span>}
        </span>

        <span className="ctd-pty__name">
          {party.memberId ? (
            <Link href={`${memberBase}/${encodeURIComponent(party.memberId)}`}>{party.name}</Link>
          ) : (
            party.name || t("admin.wa.party.unknown")
          )}
        </span>

        {/* The number is a tel: link and the address is a mailto:, which is why
            there is no call button beside them — it would dial what clicking
            the number already dials. */}
        <span className="ctd-pty__contacts">
          {dialable ? (
            <a className="ctd-pty__c" href={telLink(party.phone)} dir="ltr">
              <Icon name="phone" size={13} />
              {party.phone}
            </a>
          ) : (
            <span className="ctd-pty__c ctd-pty__c--none">{t("admin.wa.noPhone")}</span>
          )}
          {party.email && (
            <a className="ctd-pty__c" href={`mailto:${party.email}`} dir="ltr">
              <Icon name="mail" size={13} />
              {party.email}
            </a>
          )}
        </span>

        {party.note && (
          <span className={"ctd-pty__note" + (party.note.warn ? " ctd-pty__note--warn" : "")}>
            <Icon name={party.note.warn ? "triangle-alert" : "bell-ring"} size={13} />
            {party.note.text}
          </span>
        )}
      </div>

      <span className="ctd-pty__acts">
        {!party.staff && (
          <a
            className="ctd-pty__ic ctd-pty__ic--wa"
            href={dialable ? waLink(party.phone) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!dialable}
            title={t("admin.wa.action.whatsapp")}
            aria-label={t("admin.wa.action.whatsapp")}
          >
            <Icon name="message-circle" size={16} />
          </a>
        )}
        {dialable && <CopyButton phone={party.phone} label={t("admin.wa.action.copy")} />}
        {/* NOT GATED BEHIND canWrite, unlike everything else on this screen.
            Composing a message writes no contract, no invoice and no ledger
            line — it opens WhatsApp on the sender's own device and records that
            they did. The agent console already shows the number and the plain
            WhatsApp button beside it, so withholding the version that fills the
            text in would forbid nothing and only make the office retype it. */}
        {!party.staff && (
          <button
            type="button"
            className="ctd-pty__ic"
            disabled={!dialable}
            title={t("admin.wa.action.message")}
            aria-label={t("admin.wa.action.message")}
            onClick={onSend}
          >
            <Icon name="send" size={16} />
          </button>
        )}
      </span>
    </li>
  );
}

/* ---------------- the property this contract is written on ---------------- */

/**
 * WHICH FLAT, with a picture of it.
 *
 * The property used to be one link inside the Terms card, between the landlord
 * and the tenant. It is the subject of the whole document, and "which flat is
 * this" is a question a photograph answers in about a tenth of the time a line
 * of text does — so it comes out of the field grid and sits first, above the
 * people and above the terms.
 *
 * Nothing here is stored on the contract. Title, type, address, unit number and
 * the photograph all come off the PropertyRecord, so a flat renamed or
 * re-photographed on the property screen changes here too.
 */
function PropertyCard({ property, propertyId, basePath }: { property?: PropertyRecord; propertyId: string; basePath: string }) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const href = `${basePath.replace(/\/contracts$/, "/properties")}/${encodeURIComponent(propertyId)}`;

  /* A contract can outlive the property record it points at — a listing deleted
     in error, a seed row that never existed. The id is still worth showing;
     what we cannot show is anything we do not have. */
  if (!property) {
    return (
      <SectionCard title={t("admin.ct.propertyCard")}>
        <div className="ctd-prop ctd-prop--gone">
          <span className="ctd-prop__ph">
            <Icon name="building-2" size={22} strokeWidth={1.6} />
          </span>
          <div className="ctd-prop__body">
            <p className="ctd-prop__title">{localizeDigits(lang, propertyId)}</p>
            <p className="ctd-prop__line">{t("admin.ct.propertyGone")}</p>
          </div>
        </div>
      </SectionCard>
    );
  }

  /* The same address the receipts and the printed contract build — area,
     district, city, deduped, because on a project like Empire World the first
     two are the same word and printing it twice reads as a bug. */
  const where = [...new Set([property.area, property.district].filter(Boolean)), t(`city.${property.city}`)].filter(Boolean).join(", ");

  return (
    <SectionCard title={t("admin.ct.propertyCard")}>
      <div className="ctd-prop">
        {/* Decorative: the title beside it already names the flat, so a screen
            reader repeating the name off an alt attribute would say it twice. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="ctd-prop__img" src={property.img} alt="" loading="lazy" />
        <div className="ctd-prop__body">
          <Link className="ctd-prop__title" href={href}>
            {property.title}
          </Link>
          <p className="ctd-prop__line">
            <Icon name="building-2" size={15} />
            {tOr(valueKey("type", property.type), property.type)}
          </p>
          <p className="ctd-prop__line">
            <Icon name="map-pin" size={15} />
            {where}
          </p>
          <p className="ctd-prop__line">
            <Icon name="hash" size={15} />
            <span className="ctd-prop__ref">{localizeDigits(lang, property.id)}</span>
            {property.unitNumber && (
              <span className="ctd-prop__unit">
                {t("admin.ct.unitRef")} {localizeDigits(lang, property.unitNumber)}
              </span>
            )}
          </p>
          <Link className="ctd-link ctd-prop__more" href={href}>
            {t("admin.ct.viewProperty")}
            <Icon name={isRtl(lang) ? "arrow-left" : "arrow-right"} size={15} />
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

function Contacts({
  c,
  landlord,
  tenant,
  agent,
  basePath,
  onSend,
}: {
  c: ContractRecord;
  landlord: { name: string; phone: string; email?: string; memberId?: string };
  tenant: { name: string; phone: string; email?: string; memberId?: string } | null;
  agent: { name: string; phone: string; email?: string };
  basePath: string;
  onSend: (audience: MsgAudience) => void;
}) {
  const { t, lang } = useLang();
  const messages = useContractMessages(c.id);

  /* The next thing the platform will say to each side, or the last thing it
     did. Read off the same schedule the Messaging screen shows, so the two
     cannot disagree about one tenancy. */
  const noteFor = (audience: MsgAudience, phone: string): ContactParty["note"] => {
    if (!isDialable(phone)) return { text: t("admin.wa.note.noNumber"), warn: true };
    /* A landlord who takes the rent from the tenant himself is never told it
       has arrived — he was there. Said out loud, because an empty line under
       his name reads as a system that forgot him rather than one that has
       nothing to tell him. See the rule in _shared/messaging/outbox. */
    if (audience === "landlord" && c.rentPaidTo !== "agency") return { text: t("admin.wa.note.ownerCollects") };
    const mine = messages.filter((m) => m.audience === audience && !m.manual);
    /* Sorted here rather than relying on the list's own order: the log sorts by
       nearness to today (see sortMessages), which is right for a log and wrong
       for "which one is next". These two questions want the ends of the line. */
    const next = mine.filter((m) => m.status === "queued").sort((a, b) => a.on.localeCompare(b.on))[0];
    if (next) {
      return {
        text: interleave(
          t(audience === "tenant" ? "admin.wa.note.reminderDue" : "admin.wa.note.noticeDue", { date: fmtDate(lang, fromIso(next.on)) }),
          { date: <b>{fmtDate(lang, fromIso(next.on))}</b> },
        ),
      };
    }
    const last = mine.filter((m) => m.status === "sent" || m.status === "delivered").sort((a, b) => b.on.localeCompare(a.on))[0];
    if (last) {
      return {
        text: interleave(
          t(audience === "tenant" ? "admin.wa.note.reminderSent" : "admin.wa.note.noticeSent", { date: fmtDate(lang, fromIso(last.on)) }),
          { date: <b>{fmtDate(lang, fromIso(last.on))}</b> },
        ),
      };
    }
    return undefined;
  };

  /* A sale has no rent to remind anybody about and no collection to announce,
     so the notes are a tenancy's alone. The numbers still matter on both. */
  const lease = c.kind === "rent" && c.status !== "draft" && c.status !== "cancelled";

  /* THREE ROLES, THREE COLOURS, and they never swap: the owner's side is the
     brand green, the other side is blue, the agent is grey because the agent is
     us. On a screen where the two customers' names are the thing most often
     mixed up, the pill answers "which one is the tenant" before the name has
     been read. */
  const parties: ContactParty[] = [
    {
      role: t(c.kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord"),
      tone: "brand",
      audience: "landlord",
      name: landlord.name,
      phone: landlord.phone,
      email: landlord.email,
      memberId: landlord.memberId,
      note: lease ? noteFor("landlord", landlord.phone) : undefined,
    },
  ];
  if (tenant) {
    parties.push({
      role: t(c.kind === "sale" ? "admin.pd.buyer" : "admin.pd.tenant"),
      tone: "info",
      audience: "tenant",
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      memberId: tenant.memberId,
      external: !tenant.memberId,
      note: lease ? noteFor("tenant", tenant.phone) : undefined,
    });
  }
  parties.push({
    role: t("admin.ct.f.agent"),
    tone: "neutral",
    name: agent.name,
    phone: agent.phone,
    email: agent.email,
    staff: true,
  });

  /* A contract with nobody on the other side of it yet — a draft written
     against a property before the buyer was found. The old parties grid in the
     Terms card said so out loud; deleting that grid must not quietly delete the
     statement, because a card listing a landlord and an agent and nothing else
     reads as a screen that failed to load the tenant. */
  const missingSide = tenant ? null : t(c.kind === "sale" ? "admin.pd.noCounterparty" : "admin.ct.noTenantYet");

  return (
    <SectionCard
      title={t("admin.wa.contacts.title")}
      desc={t(lease ? "admin.wa.contacts.descLease" : "admin.wa.contacts.desc")}
      action={
        <Button href="/admin/messaging" hierarchy="tertiary" size="sm" iconTrailing="arrow-up-right">
          {t("admin.wa.contacts.openMessaging")}
        </Button>
      }
      id="contacts"
    >
      {/* A real <ul>. These are three of one kind of thing and the markup may
          as well say so — the dividers between them are then decoration on a
          list rather than the only thing grouping a pile of divs. */}
      <ul className="ctd-pties">
        {parties.map((p, i) => (
          <Fragment key={p.role}>
            <PartyLine party={p} basePath={basePath} onSend={p.audience ? () => onSend(p.audience!) : undefined} />
            {/* After the owner, which is where the missing side's own row would
                be — so the gap reads as a gap rather than as a shorter list. */}
            {i === 0 && missingSide && (
              <li className="ctd-pty ctd-pty--none">
                <Icon name="user-round" size={16} />
                {missingSide}
              </li>
            )}
          </Fragment>
        ))}
      </ul>
    </SectionCard>
  );
}

/* ---------------- terms: the money, and the life of the contract --------- */

/**
 * THE MONEY, as a statement rather than a field list.
 *
 * Everything on this card used to be an icon, a grey label and a value, six
 * rows of identical weight — so the rent, the deposit, the commission and the
 * total over the term all looked equally important, and the one figure anybody
 * actually arrives for was the same size as the management fee.
 *
 * It reads like a quotation now. The agreed figure leads, at display size, with
 * the frequency under it. Under that, the charges, right-aligned in a column so
 * the digits line up and can be read down. Under a rule, the total.
 *
 * NO ICONS. A little coin beside "rent" and a little percent beside
 * "commission" told nobody anything they could not read in the label, and six
 * of them turned a column of figures into a column of decoration.
 */
function FinancialTerms({ c, onEdit, onAmend, canWrite }: { c: ContractRecord; onEdit: () => void; onAmend: () => void; canWrite: boolean }) {
  const { t, lang } = useLang();
  const editable = isEditable(c);
  const mgmt = managementFeeAmount(c);
  const cycles = cycleCount(c);
  const rent = c.kind === "rent";

  /* The charges, built as data so the rule above the total lands in the right
     place whether or not there is a deposit or a management fee. */
  const charges: { key: string; label: string; note?: string; value: Money }[] = [];
  charges.push({
    key: "commission",
    label: t("admin.ct.f.commission"),
    note: t(rent ? "admin.ct.rateOfCycle" : "admin.ct.rateOfPrice", { rate: fmtPercent(lang, c.commissionRate) }),
    value: c.commission,
  });
  if (c.deposit) charges.push({ key: "deposit", label: t("admin.ct.f.deposit"), value: c.deposit });
  if (rent && c.managementFee) {
    charges.push({
      key: "mgmt",
      label: t("admin.ct.f.managementFee"),
      note:
        c.managementFee.type === "percent"
          ? t("admin.ct.mgmtOfEach", { rate: fmtPercent(lang, c.managementFee.value) })
          : undefined,
      value: mgmt ?? c.price,
    });
  }

  return (
    <SectionCard
      title={t("admin.ct.money")}
      desc={t(editable ? "admin.ct.termsDraftDesc" : c.status === "cancelled" ? "admin.ct.termsCancelledDesc" : "admin.ct.termsLockedDesc")}
      action={
        /* Only a draft may be edited. On a signed contract there is no Edit
           button to disable — it is simply not there, because the answer is
           cancel and replace, not "edit later". A greyed-out button would say
           the opposite: that editing is something you could do with the right
           permission. The store refuses it either way. */
        editable && canWrite ? (
          <Button hierarchy="secondary" size="sm" iconLeading="pencil" onClick={onEdit}>
            {t("admin.ct.edit")}
          </Button>
        ) : canWrite && c.status === "signed" ? (
          /* AMENDING IS NOT EDITING, and it gets its own word. The parties agreed
             a change; the contract keeps its number, both of them keep the paper
             they are holding, and the change is appended with a reason. See
             amendContract in ../_shared/contracts-store. */
          <Button hierarchy="secondary" size="sm" iconLeading="file-text" onClick={onAmend}>
            {t("admin.ct.amend")}
          </Button>
        ) : undefined
      }
      id="terms"
    >
      <div className="ctd-money">
        <div className="ctd-money__lead">
          <span className="ctd-money__leadlabel">{t(rent ? "admin.ct.f.rentPerCycle" : "admin.ct.f.price")}</span>
          <span className="ctd-money__leadfig">{formatMoney(lang, c.price)}</span>
          {rent && c.cycle && (
            <span className="ctd-money__leadsub">
              {t(`admin.ct.cycle.${c.cycle}`)}
              {cycles > 0 && <> · {t("admin.ct.cyclesInTerm", { count: fmtNum(lang, cycles) })}</>}
            </span>
          )}
        </div>

        <dl className="ctd-money__rows">
          {charges.map((row) => (
            <div key={row.key} className="ctd-money__row">
              <dt>
                {row.label}
                {row.note && <span className="ctd-money__note">{row.note}</span>}
              </dt>
              <dd>{formatMoney(lang, row.value)}</dd>
            </div>
          ))}

          {/* A TENANCY'S TOTAL IS ARITHMETIC — rent times the number of cycles —
              so it gets the rule above it that a computed line earns. A sale has
              no such line: the price at the top IS the total, and repeating it
              under a rule would invent a sum out of one number. */}
          {rent && cycles > 0 && (
            <div className="ctd-money__row ctd-money__row--total">
              <dt>{t("admin.ct.f.totalValue")}</dt>
              <dd>{formatMoney(lang, contractValue(c))}</dd>
            </div>
          )}
        </dl>

        {/* Where the rent lands. Not a charge, so not in the column of figures —
            but it is the field that decides whether this contract produces owner
            ledger lines at all, so it is stated rather than left to the reader. */}
        {rent && (
          <p className={"ctd-money__where" + (c.rentPaidTo === "agency" ? " is-agency" : "")}>
            <Icon name={c.rentPaidTo === "agency" ? "landmark" : "user-round"} size={15} />
            {t(`admin.ct.paidTo.${c.rentPaidTo}`)}
          </p>
        )}
      </div>
    </SectionCard>
  );
}

/**
 * THE LIFE OF THE CONTRACT, on a timeline.
 *
 * This was a column of dates with a small calendar icon beside each — "Written
 * 10 Aug 2025", "Signed 18 Aug 2025", "Term starts 20 Aug 2025" — which is the
 * data and none of the meaning. Nothing on it said which of those had happened,
 * which was next, or how far through the term the tenancy is; a reader had to
 * hold today's date in their head and do the comparison themselves, on every
 * row, every time.
 *
 * A timeline says it. Each milestone carries its own state — done, next, still
 * ahead — and a running tenancy gets a bar showing how much of the term has
 * gone, with the months left in words.
 *
 * THIS IS THE HONEST VERSION OF THE TIMELINE IN THE DESIGN THIS SCREEN WAS
 * DRAWN FROM. That one ran Created → Sent for signing → Signed → Active, and
 * two of those four are not things this system knows: nothing records a
 * contract being sent out for signature, and "active" is not a status but a
 * fact about today (see `isActive`). Rejecting those two invented steps was
 * right; rendering the six real dates as a flat list instead of a timeline was
 * not, and this is that correction.
 */
function ContractDates({ c }: { c: ContractRecord }) {
  const { t, lang } = useLang();
  const rent = c.kind === "rent";

  type Step = { key: string; label: string; iso?: string; icon: IconName; pending?: string };

  const steps: Step[] = [{ key: "written", label: t("admin.ct.f.createdOn"), iso: c.createdOn, icon: "file-pen" }];
  steps.push({
    key: "signed",
    label: t("admin.ct.f.signedOn"),
    iso: c.signedOn,
    icon: "calendar-check",
    pending: t("admin.ct.unsigned"),
  });
  if (c.handoverOn) steps.push({ key: "handover", label: t("admin.ct.f.handoverOn"), iso: c.handoverOn, icon: "key" });
  if (rent) {
    steps.push({ key: "starts", label: t("admin.ct.f.startsOn"), iso: c.startsOn, icon: "log-in" });
    steps.push({ key: "ends", label: t("admin.ct.f.endsOn"), iso: c.endsOn, icon: "log-out" });
  }
  /* A cancellation is terminal and it is the last thing that happened, whenever
     in the sequence it fell. It goes at the end so the timeline ends on it. */
  if (c.cancelledOn) steps.push({ key: "cancelled", label: t("admin.ct.f.cancelledOn"), iso: c.cancelledOn, icon: "ban" });

  /* Which milestone is the NEXT one: the earliest that has not happened yet.
     Everything before it reads as done, everything after as still ahead. */
  const firstAheadIdx = steps.findIndex((s) => !s.iso || daysBetween(ANCHOR_ISO, s.iso) > 0);

  /* A CANCELLED CONTRACT HAS NOTHING COMING. Its unreached milestones are not
     next, they are never: a cancelled sale that was never signed will not be
     signed, and marking that step with the brand-coloured "expect this" ring
     said the opposite. So on a cancelled contract nothing is highlighted, and
     the empty dates read "Never" rather than "Not signed yet". */
  const abandoned = c.status === "cancelled";
  const nextIdx = abandoned ? -1 : firstAheadIdx;

  /* How far through the term a running tenancy is. Only drawn while the term is
     actually running — before it starts there is nothing to be through, and
     after it ends a full bar says less than the date already did. */
  const termFrom = c.startsOn;
  const termTo = c.endsOn;
  const totalDays = rent && termFrom && termTo ? daysBetween(termFrom, termTo) : 0;
  const goneDays = rent && termFrom ? daysBetween(termFrom, ANCHOR_ISO) : 0;
  const running = c.status === "signed" && totalDays > 0 && goneDays > 0 && goneDays < totalDays;
  const pct = running ? Math.round((goneDays / totalDays) * 100) : 0;
  const daysLeft = running ? totalDays - goneDays : 0;

  return (
    <SectionCard title={t("admin.ct.dates")} desc={t("admin.ct.datesDesc")} id="dates">
      <ol className="ctd-tl">
        {steps.map((s, i) => {
          const done = !!s.iso && i < (firstAheadIdx === -1 ? steps.length : firstAheadIdx);
          const next = i === nextIdx;
          return (
            <li key={s.key} className={"ctd-tl__step" + (done ? " is-done" : next ? " is-next" : " is-ahead")}>
              <span className="ctd-tl__mark" aria-hidden="true">
                <Icon name={done ? "check" : abandoned && !s.iso ? "minus" : s.icon} size={14} />
              </span>
              <span className="ctd-tl__label">{s.label}</span>
              <span className="ctd-tl__when">
                {s.iso ? fmtDate(lang, fromIso(s.iso)) : abandoned ? t("admin.ct.never") : (s.pending ?? "—")}
              </span>
            </li>
          );
        })}
      </ol>

      {running && (
        <div className="ctd-tl__progress">
          <div className="ctd-tl__bar" role="img" aria-label={t("admin.ct.termLeftDays", { count: fmtNum(lang, daysLeft) })}>
            <span className="ctd-tl__fill" style={{ inlineSize: `${pct}%` }} />
          </div>
          <p className="ctd-tl__prognote">
            {t("admin.ct.termProgress", { pct: fmtNum(lang, pct) })}
            <span className="ctd-tl__left">{t("admin.ct.termLeftDays", { count: fmtNum(lang, daysLeft) })}</span>
          </p>
        </div>
      )}
    </SectionCard>
  );
}

/** The office's own note on the contract. Full width — it is prose, not a field. */
function TermsNote({ c }: { c: ContractRecord }) {
  const { t } = useLang();
  return (
    <SectionCard title={t("admin.ct.notes")} desc={t("admin.ct.notesDesc")} wide>
      <p className="ctd-note">{c.notes}</p>
    </SectionCard>
  );
}
/* ---------------- provenance: renewal chain + external paperwork ---------- */

function Provenance({ c, previous, next, basePath }: { c: ContractRecord; previous?: ContractRecord; next?: ContractRecord; basePath: string }) {
  const { t, lang } = useLang();
  if (!previous && !next && !c.externalPaperwork) return null;
  return (
    <SectionCard title={t("admin.ct.provenance")} desc={t("admin.ct.provenanceDesc")} id="provenance" wide>
      <div className="ctd-chain">
        {previous && (
          <p className="ctd-chain__line">
            <Icon name={isRtl(lang) ? "arrow-right" : "arrow-left"} size={15} />
            {t("admin.ct.replacesLine")}
            <Link className="ctd-link ctd-link--mono" href={`${basePath}/${encodeURIComponent(previous.id)}`}>
              {localizeDigits(lang, previous.id)}
            </Link>
          </p>
        )}
        {next && (
          <p className="ctd-chain__line">
            <Icon name={isRtl(lang) ? "arrow-left" : "arrow-right"} size={15} />
            {t("admin.ct.replacedByLine")}
            <Link className="ctd-link ctd-link--mono" href={`${basePath}/${encodeURIComponent(next.id)}`}>
              {localizeDigits(lang, next.id)}
            </Link>
          </p>
        )}
        {c.externalPaperwork && (
          <p className="ctd-chain__line ctd-chain__line--note">
            <Icon name="file-x" size={15} />
            {t("admin.ct.externalPaperwork")}
          </p>
        )}
      </div>
    </SectionCard>
  );
}

/* ---------------- the insurance deposit ---------------- */

/**
 * WHERE THE TENANT’S DEPOSIT STANDS, said on the contract itself.
 *
 * ⚠ THE WHOLE LIFECYCLE EXISTED AND NONE OF IT WAS ON SCREEN. The record knew
 * whether a deposit was held, returned, partly returned or carried into a
 * renewal, and it knew the amount, the date, the deduction and the reason — but
 * the contract page never showed the amount at all, and after somebody closed
 * the lease the page said nothing about what had happened. The only trace was a
 * line in /admin/audit.
 *
 * That is the exact failure the lifecycle was built to prevent. A tenant rings
 * up a year later asking where his money went, and the person who picks up the
 * phone is looking at his contract. The answer belongs here.
 *
 * ⚠ WHO IS ACTUALLY HOLDING IT depends on who collects the rent. On an
 * agency-collected tenancy the money is in our account; on one the landlord
 * collects himself it never came through us at all, which is also why a damages
 * deduction only reaches his ledger in the first case. The card says which,
 * rather than implying the agency is sitting on money it never took.
 */
function Deposit({
  c,
  basePath,
  canWrite,
  onCloseLease,
}: {
  c: ContractRecord;
  basePath: string;
  canWrite: boolean;
  onCloseLease: () => void;
}) {
  const { t, lang } = useLang();
  const held = c.insuranceDeposit;
  /* A sale has no insurance deposit and a tenancy need not take one. Absence is
     not an empty card — it means the term was never agreed. */
  if (!held) return null;

  const state = c.depositStatus ?? "held";
  /* The lease has ended and the money is still ours to deal with. This is the
     one state that is a job rather than a fact, so it takes the warning tone
     and carries the button. */
  const due = depositNeedsClosing(c);
  const kept = c.depositDeduction;
  const returned = kept ? subtract(held, kept) : held;
  const agencyHolds = c.rentPaidTo === "agency";

  const badge: { variant: BadgeVariant; dot?: boolean; icon?: IconName } =
    due
      ? { variant: "warning", dot: true }
      : state === "held"
        ? { variant: "info", dot: true }
        : state === "carried_forward"
          ? { variant: "info", icon: "refresh-cw" }
          : { variant: "success", icon: "circle-check" };

  return (
    <SectionCard
      title={t("admin.ct.f.insuranceDeposit")}
      desc={t("admin.ct.dep.desc")}
      id="deposit"
      wide
      action={
        canWrite && due ? (
          <Button hierarchy="secondary" size="sm" iconLeading="wallet" onClick={onCloseLease}>
            {t("admin.ct.closeLease")}
          </Button>
        ) : /* THE TENANT’S PROOF HE GOT IT BACK. He holds a receipt for handing
              the deposit over; without this he holds nothing for getting it
              returned, which is the half of the pair a dispute turns on. Only
              where money actually moved — a deposit carried into a renewal went
              nowhere, and a receipt for that would attest to something that did
              not happen. */
        state === "returned" || state === "partly_returned" ? (
          <Link className="ctd-paid__receipt" href={`/admin/receipts/deposit/${encodeURIComponent(c.id)}`}>
            <Icon name="printer" size={14} />
            {t("admin.ct.dep.receipt")}
          </Link>
        ) : undefined
      }
    >
      <div className={"ctd-dep" + (due ? " is-due" : "")}>
        <span className="ctd-dep__ic">
          <Icon name="wallet" size={19} />
        </span>
        <div className="ctd-dep__body">
          <div className="ctd-dep__top">
            {/* formatMoney, never formatApprox — somebody is owed this exactly. */}
            <span className="ctd-dep__amount">{formatMoney(lang, held)}</span>
            <Badge variant={badge.variant} size="sm" dot={badge.dot} icon={badge.icon}>
              {t("deposit." + state)}
            </Badge>
          </div>

          {state === "held" && (
            <p className="ctd-dep__line">
              {due
                ? c.endsOn
                  ? t("admin.ct.dep.dueOn", { date: fmtDate(lang, fromIso(c.endsOn)) })
                  : t("admin.ct.dep.due")
                : t(agencyHolds ? "admin.ct.dep.heldAgency" : "admin.ct.dep.heldOwner")}
            </p>
          )}
          {state === "held" && !due && c.endsOn && (
            <p className="ctd-dep__line ctd-dep__line--soft">{t("admin.ct.dep.heldUntil", { date: fmtDate(lang, fromIso(c.endsOn)) })}</p>
          )}

          {state === "returned" && c.depositReturnedOn && (
            <p className="ctd-dep__line">{t("admin.ct.dep.returned", { date: fmtDate(lang, fromIso(c.depositReturnedOn)) })}</p>
          )}

          {state === "partly_returned" && kept && (
            <>
              <p className="ctd-dep__line">
                <b className="ctd-dep__kept">{t("admin.ct.dep.deducted", { amount: formatMoney(lang, kept) })}</b>
                {c.depositDeductionReason ? " — " + c.depositDeductionReason : ""}
              </p>
              {/* THE QUESTION EVERYBODY ASKS ABOUT A DEDUCTION. It is not the
                  agency’s: his property was damaged and it is his cost to put
                  right, so it goes onto his ledger and out through payouts. */}
              {agencyHolds && <p className="ctd-dep__line ctd-dep__line--soft">{t("admin.ct.dep.deductedTo")}</p>}
              {c.depositReturnedOn && (
                <p className="ctd-dep__line ctd-dep__line--soft">
                  {t("admin.ct.dep.partReturned", { amount: formatMoney(lang, returned), date: fmtDate(lang, fromIso(c.depositReturnedOn)) })}
                </p>
              )}
            </>
          )}

          {state === "carried_forward" && (
            <p className="ctd-dep__line">
              {t("admin.ct.dep.carried")}
              {c.depositCarriedToContractId && (
                <>
                  {" "}
                  <Link className="ctd-link ctd-link--mono" href={`${basePath}/${encodeURIComponent(c.depositCarriedToContractId)}`}>
                    {localizeDigits(lang, c.depositCarriedToContractId)}
                  </Link>
                </>
              )}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}

/* ---------------- invoices ---------------- */

function InvoiceRowView({
  row,
  kind,
  ownerId,
  ownerName,
  agencyName,
  landlordCollects,
  onReceiptOwner,
  payments,
  penalty,
  onAddPenalty,
  cancelled,
  owed,
  canWrite,
  onRecordPayment,
  onVoid,
}: {
  row: InvoiceRow;
  /** The contract's own facts the card needs to name both ends of the arrow:
      which words this contract uses for its sides, who the owner is, and what
      this agency is called on its own paperwork. */
  kind: ContractKind;
  ownerId: string;
  ownerName: string;
  agencyName: string;
  /** What has actually arrived against this demand, oldest first. Until this
      existed a payment was recorded and then vanished into an arithmetic —
      nothing in the app listed one, and there was nothing to print a receipt
      from. See the strip below. */
  payments: PaymentRecord[];
  /** True on a tenancy the landlord collects himself — see the receipt links. */
  landlordCollects: boolean;
  /** Opens the date box that creates the landlord's receipt. */
  onReceiptOwner: (p: PaymentRecord) => void;
  /** What a late-rent charge on this row WOULD come to. Offered, never applied
      — see the penalty strip below and `latePenaltyFor`. */
  penalty?: { amount: Money; days: number };
  onAddPenalty: (invoice: InvoiceRecord) => void;
  cancelled: boolean;
  /** What is still outstanding on this row — zero hides the payment button. */
  owed: Money;
  canWrite: boolean;
  onRecordPayment: (invoice: InvoiceRecord) => void;
  onVoid: (invoice: InvoiceRecord) => void;
}) {
  const { t, lang } = useLang();
  const inv = row.invoice;
  /* WHICH SIDE OWES THIS ONE. A signing bills both of them, so a row that does
     not say which is a row somebody has to open the invoice to understand. */
  const side = billedSide(inv, ownerId);
  /* On a cancelled contract an uncollectable demand reads as Void — nothing is
     removed, and a paid invoice keeps saying it was paid. The card sorts and
     groups on this same value, so the order always matches the badges. */
  const status = displayStatus(row, cancelled);
  const meta = INVOICE_STATUS_META[status];
  /* Only a live demand can be acted on. Voided invoices, credit notes and every
     row on a cancelled contract are history — and there is deliberately no edit
     or delete offered on any of them, in any state. */
  const actionable = !cancelled && inv.status === "issued" && !inv.creditNoteFor && canWrite;
  /* ⚠ ONCE MONEY HAS ARRIVED, THE DEMAND CANNOT BE WITHDRAWN. Voiding writes a
     credit note for the whole invoice, so doing it here would reverse a charge
     while the cash sits in the account — and a voided invoice drops out of every
     outstanding figure, so the party who paid becomes a creditor nothing counts.
     The store refuses it outright; the button says so rather than disappearing,
     because a missing button is a thing somebody hunts for. */
  const settled = payments.length > 0;
  /* `admin.inv.status.*`, not `admin.ct.inv.*`. The old key for "due" is the
     SENTENCE "Due {date}", which is right beside this badge and wrong inside
     it — with no date passed it rendered the placeholder. The invoices list
     owns the five one-word status labels now, and both screens read them, so a
     badge cannot say one thing here and another there. */
  const label =
    status === "overdue" ? t("admin.inv.overdueDays", { count: fmtNum(lang, row.lateDays) }) : t(`admin.inv.status.${status}`);

  /* THE OTHER END OF THE ARROW. Rent goes to the landlord, commission to us,
     and a tenancy deposit goes nowhere at all — see invoiceRecipient. */
  const to = invoiceRecipient(inv, kind, ownerName, agencyName);
  const partPaid = status !== "void" && owed.amount > 0 && owed.amount !== row.total.amount;

  /* ONE CARD, THREE BANDS, IN THE ORDER SOMEBODY READS THEM.

     The row used to be seven columns across a table wide enough to need a
     horizontal scrollbar, with the number, the party, the description, two
     dates, a badge, the money and two buttons all at roughly the same weight.
     Everything was on screen and nothing led.

     Now: what it is and what it costs at the top, in the two loudest sizes on
     the card. The facts you check second — when, and between whom — on a quiet
     line under it. The reference number and the buttons in a tinted foot,
     because a number nobody reads aloud and an action nobody takes twice do not
     belong in the same band as the money. The card also stacks instead of
     scrolling sideways, which is what actually made the old one hard to read on
     anything narrower than a desk monitor. */
  return (
    <div className={"ctd-inv" + (status === "void" ? " is-void" : "")}>
      <div className="ctd-inv__head">
        <div className="ctd-inv__lead">
          {/* Through invoiceLineText, never off the frozen string: an Arabic
              reader should not get an English line down the middle of the card. */}
          <span className="ctd-inv__title">{invoiceLineText(inv.lines[0], t, lang)}</span>
          <Badge variant={meta.variant} size="sm" dot={meta.dot} icon={meta.icon}>
            {label}
          </Badge>
        </div>
        {/* formatMoney, never formatApprox — an invoice total is what someone
            owes. It is the largest thing on the card because it is the reason
            the card exists. */}
        <div className="ctd-inv__money">
          <span className="ctd-inv__total">{formatMoney(lang, row.total)}</span>
          {/* Only on a part-paid demand. Repeating the same figure on every
              other card would hide the one card it matters on. */}
          {partPaid && <span className="ctd-inv__owed">{t("admin.inv.stillOwed", { amount: formatMoney(lang, owed) })}</span>}
        </div>
      </div>

      {/* WHEN, AND BETWEEN WHOM. One line, because they are the same kind of
          fact: the circumstances of the demand rather than the demand itself.
          The roles are spelled out on both ends — a signing raises two
          commission invoices and the names alone never said which was which. */}
      <div className="ctd-inv__meta">
        <span className="ctd-inv__when">
          <Icon name="calendar" size={13} />
          {t("admin.ct.inv.due", { date: fmtDate(lang, fromIso(inv.dueOn)) })}
        </span>
        <span className="ctd-inv__flow">
          <span className="ctd-inv__party">
            <span className="ctd-inv__role">{t(partyRoleKey(kind, side))}</span>
            <span className="ctd-inv__who">{inv.billTo.name}</span>
          </span>
          {to ? (
            <>
              <Icon name="arrow-right" size={13} className="ctd-inv__arrow" />
              <span className="ctd-inv__party">
                <span className="ctd-inv__role">{t(to.roleKey)}</span>
                <span className="ctd-inv__who">{to.name}</span>
              </span>
            </>
          ) : (
            /* A tenancy deposit has no second party: it is the tenant’s own
               money in our account until the lease closes. An arrow back to the
               person who paid it would claim something that is not true. */
            <span className="ctd-inv__held">{t("admin.ct.inv.held")}</span>
          )}
        </span>
      </div>

      {/* Struck through is not an explanation. The reason travels with the card. */}
      {inv.status === "void" && inv.voidReason && <p className="ctd-voidnote">{inv.voidReason}</p>}

      {/* WHAT ARRIVED, AND THE PAPER FOR IT. One demand can be settled in
          several instalments of cash, so each payment is its own line and its
          own receipt — a single receipt for an invoice would be a document for
          an event that happened three times. */}
      {payments.length > 0 && (
        <ul className="ctd-paid">
          {payments.map((p) => (
            <li className="ctd-paid__row" key={p.id}>
              <Icon name="circle-check" size={14} className="ctd-paid__ic" />
              <span className="ctd-paid__txt">
                {t("admin.ct.inv.paidOn", {
                  amount: formatMoney(lang, p.receivedAmount),
                  date: fmtDate(lang, fromIso(p.receivedOn)),
                  method: t(`admin.fin.method.${p.method}`),
                })}
              </span>
              {/* THE PAPERS SIT WHERE EVERY OTHER ACTION ON THIS CARD SITS —
                  the right-hand action column, in line with Record payment and
                  Void above them. They used to run on from the end of the
                  sentence describing the payment, which read as part of the
                  sentence and put the only buttons on the card in two places.

                  TWO PAPERS FOR ONE MONTH'S RENT — the payer's and the
                  landlord's. The second is here only where the landlord took
                  the money himself; where the agency took it, his paper is the
                  payout receipt, printed on the day it is handed over. Either
                  way both halves of the file exist. */}
              <span className="ctd-paid__actions">
                {/* NAMED FOR WHOEVER PAID, which is not always the tenant: the
                    landlord's commission is paid by the landlord. See
                    payerReceiptKey. */}
                <Link className="ctd-paid__receipt" href={`/admin/receipts/payment/${encodeURIComponent(p.id)}`}>
                  <Icon name="printer" size={14} />
                  {t(payerReceiptKey(kind, side))}
                </Link>
                {/* HIS PAPER IS MADE WHEN HE TAKES THE MONEY, NOT WHEN THE
                    TENANT PAYS. The two happen on different days — the tenant
                    hands it over on the 1st and the landlord is not in the
                    office until the 9th — so issuing his receipt alongside the
                    tenant's would put a date on a paper he signs saying he
                    received something a week before he did.

                    So: a BUTTON until somebody records the day he actually got
                    it, and only then a printable receipt carrying that day.
                    Only where the money is his, too — commission is the
                    agency's own income and he has no copy of it. */}
                {landlordCollects && inv.payee === "owner" && (
                  p.ownerReceiptedOn ? (
                    <Link className="ctd-paid__receipt" href={`/admin/receipts/landlord/${encodeURIComponent(p.id)}`}>
                      <Icon name="printer" size={14} />
                      {t("admin.rc.forLandlord")}
                    </Link>
                  ) : (
                    <button type="button" className="ctd-paid__make" onClick={() => onReceiptOwner(p)}>
                      <Icon name="plus" size={14} />
                      {t("admin.rc.makeLandlord")}
                    </button>
                  )
                )}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* ⚠ LATE RENT IS OFFERED, NEVER CHARGED. The figure is calculated from
          the contract's own clause and shown beside a button; whether to
          enforce it against a tenant who is four days late for the first time
          in two years is a judgement somebody makes every single time. A system
          that raised the charge on its own would make that judgement by
          default, silently, in the agency's favour. There is no timer, no
          default handling, and no path to this that a person did not click. */}
      {actionable && status === "overdue" && penalty && (
        <div className="ctd-penalty">
          <Icon name="alert-triangle" size={15} className="ctd-penalty__ic" />
          <span className="ctd-penalty__txt">
            {t("admin.ct.inv.penaltyOffer", {
              days: fmtNum(lang, penalty.days),
              amount: formatMoney(lang, penalty.amount),
            })}
          </span>
          <button type="button" className="ctd-penalty__btn" onClick={() => onAddPenalty(inv)}>
            {t("admin.ct.inv.addPenalty")}
          </button>
        </div>
      )}

      {/* THE QUIET BAND. A reference number nobody says out loud, the day it
          went out, and the two things you can do to it. All three used to sit
          at the same weight as the money; none of them competes with it now. */}
      <div className="ctd-inv__foot">
        <span className="ctd-inv__no">{inv.number ? localizeDigits(lang, inv.number) : t("admin.ct.inv.unnumbered")}</span>
        {inv.issuedOn && (
          <span className="ctd-inv__issued">{t("admin.ct.inv.issued", { date: fmtDate(lang, fromIso(inv.issuedOn)) })}</span>
        )}
        <span className="ctd-inv__actions">
        {/* A credit note is a reversal, not a demand: nothing to collect on it
            and nothing to withdraw, so it carries no actions at all. */}
        {actionable && owed.amount > 0 && (
          <button
            type="button"
            className="ctd-invbtn"
            title={t("admin.ct.recordPayment")}
            aria-label={t("admin.ct.recordPayment")}
            onClick={() => onRecordPayment(inv)}
          >
            <Icon name="banknote" size={17} />
          </button>
        )}
        {actionable && (
          <button
            type="button"
            className="ctd-invbtn ctd-invbtn--danger"
            disabled={settled}
            title={settled ? t("admin.ct.inv.voidBlocked") : t("admin.fin.vi.action")}
            aria-label={settled ? t("admin.ct.inv.voidBlocked") : t("admin.fin.vi.action")}
            onClick={() => onVoid(inv)}
          >
            <Icon name="ban" size={17} />
          </button>
        )}
</span>
      </div>
    </div>
  );
}

function Invoices({
  rows,
  kind,
  ownerId,
  ownerName,
  agencyName,
  paymentsFor,
  landlordCollects,
  onReceiptOwner,
  penaltyFor,
  onAddPenalty,
  cancelled,
  owedFor,
  canWrite,
  canAdd,
  onAddInvoice,
  onRecordPayment,
  onVoid,
}: {
  rows: InvoiceRow[];
  /** The contract’s own two facts, passed to every row so it can name the
      side that owes it — see billedSide. */
  kind: ContractKind;
  ownerId: string;
  ownerName: string;
  agencyName: string;
  /** Payments against one invoice, for the receipt strip on its row. */
  paymentsFor: (invoiceId: string) => PaymentRecord[];
  /** Passed down to each row: decides whether the landlord's paper is here. */
  landlordCollects: boolean;
  /** Opens the date box that creates the landlord's receipt. */
  onReceiptOwner: (p: PaymentRecord) => void;
  penaltyFor: (row: InvoiceRow) => { amount: Money; days: number } | undefined;
  onAddPenalty: (invoice: InvoiceRecord) => void;
  cancelled: boolean;
  owedFor: (invoice: InvoiceRecord) => Money;
  /** May this surface write at all? Row actions and Add invoice hang off it. */
  canWrite: boolean;
  canAdd: boolean;
  onAddInvoice: () => void;
  onRecordPayment: (invoice: InvoiceRecord) => void;
  onVoid: (invoice: InvoiceRecord) => void;
}) {
  const { t, lang } = useLang();

  /* SEPARATED BY WHAT THE DEMAND IS, ORDERED BY WHEN IT HAS TO BE PAID.
     One tenancy raises twelve months of rent, a deposit and the agency's
     commission, and in one flat date-ordered list telling them apart meant
     reading every line. Two rules do the work, and they do not fight: the
     category decides what sits together, urgency decides the order — of the
     rows inside a block and of the blocks themselves. So the overdue rent is
     the first row of the first block, and the deposit is still its own thing.
     See groupInvoiceRows. */
  const groups = useMemo(() => groupInvoiceRows(rows, cancelled), [rows, cancelled]);

  /* A FILTER, NOT A SET OF TABS. The blocks are the separation; this only
     narrows to one of them, so "All" has to stay a real choice and stay the
     default — a tab strip would hide two thirds of the contract behind a click
     nobody knew to make. It appears only where there IS more than one kind to
     choose between. */
  const [only, setOnly] = useState<InvoiceCategory | "all">("all");
  const active = only !== "all" && groups.some((g) => g.category === only) ? only : "all";
  const visible = active === "all" ? groups : groups.filter((g) => g.category === active);

  /* Collapse PER BLOCK, not across the card. A single global limit cut the list
     off after four rows, which on a tenancy meant the commission and the
     deposit were hidden behind "Show 9 more" — a whole kind of demand missing
     because another kind had a long schedule. */
  const [expanded, setExpanded] = useState<InvoiceCategory[]>([]);
  const toggle = (category: InvoiceCategory) =>
    setExpanded((open) => (open.includes(category) ? open.filter((c) => c !== category) : [...open, category]));

  /* "Add invoice", not "New invoice": this is a charge the contract could not
     predict, hung off an agreement that already exists. */
  const addAction = canAdd ? (
    <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={onAddInvoice}>
      {t("admin.fin.ai.action")}
    </Button>
  ) : undefined;

  if (rows.length === 0) {
    return (
      <SectionCard title={t("admin.ct.invoices")} desc={t("admin.ct.invoicesEmptyDesc")} action={addAction} id="invoices">
        <div className="ctd-empty">
          <span className="ctd-empty__art">
            <Icon name="receipt" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.ct.invoicesEmpty")}</p>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title={t("admin.ct.invoices")}
      desc={t(rows.length === 1 ? "admin.ct.invoicesCountOne" : "admin.ct.invoicesCount", { count: fmtNum(lang, rows.length) })}
      action={addAction}
      id="invoices"
    >
      {groups.length > 1 && (
        <div className="ctd-invfilter" role="group" aria-label={t("admin.ct.inv.filterAria")}>
          <button
            type="button"
            className={"ctd-invchip" + (active === "all" ? " is-active" : "")}
            aria-pressed={active === "all"}
            onClick={() => setOnly("all")}
          >
            {t("admin.ct.inv.allKinds")}
            <span className="ctd-invchip__count">{fmtNum(lang, rows.length)}</span>
          </button>
          {/* The chips follow the blocks, so the strip reads in the same order
              as the list under it — most pressing kind first. */}
          {groups.map((g) => (
            <button
              key={g.category}
              type="button"
              className={"ctd-invchip" + (active === g.category ? " is-active" : "")}
              aria-pressed={active === g.category}
              onClick={() => setOnly(g.category)}
            >
              <Icon name={CATEGORY_ICON[g.category]} size={14} />
              {t(`admin.inv.cat.${g.category}`)}
              <span className="ctd-invchip__count">{fmtNum(lang, g.rows.length)}</span>
              {/* A dot, not a number: the heading below carries the count, and
                  this only has to say "something in here needs paying". */}
              {g.pressing > 0 && <span className="ctd-invchip__dot" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}

      <div className="ctd-invgroups">
        {visible.map((g) => {
          const open = expanded.includes(g.category);
          const collapses = g.rows.length > INVOICE_COLLAPSE_AT;
          const shown = collapses && !open ? g.rows.slice(0, INVOICE_COLLAPSE_AT) : g.rows;
          return (
            <section className="ctd-invgroup" key={g.category}>
              <header className="ctd-invgroup__head">
                <Icon name={CATEGORY_ICON[g.category]} size={15} className="ctd-invgroup__ic" />
                <h4 className="ctd-invgroup__title">{t(`admin.inv.cat.${g.category}`)}</h4>
                <span className="ctd-invgroup__count">{fmtNum(lang, g.rows.length)}</span>
                {/* What is actually outstanding in this block, said once at the
                    top of it — the reason the block is first. */}
                {g.pressing > 0 && (
                  <Badge variant="warning" size="sm" dot>
                    {t(g.pressing === 1 ? "admin.ct.inv.pressingOne" : "admin.ct.inv.pressing", { count: fmtNum(lang, g.pressing) })}
                  </Badge>
                )}
              </header>

              <div className="ctd-invs">
                {shown.map((r) => (
                  <InvoiceRowView
                    penalty={penaltyFor(r)}
                    onAddPenalty={onAddPenalty}
                    key={r.invoice.id}
                    row={r}
                    kind={kind}
                    ownerId={ownerId}
                    ownerName={ownerName}
                    agencyName={agencyName}
                    payments={paymentsFor(r.invoice.id)}
                    landlordCollects={landlordCollects}
                    onReceiptOwner={onReceiptOwner}
                    cancelled={cancelled}
                    owed={owedFor(r.invoice)}
                    canWrite={canWrite}
                    onRecordPayment={onRecordPayment}
                    onVoid={onVoid}
                  />
                ))}
              </div>

              {collapses && (
                <button type="button" className="ctd-showall" onClick={() => toggle(g.category)} aria-expanded={open}>
                  <Icon name={open ? "chevron-up" : "chevron-down"} size={15} />
                  {open ? t("admin.ct.showFewer") : t("admin.ct.showAll", { count: fmtNum(lang, g.rows.length - INVOICE_COLLAPSE_AT) })}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ---------------- the landlord's money ---------------- */

/**
 * WHAT HAPPENED TO THE RENT AFTER IT ARRIVED.
 *
 * The invoices card above tells the tenant's half of the story — what was
 * demanded and what he paid — and used to stop there, so a tenancy the agency
 * collects read as though money came in and never left. This is the other half,
 * on the same page, for the same flat.
 *
 * ⚠ ONLY WHERE MONEY ACTUALLY PASSES THROUGH THE AGENCY. On a tenancy the
 * landlord collects himself there is nothing of his in our account, so the card
 * does not appear at all — not an empty one. An empty card would suggest a
 * balance of zero, which is a different claim from "this never applied".
 *
 * The lines and the running balance are the owner ledger's own, read through
 * the same helpers the payouts screen uses, so the two cannot disagree about
 * one tenancy.
 */
function OwnerMoney({
  lines,
  balance,
  canPay,
  canSpend,
  onPay,
  onSpend,
}: {
  lines: StatementLine[];
  balance: Money;
  canPay: boolean;
  canSpend: boolean;
  onPay: () => void;
  onSpend: () => void;
}) {
  const { t, lang } = useLang();

  /* Two acts, and the order matters: spending his money comes before handing
     the rest over, which is the order they happen in. */
  const action =
    canPay || canSpend ? (
      <span className="ctd-om__actions">
        {canSpend && (
          <Button hierarchy="secondary" size="sm" iconLeading="wrench" onClick={onSpend}>
            {t("admin.po.ex.action")}
          </Button>
        )}
        {canPay && (
          <Button hierarchy="secondary" size="sm" iconLeading="arrow-up-right" onClick={onPay}>
            {t("admin.po.pay")}
          </Button>
        )}
      </span>
    ) : undefined;

  return (
    <SectionCard title={t("admin.ct.ownerMoney")} desc={t("admin.ct.ownerMoneyDesc")} action={action} id="owner-money">
      {lines.length === 0 ? (
        <div className="ctd-empty">
          <span className="ctd-empty__art">
            <Icon name="wallet" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.ct.ownerMoneyEmpty")}</p>
        </div>
      ) : (
        <>
          <ol className="ctd-om">
            {lines.map(({ entry, balanceAfter }) => (
              <li className={"ctd-om__row ctd-om__row--" + LEDGER_META[entry.kind].tone} key={entry.id}>
                <span className="ctd-om__icon">
                  <Icon name={LEDGER_META[entry.kind].icon} size={14} />
                </span>
                <span className="ctd-om__date">{fmtDate(lang, fromIso(entry.on))}</span>
                {/* Frozen text, written the day it happened — see
                    OwnerLedgerEntry.description. */}
                <span className="ctd-om__what">{entry.description}</span>
                <span className="ctd-om__amt">{formatMoney(lang, entry.amount)}</span>
                <span className="ctd-om__bal">{formatMoney(lang, balanceAfter)}</span>
                <span className="ctd-om__doc">
                  {entry.kind === "payout" && (
                    <Link className="ctd-paid__receipt" href={`/admin/receipts/payout/${encodeURIComponent(entry.id)}`}>
                      <Icon name="printer" size={14} />
                      {t("admin.rc.receipt")}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ol>
          {/* The answer, under the working that produced it. */}
          <div className="ctd-om__foot">
            <span>{t("admin.ct.ownerOwed")}</span>
            <b className={balance.amount > 0 ? "is-owing" : ""}>{formatMoney(lang, balance)}</b>
          </div>
        </>
      )}
    </SectionCard>
  );
}

/** The four questions somebody arrives at a contract with. */
export const CT_TABS = ["overview", "invoices", "documents", "activity"] as const;
export type CtTab = (typeof CT_TABS)[number];

/* ---------------- documents ---------------- */

/**
 * EVERY PAPER THIS CONTRACT HAS PRODUCED, in one place.
 *
 * They exist already — each payment carries the tenant's receipt and, on a
 * directly-paid tenancy, the landlord's; each hand-off carries the payout
 * receipt. But they were scattered one-per-row across two other cards, so
 * "print me last June's again" meant hunting down the row that made it.
 *
 * ⚠ NOT STORED DOCUMENTS. Nothing is filed here: each row is a VIEW of a
 * payment or a ledger line that already exists, so the list cannot drift from
 * the money and printing one twice creates nothing.
 */
function Documents({
  payments,
  invoiceById,
  ledger,
  landlordCollects,
  kind,
  ownerId,
}: {
  payments: PaymentRecord[];
  invoiceById: (id: string) => InvoiceRecord | undefined;
  ledger: OwnerLedgerEntry[];
  landlordCollects: boolean;
  /** So a receipt is filed under whoever actually paid — see payerReceiptKey. */
  kind: ContractKind;
  ownerId: string;
}) {
  const { t, lang } = useLang();

  type Doc = { id: string; href: string; who: string; what: string; on: string };
  const docs: Doc[] = [];

  for (const p of payments) {
    const inv = invoiceById(p.invoiceId);
    if (!inv) continue;
    docs.push({
      id: `t-${p.id}`,
      href: `/admin/receipts/payment/${encodeURIComponent(p.id)}`,
      /* NAMED FOR THE PAYER. Every row here said "Tenant’s receipt", so a
         landlord who paid his own commission had his paper filed under the
         tenant — the same bug the invoices card carried. */
      who: t(payerReceiptKey(kind, billedSide(inv, ownerId))),
      what: invoiceLineText(inv.lines[0], t, lang),
      on: p.receivedOn,
    });
    /* His copy of the same event, only where he took the money himself. */
    /* Only once it has been made — and dated the day HE took the money, which
       is not the day the tenant paid. See PaymentRecord.ownerReceiptedOn. */
    if (landlordCollects && inv.payee === "owner" && p.ownerReceiptedOn) {
      docs.push({
        id: `l-${p.id}`,
        href: `/admin/receipts/landlord/${encodeURIComponent(p.id)}`,
        who: t("admin.rc.forLandlord"),
        what: invoiceLineText(inv.lines[0], t, lang),
        on: p.ownerReceiptedOn,
      });
    }
  }
  for (const e of ledger) {
    if (e.kind !== "payout") continue;
    docs.push({
      id: e.id,
      href: `/admin/receipts/payout/${encodeURIComponent(e.id)}`,
      who: t("admin.rc.forLandlord"),
      what: e.description,
      on: e.on,
    });
  }
  docs.sort((a, b) => b.on.localeCompare(a.on));

  return (
    <SectionCard title={t("admin.ct.documents")} desc={t("admin.ct.documentsDesc")} id="documents">
      {/* The contract itself is the one paper that does not exist yet — said
          out loud rather than left as a dead button somebody keeps pressing. */}
      <div className="ctd-doc ctd-doc--pending">
        <span className="ctd-doc__ic">
          <Icon name="file-text" size={17} />
        </span>
        <span className="ctd-doc__txt">
          <span className="ctd-doc__who">{t("admin.ct.doc.contract")}</span>
          <span className="ctd-doc__what">{t("admin.ct.doc.contractPending")}</span>
        </span>
      </div>

      {docs.length === 0 ? (
        <div className="ctd-empty">
          <span className="ctd-empty__art">
            <Icon name="printer" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.ct.documentsEmpty")}</p>
        </div>
      ) : (
        <ul className="ctd-docs">
          {docs.map((d) => (
            <li key={d.id}>
              <Link className="ctd-doc" href={d.href}>
                <span className="ctd-doc__ic">
                  <Icon name="printer" size={17} />
                </span>
                <span className="ctd-doc__txt">
                  <span className="ctd-doc__who">{d.who}</span>
                  <span className="ctd-doc__what">{d.what}</span>
                </span>
                <span className="ctd-doc__on">{fmtDate(lang, fromIso(d.on))}</span>
                <Icon name="chevron-right" size={16} className="ctd-doc__go" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

/* ---------------- activity ---------------- */

/**
 * WHAT HAPPENED TO THIS CONTRACT, AND WHO DID IT.
 *
 * The audit log already records every one of these — signing, payments, void,
 * payouts, deposit outcomes — but only the whole-platform log at /admin/audit
 * showed them, where one tenancy's history is buried among everybody's. This is
 * the same events, filtered to the records this contract owns.
 *
 * ⚠ READ-ONLY AND UNEDITABLE, like the log it reads. A history somebody can
 * tidy is not a history.
 */
function Activity({ events }: { events: AuditEvent[] }) {
  const { t, lang } = useLang();
  if (events.length === 0) {
    return (
      <SectionCard title={t("admin.ct.activity")} desc={t("admin.ct.activityDesc")} id="activity">
        <div className="ctd-empty">
          <span className="ctd-empty__art">
            <Icon name="scroll-text" size={24} strokeWidth={1.6} />
          </span>
          <p>{t("admin.ct.activityEmpty")}</p>
        </div>
      </SectionCard>
    );
  }
  return (
    <SectionCard title={t("admin.ct.activity")} desc={t("admin.ct.activityDesc")} id="activity">
      <ol className="ctd-acts">
        {events.map((e) => (
          <li className="ctd-act" key={e.id}>
            <span className="ctd-act__dot" />
            <span className="ctd-act__body">
              <span className="ctd-act__what">{t(e.actionKey, e.actionParams)}</span>
              {e.metaKey && <span className="ctd-act__meta">{t(e.metaKey, e.metaParams)}</span>}
              <span className="ctd-act__who">
                {e.actor.name} · {fmtDate(lang, new Date(e.at))}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}

/* ---------------- summary rail ---------------- */

/**
 * THE FOUR FIGURES, kept beside the document while you read it.
 *
 * Somebody opens a running contract for one of two reasons: to re-read a term,
 * or to find out what is owed. The terms are the page; this rail is the second
 * question, and it stays put so the answer does not scroll away underneath the
 * clause somebody is checking it against.
 *
 * EVERY FIGURE IS DERIVED, from the same helpers the Invoices tab reads —
 * `contractValue`, `outstanding` per live row. Nothing here is a stored total,
 * so recording a payment moves this rail without anything having to remember to.
 *
 * WHAT IS DELIBERATELY NOT HERE — a stack of quick-action buttons. Raising an
 * invoice, messaging a party and closing a deposit each already sit beside the
 * figure they act on, which is where they can be understood; lifted into a
 * column of identical buttons they become five verbs with no object. The two
 * actions that genuinely belong to the whole contract, Print and Cancel, are in
 * the header where they have always been.
 */
function SummaryRail({
  c,
  outstandingNow,
  agentName,
  onViewInvoices,
}: {
  c: ContractRecord;
  outstandingNow: Money;
  agentName: string;
  /** Switches the tab rather than navigating — the invoices are on this page. */
  onViewInvoices: () => void;
}) {
  const { t, lang } = useLang();
  const st = STATUS_META[c.status];
  const owed = outstandingNow.amount > 0;

  return (
    /* pd-grid__aside is the property screen's own sticky column — same width,
       same 1180px collapse. This screen already imports that stylesheet. */
    <aside className="pd-grid__aside ctd-rail" aria-label={t("admin.ct.summary")}>
      <div className="ctd-rail__card">
        <div className={"ctd-rail__state ctd-rail__state--" + c.status}>
          {/* A draft carries a dot rather than an icon in STATUS_META, because
              at badge size it is a colour and not a picture. At this size it
              needs one, and the honest one is the pen: a draft is a document
              somebody is still writing. */}
          <span className="ctd-rail__stateic">
            <Icon name={st.icon ?? "file-pen"} size={19} />
          </span>
          <div className="ctd-rail__statetext">
            <span className="ctd-rail__statename">{t(`admin.ct.status.${c.status}`)}</span>
            <p className="ctd-rail__statenote">{t(`admin.ct.sum.note.${c.status}`)}</p>
          </div>
        </div>

        <dl className="ctd-rail__figs">
          {/* The headline figure differs by contract: a sale HAS one price, a
              tenancy's is rent multiplied out over the term. */}
          <div className="ctd-rail__lead">
            <dt>{t(c.kind === "sale" ? "admin.ct.sum.price" : "admin.ct.sum.value")}</dt>
            <dd className="ctd-num">{formatMoney(lang, c.kind === "sale" ? c.price : contractValue(c))}</dd>
          </div>

          {c.kind === "rent" && (
            <>
              <div className="ctd-rail__fig">
                <dt>{t("admin.ct.sum.rent")}</dt>
                <dd className="ctd-num">{formatMoney(lang, c.price)}</dd>
              </div>
              {c.cycle && (
                <div className="ctd-rail__fig">
                  <dt>{t("admin.ct.sum.frequency")}</dt>
                  <dd>{t(`admin.ct.cycle.${c.cycle}`)}</dd>
                </div>
              )}
            </>
          )}

          {/* OUTSTANDING IS THE POINT OF THIS RAIL, so it is red when there is
              any and it says so in words when there is none — a row reading
              "$0.00" makes somebody look twice to check it is really zero. */}
          <div className={"ctd-rail__fig ctd-rail__fig--owed" + (owed ? " is-owed" : "")}>
            <dt>{t("admin.ct.sum.outstanding")}</dt>
            <dd className="ctd-num">{owed ? formatMoney(lang, outstandingNow) : t("admin.ct.sum.settled")}</dd>
          </div>
        </dl>

        <button type="button" className="ctd-rail__link" onClick={onViewInvoices}>
          {t("admin.ct.sum.viewInvoices")}
          <Icon name={isRtl(lang) ? "arrow-left" : "arrow-right"} size={15} />
        </button>
      </div>

      {/* Provenance, small and last: what this document IS, not what it owes.
          Written-by is the agent who typed it — the contract stores no editor
          and no modified stamp, so neither is claimed here. */}
      <dl className="ctd-rail__meta">
        <div>
          <dt>{t("admin.ct.sum.ref")}</dt>
          <dd className="ctd-rail__mono">{localizeDigits(lang, c.id)}</dd>
        </div>
        <div>
          <dt>{t("admin.ct.sum.kind")}</dt>
          <dd>{t(`admin.ct.kind.${c.kind}`)}</dd>
        </div>
        <div>
          <dt>{t("admin.ct.sum.agent")}</dt>
          <dd>{agentName}</dd>
        </div>
        <div>
          <dt>{t("admin.ct.sum.written")}</dt>
          <dd className="ctd-num">{fmtDate(lang, fromIso(c.createdOn))}</dd>
        </div>
      </dl>
    </aside>
  );
}

/* ---------------- page ---------------- */

export function ContractDetailApp({ id, agentSurface }: { id: string; agentSurface?: boolean }) {
  const { t, lang } = useLang();
  const { getContract, invoicesByContract, invoices, payments, paymentsByInvoice, ledger, ledgerForContract, previousContract, replacedBy } = useContracts();
  /* What this agency calls itself on its own paperwork — the same name the
     printed receipt carries, so the arrow on a commission card points at the
     business that signs the receipt rather than at the bare word "agency". */
  const { settings } = usePlatformSettings();
  const auditEvents = useAuditLog();
  const { properties, members, agents } = useProperties();
  const base = agentSurface ? "/agent" : "/admin";
  const basePath = `${base}/contracts`;

  /* WRITING IS ADMIN-ONLY FOR NOW. The agent console can read a contract; what
     an agent may DO to one is a permissions decision that has not been taken —
     see the TODO on app/agent/contracts/page. Enabling these actions on that
     surface would answer the question by accident. */
  const canWrite = !agentSurface;

  const [payTarget, setPayTarget] = useState<InvoiceRecord | null>(null);
  const [voidTarget, setVoidTarget] = useState<InvoiceRecord | null>(null);
  const [addingInvoice, setAddingInvoice] = useState(false);
  const [payingOwner, setPayingOwner] = useState(false);
  const [spending, setSpending] = useState(false);
  const [tab, setTab] = useState<CtTab>("overview");
  const [receiptTarget, setReceiptTarget] = useState<PaymentRecord | null>(null);
  /* Which side the "Message" button was pressed next to. The modal lets the
     sender switch, so this is a starting point rather than a decision. */
  const [sendTo, setSendTo] = useState<MsgAudience | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [closingLease, setClosingLease] = useState(false);
  const [settling, setSettling] = useState(false);
  const [toasts, pushToast, dismissToast] = useFinanceToasts();
  const { addLatePenalty } = useFinanceActions();

  const router = useRouter();
  const contract = getContract(id);

  /**
   * Editing a draft and amending a signed contract open the SAME full page —
   * the one at /admin/contracts/new — with the values loaded. Two nearly
   * identical three-step forms would drift apart within a month, and the
   * difference between the two acts is a banner and a required reason, not a
   * different set of questions.
   */
  const onEdit = useCallback(() => {
    if (!contract) return;
    router.push(`/admin/contracts/new?type=${contract.kind}&edit=${encodeURIComponent(contract.id)}`);
  }, [contract, router]);

  /* Renewing opens the SAME full page, seeded from this tenancy — the third
     thing that form does, beside writing one and amending one. A separate
     "renewal form" would be the same twenty questions in a second file, and
     the two would drift apart within a month. */
  const onRenew = useCallback(() => {
    if (!contract) return;
    router.push(`/admin/contracts/new?type=lease&renew=${encodeURIComponent(contract.id)}`);
  }, [contract, router]);

  /* What a late charge on one overdue row would come to, from the contract’s
     own clause. Returns undefined when the contract states no penalty — most
     do not — so the strip simply is not rendered. */
  const penaltyFor = useCallback(
    (row: { lateDays: number }) => (contract ? latePenaltyFor(contract, row.lateDays) : undefined),
    [contract],
  );

  const onAddPenalty = useCallback(
    (invoice: InvoiceRecord) => {
      const raised = addLatePenalty(invoice.id);
      if (!raised) return;
      pushToast({
        tone: "success",
        icon: "receipt",
        title: t("admin.fin.toast.penaltyTitle"),
        msg: t("admin.fin.toast.penaltyMsg", { number: raised.number }),
      });
    },
    [addLatePenalty, pushToast, t],
  );

  const onAmend = useCallback(() => {
    if (!contract) return;
    router.push(`/admin/contracts/new?type=${contract.kind}&amend=${encodeURIComponent(contract.id)}`);
  }, [contract, router]);

  const invoiceRows = useMemo(
    () => (contract ? toInvoiceRows(invoicesByContract(contract.id), payments) : []),
    // invoicesByContract is rebuilt whenever the store's invoices change, so it
    // is the dependency that actually tracks the data.
    [contract, invoicesByContract, payments],
  );

  /* Outstanding is DERIVED per row, every render, from the live payments — never
     stored. Recording a payment therefore updates the row it was recorded
     against without anything having to remember to refresh it. */
  const owedFor = useCallback((invoice: InvoiceRecord) => outstanding(invoice, payments), [payments]);

  /* What the ⋯ menu's "Record payment" targets: the oldest live demand with
     money still on it. Rows are already in due-date order. */
  const nextUnpaid = useMemo(
    () => invoiceRows.find((r) => r.invoice.status === "issued" && !r.invoice.creditNoteFor && owedFor(r.invoice).amount > 0)?.invoice ?? null,
    [invoiceRows, owedFor],
  );

  /* What this contract still owes, all in — the figure the summary rail leads
     with. Built the same way `outstandingForContract` builds it for the list
     (live demands only, each one's balance after payments), but off the STORE's
     invoices rather than the module seed, so a demand raised this session counts
     here the moment it is raised. Void rows are excluded by the status filter;
     a credit note cannot add to it because `outstanding` floors at zero. */
  const outstandingNow = useMemo(
    () =>
      sumMoney(
        invoiceRows.filter((r) => r.invoice.status === "issued").map((r) => owedFor(r.invoice)),
        contract?.price.currency ?? PLATFORM_CURRENCY,
      ),
    [invoiceRows, owedFor, contract],
  );

  /* ---- the landlord's side of this one tenancy ----
     Read through the payouts screen's own helpers rather than a second set, so
     the contract page and that list cannot disagree about one flat. */
  const ownerEntries = useMemo(() => (contract ? ledgerForContract(contract.id) : []), [contract, ledgerForContract]);

  const ownerLines = useMemo(
    () => (contract ? statementFor(ownerEntries, contract.price.currency) : []),
    [ownerEntries, contract],
  );

  /* The running balance the list already carried — taken off the last line
     rather than summed again, so the figure under the working is the working. */
  const ownerBalanceHere = useMemo(
    () => ownerLines.at(-1)?.balanceAfter ?? zeroMoney(contract?.price.currency ?? PLATFORM_CURRENCY),
    [ownerLines, contract],
  );

  /* Whose money can pass through us at all. A tenancy the landlord collects
     himself never produces a line, and neither does a full-price sale — the
     card is absent rather than empty on both. */
  const ownerMoneyApplies =
    !!contract && (ownerEntries.length > 0 || (contract.kind === "rent" && contract.rentPaidTo === "agency"));

  /* The months of HIS still sitting with us, on THIS tenancy — what the button
     settles. Scoped to the contract because that is the flat on screen. */
  /* ---- what the Documents and Activity tabs read ---- */

  /** Every payment against any of this contract's invoices. */
  const contractPayments = useMemo(() => {
    if (!contract) return [];
    const mine = new Set(invoicesByContract(contract.id).map((i) => i.id));
    return payments.filter((p) => mine.has(p.invoiceId)).sort((a, b) => b.receivedOn.localeCompare(a.receivedOn));
  }, [contract, invoicesByContract, payments]);

  const docCount = useMemo(
    () =>
      contractPayments.length +
      contractPayments.filter((p) => p.ownerReceiptedOn).length +
      ownerEntries.filter((e) => e.kind === "payout").length,
    [contractPayments, ownerEntries],
  );

  /**
   * THIS CONTRACT'S HISTORY, out of the platform-wide log.
   *
   * Matched on the ids the contract owns — itself, its invoices, its payments
   * and its ledger lines — because the log stores what a human would recognise
   * rather than a foreign key, and a contract's events are logged against
   * several different things.
   */
  const contractEvents = useMemo(() => {
    if (!contract) return [];
    const mine = new Set<string>([contract.id]);
    for (const i of invoicesByContract(contract.id)) {
      mine.add(i.id);
      if (i.number) mine.add(i.number);
    }
    for (const p of contractPayments) mine.add(p.id);
    for (const e of ownerEntries) mine.add(e.id);
    return auditEvents.filter((e) => mine.has(e.target) || (e.targetId ? mine.has(e.targetId) : false));
  }, [contract, invoicesByContract, contractPayments, ownerEntries, auditEvents]);

  const owedMonths = useMemo(
    () =>
      contract
        ? buildPayoutRows(
            ledger,
            (id) => members.find((m) => m.id === id)?.name ?? id,
            () => properties.find((p) => p.id === contract.propertyId)?.title ?? contract.propertyId,
          ).filter((r) => r.contractId === contract.id && r.status !== "paid")
        : [],
    [ledger, contract, members, properties],
  );

  if (!contract) {
    return (
      <div className="ctd-missing">
        <span className="ctd-empty__art">
          <Icon name="file-x" size={26} strokeWidth={1.6} />
        </span>
        <h1>{t("admin.ct.notFound")}</h1>
        <p>{t("admin.ct.notFoundSub", { id })}</p>
        <Button href={basePath} hierarchy="secondary" size="md" iconLeading={isRtl(lang) ? "arrow-right" : "arrow-left"}>
          {t("admin.ct.backToList")}
        </Button>
      </div>
    );
  }

  const property = properties.find((p) => p.id === contract.propertyId);
  const propertyTitle = property?.title ?? contract.propertyId;
  const ownerName = members.find((m) => m.id === contract.ownerId)?.name ?? contract.ownerId;
  const linked = contract.buyerId ? members.find((m) => m.id === contract.buyerId)?.name : undefined;
  const counterparty = linked ?? contract.buyerExternal?.name ?? null;
  const agentName = agents.find((a) => a.id === contract.agentId)?.name ?? contract.agentId;

  /* The same three people the Terms card names, resolved down to a NUMBER.
     A tenant with no member account still has one — it was typed onto the
     contract as an ExternalParty — and a party with no number at all is a real
     state the contact card has to show rather than hide. */
  const ownerMember = members.find((m) => m.id === contract.ownerId);
  const tenantMember = contract.buyerId ? members.find((m) => m.id === contract.buyerId) : undefined;
  const agentRecord = agents.find((a) => a.id === contract.agentId);
  /* Email comes off the member and agent records, which have carried one all
     along — this screen simply never showed it, so writing to a landlord meant
     opening his profile in another tab. A party typed onto the contract as an
     ExternalParty has no account and therefore no address: undefined, and the
     row omits the line rather than printing an empty one. */
  const landlordParty = { name: ownerName, phone: ownerMember?.phone ?? "", email: ownerMember?.email, memberId: ownerMember?.id };
  const tenantParty = counterparty
    ? {
        name: counterparty,
        phone: tenantMember?.phone ?? contract.buyerExternal?.phone ?? "",
        email: tenantMember?.email,
        memberId: tenantMember?.id,
      }
    : null;
  const agentParty = { name: agentName, phone: agentRecord?.phone ?? "", email: agentRecord?.email };
  const cancelled = contract.status === "cancelled";

  return (
    <>
      <header className="pd-head">
        <nav className="pd-breadcrumb" aria-label={t("admin.common.breadcrumb")}>
          <Link href={basePath}>{t("admin.nav.contracts")}</Link>
          <Icon name={isRtl(lang) ? "chevron-left" : "chevron-right"} size={14} />
          <span aria-current="page">{localizeDigits(lang, contract.id)}</span>
        </nav>

        <div className="vwd-panel">
          <div className="vwd-hero">
            <DetailHeader
              c={contract}
              basePath={basePath}
              counterparty={counterparty}
              canRecordPayment={!!nextUnpaid}
              /* A tenancy that is standing and has not already been followed.
                 A sale has nothing to renew, a draft was never in force, and a
                 contract something already replaced would start a second chain
                 off the same link. */
              canRenew={canWrite && contract.kind === "rent" && contract.status === "signed" && !replacedBy(contract)}
              canWrite={canWrite}
              onRecordPayment={() => setPayTarget(nextUnpaid)}
              onRenew={onRenew}
              onCancel={() => setCancelling(true)}
              onSettleEarly={() => setSettling(true)}
            />
          </div>
        </div>
      </header>

      {cancelled && <CancelledBanner c={contract} />}

      {/* SEGMENTED TABS, the property page's own — same track, same buttons,
          same counts. A contract page that scrolled through four unrelated
          cards made the money and the paperwork equally far away; each of these
          is a different question somebody arrives with.

          Overview first because it is the document itself. Invoices second
          because it is what the page is opened for once the deal is running. */}
      <div className="vwd-segwrap">
        <div className="vwd-seg" role="tablist" aria-label={t("admin.ct.detailTabsAria")}>
          {CT_TABS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={"vwd-seg__btn" + (tab === id ? " is-active" : "")}
              onClick={() => setTab(id)}
            >
              {t(`admin.ct.tab.${id}`)}
              {id === "invoices" && invoiceRows.length > 0 && <span className="vwd-seg__count">{fmtNum(lang, invoiceRows.length)}</span>}
              {id === "documents" && docCount > 0 && <span className="vwd-seg__count">{fmtNum(lang, docCount)}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="ctd-stack">
        {/* TWO COLUMNS, on the OVERVIEW ONLY. The document reads down the left;
            what it is worth and what is still owed sits in a rail on the right
            that does not scroll away. The other three tabs stay full width —
            an invoice list beside a summary of itself would be a rail repeating
            the column next to it. */}
        {tab === "overview" && (
        <div className="pd-grid">
        {/* CARDS TWO ACROSS, not one column of full-width ones.

            Every card here is a short list of fields. Run full width they each
            need an internal two-column grid to avoid a page of half-empty
            lines, which buries the headings that say what you are looking at
            and makes the page twice as long as it needs to be. Paired, each
            card is one narrow column of fields under its own title, and the two
            questions somebody actually arrives with — what was agreed, and
            when — sit beside each other instead of one below the other.

            Pairing is by row: what/who, then money/dates. Anything that is not
            a field list — the deposit with its own actions, the renewal chain,
            the note — spans both columns. See .ctd-cards. */}
        <div className="pd-grid__main ctd-cards">
        {/* The subject of the document, and the people on it. */}
        <PropertyCard property={property} propertyId={contract.propertyId} basePath={basePath} />
        {/* Beside the property rather than below the terms — see the note on
            Contacts. Somebody opening a running contract needs the tenant's
            number far more often than they need to re-read the term. */}
        <Contacts
          c={contract}
          landlord={landlordParty}
          tenant={tenantParty}
          agent={agentParty}
          basePath={basePath}
          onSend={setSendTo}
        />
        <FinancialTerms c={contract} canWrite={canWrite} onEdit={onEdit} onAmend={onAmend} />
        <ContractDates c={contract} />
        {/* Below the pair and spanning both columns — these are not field lists.
            The deposit carries its own money, state and action; the note is
            prose; the chain is links to other contracts. */}
        <Deposit c={contract} basePath={basePath} canWrite={canWrite} onCloseLease={() => setClosingLease(true)} />
        {contract.notes && <TermsNote c={contract} />}
        <Provenance c={contract} previous={previousContract(contract)} next={replacedBy(contract)} basePath={basePath} />
        </div>
        <SummaryRail
          c={contract}
          outstandingNow={outstandingNow}
          agentName={agentName}
          onViewInvoices={() => setTab("invoices")}
        />
        </div>
        )}

        {/* THE MONEY, TOGETHER. What was demanded and what came in, then what
            happened to it afterwards — the tenant's half and the landlord's on
            one tab, because on a collected tenancy they are two halves of one
            month and reading either alone is how the other gets forgotten. */}
        {tab === "invoices" && (
        <>
        <Invoices
          rows={invoiceRows}
          kind={contract.kind}
          ownerId={contract.ownerId}
          ownerName={ownerName}
          agencyName={settings.general.platformName}
          paymentsFor={paymentsByInvoice}
          landlordCollects={contract.kind === "rent" && contract.rentPaidTo !== "agency"}
          onReceiptOwner={setReceiptTarget}
          penaltyFor={penaltyFor}
          onAddPenalty={onAddPenalty}
          cancelled={cancelled}
          owedFor={owedFor}
          canWrite={canWrite}
          /* A draft has demanded nothing of anybody, and a cancelled or
             completed contract is finished. An extra charge belongs to a
             contract that is actually running. */
          canAdd={canWrite && contract.status === "signed"}
          onAddInvoice={() => setAddingInvoice(true)}
          onRecordPayment={setPayTarget}
          onVoid={setVoidTarget}
        />
        {ownerMoneyApplies && (
          <OwnerMoney
            lines={ownerLines}
            balance={ownerBalanceHere}
            canPay={canWrite && owedMonths.length > 0}
            canSpend={canWrite && contract.status === "signed"}
            onPay={() => setPayingOwner(true)}
            onSpend={() => setSpending(true)}
          />
        )}
        </>
        )}

        {tab === "documents" && (
          <Documents
            payments={contractPayments}
            invoiceById={(id) => invoices.find((i) => i.id === id)}
            ledger={ownerEntries}
            landlordCollects={contract.kind === "rent" && contract.rentPaidTo !== "agency"}
            kind={contract.kind}
            ownerId={contract.ownerId}
          />
        )}

        {tab === "activity" && <Activity events={contractEvents} />}
      </div>


      {closingLease && isDepositHeld(contract) && (
        <CloseLeaseModal
          contract={contract}
          onClose={() => setClosingLease(false)}
          onClosed={(outcome) => {
            setClosingLease(false);
            pushToast({
              tone: "success",
              icon: "wallet",
              title: t("admin.fin.toast.depositTitle"),
              msg: t("admin.fin.toast.depositMsg." + outcome.kind, { id: contract.id }),
            });
          }}
        />
      )}

      {settling && (
        <SettleEarlyModal
          contract={contract}
          onClose={() => setSettling(false)}
          onSettled={({ paid, voided }) => {
            setSettling(false);
            pushToast({
              tone: "success",
              icon: "circle-check",
              title: t("admin.fin.toast.settledTitle"),
              msg: t("admin.fin.toast.settledMsg", { amount: formatMoney(lang, paid), count: fmtNum(lang, voided) }),
            });
          }}
        />
      )}

      {payTarget && (
        <RecordPaymentModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onRecorded={({ settled }) => {
            const number = payTarget.number;
            setPayTarget(null);
            pushToast({
              tone: "success",
              icon: "banknote",
              title: t("admin.fin.toast.paidTitle"),
              msg: t(settled ? "admin.fin.toast.paidMsgSettled" : "admin.fin.toast.paidMsgPartial", { number }),
            });
          }}
        />
      )}

      {receiptTarget && (
        <OwnerReceiptModal
          payment={receiptTarget}
          ownerName={ownerName}
          what={invoiceLineText(invoices.find((i) => i.id === receiptTarget.invoiceId)?.lines[0], t, lang)}
          onClose={() => setReceiptTarget(null)}
          onDone={(on) => {
            setReceiptTarget(null);
            pushToast({
              tone: "success",
              icon: "printer",
              title: t("admin.rc.make.toastTitle"),
              msg: t("admin.rc.make.toastMsg", { name: ownerName, date: fmtDate(lang, fromIso(on)) }),
            });
          }}
        />
      )}

      {spending && (
        <RecordExpenseModal
          contractId={contract.id}
          propertyTitle={propertyTitle}
          ownerName={ownerName}
          balance={ownerBalanceHere}
          onClose={() => setSpending(false)}
          onSpent={({ amount }) => {
            setSpending(false);
            pushToast({
              tone: "brand",
              icon: "wrench",
              title: t("admin.po.ex.toastTitle"),
              msg: t("admin.po.ex.toastMsg", { amount: formatMoney(lang, amount), name: ownerName }),
            });
          }}
        />
      )}

      {/* The payouts screen's own modal, not a second one. A hand-off recorded
          here and one recorded there write the same ledger lines. */}
      {payingOwner && owedMonths.length > 0 && (
        <RecordPayoutModal
          ownerName={ownerName}
          rows={owedMonths}
          onClose={() => setPayingOwner(false)}
          onPaid={({ count, totals }) => {
            setPayingOwner(false);
            pushToast({
              tone: "success",
              icon: "arrow-up-right",
              title: t("admin.po.toast.paidTitle"),
              msg: t(count === 1 ? "admin.po.toast.paidMsgOne" : "admin.po.toast.paidMsg", {
                name: ownerName,
                count: fmtNum(lang, count),
                amount: totals.map((m) => formatMoney(lang, m)).join(" + "),
              }),
            });
          }}
        />
      )}

      {addingInvoice && (
        <AddInvoiceModal
          contract={contract}
          counterpartyName={counterparty ?? undefined}
          ownerName={ownerName}
          onClose={() => setAddingInvoice(false)}
          onIssued={({ number }) => {
            setAddingInvoice(false);
            pushToast({
              tone: "brand",
              icon: "receipt",
              title: t("admin.fin.toast.issuedTitle"),
              msg: t("admin.fin.toast.issuedMsg", { number }),
            });
          }}
        />
      )}

      {voidTarget && (
        <VoidInvoiceModal
          invoice={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            const number = voidTarget.number;
            setVoidTarget(null);
            pushToast({
              tone: "danger",
              icon: "ban",
              title: t("admin.fin.toast.voidedTitle"),
              msg: t("admin.fin.toast.voidedMsg", { number }),
            });
          }}
        />
      )}

      {cancelling && (
        <CancelContractModal
          contract={contract}
          onClose={() => setCancelling(false)}
          onCancelled={({ voided, leftOwed }) => {
            setCancelling(false);
            pushToast({
              tone: "danger",
              icon: "ban",
              title: t("admin.fin.toast.cancelledTitle"),
              msg:
                leftOwed > 0
                  ? t("admin.fin.toast.cancelledMsgOwed", { voided: fmtNum(lang, voided), owed: fmtNum(lang, leftOwed) })
                  : t("admin.fin.toast.cancelledMsg", { voided: fmtNum(lang, voided) }),
            });
          }}
        />
      )}

      {sendTo && (
        <SendMessageModal
          contract={contract}
          audience={sendTo}
          tenant={tenantParty ?? { name: "", phone: "" }}
          landlord={landlordParty}
          propertyTitle={propertyTitle}
          onClose={() => setSendTo(null)}
          onSent={({ name }) => {
            setSendTo(null);
            pushToast({
              tone: "success",
              icon: "message-circle",
              title: t("admin.wa.toast.sentTitle"),
              msg: t("admin.wa.toast.sentMsg", { name }),
            });
          }}
        />
      )}

      <FinanceToaster toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
