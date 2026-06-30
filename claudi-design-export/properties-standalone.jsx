const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard, Select } = DS;

const __res = window.__resources || {};
const LOGO = __res.logomark || "assets/chiya-logomark.svg";

/* ==================================================================
   SHELL DATA  (matches the approved Admin Dashboard shell)
================================================================== */
const NAV_GROUPS = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard" }] },
  { label: "Management", items: [
    { id: "properties", label: "Properties", icon: "building-2" },
    { id: "members", label: "Members", icon: "users" },
    { id: "agents", label: "Agents", icon: "badge-check" },
    { id: "viewings", label: "Viewings", icon: "calendar-check" },
    { id: "locations", label: "Locations", icon: "map-pin" },
  ] },
  { label: "Platform", items: [
    { id: "reports", label: "Reports", icon: "chart-column", disabled: true, tag: "Soon" },
    { id: "roles", label: "Roles & permissions", icon: "key-round" },
    { id: "settings", label: "Settings", icon: "settings" },
  ] },
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

const LAYOUTS = {
  B: { name: "Search-first topbar", desc: "Topbar becomes a utility strip — search on the far left, notifications & profile on the right. Page title moves into the content canvas." },
  C: { name: "Sidebar-centric", desc: "No topbar. Search sits under the logo and the profile is fixed to the sidebar foot with its own menu. Page title lives in the content." },
};

/* ==================================================================
   PROPERTIES DATA
================================================================== */
const KPI_CARDS = [
  { key: "total",     label: "Total properties",     icon: "building-2",     tone: "brand",   value: "1,486", sub: "All listings on Chiya" },
  { key: "available", label: "Available properties", icon: "home",           tone: "success", value: "942",   sub: "Published & on market" },
  { key: "pending",   label: "Pending approval",     icon: "clock",          tone: "gold",    value: "18",    sub: "Awaiting your review" },
  { key: "sold",      label: "Sold properties",      icon: "key",            tone: "info",    value: "388",   sub: "Closed sales all-time" },
  { key: "rented",    label: "Rented properties",    icon: "key-round",      tone: "brand",   value: "156",   sub: "Active rental contracts" },
];

/* status → Badge config (soft, premium tones per brand semantics) */
const STATUS_META = {
  "Draft":            { variant: "neutral", icon: "pencil-line" },
  "Pending Approval": { variant: "warning", dot: true },
  "Published":        { variant: "success", dot: true },
  "Sold":             { variant: "error",   dot: true },
  "Rented":           { variant: "info",    dot: true },
  "Archived":         { variant: "neutral", icon: "archive" },
};

const TYPE_OPTIONS = ["Villa", "Apartment", "Penthouse", "Townhouse", "Office", "Land"];
const CITY_OPTIONS = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk"];

function fmtUSD(n) { return "$" + n.toLocaleString("en-US"); }

