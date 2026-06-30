/* ==================================================================
   MEMBER PROFILE — CORE
   Admin shell (sidebar/topbar), member dataset, shared modals + toast.
   Everything is exported to window for the page script.
================================================================== */
const { useState, useEffect, useRef, useCallback } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge } = DS;

const LOGO = "assets/chiya-logomark.svg";

/* ------------------------------------------------------------------
   SHELL DATA  (matches the approved admin shell)
------------------------------------------------------------------ */
const NAV_GROUPS = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard" }] },
  { label: "Management", items: [
    { id: "properties", label: "Properties", icon: "building-2" },
    { id: "members", label: "Members", icon: "users" },
    { id: "agents", label: "Agents", icon: "badge-check" },
    { id: "viewings", label: "Viewings", icon: "calendar-check" },
    { id: "locations", label: "Locations", icon: "map-pin" }] },
  { label: "Platform", items: [
    { id: "reports", label: "Reports", icon: "chart-column" },
    { id: "roles", label: "Roles & permissions", icon: "key-round" },
    { id: "settings", label: "Settings", icon: "settings" }] }];

const NAV_FLAT = NAV_GROUPS.flatMap((g) => g.items);

const PAGE_MAP = {
  dashboard: "Admin-Dashboard page.html",
  properties: "Admin-Properties Page.html",
  members: "Admin-Members Page.html",
  agents: "Admin-Agents Page.html",
  viewings: "Admin-Viewings Page.html",
  locations: "Admin-Locations Page.html",
  reports: "Admin-Reports Page.html",
  roles: "Admin-Roles & permissions page.html"
};
const PROPERTY_DETAILS = "Admin-Property Details.html";
const AGENTS_PAGE = "Admin-Agents Page.html";

