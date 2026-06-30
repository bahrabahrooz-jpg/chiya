const { useState, useEffect, useRef, useCallback } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge } = DS;

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
      { id: "admins", label: "Admins", icon: "shield-check" },
      { id: "viewings", label: "Viewings", icon: "calendar-check" },
      { id: "locations", label: "Locations", icon: "map-pin" },
    ],
  },
  {
    label: "Platform",
    items: [
      { id: "reports", label: "Reports", icon: "chart-column", disabled: true, tag: "Soon" },
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

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };

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

function Sidebar({ collapsed, drawerOpen, active, onSelect, onToggleCollapse, onLogout, onOpenSettings }) {
  const cls = [
    "ax-sidebar",
    collapsed ? "is-collapsed" : "",
    drawerOpen ? "is-drawer-open" : "",
  ].filter(Boolean).join(" ");

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
    </aside>
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
function Topbar({ title, openMenu, setOpenMenu, lang, setLang, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>

      <div className="ax-tb-titlewrap">
        <span className="ax-tb-title">{title}</span>
      </div>

      <div className="ax-tb-search">
        <span className="ax-tb-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>

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

function App() {
  const [collapsed, setCollapsed] = useState(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState(() => localStorage.getItem("chiya.active") || "dashboard");
  const [openMenu, setOpenMenu] = useState(null);
  const [lang, setLang] = useState(() => localStorage.getItem("chiya.lang") || "EN");
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
  useEffect(() => { localStorage.setItem("chiya.lang", lang); }, [lang]);

  // close menus on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setOpenMenu(null); setDrawerOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = useCallback((id) => {
    setActive(id);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
  }, []);

  const title = (NAV_FLAT.find((n) => n.id === active) || NAV_FLAT[0]).label;

  return (
    <div className="ax-app">
      <Sidebar
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        active={active}
        onSelect={handleSelect}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onLogout={() => {}}
        onOpenSettings={() => handleSelect("settings")}
      />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        <Topbar
          title={title}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          lang={lang}
          setLang={setLang}
          onHamburger={() => setDrawerOpen(true)}
        />
        <main className="ax-content">
          <EmptyState onOpenDashboard={() => handleSelect("dashboard")} />
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
