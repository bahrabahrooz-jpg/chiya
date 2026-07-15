"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/data/stat-card";
import { Table, type TableColumn } from "@/components/data/table";
import { computeViewingKpis, type ViewingRecord } from "@/app/admin/_viewings/data";
import type { PropertyRecord } from "@/app/admin/_data/catalog";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits, valueKey } from "@/lib/fmt";
import { useAgentData } from "./_shared/agent-data";
import { PropStatus, ViewStatus, money } from "./_shared/ui";
import "./_shared/agent.css";

export default function AgentDashboardPage() {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const { me, properties, viewings } = useAgentData();
  const kpis = computeViewingKpis(viewings);
  const first = me.name.split(/\s+/)[0];

  const recent = [...properties].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 6);
  const upcoming = viewings
    .filter((v) => v.status === "Requested" || v.status === "Confirmed")
    .slice(0, 6);

  const cols: TableColumn<PropertyRecord>[] = [
    {
      key: "title",
      header: t("admin.props.th.property"),
      render: (_v, p) => (
        <span className="agx-thumb">
          <img className="agx-thumb__img" src={p.img} alt="" />
          <span style={{ minWidth: 0 }}>
            <span className="agx-thumb__name">{p.title}</span>
            <span className="agx-thumb__sub">{tOr(`loc.${p.area}`, p.area)}, {tOr(`city.${p.city}`, p.city)}</span>
          </span>
        </span>
      ),
    },
    { key: "type", header: t("admin.props.th.type"), render: (_v, p) => tOr(valueKey("type", p.type), p.type) },
    { key: "status", header: t("admin.props.th.status"), render: (_v, p) => <PropStatus status={p.status} /> },
    { key: "price", header: t("admin.props.th.price"), align: "right", render: (_v, p) => money(lang, p, t("admin.mp.perMo")) },
  ];

  return (
    <>
      <div className="agx-head">
        <div className="agx-head__intro">
          <h1 className="agx-title">{t("agent.dash.welcome", { name: first })}</h1>
          <p className="agx-sub">{t("agent.dash.sub")}</p>
        </div>
      </div>

      <section className="agx-kpis" aria-label={t("agent.dash.perfAria")}>
        <StatCard label={t("agent.dash.kpi.listings")} value={fmtNum(lang, me.listings)} icon="building-2" tone="brand" sub={t("agent.dash.kpi.listingsSub")} />
        <StatCard label={t("status.sold")} value={fmtNum(lang, me.sold)} icon="key" tone="gold" sub={t("agent.dash.kpi.soldSub")} />
        <StatCard label={t("status.rented")} value={fmtNum(lang, me.rented)} icon="home" tone="info" sub={t("agent.dash.kpi.rentedSub")} />
        <StatCard label={t("agent.dash.kpi.upcoming")} value={fmtNum(lang, kpis.upcoming)} icon="calendar-check" tone="success" sub={t("agent.dash.kpi.upcomingSub")} />
      </section>

      <div className="agx-grid">
        <div className="agx-card">
          <div className="agx-card__head">
            <h2 className="agx-card__title">{t("agent.dash.recentListings")}</h2>
            <Link className="agx-card__link" href="/agent/properties">{t("admin.common.viewAll")}</Link>
          </div>
          {recent.length ? (
            <Table<PropertyRecord> columns={cols} rows={recent} rowKey="id" />
          ) : (
            <div className="agx-empty">{t("agent.dash.noListings")}</div>
          )}
        </div>

        <div className="agx-card">
          <div className="agx-card__head">
            <h2 className="agx-card__title">{t("agent.dash.kpi.upcoming")}</h2>
            <Link className="agx-card__link" href="/agent/viewings">{t("admin.common.viewAll")}</Link>
          </div>
          {upcoming.length ? (
            <ViewingList items={upcoming} />
          ) : (
            <div className="agx-empty">{t("agent.dash.noViewings")}</div>
          )}
        </div>
      </div>
    </>
  );
}

function ViewingList({ items }: { items: ViewingRecord[] }) {
  const { lang } = useLang();
  return (
    <div>
      {items.map((v) => (
        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <img src={v.property.img} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flex: "none" }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.property.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>
              <Icon name="user" size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
              {v.member} · {fmtDate(lang, new Date(v.date))}, {localizeDigits(lang, v.time)}
            </div>
          </div>
          <ViewStatus status={v.status} />
        </div>
      ))}
    </div>
  );
}
