"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { StatCard } from "@/components/data/stat-card";
import { KPI_CARDS, KPI_PERIODS } from "./data";
import { useProperties } from "../_shared/properties-store";

function PeriodSelector({ period, onChange }: { period: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = KPI_PERIODS.find((p) => p.id === period) || KPI_PERIODS[0];
  return (
    <div className="ax-period">
      <button
        type="button"
        className={"ax-period__btn" + (open ? " is-open" : "")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="ax-period__lead">
          <Icon name="calendar-range" size={17} />
        </span>
        {current.label}
        <Icon name="chevron-down" size={16} className="ax-period__chev" />
      </button>
      {open && (
        <>
          <div className="ax-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="ax-period__menu" role="listbox" aria-label="Dashboard period">
            {KPI_PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={p.id === period}
                className={"ax-menu-item" + (p.id === period ? " is-selected" : "")}
                onClick={() => {
                  onChange(p.id);
                  setOpen(false);
                }}
              >
                {p.label}
                {p.id === period && (
                  <span className="ax-menu-item__check">
                    <Icon name="check" size={17} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function KpiSection() {
  const [period, setPeriod] = useState("month");
  const { counts } = useProperties();
  const meta = KPI_PERIODS.find((p) => p.id === period) || KPI_PERIODS[1];
  return (
    <section className="ax-section" aria-label="Key performance indicators">
      <div className="ax-section__head">
        <div className="ax-section__heading">
          <h2 className="ax-section__title">KPI overview</h2>
        </div>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>
      <div className="ax-kpi-grid">
        {KPI_CARDS.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={c.field ? counts[c.field].toLocaleString("en-US") : c.values[period]}
            icon={c.icon}
            tone={c.tone}
            delta={c.delta[period]}
            deltaDir="up"
            sub={c.field ? "Live from listings" : meta.compare}
          />
        ))}
      </div>
    </section>
  );
}
