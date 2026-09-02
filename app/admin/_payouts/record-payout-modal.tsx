"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate } from "@/lib/fmt";
import { formatMoney, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import { DateInput, Labelled, MoneyInput, Segmented, moneyToText, textToMoney } from "../_shared/finance/controls";
import { TODAY, useFinanceActions } from "../_shared/finance";
import type { PaymentMethod } from "../_data/contracts";
import type { PayoutRow } from "./data";

/* =============================================================================
   RecordPayoutModal — the landlord came in and took his money.

   THE MIRROR OF RecordPaymentModal, and it looks like one on purpose: same
   shell, same date, method and reference row, so a person who has recorded a
   tenant's payment has already used this.

   IT SETTLES CREDITS, NOT A BALANCE. Every row handed in is one thing that came
   through the agency for him — June's rent on one flat, or a damages deduction
   off a tenant's deposit — pre-filled with whatever is still owed on it. A
   landlord who has not been in since spring takes June and July together, ticks
   both, and signs once; the ledger keeps them as separate lines so "did you pass
   me June" stays a question with an answer. See payoutEntry.

   ⚠ NO INVOICE IS RAISED. Nobody is demanding anything of the landlord; this is
   his own money going back to him. What he signs is a RECEIPT, printed from the
   payout afterwards.
   ========================================================================== */

const METHODS: PaymentMethod[] = ["cash", "bank_transfer", "cheque", "card"];

export function RecordPayoutModal({
  ownerName,
  rows,
  onClose,
  onPaid,
}: {
  ownerName: string;
  /** The months being settled — already narrowed to one owner, still owing. */
  rows: PayoutRow[];
  onClose: () => void;
  onPaid: (info: { count: number; totals: Money[] }) => void;
}) {
  const { t, lang } = useLang();
  const { payOwner } = useFinanceActions();

  const [on, setOn] = useState(TODAY);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(rows.map((r) => [r.creditId, moneyToText(r.owed)])),
  );

  const parsed = useMemo(
    () =>
      rows
        .map((row) => ({ row, amount: textToMoney(amounts[row.creditId] ?? "", row.owed.currency) }))
        .filter((x) => x.amount && x.amount.amount > 0),
    [rows, amounts],
  );

  /* Summed per currency and never across them — the rule on ownerBalance. */
  const totals = useMemo(() => {
    const by = new Map<CurrencyCode, number>();
    for (const p of parsed) by.set(p.amount!.currency, (by.get(p.amount!.currency) ?? 0) + p.amount!.amount);
    return [...by].map(([currency, amount]) => ({ amount, currency }) as Money);
  }, [parsed]);

  /* Handing over more than is left on a month is not a rounding slip, it is
     money that came from somewhere else. Blocked rather than warned. */
  const overpaid = parsed.filter((p) => p.amount!.amount > p.row.owed.amount);
  const canPay = parsed.length > 0 && !!on && overpaid.length === 0;

  const confirm = () => {
    if (!canPay) return;
    const count = payOwner({
      ownerId: rows[0].ownerId,
      on,
      method,
      reference,
      lines: parsed.map((p) => ({
        contractId: p.row.contractId,
        settles: p.row.creditId,
        ...(p.row.invoiceId ? { invoiceId: p.row.invoiceId } : {}),
        amount: p.amount!,
      })),
    });
    if (count > 0) onPaid({ count, totals });
  };

  return (
    <FinanceModal
      icon="arrow-up-right"
      title={t("admin.po.rp.title")}
      sub={t("admin.po.rp.sub", { name: ownerName })}
      onClose={onClose}
      footNote={
        overpaid.length > 0 ? (
          <p className="fm-note fm-note--warning">
            <Icon name="triangle-alert" size={14} />
            {t("admin.po.rp.overWarning")}
          </p>
        ) : (
          <p className="fm-note">
            <Icon name="info" size={14} />
            {t("admin.po.rp.note")}
          </p>
        )
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!canPay} onClick={confirm}>
            <Icon name="arrow-up-right" size={16} />
            {totals.length === 1 ? t("admin.po.rp.confirmAmount", { amount: formatMoney(lang, totals[0]) }) : t("admin.po.rp.confirm")}
          </button>
        </>
      }
    >
      {/* WHICH MONTHS THIS SETTLES. Named one by one, because that is how the
          money arrived and how the landlord will ask about it later. */}
      <Labelled label={t("admin.po.rp.lines")}>
        <div className="po-paylines">
          {rows.map((r) => (
            <div className="po-payline" key={r.creditId}>
              <span className="po-payline__txt">
                <span className="po-payline__title">{r.what}</span>
                <span className="po-payline__meta">
                  {t("admin.po.rp.collected", {
                    date: fmtDate(lang, fromIso(r.collectedOn)),
                    gross: formatMoney(lang, r.gross),
                    fee: formatMoney(lang, r.fee),
                  })}
                </span>
              </span>
              <span className="po-payline__amount">
                <MoneyInput
                  value={amounts[r.creditId] ?? ""}
                  onChange={(v) => setAmounts((prev) => ({ ...prev, [r.creditId]: v }))}
                  currency={r.owed.currency}
                  ariaLabel={t("admin.po.rp.amountFor", { property: r.what })}
                />
              </span>
            </div>
          ))}
          <div className="po-paylines__total">
            <span>{t("admin.po.rp.total")}</span>
            <b>
              {totals.length === 0
                ? formatMoney(lang, zeroMoney(rows[0]?.owed.currency ?? "USD"))
                : totals.map((m) => formatMoney(lang, m)).join(" + ")}
            </b>
          </div>
        </div>
      </Labelled>

      <Labelled label={t("admin.po.rp.on")} htmlFor="po-on">
        <DateInput id="po-on" value={on} onChange={setOn} ariaLabel={t("admin.po.rp.on")} />
      </Labelled>

      <Labelled label={t("admin.fin.rp.method")}>
        <Segmented
          value={method}
          ariaLabel={t("admin.fin.rp.method")}
          onChange={setMethod}
          options={METHODS.map((m) => ({ value: m, label: t(`admin.fin.method.${m}`) }))}
        />
      </Labelled>

      <Labelled label={t("admin.fin.rp.reference")} optional={t("admin.fin.optional")} hint={t("admin.po.rp.referenceHint")}>
        <input type="text" className="fm-input" value={reference} onChange={(e) => setReference(e.target.value)} />
      </Labelled>
    </FinanceModal>
  );
}
