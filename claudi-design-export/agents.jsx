const { useState, useEffect, useRef, useCallback, useMemo } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard, Select, Input, Checkbox } = DS;

/* Local field wrapper (DS Field isn't exported) — reuses cx-field tokens */
function Field({ label, htmlFor, children }) {
  return (
    <div className="cx-field">
      {label && <label className="cx-field__label" htmlFor={htmlFor}>{label}</label>}
      {children}
    </div>);

}

const LOGO = "assets/chiya-logomark.svg";

/* ==================================================================
   SHELL DATA  (matches the approved Admin shell)
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
   AGENTS — KPI DATA
================================================================== */
const KPI_CARDS = [
{ key: "total", label: "Total agents", icon: "badge-check", tone: "brand", value: "128", sub: "Across all cities" },
{ key: "verified", label: "Verified agents", icon: "shield-check", tone: "success", value: "104", sub: "ID-checked · active" },
{ key: "pending", label: "Pending verification", icon: "clock", tone: "gold", value: "18", sub: "Awaiting document review" }];


/* ==================================================================
   AGENTS — DIRECTORY DATA
================================================================== */
const TOTAL_AGENTS = 128;

const VERIFICATION = {
  "Verified": { variant: "brand", icon: "badge-check", label: "Verified" },
  "Pending": { variant: "warning", icon: "clock", label: "Pending" }
};
const VERIFICATION_TABS = [
{ id: "", label: "View all" },
{ id: "Verified", label: "Verified" },
{ id: "Pending", label: "Pending" }];

const AGENT_STATUS = {
  "Active": { variant: "success", dot: true },
  "Suspended": { variant: "error", dot: true }
};
const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Zakho"];

