"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { formatMoney } from "@/lib/money";
import { addDays, daysBetween, fromIso } from "@/lib/dates";
import { invoiceTotals, type InvoiceRecord } from "../../_data/contracts";
import { invoiceLineText } from "./invoice-generation";
import { TODAY, useFinanceActions } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { DateInput, Labelled } from "./controls";

/* =============================================================================
   PostponeInvoiceModal — "he asked for a week."

   The commonest sentence in a letting office, and the screen had no answer to
   it. An agent could leave the demand red, which tells everyone reading the
   file that the tenant is in default when he is not, or void it, which says the
   rent was never owed at all. Both are lies about the same week, and the second
   one burns an invoice number to tell it.

   WHAT THIS CHANGES IS THE DATE. Not the amount, not the party, not the lines —
   the store's postponeInvoice can reach nothing else, by construction. An
   extension of terms is not a reissued document; it is a dated line in the file
   saying who agreed to what, which is what the trail below records.

   THE REASON IS REQUIRED, for the same reason voiding demands one: "moved to
   the 7th" cannot be defended to a landlord asking why his rent is late, and
   the person who knows why is the one standing here now.

   ⚠ A PENALTY ALREADY RAISED IS NOT WITHDRAWN by giving more time. The demand
   was genuinely late before the extension was agreed. Waiving that charge is its
   own decision, taken by voiding the fee — never a side effect of this box.
   ========================================================================== */

export interface PostponeInvoiceModalProps {
  invoice: InvoiceRecord;
  onClose: () => void;
  onPostponed: () => void;
}

export function PostponeInvoiceModal({ invoice, onClose, onPostponed }: PostponeInvoiceModalProps) {
  const { t, lang } = useLang();
  const { postponeInvoice } = useFinanceActions();

  /* Seeded a week out from the date it carries now, because a week is what is
     actually asked for — and from the DUE DATE rather than from today, so
     extending an already-late demand does not quietly grant a fortnight. */
  const [to, setTo] = useState(() => addDays(invoice.dueOn, 7));
  const [reason, setReason] = useState("");

  const total = invoiceTotals(invoice).total;
  const later = to > invoice.dueOn;
  const canSave = later && reason.trim().length > 0;
  const shift = later ? daysBetween(invoice.dueOn, to) : 0;
  const alreadyLate = daysBetween(TODAY, invoice.dueOn) < 0;

  return (
    <FinanceModal
      icon="calendar-clock"
      title={t("admin.fin.pp.title")}
      sub={t("admin.fin.pp.sub")}
      onClose={onClose}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            className="fm-btn fm-btn--primary"
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return;
              postponeInvoice(invoice.id, to, reason.trim());
              onPostponed();
            }}
          >
            <Icon name="calendar-clock" size={16} />
            {t("admin.fin.pp.confirm")}
          </button>
        </>
      }
    >
      <div className="fm-invoice">
        <div className="fm-invoice__top">
          <span className="fm-invoice__number">{localizeDigits(lang, invoice.number)}</span>
        </div>
        <p className="fm-invoice__desc">{invoiceLineText(invoice.lines[0], t, lang)}</p>
        <div className="fm-invoice__figures">
          <span className="fm-invoice__amount">{formatMoney(lang, total)}</span>
        </div>
      </div>

      <Labelled
        label={t("admin.fin.pp.newDate")}
        hint={t("admin.fin.pp.currently", { date: fmtDate(lang, fromIso(invoice.dueOn)) })}
        htmlFor="fm-pp-date"
      >
        <DateInput id="fm-pp-date" value={to} onChange={setTo} />
      </Labelled>

      {/* Said in days as well as in a date, because "the 7th" is how it is
          agreed at the counter and "eight days" is what somebody is deciding. */}
      {later && <p className="fm-note">{t("admin.fin.pp.moves", { count: fmtNum(lang, shift) })}</p>}
      {!later && <p className="fm-note fm-note--warning">{t("admin.fin.pp.mustBeLater")}</p>}

      <Labelled label={t("admin.fin.pp.reason")} hint={t("admin.fin.pp.reasonHint")} htmlFor="fm-pp-reason">
        <textarea id="fm-pp-reason" className="fm-input" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Labelled>

      {/* Only where it is actually true — on a demand that is not yet late this
          sentence would be answering a question nobody asked. */}
      {alreadyLate && (
        <p className="fm-note">
          <Icon name="history" size={14} />
          {t("admin.fin.pp.penaltyStands")}
        </p>
      )}
    </FinanceModal>
  );
}
