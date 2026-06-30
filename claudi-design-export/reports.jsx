/* ==================================================================
   CHIYA ESTATE — ADMIN · REPORTS
   Advanced analytics center. Composes against the approved admin
   shell (window.Sidebar / Topbar) and the Chiya design system.
================================================================== */
const DSr = window.ChiyaEstateDesignSystem_686f57;
const { Icon: RIcon, Button: RButton, Avatar: RAvatar, Badge: RBadge, StatCard: RStatCard } = DSr;

/* pull shared shell + helpers from window (separate Babel scope) */
const { Sidebar, Topbar, useElementWidth, niceNum, smoothPath, categoryFor,
        NAV_FLAT, PAGE_MAP, LAYOUTS } = window;

/* ------------------------------------------------------------------
   PALETTE (brand-faithful series colors)
------------------------------------------------------------------ */
const C = {
  green: "var(--green-700)",
  greenLt: "var(--green-300)",
  gold: "var(--gold-500)",
  info: "var(--info-600)",
  amber: "var(--warning-500)",
  gray: "var(--gray-400)",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ------------------------------------------------------------------
   DATE RANGE
------------------------------------------------------------------ */
const DATE_RANGES = [
  { id: "7d",     label: "Last 7 days" },
  { id: "30d",    label: "Last 30 days" },
  { id: "90d",    label: "Last 90 days" },
  { id: "year",   label: "This year" },
  { id: "custom", label: "Custom range", custom: true },
];

/* ------------------------------------------------------------------
   KPI SUMMARY (6 cards)
------------------------------------------------------------------ */
const KPI_CARDS = [
  { key: "props",    label: "Total properties",   icon: "building-2",     tone: "brand",   value: "1,284", delta: "+5.2%",  dir: "up" },
  { key: "sold",     label: "Properties sold",    icon: "key",            tone: "gold",    value: "1,042", delta: "+12.0%", dir: "up" },
  { key: "rented",   label: "Properties rented",  icon: "home",           tone: "info",    value: "1,560", delta: "+8.4%",  dir: "up" },
  { key: "members",  label: "Total members",      icon: "users",          tone: "success", value: "8,640", delta: "+15.0%", dir: "up" },
  { key: "agents",   label: "Total agents",       icon: "badge-check",    tone: "brand",   value: "214",   delta: "+6.5%",  dir: "up" },
  { key: "viewings", label: "Total viewings",     icon: "calendar-check", tone: "gold",    value: "4,820", delta: "+9.3%",  dir: "up" },
];

/* ------------------------------------------------------------------
   PROPERTY PERFORMANCE — properties added by month (line)
------------------------------------------------------------------ */
const PERF_SERIES = [
  { key: "thisYear", label: "This year", color: C.green,
    data: [180,195,210,230,205,240,260,250,275,290,270,310] },
  { key: "lastYear", label: "Last year", color: C.gold,
    data: [150,160,175,190,180,205,215,210,230,245,235,260] },
];

/* ------------------------------------------------------------------
   STATUS BREAKDOWN (donut)
------------------------------------------------------------------ */
const STATUS = [
  { key: "published", label: "Published",        value: 612, color: C.green },
  { key: "sold",      label: "Sold",             value: 268, color: C.gold },
  { key: "rented",    label: "Rented",           value: 232, color: C.info },
  { key: "pending",   label: "Pending approval", value: 104, color: C.amber },
  { key: "archived",  label: "Archived",         value:  68, color: C.gray },
];

/* ------------------------------------------------------------------
   SALES & RENTALS (grouped bars by month)
------------------------------------------------------------------ */
const SR_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];
const SR_SERIES = [
  { key: "sold",   label: "Sold",   color: C.gold, data: [72,80,75,84,90,86,94] },
  { key: "rented", label: "Rented", color: C.info, data: [110,120,115,125,132,128,140] },
];

/* ------------------------------------------------------------------
   TOP LOCATIONS (horizontal bars, switchable scope)
------------------------------------------------------------------ */
const LOCATIONS = {
  Cities: [
    { name: "Erbil",         value: 842 },
    { name: "Sulaymaniyah",  value: 458 },
    { name: "Duhok",         value: 326 },
    { name: "Halabja",       value: 124 },
    { name: "Kirkuk",        value: 96 },
  ],
  Areas: [
    { name: "Ankawa",          value: 312 },
    { name: "Italian Village", value: 244 },
    { name: "Dream City",      value: 198 },
    { name: "Bakhtiari",       value: 142 },
    { name: "Iskan",           value: 88 },
  ],
  Projects: [
    { name: "Empire World",    value: 286 },
    { name: "Dream City",      value: 232 },
    { name: "Naz City",        value: 188 },
    { name: "Italian Village", value: 156 },
    { name: "Lalav City",      value: 104 },
  ],
};

