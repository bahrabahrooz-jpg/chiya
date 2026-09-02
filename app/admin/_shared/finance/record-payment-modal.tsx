"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";
import { compareMoney, convert, formatMoney, isZero, maxMoney, subtract, zeroMoney, type CurrencyCode } from "@/lib/money";
import { enabledCurrencies, rateFor, usePlatformSettings } from "@/lib/platform-settings";
import {
  PLATFORM_CURRENCY,
  daysOverdue,
  invoiceCurrency,
  invoiceTotals,
  outstanding,
  type InvoiceRecord,
  type PaymentMethod,
} from "../../_data/contracts";
import { useContracts } from "../contracts-store";
import { invoiceLineText } from "./invoice-generation";
import { TODAY, useFinanceActions } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { Computed, DateInput, FieldRow, Labelled, MoneyInput, SelectField, moneyToText, textToMoney } from "./controls";

/* =============================================================================
   RecordPaymentModal — the most-used screen in the whole system.

   Twelve times a year per managed tenancy, plus every commission. Everything
   here is arranged around making the ORDINARY case two clicks: the amount is
   pre-filled with the full outstanding balance, the date is today, and the
   method is the one most rent arrives as. Open it, press the button.

   PAYING IN A DIFFERENT CURRENCY IS NOT AN EDGE CASE. A tenant settling a
   dollar invoice with a bag of cash dinars is how most tenancies actually get
   paid here. What arrived is recorded as what arrived, the rate used on the day
   is recorded beside it, and the credit against the invoice is derived from the
   two — so the receipt can say "3,406,000 IQD", because dinars are what changed
   hands and that is what the tenant will remember paying.
   ========================================================================== */

const METHODS: PaymentMethod[] = ["cash", "bank_transfer", "cheque", "card"];

export interface RecordPaymentModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onRecorded: (info: { settled: boolean }) => void;
}

