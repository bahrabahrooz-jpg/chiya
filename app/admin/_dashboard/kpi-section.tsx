"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/data/stat-card";
import { useLang } from "@/lib/i18n";
import { fmtNum, localizeDigits } from "@/lib/fmt";
import { KPI_CARDS, KPI_PERIODS } from "./data";
import { type CountPeriod } from "../_data/catalog";
import { closedContractsInPeriod } from "../_data/property-state";
import { useProperties } from "../_shared/properties-store";
import { useContracts } from "../_shared/contracts-store";

function SegmentedPeriod({ period, onChange }: { period: string; onChange: (id: string) => void }) {
  const { t } = useLang();
  return (
    <div className="ax-seg" role="tablist" aria-label={t("admin.dash.periodAria")}>
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
          {t(`admin.dash.periodShort.${p.id}`)}
        </button>
      ))}
    </div>
  );
}

export function KpiSection() {
  const { t, lang } = useLang();
  const [period, setPeriod] = useState("month");
  const { counts } = useProperties();
  const { contracts } = useContracts();
  /* Sold / rented are period-scoped FLOWS — how many transactions closed in the
     window — so they are counted from deals and dated by the deal's own
     `closedOn`. A property's "last updated" moves when someone swaps a photo,
     and a sale's date must not. Total and available stay inventory snapshots. */
  const flow = useMemo(() => closedContractsInPeriod(contracts, period as CountPeriod), [contracts, period]);
  return (
    <section className="ax-section" aria-label={t("admin.dash.kpiAria")}>
      <div className="ax-section__head">
        <div className="ax-section__heading">
          <h2 className="ax-section__title">{t("admin.dash.kpiTitle")}</h2>
        </div>
        <SegmentedPeriod period={period} onChange={setPeriod} />
      </div>
      <div className="ax-kpi-grid">
        {KPI_CARDS.map((c) => {
          const periodScoped = c.field === "sold" || c.field === "rented";
          const value = periodScoped
            ? fmtNum(lang, flow[c.field as "sold" | "rented"])
            : c.field
              ? fmtNum(lang, counts[c.field])
              : localizeDigits(lang, c.values[period]);
          return (
            <StatCard
              key={c.key}
              label={t(`admin.dash.kpi.${c.key}`)}
              value={value}
              icon={c.icon}
              tone={c.tone}
              delta={localizeDigits(lang, c.delta[period])}
              deltaDir="up"
              sub={periodScoped ? t(`admin.dash.period.${period}`) : c.field ? t("admin.dash.liveFromListings") : t(`admin.dash.compare.${period}`)}
            />
          );
        })}
      </div>
    </section>
  );
}
