"use client";

import { useMemo, useState } from "react";
import { StatCard } from "@/components/data/stat-card";
import {
  PERIODS,
  buildPeriodKpis,
  buildStatusSlices,
  buildTopLocations,
  type StatusSlice,
  type LocationRow,
} from "@/app/admin/_reports/data";
import { useLang } from "@/lib/i18n";
import { fmtNum, localizeDigits } from "@/lib/fmt";
import { useAgentData } from "../_shared/agent-data";
import "../_shared/agent.css";

function Bars({ rows, colorAt }: { rows: { name: string; value: number; color?: string }[]; colorAt?: (i: number) => string }) {
  const { t, lang } = useLang();
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.some((r) => r.value > 0)) return <div className="agx-empty">{t("agent.reports.noActivity")}</div>;
  return (
    <div className="agx-bars">
      {rows.map((r, i) => (
        <div className="agx-bar" key={r.name}>
          <span className="agx-bar__name">{r.name}</span>
          <span className="agx-bar__track">
            <span className="agx-bar__fill" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? colorAt?.(i) ?? "var(--green-500)" }} />
          </span>
          <span className="agx-bar__val">{fmtNum(lang, r.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AgentReportsPage() {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const { properties, members, viewings } = useAgentData();
  const [pid, setPid] = useState("Month");
  const period = PERIODS.find((p) => p.short === pid) ?? PERIODS[2];
  const days = period.days;

  const kpis = useMemo(() => buildPeriodKpis(properties, members, viewings, days, period.label), [properties, members, viewings, days, period.label]);
  const status: StatusSlice[] = useMemo(() => buildStatusSlices(properties, days), [properties, days]);
  const locations: LocationRow[] = useMemo(() => buildTopLocations(properties, days).Cities, [properties, days]);

  return (
    <>
      <div className="agx-head">
        <div className="agx-head__intro">
          <h1 className="agx-title">{t("admin.nav.reports")}</h1>
          <p className="agx-sub">{t("agent.reports.sub")}</p>
        </div>
        <div className="agx-head__action">
          <div className="agx-tabs" role="tablist" aria-label={t("admin.reports.periodAria")} style={{ marginBottom: 0 }}>
            {PERIODS.map((p) => (
              <button key={p.short} type="button" role="tab" aria-selected={pid === p.short} className={"agx-tab" + (pid === p.short ? " is-active" : "")} onClick={() => setPid(p.short)}>
                {t(`admin.reports.period.${p.short}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="agx-kpis agx-kpis--6" aria-label={t("admin.reports.summaryAria")}>
        {kpis.map((c) => (
          <StatCard
            key={c.key}
            label={t(`admin.reports.kpi.${c.key}`)}
            value={localizeDigits(lang, c.value)}
            icon={c.icon}
            tone={c.tone}
            delta={c.delta ? localizeDigits(lang, c.delta) : undefined}
            deltaDir={c.dir}
            sub={t(c.key === "agents" ? "admin.reports.inLast" : "admin.reports.vsPrev", { period: t(`admin.reports.periodWord.${period.short}`) })}
          />
        ))}
      </section>

      <div className="agx-grid">
        <div className="agx-card">
          <div className="agx-card__head">
            <h2 className="agx-card__title">{t("admin.reports.status.title")}</h2>
          </div>
          <Bars rows={status.map((s) => ({ name: tOr(`status.${s.key}`, s.label), value: s.value, color: s.color }))} />
        </div>
        <div className="agx-card">
          <div className="agx-card__head">
            <h2 className="agx-card__title">{t("admin.reports.locations.title")}</h2>
          </div>
          <Bars rows={locations.map((l) => ({ ...l, name: tOr(`city.${l.name}`, l.name) }))} colorAt={(i) => (i === 0 ? "var(--green-700)" : "var(--green-300)")} />
        </div>
      </div>
    </>
  );
}
