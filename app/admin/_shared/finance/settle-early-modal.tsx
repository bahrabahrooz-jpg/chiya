"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";
import { formatMoney, sumMoney } from "@/lib/money";
import { daysBetween } from "@/lib/dates";
import { invoicesByContract, outstanding, type ContractRecord } from "../../_data/contracts";
import { useContracts } from "../contracts-store";
import { TODAY, useFinanceActions, type EarlySettlementResult } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { DateInput, FieldRow, Labelled, SelectField } from "./controls";
import type { PaymentMethod } from "../../_data/contracts";

/* =============================================================================
   SETTLE EARLY — the buyer clears the rest of an instalment plan in one go.

   Ordinary on an instalment sale: money comes in, or a bank finally approves a
   mortgage, and the buyer would rather be done. What it must NOT do is quietly
   destroy the schedule that was agreed.

   · The instalments already DEMANDED are paid off, one payment each, so every
     invoice closes properly. One lump payment against a single invoice would
     leave the rest reading as unpaid for ever.
   · The FUTURE instalments are VOIDED, never deleted — each gets a credit note,
     so the schedule on the contract and the invoices behind it still agree, and
     the reason is on the record.
   · The contract becomes `completed`, not `cancelled`. The buyer did everything
     they agreed to, and faster.

   See `settleEarly` in ./finance-actions, which is where all of that happens.
   ========================================================================== */

export interface SettleEarlyModalProps {
  contract: ContractRecord;
  onClose: () => void;
  onSettled: (result: EarlySettlementResult) => void;
}

const METHODS: PaymentMethod[] = ["bank_transfer", "cash", "card", "cheque"];

export function SettleEarlyModal({ contract, onClose, onSettled }: SettleEarlyModalProps) {
  const { t, lang } = useLang();
  const { invoices, payments } = useContracts();
  const { settleEarly } = useFinanceActions();

  const [receivedOn, setReceivedOn] = useState(TODAY);
  const [method, setMethod] = useState<PaymentMethod>("bank_transfer");
  const [reference, setReference] = useState("");

  /* Split exactly the way `settleEarly` splits it, so the figures somebody
     reads here are the figures the action produces. */
  const { owedNow, futureCount, futureTotal } = useMemo(() => {
    const live = invoicesByContract(contract.id, invoices).filter((i) => i.status === "issued");
    const cur = contract.price.currency;
    const due = live.filter((i) => daysBetween(i.dueOn, TODAY) >= 0);
    const future = live.filter((i) => daysBetween(i.dueOn, TODAY) < 0);
    return {
      owedNow: sumMoney(due.map((i) => outstanding(i, payments)).filter((m) => m.currency === cur), cur),
      futureCount: future.length,
      futureTotal: sumMoney(future.map((i) => outstanding(i, payments)).filter((m) => m.currency === cur), cur),
    };
  }, [contract, invoices, payments]);

  return (
    <FinanceModal
      icon="circle-check"
      title={t("admin.fin.settle.title")}
      sub={t("admin.fin.settle.sub", { id: contract.id })}
      onClose={onClose}
      footNote={
        <p className="fm-note">
          {t("admin.fin.settle.note", {
            due: formatMoney(lang, owedNow),
            count: fmtNum(lang, futureCount),
            future: formatMoney(lang, futureTotal),
          })}
        </p>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            className="fm-btn fm-btn--primary"
            disabled={!reference.trim()}
            onClick={() => {
              const result = settleEarly({ contract, receivedOn, method, reference: reference.trim() });
              if (result) onSettled(result);
            }}
          >
            {t("admin.fin.settle.confirm")}
          </button>
        </>
      }
    >
      <FieldRow>
        <Labelled label={t("admin.fin.settle.amount")} hint={t("admin.fin.settle.amountHint")}>
          {/* Read-only: the settlement figure is the balance, not something to
              negotiate in this box. A different amount is a part payment, and
              that is what Record payment is for. */}
          <div className="fm-computed">
            <span className="fm-computed__value">{formatMoney(lang, owedNow)}</span>
          </div>
        </Labelled>
      </FieldRow>
      <FieldRow>
        <Labelled label={t("admin.fin.rp.receivedOn")} hint={t("admin.fin.settle.receivedHint", { today: fmtDate(lang, fromIso(TODAY)) })}>
          <DateInput value={receivedOn} onChange={setReceivedOn} />
        </Labelled>
      </FieldRow>
      <FieldRow>
        <Labelled label={t("admin.fin.rp.method")} hint={t("admin.fin.settle.methodHint")}>
          <SelectField value={method} onChange={setMethod} options={METHODS.map((m) => ({ value: m, label: t("admin.fin.method." + m) }))} />
        </Labelled>
      </FieldRow>
      <FieldRow>
        <Labelled label={t("admin.fin.rp.reference")} hint={t("admin.fin.settle.referenceHint")}>
          <input className="fm-input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder={t("admin.fin.settle.referencePh")} />
        </Labelled>
      </FieldRow>
    </FinanceModal>
  );
}