const AGENTS = [
{ id: "A-2041", name: "Lana Aziz", agency: "Chiya Prime", phone: "+964 770 552 1190", email: "lana.aziz@chiya.estate", city: "Erbil", area: "Ankawa", verification: "Verified", listings: 14, sold: 32, rented: 19, members: 28, status: "Active",
  img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2038", name: "Karwan Mahmoud", agency: "Erbil Realty", phone: "+964 750 118 4420", email: "karwan.m@chiya.estate", city: "Erbil", area: "Downtown", verification: "Verified", listings: 11, sold: 41, rented: 12, members: 22, status: "Active",
  img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2032", name: "Dashne Salar", agency: "Sulay Homes", phone: "+964 773 220 5567", email: "dashne.salar@chiya.estate", city: "Sulaymaniyah", area: "Bakhtiari", verification: "Verified", listings: 9, sold: 27, rented: 24, members: 19, status: "Active",
  img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2027", name: "Shilan Aram", agency: "Chiya Prime", phone: "+964 751 209 3341", email: "shilan.aram@chiya.estate", city: "Erbil", area: "Italian Village", verification: "Pending", listings: 4, sold: 6, rented: 8, members: 7, status: "Active",
  img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2021", name: "Diyar Salih", agency: "Duhok Estate", phone: "+964 770 118 5540", email: "diyar.salih@chiya.estate", city: "Duhok", area: "Masike", verification: "Verified", listings: 16, sold: 22, rented: 15, members: 31, status: "Active",
  img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2017", name: "Berivan Khalid", agency: "Chiya Prime", phone: "+964 773 884 2210", email: "berivan.k@chiya.estate", city: "Erbil", area: "Dream City", verification: "Verified", listings: 21, sold: 38, rented: 9, members: 44, status: "Active",
  img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2009", name: "Hewa Botan", agency: "Zagros Living", phone: "+964 751 778 9012", email: "hewa.botan@chiya.estate", city: "Sulaymaniyah", area: "Ranya", verification: "Pending", listings: 2, sold: 0, rented: 3, members: 4, status: "Active",
  img: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=160&q=70" },
{ id: "A-2003", name: "Nyan Faraj", agency: "Erbil Realty", phone: "+964 770 415 6688", email: "nyan.faraj@chiya.estate", city: "Erbil", area: "Gulan", verification: "Verified", listings: 7, sold: 18, rented: 27, members: 16, status: "Suspended",
  img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=70" },
{ id: "A-1998", name: "Rebwar Aziz", agency: "Duhok Estate", phone: "+964 751 660 1925", email: "rebwar.aziz@chiya.estate", city: "Duhok", area: "Zakho Road", verification: "Verified", listings: 12, sold: 14, rented: 21, members: 13, status: "Active",
  img: null },
{ id: "A-1991", name: "Tara Jamal", agency: "Halabja Homes", phone: "+964 750 332 7799", email: "tara.jamal@chiya.estate", city: "Halabja", area: "Center", verification: "Pending", listings: 3, sold: 1, rented: 5, members: 6, status: "Active",
  img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=160&q=70" },
{ id: "A-1985", name: "Sirwan Tofiq", agency: "Zagros Living", phone: "+964 751 904 7782", email: "sirwan.t@chiya.estate", city: "Sulaymaniyah", area: "Salim St", verification: "Verified", listings: 18, sold: 29, rented: 11, members: 25, status: "Active",
  img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=160&q=70" },
{ id: "A-1979", name: "Awat Rashid", agency: "Zakho Realty", phone: "+964 750 600 1234", email: "awat.rashid@chiya.estate", city: "Zakho", area: "Center", verification: "Verified", listings: 6, sold: 9, rented: 17, members: 10, status: "Active",
  img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=70" }];

/* ── Extend the directory to the full roster (128) so the table paginates
      across many pages. Deterministic generation — stable across renders. ── */
(function buildRoster() {
  const FIRST = ["Aland", "Avan", "Baban", "Chiman", "Darya", "Evar", "Hawre", "Jiyan", "Kani", "Lavin",
    "Media", "Nali", "Peshraw", "Rojan", "Sazan", "Twana", "Zhino", "Aram", "Bawar", "Choman",
    "Delan", "Ezel", "Fenk", "Goran", "Helin", "Karox", "Midya", "Newroz", "Payam", "Rezan",
    "Soran", "Tania", "Viyan", "Warya", "Yad", "Zana", "Hana", "Shad", "Bahar", "Kosrat"];
  const LAST = ["Ahmad", "Barzani", "Hama", "Hassan", "Ibrahim", "Karim", "Mustafa", "Omar", "Qadir", "Rasul",
    "Salih", "Tahir", "Wali", "Xoshnaw", "Yusuf", "Zebari", "Amin", "Faraj", "Hawrami", "Mohammed"];
  const AGENCIES = ["Chiya Prime", "Erbil Realty", "Sulay Homes", "Duhok Estate", "Halabja Homes", "Zagros Living", "Zakho Realty"];
  const CITY_AREAS = {
    Erbil: ["Ankawa", "Downtown", "Italian Village", "Dream City", "Gulan", "Empire"],
    Sulaymaniyah: ["Bakhtiari", "Ranya", "Salim St", "Sarchnar", " Azadi"],
    Duhok: ["Masike", "Zakho Road", "Nizarke", "Malta"],
    Halabja: ["Center", "Kani Ashqan"],
    Zakho: ["Center", "Bedar"]
  };
  const CITY_LIST = Object.keys(CITY_AREAS);
  const PORTRAITS = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=160&q=70",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=70",
    null
  ];
  let idNum = 1973;
  let i = 0;
  while (AGENTS.length < TOTAL_AGENTS) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 7 + 3) % LAST.length];
    const city = CITY_LIST[(i * 3) % CITY_LIST.length];
    const areas = CITY_AREAS[city];
    const area = areas[(i * 5) % areas.length];
    const verified = i % 4 !== 0;            // ~75% verified
    const suspended = i % 11 === 0;          // a few suspended
    const listings = verified ? (i * 13 % 24) + 1 : (i * 3 % 5);
    AGENTS.push({
      id: "A-" + idNum,
      name: first + " " + last,
      agency: AGENCIES[(i * 2) % AGENCIES.length],
      phone: "+964 7" + (50 + (i % 3) * 20) + " " + (100 + (i * 37) % 900) + " " + (1000 + (i * 53) % 9000),
      email: (first + "." + last[0]).toLowerCase() + "@chiya.estate",
      city, area,
      verification: verified ? "Verified" : "Pending",
      listings,
      sold: (i * 17) % 46,
      rented: (i * 11) % 30,
      members: (i * 7) % 40 + 2,
      status: suspended ? "Suspended" : "Active",
      img: PORTRAITS[i % PORTRAITS.length]
    });
    idNum -= 6;
    i++;
  }
})();


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

function Topbar({ layout, openMenu, setOpenMenu, onHamburger }) {
  const toggle = (m) => setOpenMenu(openMenu === m ? null : m);
  const searchFirst = layout === "B";
  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>
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
   AGENTS — PAGE HEADER
================================================================== */
function AgentsHeader({ onAdd }) {
  return (
    <header className="ap-head">
      <div className="ap-head__intro">
        <h1 className="ap-head__title">Agents</h1>
        <p className="ap-head__sub">Manage agent profiles, verification status, assigned listings, and performance.</p>
      </div>
      <div className="ap-head__action">
        <Button hierarchy="primary" size="lg" iconLeading="user-plus" onClick={onAdd}>Add agent</Button>
      </div>
    </header>);

}

function KpiSummary() {
  return (
    <div className="ap-kpis">
      {KPI_CARDS.map((c) =>
      <StatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
      )}
    </div>);

}

/* ==================================================================
   ROW / CARD ACTION MENU
================================================================== */
function ActionMenu({ open, onToggle, onClose, btnClass, ariaLabel, status, onStatus, onDelete, onEdit, onView }) {
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);
  const suspended = status === "Suspended";
  useEffect(() => {
    if (!open || !btnRef.current) {setPos(null);return;}
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 196) });
  }, [open]);
  const menu = pos && ReactDOM.createPortal(
    <div className="ag-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
      <div className="ag-amenu__sect">
        <button type="button" className="ag-aitem" role="menuitem" onClick={onView || onClose}><Icon name="id-card" size={17} />View details</button>
        <button type="button" className="ag-aitem" role="menuitem" onClick={onEdit || onClose}><Icon name="pencil" size={17} />Edit agent</button>
        <button type="button" className="ag-aitem" role="menuitem" onClick={onStatus}>
          <Icon name={suspended ? "circle-check" : "circle-pause"} size={17} />{suspended ? "Activate agent" : "Suspend agent"}
        </button>
        <button type="button" className="ag-aitem" role="menuitem" onClick={onClose}><Icon name="badge-check" size={17} />Manage verification</button>
      </div>
      <div className="ag-amenu__sect">
        <button type="button" className="ag-aitem mp-aitem--danger ag-aitem--danger" role="menuitem" onClick={onDelete}><Icon name="trash-2" size={17} />Delete agent</button>
      </div>
    </div>,
    document.body
  );
  return (
    <React.Fragment>
      <button ref={btnRef} type="button" className={(btnClass || "") + (open ? " is-open" : "")} aria-label={ariaLabel || "Agent actions"}
      aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </React.Fragment>);

}

