"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { formatMoney } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { AdminSelect } from "../_shared/filter-controls";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import {
  DATE_RANGES,
  EMPTY_FILTERS,
  EXPIRY_WINDOW_DAYS,
  ITEMS_PER_PAGE,
  KIND_META,
  KIND_OPTIONS,
  KPI_CARDS,
  STATUS_META,
  STATUS_TABS,
  buildKpis,
  matchesDateRange,
  toRow,
  type ContractFilters,
  type ContractRow,
} from "./data";

/* ============================================================================
   Contracts list.

   Built on the properties list (app/admin/_properties) rather than beside it:
   the same header, the same table card, the same filter row, the same footer.
   Two admin list screens that look almost-but-not-quite alike is worse than one
   that is copied exactly, because the differences read as meaning.

   The list itself is READ-ONLY — a row opens the contract, it never edits one.
   The single action on the screen is writing a new contract, and it is a MENU
   rather than a button: a sale and a lease are different documents with
   different clauses, so which one you are writing is settled here, before the
   form opens. Both items navigate to /admin/contracts/new.
   ========================================================================== */

/* ---------------- pagination ---------------- */
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
function ContractTableRow({ row, basePath }: { row: ContractRow; basePath: string }) {
  const { t, lang } = useLang();
  const router = useRouter();
  const c = row.contract;
  const st = STATUS_META[c.status];
  const kind = KIND_META[c.kind];
  const href = `${basePath}/${encodeURIComponent(c.id)}`;
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
      <div className="ct-col--id">
        <span className="ct-id">{localizeDigits(lang, c.id)}</span>
        {/* Two derived flags, both of them a job somebody has to do. Neither is
            stored and neither is written by a timer — see ContractRow. */}
        {(row.depositHeld || row.expiring) && (
          <span className="ct-flags">
            {row.depositHeld && (
              <Badge variant="warning" size="sm" icon="wallet">
                {t("admin.ct.flag.depositHeld")}
              </Badge>
            )}
            {row.expiring && (
              <Badge variant="warning" size="sm" dot>
                {t("admin.ct.flag.expiring")}
              </Badge>
            )}
          </span>
        )}
        {c.replacesContractId && (
          <span className="ct-id__tag" title={t("admin.ct.renewalOf", { id: c.replacesContractId })}>
            <Icon name="refresh-cw" size={11} />
            {t("admin.ct.renewal")}
          </span>
        )}
      </div>

      <div className="ct-col--property">
        <span className="ct-celllabel">{t("admin.ct.th.property")}</span>
        <span className="ct-prop__title">{row.propertyTitle}</span>
        <span className="ct-prop__id">{localizeDigits(lang, row.propertyId)}</span>
      </div>

      {/* BOTH SIDES, EACH IN ITS OWN ROLE.
          The list used to name the buyer or tenant and nobody else, under the
          heading "Counterparty" — which left half of every agreement off the
          screen and never said which half was on it. Two columns now, and the
          role under each name is read off the contract's own kind, because
          "Landlord" and "Seller" are not the same job and a column heading
          cannot say which one a row means. */}
      <div className="ct-col--owner">
        <span className="ct-celllabel">{t("admin.ct.th.owner")}</span>
        <span className="ct-party__name">{row.ownerName}</span>
        <span className="ct-party__role">{t(c.kind === "sale" ? "admin.pd.seller" : "admin.pd.landlord")}</span>
      </div>

      <div className="ct-col--party">
        <span className="ct-celllabel">{t("admin.ct.th.counterparty")}</span>
        {row.counterparty ? (
          <>
            <span className="ct-party__name">{row.counterparty}</span>
            <span className="ct-party__meta">
              <span className="ct-party__role">{t(c.kind === "sale" ? "admin.pd.buyer" : "admin.pd.tenant")}</span>
              {!row.counterpartyId && <span className="ct-party__ext">{t("admin.pd.externalParty")}</span>}
            </span>
          </>
        ) : (
          <span className="ct-party ct-party--none">{t(c.kind === "sale" ? "admin.pd.noCounterparty" : "admin.ct.noTenantYet")}</span>
        )}
      </div>

      <div className="ct-col--kind">
        <Badge variant={kind.variant} size="sm">
          {t(`admin.ct.kind.${c.kind}`)}
        </Badge>
      </div>

      <div className="ct-col--status">
        <Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon}>
          {t(`admin.ct.status.${c.status}`)}
        </Badge>
      </div>

      <div className="ct-col--value">
        <span className="ct-celllabel">{t("admin.ct.th.value")}</span>
        {/* formatMoney, never formatApprox — a contract value is authoritative.
            The column is wide enough for "943,200,000 IQD" and the figure never
            wraps: a broken money column is a misread money column. */}
        <span className="ct-money">{formatMoney(lang, row.value)}</span>
      </div>

      <div className="ct-col--signed">
        <span className="ct-celllabel">{t("admin.ct.th.signedOn")}</span>
        {c.signedOn ? (
          <span className="ct-date">{fmtDate(lang, fromIso(c.signedOn))}</span>
        ) : (
          <span className="ct-date ct-date--none">{t("admin.ct.unsigned")}</span>
        )}
      </div>

      <div className="ct-col--go" onClick={(e) => e.stopPropagation()}>
        <Link className="ct-golink" href={href} aria-label={t("admin.ct.viewContract")}>
          <Icon name="chevron-right" size={17} />
        </Link>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */
