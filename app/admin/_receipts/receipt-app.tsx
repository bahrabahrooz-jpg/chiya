"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { dirFor, translate, useLang, type Lang } from "@/lib/i18n";
import { LANGS } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtPercent, localizeDigits } from "@/lib/fmt";
import { formatMoney, isZero, moneyToWords, subtract, type Money } from "@/lib/money";
import { addDays, addMonths, fromIso } from "@/lib/dates";
import { usePlatformSettings } from "@/lib/platform-settings";
import { billedSide, partyRoleKey } from "../_contract-detail/data";
import { invoiceLineText } from "../_shared/finance";
import { ownerCommissionOf, tenantCommissionOf, type ContractRecord, type InvoiceRecord } from "../_data/contracts";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";

/* =============================================================================
   The receipt — the paper the office actually hands over.

   TWO COPIES ON ONE SHEET, not two pages. A receipt book in this trade is a
   carbon pad: the top sheet goes to whoever handed the money over and the
   bottom stays in the book. One A4 with a cut line down the middle does the
   same job with one press of Print, and it cannot produce a copy for one party
   without producing the office's.

   TWO KINDS, ONE ANATOMY:
     payment  money IN from a tenant or a buyer, against an invoice.
     payout   money OUT to a landlord or a seller, off the owner ledger.
   Both say the same seven things — who, how much, what for, when, how, against
   what, and two signatures. Only the direction and the party change, which is
   why they are one component and not two.

   ⚠ A RECEIPT IS NOT AN INVOICE. An invoice says "you owe me" and can be
   chased; a receipt says "this money changed hands" and is already settled.
   Nothing here is stored — the receipt is a VIEW of a payment or a ledger line
   that already exists. Printing one twice does not create anything twice.

   THE AMOUNT IS WRITTEN IN WORDS as well as figures, which is not decoration:
   a handwritten "3,400" can be argued with and "three thousand four hundred"
   cannot. See moneyToWords.
   ========================================================================== */

/**
 * THREE KINDS, BECAUSE EVERY MONTH'S RENT PRODUCES TWO PAPERS ON EVERY TENANCY.
 *
 *   payment   the tenant paid. His proof, and the office's.
 *   landlord  the landlord received it — on a tenancy HE collects, so it is
 *             the same moment as the payment above and prints from the same
 *             record. Two people, two files, two papers.
 *   payout    the landlord received it — on a tenancy the AGENCY collects, so
 *             it happens later, on its own day, and prints from the hand-off.
 *
 * ⚠ THE LANDLORD'S PAPER IS NOT TIED TO THE AGENCY HANDLING THE MONEY. It used
 * to be — it only existed where a payout existed — which left a directly-paid
 * tenancy with the tenant's half of the file and nothing for the landlord. The
 * cash moving once does not make it one document: the tenant needs proof he
 * paid and the landlord needs proof he was paid, and they are different people
 * keeping different records.
 */
export type ReceiptKind = "payment" | "landlord" | "payout" | "deposit";

