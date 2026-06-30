/* ==================================================================
   VIEWING DETAILS — CORE
   Admin shell (sidebar/topbar), viewing dataset, shared modals + toast.
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
const AGENT_DETAILS = "Admin-Agent Details.html";

const NOTIFICATIONS = [
  { id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
  { id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
  { id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
  { id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" }];

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };

/* ------------------------------------------------------------------
   STATUS META  (badge variant + status-pill class)
------------------------------------------------------------------ */
const VIEW_STATUS_META = {
  "Scheduled": { variant: "info",    icon: "clock",          cls: "vwd-st--scheduled" },
  "Confirmed": { variant: "success", icon: "calendar-check", cls: "vwd-st--confirmed" },
  "Completed": { variant: "brand",   icon: "check-check",    cls: "vwd-st--completed" },
  "Cancelled": { variant: "error",   icon: "x-circle",       cls: "vwd-st--cancelled" },
  "No Show":   { variant: "warning", icon: "user-x",         cls: "vwd-st--noshow"    }
};
const ROLE_META = {
  "Buyer": { variant: "info" },
  "Seller": { variant: "success" },
  "Landlord": { variant: "neutral" },
  "Tenant": { variant: "brand" }
};

/* ------------------------------------------------------------------
   VIEWING DATASET  (VW-1025 — Marble Hill Villa)
------------------------------------------------------------------ */
const VIEWING = {
  id: "VW-1025",
  status: "Scheduled",
  date: "Jun 16, 2026",
  dateLong: "Monday, June 16, 2026",
  time: "10:00 AM",
  endTime: "10:45 AM",
  duration: "45 minutes",
  created: "Jun 12, 2026 · 2:10 PM",
  updated: "Jun 15, 2026 · 9:02 AM",
  contactMethod: "Phone call",
  contactIcon: "phone",
  meetingLocation: "On-site — Marble Hill Villa, Ankawa",
  notes: "Member is relocating from Dubai and wants to see the master suite, the garden, and the rooftop terrace. Prefers a morning appointment and asked whether the price is negotiable.",
  reminderSent: true,
  reminderWhen: "Jun 15, 2026 · 9:00 AM",
  property: {
    id: "CH-1042",
    name: "Marble Hill Villa",
    location: "Ankawa, Erbil",
    listing: "For sale",
    type: "Villa",
    price: "$1,450,000",
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=520&q=75"
  },
  member: {
    id: "MEM-1087",
    name: "Sara Hassan",
    role: "Buyer",
    phone: "+964 750 112 4408",
    email: "sara.hassan@gmail.com"
  },
  agent: {
    id: "A-2041",
    name: "Lana Aziz",
    phone: "+964 770 552 1190",
    email: "lana.aziz@chiya.estate",
    experience: 8,
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=75"
  }
};

/* activity timeline — chronological, newest first */
const TIMELINE = [
  { icon: "bell", tone: "gold", title: "Reminder sent", desc: "Automated viewing reminder delivered to the member by SMS and email.", time: "Jun 15, 2026 · 9:00 AM", by: "System" },
  { icon: "user-plus", tone: "brand", title: "Agent assigned", desc: "Lana Aziz assigned to host this viewing.", time: "Jun 12, 2026 · 2:15 PM", by: "Rêbîn Kawa" },
  { icon: "calendar-plus", tone: "info", title: "Viewing created", desc: "Viewing appointment created for Marble Hill Villa.", time: "Jun 12, 2026 · 2:10 PM", by: "Rêbîn Kawa" }
];

/* internal notes — admin-only */
const INIT_NOTES = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 15, 2026 · 9:05 AM", kind: "note",
    text: "Serious buyer — pre-approved financing confirmed by the bank. Lana should bring the full spec sheet and the garden survey to the viewing." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 12, 2026 · 2:12 PM", kind: "review",
    text: "Member requested a morning slot. Confirmed 10:00 AM with the owner; gate access arranged with the building manager." }
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
   CONFIRMATION MODALS
