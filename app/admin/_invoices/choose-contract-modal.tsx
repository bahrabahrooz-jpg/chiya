"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import { KIND_META } from "../_contracts/data";
import type { ContractRecord, InvoiceRecord } from "../_data/contracts";

/* =============================================================================
   Which contract is this charge against?

   STEP ONE OF "ADD INVOICE" FROM THE MONEY SCREEN, and the only thing this
   screen was missing. Every invoice hangs off a contract — the contract decides
   the currency, which two people can be billed, and whose money the charge is —
   so one has to be named before the charge can be written. The contract page
   has that answer already and opens the charge form directly; this is the same
   form reached from the other end.

   A SEARCH, NEVER A LIST. Somebody raising a repair bill knows the tenant's
   name or the flat, not a contract number, and a dropdown of every signed
   contract is a scroll rather than a chooser. Nothing renders until they type —
   the same rule the contract form's own property search follows.

   EVERY ROW SAYS WHAT IS ALREADY BILLED. That line is the whole reason the
   contract-first route existed: opening the contract put the existing charges
   in front of you before you added another. Two people billing the same
   cleaning charge a week apart is an ordinary failure in this business, and a
   count with a date is what stops it without making anybody navigate.
   ========================================================================== */

/** How many results the search shows. The full list is never rendered — see the
    note above and the identical limit on the contract form's search. */
const SEARCH_LIMIT = 6;

export function ChooseContractModal({
  contracts,
  invoicesByContract,
  propertyTitle,
  counterpartyName,
  onPick,
  onClose,
}: {
  /** Already narrowed to what can be charged — see the caller. */
  contracts: ContractRecord[];
  invoicesByContract: (contractId: string) => InvoiceRecord[];
  propertyTitle: (propertyId: string) => string;
  counterpartyName: (contract: ContractRecord) => string | null;
  onPick: (contract: ContractRecord) => void;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const sq = q.trim().toLowerCase();
    if (!sq) return [];
    return contracts
      .filter((c) => [c.id, c.propertyId, propertyTitle(c.propertyId), counterpartyName(c) ?? ""].join(" ").toLowerCase().includes(sq))
      .slice(0, SEARCH_LIMIT);
  }, [contracts, q, propertyTitle, counterpartyName]);

  return (
    <FinanceModal icon="receipt" title={t("admin.inv.pick.title")} sub={t("admin.inv.pick.sub")} onClose={onClose} actions={<CancelButton onClick={onClose} />}>
      <div className="inv-pick">
        <div className="inv-pick__search">
          <Icon name="search" size={16} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.inv.pick.searchPh")}
            aria-label={t("admin.inv.pick.searchPh")}
            autoFocus
          />
        </div>

        {/* Three states, and the empty one is not the same as the unsearched
            one: "type to search" is an instruction, "nothing matched" is an
            answer. Showing the instruction where the answer belongs is how
            somebody concludes the contract does not exist. */}
        {!q.trim() ? (
          <p className="inv-pick__hint">{t("admin.inv.pick.hint")}</p>
        ) : results.length === 0 ? (
          <p className="inv-pick__hint">{t("admin.inv.pick.none")}</p>
        ) : (
          <ul className="inv-pick__list">
            {results.map((c) => {
              const raised = invoicesByContract(c.id);
              /* The last demand raised, by due date — invoicesByContract does
                 not promise an order, so it is taken rather than assumed. */
              const last = raised.reduce<InvoiceRecord | undefined>((newest, inv) => (!newest || inv.dueOn > newest.dueOn ? inv : newest), undefined);
              const party = counterpartyName(c);
              const kind = KIND_META[c.kind];
              return (
                <li key={c.id}>
                  <button type="button" className="inv-pick__row" onClick={() => onPick(c)}>
                    <span className="inv-pick__main">
                      <span className="inv-pick__title">{propertyTitle(c.propertyId)}</span>
                      <span className="inv-pick__meta">
                        {localizeDigits(lang, c.id)}
                        {party ? ` · ${party}` : ""}
                      </span>
                      {/* What is already billed. See the header note. */}
                      <span className="inv-pick__billed">
                        {raised.length === 0
                          ? t("admin.inv.pick.noneRaised")
                          : t(raised.length === 1 ? "admin.inv.pick.raisedOne" : "admin.inv.pick.raised", {
                              count: fmtNum(lang, raised.length),
                              date: last ? fmtDate(lang, fromIso(last.dueOn)) : "",
                            })}
                      </span>
                    </span>
                    <Badge variant={kind.variant} size="sm">
                      {t(`admin.ct.kind.${c.kind}`)}
                    </Badge>
                    <Icon name="chevron-right" size={17} className="inv-pick__go" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </FinanceModal>
  );
}