interface ReceiptFacts {
  id: string;
  on: string;
  partyName: string;
  amount: Money;
  what: string;
  contractId: string;
  propertyTitle: string;
  /** Only on a payment — the demand it settles. */
  invoiceNumber?: string;
  methodLabel?: string;
  reference?: string;
  handledBy?: string;
  /** On the landlord’s copy: who handed the money over. */
  paidBy?: string;
  /**
   * WHAT THIS PAPER IS, in one line. "Rent receipt — received from the tenant"
   * rather than the word "Receipt" on its own: a person going through a folder
   * a year later is looking for the rent one, not for a receipt.
   */
  docTitle: string;
  /** The property’s own code and where it is — a receipt names the flat, not
      just its marketing title. */
  propertyId?: string;
  propertyAddress?: string;
  /**
   * WHOSE PAPER THIS IS. The i18n key for the party the receipt belongs to —
   * tenant, landlord, buyer or seller — so the copy label on the sheet names a
   * person rather than saying "payer’s copy" and leaving them to work it out.
   */
  partyRoleKey: string;
  /**
   * WHAT PERIOD THE MONEY COVERS. Rent only, and it is the fact that makes a
   * rent receipt worth keeping: "$500 received" proves a payment happened,
   * "$500 for 1 Jul to 31 Jul" proves the month is paid for. Derived from the
   * invoice line’s own cycle — see InvoiceLine.descriptionPeriod — so it is
   * absent on a commission or a deposit, where there is no period to state and a
   * table would be an invented one.
   */
  period?: { from: string; to: string; months: number; monthlyRent?: Money };
  /**
   * HOW A COMMISSION WAS ARRIVED AT — commission receipts only.
   *
   * The one figure on a receipt somebody argues about is the fee, and "$3,400"
   * on its own invites the argument. The basis it was worked out from and the
   * rate applied to it end it. Read off the contract’s own CommissionTerm, so
   * the paper states the term that was agreed rather than a sum reverse-derived
   * from the total.
   */
  basis?: { label: string; from?: Money; rate?: number };
  /**
   * A DEPOSIT GOING BACK, and what was kept out of it.
   *
   * ⚠ THE TENANT MUST BE TOLD ON THE PAPER. He handed over £850 and got a
   * receipt for it; handing him £650 a year later with a receipt that says only
   * "£650 paid to you" is how a deposit dispute starts. So the working is on
   * the document: what was held, what was deducted and why, what went back.
   */
  refund?: { held: Money; deducted?: Money; reason?: string };
}

