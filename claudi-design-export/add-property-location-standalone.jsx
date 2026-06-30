const { useState, useEffect, useRef, useCallback } = React;
const DS = window.ChiyaEstateDesignSystem_686f57;
const { Icon, Button, IconButton, Avatar, Badge, Input, Textarea, Select, Notice } = DS;

const __res = window.__resources || {};
const LOGO = __res.logomark || "assets/chiya-logomark.svg";

/* ==================================================================
   SHELL DATA  (matches the approved Admin Properties shell)
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

const NOTIFICATIONS = [
  { id: 1, kind: "gold", icon: "badge-check", unread: true, title: "Agent verification request", desc: "Lana Aziz submitted ID documents for review.", time: "8 minutes ago" },
  { id: 2, kind: "brand", icon: "building-2", unread: true, title: "New listing pending approval", desc: "Olive Grove Estate · Ankawa, Erbil — $1.2M.", time: "42 minutes ago" },
  { id: 3, kind: "warn", icon: "flag", unread: false, title: "Listing reported", desc: "A member flagged “Marble Hill Villa” for review.", time: "2 hours ago" },
  { id: 4, kind: "info", icon: "calendar-check", unread: false, title: "Viewing confirmed", desc: "12 viewings confirmed across Erbil this week.", time: "Yesterday" },
];

const ADMIN = { name: "Rêbîn Kawa", role: "Super Admin", email: "rebin@chiya.estate" };

const LAYOUTS = {
  B: { name: "Search-first topbar", desc: "Topbar becomes a utility strip — search on the far left, notifications & profile on the right." },
  C: { name: "Sidebar-centric", desc: "No topbar. Search sits under the logo and the profile is fixed to the sidebar foot with its own menu." },
};

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
   ADD PROPERTY — WORKFLOW STEPS
================================================================== */
const STEPS = [
  "Property details",
  "Location",
  "Media",
  "Amenities & features",
  "Ownership & assignment",
  "Review & publish",
];
function ProgressStepper({ active }) {
  const nextLabel = STEPS[active + 1];
  return (
    <React.Fragment>
      <ol className="ap-steps" aria-label="Listing progress">
        {STEPS.map((label, i) => {
          const done = i < active;
          const isActive = i === active;
          const cls = ["ap-step", done ? "is-done" : "", isActive ? "is-active" : ""].filter(Boolean).join(" ");
          return (
            <React.Fragment key={label}>
              <li className={cls} aria-current={isActive ? "step" : undefined}>
                <span className="ap-step__dot">
                  {done && <Icon name="check" size={14} strokeWidth={3} />}
                </span>
                <span className="ap-step__label">{label}</span>
              </li>
              {i < STEPS.length - 1 && <span className={"ap-conn" + (i < active ? " is-done" : "")} aria-hidden="true" />}
            </React.Fragment>
          );
        })}
      </ol>

      {/* compact readout for mobile */}
      <div className="ap-steps-mini">
        <svg className="ap-steps-mini__ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border-default)" strokeWidth="3" />
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--brand-primary)" strokeWidth="3"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - (active + 1) / STEPS.length)}
            transform="rotate(-90 20 20)" />
          <text x="20" y="20" textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, fill: "var(--text-primary)" }}>
            {active + 1}/{STEPS.length}
          </text>
        </svg>
        <div className="ap-steps-mini__txt">
          <span className="ap-steps-mini__now">{STEPS[active]}</span>
          {nextLabel && <span className="ap-steps-mini__next">Next · {nextLabel}</span>}
        </div>
      </div>
    </React.Fragment>
  );
}

/* ==================================================================
   MAP PICKER  (stylized placeholder map · Step 2)
================================================================== */
function MapPicker() {
  return (
    <div className="ap-map" role="application" aria-label="Map location picker">
      <svg className="ap-map__svg" viewBox="0 0 800 392" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        {/* land base */}
        <rect width="800" height="392" fill="#E8EAED" />
        {/* park patches */}
        <rect x="56" y="44" width="150" height="120" rx="14" fill="#D6E0C4" />
        <rect x="612" y="232" width="150" height="128" rx="14" fill="#D6E0C4" />
        {/* river */}
        <path d="M-20 96 C 150 150, 250 60, 430 130 S 720 210, 840 168 L 840 226 C 720 268, 560 210, 430 188 S 150 208, -20 154 Z" fill="#C2D4DA" />
        {/* building blocks */}
        <g fill="#DCDFE3">
          <rect x="250" y="56" width="92" height="56" rx="6" />
          <rect x="356" y="56" width="120" height="56" rx="6" />
          <rect x="250" y="232" width="92" height="60" rx="6" />
          <rect x="356" y="232" width="78" height="60" rx="6" />
          <rect x="448" y="232" width="120" height="60" rx="6" />
          <rect x="250" y="304" width="180" height="64" rx="6" />
          <rect x="612" y="56" width="92" height="56" rx="6" />
          <rect x="56" y="304" width="150" height="64" rx="6" />
        </g>
        {/* streets */}
        <g stroke="#F4F5F7" strokeLinecap="round">
          <line x1="0" y1="200" x2="800" y2="216" strokeWidth="20" />
          <line x1="232" y1="0" x2="232" y2="392" strokeWidth="16" />
          <line x1="586" y1="0" x2="586" y2="392" strokeWidth="16" />
          <line x1="0" y1="36" x2="800" y2="36" strokeWidth="10" />
          <line x1="0" y1="300" x2="800" y2="300" strokeWidth="10" />
          <line x1="438" y1="0" x2="438" y2="392" strokeWidth="9" />
        </g>
        {/* diagonal avenue */}
        <line x1="-20" y1="392" x2="500" y2="-20" stroke="#EEF0F2" strokeWidth="13" strokeLinecap="round" />
      </svg>

      {/* floating search */}
      <div className="ap-map__search">
        <Icon name="search" size={18} />
        <input type="text" placeholder="Search address, place, or coordinates…" aria-label="Search map" />
        <button type="button" className="ap-map__search-btn"><Icon name="locate-fixed" size={15} />Locate</button>
      </div>

      {/* center pin */}
      <div className="ap-map__pin">
        <span className="ap-map__pin-ic"><Icon name="map-pin" size={22} strokeWidth={2.25} /></span>
        <span className="ap-map__pin-shadow" />
      </div>

      {/* my-location */}
      <button type="button" className="ap-map__locate" aria-label="Use my location"><Icon name="navigation" size={19} /></button>

      {/* zoom controls */}
      <div className="ap-map__zoom">
        <button type="button" className="ap-map__zbtn" aria-label="Zoom in"><Icon name="plus" size={19} strokeWidth={2.25} /></button>
        <button type="button" className="ap-map__zbtn" aria-label="Zoom out"><Icon name="minus" size={19} strokeWidth={2.25} /></button>
      </div>

      {/* hint */}
      <div className="ap-map__hint"><Icon name="move" size={14} />Drag the map to position the pin</div>
    </div>
  );
}

