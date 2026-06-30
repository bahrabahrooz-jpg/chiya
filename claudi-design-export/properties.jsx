const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard, Select } = DS;

const LOGO = "assets/chiya-logomark.svg";

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
  { id: "locations", label: "Locations", icon: "map-pin" }]
},
{ label: "Platform", items: [
  { id: "reports", label: "Reports", icon: "chart-column" },
  { id: "roles", label: "Roles & permissions", icon: "key-round" },
  { id: "settings", label: "Settings", icon: "settings" }]
}];

const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items);

const LANGUAGES = [
{ code: "EN", label: "English", native: "English" },
{ code: "KU", label: "Kurdî", native: "Soranî · سۆرانی" },
{ code: "AR", label: "العربية", native: "Arabic" }];


const NOTIFICATIONS = [
{ id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
{ id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
{ id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
{ id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" }];


const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };

const LAYOUTS = {
  B: { name: "Search-first topbar", desc: "Topbar becomes a utility strip — search on the far left, notifications & profile on the right. Page title moves into the content canvas." },
  C: { name: "Sidebar-centric", desc: "No topbar. Search sits under the logo and the profile is fixed to the sidebar foot with its own menu. Page title lives in the content." }
};

/* ==================================================================
   PROPERTIES DATA
================================================================== */
const KPI_CARDS = [
{ key: "total", label: "Total properties", icon: "building-2", tone: "brand", value: "1,486", sub: "All listings on Chiya" },
{ key: "available", label: "Available properties", icon: "home", tone: "success", value: "942", sub: "Published & on market" },
{ key: "pending", label: "Pending approval", icon: "clock", tone: "gold", value: "18", sub: "Awaiting your review" },
{ key: "sold", label: "Sold properties", icon: "key", tone: "info", value: "388", sub: "Closed sales all-time" },
{ key: "rented", label: "Rented properties", icon: "key-round", tone: "brand", value: "156", sub: "Active rental contracts" }];


/* status → Badge config (soft, premium tones per brand semantics) */
const STATUS_META = {
  "Draft": { variant: "neutral", dot: true },
  "Pending": { variant: "warning", dot: true },
  "Published": { variant: "success", dot: true },
  "Sold": { variant: "error", dot: true },
  "Rented": { variant: "info", dot: true },
  "Archived": { variant: "neutral", icon: "archive" }
};

const TYPE_OPTIONS = ["Villa", "Apartment", "Penthouse", "Townhouse", "Office", "Land"];
const CITY_OPTIONS = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk"];

function fmtUSD(n) {return "$" + n.toLocaleString("en-US");}

const PROPERTIES = [
{ id: "CH-2041", title: "Olive Grove Estate", area: "Ankawa", city: "Erbil", type: "Villa",
  img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Karwan Mahmoud", contact: "+964 750 118 4420", icon: "phone" },
  agent: { name: "Lana Aziz", verified: false, img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Pending", price: 1200000, date: "Jun 12, 2026", daysAgo: 2 },

{ id: "CH-2038", title: "Marble Hill Villa", area: "Empire World", city: "Erbil", type: "Villa",
  img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Sirwan Tofiq", contact: "+964 750 234 5678", icon: "phone" },
  agent: { name: "Ahmed Karim", verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Published", price: 620000, date: "Jun 9, 2026", daysAgo: 5 },

{ id: "CH-2035", title: "Cedar Court Residence", area: "Italian Village", city: "Erbil", type: "Townhouse",
  img: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Dashne Salar", contact: "+964 770 552 1190", icon: "phone" },
  agent: { name: "Sara Hama", verified: true, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Sold", price: 845000, date: "Jun 6, 2026", daysAgo: 8 },

{ id: "CH-2031", title: "Tigris View Apartment", area: "Dream City", city: "Erbil", type: "Apartment",
  img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Awat Rashid", contact: "+964 751 904 7782", icon: "phone" },
  agent: { name: "Rawa Jalal", verified: true, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  listing: "rent", status: "Rented", price: 1800, per: "/mo", date: "Jun 4, 2026", daysAgo: 10 },

{ id: "CH-2029", title: "Naz City Penthouse", area: "Naz City", city: "Erbil", type: "Penthouse",
  img: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Hewa Botan", contact: "+964 751 345 6789", icon: "phone" },
  agent: { name: "Diyar Salih", verified: false, img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Published", price: 980000, date: "Jun 2, 2026", daysAgo: 12 },

{ id: "CH-2026", title: "Goizha Mountain House", area: "Goizha", city: "Sulaymaniyah", type: "Villa",
  img: "https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Nyan Faraj", contact: "+964 773 220 5567", icon: "phone" },
  agent: null,
  listing: "sale", status: "Draft", price: 540000, date: "Jun 1, 2026", daysAgo: 13 },

{ id: "CH-2022", title: "Park View Loft", area: "Salim Street", city: "Sulaymaniyah", type: "Apartment",
  img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Shilan Aram", contact: "+964 770 456 7890", icon: "phone" },
  agent: { name: "Hawre Ako", verified: true, img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
  listing: "rent", status: "Published", price: 1100, per: "/mo", date: "May 28, 2026", daysAgo: 17 },

{ id: "CH-2018", title: "Family Mall Office Suite", area: "100m Road", city: "Erbil", type: "Office",
  img: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Rebwar Group", contact: "+964 750 600 1234", icon: "phone" },
  agent: { name: "Ahmed Karim", verified: true, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  listing: "rent", status: "Pending", price: 3200, per: "/mo", date: "May 26, 2026", daysAgo: 19 },

{ id: "CH-2014", title: "Zagros Garden Townhouse", area: "Masif", city: "Duhok", type: "Townhouse",
  img: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Berivan Khalid", contact: "+964 773 567 8901", icon: "phone" },
  agent: { name: "Sara Hama", verified: true, img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Published", price: 410000, date: "May 22, 2026", daysAgo: 23 },

{ id: "CH-2009", title: "Citadel Heights Land", area: "Qalat", city: "Erbil", type: "Land",
  img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Aland Property Co.", contact: "+964 751 778 9012", icon: "phone" },
  agent: { name: "Diyar Salih", verified: false, img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Draft", price: 290000, date: "May 18, 2026", daysAgo: 27 },

{ id: "CH-2004", title: "Lakeside Apartment", area: "Dukan", city: "Sulaymaniyah", type: "Apartment",
  img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=240&q=70",
  owner: { name: "Tara Jamal", contact: "+964 751 678 9012", icon: "phone" },
  agent: { name: "Rawa Jalal", verified: true, img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  listing: "sale", status: "Sold", price: 365000, date: "May 14, 2026", daysAgo: 31 }];


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
  useEffect(() => {if (!collapsed) setTip(null);}, [collapsed]);
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
    </button>);

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
      {showSearch &&
      <div className="ax-sb-search">
          <div className="ax-sb-search__field">
            <span className="ax-sb-search__lead"><Icon name="search" size={18} /></span>
            <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
          </div>
        </div>
      }
      <nav className="ax-nav">
        {NAV_GROUPS.map((g) =>
        <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map((it) =>
          <NavItem key={it.id} item={it} active={active === it.id} collapsed={collapsed} onSelect={onSelect} />
          )}
          </div>
        )}
      </nav>
      {showProfile &&
      <SidebarProfile collapsed={collapsed} open={openMenu === "sbprofile"}
      onToggle={() => setOpenMenu(openMenu === "sbprofile" ? null : "sbprofile")}
      onSelect={onSelect} onLogout={onLogout} onClose={() => setOpenMenu(null)} />
      }
    </aside>);

}

function SidebarProfile({ collapsed, open, onToggle, onSelect, onLogout, onClose }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  const items = [
  { icon: "user", label: "My profile", action: onClose },
  { icon: "settings", label: "Account settings", action: () => onSelect("settings") },
  { icon: "bell", label: "Notifications", action: onClose, count: unread }];

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
      {open &&
      <div className="ax-sb-menu" role="menu">
          <div className="ax-menu__sect">
            {items.map((it) =>
          <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={it.action}>
                <Icon name={it.icon} size={18} />{it.label}
                {it.count > 0 && <span className="ax-menu-item__count">{it.count}</span>}
              </button>
          )}
          </div>
          <div className="ax-menu__sect">
            <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
              <Icon name="log-out" size={18} />Log out
            </button>
          </div>
        </div>
      }
    </div>);

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
        {items.map((it) =>
        <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={onClose}>
            <Icon name={it.icon} size={18} />{it.label}
          </button>
        )}
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
          <Icon name="log-out" size={18} />Log out
        </button>
      </div>
    </div>);

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
        {NOTIFICATIONS.map((n) =>
        <div key={n.id} className={"ax-notif" + (n.unread ? " is-unread" : "")} onClick={onClose}>
            <span className={"ax-notif__ic ax-notif__ic--" + n.kind}><Icon name={n.icon} size={18} /></span>
            <div className="ax-notif__body">
              <p className="ax-notif__title">{n.title}</p>
              <p className="ax-notif__desc">{n.desc}</p>
              <div className="ax-notif__time">{n.time}</div>
            </div>
            {n.unread && <span className="ax-notif__udot" />}
          </div>
        )}
      </div>
      <div className="ax-menu__foot">
        <Button hierarchy="secondary" size="sm" onClick={onClose}>Mark all as read</Button>
      </div>
    </div>);

}

function Topbar({ layout, title, openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  const searchFirst = layout === "B";
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>
      {layout === "A" &&
      <div className="ax-tb-titlewrap"><span className="ax-tb-title">{title}</span></div>
      }
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
    </header>);

}

const ITEMS_PER_PAGE = 10;

function PaginationFooter({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const start = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };

  if (totalItems === 0) return null;
  return (
    <div className="pp-tablefooter">
      <span className="pp-pagination__info">
        Showing <b>{start.toLocaleString("en-US")}–{end.toLocaleString("en-US")}</b> of <b>{totalItems.toLocaleString("en-US")}</b> properties
      </span>
      <div className="pp-pagination">
        <button type="button" className="pp-page-btn pp-page-btn--nav"
        disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />Previous
        </button>
        {getPages().map((p, i) =>
        p === "…" ?
        <span key={"e" + i} className="pp-page-ellipsis">…</span> :
        <button key={p} type="button"
        className={"pp-page-btn" + (p === currentPage ? " is-active" : "")}
        onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button type="button" className="pp-page-btn pp-page-btn--nav"
        disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next<Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>);

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
        <Button hierarchy="primary" size="lg" iconLeading="plus" href="Admin-Add Property page.html">Add property</Button>
      </div>
    </header>);

}

/* ==================================================================
   PROPERTIES — KPI SUMMARY
================================================================== */
function KpiSummary() {
  return (
    <div className="pp-kpis">
      {KPI_CARDS.map((c) =>
      <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
      )}
    </div>);

}

/* ==================================================================
   PROPERTIES — STATUS TABS + FILTER BAR
================================================================== */
const STATUS_OPTIONS = Object.keys(STATUS_META).filter((s) => s !== "Archived");
const STATUS_DOT_COLOR = {
  neutral: "var(--gray-400)",
  warning: "var(--warning-500)",
  success: "var(--success-500)",
  error: "var(--error-500)",
  info: "var(--info-500)",
  gold: "var(--gold-500)",
  brand: "var(--brand-primary)"
};

/* Master agent roster — derived once from initial PROPERTIES data */
const AGENTS_LIST = Object.values(
  PROPERTIES.reduce((acc, p) => {
    if (p.agent && !acc[p.agent.name]) acc[p.agent.name] = { ...p.agent };
    return acc;
  }, {})
).sort((a, b) => a.name.localeCompare(b.name));

const TOTAL_PROPERTIES = 1486;

const STATUS_TABS = [
{ id: "all", label: "View all" },
{ id: "published", label: "Published" },
{ id: "sold", label: "Sold" },
{ id: "rented", label: "Rented" },
{ id: "pending", label: "Pending" }];


const PRICE_RANGES = ["Under $500K", "$500K – $1M", "Over $1M", "Under $2,000/mo", "Over $2,000/mo"];
const DATE_PRESETS = ["Last 7 days", "Last 30 days", "Last 3 months", "Last 6 months"];
const AGENT_NAMES = [...new Set(PROPERTIES.filter((p) => p.agent).map((p) => p.agent.name))].sort();
const EMPTY_ADV = { type: "", city: "", agent: "", priceRange: "", dateAdded: "" };

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
  };

  const toggle = () => {
    if (!open) calcPos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (document.querySelector(".pp-custdrop")?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  const clear = (e) => {e.stopPropagation();onChange("");};

  return (
    <div className="pp-datebtn-wrap" ref={btnRef}>
      <button type="button"
      className={"pp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
      onClick={toggle}>
        <span className="pp-datebtn__label">
          {options.find((o) => o.value === value)?.label || placeholder}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open && pos && ReactDOM.createPortal(
        <div className="pp-custdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
          {options.map((o) =>
          <button key={o.value} type="button"
          className={"pp-custdrop__item" + (value === o.value ? " is-selected" : "")}
          onClick={() => {onChange(value === o.value ? "" : o.value);setOpen(false);}}>
              {o.label}
              {value === o.value && <Icon name="check" size={15} strokeWidth={2.5} />}
            </button>
          )}
        </div>,
        document.body
      )}
    </div>);

}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_ABBR = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function CalendarPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  const calcCalPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  };

  const toggle = () => {
    if (!open) calcCalPos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (document.querySelector(".pp-calpop")?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcCalPos, true);
    window.addEventListener("resize", calcCalPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcCalPos, true);
      window.removeEventListener("resize", calcCalPos);
    };
  }, [open]);

  const clear = (e) => {e.stopPropagation();onChange("");};

  const year = viewDate.getFullYear();
  const mon = viewDate.getMonth();
  const firstDow = new Date(year, mon, 1).getDay();
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const today = new Date();

  const prevMonth = () => setViewDate(new Date(year, mon - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, mon + 1, 1));

  // Parse stored value back to a Date for highlighting
  const parseValue = (v) => {try {return v ? new Date(v) : null;} catch {return null;}};
  const sel = parseValue(value);
  const isSelected = (d) => sel && sel.getFullYear() === year && sel.getMonth() === mon && sel.getDate() === d;
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === mon && today.getDate() === d;

  const selectDay = (d) => {
    const date = new Date(year, mon, d);
    onChange(MONTH_NAMES[mon].slice(0, 3) + " " + d + ", " + year);
    setOpen(false);
  };

  // Build grid: leading empty cells + day cells
  const cells = Array(firstDow).fill(null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  return (
    <div className="pp-datebtn-wrap" ref={btnRef}>
      <button type="button"
      className={"pp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
      onClick={toggle}>
        <span className="pp-datebtn__label">{value || "Date added"}</span>
        <Icon name="calendar" size={15} />

      </button>

      {open && pos && ReactDOM.createPortal(
        <div className="pp-calpop" style={{ top: pos.top, left: pos.left }}>
          <div className="pp-cal__head">
            <button type="button" className="pp-cal__nav" onClick={prevMonth}>
              <Icon name="chevron-left" size={16} />
            </button>
            <span className="pp-cal__title">{MONTH_NAMES[mon]} {year}</span>
            <button type="button" className="pp-cal__nav" onClick={nextMonth}>
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
          <div className="pp-cal__grid">
            {DAY_ABBR.map((d) =>
            <span key={d} className="pp-cal__daylabel">{d}</span>
            )}
            {cells.map((day, i) =>
            day === null ?
            <span key={"e" + i} /> :
            <button key={day} type="button"
            className={"pp-cal__day" + (isSelected(day) ? " is-selected" : "") + (isToday(day) ? " is-today" : "")}
            onClick={() => selectDay(day)}>
                    {day}
                  </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>);

}

/* ==================================================================
   CHANGE STATUS MODAL
================================================================== */
function ChangeStatusModal({ property, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {if (dropOpen) setDropOpen(false);else onCancel();}
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, dropOpen]);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const toggleDrop = () => {if (!dropOpen) calcPos();setDropOpen((v) => !v);};

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (document.querySelector(".pp-smodal__drop")?.contains(e.target)) return;
      setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [dropOpen]);

  const canConfirm = selected && selected !== property.status;
  const currentMeta = STATUS_META[property.status] || { variant: "neutral" };

  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => {if (e.target === e.currentTarget) onCancel();}}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <div className="pp-modal__icon pp-modal__icon--status">
          <Icon name="refresh-cw" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="status-modal-title">Change status</h2>

        <p className="pp-modal__sublabel">Select new status</p>
        <button ref={triggerRef} type="button"
        className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")}
        onClick={toggleDrop}>
          {selected ?
          <React.Fragment>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[STATUS_META[selected].variant] }} />
              <span className="pp-smodal__label">{selected}</span>
            </React.Fragment> :

          <span className="pp-amodal__trigger-placeholder">
              <Icon name="tag" size={16} />Choose a status…
            </span>
          }
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>

        {dropOpen && dropPos && ReactDOM.createPortal(
          <div className="pp-smodal__drop pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {STATUS_OPTIONS.map((status) => {
              const meta = STATUS_META[status];
              const isCurrent = property.status === status;
              const isSelected = selected === status;
              return (
                <button key={status} type="button"
                className={"pp-smodal__item" + (isSelected ? " is-selected" : "")}
                onClick={() => {setSelected(status);setDropOpen(false);}}>
                  <span className="pp-smodal__dot" style={{ background: STATUS_DOT_COLOR[meta.variant] }} />
                  <span className="pp-smodal__label">{status}</span>
                  <span className="pp-smodal__spacer" />
                  {isCurrent && <span className="pp-amodal__current-tag">Current</span>}
                  {isSelected && <span className="pp-smodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
                </button>);

            })}
          </div>,
          document.body
        )}

        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm}
          onClick={() => onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />Change status
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   ASSIGN / CHANGE AGENT MODAL
================================================================== */
function AssignAgentModal({ property, onCancel, onConfirm }) {
  const hasAgent = !!property.agent;
  const [selected, setSelected] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {if (dropOpen) setDropOpen(false);else onCancel();}
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, dropOpen]);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  const toggleDrop = () => {if (!dropOpen) calcPos();setDropOpen((v) => !v);};

  useEffect(() => {
    if (!dropOpen) return;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      if (document.querySelector(".pp-amodal__drop")?.contains(e.target)) return;
      setDropOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [dropOpen]);

  const selectedAgent = selected ? AGENTS_LIST.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== (property.agent?.name ?? null);

  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => {if (e.target === e.currentTarget) onCancel();}}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign">
          <Icon name={hasAgent ? "user-cog" : "user-plus"} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="agent-modal-title">
          {hasAgent ? "Change assigned agent" : "Assign agent"}
        </h2>

        <p className="pp-modal__sublabel">{hasAgent ? "Select new agent" : "Select agent"}</p>

        <button ref={triggerRef} type="button"
        className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")}
        onClick={toggleDrop}>
          {selectedAgent ?
          <React.Fragment>
              <Avatar src={selectedAgent.img} name={selectedAgent.name} size="sm" verified={selectedAgent.verified} />
              <span className="pp-amodal__trigger-name">{selectedAgent.name}</span>
            </React.Fragment> :

          <span className="pp-amodal__trigger-placeholder">
              <Icon name="user" size={16} />Choose an agent…
            </span>
          }
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>

        {dropOpen && dropPos && ReactDOM.createPortal(
          <div className="pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {AGENTS_LIST.map((agent) => {
              const isCurrent = property.agent?.name === agent.name;
              const isSelected = selected === agent.name;
              return (
                <button key={agent.name} type="button"
                className={"pp-amodal__agent" + (isSelected ? " is-selected" : "")}
                onClick={() => {setSelected(agent.name);setDropOpen(false);}}>
                  <Avatar src={agent.img} name={agent.name} size="sm" verified={agent.verified} />
                  <span className="pp-amodal__agent-name">{agent.name}</span>
                  {isCurrent && <span className="pp-amodal__current-tag">Current</span>}
                  {isSelected && <span className="pp-amodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
                </button>);

            })}
          </div>,
          document.body
        )}

        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm}
          onClick={() => onConfirm(AGENTS_LIST.find((a) => a.name === selected))}>
            <Icon name={hasAgent ? "user-check" : "user-plus"} size={15} />
            {hasAgent ? "Change agent" : "Assign agent"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   DELETE CONFIRM MODAL
================================================================== */
function DeleteConfirmModal({ property, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") onCancel();};
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => {if (e.target === e.currentTarget) onCancel();}}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
        <div className="pp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="del-modal-title">Delete property?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete <strong>{property.title}</strong>? This action cannot be undone and will permanently remove the listing.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />Delete property
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   PROPERTIES — ROW ACTIONS MENU
================================================================== */
function RowActions({ propId, hasAgent, open, onToggle, onClose, onDelete, onAssignAgent, onChangeStatus }) {
  const goDetails = () => { window.location.href = "Admin-Property Details.html?id=" + encodeURIComponent(propId); };
  const goEdit = () => { window.location.href = "Admin-Edit Property page.html?from=properties&id=" + encodeURIComponent(propId); };
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!open || !btnRef.current) {setPos(null);return;}
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 210) });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);
  const menu = pos && ReactDOM.createPortal(
    <div className="pp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="pp-amenu__sect">
        <button type="button" className="pp-aitem" role="menuitem" onClick={goDetails}><Icon name="eye" size={17} />View details</button>
        <button type="button" className="pp-aitem" role="menuitem" onClick={goEdit}><Icon name="pencil" size={17} />Edit</button>
      </div>
      <div className="pp-amenu__sect">
        {hasAgent ?
        <button type="button" className="pp-aitem" role="menuitem" onClick={onAssignAgent}><Icon name="user-cog" size={17} />Change assigned agent</button> :
        <button type="button" className="pp-aitem" role="menuitem" onClick={onAssignAgent}><Icon name="user-plus" size={17} />Assign agent</button>}
        <button type="button" className="pp-aitem" role="menuitem" onClick={onChangeStatus}><Icon name="refresh-cw" size={17} />Change status</button>
      </div>
      <div className="pp-amenu__sect">
        <button type="button" className="pp-aitem pp-aitem--danger" role="menuitem" onClick={onDelete}><Icon name="trash-2" size={17} />Delete</button>
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
    </div>);

}

/* ==================================================================
   PROPERTIES — TABLE ROW
================================================================== */
function PropertyRow({ p, openMenu, setOpenMenu, onDeleteRequest, onAssignAgentRequest, onChangeStatusRequest }) {
  const st = STATUS_META[p.status] || { variant: "neutral" };
  return (
    <div className="pp-row">
      {/* property */}
      <div className="pp-col--prop">
        <div className="pp-prop">
          <img className="pp-prop__thumb" src={p.img} alt="" loading="lazy" />
          <div className="pp-prop__body">
            <span className="pp-prop__title">{p.title}</span>
            <span className="pp-prop__id">{p.id}</span>
          </div>
        </div>
      </div>

      {/* location */}
      <div className="pp-col--location">
        <span className="pp-celllabel">Location</span>
        <span className="pp-prop__loc"><Icon name="map-pin" size={14} />{p.city}</span>
      </div>

      {/* type */}
      <div className="pp-col--type">
        <span className="pp-celllabel">Type</span>
        <span className="pp-prop__type">{p.type}</span>
      </div>

      {/* owner (internal) */}
      <div className="pp-col--owner">
        <span className="pp-celllabel">Owner</span>
        <div className="pp-owner">
          <span className="pp-owner__name">{p.owner.name}</span>
        </div>
      </div>

      {/* assigned agent */}
      <div className="pp-col--agent">
        <span className="pp-celllabel">Agent</span>
        {p.agent ?
        <div className="pp-agent">
            <Avatar src={p.agent.img} name={p.agent.name} size="sm" verified />
            <span className="pp-agent__name">{p.agent.name}</span>
          </div> :

        <span className="pp-agent__unassigned"><Icon name="user-plus" size={15} />Unassigned</span>
        }
      </div>

      {/* listing type */}
      <div className="pp-col--listing">
        <Badge variant={p.listing === "sale" ? "brand" : "info"} size="sm">
          {p.listing === "sale" ? "For sale" : "For rent"}
        </Badge>
      </div>

      {/* status */}
      <div className="pp-col--status">
        <Badge variant={st.variant} size="sm" dot={st.dot} icon={st.icon} style={{ height: "19px", flexDirection: "row" }}>{p.status}</Badge>
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
        <RowActions propId={p.id} hasAgent={!!p.agent}
        open={openMenu === p.id}
        onToggle={() => setOpenMenu(openMenu === p.id ? null : p.id)}
        onClose={() => setOpenMenu(null)}
        onDelete={() => {setOpenMenu(null);onDeleteRequest(p);}}
        onAssignAgent={() => {setOpenMenu(null);onAssignAgentRequest(p);}}
        onChangeStatus={() => {setOpenMenu(null);onChangeStatusRequest(p);}} />
      </div>
    </div>);

}

function PropertiesTableCard({
  activeTab, onTabChange, q, onQChange,
  filtersOpen, onToggleFilters,
  advFilters, onAdvFilter, onApplyFilters, onClearFilters,
  rows, totalRows, currentPage, onPageChange,
  openMenu, setOpenMenu, onDeleteRequest, onAssignAgentRequest, onChangeStatusRequest
}) {
  const opt = (arr) => arr.map((v) => ({ value: v, label: v }));
  const activeAdvCount = Object.values(advFilters).filter(Boolean).length;
  const isFiltered = activeTab !== "all" || !!q || activeAdvCount > 0;
  const shown = isFiltered ? rows.length : TOTAL_PROPERTIES;

  return (
    <section className="pp-tablecard">
      <header className="pp-tablecard__head">

        {/* ── Title row ── */}
        <div className="pp-tablecard__titlerow">
          <div className="pp-tablecard__heading">
            <h2 className="pp-tablecard__title">Properties</h2>
            <span className="pp-tablecard__count">{shown.toLocaleString("en-US")}</span>
          </div>
          {isFiltered &&
          <div className="pp-tablecard__resultnote">
              <span><b>{rows.length}</b> of {TOTAL_PROPERTIES.toLocaleString("en-US")} shown</span>
            </div>
          }
        </div>

        {/* ── Tabs + Search + Filters button (single row) ── */}
        <div className="pp-tabrow">
          <div className="pp-tabs" role="tablist" aria-label="Filter by status">
            {STATUS_TABS.map((tab) =>
            <button key={tab.id} type="button" role="tab"
            aria-selected={activeTab === tab.id}
            className={"pp-tab" + (activeTab === tab.id ? " is-active" : "")}
            onClick={() => onTabChange(tab.id)}>
                {tab.label}
              </button>
            )}
          </div>
          <div className="pp-tabrow__right">
            <div className="pp-tabsearch">
              <span className="pp-tabsearch__lead"><Icon name="search" size={16} /></span>
              <input type="text" value={q} onChange={(e) => onQChange(e.target.value)}
              placeholder="Search properties…" aria-label="Search properties" />
            </div>
            <button type="button"
            className={"pp-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")}
            aria-expanded={filtersOpen} onClick={onToggleFilters}>
              <Icon name="sliders-horizontal" size={15} />
              Filters
              {activeAdvCount > 0 && <span className="pp-filterbtn__badge">{activeAdvCount}</span>}
            </button>
          </div>
        </div>

        {/* ── Expandable filter panel (slide-down) ── */}
        <div className={"pp-filterbar" + (filtersOpen ? " is-open" : "")}>
          <div className="pp-filterbar__inner">
            <div className="pp-filterbar__row">
              <CustomSelect value={advFilters.type} onChange={(v) => onAdvFilter("type", v)}
              options={opt(TYPE_OPTIONS)} placeholder="Property type" />
              <CustomSelect value={advFilters.city} onChange={(v) => onAdvFilter("city", v)}
              options={opt(CITY_OPTIONS)} placeholder="City" />
              <CustomSelect value={advFilters.priceRange} onChange={(v) => onAdvFilter("priceRange", v)}
              options={opt(PRICE_RANGES)} placeholder="Price range" />
              <CalendarPicker value={advFilters.dateAdded} onChange={(v) => onAdvFilter("dateAdded", v)} />
              <div className="pp-filterbar__actions">
                <button type="button" className="pp-clearbtn" onClick={onClearFilters}>
                  <Icon name="x" size={14} />Clear all
                </button>
              </div>
            </div>
          </div>
        </div>

      </header>

      <div className="pp-table">
        <div className="pp-thead" role="row">
          <span className="pp-th pp-col--prop">Property</span>
          <span className="pp-th pp-col--location">Location</span>
          <span className="pp-th pp-col--type">Type</span>
          <span className="pp-th pp-col--owner">Owner</span>
          <span className="pp-th pp-col--agent">Assigned agent</span>
          <span className="pp-th pp-col--listing">Listing</span>
          <span className="pp-th pp-col--status">Status</span>
          <span className="pp-th pp-col--price">Price</span>
          <span className="pp-th pp-col--date">Date added</span>
          <span className="pp-th pp-col--actions">Action</span>
        </div>
        {rows.length > 0 ?
        rows.map((p) => <PropertyRow key={p.id} p={p} openMenu={openMenu} setOpenMenu={setOpenMenu}
        onDeleteRequest={onDeleteRequest}
        onAssignAgentRequest={onAssignAgentRequest}
        onChangeStatusRequest={onChangeStatusRequest} />) :

        <div className="pp-noresults">
            <span className="pp-noresults__art"><Icon name="search-x" size={26} strokeWidth={1.6} /></span>
            <h3>No properties found</h3>
            <p>Try adjusting your search or clearing the filters to see more listings.</p>
          </div>
        }
      </div>
      <PaginationFooter currentPage={currentPage} totalItems={totalRows} onPageChange={onPageChange} />
    </section>);

}

/* ==================================================================
   PROPERTIES PAGE
================================================================== */
function PropToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {requestAnimationFrame(() => setVisible(true));}, []);
  const iconCls = "pp-toast__icon" + (toast.tone === "danger" ? " pp-toast__icon--danger" : toast.tone === "brand" ? " pp-toast__icon--brand" : "");
  return (
    <div className={`pp-toast${toast.tone === "danger" ? " pp-toast--danger" : ""}${visible && !toast.out ? " is-in" : ""}${toast.out ? " is-out" : ""}`}>
      <span className={iconCls}><Icon name={toast.icon} size={20} strokeWidth={2.25} /></span>
      <div className="pp-toast__body">
        <p className="pp-toast__title">{toast.title}</p>
        <p className="pp-toast__msg">{toast.msg}</p>
        {toast.onUndo &&
        <div className="pp-toast__actions">
          <button type="button" className="pp-toast__btn pp-toast__btn--dismiss" onClick={onDismiss}>Dismiss</button>
          <button type="button" className="pp-toast__btn pp-toast__btn--undo" onClick={() => {toast.onUndo();onDismiss();}}>
            <Icon name="undo-2" size={15} />Undo
          </button>
        </div>
        }
      </div>
      <button type="button" className="pp-toast__close" aria-label="Close" onClick={onDismiss}>
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
      <div className="pp-toast__progress" />
    </div>);

}

