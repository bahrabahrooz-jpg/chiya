const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard, Select, Checkbox } = DS;

const LOGO = "assets/chiya-logomark.svg";

/* ==================================================================
   SHELL DATA  (matches the approved Admin shell — same across all pages)
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

const NOTIFICATIONS = [
{ id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
{ id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
{ id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged \"Marble Hill Villa\" for review.", time: "2 hours ago" },
{ id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" }];

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };
const LAYOUTS = {
  B: { name: "Search-first topbar", desc: "Topbar becomes a utility strip — search on the far left, notifications & profile on the right. Page title moves into the content canvas." },
  C: { name: "Sidebar-centric", desc: "No topbar. Search sits under the logo and the profile is fixed to the sidebar foot with its own menu. Page title lives in the content." }
};

/* ==================================================================
   VIEWINGS — KPI DATA
================================================================== */
const KPI_CARDS = [
{ key: "total", label: "Total viewings", icon: "calendar", tone: "brand", value: "248", sub: "All time" },
{ key: "today", label: "Scheduled today", icon: "calendar-check", tone: "info", value: "12", sub: "3 confirmed, 9 pending" },
{ key: "upcoming", label: "Upcoming", icon: "clock", tone: "gold", value: "34", sub: "Next 7 days" },
{ key: "completed", label: "Completed", icon: "check-circle", tone: "success", value: "186", sub: "Successfully conducted" },
{ key: "cancelled", label: "Cancelled", icon: "x-circle", tone: "error", value: "28", sub: "Including no-shows" }];


/* ==================================================================
   VIEWINGS — TABLE DATA
================================================================== */
const TOTAL_VIEWINGS = 248;

