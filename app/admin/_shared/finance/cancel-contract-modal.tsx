"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang, interleave } from "@/lib/i18n";
import { fmtNum } from "@/lib/fmt";
import { formatMoney, isZero } from "@/lib/money";
import { daysBetween } from "@/lib/dates";
import { paidTotal, type ContractRecord } from "../../_data/contracts";
import { useContracts } from "../contracts-store";
import { TODAY, useFinanceActions, type SaleDepositOutcome } from "./finance-actions";
import { CancelButton, FinanceModal } from "./modal-shell";
import { Labelled, Segmented } from "./controls";

/* =============================================================================
   Cancel a contract.

   THE INVOICES ARE NOT ALL TREATED THE SAME, and the modal says so before
   anything happens:

     not yet due   → withdrawn. Nothing was owed; the thing never happened.
     due or late   → LEFT AS OWED. The tenant lived there. Cancelling the
                     paperwork does not un-live those months, and a system that
                     quietly erased the debt would be doing the agency's
                     collections for it in the wrong direction.
     already paid  → untouched, in full or in part. Voiding writes a credit note
                     for the whole invoice, which would hand back cash that
                     genuinely arrived.

   Writing off a real debt is a separate, deliberate act with its own reason —
   not a side effect of pressing Cancel.
   ========================================================================== */

export interface CancelContractModalProps {
  contract: ContractRecord;
  onClose: () => void;
  onCancelled: (result: { voided: number; leftOwed: number }) => void;
}

export function CancelContractModal({ contract, onClose, onCancelled }: CancelContractModalProps) {
  const { t, lang } = useLang();
  const { invoicesByContract, payments } = useContracts();
  const { cancelContract } = useFinanceActions();
  const [reason, setReason] = useState("");
  /* Who pulled out. Only asked where the answer moves money — see below. */
  const [deposit, setDeposit] = useState<SaleDepositOutcome>("buyer_withdrew");

  /* Counted here for the warning, and counted again by cancelContract when it
     actually runs. Both read the same three rules from the same records, so the
     sentence below cannot promise something different from what happens. */
  const effect = useMemo(() => {
    let willVoid = 0;
    let willStay = 0;
    let paid = 0;
    for (const inv of invoicesByContract(contract.id)) {
      if (inv.status !== "issued") continue;
      if (!isZero(paidTotal(inv, payments))) {
        paid += 1;
        continue;
      }
      if (daysBetween(inv.dueOn, TODAY) >= 0) willStay += 1;
      else willVoid += 1;
    }
    return { willVoid, willStay, paid };
  }, [contract.id, invoicesByContract, payments]);

  /* A sale that states a holding deposit. On a tenancy the insurance deposit is
     closed by its own act (see CloseLeaseModal), and a sale with no deposit has
     nothing to decide. */
  const asksDeposit = contract.kind === "sale" && !!contract.deposit && !isZero(contract.deposit);

  const canCancel = reason.trim().length > 0;

  return (
    <FinanceModal
      icon="ban"
      tone="danger"
      title={t("admin.fin.cc.title")}
      sub={t("admin.fin.cc.sub")}
      onClose={onClose}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            className="fm-btn fm-btn--danger"
            disabled={!canCancel}
            onClick={() => {
              if (!canCancel) return;
              onCancelled(cancelContract(contract.id, reason.trim(), asksDeposit ? deposit : undefined));
            }}
          >
            <Icon name="ban" size={16} />
            {t("admin.fin.cc.confirm")}
          </button>
        </>
      }
    >
      <Labelled label={t("admin.fin.cc.reason")} hint={t("admin.fin.cc.reasonHint")} htmlFor="fm-cancel-reason">
        <textarea
          id="fm-cancel-reason"
          className="fm-input"
          value={reason}
          autoFocus
          onChange={(e) => setReason(e.target.value)}
        />
      </Labelled>

      {/* WHO PULLED OUT — asked only on a sale that took a holding deposit,
          because that is the only case where the answer moves money. The
          deposit is the arboun: a buyer who walks away forfeits it to the
          seller, a seller who walks away gives it back. Cancelling used to
          decide this silently, in the seller's favour, whatever happened. */}
      {asksDeposit && (
        <Labelled label={t("admin.fin.cc.depositQ")} hint={t("admin.fin.cc.depositHint", { amount: formatMoney(lang, contract.deposit!) })}>
          <Segmented
            value={deposit}
            ariaLabel={t("admin.fin.cc.depositQ")}
            onChange={setDeposit}
            options={[
              { value: "buyer_withdrew", label: t("admin.fin.cc.dep.buyer") },
              { value: "seller_withdrew", label: t("admin.fin.cc.dep.seller") },
              { value: "no_fault", label: t("admin.fin.cc.dep.noFault") },
            ]}
          />
        </Labelled>
      )}

      <div className="fm-consequence">
        <Icon name="info" size={15} />
        <span>
          {interleave(t("admin.fin.cc.propertyEffect"), { status: <b>{t("status.available")}</b> })}
          {effect.willVoid > 0 && (
            <>
              {" "}
              {t("admin.fin.cc.willVoid", { count: fmtNum(lang, effect.willVoid) })}
            </>
          )}
          {effect.paid > 0 && <> {t("admin.fin.cc.paidUntouched", { count: fmtNum(lang, effect.paid) })}</>}
        </span>
      </div>

      {/* The one that has to be said out loud. */}
      {effect.willStay > 0 && (
        <p className="fm-note fm-note--warning">
          <Icon name="triangle-alert" size={14} />
          {t("admin.fin.cc.stillOwed", { count: fmtNum(lang, effect.willStay) })}
        </p>
      )}

      <p className="fm-note">
        <Icon name="eye-off" size={14} />
        {t("admin.fin.cc.publicationNote")}
      </p>
    </FinanceModal>
  );
}
