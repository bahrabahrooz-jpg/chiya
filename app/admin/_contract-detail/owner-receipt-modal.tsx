"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate } from "@/lib/fmt";
import { formatMoney } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import { DateInput, Labelled } from "../_shared/finance/controls";
import { TODAY } from "../_shared/finance";
import { useContracts } from "../_shared/contracts-store";
import type { PaymentRecord } from "../_data/contracts";

/* =============================================================================
   The landlord took his money — on a tenancy he collects himself.

   ⚠ IT ASKS FOR ONE THING: THE DAY. That is the entire reason this exists. His
   receipt used to be issued alongside the tenant's and carried the tenant's
   date, so a landlord who came in on the 9th signed a paper saying he had
   received the money on the 1st. The tenant's payment and the landlord's
   collection are two events on two days, and each paper carries its own.

   NOTHING ELSE IS ASKED. The amount, the party, the month and the property all
   come from the payment — nobody is re-entering money that is already recorded,
   and a second figure typed here could disagree with the first.

   NO MONEY MOVES. The cash went straight from tenant to landlord; the agency
   never held it, so there is no ledger line and no payout. What is recorded is
   that the paper now exists, and when.
   ========================================================================== */

export function OwnerReceiptModal({
  payment,
  ownerName,
  what,
  onClose,
  onDone,
}: {
  payment: PaymentRecord;
  ownerName: string;
  /** The invoice line — "Rent — Zaytun Court — Jun 2026". */
  what: string;
  onClose: () => void;
  onDone: (on: string) => void;
}) {
  const { t, lang } = useLang();
  const { receiptOwner } = useContracts();
  const [on, setOn] = useState(TODAY);

  const confirm = () => {
    if (!on) return;
    receiptOwner(payment.id, on);
    onDone(on);
  };

  return (
    <FinanceModal
      icon="printer"
      title={t("admin.rc.make.title")}
      sub={t("admin.rc.make.sub", { name: ownerName })}
      onClose={onClose}
      footNote={
        <p className="fm-note">
          <Icon name="info" size={14} />
          {t("admin.rc.make.note", { paid: fmtDate(lang, fromIso(payment.receivedOn)) })}
        </p>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!on} onClick={confirm}>
            <Icon name="printer" size={16} />
            {t("admin.rc.make.confirm")}
          </button>
        </>
      }
    >
      {/* What it is for, read-only: the figures are the payment's and are not
          re-asked. */}
      <div className="ctd-doc ctd-doc--pending">
        <span className="ctd-doc__ic">
          <Icon name="receipt" size={17} />
        </span>
        <span className="ctd-doc__txt">
          <span className="ctd-doc__who">{formatMoney(lang, payment.receivedAmount)}</span>
          <span className="ctd-doc__what">{what}</span>
        </span>
      </div>

      <Labelled label={t("admin.rc.make.on")} hint={t("admin.rc.make.onHint")} htmlFor="rc-owner-on">
        <DateInput id="rc-owner-on" value={on} onChange={setOn} ariaLabel={t("admin.rc.make.on")} />
      </Labelled>
    </FinanceModal>
  );
}
