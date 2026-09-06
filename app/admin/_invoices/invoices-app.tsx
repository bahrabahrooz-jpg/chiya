"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/data/stat-card";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { formatMoney, isZero } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { AdminSelect } from "../_shared/filter-controls";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { AddInvoiceModal, RecordPaymentModal, VoidInvoiceModal, invoiceLineText } from "../_shared/finance";
import { FinanceToaster, useFinanceToasts } from "../_shared/finance/toaster";
import type { ContractRecord, InvoiceRecord } from "../_data/contracts";
import { ChooseContractModal } from "./choose-contract-modal";
import {
  CATEGORY_ICON,
  AMBIGUOUS_CATEGORIES,
  CATEGORY_OPTIONS,
  DUE_SOON_DAYS,
  DUE_WINDOWS,
  EMPTY_FILTERS,
  INVOICE_STATUS_META,
  ITEMS_PER_PAGE,
  KPI_CARDS,
  PAYEE_OPTIONS,
  STATUS_TABS,
  buildKpis,
  matchesDueWindow,
  toListRows,
  type InvoiceFilters,
  type InvoiceListRow,
} from "./data";

/* ============================================================================
   Invoices — the money list.

   THE ONE SCREEN THAT READS ACROSS CONTRACTS. Every invoice in the app is
   raised by a contract and lives on that contract's page, which answers "what
   does this deal owe" perfectly and "who owes us money this week" not at all —
   that question was twenty-four pages of clicking. This is the same records,
   read the other way round.

   It borrows the contracts list's chrome outright, stylesheet included (see
   ../invoices/page). Two admin lists that look almost-but-not-quite alike read
   as though the difference means something; the only difference here is the
   columns.

   READ-ONLY, WITH TWO EXCEPTIONS. A row opens the contract that explains it —
   there is no invoice page, because an invoice out of the context of its
   contract is a number without a reason. What the row DOES offer is recording a
   payment and voiding a demand, because chasing money and then having to go
   somewhere else to enter it is the reason a collections list gets abandoned.
   Both open the same modals the contract page opens, from ../_shared/finance.

   ⚠ THE CARDS AND THE TABLE COUNT DIFFERENT THINGS, ON PURPOSE. See buildKpis:
   the cards are the AGENCY's receivables, the table is every demand the office
   has to chase — rent collected for a landlord included. Each card says whose
   money it is counting, because the failure mode of merging them is not a wrong
   total, it is a plausible one.
   ========================================================================== */

/* ---------------- pagination ---------------- */
/* The contracts list's footer, class for class — it is the same control over
   the same stylesheet, so it behaves identically on both screens. */
function PaginationFooter({ currentPage, totalItems, onPageChange }: { currentPage: number; totalItems: number; onPageChange: (p: number) => void }) {
  const { t, lang } = useLang();
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const start = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };

  if (totalItems === 0) return null;
  return (
    <div className="ct-tablefooter">
      <span className="ct-pagination__info">
        {t("admin.ct.showingRange", { start: fmtNum(lang, start), end: fmtNum(lang, end), total: fmtNum(lang, totalItems) })}
      </span>
      <div className="ct-pagination">
        <button type="button" className="ct-page-btn ct-page-btn--nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />
          {t("admin.props.prev")}
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={"e" + i} className="ct-page-ellipsis">
              …
            </span>
          ) : (
            <button key={p} type="button" className={"ct-page-btn" + (p === currentPage ? " is-active" : "")} onClick={() => onPageChange(p)}>
              {fmtNum(lang, p)}
            </button>
          ),
        )}
        <button type="button" className="ct-page-btn ct-page-btn--nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          {t("admin.props.next")}
          <Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- row ---------------- */
