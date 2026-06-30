"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/data/stat-card";
import {
  AGENTS,
  C,
  DATE_RANGES,
  KPI_CARDS,
  LOCATIONS,
  MEMBER_TRENDS,
  MONTHS,
  PERF_SERIES,
  SR_MONTHS,
  SR_SERIES,
  STATUS,
  niceNum,
  smoothPath,
  type Series,
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

function DateRange({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = DATE_RANGES.find((d) => d.id === value) || DATE_RANGES[1];
  return (
    <div className="ax-period rp-daterange">
      <button type="button" className={"ax-period__btn" + (open ? " is-open" : "")} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ax-period__lead">
          <Icon name="calendar-range" size={17} />
        </span>
        {current.label}
        <Icon name="chevron-down" size={16} className="ax-period__chev" />
      </button>
      {open && (
        <>
          <div className="ax-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="ax-period__menu" role="listbox" aria-label="Date range">
            {DATE_RANGES.map((d) => (
              <button
                key={d.id}
                type="button"
                role="option"
                aria-selected={d.id === value}
                className={"ax-menu-item" + (d.id === value ? " is-selected" : "")}
                onClick={() => {
                  onChange(d.id);
                  setOpen(false);
                }}
              >
                {d.custom && <Icon name="sliders-horizontal" size={16} />}
                {d.label}
                {d.id === value && (
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

function Segmented({ options, value, onChange, ariaLabel }: { options: string[]; value: string; onChange: (v: string) => void; ariaLabel: string }) {
  return (
    <div className="ax-seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={o === value} className={"ax-seg__btn" + (o === value ? " is-active" : "")} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function LineChart({ labels, series }: { labels: string[]; series: Series[] }) {
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
        <svg width={W} height={H} role="img" aria-label="Properties added by month">
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
                {g.toLocaleString()}
              </text>
            </g>
          ))}
          {labels.map((lb, i) => (
            <text key={i} className="ax-chart__xlab" x={xAt(i)} y={H - 10} textAnchor="middle">
              {lb}
            </text>
          ))}
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
              <span className="ax-chart__tip-label">{s.label}</span>
              <span className="ax-chart__tip-val">{s.data[hover].toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ series, visible, onToggle }: { series: Series[]; visible: Record<string, boolean>; onToggle: (k: string) => void }) {
  return (
    <div className="ax-legend" role="group" aria-label="Toggle metrics" style={{ margin: 0 }}>
      {series.map((s) => (
        <button key={s.key} type="button" className={"ax-legend__item" + (visible[s.key] ? "" : " is-off")} aria-pressed={visible[s.key]} onClick={() => onToggle(s.key)}>
          <span className="ax-legend__dot" style={{ background: visible[s.key] ? s.color : "var(--gray-300)" }} />
          {s.label}
        </button>
      ))}
    </div>
  );
}

function PropertyPerformance() {
  const [visible, setVisible] = useState<Record<string, boolean>>({ thisYear: true, lastYear: true });
  const toggle = (k: string) =>
    setVisible((v) => {
      const next = { ...v, [k]: !v[k] };
      if (Object.values(next).every((x) => !x)) return v;
      return next;
    });
  const shown = PERF_SERIES.filter((s) => visible[s.key]);
  return (
    <ChartCard title="Property performance" desc="Properties added by month — current year against the prior year." right={<Legend series={PERF_SERIES} visible={visible} onToggle={toggle} />}>
      <LineChart labels={MONTHS} series={shown} />
    </ChartCard>
  );
}

function Donut() {
  const total = STATUS.reduce((a, s) => a + s.value, 0);
  const [active, setActive] = useState<number | null>(null);
  const size = 200,
    stroke = 26,
    r = (size - stroke) / 2,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  const segs = STATUS.reduce<{ key: string; color: string; dash: number; offset: number }[]>((arr, s) => {
    const frac = s.value / total;
    const prior = arr.length ? arr[arr.length - 1].offset + arr[arr.length - 1].dash : 0;
    arr.push({ key: s.key, color: s.color, dash: frac * circ, offset: prior });
    return arr;
  }, []);
  const center = active != null ? STATUS[active] : null;
  return (
    <div className="rp-donut">
      <div className="rp-donut__chart" role="img" aria-label="Property status breakdown">
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
          <span className="rp-donut__num">{(center ? center.value : total).toLocaleString()}</span>
          <span className="rp-donut__lbl">{center ? center.label : "Total properties"}</span>
        </div>
      </div>
      <ul className="rp-donut__legend">
        {STATUS.map((s, i) => (
          <li key={s.key} className={"rp-legrow" + (active === i ? " is-active" : "")} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
            <span className="rp-legrow__dot" style={{ background: s.color }} />
            <span className="rp-legrow__label">{s.label}</span>
            <span className="rp-legrow__pct">{Math.round((s.value / total) * 100)}%</span>
            <span className="rp-legrow__val">{s.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupedBars({ labels, series }: { labels: string[]; series: Series[] }) {
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
        <svg width={W} height={H} role="img" aria-label="Sales and rentals by month">
          {gridYs.map((g, k) => (
            <g key={k}>
              <line className={"ax-grid-line" + (k === 0 ? " ax-grid-base" : "")} x1={PAD.l} x2={W - PAD.r} y1={yAt(g)} y2={yAt(g)} />
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">
                {g.toLocaleString()}
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
                <text className="ax-chart__xlab" x={gx} y={H - 10} textAnchor="middle">
                  {lb}
                </text>
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
              <span className="ax-chart__tip-label">{s.label}</span>
              <span className="ax-chart__tip-val">{s.data[hover].toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SalesRentals() {
  return (
    <ChartCard
      title="Sales & rentals trends"
      desc="Closed sales against rentals, compared month over month."
      right={
        <div className="ax-legend" style={{ margin: 0 }}>
          {SR_SERIES.map((s) => (
            <span key={s.key} className="ax-legend__item" style={{ cursor: "default" }}>
              <span className="ax-legend__dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      }
    >
      <GroupedBars labels={SR_MONTHS} series={SR_SERIES} />
    </ChartCard>
  );
}

function TopLocations() {
  const [scope, setScope] = useState("Cities");
  const rows = LOCATIONS[scope];
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ChartCard title="Top performing locations" desc="Listings ranked by activity across the selected geography." right={<Segmented options={["Cities", "Areas", "Projects"]} value={scope} onChange={setScope} ariaLabel="Location scope" />}>
      <ul className="rp-hbars">
        {rows.map((r, i) => (
          <li className="rp-hbar" key={r.name}>
            <span className="rp-hbar__rank">{i + 1}</span>
            <span className="rp-hbar__name">{r.name}</span>
            <span className="rp-hbar__track">
              <span className="rp-hbar__fill" style={{ width: `${(r.value / max) * 100}%`, background: i === 0 ? C.green : "var(--green-300)" }} />
            </span>
            <span className="rp-hbar__val">{r.value.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

function AgentPerformance() {
  const conversion = (a: (typeof AGENTS)[number]) => ((a.sold + a.rented) / a.viewings) * 100;
  const rows = AGENTS.map((a) => ({ ...a, conv: conversion(a) })).sort((x, y) => y.conv - x.conv);
  const topConv = rows[0].conv;
  return (
    <ChartCard title="Agent performance" desc="Conversion rate = (sold + rented) ÷ total viewings. Top performers highlighted." className="rp-card--flush">
      <div className="rp-table-wrap">
        <table className="rp-table">
          <thead>
            <tr>
              <th className="rp-th rp-th--agent">Agent</th>
              <th className="rp-th rp-th--num">Active listings</th>
              <th className="rp-th rp-th--num">Sold</th>
              <th className="rp-th rp-th--num">Rented</th>
              <th className="rp-th rp-th--num">Viewings</th>
              <th className="rp-th rp-th--conv">Conversion rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const top = a.conv === topConv;
              return (
                <tr key={a.name} className={"rp-tr" + (top ? " is-top" : "")}>
                  <td className="rp-td rp-td--agent">
                    <Avatar src={a.img} name={a.name} size="sm" verified={a.verified} />
                    <span className="rp-agent">
                      <span className="rp-agent__name">
                        {a.name}
                        {top && (
                          <span className="rp-topbadge">
                            <Icon name="star" size={12} strokeWidth={2.5} /> Top performer
                          </span>
                        )}
                      </span>
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
                        <span className="rp-conv__fill" style={{ width: `${a.conv}%`, background: top ? C.gold : C.green }} />
                      </span>
                      <span className="rp-conv__val">{a.conv.toFixed(1)}%</span>
                    </span>
                  </td>
                </tr>
              );
            })}
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

function MemberActivity() {
  return (
    <ChartCard title="Member activity" desc="Engagement signals trending across the selected period." className="rp-card--flush">
      <div className="rp-minis">
        {MEMBER_TRENDS.map((m) => (
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
  const [show, setShow] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 320);
    }, 3600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={"rp-toast" + (show ? " is-in" : "")}>
      <span className="rp-toast__icon">
        <Icon name={toast.kind === "Excel" ? "sheet" : "file-text"} size={18} />
      </span>
      <div className="rp-toast__body">
        <p className="rp-toast__title">Preparing {toast.kind} export</p>
        <p className="rp-toast__msg">Your report for “{toast.rangeLabel}” is being generated.</p>
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
  const [range, setRange] = useState("30d");
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const onExport = (kind: string) => {
    const rangeLabel = (DATE_RANGES.find((d) => d.id === range) || DATE_RANGES[1]).label;
    setToasts((ts) => [...ts, { id: Date.now(), kind, rangeLabel }]);
  };

  const compare =
    range === "7d" ? "vs previous 7 days" : range === "90d" ? "vs previous 90 days" : range === "year" ? "vs last year" : range === "custom" ? "vs previous period" : "vs previous 30 days";

  return (
    <>
      <div className="rp-head">
        <div className="rp-head__intro">
          <h1 className="rp-head__title">Reports</h1>
          <p className="rp-head__sub">Track business performance, property activity, sales, rentals, agent performance, and member engagement.</p>
        </div>
        <div className="rp-head__tools">
          <DateRange value={range} onChange={setRange} />
          <div className="rp-head__exports">
            <button type="button" className="rp-xbtn rp-xbtn--solid" onClick={() => onExport("PDF")}>
              <Icon name="file-text" size={17} /> Export PDF
            </button>
          </div>
        </div>
      </div>

      <section className="rp-kpis" aria-label="Summary metrics">
        {KPI_CARDS.map((c) => (
          <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} delta={c.delta} deltaDir={c.dir} sub={compare} />
        ))}
      </section>

      <div className="rp-stack">
        <PropertyPerformance />
        <div className="rp-split">
          <ChartCard title="Property status breakdown" desc="Share of inventory by lifecycle status.">
            <Donut />
          </ChartCard>
          <SalesRentals />
        </div>
        <TopLocations />
        <AgentPerformance />
        <MemberActivity />
      </div>

      <div className="rp-toaster">
        {toasts.map((tt) => (
          <ExportToast key={tt.id} toast={tt} onDone={() => setToasts((ts) => ts.filter((x) => x.id !== tt.id))} />
        ))}
      </div>
    </>
  );
}