================================================================== */
function ConfirmModal({ icon, iconKind, title, body, confirmLabel, confirmIcon, tone, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const danger = tone === "danger";
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="vwd-confirm-title">
        <div className={"pp-modal__icon" + (danger ? "" : " pp-modal__icon--status")}>
          <Icon name={icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="pp-modal__title" id="vwd-confirm-title">{title}</h2>
        <p className="pp-modal__body">{body}</p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          {danger
            ? <button type="button" className="pp-modal__delete" onClick={onConfirm}><Icon name={confirmIcon} size={15} />{confirmLabel}</button>
            : <button type="button" className="pp-modal__confirm" onClick={onConfirm}><Icon name={confirmIcon} size={15} />{confirmLabel}</button>}
        </div>
      </div>
    </div>,
    document.body);
}

/* status-picker modal — choose any viewing status */
const VIEW_STATUS_DOT = {
  "Scheduled": "var(--info-500)",
  "Confirmed": "var(--success-500)",
  "Completed": "var(--green-600)",
  "Cancelled": "var(--error-500)",
  "No Show":   "var(--warning-500)"
};
function ViewingStatusModal({ current, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(current);
  const [dropOpen, setDropOpen] = useState(false);
  const triggerRef = useRef(null);
  const [dropPos, setDropPos] = useState(null);
  const options = Object.keys(VIEW_STATUS_META);
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

  const canConfirm = selected && selected !== current;
  const warn = selected === "Cancelled" || selected === "No Show";
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal pp-modal--agent" role="dialog" aria-modal="true" aria-labelledby="vwd-status-title">
        <div className="pp-modal__icon pp-modal__icon--status"><Icon name="refresh-cw" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="vwd-status-title">Change viewing status</h2>
        <p className="pp-modal__sublabel">Select new status</p>
        <button ref={triggerRef} type="button"
          className={"pp-amodal__trigger" + (dropOpen ? " is-open" : "")}
          style={{ marginBottom: 22 }}
          aria-haspopup="listbox" aria-expanded={dropOpen} onClick={toggleDrop}>
          {selected ?
            <React.Fragment>
              <span className="pp-smodal__dot" style={{ background: VIEW_STATUS_DOT[selected] }} />
              <span className="pp-smodal__label">{selected}</span>
            </React.Fragment> :
            <span className="pp-amodal__trigger-placeholder">
              <Icon name="tag" size={16} />Choose a status…
            </span>
          }
          <Icon name="chevron-down" size={15} className="pp-amodal__trigger-chev" />
        </button>

        {dropOpen && dropPos && ReactDOM.createPortal(
          <div className="pp-smodal__drop pp-amodal__drop" role="listbox" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
            {options.map((s) =>
              <button key={s} type="button" className={"pp-smodal__item" + (selected === s ? " is-selected" : "")}
                onClick={() => { setSelected(s); setDropOpen(false); }}>
                <span className="pp-smodal__dot" style={{ background: VIEW_STATUS_DOT[s] }} />
                <span className="pp-smodal__label">{s}</span>
                <span className="pp-smodal__spacer" />
                {current === s && <span className="pp-amodal__current-tag">Current</span>}
                {selected === s && current !== s && <span className="pp-smodal__check"><Icon name="check" size={16} strokeWidth={2.5} /></span>}
              </button>)}
          </div>,
          document.body)}

        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className={"pp-modal__confirm" + (warn ? " pp-modal__confirm--warn" : "")} disabled={!canConfirm} onClick={() => onConfirm(selected)}>
            <Icon name="refresh-cw" size={15} />Change status
          </button>
        </div>
      </div>
    </div>,
    document.body);
}

function adNoteRoleLabel(role) {
  const r = (role || "").trim();
  if (!r) return "Note";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
}

function DeleteNoteModal({ note, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const label = adNoteRoleLabel(note.role).toLowerCase();
  return ReactDOM.createPortal(
    <div className="pp-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="pp-modal" role="dialog" aria-modal="true" aria-labelledby="vwd-delnote-title">
        <div className="pp-modal__icon"><Icon name="trash-2" size={24} strokeWidth={1.8} /></div>
        <h2 className="pp-modal__title" id="vwd-delnote-title">Delete note?</h2>
        <p className="pp-modal__body">
          Are you sure you want to delete this <strong>{label}</strong>? This action cannot be undone and will permanently remove it from this viewing.
        </p>
        <div className="pp-modal__actions">
          <button type="button" className="pp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="pp-modal__delete" onClick={onConfirm}><Icon name="trash-2" size={15} />Delete note</button>
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
  VWD_DS: DS, VWD_LOGO: LOGO,
  VWD_NAV_FLAT: NAV_FLAT, VWD_PAGE_MAP: PAGE_MAP,
  VWD_PROPERTY_DETAILS: PROPERTY_DETAILS, VWD_MEMBER_PROFILE: MEMBER_PROFILE, VWD_AGENT_DETAILS: AGENT_DETAILS,
  VWD_VIEWING: VIEWING, VWD_TIMELINE: TIMELINE, VWD_INIT_NOTES: INIT_NOTES,
  VWD_VIEW_STATUS_META: VIEW_STATUS_META, VWD_ROLE_META: ROLE_META,
  VWD_adNoteRoleLabel: adNoteRoleLabel,
  VWD_Sidebar: Sidebar, VWD_Topbar: Topbar,
  VWD_ConfirmModal: ConfirmModal, VWD_ViewingStatusModal: ViewingStatusModal, VWD_DeleteNoteModal: DeleteNoteModal,
  VWD_ProfToast: ProfToast, VWD_useToasts: useToasts
});