export function ContractsApp({ scopeAgentId, basePath = "/admin/contracts" }: { scopeAgentId?: string; basePath?: string } = {}) {
  const { t, lang } = useLang();
  const { contracts } = useContracts();
  const { properties, members, agents } = useProperties();

  /* Scoped to one agent on the agent surface, exactly as the properties list
     scopes itself — same data, filtered, never a second copy. */
  const baseList = useMemo(() => (scopeAgentId ? contracts.filter((c) => c.agentId === scopeAgentId) : contracts), [contracts, scopeAgentId]);

  /* WRITING IS ADMIN-ONLY FOR NOW. `scopeAgentId` is what makes this the agent
     view, and whether an agent may write a contract at all is a permissions
     decision nobody has taken yet — see the TODO on app/agent/contracts/page.
     The property page gates its own Create contract the same way. Reading is
     already allowed; granting the write here by omission would decide the
     question by accident. */
  const canWrite = !scopeAgentId;

  const [activeTab, setActiveTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<ContractFilters>(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!newMenuOpen) return;
    const close = (e: MouseEvent) => {
      if (!newMenuRef.current?.contains(e.target as Node)) setNewMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [newMenuOpen]);

  const setFilter = (k: keyof ContractFilters, v: string) => {
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
  const agentName = useMemo(() => {
    const byId = new Map(agents.map((a) => [a.id, a.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [agents]);

  const allRows = useMemo(
    () => baseList.map((c) => toRow(c, propertyTitle, memberName, agentName)).sort((a, b) => b.contract.createdOn.localeCompare(a.contract.createdOn)),
    [baseList, propertyTitle, memberName, agentName],
  );

  const kpis = useMemo(() => buildKpis(baseList), [baseList]);

  const rows = useMemo(() => {
    const sq = q.trim().toLowerCase();
    return allRows.filter((r) => {
      const c = r.contract;
      if (activeTab !== "all" && c.status !== activeTab) return false;
      if (filters.kind && c.kind !== filters.kind) return false;
      if (filters.agent && c.agentId !== filters.agent) return false;
      /* The worklist filter — an ended tenancy still holding somebody’s deposit.
         Same derived flag the row badge uses, so the count, the chip and the
         rows can never disagree. */
      if (filters.depositsToClose && !r.depositHeld) return false;
      if (!matchesDateRange(c, filters.dateRange)) return false;
      if (sq) {
        /* Both parties are searchable, not just the one who pays — the owner is
           on the row now, and a name on screen that the search box cannot find
           reads as a broken search box. */
        const hay = [c.id, r.propertyTitle, r.propertyId, r.ownerName, r.counterparty ?? "", r.agentName].join(" ").toLowerCase();
        if (!hay.includes(sq)) return false;
      }
      return true;
    });
  }, [allRows, activeTab, q, filters]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const isFiltered = activeTab !== "all" || !!q.trim() || activeFilterCount > 0;
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const agentOptions = useMemo(
    () =>
      agents
        .filter((a) => baseList.some((c) => c.agentId === a.id))
        .map((a) => ({ value: a.id, label: a.name }))
        .sort((x, y) => x.label.localeCompare(y.label)),
    [agents, baseList],
  );

  /* Both money cards render with formatMoney, never formatApprox: one is what
     the agency signed and the other is what it is holding for other people, and
     both are figures somebody acts on. */
  const kpiValue = (key: (typeof KPI_CARDS)[number]["key"]) =>
    key === "signedThisMonth" ? formatMoney(lang, kpis.signedThisMonth) : key === "depositsHeld" ? formatMoney(lang, kpis.depositsHeld) : fmtNum(lang, kpis[key]);

  return (
    <>
      <header className="ct-head">
        <div className="ct-head__intro">
          <h1 className="ct-head__title">{t("admin.ct.title")}</h1>
          <p className="ct-head__sub">{t("admin.ct.sub")}</p>
        </div>
        {canWrite && (
          <div className="ct-head__action" ref={newMenuRef}>
            {/* A MENU, NOT A BUTTON. A sale and a lease are different documents
                with different clauses, and the choice is made here rather than
                as a first step inside the form — branching mid-form would ask
                half the questions twice. See §1 and the form's header note. */}
            <Button
              hierarchy="primary"
              size="lg"
              iconLeading="plus"
              iconTrailing="chevron-down"
              onClick={() => setNewMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={newMenuOpen}
            >
              {t("admin.ct.new")}
            </Button>
            {newMenuOpen && (
              <div className="ct-newmenu" role="menu">
                <Link className="ct-newmenu__item" role="menuitem" href="/admin/contracts/new?type=sale">
                  <Icon name="banknote" size={17} />
                  <span className="ct-newmenu__txt">
                    <span className="ct-newmenu__label">{t("admin.ct.newSale")}</span>
                    <span className="ct-newmenu__desc">{t("admin.ct.newSaleDesc")}</span>
                  </span>
                </Link>
                <Link className="ct-newmenu__item" role="menuitem" href="/admin/contracts/new?type=lease">
                  <Icon name="key" size={17} />
                  <span className="ct-newmenu__txt">
                    <span className="ct-newmenu__label">{t("admin.ct.newLease")}</span>
                    <span className="ct-newmenu__desc">{t("admin.ct.newLeaseDesc")}</span>
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="ct-kpis">
        {KPI_CARDS.map((c) => {
          /* THE NUMBER WAS ALREADY HERE AND LED NOWHERE. "2 deposits to close"
             told you a job existed and gave you no way to find which contracts
             it meant — you had to already know the answer to look it up. The
             card is now the way in. */
          const opensWorklist = c.key === "depositsHeld" && kpis.depositsToClose > 0;
          const openWorklist = () => {
            setFilter("depositsToClose", "1");
            setActiveTab("all");
            setFiltersOpen(true);
          };
          return (
          <StatCard
            key={c.key}
            {...(opensWorklist
              ? {
                  className: "ct-kpi--action",
                  role: "button",
                  tabIndex: 0,
                  title: t("admin.ct.filter.depositsToClose"),
                  onClick: openWorklist,
                  onKeyDown: (e: ReactKeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openWorklist();
                    }
                  },
                }
              : {})}
            label={t(`admin.ct.kpi.${c.key}`)}
            value={kpiValue(c.key)}
            icon={c.icon}
            tone={c.tone}
            sub={
              c.key === "expiring"
                ? t("admin.ct.kpiSub.expiring", { days: fmtNum(lang, EXPIRY_WINDOW_DAYS) })
                : c.key === "depositsHeld"
                  ? t(kpis.depositsToClose > 0 ? "admin.ct.kpiSub.depositsToClose" : "admin.ct.kpiSub.depositsHeld", { count: fmtNum(lang, kpis.depositsToClose) })
                : c.key === "signedThisMonth" && kpis.excludedFromSigned > 0
                  ? t("admin.ct.kpiSub.signedExcluded", { count: fmtNum(lang, kpis.excludedFromSigned) })
                  : t(`admin.ct.kpiSub.${c.key}`)
            }
          />
          );
        })}
      </div>

      <section className="ct-tablecard">
        <header className="ct-tablecard__head">
          <div className="ct-tablecard__titlerow">
            <div className="ct-tablecard__heading">
              <h2 className="ct-tablecard__title">{t("admin.ct.title")}</h2>
              <span className="ct-tablecard__count">{fmtNum(lang, isFiltered ? rows.length : allRows.length)}</span>
            </div>
            {isFiltered && (
              <div className="ct-tablecard__resultnote">
                <span>{t("admin.props.shownOf", { shown: fmtNum(lang, rows.length), total: fmtNum(lang, allRows.length) })}</span>
              </div>
            )}
          </div>

          <div className="ct-tabrow">
            <div className="ct-tabs" role="tablist" aria-label={t("admin.ct.tabsAria")}>
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
                  {tab.id === "all" ? t("admin.props.tab.all") : t(`admin.ct.status.${tab.id}`)}
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
                  placeholder={t("admin.ct.searchPh")}
                  aria-label={t("admin.ct.searchAria")}
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
                  value={filters.kind}
                  onChange={(v) => setFilter("kind", v)}
                  options={KIND_OPTIONS.map((k) => ({ value: k, label: t(`admin.ct.kind.${k}`) }))}
                  placeholder={t("admin.ct.filter.kind")}
                  ariaLabel={t("admin.ct.filter.kind")}
                />
                <AdminSelect
                  value={filters.agent}
                  onChange={(v) => setFilter("agent", v)}
                  options={agentOptions}
                  placeholder={t("admin.ct.filter.agent")}
                  ariaLabel={t("admin.ct.filter.agent")}
                />
                <AdminSelect
                  value={filters.dateRange}
                  onChange={(v) => setFilter("dateRange", v)}
                  options={DATE_RANGES.map((r) => ({ value: r.value, label: t("admin.ct.filter.lastDays", { days: fmtNum(lang, r.days) }) }))}
                  placeholder={t("admin.ct.filter.signed")}
                  ariaLabel={t("admin.ct.filter.signed")}
                />
                {/* A TOGGLE, not a dropdown — it has one meaningful state, and
                    burying "an ended lease still holding money" inside a select
                    would hide the only filter on this screen that is a job
                    rather than a way of narrowing a list. */}
                {kpis.depositsToClose > 0 && (
                  <button
                    type="button"
                    className={"ct-flagbtn" + (filters.depositsToClose ? " is-active" : "")}
                    aria-pressed={!!filters.depositsToClose}
                    onClick={() => setFilter("depositsToClose", filters.depositsToClose ? "" : "1")}
                  >
                    <Icon name="wallet" size={15} />
                    {t("admin.ct.filter.depositsToClose")}
                    <span className="ct-flagbtn__count">{fmtNum(lang, kpis.depositsToClose)}</span>
                  </button>
                )}
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
            <span className="ct-th ct-col--id">{t("admin.ct.th.id")}</span>
            <span className="ct-th ct-col--property">{t("admin.ct.th.property")}</span>
            <span className="ct-th ct-col--owner">{t("admin.ct.th.owner")}</span>
            <span className="ct-th ct-col--party">{t("admin.ct.th.counterparty")}</span>
            <span className="ct-th ct-col--kind">{t("admin.ct.th.kind")}</span>
            <span className="ct-th ct-col--status">{t("admin.ct.th.status")}</span>
            <span className="ct-th ct-col--value">{t("admin.ct.th.value")}</span>
            <span className="ct-th ct-col--signed">{t("admin.ct.th.signedOn")}</span>
            <span className="ct-th ct-col--go" />
          </div>
          {pagedRows.length > 0 ? (
            pagedRows.map((r) => <ContractTableRow key={r.contract.id} row={r} basePath={basePath} />)
          ) : (
            <div className="ct-noresults">
              <span className="ct-noresults__art">
                <Icon name={isFiltered ? "search-x" : "file-signature"} size={26} strokeWidth={1.6} />
              </span>
              <h3>{t(isFiltered ? "admin.ct.empty.title" : "admin.ct.emptyAll.title")}</h3>
              <p>{t(isFiltered ? "admin.ct.empty.sub" : "admin.ct.emptyAll.sub")}</p>
            </div>
          )}
        </div>
        <PaginationFooter currentPage={currentPage} totalItems={rows.length} onPageChange={setCurrentPage} />
      </section>

    </>
  );
}