const PROPERTIES = [
  { id: "CH-2041", title: "Olive Grove Estate", area: "Ankawa", city: "Erbil", type: "Villa",
    img: __res.propOliveGrove || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Karwan Mahmoud", contact: "+964 750 118 4420", icon: "phone" },
    agent: { name: "Lana Aziz", verified: false, img: __res.agentLana || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Pending Approval", price: 1200000, date: "Jun 12, 2026", daysAgo: 2 },

  { id: "CH-2038", title: "Marble Hill Villa", area: "Empire World", city: "Erbil", type: "Villa",
    img: __res.propMarbleHill || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Sirwan Tofiq", contact: "sirwan.t@gmail.com", icon: "mail" },
    agent: { name: "Ahmed Karim", verified: true, img: __res.agentAhmed || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Published", price: 620000, date: "Jun 9, 2026", daysAgo: 5 },

  { id: "CH-2035", title: "Cedar Court Residence", area: "Italian Village", city: "Erbil", type: "Townhouse",
    img: __res.propCedarCourt || "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Dashne Salar", contact: "+964 770 552 1190", icon: "phone" },
    agent: { name: "Sara Hama", verified: true, img: __res.agentSara || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Sold", price: 845000, date: "Jun 6, 2026", daysAgo: 8 },

  { id: "CH-2031", title: "Tigris View Apartment", area: "Dream City", city: "Erbil", type: "Apartment",
    img: __res.propTigrisView || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Awat Rashid", contact: "+964 751 904 7782", icon: "phone" },
    agent: { name: "Rawa Jalal", verified: true, img: __res.agentRawa || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
    listing: "rent", status: "Rented", price: 1800, per: "/mo", date: "Jun 4, 2026", daysAgo: 10 },

  { id: "CH-2029", title: "Naz City Penthouse", area: "Naz City", city: "Erbil", type: "Penthouse",
    img: __res.propNazPenthouse || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Hewa Botan", contact: "hewa.botan@outlook.com", icon: "mail" },
    agent: { name: "Diyar Salih", verified: false, img: __res.agentDiyar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Published", price: 980000, date: "Jun 2, 2026", daysAgo: 12 },

  { id: "CH-2026", title: "Goizha Mountain House", area: "Goizha", city: "Sulaymaniyah", type: "Villa",
    img: __res.propGoizha || "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Nyan Faraj", contact: "+964 773 220 5567", icon: "phone" },
    agent: null,
    listing: "sale", status: "Draft", price: 540000, date: "Jun 1, 2026", daysAgo: 13 },

  { id: "CH-2022", title: "Park View Loft", area: "Salim Street", city: "Sulaymaniyah", type: "Apartment",
    img: __res.propParkView || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Shilan Aram", contact: "shilan.aram@gmail.com", icon: "mail" },
    agent: { name: "Hawre Ako", verified: true, img: __res.agentHawre || "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
    listing: "rent", status: "Published", price: 1100, per: "/mo", date: "May 28, 2026", daysAgo: 17 },

  { id: "CH-2018", title: "Family Mall Office Suite", area: "100m Road", city: "Erbil", type: "Office",
    img: __res.propFamilyMall || "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Rebwar Group", contact: "+964 750 600 1234", icon: "phone" },
    agent: { name: "Ahmed Karim", verified: true, img: __res.agentAhmed || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
    listing: "rent", status: "Pending Approval", price: 3200, per: "/mo", date: "May 26, 2026", daysAgo: 19 },

  { id: "CH-2014", title: "Zagros Garden Townhouse", area: "Masif", city: "Duhok", type: "Townhouse",
    img: __res.propZagros || "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Berivan Khalid", contact: "berivan.k@gmail.com", icon: "mail" },
    agent: { name: "Sara Hama", verified: true, img: __res.agentSara || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Published", price: 410000, date: "May 22, 2026", daysAgo: 23 },

  { id: "CH-2009", title: "Citadel Heights Land", area: "Qalat", city: "Erbil", type: "Land",
    img: __res.propCitadel || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Aland Property Co.", contact: "+964 751 778 9012", icon: "phone" },
    agent: { name: "Diyar Salih", verified: false, img: __res.agentDiyar || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Archived", price: 290000, date: "May 18, 2026", daysAgo: 27 },

  { id: "CH-2004", title: "Lakeside Apartment", area: "Dukan", city: "Sulaymaniyah", type: "Apartment",
    img: __res.propLakeside || "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=240&q=70",
    owner: { name: "Tara Jamal", contact: "tara.jamal@outlook.com", icon: "mail" },
    agent: { name: "Rawa Jalal", verified: true, img: __res.agentRawa || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
    listing: "sale", status: "Sold", price: 365000, date: "May 14, 2026", daysAgo: 31 },
];

/* ==================================================================
   SIDEBAR
================================================================== */
function NavItem({ item, active, collapsed, onSelect }) {
  const cls = ["ax-nav-item", active ? "is-active" : "", item.disabled ? "is-disabled" : ""].filter(Boolean).join(" ");
  const btnRef = useRef(null);
  const [tip, setTip] = useState(null);
  const showTip = () => {
    if (!collapsed || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setTip({ top: r.top + r.height / 2, left: r.right + 14 });
  };
  const hideTip = () => setTip(null);
  useEffect(() => { if (!collapsed) setTip(null); }, [collapsed]);
  return (
    <button ref={btnRef} type="button" className={cls} disabled={item.disabled || undefined}
      aria-current={active ? "page" : undefined}
      onClick={() => !item.disabled && onSelect(item.id)}
      onMouseEnter={showTip} onMouseLeave={hideTip} onFocus={showTip} onBlur={hideTip}>
      <Icon name={item.icon} size={20} />
      <span className="ax-nav-text">{item.label}</span>
      {item.tag && <span className="ax-nav-item__tag">{item.tag}</span>}
      {tip && ReactDOM.createPortal(
        <span className="ax-nav-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>{item.label}</span>,
        document.body)}
    </button>
  );
}

function Sidebar({ layout, collapsed, drawerOpen, active, onSelect, onToggleCollapse, openMenu, setOpenMenu, onLogout }) {
  const cls = ["ax-sidebar", collapsed ? "is-collapsed" : "", drawerOpen ? "is-drawer-open" : ""].filter(Boolean).join(" ");
  const showSearch = layout === "C";
  const showProfile = layout === "C";
  return (
    <aside className={cls} aria-label="Primary navigation">
      <div className="ax-sb-head">
        <a className="ax-sb-logo" href="#" onClick={(e) => e.preventDefault()}>
          <img src={LOGO} alt="Chiya Estate" />
          <span className="ax-sb-logo__txt"><span className="ax-sb-logo__name">Chiya<span> Estate</span></span></span>
        </a>
      </div>
      <button type="button" className="ax-collapse-btn"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleCollapse}>
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={15} strokeWidth={2.25} />
      </button>
      {showSearch && (
        <div className="ax-sb-search">
          <div className="ax-sb-search__field">
            <span className="ax-sb-search__lead"><Icon name="search" size={18} /></span>
            <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
          </div>
        </div>
      )}
      <nav className="ax-nav">
        {NAV_GROUPS.map((g) => (
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map((it) => (
              <NavItem key={it.id} item={it} active={active === it.id} collapsed={collapsed} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </nav>
      {showProfile && (
        <SidebarProfile collapsed={collapsed} open={openMenu === "sbprofile"}
          onToggle={() => setOpenMenu(openMenu === "sbprofile" ? null : "sbprofile")}
          onSelect={onSelect} onLogout={onLogout} onClose={() => setOpenMenu(null)} />
      )}
    </aside>
  );
}

function SidebarProfile({ collapsed, open, onToggle, onSelect, onLogout, onClose }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const items = [
    { icon: "user", label: "My profile", action: onClose },
    { icon: "settings", label: "Account settings", action: () => onSelect("settings") },
    { icon: "bell", label: "Notifications", action: onClose, count: unread },
  ];
  return (
    <div className="ax-sb-foot">
      <button type="button" className={"ax-sb-profile" + (open ? " is-open" : "")} aria-haspopup="true" aria-expanded={open}
        title={collapsed ? ADMIN.name : undefined} onClick={onToggle}>
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
                <Icon name={it.icon} size={18} />{it.label}
                {it.count > 0 && <span className="ax-menu-item__count">{it.count}</span>}
              </button>
            ))}
          </div>
          <div className="ax-menu__sect">
            <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
              <Icon name="log-out" size={18} />Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   TOPBAR + DROPDOWNS
================================================================== */
function ProfileMenu({ onClose, onLogout }) {
  const items = [{ icon: "user", label: "My profile" }, { icon: "settings", label: "Account settings" }];
  return (
    <div className="ax-menu ax-menu--profile" role="menu">
      <div className="ax-menu-profilecard">
        <Avatar name={ADMIN.name} size="lg" verified />
        <span className="ax-menu-profilecard__meta">
          <span className="ax-menu-profilecard__name">{ADMIN.name}</span>
          <span className="ax-menu-profilecard__mail">{ADMIN.email}</span>
          <span style={{ marginTop: 6 }}><Badge variant="gold" size="sm" icon="shield-check">Super Admin</Badge></span>
        </span>
      </div>
      <div className="ax-menu__sect">
        {items.map((it) => (
          <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={onClose}>
            <Icon name={it.icon} size={18} />{it.label}
          </button>
        ))}
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
          <Icon name="log-out" size={18} />Log out
        </button>
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

function Topbar({ layout, title, openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  const searchFirst = layout === "B";
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>
      {layout === "A" && (
        <div className="ax-tb-titlewrap"><span className="ax-tb-title">{title}</span></div>
      )}
      <div className={"ax-tb-search" + (searchFirst ? " ax-tb-search--lead" : "")}>
        <span className="ax-tb-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>
      {searchFirst && <div className="ax-tb-spacer" />}
      <div className="ax-tb-actions">
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-btn" + (openMenu === "notif" ? " is-open" : "")} aria-label="Notifications" aria-haspopup="true" aria-expanded={openMenu === "notif"} onClick={() => toggle("notif")}>
            <Icon name="bell" size={20} /><span className="ax-tb-dot" />
          </button>
          {openMenu === "notif" && <NotifMenu onClose={() => setOpenMenu(null)} />}
        </div>
        <div className="ax-tb-divider" />
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

/* ==================================================================
   PROPERTIES — PAGE HEADER
================================================================== */
function PropertiesHeader() {
  return (
    <header className="pp-head">
      <div className="pp-head__intro">
        <h1 className="pp-head__title">Properties</h1>
        <p className="pp-head__sub">Manage property listings, approvals, ownership details, and listing status.</p>
      </div>
      <div className="pp-head__action">
        <Button hierarchy="primary" size="lg" iconLeading="plus" href="Add Property.html">Add property</Button>
      </div>
    </header>
  );
}

/* ==================================================================
   PROPERTIES — KPI SUMMARY
================================================================== */
function KpiSummary() {
  return (
    <div className="pp-kpis">
      {KPI_CARDS.map((c) => (
        <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
      ))}
    </div>
  );
}

/* ==================================================================
   PROPERTIES — TABLE CARD  (own header: title + count + search + filters)
================================================================== */
const TOTAL_PROPERTIES = 1486;

function TableControls({ filters, setFilter }) {
  const opt = (arr) => arr.map((v) => ({ value: v, label: v }));
  return (
    <div className="pp-tablecard__controls">
      <div className="pp-search">
        <span className="pp-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Search by title, location, owner, or agent…" aria-label="Search properties" />
      </div>
      <div className="pp-filters">
        <Select size="md" value={filters.status} onChange={(e) => setFilter("status", e.target.value)}
          options={[{ value: "", label: "All statuses" }, ...opt(["Draft","Pending Approval","Published","Sold","Rented","Archived"])]} />
        <Select size="md" value={filters.type} onChange={(e) => setFilter("type", e.target.value)}
          options={[{ value: "", label: "All types" }, ...opt(TYPE_OPTIONS)]} />
        <Select size="md" value={filters.city} onChange={(e) => setFilter("city", e.target.value)}
          options={[{ value: "", label: "All cities" }, ...opt(CITY_OPTIONS)]} />
        <Select size="md" value={filters.listing} onChange={(e) => setFilter("listing", e.target.value)}
          options={[{ value: "", label: "Sale & rent" }, { value: "sale", label: "For sale" }, { value: "rent", label: "For rent" }]} />
      </div>
    </div>
  );
}

/* ==================================================================
   PROPERTIES — ROW ACTIONS MENU
================================================================== */
function RowActions({ status, open, onToggle, onClose }) {
  const isPending = status === "Pending Approval";
  const isArchived = status === "Archived";
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!open || !btnRef.current) { setPos(null); return; }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 196) });
  }, [open]);
  const menu = pos && ReactDOM.createPortal(
    <div className="pp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="pp-amenu__sect">
        <button type="button" className="pp-aitem" role="menuitem" onClick={onClose}><Icon name="eye" size={17} />View details</button>
        <button type="button" className="pp-aitem" role="menuitem" onClick={onClose}><Icon name="pencil" size={17} />Edit listing</button>
      </div>
      {isPending && (
        <div className="pp-amenu__sect">
          <button type="button" className="pp-aitem pp-aitem--approve" role="menuitem" onClick={onClose}><Icon name="check" size={17} />Approve</button>
          <button type="button" className="pp-aitem pp-aitem--reject" role="menuitem" onClick={onClose}><Icon name="x" size={17} />Reject</button>
        </div>
      )}
      <div className="pp-amenu__sect">
        {isArchived
          ? <button type="button" className="pp-aitem" role="menuitem" onClick={onClose}><Icon name="archive-restore" size={17} />Restore</button>
          : <button type="button" className="pp-aitem" role="menuitem" onClick={onClose}><Icon name="archive" size={17} />Archive</button>}
        <button type="button" className="pp-aitem pp-aitem--danger" role="menuitem" onClick={onClose}><Icon name="trash-2" size={17} />Delete</button>
      </div>
    </div>,
    document.body
  );
  return (
    <div className="pp-actions">
      <button ref={btnRef} type="button" className={"pp-kebab" + (open ? " is-open" : "")} aria-label="Property actions"
        aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </div>
  );
}

/* ==================================================================
   PROPERTIES — TABLE ROW
================================================================== */
function PropertyRow({ p, openMenu, setOpenMenu }) {
  const st = STATUS_META[p.status] || { variant: "neutral" };
  return (
    <div className="pp-row">
      {/* property */}
      <div className="pp-col--prop">
        <div className="pp-prop">
          <img className="pp-prop__thumb" src={p.img} alt="" loading="lazy" />
          <div className="pp-prop__body">
            <span className="pp-prop__title">{p.title}</span>
            <span className="pp-prop__loc"><Icon name="map-pin" size={13} />{p.area}, {p.city}</span>
            <span className="pp-prop__type">{p.type} · {p.id}</span>
          </div>
        </div>
      </div>

      {/* owner (internal) */}
      <div className="pp-col--owner">
        <span className="pp-celllabel">Owner</span>
        <div className="pp-owner">
          <span className="pp-owner__name">{p.owner.name}</span>
          <span className="pp-owner__contact"><Icon name={p.owner.icon} size={12} />{p.owner.contact}</span>
        </div>
      </div>

      {/* assigned agent */}
      <div className="pp-col--agent">
        <span className="pp-celllabel">Agent</span>
        {p.agent ? (
          <div className="pp-agent">
            <Avatar src={p.agent.img} name={p.agent.name} size="sm" verified={p.agent.verified} />
            <span className="pp-agent__name">{p.agent.name}</span>
          </div>
        ) : (
          <span className="pp-agent__unassigned"><Icon name="user-plus" size={15} />Unassigned</span>
        )}
      </div>

      {/* listing type */}
      <div className="pp-col--listing">
        <span className={"pp-listing pp-listing--" + p.listing}>
          <Icon name={p.listing === "sale" ? "tag" : "key"} size={13} />
          {p.listing === "sale" ? "For sale" : "For rent"}
        </span>
      </div>

      {/* status */}
      <div className="pp-col--status">
        <Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon}>{p.status}</Badge>
      </div>

      {/* price */}
      <div className="pp-col--price">
        <span className="pp-celllabel">Price</span>
        <div className="pp-price">
          <span className="pp-price__val">{fmtUSD(p.price)}{p.per && <span className="pp-price__per">{p.per}</span>}</span>
        </div>
      </div>

      {/* date added */}
      <div className="pp-col--date">
        <span className="pp-celllabel">Date added</span>
        <span className="pp-date">{p.date}</span>
      </div>

      {/* actions */}
      <div className="pp-col--actions">
        <RowActions status={p.status}
          open={openMenu === p.id}
          onToggle={() => setOpenMenu(openMenu === p.id ? null : p.id)}
          onClose={() => setOpenMenu(null)} />
      </div>
    </div>
  );
}

function PropertiesTableCard({ filters, setFilter, onClear, hasActive, rows, openMenu, setOpenMenu }) {
  const shown = hasActive ? rows.length : TOTAL_PROPERTIES;
  return (
    <section className="pp-tablecard">
      <header className="pp-tablecard__head">
        <div className="pp-tablecard__titlerow">
          <div className="pp-tablecard__heading">
            <h2 className="pp-tablecard__title">All properties</h2>
            <span className="pp-tablecard__count">{shown.toLocaleString("en-US")}</span>
          </div>
          {hasActive && (
            <div className="pp-tablecard__resultnote">
              <span><b>{rows.length}</b> of {TOTAL_PROPERTIES.toLocaleString("en-US")} shown</span>
              <button type="button" className="pp-clear" onClick={onClear}>
                <Icon name="x" size={15} />Clear filters
              </button>
            </div>
          )}
        </div>
        <TableControls filters={filters} setFilter={setFilter} />
      </header>
      <div className="pp-table">
        <div className="pp-thead" role="row">
          <span className="pp-th pp-col--prop">Property</span>
          <span className="pp-th pp-col--owner">Owner</span>
          <span className="pp-th pp-col--agent">Assigned agent</span>
          <span className="pp-th pp-col--listing">Listing</span>
          <span className="pp-th pp-col--status">Status</span>
          <span className="pp-th pp-col--price pp-th--num">Price</span>
          <span className="pp-th pp-col--date">Date added</span>
          <span className="pp-th pp-col--actions" aria-hidden="true"></span>
        </div>
        {rows.length > 0 ? (
          rows.map((p) => <PropertyRow key={p.id} p={p} openMenu={openMenu} setOpenMenu={setOpenMenu} />)
        ) : (
          <div className="pp-noresults">
            <span className="pp-noresults__art"><Icon name="search-x" size={26} strokeWidth={1.6} /></span>
            <h3>No properties found</h3>
            <p>Try adjusting your search or clearing the filters to see more listings.</p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==================================================================
   PROPERTIES PAGE
================================================================== */
const EMPTY_FILTERS = { q: "", status: "", type: "", city: "", listing: "" };

function PropertiesPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState(null);
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters(EMPTY_FILTERS);
  const hasActive = Object.values(filters).some(Boolean);

  // close any open row-action menu when the page or table scrolls
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return PROPERTIES.filter((p) => {
      if (filters.status && p.status !== filters.status) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.city && p.city !== filters.city) return false;
      if (filters.listing && p.listing !== filters.listing) return false;
      if (q) {
        const hay = [p.title, p.area, p.city, p.owner.name, p.agent ? p.agent.name : "", p.id].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <React.Fragment>
      <PropertiesHeader />
      <KpiSummary />
      <PropertiesTableCard filters={filters} setFilter={setFilter} onClear={clear} hasActive={hasActive}
        rows={rows} openMenu={openMenu} setOpenMenu={setOpenMenu} />
      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
    </React.Fragment>
  );
}

/* ==================================================================
   APP SHELL
================================================================== */
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

  const [collapsed, setCollapsed] = useState(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [active, setActive] = useState("properties");
  const [openMenu, setOpenMenu] = useState(null);
  const catRef = useRef(categoryFor(window.innerWidth));

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

  useEffect(() => { setOpenMenu(null); }, [layout]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { setOpenMenu(null); setDrawerOpen(false); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = useCallback((id) => {
    if (id === "dashboard") { window.location.href = "Admin-Dashboard page.html"; return; }
    if (id === "members") { window.location.href = "Admin-Members Page.html"; return; }
    if (id === "agents")     { window.location.href = "Admin-Agents Page.html";    return; }
    if (id === "viewings")   { window.location.href = "Admin-Viewings Page.html";  return; }
    if (id === "locations")  { window.location.href = "Admin-Locations Page.html"; return; }
    setActive(id);
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
  }, []);

  const title = (NAV_FLAT.find((n) => n.id === active) || NAV_FLAT[0]).label;

  return (
    <div className="ax-app" data-layout={layout}>
      <Sidebar layout={layout} collapsed={collapsed} drawerOpen={drawerOpen} active={active}
        onSelect={handleSelect} onToggleCollapse={() => setCollapsed((c) => !c)}
        openMenu={openMenu} setOpenMenu={setOpenMenu} onLogout={() => setOpenMenu(null)} />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        {showTopbar && (
          <Topbar layout={layout} title={title} openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        )}
        {!showTopbar && (
          <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        )}
        <main className="ax-content" data-screen-label="Admin · Properties">
          {active === "properties"
            ? <PropertiesPage />
            : (
              <div className="ax-empty">
                <div className="ax-empty__art">
                  <Icon name="building-2" size={44} strokeWidth={1.5} />
                  <span className="ax-empty__badge"><Icon name="arrow-right" size={20} strokeWidth={2.25} /></span>
                </div>
                <h2>{title}</h2>
                <p>This module isn’t part of this prototype yet. Head back to Properties to manage listings.</p>
                <div className="ax-empty__actions">
                  <Button hierarchy="primary" size="lg" iconLeading="building-2" onClick={() => handleSelect("properties")}>Open properties</Button>
                </div>
              </div>
            )}
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}

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

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