const NOTIFICATIONS = [
  { id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
  { id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
  { id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
  { id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" }];

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };

/* ------------------------------------------------------------------
   SHARED BADGE META
------------------------------------------------------------------ */
const ROLE_META = {
  "Buyer": { variant: "info" },
  "Seller": { variant: "success" },
  "Landlord": { variant: "neutral" },
  "Tenant": { variant: "brand" }
};
const PROP_STATUS_META = {
  "Published": { variant: "success", dot: true },
  "Sold": { variant: "error", dot: true },
  "Rented": { variant: "info", dot: true },
  "Pending": { variant: "warning", dot: true },
  "Archived": { variant: "neutral", icon: "archive" }
};
/* match the Viewings page table badges: icon + vw-st-- color class */
const VIEW_STATUS_META = {
  "Pending":   { variant: "warning", icon: "clock",          cls: "vw-st--pending"   },
  "Confirmed": { variant: "success", icon: "calendar-check", cls: "vw-st--confirmed" },
  "Completed": { variant: "brand",   icon: "check-check",    cls: "vw-st--completed" },
  "Cancelled": { variant: "error",   icon: "x-circle",       cls: "vw-st--cancelled" }
};
const INQUIRY_STATUS_META = {
  "New": { variant: "brand", dot: true },
  "Responded": { variant: "success", dot: true },
  "Closed": { variant: "neutral", dot: true }
};

/* ------------------------------------------------------------------
   MEMBER DATASET  (a full multi-role member — Buyer/Seller/Landlord/Tenant)
------------------------------------------------------------------ */
const AGENT = {
  name: "Lana Aziz", verified: true,
  phone: "+964 751 880 2200", email: "lana.aziz@mail.chiya.estate",
  img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=70",
  agency: "Chiya Premier", listings: 14, rating: "4.9", reviews: 87
};

const MEMBER = {
  id: "MEM-2041",
  name: "Ahmed Karim",
  status: "Active",
  types: ["Buyer", "Seller", "Landlord"],
  joinedShort: "Jan 2026",
  joinedFull: "January 14, 2026",
  email: "ahmed.karim@gmail.com",
  phone: "+964 750 441 7788",
  language: "Kurdish (Sorani)",
  contactMethod: "Phone call",
  img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=75",
  agent: AGENT
};

const KPIS = [
  { key: "listed", label: "Properties Listed", value: "4", icon: "building-2", tone: "brand" },
  { key: "sold", label: "Properties Sold", value: "2", icon: "badge-check", tone: "success" },
  { key: "rental", label: "Rental Properties", value: "3", icon: "key-round", tone: "gold" },
  { key: "purchased", label: "Properties Purchased", value: "1", icon: "circle-check", tone: "info" },
  { key: "activeRentals", label: "Active Rentals", value: "2", icon: "home", tone: "brand" },
  { key: "saved", label: "Saved Properties", value: "6", icon: "heart", tone: "gold" },
  { key: "viewings", label: "Viewing Requests", value: "5", icon: "calendar-check", tone: "info" },
  { key: "inquiries", label: "Inquiries", value: "8", icon: "message-circle", tone: "success" }];

const TH = (w) => "https://images.unsplash.com/" + w + "?auto=format&fit=crop&w=160&q=70";

const PORTFOLIO = [
  { id: "CH-2041", title: "Olive Grove Estate", loc: "Ankawa, Erbil", img: TH("photo-1613490493576-7fde63acd811"),
    rel: "Seller", status: "Published", price: "$1,200,000", agent: "Lana Aziz", date: "Jun 12, 2026" },
  { id: "CH-2035", title: "Cedar Court Residence", loc: "Italian Village, Erbil", img: TH("photo-1568605114967-8130f3a36994"),
    rel: "Seller", status: "Sold", price: "$845,000", agent: "Sara Hama", date: "Jun 6, 2026" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"),
    rel: "Buyer", status: "Sold", price: "$980,000", agent: "Lana Aziz", date: "May 30, 2026" },
  { id: "CH-2022", title: "Park View Loft", loc: "Salim Street, Sulaymaniyah", img: TH("photo-1502672260266-1c1ef2d93688"),
    rel: "Landlord", status: "Rented", price: "$1,100", per: "/mo", agent: "Hawre Ako", date: "May 28, 2026" },
  { id: "CH-2017", title: "Empire Tower Suite", loc: "Empire World, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"),
    rel: "Landlord", status: "Published", price: "$1,650", per: "/mo", agent: "Lana Aziz", date: "May 21, 2026" },
  { id: "CH-2008", title: "Lakeside Apartment", loc: "Dukan, Sulaymaniyah", img: TH("photo-1560448204-e02f11c3d0e2"),
    rel: "Buyer", status: "Pending", price: "$365,000", agent: "Lana Aziz", date: "Jun 15, 2026" }];

const SAVED = [
  { id: "CH-2038", title: "Marble Hill Villa", loc: "Empire World, Erbil", img: TH("photo-1600596542815-ffad4c1539a9"), price: "$620,000", saved: "Jun 16, 2026" },
  { id: "CH-2026", title: "Goizha Mountain House", loc: "Goizha, Sulaymaniyah", img: TH("photo-1599809275671-b5942cabc7a2"), price: "$540,000", saved: "Jun 10, 2026" },
  { id: "CH-2014", title: "Zagros Garden Townhouse", loc: "Masif, Duhok", img: TH("photo-1576941089067-2de3c901e126"), price: "$410,000", saved: "Jun 3, 2026" },
  { id: "CH-2031", title: "Tigris View Apartment", loc: "Dream City, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"), price: "$1,800", per: "/mo", saved: "May 27, 2026" },
  { id: "CH-2009", title: "Citadel Heights Land", loc: "Qalat, Erbil", img: TH("photo-1500382017468-9049fed747ef"), price: "$290,000", saved: "May 19, 2026" },
  { id: "CH-2018", title: "Family Mall Office Suite", loc: "100m Road, Erbil", img: TH("photo-1497366754035-f200968a6e72"), price: "$3,200", per: "/mo", saved: "May 12, 2026" }];

const VIEWINGS = [
  { id: "CH-2038", title: "Marble Hill Villa", loc: "Empire World, Erbil", img: TH("photo-1600596542815-ffad4c1539a9"), requested: "Jun 24, 2026 · 14:00", agent: "Ahmed Karim", status: "Confirmed" },
  { id: "CH-2026", title: "Goizha Mountain House", loc: "Goizha, Sulaymaniyah", img: TH("photo-1599809275671-b5942cabc7a2"), requested: "Jun 22, 2026 · 11:30", agent: "Lana Aziz", status: "Pending" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"), requested: "Jun 8, 2026 · 16:00", agent: "Lana Aziz", status: "Completed" },
  { id: "CH-2014", title: "Zagros Garden Townhouse", loc: "Masif, Duhok", img: TH("photo-1576941089067-2de3c901e126"), requested: "Jun 5, 2026 · 10:00", agent: "Sara Hama", status: "Completed" },
  { id: "CH-2009", title: "Citadel Heights Land", loc: "Qalat, Erbil", img: TH("photo-1500382017468-9049fed747ef"), requested: "May 30, 2026 · 13:00", agent: "Diyar Salih", status: "Cancelled" }];

const INQUIRIES = [
  { id: "CH-2038", title: "Marble Hill Villa", loc: "Empire World, Erbil", img: TH("photo-1600596542815-ffad4c1539a9"), type: "Price negotiation", date: "Jun 17, 2026", status: "Responded" },
  { id: "CH-2008", title: "Lakeside Apartment", loc: "Dukan, Sulaymaniyah", img: TH("photo-1560448204-e02f11c3d0e2"), type: "Purchase offer", date: "Jun 15, 2026", status: "New" },
  { id: "CH-2026", title: "Goizha Mountain House", loc: "Goizha, Sulaymaniyah", img: TH("photo-1599809275671-b5942cabc7a2"), type: "Schedule viewing", date: "Jun 9, 2026", status: "Responded" },
  { id: "CH-2018", title: "Family Mall Office Suite", loc: "100m Road, Erbil", img: TH("photo-1497366754035-f200968a6e72"), type: "Availability", date: "May 24, 2026", status: "Closed" },
  { id: "CH-2031", title: "Tigris View Apartment", loc: "Dream City, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"), type: "General question", date: "May 20, 2026", status: "Closed" }];

const INIT_NOTES = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 16, 2026 · 10:18", kind: "review",
    text: "High-value member managing both sale and rental portfolios. Verified ID and ownership documents on file. Eligible for the premium concierge tier." },
  { author: "Lana Aziz", role: "Agent", time: "Jun 11, 2026 · 15:42", kind: "note",
    text: "Spoke with Ahmed about listing the Olive Grove Estate. He prefers phone contact in the afternoons and responds quickly. Photography for the villa is scheduled." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jan 14, 2026 · 09:05", kind: "approval",
    text: "Account approved and onboarded. Assigned Lana Aziz as the primary relationship agent." }];

