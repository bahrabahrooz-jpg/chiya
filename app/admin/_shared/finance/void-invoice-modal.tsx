"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { localizeDigits } from "@/lib/fmt";
import { formatMoney } from "@/lib/money";
import { invoiceTotals, type InvoiceRecord } from "../../_data/contracts";
import { useFinanceActions } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { Labelled } from "./controls";

/* =============================================================================
   VoidInvoiceModal — the only outward action on an issued invoice.

   There is no edit and no delete for a non-draft invoice anywhere in this
   application, and that is structural rather than a matter of which buttons got
   built: the store has no updateInvoice and no deleteInvoice to call.

   VOIDING NEVER REMOVES ANYTHING. The invoice stays on the contract, struck
   through and tagged Void, with the reason and the date on it — and a credit
   note is raised that mirrors it exactly, so the pair nets to zero. A document
   that went out is a record of something that happened, and a record that
   vanishes is one nobody can ask about afterwards.

   THE REASON IS REQUIRED. "Void" with no reason is unusable in a report and
   cannot be reconstructed later; the person who knows why is the person
   standing here now.
   ========================================================================== */

export interface VoidInvoiceModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onVoided: () => void;
}

export function VoidInvoiceModal({ invoice, onClose, onVoided }: VoidInvoiceModalProps) {
  const { t, lang } = useLang();
  const { voidInvoice } = useFinanceActions();
  const [reason, setReason] = useState("");

  const total = invoiceTotals(invoice).total;
  const canVoid = reason.trim().length > 0;

  return (
    <FinanceModal
      icon="ban"
      tone="danger"
      title={t("admin.fin.vi.title")}
      sub={t("admin.fin.vi.sub")}
      onClose={onClose}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            className="fm-btn fm-btn--danger"
            disabled={!canVoid}
            onClick={() => {
              if (!canVoid) return;
              voidInvoice(invoice.id, reason.trim());
              onVoided();
            }}
          >
            <Icon name="ban" size={16} />
            {t("admin.fin.vi.confirm")}
          </button>
        </>
      }
    >
      <div className="fm-invoice">
        <div className="fm-invoice__top">
          <span className="fm-invoice__number">{localizeDigits(lang, invoice.number)}</span>
        </div>
        <p className="fm-invoice__desc">{invoice.lines[0]?.description ?? ""}</p>
        <div className="fm-invoice__figures">
          <span className="fm-invoice__amount">{formatMoney(lang, total)}</span>
        </div>
      </div>

      <Labelled label={t("admin.fin.vi.reason")} hint={t("admin.fin.vi.reasonHint")} htmlFor="fm-void-reason">
        <textarea
          id="fm-void-reason"
          className="fm-input"
          value={reason}
          autoFocus
          onChange={(e) => setReason(e.target.value)}
        />
      </Labelled>

      <p className="fm-note">
        <Icon name="history" size={14} />
        {t("admin.fin.vi.staysVisible")}
      </p>
    </FinanceModal>
  );
}