/** One copy. Rendered twice per sheet — see the header. */
function Copy({
  facts,
  kind,
  copyLabel,
  t,
  lang,
}: {
  facts: ReceiptFacts;
  kind: ReceiptKind;
  copyLabel: string;
  /**
   * ⚠ THE DOCUMENT’S LANGUAGE, NOT THE APP’S, and they are deliberately
   * different things. The clerk works in English and the tenant reads Kurdish;
   * the paper has to come out in the tenant’s language without the clerk having
   * to switch their whole console to do it. So this component is handed a
   * translate function and a language rather than calling useLang() itself —
   * that hook answers "what is the console set to", which is the wrong
   * question for a thing that is about to be printed and handed over.
   */
  t: (key: string, params?: Record<string, string | number>) => string;
  lang: Lang;
}) {
  const { settings } = usePlatformSettings();
  const g = settings.general;
  /* "Received from" on the tenant's; "Paid to" on the two that record an owner
     getting his money, whichever way it reached him. */
  const incoming = kind === "payment";

  return (
    <article className="rc-copy">
      {/* THE BAND. Who issued the paper, and WHICH of the two copies this is —
          at the top, where somebody sorting a stack of them is looking. It used
          to be a grey word in the footer, which is the last place you look and
          the first place a stapler covers. */}
      <div className="rc-band">
        <span className="rc-band__org">
          <b className="rc-band__name">{g.platformName}</b>
          <span className="rc-band__eyebrow">{t("admin.rc.band")}</span>
        </span>
        <span className="rc-band__copy">{copyLabel}</span>
      </div>

      <header className="rc-head">
        {/* The name is in the band above; repeating it here just made the
            reader’s eye stop twice on the same word. */}
        <div className="rc-org">
          <span className="rc-org__line">{g.officeAddress}</span>
          {/* A phone number is a Latin run inside an Arabic paragraph, so without
              an isolate the bidi algorithm walks the leading "+" to the far end
              and prints "4567 123 750 964+". Same for the email below. */}
          <span className="rc-org__line rc-ltr">{g.contactPhone}</span>
        </div>
        <div className="rc-meta">
          <span className="rc-meta__kind">{facts.docTitle}</span>
          <span className="rc-meta__no">{t("admin.rc.no", { id: localizeDigits(lang, facts.id) })}</span>
          <span className="rc-meta__date">{fmtDate(lang, fromIso(facts.on))}</span>
        </div>
      </header>

      {/* THE FLAT, BY ITS OWN CODE. A marketing title is what the website calls
          it; the code and the address are what a person standing outside can
          check against. */}
      {facts.propertyTitle && (
        <div className="rc-strip">
          <span className="rc-strip__pair">
            <span className="rc-strip__k">{t("admin.rc.property")}</span>
            <b className="rc-mono">{localizeDigits(lang, facts.propertyId ?? "")}</b>
          </span>
          <span className="rc-strip__pair">
            <b>{facts.propertyTitle}</b>
          </span>
          {facts.propertyAddress && (
            <span className="rc-strip__pair">
              <span className="rc-strip__k">{t("admin.rc.propertyAddress")}</span>
              <b>{facts.propertyAddress}</b>
            </span>
          )}
        </div>
      )}

      <dl className="rc-body">
        <div className="rc-field">
          <dt>{t(incoming ? "admin.rc.receivedFrom" : "admin.rc.paidTo")}</dt>
          <dd className="rc-field__strong">{facts.partyName}</dd>
        </div>

        {/* Figures and words together — see the header note. */}
        <div className="rc-field rc-field--amount">
          <dt>{t("admin.rc.amount")}</dt>
          <dd>
            <span className="rc-amount">{formatMoney(lang, facts.amount)}</span>
            <span className="rc-words">{moneyToWords(facts.amount, lang)}</span>
          </dd>
        </div>

        <div className="rc-field">
          <dt>{t("admin.rc.for")}</dt>
          <dd>{facts.what}</dd>
        </div>


      </dl>



      {/* WHAT PERIOD THE MONEY COVERS — rent only.

          "$500 received" proves a payment happened. "$500, 1 Jul to 31 Jul"
          proves the month is paid for, which is what a tenant actually needs the
          paper for and what a landlord is shown when there is an argument about
          it. The dates come off the invoice line’s own cycle, so a commission or
          a deposit gets no table rather than an invented one. */}
      {facts.period && (
        <table className="rc-period">
          <thead>
            <tr>
              <th>{t("admin.rc.per.from")}</th>
              <th>{t("admin.rc.per.to")}</th>
              <th>{t("admin.rc.per.months")}</th>
              {facts.period.monthlyRent && <th>{t("admin.rc.per.monthly")}</th>}
              <th className="rc-period__total">{t("admin.rc.per.total")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{fmtDate(lang, fromIso(facts.period.from))}</td>
              <td>{fmtDate(lang, fromIso(facts.period.to))}</td>
              <td>{fmtNum(lang, facts.period.months)}</td>
              {facts.period.monthlyRent && <td>{formatMoney(lang, facts.period.monthlyRent)}</td>}
              <td className="rc-period__total">{formatMoney(lang, facts.amount)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* HOW THE FEE WAS WORKED OUT — commission only.

          "$3,400" on its own invites the argument; the figure it was taken of
          and the rate applied to it end it. Only where the contract states
          working to show: a flat fee was simply agreed, and a table with two
          empty cells is worse than no table. */}
      {facts.basis && (
        <table className="rc-period">
          <thead>
            <tr>
              <th>{t("admin.rc.bas.how")}</th>
              {facts.basis.from && <th>{t("admin.rc.bas.from")}</th>}
              {facts.basis.rate !== undefined && <th>{t("admin.rc.bas.rate")}</th>}
              <th className="rc-period__total">{t("admin.rc.per.total")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{facts.basis.label}</td>
              {facts.basis.from && <td>{formatMoney(lang, facts.basis.from)}</td>}
              {facts.basis.rate !== undefined && <td>{fmtPercent(lang, facts.basis.rate)}</td>}
              <td className="rc-period__total">{formatMoney(lang, facts.amount)}</td>
            </tr>
          </tbody>
        </table>
      )}

      {/* WHAT WAS HELD, WHAT WAS KEPT, WHAT WENT BACK.

          A tenant handed over the full deposit and holds a receipt saying so.
          Giving him less back a year later with a paper that states only the
          smaller figure is how a deposit dispute starts — so the deduction and
          the reason for it are on the document he signs, not only in the
          office’s records. */}
      {facts.refund && (
        <table className="rc-period">
          <thead>
            <tr>
              <th>{t("admin.rc.ref.held")}</th>
              {facts.refund.deducted && <th>{t("admin.rc.ref.deducted")}</th>}
              <th className="rc-period__total">{t("admin.rc.ref.back")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{formatMoney(lang, facts.refund.held)}</td>
              {facts.refund.deducted && <td>{formatMoney(lang, facts.refund.deducted)}</td>}
              <td className="rc-period__total">{formatMoney(lang, facts.amount)}</td>
            </tr>
          </tbody>
        </table>
      )}
      {facts.refund?.reason && (
        <p className="rc-reason">
          <span className="rc-reason__k">{t("admin.rc.ref.reason")}</span>
          {facts.refund.reason}
        </p>
      )}

      {/* The paperwork this receipt hangs off — below the money and the period,
          because nobody reaches for a receipt to look up a reference number. */}
      <div className="rc-pair">
        {/* Only on the landlord's copy — on his paper he is the receiver, so
            the person who handed it over has to be named. */}
        {facts.paidBy && (
          <div className="rc-field">
            <dt>{t("admin.rc.paidBy")}</dt>
            <dd>{facts.paidBy}</dd>
          </div>
        )}
        <div className="rc-field">
          <dt>{t("admin.rc.contract")}</dt>
          <dd className="rc-mono">{localizeDigits(lang, facts.contractId)}</dd>
        </div>
        {facts.invoiceNumber && (
          <div className="rc-field">
            <dt>{t("admin.rc.againstInvoice")}</dt>
            <dd className="rc-mono">{localizeDigits(lang, facts.invoiceNumber)}</dd>
          </div>
        )}
        {facts.methodLabel && (
          <div className="rc-field">
            <dt>{t("admin.fin.rp.method")}</dt>
            <dd>{facts.methodLabel}</dd>
          </div>
        )}
        {facts.reference && (
          <div className="rc-field">
            <dt>{t("admin.fin.rp.reference")}</dt>
            <dd className="rc-mono">{facts.reference}</dd>
          </div>
        )}
      </div>


      {/* BOTH SIDES SIGN. A receipt only one party signed is the agency's word
          about what happened; two signatures make it a record both hold. */}
      <footer className="rc-foot">
        {/* THE NAME GOES UNDER THE RULE somebody is about to sign above. A blank
            line labelled "signature" is a line anyone can sign; a line with a
            name under it is a line ONE person can sign, which is the only
            version of this that is worth anything in an argument. */}
        <div className="rc-sign">
          <span className="rc-sign__rule" />
          <span className="rc-sign__label">{t("admin.rc.signParty", { role: t(facts.partyRoleKey) })}</span>
          <span className="rc-sign__hint">{facts.partyName}</span>
        </div>
        <div className="rc-sign">
          <span className="rc-sign__rule" />
          <span className="rc-sign__label">{t("admin.rc.signOffice")}</span>
          {facts.handledBy && <span className="rc-sign__hint">{facts.handledBy}</span>}
        </div>
      </footer>

      {/* How to reach the office, on the paper somebody is holding a year later. */}
      <p className="rc-contact">
        <span className="rc-ltr">{g.contactPhone}</span>
        <span aria-hidden="true">{"·"}</span>
        <span>{g.officeAddress}</span>
        {g.contactEmail && (
          <>
            <span aria-hidden="true">{"·"}</span>
            <span className="rc-ltr">{g.contactEmail}</span>
          </>
        )}
      </p>
    </article>
  );
}

export function ReceiptApp({ kind, id }: { kind: ReceiptKind; id: string }) {
  /* `ui` is the console’s language — it dresses the toolbar. `lang` below is
     the PAPER’S, and the two part company the moment somebody prints an Arabic
     receipt from an English console. */
  const { t: ui, lang: uiLang } = useLang();
  /**
   * WHAT LANGUAGE THE PAPER COMES OUT IN.
   *
   * Starts as whatever the console is set to, because that is the common case
   * and nobody should have to choose twice. But it is its own state and its own
   * control: the tenant standing at the counter reads Kurdish whether or not
   * the clerk’s console does, and switching the whole admin to hand one person
   * one sheet is a thing nobody will do twice.
   */
  /* Derived, not synced. An override or nothing — so the paper follows the
     console for free until somebody deliberately picks otherwise, and there is
     no effect racing the console’s own switcher to set it back. */
  const [picked, setLang] = useState<Lang | null>(null);
  const lang = picked ?? uiLang;
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);
  const { settings } = usePlatformSettings();
  const { payments, ledger, invoices, getContract } = useContracts();
  const { properties, members } = useProperties();

  const facts: ReceiptFacts | undefined = useMemo(() => {
    const propertyOf = (propertyId: string) => properties.find((p) => p.id === propertyId);
    const titleOf = (propertyId: string) => propertyOf(propertyId)?.title ?? propertyId;
    /* Area, district, city — the three the catalog stores, in the order somebody
       says them out loud. Empty parts drop out rather than leaving stray commas. */
    const addressOf = (propertyId: string) => {
      const property = propertyOf(propertyId);
      if (!property) return "";
      /* Deduplicated: a flat in Ankawa sits in the Ankawa district of Erbil, and
         "Ankawa, Ankawa, Erbil" reads as a data error to whoever is holding the
         paper. */
      return [...new Set([property.area, property.district, property.city].filter(Boolean))].join(", ");
    };
    /**
     * THE PERIOD A RENT PAYMENT COVERS, off the invoice line’s own cycle.
     *
     * The line stores when the cycle falls due and how many months it runs; the
     * last day is the day before the next one starts, which is what a tenancy
     * means by "to". Anything without a cycle — a commission, a deposit —
     * returns nothing, and the receipt shows no table.
     */
    /**
     * THE ONE-LINE NAME OF THE DOCUMENT.
     *
     * The category says what the money was for and the direction says which way
     * it moved; together they are what somebody is scanning a folder for. The
     * old title was the bare word "Receipt" on every payment the agency ever
     * took, which made a stack of them unsortable.
     */
    const titleFor = (doc: string, roleKey: string, incoming: boolean) =>
      t(incoming ? "admin.rc.docIn" : "admin.rc.docOut", { doc: t(doc), role: t(roleKey) });

    /**
     * The working behind a commission, when the contract states one.
     *
     * A percentage has a figure it was taken OF; a month-based fee has the rent
     * it is a month of. A flat fee has neither — it was simply agreed — so it
     * gets the basis in words and no arithmetic, rather than an invented sum.
     */
    const basisOf = (invoice: InvoiceRecord, contract?: ContractRecord) => {
      if (invoice.category !== "commission" || !contract) return undefined;
      const term = billedSide(invoice, contract.ownerId) === "owner" ? ownerCommissionOf(contract) : tenantCommissionOf(contract);
      if (term.basis === "none") return undefined;
      const label = t(`admin.cn.basis.${term.basis}`);
      /* "Percentage of the price" is the form’s wording and it is wrong on a
         tenancy, where `price` is the rent for one cycle rather than a sale
         price. The receipt says which. */
      if (term.basis === "percent") {
        return {
          label: t(contract.kind === "sale" ? "admin.rc.bas.pctPrice" : "admin.rc.bas.pctRent"),
          from: contract.price,
          rate: term.value,
        };
      }
      if (term.basis === "half_month" || term.basis === "one_month") {
        return contract.monthlyRent ? { label, from: contract.monthlyRent } : { label };
      }
      return { label };
    };

    const periodOf = (invoice: InvoiceRecord, contract?: ContractRecord) => {
      const cycle = invoice.lines[0]?.descriptionPeriod;
      if (!cycle) return undefined;
      return {
        from: cycle.dueOn,
        to: addDays(addMonths(cycle.dueOn, cycle.months), -1),
        months: cycle.months,
        /* The contract states a monthly rate only where the cycle is longer than
           a month. On a monthly tenancy `price` IS the month — that is the
           asserted invariant — so it is read straight off rather than divided
           back out of a quarterly figure, which would round. */
        ...(contract?.monthlyRent
          ? { monthlyRent: contract.monthlyRent }
          : cycle.months === 1 && contract
            ? { monthlyRent: contract.price }
            : {}),
      };
    };
    const staffName = (staffId: string) => settings.team.staff.find((s) => s.id === staffId)?.name;

    if (kind === "payment" || kind === "landlord") {
      const payment = payments.find((p) => p.id === id);
      if (!payment) return undefined;
      const invoice = invoices.find((i) => i.id === payment.invoiceId);
      if (!invoice) return undefined;
      const contract = getContract(invoice.contractId);

      /* THE LANDLORD'S COPY OF THE SAME EVENT. Only where the money went
         straight to him — if the agency took it in, what he gets is a receipt
         for the hand-off instead, on the day it actually happens. */
      if (kind === "landlord") {
        /* THREE TESTS, AND THE FIRST IS THE ONE THAT MATTERS. Only money that
           IS the owner's gets him a paper — a commission payment is the
           agency's own income and he has no copy of it. Then: a tenancy, and
           one he collects himself, because where the agency took the money his
           paper is the payout receipt on the day it is handed over. */
        if (invoice.payee !== "owner") return undefined;
        if (!contract || contract.kind !== "rent" || contract.rentPaidTo === "agency") return undefined;
        /* ⚠ NO DATE, NO RECEIPT. His paper exists from the moment somebody
           records the day he actually took the money, and not before — a
           receipt issued in advance of the thing it attests to is not a
           receipt. See PaymentRecord.ownerReceiptedOn. */
        if (!payment.ownerReceiptedOn) return undefined;
        const owner = members.find((m) => m.id === contract.ownerId);
        return {
          id: payment.id,
          /* HIS day, not the tenant's. */
          on: payment.ownerReceiptedOn,
          partyName: owner?.name ?? contract.ownerId,
          amount: payment.receivedAmount,
          what: invoiceLineText(invoice.lines[0], t, lang),
          contractId: invoice.contractId,
          propertyTitle: titleOf(contract.propertyId),
          propertyId: contract.propertyId,
          propertyAddress: addressOf(contract.propertyId),
          /* His paper, so it is his role that names the copy — and the title
             says he RECEIVED it, because on this one he is the one being paid. */
          partyRoleKey: partyRoleKey(contract.kind, "owner"),
          docTitle: titleFor(`admin.rc.doc.${invoice.category}`, partyRoleKey(contract.kind, "owner"), false),
          ...(periodOf(invoice, contract) ? { period: periodOf(invoice, contract) } : {}),
          ...(basisOf(invoice, contract) ? { basis: basisOf(invoice, contract) } : {}),
          ...(invoice.number ? { invoiceNumber: invoice.number } : {}),
          methodLabel: t(`admin.fin.method.${payment.method}`),
          /* Who handed it over — the tenant, named, because on this paper the
             landlord is the one receiving and the payer has to be identified. */
          ...(invoice.billTo.name ? { paidBy: invoice.billTo.name } : {}),
          ...(payment.reference ? { reference: payment.reference } : {}),
        };
      }

      return {
        id: payment.id,
        on: payment.receivedOn,
        /* The frozen bill-to snapshot, not a live lookup: the receipt has to
           keep saying who actually paid, under the name they paid under. */
        partyName: invoice.billTo.name,
        /* WHAT ACTUALLY CHANGED HANDS, not what was credited to the invoice. A
           tenant settling a dollar demand with dinars handed over dinars, and
           that is what his receipt has to say. See PaymentRecord. */
        amount: payment.receivedAmount,
        what: invoiceLineText(invoice.lines[0], t, lang),
        contractId: invoice.contractId,
        propertyTitle: contract ? titleOf(contract.propertyId) : "",
        ...(contract ? { propertyId: contract.propertyId, propertyAddress: addressOf(contract.propertyId) } : {}),
        /* WHOEVER PAID, in this contract’s own words — the landlord pays his own
           commission, so this is not always the tenant. Same resolution the
           contract card uses for the link that opens this page. */
        partyRoleKey: contract ? partyRoleKey(contract.kind, billedSide(invoice, contract.ownerId)) : "admin.pd.tenant",
        docTitle: titleFor(
          `admin.rc.doc.${invoice.category}`,
          contract ? partyRoleKey(contract.kind, billedSide(invoice, contract.ownerId)) : "admin.pd.tenant",
          true,
        ),
        ...(contract && periodOf(invoice, contract) ? { period: periodOf(invoice, contract) } : {}),
        ...(basisOf(invoice, contract) ? { basis: basisOf(invoice, contract) } : {}),
        ...(invoice.number ? { invoiceNumber: invoice.number } : {}),
        methodLabel: t(`admin.fin.method.${payment.method}`),
        ...(payment.reference ? { reference: payment.reference } : {}),
        ...(staffName(payment.recordedBy) ? { handledBy: staffName(payment.recordedBy) } : {}),
      };
    }

    /* ---- the deposit going back ----

       ⚠ NOT BACKED BY A PAYMENT OR A LEDGER LINE, and it does not need to be.
       Returning a deposit hands back money that was never the agency’s: it
       raises no invoice, earns nothing and moves no revenue, so there is
       nothing to record beyond what the contract already says happened. The
       receipt is a VIEW of `depositStatus` and the date beside it, exactly as
       every other receipt in this app is a view of something that already
       exists — printing it twice creates nothing.

       A deposit CARRIED into a renewal gets no paper: no money moved, and a
       receipt for a hand-over that did not happen is a receipt for a lie. */
    if (kind === "deposit") {
      const contract = getContract(id);
      if (!contract?.insuranceDeposit || !contract.depositReturnedOn) return undefined;
      if (contract.depositStatus !== "returned" && contract.depositStatus !== "partly_returned") return undefined;
      const held = contract.insuranceDeposit;
      const deducted = contract.depositDeduction;
      const back = deducted ? subtract(held, deducted) : held;
      /* The tenant, whether or not he holds an account — most never register,
         and the paper still has to name him. */
      const tenant = (contract.buyerId ? members.find((m) => m.id === contract.buyerId)?.name : undefined) ?? contract.buyerExternal?.name ?? "";
      const roleKey = partyRoleKey(contract.kind, "counterparty");
      return {
        id: contract.id,
        on: contract.depositReturnedOn,
        partyName: tenant,
        amount: back,
        what: t("admin.rc.depositBack"),
        contractId: contract.id,
        propertyTitle: titleOf(contract.propertyId),
        propertyId: contract.propertyId,
        propertyAddress: addressOf(contract.propertyId),
        partyRoleKey: roleKey,
        docTitle: titleFor("admin.rc.doc.depositBack", roleKey, false),
        refund: {
          held,
          ...(deducted && !isZero(deducted) ? { deducted } : {}),
          ...(contract.depositDeductionReason ? { reason: contract.depositDeductionReason } : {}),
        },
        /* NO NAME UNDER the agency line, deliberately. Nothing records which
           clerk counted the notes back out — the agent who WROTE the contract a
           year ago is a different person and naming them would be a guess on a
           document somebody signs. A blank line for whoever hands it over is
           the honest version. */
      };
    }

    const entry = ledger.find((e) => e.id === id && e.kind === "payout");
    if (!entry) return undefined;
    const contract = getContract(entry.contractId);
    return {
      id: entry.id,
      on: entry.on,
      partyName: members.find((m) => m.id === entry.ownerId)?.name ?? entry.ownerId,
      /* Stored negative because it leaves the balance; a receipt states what was
         handed over. See payoutEntry. */
      amount: { amount: Math.abs(entry.amount.amount), currency: entry.amount.currency },
      what: entry.description,
      contractId: entry.contractId,
      propertyTitle: contract ? titleOf(contract.propertyId) : "",
      ...(contract ? { propertyId: contract.propertyId, propertyAddress: addressOf(contract.propertyId) } : {}),
      /* A hand-off is always to the owner — landlord on a tenancy, seller on a
         sale paid in instalments. */
      partyRoleKey: contract ? partyRoleKey(contract.kind, "owner") : "admin.pd.landlord",
      docTitle: titleFor("admin.rc.doc.payout", contract ? partyRoleKey(contract.kind, "owner") : "admin.pd.landlord", false),
    };
  }, [kind, id, payments, ledger, invoices, getContract, properties, members, settings.team.staff, t, lang]);

  if (!facts) {
    return (
      <div className="rc-missing">
        <span className="rc-missing__art">
          <Icon name="file-x" size={26} strokeWidth={1.6} />
        </span>
        <h1>{ui("admin.rc.notFound")}</h1>
        <p>{ui("admin.rc.notFoundSub")}</p>
      </div>
    );
  }

  return (
    <div className="rc-page">
      {/* The toolbar is screen-only — see the print rules in receipt.css. */}
      <div className="rc-toolbar">
        <Link className="rc-back" href={`/admin/contracts/${encodeURIComponent(facts.contractId)}`}>
          <Icon name="arrow-left" size={15} />
          {ui("admin.rc.backToContract")}
        </Link>
        <div className="rc-tools">
          {/* THE LANGUAGE OF THE PAPER, not of the console — see the note on the
              state. Screen furniture: it never prints, and the sheet beside it
              is the preview, so what you pick is what comes out. */}
          <div className="rc-langs" role="group" aria-label={ui("admin.rc.langAria")}>
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                className={"rc-lang" + (lang === code ? " is-active" : "")}
                aria-pressed={lang === code}
                lang={code}
                onClick={() => setLang(code)}
              >
                {/* Each language named IN ITSELF — “English”, “العربية”, “کوردی”.
                    A Kurdish tenant looking for their language should not have
                    to find the word “Kurdish” written in English first. */}
                {translate(code, "lang." + code)}
              </button>
            ))}
          </div>
          <Button hierarchy="primary" size="md" iconLeading="printer" onClick={() => window.print()}>
            {ui("admin.rc.print")}
          </Button>
        </div>
      </div>
      <p className="rc-hint">{ui("admin.rc.twoCopies")}</p>

      {/* The sheet is stamped with the DOCUMENT’s language and direction, so an
          Arabic receipt lays out right-to-left inside an English console. */}
      <div className="rc-sheet" lang={lang} dir={dirFor(lang)}>
        {/* NAMED, NOT ROLE-NEUTRAL. "Payer’s copy" made whoever is holding the
            sheet work out which of them they were; it says "Tenant’s copy",
            "Landlord’s copy", "Buyer’s copy" or "Seller’s copy" now, off the
            contract’s own words for its two sides. */}
        <Copy facts={facts} kind={kind} t={t} lang={lang} copyLabel={t("admin.rc.copy.of", { role: t(facts.partyRoleKey) })} />
        {/* The cut line. Dashed on screen and on paper — it is an instruction to
            whoever picks the sheet up, not decoration. */}
        <div className="rc-cut" aria-hidden="true">
          <span>{t("admin.rc.cutHere")}</span>
        </div>
        <Copy facts={facts} kind={kind} t={t} lang={lang} copyLabel={t("admin.rc.copy.office")} />
      </div>
    </div>
  );
}
