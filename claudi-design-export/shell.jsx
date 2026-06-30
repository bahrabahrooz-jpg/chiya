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
  "layout": "B"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const layout = t.layout === "C" ? "C" : "B";
  const showTopbar = layout !== "C";
  const titleInContent = layout === "B" || layout === "C";

  const [collapsed, setCollapsed] = useState(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState(() => localStorage.getItem("chiya.active") || "dashboard");
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

  const PAGE_MAP = {
    dashboard:  "Admin-Dashboard page.html",
    properties: "Admin-Properties Page.html",
    agents:     "Admin-Agents Page.html",
    members:    "Admin-Members Page.html",
    viewings:   "Admin-Viewings Page.html",
    locations:  "Admin-Locations Page.html",
    reports:    "Admin-Reports Page.html",
    roles:      "Admin-Roles & permissions page.html",
  };

  const handleSelect = useCallback((id) => {
    setActive(id);
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
    if (PAGE_MAP[id] && window.location.pathname.split("/").pop() !== PAGE_MAP[id]) {
      window.location.href = PAGE_MAP[id];
    }
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
          {titleInContent && <PageHeader title={title} />}
          <EmptyState onOpenDashboard={() => handleSelect("dashboard")} />
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
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
