"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/data/stat-card";
import { useLang } from "@/lib/i18n";
import { fmtNum, localizeDigits } from "@/lib/fmt";
import { useProperties } from "../_shared/properties-store";
import { VIEWINGS } from "../_viewings/data";
import {
  C,
  PERIODS,
  buildAgentRows,
  buildListingsTrend,
  buildMemberTrends,
  buildPeriodKpis,
  buildSalesRentals,
  buildStatusSlices,
  buildTopLocations,
  niceNum,
  smoothPath,
  type AgentRow,
  type LocationRow,
  type MemberTrend,
  type Series,
  type StatusSlice,
} from "./data";

function useElementWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    setW(ref.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

function ChartCard({ title, desc, right, children, className }: { title: string; desc?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={"rp-card" + (className ? " " + className : "")}>
      <div className="rp-card__head">
        <div className="rp-card__heading">
          <h2 className="rp-card__title">{title}</h2>
          {desc && <p className="rp-card__desc">{desc}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

/** `options` are stable ids; `labelFor` renders their display text. */
function Segmented({ options, value, onChange, ariaLabel, labelFor }: { options: string[]; value: string; onChange: (v: string) => void; ariaLabel: string; labelFor?: (o: string) => string }) {
  return (
    <div className="ax-seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={o === value} className={"ax-seg__btn" + (o === value ? " is-active" : "")} onClick={() => onChange(o)}>
          {labelFor ? labelFor(o) : o}
        </button>
      ))}
    </div>
  );
}

function LineChart({ labels, series }: { labels: string[]; series: Series[] }) {
  const { t, lang } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = useElementWidth(wrapRef);
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const H = W < 560 ? 250 : W < 900 ? 300 : 340;
  const PAD = { t: 18, r: 18, b: 32, l: 44 };
  const plotW = Math.max(0, W - PAD.l - PAD.r);
  const plotH = Math.max(0, H - PAD.t - PAD.b);
  const allVals = series.flatMap((s) => s.data);
  const STEPS = 4;
  const step = niceNum(Math.max(1, ...allVals) / STEPS);
  const top = step * STEPS;
  const xAt = (i: number) => PAD.l + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yAt = (v: number) => PAD.t + plotH * (1 - v / top);
  const gridYs = Array.from({ length: STEPS + 1 }, (_, k) => k * step);
  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!W) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - PAD.l) / (plotW || 1)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const tipLeft = hover != null ? xAt(hover) : 0;
  const flip = hover != null && tipLeft > W * 0.62;
  const primary = series[0];
  return (
    <div className="ax-chart" ref={wrapRef}>
      {W > 0 && primary && (
        <svg width={W} height={H} role="img" aria-label={t("admin.reports.perf.aria")}>
          <defs>
            <linearGradient id="rp-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--green-700)" stopOpacity="0.14" />
              <stop offset="100%" stopColor="var(--green-700)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {gridYs.map((g, k) => (
            <g key={k}>
              <line className={"ax-grid-line" + (k === 0 ? " ax-grid-base" : "")} x1={PAD.l} x2={W - PAD.r} y1={yAt(g)} y2={yAt(g)} />
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">
                {fmtNum(lang, g)}
              </text>
            </g>
          ))}
          {labels.map((lb, i) =>
            i % Math.max(1, Math.ceil(n / 8)) === 0 || i === n - 1 ? (
              <text key={i} className="ax-chart__xlab" x={xAt(i)} y={H - 10} textAnchor="middle">
                {lb}
              </text>
            ) : null,
          )}
          {(() => {
            const pts = primary.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
            const line = smoothPath(pts);
            const area = `${line} L${xAt(n - 1)},${PAD.t + plotH} L${xAt(0)},${PAD.t + plotH} Z`;
            return <path d={area} fill="url(#rp-area)" />;
          })()}
          {hover != null && <line className="ax-guide" x1={xAt(hover)} x2={xAt(hover)} y1={PAD.t} y2={PAD.t + plotH} />}
          {series.map((s) => {
            const pts = s.data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
            return <path key={s.key} className="ax-chart__line" d={smoothPath(pts)} style={{ stroke: s.color }} />;
          })}
          {hover != null && series.map((s) => <circle key={s.key} className="ax-chart__dot" cx={xAt(hover)} cy={yAt(s.data[hover])} r={4} style={{ stroke: s.color }} />)}
          <rect x={PAD.l} y={PAD.t} width={plotW} height={plotH} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </svg>
      )}
      {hover != null && (
        <div className="ax-chart__tip" style={{ left: tipLeft, top: PAD.t + 2, transform: `translate(${flip ? "calc(-100% - 14px)" : "14px"}, 0)` }}>
          <div className="ax-chart__tip-head">{labels[hover]}</div>
          {series.map((s) => (
            <div className="ax-chart__tip-row" key={s.key}>
              <span className="ax-chart__tip-dot" style={{ background: s.color }} />
              <span className="ax-chart__tip-label">{t(`admin.reports.series.${s.key}`)}</span>
              <span className="ax-chart__tip-val">{fmtNum(lang, s.data[hover])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ series, visible, onToggle }: { series: Series[]; visible: Record<string, boolean>; onToggle: (k: string) => void }) {
  const { t } = useLang();
  return (
    <div className="ax-legend" role="group" aria-label={t("admin.dash.legendAria")} style={{ margin: 0 }}>
      {series.map((s) => (
        <button key={s.key} type="button" className={"ax-legend__item" + (visible[s.key] ? "" : " is-off")} aria-pressed={visible[s.key]} onClick={() => onToggle(s.key)}>
          <span className="ax-legend__dot" style={{ background: visible[s.key] ? s.color : "var(--gray-300)" }} />
          {t(`admin.reports.series.${s.key}`)}
        </button>
      ))}
    </div>
  );
}

function PropertyPerformance({ labels, series }: { labels: string[]; series: Series[] }) {
  const { t } = useLang();
  const [visible, setVisible] = useState<Record<string, boolean>>(() => Object.fromEntries(series.map((s) => [s.key, true])));
  const toggle = (k: string) =>
    setVisible((v) => {
      const next = { ...v, [k]: !v[k] };
      if (Object.values(next).every((x) => !x)) return v;
      return next;
    });
  const shown = series.filter((s) => visible[s.key] ?? true);
  return (
    <ChartCard title={t("admin.reports.perf.title")} desc={t("admin.reports.perf.desc")} right={series.length > 1 ? <Legend series={series} visible={visible} onToggle={toggle} /> : undefined}>
      <LineChart labels={labels} series={shown} />
    </ChartCard>
  );
}

function Donut({ status }: { status: StatusSlice[] }) {
  const { t, lang } = useLang();
  const total = status.reduce((a, s) => a + s.value, 0);
  const [active, setActive] = useState<number | null>(null);
  const size = 200,
    stroke = 26,
    r = (size - stroke) / 2,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  const segs = status.reduce<{ key: string; color: string; dash: number; offset: number }[]>((arr, s) => {
    const frac = total ? s.value / total : 0;
    const prior = arr.length ? arr[arr.length - 1].offset + arr[arr.length - 1].dash : 0;
    arr.push({ key: s.key, color: s.color, dash: frac * circ, offset: prior });
    return arr;
  }, []);
  const center = active != null ? status[active] : null;
  return (
    <div className="rp-donut">
      <div className="rp-donut__chart" role="img" aria-label={t("admin.reports.status.title")}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={stroke} />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segs.map((s, i) => (
              <circle
                key={s.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={active === i ? stroke + 4 : stroke}
                strokeDasharray={`${s.dash} ${circ - s.dash}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                style={{ transition: "stroke-width .15s", opacity: active == null || active === i ? 1 : 0.4, cursor: "pointer" }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            ))}
          </g>
        </svg>
        <div className="rp-donut__center">
          <span className="rp-donut__num">{fmtNum(lang, center ? center.value : total)}</span>
          <span className="rp-donut__lbl">{center ? center.label : "Total properties"}</span>
        </div>
      </div>
      <ul className="rp-donut__legend">
        {status.map((s, i) => (
          <li key={s.key} className={"rp-legrow" + (active === i ? " is-active" : "")} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <span className="rp-legrow__dot" style={{ background: s.color }} />
            <span className="rp-legrow__label">{t(`admin.reports.slice.${s.key}`)}</span>
            <span className="rp-legrow__pct">{total ? Math.round((s.value / total) * 100) : 0}%</span>
            <span className="rp-legrow__val">{fmtNum(lang, s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupedBars({ labels, series }: { labels: string[]; series: Series[] }) {
  const { t, lang } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = useElementWidth(wrapRef);
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const H = 300;
  const PAD = { t: 16, r: 8, b: 32, l: 40 };
  const plotW = Math.max(0, W - PAD.l - PAD.r);
  const plotH = Math.max(0, H - PAD.t - PAD.b);
  const STEPS = 4;
  const step = niceNum(Math.max(1, ...series.flatMap((s) => s.data)) / STEPS);
  const top = step * STEPS;
  const yAt = (v: number) => PAD.t + plotH * (1 - v / top);
  const gridYs = Array.from({ length: STEPS + 1 }, (_, k) => k * step);
  const groupW = plotW / n;
  const barGap = 5;
  const barW = Math.min(20, (groupW * 0.56 - barGap) / series.length);
  const groupInner = barW * series.length + barGap;
  return (
    <div className="ax-chart" ref={wrapRef}>
      {W > 0 && (
        <svg width={W} height={H} role="img" aria-label={t("admin.reports.trends.aria")}>
          {gridYs.map((g, k) => (
            <g key={k}>
              <line className={"ax-grid-line" + (k === 0 ? " ax-grid-base" : "")} x1={PAD.l} x2={W - PAD.r} y1={yAt(g)} y2={yAt(g)} />
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">
                {fmtNum(lang, g)}
              </text>
            </g>
          ))}
          {labels.map((lb, i) => {
            const gx = PAD.l + groupW * i + groupW / 2;
            return (
              <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                <rect x={PAD.l + groupW * i} y={PAD.t} width={groupW} height={plotH} fill={hover === i ? "var(--gray-50)" : "transparent"} />
                {series.map((s, si) => {
                  const x = gx - groupInner / 2 + si * (barW + barGap);
                  const y = yAt(s.data[i]);
                  return <rect key={s.key} x={x} y={y} width={barW} height={PAD.t + plotH - y} rx={3} fill={s.color} style={{ opacity: hover == null || hover === i ? 1 : 0.55, transition: "opacity .15s" }} />;
                })}
                {(i % Math.max(1, Math.ceil(n / 8)) === 0 || i === n - 1) && (
                  <text className="ax-chart__xlab" x={gx} y={H - 10} textAnchor="middle">
                    {lb}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
      {hover != null && W > 0 && (
        <div
          className="ax-chart__tip"
          style={{ left: PAD.l + groupW * hover + groupW / 2, top: PAD.t + 2, transform: `translate(${PAD.l + groupW * hover + groupW / 2 > W * 0.62 ? "calc(-100% - 14px)" : "14px"}, 0)` }}
        >
          <div className="ax-chart__tip-head">{labels[hover]}</div>
          {series.map((s) => (
            <div className="ax-chart__tip-row" key={s.key}>
              <span className="ax-chart__tip-dot" style={{ background: s.color }} />
              <span className="ax-chart__tip-label">{t(`admin.reports.series.${s.key}`)}</span>
              <span className="ax-chart__tip-val">{fmtNum(lang, s.data[hover])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SalesRentals({ labels, series }: { labels: string[]; series: Series[] }) {
  const { t } = useLang();
  return (
    <ChartCard
      title={t("admin.reports.trends.title")}
      desc={t("admin.reports.trends.desc")}
      right={
        <div className="ax-legend" style={{ margin: 0 }}>
          {series.map((s) => (
            <span key={s.key} className="ax-legend__item" style={{ cursor: "default" }}>
              <span className="ax-legend__dot" style={{ background: s.color }} />
              {t(`admin.reports.series.${s.key}`)}
            </span>
          ))}
        </div>
      }
    >
      <GroupedBars labels={labels} series={series} />
    </ChartCard>
  );
}

function TopLocations({ data }: { data: Record<string, LocationRow[]> }) {
  const { t, lang } = useLang();
  const [scope, setScope] = useState("Cities");
  const rows = data[scope] ?? [];
  const max = Math.max(1, ...rows.map((r) => r.value));
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  return (
    <ChartCard
      title={t("admin.reports.locations.title")}
      desc={t("admin.reports.locations.desc")}
      right={
        <Segmented
          options={["Cities", "Areas", "Projects"]}
          labelFor={(o) => t(`admin.reports.scope.${o}`)}
          value={scope}
          onChange={setScope}
          ariaLabel={t("admin.reports.locations.aria")}
        />
      }
    >
      <ul className="rp-hbars">
        {rows.map((r, i) => (
          <li className="rp-hbar" key={r.name}>
            <span className="rp-hbar__rank">{fmtNum(lang, i + 1)}</span>
            <span className="rp-hbar__name">{tOr(`city.${r.name}`, r.name)}</span>
            <span className="rp-hbar__track">
              <span className="rp-hbar__fill" style={{ width: `${(r.value / max) * 100}%`, background: i === 0 ? C.green : "var(--green-300)" }} />
            </span>
            <span className="rp-hbar__val">{fmtNum(lang, r.value)}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

function AgentPerformance({ agents }: { agents: AgentRow[] }) {
  const completion = (a: AgentRow) => (a.viewings ? (a.completed / a.viewings) * 100 : 0);
  const rows = agents.map((a) => ({ ...a, conv: completion(a) })).sort((x, y) => y.conv - x.conv);
  return (
    <ChartCard title="Top 5 agent performance" desc="Ranked by completion rate = completed viewings ÷ total viewings." className="rp-card--flush">
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead>
            <tr>
              <th className="rp-th rp-th--rank">#</th>
              <th className="rp-th rp-th--agent">Agent</th>
              <th className="rp-th rp-th--num">Active listings</th>
              <th className="rp-th rp-th--num">Sold</th>
              <th className="rp-th rp-th--num">Rented</th>
              <th className="rp-th rp-th--num">Viewings</th>
              <th className="rp-th rp-th--conv">Completion rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.name} className="rp-tr">
                <td className="rp-td rp-td--rank">{i + 1}</td>
                <td className="rp-td rp-td--agent">
                  <Avatar src={a.img} name={a.name} size="sm" verified={a.verified} />
                  <span className="rp-agent">
                    <span className="rp-agent__name">{a.name}</span>
                    <span className="rp-agent__team">{a.team}</span>
                  </span>
                </td>
                <td className="rp-td rp-td--num">{a.active}</td>
                <td className="rp-td rp-td--num">{a.sold}</td>
                <td className="rp-td rp-td--num">{a.rented}</td>
                <td className="rp-td rp-td--num">{a.viewings}</td>
                <td className="rp-td rp-td--conv">
                  <span className="rp-conv">
                    <span className="rp-conv__track">
                      <span className="rp-conv__fill" style={{ width: `${a.conv}%`, background: C.green }} />
                    </span>
                    <span className="rp-conv__val">{a.conv.toFixed(1)}%</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function MiniTrend({ data, color }: { data: number[]; color: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = useElementWidth(wrapRef);
  const H = 64;
  const min = Math.min(...data),
    max = Math.max(...data);
  const n = data.length;
  const xAt = (i: number) => (n <= 1 ? W / 2 : (W * i) / (n - 1));
  const yAt = (v: number) => 6 + (H - 12) * (1 - (v - min) / (max - min || 1));
  const gid = "mt-" + useId().replace(/[:]/g, "");
  return (
    <div className="rp-mini__spark" ref={wrapRef}>
      {W > 0 &&
        (() => {
          const pts = data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
          const line = smoothPath(pts);
          const area = `${line} L${xAt(n - 1)},${H} L${xAt(0)},${H} Z`;
          return (
            <svg width={W} height={H}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gid})`} />
              <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={xAt(n - 1)} cy={yAt(data[n - 1])} r={3} fill="var(--surface-card)" stroke={color} strokeWidth={2} />
            </svg>
          );
        })()}
    </div>
  );
}

function MemberActivity({ trends }: { trends: MemberTrend[] }) {
  return (
    <ChartCard title="Member activity" desc="Engagement signals trending across the selected period." className="rp-card--flush">
      <div className="rp-minis">
        {trends.map((m) => (
          <div className="rp-mini" key={m.key}>
            <div className="rp-mini__top">
              <span className={"ax-chip ax-chip--sm ax-chip--" + m.tone}>
                <Icon name={m.icon} size={17} />
              </span>
              <span className="rp-mini__delta">
                <Icon name="trending-up" size={14} />
                {m.delta}
              </span>
            </div>
            <div className="rp-mini__val">{m.value}</div>
            <div className="rp-mini__lbl">{m.label}</div>
            <MiniTrend data={m.data} color={m.color} />
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

interface ToastItem { id: number; kind: string; rangeLabel: string }
function ExportToast({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 320);
    }, 3600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={"rp-toast" + (show ? " is-in" : "")}>
      <span className="rp-toast__icon">
        <Icon name={toast.kind === "Excel" ? "sheet" : "file-text"} size={18} />
      </span>
      <div className="rp-toast__body">
        <p className="rp-toast__title">{t("admin.reports.toast.title")}</p>
        <p className="rp-toast__msg">{t("admin.reports.toast.msg", { range: toast.rangeLabel })}</p>
      </div>
      <button
        type="button"
        className="rp-toast__close"
        onClick={() => {
          setShow(false);
          setTimeout(onDone, 320);
        }}
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export function ReportsApp() {
  const { t, lang } = useLang();
  const [periodId, setPeriodId] = useState("Month");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { properties, members, agents } = useProperties();

  const period = PERIODS.find((p) => p.short === periodId) ?? PERIODS[1];
  /** The period as a noun ("week") for the "vs previous …" sub-labels. */
  const periodWord = t(`admin.reports.periodWord.${period.short}`);
  const days = period.days;
  const kpis = useMemo(() => buildPeriodKpis(properties, members, VIEWINGS, days, period.label), [properties, members, days, period.label]);
  const perf = useMemo(() => buildListingsTrend(properties, days), [properties, days]);
  const status = useMemo(() => buildStatusSlices(properties, days), [properties, days]);
  const sr = useMemo(() => buildSalesRentals(properties, days), [properties, days]);
  const locations = useMemo(() => buildTopLocations(properties, days), [properties, days]);
  const agentRows = useMemo(() => buildAgentRows(agents, properties, VIEWINGS, days), [agents, properties, days]);
  const memberTrends = useMemo(() => buildMemberTrends(members, VIEWINGS, days), [members, days]);

  const onExport = (kind: string) => {
    setToasts((ts) => [...ts, { id: Date.now(), kind, rangeLabel: t("admin.reports.lastPeriod", { period: periodWord }) }]);
  };

  return (
    <>
      <div className="rp-head">
        <div className="rp-head__intro">
          <h1 className="rp-head__title">{t("admin.reports.title")}</h1>
          <p className="rp-head__sub">{t("admin.reports.sub")}</p>
        </div>
        <div className="rp-head__tools">
          <div className="rp-head__exports">
            <button type="button" className="rp-xbtn" onClick={() => onExport("data")}>
              <Icon name="download" size={17} /> {t("admin.reports.exportData")}
            </button>
          </div>
        </div>
      </div>

      <div className="rp-periodbar">
        <Segmented
          options={PERIODS.map((p) => p.short)}
          labelFor={(o) => t(`admin.reports.period.${o}`)}
          value={periodId}
          onChange={setPeriodId}
          ariaLabel={t("admin.reports.periodAria")}
        />
      </div>

      <section className="rp-kpis" aria-label={t("admin.reports.summaryAria")}>
        {kpis.map((c) => (
          <StatCard
            key={c.key}
            label={t(`admin.reports.kpi.${c.key}`)}
            value={localizeDigits(lang, c.value)}
            icon={c.icon}
            tone={c.tone}
            delta={c.delta ? localizeDigits(lang, c.delta) : undefined}
            deltaDir={c.dir}
            sub={t(c.key === "agents" ? "admin.reports.inLast" : "admin.reports.vsPrev", { period: periodWord })}
          />
        ))}
      </section>

      <div className="rp-stack">
        <PropertyPerformance labels={perf.labels} series={perf.series} />
        <div className="rp-split">
          <ChartCard title={t("admin.reports.status.title")} desc={t("admin.reports.status.desc")}>
            <Donut status={status} />
          </ChartCard>
          <SalesRentals labels={sr.labels} series={sr.series} />
        </div>
        <TopLocations data={locations} />
        <AgentPerformance agents={agentRows} />
        <MemberActivity trends={memberTrends} />
      </div>

      <div className="rp-toaster">
        {toasts.map((tt) => (
          <ExportToast key={tt.id} toast={tt} onDone={() => setToasts((ts) => ts.filter((x) => x.id !== tt.id))} />
        ))}
      </div>
    </>
  );
}
