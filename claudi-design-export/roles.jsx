/* ==================================================================
   CHIYA ESTATE — ADMIN · ROLES & PERMISSIONS
   Access-control center. Composes against the approved admin shell
   (window.Sidebar / Topbar) and the Chiya design system.
================================================================== */
const DSr = window.ChiyaEstateDesignSystem_686f57;
const { Icon: RIcon, Button: RButton, Avatar: RAvatar, AvatarGroup: RAvatarGroup,
        Badge: RBadge, StatCard: RStatCard, Switch: RSwitch, Checkbox: RCheckbox,
        Input: RInput, Textarea: RTextarea, Modal: RModal } = DSr;

const { Sidebar, Topbar, categoryFor, NAV_FLAT, PAGE_MAP, LAYOUTS } = window;

/* ------------------------------------------------------------------
   PERMISSION MODEL — grouped by module
------------------------------------------------------------------ */
const MODULES = [
  { key: "properties", label: "Properties", icon: "building-2",
    perms: ["View properties", "Create properties", "Edit properties", "Delete properties", "Publish properties"] },
  { key: "members", label: "Members", icon: "users",
    perms: ["View members", "Create members", "Edit members", "Suspend members", "Delete members"] },
  { key: "agents", label: "Agents", icon: "badge-check",
    perms: ["View agents", "Create agents", "Edit agents", "Verify agents", "Delete agents"] },
  { key: "viewings", label: "Viewings", icon: "calendar-check",
    perms: ["View viewings", "Schedule viewings", "Edit viewings", "Cancel viewings"] },
  { key: "locations", label: "Locations", icon: "map-pin",
    perms: ["View locations", "Create locations", "Edit locations", "Delete locations"] },
  { key: "reports", label: "Reports", icon: "chart-column",
    perms: ["View reports", "Export reports"] },
  { key: "settings", label: "Settings", icon: "settings",
    perms: ["View settings", "Manage roles", "Manage permissions"] },
];
const PERM_ICONS = {
  "View": "eye", "Create": "plus-circle", "Edit": "pencil", "Delete": "trash-2",
  "Publish": "send", "Suspend": "user-x", "Schedule": "calendar-plus", "Cancel": "calendar-x",
  "Verify": "badge-check", "Export": "download", "Manage": "sliders-horizontal",
};
function permIcon(label) {
  const verb = label.split(" ")[0];
  return PERM_ICONS[verb] || "check-circle";
}
const TOTAL_PERMS = MODULES.reduce((a, m) => a + m.perms.length, 0); /* 28 */

/* helper: build a grant set from a per-module spec ("all" | [indices]) */
function buildGrant(spec) {
  const set = {};
  MODULES.forEach((m) => {
    const s = spec[m.key];
    m.perms.forEach((_, i) => {
      const on = s === "all" ? true : Array.isArray(s) ? s.includes(i) : false;
      set[m.key + ":" + i] = on;
    });
  });
  return set;
}
function countGrant(grant) {
  return Object.values(grant).filter(Boolean).length;
}

