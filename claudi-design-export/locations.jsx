const { useState, useEffect, useRef, useCallback } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, Avatar, Badge, StatCard } = DS;

const LOGO = "assets/chiya-logomark.svg";

/* ── Shell data (mirrors approved shell) ── */
const NAV_GROUPS = [
  { label: "Overview", items: [{ id: "dashboard", label: "Dashboard", icon: "layout-dashboard" }] },
  { label: "Management", items: [
    { id: "properties", label: "Properties",  icon: "building-2"    },
    { id: "members",    label: "Members",     icon: "users"         },
    { id: "agents",     label: "Agents",      icon: "badge-check"   },
    { id: "viewings",   label: "Viewings",    icon: "calendar-check"},
    { id: "locations",  label: "Locations",   icon: "map-pin"       },
  ]},
  { label: "Platform", items: [
    { id: "reports",  label: "Reports",            icon: "chart-column" },
    { id: "roles",    label: "Roles & permissions", icon: "key-round"    },
    { id: "settings", label: "Settings",           icon: "settings"     },
  ]},
];

const NOTIFICATIONS = [
  { id: 1, kind: "gold",  icon: "badge-check",    unread: true,  title: "Agent verification request",  desc: "Lana Aziz submitted ID documents for review.",      time: "8 minutes ago"  },
  { id: 2, kind: "brand", icon: "building-2",     unread: true,  title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.",       time: "42 minutes ago" },
  { id: 3, kind: "warn",  icon: "flag",           unread: false, title: "Listing reported",             desc: "A member flagged \"Marble Hill Villa\" for review.",  time: "2 hours ago"    },
  { id: 4, kind: "info",  icon: "calendar-check", unread: false, title: "Viewing confirmed",            desc: "12 viewings confirmed across Erbil this week.",      time: "Yesterday"      },
];
const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };
const LAYOUTS = {
  B: { name: "Search-first topbar",  desc: "Search on far left, notifications & profile on the right. Page title in content." },
  C: { name: "Sidebar-centric",      desc: "No topbar. Search under the logo; profile fixed to the sidebar foot."              },
};

/* ── Location data ── */
const LOCATION_TREE = [
  {
    id: "erbil", name: "Erbil", type: "city",
    properties: 1842, created: "Jan 12, 2023", updated: "Jun 10, 2026",
    description: "Capital city of the Kurdistan Region and the most developed urban center, with a diverse real estate market spanning luxury villas, apartments, and commercial properties.",
    children: [
      {
        id: "100-meter", name: "100 Meter", type: "district", parent: "Erbil",
        properties: 312, created: "Feb 3, 2023", updated: "May 28, 2026",
        description: "A major commercial and residential district in central Erbil, known for its wide boulevard and premium developments.",
        children: [
          { id: "empire-world", name: "Empire World", type: "project", parent: "100 Meter", properties: 86,  created: "Mar 15, 2023", updated: "Jun 2, 2026",  description: "Premium residential project within 100 Meter district, featuring luxury villas and modern apartments.", children: [] },
          { id: "dream-city",   name: "Dream City",   type: "project", parent: "100 Meter", properties: 134, created: "Mar 15, 2023", updated: "Jun 5, 2026",  description: "Large mixed-use residential community offering a wide range of property types.", children: [] },
          { id: "naz-city",     name: "Naz City",     type: "project", parent: "100 Meter", properties: 92,  created: "Apr 1, 2023",  updated: "Jun 1, 2026",  description: "Upscale residential project offering luxury villas, townhouses, and modern apartments.", children: [] },
        ],
      },
      { id: "gulan",  name: "Gulan",  type: "district",    parent: "Erbil", properties: 178, created: "Feb 3, 2023",  updated: "May 20, 2026", description: "A well-established district along Gulan Street — one of Erbil's primary commercial and residential corridors.", children: [] },
      { id: "ankawa", name: "Ankawa", type: "neighborhood", parent: "Erbil", properties: 246, created: "Feb 10, 2023", updated: "Jun 8, 2026",  description: "Upscale residential neighborhood northwest of central Erbil, popular for its amenities, restaurants, and expatriate community.", children: [] },
    ],
  },
  {
    id: "duhok", name: "Duhok", type: "city",
    properties: 614, created: "Jan 12, 2023", updated: "Jun 3, 2026",
    description: "Capital of Duhok Governorate, situated in the northern part of the Kurdistan Region with growing real estate demand across residential and commercial sectors.",
    children: [
      { id: "malta", name: "Malta", type: "district",    parent: "Duhok", properties: 88, created: "Feb 20, 2023", updated: "May 15, 2026", description: "A central residential and commercial district in Duhok, offering diverse property options across villa and apartment segments.", children: [] },
      { id: "masik", name: "Masik", type: "neighborhood",parent: "Duhok", properties: 64, created: "Mar 5, 2023",  updated: "Apr 30, 2026", description: "Residential neighborhood in Duhok with premium villa properties and a growing amenities scene.", children: [] },
    ],
  },
  {
    id: "sulaymaniyah", name: "Sulaymaniyah", type: "city",
    properties: 391, created: "Jan 12, 2023", updated: "May 25, 2026",
    description: "The second largest city of the Kurdistan Region, known for its cultural heritage, universities, and a growing commercial real estate market.",
    children: [
      { id: "goizha",  name: "Goizha",  type: "neighborhood", parent: "Sulaymaniyah", properties: 112, created: "Mar 1, 2023", updated: "May 10, 2026", description: "Scenic residential neighborhood near Goizha Mountain, prized for its views, fresh air, and upscale villa developments.", children: [] },
      { id: "raparin", name: "Raparin", type: "district",      parent: "Sulaymaniyah", properties: 89,  created: "Mar 1, 2023", updated: "Apr 20, 2026", description: "A major district in Sulaymaniyah with a diverse mix of residential and commercial properties at various price points.", children: [] },
    ],
  },
];

