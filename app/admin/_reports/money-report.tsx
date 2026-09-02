"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits, monthName } from "@/lib/fmt";
import { formatMoney, isZero } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
import { receivablesAging } from "../_data/contracts";
import { C } from "./data";
import {
  ENDING_DAYS,
  INCOME_MONTHS,
  RENEWAL_DAYS,
  UPCOMING_DAYS,
  buildIncome,
  buildOwnerSummary,
  buildRentRoll,
  buildUpcoming,
  reportCommission,
  reportDeposits,
  reportPayments,
  reportRentDue,
  toCsv,
  type ReportCtx,
  type ReportTable,
} from "./money-data";

/* ============================================================================
   The money reports — a catalogue, not one page.

   AN AGENCY DOES NOT ASK "SHOW ME THE MONEY". It asks "what rent is due", "what
   did we take last month", "what have we earned", "whose deposit are we
   holding". Each of those is a report somebody runs, reads down and hands on,
   so each is a tab with its own table and its own export.

   ONE TABLE COMPONENT, ONE CSV WRITER. Every report returns the same row shape
   (see ReportTable), which is what stops eight bespoke tables drifting apart
   and what makes the export literally the table rather than a second rendering
   of it that can disagree with it.

   IT REUSES THE SCREEN'S OWN FURNITURE — `.rp-card`, `.rp-hbars`, `.rp-table`
   — because two reports on one screen have to read as one report.
   ========================================================================== */

export const REPORT_TABS = ["overview", "rentDue", "payments", "commission", "contracts", "deposits", "owners"] as const;
export type ReportTabId = (typeof REPORT_TABS)[number];