/* ==================================================================
   AGENT CARD  (premium, public-site language + admin data)
================================================================== */
function AgentCard({ a, openMenu, setOpenMenu, onView, onEditRequest, onStatusRequest, onDeleteRequest }) {
  const ver = VERIFICATION[a.verification] || VERIFICATION.Pending;
  const st = AGENT_STATUS[a.status] || { variant: "neutral" };
  const verified = a.verification === "Verified";
  return (
    <article className="ag-card">
      <div className="ag-card__status">
        <Badge variant={st.variant} size="sm" dot={st.dot} className="ag-statusbadge">{a.status}</Badge>
      </div>
      <div className="ag-actions">
        <ActionMenu open={openMenu === a.id}
        onToggle={() => setOpenMenu(openMenu === a.id ? null : a.id)}
        onClose={() => setOpenMenu(null)}
        onView={() => { setOpenMenu(null); onView(a); }}
        onEdit={() => { setOpenMenu(null); onEditRequest(a); }}
        onStatus={() => { setOpenMenu(null); onStatusRequest(a); }}
        onDelete={() => { setOpenMenu(null); onDeleteRequest(a); }}
        btnClass="ag-card__kebab" ariaLabel={"Actions for " + a.name} status={a.status} />
      </div>

      <div className="ag-card__top">
        <Avatar src={a.img || undefined} name={a.name} size="xl" verified={verified} ring={!verified} />
        <div className="ag-card__name">{a.name}</div>
        <div className="ag-card__agency"><Icon name="building-2" size={13} />{a.agency}</div>
        <div className="ag-card__id">{a.id}</div>
        <div className="ag-card__verify">
          <Badge variant={ver.variant} size="sm" icon={ver.icon}>{ver.label}</Badge>
        </div>
      </div>

      <div className="ag-card__contact">
        <div className="ag-card__row ag-card__row--phone"><Icon name="phone" size={15} /><span>{a.phone}</span></div>
        <div className="ag-card__row"><Icon name="mail" size={15} /><span>{a.email}</span></div>
        <div className="ag-card__row"><Icon name="map-pin" size={15} /><span>{a.city} · {a.area}</span></div>
      </div>

      <div className="ag-card__stats">
        <div className="ag-stat ag-stat--listings"><b>{a.listings}</b><span>Listings</span></div>
        <div className="ag-stat"><b>{a.sold}</b><span>Sold</span></div>
        <div className="ag-stat"><b>{a.rented}</b><span>Rented</span></div>
        <div className="ag-stat"><b>{a.members}</b><span>Members</span></div>
      </div>

      <div className="ag-card__foot">
        <Button hierarchy="primary" size="md" iconLeading="id-card" onClick={() => onView(a)}>View details</Button>
        <Button hierarchy="secondary" size="md" iconLeading="pencil" onClick={() => onEditRequest(a)}>Edit</Button>
      </div>
    </article>);

}

function AgentGrid({ rows, openMenu, setOpenMenu, onView, onEditRequest, onStatusRequest, onDeleteRequest }) {
  if (rows.length === 0) return <NoResults />;
  return (
    <div className="ag-grid">
      {rows.map((a) =>
      <AgentCard key={a.id} a={a} openMenu={openMenu} setOpenMenu={setOpenMenu} onView={onView} onEditRequest={onEditRequest} onStatusRequest={onStatusRequest} onDeleteRequest={onDeleteRequest} />
      )}
    </div>);

}

/* ==================================================================
   AGENT TABLE VIEW
================================================================== */
function AgentRow({ a, openMenu, setOpenMenu, onView, onEditRequest, onStatusRequest, onDeleteRequest }) {
  const ver = VERIFICATION[a.verification] || VERIFICATION.Pending;
  const st = AGENT_STATUS[a.status] || { variant: "neutral" };
  const verified = a.verification === "Verified";
  const num = (v, mod) =>
  <span className={"ag-num" + (v === 0 ? " ag-num--zero" : "") + (mod ? " ag-num--" + mod : "")}>{v}</span>;

  return (
    <div className="ag-row">
      <div className="ag-col--agent">
        <div className="ag-agent">
          <Avatar src={a.img || undefined} name={a.name} size="md" verified={verified} ring={!verified} />
          <div className="ag-agent__body">
            <span className="ag-agent__name">{a.name}</span>
            <span className="ag-agent__id">{a.id}</span>
          </div>
        </div>
      </div>
      <div className="ag-col--verification">
        <span className="ag-celllabel">Verification</span>
        <Badge variant={ver.variant} size="sm" icon={ver.icon}>{ver.label}</Badge>
      </div>
      <div className="ag-col--phone">
        <span className="ag-celllabel">Phone</span>
        <span className="ag-cell ag-cell--phone"><Icon name="phone" size={14} />{a.phone}</span>
      </div>
      <div className="ag-col--city">
        <span className="ag-celllabel">City</span>
        <span className="ag-cell"><Icon name="map-pin" size={14} />{a.city}</span>
      </div>
      <div className="ag-col--listings ag-col--num">
        <span className="ag-celllabel">Listings</span>{num(a.listings, "listings")}
      </div>
      <div className="ag-col--sold ag-col--num">
        <span className="ag-celllabel">Sold</span>{num(a.sold)}
      </div>
      <div className="ag-col--rented ag-col--num">
        <span className="ag-celllabel">Rented</span>{num(a.rented)}
      </div>
      <div className="ag-col--status">
        <span className="ag-celllabel">Status</span>
        <Badge variant={st.variant} size="sm" dot={st.dot} className="ag-statusbadge">{a.status}</Badge>
      </div>
      <div className="ag-col--actions">
        <div className="ag-actions">
          <ActionMenu open={openMenu === a.id}
          onToggle={() => setOpenMenu(openMenu === a.id ? null : a.id)}
          onClose={() => setOpenMenu(null)}
          onView={() => { setOpenMenu(null); onView(a); }}
          onEdit={() => { setOpenMenu(null); onEditRequest(a); }}
          onStatus={() => { setOpenMenu(null); onStatusRequest(a); }}
          onDelete={() => { setOpenMenu(null); onDeleteRequest(a); }}
          btnClass="ag-kebab" ariaLabel={"Actions for " + a.name} status={a.status} />
        </div>
      </div>
    </div>);

}

