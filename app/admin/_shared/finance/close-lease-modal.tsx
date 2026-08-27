"use client";

import { useMemo, useState } from "react";
import { useLang } from "@/lib/i18n";
import { formatMoney, isNegative, isZero, subtract, type Money } from "@/lib/money";
import { type ContractRecord } from "../../_data/contracts";
import { useContracts } from "../contracts-store";
import { useFinanceActions, type DepositOutcome } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { FieldRow, Labelled, MoneyInput, SelectField, textToMoney } from "./controls";

/* =============================================================================
   CLOSE LEASE — what became of the insurance deposit.

   NOT A FIELD ON THE CREATION FORM, and that is the whole point of it being
   here. Nobody knows at a signing how a tenancy ends. The deposit is taken, it
   sits in the agency's account for a year, and then somebody has to decide.

   The failure this exists to prevent is quiet and expensive: a lease runs out,
   the tenant moves on, and the deposit stays in the account with nothing on any
   screen saying it is there — until the tenant rings up eighteen months later
   asking for it back and nobody can say what happened. An ended lease still
   holding a deposit is surfaced as an outstanding item on the contracts list
   and the finance page for exactly that reason.

   THREE OUTCOMES, and one of them moves no money at all:

     Return in full     handed back, `returned`
     Deduct damages     amount and reason required, the rest handed back,
                        `partly_returned`
     Carry to renewal   rolled into the new tenancy, `carried_forward`, linked
                        by depositCarriedToContractId

   ⚠ NONE OF THEM RAISES AN INVOICE, AND NONE OF THEM IS REVENUE. Returning a
   deposit hands back money that was never ours. A damages deduction goes to the
   landlord to put the damage right, not to the agency. Carrying one forward is
   a bookkeeping entry. See `closeLease` in ./finance-actions.
   ========================================================================== */

export interface CloseLeaseModalProps {
  contract: ContractRecord;
  onClose: () => void;
  onClosed: (outcome: DepositOutcome) => void;
}

export function CloseLeaseModal({ contract, onClose, onClosed }: CloseLeaseModalProps) {
  const { t, lang } = useLang();
  const { closeLease } = useFinanceActions();
  const { contracts } = useContracts();

  const held: Money = contract.insuranceDeposit ?? { amount: 0, currency: contract.price.currency };
  const [kind, setKind] = useState<DepositOutcome["kind"]>("returned");
  const [deductionText, setDeductionText] = useState("");
  const [reason, setReason] = useState("");
  const [carryTo, setCarryTo] = useState("");

  const deduction = textToMoney(deductionText, held.currency);
  const remainder = deduction ? subtract(held, deduction) : held;

  /* A renewal can only be a LATER tenancy on the SAME property — carrying a
     deposit onto an unrelated contract would move a tenant's money somewhere
     they never agreed to. */
  const renewalOptions = useMemo(
    () =>
      contracts
        .filter((c) => c.id !== contract.id && c.propertyId === contract.propertyId && c.kind === "rent" && c.status !== "cancelled")
        .map((c) => ({ value: c.id, label: c.id })),
    [contracts, contract],
  );

  const overDeducted = !!deduction && isNegative(subtract(held, deduction));
  const canConfirm =
    kind === "returned" ||
    (kind === "partly_returned" && !!deduction && !isZero(deduction) && !overDeducted && !!reason.trim()) ||
    (kind === "carried_forward" && !!carryTo);

  const outcome = (): DepositOutcome =>
    kind === "returned"
      ? { kind: "returned" }
      : kind === "partly_returned"
        ? { kind: "partly_returned", deduction: deduction!, reason: reason.trim() }
        : { kind: "carried_forward", toContractId: carryTo };

  return (
    <FinanceModal
      icon="wallet"
      tone="warning"
      title={t("admin.fin.closeLease.title")}
      sub={t("admin.fin.closeLease.sub", { amount: formatMoney(lang, held) })}
      onClose={onClose}
      footNote={
        <p className="fm-note">
          {kind === "returned"
            ? t("admin.fin.closeLease.noteReturn", { amount: formatMoney(lang, held) })
            : kind === "partly_returned"
              ? t("admin.fin.closeLease.notePartial", {
                  kept: formatMoney(lang, deduction ?? { amount: 0, currency: held.currency }),
                  back: formatMoney(lang, remainder),
                })
              : t("admin.fin.closeLease.noteCarry")}
        </p>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            className="fm-btn fm-btn--primary"
            disabled={!canConfirm}
            onClick={() => {
              const o = outcome();
              closeLease(contract.id, o);
              onClosed(o);
            }}
          >
            {t("admin.fin.closeLease.confirm")}
          </button>
        </>
      }
    >
      <FieldRow>
        <Labelled label={t("admin.fin.closeLease.outcome")} hint={t("admin.fin.closeLease.outcomeHint")}>
          <SelectField
            value={kind}
            onChange={(v) => setKind(v as DepositOutcome["kind"])}
            options={[
              { value: "returned", label: t("admin.fin.closeLease.returned") },
              { value: "partly_returned", label: t("admin.fin.closeLease.partly") },
              { value: "carried_forward", label: t("admin.fin.closeLease.carried") },
            ]}
          />
        </Labelled>
      </FieldRow>

      {/* Removed, not disabled — there is nothing to type when the whole
          deposit is going back. */}
      {kind === "partly_returned" && (
        <>
          <FieldRow>
            <Labelled
              label={t("admin.fin.closeLease.deduction")}
              hint={t("admin.fin.closeLease.deductionHint", { held: formatMoney(lang, held) })}
              error={overDeducted ? t("admin.fin.closeLease.overDeducted") : undefined}
            >
              <MoneyInput value={deductionText} onChange={setDeductionText} currency={held.currency} autoFocus />
            </Labelled>
          </FieldRow>
          <FieldRow>
            <Labelled label={t("admin.fin.closeLease.reason")} hint={t("admin.fin.closeLease.reasonHint")}>
              <input className="fm-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("admin.fin.closeLease.reasonPh")} />
            </Labelled>
          </FieldRow>
        </>
      )}

      {kind === "carried_forward" && (
        <FieldRow>
          <Labelled
            label={t("admin.fin.closeLease.carryTo")}
            hint={t("admin.fin.closeLease.carryToHint")}
            error={renewalOptions.length === 0 ? t("admin.fin.closeLease.noRenewal") : undefined}
          >
            <SelectField
              value={carryTo}
              onChange={setCarryTo}
              options={[{ value: "", label: t("admin.fin.closeLease.selectRenewal") }, ...renewalOptions]}
            />
          </Labelled>
        </FieldRow>
      )}

      <p className="fm-note fm-note--muted">{t("admin.fin.closeLease.notIncome")}</p>
    </FinanceModal>
  );
}
