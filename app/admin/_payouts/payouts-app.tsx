"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { formatMoney, isZero } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { FinanceToaster, useFinanceToasts } from "../_shared/finance/toaster";
import { RecordPayoutModal } from "./record-payout-modal";
import { ITEMS_PER_PAGE, KPI_CARDS, STATUS_META, STATUS_TABS, buildKpis, buildPayoutRows, type PayoutRow } from "./data";

/* ============================================================================
   Payouts — the other half of the rent roll, one month at a time.

   WHAT THE AGENCY IS HOLDING FOR OTHER PEOPLE. On an agency-collected tenancy
   the tenant pays us, we keep the management fee, and the rest is the
   landlord's until he comes in and takes it.

   ONE ROW PER MONTH'S RENT, exactly as the invoices list gives one row per
   demand. This screen used to show one balance per landlord, which is a number
   nobody can act on: it could not say which months it covered, and once paid it
   could never be lined up against June again. An agency works in months, so the
   list works in months.

   ⚠ NONE OF THIS IS AGENCY MONEY. Every figure here is somebody else's, sitting
   in our account — which is why it is a separate screen from Invoices. That
   list is what the agency is OWED; this is what the agency OWES. One page
   showing both would invite a single total across the two, and `receivablesAging`
   excludes all of this on exactly those grounds.

   IT READS FROM THE LEDGER, NOT FROM THE CONTRACTS. A month appears because a
   tenant actually paid it and the money came through us. A landlord who takes
   his own rent never appears here — there is nothing of his to hand over.
   ========================================================================== */