function AgentTable({ rows, openMenu, setOpenMenu, currentPage, totalItems, onPageChange, onView, onEditRequest, onStatusRequest, onDeleteRequest }) {
  return (
    <section className="ag-tablecard ag-tablecard--joined">
      <div className="ag-tbl">
        <div className="ag-thead" role="row">
          <span className="ag-th ag-col--agent">Agent</span>
          <span className="ag-th ag-col--verification">Verification</span>
          <span className="ag-th ag-col--phone">Phone</span>
          <span className="ag-th ag-col--city">City</span>
          <span className="ag-th ag-th--num ag-col--listings">Listings</span>
          <span className="ag-th ag-th--num ag-col--sold">Sold</span>
          <span className="ag-th ag-th--num ag-col--rented">Rented</span>
          <span className="ag-th ag-col--status">Status</span>
          <span className="ag-th ag-col--actions">Actions</span>
        </div>
        {rows.length > 0 ?
        rows.map((a) => <AgentRow key={a.id} a={a} openMenu={openMenu} setOpenMenu={setOpenMenu} onView={onView} onEditRequest={onEditRequest} onStatusRequest={onStatusRequest} onDeleteRequest={onDeleteRequest} />) :
        <NoResults inset />}
      </div>
      <PaginationFooter currentPage={currentPage} totalItems={totalItems} onPageChange={onPageChange} />
    </section>);

}

const AGENTS_PER_PAGE = 10;

function PaginationFooter({ currentPage, totalItems, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / AGENTS_PER_PAGE));
  const start = Math.min((currentPage - 1) * AGENTS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * AGENTS_PER_PAGE, totalItems);

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };

  if (totalItems === 0) return null;
  return (
    <div className="ag-tablefooter">
      <span className="ag-pagination__info">
        Showing <b>{start.toLocaleString("en-US")}–{end.toLocaleString("en-US")}</b> of <b>{totalItems.toLocaleString("en-US")}</b> agents
      </span>
      <div className="ag-pagination">
        <button type="button" className="ag-page-btn ag-page-btn--nav"
        disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />Previous
        </button>
        {getPages().map((p, i) =>
        p === "…" ?
        <span key={"e" + i} className="ag-page-ellipsis">…</span> :

        <button key={p} type="button"
        className={"ag-page-btn" + (p === currentPage ? " is-active" : "")}
        onClick={() => onPageChange(p)}>{p}</button>
        )}
        <button type="button" className="ag-page-btn ag-page-btn--nav"
        disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next<Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>);

}

function NoResults({ inset }) {
  return (
    <div className="ag-noresults" style={inset ? { border: "none", boxShadow: "none", background: "transparent" } : undefined}>
      <span className="ag-noresults__art"><Icon name="search-x" size={26} strokeWidth={1.6} /></span>
      <h3>No agents found</h3>
      <p>Try adjusting your search or clearing the filters to see more agents.</p>
    </div>);

}