function PropertiesPage() {
  const [properties, setProperties] = useState(PROPERTIES);
  const [activeTab, setActiveTab] = useState("all");
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advFilters, setAdvFilters] = useState(EMPTY_ADV);
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [agentTarget, setAgentTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const setAdvFilter = (k, v) => {setAdvFilters((f) => ({ ...f, [k]: v }));setCurrentPage(1);};
  const clearFilters = () => {setAdvFilters(EMPTY_ADV);setCurrentPage(1);};
  const applyFilters = () => {setFiltersOpen(false);};

  const handleTabChange = (tab) => {setActiveTab(tab);setCurrentPage(1);};
  const handleQChange = (val) => {setQ(val);setCurrentPage(1);};

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const pushToast = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => t.id === id ? { ...t, out: true } : t)), 5000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5380);
  };
  const dismissToast = (id) => {
    setToasts((ts) => ts.map((t) => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  };

  // show the success toast when returning here after an update
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("toast") === "updated") {
      pushToast({ tone: "success", icon: "circle-check", title: "Property updated", msg: "The property has been updated successfully." });
      params.delete("toast");
      const qs = params.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    }
  }, []);

  const handleStatusConfirm = (status) => {
    const prop = statusTarget;
    setProperties((prev) => prev.map((p) =>
    p.id === prop.id ? { ...p, status } : p
    ));
    setStatusTarget(null);
    pushToast({
      tone: "brand", icon: "refresh-cw",
      title: "Status updated",
      msg: `“${prop.title}” is now marked as ${status}.`
    });
  };

  const handleAssignConfirm = (agent) => {
    const prop = agentTarget;
    const wasAssigned = !!prop.agent;
    setProperties((prev) => prev.map((p) =>
    p.id === prop.id ? { ...p, agent } : p
    ));
    setAgentTarget(null);
    pushToast({
      tone: "success", icon: "user-check",
      title: wasAssigned ? "Agent changed" : "Agent assigned",
      msg: wasAssigned ?
      `${agent.name} is now the assigned agent for “${prop.title}”.` :
      `${agent.name} has been assigned to “${prop.title}”.`
    });
  };

  const handleDeleteConfirm = () => {
    const prop = deleteTarget;
    let removedIndex = -1;
    setProperties((prev) => {
      removedIndex = prev.findIndex((p) => p.id === prop.id);
      return prev.filter((p) => p.id !== prop.id);
    });
    setDeleteTarget(null);
    pushToast({
      tone: "danger", icon: "trash-2",
      title: "Property deleted",
      msg: `“${prop.title}” has been permanently removed.`,
      onUndo: () => {
        setProperties((prev) => {
          if (prev.some((p) => p.id === prop.id)) return prev;
          const next = prev.slice();
          next.splice(removedIndex < 0 ? next.length : removedIndex, 0, prop);
          return next;
        });
      }
    });
  };

  const rows = useMemo(() => {
    const sq = q.trim().toLowerCase();
    return properties.filter((p) => {
      if (activeTab === "published" && p.status !== "Published") return false;
      if (activeTab === "sale" && p.listing !== "sale") return false;
      if (activeTab === "rent" && p.listing !== "rent") return false;
      if (activeTab === "sold" && p.status !== "Sold") return false;
      if (activeTab === "rented" && p.status !== "Rented") return false;
      if (activeTab === "pending" && p.status !== "Pending") return false;
      if (advFilters.type && p.type !== advFilters.type) return false;
      if (advFilters.city && p.city !== advFilters.city) return false;
      if (advFilters.agent && (!p.agent || p.agent.name !== advFilters.agent)) return false;
      if (sq) {
        const hay = [p.title, p.area, p.city, p.owner.name, p.agent ? p.agent.name : "", p.id].join(" ").toLowerCase();
        if (!hay.includes(sq)) return false;
      }
      return true;
    });
  }, [activeTab, q, advFilters]);

  const isFiltered = activeTab !== "all" || !!q.trim() || Object.values(advFilters).some(Boolean);
  const totalRows = isFiltered ? rows.length : TOTAL_PROPERTIES;
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <React.Fragment>
      <PropertiesHeader />
      <KpiSummary />
      <PropertiesTableCard
        activeTab={activeTab} onTabChange={handleTabChange}
        q={q} onQChange={handleQChange}
        filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((v) => !v)}
        advFilters={advFilters} onAdvFilter={setAdvFilter}
        onApplyFilters={applyFilters} onClearFilters={clearFilters}
        rows={pagedRows} totalRows={totalRows}
        currentPage={currentPage} onPageChange={setCurrentPage}
        openMenu={openMenu} setOpenMenu={setOpenMenu}
        onDeleteRequest={(p) => setDeleteTarget(p)}
        onAssignAgentRequest={(p) => setAgentTarget(p)}
        onChangeStatusRequest={(p) => setStatusTarget(p)} />
      
      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      {statusTarget &&
      <ChangeStatusModal
        property={statusTarget}
        onCancel={() => setStatusTarget(null)}
        onConfirm={handleStatusConfirm} />

      }
      {deleteTarget &&
      <DeleteConfirmModal
        property={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm} />

      }
      {agentTarget &&
      <AssignAgentModal
        property={agentTarget}
        onCancel={() => setAgentTarget(null)}
        onConfirm={handleAssignConfirm} />

      }
      <div className="pp-toaster" aria-live="polite">
        {toasts.map((t) =>
        <PropToast key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        )}
      </div>
    </React.Fragment>);

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
} /*EDITMODE-END*/;

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
        if (cat === "tablet") setCollapsed(true);else
        if (cat !== "mobile") setDrawerOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {setOpenMenu(null);}, [layout]);
  useEffect(() => {
    const onKey = (e) => {if (e.key === "Escape") {setOpenMenu(null);setDrawerOpen(false);}};
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSelect = useCallback((id) => {
    const PAGES = {
      dashboard: "Admin-Dashboard page.html",
      properties: "Admin-Properties Page.html",
      members: "Admin-Members Page.html",
      agents: "Admin-Agents Page.html",
      viewings: "Admin-Viewings Page.html",
      locations: "Admin-Locations Page.html",
      reports: "Admin-Reports Page.html",
      roles: "Admin-Roles & permissions page.html"
    };
    const here = decodeURIComponent(window.location.pathname.split("/").pop());
    if (PAGES[id] && PAGES[id] !== here) {window.location.href = PAGES[id];return;}
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
        {showTopbar &&
        <Topbar layout={layout} title={title} openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        }
        {!showTopbar &&
        <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        }
        <main className="ax-content" data-screen-label="Admin · Properties">
          {active === "properties" ?
          <PropertiesPage /> :

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
          }
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
    </div>);

}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);