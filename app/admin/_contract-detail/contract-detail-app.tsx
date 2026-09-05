"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useLang, interleave, isRtl, type Lang } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtPercent, localizeDigits, valueKey } from "@/lib/fmt";
import { formatMoney, isNegative, multiply, subtract, sumMoney, zeroMoney, type Money } from "@/lib/money";
import { ANCHOR_ISO, daysBetween, fromIso } from "@/lib/dates";
import { usePlatformSettings } from "@/lib/platform-settings";
import type { PropertyRecord } from "../_data/catalog";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { AddInvoiceModal, CancelContractModal, CloseLeaseModal, EndTenancyModal, PostponeInvoiceModal, RecordPaymentModal, SettleEarlyModal, VoidInvoiceModal, invoiceLineText, useFinanceActions } from "../_shared/finance";
import { FinanceToaster, useFinanceToasts } from "../_shared/finance/toaster";
import { useAuditLog } from "../_shared/audit-log";
import { fileIcon, fileSize, removeContractFile, useContractFiles, type ContractFile } from "../_shared/contract-files";
import { UploadFileModal } from "./upload-file-modal";
import { FileViewerModal } from "./file-viewer-modal";
import type { OwnerLedgerEntry } from "../_data/owner-ledger";
import { PLATFORM_CURRENCY, depositNeedsClosing, hasInstallments, invoiceTotals, isDepositHeld, latePenaltyFor, outstanding, type InvoiceRecord, type PaymentRecord } from "../_data/contracts";
/* The payouts screen's helpers and its modal, imported rather than reproduced:
   the landlord's side of one tenancy has to read the same here as it does on
   the list, and one hand-off writes one set of ledger lines wherever it is
   recorded from. */
import { LEDGER_META, buildPayoutRows, statementFor, type StatementLine } from "../_payouts/data";
import { RecordPayoutModal } from "../_payouts/record-payout-modal";
import { RecordExpenseModal } from "../_payouts/record-expense-modal";
import { OwnerReceiptModal } from "./owner-receipt-modal";
import { ReceiptActions } from "./receipt-actions";
/* Messaging — the parties' phone numbers, what the platform has already said to
   them, and the modal for saying something by hand. See _shared/messaging. */
import { SendMessageModal, isDialable, reachBlock, useContractMessages, waLink, type MsgAudience } from "../_shared/messaging";
import {
  CATEGORY_ICON,
  INVOICE_STATUS_META,
  KIND_META,
  STATUS_META,
  billedSide,
  contractDisplayStatus,
  contractValue,
  cycleCount,
  displayStatus,
  foldNotDue,
  groupInvoiceRows,
  invoiceRecipient,
  invoiceRowTitle,
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
  ownerName,
  counterparty,
  onRecordPayment,
  onRenew,
  onCancel,
  onSettleEarly,
  onEndTenancy,
  canRecordPayment,
  canRenew,
  canEndTenancy,
  canWrite,
}: {
  c: ContractRecord;
  /** So Print can link to the document on whichever surface this is. */
  basePath: string;
  /** The landlord/seller — always present, a contract cannot exist without one. */
  ownerName: string;
  counterparty: string | null;
  onRecordPayment: () => void;
  onRenew: () => void;
  onCancel: () => void;
  onSettleEarly: () => void;
  onEndTenancy: () => void;
  canRecordPayment: boolean;
  /** A signed tenancy nothing has replaced yet. See the button. */
  canRenew: boolean;
  /** A tenancy whose term has actually run out. See the button. */
  canEndTenancy: boolean;
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

  /* The five-word display state, not the stored one — an expired lease says
     Expired at the top of its own page too. See _data/contracts. */
  const ds = contractDisplayStatus(c);
  const st = STATUS_META[ds];
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
              {t(`admin.ct.status.${ds}`)}
            </Badge>
          </span>
        </div>
        <div className="pd-head__meta">
          {/* BOTH SIDES OF THE AGREEMENT, in the order the document names them:
              landlord → tenant, seller → buyer. This was the tenant alone,
              which answered "whose contract is this?" with half the answer —
              a contract is between two people, and the header of one should
              say who they both are.

              EACH NAME CARRIES ITS ROLE IN WORDS. Two bare names beside an
              arrow leave the reader to guess which one signs which line, and
              the guess is different on a sale than on a tenancy. The label is
              the same small caps the invoice rows use for the same job — see
              .ctd-parties in ct.css — so one habit reads both.

              NO PERSON ICON IN FRONT. The other two meta items are a date each
              and their icon says which date; this one is already introduced by
              the word LANDLORD, and a little figure before it only repeated
              what the label says in words. */}
          <span className="pd-head__metaitem ctd-head__parties">
            <span className="ctd-head__party">
              <span className="ctd-head__role">{t(partyRoleKey(c.kind, "owner"))}</span>
              {ownerName}
            </span>
            <Icon name="arrow-right" size={14} className="ctd-head__arrow" />
            <span className="ctd-head__party">
              <span className="ctd-head__role">{t(partyRoleKey(c.kind, "counterparty"))}</span>
              {counterparty ?? (
                /* A draft written before the other side was found. The LABEL
                   stays and the name becomes a dash — "Tenant: —" already says
                   the contract has a tenant-shaped hole in it, where the older
                   "Tenant: No tenant yet" said the word tenant twice. The dash
                   is this app's standing mark for a blank; see the timeline and
                   the payouts table. */
                <span className="ctd-head__none">—</span>
              )}
            </span>
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
                {/* END THE TENANCY — the other exit, and the one that did not
                    exist. Renewing above completes this contract by replacing
                    it; this completes it because the tenant simply left. Shown
                    only once the term has actually run out, because before that
                    the honest early exit is Cancel. See endTenancy in
                    _shared/contract-transitions. */}
                {canEndTenancy && (
                  <button
                    type="button"
                    className="pd-moreitem"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onEndTenancy();
                    }}
                  >
                    <Icon name="circle-check" size={17} />
                    {t("admin.ct.endTenancy")}
                  </button>
                )}
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
 * THE PARTIES: WHO IS ON THIS CONTRACT, AND ONE WAY TO REACH EACH OF THEM.
 *
 * The Terms card below names the same three people, and naming them is all it
 * does — a contract states who agreed to what, and a phone number is not a
 * term. But the reason somebody opens a contract on a Tuesday afternoon is
 * almost never to re-read the term: it is that rent is late, or a tap is
 * leaking, and what they need is to reach the tenant in the next two seconds.
 * That is why this sits ABOVE the document rather than inside it.
 *
 * REACHING THEM IS ONE BUTTON, NOT A CONTACT SHEET. The row used to print the
 * phone number and the email address under the name, with three buttons over
 * them. The digits were decoration dressed as data: they are edited on the
 * member record and belong there, and every one of the three buttons ended in
 * the same place — WhatsApp. So the row carries one green circle now.
 *
 * Under each customer, one line about what the PLATFORM has already said to
 * them on its own. It answers the question that otherwise gets asked by
 * ringing: "has anybody told them yet?"
 */

/**
 * One of the two customers, resolved off the member record behind them.
 *
 * The last three fields are optional and that is load-bearing: undefined means
 * "nobody has told us", which is a different thing from `false`. A tenant typed
 * onto the contract as an ExternalParty has no record to hold a preference, and
 * every reader has to treat that silence as the ordinary case rather than as a
 * person who refused.
 */
interface PartyContact {
  name: string;
  phone: string;
  email?: string;
  memberId?: string;
  /** Their chosen message language. `null` = follows the agency default. */
  msgLang?: Lang | null;
  whatsapp?: boolean;
  remindersOn?: boolean;
}

