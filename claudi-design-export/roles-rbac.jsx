/* ==================================================================
   CHIYA ESTATE — ADMIN · ROLES & PERMISSIONS  (flat / minimal)
   Two-panel access control: role list + grouped permissions / matrix.
   Composes against the approved admin shell and the Chiya design system.
================================================================== */
const DSr = window.ChiyaEstateDesignSystem_686f57;
const { Icon: RIcon, Button: RButton, Avatar: RAvatar, AvatarGroup: RAvatarGroup,
        Badge: RBadge, Switch: RSwitch, Tabs: RTabs, Input: RInput, Textarea: RTextarea } = DSr;

const { Sidebar, Topbar, categoryFor, NAV_FLAT, PAGE_MAP, LAYOUTS } = window;

/* ------------------------------------------------------------------
   PERMISSION MODEL — category → sub-groups → permissions
   `scope: true` sub-groups expose an Own / Team / Organisational
   selector; otherwise granted permissions are organisation-wide.
------------------------------------------------------------------ */
const CATS = [
  { key: "dashboard", label: "Dashboard", groups: [
    { id: "overview", label: "Overview", scope: true, perms: [
      { label: "View dashboard",   desc: "Open the main workspace and summary view." },
      { label: "View KPI cards",   desc: "High-level performance metrics at a glance." },
      { label: "View analytics",   desc: "Charts and platform trend analytics." },
    ] },
    { id: "personal", label: "Personal", scope: false, perms: [
      { label: "View personal performance", desc: "See their own performance metrics only." },
    ] },
  ] },
  { key: "properties", label: "Properties", groups: [
    { id: "listings", label: "Listings", scope: true, perms: [
      { label: "View properties",   desc: "Browse listings across the platform." },
      { label: "Create properties", desc: "Add new listings to the catalogue." },
      { label: "Edit properties",   desc: "Update listing details and media." },
      { label: "Delete properties", desc: "Permanently remove a listing." },
    ] },
    { id: "publishing", label: "Publishing", scope: false, perms: [
      { label: "Publish properties", desc: "Make a listing live and visible to buyers." },
      { label: "Archive properties", desc: "Move listings out of the active catalogue." },
    ] },
    { id: "assignment", label: "Assignment", scope: false, perms: [
      { label: "Assign agents",          desc: "Attach a verified agent to a listing." },
      { label: "Manage property status", desc: "Change for-sale, for-rent, sold or pending." },
    ] },
  ] },
  { key: "members", label: "Members", groups: [
    { id: "records", label: "Records", scope: true, perms: [
      { label: "View members",   desc: "See member profiles and account details." },
      { label: "Create members", desc: "Register a new member account." },
      { label: "Edit members",   desc: "Update member profile information." },
    ] },
    { id: "account", label: "Account control", scope: false, perms: [
      { label: "Suspend members",       desc: "Temporarily disable a member account." },
      { label: "Delete members",        desc: "Permanently remove a member account." },
      { label: "Assign members to agents", desc: "Route members to a managing agent." },
    ] },
  ] },
  { key: "agents", label: "Agents", groups: [
    { id: "records", label: "Records", scope: true, perms: [
      { label: "View agents",   desc: "See agent profiles and verification status." },
      { label: "Create agents", desc: "Onboard a new agent to the platform." },
      { label: "Edit agents",   desc: "Update agent profiles and credentials." },
    ] },
    { id: "account", label: "Account control", scope: false, perms: [
      { label: "Suspend agents", desc: "Temporarily disable an agent account." },
      { label: "Delete agents",  desc: "Permanently remove an agent account." },
    ] },
  ] },
  { key: "viewings", label: "Viewings", groups: [
    { id: "scheduling", label: "Scheduling", scope: true, perms: [
      { label: "View viewings",     desc: "See scheduled property viewings." },
      { label: "Schedule viewings", desc: "Book new viewing appointments." },
      { label: "Edit viewings",     desc: "Reschedule or update viewing details." },
      { label: "Cancel viewings",   desc: "Cancel a booked viewing appointment." },
    ] },
  ] },
  { key: "reports", label: "Reports", groups: [
    { id: "reporting", label: "Reporting", scope: true, perms: [
      { label: "View reports",   desc: "Open sales, rental and performance reports." },
      { label: "Export reports", desc: "Download reports as PDF or spreadsheet." },
    ] },
  ] },
  { key: "settings", label: "Settings", groups: [
    { id: "general", label: "General", scope: false, perms: [
      { label: "View settings", desc: "Access the platform settings area." },
    ] },
    { id: "security", label: "Security", scope: false, perms: [
      { label: "Manage roles & permissions", desc: "Create roles and edit access levels." },
      { label: "View audit logs",            desc: "Review the security and activity log." },
      { label: "Manage platform settings",   desc: "Change global platform configuration." },
    ] },
  ] },
];

