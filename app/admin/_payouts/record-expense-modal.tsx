"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { formatMoney, subtract, type Money } from "@/lib/money";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import { DateInput, Labelled, MoneyInput, textToMoney } from "../_shared/finance/controls";
import { TODAY, useFinanceActions } from "../_shared/finance";

/* =============================================================================
   RecordExpenseModal — the agency paid somebody for the landlord.

   A plumber, a locksmith, an end-of-tenancy clean. On a managed tenancy the
   agency arranges the work and pays out of rent it is already holding, then
   accounts for it: the cost comes off what the landlord is owed.

   ⚠ THIS IS NOT AN INVOICE TO HIM. Nothing is demanded, nothing appears on the
   invoices list, and no receipt is printed — the receipt for a repair is the
   CONTRACTOR'S, and he is not a party to anything here. What this records is
   that the money left, and whose balance it left from.

   WHERE THE AGENCY IS HOLDING NOTHING OF HIS, this is the wrong tool: there is
   no balance to take it out of, so the cost has to be billed to him. That is
   Add invoice on the contract, and the note below says so.

   THE REMAINING BALANCE IS SHOWN AS IT IS TYPED. Spending a landlord's money is
   the one act on this screen where somebody should see the consequence before
   confirming, not after.
   ========================================================================== */

export function RecordExpenseModal({
  contractId,
  propertyTitle,
  ownerName,
  balance,
  onClose,
  onSpent,
}: {
  contractId: string;
  propertyTitle: string;
  ownerName: string;
  /** What is owed to him right now, before this. */
  balance: Money;
  onClose: () => void;
  onSpent: (info: { amount: Money }) => void;
}) {
  const { t, lang } = useLang();
  const { spendForOwner } = useFinanceActions();

  const [on, setOn] = useState(TODAY);
  const [what, setWhat] = useState("");
  const [amountText, setAmountText] = useState("");

  const amount = useMemo(() => textToMoney(amountText, balance.currency), [amountText, balance.currency]);
  const remaining = useMemo(() => (amount ? subtract(balance, amount) : balance), [balance, amount]);
  const canSave = !!amount && amount.amount > 0 && !!what.trim() && !!on;

  /* Spending more than is held does not fail — it puts the landlord in debt to
     the agency, which is a real state and one the statement can show. It is
     warned about rather than blocked, because an emergency repair on a flat
     whose rent has not arrived yet is ordinary. */
  const overspent = remaining.amount < 0;

  const confirm = () => {
    if (!canSave || !amount) return;
    if (spendForOwner({ contractId, on, amount, what })) onSpent({ amount });
  };

  return (
    <FinanceModal
      icon="wrench"
      title={t("admin.po.ex.title")}
      sub={t("admin.po.ex.sub", { property: propertyTitle, name: ownerName })}
      onClose={onClose}
      footNote={
        overspent ? (
          <p className="fm-note fm-note--warning">
            <Icon name="triangle-alert" size={14} />
            {t("admin.po.ex.overWarning", { amount: formatMoney(lang, balance) })}
          </p>
        ) : (
          <p className="fm-note">
            <Icon name="info" size={14} />
            {t("admin.po.ex.note")}
          </p>
        )
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!canSave} onClick={confirm}>
            <Icon name="wrench" size={16} />
            {t("admin.po.ex.confirm")}
          </button>
        </>
      }
    >
      <Labelled label={t("admin.po.ex.what")} hint={t("admin.po.ex.whatHint")} htmlFor="po-ex-what">
        <input
          id="po-ex-what"
          type="text"
          className="fm-input"
          value={what}
          placeholder={t("admin.po.ex.whatPh")}
          onChange={(e) => setWhat(e.target.value)}
          autoFocus
        />
      </Labelled>

      <Labelled label={t("admin.po.ex.amount")}>
        <MoneyInput value={amountText} onChange={setAmountText} currency={balance.currency} ariaLabel={t("admin.po.ex.amount")} />
      </Labelled>

      <Labelled label={t("admin.po.ex.on")} htmlFor="po-ex-on">
        <DateInput id="po-ex-on" value={on} onChange={setOn} ariaLabel={t("admin.po.ex.on")} />
      </Labelled>

      {/* The consequence, before the button rather than after it. */}
      <div className="po-paylines__total">
        <span>{t("admin.po.ex.remaining")}</span>
        <b>{formatMoney(lang, remaining)}</b>
      </div>
    </FinanceModal>
  );
}