const TIMELINE = [
  { icon: "shopping-bag", tone: "info", title: "Inquiry submitted", desc: "Purchase offer sent for Lakeside Apartment.", time: "Jun 17, 2026" },
  { icon: "calendar-plus", tone: "brand", title: "Viewing requested", desc: "Requested a viewing for Marble Hill Villa.", time: "Jun 16, 2026" },
  { icon: "heart", tone: "gold", title: "Property saved", desc: "Saved Marble Hill Villa to favourites.", time: "Jun 16, 2026" },
  { icon: "building-2", tone: "brand", title: "Property listed", desc: "Listed Olive Grove Estate for sale at $1,200,000.", time: "Jun 12, 2026" },
  { icon: "key", tone: "error", title: "Property sold", desc: "Cedar Court Residence sold for $845,000.", time: "Jun 6, 2026" },
  { icon: "circle-check", tone: "success", title: "Property purchased", desc: "Completed purchase of Naz City Penthouse.", time: "May 30, 2026" },
  { icon: "key-round", tone: "info", title: "Property rented", desc: "Park View Loft rented out at $1,100/mo.", time: "May 28, 2026" },
  { icon: "user-check", tone: "brand", title: "Agent assigned", desc: "Lana Aziz assigned as the relationship agent.", time: "Jan 14, 2026" },
  { icon: "user-plus", tone: "neutral", title: "Account created", desc: "Member registered on Chiya Estate.", time: "Jan 14, 2026" }];