/* ---------- field building blocks ---------- */
function FieldLabel({ children, optional, htmlFor }) {
  return (
    <label className="ap-label" htmlFor={htmlFor}>
      {children}
      {optional && <span className="ap-label__opt">(Optional)</span>}
    </label>
  );
}

function RadioCards({ value, onChange, options }) {
  return (
    <div className="ap-cards" role="radiogroup">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on}
            className={"ap-rcard" + (on ? " is-on" : "")} onClick={() => onChange(o.value)}>
            <span className="ap-rcard__ic"><Icon name={o.icon} size={20} /></span>
            <span className="ap-rcard__txt">
              <span className="ap-rcard__title">{o.label}</span>
              <span className="ap-rcard__sub">{o.sub}</span>
            </span>
            <span className="ap-rcard__check"><Icon name="check" size={12} strokeWidth={3} /></span>
          </button>
        );
      })}
    </div>
  );
}

function ChoiceChips({ value, onChange, options }) {
  return (
    <div className="ap-chips" role="radiogroup">
      {options.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" role="radio" aria-checked={on}
            className={"ap-chip" + (on ? " is-on" : "")} onClick={() => onChange(o)}>
            <span className="ap-chip__dot" />{o}
          </button>
        );
      })}
    </div>
  );
}

function Segmented({ value, onChange, options }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div className="ap-seg" role="radiogroup">
      <span className={"ap-seg__thumb is-" + idx} />
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on}
            className={"ap-seg__btn" + (on ? " is-on" : "")} onClick={() => onChange(o.value)}>
            {o.icon && <Icon name={o.icon} size={17} />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

function Stepper({ value, onChange, min = 0, suffix }) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(value + 1);
  return (
    <div className="ap-stepper">
      <button type="button" className="ap-stepper__btn" aria-label="Decrease" onClick={dec} disabled={value <= min}>
        <Icon name="minus" size={18} strokeWidth={2.25} />
      </button>
      <span className="ap-stepper__val">
        {value}{suffix && <small>{suffix}</small>}
      </span>
      <button type="button" className="ap-stepper__btn" aria-label="Increase" onClick={inc}>
        <Icon name="plus" size={18} strokeWidth={2.25} />
      </button>
    </div>
  );
}

function ComboSelect({ side, value, onChange, options }) {
  return (
    <div className={"ap-combo__sel ap-combo__sel--" + side}>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label="Unit">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="ap-combo__sel__chev"><Icon name="chevron-down" size={16} /></span>
    </div>
  );
}

