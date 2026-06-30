"use client";

import { useEffect, useRef, useState } from "react";
import { PERF_AXIS, PERF_SERIES } from "./data";

const PERIODS = [
  { id: "week", short: "Week" },
  { id: "month", short: "Month" },
  { id: "year", short: "Year" },
];

function SegmentedPeriod({ period, onChange }: { period: string; onChange: (id: string) => void }) {
  return (
    <div className="ax-seg" role="tablist" aria-label="Dashboard period">
      <span className="ax-seg__thumb" />
      {PERIODS.map((p) => (
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

function niceNum(v: number) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (!pts.length) return "";
  if (pts.length < 2) return `M${pts[0].x},${pts[0].y}`;
  const t = 0.18;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) * t,
      c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t,
      c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

function PerformanceChart({ period, visible }: { period: string; visible: Record<string, boolean> }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const W = useElementWidth(wrapRef);
  const [hover, setHover] = useState<number | null>(null);

  const labels = PERF_AXIS[period];
  const n = labels.length;
  const H = W < 560 ? 230 : W < 900 ? 280 : 320;
  const PAD = { t: 16, r: 18, b: 30, l: 42 };
  const plotW = Math.max(0, W - PAD.l - PAD.r);
  const plotH = Math.max(0, H - PAD.t - PAD.b);

  const shown = PERF_SERIES.filter((s) => visible[s.key]);
  const allVals = shown.flatMap((s) => s.data[period]);
  const rawMax = Math.max(1, ...allVals);
  const STEPS = 4;
  const step = niceNum(rawMax / STEPS);
  const top = step * STEPS;

  const xAt = (i: number) => PAD.l + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yAt = (v: number) => PAD.t + plotH * (1 - v / top);

  const maxLabels = Math.max(2, Math.floor(plotW / 48));
  const lstep = Math.ceil(n / maxLabels);

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    if (!W) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let i = Math.round(((mx - PAD.l) / (plotW || 1)) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    setHover(i);
  };

  const gridYs = Array.from({ length: STEPS + 1 }, (_, k) => k * step);
  const tipLeft = hover != null ? xAt(hover) : 0;
  const flip = hover != null && tipLeft > W * 0.62;

  return (
    <div className="ax-chart" ref={wrapRef}>
      {W > 0 && (
        <svg width={W} height={H} role="img" aria-label="Performance over time">
          {gridYs.map((g, k) => (
            <g key={k}>
              <line className={"ax-grid-line" + (k === 0 ? " ax-grid-base" : "")} x1={PAD.l} x2={W - PAD.r} y1={yAt(g)} y2={yAt(g)} />
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">
                {g.toLocaleString()}
              </text>
            </g>
          ))}
          {labels.map(
            (lb, i) =>
              (i % lstep === 0 || i === n - 1) && (
                <text key={i} className="ax-chart__xlab" x={xAt(i)} y={H - 10} textAnchor="middle">
                  {lb}
                </text>
              ),
          )}
          {hover != null && <line className="ax-guide" x1={xAt(hover)} x2={xAt(hover)} y1={PAD.t} y2={PAD.t + plotH} />}
          {shown.map((s) => {
            const pts = s.data[period].map((v, i) => ({ x: xAt(i), y: yAt(v) }));
            return <path key={s.key} className="ax-chart__line" d={smoothPath(pts)} style={{ stroke: s.color }} />;
          })}
          {hover != null &&
            shown.map((s) => (
              <circle key={s.key} className="ax-chart__dot" cx={xAt(hover)} cy={yAt(s.data[period][hover])} r={4} style={{ stroke: s.color }} />
            ))}
          <rect x={PAD.l} y={PAD.t} width={plotW} height={plotH} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </svg>
      )}
      {hover != null && (
        <div className="ax-chart__tip" style={{ left: tipLeft, top: PAD.t + 2, transform: `translate(${flip ? "calc(-100% - 14px)" : "14px"}, 0)` }}>
          <div className="ax-chart__tip-head">{labels[hover]}</div>
          {shown.map((s) => (
            <div className="ax-chart__tip-row" key={s.key}>
              <span className="ax-chart__tip-dot" style={{ background: s.color }} />
              <span className="ax-chart__tip-label">{s.label}</span>
              <span className="ax-chart__tip-val">{s.data[period][hover].toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PerformanceSection() {
  const [period, setPeriod] = useState("month");
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERF_SERIES.map((s) => [s.key, true])),
  );
  const toggle = (key: string) =>
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      if (Object.values(next).every((x) => !x)) return v;
      return next;
    });

  return (
    <section className="ax-section" aria-label="Performance overview">
      <div className="ax-section__head">
        <div className="ax-section__heading">
          <h2 className="ax-section__title">Performance overview</h2>
          <p className="ax-section__desc">Track listing activity, sales, rentals, and member growth over time.</p>
        </div>
        <SegmentedPeriod period={period} onChange={setPeriod} />
      </div>
      <div className="ax-chart-card">
        <div className="ax-legend" role="group" aria-label="Toggle chart metrics">
          {PERF_SERIES.map((s) => (
            <button
              key={s.key}
              type="button"
              className={"ax-legend__item" + (visible[s.key] ? "" : " is-off")}
              aria-pressed={visible[s.key]}
              onClick={() => toggle(s.key)}
            >
              <span className="ax-legend__dot" style={{ background: visible[s.key] ? s.color : "var(--gray-300)" }} />
              {s.label}
            </button>
          ))}
        </div>
        <PerformanceChart period={period} visible={visible} />
      </div>
    </section>
  );
}