const REASSIGN_AGENTS = [
  AGENT,
  { name: "Ahmed Karim", verified: true, phone: "+964 750 441 7788", email: "ahmed.karim@mail.chiya.estate", img: TH("photo-1507003211169-0a1dd7228f2d") },
  { name: "Sara Hama", verified: true, phone: "+964 770 220 9911", email: "sara.hama@mail.chiya.estate", img: TH("photo-1438761681033-6461ffad8d80") },
  { name: "Rawa Jalal", verified: true, phone: "+964 751 330 6655", email: "rawa.jalal@mail.chiya.estate", img: TH("photo-1500648767791-00dcc994a43e") },
  { name: "Hawre Ako", verified: true, phone: "+964 770 118 9090", email: "hawre.ako@mail.chiya.estate", img: TH("photo-1506794778202-cad84cf45f1d") }];

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
    </button>);
}

function Sidebar({ collapsed, drawerOpen, active, onSelect, onToggleCollapse }) {
  const cls = ["ax-sidebar", collapsed ? "is-collapsed" : "", drawerOpen ? "is-drawer-open" : ""].filter(Boolean).join(" ");
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
      <nav className="ax-nav">
        {NAV_GROUPS.map((g) =>
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map((it) =>
              <NavItem key={it.id} item={it} active={active === it.id} collapsed={collapsed} onSelect={onSelect} />)}
          </div>)}
      </nav>
    </aside>);
}

/* ==================================================================
   TOPBAR
================================================================== */
function ProfileMenu({ onClose }) {
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
          </button>)}
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onClose}>
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
          </div>)}
      </div>
      <div className="ax-menu__foot">
        <Button hierarchy="secondary" size="sm" onClick={onClose}>Mark all as read</Button>
      </div>
    </div>);
}

function Topbar({ openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>
      <div className="ax-tb-search ax-tb-search--lead">
        <span className="ax-tb-search__lead"><Icon name="search" size={18} /></span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>
      <div className="ax-tb-spacer" />
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
          {openMenu === "profile" && <ProfileMenu onClose={() => setOpenMenu(null)} />}
        </div>
      </div>
    </header>);
}

/* ==================================================================
   MODALS — Change status / Assign agent / Delete
================================================================== */
const STATUS_DOT = { Active: "var(--success-500)", Suspended: "var(--error-500)" };

function ChangeStatusModal({ current, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const options = ["Active", "Suspended"];
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const canConfirm = selected && selected !== current;
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="status-modal-title">
        <div className="pp-modal__icon pp-modal__icon--status"><Icon name="refresh-cw" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="status-modal-title">Change member status</h2>
        <p className="pp-modal__sublabel">Select new status</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 22 }}>
          {options.map((s) =>
            <button key={s} type="button" className={"pp-smodal__item" + (selected === s ? " is-selected" : "")}
              onClick={() => setSelected(s)}>
              <span className="pp-smodal__dot" style={{ background: STATUS_DOT[s] }} />
              <span className="pp-smodal__label">{s}</span>
              <span className="pp-smodal__spacer" />
              {current === s && <span className="pp-amodal__current-tag">Current</span>}
              {selected === s && <span className="pp-smodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
            </button>)}
        </div>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className={"pp-modal__confirm" + (selected === "Suspended" ? " pp-modal__confirm--warn" : "")} disabled={!canConfirm} onClick={() => onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />Change status
          </button>
        </div>
      </div>
    </div>,
    document.body);
}