/* ------------------------------------------------------------------
   AGENT PERFORMANCE (table)
------------------------------------------------------------------ */
const AGENTS = [
  { name: "Hewa Rashid",  team: "Chiya Select · Erbil", active: 22, sold: 14, rented: 13, viewings: 72,  verified: true,
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
  { name: "Lana Aziz",    team: "Chiya Select · Erbil", active: 24, sold: 12, rented: 18, viewings: 96,  verified: true,
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { name: "Rawa Jalal",   team: "Dream City Homes",     active: 27, sold: 15, rented: 16, viewings: 110, verified: true,
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { name: "Ahmed Karim",  team: "Empire Realty",        active: 31, sold: 18, rented: 14, viewings: 120, verified: true,
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { name: "Diyar Salih",  team: "Naz Properties",       active: 15, sold:  7, rented:  9, viewings: 58,  verified: false,
    img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  { name: "Sara Hama",    team: "Independent agent",    active: 19, sold:  9, rented: 11, viewings: 64,  verified: true,
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { name: "Navin Omar",   team: "Lalav Living",         active: 12, sold:  5, rented:  8, viewings: 50,  verified: false,
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=120&q=70" },
];

/* ------------------------------------------------------------------
   MEMBER ACTIVITY (mini trends)
------------------------------------------------------------------ */
const MEMBER_TRENDS = [
  { key: "new",      label: "New members",       icon: "user-plus",      tone: "success", value: "1,180", delta: "+15.0%", color: C.green,
    data: [60,68,64,75,82,78,90,96,93,100,108,116] },
  { key: "viewings", label: "Scheduled viewings",icon: "calendar-check", tone: "info",    value: "4,820", delta: "+9.3%",  color: C.info,
    data: [320,345,360,355,390,410,400,430,452,448,470,498] },
  { key: "inquiries",label: "Property inquiries", icon: "message-square", tone: "gold",    value: "2,640", delta: "+11.2%", color: C.gold,
    data: [160,175,190,185,205,220,232,228,245,252,260,278] },
  { key: "saved",    label: "Saved properties",  icon: "heart",          tone: "brand",   value: "6,210", delta: "+18.5%", color: C.greenLt,
    data: [380,410,440,460,500,540,560,590,610,640,660,702] },
];

/* ==================================================================
   PAGE HEADER  +  DATE RANGE
================================================================== */
function DateRange({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const current = DATE_RANGES.find((d) => d.id === value) || DATE_RANGES[1];
  return (
    <div className="ax-period rp-daterange">
      <button type="button" className={"ax-period__btn" + (open ? " is-open" : "")} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="ax-period__lead"><RIcon name="calendar-range" size={17} /></span>
        {current.label}
        <RIcon name="chevron-down" size={16} className="ax-period__chev" />
      </button>
      {open && (
        <React.Fragment>
          <div className="ax-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="ax-period__menu" role="listbox" aria-label="Date range">
            {DATE_RANGES.map((d) => (
              <button key={d.id} type="button" role="option" aria-selected={d.id === value}
                className={"ax-menu-item" + (d.id === value ? " is-selected" : "")}
                onClick={() => { onChange(d.id); setOpen(false); }}>
                {d.custom && <RIcon name="sliders-horizontal" size={16} />}
                {d.label}
                {d.id === value && <span className="ax-menu-item__check"><RIcon name="check" size={17} strokeWidth={2.5} /></span>}
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

function ReportsHeader({ range, setRange, onExport }) {
  return (
    <div className="rp-head">
      <div className="rp-head__intro">
        <div className="rp-head__eyebrow"><RIcon name="bar-chart-3" size={14} /> Analytics center</div>
        <h1 className="rp-head__title">Reports</h1>
        <p className="rp-head__sub">Track business performance, property activity, sales, rentals, agent performance, and member engagement.</p>
      </div>
      <div className="rp-head__tools">
        <DateRange value={range} onChange={setRange} />
        <div className="rp-head__exports">
          <button type="button" className="rp-xbtn rp-xbtn--solid" onClick={() => onExport("PDF")}>
            <RIcon name="file-text" size={17} /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==================================================================
   KPI SUMMARY
================================================================== */
function KpiSummary({ range }) {
  const compare = range === "7d" ? "vs previous 7 days"
    : range === "90d" ? "vs previous 90 days"
    : range === "year" ? "vs last year"
    : range === "custom" ? "vs previous period"
    : "vs previous 30 days";
  return (
    <section className="rp-kpis" aria-label="Summary metrics">
      {KPI_CARDS.map((c) => (
        <RStatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone}
          delta={c.delta} deltaDir={c.dir} sub={compare} />
      ))}
    </section>
  );
}

/* ==================================================================
   CHART CARD shell
================================================================== */
function ChartCard({ title, desc, icon, right, children, className }) {
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

/* segmented toggle (reuses shell .ax-seg) */
function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="ax-seg" role="tablist" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o} type="button" role="tab" aria-selected={o === value}
          className={"ax-seg__btn" + (o === value ? " is-active" : "")}
          onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

/* ==================================================================
   PROPERTY PERFORMANCE — line chart
================================================================== */
function LineChart({ labels, series }) {
  const wrapRef = React.useRef(null);
  const W = useElementWidth(wrapRef);
  const [hover, setHover] = React.useState(null);

  const n = labels.length;
  const H = W < 560 ? 250 : W < 900 ? 300 : 340;
  const PAD = { t: 18, r: 18, b: 32, l: 44 };
  const plotW = Math.max(0, W - PAD.l - PAD.r);
  const plotH = Math.max(0, H - PAD.t - PAD.b);

  const allVals = series.flatMap((s) => s.data);
  const STEPS = 4;
  const step = niceNum(Math.max(1, ...allVals) / STEPS);
  const top = step * STEPS;

  const xAt = (i) => PAD.l + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yAt = (v) => PAD.t + plotH * (1 - v / top);
  const gridYs = Array.from({ length: STEPS + 1 }, (_, k) => k * step);

  const onMove = (e) => {
    if (!W) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let i = Math.round(((e.clientX - rect.left - PAD.l) / (plotW || 1)) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };
  const tipLeft = hover != null ? xAt(hover) : 0;
  const flip = hover != null && tipLeft > W * 0.62;
  const primary = series[0];

  return (
    <div className="ax-chart" ref={wrapRef}>
      {W > 0 && (
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
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">{g.toLocaleString()}</text>
            </g>
          ))}
          {labels.map((lb, i) => (
            <text key={i} className="ax-chart__xlab" x={xAt(i)} y={H - 10} textAnchor="middle">{lb}</text>
          ))}
          {/* area under primary */}
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
          {hover != null && series.map((s) => (
            <circle key={s.key} className="ax-chart__dot" cx={xAt(hover)} cy={yAt(s.data[hover])} r={4} style={{ stroke: s.color }} />
          ))}
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

function PropertyPerformance() {
  const [visible, setVisible] = React.useState({ thisYear: true, lastYear: true });
  const toggle = (k) => setVisible((v) => {
    const next = { ...v, [k]: !v[k] };
    if (Object.values(next).every((x) => !x)) return v;
    return next;
  });
  const shown = PERF_SERIES.filter((s) => visible[s.key]);
  return (
    <ChartCard title="Property performance" desc="Properties added by month — current year against the prior year." icon="trending-up"
      right={<Legend series={PERF_SERIES} visible={visible} onToggle={toggle} />}>
      <LineChart labels={MONTHS} series={shown} />
    </ChartCard>
  );
}

function Legend({ series, visible, onToggle }) {
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

/* ==================================================================
   STATUS BREAKDOWN — donut
================================================================== */
function Donut() {
  const total = STATUS.reduce((a, s) => a + s.value, 0);
  const [active, setActive] = React.useState(null);
  const size = 200, stroke = 26, r = (size - stroke) / 2, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let acc = 0;
  const segs = STATUS.map((s) => {
    const frac = s.value / total;
    const seg = { ...s, frac, dash: frac * circ, offset: acc * circ };
    acc += frac;
    return seg;
  });
  const center = active != null ? STATUS[active] : null;

  return (
    <div className="rp-donut">
      <div className="rp-donut__chart" role="img" aria-label="Property status breakdown">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--gray-100)" strokeWidth={stroke} />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segs.map((s, i) => (
              <circle key={s.key} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color} strokeWidth={active === i ? stroke + 4 : stroke}
                strokeDasharray={`${s.dash} ${circ - s.dash}`} strokeDashoffset={-s.offset}
                strokeLinecap="butt"
                style={{ transition: "stroke-width .15s", opacity: active == null || active === i ? 1 : 0.4, cursor: "pointer" }}
                onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} />
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
          <li key={s.key} className={"rp-legrow" + (active === i ? " is-active" : "")}
            onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}>
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

/* ==================================================================
   SALES & RENTALS — grouped bars
================================================================== */
function GroupedBars({ labels, series }) {
  const wrapRef = React.useRef(null);
  const W = useElementWidth(wrapRef);
  const [hover, setHover] = React.useState(null);
  const n = labels.length;
  const H = 300;
  const PAD = { t: 16, r: 8, b: 32, l: 40 };
  const plotW = Math.max(0, W - PAD.l - PAD.r);
  const plotH = Math.max(0, H - PAD.t - PAD.b);
  const STEPS = 4;
  const step = niceNum(Math.max(1, ...series.flatMap((s) => s.data)) / STEPS);
  const top = step * STEPS;
  const yAt = (v) => PAD.t + plotH * (1 - v / top);
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
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">{g.toLocaleString()}</text>
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
                  return <rect key={s.key} x={x} y={y} width={barW} height={PAD.t + plotH - y} rx={3} fill={s.color}
                    style={{ opacity: hover == null || hover === i ? 1 : 0.55, transition: "opacity .15s" }} />;
                })}
                <text className="ax-chart__xlab" x={gx} y={H - 10} textAnchor="middle">{lb}</text>
              </g>
            );
          })}
        </svg>
      )}
      {hover != null && W > 0 && (
        <div className="ax-chart__tip" style={{
          left: PAD.l + groupW * hover + groupW / 2, top: PAD.t + 2,
          transform: `translate(${(PAD.l + groupW * hover + groupW / 2) > W * 0.62 ? "calc(-100% - 14px)" : "14px"}, 0)` }}>
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
    <ChartCard title="Sales & rentals trends" desc="Closed sales against rentals, compared month over month." icon="bar-chart-3"
      right={
        <div className="ax-legend" style={{ margin: 0 }}>
          {SR_SERIES.map((s) => (
            <span key={s.key} className="ax-legend__item" style={{ cursor: "default" }}>
              <span className="ax-legend__dot" style={{ background: s.color }} />{s.label}
            </span>
          ))}
        </div>
      }>
      <GroupedBars labels={SR_MONTHS} series={SR_SERIES} />
    </ChartCard>
  );
}

/* ==================================================================
   TOP LOCATIONS — horizontal bars
================================================================== */
function TopLocations() {
  const [scope, setScope] = React.useState("Cities");
  const rows = LOCATIONS[scope];
  const max = Math.max(...rows.map((r) => r.value));
  return (
    <ChartCard title="Top performing locations" desc="Listings ranked by activity across the selected geography." icon="map-pin"
      right={<Segmented options={["Cities", "Areas", "Projects"]} value={scope} onChange={setScope} ariaLabel="Location scope" />}>
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

/* ==================================================================
   AGENT PERFORMANCE — table
================================================================== */
function conversion(a) { return ((a.sold + a.rented) / a.viewings) * 100; }

function AgentPerformance() {
  const rows = AGENTS
    .map((a) => ({ ...a, conv: conversion(a) }))
    .sort((x, y) => y.conv - x.conv);
  const topConv = rows[0].conv;

  return (
    <ChartCard title="Agent performance" desc="Conversion rate = (sold + rented) ÷ total viewings. Top performers highlighted." icon="users" className="rp-card--flush">
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
            {rows.map((a, i) => {
              const top = a.conv === topConv;
              return (
                <tr key={a.name} className={"rp-tr" + (top ? " is-top" : "")}>
                  <td className="rp-td rp-td--agent">
                    <RAvatar src={a.img} name={a.name} size="sm" verified={a.verified} />
                    <span className="rp-agent">
                      <span className="rp-agent__name">
                        {a.name}
                        {top && <span className="rp-topbadge"><RIcon name="star" size={12} strokeWidth={2.5} /> Top performer</span>}
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
                      <span className="rp-conv__track"><span className="rp-conv__fill" style={{ width: `${a.conv}%`, background: top ? C.gold : C.green }} /></span>
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

/* ==================================================================
   MEMBER ACTIVITY — mini trend cards
================================================================== */
function MiniTrend({ data, color }) {
  const wrapRef = React.useRef(null);
  const W = useElementWidth(wrapRef);
  const H = 64;
  const min = Math.min(...data), max = Math.max(...data);
  const n = data.length;
  const xAt = (i) => (n <= 1 ? W / 2 : (W * i) / (n - 1));
  const yAt = (v) => 6 + (H - 12) * (1 - (v - min) / (max - min || 1));
  const gid = "mt-" + React.useId().replace(/[:]/g, "");
  return (
    <div className="rp-mini__spark" ref={wrapRef}>
      {W > 0 && (() => {
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
    <ChartCard title="Member activity" desc="Engagement signals trending across the selected period." icon="activity" className="rp-card--flush">
      <div className="rp-minis">
        {MEMBER_TRENDS.map((m) => (
          <div className="rp-mini" key={m.key}>
            <div className="rp-mini__top">
              <span className={"ax-chip ax-chip--sm ax-chip--" + m.tone}><RIcon name={m.icon} size={17} /></span>
              <span className="rp-mini__delta"><RIcon name="trending-up" size={14} />{m.delta}</span>
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

/* ==================================================================
   EXPORT TOAST
================================================================== */
function Toast({ toast, onDone }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    requestAnimationFrame(() => setShow(true));
    const t = setTimeout(() => { setShow(false); setTimeout(onDone, 320); }, 3600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={"rp-toast" + (show ? " is-in" : "")}>
      <span className="rp-toast__icon"><RIcon name={toast.kind === "Excel" ? "sheet" : "file-text"} size={18} /></span>
      <div className="rp-toast__body">
        <p className="rp-toast__title">Preparing {toast.kind} export</p>
        <p className="rp-toast__msg">Your report for “{toast.rangeLabel}” is being generated.</p>
      </div>
      <button type="button" className="rp-toast__close" onClick={() => { setShow(false); setTimeout(onDone, 320); }}><RIcon name="x" size={16} /></button>
    </div>
  );
}

/* ==================================================================
   APP
================================================================== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "B"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const layout = t.layout === "C" ? "C" : "B";
  const showTopbar = layout !== "C";

  const [collapsed, setCollapsed] = React.useState(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [active, setActive] = React.useState("reports");
  const [openMenu, setOpenMenu] = React.useState(null);
  const [range, setRange] = React.useState("30d");
  const [toasts, setToasts] = React.useState([]);
  const catRef = React.useRef(categoryFor(window.innerWidth));

  React.useEffect(() => {
    const onResize = () => {
      const cat = categoryFor(window.innerWidth);
      if (cat !== catRef.current) {
        catRef.current = cat;
        if (cat === "tablet") setCollapsed(true);
        if (cat !== "mobile") setDrawerOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  React.useEffect(() => { setOpenMenu(null); }, [layout]);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setOpenMenu(null); setDrawerOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = React.useCallback((id) => {
    if (PAGE_MAP[id]) { window.location.href = PAGE_MAP[id]; return; }
    setActive(id);
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
  }, []);

  const onExport = (kind) => {
    const rangeLabel = (DATE_RANGES.find((d) => d.id === range) || DATE_RANGES[1]).label;
    const id = Date.now();
    setToasts((ts) => [...ts, { id, kind, rangeLabel }]);
  };
  const title = (NAV_FLAT.find((n) => n.id === active) || NAV_FLAT[0]).label;

  return (
    <div className="ax-app" data-layout={layout}>
      <Sidebar
        layout={layout} collapsed={collapsed} drawerOpen={drawerOpen} active={active}
        onSelect={handleSelect} onToggleCollapse={() => setCollapsed((c) => !c)}
        openMenu={openMenu} setOpenMenu={setOpenMenu} onLogout={() => setOpenMenu(null)}
      />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        {showTopbar && (
          <Topbar layout={layout} title={title} openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        )}
        {!showTopbar && (
          <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <RIcon name="menu" size={22} />
          </button>
        )}
        <main className="ax-content" data-screen-label="Admin · Reports">
          <ReportsHeader range={range} setRange={setRange} onExport={onExport} />
          <KpiSummary range={range} />
          <div className="rp-stack">
            <PropertyPerformance />
            <div className="rp-split">
              <Donut2 />
              <SalesRentals />
            </div>
            <TopLocations />
            <AgentPerformance />
            <MemberActivity />
          </div>
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}

      <div className="rp-toaster">
        {toasts.map((tt) => (
          <Toast key={tt.id} toast={tt} onDone={() => setToasts((ts) => ts.filter((x) => x.id !== tt.id))} />
        ))}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Shell layout" />
        <TweakRadio label="Version" value={layout} options={["B", "C"]} onChange={(v) => setTweak("layout", v)} />
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(41,38,27,.62)", padding: "1px 0 2px" }}>
          <b style={{ color: "rgba(41,38,27,.88)" }}>{LAYOUTS[layout].name}</b>
          <br />
          {LAYOUTS[layout].desc}
        </div>
      </TweaksPanel>
    </div>
  );
}

/* Status donut wrapped in a ChartCard */
function Donut2() {
  return (
    <ChartCard title="Property status breakdown" desc="Share of inventory by lifecycle status." icon="pie-chart">
      <Donut />
    </ChartCard>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
