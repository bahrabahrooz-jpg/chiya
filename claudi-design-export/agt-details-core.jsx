/* ==================================================================
   AGENT DETAILS — CORE
   Admin shell (sidebar/topbar), agent dataset, shared modals + toast.
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
const MEMBER_PROFILE = "Admin-Member Profile.html";
const PUBLIC_PROFILE = "Website-Agent Profile.html";

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
const LISTING_STATUS_META = {
  "Published": { variant: "success", dot: true },
  "Sold": { variant: "error", dot: true },
  "Rented": { variant: "info", dot: true },
  "Pending": { variant: "warning", dot: true }
};
const LISTING_TYPE_META = {
  "For sale": { variant: "success" },
  "For rent": { variant: "info" }
};
const MEMBER_STATUS_META = {
  "Active": { variant: "success", dot: true },
  "Inactive": { variant: "neutral", dot: true }
};
const VIEW_STATUS_META = {
  "Pending": { variant: "warning", dot: true },
  "Confirmed": { variant: "info", dot: true },
  "Completed": { variant: "success", dot: true },
  "Cancelled": { variant: "neutral", dot: true }
};

/* ------------------------------------------------------------------
   AGENT DATASET  (Lana Aziz — A-2041, full admin record)
------------------------------------------------------------------ */
const AGENT = {
  id: "A-2041",
  name: "Lana Aziz",
  title: "Senior Property Consultant",
  agency: "Chiya Prime",
  status: "Active",
  verification: "Verified",
  joinedShort: "Mar 2023",
  joinedFull: "March 12, 2023",
  phone: "+964 770 552 1190",
  email: "lana.aziz@chiya.estate",
  experience: 8,
  languages: ["Kurdish", "English", "Arabic"],
  areas: ["Ankawa", "Dream City", "Italian Village", "Empire World"],
  rating: 4.9,
  reviews: 64,
  img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=75"
};

/* performance summary KPIs */
const KPIS = [
  { key: "active", label: "Active listings", value: "14", icon: "building-2", tone: "brand", sub: "Currently published" },
  { key: "sold", label: "Sold properties", value: "32", icon: "badge-check", tone: "success", sub: "All-time closed sales" },
  { key: "rented", label: "Rented properties", value: "19", icon: "key-round", tone: "gold", sub: "All-time rentals" },
  { key: "viewings", label: "Total viewings", value: "148", icon: "calendar-check", tone: "info", sub: "Hosted to date" },
  { key: "conv", label: "Conversion rate", value: "38%", icon: "trending-up", tone: "brand", sub: "Viewings to deals" }];

const TH = (w) => "https://images.unsplash.com/" + w + "?auto=format&fit=crop&w=160&q=70";

/* assigned listings */
const LISTINGS = [
  { id: "CH-2041", title: "Olive Grove Estate", loc: "Ankawa, Erbil", img: TH("photo-1613490493576-7fde63acd811"),
    type: "For sale", status: "Published", price: "$1,200,000", date: "Jun 12, 2026" },
  { id: "CH-2017", title: "Empire Tower Suite", loc: "Empire World, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"),
    type: "For rent", status: "Published", price: "$1,650", per: "/mo", date: "Jun 4, 2026" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"),
    type: "For sale", status: "Sold", price: "$980,000", date: "May 30, 2026" },
  { id: "CH-2008", title: "Lakeside Apartment", loc: "Dukan, Sulaymaniyah", img: TH("photo-1560448204-e02f11c3d0e2"),
    type: "For sale", status: "Pending", price: "$365,000", date: "May 22, 2026" },
  { id: "CH-2022", title: "Park View Loft", loc: "Dream City, Erbil", img: TH("photo-1502672260266-1c1ef2d93688"),
    type: "For rent", status: "Rented", price: "$1,100", per: "/mo", date: "May 18, 2026" },
  { id: "CH-2035", title: "Cedar Court Residence", loc: "Italian Village, Erbil", img: TH("photo-1568605114967-8130f3a36994"),
    type: "For sale", status: "Published", price: "$845,000", date: "May 9, 2026" }];

/* assigned members */
const MEMBERS = [
  { id: "MEM-2041", name: "Ahmed Karim", phone: "+964 750 441 7788", img: TH("photo-1507003211169-0a1dd7228f2d"),
    roles: ["Buyer", "Seller"], status: "Active", activity: "Jun 17, 2026" },
  { id: "MEM-2033", name: "Dilan Rashid", phone: "+964 770 118 3320", img: TH("photo-1438761681033-6461ffad8d80"),
    roles: ["Landlord"], status: "Active", activity: "Jun 14, 2026" },
  { id: "MEM-2026", name: "Hawre Ako", phone: "+964 751 904 2218", img: TH("photo-1506794778202-cad84cf45f1d"),
    roles: ["Tenant"], status: "Active", activity: "Jun 9, 2026" },
  { id: "MEM-2014", name: "Sara Hama", phone: "+964 773 220 5567", img: TH("photo-1544005313-94ddf0286df2"),
    roles: ["Buyer"], status: "Inactive", activity: "May 28, 2026" },
  { id: "MEM-2009", name: "Rawa Jalal", phone: "+964 750 600 1234", img: TH("photo-1487412720507-e7ab37603c6f"),
    roles: ["Seller", "Landlord"], status: "Active", activity: "May 21, 2026" }];