/* ---------------- row ---------------- */
function PayoutTableRow({ row, onPay }: { row: PayoutRow; onPay: (row: PayoutRow) => void }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const meta = STATUS_META[row.status];
  const href = `/admin/payouts/${encodeURIComponent(row.ownerId)}`;
  const go = () => router.push(href);

  return (
    <div
      className="ct-row"
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
    >
      <div className="po-col--owner">
        <span className="po-owner__name">{row.ownerName}</span>
        <span className="po-owner__meta">{row.propertyTitle}</span>
      </div>

      <div className="po-col--what">
        <span className="ct-celllabel">{t("admin.po.th.what")}</span>
        <span className="po-what">{row.what}</span>
        <span className="po-owner__meta">{localizeDigits(lang, row.contractId)}</span>
      </div>

      <div className="po-col--collectedon">
        <span className="ct-celllabel">{t("admin.po.th.collectedOn")}</span>
        <span className="ct-date">{fmtDate(lang, fromIso(row.collectedOn))}</span>
      </div>

      {/* The arithmetic, in the order it happens: what came in, what we kept,
          what is his. Three columns rather than one net figure, because the
          middle one is the question a landlord asks. */}
      <div className="po-col--gross">
        <span className="ct-celllabel">{t("admin.po.th.collected")}</span>
        <span className="po-money">{formatMoney(lang, row.gross)}</span>
      </div>

      <div className="po-col--fee">
        <span className="ct-celllabel">{t("admin.po.th.fees")}</span>
        <span className="po-money po-money--fee">{isZero(row.fee) ? "—" : "− " + formatMoney(lang, row.fee)}</span>
      </div>

      <div className="po-col--net">
        <span className="ct-celllabel">{t("admin.po.th.his")}</span>
        <span className="po-money po-money--net">{formatMoney(lang, row.net)}</span>
        {row.status === "part" && <span className="po-owner__meta">{t("admin.po.stillOwed", { amount: formatMoney(lang, row.owed) })}</span>}
      </div>

      <div className="po-col--status">
        <Badge variant={meta.variant} size="sm" dot={meta.dot} icon={meta.icon}>
          {row.status === "paid" && row.paidOn
            ? t("admin.po.status.paidOn", { date: fmtDate(lang, fromIso(row.paidOn)) })
            : t(`admin.po.status.${row.status}`)}
        </Badge>
      </div>

      <div className="po-col--actions" onClick={(e) => e.stopPropagation()}>
        {row.status !== "paid" && (
          <button type="button" className="po-paybtn" onClick={() => onPay(row)}>
            <Icon name="arrow-up-right" size={15} />
            {t("admin.po.pay")}
          </button>
        )}
        <Link className="ct-golink" href={href} aria-label={t("admin.po.openStatement")}>
          <Icon name="chevron-right" size={17} />
        </Link>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export function PayoutsApp() {
  const { t, lang } = useLang();
  const { ledger, getContract } = useContracts();
  const { properties, members } = useProperties();
  const [toasts, pushToast, dismissToast] = useFinanceToasts();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  /* Every month being settled in one act. One row starts it; the modal is then
     handed all of that owner's outstanding months, because a landlord who came
     in for June will take July while he is standing there. */
  const [payTarget, setPayTarget] = useState<PayoutRow | null>(null);

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

  const allRows = useMemo(
    () => buildPayoutRows(ledger, ownerName, propertyTitleForContract),
    [ledger, ownerName, propertyTitleForContract],
  );

  const kpis = useMemo(() => buildKpis(allRows), [allRows]);

  const rows = useMemo(() => {
    const sq = q.trim().toLowerCase();
    return allRows.filter((r) => {
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (sq && ![r.ownerName, r.propertyTitle, r.what, r.contractId].join(" ").toLowerCase().includes(sq)) return false;
      return true;
    });
  }, [allRows, activeTab, q]);

  const isFiltered = activeTab !== "all" || !!q.trim();
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* The whole visit, not just the row that was clicked. */
  const payingRows = useMemo(
    () => (payTarget ? allRows.filter((r) => r.ownerId === payTarget.ownerId && r.status !== "paid") : []),
    [payTarget, allRows],
  );

  const kpiSub = (key: (typeof KPI_CARDS)[number]["key"]) => {
    if (key === "owed") {
      return t(kpis.waiting === 1 ? "admin.po.kpiSub.owedOne" : "admin.po.kpiSub.owed", { count: fmtNum(lang, kpis.waiting) });
    }
    if (key === "collected" && kpis.otherCurrency > 0) {
      return t("admin.po.kpiSub.otherCurrency", { count: fmtNum(lang, kpis.otherCurrency) });
    }
    return t(`admin.po.kpiSub.${key}`);
  };

  return (
    <div className="po-scope">
      <header className="ct-head">
        <div className="ct-head__intro">
          <h1 className="ct-head__title">{t("admin.po.title")}</h1>
          <p className="ct-head__sub">{t("admin.po.sub")}</p>
        </div>
      </header>

      <div className="ct-kpis">
        {KPI_CARDS.map((c) => (
          <StatCard key={c.key} label={t(`admin.po.kpi.${c.key}`)} value={formatMoney(lang, kpis[c.key])} icon={c.icon} tone={c.tone} sub={kpiSub(c.key)} />
        ))}
      </div>

      <section className="ct-tablecard">
        <header className="ct-tablecard__head">
          <div className="ct-tablecard__titlerow">
            <div className="ct-tablecard__heading">
              <h2 className="ct-tablecard__title">{t("admin.po.months")}</h2>
              <span className="ct-tablecard__count">{fmtNum(lang, isFiltered ? rows.length : allRows.length)}</span>
            </div>
            {isFiltered && (
              <div className="ct-tablecard__resultnote">
                <span>{t("admin.props.shownOf", { shown: fmtNum(lang, rows.length), total: fmtNum(lang, allRows.length) })}</span>
              </div>
            )}
          </div>

          <div className="ct-tabrow">
            <div className="ct-tabs" role="tablist" aria-label={t("admin.po.tabsAria")}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={"ct-tab" + (activeTab === tab.id ? " is-active" : "")}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                >
                  {tab.id === "all" ? t("admin.props.tab.all") : t(`admin.po.status.${tab.id}`)}
                </button>
              ))}
            </div>
            <div className="ct-tabrow__right">
              <div className="ct-tabsearch">
                <span className="ct-tabsearch__lead">
                  <Icon name="search" size={16} />
                </span>
                <input
                  type="text"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("admin.po.searchPh")}
                  aria-label={t("admin.po.searchPh")}
                />
              </div>
            </div>
          </div>
        </header>

        <div className="ct-table">
          <div className="ct-thead" role="row">
            <span className="ct-th po-col--owner">{t("admin.po.th.owner")}</span>
            <span className="ct-th po-col--what">{t("admin.po.th.what")}</span>
            <span className="ct-th po-col--collectedon">{t("admin.po.th.collectedOn")}</span>
            <span className="ct-th po-col--gross">{t("admin.po.th.collected")}</span>
            <span className="ct-th po-col--fee">{t("admin.po.th.fees")}</span>
            <span className="ct-th po-col--net">{t("admin.po.th.his")}</span>
            <span className="ct-th po-col--status">{t("admin.ct.th.status")}</span>
            <span className="ct-th po-col--actions" />
          </div>
          {pagedRows.length > 0 ? (
            pagedRows.map((r) => <PayoutTableRow key={r.creditId} row={r} onPay={setPayTarget} />)
          ) : (
            <div className="ct-noresults">
              <span className="ct-noresults__art">
                <Icon name={isFiltered ? "search-x" : "wallet"} size={26} strokeWidth={1.6} />
              </span>
              <h3>{t(isFiltered ? "admin.po.empty.title" : "admin.po.emptyAll.title")}</h3>
              {/* The empty state EXPLAINS ITSELF rather than apologising. An
                  office that has collected nothing for anybody yet is the
                  ordinary state of this screen on day one, not a fault. */}
              <p>{t(isFiltered ? "admin.po.empty.sub" : "admin.po.emptyAll.sub")}</p>
            </div>
          )}
        </div>
      </section>

      {payTarget && payingRows.length > 0 && (
        <RecordPayoutModal
          ownerName={payTarget.ownerName}
          rows={payingRows}
          onClose={() => setPayTarget(null)}
          onPaid={({ count, totals }) => {
            const name = payTarget.ownerName;
            setPayTarget(null);
            pushToast({
              tone: "success",
              icon: "arrow-up-right",
              title: t("admin.po.toast.paidTitle"),
              msg: t(count === 1 ? "admin.po.toast.paidMsgOne" : "admin.po.toast.paidMsg", {
                name,
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