/* ------------------------------------------------------------------
   PEOPLE (avatar pool for assigned users)
------------------------------------------------------------------ */
const PEOPLE = [
  { name: "Rêbîn Kawa",   src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { name: "Lana Aziz",    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { name: "Hewa Rashid",  src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
  { name: "Rawa Jalal",   src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { name: "Ahmed Karim",  src: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  { name: "Sara Hama",    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
  { name: "Navin Omar",   src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=120&q=70" },
  { name: "Diyar Salih",  src: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?auto=format&fit=crop&w=120&q=70" },
];

/* ------------------------------------------------------------------
   ROLES
------------------------------------------------------------------ */
const ROLES_SEED = [
  {
    id: "super-admin", name: "Super Admin", tone: "gold", icon: "shield-check", system: true,
    desc: "Unrestricted access to every module, setting, and permission across the platform.",
    users: 3, created: "Jan 4, 2024",
    grant: { properties: "all", members: "all", agents: "all", viewings: "all", locations: "all", reports: "all", settings: "all" },
  },
  {
    id: "admin", name: "Admin", tone: "brand", icon: "shield", system: true,
    desc: "Full operational control of listings, members, and agents. Cannot manage platform permissions.",
    users: 6, created: "Jan 4, 2024",
    grant: { properties: "all", members: "all", agents: "all", viewings: "all", locations: "all", reports: "all", settings: [0, 1] },
  },
  {
    id: "manager", name: "Manager", tone: "brand", icon: "user-cog", system: true,
    desc: "Oversees day-to-day listing and viewing operations for an assigned region.",
    users: 14, created: "Jan 11, 2024",
    grant: { properties: [0, 1, 2, 4], members: [0, 1, 2, 3], agents: [0, 2, 3], viewings: "all", locations: [0, 2], reports: "all", settings: [0] },
  },
  {
    id: "agent", name: "Agent", tone: "brand", icon: "user-round", system: true,
    desc: "Manages their own listings and viewing appointments. Read-only elsewhere.",
    users: 96, created: "Jan 11, 2024",
    grant: { properties: [0, 1, 2, 4], members: [0], agents: [0], viewings: "all", locations: [0], reports: [0], settings: [] },
  },
  {
    id: "content-manager", name: "Content Manager", tone: "brand", icon: "file-pen", system: true,
    desc: "Curates listing content, imagery, and location data. No member or agent access.",
    users: 8, created: "Feb 2, 2024",
    grant: { properties: [0, 2, 4], members: [], agents: [], viewings: [0], locations: "all", reports: [0], settings: [0] },
  },
  {
    id: "finance-officer", name: "Finance Officer", tone: "neutral", icon: "wallet", system: false,
    desc: "Reviews and exports sales, rental, and performance reports for accounting.",
    users: 4, created: "Mar 18, 2024",
    grant: { properties: [0], members: [0], agents: [0], viewings: [0], locations: [0], reports: "all", settings: [] },
  },
  {
    id: "listings-reviewer", name: "Listings Reviewer", tone: "neutral", icon: "clipboard-check", system: false,
    desc: "Approves submitted listings and verifies agent credentials before publishing.",
    users: 5, created: "Apr 9, 2024",
    grant: { properties: [0, 2, 4], members: [0], agents: [0, 3], viewings: [0], locations: [0], reports: [0], settings: [] },
  },
  {
    id: "support-agent", name: "Support Agent", tone: "neutral", icon: "headset", system: false,
    desc: "Assists members with accounts and viewing schedules through the support desk.",
    users: 7, created: "May 21, 2024",
    grant: { properties: [0], members: [0, 2, 3], agents: [0], viewings: "all", locations: [0], reports: [0], settings: [] },
  },
];

/* assign a deterministic slice of people to each role for avatar stacks */
function usersFor(role, i) {
  const start = i % PEOPLE.length;
  const n = Math.min(role.users, 5);
  return Array.from({ length: n }, (_, k) => PEOPLE[(start + k) % PEOPLE.length]);
}

/* ------------------------------------------------------------------
   KPI CARDS
------------------------------------------------------------------ */
function kpiCards(roles) {
  const custom = roles.filter((r) => !r.system).length;
  const users = roles.reduce((a, r) => a + r.users, 0);
  return [
    { key: "roles",  label: "Total roles",       value: String(roles.length), icon: "key-round",     tone: "brand",   sub: "Across the platform" },
    { key: "users",  label: "Active users",      value: users.toLocaleString(), icon: "users",        tone: "success", sub: "Assigned to a role" },
    { key: "custom", label: "Custom roles",      value: String(custom),       icon: "sliders-horizontal", tone: "gold", sub: "Created by your team" },
    { key: "groups", label: "Permission groups", value: String(MODULES.length), icon: "layout-grid",  tone: "info",    sub: TOTAL_PERMS + " total permissions" },
  ];
}

/* ==================================================================
   PAGE HEADER
================================================================== */
function RolesHeader({ onCreate }) {
  return (
    <div className="rl-head">
      <div className="rl-head__intro">
        <div className="rl-head__eyebrow"><RIcon name="shield-check" size={14} /> Access control</div>
        <h1 className="rl-head__title">Roles &amp; permissions</h1>
        <p className="rl-head__sub">Manage staff roles, access levels, and system permissions.</p>
      </div>
      <div className="rl-head__action">
        <RButton hierarchy="primary" size="lg" iconLeading="plus" onClick={onCreate}>Create role</RButton>
      </div>
    </div>
  );
}

/* ==================================================================
   KPI SUMMARY
================================================================== */
function KpiSummary({ roles }) {
  return (
    <section className="rl-kpis" aria-label="Access-control summary">
      {kpiCards(roles).map((c) => (
        <RStatCard key={c.key} label={c.label} value={c.value} icon={c.icon} tone={c.tone} sub={c.sub} />
      ))}
    </section>
  );
}

/* ==================================================================
   ROLES TABLE
================================================================== */
function RowMenu({ role, onView, onClose }) {
  const ref = React.useRef(null);
  const [pos, setPos] = React.useState(null);
  React.useLayoutEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.right - 190 });
  }, []);
  return (
    <React.Fragment>
      <span ref={ref} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      <div className="ax-menu-backdrop" style={{ zIndex: 119 }} onClick={(e) => { e.stopPropagation(); onClose(); }} />
      {pos && ReactDOM.createPortal(
        <div className="rl-amenu" style={{ top: pos.top, left: pos.left }} onClick={(e) => e.stopPropagation()}>
          <div className="rl-amenu__sect">
            <button type="button" className="rl-aitem" onClick={() => { onView(); onClose(); }}>
              <RIcon name="sliders-horizontal" size={17} /> Manage permissions
            </button>
            <button type="button" className="rl-aitem" onClick={onClose}>
              <RIcon name="users" size={17} /> View assigned users
            </button>
            <button type="button" className="rl-aitem" onClick={onClose}>
              <RIcon name="copy" size={17} /> Duplicate role
            </button>
          </div>
          <div className="rl-amenu__sect">
            <button type="button" className="rl-aitem rl-aitem--danger" disabled={role.system} onClick={onClose}>
              <RIcon name="trash-2" size={17} /> Delete role
            </button>
          </div>
        </div>,
        document.body
      )}
    </React.Fragment>
  );
}

function RoleRow({ role, index, onOpen }) {
  const [menu, setMenu] = React.useState(false);
  const enabled = countGrant(buildGrant(role.grant));
  const full = enabled === TOTAL_PERMS;
  const pct = Math.round((enabled / TOTAL_PERMS) * 100);
  const users = usersFor(role, index);

  return (
    <div className="rl-row" role="button" tabIndex={0}
      onClick={() => onOpen(role)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(role); } }}>
      <div className="rl-col--role">
        <div className="rl-role">
          <span className={"rl-role__icon" + (role.tone === "gold" ? " rl-role__icon--gold" : role.tone === "neutral" ? " rl-role__icon--neutral" : "")}>
            <RIcon name={role.icon} size={19} />
          </span>
          <div className="rl-role__body">
            <span className="rl-role__name">
              <span className="rl-role__txt">{role.name}</span>
              {role.system
                ? <RBadge variant="neutral" size="sm" icon="lock">System</RBadge>
                : <RBadge variant="accent" size="sm" icon="sparkles">Custom</RBadge>}
            </span>
          </div>
        </div>
      </div>

      <div className="rl-col--desc">
        <span className="rl-celllabel">Description</span>
        <p className="rl-desc">{role.desc}</p>
      </div>

      <div className="rl-col--users">
        <span className="rl-celllabel">Users</span>
        <div className="rl-users">
          <RAvatarGroup avatars={users.map((p) => ({ src: p.src, name: p.name }))} max={3} size="sm" />
          <span className="rl-users__count">{role.users.toLocaleString()}</span>
        </div>
      </div>

      <div className="rl-col--perm">
        <span className="rl-celllabel">Permissions</span>
        <div className="rl-perm">
          <div className="rl-perm__top"><b>{enabled}</b> / {TOTAL_PERMS}</div>
          <span className="rl-perm__track"><span className={"rl-perm__fill" + (full ? " rl-perm__fill--full" : "")} style={{ width: pct + "%" }} /></span>
        </div>
      </div>

      <div className="rl-col--created">
        <span className="rl-celllabel">Created</span>
        <span className="rl-created">{role.created}</span>
      </div>

      <div className="rl-col--actions" onClick={(e) => e.stopPropagation()}>
        <div className="rl-actions">
          <button type="button" className={"rl-kebab" + (menu ? " is-open" : "")} aria-label={"Actions for " + role.name}
            aria-haspopup="true" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            <RIcon name="more-vertical" size={18} />
          </button>
          {menu && <RowMenu role={role} onView={() => onOpen(role)} onClose={() => setMenu(false)} />}
        </div>
      </div>
    </div>
  );
}

function RolesTable({ roles, onOpen }) {
  const [q, setQ] = React.useState("");
  const filtered = roles.filter((r) =>
    (r.name + " " + r.desc).toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <section className="rl-tablecard">
      <div className="rl-tablecard__head">
        <div className="rl-tablecard__heading">
          <h2 className="rl-tablecard__title">All roles</h2>
          <span className="rl-tablecard__count">{filtered.length}</span>
        </div>
        <div className="rl-tablesearch">
          <span className="rl-tablesearch__lead"><RIcon name="search" size={17} /></span>
          <input type="text" placeholder="Search roles..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search roles" />
        </div>
      </div>

      <div className="rl-table">
        <div className="rl-thead" role="row">
          <span className="rl-th rl-col--role">Role name</span>
          <span className="rl-th rl-col--desc">Description</span>
          <span className="rl-th rl-col--users">Users assigned</span>
          <span className="rl-th rl-col--perm">Permissions</span>
          <span className="rl-th rl-col--created">Created date</span>
          <span className="rl-th rl-col--actions rl-th--center">Actions</span>
        </div>
        {filtered.map((r, i) => <RoleRow key={r.id} role={r} index={i} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

/* ==================================================================
   ROLE DETAILS — slide-over drawer with permissions matrix
================================================================== */
function ModuleAccordion({ module, grant, locked, onToggle, onToggleModule, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const ids = module.perms.map((_, i) => module.key + ":" + i);
  const on = ids.filter((id) => grant[id]).length;
  const total = ids.length;
  const allOn = on === total;

  return (
    <div className={"rl-module" + (open ? " is-open" : "")}>
      <button type="button" className="rl-module__head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <RIcon name="chevron-right" size={18} className="rl-module__chev" />
        <span className="rl-module__ic"><RIcon name={module.icon} size={18} /></span>
        <span className="rl-module__meta">
          <span className="rl-module__name">{module.label}</span>
          <span className="rl-module__count"><b>{on}</b> of {total} enabled</span>
        </span>
        <span className="rl-module__master" onClick={(e) => { e.stopPropagation(); }}>
          <RSwitch checked={allOn} disabled={locked}
            aria-label={"Toggle all " + module.label + " permissions"}
            onChange={(e) => onToggleModule(module.key, e.target.checked)} />
        </span>
      </button>
      <div className="rl-module__list">
        <div className="rl-module__listinner">
          {module.perms.map((p, i) => {
            const id = module.key + ":" + i;
            const isOn = !!grant[id];
            return (
              <div className="rl-prow" key={id}>
                <span className="rl-prow__ic"><RIcon name={permIcon(p)} size={16} /></span>
                <span className="rl-prow__label">{p}</span>
                <span className={"rl-prow__state" + (isOn ? " is-on" : "")}>{isOn ? "Allowed" : "Denied"}</span>
                <span className="rl-prow__sw">
                  <RSwitch checked={isOn} disabled={locked} aria-label={p}
                    onChange={(e) => onToggle(id, e.target.checked)} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RoleDrawer({ role, index, onClose, onSave }) {
  const [grant, setGrant] = React.useState(() => buildGrant(role.grant));
  const [show, setShow] = React.useState(false);
  React.useEffect(() => { const id = setTimeout(() => setShow(true), 10); return () => clearTimeout(id); }, []);
  const locked = role.system;

  const close = () => { setShow(false); setTimeout(onClose, 300); };
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggle = (id, val) => setGrant((g) => ({ ...g, [id]: val }));
  const toggleModule = (key, val) => setGrant((g) => {
    const next = { ...g };
    MODULES.find((m) => m.key === key).perms.forEach((_, i) => { next[key + ":" + i] = val; });
    return next;
  });

  const enabled = countGrant(grant);
  const pct = Math.round((enabled / TOTAL_PERMS) * 100);
  const users = usersFor(role, index);

  return ReactDOM.createPortal(
    <React.Fragment>
      <div className={"rl-scrim" + (show ? " is-in" : "")} onClick={close} />
      <aside className={"rl-drawer" + (show ? " is-in" : "")} role="dialog" aria-modal="true" aria-label={role.name + " permissions"}>
        <div className="rl-drawer__head">
          <span className={"rl-drawer__icon" + (role.tone === "gold" ? " rl-drawer__icon--gold" : role.tone === "neutral" ? " rl-drawer__icon--neutral" : "")}>
            <RIcon name={role.icon} size={24} />
          </span>
          <div className="rl-drawer__titles">
            <h2 className="rl-drawer__name">
              {role.name}
              {role.system
                ? <RBadge variant="neutral" size="sm" icon="lock">System</RBadge>
                : <RBadge variant="accent" size="sm" icon="sparkles">Custom</RBadge>}
            </h2>
            <p className="rl-drawer__desc">{role.desc}</p>
          </div>
          <button type="button" className="rl-drawer__close" aria-label="Close" onClick={close}><RIcon name="x" size={20} /></button>
        </div>

        <div className="rl-drawer__body">
          <div className="rl-sect">
            <div className="rl-sect__head"><h3 className="rl-sect__title">Assigned users</h3></div>
            <div className="rl-assigned">
              <RAvatarGroup avatars={users.map((p) => ({ src: p.src, name: p.name }))} max={5} size="md" />
              <div className="rl-assigned__meta">
                <span className="rl-assigned__count">{role.users.toLocaleString()}</span>
                <span className="rl-assigned__lbl">{role.users === 1 ? "user has" : "users have"} this role</span>
              </div>
              <span className="rl-assigned__spacer" />
              <button type="button" className="rl-assigned__manage"><RIcon name="user-plus" size={15} /> Manage</button>
            </div>
          </div>

          <div className="rl-sect">
            <div className="rl-sect__head"><h3 className="rl-sect__title">Permissions</h3></div>

            <div className="rl-permbar">
              <span className="rl-permbar__num">{enabled}<span> / {TOTAL_PERMS}</span></span>
              <span className="rl-permbar__track"><span className="rl-permbar__fill" style={{ width: pct + "%" }} /></span>
              <span className="rl-permbar__lbl">{pct}% granted</span>
            </div>

            {locked && (
              <div className="rl-locknote">
                <RIcon name="lock" size={16} />
                <span>This is a system role. Its permissions are locked to protect platform integrity — duplicate it to create an editable copy.</span>
              </div>
            )}

            <div className="rl-matrix">
              {MODULES.map((m, i) => (
                <ModuleAccordion key={m.key} module={m} grant={grant} locked={locked}
                  onToggle={toggle} onToggleModule={toggleModule} defaultOpen={i === 0} />
              ))}
            </div>
          </div>
        </div>

        <div className="rl-drawer__foot">
          <span className="rl-drawer__foot-info">
            <RIcon name={locked ? "lock" : "check-circle"} size={15} />
            {locked ? "Read-only system role" : enabled + " of " + TOTAL_PERMS + " permissions granted"}
          </span>
          <RButton hierarchy="secondary" onClick={close}>Cancel</RButton>
          <RButton hierarchy="primary" iconLeading="check" disabled={locked} onClick={() => onSave(role)}>Save changes</RButton>
        </div>
      </aside>
    </React.Fragment>,
    document.body
  );
}

/* ==================================================================
   CREATE ROLE MODAL
================================================================== */
function CreateRoleModal({ onClose, onCreate }) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [groups, setGroups] = React.useState(() => ({ properties: true, reports: true }));

  const selectedCount = Object.values(groups).filter(Boolean).length;
  const allOn = selectedCount === MODULES.length;
  const toggleGroup = (key) => setGroups((g) => ({ ...g, [key]: !g[key] }));
  const toggleAll = () => {
    const next = {};
    if (!allOn) MODULES.forEach((m) => { next[m.key] = true; });
    setGroups(next);
  };
  const valid = name.trim().length > 0 && selectedCount > 0;

  return (
    <RModal open onClose={onClose} size="lg" icon="key-round"
      title="Create role" subtitle="Define a role and choose which permission groups it can access."
      footer={
        <React.Fragment>
          <RButton hierarchy="secondary" onClick={onClose}>Cancel</RButton>
          <RButton hierarchy="primary" iconLeading="plus" disabled={!valid}
            onClick={() => onCreate({ name: name.trim() || "New role", groups })}>Create role</RButton>
        </React.Fragment>
      }
      footerSpread={false}>
      <div className="rl-cm__section">
        <div className="rl-cm__fields">
          <RInput label="Role name" required placeholder="e.g. Regional Manager"
            value={name} onChange={(e) => setName(e.target.value)} iconLeading="tag" />
          <RTextarea label="Description" rows={3}
            placeholder="Describe what this role is responsible for…"
            value={desc} onChange={(e) => setDesc(e.target.value)} />
        </div>

        <div className="rl-cm__grouphead">
          <h4 className="rl-cm__grouptitle">Permission groups · {selectedCount} selected</h4>
          <button type="button" className="rl-cm__selectall" onClick={toggleAll}>{allOn ? "Clear all" : "Select all"}</button>
        </div>
        <div className="rl-cm__groups">
          {MODULES.map((m) => {
            const on = !!groups[m.key];
            return (
              <label key={m.key} className={"rl-cm__group" + (on ? " is-on" : "")}>
                <span className="rl-cm__group-ic"><RIcon name={m.icon} size={17} /></span>
                <span className="rl-cm__group-meta">
                  <span className="rl-cm__group-name">{m.label}</span>
                  <span className="rl-cm__group-sub">{m.perms.length} permissions</span>
                </span>
                <span className="rl-cm__group-check">
                  <RCheckbox checked={on} onChange={() => toggleGroup(m.key)} aria-label={m.label} />
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </RModal>
  );
}

/* ==================================================================
   SUCCESS TOAST
================================================================== */
function Toast({ toast, onView, onDone }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const inT = setTimeout(() => setShow(true), 10);
    const t = setTimeout(() => dismiss(), 5200);
    return () => { clearTimeout(inT); clearTimeout(t); };
  }, []);
  const dismiss = () => { setShow(false); setTimeout(onDone, 340); };
  return (
    <div className={"rl-toast" + (show ? " is-in" : "")}>
      <span className="rl-toast__icon"><RIcon name="check" size={20} strokeWidth={2.5} /></span>
      <div className="rl-toast__body">
        <p className="rl-toast__title">Role updated successfully</p>
        <p className="rl-toast__msg">Role permissions have been saved successfully.</p>
        <div className="rl-toast__actions">
          <button type="button" className="rl-toast__btn rl-toast__btn--dismiss" onClick={dismiss}>Dismiss</button>
          <button type="button" className="rl-toast__btn rl-toast__btn--view" onClick={() => { onView(); dismiss(); }}>View role</button>
        </div>
      </div>
      <button type="button" className="rl-toast__close" aria-label="Dismiss" onClick={dismiss}><RIcon name="x" size={16} /></button>
      <span className="rl-toast__progress" />
    </div>
  );
}

/* ==================================================================
   APP
================================================================== */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "B"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const layout = t.layout === "C" ? "C" : "B";
  const showTopbar = layout !== "C";

  const [collapsed, setCollapsed] = React.useState(() => categoryFor(window.innerWidth) !== "mobile");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [active, setActive] = React.useState("roles");
  const [openMenu, setOpenMenu] = React.useState(null);
  const catRef = React.useRef(categoryFor(window.innerWidth));

  const [roles] = React.useState(ROLES_SEED);
  const [detail, setDetail] = React.useState(null);   /* {role, index} */
  const [createOpen, setCreateOpen] = React.useState(false);
  const [toasts, setToasts] = React.useState([]);
  const lastRoleRef = React.useRef(null);

  React.useEffect(() => {
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

  React.useEffect(() => { setOpenMenu(null); }, [layout]);

  const handleSelect = React.useCallback((id) => {
    if (PAGE_MAP[id]) { window.location.href = PAGE_MAP[id]; return; }
    setActive(id);
    setOpenMenu(null);
    if (categoryFor(window.innerWidth) === "mobile") setDrawerOpen(false);
  }, []);

  const openDetail = (role) => {
    const index = roles.findIndex((r) => r.id === role.id);
    lastRoleRef.current = { role, index };
    setDetail({ role, index });
  };
  const pushToast = (role) => {
    lastRoleRef.current = lastRoleRef.current || { role, index: roles.findIndex((r) => r.id === role.id) };
    setToasts((ts) => [...ts, { id: Date.now() }]);
  };
  const onSaveRole = (role) => { setDetail(null); pushToast(role); };
  const onCreate = (payload) => {
    setCreateOpen(false);
    lastRoleRef.current = { role: roles[0], index: 0 };
    setToasts((ts) => [...ts, { id: Date.now() }]);
  };
  const viewLastRole = () => { if (lastRoleRef.current) setDetail({ ...lastRoleRef.current }); };

  const title = (NAV_FLAT.find((n) => n.id === active) || NAV_FLAT[0]).label;

  return (
    <div className="ax-app" data-layout={layout}>
      <Sidebar
        layout={layout} collapsed={collapsed} drawerOpen={drawerOpen} active={active}
        onSelect={handleSelect} onToggleCollapse={() => setCollapsed((c) => !c)}
        openMenu={openMenu} setOpenMenu={setOpenMenu} onLogout={() => setOpenMenu(null)}
      />

      {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

      <div className="ax-main">
        {showTopbar && (
          <Topbar layout={layout} title={title} openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
        )}
        {!showTopbar && (
          <button type="button" className="ax-floating-menu" aria-label="Open menu" onClick={() => setDrawerOpen(true)}>
            <RIcon name="menu" size={22} />
          </button>
        )}
        <main className="ax-content" data-screen-label="Admin · Roles & Permissions">
          <RolesHeader onCreate={() => setCreateOpen(true)} />
          <KpiSummary roles={roles} />
          <RolesTable roles={roles} onOpen={openDetail} />
        </main>
      </div>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}

      {detail && (
        <RoleDrawer role={detail.role} index={detail.index}
          onClose={() => setDetail(null)} onSave={onSaveRole} />
      )}

      {createOpen && <CreateRoleModal onClose={() => setCreateOpen(false)} onCreate={onCreate} />}

      <div className="rl-toaster">
        {toasts.map((tt) => (
          <Toast key={tt.id} toast={tt}
            onView={viewLastRole}
            onDone={() => setToasts((ts) => ts.filter((x) => x.id !== tt.id))} />
        ))}
      </div>

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