/* viewings */
const VIEWINGS = [
  { id: "CH-2041", title: "Olive Grove Estate", loc: "Ankawa, Erbil", img: TH("photo-1613490493576-7fde63acd811"),
    member: "Ahmed Karim", memberImg: TH("photo-1507003211169-0a1dd7228f2d"), when: "Jun 24, 2026 · 14:00", status: "Confirmed" },
  { id: "CH-2017", title: "Empire Tower Suite", loc: "Empire World, Erbil", img: TH("photo-1545324418-cc1a3fa10c00"),
    member: "Hawre Ako", memberImg: TH("photo-1506794778202-cad84cf45f1d"), when: "Jun 22, 2026 · 11:30", status: "Pending" },
  { id: "CH-2029", title: "Naz City Penthouse", loc: "Naz City, Erbil", img: TH("photo-1600607687939-ce8a6c25118c"),
    member: "Dilan Rashid", memberImg: TH("photo-1438761681033-6461ffad8d80"), when: "Jun 8, 2026 · 16:00", status: "Completed" },
  { id: "CH-2035", title: "Cedar Court Residence", loc: "Italian Village, Erbil", img: TH("photo-1568605114967-8130f3a36994"),
    member: "Sara Hama", memberImg: TH("photo-1544005313-94ddf0286df2"), when: "Jun 5, 2026 · 10:00", status: "Completed" },
  { id: "CH-2022", title: "Park View Loft", loc: "Dream City, Erbil", img: TH("photo-1502672260266-1c1ef2d93688"),
    member: "Rawa Jalal", memberImg: TH("photo-1487412720507-e7ab37603c6f"), when: "May 30, 2026 · 13:00", status: "Cancelled" }];

/* reviews */
const RATING_BARS = [
  { star: 5, pct: 86 }, { star: 4, pct: 10 }, { star: 3, pct: 3 }, { star: 2, pct: 1 }, { star: 1, pct: 0 }];

const REVIEWS = [
  { name: "Ahmed Karim", deal: "Bought Naz City Penthouse", stars: 5, when: "Jun 2026",
    text: "Lana made the entire purchase effortless. She knew every detail about the property and negotiated a fair price on my behalf." },
  { name: "Dilan Rashid", deal: "Listed Park View Loft", stars: 5, when: "May 2026",
    text: "Professional, responsive, and genuinely cares about getting the right tenant. My loft was rented within two weeks." },
  { name: "Sara Hama", deal: "Viewing — Cedar Court", stars: 4, when: "May 2026",
    text: "Punctual and knowledgeable during the viewing. Answered all of my questions clearly and followed up the same day." }];

/* activity timeline */
const TIMELINE = [
  { icon: "refresh-cw", tone: "brand", title: "Status changed", desc: "Account status set to Active by Rêbîn Kawa.", time: "Jun 18, 2026" },
  { icon: "calendar-check", tone: "success", title: "Viewing completed", desc: "Hosted a viewing for Naz City Penthouse with Dilan Rashid.", time: "Jun 8, 2026" },
  { icon: "key", tone: "error", title: "Property sold", desc: "Closed the sale of Naz City Penthouse for $980,000.", time: "May 30, 2026" },
  { icon: "key-round", tone: "info", title: "Property rented", desc: "Park View Loft rented out at $1,100/mo.", time: "May 18, 2026" },
  { icon: "user-plus", tone: "brand", title: "Member assigned", desc: "Ahmed Karim assigned to this agent.", time: "May 14, 2026" },
  { icon: "building-2", tone: "brand", title: "Property assigned", desc: "Cedar Court Residence assigned to this agent.", time: "May 9, 2026" },
  { icon: "pencil", tone: "neutral", title: "Profile updated", desc: "Service areas and languages updated.", time: "Apr 2, 2026" },
  { icon: "badge-check", tone: "gold", title: "Agent verified", desc: "ID and licence documents approved.", time: "Mar 14, 2023" },
  { icon: "user-round-plus", tone: "neutral", title: "Agent created", desc: "Agent profile created on Chiya Estate.", time: "Mar 12, 2023" }];

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
   MODALS — Change status / Delete
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
        <h2 className="pp-modal__title" id="status-modal-title">Change agent status</h2>
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

function DeleteAgentModal({ agent, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="del-modal-title">
        <div className="pp-modal__icon"><Icon name="trash-2" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="del-modal-title">Delete agent?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone and will permanently remove the agent profile and unassign their listings and members.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}><Icon name="trash-2" size={15} />Delete agent</button>
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
  AD_DS: DS, AD_LOGO: LOGO,
  AD_NAV_FLAT: NAV_FLAT, AD_PAGE_MAP: PAGE_MAP,
  AD_PROPERTY_DETAILS: PROPERTY_DETAILS, AD_MEMBER_PROFILE: MEMBER_PROFILE, AD_PUBLIC_PROFILE: PUBLIC_PROFILE,
  AD_AGENT: AGENT, AD_KPIS: KPIS,
  AD_LISTINGS: LISTINGS, AD_MEMBERS: MEMBERS, AD_VIEWINGS: VIEWINGS,
  AD_RATING_BARS: RATING_BARS, AD_REVIEWS: REVIEWS, AD_TIMELINE: TIMELINE,
  AD_ROLE_META: ROLE_META, AD_LISTING_STATUS_META: LISTING_STATUS_META, AD_LISTING_TYPE_META: LISTING_TYPE_META,
  AD_MEMBER_STATUS_META: MEMBER_STATUS_META, AD_VIEW_STATUS_META: VIEW_STATUS_META,
  AD_Sidebar: Sidebar, AD_Topbar: Topbar,
  AD_ChangeStatusModal: ChangeStatusModal, AD_DeleteAgentModal: DeleteAgentModal,
  AD_ProfToast: ProfToast, AD_useToasts: useToasts
});