/* flatten a category into [{permId, localIndex, groupId, scopeable, ...perm}] */
function flatCat(cat) {
  const out = [];
  let i = 0;
  cat.groups.forEach((g) => {
    g.perms.forEach((p) => {
      out.push({ ...p, permId: cat.key + ":" + i, localIndex: i, groupId: g.id, scopeable: g.scope });
      i++;
    });
  });
  return out;
}
const CAT_FLAT = {};
CATS.forEach((c) => { CAT_FLAT[c.key] = flatCat(c); });
const TOTAL_PERMS = CATS.reduce((a, c) => a + CAT_FLAT[c.key].length, 0);

const SCOPE_OPTS = [
  { value: "own", label: "Own" },
  { value: "team", label: "Team" },
  { value: "org", label: "Organisational" },
];
const SCOPE_LABEL = { own: "Own", team: "Team", org: "Organisational" };

/* ------------------------------------------------------------------
   ROLES + seed grants
   spec[catKey] = "all" | "none" | { perms: "all" | [localIdx], scope }
------------------------------------------------------------------ */
const ROLES_SEED = [
  {
    id: "super-admin", name: "Super admin", tone: "gold", dot: "gold", icon: "shield-check", system: true, locked: true,
    status: "Active", users: 2, created: "Jan 4, 2024",
    desc: "Unrestricted access to every module, setting and permission across the Chiya Estate platform.",
    spec: { dashboard: "all", properties: "all", members: "all", agents: "all", viewings: "all", reports: "all", settings: "all" },
  },
  {
    id: "admin", name: "Admin", tone: "brand", dot: "brand", icon: "shield", system: true,
    status: "Active", users: 5, created: "Jan 4, 2024",
    desc: "Full operational control of listings, members and agents. Cannot manage platform roles or global settings.",
    spec: {
      dashboard: { perms: "all", scope: "org" }, properties: { perms: "all", scope: "org" },
      members: { perms: "all", scope: "org" }, agents: { perms: "all", scope: "org" },
      viewings: { perms: "all", scope: "org" }, reports: { perms: "all", scope: "org" },
      settings: { perms: [0], scope: "org" },
    },
  },
  {
    id: "agent", name: "Agent", tone: "amber", dot: "amber", icon: "badge-check", system: true,
    status: "Active", users: 120, created: "Jan 11, 2024",
    desc: "Field agent. Manages their own assigned properties, members and viewings.",
    spec: {
      dashboard: { perms: [0, 1, 3], scope: "own" },
      properties: { perms: [0, 1, 2, 7], scope: "own" },
      members: { perms: [0], scope: "own" },
      agents: { perms: [0], scope: "own" },
      viewings: { perms: [0, 1, 2], scope: "own" },
      reports: { perms: [0], scope: "own" },
      settings: "none",
    },
  },
];