function Card({ title, desc, children, action }: { title: string; desc?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rp-card">
      <div className="rp-card__head">
        <div className="rp-card__heading">
          <h2 className="rp-card__title">{title}</h2>
          {desc && <p className="rp-card__desc">{desc}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The one table every report renders through. */
function Table({ table, headLabel, empty }: { table: ReportTable; headLabel: (k: string) => string; empty: string }) {
  const { t } = useLang();
  if (table.rows.length === 0) return <p className="rp-empty">{empty}</p>;
  return (
    <>
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h.key} className={"rp-th" + (h.num ? " rp-th--num" : "")}>
                  {headLabel(h.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r) => (
              <tr className="rp-tr" key={r.id}>
                {r.cells.map((cell, i) => (
                  <td key={i} className={"rp-td" + (table.head[i]?.num ? " rp-td--num" : "")}>
                    <span className={cell.tone ? `rp-${cell.tone}` : undefined}>
                      {cell.href ? (
                        <Link className="rp-link" href={cell.href}>
                          {cell.text}
                        </Link>
                      ) : (
                        cell.text
                      )}
                    </span>
                    {cell.sub && <span className="rp-sub">{cell.sub}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.total && (
        <p className="rp-total">
          <span>{t("admin.reports.rep.total")}</span>
          <b>{table.total}</b>
        </p>
      )}
    </>
  );
}

export function MoneyReport({
  tab,
  days,
  periodWord,
  onCsvReady,
}: {
  tab: ReportTabId;
  days: number;
  periodWord: string;
  /** Hands the current table up so the header's Export button can write it. */
  onCsvReady: (csv: () => string) => void;
}) {
  const { t, lang } = useLang();
  const { contracts, invoices, payments, ledger } = useContracts();
  const { properties, members } = useProperties();

  const propertyTitle = useMemo(() => {
    const byProp = new Map(properties.map((p) => [p.id, p.title]));
    const byContract = new Map(contracts.map((c) => [c.id, c.propertyId]));
    return (contractId: string) => {
      const pid = byContract.get(contractId);
      return (pid && byProp.get(pid)) ?? contractId;
    };
  }, [properties, contracts]);

  const memberName = useMemo(() => {
    const byId = new Map(members.map((m) => [m.id, m.name]));
    return (id: string) => byId.get(id) ?? id;
  }, [members]);

  const ctx: ReportCtx = useMemo(
    () => ({
      contracts,
      invoices,
      payments,
      ledger,
      days,
      asOf: "2026-06-30",
      money: (m) => formatMoney(lang, m),
      date: (iso) => fmtDate(lang, fromIso(iso)),
      propertyTitle,
      memberName,
      label: (k) => t(`admin.reports.rep.${k}`),
    }),
    [contracts, invoices, payments, ledger, days, lang, propertyTitle, memberName, t],
  );

  const headLabel = (k: string) => t(`admin.reports.rep.h.${k}`);

  const table = useMemo<ReportTable | null>(() => {
    if (tab === "rentDue") return reportRentDue(ctx);
    if (tab === "payments") return reportPayments(ctx);
    if (tab === "commission") return reportCommission(ctx);
    if (tab === "deposits") return reportDeposits(ctx);
    return null;
  }, [tab, ctx]);

  /* The export writes whatever the open tab is showing — see the note above. */
  const csv = useMemo(
    () => () => (table ? toCsv(table.head.map((h) => headLabel(h.key)), table) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [table],
  );
  useMemo(() => onCsvReady(csv), [csv, onCsvReady]);

  /* ---- overview pieces ---- */
  const upcoming = useMemo(() => buildUpcoming(contracts, invoices, payments), [contracts, invoices, payments]);
  const aging = useMemo(() => receivablesAging(undefined, undefined, invoices, payments), [invoices, payments]);
  const income = useMemo(() => buildIncome(invoices, payments), [invoices, payments]);
  const rentRoll = useMemo(
    () =>
      buildRentRoll(contracts, invoices, payments, (pid) => properties.find((p) => p.id === pid)?.title ?? pid, (c) =>
        c.buyerId ? memberName(c.buyerId) : (c.buyerExternal?.name ?? "—"),
      ),
    [contracts, invoices, payments, properties, memberName],
  );
  const owners = useMemo(() => buildOwnerSummary(ledger, memberName), [ledger, memberName]);

  const agingRows = [
    { key: "current", amount: aging.current },
    { key: "d1to30", amount: aging.d1to30 },
    { key: "d31to60", amount: aging.d31to60 },
    { key: "d61to90", amount: aging.d61to90 },
    { key: "d90plus", amount: aging.d90plus },
  ];
  const agingPeak = Math.max(1, ...agingRows.map((r) => r.amount.amount));
  const incomePeak = Math.max(1, ...income.map((m) => m.amount.amount));

  if (table) {
    return (
      <div className="rp-stack">
        <Card title={t(`admin.reports.rep.${tab}`)} desc={t(`admin.reports.rep.${tab}Desc`, { period: periodWord })}>
          <Table table={table} headLabel={headLabel} empty={t("admin.reports.rep.empty")} />
        </Card>
      </div>
    );
  }

  if (tab === "contracts") {
    return (
      <div className="rp-stack">
        <Card title={t("admin.reports.money.rentRoll")} desc={t("admin.reports.money.rentRollDesc")}>
          {rentRoll.length === 0 ? (
            <p className="rp-empty">{t("admin.reports.money.rentRollEmpty")}</p>
          ) : (
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th className="rp-th">{t("admin.reports.money.rr.property")}</th>
                    <th className="rp-th">{t("admin.reports.money.rr.tenant")}</th>
                    <th className="rp-th rp-th--num">{t("admin.reports.money.rr.rent")}</th>
                    <th className="rp-th">{t("admin.reports.money.rr.collects")}</th>
                    <th className="rp-th">{t("admin.reports.money.rr.nextDue")}</th>
                    <th className="rp-th">{t("admin.reports.money.rr.ends")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rentRoll.map((r) => (
                    <tr className="rp-tr" key={r.contract.id}>
                      <td className="rp-td">
                        <Link className="rp-link" href={`/admin/contracts/${encodeURIComponent(r.contract.id)}`}>
                          {r.propertyTitle}
                        </Link>
                        <span className="rp-sub">{localizeDigits(lang, r.contract.id)}</span>
                      </td>
                      <td className="rp-td">{r.tenant}</td>
                      <td className="rp-td rp-td--num">{formatMoney(lang, r.rent)}</td>
                      <td className="rp-td">{t(r.collectedByAgency ? "admin.cn.collect.agency" : "admin.cn.collect.landlord")}</td>
                      <td className="rp-td">
                        <span className={r.nextIsLate ? "rp-late" : ""}>
                          {r.nextDueOn ? fmtDate(lang, fromIso(r.nextDueOn)) : t("admin.reports.money.rr.nothingDue")}
                        </span>
                        {r.nextAmount && <span className="rp-sub">{formatMoney(lang, r.nextAmount)}</span>}
                      </td>
                      <td className="rp-td">
                        {r.endsOn ? fmtDate(lang, fromIso(r.endsOn)) : "—"}
                        {r.daysLeft !== undefined && r.daysLeft <= RENEWAL_DAYS && (
                          <span className="rp-sub rp-warn">{t("admin.reports.money.rr.inDays", { count: fmtNum(lang, r.daysLeft) })}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  if (tab === "owners") {
    return (
      <div className="rp-stack">
        <Card title={t("admin.reports.money.owners")} desc={t("admin.reports.money.ownersDesc")}>
          {owners.length === 0 ? (
            <p className="rp-empty">{t("admin.reports.rep.empty")}</p>
          ) : (
            <div className="rp-table-wrap">
              <table className="rp-table">
                <thead>
                  <tr>
                    <th className="rp-th">{t("admin.po.th.owner")}</th>
                    <th className="rp-th rp-th--num">{t("admin.po.th.collected")}</th>
                    <th className="rp-th rp-th--num">{t("admin.po.th.fees")}</th>
                    <th className="rp-th rp-th--num">{t("admin.po.th.paidOut")}</th>
                    <th className="rp-th rp-th--num">{t("admin.po.th.owed")}</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => (
                    <tr className="rp-tr" key={o.ownerId}>
                      <td className="rp-td">
                        <Link className="rp-link" href={`/admin/payouts/${encodeURIComponent(o.ownerId)}`}>
                          {o.ownerName}
                        </Link>
                      </td>
                      <td className="rp-td rp-td--num">{formatMoney(lang, o.collected)}</td>
                      <td className="rp-td rp-td--num">{formatMoney(lang, o.fees)}</td>
                      <td className="rp-td rp-td--num">{formatMoney(lang, o.paidOut)}</td>
                      <td className="rp-td rp-td--num rp-strong">{formatMoney(lang, o.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  /* ---- overview ---- */
  return (
    <div className="rp-stack">
      <Card title={t("admin.reports.money.income")} desc={t("admin.reports.money.incomeDesc", { months: fmtNum(lang, INCOME_MONTHS) })}>
        <ul className="rp-hbars">
          {income.map((m) => (
            <li className="rp-hbar" key={m.month}>
              <span className="rp-hbar__name">{monthName(lang, fromIso(m.month).getMonth())}</span>
              <span className="rp-hbar__track">
                <span className="rp-hbar__fill" style={{ width: `${(m.amount.amount / incomePeak) * 100}%`, background: C.green }} />
              </span>
              <span className="rp-hbar__val">{isZero(m.amount) ? "—" : formatMoney(lang, m.amount)}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="rp-split">
        <Card title={t("admin.reports.money.coming")} desc={t("admin.reports.money.comingDesc")}>
          <ul className="rp-hbars rp-coming">
            <li>
              <Link className="rp-coming__row" href="/admin/invoices">
                <span className="rp-coming__when">{t("admin.reports.money.nextDays", { days: fmtNum(lang, UPCOMING_DAYS) })}</span>
                <span className="rp-coming__what">
                  {[
                    !isZero(upcoming.rent) && t("admin.reports.money.dueRent", { amount: formatMoney(lang, upcoming.rent) }),
                    !isZero(upcoming.installments) && t("admin.reports.money.dueInstalments", { amount: formatMoney(lang, upcoming.installments) }),
                    !isZero(upcoming.commission) && t("admin.reports.money.dueCommission", { amount: formatMoney(lang, upcoming.commission) }),
                  ]
                    .filter(Boolean)
                    .join(" · ") || t("admin.reports.money.nothingDue")}
                </span>
                <Icon name="chevron-right" size={16} className="rp-coming__go" />
              </Link>
            </li>
            <li>
              <Link className="rp-coming__row" href="/admin/contracts">
                <span className="rp-coming__when">{t("admin.reports.money.nextDays", { days: fmtNum(lang, RENEWAL_DAYS) })}</span>
                <span className="rp-coming__what">
                  {upcoming.renewals > 0
                    ? t(upcoming.renewals === 1 ? "admin.reports.money.renewalsOne" : "admin.reports.money.renewals", { count: fmtNum(lang, upcoming.renewals) })
                    : t("admin.reports.money.noRenewals")}
                </span>
                <Icon name="chevron-right" size={16} className="rp-coming__go" />
              </Link>
            </li>
            <li>
              <Link className="rp-coming__row" href="/admin/contracts">
                <span className="rp-coming__when">{t("admin.reports.money.nextDays", { days: fmtNum(lang, ENDING_DAYS) })}</span>
                <span className="rp-coming__what">
                  {upcoming.ending > 0
                    ? t(upcoming.ending === 1 ? "admin.reports.money.endingOne" : "admin.reports.money.ending", { count: fmtNum(lang, upcoming.ending) })
                    : t("admin.reports.money.noEnding")}
                </span>
                <Icon name="chevron-right" size={16} className="rp-coming__go" />
              </Link>
            </li>
          </ul>
        </Card>

        <Card title={t("admin.reports.money.aging")} desc={t("admin.reports.money.agingDesc")}>
          <ul className="rp-hbars">
            {agingRows.map((r, i) => (
              <li className="rp-hbar" key={r.key}>
                <span className="rp-hbar__name">{t(`admin.reports.money.age.${r.key}`)}</span>
                <span className="rp-hbar__track">
                  <span
                    className="rp-hbar__fill"
                    style={{
                      width: `${(r.amount.amount / agingPeak) * 100}%`,
                      background: i === agingRows.length - 1 ? "var(--error-500)" : i === 0 ? "var(--green-300)" : C.green,
                    }}
                  />
                </span>
                <span className="rp-hbar__val">{formatMoney(lang, r.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
