const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard, Select } = DS;
const AddMemberModal = window.AddMemberModal;

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
   MEMBERS — KPI DATA
================================================================== */
const KPI_CARDS = [
{ key: "total", label: "Total members", icon: "users", tone: "brand", value: "12,480", sub: "All registered accounts" },
{ key: "buyers", label: "Buyers", icon: "search", tone: "info", value: "7,240", sub: "Actively looking to buy" },
{ key: "sellers", label: "Sellers", icon: "tag", tone: "success", value: "2,180", sub: "Listing to sell" },
{ key: "landlords", label: "Landlords", icon: "building-2", tone: "gold", value: "1,640", sub: "Renting out property" },
{ key: "tenants", label: "Tenants", icon: "key-round", tone: "brand", value: "1,420", sub: "Currently renting" }];


/* ==================================================================
   MEMBERS — TABLE DATA
================================================================== */
const TOTAL_MEMBERS = 1248;

/* role → Badge config (soft, premium tones per brand semantics) */
const ROLE_META = {
  "Buyer": { cls: "mp-role--buyer" },
  "Seller": { cls: "mp-role--seller" },
  "Landlord": { cls: "mp-role--landlord" },
  "Tenant": { cls: "mp-role--tenant" }
};
const ROLE_OPTIONS = ["Buyer", "Seller", "Landlord", "Tenant"];
const ROLE_TABS = [{ id: "", label: "All" }, ...ROLE_OPTIONS.map((r) => ({ id: r, label: r }))];

/* status → Badge config */
const MEMBER_STATUS = {
  "Active": { variant: "success", dot: true },
  "Suspended": { variant: "error", dot: true }
};