function AssignAgentModal({ current, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { if (dropOpen) setDropOpen(false); else onCancel(); } };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel, dropOpen]);
  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  const toggleDrop = () => { if (!dropOpen) calcPos(); setDropOpen((v) => !v); };
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
  const selectedAgent = selected ? REASSIGN_AGENTS.find((a) => a.name === selected) : null;
  const canConfirm = selected && selected !== current;
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="agent-modal-title">
        <div className="pp-modal__icon pp-modal__icon--assign"><Icon name="user-cog" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="agent-modal-title">Reassign relationship agent</h2>
        <p className="pp-modal__sublabel">Select new agent</p>
        <button ref={triggerRef} type="button" className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")} onClick={toggleDrop}>
          {selectedAgent ?
            <React.Fragment>
              <Avatar src={selectedAgent.img} name={selectedAgent.name} size="sm" verified={selectedAgent.verified} />
              <span className="pp-amodal__trigger-name">{selectedAgent.name}</span>
            </React.Fragment> :
            <span className="pp-amodal__trigger-placeholder"><Icon name="user" size={16} />Choose an agent…</span>}
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>
        {dropOpen && dropPos && ReactDOM.createPortal(
          <div className="pp-amodal__drop" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {REASSIGN_AGENTS.map((agent) =>
              <button key={agent.name} type="button" className={"pp-amodal__agent" + (selected === agent.name ? " is-selected" : "")}
                onClick={() => { setSelected(agent.name); setDropOpen(false); }}>
                <Avatar src={agent.img} name={agent.name} size="sm" verified={agent.verified} />
                <span className="pp-amodal__agent-name">{agent.name}</span>
                {current === agent.name && <span className="pp-amodal__current-tag">Current</span>}
                {selected === agent.name && <span className="pp-amodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
              </button>)}
          </div>,
          document.body)}
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__confirm" disabled={!canConfirm}
            onClick={() => onConfirm(REASSIGN_AGENTS.find((a) => a.name === selected))}>
            <Icon name="user-check" size={15} />Reassign agent
          </button>
        </div>
      </div>
    </div>,
    document.body);
}

function DeleteMemberModal({ member, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
        <div className="pp-modal__icon"><Icon name="trash-2" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="del-modal-title">Delete member?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete <strong>{member.name}</strong>? This action cannot be undone and will permanently remove the account and its history.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}><Icon name="trash-2" size={15} />Delete member</button>
        </div>
      </div>
    </div>,
    document.body);
}

/* ==================================================================
   TOAST
================================================================== */
function ProfToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const iconCls = "pp-toast__icon" + (toast.tone === "danger" ? " pp-toast__icon--danger" : toast.tone === "brand" ? " pp-toast__icon--brand" : "");
  return (
    <div className={`pp-toast${toast.tone === "danger" ? " pp-toast--danger" : ""}${visible && !toast.out ? " is-in" : ""}${toast.out ? " is-out" : ""}`}>
      <span className={iconCls}><Icon name={toast.icon} size={20} strokeWidth={2.25} /></span>
      <div className="pp-toast__body">
        <p className="pp-toast__title">{toast.title}</p>
        <p className="pp-toast__msg">{toast.msg}</p>
      </div>
      <button type="button" className="pp-toast__close" aria-label="Close" onClick={onDismiss}><Icon name="x" size={16} strokeWidth={2} /></button>
      <div className="pp-toast__progress" />
    </div>);
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = (toast) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => t.id === id ? { ...t, out: true } : t)), 5000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5380);
  };
  const dismiss = (id) => {
    setToasts((ts) => ts.map((t) => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  };
  return [toasts, push, dismiss];
}

/* ------------------------------------------------------------------
   EXPORT
------------------------------------------------------------------ */
Object.assign(window, {
  MPF_DS: DS, MPF_LOGO: LOGO,
  MPF_NAV_FLAT: NAV_FLAT, MPF_PAGE_MAP: PAGE_MAP,
  MPF_PROPERTY_DETAILS: PROPERTY_DETAILS, MPF_AGENTS_PAGE: AGENTS_PAGE,
  MPF_MEMBER: MEMBER, MPF_KPIS: KPIS,
  MPF_PORTFOLIO: PORTFOLIO, MPF_SAVED: SAVED, MPF_VIEWINGS: VIEWINGS, MPF_INQUIRIES: INQUIRIES,
  MPF_INIT_NOTES: INIT_NOTES, MPF_TIMELINE: TIMELINE,
  MPF_ROLE_META: ROLE_META, MPF_PROP_STATUS_META: PROP_STATUS_META,
  MPF_VIEW_STATUS_META: VIEW_STATUS_META, MPF_INQUIRY_STATUS_META: INQUIRY_STATUS_META,
  MPF_Sidebar: Sidebar, MPF_Topbar: Topbar,
  MPF_ChangeStatusModal: ChangeStatusModal, MPF_AssignAgentModal: AssignAgentModal, MPF_DeleteMemberModal: DeleteMemberModal,
  MPF_ProfToast: ProfToast, MPF_useToasts: useToasts
});