/* build per-role { grant: {permId:bool}, scope: {catKey/groupId: own|team|org} } */
function buildRole(spec) {
  const grant = {};
  const scope = {};
  CATS.forEach((cat) => {
    const s = spec[cat.key];
    const flat = CAT_FLAT[cat.key];
    const onAll = s === "all";
    const cfg = (s && typeof s === "object") ? s : null;
    const onSet = onAll ? "all" : cfg ? cfg.perms : "none";
    const sc = onAll ? "org" : cfg ? (cfg.scope || "org") : "org";
    cat.groups.forEach((g) => { scope[cat.key + "/" + g.id] = g.scope ? sc : "org"; });
    flat.forEach((p) => {
      grant[p.permId] = onSet === "all" ? true : Array.isArray(onSet) ? onSet.includes(p.localIndex) : false;
    });
  });
  return { grant, scope };
}
function countGrant(grant) { return Object.values(grant).filter(Boolean).length; }

/* avatar pool for the settings tab */
const PEOPLE = [
  { name: "Rêbîn Kawa",  src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=70" },
  { name: "Lana Aziz",   src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=70" },
  { name: "Hewa Rashid", src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=70" },
  { name: "Rawa Jalal",  src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=70" },
  { name: "Ahmed Karim", src: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=120&q=70" },
  { name: "Sara Hama",   src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=70" },
];
function usersFor(role, n) {
  const start = role.id.length % PEOPLE.length;
  const count = Math.min(role.users, n);
  return Array.from({ length: count }, (_, k) => PEOPLE[(start + k) % PEOPLE.length]);
}

/* ==================================================================
   PAGE HEADER
================================================================== */
function RolesHeader({ view, onView }) {
  return (
    <div className="rb-head">
      <div className="rb-head__intro">
        <h1 className="rb-head__title">Roles &amp; permissions</h1>
        <p className="rb-head__sub">Manage your team and access control across the Chiya Estate platform.</p>
      </div>
      <div className="rb-seg" role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={view === "detail"}
          className={"rb-seg__btn" + (view === "detail" ? " is-active" : "")} onClick={() => onView("detail")}>
          Detail
        </button>
        <button type="button" role="tab" aria-selected={view === "matrix"}
          className={"rb-seg__btn" + (view === "matrix" ? " is-active" : "")} onClick={() => onView("matrix")}>
          Role matrix
        </button>
      </div>
    </div>
  );
}

/* ==================================================================
   LEFT PANEL — ROLE LIST  (dot + member count)
================================================================== */
function RoleList({ roles, selectedId, onSelect, onCreate }) {
  return (
    <aside className="rb-list" aria-label="Roles">
      <div className="rb-list__eyebrow">Select role</div>
      <div className="rb-list__items">
        {roles.map((r) => {
          const sel = r.id === selectedId;
          return (
            <button key={r.id} type="button" className={"rb-roleitem" + (sel ? " is-selected" : "")}
              onClick={() => onSelect(r.id)} aria-pressed={sel}>
              <span className={"rb-roleicon rb-roleicon--" + r.dot}><RIcon name={r.icon || "shield"} size={17} /></span>
              <span className="rb-roleitem__body">
                <span className="rb-roleitem__name">{r.name}</span>
                <span className="rb-roleitem__meta">{r.users} {r.users === 1 ? "member" : "members"}</span>
              </span>
              <span className="rb-roleitem__chev"><RIcon name="chevron-right" size={16} /></span>
            </button>
          );
        })}
      </div>
      <button type="button" className="rb-list__create" onClick={onCreate}>
        <RIcon name="plus" size={16} /> Create new role
      </button>
    </aside>
  );
}

/* ==================================================================
   SCOPE SELECT (compact pill)
================================================================== */
function ScopeSelect({ value, disabled, onChange }) {
  return (
    <label className="rb-scope">
      <select value={value} disabled={disabled} aria-label="Access scope"
        onChange={(e) => onChange(e.target.value)}>
        {SCOPE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span className="rb-scope__chev"><RIcon name="chevrons-up-down" size={15} /></span>
    </label>
  );
}

/* ==================================================================
   PERMISSIONS TAB — category nav + grouped sub-sections
================================================================== */
function PermissionGroup({ cat, group, role, locked, onToggle, onScope }) {
  const perms = CAT_FLAT[cat.key].filter((p) => p.groupId === group.id);
  const on = perms.filter((p) => role.grant[p.permId]).length;
  const total = perms.length;
  const allOn = on === total;
  const anyOn = on > 0;
  const scopeId = cat.key + "/" + group.id;

  const setMaster = (checked) => perms.forEach((p) => onToggle(p.permId, checked));

  return (
    <section className={"rb-group" + (anyOn ? "" : " is-off")}>
      <header className="rb-group__head">
        <span className="rb-group__label">{group.label}</span>
        <span className="rb-group__count">{on}/{total}</span>
        <span className="rb-group__ctrl">
          {group.scope && (
            <ScopeSelect value={role.scope[scopeId]} disabled={locked || !anyOn}
              onChange={(v) => onScope(scopeId, v)} />
          )}
          <RSwitch checked={allOn} disabled={locked}
            aria-label={"Enable all " + group.label + " permissions"}
            onChange={(e) => setMaster(e.target.checked)} />
        </span>
      </header>
      <div className="rb-rows">
        {perms.map((p) => (
          <div className="rb-row" key={p.permId}>
            <span className="rb-row__text">
              <span className="rb-row__label">{p.label}</span>
              <span className="rb-row__desc">{p.desc}</span>
            </span>
            <span className="rb-row__sw">
              <RSwitch checked={!!role.grant[p.permId]} disabled={locked} aria-label={p.label}
                onChange={(e) => onToggle(p.permId, e.target.checked)} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PermissionsTab({ role, locked, activeCat, onCat, onToggle, onScope }) {
  const cat = CATS.find((c) => c.key === activeCat) || CATS[0];
  return (
    <div className="rb-permissions">
      {locked && (
        <div className="rb-locknote">
          <RIcon name="lock" size={15} />
          <span>Super admin always has full access. Its permissions are locked to protect platform integrity.</span>
        </div>
      )}

      <nav className="rb-catnav" aria-label="Permission categories">
        {CATS.map((c) => (
          <button key={c.key} type="button"
            className={"rb-cat" + (c.key === activeCat ? " is-active" : "")}
            onClick={() => onCat(c.key)} aria-pressed={c.key === activeCat}>
            {c.label}
            <span className="rb-cat__badge">{CAT_FLAT[c.key].length}</span>
          </button>
        ))}
      </nav>

      <div className="rb-groups">
        {cat.groups.map((g) => (
          <PermissionGroup key={g.id} cat={cat} group={g} role={role}
            locked={locked} onToggle={onToggle} onScope={onScope} />
        ))}
      </div>
    </div>
  );
}

/* ==================================================================
   ROLE SETTINGS TAB
================================================================== */
function RoleSettingsTab({ role }) {
  const enabled = countGrant(role.grant);
  const users = usersFor(role, 5);
  const canDelete = window.ADMIN && window.ADMIN.role === "Super Admin" && !role.locked;

  return (
    <div className="rb-settings">
      <section className="rb-setblock">
        <h3 className="rb-setblock__title">Role details</h3>
        <div className="rb-setgrid">
          <RInput label="Role name" defaultValue={role.name} iconLeading="tag" readOnly={role.system} />
          <div className="rb-setfield">
            <span className="rb-setfield__label">Role status</span>
            <div className="rb-statuspill"><span className="rb-statusdot" /> {role.status}</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <RTextarea label="Role description" rows={3} defaultValue={role.desc} readOnly={role.system} />
        </div>
      </section>

      <section className="rb-setblock">
        <h3 className="rb-setblock__title">Assigned members</h3>
        <div className="rb-assigned">
          <RAvatarGroup avatars={users.map((p) => ({ src: p.src, name: p.name }))} max={5} size="md" />
          <div className="rb-assigned__meta">
            <span className="rb-assigned__count">{role.users}</span>
            <span className="rb-assigned__lbl">{role.users === 1 ? "member has" : "members have"} this role · {enabled} permissions granted</span>
          </div>
          <span style={{ flex: "1 1 auto" }} />
          <RButton hierarchy="secondary" size="sm" iconLeading="user-plus">Manage members</RButton>
        </div>
      </section>

      <section className="rb-setblock">
        <h3 className="rb-setblock__title">Actions</h3>
        <div className="rb-actions">
          <RButton hierarchy="secondary" iconLeading="pencil" disabled={role.system}>Edit role</RButton>
          <RButton hierarchy="secondary" iconLeading="copy">Duplicate role</RButton>
          <button type="button" className="rb-delbtn" disabled={!canDelete}
            title={canDelete ? undefined : "System roles can't be deleted"}>
            <RIcon name="trash-2" size={16} /> Delete role
          </button>
        </div>
        <p className="rb-actions__note"><RIcon name="info" size={14} /> System roles are protected and can't be deleted.</p>
      </section>
    </div>
  );
}

/* ==================================================================
   RIGHT PANEL — DETAIL CONTAINER
================================================================== */
function RoleDetail({ role, detailTab, onDetailTab, activeCat, onCat, onToggle, onScope }) {
  const locked = !!role.locked;
  const enabled = countGrant(role.grant);

  return (
    <section className="rb-detail" aria-label={role.name + " details"}>
      <header className="rb-detail__head">
        <h2 className="rb-detail__name">
          {role.name} permissions
          <span className="rb-grantbadge"><RIcon name="shield-check" size={13} /> {enabled}/{TOTAL_PERMS} granted</span>
        </h2>
        <p className="rb-detail__desc">{role.desc}</p>
      </header>

      <div className="rb-detail__tabs">
        <RTabs variant="line" value={detailTab} onChange={onDetailTab}
          items={[
            { value: "permissions", label: "Permissions", icon: "shield-check" },
            { value: "settings", label: "Role setting", icon: "settings" },
          ]} />
      </div>

      <div className="rb-detail__body">
        {detailTab === "permissions"
          ? <PermissionsTab role={role} locked={locked} activeCat={activeCat} onCat={onCat} onToggle={onToggle} onScope={onScope} />
          : <RoleSettingsTab role={role} />}
      </div>
    </section>
  );
}

/* ==================================================================
   ROLE MATRIX  (three-state)
================================================================== */
const MATRIX_ROWS = [
  { label: "View properties",            cat: "properties", idx: 0, group: "Properties" },
  { label: "Create properties",          cat: "properties", idx: 1, group: "Properties" },
  { label: "Edit properties",            cat: "properties", idx: 2, group: "Properties" },
  { label: "Delete properties",          cat: "properties", idx: 3, group: "Properties" },
  { label: "Publish properties",         cat: "properties", idx: 4, group: "Properties" },
  { label: "Assign agents",              cat: "properties", idx: 6, group: "Properties" },
  { label: "View members",               cat: "members",    idx: 0, group: "Members" },
  { label: "Edit members",               cat: "members",    idx: 2, group: "Members" },
  { label: "Suspend members",            cat: "members",    idx: 3, group: "Members" },
  { label: "View agents",                cat: "agents",     idx: 0, group: "Agents" },
  { label: "Edit agents",                cat: "agents",     idx: 2, group: "Agents" },
  { label: "View viewings",              cat: "viewings",   idx: 0, group: "Viewings" },
  { label: "Schedule viewings",          cat: "viewings",   idx: 1, group: "Viewings" },
  { label: "View reports",               cat: "reports",    idx: 0, group: "Reports" },
  { label: "Export reports",             cat: "reports",    idx: 1, group: "Reports" },
  { label: "Manage roles & permissions", cat: "settings",   idx: 1, group: "Settings" },
  { label: "Manage platform settings",   cat: "settings",   idx: 3, group: "Settings" },
];

function cellLevel(role, catKey, idx) {
  const meta = CAT_FLAT[catKey].find((p) => p.localIndex === idx);
  if (!meta) return "none";
  if (!role.grant[meta.permId]) return "none";
  return "full";
}

function MatrixCell({ level }) {
  const glyph = level === "full" ? "✓" : "✕";
  return <span className={"rb-cell rb-cell--" + level} title={level === "full" ? "Full access" : "No access"}>{glyph}</span>;
}

function RoleMatrix({ roles }) {
  let lastGroup = null;
  return (
    <section className="rb-matrixcard">
      <header className="rb-matrixcard__head">
        <div>
          <h2 className="rb-matrixcard__title">Role permission matrix</h2>
          <p className="rb-matrixcard__desc">Overview of permissions across all roles.</p>
        </div>
        <div className="rb-legend">
          <span className="rb-legend__item"><span className="rb-cell rb-cell--full">✓</span> Full access</span>
          <span className="rb-legend__item"><span className="rb-cell rb-cell--none">✕</span> No access</span>
        </div>
      </header>

      <div className="rb-matrix-wrap">
        <table className="rb-matrix">
          <thead>
            <tr>
              <th className="rb-matrix__th rb-matrix__th--perm">Permission</th>
              {roles.map((r) => (
                <th key={r.id} className="rb-matrix__th rb-matrix__th--role">
                  <span className={"rb-matrix__roledot rb-matrix__roledot--" + r.dot} />
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MATRIX_ROWS.map((row) => {
              const showGroup = row.group !== lastGroup;
              lastGroup = row.group;
              return (
                <React.Fragment key={row.cat + row.idx + row.label}>
                  {showGroup && (
                    <tr className="rb-matrix__grouprow">
                      <td colSpan={roles.length + 1}>{row.group}</td>
                    </tr>
                  )}
                  <tr className="rb-matrix__tr">
                    <td className="rb-matrix__td rb-matrix__td--perm">{row.label}</td>
                    {roles.map((r) => (
                      <td key={r.id} className="rb-matrix__td rb-matrix__td--cell">
                        <MatrixCell level={cellLevel(r, row.cat, row.idx)} />
                      </td>
                    ))}
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
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

  /* page state — roles carry their own grant + scope maps */
  const [roles, setRoles] = React.useState(() => ROLES_SEED.map((r) => ({ ...r, ...buildRole(r.spec) })));
  const [view, setView] = React.useState("detail");          /* detail | matrix */
  const [selectedId, setSelectedId] = React.useState("admin");
  const [detailTab, setDetailTab] = React.useState("permissions");
  const [activeCat, setActiveCat] = React.useState("dashboard");

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

  const selectRole = (id) => { setSelectedId(id); setDetailTab("permissions"); setActiveCat("dashboard"); };
  const toggle = (permId, val) =>
    setRoles((rs) => rs.map((r) => r.id === selectedId ? { ...r, grant: { ...r.grant, [permId]: val } } : r));
  const setScope = (scopeId, val) =>
    setRoles((rs) => rs.map((r) => r.id === selectedId ? { ...r, scope: { ...r.scope, [scopeId]: val } } : r));

  const selectedRole = roles.find((r) => r.id === selectedId) || roles[0];
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
          <RolesHeader view={view} onView={setView} />

          {view === "detail" ? (
            <div className="rb-split">
              <RoleList roles={roles} selectedId={selectedId} onSelect={selectRole} onCreate={() => {}} />
              <RoleDetail role={selectedRole}
                detailTab={detailTab} onDetailTab={setDetailTab}
                activeCat={activeCat} onCat={setActiveCat} onToggle={toggle} onScope={setScope} />
            </div>
          ) : (
            <RoleMatrix roles={roles} />
          )}
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