const KPI_DATA = [
  { key: "cities",     label: "Cities",                 icon: "map",        tone: "brand",   value: "3",     sub: "Kurdistan Region"   },
  { key: "districts",  label: "Districts & Areas",      icon: "map-pin",    tone: "info",    value: "8",     sub: "Across all cities"  },
  { key: "projects",   label: "Projects & Communities", icon: "building-2", tone: "gold",    value: "12",    sub: "Active developments" },
  { key: "properties", label: "Properties Assigned",    icon: "home",       tone: "success", value: "2,847", sub: "Mapped to locations" },
];

const TYPE_CONFIG = {
  city:         { label: "City",                variant: "brand",   icon: "map"        },
  district:     { label: "District / Area",     variant: "info",    icon: "map-pin"    },
  neighborhood: { label: "Neighborhood",        variant: "gold",    icon: "compass"    },
  project:      { label: "Project / Community", variant: "success", icon: "building-2" },
};

const TYPE_OPTIONS = [
  { value: "city",         label: "City",                 icon: "map",        sub: "Top-level location" },
  { value: "district",     label: "District / Area",      icon: "map-pin",    sub: "Belongs to a city" },
  { value: "neighborhood", label: "Neighborhood",         icon: "compass",    sub: "Under a city or district" },
  { value: "project",      label: "Project / Community",  icon: "building-2", sub: "Residential development" },
];

/* ── Helpers ── */
function flattenTree(nodes, depth = 0) {
  const out = [];
  for (const n of nodes) {
    out.push({ ...n, _depth: depth });
    if (n.children?.length) out.push(...flattenTree(n.children, depth + 1));
  }
  return out;
}

function nodeMatchesSearch(node, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  return node.children?.some(c => nodeMatchesSearch(c, q)) || false;
}

function countNodes(nodes) {
  return nodes.reduce((s, n) => s + 1 + countNodes(n.children || []), 0);
}

const ALL_FLAT   = flattenTree(LOCATION_TREE);
const TOTAL_NODES = countNodes(LOCATION_TREE);

function getParentOptions(type) {
  if (!type || type === "city") return [];
  const allowed = {
    district:     ["city"],
    neighborhood: ["city", "district"],
    project:      ["city", "district", "neighborhood"],
  }[type] || [];
  return ALL_FLAT.filter(n => allowed.includes(n.type));
}

