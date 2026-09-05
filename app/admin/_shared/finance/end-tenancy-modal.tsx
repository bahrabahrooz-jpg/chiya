"use client";

import { Icon } from "@/components/ui/icon";
import { useLang, interleave } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { fmtDate } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";
import { isDepositHeld, type ContractRecord } from "../../_data/contracts";
import { useContractTransitions } from "../contract-transitions";
import { CancelButton, FinanceModal } from "./modal-shell";

/* =============================================================================
   END THE TENANCY — the way out of Expired.

   A lease runs its full term and the tenant moves on without renewing. That is
   the ordinary ending, and until this existed it was the one ending the app
   could not record.

   The two exits from an ended lease are RENEW and this. Renewing already
   worked: signing a replacement completes the old contract. A tenant who simply
   left had nothing — the lease sat reading Expired forever, the flat stayed
   marked rented and so could never be re-listed, and the only button that
   cleared the row was Cancel. Cancel means the agreement was broken off early.
   It was not; it succeeded. An agency's book of records is worth nothing if
   tidying a list is paid for by writing down the wrong thing.

   NO REASON FIELD, unlike Cancel. Cancelling is an exception and somebody has
   to say why. A term ending is what every tenancy does, and demanding a
   sentence to explain the normal case teaches people to type "n/a".

   THE DEPOSIT IS NOT SETTLED HERE. What became of the tenant's money is its own
   decision with its own three outcomes (see CloseLeaseModal), and it usually
   comes days later, after the inspection. So the modal SAYS the deposit is
   still held rather than quietly folding it in, and the contracts list keeps
   flagging it until somebody decides.
   ========================================================================== */

export interface EndTenancyModalProps {
  contract: ContractRecord;
  onClose: () => void;
  onEnded: (result: { depositStillHeld: boolean }) => void;
}

export function EndTenancyModal({ contract, onClose, onEnded }: EndTenancyModalProps) {
  const { t, lang } = useLang();
  const { endTenancy } = useContractTransitions();

  const stillHeld = isDepositHeld(contract);

  return (
    <FinanceModal
      icon="circle-check"
      tone="brand"
      title={t("admin.fin.et.title")}
      sub={t("admin.fin.et.sub")}
      onClose={onClose}
      footNote={
        <div className="fm-consequence">
          <Icon name="info" size={15} />
          <span>
            {interleave(t("admin.fin.et.effect"), {
              status: <b>{t("admin.ct.status.completed")}</b>,
              availability: <b>{t("status.available")}</b>,
            })}
          </span>
        </div>
      }
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button
            type="button"
            className="fm-btn fm-btn--primary"
            onClick={() => {
              endTenancy(contract.id);
              onEnded({ depositStillHeld: stillHeld });
            }}
          >
            <Icon name="circle-check" size={16} />
            {t("admin.fin.et.confirm")}
          </button>
        </>
      }
    >
      <p className="fm-note">
        {contract.endsOn
          ? t("admin.fin.et.term", { date: fmtDate(lang, fromIso(contract.endsOn)) })
          : t("admin.fin.et.termUnknown")}
      </p>

      {/* SAID, NOT DONE. Ending the tenancy and settling the deposit are two
          acts days apart — the second waits on the inspection. Naming the
          amount here is what stops the first one feeling like both. */}
      {stillHeld && (
        <p className="fm-note fm-note--warning">
          <Icon name="wallet" size={15} />
          <span>{t("admin.fin.et.depositHeld", { amount: formatMoney(lang, contract.insuranceDeposit!) })}</span>
        </p>
      )}
    </FinanceModal>
  );
}
