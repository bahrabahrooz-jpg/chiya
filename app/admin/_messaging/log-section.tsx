"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import { isRtl, useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";
import { AdminSelect } from "../_shared/filter-controls";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import {
  TEMPLATE_IDS,
  hourLabel,
  isDialable,
  telLink,
  useMessageLog,
  useWhatsAppSettings,
  waLink,
  type MessageLogRow,
  type MsgStatus,
} from "../_shared/messaging";
import { ITEMS_PER_PAGE, STATUS_META, STATUS_TABS, TEMPLATE_ICON, buildLogKpis } from "./data";

/* ============================================================================
   The message log — who was told what, and whether it arrived.

   The daily question this whole feature exists to answer. It reads across every
   contract, the way the invoices list reads across every contract's demands,
   and it borrows that list's chrome outright (contracts.css, imported by the
   page): same header, same KPI strip, same table card, same filter row. Two
   admin lists that look almost-but-not-quite alike read as though the
   difference means something.

   READ-ONLY, and it stays that way. A message has already gone or is already
   scheduled; the things you would want to DO about it — change the wording,
   move the timing, fix a missing phone number — are all somewhere else, and the
   row links to the contract that explains it.

   THE QUEUED ROWS SORT TO THE TOP. They are the ones somebody can still act on.
   ========================================================================== */

/* ---------------- pagination ---------------- */
/* The contracts list's footer, class for class, over the same stylesheet. */
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

/* ---------------- one row ---------------- */

function LogRow({ row, onOpen }: { row: MessageLogRow; onOpen: (row: MessageLogRow) => void }) {
  const { t, lang } = useLang();
  const meta = STATUS_META[row.status];

  return (
    <div
      className="ct-row"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(row)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(row);
        }
      }}
    >
      <div className="wa-col--who">
        <span className="wa-who__name">{row.toName || t("admin.wa.party.unknown")}</span>
        {row.toPhone ? (
          <span className="wa-who__phone" dir="ltr">
            {row.toPhone}
          </span>
        ) : (
          <span className="wa-who__role">{t("admin.wa.noPhone")}</span>
        )}
      </div>

      <div className="wa-col--tpl">
        <span className="wa-tplname">
          <Icon name={TEMPLATE_ICON[row.templateId]} size={14} />
          {t(`admin.wa.tpl.${row.templateId}.name`)}
        </span>
        {row.manual ? (
          <span className="wa-byhand">{t("admin.wa.byHand")}</span>
        ) : (
          <span className="wa-who__role">{t(`admin.wa.party.${row.audience}`)}</span>
        )}
      </div>

      <div className="wa-col--body">
        <span className="ct-celllabel">{t("admin.wa.th.message")}</span>
        <span className="wa-snippet" dir={isRtl(row.lang) ? "rtl" : "ltr"}>
          {row.body}
        </span>
      </div>

      <div className="wa-col--when">
        <span className="ct-celllabel">{t("admin.wa.th.when")}</span>
        <span className="wa-when__date">{fmtDate(lang, fromIso(row.on))}</span>
        <span className="wa-when__time">{localizeDigits(lang, hourLabel(row.hour))}</span>
        {row.held && (
          <span className="wa-when__held">
            <Icon name="moon" size={11} />
            {t("admin.wa.heldQuiet")}
          </span>
        )}
      </div>

      <div className="wa-col--status">
        <Badge variant={meta.variant} size="sm" icon={meta.icon}>
          {t(`admin.wa.status.${row.status}`)}
        </Badge>
        {row.reason && <span className="wa-reason">{t(`admin.wa.reason.${row.reason}`)}</span>}
      </div>

      <div className="inv-col--actions">
        <Icon name="chevron-right" size={17} />
      </div>
    </div>
  );
}

/* ---------------- one message, in full ---------------- */

