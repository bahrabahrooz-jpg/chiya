"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { formatMoney, sumMoney, zeroMoney } from "@/lib/money";
import { addDays } from "@/lib/dates";
import type { ContractRecord } from "../../_data/contracts";
import { TODAY, useFinanceActions } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { DateInput, Labelled, MoneyInput, Segmented, textToMoney } from "./controls";

/* =============================================================================
   AddInvoiceModal — the charges a contract could not predict.

   A repair, a late fee, a cleaning bill at the end of a tenancy. Rare, which is
   why it is a modal and not a screen.

   THE TOTAL IS COMPUTED FROM THE LINES AND NEVER TYPED. A total someone can
   type is a total that can disagree with the lines under it, and on a document
   that goes to a customer that disagreement is the whole problem.

   THE BUTTON SAYS "ISSUE INVOICE", NOT "SAVE". Save is a word for things you
   can come back and change. Once this is issued the only thing that can happen
   to it is a void, which leaves the record standing with a reason on it — so
   the button has to say what it is really doing.
   ========================================================================== */

/** How long an unpredicted charge gets before it falls due. Two weeks, the same
    terms the agency's own commission is issued on. */
const EXTRA_DUE_DAYS = 14;

interface DraftLine {
  key: number;
  description: string;
  amountText: string;
}

export interface AddInvoiceModalProps {
  contract: ContractRecord;
  /** Name shown on the "bill to" control — the tenant or buyer. */
  counterpartyName?: string;
  ownerName: string;
  onClose: () => void;
  onIssued: (info: { number: string }) => void;
}

export function AddInvoiceModal({ contract, counterpartyName, ownerName, onClose, onIssued }: AddInvoiceModalProps) {
  const { t, lang } = useLang();
  const { issueExtraInvoice } = useFinanceActions();

  const currency = contract.price.currency;
  const [billTo, setBillTo] = useState<"counterparty" | "owner">(counterpartyName ? "counterparty" : "owner");
  const [dueOn, setDueOn] = useState(addDays(TODAY, EXTRA_DUE_DAYS));
  const [lines, setLines] = useState<DraftLine[]>([{ key: 1, description: "", amountText: "" }]);
  const [nextKey, setNextKey] = useState(2);

  const parsed = useMemo(
    () =>
      lines
        .map((l) => ({ description: l.description.trim(), amount: textToMoney(l.amountText, currency) }))
        .filter((l) => l.description && l.amount && l.amount.amount > 0),
    [lines, currency],
  );

  /* Computed, always. See the header. */
  const total = useMemo(
    () => sumMoney(parsed.map((l) => l.amount!), currency),
    [parsed, currency],
  );

  const canIssue = parsed.length > 0 && !!dueOn;

  const setLine = (key: number, patch: Partial<DraftLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const confirm = () => {
    if (!canIssue) return;
    const issued = issueExtraInvoice({
      contract,
      billTo,
      dueOn,
      lines: parsed.map((l) => ({ description: l.description, amount: l.amount! })),
    });
    if (issued) onIssued({ number: issued.number });
  };

  return (
    <FinanceModal
      icon="receipt"
      title={t("admin.fin.ai.title")}
      sub={t("admin.fin.ai.sub")}
      onClose={onClose}
      footNote={
        <p className="fm-note fm-note--warning">
          <Icon name="lock" size={14} />
          {t("admin.fin.ai.cannotEdit")}
        </p>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!canIssue} onClick={confirm}>
            <Icon name="receipt" size={16} />
            {t("admin.fin.ai.issue")}
          </button>
        </>
      }
    >
      {/* An extra charge can go to either party — a repair recharged to the
          owner, a late fee charged to the tenant. */}
      <Labelled label={t("admin.fin.ai.billTo")}>
        <Segmented
          value={billTo}
          ariaLabel={t("admin.fin.ai.billTo")}
          onChange={setBillTo}
          options={[
            {
              value: "counterparty",
              label: counterpartyName ?? t(contract.kind === "sale" ? "admin.pd.buyer" : "admin.pd.tenant"),
            },
            { value: "owner", label: ownerName || t(contract.kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord") },
          ]}
        />
      </Labelled>

      <Labelled label={t("admin.fin.ai.lines")}>
        <div className="fm-lines">
          {lines.map((line) => (
            <div className="fm-line" key={line.key}>
              <input
                type="text"
                className="fm-input"
                value={line.description}
                placeholder={t("admin.fin.ai.descriptionPh")}
                aria-label={t("admin.fin.ai.descriptionPh")}
                onChange={(e) => setLine(line.key, { description: e.target.value })}
              />
              <div className="fm-line__amount">
                <MoneyInput
                  value={line.amountText}
                  onChange={(v) => setLine(line.key, { amountText: v })}
                  currency={currency}
                  ariaLabel={t("admin.fin.ai.amount")}
                />
              </div>
              <button
                type="button"
                className="fm-line__remove"
                aria-label={t("admin.fin.ai.removeLine")}
                disabled={lines.length === 1}
                onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
              >
                <Icon name="trash-2" size={16} />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="fm-lines__add"
            onClick={() => {
              setLines((prev) => [...prev, { key: nextKey, description: "", amountText: "" }]);
              setNextKey((k) => k + 1);
            }}
          >
            <Icon name="plus" size={15} />
            {t("admin.fin.ai.addLine")}
          </button>
          <div className="fm-lines__total">
            <span>{t("admin.fin.ai.total")}</span>
            <b>{formatMoney(lang, parsed.length ? total : zeroMoney(currency))}</b>
          </div>
        </div>
      </Labelled>

      <Labelled label={t("admin.fin.ai.dueOn")} htmlFor="fm-extra-due">
        <DateInput id="fm-extra-due" value={dueOn} onChange={setDueOn} ariaLabel={t("admin.fin.ai.dueOn")} />
      </Labelled>

      {/* Currency follows the contract and is not offered as a choice: an
          invoice's lines must all be in the contract's currency, which is what
          makes every total on it safe to add up. */}
      <p className="fm-note">
        <Icon name="info" size={14} />
        {t("admin.fin.ai.currencyNote", { currency })}
      </p>
    </FinanceModal>
  );
}
