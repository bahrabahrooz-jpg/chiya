"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { formatMoney, type CurrencyCode } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { FinanceToaster, useFinanceToasts } from "../_shared/finance/toaster";
import { RecordPayoutModal } from "./record-payout-modal";
import { LEDGER_META, buildOwnerBook, buildPayoutRows, statementFor } from "./data";

/* ============================================================================
   One owner's statement — the document a landlord is actually shown.

   OLDEST FIRST, WITH THE BALANCE CARRIED DOWN. That is what makes a statement
   checkable: the owner follows it down the page and arrives at the figure on
   the bottom line. Newest-first is a feed, and a feed cannot be reconciled.

   BOTH HALVES OF EVERY COLLECTION ARE SHOWN — the rent that came in and the fee
   that came out, as two lines. "We collected 1,400 and kept 70" is a sentence an
   owner can check; "we owe you 1,330" is one he has to take on trust. See the
   note on collectionEntries.

   ONE TABLE PER CURRENCY. A landlord with a dollar flat and a dinar one is owed
   two amounts, and interleaving them into one running balance would produce a
   column that adds up to nothing real.
   ========================================================================== */

export function OwnerStatementApp({ ownerId }: { ownerId: string }) {
  const { t, lang } = useLang();
  const { ledger, getContract } = useContracts();
  const { properties, members } = useProperties();
  const [toasts, pushToast, dismissToast] = useFinanceToasts();
  const [paying, setPaying] = useState(false);

  const ownerName = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [members]);

  const propertyTitleForContract = useMemo(() => {
    const byId = new Map(properties.map((p) => [p.id, p.title]));
    return (contractId: string) => {
      const c = getContract(contractId);
      return c ? (byId.get(c.propertyId) ?? c.propertyId) : contractId;
    };
  }, [properties, getContract]);

  const row = useMemo(() => buildOwnerBook(ledger, ownerId, ownerName), [ledger, ownerId, ownerName]);

  /* The months of his still waiting — what the Record payout button settles,
     and what the list at the bottom of the page names. */
  const waiting = useMemo(
    () => buildPayoutRows(ledger, ownerName, propertyTitleForContract).filter((r) => r.ownerId === ownerId && r.status !== "paid"),
    [ledger, ownerName, propertyTitleForContract, ownerId],
  );

  /* An owner with no ledger lines is not an error — nothing has ever passed
     through the agency for him. Said plainly rather than as "not found", which
     would suggest the person does not exist. */
  if (!row) {
    return (
      <div className="po-scope po-missing">
        <span className="po-missing__art">
          <Icon name="wallet" size={26} strokeWidth={1.6} />
        </span>
        <h1>{t("admin.po.st.noneTitle")}</h1>
        <p>{t("admin.po.st.noneSub", { name: ownerName(ownerId) })}</p>
        <Link className="po-back" href="/admin/payouts">
          <Icon name="arrow-left" size={15} />
          {t("admin.po.backToList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="po-scope">
      <Link className="po-back" href="/admin/payouts">
        <Icon name="arrow-left" size={15} />
        {t("admin.po.backToList")}
      </Link>

      <header className="ct-head">
        <div className="ct-head__intro">
          <h1 className="ct-head__title">{row.ownerName}</h1>
          <p className="ct-head__sub">{t("admin.po.st.sub")}</p>
        </div>
        {waiting.length > 0 && (
          <div className="ct-head__action">
            <Button hierarchy="primary" size="lg" iconLeading="arrow-up-right" onClick={() => setPaying(true)}>
              {t("admin.po.pay")}
            </Button>
          </div>
        )}
      </header>

      {row.totals.map(({ currency, totals }) => (
        <section className="po-statement" key={currency}>
          <header className="po-statement__head">
            <h2 className="po-statement__title">
              {row.totals.length > 1 ? t("admin.po.st.inCurrency", { currency }) : t("admin.po.st.title")}
            </h2>
            <dl className="po-sums">
              <div>
                <dt>{t("admin.po.th.collected")}</dt>
                <dd>{formatMoney(lang, totals.collected)}</dd>
              </div>
              <div>
                <dt>{t("admin.po.th.fees")}</dt>
                <dd>{formatMoney(lang, totals.fees)}</dd>
              </div>
              <div>
                <dt>{t("admin.po.th.paidOut")}</dt>
                <dd>{formatMoney(lang, totals.paidOut)}</dd>
              </div>
              <div className="po-sums__balance">
                <dt>{t("admin.po.th.owed")}</dt>
                <dd>{formatMoney(lang, totals.balance)}</dd>
              </div>
            </dl>
          </header>

          <ol className="po-lines">
            {statementFor(row.entries, currency as CurrencyCode).map(({ entry, balanceAfter }) => {
              const meta = LEDGER_META[entry.kind];
              return (
                <li className={"po-line po-line--" + meta.tone} key={entry.id}>
                  <span className="po-line__icon">
                    <Icon name={meta.icon} size={15} />
                  </span>
                  <span className="po-line__date">{fmtDate(lang, fromIso(entry.on))}</span>
                  <span className="po-line__desc">
                    {/* Frozen text, written in the language of the day it
                        happened — see OwnerLedgerEntry.description. */}
                    <span className="po-line__what">{entry.description}</span>
                    <span className="po-line__where">{localizeDigits(lang, entry.contractId)}</span>
                  </span>
                  <span className="po-line__amount">{formatMoney(lang, entry.amount)}</span>
                  <span className="po-line__balance">{formatMoney(lang, balanceAfter)}</span>
                  {/* Only a hand-off has a paper. A collection and a fee are
                      movements inside the agency's own books; the tenant's
                      receipt for that money is printed from his payment. */}
                  <span className="po-line__doc">
                    {entry.kind === "payout" && (
                      <Link className="po-line__receipt" href={`/admin/receipts/payout/${encodeURIComponent(entry.id)}`}>
                        <Icon name="printer" size={14} />
                        {t("admin.rc.receipt")}
                      </Link>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {/* Which tenancies still hold money, so the person at the desk knows what
          the owner is actually here to collect. */}
      {waiting.length > 0 && (
        <section className="po-outstanding">
          <h2 className="po-outstanding__title">{t("admin.po.st.waiting")}</h2>
          <ul className="po-outstanding__list">
            {waiting.map((l) => (
              <li key={l.creditId}>
                <Link href={`/admin/contracts/${encodeURIComponent(l.contractId)}`}>
                  <span className="po-outstanding__prop">{l.what}</span>
                  <span className="po-outstanding__id">
                    {l.propertyTitle} · {localizeDigits(lang, l.contractId)}
                  </span>
                </Link>
                <span className="po-outstanding__amt">{formatMoney(lang, l.owed)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {paying && waiting.length > 0 && (
        <RecordPayoutModal
          ownerName={row.ownerName}
          rows={waiting}
          onClose={() => setPaying(false)}
          onPaid={({ count, totals }) => {
            setPaying(false);
            pushToast({
              tone: "success",
              icon: "arrow-up-right",
              title: t("admin.po.toast.paidTitle"),
              msg: t(count === 1 ? "admin.po.toast.paidMsgOne" : "admin.po.toast.paidMsg", {
                name: row.ownerName,
                count: fmtNum(lang, count),
                amount: totals.map((m) => formatMoney(lang, m)).join(" + "),
              }),
            });
          }}
        />
      )}

      <FinanceToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