/* ==================================================================
   CUSTOM SELECT — matches the Properties page filter dropdown
================================================================== */
function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState(null);

  const placeholder = options.find((o) => o.value === "")?.label || "Select";
  const items = options.filter((o) => o.value !== "");

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
      if (document.querySelector(".ap-custdrop")?.contains(e.target)) return;
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
    <div className="ap-selwrap" ref={btnRef}>
      <button type="button"
        className={"ap-selbtn" + (open ? " is-open" : "") + (value ? " has-value" : "")}
        onClick={toggle}>
        <span className="ap-selbtn__label">
          {items.find((o) => o.value === value)?.label || placeholder}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open && pos && ReactDOM.createPortal(
        <div className="ap-custdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
          {items.map((o) => (
            <button key={o.value} type="button"
              className={"ap-custdrop__item" + (value === o.value ? " is-selected" : "")}
              onClick={() => { onChange(value === o.value ? "" : o.value); setOpen(false); }}>
              {o.label}
              {value === o.value && <Icon name="check" size={15} strokeWidth={2.5} />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>);

}

/* ==================================================================
   PANEL — "All Agents" header: title + count + view switch + controls
================================================================== */
function AgentsPanel({ filters, setFilter, onClear, hasActive, view, setView, rows, filtersOpen, onToggleFilters }) {
  const opt = (arr) => arr.map((v) => ({ value: v, label: v }));
  const shown = hasActive ? rows.length : TOTAL_AGENTS;
  const activeAdvCount = ["city", "listings", "status"].filter((k) => filters[k]).length;
  return (
    <section className={"ap-panel" + (view === "table" ? " ap-panel--joined" : "")}>
      <header className="ap-panel__head">

        {/* ── Title row ── */}
        <div className="ap-panel__titlerow">
          <div className="ap-panel__heading">
            <h2 className="ap-panel__title">All agents</h2>
            <span className="ap-panel__count">{shown.toLocaleString("en-US")}</span>
          </div>
          {hasActive &&
          <div className="ap-resultnote">
              <span><b>{rows.length}</b> of {TOTAL_AGENTS.toLocaleString("en-US")} agents shown</span>
            </div>
          }
        </div>

        {/* ── Verification tabs + view switch + search + filters (single row) ── */}
        <div className="ap-tabrow">
          <div className="ap-tabs" role="tablist" aria-label="Filter by verification">
            {VERIFICATION_TABS.map((tab) =>
            <button key={tab.id || "all"} type="button" role="tab"
            aria-selected={filters.verification === tab.id}
            className={"ap-tab" + (filters.verification === tab.id ? " is-active" : "")}
            onClick={() => setFilter("verification", tab.id)}>
                {tab.label}
              </button>
            )}
          </div>
          <div className="ap-tabrow__right">
            <div className="ap-tabsearch">
              <span className="ap-tabsearch__lead"><Icon name="search" size={16} /></span>
              <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Search agents…" aria-label="Search agents" />
            </div>
            <button type="button"
            className={"ap-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")}
            aria-expanded={filtersOpen} onClick={onToggleFilters}>
              <Icon name="sliders-horizontal" size={15} />
              Filters
              {activeAdvCount > 0 && <span className="ap-filterbtn__badge">{activeAdvCount}</span>}
            </button>
            <div className="ap-viewswitch" role="tablist" aria-label="View mode">
              <button type="button" role="tab" aria-label="Cards" aria-selected={view === "cards"} className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")}>
                <Icon name="layout-grid" size={16} />
              </button>
              <button type="button" role="tab" aria-selected={view === "table"} className={view === "table" ? "is-active" : ""} onClick={() => setView("table")} aria-label="Table">
                <Icon name="list" size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Expandable filter bar ── */}
        <div className={"ap-filterbar" + (filtersOpen ? " is-open" : "")}>
          <div className="ap-filterbar__inner">
            <div className="ap-filterbar__row">
              <CustomSelect value={filters.city} onChange={(v) => setFilter("city", v)}
              options={[{ value: "", label: "City" }, ...opt(CITIES)]} />
              <CustomSelect value={filters.status} onChange={(v) => setFilter("status", v)}
              options={[{ value: "", label: "Status" }, ...opt(["Active", "Suspended"])]} />
              <div className="ap-filterbar__actions">
                <button type="button" className="ap-clearbtn" onClick={onClear}><Icon name="x" size={14} />Clear all</button>
              </div>
            </div>
          </div>
        </div>

      </header>
    </section>);

}

/* ==================================================================
   CHANGE STATUS CONFIRM MODAL  (suspend / activate)
================================================================== */
function StatusAgentModal({ agent, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const suspending = agent.status !== "Suspended";
  const copy = suspending ? {
    icon: "circle-pause", iconCls: "mp-modal__icon--warn",
    title: "Suspend agent",
    body: "Are you sure you want to suspend this agent? They will no longer be able to access their account or appear to clients until reactivated.",
    cta: "Suspend agent", ctaCls: "mp-modal__confirm--warn"
  } : {
    icon: "circle-check", iconCls: "mp-modal__icon--brand",
    title: "Activate agent",
    body: "Are you sure you want to activate this agent? They will regain access to their account and become visible to clients again.",
    cta: "Activate agent", ctaCls: "mp-modal__confirm--brand"
  };
  return ReactDOM.createPortal(
    <div className="mp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="ag-status-title">
        <div className={"mp-modal__icon " + copy.iconCls}>
          <Icon name={copy.icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="ag-status-title">{copy.title}</h2>
        <p className="mp-modal__body">{copy.body}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className={"mp-modal__confirm " + copy.ctaCls} onClick={onConfirm}>{copy.cta}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   DELETE CONFIRM MODAL
================================================================== */
function DeleteAgentModal({ agent, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return ReactDOM.createPortal(
    <div className="mp-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="ag-del-title">
        <div className="mp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="ag-del-title">Delete agent?</h2>
        <p className="mp-modal__body">
          Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone and will permanently remove the agent profile.
        </p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="mp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />Delete agent
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   TOAST
================================================================== */
const AGENT_PROFILE_PAGE = "Admin-Agent Details.html";
const TOAST_DURATION = 6000;

function Toast({ toast, onDismiss, onView, onUndo }) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(onDismiss, 340);
  }, [onDismiss]);
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
  const cls = ["ag-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  const danger = toast.variant === "danger";
  const warn = toast.variant === "warn";
  const iconCls = danger ? " ag-toast__icon--danger" : warn ? " ag-toast__icon--warn" : "";
  const iconName = toast.icon || (danger ? "trash-2" : "check");
  return ReactDOM.createPortal(
    <div className="ag-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" style={{ "--ag-toast-dur": TOAST_DURATION + "ms" }}
      onMouseEnter={pause} onMouseLeave={startTimer}>
        <span className={"ag-toast__icon" + iconCls}><Icon name={iconName} size={20} strokeWidth={danger ? 1.9 : 2.3} /></span>
        <div className="ag-toast__body">
          <p className="ag-toast__title">{toast.title}</p>
          <p className="ag-toast__msg">{toast.message}</p>
          <div className="ag-toast__actions">
            <button type="button" className="ag-toast__btn ag-toast__btn--dismiss" onClick={close}>Dismiss</button>
            {!danger &&
            <button type="button" className="ag-toast__btn ag-toast__btn--view" onClick={onView}>View details</button>
            }
            {danger && toast.undo &&
            <button type="button" className="ag-toast__btn ag-toast__btn--view" onClick={onUndo}>
              <Icon name="undo-2" size={15} strokeWidth={2} style={{ marginRight: 6 }} /> Undo
            </button>
            }
          </div>
        </div>
        <button type="button" className="ag-toast__close" aria-label="Dismiss notification" onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="ag-toast__progress" />
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   ADD AGENT MODAL
================================================================== */
const EXPERIENCE_OPTIONS = [
{ value: "<1", label: "Less than 1 year" },
{ value: "1-2", label: "1–2 years" },
{ value: "3-5", label: "3–5 years" },
{ value: "6-10", label: "6–10 years" },
{ value: "10+", label: "10+ years" }];

const LANGUAGE_OPTIONS = ["English", "Kurdish", "Arabic", "Turkish", "Persian"];
const SERVICE_AREA_OPTIONS = ["Erbil", "Ankawa", "Dream City", "Italian Village", "Gulan", "Empire", "Sulaymaniyah", "Duhok", "Halabja", "Zakho"];

function AvatarUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return; // max 2MB
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div className="aa-photo">
      <div className="aa-photo__ring">
        <button type="button" className={"aa-photo__disc" + (value ? " has-img" : "")}
        onClick={() => inputRef.current?.click()} aria-label="Upload profile photo">
          {value ? <img src={value} alt="" /> : <Icon name="image-plus" size={26} strokeWidth={1.6} />}
        </button>
        <button type="button" className="aa-photo__edit"
        onClick={() => inputRef.current?.click()} aria-label={value ? "Change photo" : "Upload photo"}>
          <Icon name={value ? "pencil" : "camera"} size={14} strokeWidth={2} />
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden onChange={onPick} />
      </div>
      <div className="aa-photo__meta">
        <span className="aa-photo__label">Profile Photo <span>(Optional)</span></span>
        {value ?
        <button type="button" className="aa-photo__remove" onClick={() => onChange(null)}>
          <Icon name="trash-2" size={13} strokeWidth={2} />Remove photo
        </button> :
        <span className="aa-photo__hint">JPG or PNG, max 2MB</span>}
      </div>
    </div>);

}

function MultiSelect({ values, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const searchable = options.length > 6;
  const calcPos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
  };
  const toggle = () => { if (!open) { calcPos(); setQuery(""); } setOpen((v) => !v); };
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current?.contains(e.target)) return;
      if (document.querySelector(".aa-msdrop")?.contains(e.target)) return;
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
  const toggleVal = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const remove = (e, v) => { e.stopPropagation(); onChange(values.filter((x) => x !== v)); };

  /* keep the control a fixed single line: show as many chips as fit, collapse the rest into a +N chip */
  const ctrlRef = useRef(null);
  const measRef = useRef(null);
  const [visible, setVisible] = useState(values.length);
  React.useLayoutEffect(() => {
    const ctrl = ctrlRef.current, meas = measRef.current;
    if (!ctrl || !meas) return;
    const measure = () => {
      const cs = getComputedStyle(ctrl);
      const avail = ctrl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const gap = 6, reserve = 46; // +N badge allowance
      const chips = [...meas.children];
      let used = 0, count = 0;
      for (let i = 0; i < chips.length; i++) {
        const w = chips[i].getBoundingClientRect().width + (count > 0 ? gap : 0);
        const needBadge = (chips.length - (i + 1)) > 0 ? reserve + gap : 0;
        if (used + w + needBadge <= avail) { used += w; count++; } else break;
      }
      setVisible(Math.max(count, chips.length ? 1 : 0));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ctrl);
    return () => ro.disconnect();
  }, [values]);

  const shown = values.slice(0, visible);
  const hidden = values.length - shown.length;

  return (
    <div className="aa-ms" ref={ref}>
      <div className={"aa-ms__control" + (open ? " is-open" : "")} onClick={toggle} ref={ctrlRef}>
        {values.length === 0 && <span className="aa-ms__placeholder">{placeholder}</span>}
        {shown.map((v) =>
        <span key={v} className="aa-ms__chip">{v}
            <button type="button" className="aa-ms__chipx" onClick={(e) => remove(e, v)} aria-label={"Remove " + v}>
              <Icon name="x" size={12} strokeWidth={2.5} />
            </button>
          </span>
        )}
        {hidden > 0 && <span className="aa-ms__chip aa-ms__chip--count">+{hidden}</span>}
        <span className="aa-ms__chev"><Icon name="chevron-down" size={16} /></span>
      </div>
      {/* hidden measuring row — full chip set, never visible */}
      <div className="aa-ms__measure" aria-hidden="true" ref={measRef}>
        {values.map((v) =>
        <span key={v} className="aa-ms__chip">{v}
            <span className="aa-ms__chipx"><Icon name="x" size={12} strokeWidth={2.5} /></span>
          </span>
        )}
      </div>
      {open && pos && ReactDOM.createPortal(
        <div className="aa-msdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
          {searchable &&
          <div className="aa-msdrop__search">
            <Icon name="search" size={15} />
            <input type="text" autoFocus value={query} placeholder="Search areas…"
              onChange={(e) => setQuery(e.target.value)} />
            {query &&
            <button type="button" className="aa-msdrop__searchx" aria-label="Clear search" onClick={() => setQuery("")}>
              <Icon name="x" size={14} strokeWidth={2.5} />
            </button>}
          </div>}
          <div className="aa-msdrop__list">
            {options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())).map((o) => {
              const sel = values.includes(o);
              return (
                <button key={o} type="button" className={"aa-msdrop__item" + (sel ? " is-selected" : "")} onClick={() => toggleVal(o)}>
                  <span className="aa-msdrop__check">{sel && <Icon name="check" size={12} strokeWidth={3.2} />}</span>
                  {o}
                </button>);
            })}
            {searchable && options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())).length === 0 &&
            <div className="aa-msdrop__empty">No areas match “{query.trim()}”</div>}
          </div>
        </div>,
        document.body)}
    </div>);

}

function AddAgentModal({ onCancel, onCreate }) {
  const [photo, setPhoto] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState(["English", "Kurdish"]);
  const [areas, setAreas] = useState(["Erbil"]);
  const [status, setStatus] = useState("Active");
  const [invite, setInvite] = useState(true);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const canCreate = fullName.trim() && email.trim();
  const submit = (e) => {
    e.preventDefault();
    if (!canCreate) return;
    onCreate({ name: fullName.trim(), email: email.trim(), img: photo, status });
  };

  return ReactDOM.createPortal(
    <div className="aa-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <form className="aa-modal" role="dialog" aria-modal="true" aria-labelledby="aa-title" onSubmit={submit}>
        <header className="aa-modal__head">
          <div className="aa-modal__headmain">
            <span className="aa-modal__icon"><Icon name="user-plus" size={22} strokeWidth={1.9} /></span>
            <div>
              <h2 className="aa-modal__title" id="aa-title">Add Agent</h2>
              <p className="aa-modal__desc">Create a new agent profile and invite them to access the platform.</p>
            </div>
          </div>
          <button type="button" className="aa-modal__close" aria-label="Close" onClick={onCancel}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="aa-modal__body">
          <AvatarUpload value={photo} onChange={setPhoto} />

          <section className="aa-sect">
            <Input label="Full Name" id="aa-name" placeholder="e.g. Lana Aziz" iconLeading="user"
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="aa-grid2">
              <Input label="Phone Number" id="aa-phone" type="tel" placeholder="+964 770 000 0000" iconLeading="phone"
              value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email Address" id="aa-email" type="email" placeholder="name@chiya.estate" iconLeading="mail"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-stack">
              <Field label="Languages Spoken">
                <MultiSelect values={languages} onChange={setLanguages} options={LANGUAGE_OPTIONS} placeholder="Select languages" />
              </Field>
              <Field label="Service Areas">
                <MultiSelect values={areas} onChange={setAreas} options={SERVICE_AREA_OPTIONS} placeholder="Select areas" />
              </Field>
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-grid2">
              <Field label="Years of Experience" htmlFor="aa-exp">
                <CustomSelect value={experience} onChange={setExperience}
                options={[{ value: "", label: "Select" }, ...EXPERIENCE_OPTIONS]} />
              </Field>
              <Field label="Status" htmlFor="aa-status">
                <CustomSelect value={status} onChange={(v) => setStatus(v || "Active")}
                options={[{ value: "", label: "Select status" }, { value: "Active", label: "Active" }, { value: "Suspended", label: "Suspended" }]} />
              </Field>
            </div>
            <div className="aa-invitebox">
              <Checkbox id="aa-invite" checked={invite} onChange={(e) => setInvite(e.target.checked)}
              label="Send Invitation Email"
              description="The agent will receive an email invitation to create their password and access the platform." />
            </div>
          </section>
        </div>

        <footer className="aa-modal__foot">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>Cancel</button>
          <Button hierarchy="primary" size="md" type="submit" iconLeading="user-plus" disabled={!canCreate}>Create Agent</Button>
        </footer>
      </form>
    </div>,
    document.body
  );
}

/* ==================================================================
   DISCARD CHANGES CONFIRM (nested over Edit Agent modal)
================================================================== */
function DiscardChangesDialog({ onContinue, onDiscard }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); onContinue(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onContinue]);
  return ReactDOM.createPortal(
    <div className="mp-modal-backdrop" style={{ zIndex: 600 }}
    onMouseDown={(e) => { if (e.target === e.currentTarget) onContinue(); }}>
      <div className="mp-modal" role="alertdialog" aria-modal="true" aria-labelledby="ea-discard-title">
        <div className="mp-modal__icon mp-modal__icon--warn">
          <Icon name="triangle-alert" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="ea-discard-title">Discard changes?</h2>
        <p className="mp-modal__body">You have unsaved changes. Are you sure you want to leave without saving?</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onDiscard}>Discard changes</button>
          <button type="button" className="mp-modal__confirm mp-modal__confirm--brand" onClick={onContinue}>Continue editing</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   EDIT AGENT MODAL  (same layout as Add Agent, pre-filled)