const VIEWING_STATUS = {
  "Scheduled": { variant: "info", icon: "clock", cls: "vw-st--scheduled" },
  "Confirmed": { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  "Completed": { variant: "brand", icon: "check-check", cls: "vw-st--completed" },
  "Cancelled": { variant: "error", icon: "x-circle", cls: "vw-st--cancelled" },
  "No Show": { variant: "warning", icon: "user-x", cls: "vw-st--noshow" }
};
const STATUSES = Object.keys(VIEWING_STATUS);
const STATUS_TABS = [{ id: "", label: "All" }, ...STATUSES.map((s) => ({ id: s, label: s }))];
const AGENTS_LIST = ["Lana Aziz", "Karwan Mahmoud", "Dashne Salar", "Berivan Khalid", "Diyar Salih", "Sirwan Tofiq"];
const PROPS_LIST = ["Marble Hill Villa", "Olive Grove Estate", "Citadel View Apartment", "Italian Village Duplex", "Ankawa Garden Villa", "Gulan Tower Penthouse", "Dream City Villa", "Sulaymaniyah Heights", "Masike Premium Apartment", "Ranya Riverside Villa", "Downtown Erbil Loft", "Ankawa Luxury Compound"];

const VIEWINGS = [
{ id: "VW-1025", property: { title: "Marble Hill Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=130&q=72" }, member: "Sara Hassan", agent: "Lana Aziz", date: "Jun 16, 2026", time: "10:00 AM", status: "Scheduled" },
{ id: "VW-1024", property: { title: "Olive Grove Estate", location: "Barzangarty, Erbil", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=130&q=72" }, member: "Ahmad Karimi", agent: "Karwan Mahmoud", date: "Jun 16, 2026", time: "2:30 PM", status: "Confirmed" },
{ id: "VW-1023", property: { title: "Citadel View Apartment", location: "Downtown, Erbil", img: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=130&q=72" }, member: "Nadia Farid", agent: "Berivan Khalid", date: "Jun 15, 2026", time: "11:00 AM", status: "Completed" },
{ id: "VW-1022", property: { title: "Italian Village Duplex", location: "Italian Village, Erbil", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=130&q=72" }, member: "Zana Rashid", agent: "Sirwan Tofiq", date: "Jun 15, 2026", time: "3:00 PM", status: "Cancelled" },
{ id: "VW-1021", property: { title: "Ankawa Garden Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=130&q=72" }, member: "Hana Bakr", agent: "Diyar Salih", date: "Jun 14, 2026", time: "10:30 AM", status: "No Show" },
{ id: "VW-1020", property: { title: "Gulan Tower Penthouse", location: "Gulan St, Erbil", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=130&q=72" }, member: "Rawa Ahmad", agent: "Lana Aziz", date: "Jun 17, 2026", time: "9:00 AM", status: "Scheduled" },
{ id: "VW-1019", property: { title: "Dream City Villa", location: "Dream City, Erbil", img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=130&q=72" }, member: "Karzan Omar", agent: "Berivan Khalid", date: "Jun 17, 2026", time: "1:00 PM", status: "Confirmed" },
{ id: "VW-1018", property: { title: "Sulaymaniyah Heights", location: "Bakhtiari, Sulaymaniyah", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=130&q=72" }, member: "Vian Mustafa", agent: "Dashne Salar", date: "Jun 13, 2026", time: "2:00 PM", status: "Completed" },
{ id: "VW-1017", property: { title: "Masike Premium Apartment", location: "Masike, Duhok", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=130&q=72" }, member: "Dara Karim", agent: "Diyar Salih", date: "Jun 12, 2026", time: "11:30 AM", status: "Completed" },
{ id: "VW-1016", property: { title: "Ranya Riverside Villa", location: "Ranya, Sulaymaniyah", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=130&q=72" }, member: "Shno Jamal", agent: "Sirwan Tofiq", date: "Jun 18, 2026", time: "3:30 PM", status: "Scheduled" },
{ id: "VW-1015", property: { title: "Downtown Erbil Loft", location: "Downtown, Erbil", img: "https://images.unsplash.com/photo-1576941089067-2de3c901e126?auto=format&fit=crop&w=130&q=72" }, member: "Bnar Salih", agent: "Karwan Mahmoud", date: "Jun 11, 2026", time: "4:00 PM", status: "Cancelled" },
{ id: "VW-1014", property: { title: "Ankawa Luxury Compound", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=130&q=72" }, member: "Peshawa Omer", agent: "Lana Aziz", date: "Jun 10, 2026", time: "10:00 AM", status: "Completed" }];


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
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleCollapse}>
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
      <button type="button" className={"ax-sb-profile" + (open ? " is-open" : "")}
      aria-haspopup="true" aria-expanded={open}
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
        {[{ icon: "user", label: "My profile" }, { icon: "settings", label: "Account settings" }].map((it) =>
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

function Topbar({ layout, openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>
      <div className="ax-tb-search">
        <span className="ax-tb-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>
      <div className="ax-tb-spacer" />
      <div className="ax-tb-actions">
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-btn" + (openMenu === "notif" ? " is-open" : "")}
          aria-label="Notifications" aria-haspopup="true" aria-expanded={openMenu === "notif"}
          onClick={() => toggle("notif")}>
            <Icon name="bell" size={20} /><span className="ax-tb-dot" />
          </button>
          {openMenu === "notif" && <NotifMenu onClose={() => setOpenMenu(null)} />}
        </div>
        <div className="ax-tb-divider" />
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-profile" + (openMenu === "profile" ? " is-open" : "")}
          aria-haspopup="true" aria-expanded={openMenu === "profile"}
          onClick={() => toggle("profile")}>
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

/* ==================================================================
   VIEWINGS — PAGE HEADER
================================================================== */
function ViewingsHeader({ onSchedule }) {
  return (
    <header className="vw-head">
      <div className="vw-head__intro">
        <h1 className="vw-head__title">Viewings</h1>
        <p className="vw-head__sub">Manage property viewing appointments, schedules, and follow-ups.</p>
      </div>
      <div className="vw-head__action">
        <Button hierarchy="primary" size="lg" iconLeading="calendar-plus" onClick={onSchedule}>Schedule viewing</Button>
      </div>
    </header>);

}

function KpiSummary() {
  return (
    <div className="vw-kpis">
      {KPI_CARDS.map((c) =>
      <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
      )}
    </div>);

}

/* ==================================================================
   SCHEDULE VIEWING — MODAL
================================================================== */
/* Rich data for the searchable dropdowns */
const PROPERTIES = [
{ id: "p1", title: "Marble Hill Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=130&q=72" },
{ id: "p2", title: "Olive Grove Estate", location: "Barzangarty, Erbil", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=130&q=72" },
{ id: "p3", title: "Citadel View Apartment", location: "Downtown, Erbil", img: "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&w=130&q=72" },
{ id: "p4", title: "Italian Village Duplex", location: "Italian Village, Erbil", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=130&q=72" },
{ id: "p5", title: "Ankawa Garden Villa", location: "Ankawa, Erbil", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=130&q=72" },
{ id: "p6", title: "Gulan Tower Penthouse", location: "Gulan St, Erbil", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=130&q=72" },
{ id: "p7", title: "Dream City Villa", location: "Dream City, Erbil", img: "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&w=130&q=72" },
{ id: "p8", title: "Sulaymaniyah Heights", location: "Bakhtiari, Sulaymaniyah", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=130&q=72" },
{ id: "p9", title: "Masike Premium Apartment", location: "Masike, Duhok", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=130&q=72" },
{ id: "p10", title: "Ranya Riverside Villa", location: "Ranya, Sulaymaniyah", img: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=130&q=72" }];


const MEMBERS = [
{ id: "m1", name: "Sara Hassan", phone: "+964 750 112 4408", email: "sara.hassan@gmail.com" },
{ id: "m2", name: "Ahmad Karimi", phone: "+964 751 339 7720", email: "a.karimi@outlook.com" },
{ id: "m3", name: "Nadia Farid", phone: "+964 770 884 1196", email: "nadia.farid@gmail.com" },
{ id: "m4", name: "Zana Rashid", phone: "+964 750 226 5531", email: "zana.rashid@yahoo.com" },
{ id: "m5", name: "Hana Bakr", phone: "+964 751 447 9082", email: "hana.bakr@gmail.com" },
{ id: "m6", name: "Rawa Ahmad", phone: "+964 770 559 3317", email: "rawa.ahmad@gmail.com" },
{ id: "m7", name: "Karzan Omar", phone: "+964 750 663 2204", email: "karzan.omar@outlook.com" },
{ id: "m8", name: "Vian Mustafa", phone: "+964 751 778 6649", email: "vian.m@gmail.com" }];


/* Avatars mirror the Agents page — all six are verified agents. */
const AGENTS = [
{ id: "a1", name: "Lana Aziz", phone: "+964 750 901 1245", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&q=80" },
{ id: "a2", name: "Karwan Mahmoud", phone: "+964 751 233 7781", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80" },
{ id: "a3", name: "Dashne Salar", phone: "+964 770 556 2290", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80" },
{ id: "a4", name: "Berivan Khalid", phone: "+964 750 442 8813", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=96&q=80" },
{ id: "a5", name: "Diyar Salih", phone: "+964 751 667 3398", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=80" },
{ id: "a6", name: "Sirwan Tofiq", phone: "+964 770 119 4426", img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=96&q=80" }];

const AGENT_IMG = Object.fromEntries(AGENTS.map((a) => [a.name, a.img]));

const DURATIONS = [
{ value: "30", label: "30 min" },
{ value: "45", label: "45 min" },
{ value: "60", label: "1 hour" },
{ value: "90", label: "1.5 hr" }];

const CONTACT_METHODS = [
{ value: "phone", label: "Phone", icon: "phone" },
{ value: "whatsapp", label: "WhatsApp", icon: "message-circle" },
{ value: "email", label: "Email", icon: "mail" }];


/* Reschedule duration dropdown — full labels per spec */
const RESCHED_DURATIONS = [
{ value: "30", label: "30 minutes" },
{ value: "45", label: "45 minutes" },
{ value: "60", label: "1 hour" },
{ value: "90", label: "1.5 hours" }];


const EMPTY_FORM = {
  property: null, member: null, agent: null,
  date: "", time: "", duration: "60",
  contact: "phone", notes: ""
};

/* ------------------------------------------------------------------
   Combobox — searchable dropdown with rich selected + option states
------------------------------------------------------------------ */
function Combobox({
  id, items, value, onSelect, placeholder, searchPlaceholder,
  filterKeys, renderValue, renderOption, createLabel, onCreate
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  const place = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    setPos({ left: r.left, top: r.bottom + 6, width: r.width, maxH: Math.max(220, below - 24) });
  }, []);

  useEffect(() => {
    if (!open) {setQuery("");return;}
    place();
    const t = setTimeout(() => searchRef.current && searchRef.current.focus(), 30);
    const onScroll = () => place();
    const onResize = () => place();
    const onKey = (e) => {if (e.key === "Escape") {e.stopPropagation();setOpen(false);}};
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, place]);

  const selected = items.find((it) => it.id === value) || null;
  const q = query.trim().toLowerCase();
  const filtered = q ?
  items.filter((it) => filterKeys.some((k) => String(it[k] || "").toLowerCase().includes(q))) :
  items;

  const choose = (it) => {onSelect(it.id);setOpen(false);};

  const panel = open && pos && ReactDOM.createPortal(
    <React.Fragment>
      <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }}
      onMouseDown={() => setOpen(false)} />
      <div className="vw-combo__panel" role="listbox"
      style={{ left: pos.left, top: pos.top, width: pos.width, maxHeight: pos.maxH }}
      onMouseDown={(e) => e.stopPropagation()}>
        <div className="vw-combo__searchbar">
          <Icon name="search" size={17} />
          <input ref={searchRef} type="text" className="vw-combo__searchinput"
          placeholder={searchPlaceholder} value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label={searchPlaceholder} />
        </div>
        <div className="vw-combo__list">
          {filtered.length > 0 ?
          filtered.map((it) =>
          <button key={it.id} type="button" role="option" aria-selected={it.id === value}
          className={"vw-combo__opt" + (it.id === value ? " is-selected" : "")}
          onClick={() => choose(it)}>
                  {renderOption(it)}
                  {it.id === value && <Icon name="check" size={17} className="vw-combo__opt-check" />}
                </button>
          ) :
          <div className="vw-combo__empty">No matches found</div>}
        </div>
        {createLabel &&
        <div className="vw-combo__foot">
            <button type="button" className="vw-combo__create"
          onClick={() => {if (onCreate) onCreate(query);setOpen(false);}}>
              <Icon name="plus" size={17} />
              {query ? <span>Create new member “<b>{query}</b>”</span> : <span>{createLabel}</span>}
            </button>
          </div>
        }
      </div>
    </React.Fragment>,
    document.body
  );

  return (
    <div className="vw-combo">
      <button ref={triggerRef} type="button" id={id}
      className={"vw-combo__trigger" + (open ? " is-open" : "")}
      aria-haspopup="listbox" aria-expanded={open}
      onClick={() => setOpen((o) => !o)}>
        {selected ?
        <span className="vw-combo__value">{renderValue(selected)}</span> :
        <span className="vw-combo__placeholder">{placeholder}</span>}
        <Icon name="chevron-down" size={18} className="vw-combo__chev" />
      </button>
      {panel}
    </div>);

}

function SegControl({ options, value, onChange, ariaLabel }) {
  return (
    <div className="vw-seg" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) =>
      <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
      className={"vw-seg__btn" + (value === o.value ? " is-active" : "")}
      onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}{o.label}
        </button>
      )}
    </div>);

}

/* ==================================================================
   CUSTOM DATE / TIME PICKERS  (replace native inputs)
================================================================== */
function useAnchoredPanel(open, triggerRef, onClose) {
  const [pos, setPos] = useState(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const place = () => {
      if (!triggerRef.current) return;
      const r = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - r.bottom;
      setPos({ left: r.left, top: r.bottom + 6, width: r.width, maxH: Math.max(220, below - 24) });
    };
    place();
    const onScroll = () => place();
    const onResize = () => place();
    const onKey = (e) => {if (e.key === "Escape") {e.stopPropagation();closeRef.current();}};
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, triggerRef]);
  return pos;
}

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WD_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CAL_DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseISODate(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y) return null;
  return new Date(y, m - 1, d);
}
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function fmtDateLabel(s) {
  const d = parseISODate(s);
  if (!d) return null;
  return `${WD_ABBR[d.getDay()]}, ${d.getDate()} ${MONTHS_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtTimeLabel(s) {
  if (!s) return null;
  const [h, m] = s.split(":").map(Number);
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function DatePicker({ id, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));
  const selDate = parseISODate(value);
  const [view, setView] = useState(() => selDate || new Date());

  useEffect(() => {if (open) setView(parseISODate(value) || new Date());}, [open]);

  const today = new Date();today.setHours(0, 0, 0, 0);
  const year = view.getFullYear(),month = view.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const choose = (d) => {onChange(toISODate(d));setOpen(false);};

  const panel = open && pos && ReactDOM.createPortal(
    <React.Fragment>
      <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }}
      onMouseDown={() => setOpen(false)} />
      <div className="vw-pop vw-cal" style={{ left: pos.left, top: pos.top, width: pos.width }}
      onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose date">
        <div className="vw-cal__head">
          <button type="button" className="vw-cal__nav" aria-label="Previous month"
          onClick={() => setView(new Date(year, month - 1, 1))}><Icon name="chevron-left" size={18} /></button>
          <span className="vw-cal__title">{MONTHS_FULL[month]} {year}</span>
          <button type="button" className="vw-cal__nav" aria-label="Next month"
          onClick={() => setView(new Date(year, month + 1, 1))}><Icon name="chevron-right" size={18} /></button>
        </div>
        <div className="vw-cal__grid vw-cal__dow">
          {CAL_DOW.map((w) => <span key={w} className="vw-cal__dowcell">{w}</span>)}
        </div>
        <div className="vw-cal__grid">
          {cells.map((d, i) => {
            if (!d) return <span key={"e" + i} className="vw-cal__pad" />;
            const iso = toISODate(d);
            const past = d < today;
            const cls = "vw-cal__day" + (
            selDate && iso === toISODate(selDate) ? " is-selected" : "") + (
            iso === toISODate(today) ? " is-today" : "") + (
            past ? " is-past" : "");
            return (
              <button key={iso} type="button" className={cls} disabled={past}
              onClick={() => !past && choose(d)}>{d.getDate()}</button>);

          })}
        </div>
      </div>
    </React.Fragment>,
    document.body
  );

  return (
    <div className="vw-combo">
      <button ref={triggerRef} type="button" id={id}
      className={"vw-combo__trigger" + (open ? " is-open" : "")}
      aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {value ?
        <span className="vw-combo__value">{fmtDateLabel(value)}</span> :
        <span className="vw-combo__placeholder">{placeholder}</span>}
        <Icon name="calendar" size={17} className="vw-combo__trail" />
      </button>
      {panel}
    </div>);

}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);
const MERIDIEM = ["AM", "PM"];

function splitTime(value) {
  if (!value) return { h: null, m: null, ap: null };
  const [H, M] = value.split(":").map(Number);
  return { h: H % 12 === 0 ? 12 : H % 12, m: M, ap: H < 12 ? "AM" : "PM" };
}
function composeTime(h, m, ap) {
  if (h == null || m == null || !ap) return "";
  let H = h % 12;
  if (ap === "PM") H += 12;
  return `${String(H).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtDateShort(s) {
  const d = parseISODate(s);
  if (!d) return null;
  return `${MONTHS_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* Compact calendar trigger for the filter bar — mirrors the Properties page */
function FilterDatePicker({ value, onChange, placeholder = "Date" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));
  const selDate = parseISODate(value);
  const [view, setView] = useState(() => selDate || new Date());
  useEffect(() => {if (open) setView(parseISODate(value) || new Date());}, [open]);

  const year = view.getFullYear(),month = view.getMonth();
  const startOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  const todayISO = toISODate(new Date());
  const choose = (d) => {onChange(toISODate(d));setOpen(false);};

  const panel = open && pos && ReactDOM.createPortal(
    <React.Fragment>
      <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }}
      onMouseDown={() => setOpen(false)} />
      <div className="vw-pop vw-cal" style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 264) }}
      onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Filter by date">
        <div className="vw-cal__head">
          <button type="button" className="vw-cal__nav" aria-label="Previous month"
          onClick={() => setView(new Date(year, month - 1, 1))}><Icon name="chevron-left" size={18} /></button>
          <span className="vw-cal__title">{MONTHS_FULL[month]} {year}</span>
          <button type="button" className="vw-cal__nav" aria-label="Next month"
          onClick={() => setView(new Date(year, month + 1, 1))}><Icon name="chevron-right" size={18} /></button>
        </div>
        <div className="vw-cal__grid vw-cal__dow">
          {CAL_DOW.map((w) => <span key={w} className="vw-cal__dowcell">{w}</span>)}
        </div>
        <div className="vw-cal__grid">
          {cells.map((d, i) => {
            if (!d) return <span key={"e" + i} className="vw-cal__pad" />;
            const iso = toISODate(d);
            const cls = "vw-cal__day" + (
            value && iso === value ? " is-selected" : "") + (
            iso === todayISO ? " is-today" : "");
            return (
              <button key={iso} type="button" className={cls}
              onClick={() => choose(d)}>{d.getDate()}</button>);

          })}
        </div>
      </div>
    </React.Fragment>,
    document.body
  );

  return (
    <div className="vw-filterdate-wrap">
      <button ref={triggerRef} type="button"
      className={"vw-filterdate" + (open ? " is-open" : "") + (value ? "" : " is-placeholder")}
      aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="vw-filterdate__label">{value ? fmtDateShort(value) : placeholder}</span>
        {value &&
        <span className="vw-filterdate__clear" role="button" tabIndex={0} aria-label="Clear date"
        onClick={(e) => {e.stopPropagation();onChange("");}}>
            <Icon name="x" size={12} />
          </span>
        }
        <Icon name="calendar" size={15} className="vw-filterdate__icon" />
      </button>
      {panel}
    </div>);

}

function TimePicker({ id, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const hRef = useRef(null),mRef = useRef(null);
  const pos = useAnchoredPanel(open, triggerRef, () => setOpen(false));
  const { h, m, ap } = splitTime(value);

  useEffect(() => {
    if (!open) return;
    [hRef, mRef].forEach((ref) => {
      if (!ref.current) return;
      const el = ref.current.querySelector(".is-selected");
      if (el) ref.current.scrollTop = el.offsetTop - ref.current.clientHeight / 2 + el.clientHeight / 2;
    });
  }, [open]);

  const update = (nh, nm, nap) => {
    const next = composeTime(nh, nm, nap);
    if (next) onChange(next);
  };
  const pickH = (v) => update(v, m == null ? 0 : m, ap || "AM");
  const pickM = (v) => update(h == null ? 12 : h, v, ap || "AM");
  const pickAp = (v) => update(h == null ? 12 : h, m == null ? 0 : m, v);

  const panel = open && pos && ReactDOM.createPortal(
    <React.Fragment>
      <div className="vw-combo__backdrop" style={{ position: "fixed", inset: 0, zIndex: 590 }}
      onMouseDown={() => setOpen(false)} />
      <div className="vw-pop vw-timepop" style={{ left: pos.left, top: pos.top, width: Math.max(pos.width, 236) }}
      onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Choose time">
        <div className="vw-timepop__cols">
          <div className="vw-timepop__col" ref={hRef}>
            <div className="vw-timepop__colhd">Hour</div>
            {HOURS_12.map((v) =>
            <button key={v} type="button" className={"vw-timeopt" + (v === h ? " is-selected" : "")}
            aria-pressed={v === h} onClick={() => pickH(v)}>{v}</button>
            )}
          </div>
          <div className="vw-timepop__col" ref={mRef}>
            <div className="vw-timepop__colhd">Min</div>
            {MINUTES_60.map((v) =>
            <button key={v} type="button" className={"vw-timeopt" + (v === m ? " is-selected" : "")}
            aria-pressed={v === m} onClick={() => pickM(v)}>{String(v).padStart(2, "0")}</button>
            )}
          </div>
          <div className="vw-timepop__col vw-timepop__col--ap">
            <div className="vw-timepop__colhd">AM/PM</div>
            {MERIDIEM.map((v) =>
            <button key={v} type="button" className={"vw-timeopt" + (v === ap ? " is-selected" : "")}
            aria-pressed={v === ap} onClick={() => pickAp(v)}>{v}</button>
            )}
          </div>
        </div>
      </div>
    </React.Fragment>,
    document.body
  );

  return (
    <div className="vw-combo">
      <button ref={triggerRef} type="button" id={id}
      className={"vw-combo__trigger" + (open ? " is-open" : "")}
      aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {value ?
        <span className="vw-combo__value">{fmtTimeLabel(value)}</span> :
        <span className="vw-combo__placeholder">{placeholder}</span>}
        <Icon name="clock" size={17} className="vw-combo__trail" />
      </button>
      {panel}
    </div>);

}

/* Map an existing viewing row → prefilled modal form values */
function viewingToForm(v) {
  const prop = PROPERTIES.find((p) => p.title === v.property.title);
  const mem = MEMBERS.find((m) => m.name === v.member);
  const agt = AGENTS.find((a) => a.name === v.agent);

  let date = "";
  const dm = /^([A-Za-z]+)\s+(\d+),\s*(\d+)$/.exec(v.date || "");
  if (dm) {
    const mi = MONTHS_ABBR.indexOf(dm[1].slice(0, 3));
    if (mi >= 0) date = `${dm[3]}-${String(mi + 1).padStart(2, "0")}-${String(Number(dm[2])).padStart(2, "0")}`;
  }

  let time = "";
  const tm = /^(\d+):(\d+)\s*(AM|PM)$/i.exec(v.time || "");
  if (tm) {
    let H = Number(tm[1]) % 12;
    if (/pm/i.test(tm[3])) H += 12;
    time = `${String(H).padStart(2, "0")}:${tm[2]}`;
  }

  return {
    ...EMPTY_FORM,
    property: prop ? prop.id : null,
    member: mem ? mem.id : null,
    agent: agt ? agt.id : null,
    date, time
  };
}

function ScheduleModal({ open, editViewing, onClose, onSuccess }) {
  const isEdit = !!editViewing;
  const [form, setForm] = useState(EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(editViewing ? viewingToForm(editViewing) : EMPTY_FORM);
  }, [open, editViewing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {if (e.key === "Escape") onClose();};
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const submit = (e) => {
    e.preventDefault();
    onSuccess(isEdit);
    onClose();
  };

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="vw-overlay" onClick={(e) => {if (e.target === e.currentTarget) onClose();}}>
      <div className="vw-modal" role="dialog" aria-modal="true" aria-labelledby="vw-modal-ttl">
        <header className="vw-modal__head">
          <div className="vw-modal__headmain">
            <span className="vw-modal__icon"><Icon name={isEdit ? "pencil" : "calendar-check"} size={22} strokeWidth={1.9} /></span>
            <div className="vw-modal__heading">
              <h2 id="vw-modal-ttl" className="vw-modal__title">{isEdit ? "Edit viewing" : "Schedule viewing"}</h2>
              <p className="vw-modal__desc">{isEdit ? "Update this viewing's details, agent assignment, or schedule." : "Create a property viewing appointment and assign it to an agent."}</p>
            </div>
          </div>
          <button type="button" className="vw-modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={20} />
          </button>
        </header>
        <form className="vw-modal__form" onSubmit={submit}>
          <div className="vw-modal__body">

            {/* ── VIEWING INFORMATION ── */}
            <section className="vw-section">
              <p className="vw-section__label">Viewing information</p>
              <div className="vw-fields">

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="cb-property">Property</label>
                  <Combobox id="cb-property" items={PROPERTIES} value={form.property}
                  onSelect={(v) => set("property", v)}
                  placeholder="Search for a property"
                  searchPlaceholder="Search by title or location…"
                  filterKeys={["title", "location"]}
                  renderValue={(p) =>
                  <span className="vw-combo__prop">
                        <img src={p.img} alt="" />
                        <span className="vw-combo__prop-body">
                          <span className="vw-combo__prop-title">{p.title}</span>
                          <span className="vw-combo__prop-loc"><Icon name="map-pin" size={11} />{p.location}</span>
                        </span>
                      </span>
                  }
                  renderOption={(p) =>
                  <React.Fragment>
                        <img src={p.img} alt="" className="vw-combo__thumb" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{p.title}</span>
                          <span className="vw-combo__opt-meta"><span><Icon name="map-pin" size={11} />{p.location}</span></span>
                        </span>
                      </React.Fragment>
                  } />
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="cb-member">Member</label>
                  <Combobox id="cb-member" items={MEMBERS} value={form.member}
                  onSelect={(v) => set("member", v)}
                  placeholder="Search for a member"
                  searchPlaceholder="Search by name, phone, or email…"
                  filterKeys={["name", "phone", "email"]}
                  createLabel="Create new member"
                  onCreate={() => {}}
                  renderValue={(m) =>
                  <span className="vw-combo__person">
                        <Avatar name={m.name} size="sm" />
                        <span className="vw-combo__person-body">
                          <span className="vw-combo__person-name">{m.name}</span>
                          <span className="vw-combo__person-meta">{m.phone}</span>
                        </span>
                      </span>
                  }
                  renderOption={(m) =>
                  <React.Fragment>
                        <Avatar name={m.name} size="sm" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{m.name}</span>
                          <span className="vw-combo__opt-meta">
                            <span><Icon name="phone" size={11} />{m.phone}</span>
                            <span><Icon name="mail" size={11} />{m.email}</span>
                          </span>
                        </span>
                      </React.Fragment>
                  } />
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="cb-agent">Assigned agent</label>
                  <Combobox id="cb-agent" items={AGENTS} value={form.agent}
                  onSelect={(v) => set("agent", v)}
                  placeholder="Assign an agent"
                  searchPlaceholder="Search agents…"
                  filterKeys={["name", "phone"]}
                  renderValue={(a) =>
                  <span className="vw-combo__person">
                        <Avatar src={a.img} name={a.name} size="sm" />
                        <span className="vw-combo__person-body">
                          <span className="vw-combo__person-name">{a.name}</span>
                          <span className="vw-combo__person-meta"><Icon name="phone" size={11} />{a.phone}</span>
                        </span>
                      </span>
                  }
                  renderOption={(a) =>
                  <React.Fragment>
                        <Avatar src={a.img} name={a.name} size="sm" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{a.name}</span>
                          <span className="vw-combo__opt-meta"><span><Icon name="phone" size={11} />{a.phone}</span></span>
                        </span>
                      </React.Fragment>
                  } />
                </div>

              </div>
            </section>

            {/* ── DATE & TIME ── */}
            <section className="vw-section">
              <p className="vw-section__label">Date &amp; time</p>
              <div className="vw-fields">
                <div className="vw-field-row">
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="vw-date">Viewing date</label>
                    <DatePicker id="vw-date" value={form.date}
                    onChange={(v) => set("date", v)} placeholder="Select date" />
                  </div>
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="vw-time">Viewing time</label>
                    <TimePicker id="vw-time" value={form.time}
                    onChange={(v) => set("time", v)} placeholder="Select time" />
                  </div>
                </div>
                <div className="vw-field">
                  <label className="vw-field__label">Duration</label>
                  <SegControl options={DURATIONS} value={form.duration}
                  onChange={(v) => set("duration", v)} ariaLabel="Viewing duration" />
                </div>
              </div>
            </section>

            {/* ── CONTACT & NOTES ── */}
            <section className="vw-section">
              <p className="vw-section__label">Notes</p>
              <div className="vw-fields">
                <div className="vw-field">
                  <label className="vw-field__label">
                    Notes <span className="vw-optional">(Optional)</span>
                  </label>
                  <textarea className="vw-textarea" rows={3}
                  placeholder="Any special requirements or notes for this viewing…"
                  value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                </div>
              </div>
            </section>

          </div>
          <footer className="vw-modal__foot">
            <Button hierarchy="secondary" size="md" type="button" onClick={onClose}>Cancel</Button>
            <div className="vw-modal__foot-right">
              <Button hierarchy="primary" size="md" iconLeading={isEdit ? "check" : "calendar-check"} type="submit">{isEdit ? "Save changes" : "Schedule viewing"}</Button>
            </div>
          </footer>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   RESCHEDULE VIEWING — MODAL
================================================================== */
/* Map an existing viewing row → prefilled reschedule form values */
function viewingToReschedule(v) {
  const base = viewingToForm(v);
  return {
    date: base.date, time: base.time,
    duration: "60",
    agent: base.agent,
    notify: true,
    reason: ""
  };
}

function DiscardDialog({ onCancel, onDiscard }) {
  return ReactDOM.createPortal(
    <div className="vw-confirm-overlay" onClick={(e) => {if (e.target === e.currentTarget) onCancel();}}>
      <div className="vw-confirm" role="alertdialog" aria-modal="true" aria-labelledby="vw-discard-ttl">
        <span className="vw-confirm__icon"><Icon name="triangle-alert" size={22} strokeWidth={1.9} /></span>
        <h3 id="vw-discard-ttl" className="vw-confirm__title">Discard changes?</h3>
        <p className="vw-confirm__msg">You have unsaved changes. Are you sure you want to leave without saving?</p>
        <div className="vw-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>Continue editing</Button>
          <Button hierarchy="destructive" size="md" type="button" iconLeading="trash-2" onClick={onDiscard}>Discard changes</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function RescheduleModal({ open, viewing, onClose, onSuccess }) {
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const initialRef = useRef(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open && viewing) {
      const init = viewingToReschedule(viewing);
      setForm(init);
      initialRef.current = init;
      setConfirm(false);
    }
  }, [open, viewing]);

  const dirty = !!form && !!initialRef.current &&
  JSON.stringify(form) !== JSON.stringify(initialRef.current);

  const attemptClose = useCallback(() => {
    if (dirty) setConfirm(true);else onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (confirm) {setConfirm(false);return;}
      attemptClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirm, attemptClose]);

  if (!open || !viewing || !form) return null;

  const agentImg = AGENT_IMG[viewing.agent];
  const submit = (e) => {e.preventDefault();onSuccess();onClose();};

  return ReactDOM.createPortal(
    <div className="vw-overlay" onClick={(e) => {if (e.target === e.currentTarget) attemptClose();}}>
      <div className="vw-modal" role="dialog" aria-modal="true" aria-labelledby="vw-resched-ttl">
        <header className="vw-modal__head">
          <div className="vw-modal__headmain">
            <span className="vw-modal__icon"><Icon name="calendar-clock" size={22} strokeWidth={1.9} /></span>
            <div className="vw-modal__heading">
              <h2 id="vw-resched-ttl" className="vw-modal__title">Reschedule viewing</h2>
              <p className="vw-modal__desc">Update the viewing appointment by selecting a new date, time, or assigned agent.</p>
            </div>
          </div>
          <button type="button" className="vw-modal__close" aria-label="Close" onClick={attemptClose}>
            <Icon name="x" size={20} />
          </button>
        </header>

        <form className="vw-modal__form" onSubmit={submit}>
          <div className="vw-modal__body">

            {/* ── CURRENT APPOINTMENT (read-only) ── */}
            <section className="vw-section">
              <p className="vw-section__label">Current appointment</p>
              <div className="vw-summary">
                <div className="vw-summary__top">
                  <img src={viewing.property.img} alt="" className="vw-summary__thumb" />
                  <div className="vw-summary__head">
                    <span className="vw-summary__name">{viewing.property.title}</span>
                    <span className="vw-summary__loc"><Icon name="map-pin" size={12} />{viewing.property.location}</span>
                  </div>
                  <span className="vw-summary__tag"><Icon name="lock" size={12} />{viewing.id}</span>
                </div>
                <div className="vw-summary__grid">
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Member</span>
                    <span className="vw-summary__v">
                      <Avatar name={viewing.member} size="xs" />
                      <span className="vw-summary__vtxt">{viewing.member}</span>
                    </span>
                  </div>
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Assigned agent</span>
                    <span className="vw-summary__v">
                      <Avatar src={agentImg || undefined} name={viewing.agent} size="xs" verified />
                      <span className="vw-summary__vtxt">{viewing.agent}</span>
                    </span>
                  </div>
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Current date</span>
                    <span className="vw-summary__v"><Icon name="calendar" size={14} />{viewing.date}</span>
                  </div>
                  <div className="vw-summary__cell">
                    <span className="vw-summary__k">Current time</span>
                    <span className="vw-summary__v"><Icon name="clock" size={14} />{viewing.time}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── RESCHEDULE DETAILS ── */}
            <section className="vw-section">
              <p className="vw-section__label">Reschedule details</p>
              <div className="vw-fields">
                <div className="vw-field-row">
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="rs-date">Viewing date</label>
                    <DatePicker id="rs-date" value={form.date}
                    onChange={(v) => set("date", v)} placeholder="Select date" />
                  </div>
                  <div className="vw-field">
                    <label className="vw-field__label" htmlFor="rs-time">Viewing time</label>
                    <TimePicker id="rs-time" value={form.time}
                    onChange={(v) => set("time", v)} placeholder="Select time" />
                  </div>
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="rs-duration">Duration</label>
                  <Select id="rs-duration" size="md" value={form.duration}
                  onChange={(e) => set("duration", e.target.value)} options={RESCHED_DURATIONS} />
                </div>

                <div className="vw-field">
                  <label className="vw-field__label" htmlFor="rs-agent">Assigned agent</label>
                  <Combobox id="rs-agent" items={AGENTS} value={form.agent}
                  onSelect={(v) => set("agent", v)}
                  placeholder="Assign an agent"
                  searchPlaceholder="Search agents by name or phone…"
                  filterKeys={["name", "phone"]}
                  renderValue={(a) =>
                  <span className="vw-combo__person">
                        <Avatar src={a.img} name={a.name} size="sm" />
                        <span className="vw-combo__person-body">
                          <span className="vw-combo__person-name">{a.name}</span>
                          <span className="vw-combo__person-meta"><Icon name="phone" size={11} />{a.phone}</span>
                        </span>
                      </span>
                  }
                  renderOption={(a) =>
                  <React.Fragment>
                        <Avatar src={a.img} name={a.name} size="sm" />
                        <span className="vw-combo__opt-body">
                          <span className="vw-combo__opt-title">{a.name}</span>
                          <span className="vw-combo__opt-meta"><span><Icon name="phone" size={11} />{a.phone}</span></span>
                        </span>
                      </React.Fragment>
                  } />
                </div>
              </div>
            </section>

            {/* ── NOTIFICATION ── */}
            <section className="vw-section">
              <p className="vw-section__label">Notification</p>
              <div className={"vw-notify" + (form.notify ? " is-on" : "")}>
                <Checkbox id="rs-notify" checked={form.notify}
                onChange={(e) => set("notify", e.target.checked)}
                label="Notify member"
                description="Send an email and SMS/WhatsApp notification informing the member about the updated viewing schedule." />
              </div>
            </section>

            {/* ── REASON ── */}
            <section className="vw-section">
              <p className="vw-section__label">Reason</p>
              <div className="vw-field">
                <label className="vw-field__label" htmlFor="rs-reason">
                  Reason for rescheduling <span className="vw-optional">(Optional)</span>
                </label>
                <textarea id="rs-reason" className="vw-textarea" rows={3}
                placeholder="e.g. Member requested a different time."
                value={form.reason} onChange={(e) => set("reason", e.target.value)} />
              </div>
            </section>

          </div>

          <footer className="vw-modal__foot">
            <Button hierarchy="secondary" size="md" type="button" onClick={attemptClose}>Cancel</Button>
            <div className="vw-modal__foot-right">
              <Button hierarchy="primary" size="md" iconLeading="check" type="submit">Save changes</Button>
            </div>
          </footer>
        </form>
      </div>

      {confirm &&
      <DiscardDialog onCancel={() => setConfirm(false)} onDiscard={onClose} />
      }
    </div>,
    document.body
  );
}

/* ==================================================================
   ROW ACTION MENU (More button)
================================================================== */
function RowActionMenu({ open, onToggle, onClose, onEdit, onView, onReschedule }) {
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!open || !btnRef.current) {setPos(null);return;}
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 204) });
  }, [open]);

  const menu = pos && ReactDOM.createPortal(
    <div className="vw-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="vw-amenu__sect">
        <button type="button" className="vw-aitem" role="menuitem" onClick={onView}><Icon name="eye" size={16} />View details</button>
        <button type="button" className="vw-aitem" role="menuitem" onClick={onEdit}><Icon name="pencil" size={16} />Edit viewing</button>
        <button type="button" className="vw-aitem" role="menuitem" onClick={onReschedule}><Icon name="calendar-clock" size={16} />Reschedule</button>
      </div>
      <div className="vw-amenu__sect">
        <button type="button" className="vw-aitem vw-aitem--danger" role="menuitem" onClick={onClose}><Icon name="x-circle" size={16} />Cancel viewing</button>
      </div>
    </div>,
    document.body
  );

  return (
    <React.Fragment>
      <button ref={btnRef} type="button"
      className={"vw-act-icon" + (open ? " is-open" : "")}
      aria-label="More actions" aria-haspopup="menu" aria-expanded={open}
      onClick={onToggle}>
        <Icon name="more-horizontal" size={18} />
      </button>
      {open && menu}
    </React.Fragment>);

}

/* ==================================================================
   VIEWING ROW
================================================================== */
function ViewingRow({ v, openMenu, setOpenMenu, onEdit, onView, onReschedule }) {
  const st = VIEWING_STATUS[v.status] || { variant: "neutral", icon: "circle" };
  const city = v.property.location.split(",").pop().trim();
  return (
    <div className="vw-row" role="button" tabIndex={0} style={{ cursor: "pointer" }}
    onClick={() => onView(v)}
    onKeyDown={(e) => {if (e.key === "Enter" || e.key === " ") {e.preventDefault();onView(v);}}}>

      <div className="vw-col--prop">
        <div className="vw-prop">
          <img src={v.property.img} alt={v.property.title} className="vw-prop__thumb" loading="lazy" />
          <div className="vw-prop__body">
            <div className="vw-prop__title">{v.property.title}</div>
            <div className="vw-prop__vid">{v.id}</div>
          </div>
        </div>
      </div>

      <div className="vw-col--loc">
        <span className="vw-celllabel">Location</span>
        <div className="vw-loc"><Icon name="map-pin" size={13} />{city}</div>
      </div>

      <div className="vw-col--member">
        <span className="vw-celllabel">Member</span>
        <div className="vw-person">
          <Avatar name={v.member} size="sm" />
          <span className="vw-person__name">{v.member}</span>
        </div>
      </div>

      <div className="vw-col--agent">
        <span className="vw-celllabel">Agent</span>
        <div className="vw-person">
          <Avatar src={AGENT_IMG[v.agent] || undefined} name={v.agent} size="sm" verified />
          <span className="vw-person__name">{v.agent}</span>
        </div>
      </div>

      <div className="vw-col--dt">
        <span className="vw-celllabel">Date &amp; Time</span>
        <div className="vw-dt">
          <span className="vw-dt__date">{v.date}</span>
          <span className="vw-dt__time"><Icon name="clock" size={11} />{v.time}</span>
        </div>
      </div>

      <div className="vw-col--status">
        <span className="vw-celllabel">Status</span>
        <Badge variant={st.variant} size="sm" icon={st.icon} className={st.cls}>{v.status}</Badge>
      </div>

      <div className="vw-col--acts" onClick={(e) => e.stopPropagation()}>
        <div className="vw-acts">
          <RowActionMenu
            open={openMenu === v.id}
            onToggle={() => setOpenMenu(openMenu === v.id ? null : v.id)}
            onEdit={() => onEdit(v)}
            onView={() => onView(v)}
            onReschedule={() => onReschedule(v)}
            onClose={() => setOpenMenu(null)} />
        </div>
      </div>

    </div>);

}

/* ==================================================================
   VIEWINGS TABLE
================================================================== */
function NoResults() {
  return (
    <div className="vw-empty">
      <span className="vw-empty__art"><Icon name="calendar-x" size={26} strokeWidth={1.6} /></span>
      <h3>No viewings found</h3>
      <p>Try adjusting your search or clearing the filters to see more viewings.</p>
    </div>);

}

function ViewingsTable({ rows, openMenu, setOpenMenu, onEdit, onView, onReschedule }) {
  return (
    <div className="vw-table">
      <div className="vw-thead" role="row">
        <span className="vw-th vw-col--prop">Property</span>
        <span className="vw-th vw-col--loc">Location</span>
        <span className="vw-th vw-col--member">Member</span>
        <span className="vw-th vw-col--agent">Agent</span>
        <span className="vw-th vw-col--dt">Date &amp; Time</span>
        <span className="vw-th vw-col--status">Status</span>
        <span className="vw-th vw-col--acts">Actions</span>
      </div>
      {rows.length > 0 ?
      rows.map((v) => <ViewingRow key={v.id} v={v} openMenu={openMenu} setOpenMenu={setOpenMenu} onEdit={onEdit} onView={onView} onReschedule={onReschedule} />) :
      <NoResults />}
    </div>);

}

/* ==================================================================
   VIEWINGS PANEL (table card head: title + count + search + filters)
================================================================== */
const EMPTY_FILTERS = { q: "", status: "", agent: "", property: "", dateRange: "" };

function ViewingsPanel({ filters, setFilter, onClear, hasActive, rows }) {
  const opt = (arr) => arr.map((v) => ({ value: v, label: v }));
  const shown = hasActive ? rows.length : TOTAL_VIEWINGS;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeAdvCount = [filters.agent, filters.property, filters.dateRange].filter(Boolean).length;
  return (
    <header className="vw-tablecard__head">
      <div className="vw-tablecard__titlerow">
        <div className="vw-tablecard__heading">
          <h2 className="vw-tablecard__title">All viewings</h2>
          <span className="vw-tablecard__count">{shown.toLocaleString("en-US")}</span>
        </div>
        {hasActive &&
        <div className="vw-tablecard__resultnote">
            Showing <b>{rows.length}</b> of {TOTAL_VIEWINGS.toLocaleString("en-US")} viewings
          </div>
        }
      </div>

      <div className="vw-tabrow">
        <div className="vw-tabs" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) =>
          <button key={tab.id} type="button" role="tab"
          aria-selected={filters.status === tab.id}
          className={"vw-tab" + (filters.status === tab.id ? " is-active" : "")}
          onClick={() => setFilter("status", tab.id)}>
              {tab.label}
            </button>
          )}
        </div>
        <div className="vw-tabrow__right">
          <div className="vw-tabsearch">
            <span className="vw-tabsearch__lead"><Icon name="search" size={16} /></span>
            <input type="text" value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
            placeholder="Search viewings…"
            aria-label="Search viewings" />
          </div>
          <button type="button"
          className={"vw-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")}
          aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
            <Icon name="sliders-horizontal" size={15} />
            Filters
            {activeAdvCount > 0 && <span className="vw-filterbtn__badge">{activeAdvCount}</span>}
          </button>
        </div>
      </div>

      <div className={"vw-filterbar" + (filtersOpen ? " is-open" : "")}>
        <div className="vw-filterbar__inner">
          <div className="vw-filterbar__row">
            <Select size="md" value={filters.agent} onChange={(e) => setFilter("agent", e.target.value)}
            options={[{ value: "", label: "Agent" }, ...opt(AGENTS_LIST)]} />
            <Select size="md" value={filters.property} onChange={(e) => setFilter("property", e.target.value)}
            options={[{ value: "", label: "Property" }, ...opt(PROPS_LIST)]} />
            <FilterDatePicker value={filters.dateRange} onChange={(v) => setFilter("dateRange", v)} placeholder="Date" />
            <div className="vw-filterbar__actions">
              <button type="button" className="vw-clearbtn" onClick={onClear}>
                <Icon name="x" size={14} />Clear all
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>);

}

/* ==================================================================
   TOAST
================================================================== */
const TOAST_DUR = 6000;
function Toast({ toast, onDismiss }) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  const close = useCallback(() => {
    clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(onDismiss, 340);
  }, [onDismiss]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    timer.current = setTimeout(close, TOAST_DUR);
    return () => clearTimeout(timer.current);
  }, [close]);

  const pause = () => clearTimeout(timer.current);
  const resume = () => {timer.current = setTimeout(close, TOAST_DUR);};

  const cls = ["vw-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  return ReactDOM.createPortal(
    <div className="vw-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" onMouseEnter={pause} onMouseLeave={resume}>
        <span className="vw-toast__icon"><Icon name="check" size={20} strokeWidth={2.5} /></span>
        <div className="vw-toast__body">
          <p className="vw-toast__title">{toast.title}</p>
          <p className="vw-toast__msg">{toast.message}</p>
          <div className="vw-toast__actions">
            <button type="button" className="vw-toast__btn vw-toast__btn--dismiss" onClick={close}>Dismiss</button>
            <button type="button" className="vw-toast__btn vw-toast__btn--view" onClick={close}>View details</button>
          </div>
        </div>
        <button type="button" className="vw-toast__close" aria-label="Dismiss" onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="vw-toast__progress" />
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   VIEWINGS PAGE
================================================================== */
function ViewingsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editViewing, setEditViewing] = useState(null);
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedView, setReschedView] = useState(null);
  const [toast, setToast] = useState(null);

  const openView = (v) => {
    setOpenMenu(null);
    try {localStorage.setItem("chiya:viewing", v.id);} catch (e) {}
    window.location.href = "Admin-Viewing Details.html";
  };
  const openSchedule = () => {setEditViewing(null);setModalOpen(true);};
  const openEdit = (v) => {setOpenMenu(null);setEditViewing(v);setModalOpen(true);};
  const closeModal = () => {setModalOpen(false);setTimeout(() => setEditViewing(null), 300);};
  const openReschedule = (v) => {setOpenMenu(null);setReschedView(v);setReschedOpen(true);};
  const closeReschedule = () => {setReschedOpen(false);setTimeout(() => setReschedView(null), 300);};

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters(EMPTY_FILTERS);
  const hasActive = Object.values(filters).some(Boolean);

  const handleScheduled = (isEdit) => setToast(isEdit ?
  { title: "Viewing Updated Successfully", message: "The viewing details have been saved and the schedule refreshed." } :
  { title: "Viewing Scheduled Successfully", message: "The viewing appointment has been created and added to the schedule." });

  const handleRescheduled = () => setToast({
    title: "Viewing Rescheduled Successfully",
    message: "The viewing has been updated and the participant has been notified."
  });

  /* close row-action menus on scroll */
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return VIEWINGS.filter((v) => {
      if (filters.status && v.status !== filters.status) return false;
      if (filters.agent && v.agent !== filters.agent) return false;
      if (filters.property && v.property.title !== filters.property) return false;
      if (filters.dateRange && v.date !== fmtDateShort(filters.dateRange)) return false;
      if (q) {
        const hay = [v.id, v.property.title, v.member, v.agent].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <React.Fragment>
      <ViewingsHeader onSchedule={openSchedule} />
      <KpiSummary />

      <section className="vw-tablecard">
        <ViewingsPanel
          filters={filters} setFilter={setFilter}
          onClear={clear} hasActive={hasActive} rows={rows} />
        <ViewingsTable rows={rows} openMenu={openMenu} setOpenMenu={setOpenMenu} onEdit={openEdit} onView={openView} onReschedule={openReschedule} />
      </section>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      <ScheduleModal open={modalOpen} editViewing={editViewing} onClose={closeModal} onSuccess={handleScheduled} />
      <RescheduleModal open={reschedOpen} viewing={reschedView} onClose={closeReschedule} onSuccess={handleRescheduled} />
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
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
  const [active, setActive] = useState("viewings");
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
        <Topbar layout={layout} openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        }
        {!showTopbar &&
        <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        }
        <main className="ax-content" data-screen-label="Admin · Viewings">
          {active === "viewings" ?
          <ViewingsPage /> :

          <div className="ax-empty">
                <div className="ax-empty__art">
                  <Icon name="calendar-check" size={44} strokeWidth={1.5} />
                  <span className="ax-empty__badge"><Icon name="arrow-right" size={20} strokeWidth={2.25} /></span>
                </div>
                <h2>{title}</h2>
                <p>This module isn't part of this prototype. Head back to Viewings to manage appointments.</p>
                <div className="ax-empty__actions">
                  <Button hierarchy="primary" size="lg" iconLeading="calendar-check" onClick={() => handleSelect("viewings")}>Open viewings</Button>
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