/* ==================================================================
   STEP 3 · MEDIA  components
================================================================== */
const COVER_IMG = __res.coverImg || "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1280&q=70";
const GALLERY_IMGS = [
  { id: "g1", url: __res.galleryImg1 || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=640&q=70", cover: true },
  { id: "g2", url: __res.galleryImg2 || "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=640&q=70" },
  { id: "g3", url: __res.galleryImg3 || "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=640&q=70" },
  { id: "g4", url: __res.galleryImg4 || "https://images.unsplash.com/photo-1600210492493-0946911123ea?auto=format&fit=crop&w=640&q=70" },
  { id: "g5", url: __res.galleryImg5 || "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=640&q=70" },
];

const GUIDELINES = [
  "Use high-quality, well-lit images",
  "Upload at least 5 photos (minimum recommended)",
  "Lead with the strongest exterior or interior shot",
  "Avoid blurry, dark, or low-resolution images",
  "Do not upload images with watermarks",
];

function CoverImage() {
  return (
    <div className="ap-cover">
      <img className="ap-cover__img" src={COVER_IMG} alt="Cover preview" />
      <div className="ap-cover__grad" />
      <span className="ap-cover__badge"><Icon name="star" size={14} strokeWidth={2.5} />Cover photo</span>
      <div className="ap-cover__actions">
        <IconButton icon="repeat-2" label="Replace cover image" variant="glass" />
        <IconButton icon="trash-2" label="Remove cover image" variant="glass" />
      </div>
      <span className="ap-cover__foot">
        <Icon name="image" size={14} />exterior-front.jpg
        <span className="ap-cover__dot" />2.4 MB
      </span>
    </div>
  );
}

function GalleryGrid() {
  return (
    <div className="ap-gal">
      {GALLERY_IMGS.map((g) => (
        <div className="ap-gal__item" key={g.id} role="group" aria-label="Gallery image">
          <img className="ap-gal__img" src={g.url} alt="" />
          <span className="ap-gal__top" />
          <span className="ap-gal__handle" aria-label="Drag to reorder" title="Drag to reorder">
            <Icon name="grip-vertical" size={15} />
          </span>
          <div className="ap-gal__acts">
            <button type="button" className={"ap-gal__abtn" + (g.cover ? " is-on" : "")}
              aria-label="Set as cover" title="Set as cover">
              <Icon name="star" size={14} strokeWidth={2.25} />
            </button>
            <button type="button" className="ap-gal__abtn ap-gal__abtn--danger" aria-label="Remove image" title="Remove">
              <Icon name="x" size={15} strokeWidth={2.5} />
            </button>
          </div>
          {g.cover && <span className="ap-gal__cover"><Icon name="star" size={11} strokeWidth={2.5} />Cover</span>}
        </div>
      ))}
      <button type="button" className="ap-drop ap-gal__add" aria-label="Add more images">
        <span className="ap-drop__ic"><Icon name="plus" size={20} strokeWidth={2.25} /></span>
        <span className="ap-drop__title">Add more</span>
      </button>
    </div>
  );
}

function VideoUpload() {
  const pct = 64;
  return (
    <div className="ap-vid">
      <div className="ap-vid__row">
        <span className="ap-vid__ic"><Icon name="video" size={22} /></span>
        <div className="ap-vid__meta">
          <span className="ap-vid__name">olive-grove-walkthrough.mp4</span>
          <span className="ap-vid__sub">84.2 MB · uploading…</span>
        </div>
        <button type="button" className="ap-vid__cancel" aria-label="Cancel upload" title="Cancel">
          <Icon name="x" size={17} strokeWidth={2.25} />
        </button>
      </div>
      <div>
        <div className="ap-vid__track"><span className="ap-vid__fill" style={{ width: pct + "%" }} /></div>
        <div className="ap-vid__pct" style={{ marginTop: 8 }}>
          <span>Uploading video</span>
          <b>{pct}%</b>
        </div>
      </div>
    </div>
  );
}

function GuidelinesPanel() {
  return (
    <div className="ap-guide">
      <span className="ap-guide__ic"><Icon name="sparkles" size={20} /></span>
      <div className="ap-guide__body">
        <span className="ap-guide__title">Photo guidelines</span>
        <ul className="ap-guide__list">
          {GUIDELINES.map((g) => (
            <li key={g}><Icon name="check" size={15} strokeWidth={2.5} />{g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ==================================================================
   ADD PROPERTY — STEP 1 FORM
================================================================== */
const PROPERTY_TYPES = ["Villa", "Apartment", "House", "Land", "Commercial", "Office", "Building"];
const CONDITIONS = ["New", "Good", "Needs renovation"];
const CITIES = ["Erbil", "Sulaymaniyah", "Duhok", "Halabja", "Kirkuk", "Zakho"];
const DISTRICTS = ["Ankawa", "Italian Village", "Dream City", "Empire World", "English Village", "Downtown", "Naz City"];

/* ---------- Step 5 · Ownership & assignment data ---------- */
const AGENTS = [
  { id: "lana", name: "Lana Aziz", phone: "+964 750 118 4420", avatar: __res.agentLanaAp || "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=160&q=70" },
  { id: "darin", name: "Darin Hassan", phone: "+964 751 220 9087", avatar: __res.agentDarin || "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=70" },
  { id: "rebwar", name: "Rebwar Salih", phone: "+964 770 904 3318", avatar: __res.agentRebwar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=70" },
  { id: "shilan", name: "Shilan Omar", phone: "+964 750 661 7725", avatar: __res.agentShilan || "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=70" },
  { id: "karwan", name: "Karwan Tahir", phone: "+964 751 503 2964", avatar: __res.agentKarwan || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=70" },
];

function AgentSummary({ agent, onClear }) {
  return (
    <div className="ap-agentcard">
      <Avatar src={agent.avatar} name={agent.name} size="lg" verified />
      <div className="ap-agentcard__meta">
        <span className="ap-agentcard__name">
          {agent.name}
          <Badge variant="brand" size="sm" icon="badge-check">Verified</Badge>
        </span>
        <span className="ap-agentcard__phone"><Icon name="phone" size={14} />{agent.phone}</span>
      </div>
      <button type="button" className="ap-agentcard__clear" onClick={onClear}>
        <Icon name="repeat-2" size={15} />Change
      </button>
    </div>
  );
}

/* ---------- Step 4 · Amenities & features data ---------- */
const FURNISHING = ["Unfurnished", "Semi-furnished", "Fully furnished"];
const ORIENTATIONS = ["North facing", "South facing", "East facing", "West facing"];
const AMENITIES = [
  { label: "Swimming pool", icon: "waves" },
  { label: "Garden", icon: "trees" },
  { label: "Gym", icon: "dumbbell" },
  { label: "Elevator", icon: "arrow-up-down" },
  { label: "Balcony", icon: "fence" },
  { label: "Security", icon: "shield-check" },
  { label: "CCTV", icon: "cctv" },
  { label: "Smart home", icon: "house-wifi" },
  { label: "Generator", icon: "zap" },
  { label: "Storage room", icon: "package" },
  { label: "Maid room", icon: "bed-single" },
  { label: "Fireplace", icon: "flame" },
  { label: "Play area", icon: "blocks" },
  { label: "BBQ area", icon: "utensils-crossed" },
  { label: "Laundry room", icon: "washing-machine" },
  { label: "Central AC", icon: "air-vent" },
];

/* ---------- Step 4 building blocks ---------- */
function SubHead({ title, desc, optional }) {
  return (
    <div className="ap-subhead">
      <h3 className="ap-subhead__title">{title}{optional && <span className="ap-label__opt" style={{ marginLeft: 8 }}>(Optional)</span>}</h3>
      <p className="ap-subhead__desc">{desc}</p>
    </div>
  );
}

function AmenityGrid({ value, onChange }) {
  const toggle = (label) =>
    onChange(value.includes(label) ? value.filter((x) => x !== label) : [...value, label]);
  return (
    <div className="ap-amen" role="group" aria-label="Amenities">
      {AMENITIES.map((a) => {
        const on = value.includes(a.label);
        return (
          <button key={a.label} type="button" aria-pressed={on}
            className={"ap-amen__item" + (on ? " is-on" : "")} onClick={() => toggle(a.label)}>
            <span className="ap-amen__ic"><Icon name={a.icon} size={16} /></span>
            <span className="ap-amen__label">{a.label}</span>
            {on && <span className="ap-amen__check"><Icon name="check" size={11} strokeWidth={3} /></span>}
          </button>
        );
      })}
    </div>
  );
}

function CustomAmenities({ items, onAdd, onRemove }) {
  const [val, setVal] = useState("");
  const add = () => { const t = val.trim(); if (!t) return; onAdd(t); setVal(""); };
  return (
    <div className="ap-custom-wrap">
      <div className="ap-custom">
        <input className="ap-custom__input" type="text" placeholder="Amenity name" aria-label="Custom amenity name"
          value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={add}>Add amenity</Button>
      </div>
      {items.length > 0 && (
        <div className="ap-taglist">
          {items.map((it, i) => (
            <span className="ap-tag" key={it + i}>
              {it}
              <button type="button" className="ap-tag__rm" aria-label={"Remove " + it} onClick={() => onRemove(i)}>
                <Icon name="x" size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   STEP 6 · REVIEW & SUBMIT  building blocks
================================================================== */
function ReviewSection({ icon, title, onEdit, children }) {
  return (
    <div className="ap-rev__sect">
      <div className="ap-rev__head">
        <h3 className="ap-rev__htitle">
          <span className="ap-rev__hic"><Icon name={icon} size={18} /></span>
          {title}
        </h3>
        <button type="button" className="ap-rev__edit" onClick={onEdit}>
          Edit<Icon name="arrow-right" size={15} strokeWidth={2.25} />
        </button>
      </div>
      {children}
    </div>
  );
}

function RevItem({ k, v, full, price, tnum }) {
  const empty = v === undefined || v === null || v === "" || v === "—";
  const cls = ["ap-rev__v", price ? "ap-rev__v--price" : "", tnum ? "cx-tnum" : "", empty ? "ap-rev__v--muted" : ""].filter(Boolean).join(" ");
  return (
    <div className={"ap-rev__item" + (full ? " ap-rev__item--full" : "")}>
      <span className="ap-rev__k">{k}</span>
      <span className={cls}>{empty ? "Not provided" : v}</span>
    </div>
  );
}

/* ==================================================================
   PROPERTY PUBLISHED — SUCCESS STATE  (final step, after Publish)
================================================================== */
const PUBLISHED = {
  title: "Olive Grove Estate",
  address: "Ankawa, Erbil",
  price: "$450,000",
  listing: "For sale",
  beds: 3,
  baths: 2,
  area: "420 m²",
  ref: "CHE-2026-0418",
  cover: COVER_IMG,
  agent: AGENTS[0],
};

const SUCCESS_DETAILS = [
  { icon: "globe", title: "Searchable on platform", desc: "Indexed across search and listings." },
  { icon: "badge-check", title: "Assigned to agent", desc: PUBLISHED.agent.name + " · verified" },
  { icon: "eye", title: "Live & public", desc: "Visible to buyers right now." },
];

function PublishedSuccess() {
  const stageRef = useRef(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let timer;
    const reveal = () => {
      if (document.visibilityState !== "visible" || el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.classList.add("pp-go");
      // after the entrance finishes, drop the class so the always-visible base
      // state takes over — guarantees content is never stuck hidden if the
      // animation is throttled/paused in a backgrounded or sandboxed frame.
      timer = setTimeout(() => el.classList.remove("pp-go"), 1500);
    };
    reveal();
    document.addEventListener("visibilitychange", reveal);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", reveal); };
  }, []);
  return (
    <div className="pp-stage" ref={stageRef} data-screen-label="Admin · Property published">
      <section className="pp-card" aria-labelledby="pp-title">
        {/* success mark */}
        <div className="pp-mark" aria-hidden="true">
          <span className="pp-mark__halo" />
          <span className="pp-mark__ring" />
          <span className="pp-mark__disc">
            <Icon name="check" size={46} strokeWidth={2.4} />
          </span>
          <span className="pp-mark__spark"><Icon name="sparkles" size={18} strokeWidth={2} /></span>
        </div>

        {/* eyebrow + title + description */}
        <span className="pp-eyebrow"><Icon name="circle-check-big" size={13} strokeWidth={2.25} />Listing live</span>
        <h1 className="pp-title" id="pp-title">Property published</h1>
        <p className="pp-desc">
          Your property has been published successfully and is now visible on the Chiya Estate platform.
        </p>

        {/* published listing summary */}
        <div className="pp-listing">
          <div className="pp-listing__media">
            <img src={PUBLISHED.cover} alt="" />
            <span className="pp-listing__badge"><Icon name="circle-check" size={12} strokeWidth={2.5} />Published</span>
          </div>
          <div className="pp-listing__body">
            <div className="pp-listing__tags">
              <Badge variant="success" size="sm" icon="tag">{PUBLISHED.listing}</Badge>
              <span className="pp-listing__ref"><Icon name="hash" size={12} />{PUBLISHED.ref}</span>
            </div>
            <h2 className="pp-listing__name">{PUBLISHED.title}</h2>
            <span className="pp-listing__addr"><Icon name="map-pin" size={14} />{PUBLISHED.address}</span>
            <div className="pp-listing__row">
              <span className="pp-listing__price cx-tnum">{PUBLISHED.price}</span>
              <span className="pp-listing__specs">
                <span><Icon name="bed-double" size={15} />{PUBLISHED.beds}</span>
                <span><Icon name="bath" size={15} />{PUBLISHED.baths}</span>
                <span className="cx-tnum"><Icon name="maximize-2" size={15} />{PUBLISHED.area}</span>
              </span>
            </div>
          </div>
        </div>

        {/* success details */}
        <ul className="pp-details">
          {SUCCESS_DETAILS.map((d) => (
            <li className="pp-detail" key={d.title}>
              <span className="pp-detail__ic"><Icon name={d.icon} size={18} /></span>
              <span className="pp-detail__txt">
                <span className="pp-detail__t">{d.title}</span>
                <span className="pp-detail__d">{d.desc}</span>
              </span>
            </li>
          ))}
        </ul>

        {/* quick actions */}
        <div className="pp-actions">
          <Button hierarchy="primary" size="xl" iconLeading="eye"
            href="Chiya Estate Property Detail.html">View property</Button>
          <div className="pp-actions__row">
            <Button hierarchy="secondary" size="lg" iconLeading="arrow-left"
              href="Admin-Properties Page.html">Back to properties</Button>
            <Button hierarchy="secondary" size="lg" iconLeading="plus"
              href="Add Property.html">Add another property</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AddPropertyPage() {
  const [f, setF] = useState({
    listing: "sale",
    type: "",
    title: "",
    description: "",
    price: "",
    currency: "USD",
    area: "",
    areaUnit: "sqm",
    beds: 3,
    baths: 2,
    parking: 1,
    condition: "Good",
    furnished: "no",
    year: "",
    short: "",
    // amenities & features (step 4)
    furnishing: "Semi-furnished",
    floors: 2,
    orientation: "",
    amenities: ["Swimming pool", "Garden", "Security", "Central AC"],
    customAmenities: ["Rooftop terrace"],
    highlights: "",
    // location (step 2)
    city: "Erbil",
    district: "",
    street: "",
    building: "",
    lat: "36.19085",
    lng: "44.00947",
    locNotes: "",
    // media (step 3)
    tourUrl: "",
    // ownership & assignment (step 5)
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    agent: "",
    internalNotes: "",
  });
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const [step, setStep] = useState(1);
  const goTo = (n) => { setStep(n); window.scrollTo({ top: 0, behavior: "smooth" }); };

  /* ---- review (step 6) display values, with demo fallbacks for a complete listing ---- */
  const CUR = { USD: "$", EUR: "€", IQD: "IQD " };
  const fmtNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const priceStr = f.price ? (CUR[f.currency] || "") + fmtNum(f.price) : "$450,000";
  const areaStr = f.area ? fmtNum(f.area) + " " + (f.areaUnit === "sqm" ? "m²" : f.areaUnit) : "420 m²";
  const rev = {
    listing: f.listing === "rent" ? "For rent" : "For sale",
    type: f.type || "Villa",
    title: f.title || "Olive Grove Estate",
    price: priceStr,
    area: areaStr,
    city: f.city || "Erbil",
    district: f.district || "Ankawa",
    street: f.street || "60 Meter Street, Block 4",
    building: f.building || "Villa 128",
    lat: f.lat || "36.19085",
    lng: f.lng || "44.00947",
    year: f.year || "2022",
    orientation: f.orientation || "South facing",
    ownerName: f.ownerName || "Hêmin Abdullah",
    ownerPhone: f.ownerPhone || "+964 750 412 8890",
    ownerEmail: f.ownerEmail || "hemin@email.com",
  };
  const revAgent = AGENTS.find((a) => a.id === f.agent) || AGENTS[0];
  const AMEN_IC = Object.fromEntries(AMENITIES.map((a) => [a.label, a.icon]));

  /* final step — published success state replaces the whole workflow canvas */
  if (step === 6) return <PublishedSuccess />;

  return (
    <div className="ap-wrap" data-screen-label="Admin · Add property">
      {/* breadcrumbs */}
      <nav className="ap-crumbs" aria-label="Breadcrumb">
        <a href="Admin-Properties Page.html">
          <Icon name="building-2" size={14} />Properties
        </a>
        <span className="ap-crumbs__sep"><Icon name="chevron-right" size={14} /></span>
        <span className="ap-crumbs__current" aria-current="page">Add property</span>
      </nav>

      {/* title */}
      <div className="ap-title">
        <h1>Add property</h1>
        <p>Create a new property listing step by step.</p>
      </div>

      {/* progress stepper */}
      <ProgressStepper active={step} />

      {/* form card — STEP 1 · Property details */}
      {step === 0 && (
      <section className="ap-card">
        <div className="ap-card__head">
          <h2 className="ap-card__title">Property details</h2>
          <p className="ap-card__desc">Provide the basic information about the property listing.</p>
        </div>

        <div className="ap-card__body">
          <div className="ap-grid">
            {/* listing type */}
            <div className="ap-field ap-col-full">
              <FieldLabel>Listing type</FieldLabel>
              <RadioCards value={f.listing} onChange={(v) => set("listing", v)} options={[
                { value: "sale", label: "For sale", sub: "List for purchase", icon: "tag" },
                { value: "rent", label: "For rent", sub: "Offer as a rental", icon: "key" },
              ]} />
            </div>

            {/* property type */}
            <div className="ap-field ap-col-full">
              <FieldLabel htmlFor="ap-type">Property type</FieldLabel>
              <Select id="ap-type" size="lg" placeholder="Select property type"
                value={f.type} onChange={(e) => set("type", e.target.value)}
                options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))} />
            </div>

            {/* title */}
            <div className="ap-field ap-col-full">
              <FieldLabel htmlFor="ap-title">Property title</FieldLabel>
              <Input id="ap-title" size="lg" placeholder="e.g. Olive Grove Estate — Ankawa, Erbil"
                value={f.title} onChange={(e) => set("title", e.target.value)} />
            </div>

            {/* description */}
            <div className="ap-field ap-col-full">
              <FieldLabel htmlFor="ap-desc">Property description</FieldLabel>
              <Textarea id="ap-desc" rows={5}
                placeholder="Describe the home, the lifestyle, and what makes it special — natural light, finishes, location, views…"
                value={f.description} onChange={(e) => set("description", e.target.value)} />
            </div>

            {/* price */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-price">Price</FieldLabel>
              <div className="ap-combo">
                <ComboSelect side="left" value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "IQD"]} />
                <input id="ap-price" className="ap-combo__input" inputMode="numeric" placeholder="Enter price"
                  value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} />
              </div>
            </div>

            {/* area size */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-area">Area size</FieldLabel>
              <div className="ap-combo">
                <input id="ap-area" className="ap-combo__input" inputMode="numeric" placeholder="Enter area size"
                  value={f.area} onChange={(e) => set("area", e.target.value.replace(/[^\d]/g, ""))} />
                <ComboSelect side="right" value={f.areaUnit} onChange={(v) => set("areaUnit", v)} options={["sqm", "sq ft"]} />
              </div>
            </div>

          </div>
        </div>

        {/* footer actions */}
        <div className="ap-foot">
          <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" href="Admin-Properties Page.html">Cancel</Button>
          <div className="ap-foot__right">
            <Button hierarchy="secondary" size="lg" iconLeading="save">Save draft</Button>
            <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(1)}>Next</Button>
          </div>
        </div>
      </section>
      )}

      {/* form card — STEP 2 · Location */}
      {step === 1 && (
      <section className="ap-card">
        <div className="ap-card__head">
          <h2 className="ap-card__title">Location</h2>
          <p className="ap-card__desc">Add the property location and map details.</p>
        </div>

        <div className="ap-card__body">
          <div className="ap-grid">
            {/* city */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-city">City</FieldLabel>
              <Select id="ap-city" size="lg" placeholder="Select city"
                value={f.city} onChange={(e) => set("city", e.target.value)}
                options={CITIES.map((c) => ({ value: c, label: c }))} />
            </div>

            {/* area / district */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-district">Area / district</FieldLabel>
              <Select id="ap-district" size="lg" placeholder="Select area or district"
                value={f.district} onChange={(e) => set("district", e.target.value)}
                options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
            </div>

            {/* street address */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-street">Street address</FieldLabel>
              <Input id="ap-street" size="lg" placeholder="e.g. 60 Meter Street, Block 4"
                value={f.street} onChange={(e) => set("street", e.target.value)} />
            </div>

            {/* building number */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-building" optional>Building number</FieldLabel>
              <Input id="ap-building" size="lg" placeholder="e.g. Villa 128 / Tower B"
                value={f.building} onChange={(e) => set("building", e.target.value)} />
            </div>

            {/* map location */}
            <div className="ap-field ap-col-full">
              <FieldLabel>Map location</FieldLabel>
              <MapPicker />
              <span className="ap-hint">Search for an address or drag the map to drop the pin precisely on the property.</span>
            </div>

            {/* latitude */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-lat">Latitude</FieldLabel>
              <div className="ap-coord">
                <span className="ap-coord__tag"><Icon name="compass" size={14} />Lat</span>
                <input id="ap-lat" inputMode="decimal" placeholder="36.19085"
                  value={f.lat} onChange={(e) => set("lat", e.target.value.replace(/[^\d.\-]/g, ""))} />
              </div>
            </div>

            {/* longitude */}
            <div className="ap-field">
              <FieldLabel htmlFor="ap-lng">Longitude</FieldLabel>
              <div className="ap-coord">
                <span className="ap-coord__tag"><Icon name="compass" size={14} />Lng</span>
                <input id="ap-lng" inputMode="decimal" placeholder="44.00947"
                  value={f.lng} onChange={(e) => set("lng", e.target.value.replace(/[^\d.\-]/g, ""))} />
              </div>
            </div>

            {/* location notes */}
            <div className="ap-field ap-col-full">
              <FieldLabel htmlFor="ap-locnotes" optional>Location notes</FieldLabel>
              <Textarea id="ap-locnotes" rows={4}
                placeholder="Landmarks, access instructions, or directions that help locate the property…"
                value={f.locNotes} onChange={(e) => set("locNotes", e.target.value)} />
            </div>
          </div>
        </div>

        {/* footer actions */}
        <div className="ap-foot">
          <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(0)}>Previous</Button>
          <div className="ap-foot__right">
            <Button hierarchy="secondary" size="lg" iconLeading="save">Save draft</Button>
            <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(2)}>Next</Button>
          </div>
        </div>
      </section>
      )}

      {/* form card — STEP 3 · Media */}
      {step === 2 && (
      <section className="ap-card">
        <div className="ap-card__head">
          <h2 className="ap-card__title">Media</h2>
          <p className="ap-card__desc">Upload property photos, videos, and visual assets for the listing.</p>
        </div>

        <div className="ap-card__body">
          <div className="ap-grid">
            {/* cover image */}
            <div className="ap-field ap-col-full">
              <FieldLabel>Cover image</FieldLabel>
              <CoverImage />
              <span className="ap-hint">The cover photo headlines the listing across search results and the property page. Drag a new image here or replace it to change.</span>
            </div>

            {/* gallery images */}
            <div className="ap-field ap-col-full">
              <FieldLabel>Gallery images</FieldLabel>
              <GalleryGrid />
              <span className="ap-hint">Drag to reorder · hover an image to set it as cover or remove it.</span>
            </div>

            {/* video upload */}
            <div className="ap-field ap-col-full">
              <FieldLabel optional>Video upload</FieldLabel>
              <VideoUpload />
            </div>

            {/* virtual tour url */}
            <div className="ap-field ap-col-full">
              <FieldLabel htmlFor="ap-tour" optional>Virtual tour URL</FieldLabel>
              <Input id="ap-tour" size="lg" type="url" iconLeading="link" placeholder="https://..."
                value={f.tourUrl} onChange={(e) => set("tourUrl", e.target.value)} />
              <span className="ap-hint">Link a Matterport, YouTube, or 360° walkthrough.</span>
            </div>
          </div>
        </div>

        {/* footer actions */}
        <div className="ap-foot">
          <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(1)}>Previous</Button>
          <div className="ap-foot__right">
            <Button hierarchy="secondary" size="lg" iconLeading="save">Save draft</Button>
            <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(3)}>Next</Button>
          </div>
        </div>
      </section>
      )}

      {/* form card — STEP 4 · Amenities & features */}
      {step === 3 && (
      <section className="ap-card">
        <div className="ap-card__body">
          {/* ---- Property features ---- */}
          <div className="ap-sect">
            <SubHead title="Property features" desc="Enter the property's specifications and characteristics." />
            <div className="ap-grid">
              {/* bedrooms */}
              <div className="ap-field">
                <FieldLabel>Bedrooms</FieldLabel>
                <Stepper value={f.beds} onChange={(v) => set("beds", v)} min={0} />
              </div>

              {/* bathrooms */}
              <div className="ap-field">
                <FieldLabel>Bathrooms</FieldLabel>
                <Stepper value={f.baths} onChange={(v) => set("baths", v)} min={0} />
              </div>

              {/* parking spaces */}
              <div className="ap-field">
                <FieldLabel optional>Parking spaces</FieldLabel>
                <Stepper value={f.parking} onChange={(v) => set("parking", v)} min={0} />
              </div>

              {/* year built */}
              <div className="ap-field">
                <FieldLabel optional>Levels / floors</FieldLabel>
                <Stepper value={f.floors} onChange={(v) => set("floors", v)} min={1} />
              </div>

              {/* year built */}
              <div className="ap-field">
                <FieldLabel htmlFor="ap-year" optional>Year built</FieldLabel>
                <Input id="ap-year" size="lg" inputMode="numeric" maxLength={4} placeholder="e.g. 2022"
                  value={f.year} onChange={(e) => set("year", e.target.value.replace(/[^\d]/g, "").slice(0, 4))} />
              </div>

              {/* orientation */}
              <div className="ap-field">
                <FieldLabel htmlFor="ap-orientation" optional>Orientation</FieldLabel>
                <Select id="ap-orientation" size="lg" placeholder="Select orientation"
                  value={f.orientation} onChange={(e) => set("orientation", e.target.value)}
                  options={ORIENTATIONS.map((o) => ({ value: o, label: o }))} />
              </div>

              {/* property condition */}
              <div className="ap-field">
                <FieldLabel htmlFor="ap-condition">Property condition</FieldLabel>
                <Select id="ap-condition" size="lg" placeholder="Select condition"
                  value={f.condition} onChange={(e) => set("condition", e.target.value)}
                  options={CONDITIONS.map((o) => ({ value: o, label: o }))} />
              </div>

              {/* furnishing */}
              <div className="ap-field">
                <FieldLabel htmlFor="ap-furnishing">Furnishing</FieldLabel>
                <Select id="ap-furnishing" size="lg" placeholder="Select furnishing"
                  value={f.furnishing} onChange={(e) => set("furnishing", e.target.value)}
                  options={FURNISHING.map((o) => ({ value: o, label: o }))} />
              </div>

            </div>
          </div>

          {/* ---- Amenities ---- */}
          <div className="ap-sect">
            <SubHead title="Amenities" desc="Select all amenities available for this property." />
            <AmenityGrid value={f.amenities} onChange={(v) => set("amenities", v)} />

            <div className="ap-field">
              <FieldLabel optional>Custom amenities</FieldLabel>
              <CustomAmenities
                items={f.customAmenities}
                onAdd={(t) => set("customAmenities", f.customAmenities.includes(t) ? f.customAmenities : [...f.customAmenities, t])}
                onRemove={(i) => set("customAmenities", f.customAmenities.filter((_, idx) => idx !== i))} />
              <span className="ap-hint">Add anything specific to this property that isn't listed above.</span>
            </div>
          </div>

        </div>

        {/* footer actions */}
        <div className="ap-foot">
          <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(2)}>Previous</Button>
          <div className="ap-foot__right">
            <Button hierarchy="secondary" size="lg" iconLeading="save">Save draft</Button>
            <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(4)}>Next</Button>
          </div>
        </div>
      </section>
      )}

      {/* form card — STEP 5 · Ownership & assignment */}
      {step === 4 && (
      <section className="ap-card">
        <div className="ap-card__head">
          <h2 className="ap-card__title">Ownership &amp; assignment</h2>
          <p className="ap-card__desc">Add the property owner information and assign the property to an agent.</p>
        </div>

        <div className="ap-card__body">
          {/* ---- Owner information ---- */}
          <div className="ap-sect ap-sect--flush">
            <div className="ap-grid">
              {/* owner full name */}
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-owner-name">Owner full name</FieldLabel>
                <Input id="ap-owner-name" size="lg" iconLeading="user" placeholder="e.g. Hêmin Abdullah"
                  value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
              </div>

              {/* phone number */}
              <div className="ap-field">
                <FieldLabel htmlFor="ap-owner-phone">Phone number</FieldLabel>
                <Input id="ap-owner-phone" size="lg" type="tel" iconLeading="phone" placeholder="+964 750 000 0000"
                  value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
              </div>

              {/* email address */}
              <div className="ap-field">
                <FieldLabel htmlFor="ap-owner-email">Email address</FieldLabel>
                <Input id="ap-owner-email" size="lg" type="email" iconLeading="mail" placeholder="owner@email.com"
                  value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
              </div>
            </div>
          </div>

          {/* ---- Assigned agent ---- */}
          <div className="ap-sect ap-sect--flush">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-agent">Assigned agent</FieldLabel>
                <Select id="ap-agent" size="lg" placeholder="Select agent"
                  value={f.agent} onChange={(e) => set("agent", e.target.value)}
                  options={AGENTS.map((a) => ({ value: a.id, label: a.name }))} />
                {(() => {
                  const sel = AGENTS.find((a) => a.id === f.agent);
                  return sel ? <AgentSummary agent={sel} onClear={() => set("agent", "")} /> : null;
                })()}
              </div>
            </div>
          </div>

          {/* ---- Internal notes ---- */}
          <div className="ap-sect ap-sect--flush">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-notes" optional>Internal notes</FieldLabel>
                <Textarea id="ap-notes" rows={4}
                  placeholder="Pricing flexibility, owner availability, key handover details, or anything the team should know…"
                  value={f.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
                <span className="ap-staffnote">
                  <Icon name="lock" size={14} />
                  Visible only to staff and administrators. Not displayed on the public website.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* footer actions */}
        <div className="ap-foot">
          <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(3)}>Previous</Button>
          <div className="ap-foot__right">
            <Button hierarchy="secondary" size="lg" iconLeading="save">Save draft</Button>
            <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(5)}>Next</Button>
          </div>
        </div>
      </section>
      )}

      {/* form card — STEP 6 · Review & submit */}
      {step === 5 && (
      <section className="ap-card">
        <div className="ap-card__head">
          <h2 className="ap-card__title">Review &amp; publish</h2>
          <p className="ap-card__desc">Review all property information before submitting the listing for approval.</p>
        </div>

        <div className="ap-card__body">
          <div className="ap-rev">
            {/* 1 · Property details */}
            <ReviewSection icon="home" title="Property details" onEdit={() => goTo(0)}>
              <div className="ap-rev__grid">
                <RevItem k="Listing title" v={rev.title} full />
                <RevItem k="Property type" v={rev.type} />
                <RevItem k="Listing type" v={rev.listing} />
                <RevItem k="Price" v={rev.price} price tnum />
                <RevItem k="Area size" v={rev.area} tnum />
              </div>
            </ReviewSection>

            {/* 2 · Location */}
            <ReviewSection icon="map-pin" title="Location" onEdit={() => goTo(1)}>
              <div className="ap-rev__grid">
                <RevItem k="City" v={rev.city} />
                <RevItem k="Area / district" v={rev.district} />
                <RevItem k="Street address" v={rev.street} full />
                <RevItem k="Building number" v={rev.building} />
                <RevItem k="Coordinates" v={rev.lat + ", " + rev.lng} tnum />
              </div>
            </ReviewSection>

            {/* 3 · Media */}
            <ReviewSection icon="image" title="Media" onEdit={() => goTo(2)}>
              <div className="ap-rev__media">
                <div className="ap-rev__thumbs">
                  {GALLERY_IMGS.slice(0, 4).map((g, i) => (
                    <span className={"ap-rev__thumb" + (i === 0 ? " ap-rev__thumb--cover" : "")} key={g.id}>
                      <img src={g.url} alt="" />
                      {i === 0 && <span className="ap-rev__thumb-tag"><Icon name="star" size={9} strokeWidth={2.5} />Cover</span>}
                    </span>
                  ))}
                  <span className="ap-rev__more">+8</span>
                </div>
                <div className="ap-rev__stats">
                  <span className="ap-rev__stat"><Icon name="image" size={16} /><b>12</b> photos uploaded</span>
                  <span className="ap-rev__stat"><Icon name="video" size={16} /><b>1</b> video uploaded</span>
                  <span className="ap-rev__stat"><Icon name="star" size={16} />Cover photo selected</span>
                </div>
              </div>
            </ReviewSection>

            {/* 4 · Property features */}
            <ReviewSection icon="ruler" title="Property features" onEdit={() => goTo(3)}>
              <div className="ap-rev__grid">
                <RevItem k="Bedrooms" v={f.beds} tnum />
                <RevItem k="Bathrooms" v={f.baths} tnum />
                <RevItem k="Parking spaces" v={f.parking} tnum />
                <RevItem k="Levels / floors" v={f.floors} tnum />
                <RevItem k="Year built" v={rev.year} tnum />
                <RevItem k="Orientation" v={rev.orientation} />
                <RevItem k="Condition" v={f.condition} />
                <RevItem k="Furnishing" v={f.furnishing} />
              </div>
            </ReviewSection>

            {/* 5 · Amenities */}
            <ReviewSection icon="sparkles" title="Amenities" onEdit={() => goTo(3)}>
              <div className="ap-rev__amen">
                {f.amenities.map((a) => (
                  <span className="ap-rev__pill" key={a}>
                    <Icon name={AMEN_IC[a] || "check"} size={15} />{a}
                  </span>
                ))}
                {f.customAmenities.map((a) => (
                  <span className="ap-rev__pill ap-rev__pill--custom" key={"c-" + a}>
                    <Icon name="sparkles" size={14} />{a}
                  </span>
                ))}
              </div>
            </ReviewSection>

            {/* 6 · Ownership & assignment */}
            <ReviewSection icon="user-round" title="Ownership &amp; assignment" onEdit={() => goTo(4)}>
              <div className="ap-rev__grid">
                <RevItem k="Owner" v={rev.ownerName} />
                <RevItem k="Owner phone" v={rev.ownerPhone} tnum />
                <RevItem k="Owner email" v={rev.ownerEmail} full />
                <div className="ap-rev__item ap-rev__item--full">
                  <span className="ap-rev__k">Assigned agent</span>
                  <span className="ap-rev__agent">
                    <Avatar src={revAgent.avatar} name={revAgent.name} size="xs" verified />
                    <span className="ap-rev__agent-name">
                      {revAgent.name}
                      <Badge variant="brand" size="sm" icon="badge-check">Verified</Badge>
                    </span>
                  </span>
                </div>
              </div>
            </ReviewSection>
          </div>
        </div>

        {/* footer actions */}
        <div className="ap-foot">
          <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(4)}>Previous</Button>
          <div className="ap-foot__right">
            <Button hierarchy="tertiary" size="lg" iconLeading="save">Save draft</Button>
            <Button hierarchy="primary" size="lg" onClick={() => goTo(6)}>Publish property</Button>
          </div>
        </div>
      </section>
      )}
    </div>
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
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
    if (id === "properties") { window.location.href = "Admin-Properties Page.html"; return; }
    setActive(id);
  }, []);

  const title = "Add property";

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
        <main className="ax-content">
          <AddPropertyPage />
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