export function RecordPaymentModal({ invoice, onClose, onRecorded }: RecordPaymentModalProps) {
  const { t, lang } = useLang();
  const { settings } = usePlatformSettings();
  const { payments } = useContracts();
  const { recordPayment } = useFinanceActions();

  const invCurrency = invoiceCurrency(invoice);
  const total = invoiceTotals(invoice).total;
  const owed = outstanding(invoice, payments);
  const lateDays = daysOverdue(invoice, payments);

  const [receivedCurrency, setReceivedCurrency] = useState<CurrencyCode>(invCurrency);
  /* Pre-filled with the whole balance — the common case is someone settling in
     full, and making them type a figure that is already on the screen above is
     the difference between two clicks and twelve. */
  const [amountText, setAmountText] = useState(moneyToText(owed));
  const [receivedOn, setReceivedOn] = useState(TODAY);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");

  const converting = receivedCurrency !== invCurrency;

  /**
   * The rate, stated the way people here say it: "1 USD = 1,310 IQD".
   *
   * Stored on the payment in the direction `convert` wants — target units per 1
   * source unit — which for dinars into a dollar invoice is 1/1310, a number
   * nobody would ever type. So the FIELD holds the familiar figure and the
   * conversion below turns it round.
   *
   * The pair is always "the platform currency and the other one", so the field
   * reads in the same direction whichever way the payment goes: the rate a
   * person quotes does not flip round because the invoice happened to be in
   * dinars.
   */
  const nonDefaultCurrency = useMemo(
    () => enabledCurrencies(settings).find((c) => c !== PLATFORM_CURRENCY) ?? invCurrency,
    [settings, invCurrency],
  );
  const [displayRateText, setDisplayRateText] = useState(() => String(rateFor(settings, nonDefaultCurrency)));

  const displayRate = Number(displayRateText);
  const rateValid = Number.isFinite(displayRate) && displayRate > 0;

  /** Units of `c` per one unit of the platform currency, with the typed rate
      standing in for the non-default side. */
  const perDefault = (c: CurrencyCode) => (c === PLATFORM_CURRENCY ? 1 : displayRate);
  const rateApplied = converting && rateValid ? perDefault(invCurrency) / perDefault(receivedCurrency) : undefined;

  const received = textToMoney(amountText, receivedCurrency);
  const credit = useMemo(() => {
    if (!received) return undefined;
    if (!converting) return received;
    return rateApplied ? convert(received, invCurrency, rateApplied) : undefined;
  }, [received, converting, rateApplied, invCurrency]);

  const remaining = credit ? maxMoney(subtract(owed, credit), zeroMoney(invCurrency)) : owed;
  const settles = !!credit && isZero(remaining);
  const overpaying = !!credit && compareMoney(credit, owed) > 0;
  const canRecord = !!credit && credit.amount > 0 && !!receivedOn && (!converting || rateValid);

  const confirm = () => {
    if (!canRecord || !received) return;
    recordPayment({
      invoice,
      receivedAmount: received,
      ...(converting && rateApplied ? { rateApplied } : {}),
      receivedOn,
      method,
      reference: reference.trim(),
    });
    onRecorded({ settled: settles });
  };

  const currencies = enabledCurrencies(settings);

  return (
    <FinanceModal
      icon="banknote"
      title={t("admin.fin.rp.title")}
      onClose={onClose}
      footNote={
        <div className={"fm-remaining" + (settles ? " fm-remaining--settled" : "")} aria-live="polite">
          <span>{t("admin.fin.rp.remainingAfter")}</span>
          <span className="fm-remaining__value">
            {t(settles ? "admin.fin.rp.valueSettled" : "admin.fin.rp.valuePartly", { amount: formatMoney(lang, remaining) })}
          </span>
        </div>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!canRecord} onClick={confirm}>
            <Icon name="circle-check" size={16} />
            {t("admin.fin.rp.confirm")}
          </button>
        </>
      }
    >
      {/* ---- what is being paid ---- */}
      <div className="fm-invoice">
        <div className="fm-invoice__top">
          <span className="fm-invoice__number">{invoice.number ? localizeDigits(lang, invoice.number) : t("admin.ct.inv.unnumbered")}</span>
        </div>
        <p className="fm-invoice__desc">{invoiceLineText(invoice.lines[0], t, lang)}</p>
        <div className="fm-invoice__figures">
          <span className="fm-invoice__amount">{formatMoney(lang, total)}</span>
          <span className={"fm-invoice__due" + (lateDays > 0 ? " fm-invoice__due--late" : "")}>
            {lateDays > 0
              ? t("admin.ct.inv.overdueDays", { count: fmtNum(lang, lateDays) })
              : t("admin.ct.inv.due", { date: fmtDate(lang, fromIso(invoice.dueOn)) })}
          </span>
        </div>
        {compareMoney(owed, total) !== 0 && (
          <p className="fm-hint">{t("admin.fin.rp.alreadyPaid", { amount: formatMoney(lang, subtract(total, owed)) })}</p>
        )}
      </div>

      {/* ---- what arrived ---- */}
      <FieldRow>
        <Labelled label={t("admin.fin.rp.amount")} htmlFor="fm-paid">
          <MoneyInput id="fm-paid" autoFocus value={amountText} onChange={setAmountText} currency={receivedCurrency} />
        </Labelled>
        <div className="fm-row__narrow">
          <Labelled label={t("admin.fin.nc.currency")}>
            <SelectField
              value={receivedCurrency}
              ariaLabel={t("admin.fin.nc.currency")}
              onChange={(c) => {
                const next = c as CurrencyCode;
                setReceivedCurrency(next);
                /* Re-state the pre-filled balance in the currency now selected,
                   so switching to dinars offers the dinar equivalent of what is
                   owed rather than the dollar figure with a new label. */
                if (next === invCurrency) {
                  setAmountText(moneyToText(owed));
                } else {
                  const toNext = perDefault(next) / perDefault(invCurrency);
                  setAmountText(moneyToText(convert(owed, next, toNext)));
                }
              }}
              options={currencies.map((c) => ({ value: c, label: c }))}
            />
          </Labelled>
        </div>
      </FieldRow>

      {converting && (
        <>
          <FieldRow>
            <Labelled
              label={t("admin.fin.rp.rateLabel", { from: PLATFORM_CURRENCY, to: nonDefaultCurrency })}
              htmlFor="fm-rate-applied"
              error={!rateValid ? t("admin.fin.rp.rateRequired") : undefined}
            >
              <input
                id="fm-rate-applied"
                type="text"
                inputMode="decimal"
                className="fm-input fm-input--num"
                value={displayRateText}
                onChange={(e) => setDisplayRateText(e.target.value)}
              />
            </Labelled>
            <Computed label={t("admin.fin.rp.credited")} value={credit ? formatMoney(lang, credit) : "—"} />
          </FieldRow>
          <p className="fm-note">
            <Icon name="info" size={14} />
            {t("admin.fin.rp.conversionNote")}
          </p>
        </>
      )}

      <FieldRow>
        <Labelled label={t("admin.fin.rp.receivedOn")} htmlFor="fm-received-on">
          <DateInput id="fm-received-on" value={receivedOn} onChange={setReceivedOn} ariaLabel={t("admin.fin.rp.receivedOn")} />
        </Labelled>
        <Labelled label={t("admin.fin.rp.method")}>
          <SelectField
            value={method}
            ariaLabel={t("admin.fin.rp.method")}
            onChange={setMethod}
            options={METHODS.map((m) => ({ value: m, label: t(`admin.fin.method.${m}`) }))}
          />
        </Labelled>
      </FieldRow>

      <Labelled label={t("admin.fin.rp.reference")} optional={t("admin.fin.optional")} hint={t("admin.fin.rp.referenceHint")}>
        <input type="text" className="fm-input" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Labelled>

      {overpaying && (
        <p className="fm-note fm-note--warning">
          <Icon name="triangle-alert" size={14} />
          {t("admin.fin.rp.overpayWarning", { amount: formatMoney(lang, subtract(credit!, owed)) })}
        </p>
      )}

      {/* The agency is about to be holding somebody else's money. Said plainly,
          because the ledger entries this writes are the only record of it. */}
      {invoice.payee === "owner" && (
        <p className="fm-note">
          <Icon name="landmark" size={14} />
          {t("admin.fin.rp.ownerMoneyNote")}
        </p>
      )}
    </FinanceModal>
  );
}
