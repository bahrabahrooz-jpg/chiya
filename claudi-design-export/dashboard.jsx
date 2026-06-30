const { useState, useEffect, useRef, useCallback } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard } = DS;

const LOGO = "assets/chiya-logomark.svg";

/* ------------------------------------------------------------------
   DATA
------------------------------------------------------------------ */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard" }],
  },
  {
    label: "Management",
    items: [
      { id: "properties", label: "Properties", icon: "building-2" },
      { id: "members", label: "Members", icon: "users" },
      { id: "agents", label: "Agents", icon: "badge-check" },
      { id: "viewings", label: "Viewings", icon: "calendar-check" },
      { id: "locations", label: "Locations", icon: "map-pin" },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "reports", label: "Reports", icon: "chart-column" },
      { id: "roles", label: "Roles & permissions", icon: "key-round" },
      { id: "settings", label: "Settings", icon: "settings" },
    ],
  },
];
const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items);

const LANGUAGES = [
  { code: "EN", label: "English", native: "English" },
  { code: "KU", label: "Kurdî", native: "Soranî · سۆرانی" },
  { code: "AR", label: "العربية", native: "Arabic" },
];

const NOTIFICATIONS = [
  { id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
  { id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
  { id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
  { id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" },
];

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate", first: "Rêbin" };

/* ------------------------------------------------------------------
   KPI DATA — values & trends per dashboard period (Section 2)
------------------------------------------------------------------ */
const KPI_PERIODS = [
  { id: "week", label: "This week", short: "Week", compare: "Compared to last week" },
  { id: "month", label: "This month", short: "Month", compare: "Compared to last month" },
  { id: "year", label: "This year", short: "Year", compare: "Compared to last year" },
];

const KPI_CARDS = [
  { key: "available", label: "Available properties", icon: "building-2", tone: "brand",
    values: { week: "1,284", month: "1,284", year: "1,284" },
    delta:  { week: "+1.8%", month: "+5.2%", year: "+14.0%" } },
  { key: "sold", label: "Properties sold", icon: "key", tone: "gold",
    values: { week: "18", month: "84", year: "1,042" },
    delta:  { week: "+6.0%", month: "+12.0%", year: "+21.0%" } },
  { key: "rented", label: "Properties rented", icon: "home", tone: "info",
    values: { week: "27", month: "132", year: "1,560" },
    delta:  { week: "+4.0%", month: "+8.0%", year: "+11.0%" } },
  { key: "members", label: "New members", icon: "users", tone: "success",
    values: { week: "21", month: "96", year: "1,180" },
    delta:  { week: "+9.0%", month: "+15.0%", year: "+18.0%" } },
];

/* ------------------------------------------------------------------
   ACTION REQUIRED + RECENT ACTIVITY (Section 3)
------------------------------------------------------------------ */
const ACTION_ITEMS = [
  { key: "properties", icon: "building-2", tone: "brand",
    title: "Pending property approvals",
    count: "18", unit: "Listings waiting review",
    desc: "New agent submissions need your approval before they go live on Chiya.",
    cta: "Review listings" },
  { key: "agents", icon: "badge-check", tone: "gold",
    title: "Pending agent verifications",
    count: "7", unit: "Applications waiting review",
    desc: "Confirm ID documents and credentials before agents can list properties.",
    cta: "Review agents" },
];

const ACTIVITY_ITEMS = [
  { id: 1, icon: "file-plus-2",   tone: "info",    time: "2 minutes ago",
    parts: [{ b: "Ahmed Karim" }, { t: " submitted a new property" }] },
  { id: 2, icon: "user-plus",     tone: "gold",    time: "1 hour ago",
    parts: [{ b: "Sara Hama" }, { t: " registered as an agent" }] },
  { id: 3, icon: "badge-check",   tone: "success", time: "Today",
    parts: [{ t: "Villa in " }, { b: "Empire World" }, { t: " was approved" }] },
  { id: 4, icon: "key",           tone: "brand",   time: "Today",
    parts: [{ b: "Marble Hill Villa" }, { t: " was marked as sold" }] },
  { id: 5, icon: "shield-check",  tone: "success", time: "Yesterday",
    parts: [{ b: "Lana Aziz" }, { t: "’s agent profile was verified" }] },
  { id: 6, icon: "calendar-check",tone: "info",    time: "Yesterday",
    parts: [{ t: "12 viewings confirmed across " }, { b: "Erbil" }] },
];

/* ------------------------------------------------------------------
   PERFORMANCE OVERVIEW (Section 4) — chart data
   Four metrics tracked across week / month / year. Values sit in a
   comparable band per period so all four lines read clearly.
------------------------------------------------------------------ */
const PERF_AXIS = {
  week:  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"],
  year:  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

const PERF_SERIES = [
  { key: "listings", label: "New listings", color: "var(--green-700)",
    data: { week: [9, 11, 8, 13, 15, 12, 7],
            month: [48, 55, 62, 58, 66],
            year: [180, 195, 210, 230, 205, 240, 260, 250, 275, 290, 270, 310] } },
  { key: "sold", label: "Properties sold", color: "var(--gold-500)",
    data: { week: [3, 4, 2, 5, 4, 6, 3],
            month: [18, 22, 26, 21, 24],
            year: [60, 66, 72, 80, 75, 84, 90, 86, 92, 98, 94, 104] } },
  { key: "rented", label: "Properties rented", color: "var(--info-600)",
    data: { week: [5, 6, 4, 7, 6, 8, 5],
            month: [30, 34, 38, 33, 40],
            year: [95, 102, 110, 120, 115, 125, 132, 128, 138, 145, 140, 152] } },
  { key: "members", label: "New members", color: "var(--green-300)",
    data: { week: [4, 5, 3, 6, 5, 7, 4],
            month: [22, 26, 30, 25, 29],
            year: [70, 75, 82, 88, 84, 92, 96, 93, 100, 108, 104, 116] } },
];

/* ------------------------------------------------------------------
   SECTION 5 — RECENT PROPERTIES (left) + RECENT AGENTS (right)
------------------------------------------------------------------ */
/* property status → Badge variant (per brand semantics:
   green=published/for-sale, amber=pending, red=sold, blue=rented) */
const PROP_STATUS = {
  "Pending Approval": { variant: "warning", dot: true },
  "Published":        { variant: "success", dot: true },
  "Sold":             { variant: "error",   dot: true },
  "Rented":           { variant: "info",    dot: true },
};

const RECENT_PROPERTIES = [
  { id: 1, title: "Olive Grove Estate", location: "Ankawa, Erbil", agent: "Lana Aziz",
    status: "Pending Approval",
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=200&q=70" },
  { id: 2, title: "Marble Hill Villa", location: "Empire World, Erbil", agent: "Ahmed Karim",
    status: "Published",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=200&q=70" },
  { id: 3, title: "Cedar Court Residence", location: "Italian Village, Erbil", agent: "Sara Hama",
    status: "Sold",
    img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=200&q=70" },
  { id: 4, title: "Tigris View Apartment", location: "Dream City, Erbil", agent: "Rawa Jalal",
    status: "Rented",
    img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=200&q=70" },
  { id: 5, title: "Naz City Penthouse", location: "Naz City, Erbil", agent: "Diyar Salih",
    status: "Published",
    img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=200&q=70" },
];

const RECENT_AGENTS = [
  { id: 1, name: "Lana Aziz", team: "Chiya Select · Erbil", verified: false,
    joined: "Jun 12, 2026",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { id: 2, name: "Ahmed Karim", team: "Empire Realty", verified: true,
    joined: "Jun 10, 2026",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { id: 3, name: "Sara Hama", team: "Independent agent", verified: true,
    joined: "Jun 8, 2026",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { id: 4, name: "Rawa Jalal", team: "Dream City Homes", verified: true,
    joined: "Jun 5, 2026",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { id: 5, name: "Diyar Salih", team: "Naz Properties", verified: false,
    joined: "Jun 3, 2026",
    img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
];

/* layout-version metadata shown in the Tweaks panel */
const LAYOUTS = {
  B: { name: "Search-first topbar", desc: "Topbar becomes a utility strip — search on the far left, notifications & profile on the right. Page title moves into the content canvas." },
  C: { name: "Sidebar-centric", desc: "No topbar. Search sits under the logo and the profile is fixed to the sidebar foot with its own menu. Page title lives in the content." },
};

/* ------------------------------------------------------------------
   SIDEBAR
------------------------------------------------------------------ */
function NavItem({ item, active, collapsed, onSelect }) {
  const cls = ["ax-nav-item", active ? "is-active" : "", item.disabled ? "is-disabled" : ""].filter(Boolean).join(" ");
  const btnRef = React.useRef(null);
  const [tip, setTip] = React.useState(null); // {top, left} when visible

  const showTip = () => {
    if (!collapsed || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setTip({ top: r.top + r.height / 2, left: r.right + 14 });
  };
  const hideTip = () => setTip(null);

  // hide if we leave collapsed mode while hovered
  React.useEffect(() => { if (!collapsed) setTip(null); }, [collapsed]);

  return (
    <button
      ref={btnRef}
      type="button"
      className={cls}
      disabled={item.disabled || undefined}
      aria-current={active ? "page" : undefined}
      onClick={() => !item.disabled && onSelect(item.id)}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
    >
      <Icon name={item.icon} size={20} />
      <span className="ax-nav-text">{item.label}</span>
      {item.tag && <span className="ax-nav-item__tag">{item.tag}</span>}
      {tip && ReactDOM.createPortal(
        <span className="ax-nav-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>
          {item.label}
        </span>,
        document.body
      )}
    </button>
  );
}

function Sidebar({ layout, collapsed, drawerOpen, active, onSelect, onToggleCollapse, openMenu, setOpenMenu, onLogout }) {
  const cls = [
    "ax-sidebar",
    collapsed ? "is-collapsed" : "",
    drawerOpen ? "is-drawer-open" : "",
  ].filter(Boolean).join(" ");

  const showSearch = layout === "C";
  const showProfile = layout === "C";

  return (
    <aside className={cls} aria-label="Primary navigation">
      {/* header */}
      <div className="ax-sb-head">
        <a className="ax-sb-logo" href="#" onClick={(e) => e.preventDefault()}>
          <img src={LOGO} alt="Chiya Estate" />
          <span className="ax-sb-logo__txt">
            <span className="ax-sb-logo__name">Chiya<span> Estate</span></span>
          </span>
        </a>
      </div>

      <button
        type="button"
        className="ax-collapse-btn"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapse}
      >
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={15} strokeWidth={2.25} />
      </button>

      {/* global search — Version C only */}
      {showSearch && (
        <div className="ax-sb-search">
          <div className="ax-sb-search__field">
            <span className="ax-sb-search__lead"><Icon name="search" size={18} /></span>
            <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
          </div>
        </div>
      )}

      {/* nav */}
      <nav className="ax-nav">
        {NAV_GROUPS.map((g) => (
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map((it) => (
              <NavItem
                key={it.id}
                item={it}
                active={active === it.id}
                collapsed={collapsed}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* profile — fixed at the foot, Version C only */}
      {showProfile && (
        <SidebarProfile
          collapsed={collapsed}
          open={openMenu === "sbprofile"}
          onToggle={() => setOpenMenu(openMenu === "sbprofile" ? null : "sbprofile")}
          onSelect={onSelect}
          onLogout={onLogout}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </aside>
  );
}

/* sidebar footer profile + upward dropdown (Version C) */
function SidebarProfile({ collapsed, open, onToggle, onSelect, onLogout, onClose }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const items = [
    { icon: "user", label: "My profile", action: onClose },
    { icon: "settings", label: "Account settings", action: () => onSelect("settings") },
    { icon: "bell", label: "Notifications", action: onClose, count: unread },
  ];
  return (
    <div className="ax-sb-foot">
      <button
        type="button"
        className={"ax-sb-profile" + (open ? " is-open" : "")}
        aria-haspopup="true"
        aria-expanded={open}
        title={collapsed ? ADMIN.name : undefined}
        onClick={onToggle}
      >
        <Avatar name={ADMIN.name} size="sm" verified />
        <span className="ax-sb-profile__meta">
          <span className="ax-sb-profile__name">{ADMIN.name}</span>
          <span className="ax-sb-profile__role">{ADMIN.role}</span>
        </span>
        <Icon name="chevron-up" size={16} className="ax-sb-profile__chev" />
      </button>

      {open && (
        <div className="ax-sb-menu" role="menu">
          <div className="ax-menu__sect">
            {items.map((it) => (
              <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={it.action}>
                <Icon name={it.icon} size={18} />
                {it.label}
                {it.count > 0 && <span className="ax-menu-item__count">{it.count}</span>}
              </button>
            ))}
          </div>
          <div className="ax-menu__sect">
            <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
              <Icon name="log-out" size={18} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   TOPBAR DROPDOWNS
------------------------------------------------------------------ */
function ProfileMenu({ onClose, onLogout }) {
  const items = [
    { icon: "user", label: "My profile" },
    { icon: "settings", label: "Account settings" },
  ];
  return (
    <div className="ax-menu ax-menu--profile" role="menu">
      <div className="ax-menu-profilecard">
        <Avatar name={ADMIN.name} size="lg" verified />
        <span className="ax-menu-profilecard__meta">
          <span className="ax-menu-profilecard__name">{ADMIN.name}</span>
          <span className="ax-menu-profilecard__mail">{ADMIN.email}</span>
          <span style={{ marginTop: 6 }}>
            <Badge variant="gold" size="sm" icon="shield-check">Super Admin</Badge>
          </span>
        </span>
      </div>
      <div className="ax-menu__sect">
        {items.map((it) => (
          <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={onClose}>
            <Icon name={it.icon} size={18} />
            {it.label}
          </button>
        ))}
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
          <Icon name="log-out" size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}

function LanguageMenu({ current, onPick }) {
  return (
    <div className="ax-menu ax-menu--lang" role="menu">
      <div className="ax-menu__head"><h4>Language</h4></div>
      <div className="ax-menu__sect">
        {LANGUAGES.map((l) => (
          <button key={l.code} type="button" className="ax-menu-item" role="menuitemradio" aria-checked={current === l.code} onClick={() => onPick(l.code)}>
            <span className="ax-flag" style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}>{l.code}</span>
            <span className="ax-menu-item__lbl">
              {l.label}
              <span className="ax-menu-item__sub">{l.native}</span>
            </span>
            {current === l.code && <span className="ax-menu-item__check"><Icon name="check" size={17} strokeWidth={2.5} /></span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotifMenu({ onClose }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <div className="ax-menu ax-menu--notif" role="menu">
      <div className="ax-menu__head">
        <h4>Notifications</h4>
        {unread > 0 && <Badge variant="brand" size="sm">{unread} new</Badge>}
      </div>
      <div className="ax-notif-list">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className={"ax-notif" + (n.unread ? " is-unread" : "")} onClick={onClose}>
            <span className={"ax-notif__ic ax-notif__ic--" + n.kind}><Icon name={n.icon} size={18} /></span>
            <div className="ax-notif__body">
              <p className="ax-notif__title">{n.title}</p>
              <p className="ax-notif__desc">{n.desc}</p>
              <div className="ax-notif__time">{n.time}</div>
            </div>
            {n.unread && <span className="ax-notif__udot" />}
          </div>
        ))}
      </div>
      <div className="ax-menu__foot">
        <Button hierarchy="secondary" size="sm" onClick={onClose}>Mark all as read</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   TOPBAR
------------------------------------------------------------------ */
function Topbar({ layout, title, openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  const searchFirst = layout === "B";
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>

      {/* Version A keeps the page title in the topbar */}
      {layout === "A" && (
        <div className="ax-tb-titlewrap">
          <span className="ax-tb-title">{title}</span>
        </div>
      )}

      {/* search — far left in Version B (where the title used to sit) */}
      <div className={"ax-tb-search" + (searchFirst ? " ax-tb-search--lead" : "")}>
        <span className="ax-tb-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>

      {/* Version B: spacer pushes utilities to the far right */}
      {searchFirst && <div className="ax-tb-spacer" />}

      <div className="ax-tb-actions">
        {/* notifications */}
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-btn" + (openMenu === "notif" ? " is-open" : "")} aria-label="Notifications" aria-haspopup="true" aria-expanded={openMenu === "notif"} onClick={() => toggle("notif")}>
            <Icon name="bell" size={20} />
            <span className="ax-tb-dot" />
          </button>
          {openMenu === "notif" && <NotifMenu onClose={() => setOpenMenu(null)} />}
        </div>

        <div className="ax-tb-divider" />

        {/* profile */}
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-profile" + (openMenu === "profile" ? " is-open" : "")} aria-haspopup="true" aria-expanded={openMenu === "profile"} onClick={() => toggle("profile")}>
            <Avatar name={ADMIN.name} size="sm" verified />
            <span className="ax-tb-profile__meta">
              <span className="ax-tb-profile__name">{ADMIN.name}</span>
              <span className="ax-tb-profile__role">{ADMIN.role}</span>
            </span>
            <Icon name="chevron-down" size={16} />
          </button>
          {openMenu === "profile" && <ProfileMenu onClose={() => setOpenMenu(null)} onLogout={() => setOpenMenu(null)} />}
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------
   PAGE HEADER  (rendered inside the content canvas for Versions B & C)
------------------------------------------------------------------ */
function PageHeader({ title }) {
  return (
    <div className="ax-page-head">
      <h1 className="ax-page-head__title">{title}</h1>
    </div>
  );
}

/* ------------------------------------------------------------------
   DASHBOARD — WELCOME SECTION (Section 1)
------------------------------------------------------------------ */
function WelcomeHeader() {
  return (
    <header className="ax-welcome">
      <div className="ax-welcome__intro">
        <h1 className="ax-welcome__greeting">
          Hello, {ADMIN.first}<span className="ax-welcome__wave" role="img" aria-label="waving hand">👋</span>
        </h1>
        <p className="ax-welcome__sub">
          Welcome back. Here’s what’s happening across Chiya Estate today.
        </p>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------
   DASHBOARD — KPI SECTION (Section 2)
------------------------------------------------------------------ */
function PeriodSelector({ period, onChange }) {
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
        <span className="ax-period__lead"><Icon name="calendar-range" size={17} /></span>
        {current.label}
        <Icon name="chevron-down" size={16} className="ax-period__chev" />
      </button>
      {open && (
        <React.Fragment>
          <div className="ax-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="ax-period__menu" role="listbox" aria-label="Dashboard period">
            {KPI_PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={p.id === period}
                className={"ax-menu-item" + (p.id === period ? " is-selected" : "")}
                onClick={() => { onChange(p.id); setOpen(false); }}
              >
                {p.label}
                {p.id === period && <span className="ax-menu-item__check"><Icon name="check" size={17} strokeWidth={2.5} /></span>}
              </button>
            ))}
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* alternative: premium segmented control (sliding brand-green pill) */
function SegmentedPeriod({ period, onChange }) {
  const idx = Math.max(0, KPI_PERIODS.findIndex((p) => p.id === period));
  return (
    <div className="ax-seg" role="tablist" aria-label="Dashboard period">
      <span className="ax-seg__thumb" style={{ transform: `translateX(calc(${idx} * 100%))` }} />
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

function KpiSection({ selector }) {
  const [period, setPeriod] = useState("month");
  const meta = KPI_PERIODS.find((p) => p.id === period) || KPI_PERIODS[1];
  return (
    <section className="ax-section" aria-label="Key performance indicators">
      <div className="ax-section__head">
        <div className="ax-section__heading">
          <h2 className="ax-section__title">KPI overview</h2>
        </div>
        {selector === "Segmented"
          ? <SegmentedPeriod period={period} onChange={setPeriod} />
          : <PeriodSelector period={period} onChange={setPeriod} />}
      </div>
      <div className="ax-kpi-grid">
        {KPI_CARDS.map((c) => (
          <StatCard
            key={c.key}
            label={c.label}
            value={c.values[period]}
            icon={c.icon}
            tone={c.tone}
            delta={c.delta[period]}
            deltaDir="up"
            sub={meta.compare}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   SECTION 3 — ACTION REQUIRED (left) + RECENT ACTIVITY (right)
------------------------------------------------------------------ */
function ActionCard({ item }) {
  return (
    <div className="ax-action">
      <div className="ax-action__head">
        <span className={"ax-chip ax-chip--" + item.tone}><Icon name={item.icon} size={21} /></span>
        <h3 className="ax-action__title">{item.title}</h3>
      </div>
      <div className="ax-action__count">
        <span className="ax-action__num">{item.count}</span>
        <span className="ax-action__unit">{item.unit}</span>
      </div>
      <p className="ax-action__desc">{item.desc}</p>
      <div className="ax-action__foot">
        <Button hierarchy="primary" size="md" iconTrailing="arrow-right">{item.cta}</Button>
      </div>
    </div>
  );
}

function ActionRequired() {
  return (
    <div className="ax-col">
      <div className="ax-section__head">
        <div className="ax-section__heading"><h2 className="ax-section__title">Action required</h2></div>
      </div>
      <div className="ax-actions">
        {ACTION_ITEMS.map((it) => <ActionCard key={it.key} item={it} />)}
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="ax-col">
      <div className="ax-section__head">
        <div className="ax-section__heading"><h2 className="ax-section__title">Recent activity</h2></div>
        <a className="ax-viewall" href="#" onClick={(e) => e.preventDefault()}>
          View all <Icon name="arrow-right" size={15} />
        </a>
      </div>
      <div className="ax-feed">
        {ACTIVITY_ITEMS.map((a) => (
          <div className="ax-feed__item" key={a.id}>
            <span className={"ax-chip ax-chip--sm ax-chip--" + a.tone}><Icon name={a.icon} size={17} /></span>
            <div className="ax-feed__body">
              <p className="ax-feed__text">
                {a.parts.map((p, i) => p.b
                  ? <b key={i}>{p.b}</b>
                  : <React.Fragment key={i}>{p.t}</React.Fragment>)}
              </p>
              <span className="ax-feed__time">{a.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpsSection() {
  return (
    <section className="ax-section ax-grid2" aria-label="Action required and recent activity">
      <ActionRequired />
      <RecentActivity />
    </section>
  );
}

/* ------------------------------------------------------------------
   SECTION 4 — PERFORMANCE OVERVIEW (multi-series line chart)
------------------------------------------------------------------ */
/* element-width tracker for a responsive, crisp (non-scaled) SVG */
function useElementWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setW(e.contentRect.width);
    });
    ro.observe(ref.current);
    setW(ref.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);
  return w;
}

/* round a value up to a clean 1 / 2 / 5 × 10^n step */
function niceNum(v) {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/* smooth (Catmull-Rom → cubic-bezier) path through points */
function smoothPath(pts) {
  if (!pts.length) return "";
  if (pts.length < 2) return `M${pts[0].x},${pts[0].y}`;
  const t = 0.18;
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    const c1x = p1.x + (p2.x - p0.x) * t, c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t, c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x},${p2.y}`;
  }
  return d;
}

function PerformanceChart({ period, visible }) {
  const wrapRef = useRef(null);
  const W = useElementWidth(wrapRef);
  const [hover, setHover] = useState(null);

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

  const xAt = (i) => PAD.l + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const yAt = (v) => PAD.t + plotH * (1 - v / top);

  // x-axis label thinning on narrow widths
  const maxLabels = Math.max(2, Math.floor(plotW / 48));
  const lstep = Math.ceil(n / maxLabels);

  const onMove = (e) => {
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
          {/* horizontal gridlines + y labels */}
          {gridYs.map((g, k) => (
            <g key={k}>
              <line className={"ax-grid-line" + (k === 0 ? " ax-grid-base" : "")}
                x1={PAD.l} x2={W - PAD.r} y1={yAt(g)} y2={yAt(g)} />
              <text className="ax-chart__ylab" x={PAD.l - 10} y={yAt(g) + 4} textAnchor="end">
                {g.toLocaleString()}
              </text>
            </g>
          ))}
          {/* x labels */}
          {labels.map((lb, i) => (
            (i % lstep === 0 || i === n - 1) && (
              <text key={i} className="ax-chart__xlab" x={xAt(i)} y={H - 10} textAnchor="middle">{lb}</text>
            )
          ))}
          {/* hover guide */}
          {hover != null && (
            <line className="ax-guide" x1={xAt(hover)} x2={xAt(hover)} y1={PAD.t} y2={PAD.t + plotH} />
          )}
          {/* series lines */}
          {shown.map((s) => {
            const pts = s.data[period].map((v, i) => ({ x: xAt(i), y: yAt(v) }));
            return <path key={s.key} className="ax-chart__line" d={smoothPath(pts)} style={{ stroke: s.color }} />;
          })}
          {/* hover dots */}
          {hover != null && shown.map((s) => (
            <circle key={s.key} className="ax-chart__dot" cx={xAt(hover)} cy={yAt(s.data[period][hover])} r={4}
              style={{ stroke: s.color }} />
          ))}
          {/* capture layer */}
          <rect x={PAD.l} y={PAD.t} width={plotW} height={plotH} fill="transparent"
            onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
        </svg>
      )}
      {hover != null && (
        <div className="ax-chart__tip" style={{ left: tipLeft, top: PAD.t + 2,
          transform: `translate(${flip ? "calc(-100% - 14px)" : "14px"}, 0)` }}>
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

function PerformanceSection() {
  const [period, setPeriod] = useState("month");
  const [visible, setVisible] = useState(
    () => Object.fromEntries(PERF_SERIES.map((s) => [s.key, true]))
  );
  const toggle = (key) =>
    setVisible((v) => {
      const next = { ...v, [key]: !v[key] };
      // never allow all-off — keep at least one series on
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

/* ------------------------------------------------------------------
   SECTION 5 — RECENT PROPERTIES + RECENT AGENTS
------------------------------------------------------------------ */
function SectionColumnHead({ title, onViewAll }) {
  return (
    <div className="ax-section__head">
      <div className="ax-section__heading"><h2 className="ax-section__title">{title}</h2></div>
      <a className="ax-viewall" href="#" onClick={(e) => { e.preventDefault(); onViewAll && onViewAll(); }}>
        View all <Icon name="arrow-right" size={15} />
      </a>
    </div>
  );
}

function PropertyRow({ item }) {
  const st = PROP_STATUS[item.status] || { variant: "neutral" };
  return (
    <a className="ax-row ax-row--link" href={"Admin-Property Details.html?id=" + encodeURIComponent(item.id)}>
      <img className="ax-row__thumb" src={item.img} alt="" loading="lazy" />
      <div className="ax-row__main">
        <div className="ax-row__title">{item.title}</div>
        <div className="ax-row__meta">
          <span className="ax-row__loc"><Icon name="map-pin" size={13} />{item.location}</span>
          <span className="ax-row__sep" />
          <span className="ax-row__agent"><Avatar name={item.agent} size="xs" /><b>{item.agent}</b></span>
        </div>
      </div>
      <div className="ax-row__end">
        <Badge variant={st.variant} size="sm" dot={st.dot}>{item.status}</Badge>
      </div>
    </a>
  );
}

function AgentRow({ item }) {
  return (
    <a className="ax-row ax-row--link" href={"Admin-Agent Details.html?agent=" + encodeURIComponent(item.id)}>
      <span className="ax-row__avatar"><Avatar src={item.img} name={item.name} size="lg" verified={item.verified} /></span>
      <div className="ax-row__main">
        <div className="ax-row__title">{item.name}</div>
        <div className="ax-row__meta">
          <span className="ax-row__loc">{item.team}</span>
          <span className="ax-row__sep" />
          <span className="ax-row__joined">Joined {item.joined}</span>
        </div>
      </div>
      <div className="ax-row__end">
        {item.verified
          ? <Badge variant="brand" size="sm" icon="badge-check">Verified</Badge>
          : <Badge variant="warning" size="sm" dot>Pending verification</Badge>}
      </div>
    </a>
  );
}

function RecentSection({ onNav }) {
  return (
    <section className="ax-section ax-grid2" aria-label="Recent properties and recent agents">
      <div className="ax-col">
        <SectionColumnHead title="Recent properties" onViewAll={() => onNav && onNav("properties")} />
        <div className="ax-listcard">
          {RECENT_PROPERTIES.map((p) => <PropertyRow key={p.id} item={p} />)}
        </div>
      </div>
      <div className="ax-col">
        <SectionColumnHead title="Recent agents" onViewAll={() => onNav && onNav("agents")} />
        <div className="ax-listcard">
          {RECENT_AGENTS.map((a) => <AgentRow key={a.id} item={a} />)}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------
   EMPTY STATE
------------------------------------------------------------------ */
function EmptyState({ onOpenDashboard }) {
  return (
    <div className="ax-empty">
      <div className="ax-empty__art">
        <Icon name="layout-dashboard" size={44} strokeWidth={1.5} />
        <span className="ax-empty__badge"><Icon name="arrow-right" size={20} strokeWidth={2.25} /></span>
      </div>
      <h2>Select a module to begin</h2>
      <p>Choose a section from the sidebar to manage Chiya Estate operations, users, properties, and platform settings.</p>
      <div className="ax-empty__actions">
        <Button hierarchy="primary" size="lg" iconLeading="layout-dashboard" onClick={onOpenDashboard}>Open dashboard</Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   APP
------------------------------------------------------------------ */
function categoryFor(w) {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "B",
  "kpiSelector": "Dropdown"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const layout = t.layout === "C" ? "C" : "B";
  const showTopbar = layout !== "C";
  const titleInContent = layout === "B" || layout === "C";

  const [collapsed, setCollapsed] = useState(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [openMenu, setOpenMenu] = useState(null);
  const catRef = useRef(categoryFor(window.innerWidth));

  // responsive: auto adjust on breakpoint crossing
  useEffect(() => {
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

  useEffect(() => { localStorage.setItem("chiya.active", active); }, [active]);

  // close menus when switching layout so a stale dropdown doesn't linger
  useEffect(() => { setOpenMenu(null); }, [layout]);

  // close menus on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setOpenMenu(null); setDrawerOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = useCallback((id) => {
    const PAGES = {
      dashboard:  "Admin-Dashboard page.html",
      properties: "Admin-Properties Page.html",
      members:    "Admin-Members Page.html",
      agents:     "Admin-Agents Page.html",
      viewings:   "Admin-Viewings Page.html",
      locations:  "Admin-Locations Page.html",
      reports:    "Admin-Reports Page.html",
      roles:      "Admin-Roles & permissions page.html",
    };
    const here = decodeURIComponent(window.location.pathname.split("/").pop());
    if (PAGES[id] && PAGES[id] !== here) { window.location.href = PAGES[id]; return; }
    setActive(id);
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
  }, []);

  const title = (NAV_FLAT.find((n) => n.id === active) || NAV_FLAT[0]).label;

  return (
    <div className="ax-app" data-layout={layout}>
      <Sidebar
        layout={layout}
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        active={active}
        onSelect={handleSelect}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        onLogout={() => setOpenMenu(null)}
      />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        {showTopbar && (
          <Topbar
            layout={layout}
            title={title}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onHamburger={() => setDrawerOpen(true)}
          />
        )}
        {/* Version C has no topbar — floating trigger opens the drawer on mobile */}
        {!showTopbar && (
          <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        )}
        <main className="ax-content">
          {active === "dashboard" ? (
            <React.Fragment>
              <WelcomeHeader />
              <KpiSection selector={t.kpiSelector} />
              <OpsSection />
              <PerformanceSection />
              <RecentSection onNav={handleSelect} />
            </React.Fragment>
          ) : (
            <React.Fragment>
              {titleInContent && <PageHeader title={title} />}
              <EmptyState onOpenDashboard={() => handleSelect("dashboard")} />
            </React.Fragment>
          )}
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Shell layout" />
        <TweakRadio
          label="Version"
          value={layout}
          options={["B", "C"]}
          onChange={(v) => setTweak("layout", v)}
        />
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(41,38,27,.62)", padding: "1px 0 2px" }}>
          <b style={{ color: "rgba(41,38,27,.88)" }}>{LAYOUTS[layout].name}</b>
          <br />
          {LAYOUTS[layout].desc}
        </div>

        <TweakSection label="KPI period selector" />
        <TweakRadio
          label="Style"
          value={t.kpiSelector}
          options={["Dropdown", "Segmented"]}
          onChange={(v) => setTweak("kpiSelector", v)}
        />
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(41,38,27,.62)", padding: "1px 0 2px" }}>
          <b style={{ color: "rgba(41,38,27,.88)" }}>{t.kpiSelector === "Segmented" ? "Segmented control" : "Dropdown menu"}</b>
          <br />
          {t.kpiSelector === "Segmented"
            ? "Pill-style Week / Month / Year toggle with a sliding brand-green selected state — matches the search-page view toggle."
            : "The original calendar dropdown listing each period in a menu."}
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
