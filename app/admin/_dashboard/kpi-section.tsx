"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/data/stat-card";
import { KPI_CARDS, KPI_PERIODS } from "./data";
import { countSoldRentedInPeriod, type CountPeriod } from "../_data/catalog";
import { useProperties } from "../_shared/properties-store";

function SegmentedPeriod({ period, onChange }: { period: string; onChange: (id: string) => void }) {
  return (
    <div className="ax-seg" role="tablist" aria-label="Dashboard period">
      <span className="ax-seg__thumb" />
      {KPI_PERIODS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="tab"
          aria-selected={p.id === period}
          className={"ax-seg__btn" + (p.id === period ? " is-active" : "")}
          onClick={() => onChange(p.id)}
        >
          {p.short}
        </button>
      ))}
    </div>
  );
}

export function KpiSection() {
  const [period, setPeriod] = useState("month");
  const { counts, properties } = useProperties();
  const meta = KPI_PERIODS.find((p) => p.id === period) || KPI_PERIODS[2];
  // Sold / rented are period-scoped flows counted from the live records; total
  // and available stay as live inventory snapshots.
  const flow = useMemo(() => countSoldRentedInPeriod(properties, period as CountPeriod), [properties, period]);
  return (
    <section className="ax-section" aria-label="Key performance indicators">
      <div className="ax-section__head">
        <div className="ax-section__heading">
          <h2 className="ax-section__title">KPI overview</h2>
        </div>
        <SegmentedPeriod period={period} onChange={setPeriod} />
      </div>
      <div className="ax-kpi-grid">
        {KPI_CARDS.map((c) => {
          const periodScoped = c.field === "sold" || c.field === "rented";
          const value = periodScoped
            ? flow[c.field as "sold" | "rented"].toLocaleString("en-US")
            : c.field
              ? counts[c.field].toLocaleString("en-US")
              : c.values[period];
          return (
            <StatCard
              key={c.key}
              label={c.label}
              value={value}
              icon={c.icon}
              tone={c.tone}
              delta={c.delta[period]}
              deltaDir="up"
              sub={periodScoped ? meta.label : c.field ? "Live from listings" : meta.compare}
            />
          );
        })}
      </div>
    </section>
  );
}
