"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/data/stat-card";
import { Table, type TableColumn } from "@/components/data/table";
import { computeViewingKpis, type ViewingRecord } from "@/app/admin/_viewings/data";
import type { PropertyRecord } from "@/app/admin/_data/catalog";
import { useAgentData } from "./_shared/agent-data";
import { PropStatus, ViewStatus, money } from "./_shared/ui";
import "./_shared/agent.css";

export default function AgentDashboardPage() {
  const { me, properties, viewings } = useAgentData();
  const kpis = computeViewingKpis(viewings);
  const first = me.name.split(/\s+/)[0];

  const recent = [...properties].sort((a, b) => a.daysAgo - b.daysAgo).slice(0, 6);
  const upcoming = viewings
    .filter((v) => v.status === "Scheduled" || v.status === "Confirmed")
    .slice(0, 6);

  const cols: TableColumn<PropertyRecord>[] = [
    {
      key: "title",
      header: "Property",
      render: (_v, p) => (
        <span className="agx-thumb">
          <img className="agx-thumb__img" src={p.img} alt="" />
          <span style={{ minWidth: 0 }}>
            <span className="agx-thumb__name">{p.title}</span>
            <span className="agx-thumb__sub">{p.area}, {p.city}</span>
          </span>
        </span>
      ),
    },
    { key: "type", header: "Type" },
    { key: "status", header: "Status", render: (_v, p) => <PropStatus status={p.status} /> },
    { key: "price", header: "Price", align: "right", render: (_v, p) => money(p) },
  ];

  return (
    <>
      <div className="agx-head">
        <div className="agx-head__intro">
          <h1 className="agx-title">Welcome back, {first}</h1>
          <p className="agx-sub">Here&apos;s what&apos;s happening across your listings and viewings today.</p>
        </div>
      </div>

      <section className="agx-kpis" aria-label="My performance">
        <StatCard label="My listings" value={me.listings} icon="building-2" tone="brand" sub="Active & pending" />
        <StatCard label="Sold" value={me.sold} icon="key" tone="gold" sub="Closed sales" />
        <StatCard label="Rented" value={me.rented} icon="home" tone="info" sub="Closed rentals" />
        <StatCard label="Upcoming viewings" value={kpis.upcoming} icon="calendar-check" tone="success" sub="Next 7 days" />
      </section>

      <div className="agx-grid">
        <div className="agx-card">
          <div className="agx-card__head">
            <h2 className="agx-card__title">Recent listings</h2>
            <Link className="agx-card__link" href="/agent/properties">View all</Link>
          </div>
          {recent.length ? (
            <Table<PropertyRecord> columns={cols} rows={recent} rowKey="id" />
          ) : (
            <div className="agx-empty">You have no listings yet.</div>
          )}
        </div>

        <div className="agx-card">
          <div className="agx-card__head">
            <h2 className="agx-card__title">Upcoming viewings</h2>
            <Link className="agx-card__link" href="/agent/viewings">View all</Link>
          </div>
          {upcoming.length ? (
            <ViewingList items={upcoming} />
          ) : (
            <div className="agx-empty">No upcoming viewings.</div>
          )}
        </div>
      </div>
    </>
  );
}

function ViewingList({ items }: { items: ViewingRecord[] }) {
  return (
    <div>
      {items.map((v) => (
        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
          <img src={v.property.img} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flex: "none" }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.property.title}</div>
            <div style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>
              <Icon name="user" size={12} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} />
              {v.member} · {v.date}, {v.time}
            </div>
          </div>
          <ViewStatus status={v.status} />
        </div>
      ))}
    </div>
  );
}