function MessagePanel({ row, onClose }: { row: MessageLogRow; onClose: () => void }) {
  const { t, lang } = useLang();
  const meta = STATUS_META[row.status];

  return (
    <FinanceModal
      icon={TEMPLATE_ICON[row.templateId]}
      title={t(`admin.wa.tpl.${row.templateId}.name`)}
      sub={t("admin.wa.panel.sub", { name: row.toName })}
      onClose={onClose}
      actions={
        <>
          <CancelButton onClick={onClose} />
          {isDialable(row.toPhone) && (
            <a className="fm-btn fm-btn--primary" href={waLink(row.toPhone, row.body)} target="_blank" rel="noopener noreferrer">
              <Icon name="send" size={16} />
              {t("admin.wa.panel.sendAgain")}
            </a>
          )}
        </>
      }
    >
      <div className="wa-detail">
        <div className="wa-phone">
          <div className="wa-bubble" dir={isRtl(row.lang) ? "rtl" : "ltr"}>
            {row.body}
            <span className="wa-bubble__meta">
              {localizeDigits(lang, hourLabel(row.hour))}
              <Icon name="check-check" size={13} />
            </span>
          </div>
        </div>

        <div className="wa-facts">
          <div className="wa-fact">
            <span className="wa-fact__label">{t("admin.wa.th.status")}</span>
            <span className="wa-fact__value">
              <Badge variant={meta.variant} size="sm" icon={meta.icon}>
                {t(`admin.wa.status.${row.status}`)}
              </Badge>
            </span>
          </div>
          <div className="wa-fact">
            <span className="wa-fact__label">{t("admin.wa.th.when")}</span>
            <span className="wa-fact__value wa-fact__value--mono">
              {fmtDate(lang, fromIso(row.on))} · {localizeDigits(lang, hourLabel(row.hour))}
            </span>
          </div>
          <div className="wa-fact">
            <span className="wa-fact__label">{t("admin.wa.panel.to")}</span>
            <span className="wa-fact__value">
              {row.toName}
              {isDialable(row.toPhone) && (
                <>
                  {" · "}
                  <a className="ctd-link" href={telLink(row.toPhone)} dir="ltr">
                    {row.toPhone}
                  </a>
                </>
              )}
            </span>
          </div>
          <div className="wa-fact">
            <span className="wa-fact__label">{t("admin.wa.panel.language")}</span>
            <span className="wa-fact__value">{t(`lang.${row.lang}`)}</span>
          </div>
          {row.contractId && (
            <div className="wa-fact">
              <span className="wa-fact__label">{t("admin.wa.panel.about")}</span>
              <span className="wa-fact__value">
                <Link className="ctd-link" href={`/admin/contracts/${encodeURIComponent(row.contractId)}`}>
                  {row.propertyTitle ?? row.contractId}
                </Link>
              </span>
            </div>
          )}
          {row.reason && (
            <div className="wa-fact">
              <span className="wa-fact__label">{t("admin.wa.panel.why")}</span>
              <span className="wa-fact__value">{t(`admin.wa.reason.${row.reason}`)}</span>
            </div>
          )}
        </div>
      </div>
    </FinanceModal>
  );
}

/* ---------------- the pane ---------------- */