/* ==================================================================
   CUSTOM DROPDOWN  (homepage cxpanel / cxrow style)
================================================================== */
function Dropdown({ id, options, value, onChange, disabled, error, placeholder }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const panelRef   = useRef(null);

  const openDropdown = () => {
    if (disabled || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 8, left: r.left, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = e => {
      if (!triggerRef.current?.contains(e.target) && !panelRef.current?.contains(e.target))
        setOpen(false);
    };
    const onKey = e => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown",   onKey);
    };
  }, [open]);

  const selected = options.find(o => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={["lc-dd__trigger", open && "is-open", error && "is-error", disabled && "is-disabled"].filter(Boolean).join(" ")}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openDropdown()}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="lc-dd__val">
            <span className="lc-dd__val-ic"><Icon name={selected.icon} size={14} /></span>
            <span className="lc-dd__val-txt">{selected.label}</span>
          </span>
        ) : (
          <span className="lc-dd__placeholder">{placeholder || "Select…"}</span>
        )}
        <Icon name="chevron-down" size={16}
          style={{ color: "var(--text-tertiary)", flexShrink: 0, transition: "transform .16s ease",
            transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && coords && ReactDOM.createPortal(
        <div
          ref={panelRef}
          className="lc-dd__panel"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
          role="listbox"
        >
          <div className="lc-dd__scroll">
            {options.map(o => (
              <button
                key={o.value || "__empty"}
                type="button"
                className={"lc-dd__row" + (value === o.value ? " is-selected" : "")}
                role="option"
                aria-selected={value === o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.icon && (
                  <span className="lc-dd__ic">
                    <Icon name={o.icon} size={16} />
                  </span>
                )}
                <span className="lc-dd__body">
                  <span className="lc-dd__row-title">{o.label}</span>
                  {o.sub && <span className="lc-dd__row-sub">{o.sub}</span>}
                </span>
                {value === o.value && (
                  <Icon name="check" size={15}
                    style={{ color: "var(--brand-primary)", flexShrink: 0 }} />
                )}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

/* ==================================================================
   SHELL COMPONENTS (Sidebar, Topbar — same approved shell)
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
      onClick={() => !item.disabled && onSelect && onSelect(item.id)}
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

function SidebarProfile({ collapsed, open, onToggle, onLogout, onClose }) {
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  const items = [
    { icon: "user",     label: "My profile",       action: onClose },
    { icon: "settings", label: "Account settings", action: onClose },
    { icon: "bell",     label: "Notifications",    action: onClose, count: unread },
  ];
  return (
    <div className="ax-sb-foot">
      <button type="button" className={"ax-sb-profile" + (open ? " is-open" : "")}
        aria-haspopup="true" aria-expanded={open} title={collapsed ? ADMIN.name : undefined} onClick={onToggle}>
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
            {items.map(it => (
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

function Sidebar({ layout, collapsed, drawerOpen, openMenu, setOpenMenu, onToggleCollapse, onLogout, onSelect }) {
  const cls = ["ax-sidebar", collapsed ? "is-collapsed" : "", drawerOpen ? "is-drawer-open" : ""].filter(Boolean).join(" ");
  const showProfile = layout === "C";
  const showSearch  = layout === "C";
  return (
    <aside className={cls} aria-label="Primary navigation">
      <div className="ax-sb-head">
        <a className="ax-sb-logo" href="#" onClick={e => e.preventDefault()}>
          <img src={LOGO} alt="Chiya Estate" />
          <span className="ax-sb-logo__txt"><span className="ax-sb-logo__name">Chiya<span> Estate</span></span></span>
        </a>
      </div>
      <button type="button" className="ax-collapse-btn"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={onToggleCollapse}>
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
        {NAV_GROUPS.map(g => (
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map(it => (
              <NavItem key={it.id} item={it} active={it.id === "locations"} collapsed={collapsed} onSelect={onSelect} />
            ))}
          </div>
        ))}
      </nav>
      {showProfile && (
        <SidebarProfile
          collapsed={collapsed}
          open={openMenu === "sbprofile"}
          onToggle={() => setOpenMenu(openMenu === "sbprofile" ? null : "sbprofile")}
          onLogout={onLogout}
          onClose={() => setOpenMenu(null)}
        />
      )}
    </aside>
  );
}

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
        {[{ icon: "user", label: "My profile" }, { icon: "settings", label: "Account settings" }].map(it => (
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
  const unread = NOTIFICATIONS.filter(n => n.unread).length;
  return (
    <div className="ax-menu ax-menu--notif" role="menu">
      <div className="ax-menu__head">
        <h4>Notifications</h4>
        {unread > 0 && <Badge variant="brand" size="sm">{unread} new</Badge>}
      </div>
      <div className="ax-notif-list">
        {NOTIFICATIONS.map(n => (
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

function Topbar({ layout, openMenu, setOpenMenu, onHamburger }) {
  const toggle = m => setOpenMenu(openMenu === m ? null : m);
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
            aria-label="Notifications" onClick={() => toggle("notif")}>
            <Icon name="bell" size={20} /><span className="ax-tb-dot" />
          </button>
          {openMenu === "notif" && <NotifMenu onClose={() => setOpenMenu(null)} />}
        </div>
        <div className="ax-tb-divider" />
        <div style={{ position: "relative" }}>
          <button type="button" className={"ax-tb-profile" + (openMenu === "profile" ? " is-open" : "")}
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
    </header>
  );
}

/* ==================================================================
   TOAST
================================================================== */
function LocationToast({ locationName, isOut, onDismiss }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  return (
    <div className={`lc-toast${visible && !isOut ? " is-in" : ""}${isOut ? " is-out" : ""}`}>
      <span className="lc-toast__icon"><Icon name="check" size={20} strokeWidth={2.25} /></span>
      <div className="lc-toast__body">
        <p className="lc-toast__title">Location created successfully</p>
        <p className="lc-toast__msg">The location has been added and is now available throughout the platform.</p>
        <div className="lc-toast__actions">
          <button type="button" className="lc-toast__btn lc-toast__btn--dismiss" onClick={onDismiss}>Dismiss</button>
          <button type="button" className="lc-toast__btn lc-toast__btn--view">View details</button>
        </div>
      </div>
      <button type="button" className="lc-toast__close" aria-label="Close" onClick={onDismiss}>
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
      <div className="lc-toast__progress" />
    </div>
  );
}

/* ==================================================================
   ADD / EDIT LOCATION MODAL
================================================================== */
function LocationModal({ onClose, onCreate, initialData }) {
  const isEdit = !!initialData;
  const EMPTY_FORM = { name: "", type: "", parentId: "", description: "" };
  const [form, setForm] = useState(
    initialData
      ? { name: initialData.name, type: initialData.type, parentId: "", description: initialData.description || "" }
      : EMPTY_FORM
  );
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const parentOptions = getParentOptions(form.type);
  const parentDisabled = !form.type || form.type === "city";

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.type) e.type = true;
    if (form.type && form.type !== "city" && !form.parentId) e.parentId = true;
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onCreate(form.name.trim());
  };

  // Close on Escape
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div className="lc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="lc-modal" role="dialog" aria-modal="true"
        aria-labelledby="lc-modal-title">
        {/* Head */}
        <div className="lc-modal__head">
          <div className="lc-modal__headleft">
            <span className="lc-modal__headicon">
              <Icon name={isEdit ? "pencil" : "map-pin"} size={20} strokeWidth={1.75} />
            </span>
            <h2 className="lc-modal__title" id="lc-modal-title">
              {isEdit ? "Edit location" : "Add location"}
            </h2>
          </div>
          <button type="button" className="lc-modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="lc-modal__body">
          <div className="lc-fields">
            {/* Location name */}
            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-name">Location name</label>
              <input id="lc-f-name" type="text" className={"lc-input" + (errors.name ? " is-error" : "")}
                placeholder="e.g. Italian Village, Barzan Heights…"
                value={form.name} onChange={e => { set("name", e.target.value); setErrors(er => ({ ...er, name: false })); }} />
              {errors.name && <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>Location name is required.</span>}
            </div>

            {/* Location type */}
            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-type">Location type</label>
              <Dropdown
                id="lc-f-type"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={v => { set("type", v); set("parentId", ""); setErrors(er => ({ ...er, type: false, parentId: false })); }}
                error={errors.type}
                placeholder="Select type…"
              />
              {errors.type && <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>Please select a location type.</span>}
            </div>

            {/* Parent location */}
            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-parent">
                Parent location
                {form.type === "city" && <span className="lc-optional">Not applicable for cities</span>}
              </label>
              <Dropdown
                id="lc-f-parent"
                options={parentOptions.map(n => ({
                  value: n.id,
                  label: n.name,
                  icon: TYPE_CONFIG[n.type]?.icon,
                  sub: TYPE_CONFIG[n.type]?.label,
                }))}
                value={form.parentId}
                onChange={v => { set("parentId", v); setErrors(er => ({ ...er, parentId: false })); }}
                disabled={parentDisabled}
                error={errors.parentId}
                placeholder={
                  parentDisabled
                    ? form.type === "city" ? "— Not applicable —" : "Select a type first…"
                    : "Select parent location…"
                }
              />
              {errors.parentId && <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>Please select a parent location.</span>}
            </div>

            {/* Description */}
            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-desc">
                Description <span className="lc-optional">Optional</span>
              </label>
              <textarea id="lc-f-desc" className="lc-textarea"
                placeholder="Brief description of this location, its character, or notable features…"
                value={form.description} onChange={e => set("description", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lc-modal__foot">
          <Button hierarchy="secondary" size="md" onClick={onClose}>Cancel</Button>
          <Button hierarchy="primary" size="md" iconLeading={isEdit ? "check" : "map-pin"} onClick={handleSubmit}>
            {isEdit ? "Save changes" : "Create location"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ==================================================================
   TREE NODE (recursive)
================================================================== */
function TreeNode({ node, depth, expandedIds, selectedId, onToggle, onSelect, searchQuery }) {
  const hasChildren = node.children?.length > 0;
  if (searchQuery && !nodeMatchesSearch(node, searchQuery)) return null;

  const q    = searchQuery ? searchQuery.toLowerCase() : "";
  const childHasMatch = hasChildren && q && node.children.some(c => nodeMatchesSearch(c, q));
  const isExpanded = searchQuery ? childHasMatch : expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const typeConf   = TYPE_CONFIG[node.type];

  return (
    <div>
      <div
        className={`lc-node${isSelected ? " is-selected" : ""}`}
        style={{ paddingTop: 9, paddingBottom: 9, paddingRight: 14, paddingLeft: 14 + depth * 20 }}
        onClick={() => onSelect(node)}
        role="treeitem"
        aria-selected={isSelected}
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(node); } }}
      >
        <span
          className="lc-node__toggle"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
          onClick={e => { if (hasChildren) { e.stopPropagation(); onToggle(node.id); } }}
        >
          <Icon
            name={isExpanded ? "chevron-down" : "chevron-right"}
            size={14} strokeWidth={2.5}
          />
        </span>
        <span className={`lc-node__typeicon lc-node__typeicon--${node.type}`}>
          <Icon name={typeConf.icon} size={15} strokeWidth={1.75} />
        </span>
        <span className="lc-node__name">{node.name}</span>
        <span className="lc-node__props">{node.properties.toLocaleString()}</span>
      </div>
      {isExpanded && hasChildren && node.children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          expandedIds={expandedIds}
          selectedId={selectedId}
          onToggle={onToggle}
          onSelect={onSelect}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

/* ==================================================================
   TREE PANEL
================================================================== */
function TreePanel({ expandedIds, selectedId, onToggle, onSelect, searchQuery }) {
  const hasAnyMatch = LOCATION_TREE.some(n => nodeMatchesSearch(n, searchQuery));
  return (
    <div className="lc-treepanel" role="tree" aria-label="Location hierarchy">
      <div className="lc-treepanel__head">
        <h2 className="lc-treepanel__title">Location hierarchy</h2>
        <span className="lc-treepanel__badge">{TOTAL_NODES}</span>
      </div>
      <div className="lc-tree">
        {LOCATION_TREE.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            expandedIds={expandedIds}
            selectedId={selectedId}
            onToggle={onToggle}
            onSelect={onSelect}
            searchQuery={searchQuery}
          />
        ))}
        {searchQuery && !hasAnyMatch && (
          <div className="lc-tree-empty">No locations match your search.</div>
        )}
      </div>
    </div>
  );
}

/* ==================================================================
   DETAIL PANEL
================================================================== */
function DetailPanel({ location, onEdit, onDelete }) {
  if (!location) {
    return (
      <div className="lc-detailpanel">
        <div className="lc-detail-empty">
          <div className="lc-detail-empty__art">
            <Icon name="map-pin" size={28} strokeWidth={1.5} />
          </div>
          <h3>Select a location</h3>
          <p>Choose a city, district, neighborhood, or project from the hierarchy to view its details.</p>
        </div>
      </div>
    );
  }

  const typeConf   = TYPE_CONFIG[location.type];
  const childCount = location.children?.length || 0;
  const childLabel = location.type === "city" ? "Districts / Areas" :
                     location.type === "district" ? "Projects" : "Sub-locations";

  const fields = [
    { label: "Location type",       value: <Badge variant={typeConf.variant} icon={typeConf.icon} size="sm">{typeConf.label}</Badge> },
    { label: "Parent location",     value: location.parent || "—", muted: !location.parent },
    { label: "Properties assigned", value: location.properties.toLocaleString(), num: true },
    { label: childLabel,            value: childCount, num: true },
    { label: "Created",             value: location.created },
    { label: "Last updated",        value: location.updated },
  ];

  return (
    <div className="lc-detailpanel">
      {/* Head */}
      <div className="lc-detail__head">
        <div className="lc-detail__headleft">
          <span className={`lc-detail__icon lc-detail__icon--${location.type}`}>
            <Icon name={typeConf.icon} size={24} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="lc-detail__name">{location.name}</h2>
            <div className="lc-detail__meta">
              <Badge variant={typeConf.variant} size="sm">{typeConf.label}</Badge>
              {location.parent && (
                <span className="lc-detail__parent">
                  <Icon name="chevron-right" size={12} strokeWidth={2.25} />
                  {location.parent}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="lc-detail__headactions">
          <Button hierarchy="secondary" size="sm" iconLeading="pencil" onClick={onEdit}>Edit</Button>
        </div>
      </div>

      {/* Body */}
      <div className="lc-detail__body">
        <div className="lc-detail__grid">
          {fields.map(({ label, value, num, muted }) => (
            <div key={label} className="lc-detail__field">
              <span className="lc-detail__fieldlabel">{label}</span>
              <span className={`lc-detail__fieldval${num ? " lc-detail__fieldval--num" : ""}${muted ? " lc-detail__fieldval--muted" : ""}`}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {location.description && (
          <div>
            <div className="lc-detail__desclabel">Description</div>
            <p className="lc-detail__desctext">{location.description}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="lc-detail__foot">
        <Button hierarchy="primary" iconLeading="building-2">View related properties</Button>
        <Button hierarchy="secondary" iconLeading="share-2">Share</Button>
        <button type="button" className="lc-detail__delbtn" onClick={onDelete}>
          <Icon name="trash-2" size={15} strokeWidth={1.75} />
          Delete location
        </button>
      </div>
    </div>
  );
}

/* ==================================================================
   LOCATIONS PAGE
================================================================== */
function LocationsPage() {
  const [expandedIds, setExpandedIds] = useState(new Set(["erbil", "100-meter", "duhok", "sulaymaniyah"]));
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [modal, setModal]               = useState(null); // null | "add" | "edit"
  const [toasts, setToasts]             = useState([]);

  const toggleExpanded = useCallback(id => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const pushToast = useCallback(name => {
    const id = Date.now();
    setToasts(ts => [...ts, { id, name }]);
    setTimeout(() => setToasts(ts => ts.map(t => t.id === id ? { ...t, out: true } : t)), 6000);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 6380);
  }, []);

  const dismissToast = useCallback(id => {
    setToasts(ts => ts.map(t => t.id === id ? { ...t, out: true } : t));
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 380);
  }, []);

  const handleCreate = useCallback(name => {
    setModal(null);
    pushToast(name);
  }, [pushToast]);

  const handleDelete = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <>
      {/* Page header */}
      <header className="lc-head">
        <div>
          <h1 className="lc-head__title">Locations</h1>
          <p className="lc-head__sub">Manage cities, districts, neighborhoods, and residential projects used throughout the platform.</p>
        </div>
        <div className="lc-head__action">
          <Button hierarchy="primary" iconLeading="plus" onClick={() => setModal("add")}>Add location</Button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="lc-kpis">
        {KPI_DATA.map(k => (
          <StatCard key={k.key} label={k.label} value={k.value} icon={k.icon} tone={k.tone} sub={k.sub} />
        ))}
      </div>

      {/* Search */}
      <div className="lc-searchrow">
        <div className="lc-searchfield">
          <span className="lc-searchfield__lead"><Icon name="search" size={18} /></span>
          <input
            type="text"
            placeholder="Search locations, areas, neighborhoods, or projects…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            aria-label="Search locations"
          />
        </div>
      </div>

      {/* Split view */}
      <div className="lc-split">
        <TreePanel
          expandedIds={expandedIds}
          selectedId={selectedNode?.id}
          onToggle={toggleExpanded}
          onSelect={setSelectedNode}
          searchQuery={searchQuery}
        />
        <DetailPanel
          location={selectedNode}
          onEdit={() => setModal("edit")}
          onDelete={handleDelete}
        />
      </div>

      {/* Modal */}
      {modal && (
        <LocationModal
          onClose={() => setModal(null)}
          onCreate={handleCreate}
          initialData={modal === "edit" ? selectedNode : null}
        />
      )}

      {/* Toasts */}
      <div className="lc-toaster" aria-live="polite">
        {toasts.map(t => (
          <LocationToast
            key={t.id}
            locationName={t.name}
            isOut={!!t.out}
            onDismiss={() => dismissToast(t.id)}
          />
        ))}
      </div>
    </>
  );
}

/* ==================================================================
   APP SHELL
================================================================== */
const TWEAK_DEFAULTS = { layout: "B" };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const layout     = t.layout === "C" ? "C" : "B";
  const showTopbar = layout !== "C";

  const [collapsed,   setCollapsed]   = useState(() => window.innerWidth >= 768);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [openMenu,    setOpenMenu]    = useState(null);
  const catRef = useRef(window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop");

  useEffect(() => {
    const onResize = () => {
      const w   = window.innerWidth;
      const cat = w < 768 ? "mobile" : w < 1024 ? "tablet" : "desktop";
      if (cat !== catRef.current) {
        catRef.current = cat;
        if (cat === "tablet") setCollapsed(true);
        if (cat !== "mobile") setDrawerOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const h = e => { if (e.key === "Escape") { setOpenMenu(null); setDrawerOpen(false); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => { setOpenMenu(null); }, [layout]);

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
  }, []);

  return (
    <div className="ax-app" data-layout={layout}>
      <Sidebar
        layout={layout}
        collapsed={collapsed}
        drawerOpen={drawerOpen}
        openMenu={openMenu}
        setOpenMenu={setOpenMenu}
        onToggleCollapse={() => setCollapsed(c => !c)}
        onLogout={() => setOpenMenu(null)}
        onSelect={handleSelect}
      />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        {showTopbar && (
          <Topbar
            layout={layout}
            openMenu={openMenu}
            setOpenMenu={setOpenMenu}
            onHamburger={() => setDrawerOpen(true)}
          />
        )}
        {!showTopbar && (
          <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        )}
        <main className="ax-content">
          <LocationsPage />
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Shell layout" />
        <TweakRadio
          label="Version"
          value={layout}
          options={["B", "C"]}
          onChange={v => setTweak("layout", v)}
        />
        <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(41,38,27,.62)", padding: "1px 0 2px" }}>
          <b style={{ color: "rgba(41,38,27,.88)" }}>{LAYOUTS[layout].name}</b><br />
          {LAYOUTS[layout].desc}
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