const MEMBERS = [
{ id: "M-4821", name: "Karwan Mahmoud", roles: ["Buyer"], phone: "+964 750 118 4420", email: "karwan.mahmoud@gmail.com", properties: 6, joined: "Jun 11, 2026", daysAgo: 3, status: "Active",
  img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4810", name: "Lana Aziz", roles: ["Seller", "Landlord"], phone: "+964 770 552 1190", email: "lana.aziz@outlook.com", properties: 4, joined: "Jun 8, 2026", daysAgo: 6, status: "Active",
  img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4799", name: "Sirwan Tofiq", roles: ["Buyer"], phone: "+964 751 904 7782", email: "sirwan.t@gmail.com", properties: 0, joined: "Jun 5, 2026", daysAgo: 9, status: "Active",
  img: null },
{ id: "M-4783", name: "Dashne Salar", roles: ["Landlord"], phone: "+964 773 220 5567", email: "dashne.salar@gmail.com", properties: 11, joined: "Jun 2, 2026", daysAgo: 12, status: "Active",
  img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4771", name: "Awat Rashid", roles: ["Tenant"], phone: "+964 750 600 1234", email: "awat.rashid@outlook.com", properties: 1, joined: "May 29, 2026", daysAgo: 16, status: "Suspended",
  img: null },
{ id: "M-4760", name: "Hewa Botan", roles: ["Seller"], phone: "+964 751 778 9012", email: "hewa.botan@outlook.com", properties: 2, joined: "May 26, 2026", daysAgo: 19, status: "Active",
  img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4748", name: "Nyan Faraj", roles: ["Buyer", "Tenant"], phone: "+964 770 415 6688", email: "nyan.faraj@gmail.com", properties: 3, joined: "May 22, 2026", daysAgo: 23, status: "Active",
  img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4732", name: "Shilan Aram", roles: ["Landlord"], phone: "+964 751 209 3341", email: "shilan.aram@gmail.com", properties: 8, joined: "May 18, 2026", daysAgo: 27, status: "Active",
  img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4719", name: "Berivan Khalid", roles: ["Landlord"], phone: "+964 773 884 2210", email: "berivan.k@gmail.com", properties: 14, joined: "May 14, 2026", daysAgo: 31, status: "Active",
  img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4703", name: "Tara Jamal", roles: ["Buyer", "Seller"], phone: "+964 750 332 7799", email: "tara.jamal@outlook.com", properties: 5, joined: "May 9, 2026", daysAgo: 36, status: "Suspended",
  img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=70" },
{ id: "M-4688", name: "Rebwar Aziz", roles: ["Tenant"], phone: "+964 751 660 1925", email: "rebwar.aziz@gmail.com", properties: 0, joined: "May 4, 2026", daysAgo: 41, status: "Active",
  img: null },
{ id: "M-4671", name: "Diyar Salih", roles: ["Seller"], phone: "+964 770 118 5540", email: "diyar.salih@outlook.com", properties: 9, joined: "Apr 28, 2026", daysAgo: 47, status: "Active",
  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" }];


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

/* ==================================================================
   MEMBERS — PAGE HEADER
================================================================== */
function MembersHeader({ onAdd }) {
  return (
    <header className="mp-head">
      <div className="mp-head__intro">
        <h1 className="mp-head__title">Members</h1>
        <p className="mp-head__sub">Manage buyers, sellers, landlords, and tenants across Chiya Estate.</p>
      </div>
      <div className="mp-head__action">
        <Button hierarchy="primary" size="lg" iconLeading="user-plus" onClick={onAdd}>Add member</Button>
      </div>
    </header>);

}

/* ==================================================================
   MEMBERS — KPI SUMMARY
================================================================== */
function KpiSummary() {
  return (
    <div className="mp-kpis">
      {KPI_CARDS.map((c) =>
      <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
      )}
    </div>);

}

/* ==================================================================
   MEMBERS — TABLE CARD (own header: title + count + search + filters)
================================================================== */
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
    <div className="mp-tablefooter">
      <span className="mp-pagination__info">
        Showing <b>{start.toLocaleString("en-US")}–{end.toLocaleString("en-US")}</b> of <b>{totalItems.toLocaleString("en-US")}</b> members
      </span>
      <div className="mp-pagination">
        <button type="button" className="mp-page-btn mp-page-btn--nav"
        disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />Previous
        </button>
        {getPages().map((p, i) =>
        p === "…" ?
        <span key={"e" + i} className="mp-page-ellipsis">…</span> :

        <button key={p} type="button"
        className={"mp-page-btn" + (p === currentPage ? " is-active" : "")}
        onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button type="button" className="mp-page-btn mp-page-btn--nav"
        disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next<Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>);

}

function MpCustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
  };
  const toggle = () => {if (!open) calcPos();setOpen((v) => !v);};

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (document.querySelector(".mp-custdrop")?.contains(e.target)) return;
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

  return (
    <div className="mp-datebtn-wrap" ref={btnRef}>
      <button type="button"
      className={"mp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
      onClick={toggle}>
        <span className="mp-datebtn__label">
          {options.find((o) => o.value === value)?.label || placeholder}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open && pos && ReactDOM.createPortal(
        <div className="mp-custdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
          {options.map((o) =>
          <button key={o.value} type="button"
          className={"mp-custdrop__item" + (value === o.value ? " is-selected" : "")}
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

/* ---------- DATE PICKER (calendar popover) ---------- */
const MP_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MP_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MP_WD = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MP_TODAY = new Date(2026, 5, 18);
const fmtDate = (d) => MP_MONTHS_SHORT[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function MpDatePicker({ value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => ({ y: (value || MP_TODAY).getFullYear(), m: (value || MP_TODAY).getMonth() }));
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  };
  const toggle = () => {
    if (!open) {calcPos();setView({ y: (value || MP_TODAY).getFullYear(), m: (value || MP_TODAY).getMonth() });}
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current?.contains(e.target)) return;
      if (document.querySelector(".mp-cal")?.contains(e.target)) return;
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

  const first = new Date(view.y, view.m, 1).getDay();
  const days = new Date(view.y, view.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const shift = (delta) => setView((v) => {
    const nm = v.m + delta;
    return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });

  return (
    <div className="mp-datebtn-wrap" ref={btnRef}>
      <button type="button"
      className={"mp-datebtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
      onClick={toggle}>
        <span className="mp-datebtn__label">{value ? fmtDate(value) : placeholder}</span>
        <Icon name="calendar" size={15} />
      </button>

      {open && pos && ReactDOM.createPortal(
        <div className="mp-cal" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="mp-cal__head">
            <button type="button" className="mp-cal__nav" onClick={() => shift(-1)} aria-label="Previous month">
              <Icon name="chevron-left" size={18} />
            </button>
            <span className="mp-cal__title">{MP_MONTHS[view.m]} {view.y}</span>
            <button type="button" className="mp-cal__nav" onClick={() => shift(1)} aria-label="Next month">
              <Icon name="chevron-right" size={18} />
            </button>
          </div>
          <div className="mp-cal__grid mp-cal__wd">
            {MP_WD.map((w) => <span key={w} className="mp-cal__wdcell">{w}</span>)}
          </div>
          <div className="mp-cal__grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={"e" + i} />;
              const date = new Date(view.y, view.m, d);
              const cls = ["mp-cal__day"];
              if (sameDay(date, value)) cls.push("is-selected");
              else if (sameDay(date, MP_TODAY)) cls.push("is-today");
              return (
                <button key={d} type="button" className={cls.join(" ")}
                onClick={() => {onChange(date);setOpen(false);}}>
                  {d}
                </button>);
            })}
          </div>
        </div>,
        document.body
      )}
    </div>);
}

/* ---------- ROW ACTIONS MENU ---------- */
function RowActions({ open, onToggle, onClose, status, onView, onEdit, onStatus, onDelete }) {
  const suspended = status === "Suspended";
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  useEffect(() => {
    if (!open || !btnRef.current) {setPos(null);return;}
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 188) });
  }, [open]);
  const menu = pos && ReactDOM.createPortal(
    <div className="mp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="mp-amenu__sect">
        <button type="button" className="mp-aitem" role="menuitem" onClick={onView}><Icon name="user" size={17} />View profile</button>
        <button type="button" className="mp-aitem" role="menuitem" onClick={onEdit}><Icon name="pencil" size={17} />Edit member</button>
        <button type="button" className="mp-aitem mp-aitem--status" role="menuitem" onClick={onStatus}>
          <Icon name={suspended ? "circle-check" : "circle-pause"} size={17} />{suspended ? "Activate member" : "Suspend member"}
        </button>
      </div>
      <div className="mp-amenu__sect">
        <button type="button" className="mp-aitem mp-aitem--danger" role="menuitem" onClick={onDelete}><Icon name="trash-2" size={17} />Delete member</button>
      </div>
    </div>,
    document.body
  );
  return (
    <div className="mp-actions">
      <button ref={btnRef} type="button" className={"mp-kebab" + (open ? " is-open" : "")} aria-label="Member actions"
      aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </div>);

}

/* ---------- DELETE CONFIRM MODAL ---------- */
function DeleteMemberModal({ member, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return ReactDOM.createPortal(
    <div className="mp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-del-title">
        <div className="mp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="mp-del-title">Delete member?</h2>
        <p className="mp-modal__body">
          Are you sure you want to delete <strong>{member.name}</strong>? This action cannot be undone and will permanently remove the account.
        </p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="mp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />Delete member
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ---------- CHANGE STATUS CONFIRM MODAL (suspend / activate) ---------- */
function StatusMemberModal({ member, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const suspending = member.status === "Active";
  const copy = suspending ? {
    icon: "circle-pause", iconCls: "mp-modal__icon--warn",
    title: "Suspend member",
    body: "Are you sure you want to suspend this member? The member will no longer be able to access their account until reactivated.",
    cta: "Suspend member", ctaIcon: "circle-pause", ctaCls: "mp-modal__confirm--warn"
  } : {
    icon: "circle-check", iconCls: "mp-modal__icon--brand",
    title: "Activate member",
    body: "Are you sure you want to activate this member? The member will regain access to their account and platform features.",
    cta: "Activate member", ctaIcon: "circle-check", ctaCls: "mp-modal__confirm--brand"
  };
  return ReactDOM.createPortal(
    <div className="mp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="mp-status-title">
        <div className={"mp-modal__icon " + copy.iconCls}>
          <Icon name={copy.icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="mp-status-title">{copy.title}</h2>
        <p className="mp-modal__body">{copy.body}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className={"mp-modal__confirm " + copy.ctaCls} onClick={onConfirm}>
            {copy.cta}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
function MemberRow({ m, openMenu, setOpenMenu, onEditRequest, onStatusRequest, onDeleteRequest }) {
  const st = MEMBER_STATUS[m.status] || { variant: "neutral" };
  return (
    <div className="mp-row">
      {/* member */}
      <div className="mp-col--member">
        <div className="mp-member">
          <Avatar src={m.img || undefined} name={m.name} size="md" />
          <div className="mp-member__body">
            <span className="mp-member__name">{m.name}</span>
            <span className="mp-member__id">{m.id}</span>
          </div>
        </div>
      </div>

      {/* roles */}
      <div className="mp-col--roles">
        <span className="mp-celllabel">Roles</span>
        <div className="mp-roles">
          {m.roles.map((r) =>
          <Badge key={r} variant="neutral" className={(ROLE_META[r] || {}).cls} size="sm">{r}</Badge>
          )}
        </div>
      </div>

      {/* phone */}
      <div className="mp-col--phone">
        <span className="mp-celllabel">Phone</span>
        <span className="mp-contact mp-contact--phone"><Icon name="phone" size={13} />{m.phone}</span>
      </div>

      {/* properties */}
      <div className="mp-col--props">
        <span className="mp-celllabel">Properties</span>
        <span className={"mp-propstext" + (m.properties === 0 ? " mp-propstext--zero" : "")}>
          <b>{m.properties}</b> related
        </span>
      </div>

      {/* joined date */}
      <div className="mp-col--joined">
        <span className="mp-celllabel">Joined</span>
        <span className="mp-date">{m.joined}</span>
      </div>

      {/* status */}
      <div className="mp-col--status">
        <span className="mp-celllabel">Status</span>
        <Badge variant={st.variant} size="sm" dot={st.dot} className="mp-statusbadge">{m.status}</Badge>
      </div>

      {/* actions */}
      <div className="mp-col--actions">
        <RowActions open={openMenu === m.id}
        onToggle={() => setOpenMenu(openMenu === m.id ? null : m.id)}
        onClose={() => setOpenMenu(null)}
        status={m.status}
        onView={() => { setOpenMenu(null); window.location.href = MEMBER_PROFILE_PAGE; }}
        onEdit={() => { setOpenMenu(null); onEditRequest(m); }}
        onStatus={() => { setOpenMenu(null); onStatusRequest(m); }}
        onDelete={() => { setOpenMenu(null); onDeleteRequest(m); }} />
      </div>
    </div>);

}

function MembersTableCard({ filters, setFilter, onClear, hasActive, rows, totalRows, currentPage, onPageChange, openMenu, setOpenMenu, onEditRequest, onStatusRequest, onDeleteRequest }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const shown = hasActive ? rows.length : TOTAL_MEMBERS;
  const opt = (arr) => arr.map((v) => ({ value: v, label: v }));
  const activeAdvCount = [filters.status, filters.date].filter(Boolean).length;
  return (
    <section className="mp-tablecard">
      <header className="mp-tablecard__head">
        <div className="mp-tablecard__titlerow">
          <div className="mp-tablecard__heading">
            <h2 className="mp-tablecard__title">All members</h2>
            <span className="mp-tablecard__count">{shown.toLocaleString("en-US")}</span>
          </div>
          {hasActive &&
          <div className="mp-tablecard__resultnote">
              <span><b>{rows.length}</b> of {TOTAL_MEMBERS.toLocaleString("en-US")} shown</span>
            </div>
          }
        </div>

        <div className="mp-tabrow">
          <div className="mp-tabs" role="tablist" aria-label="Filter by role">
            {ROLE_TABS.map((tab) =>
            <button key={tab.id} type="button" role="tab"
            aria-selected={filters.role === tab.id}
            className={"mp-tab" + (filters.role === tab.id ? " is-active" : "")}
            onClick={() => setFilter("role", tab.id)}>
                {tab.label}
              </button>
            )}
          </div>
          <div className="mp-tabrow__right">
            <div className="mp-tabsearch">
              <span className="mp-tabsearch__lead"><Icon name="search" size={16} /></span>
              <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Search members…" aria-label="Search members" />
            </div>
            <button type="button"
            className={"mp-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")}
            aria-expanded={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
              <Icon name="sliders-horizontal" size={15} />
              Filters
              {activeAdvCount > 0 && <span className="mp-filterbtn__badge">{activeAdvCount}</span>}
            </button>
          </div>
        </div>

        <div className={"mp-filterbar" + (filtersOpen ? " is-open" : "")}>
          <div className="mp-filterbar__inner">
            <div className="mp-filterbar__row">
              <MpCustomSelect value={filters.status} onChange={(v) => setFilter("status", v)}
              options={opt(["Active", "Suspended"])} placeholder="All statuses" />
              <MpDatePicker value={filters.date} onChange={(v) => setFilter("date", v)}
              placeholder="Date added" />
              <div className="mp-filterbar__actions">
                <button type="button" className="mp-clearbtn" onClick={onClear}>
                  <Icon name="x" size={14} />Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="mp-table">
        <div className="mp-thead" role="row">
          <span className="mp-th mp-col--member">Member</span>
          <span className="mp-th mp-col--roles">Roles</span>
          <span className="mp-th mp-col--phone">Phone</span>
          <span className="mp-th mp-col--props">Properties</span>
          <span className="mp-th mp-col--joined">Joined date</span>
          <span className="mp-th mp-col--status">Status</span>
          <span className="mp-th mp-col--actions">Actions</span>
        </div>
        {rows.length > 0 ?
        rows.map((m) => <MemberRow key={m.id} m={m} openMenu={openMenu} setOpenMenu={setOpenMenu} onEditRequest={onEditRequest} onStatusRequest={onStatusRequest} onDeleteRequest={onDeleteRequest} />) :

        <div className="mp-noresults">
            <span className="mp-noresults__art"><Icon name="search-x" size={26} strokeWidth={1.6} /></span>
            <h3>No members found</h3>
            <p>Try adjusting your search or clearing the filters to see more members.</p>
          </div>
        }
      </div>
      <PaginationFooter currentPage={currentPage} totalItems={totalRows} onPageChange={onPageChange} />
    </section>);

}

/* ==================================================================
   TOAST NOTIFICATION  (top-right, premium admin style)
================================================================== */
const MEMBER_PROFILE_PAGE = "Admin-Member Profile.html"; // admin member profile page
const TOAST_DURATION = 6000;

function Toast({ toast, onDismiss, onViewProfile }) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);

  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(onDismiss, 340);
  }, [onDismiss]);

  // enter animation + auto-dismiss countdown (pauses on hover)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const startTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(close, TOAST_DURATION);
  }, [close]);
  useEffect(() => {startTimer();return () => {if (timer.current) clearTimeout(timer.current);};}, [startTimer]);

  const pause = () => {if (timer.current) clearTimeout(timer.current);};

  const cls = ["mp-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  const danger = toast.variant === "danger";
  const warn = toast.variant === "warn";
  const iconCls = danger ? " mp-toast__icon--danger" : warn ? " mp-toast__icon--warn" : "";
  const iconName = toast.icon || (danger ? "trash-2" : "check");

  return ReactDOM.createPortal(
    <div className="mp-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" style={{ "--mp-toast-dur": TOAST_DURATION + "ms" }}
      onMouseEnter={pause} onMouseLeave={startTimer}>
        <span className={"mp-toast__icon" + iconCls}>
          <Icon name={iconName} size={20} strokeWidth={danger ? 1.9 : 2.2} />
        </span>
        <div className="mp-toast__body">
          <p className="mp-toast__title">{toast.title}</p>
          <p className="mp-toast__msg">{toast.message}</p>
          <div className="mp-toast__actions">
            <button type="button" className="mp-toast__btn mp-toast__btn--dismiss" onClick={close}>Dismiss</button>
            {danger && toast.onUndo &&
            <button type="button" className="mp-toast__btn mp-toast__btn--undo" onClick={() => { toast.onUndo(); close(); }}>
              <Icon name="undo-2" size={15} />Undo
            </button>
            }
            {!danger &&
            <button type="button" className="mp-toast__btn mp-toast__btn--view" onClick={onViewProfile}>View profile</button>
            }
          </div>
        </div>
        <button type="button" className="mp-toast__close" aria-label="Dismiss notification" onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="mp-toast__progress" />
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   MEMBERS PAGE
================================================================== */
const EMPTY_FILTERS = { q: "", role: "", status: "", date: null };


function MembersPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [toast, setToast] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [members, setMembers] = useState(MEMBERS);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [statusTarget, setStatusTarget] = useState(null);
  const setFilter = (k, v) => {setFilters((f) => ({ ...f, [k]: v }));setCurrentPage(1);};
  const clear = () => {setFilters(EMPTY_FILTERS);setCurrentPage(1);};
  const hasActive = Object.values(filters).some(Boolean);

  const handleAddMember = () => {
    setAddOpen(false);
    setToast({
      title: "Member added successfully",
      message: "The member profile has been created and is now available in the Members directory."
    });
  };
  const viewProfile = () => {window.location.href = MEMBER_PROFILE_PAGE;};

  const handleEditMember = () => {
    setEditTarget(null);
    setToast({
      title: "Member updated successfully",
      message: "The member information has been updated successfully."
    });
  };

  const handleDeleteConfirm = () => {
    const target = deleteTarget;
    let removedIndex = -1;
    setMembers((prev) => {
      removedIndex = prev.findIndex((m) => m.id === target.id);
      return prev.filter((m) => m.id !== target.id);
    });
    setDeleteTarget(null);
    setToast({
      variant: "danger",
      title: "Member deleted",
      message: `${target.name} has been permanently removed from the Members directory.`,
      onUndo: () => {
        setMembers((prev) => {
          if (prev.some((m) => m.id === target.id)) return prev;
          const next = prev.slice();
          next.splice(removedIndex < 0 ? next.length : removedIndex, 0, target);
          return next;
        });
      }
    });
  };

  const handleStatusConfirm = () => {
    const target = statusTarget;
    const suspending = target.status === "Active";
    const next = suspending ? "Suspended" : "Active";
    setMembers((prev) => prev.map((m) => m.id === target.id ? { ...m, status: next } : m));
    setStatusTarget(null);
    setToast(suspending ? {
      variant: "warn", icon: "circle-pause",
      title: "Member suspended",
      message: "The member account has been suspended successfully."
    } : {
      variant: "success", icon: "circle-check",
      title: "Member activated",
      message: "The member account has been activated successfully."
    });
  };

  // close any open row-action menu when the page or table scrolls
  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return members.filter((m) => {
      if (filters.role && !m.roles.includes(filters.role)) return false;
      if (filters.status && m.status !== filters.status) return false;
      if (filters.date && m.joined !== fmtDate(filters.date)) return false;
      if (q) {
        const hay = [m.name, m.phone, m.email, m.id].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, members]);

  const baseTotal = TOTAL_MEMBERS - (MEMBERS.length - members.length);
  const totalRows = hasActive ? rows.length : baseTotal;
  const pagedRows = rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <React.Fragment>
      <MembersHeader onAdd={() => setAddOpen(true)} />
      <KpiSummary />
      <MembersTableCard filters={filters} setFilter={setFilter} onClear={clear} hasActive={hasActive}
      rows={pagedRows} totalRows={totalRows} currentPage={currentPage} onPageChange={setCurrentPage}
      openMenu={openMenu} setOpenMenu={setOpenMenu} onEditRequest={setEditTarget} onStatusRequest={setStatusTarget} onDeleteRequest={setDeleteTarget} />
      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      <AddMemberModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAddMember} />
      <AddMemberModal open={!!editTarget} mode="edit" initial={editTarget} onClose={() => setEditTarget(null)} onSubmit={handleEditMember} />
      {deleteTarget && <DeleteMemberModal member={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {statusTarget && <StatusMemberModal member={statusTarget} onCancel={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} onViewProfile={viewProfile} />}
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
  const [active, setActive] = useState("members");
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
        <main className="ax-content" data-screen-label="Admin · Members">
          {active === "members" ?
          <MembersPage /> :

          <div className="ax-empty">
                <div className="ax-empty__art">
                  <Icon name="users" size={44} strokeWidth={1.5} />
                  <span className="ax-empty__badge"><Icon name="arrow-right" size={20} strokeWidth={2.25} /></span>
                </div>
                <h2>{title}</h2>
                <p>This module isn’t part of this prototype yet. Head back to Members to manage accounts.</p>
                <div className="ax-empty__actions">
                  <Button hierarchy="primary" size="lg" iconLeading="users" onClick={() => handleSelect("members")}>Open members</Button>
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