export function LogSection() {
  const { t, lang } = useLang();
  const all = useMessageLog();
  const { dryRun } = useWhatsAppSettings();

  const [tab, setTab] = useState<MsgStatus | "all">("all");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [templateFilter, setTemplateFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<MessageLogRow | null>(null);

  const kpis = useMemo(() => buildLogKpis(all), [all]);

  const rows = useMemo(() => {
    const sq = q.trim().toLowerCase();
    return all.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (templateFilter && r.templateId !== templateFilter) return false;
      if (audienceFilter && r.audience !== audienceFilter) return false;
      if (sq) {
        const hay = [r.toName, r.toPhone, r.body, r.propertyTitle ?? "", r.contractId ?? ""].join(" ").toLowerCase();
        if (!hay.includes(sq)) return false;
      }
      return true;
    });
  }, [all, tab, q, templateFilter, audienceFilter]);

  const activeFilterCount = [templateFilter, audienceFilter].filter(Boolean).length;
  const isFiltered = tab !== "all" || !!q.trim() || activeFilterCount > 0;
  const paged = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const countFor = (id: MsgStatus | "all") => (id === "all" ? all.length : all.filter((r) => r.status === id).length);

  const reset = () => {
    setTemplateFilter("");
    setAudienceFilter("");
    setPage(1);
  };

  return (
    <div className="wa-scope">
      <div className="ct-kpis">
        {/* WHAT HAS LEFT, not what was confirmed — see the note on LogKpis.
            The delivered share sits underneath, and says so plainly when a dry
            run means there is nothing to confirm. */}
        <StatCard
          label={t("admin.wa.kpi.gone")}
          value={fmtNum(lang, kpis.gone)}
          icon="check-check"
          tone="success"
          sub={
            kpis.deliveryRate == null
              ? t(dryRun ? "admin.wa.kpi.dryRun" : "admin.wa.kpi.noneYet")
              : t("admin.wa.kpi.rate", { pct: fmtNum(lang, kpis.deliveryRate) })
          }
        />
        <StatCard label={t("admin.wa.kpi.queued")} value={fmtNum(lang, kpis.queued)} icon="clock" tone="info" sub={t("admin.wa.kpi.queuedSub")} />
        <StatCard
          label={t("admin.wa.kpi.suppressed")}
          value={fmtNum(lang, kpis.suppressed)}
          icon="ban"
          tone="brand"
          sub={t("admin.wa.kpi.suppressedSub")}
        />
        <StatCard label={t("admin.wa.kpi.failed")} value={fmtNum(lang, kpis.failed)} icon="triangle-alert" tone="gold" sub={t("admin.wa.kpi.failedSub")} />
      </div>

      <section className="ct-tablecard">
        <header className="ct-tablecard__head">
          <div className="ct-tablecard__titlerow">
            <div className="ct-tablecard__heading">
              <h2 className="ct-tablecard__title">{t("admin.wa.tableTitle")}</h2>
              <span className="ct-tablecard__count">{fmtNum(lang, isFiltered ? rows.length : all.length)}</span>
            </div>
            {isFiltered && (
              <div className="ct-tablecard__resultnote">
                <span>{t("admin.props.shownOf", { shown: fmtNum(lang, rows.length), total: fmtNum(lang, all.length) })}</span>
              </div>
            )}
          </div>

          <div className="ct-tabrow">
            <div className="ct-tabs" role="tablist" aria-label={t("admin.wa.tabsAria")}>
              {STATUS_TABS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className={"ct-tab" + (tab === id ? " is-active" : "")}
                  onClick={() => {
                    setTab(id);
                    setPage(1);
                  }}
                >
                  {id === "all" ? t("admin.props.tab.all") : t(`admin.wa.status.${id}`)}
                  <span className="wa-tabcount">{fmtNum(lang, countFor(id))}</span>
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
                    setPage(1);
                  }}
                  placeholder={t("admin.wa.searchPh")}
                  aria-label={t("admin.wa.searchPh")}
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
                  value={templateFilter}
                  onChange={(v) => {
                    setTemplateFilter(v);
                    setPage(1);
                  }}
                  options={TEMPLATE_IDS.map((id) => ({ value: id, label: t(`admin.wa.tpl.${id}.name`) }))}
                  placeholder={t("admin.wa.filter.template")}
                  ariaLabel={t("admin.wa.filter.template")}
                />
                <AdminSelect
                  value={audienceFilter}
                  onChange={(v) => {
                    setAudienceFilter(v);
                    setPage(1);
                  }}
                  options={[
                    { value: "tenant", label: t("admin.wa.party.tenant") },
                    { value: "landlord", label: t("admin.wa.party.landlord") },
                  ]}
                  placeholder={t("admin.wa.filter.audience")}
                  ariaLabel={t("admin.wa.filter.audience")}
                />
                <div className="ct-filterbar__actions">
                  <button type="button" className="ct-clearbtn" onClick={reset}>
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
            <span className="ct-th wa-col--who">{t("admin.wa.th.to")}</span>
            <span className="ct-th wa-col--tpl">{t("admin.wa.th.template")}</span>
            <span className="ct-th wa-col--body">{t("admin.wa.th.message")}</span>
            <span className="ct-th wa-col--when">{t("admin.wa.th.when")}</span>
            <span className="ct-th wa-col--status">{t("admin.wa.th.status")}</span>
            <span className="ct-th inv-col--actions" />
          </div>
          {paged.length > 0 ? (
            paged.map((r) => <LogRow key={r.id} row={r} onOpen={setOpen} />)
          ) : (
            <div className="ct-noresults">
              <span className="ct-noresults__art">
                <Icon name={isFiltered ? "search-x" : "inbox"} size={26} strokeWidth={1.6} />
              </span>
              <h3>{t(isFiltered ? "admin.wa.empty.title" : "admin.wa.emptyAll.title")}</h3>
              <p>{t(isFiltered ? "admin.wa.empty.sub" : "admin.wa.emptyAll.sub")}</p>
            </div>
          )}
        </div>
        <PaginationFooter currentPage={page} totalItems={rows.length} onPageChange={setPage} />
      </section>

      {open && <MessagePanel row={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