interface ContactParty {
  role: string;
  /** Colour of the role pill. Owner green, counterparty blue, agent amber. */
  tone: BadgeVariant;
  /** Which side of the contract this is, for the send modal. Absent on staff. */
  audience?: MsgAudience;
  name: string;
  /**
   * THEIR ACTUAL FACE, where the system holds one.
   *
   * Only agents do. Members are seeded with `img: null` on purpose — the office
   * does not photograph its customers — so a landlord's initial is not a
   * placeholder waiting for a picture, it is the whole of what we know. The
   * agent's portrait is the same file their profile and the property card show,
   * so the person who wrote the contract is recognisable at a glance and is
   * visibly one of us rather than a third customer.
   */
  img?: string | null;
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
  /** Staff, not a customer — quieter row, and the icon opens WhatsApp direct
      rather than the template composer, which is written about customers. */
  staff?: boolean;
  /**
   * Shown ONLY when the person chose a language of their own.
   *
   * The agency default is on the Messaging screen and repeating it on every
   * party line would make three rows carry the same word and say nothing. A
   * chip here means "this one is different", which is the only version of this
   * fact worth a reader's attention — and it is what stops somebody writing to
   * a Kurdish-speaking tenant in English by hand.
   */
  msgLang?: Lang | null;
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
 * Nothing else: no number, no address. Both were reprints of the member record
 * — read far more often than they were used, because using them means opening
 * WhatsApp, and the button does that in one click without anybody reading
 * eleven digits first. Reaching somebody is the icon on the right.
 *
 * That icon stays. Dropping it would look tidier and cost the office the thing
 * it opens this screen to do.
 */
function PartyLine({ party, basePath, onSend }: { party: ContactParty; basePath: string; onSend?: () => void }) {
  const { t } = useLang();
  const memberBase = basePath.replace(/\/contracts$/, "/members");
  const dialable = isDialable(party.phone);

  return (
    <li className={"ctd-pty" + (party.staff ? " ctd-pty--staff" : "")}>
      {/* THE FACE WHERE THERE IS ONE, the initial where there is not. Both are
          decorative — the name is right beside it — so neither is announced. */}
      {party.img ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img className="ctd-pty__avatar ctd-pty__avatar--photo" src={party.img} alt="" loading="lazy" />
      ) : (
        <span className="ctd-pty__avatar" aria-hidden="true">
          {party.name.trim().charAt(0) || "?"}
        </span>
      )}

      <div className="ctd-pty__body">
        {/* PILL ABOVE, NAME UNDER IT. Side by side they competed: the eye had to
            pass a coloured chip to reach the word it was looking for, and on a
            narrow card the name was the half that got clipped. Stacked, the
            chip is a label over the name it labels, and both are whole.

            The chips that qualify the pill — no account, writes in Kurdish —
            ride on its line, because they qualify the role and not the person. */}
        <span className="ctd-pty__top">
          <Badge variant={party.tone} size="sm">
            {party.role}
          </Badge>
          {party.external && party.name && <span className="ctd-pty__ext">{t("admin.pd.externalParty")}</span>}
          {party.msgLang && (
            <span className="ctd-pty__lang" title={t("admin.members.msgLangSet", { lang: t(`lang.${party.msgLang}`) })}>
              <Icon name="languages" size={12} />
              {t(`lang.${party.msgLang}`)}
            </span>
          )}
        </span>

        <span className="ctd-pty__name" title={party.name || undefined}>
          {party.memberId ? (
            <Link href={`${memberBase}/${encodeURIComponent(party.memberId)}`}>{party.name}</Link>
          ) : (
            party.name || t("admin.wa.party.unknown")
          )}
        </span>

        {party.note && (
          <span className={"ctd-pty__note" + (party.note.warn ? " ctd-pty__note--warn" : "")}>
            <Icon name={party.note.warn ? "triangle-alert" : "bell-ring"} size={13} />
            {party.note.text}
          </span>
        )}
      </div>

      {/* ONE ICON, AND IT IS WHATSAPP.

          There were three — WhatsApp, copy, compose — sitting over a line that
          printed the number and the address. Four ways to reach one person,
          stacked, when the office does exactly one of them: it opens WhatsApp.

          A customer's icon opens the composer, which fills the text in from a
          template and records that we sent it. The agent is staff, has no
          template written about him, and his goes straight to the chat. Same
          icon both times, because from the reader's side both mean the same
          thing: message this person.

          NOT GATED BEHIND canWrite, unlike everything else on this screen.
          Composing a message writes no contract, no invoice and no ledger
          line — it opens WhatsApp on the sender's own device and records that
          they did. */}
      <span className="ctd-pty__acts">
        {party.staff ? (
          <a
            className="ctd-pty__ic ctd-pty__ic--wa"
            href={dialable ? waLink(party.phone) : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!dialable}
            title={dialable ? t("admin.wa.action.whatsapp") : t("admin.wa.noPhone")}
            aria-label={t("admin.wa.action.whatsapp")}
          >
            <Icon name="message-circle" size={19} />
          </a>
        ) : (
          <button
            type="button"
            className="ctd-pty__ic ctd-pty__ic--wa"
            disabled={!dialable}
            title={dialable ? t("admin.wa.action.message") : t("admin.wa.noPhone")}
            aria-label={t("admin.wa.action.message")}
            onClick={onSend}
          >
            <Icon name="message-circle" size={19} />
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
  landlord: PartyContact;
  tenant: PartyContact | null;
  agent: { name: string; phone: string; email?: string; img?: string | null };
  basePath: string;
  onSend: (audience: MsgAudience) => void;
}) {
  const { t, lang } = useLang();
  const messages = useContractMessages(c.id);

  /* The next thing the platform will say to each side, or the last thing it
     did. Read off the same schedule the Messaging screen shows, so the two
     cannot disagree about one tenancy. */
  const noteFor = (audience: MsgAudience, who: PartyContact): ContactParty["note"] => {
    /* THE PERSON'S OWN RECORD FIRST, and in the order reachBlock decides — the
       same order the message log uses, so a tenancy explains itself the same
       way on both screens. A missing number, a number that is not on WhatsApp
       and somebody who asked not to be reminded all end the question here:
       telling the office when the next reminder is due would be a lie in all
       three cases. Only the last of them is a choice, so only it is not a
       warning. */
    const blocked = reachBlock(who);
    if (blocked === "noPhone") return { text: t("admin.wa.note.noNumber"), warn: true };
    if (blocked === "noWhatsapp") return { text: t("admin.wa.note.noWhatsapp"), warn: true };
    if (blocked === "optedOut") return { text: t("admin.wa.note.optedOut") };
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
     brand green, the other side is blue, and the agent is amber. Grey was
     wrong — grey is the colour this system uses for "nothing set yet", so the
     one row that is always filled in, by us, read as the unfinished one. On a
     screen where the two customers' names are the thing most often mixed up,
     the pill answers "which one is the tenant" before the name has been read. */
  const parties: ContactParty[] = [
    {
      role: t(c.kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord"),
      tone: "brand",
      audience: "landlord",
      name: landlord.name,
      phone: landlord.phone,
      email: landlord.email,
      memberId: landlord.memberId,
      msgLang: landlord.msgLang,
      note: lease ? noteFor("landlord", landlord) : undefined,
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
      msgLang: tenant.msgLang,
      external: !tenant.memberId,
      note: lease ? noteFor("tenant", tenant) : undefined,
    });
  }
  parties.push({
    role: t("admin.ct.f.agent"),
    tone: "warning",
    name: agent.name,
    phone: agent.phone,
    email: agent.email,
    staff: true,
    img: agent.img,
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
 * THE MONEY, as a labelled list with the total called out.
 *
 * ⚠ THIS IS THE LAYOUT FROM THE DESIGN, DELIBERATELY. It was built as a
 * quotation for a while — the agreed figure at display size, the charges
 * right-aligned under it, the total under a rule — on the argument that six
 * rows of equal weight buried the one number people come for. That argument
 * was wrong about this screen. A contract is not a quote: nobody is being sold
 * anything here, and the person reading is checking a specific term against
 * what they were told on the phone. For CHECKING, equal weight is the point —
 * you go down the list until you find your row — and a 34px lead figure just
 * put one term above the rest for no reason the reader shares.
 *
 * So: one row per term, an icon to find it by, the label on the left and the
 * figure on the right, and the only thing given weight is the total, because
 * the total is the only line that is ARITHMETIC rather than a term somebody
 * agreed. Same rows as Contract Dates, because they are the same kind of thing.
 */
function FinancialTerms({ c, onEdit, onAmend, canWrite }: { c: ContractRecord; onEdit: () => void; onAmend: () => void; canWrite: boolean }) {
  const { t, lang } = useLang();
  const editable = isEditable(c);
  const mgmt = managementFeeAmount(c);
  const cycles = cycleCount(c);
  const rent = c.kind === "rent";

  /* Built as data so the list holds its shape whether or not there is a
     deposit, a management fee, or a cycle to state. */
  type Term = { key: string; icon: IconName; label: string; value: string; note?: string };
  const terms: Term[] = [];

  terms.push({
    key: "price",
    icon: "banknote",
    label: t(rent ? "admin.ct.f.rentPerCycle" : "admin.ct.f.price"),
    value: formatMoney(lang, c.price),
  });
  if (rent && c.cycle) {
    terms.push({
      key: "cycle",
      icon: "repeat",
      label: t("admin.ct.f.frequency"),
      value: t(`admin.ct.cycle.${c.cycle}`),
    });
  }
  if (c.deposit) {
    terms.push({
      key: "deposit",
      icon: "shield-check",
      label: t("admin.ct.f.deposit"),
      value: formatMoney(lang, c.deposit),
    });
  }
  terms.push({
    key: "commission",
    icon: "percent",
    label: t("admin.ct.f.commission"),
    value: formatMoney(lang, c.commission),
    /* The rate sits BESIDE the figure, not under the label: it is the working
       for that number, and reading "$150.00 (2.5% of the price)" is one
       thought where a note on the other side of the row is two. */
    note: t(rent ? "admin.ct.rateOfCycle" : "admin.ct.rateOfPrice", { rate: fmtPercent(lang, c.commissionRate) }),
  });
  if (rent && c.managementFee) {
    terms.push({
      key: "mgmt",
      icon: "briefcase",
      label: t("admin.ct.f.managementFee"),
      value: formatMoney(lang, mgmt ?? c.price),
      note:
        c.managementFee.type === "percent"
          ? t("admin.ct.mgmtOfEach", { rate: fmtPercent(lang, c.managementFee.value) })
          : undefined,
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
      <dl className="ctd-trows">
        {terms.map((row) => (
          <div key={row.key} className="ctd-trow">
            <dt className="ctd-trow__label">
              <Icon name={row.icon} size={15} className="ctd-trow__ic" />
              {row.label}
            </dt>
            <dd className="ctd-trow__val">
              {row.value}
              {row.note && <span className="ctd-trow__note">{row.note}</span>}
            </dd>
          </div>
        ))}
      </dl>

      {/* A TENANCY'S TOTAL IS ARITHMETIC — rent times the number of cycles — so
          it is set apart and shows its working. A sale has no such line: the
          price at the top IS the total, and repeating it in a highlighted box
          would invent a sum out of one number. */}
      {rent && cycles > 0 && (
        <div className="ctd-total">
          <span className="ctd-total__label">{t("admin.ct.f.totalValue")}</span>
          <span className="ctd-total__figs">
            <span className="ctd-total__fig">{formatMoney(lang, contractValue(c))}</span>
            <span className="ctd-total__note">
              {t("admin.ct.f.totalWorking", {
                rent: formatMoney(lang, c.price),
                count: t("admin.ct.cyclesInTerm", { count: fmtNum(lang, cycles) }),
              })}
            </span>
          </span>
        </div>
      )}

      {/* Where the rent lands. Not a term either side agreed — it is how this
          office handles the money — but it decides whether this contract
          produces owner ledger lines at all, so it is stated rather than left
          for the reader to infer from the invoices. */}
      {rent && (
        <p className={"ctd-money__where" + (c.rentPaidTo === "agency" ? " is-agency" : "")}>
          <Icon name={c.rentPaidTo === "agency" ? "landmark" : "user-round"} size={15} />
          {t(`admin.ct.paidTo.${c.rentPaidTo}`)}
        </p>
      )}
    </SectionCard>
  );
}

/**
 * THE LIFE OF THE CONTRACT — the same rows, holding dates.
 *
 * ⚠ ALSO THE DESIGN'S LAYOUT, AND FOR THE SAME REASON. This spent a while as a
 * vertical timeline with connectors and a ringed "next" marker. It looked like
 * more thought and read like less: six dates is not a journey anybody follows
 * step by step, it is six facts you look one of up in. The connectors said
 * "sequence" about rows whose order is fixed and obvious, and the ring said
 * "expect this next" to a reader who came to check when the term ends.
 *
 * WHAT SURVIVED THE FLATTENING, because it was never decoration:
 *   · a missing date still says WHY it is missing — "Not signed yet" on a live
 *     contract, "Never" on a cancelled one, which are different facts.
 *   · a running tenancy still gets the bar. How far through the term you are is
 *     not written on any row: it is today's date measured against two of them,
 *     and making the reader do that arithmetic was the original complaint.
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
    steps.push({ key: "starts", label: t("admin.ct.f.startsOn"), iso: c.startsOn, icon: "calendar-arrow-up" });
    steps.push({ key: "ends", label: t("admin.ct.f.endsOn"), iso: c.endsOn, icon: "calendar-x" });
  }
  /* A cancellation is terminal and it is the last thing that happened, whenever
     in the sequence it fell. It goes at the end so the list ends on it. */
  if (c.cancelledOn) steps.push({ key: "cancelled", label: t("admin.ct.f.cancelledOn"), iso: c.cancelledOn, icon: "ban" });

  /* A CANCELLED CONTRACT HAS NOTHING COMING. A cancelled sale that was never
     signed will not be signed, so its empty dates read "Never" rather than
     "Not signed yet" — two different facts that looked identical while both
     were an em dash. */
  const abandoned = c.status === "cancelled";

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
      <dl className="ctd-trows">
        {steps.map((s) => (
          <div key={s.key} className="ctd-trow">
            <dt className="ctd-trow__label">
              <Icon name={s.icon} size={15} className="ctd-trow__ic" />
              {s.label}
            </dt>
            <dd className={"ctd-trow__val" + (s.iso ? "" : " is-empty")}>
              {s.iso ? fmtDate(lang, fromIso(s.iso)) : abandoned ? t("admin.ct.never") : (s.pending ?? "—")}
            </dd>
          </div>
        ))}
      </dl>

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
          <Link className="ctd-rcptlink" href={`/admin/receipts/deposit/${encodeURIComponent(c.id)}`}>
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

/**
 * The ⋯ on an invoice row.
 *
 * WHAT BELONGS BEHIND IT: the things you do to a demand rarely, and the one
 * that cannot be undone. Recording a payment stays on the line as a button with
 * words on it, because that is the job the screen exists for and it happens
 * every day; hiding the daily action behind a menu to keep the row tidy is the
 * wrong trade.
 *
 * ⚠ THE MENU IS NOT RENDERED WHEN IT WOULD BE EMPTY. A paid row can do nothing
 * — voiding is refused once money has arrived — and a ⋯ that opens onto nothing
 * is a promise the row cannot keep. The cell it lives in stays, so the chevron
 * after it keeps its column on every row; only the button goes.
 */
function RowMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div className="ctd-menu" ref={wrap} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={"ctd-menu__btn" + (open ? " is-open" : "")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="ellipsis" size={17} />
      </button>
      {open && (
        <div className="ctd-menu__list" role="menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

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
  onPostpone,
  onRemind,
  penaltyRaised,
}: {
  row: InvoiceRow;
  /** The contract's own facts the row needs to name both ends of the arrow:
      which words this contract uses for its sides, who the owner is, and what
      this agency is called on its own paperwork. */
  kind: ContractKind;
  ownerId: string;
  ownerName: string;
  agencyName: string;
  /** What has actually arrived against this demand, oldest first. Until this
      existed a payment was recorded and then vanished into an arithmetic —
      nothing in the app listed one, and there was nothing to print a receipt
      from. See the drawer below. */
  payments: PaymentRecord[];
  /** True on a tenancy the landlord collects himself — see the receipts. */
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
  /** Give this demand more time — the commonest thing asked of a rent row. */
  onPostpone: (invoice: InvoiceRecord) => void;
  /** Chase it, with its own figures in the message. */
  onRemind: (invoice: InvoiceRecord) => void;
  /** The late fee already raised against this row, if there is one. Its
      presence is what turns the offer below into a statement. */
  penaltyRaised?: InvoiceRecord;
}) {
  const { t, lang } = useLang();
  /* Open one row at a time, per row, in the row. Nothing outside it needs to
     know which drawer is open, and hoisting it to the card would close a row
     somebody left open every time the list re-rendered. */
  const [open, setOpen] = useState(false);

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
  const label = status === "overdue" ? t("admin.inv.overdueDays", { count: fmtNum(lang, row.lateDays) }) : t(`admin.inv.status.${status}`);

  /* THE OTHER END OF THE ARROW. Rent goes to the landlord, commission to us,
     and a tenancy deposit goes nowhere at all — see invoiceRecipient. */
  const to = invoiceRecipient(inv, kind, ownerName, agencyName);
  const partPaid = status !== "void" && owed.amount > 0 && owed.amount !== row.total.amount;
  const detailId = `ctd-inv-${inv.id}`;

  /* THE MONTH, NOT THE WHOLE LINE. The frozen description names the property
     and the kind on every one of twelve rent rows for one flat, and both are
     already on the page — see invoiceRowTitle. */
  const title = invoiceRowTitle(inv, kind, ownerId, t, lang);

  /* ⚠ THE DATE COLUMN IS ALWAYS THE DUE DATE, on every row, in every state.
     It used to switch to "Paid Jun 30 · Cash" once a demand was settled, and
     that broke the one thing a column is for: down twelve rows it was two
     different facts wearing the same place, so the dates could not be read as a
     schedule and the day a demand was actually owed disappeared the moment it
     was paid. WHEN THE MONEY ARRIVED IS ON THE RECEIPT, beside the paper that
     carries that date — which is the honest home for it, because the tenant's
     receipt and the landlord's routinely carry two different days. */
  const lastPaid = payments[payments.length - 1];

  /* How late the money actually was, once it has all arrived. Measured to the
     LAST payment, because a demand settled in instalments is not settled until
     the last one lands. Zero on anything still owed — the row is already saying
     that in red, and zero on a demand paid early. */
  const paidLateBy = status === "paid" && lastPaid ? Math.max(0, daysBetween(inv.dueOn, lastPaid.receivedOn)) : 0;
  const when = t("admin.ct.inv.due", { date: fmtDate(lang, fromIso(inv.dueOn)) });

  return (
    <div className={"ctd-row ctd-row--" + status + (open ? " is-open" : "")}>
      {/* The line itself opens the drawer, so the whole row is the target a
          mouse expects. The chevron is what a keyboard uses, and it carries the
          state — see the note on the toggle. */}
      <div className="ctd-row__main" onClick={() => setOpen((o) => !o)}>
        <span className="ctd-row__stripe" aria-hidden="true" />

        <span className="ctd-row__what">
          {/* WHAT KIND OF DEMAND THIS IS, in the same mark the filter chip for
              that kind carries — a calendar for rent, a wallet for the deposit,
              a percent for commission. It took over the job the block headings
              were doing before they came out: with three lists separated only
              by a gap, this is what tells you at a glance which list you have
              your eye on, and it does it on every row instead of once at the
              top. Decorative to a screen reader, because the title beside it
              already says "Insurance deposit". */}
          <Icon name={CATEGORY_ICON[inv.category]} size={14} className="ctd-row__kind" />
          <span className="ctd-row__titleline">
            <span className="ctd-row__title" title={invoiceLineText(inv.lines[0], t, lang)}>
              {title}
            </span>
            {/* THE NUMBER BELONGS BESIDE WHAT IT NUMBERS. It sat at the foot of
                the drawer, which meant the one identifier anybody quotes down a
                telephone was two clicks from the row it names. Quiet and
                monospaced: it is a label on the line, not a second title. */}
            {inv.number && <span className="ctd-row__no">{localizeDigits(lang, inv.number)}</span>}
          </span>
          {/* Only on a part-paid demand. Repeating the same figure on every
              other row would hide the one row it matters on. */}
          {partPaid && <span className="ctd-row__part">{t("admin.inv.stillOwed", { amount: formatMoney(lang, owed) })}</span>}
        </span>

        <span className="ctd-row__when ctd-num">
          {when}
          {status === "overdue" && (
            <>
              {" · "}
              <span className="ctd-row__late">{t("admin.inv.overdueDays", { count: fmtNum(lang, row.lateDays) })}</span>
            </>
          )}
        </span>

        {/* formatMoney, never formatApprox — an invoice total is what someone
            owes, and the column exists to be added up by eye. */}
        <span className="ctd-row__amt ctd-num">{formatMoney(lang, row.total)}</span>

        {/* ⚠ THE STATE AND THE ACTION ARE TWO COLUMNS, and they stay two. A
            button standing where the badge stands makes them read as one thing:
            then a row with nothing to do looks like a row whose button failed
            to load, and the schedule loses the one column you can run an eye
            down to see where the contract stands. */}
        <span className="ctd-row__status">
          <Badge variant={meta.variant} size="sm" dot={meta.dot} icon={meta.icon}>
            {label}
          </Badge>
        </span>

        <span className="ctd-row__act">
          {actionable && owed.amount > 0 && (
            /* THE WORDS STAY, THE WEIGHT GOES. An icon alone here — the
               banknote this row used to carry — does not say "record payment",
               it says "money, somehow", and this is the button the screen
               exists for. The icon belongs beside the words, where it is a
               marker rather than a riddle.

               ⚠ THE SAME BUTTON ON EVERY ROW, INCLUDING THE LATE ONE. It was
               filled green on an overdue row for a while, and that was the row
               shouting over itself: the stripe, the wash and the badge have all
               already said it is late, and a green button is a fourth voice
               saying the same thing louder — so the eye lands on the control
               instead of on the fact. Urgency is the row's job. This is the
               door, and a door looks the same wherever it is.

               A credit note is a reversal, not a demand — nothing to collect on
               it — so it offers nothing here at all. */
            <Button
              hierarchy="tertiary"
              size="sm"
              iconLeading="banknote"
              onClick={(e) => {
                e.stopPropagation();
                onRecordPayment(inv);
              }}
            >
              {t("admin.ct.recordPayment")}
            </Button>
          )}
        </span>

        {/* THE TWO ICON CONTROLS SHARE ONE CELL, so they read as a pair at the
            end of the row rather than as two more columns spaced like data. The
            rare-and-destructive menu first, then the chevron that opens the
            filing — and the chevron is last on every row, paid or not. */}
        <span className="ctd-row__end">
          {actionable && (
            <RowMenu label={t("admin.ct.row.moreActions")}>
              {/* "He asked for a week." Above Void because it is the answer far
                  more often — and because the two are opposites: one keeps the
                  demand alive, the other ends it. See PostponeInvoiceModal. */}
              {owed.amount > 0 && (
                <button type="button" role="menuitem" className="ctd-menu__item" onClick={() => onPostpone(inv)}>
                  <Icon name="calendar-clock" size={15} />
                  {t("admin.ct.row.postpone")}
                </button>
              )}

              {/* Chasing this demand, not writing to the contract in general:
                  the message opens on the reminder template with this invoice's
                  own figures in it. Addressed to whoever is billed — on a
                  landlord's commission that is the landlord, not the tenant. */}
              {owed.amount > 0 && (
                <button type="button" role="menuitem" className="ctd-menu__item" onClick={() => onRemind(inv)}>
                  <Icon name="message-circle" size={15} />
                  {t("admin.ct.row.remind")}
                </button>
              )}

              {/* ⚠ ONCE MONEY HAS ARRIVED, THE DEMAND CANNOT BE WITHDRAWN.
                  Voiding writes a credit note for the whole invoice, so doing it
                  here would reverse a charge while the cash sits in the account
                  — and a voided invoice drops out of every outstanding figure,
                  so the party who paid becomes a creditor nothing counts. The
                  store refuses it outright; the item says so rather than
                  disappearing, because a missing action is a thing somebody
                  hunts for. */}
              <button
                type="button"
                role="menuitem"
                className="ctd-menu__item ctd-menu__item--danger"
                disabled={settled}
                title={settled ? t("admin.ct.inv.voidBlocked") : undefined}
                onClick={() => onVoid(inv)}
              >
                <Icon name="ban" size={15} />
                {t("admin.fin.vi.action")}
              </button>
            </RowMenu>
          )}

          <button
            type="button"
            className="ctd-row__toggle"
            aria-expanded={open}
            aria-controls={detailId}
            aria-label={t(open ? "admin.ct.row.hideDetails" : "admin.ct.row.showDetails")}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
          >
            <Icon name="chevron-down" size={16} />
          </button>
        </span>
      </div>

      {/* ⚠ LATE RENT IS OFFERED, NEVER CHARGED — and the offer stays on the
          line, outside the drawer. The figure is calculated from the contract's
          own clause and shown beside a button; whether to enforce it against a
          tenant who is four days late for the first time in two years is a
          judgement somebody makes every single time. A system that raised the
          charge on its own would make that judgement by default, silently, in
          the agency's favour. There is no timer, no default handling, and no
          path to this that a person did not click — so it must not be behind
          one either. */}
      {actionable && status === "overdue" && penalty && !penaltyRaised && (
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

      {/* ⚠ ONE PENALTY PER LATE DEMAND. The offer used to keep standing after it
          had been taken — it was computed from the days late and knew nothing
          about what it had already produced — so pressing it again charged the
          tenant a second time for the same lateness, in an invoice that looked
          exactly as legitimate as the first. Now the row says what it did and
          names the charge, and the action itself refuses a duplicate. */}
      {penaltyRaised && (
        <div className="ctd-penalty ctd-penalty--done">
          <Icon name="circle-check" size={15} className="ctd-penalty__ic" />
          <span className="ctd-penalty__txt">
            {t("admin.ct.inv.penaltyRaised", {
              amount: formatMoney(lang, invoiceTotals(penaltyRaised).total),
              number: localizeDigits(lang, penaltyRaised.number || penaltyRaised.id),
            })}
          </span>
        </div>
      )}

      {/* THE DRAWER — everything that is filing rather than money. It used to
          be four bands on the face of a card, which is what made fifteen
          invoices unreadable: the parties are identical down a twelve-month
          schedule, the reference number is nobody's reason for opening the
          page, and the receipts belong beside the payment they were written
          for.

          THREE BANDS, EACH ONE A DIFFERENT KIND OF FACT: who the demand is
          between, what has arrived against it, and the paper for what arrived.
          The first version ran all three together as grey text on a grey slab,
          at one size and one weight — technically complete and unreadable. */}
      {open && (
        <div className="ctd-row__detail" id={detailId}>
          {/* Struck through is not an explanation. The reason travels with the
              row. */}
          {inv.status === "void" && inv.voidReason && <p className="ctd-voidnote">{inv.voidReason}</p>}

          {/* EVERY EXTENSION, oldest first. "Due Sep 30" tells you nothing;
              "was Aug 30, moved twice, because he asked for a week" tells you
              what you are dealing with — and is what a landlord asking why his
              rent is late has to be answered with. */}
          {inv.postponements && inv.postponements.length > 0 && (
            <ul className="ctd-moved">
              {inv.postponements.map((p, i) => (
                <li key={i} className="ctd-moved__row">
                  <Icon name="calendar-clock" size={14} className="ctd-moved__ic" />
                  <span className="ctd-moved__when">
                    {t("admin.ct.row.movedOn", {
                      from: fmtDate(lang, fromIso(p.from)),
                      to: fmtDate(lang, fromIso(p.to)),
                      on: fmtDate(lang, fromIso(p.on)),
                    })}
                  </span>
                  <span className="ctd-moved__why">{p.reason}</span>
                </li>
              ))}
            </ul>
          )}

          {/* WHO OWES WHOM — the one fact in here that appears nowhere else on
              the row. A labelled pair, not a sentence: the role is the small
              fixed part and the name carries the weight, because the name is
              what somebody opened the row to read.

              ⚠ THE INVOICE'S FROZEN LINE USED TO SIT ABOVE THIS and has been
              taken out. It read "Rent — Ankawa Tower Suite — Jul 2026": the
              month is the row's own title, the property is the page, and the
              kind is the block heading — three facts, all of them already on
              screen, in a sentence that looked like information. It is still
              the row's tooltip, which is where a document's exact wording
              belongs when somebody needs to read it back. */}
          {/* ⚠ ONE LINE, NOT A ROW OF LITTLE COLUMNS. The roles used to sit on
              top of the names as two stacked pairs, which built a small table
              out of four words and made the drawer open on a header rather than
              on a sentence. Read across now: role, colon, name, arrow, role,
              colon, name — and the issue date rides on the same line, because
              it is another fact about this same demand and did not deserve a
              line of its own.

              The due date is NOT here — the row carries it on every line, in a
              column you can read down. What the row cannot say is the gap
              between that date and the day the money came, and nobody should
              have to subtract two dates by eye to find out a tenant paid three
              weeks late. */}
          <div className="ctd-row__facts">
            <dl className="ctd-parties">
              <div className="ctd-parties__one">
                <dt>{t(partyRoleKey(kind, side))}</dt>
                <dd>{inv.billTo.name}</dd>
              </div>
              {to ? (
                <>
                  <Icon name="arrow-right" size={15} className="ctd-parties__arrow" />
                  <div className="ctd-parties__one">
                    <dt>{t(to.roleKey)}</dt>
                    <dd>{to.name}</dd>
                  </div>
                </>
              ) : (
                /* A tenancy deposit has no second party: it is the tenant's own
                   money in our account until the lease closes. An arrow back to
                   the person who paid it would claim something that is not
                   true. */
                <span className="ctd-parties__held">{t("admin.ct.inv.held")}</span>
              )}
            </dl>
            {inv.issuedOn && <span className="ctd-inv__issued">{t("admin.ct.inv.issued", { date: fmtDate(lang, fromIso(inv.issuedOn)) })}</span>}
            {paidLateBy > 0 && <span className="ctd-row__late">{t("admin.ct.row.paidLate", { count: fmtNum(lang, paidLateBy) })}</span>}
          </div>

          {/* ⚠ THE PAYMENT LINE APPEARS ONLY WHEN IT SAYS SOMETHING THE ROW DOES
              NOT. On the ordinary case — one payment, in full — the row already
              reads "$3,400.00 · Paid Jun 30 · Cash", and repeating it a line
              lower with a tick in front of it is the same sentence twice. It
              earns its place when there is more than one instalment of cash, or
              when what arrived is not what was demanded; then the amounts and
              the dates genuinely differ and each one needs saying. */}
          {/* ⚠ ONE INSTALMENT, ONE GROUP — the money and the papers it produced,
              together. They used to be two separate runs: every payment listed
              first, then every receipt listed after. On a demand settled in two
              halves that gave four receipt lines in a row, all four reading
              "Jun 30, 2026 · Cash", with nothing saying which paper belonged to
              which half of the money. The file was complete and unreadable.

              A rule above each group after the first is what does the
              separating, because these blocks are genuinely alike and nothing
              short of a line tells them apart. */}
          {payments.length > 1 && (
            <p className="ctd-instal">{t("admin.ct.rcpt.instalments", { count: fmtNum(lang, payments.length) })}</p>
          )}

          {/* THE PAPERS — one line each, not a card each.

              They were two bordered tiles carrying an icon in a box, the party's
              name and the payment date, which is four repetitions of facts that
              are already on the row and in the parties above — and they pushed
              the two buttons that matter down and apart. A receipt needs to say
              which of the two it is and give you the two things you do with it.

              TWO PAPERS FOR ONE MONTH'S RENT — the payer's and the landlord's.
              The second is here only where the landlord took the money himself;
              where the agency took it, his paper is the payout receipt, printed
              on the day it is handed over. Either way both halves of the file
              exist. */}
          {payments.map((p) => (
            <div className="ctd-paygroup" key={p.id}>
              {/* ⚠ ALWAYS, NOT ONLY ON INSTALMENTS. It used to appear only when
                  a demand was settled in more than one handful of cash, which
                  gave the drawer two different shapes: on instalments the money
                  led and the receipt under it was bare, on a single payment
                  there was no money line and the date hung off the receipt
                  instead. The same facts, arranged two ways, for no reason a
                  reader could see.

                  It earns its place on every payment because the row above does
                  NOT carry these facts. The row says what was demanded, when it
                  FELL DUE, and that it is paid — it never says the day the money
                  actually arrived or how it came. This line is the only place
                  either of those is written down. */}
              <div className="ctd-pay">
                <Icon name="circle-check" size={16} className="ctd-pay__ic" />
                <span className="ctd-pay__amt">{formatMoney(lang, p.receivedAmount)}</span>
                <span className="ctd-pay__rest">
                  {t("admin.ct.row.receivedOn", {
                    date: fmtDate(lang, fromIso(p.receivedOn)),
                    method: t(`admin.fin.method.${p.method}`),
                  })}
                </span>
              </div>

              <div className="ctd-rcpt">
                <Icon name="receipt-text" size={16} className="ctd-rcpt__ic" />
                {/* NAMED FOR WHOEVER PAID, which is not always the tenant: the
                    landlord's commission is paid by the landlord. See
                    payerReceiptKey. */}
                <span className="ctd-rcpt__name">{t(payerReceiptKey(kind, side))}</span>
                {/* ⚠ NO DATE HERE. The payment line directly above already reads
                    "$150.00 received Jun 30, 2026 · Cash" — the day and the
                    method belong to the money, not to the paper, and printing
                    them again one line down was the same sentence twice. The
                    landlord's receipt below DOES carry a date, because his is a
                    different day: the day he came in and collected. */}
                <ReceiptActions href={`/admin/receipts/payment/${encodeURIComponent(p.id)}`} fileStem={`receipt-${p.id}`} />
              </div>

              {/* ⚠ HIS PAPER IS MADE WHEN HE TAKES THE MONEY, NOT WHEN THE
                  TENANT PAYS. The two happen on different days — the tenant
                  hands it over on the 1st and the landlord is not in the office
                  until the 9th — so issuing his receipt alongside the tenant's
                  would put a date on a paper he signs saying he received
                  something a week before he did.

                  Until somebody records that day the line NAMES THE GAP instead
                  of offering a second paper: the file is genuinely incomplete,
                  and a row that looks like the tenant's receipt claims it is
                  not. His date is the one date worth printing here, because it
                  is the only one that is not already on the row. */}
              {landlordCollects && inv.payee === "owner" && (
                <div className={"ctd-rcpt" + (p.ownerReceiptedOn ? "" : " ctd-rcpt--pending")}>
                  <Icon name={p.ownerReceiptedOn ? "receipt-text" : "clock"} size={16} className="ctd-rcpt__ic" />
                  <span className="ctd-rcpt__name">{t("admin.rc.forLandlord")}</span>
                  {p.ownerReceiptedOn ? (
                    <>
                      <span className="ctd-rcpt__meta">
                        {t("admin.ct.rcpt.collectedOn", { date: fmtDate(lang, fromIso(p.ownerReceiptedOn)) })}
                      </span>
                      <ReceiptActions href={`/admin/receipts/landlord/${encodeURIComponent(p.id)}`} fileStem={`receipt-landlord-${p.id}`} />
                    </>
                  ) : (
                    <>
                      <span className="ctd-rcpt__meta">{t("admin.ct.rcpt.notCollectedShort")}</span>
                      <button type="button" className="ctd-rcpt__make" onClick={() => onReceiptOwner(p)}>
                        <Icon name="plus" size={14} />
                        {t("admin.ct.rcpt.markCollected")}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

        </div>
      )}
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
  onPostpone,
  onRemind,
  penaltyRaisedFor,
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
  onPostpone: (invoice: InvoiceRecord) => void;
  onRemind: (invoice: InvoiceRecord) => void;
  /** The late fee raised against one demand, if any — see the penalty strip. */
  penaltyRaisedFor: (invoice: InvoiceRecord) => InvoiceRecord | undefined;
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

  /* Unfolding is PER BLOCK, not across the card. A single global limit cut the
     list off after four rows, which on a tenancy meant the commission and the
     deposit were hidden behind "Show 9 more" — a whole kind of demand missing
     because another kind had a long schedule. What folds now is only the run of
     months nobody can act on yet; see foldNotDue. */
  const [expanded, setExpanded] = useState<InvoiceCategory[]>([]);
  const toggle = (category: InvoiceCategory) =>
    setExpanded((open) => (open.includes(category) ? open.filter((c) => c !== category) : [...open, category]));

  /* ---- the strip across the head of the card ----
     Derived from the rows it sits above, every render, so it cannot disagree
     with them. VOID DEMANDS ARE EXCLUDED: a withdrawn charge was never owed.
     A credit note stays in, carrying its negative total, because it is how a
     demand gets reduced — leaving it out would show money as invoiced that the
     office has already agreed not to collect. Single-currency, like every other
     total in this app; one contract raises one currency. */
  const summary = useMemo(() => {
    const currency = rows[0]?.total.currency ?? PLATFORM_CURRENCY;
    const live = rows.filter((r) => r.invoice.status === "issued");
    const invoiced = sumMoney(live.map((r) => r.total), currency);
    const collected = sumMoney(live.flatMap((r) => paymentsFor(r.invoice.id).map((p) => p.amount)), currency);
    const owed = sumMoney(live.map((r) => owedFor(r.invoice)), currency);

    /* The soonest demand with money still on it — the one the office has to
       think about next. Read by date rather than by list position, so it stays
       right whatever order the rows arrive in. */
    const nextDue = live
      .filter((r) => owedFor(r.invoice).amount > 0)
      .reduce<string | null>((soonest, r) => (soonest === null || r.invoice.dueOn < soonest ? r.invoice.dueOn : soonest), null);

    return { invoiced, collected, owed, dueInDays: nextDue === null ? null : daysBetween(ANCHOR_ISO, nextDue) };
  }, [rows, paymentsFor, owedFor]);

  /* Zero and one get words: "0 days" and "1 days" are both wrong, and "today"
     is what somebody would say out loud. Past due counts up instead of down. */
  const nextDueLabel = (() => {
    const d = summary.dueInDays;
    if (d === null) return t("admin.ct.inv.sum.nothingDue");
    if (d < 0) return d === -1 ? t("admin.ct.inv.sum.lateOne") : t("admin.ct.inv.sum.late", { count: fmtNum(lang, -d) });
    if (d === 0) return t("admin.ct.inv.sum.dueToday");
    if (d === 1) return t("admin.ct.inv.sum.dueTomorrow");
    return t("admin.ct.inv.sum.dueIn", { count: fmtNum(lang, d) });
  })();

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
      {/* THE FIGURES THE ROWS ADD UP TO, above the rows. Somebody opening this
          card wants one of two things: a particular demand, or the state of the
          money as a whole — and the second used to mean reading every line and
          adding it up by eye. Invoiced, collected and outstanding are the same
          three numbers the list holds, summed; they cannot drift from it,
          because nothing here is stored. */}
      <dl className="ctd-invsum" aria-label={t("admin.ct.inv.sum.aria")}>
        <div className="ctd-invsum__cell">
          <dt>{t("admin.ct.inv.sum.invoiced")}</dt>
          <dd className="ctd-num">{formatMoney(lang, summary.invoiced)}</dd>
        </div>
        <div className="ctd-invsum__cell">
          <dt>{t("admin.ct.inv.sum.collected")}</dt>
          {/* Green only when money has actually arrived: a green $0.00 reads as
              a success that has not happened. */}
          <dd className={"ctd-num" + (summary.collected.amount > 0 ? " is-good" : "")}>{formatMoney(lang, summary.collected)}</dd>
        </div>
        <div className="ctd-invsum__cell">
          <dt>{t("admin.ct.inv.sum.outstanding")}</dt>
          <dd className={"ctd-num" + (summary.owed.amount > 0 ? " is-owed" : "")}>
            {summary.owed.amount > 0 ? formatMoney(lang, summary.owed) : t("admin.ct.sum.settled")}
          </dd>
        </div>
        <div className="ctd-invsum__cell">
          <dt>{t("admin.ct.inv.sum.nextDue")}</dt>
          {/* A DISTANCE, NOT A DATE. The date is on the row this points at; what
              this cell answers is "how long have I got", which is the question a
              date makes you work out. */}
          <dd className={"ctd-num" + (summary.dueInDays !== null && summary.dueInDays < 0 ? " is-owed" : "")}>{nextDueLabel}</dd>
        </div>
      </dl>

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
          /* Only the not-yet-due run folds, and only when there is enough
             behind it to be worth a click. Everything overdue, due, paid or
             void stays on the page whatever happens. */
          const { before, folded, after } = foldNotDue(g.rows, cancelled);
          const shown = open ? g.rows : [...before, ...after];
          const renderRow = (r: InvoiceRow) => (
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
              onPostpone={onPostpone}
              onRemind={onRemind}
              penaltyRaised={penaltyRaisedFor(r.invoice)}
            />
          );
          return (
            /* ⚠ NO HEADING. Every kind was named three times on one card: in the
               filter chips above, which also carry the count and a dot when
               something in the kind is pressing; in a serif heading with the
               same word and the same count; and in the rows themselves, which
               each say what they are — "Insurance deposit", "Tenant's
               commission", "Jun 2026 rent".

               The third naming was the one that cost the most, because the
               shape of a tenancy is fixed: one deposit and two commissions,
               every time. So on every contract in the system a heading and a
               count badge reading "1" sat over a single row that already said
               the same word. The gap between the blocks separates them, the
               chips name them, the rows label themselves.

               The block is still a <section>, and still per category — that is
               what keeps the deposit in the same place on every contract and
               keeps the fold local to the run of rent it belongs to. */
            <section className="ctd-invgroup" key={g.category} aria-label={t(`admin.inv.cat.${g.category}`)}>
              <div className="ctd-rows">
                {shown.map(renderRow)}

                {/* THE FOLD SITS AT THE FOOT OF THE BLOCK, not among the rows.
                    It used to open where the hidden months belong, which put a
                    grey band between the unpaid demands and the paid ones and
                    read as a divider inside the schedule rather than as the end
                    of it. The rows themselves still land in urgency order when
                    it opens.

                    ⚠ IT IS A LINK, AND IT SAYS ONLY WHAT IT DOES. It was a grey
                    bar carrying a count, a date and the total of the months
                    behind it — a sum of rent nobody has been asked for yet,
                    printed in the one place on the card where every other
                    figure is money that was actually demanded. Two ways to read
                    it, one of them wrong, and the fold is not a line of the
                    schedule anyway: it is a control for looking at the rest of
                    it. So it is two words on the card's own white. */}
                {folded.length > 0 && (
                  /* The strip is what carries the divider and the alignment;
                     the link inside it is only as wide as its own words, so the
                     cursor turns into a hand over the thing that is actually
                     clickable and nowhere else. A full-width button underlined
                     its label from 800px away. */
                  <div className="ctd-foldrow">
                    <button type="button" className="ctd-fold" aria-expanded={open} onClick={() => toggle(g.category)}>
                      {t(open ? "admin.ct.row.showLess" : "admin.ct.row.showAll")}
                      {/* Trailing, so the WORDS line up with the invoice titles
                          above rather than the arrow doing it. */}
                      <Icon name="chevron-down" size={14} />
                    </button>
                  </div>
                )}
              </div>
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
                    <Link className="ctd-rcptlink" href={`/admin/receipts/payout/${encodeURIComponent(entry.id)}`}>
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
  contractId,
  payments,
  invoiceById,
  ledger,
  landlordCollects,
  kind,
  ownerId,
  basePath,
  canWrite,
}: {
  contractId: string;
  payments: PaymentRecord[];
  invoiceById: (id: string) => InvoiceRecord | undefined;
  ledger: OwnerLedgerEntry[];
  landlordCollects: boolean;
  /** So a receipt is filed under whoever actually paid — see payerReceiptKey. */
  kind: ContractKind;
  ownerId: string;
  /** So the printable contract links on whichever surface this is. */
  basePath: string;
  /** Upload and Remove are absent, not disabled, on a read-only surface. */
  canWrite: boolean;
}) {
  const { t, lang } = useLang();
  const files = useContractFiles(contractId);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<ContractFile | null>(null);

  /** A printed paper: what it is, what it was worth, and the day it was made. */
  type Doc = { id: string; href: string; who: string; what: string; on: string; amount: Money; stem: string };
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
      /* WHAT ARRIVED, not what was billed: a dollar invoice settled in cash
         dinars produced a dinar receipt, and that is the figure on the paper. */
      amount: p.receivedAmount,
      stem: `receipt-${p.id}`,
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
        amount: p.receivedAmount,
        stem: `receipt-landlord-${p.id}`,
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
      /* A payout is stored negative — it REDUCES what we owe him. The receipt
         in his hand says how much he took, so the sign is dropped here. */
      amount: isNegative(e.amount) ? multiply(e.amount, -1) : e.amount,
      stem: `receipt-payout-${e.id}`,
    });
  }
  docs.sort((a, b) => b.on.localeCompare(a.on));

  return (
    <>
      <SectionCard title={t("admin.ct.documents")} desc={t("admin.ct.documentsDesc")} id="documents">
        {/* ---------- FILED BY A PERSON ---------- */}
        <div className="ctd-grp">
          <div className="ctd-grp__head">
            <div className="ctd-grp__titles">
              <h3 className="ctd-grp__title">
                {t("admin.ct.doc.filesTitle")}
                {files.length > 0 && <span className="ctd-grp__count">{fmtNum(lang, files.length)}</span>}
              </h3>
              <p className="ctd-grp__desc">{t("admin.ct.doc.filesDesc")}</p>
            </div>
            {canWrite && (
              <Button hierarchy="secondary" size="sm" iconLeading="upload" onClick={() => setUploading(true)}>
                {t("admin.ct.doc.upload")}
              </Button>
            )}
          </div>

          {files.length === 0 ? (
            /* The empty state NAMES THE PAPERS rather than saying "no files".
               A person who has never used this tab does not know what belongs
               in it, and an empty box that only reports its own emptiness
               teaches them nothing. */
            <div className="ctd-fempty">
              <span className="ctd-fempty__ic">
                <Icon name="paperclip" size={18} />
              </span>
              <span className="ctd-fempty__txt">
                <span className="ctd-fempty__title">{t("admin.ct.doc.filesEmpty")}</span>
                <span className="ctd-fempty__hint">{t("admin.ct.doc.filesEmptyHint")}</span>
              </span>
            </div>
          ) : (
            <ul className="ctd-files">
              {files.map((f) => (
                <FileRow key={f.id} file={f} canWrite={canWrite} onOpen={() => setViewing(f)} />
              ))}
            </ul>
          )}
        </div>

        {/* ---------- PRINTED BY THE SYSTEM ----------
            The second list, and never merged with the first: a row here is a
            view of money that already moved, so it cannot be edited, cannot be
            deleted, and carries no uploader.

            ⚠ SAME ROW AS THE FILES ABOVE. It has been three shapes now — a
            tinted block, then a ruled statement with a date column down the
            left and a green banner over it — and both of those made a Documents
            tab that read as two unrelated screens stacked. A document is a
            document: one row shape, one place for the date, one place for the
            actions, and the ONLY difference is what each row can do. A file can
            be opened and deleted; a printed paper can be printed and downloaded.
            That difference lives in the buttons, which is where a difference in
            what something DOES belongs — not in the furniture around it. */}
        <div className="ctd-grp">
          <div className="ctd-grp__head">
            <div className="ctd-grp__titles">
              <h3 className="ctd-grp__title">
                {t("admin.ct.doc.printedTitle")}
                <span className="ctd-grp__count">{fmtNum(lang, docs.length + 1)}</span>
              </h3>
              <p className="ctd-grp__desc">{t("admin.ct.doc.printedDesc")}</p>
            </div>
          </div>

          <ul className="ctd-files">
            {/* The contract itself — an ordinary row like the rest. It used to
                be a dashed grey "not available yet"; the printable document has
                existed since app/admin/contracts/[id]/print was written. It
                carries no amount and no date because it is the paper the others
                descend FROM, and it names its own sheet: the contract document
                is .cd-sheet where every receipt is .rc-sheet. */}
            <li className="ctd-file">
              <span className="ctd-file__open ctd-file__open--static">
                <span className="ctd-file__ic">
                  <Icon name="file-text" size={17} />
                </span>
                <span className="ctd-file__txt">
                  <span className="ctd-file__name">{t("admin.ct.doc.contract")}</span>
                  <span className="ctd-file__meta">{t("admin.ct.doc.contractReady")}</span>
                </span>
              </span>
              <ReceiptActions
                href={`${basePath}/${encodeURIComponent(contractId)}/print`}
                fileStem={`contract-${contractId}`}
                sheet=".cd-sheet"
              />
            </li>

            {docs.map((d) => (
              <li key={d.id} className="ctd-file">
                <span className="ctd-file__open ctd-file__open--static">
                  <span className="ctd-file__ic">
                    <Icon name="printer" size={17} />
                  </span>
                  <span className="ctd-file__txt">
                    <span className="ctd-file__name">{d.who}</span>
                    <span className="ctd-file__meta">{d.what}</span>
                  </span>
                  {/* THE FIGURE THE PAPER CARRIES, then the day it was made —
                     the same end of the row the file rows put their chip on. */}
                  <span className="ctd-file__amt">{formatMoney(lang, d.amount)}</span>
                  <span className="ctd-file__on">{fmtDate(lang, fromIso(d.on))}</span>
                </span>
                <ReceiptActions href={d.href} fileStem={d.stem} />
              </li>
            ))}
          </ul>

          {docs.length === 0 && <p className="ctd-grp__note">{t("admin.ct.documentsEmpty")}</p>}
        </div>
      </SectionCard>

      {uploading && <UploadFileModal contractId={contractId} onClose={() => setUploading(false)} />}
      {viewing && <FileViewerModal file={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}

/**
 * One filed paper.
 *
 * ⚠ THE ROW OPENS THE FILE. That is the whole row's job, and it is why there is
 * no longer a download button sitting on it: for a while the only thing you
 * could do to a filed scan was take a copy of it, so checking whether the right
 * PDF had been uploaded meant saving a tenant's ID onto your own laptop and
 * opening it there. Looking is the common act; copying is the rare one. Looking
 * is now the row, and copying lives inside the viewer, behind the look.
 *
 * REMOVE STAYS ON THE ROW, because it is the one action you take on a file
 * WITHOUT wanting to see it — the duplicate you just uploaded twice. It is a
 * button rather than part of the row target, so the destructive action is never
 * what a stray click lands on.
 */
function FileRow({
  file,
  canWrite,
  onOpen,
}: {
  file: ContractFile;
  canWrite: boolean;
  onOpen: () => void;
}) {
  const { t, lang } = useLang();
  const size = fileSize(file.bytes);

  return (
    <li className="ctd-file">
      <button type="button" className="ctd-file__open" onClick={onOpen}>
        <span className="ctd-file__ic">
          <Icon name={fileIcon(file)} size={17} />
        </span>
        <span className="ctd-file__txt">
          <span className="ctd-file__name">{file.name}</span>
          <span className="ctd-file__meta">
            {t("admin.ct.doc.addedMeta", {
              who: file.addedBy,
              date: fmtDate(lang, fromIso(file.addedOn)),
              size: t(size.unit === "mb" ? "admin.ct.doc.mb" : "admin.ct.doc.kb", {
                n: size.unit === "mb" ? localizeDigits(lang, String(size.n)) : fmtNum(lang, size.n),
              }),
            })}
          </span>
        </span>
        <span className="ctd-file__kind">{t(`admin.ct.doc.kind.${file.kind}`)}</span>
      </button>
      {canWrite && (
        <button
          type="button"
          className="ctd-file__btn ctd-file__btn--danger"
          title={t("admin.ct.doc.remove")}
          aria-label={t("admin.ct.doc.remove")}
          onClick={() => {
            if (window.confirm(t("admin.ct.doc.removeConfirm", { name: file.name }))) removeContractFile(file.id);
          }}
        >
          <Icon name="trash-2" size={16} />
        </button>
      )}
    </li>
  );
}

/* ---------------- activity ---------------- */

/**
 * ⚠ THE HISTORY IS DERIVED FROM THE RECORDS, NOT READ FROM THE AUDIT LOG.
 *
 * This tab used to filter the platform audit log down to the ids this contract
 * owns — which is correct in principle and showed NOTHING in practice, because
 * the log only holds what somebody did IN THIS BROWSER SINCE IT LOADED. Every
 * seeded contract has a full life behind it — written, signed, keys handed
 * over, twelve invoices raised, twelve rents taken, the landlord paid each
 * month — and not one of those wrote an audit entry, because they did not
 * happen in a session. So a tenancy a year into its term showed an empty tab
 * under the words "everything that has happened to this contract".
 *
 * The records themselves know all of it. `signedOn` is when it was signed;
 * `issuedOn` is when an invoice was raised; `receivedOn` is when rent arrived.
 * Reading the history out of those is not a workaround — it is the only source
 * that cannot disagree with the screens beside it, and it needs no seeding, no
 * migration and no trust in a log that has been running for eight seconds.
 *
 * The audit log is still merged on top, so a payment recorded a minute ago
 * appears next to the twelve before it. Where the two would describe the same
 * event, the derived line wins: it carries the amount, and the log line does
 * not.
 *
 * ⚠ IT SHOWS THE MONEY. Every invoice, every payment, every payout. There was a
 * version of this that filtered the repeating four out, on the theory that a
 * twelve-month tenancy would drown its own history in them — but "created,
 * signed, invoiced, paid, paid, paid" IS the history of a tenancy, and a
 * payment line carrying its month and its figure is not noise. Filtering it
 * left the tab emptier than the complaint that prompted the filter.
 */

/** One line on the timeline, whatever record it came out of. */
type ActEvent = {
  id: string;
  /** ISO date or timestamp — sorted on, so both forms must be comparable. */
  at: string;
  title: string;
  detail?: string;
  /** Who did it, where the record knows. Absent is normal on derived lines. */
  who?: string;
  icon: IconName;
  tone: "neutral" | "success" | "info" | "warning" | "error";
};

/**
 * The look of an audit-log line, for the events that still come from there.
 *
 * Tone is the EVENT'S MEANING, not its category — a signature and a completion
 * are both green because both are the contract going right, a void and a
 * cancellation both red because both are it going wrong. A reader scanning the
 * column of dots should find the bad day without reading.
 */
const ACT_LOOK: Record<string, { icon: IconName; tone: ActEvent["tone"] }> = {
  "audit.action.createdContract": { icon: "file-plus", tone: "neutral" },
  "audit.action.addedContract": { icon: "file-plus", tone: "neutral" },
  "audit.action.updatedContract": { icon: "pencil", tone: "neutral" },
  "audit.action.signedContract": { icon: "file-check", tone: "success" },
  "audit.action.completedContract": { icon: "circle-check", tone: "success" },
  "audit.action.settledEarly": { icon: "fast-forward", tone: "success" },
  "audit.action.closedDeposit": { icon: "shield-check", tone: "success" },
  "audit.action.recordedPayment": { icon: "banknote", tone: "success" },
  "audit.action.issuedInvoice": { icon: "receipt", tone: "neutral" },
  "audit.action.ownerReceipted": { icon: "printer", tone: "neutral" },
  "audit.action.paidOwner": { icon: "hand-coins", tone: "info" },
  "audit.action.amendedContract": { icon: "file-pen", tone: "info" },
  "audit.action.refunded": { icon: "undo-2", tone: "info" },
  "audit.action.ownerExpense": { icon: "wrench", tone: "info" },
  "audit.action.overrodeCommission": { icon: "percent", tone: "warning" },
  "audit.action.postponedInvoice": { icon: "calendar-clock", tone: "warning" },
  "audit.action.addedLatePenalty": { icon: "triangle-alert", tone: "warning" },
  "audit.action.depositClaim": { icon: "shield-alert", tone: "warning" },
  "audit.action.cancelledContract": { icon: "ban", tone: "error" },
  "audit.action.voidedInvoice": { icon: "file-x", tone: "error" },
};

/**
 * WHAT HAPPENED TO THIS CONTRACT, AND WHO DID IT.
 *
 * ⚠ THE SAME TIMELINE AS THE PROPERTY AND MEMBER SCREENS. This was a thinner
 * thing of its own — a 9px dot on a hairline thread — so the console held two
 * pictures of one idea and a reader had to learn each screen's version. It is
 * now the dot-and-thread the rest of the admin uses.
 *
 * ⚠ READ-ONLY AND UNEDITABLE. A history somebody can tidy is not a history.
 */
function Activity({ events }: { events: ActEvent[] }) {
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
      <ol className="ctd-tline">
        {events.map((e) => (
          <li className={`ctd-tli ctd-tli--${e.tone}`} key={e.id}>
            <span className="ctd-tli__dot" aria-hidden="true">
              <Icon name={e.icon} size={13} strokeWidth={2.2} />
            </span>
            <div className="ctd-tli__body">
              <div className="ctd-tli__top">
                <span className="ctd-tli__title">{e.title}</span>
                <span className="ctd-tli__time">{fmtDate(lang, fromIso(e.at.slice(0, 10)))}</span>
              </div>
              {e.detail && <p className="ctd-tli__desc">{e.detail}</p>}
              {e.who && <span className="ctd-tli__who">{e.who}</span>}
            </div>
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
  const ds = contractDisplayStatus(c);
  const st = STATUS_META[ds];
  const owed = outstandingNow.amount > 0;

  return (
    /* pd-grid__aside is the property screen's own sticky column — same width,
       same 1180px collapse. This screen already imports that stylesheet. */
    <aside className="pd-grid__aside ctd-rail" aria-label={t("admin.ct.summary")}>
      <div className="ctd-rail__card">
        <div className={"ctd-rail__state ctd-rail__state--" + ds}>
          {/* A draft carries a dot rather than an icon in STATUS_META, because
              at badge size it is a colour and not a picture. At this size it
              needs one, and the honest one is the pen: a draft is a document
              somebody is still writing. */}
          <span className="ctd-rail__stateic">
            <Icon name={st.icon ?? "file-pen"} size={19} />
          </span>
          <div className="ctd-rail__statetext">
            <span className="ctd-rail__statename">{t(`admin.ct.status.${ds}`)}</span>
            <p className="ctd-rail__statenote">{t(`admin.ct.sum.note.${ds}`)}</p>
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
  const [postponeTarget, setPostponeTarget] = useState<InvoiceRecord | null>(null);
  /* Which demand a reminder is about. Separate from `sendTo`, which only says
     WHO the modal opens on — a message can be sent to the tenant about the
     contract as a whole, and that is not this. */
  const [remindAbout, setRemindAbout] = useState<InvoiceRecord | null>(null);
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
  const [endingTenancy, setEndingTenancy] = useState(false);
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

  /* The late fee this row has ALREADY produced, if any. A voided one does not
     count: withdrawing the charge is how somebody says "not this time", and the
     row goes back to offering it. */
  const penaltyRaisedFor = useCallback(
    (invoice: InvoiceRecord) => invoices.find((i) => i.penaltyForInvoiceId === invoice.id && i.status !== "void"),
    [invoices],
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

  /* The files a person filed, counted alongside the papers the system prints
     so the tab badge matches what the tab actually holds. */
  const contractFiles = useContractFiles(contract?.id ?? "");

  const docCount = useMemo(
    () =>
      /* +1 for the contract itself, which is always there. */
      1 +
      contractFiles.length +
      contractPayments.length +
      contractPayments.filter((p) => p.ownerReceiptedOn).length +
      ownerEntries.filter((e) => e.kind === "payout").length,
    [contractFiles, contractPayments, ownerEntries],
  );

  /**
   * THIS CONTRACT'S HISTORY, BUILT FROM ITS OWN RECORDS.
   *
   * See the note on Activity for why this is not read out of the audit log:
   * the log only holds this session, and every seeded contract's whole life
   * happened before it. Each record carries the date its event happened, so
   * the history is assembled from those and cannot disagree with the tabs
   * beside it.
   *
   * Ordered NEWEST FIRST, like every other list in this console — the thing
   * somebody opens a year-old tenancy to check is what happened last, not what
   * happened first.
   */
  const contractEvents = useMemo<ActEvent[]>(() => {
    if (!contract) return [];
    const out: ActEvent[] = [];
    const money = (m: Money) => formatMoney(lang, m);

    /* ---- the contract's own life ---- */
    out.push({
      id: "c-created",
      at: contract.createdOn,
      title: t("admin.ct.act.created"),
      detail: t(`admin.ct.kind.${contract.kind}`),
      icon: "file-plus",
      tone: "neutral",
    });

    /* Each amendment carries its own reason and the fields it touched — the
       reason is the point, so it is the line rather than a count. */
    for (const [n, am] of (contract.amendments ?? []).entries()) {
      out.push({
        id: `c-amend-${n}`,
        at: am.amendedOn,
        title: t("admin.ct.act.amended"),
        detail: am.reason,
        who: am.amendedBy,
        icon: "file-pen",
        tone: "info",
      });
    }

    if (contract.signedOn) {
      out.push({ id: "c-signed", at: contract.signedOn, title: t("admin.ct.act.signed"), icon: "file-check", tone: "success" });
    }
    if (contract.handoverOn) {
      out.push({ id: "c-handover", at: contract.handoverOn, title: t("admin.ct.act.handover"), icon: "key", tone: "success" });
    }
    /* A term that has not started yet is not history. The dates card already
       says when it will; repeating it here as a past event would be a lie. */
    if (contract.startsOn && daysBetween(contract.startsOn, ANCHOR_ISO) >= 0) {
      out.push({ id: "c-start", at: contract.startsOn, title: t("admin.ct.act.termStarted"), icon: "calendar-arrow-up", tone: "neutral" });
    }
    if (contract.endsOn && daysBetween(contract.endsOn, ANCHOR_ISO) >= 0) {
      out.push({ id: "c-end", at: contract.endsOn, title: t("admin.ct.act.termEnded"), icon: "calendar-x", tone: "neutral" });
    }

    /* ---- the money, in full ---- */
    for (const inv of invoicesByContract(contract.id)) {
      const total = invoiceTotals(inv).total;
      if (inv.issuedOn) {
        out.push({
          id: `i-${inv.id}`,
          at: inv.issuedOn,
          title: t("admin.ct.act.invoiced", { total: money(total) }),
          detail: invoiceLineText(inv.lines[0], t, lang),
          icon: "receipt",
          tone: "neutral",
        });
      }
      /* A moved due date is a departure from the agreement and carries the
         reason somebody will be asked for later. */
      for (const [n, p] of (inv.postponements ?? []).entries()) {
        out.push({
          id: `i-${inv.id}-pp${n}`,
          at: p.on,
          title: t("admin.ct.act.postponed", { date: fmtDate(lang, fromIso(p.to)) }),
          detail: p.reason,
          icon: "calendar-clock",
          tone: "warning",
        });
      }
      if (inv.voidedOn) {
        out.push({
          id: `i-${inv.id}-void`,
          at: inv.voidedOn,
          title: t("admin.ct.act.voided", { number: inv.number }),
          detail: inv.voidReason,
          icon: "file-x",
          tone: "error",
        });
      }
    }

    for (const p of contractPayments) {
      out.push({
        id: `p-${p.id}`,
        at: p.receivedOn,
        title: t("admin.ct.act.paid", { amount: money(p.receivedAmount) }),
        detail: invoiceLineText(invoices.find((i) => i.id === p.invoiceId)?.lines[0], t, lang),
        icon: "banknote",
        tone: "success",
      });
      /* The landlord's own paper, on the day HE came in — a different day from
         the tenant's payment, which is the whole reason it is recorded. */
      if (p.ownerReceiptedOn) {
        out.push({
          id: `p-${p.id}-own`,
          at: p.ownerReceiptedOn,
          title: t("admin.ct.act.ownerReceipted"),
          icon: "printer",
          tone: "neutral",
        });
      }
    }

    for (const e of ownerEntries) {
      if (e.kind !== "payout" && e.kind !== "adjustment") continue;
      out.push({
        id: `l-${e.id}`,
        at: e.on,
        title:
          e.kind === "payout"
            ? t("admin.ct.act.paidOwner", { amount: money(isNegative(e.amount) ? multiply(e.amount, -1) : e.amount) })
            : t("admin.ct.act.adjusted", { amount: money(e.amount) }),
        detail: e.description,
        icon: e.kind === "payout" ? "hand-coins" : "wrench",
        tone: "info",
      });
    }

    /* ---- how it ended ---- */
    if (contract.depositReturnedOn) {
      out.push({
        id: "c-deposit",
        at: contract.depositReturnedOn,
        title: t("admin.ct.act.depositClosed"),
        detail: contract.depositDeductionReason,
        icon: "shield-check",
        tone: "success",
      });
    }
    if (contract.cancelledOn) {
      out.push({
        id: "c-cancelled",
        at: contract.cancelledOn,
        title: t("admin.ct.act.cancelled"),
        detail: contract.cancelReason,
        icon: "ban",
        tone: "error",
      });
    }

    /* ---- anything done in THIS session, on top ----
       The log is the only source for actions with no date field of their own —
       a status change, a role edit — and for the few minutes between an action
       and a reload it is also the freshest. Derived lines already cover the
       records, so log entries that duplicate them are dropped by date+kind. */
    const mine = new Set<string>([contract.id]);
    for (const inv of invoicesByContract(contract.id)) {
      mine.add(inv.id);
      if (inv.number) mine.add(inv.number);
    }
    for (const p of contractPayments) mine.add(p.id);
    for (const e of ownerEntries) mine.add(e.id);

    const covered = new Set(out.map((e) => e.at.slice(0, 10) + "|" + e.title));
    for (const e of auditEvents) {
      if (!mine.has(e.target) && !(e.targetId && mine.has(e.targetId))) continue;
      const title = t(e.actionKey, e.actionParams);
      if (covered.has(e.at.slice(0, 10) + "|" + title)) continue;
      const look = ACT_LOOK[e.actionKey] ?? { icon: "circle-dot" as IconName, tone: "neutral" as const };
      out.push({
        id: e.id,
        at: e.at,
        title,
        detail: e.metaKey ? t(e.metaKey, e.metaParams) : e.meta,
        who: e.actor.name,
        icon: look.icon,
        tone: look.tone,
      });
    }

    return out.sort((x, y) => y.at.localeCompare(x.at));
  }, [contract, invoicesByContract, invoices, contractPayments, ownerEntries, auditEvents, t, lang]);

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
  /* HOW WE WRITE TO THEM comes off the member record and nowhere else: the
     language they chose, whether their number is on WhatsApp, and whether they
     asked to be left alone. A party typed straight onto the contract has told
     us none of that, so the fields stay undefined and every reader treats the
     absence as the ordinary case — see `reachBlock` in _shared/messaging. */
  const landlordParty = {
    name: ownerName,
    phone: ownerMember?.phone ?? "",
    email: ownerMember?.email,
    memberId: ownerMember?.id,
    msgLang: ownerMember?.msgLang ?? null,
    whatsapp: ownerMember?.whatsapp,
    remindersOn: ownerMember?.remindersOn,
  };
  const tenantParty = counterparty
    ? {
        name: counterparty,
        phone: tenantMember?.phone ?? contract.buyerExternal?.phone ?? "",
        email: tenantMember?.email,
        memberId: tenantMember?.id,
        msgLang: tenantMember?.msgLang ?? null,
        whatsapp: tenantMember?.whatsapp,
        remindersOn: tenantMember?.remindersOn,
      }
    : null;
  const agentParty = { name: agentName, phone: agentRecord?.phone ?? "", email: agentRecord?.email, img: agentRecord?.img };
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
              ownerName={ownerName}
              counterparty={counterparty}
              canRecordPayment={!!nextUnpaid}
              /* A tenancy that is standing and has not already been followed.
                 A sale has nothing to renew, a draft was never in force, and a
                 contract something already replaced would start a second chain
                 off the same link. */
              canRenew={canWrite && contract.kind === "rent" && contract.status === "signed" && !replacedBy(contract)}
              /* Only once the term has actually run out — i.e. the badge reads
                 Expired. Before that the tenancy is running and the honest way
                 out is Cancel, which asks why. */
              canEndTenancy={canWrite && contractDisplayStatus(contract) === "expired" && !replacedBy(contract)}
              canWrite={canWrite}
              onRecordPayment={() => setPayTarget(nextUnpaid)}
              onRenew={onRenew}
              onCancel={() => setCancelling(true)}
              onSettleEarly={() => setSettling(true)}
              onEndTenancy={() => setEndingTenancy(true)}
            />
          </div>

          {/* ⚠ INSIDE THE PANEL, WITH THE IDENTITY ABOVE IT. The tab strip used
              to close the panel after the hero and then sit on its own below
              it, so the contract screen showed a card and then a loose row of
              buttons where the property and member screens show one object.
              The panel is what makes them one: white hero on top, grey tab
              strip along the bottom, a single border round both. Compare
              _property-detail — hero, segwrap, body, all in .vwd-panel.

              The cancelled banner came inside with them. It is a fact about
              which contract this is, so it belongs with the name and not
              floating between the header and the tabs. */}
          {cancelled && <CancelledBanner c={contract} />}

          {/* SEGMENTED TABS, the property page's own — same track, same buttons,
              same counts. A contract page that scrolled through four unrelated
              cards made the money and the paperwork equally far away; each of
              these is a different question somebody arrives with.

              Overview first because it is the document itself. Invoices second
              because it is what the page is opened for once the deal is
              running. */}
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
          <div className="vwd-panel__body">
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
              onPostpone={setPostponeTarget}
              /* The reminder goes to whoever is billed, and the modal opens on that
                 side: a landlord's commission is chased from the landlord, not from
                 the tenant whose name happens to be on the tenancy. */
              onRemind={(invoice) => {
                setRemindAbout(invoice);
                setSendTo(billedSide(invoice, contract.ownerId) === "owner" ? "landlord" : "tenant");
              }}
              penaltyRaisedFor={penaltyRaisedFor}
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
                contractId={contract.id}
                payments={contractPayments}
                invoiceById={(id) => invoices.find((i) => i.id === id)}
                ledger={ownerEntries}
                landlordCollects={contract.kind === "rent" && contract.rentPaidTo !== "agency"}
                kind={contract.kind}
                ownerId={contract.ownerId}
                basePath={basePath}
                canWrite={canWrite}
              />
            )}

            {tab === "activity" && <Activity events={contractEvents} />}
          </div>
        </div>
      </header>


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

      {endingTenancy && (
        <EndTenancyModal
          contract={contract}
          onClose={() => setEndingTenancy(false)}
          onEnded={({ depositStillHeld }) => {
            setEndingTenancy(false);
            pushToast({
              tone: "success",
              icon: "circle-check",
              title: t("admin.fin.toast.endedTitle"),
              msg: t("admin.fin.toast.endedMsg"),
            });
            /* STRAIGHT ON TO THE DEPOSIT, if we are still holding it. The two
               are separate decisions — see EndTenancyModal — but a person who
               has just ended a tenancy is the person who knows what became of
               the money, and making them find the Deposit card afterwards is
               how deposits get forgotten for eighteen months. */
            if (depositStillHeld) setClosingLease(true);
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

      {postponeTarget && (
        <PostponeInvoiceModal
          invoice={postponeTarget}
          onClose={() => setPostponeTarget(null)}
          onPostponed={() => {
            const number = postponeTarget.number || postponeTarget.id;
            setPostponeTarget(null);
            pushToast({
              tone: "success",
              icon: "calendar-clock",
              title: t("admin.fin.toast.postponedTitle"),
              msg: t("admin.fin.toast.postponedMsg", { number }),
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
          /* Chasing ONE demand: the reminder quotes what is owed on it and the
             day it falls due, not the monthly rent and the end of the lease. */
          invoice={remindAbout ? { owed: owedFor(remindAbout), dueOn: remindAbout.dueOn } : undefined}
          template={remindAbout ? "payment_reminder" : undefined}
          onClose={() => {
            setSendTo(null);
            setRemindAbout(null);
          }}
          onSent={({ name }) => {
            setSendTo(null);
            setRemindAbout(null);
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