================================================================== */
function deriveAreas(a) {
  const set = [];
  [a.area, a.city].forEach((x) => { if (SERVICE_AREA_OPTIONS.includes(x) && !set.includes(x)) set.push(x); });
  if (set.length === 0) set.push("Erbil");
  return set;
}

function EditAgentModal({ agent, onCancel, onSave }) {
  const initial = useMemo(() => ({
    photo: agent.img || null,
    fullName: agent.name || "",
    phone: agent.phone || "",
    email: agent.email || "",
    experience: agent.experience || "3-5",
    languages: agent.languages || ["English", "Kurdish"],
    areas: agent.areas || deriveAreas(agent),
    status: agent.status || "Active"
  }), [agent]);

  const [photo, setPhoto] = useState(initial.photo);
  const [fullName, setFullName] = useState(initial.fullName);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [experience, setExperience] = useState(initial.experience);
  const [languages, setLanguages] = useState(initial.languages);
  const [areas, setAreas] = useState(initial.areas);
  const [status, setStatus] = useState(initial.status);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const current = { photo, fullName, phone, email, experience, languages, areas, status };
  const dirty = JSON.stringify(current) !== JSON.stringify(initial);

  const requestClose = useCallback(() => {
    if (dirty) setConfirmDiscard(true); else onCancel();
  }, [dirty, onCancel]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !confirmDiscard) requestClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, confirmDiscard]);

  const canSave = fullName.trim() && email.trim();
  const submit = (e) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ ...agent, name: fullName.trim(), email: email.trim(), phone: phone.trim() || agent.phone, img: photo, status, experience, languages, areas });
  };

  return ReactDOM.createPortal(
    <div className="aa-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) requestClose(); }}>
      <form className="aa-modal" role="dialog" aria-modal="true" aria-labelledby="ea-title" onSubmit={submit}>
        <header className="aa-modal__head">
          <div className="aa-modal__headmain">
            <span className="aa-modal__icon"><Icon name="user-pen" size={22} strokeWidth={1.9} /></span>
            <div>
              <h2 className="aa-modal__title" id="ea-title">Edit Agent</h2>
              <p className="aa-modal__desc">Update agent information, professional details, and account access settings.</p>
            </div>
          </div>
          <button type="button" className="aa-modal__close" aria-label="Close" onClick={requestClose}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="aa-modal__body">
          <AvatarUpload value={photo} onChange={setPhoto} />

          <section className="aa-sect">
            <Input label="Full Name" id="ea-name" placeholder="e.g. Lana Aziz" iconLeading="user"
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="aa-grid2">
              <Input label="Phone Number" id="ea-phone" type="tel" placeholder="+964 770 000 0000" iconLeading="phone"
              value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email Address" id="ea-email" type="email" placeholder="name@chiya.estate" iconLeading="mail"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-stack">
              <Field label="Languages Spoken">
                <MultiSelect values={languages} onChange={setLanguages} options={LANGUAGE_OPTIONS} placeholder="Select languages" />
              </Field>
              <Field label="Service Areas">
                <MultiSelect values={areas} onChange={setAreas} options={SERVICE_AREA_OPTIONS} placeholder="Select areas" />
              </Field>
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-grid2">
              <Field label="Years of Experience" htmlFor="ea-exp">
                <CustomSelect value={experience} onChange={setExperience}
                options={[{ value: "", label: "Select" }, ...EXPERIENCE_OPTIONS]} />
              </Field>
              <Field label="Status" htmlFor="ea-status">
                <CustomSelect value={status} onChange={(v) => setStatus(v || "Active")}
                options={[{ value: "", label: "Select status" }, { value: "Active", label: "Active" }, { value: "Suspended", label: "Suspended" }]} />
              </Field>
            </div>
          </section>
        </div>

        <footer className="aa-modal__foot">
          <button type="button" className="mp-modal__cancel" onClick={requestClose}>Cancel</button>
          <Button hierarchy="primary" size="md" type="submit" iconLeading="check" disabled={!canSave}>Save Changes</Button>
        </footer>
      </form>
      {confirmDiscard && <DiscardChangesDialog onContinue={() => setConfirmDiscard(false)} onDiscard={onCancel} />}
    </div>,
    document.body
  );
}