function InvoiceTableRow({
  row,
  onRecordPayment,
  onVoid,
}: {
  row: InvoiceListRow;
  onRecordPayment: (invoice: InvoiceRecord) => void;
  onVoid: (invoice: InvoiceRecord) => void;
}) {
  const { t, lang } = useLang();
  const router = useRouter();
  const inv = row.invoice;
  const meta = INVOICE_STATUS_META[row.status];
  /* The invoices card on the contract page, not the top of it — the row opens
     onto the thing it came from. */
  const href = `/admin/contracts/${encodeURIComponent(inv.contractId)}#invoices`;
  const go = () => router.push(href);

  /* Only a live demand can be acted on. A voided invoice, a credit note and
     every row on a cancelled contract are history, and there is deliberately no
     edit or delete offered on any of them in any state — the same rule the
     contract page applies to the same records. */
  const actionable = row.status !== "void" && inv.status === "issued" && !inv.creditNoteFor;
  /* Money has arrived against it — the demand can no longer be withdrawn. Same
     rule the contract page applies to the same record; see the note there. */
  const settled = row.owed.amount !== row.total.amount;
  const owed = !isZero(row.owed);

  const statusLabel = row.status === "overdue" ? t("admin.inv.overdueDays", { count: fmtNum(lang, row.lateDays) }) : t(`admin.inv.status.${row.status}`);

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
      <div className="ct-col--id inv-col--number">
        <span className="ct-id">{inv.number ? localizeDigits(lang, inv.number) : t("admin.inv.unnumbered")}</span>
        {/* WHOSE MONEY — ONLY WHERE THE TYPE DOES NOT ALREADY SAY IT.
            "Rent" is the landlord's and "Commission" is the agency's; nobody
            reads those two any other way, and a chip beside them repeats the
            word next to it. The other two are genuinely ambiguous — a "Fee" is
            an instalment of a sale price (the seller's) or an extra charge (the
            agency's), and a "Deposit" is a tenancy's (the tenant's) or a sale's
            holding deposit (the seller's). Same word, different owner, and no
            way to tell from the row. That is the whole job of the chip.

            It also used to sit under the party's name, where "Kani Omar ·
            Owner's money" read as a claim about the tenant. It is a fact about
            the demand and belongs with the demand's type. */}
        <span className="inv-cat">
          <Icon name={CATEGORY_ICON[inv.category]} size={12} />
          {t(`admin.inv.cat.${inv.category}`)}
          {AMBIGUOUS_CATEGORIES.has(inv.category) && <span className="inv-payee">{t(`admin.inv.payee.${inv.payee}`)}</span>}
        </span>
      </div>

      <div className="inv-col--party">
        <span className="ct-celllabel">{t("admin.inv.th.billTo")}</span>
        <span className="inv-party__name">{row.billToName}</span>
      </div>

      {/* WHO THE AGREEMENT IS BETWEEN — not the same question as who is being
          chased. "Billed to" names one person and never says which side of the
          deal they are on, and on a sale the agency bills the seller and the
          buyer separately out of one contract, so the name alone tells you
          nothing about the transaction behind it. Both parties, each in the
          role this contract gives them, exactly as the contracts list shows
          them. */}
      <div className="inv-col--parties">
        <span className="ct-celllabel">{t("admin.inv.th.parties")}</span>
        {row.contract ? (
          <>
            <span className="inv-side">
              <span className="inv-side__role">{t(row.contract.kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord")}</span>
              <span className="inv-side__who">{row.ownerName}</span>
            </span>
            <span className="inv-side">
              <span className="inv-side__role">{t(row.contract.kind === "sale" ? "admin.pd.buyer" : "admin.pd.tenant")}</span>
              {row.counterpartyName ? (
                <span className="inv-side__who">{row.counterpartyName}</span>
              ) : (
                <span className="inv-side__who inv-side__who--none">
                  {t(row.contract.kind === "sale" ? "admin.pd.noCounterparty" : "admin.ct.noTenantYet")}
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="inv-side__who inv-side__who--none">{t("admin.inv.noContract")}</span>
        )}
      </div>

      <div className="inv-col--property">
        <span className="ct-celllabel">{t("admin.ct.th.property")}</span>
        {row.propertyTitle ? (
          <>
            <span className="ct-prop__title">{row.propertyTitle}</span>
            <span className="ct-prop__id">{localizeDigits(lang, inv.contractId)}</span>
          </>
        ) : (
          <span className="ct-prop__id">{localizeDigits(lang, inv.contractId)}</span>
        )}
      </div>

      <div className="inv-col--due">
        <span className="ct-celllabel">{t("admin.inv.th.due")}</span>
        <span className="ct-date">{fmtDate(lang, fromIso(inv.dueOn))}</span>
      </div>

      <div className="inv-col--status">
        <Badge variant={meta.variant} size="sm" dot={meta.dot} icon={meta.icon}>
          {statusLabel}
        </Badge>
      </div>

      <div className="inv-col--amount">
        <span className="ct-celllabel">{t("admin.inv.th.amount")}</span>
        {/* formatMoney, never formatApprox — an invoice total is what somebody
            owes, and what is still owed under it is what they will be chased
            for. Neither is ever rounded for display. */}
        <span className="ct-money">{formatMoney(lang, row.total)}</span>
        {owed && row.status !== "void" && !isZero(row.total) && row.owed.amount !== row.total.amount && (
          <span className="inv-owed">{t("admin.inv.stillOwed", { amount: formatMoney(lang, row.owed) })}</span>
        )}
      </div>

      <div className="inv-col--actions" onClick={(e) => e.stopPropagation()}>
        {actionable && owed && (
          <button
            type="button"
            className="inv-actbtn"
            title={t("admin.ct.recordPayment")}
            aria-label={t("admin.ct.recordPayment")}
            onClick={() => onRecordPayment(inv)}
          >
            <Icon name="banknote" size={17} />
          </button>
        )}
        {actionable && (
          <button
            type="button"
            className="inv-actbtn inv-actbtn--danger"
            disabled={settled}
            title={settled ? t("admin.ct.inv.voidBlocked") : t("admin.fin.vi.action")}
            aria-label={settled ? t("admin.ct.inv.voidBlocked") : t("admin.fin.vi.action")}
            onClick={() => onVoid(inv)}
          >
            <Icon name="ban" size={17} />
          </button>
        )}
        <Link className="ct-golink" href={href} aria-label={t("admin.inv.openContract")}>
          <Icon name="chevron-right" size={17} />
        </Link>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export function InvoicesApp() {
  const { t, lang } = useLang();
  const { invoices, payments, contracts, getContract, invoicesByContract } = useContracts();
  const { properties, members } = useProperties();
  const [toasts, pushToast, dismissToast] = useFinanceToasts();

  const [activeTab, setActiveTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<InvoiceFilters>(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [payTarget, setPayTarget] = useState<InvoiceRecord | null>(null);
  const [voidTarget, setVoidTarget] = useState<InvoiceRecord | null>(null);
  /* Two steps, two pieces of state: which contract, then the charge itself.
     `picking` is the search; `chargeTo` is the contract it settled on. */
  const [picking, setPicking] = useState(false);
  const [chargeTo, setChargeTo] = useState<ContractRecord | null>(null);

  const setFilter = (k: keyof InvoiceFilters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCurrentPage(1);
  };
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  const propertyTitle = useMemo(() => {
    const byId = new Map(properties.map((p) => [p.id, p.title]));
    return (id: string) => byId.get(id) ?? id;
  }, [properties]);

  const memberName = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m.name]));
    return (id?: string) => (id ? byId.get(id) : undefined);
  }, [members]);

  /* The tenant or the buyer, whether they hold an account or not — the same
     resolution the contract page does, so the name on the charge form is the
     name on the contract. */
  const counterpartyName = useMemo(
    () => (c: ContractRecord) => memberName(c.buyerId) ?? null,
    [memberName],
  );

  /**
   * WHICH CONTRACTS CAN CARRY AN EXTRA CHARGE — signed ones, and only those.
   *
   * A draft has demanded nothing of anybody and a cancelled or completed
   * contract is finished. This is the same test the contract page applies to
   * its own Add invoice button (`canAdd`), stated once here so the two entry
   * points cannot start offering different sets of contracts.
   */
  const chargeable = useMemo(() => contracts.filter((c) => c.status === "signed"), [contracts]);

  /* `getContract` is the dependency, not the contracts array: the store rebuilds
     its selectors whenever the records change, so the function itself is what
     actually tracks the data — the same reasoning as invoicesByContract on the
     contract detail screen. */
  const allRows = useMemo(
    () => toListRows(invoices, payments, getContract, propertyTitle, memberName),
    [invoices, payments, getContract, propertyTitle, memberName],
  );

  const kpis = useMemo(() => buildKpis(invoices, payments), [invoices, payments]);

  const rows = useMemo(() => {
    const sq = q.trim().toLowerCase();
    return allRows.filter((r) => {
      const inv = r.invoice;
      if (activeTab !== "all" && r.status !== activeTab) return false;
      if (filters.category && inv.category !== filters.category) return false;
      if (filters.payee && inv.payee !== filters.payee) return false;
      if (!matchesDueWindow(inv, filters.dueWindow)) return false;
      if (sq) {
        /* Both contract parties are searchable alongside the billed party — a
           name the row shows and the search box cannot find reads as broken. */
        const hay = [inv.number, inv.contractId, r.billToName, r.ownerName, r.counterpartyName ?? "", r.propertyTitle, r.propertyId, invoiceLineText(inv.lines[0], t, lang)]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(sq)) return false;
      }
      return true;
    });
  }, [allRows, activeTab, q, filters, t, lang]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const isFiltered = activeTab !== "all" || !!q.trim() || activeFilterCount > 0;
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  /* Every card is money, so every card is formatMoney — these are figures
     somebody acts on, not impressions of a figure. */
  const kpiValue = (key: (typeof KPI_CARDS)[number]["key"]) => formatMoney(lang, kpis[key]);

  /* One invoice is not "1 invoices". Singular gets its own key rather than a
     plural rule in code — the same pattern the contract page's invoice count
     uses, and the only one that survives three languages. */
  const kpiSub = (key: (typeof KPI_CARDS)[number]["key"]) => {
    if (key === "overdue") {
      return t(kpis.overdueCount === 1 ? "admin.inv.kpiSub.overdueOne" : "admin.inv.kpiSub.overdue", { count: fmtNum(lang, kpis.overdueCount) });
    }
    if (key === "dueSoon") {
      return t(kpis.dueSoonCount === 1 ? "admin.inv.kpiSub.dueSoonOne" : "admin.inv.kpiSub.dueSoon", {
        days: fmtNum(lang, DUE_SOON_DAYS),
        count: fmtNum(lang, kpis.dueSoonCount),
      });
    }
    if (key === "outstanding" && kpis.otherCurrency > 0) {
      return t(kpis.otherCurrency === 1 ? "admin.inv.kpiSub.otherCurrencyOne" : "admin.inv.kpiSub.otherCurrency", {
        count: fmtNum(lang, kpis.otherCurrency),
      });
    }
    return t(`admin.inv.kpiSub.${key}`);
  };

  return (
    <div className="inv-scope">
      <header className="ct-head">
        <div className="ct-head__intro">
          <h1 className="ct-head__title">{t("admin.inv.title")}</h1>
          <p className="ct-head__sub">{t("admin.inv.sub")}</p>
        </div>
        {/* "Add invoice", not "New invoice" — the contract page's wording, and
            for its reason: this is a charge an existing agreement could not
            predict, never a document raised out of nothing. Secondary, not
            primary: raising a charge is the rare thing on a screen whose daily
            job is collecting what has already been demanded. */}
        <div className="ct-head__action">
          <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={() => setPicking(true)}>
            {t("admin.fin.ai.action")}
          </Button>
        </div>
      </header>

      <div className="ct-kpis">
        {KPI_CARDS.map((c) => (
          <StatCard key={c.key} label={t(`admin.inv.kpi.${c.key}`)} value={kpiValue(c.key)} icon={c.icon} tone={c.tone} sub={kpiSub(c.key)} />
        ))}
      </div>

      <section className="ct-tablecard">
        <header className="ct-tablecard__head">
          <div className="ct-tablecard__titlerow">
            <div className="ct-tablecard__heading">
              <h2 className="ct-tablecard__title">{t("admin.inv.title")}</h2>
              <span className="ct-tablecard__count">{fmtNum(lang, isFiltered ? rows.length : allRows.length)}</span>
            </div>
            {isFiltered && (
              <div className="ct-tablecard__resultnote">
                <span>{t("admin.props.shownOf", { shown: fmtNum(lang, rows.length), total: fmtNum(lang, allRows.length) })}</span>
              </div>
            )}
          </div>

          <div className="ct-tabrow">
            <div className="ct-tabs" role="tablist" aria-label={t("admin.inv.tabsAria")}>
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
                  {tab.id === "all" ? t("admin.props.tab.all") : t(`admin.inv.status.${tab.id}`)}
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
                  placeholder={t("admin.inv.searchPh")}
                  aria-label={t("admin.inv.searchAria")}
                />
              </div>
              <button
                type="button"
                className={"ct-filterbtn" + (filtersOpen ? " is-open" : "") + (activeFilterCount > 0 && !filtersOpen ? " has-active" : "")}
                aria-expanded={filtersOpen}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <Icon name="sliders-horizontal" size={15} />
                {t("admin.props.filters")}
                {activeFilterCount > 0 && <span className="ct-filterbtn__badge">{fmtNum(lang, activeFilterCount)}</span>}
              </button>
            </div>
          </div>

          <div className={"ct-filterbar" + (filtersOpen ? " is-open" : "")}>
            <div className="ct-filterbar__inner">
              <div className="ct-filterbar__row">
                <AdminSelect
                  value={filters.category}
                  onChange={(v) => setFilter("category", v)}
                  options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: t(`admin.inv.cat.${c}`) }))}
                  placeholder={t("admin.inv.filter.category")}
                  ariaLabel={t("admin.inv.filter.category")}
                />
                <AdminSelect
                  value={filters.payee}
                  onChange={(v) => setFilter("payee", v)}
                  options={PAYEE_OPTIONS.map((p) => ({ value: p, label: t(`admin.inv.payee.${p}`) }))}
                  placeholder={t("admin.inv.filter.payee")}
                  ariaLabel={t("admin.inv.filter.payee")}
                />
                <AdminSelect
                  value={filters.dueWindow}
                  onChange={(v) => setFilter("dueWindow", v)}
                  options={DUE_WINDOWS.map((w) => ({ value: w.value, label: t("admin.inv.filter.nextDays", { days: fmtNum(lang, w.days) }) }))}
                  placeholder={t("admin.inv.filter.due")}
                  ariaLabel={t("admin.inv.filter.due")}
                />
                <div className="ct-filterbar__actions">
                  <button type="button" className="ct-clearbtn" onClick={clearFilters}>
                    <Icon name="x" size={14} />
                    {t("admin.props.clearAll")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="ct-table">
          <div className="ct-thead" role="row">
            <span className="ct-th ct-col--id">{t("admin.inv.th.number")}</span>
            <span className="ct-th inv-col--party">{t("admin.inv.th.billTo")}</span>
            <span className="ct-th inv-col--parties">{t("admin.inv.th.parties")}</span>
            <span className="ct-th inv-col--property">{t("admin.ct.th.property")}</span>
            <span className="ct-th inv-col--due">{t("admin.inv.th.due")}</span>
            <span className="ct-th inv-col--status">{t("admin.ct.th.status")}</span>
            <span className="ct-th inv-col--amount">{t("admin.inv.th.amount")}</span>
            <span className="ct-th inv-col--actions" />
          </div>
          {pagedRows.length > 0 ? (
            pagedRows.map((r) => (
              <InvoiceTableRow key={r.invoice.id} row={r} onRecordPayment={setPayTarget} onVoid={setVoidTarget} />
            ))
          ) : (
            <div className="ct-noresults">
              <span className="ct-noresults__art">
                <Icon name={isFiltered ? "search-x" : "receipt"} size={26} strokeWidth={1.6} />
              </span>
              <h3>{t(isFiltered ? "admin.inv.empty.title" : "admin.inv.emptyAll.title")}</h3>
              <p>{t(isFiltered ? "admin.inv.empty.sub" : "admin.inv.emptyAll.sub")}</p>
            </div>
          )}
        </div>
        <PaginationFooter currentPage={currentPage} totalItems={rows.length} onPageChange={setCurrentPage} />
      </section>

      {/* ADD INVOICE, IN TWO STEPS. The picker names the contract; the charge
          form is the contract page's own AddInvoiceModal, unchanged — the same
          form reached from the other end, so a charge raised here and a charge
          raised there are the same document. */}
      {picking && (
        <ChooseContractModal
          contracts={chargeable}
          invoicesByContract={invoicesByContract}
          propertyTitle={propertyTitle}
          counterpartyName={counterpartyName}
          onClose={() => setPicking(false)}
          onPick={(c) => {
            setPicking(false);
            setChargeTo(c);
          }}
        />
      )}

      {chargeTo && (
        <AddInvoiceModal
          contract={chargeTo}
          counterpartyName={counterpartyName(chargeTo) ?? undefined}
          ownerName={memberName(chargeTo.ownerId) ?? chargeTo.ownerId}
          onClose={() => setChargeTo(null)}
          onIssued={({ number }) => {
            setChargeTo(null);
            pushToast({
              tone: "brand",
              icon: "receipt",
              title: t("admin.fin.toast.issuedTitle"),
              msg: t("admin.fin.toast.issuedMsg", { number }),
            });
          }}
        />
      )}

      {/* The contract page's modals, not copies of them. Everything they write
          lands through useFinanceActions, which is the only thing in the app
          that touches the invoice and payment records. */}
      {payTarget && (
        <RecordPaymentModal
          invoice={payTarget}
          onClose={() => setPayTarget(null)}
          onRecorded={({ settled }) => {
            const number = payTarget.number;
            setPayTarget(null);
            pushToast({
              tone: "success",
              icon: "banknote",
              title: t("admin.fin.toast.paidTitle"),
              msg: t(settled ? "admin.fin.toast.paidMsgSettled" : "admin.fin.toast.paidMsgPartial", { number }),
            });
          }}
        />
      )}

      {voidTarget && (
        <VoidInvoiceModal
          invoice={voidTarget}
          onClose={() => setVoidTarget(null)}
          onVoided={() => {
            const number = voidTarget.number;
            setVoidTarget(null);
            pushToast({
              tone: "danger",
              icon: "ban",
              title: t("admin.fin.toast.voidedTitle"),
              msg: t("admin.fin.toast.voidedMsg", { number }),
            });
          }}
        />
      )}

      <FinanceToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