/* ==================================================================
   AGENTS PAGE
================================================================== */
const EMPTY_FILTERS = { q: "", verification: "", city: "", listings: "", status: "" };

function AgentsPage() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [view, setView] = useState(() => localStorage.getItem("chiya.agents.view") || "cards");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [toast, setToast] = useState(null);
  const [agents, setAgents] = useState(() => AGENTS.map((a) => ({ ...a, status: a.status || "Active" })));
  const [statusTarget, setStatusTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const lastDeleted = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters(EMPTY_FILTERS);
  const hasActive = Object.values(filters).some(Boolean);

  useEffect(() => {localStorage.setItem("chiya.agents.view", view);}, [view]);

  const handleAdd = () => setAddOpen(true);
  const handleCreate = () => {
    setAddOpen(false);
    setToast({
      variant: "success", icon: "badge-check",
      title: "Agent Created Successfully",
      message: "The agent profile has been created and an invitation email has been sent."
    });
  };
  const viewProfile = () => {window.location.href = AGENT_PROFILE_PAGE;};

  const handleSaveEdit = (updated) => {
    setAgents((prev) => prev.map((a) => a.id === updated.id ? { ...a, ...updated } : a));
    setEditTarget(null);
    setToast({
      variant: "success", icon: "badge-check",
      title: "Agent Updated Successfully",
      message: "The agent profile has been updated."
    });
  };

  const handleStatusConfirm = () => {
    const target = statusTarget;
    const suspending = target.status !== "Suspended";
    const next = suspending ? "Suspended" : "Active";
    setAgents((prev) => prev.map((a) => a.id === target.id ? { ...a, status: next } : a));
    setStatusTarget(null);
    setToast(suspending ? {
      variant: "warn", icon: "circle-pause",
      title: "Agent suspended",
      message: "The agent account has been suspended successfully."
    } : {
      variant: "success", icon: "circle-check",
      title: "Agent activated",
      message: "The agent account has been activated successfully."
    });
  };
  const handleDeleteConfirm = () => {
    const target = deleteTarget;
    const index = agents.findIndex((a) => a.id === target.id);
    lastDeleted.current = { agent: target, index };
    setAgents((prev) => prev.filter((a) => a.id !== target.id));
    setDeleteTarget(null);
    setToast({
      variant: "danger",
      undo: true,
      title: "Agent deleted",
      message: target.name + " has been permanently removed from the Agents directory."
    });
  };
  const handleUndo = () => {
    const d = lastDeleted.current;
    if (d) {
      setAgents((prev) => {
        const next = prev.slice();
        next.splice(Math.min(d.index, next.length), 0, d.agent);
        return next;
      });
      lastDeleted.current = null;
    }
    setToast({
      variant: "success", icon: "rotate-ccw",
      title: "Deletion undone",
      message: (d ? d.agent.name : "The agent") + " has been restored to the Agents directory."
    });
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return agents.filter((a) => {
      if (filters.verification && a.verification !== filters.verification) return false;
      if (filters.city && a.city !== filters.city) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.listings === "with" && a.listings === 0) return false;
      if (filters.listings === "none" && a.listings > 0) return false;
      if (filters.listings === "10+" && a.listings < 10) return false;
      if (q) {
        const hay = [a.name, a.phone, a.email, a.agency, a.id, a.city].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, agents]);

  // reset to first page whenever the filtered result set changes
  useEffect(() => { setCurrentPage(1); }, [rows.length, view]);
  const totalPages = Math.max(1, Math.ceil(rows.length / AGENTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((page - 1) * AGENTS_PER_PAGE, page * AGENTS_PER_PAGE);

  return (
    <React.Fragment>
      <AgentsHeader onAdd={handleAdd} />
      <KpiSummary />
      <AgentsPanel filters={filters} setFilter={setFilter} onClear={clear} hasActive={hasActive}
      view={view} setView={setView} rows={rows}
      filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((o) => !o)} />
      {view === "cards" ?
      <AgentGrid rows={rows} openMenu={openMenu} setOpenMenu={setOpenMenu} onView={viewProfile} onEditRequest={setEditTarget}
      onStatusRequest={setStatusTarget} onDeleteRequest={setDeleteTarget} /> :
      <AgentTable rows={pagedRows} openMenu={openMenu} setOpenMenu={setOpenMenu}
      currentPage={page} totalItems={rows.length} onPageChange={setCurrentPage} onView={viewProfile} onEditRequest={setEditTarget}
      onStatusRequest={setStatusTarget} onDeleteRequest={setDeleteTarget} />}
      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      {addOpen && <AddAgentModal onCancel={() => setAddOpen(false)} onCreate={handleCreate} />}
      {editTarget && <EditAgentModal agent={editTarget} onCancel={() => setEditTarget(null)} onSave={handleSaveEdit} />}
      {statusTarget && <StatusAgentModal agent={statusTarget} onCancel={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />}
      {deleteTarget && <DeleteAgentModal agent={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} onView={viewProfile} onUndo={handleUndo} />}
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
  const [active, setActive] = useState("agents");
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
        <Topbar layout={layout} openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        }
        {!showTopbar &&
        <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        }
        <main className="ax-content" data-screen-label="Admin · Agents">
          {active === "agents" ?
          <AgentsPage /> :

          <div className="ax-empty">
                <div className="ax-empty__art">
                  <Icon name="badge-check" size={44} strokeWidth={1.5} />
                  <span className="ax-empty__badge"><Icon name="arrow-right" size={20} strokeWidth={2.25} /></span>
                </div>
                <h2>{title}</h2>
                <p>This module isn’t part of this prototype yet. Head back to Agents to manage agent profiles.</p>
                <div className="ax-empty__actions">
                  <Button hierarchy="primary" size="lg" iconLeading="badge-check" onClick={() => handleSelect("agents")}>Open agents</Button>
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