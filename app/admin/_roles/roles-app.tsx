"use client";

import { Fragment, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { AvatarGroup } from "@/components/ui/avatar";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/choice";
import { Tabs } from "@/components/navigation/tabs";
import { ADMIN } from "@/components/admin";
import {
  CATS,
  CAT_FLAT,
  MATRIX_ROWS,
  ROLES_SEED,
  SCOPE_OPTS,
  TOTAL_PERMS,
  buildRole,
  cellLevel,
  countGrant,
  usersFor,
  type Cat,
  type Group,
  type RoleState,
} from "./data";

function RolesHeader({ view, onView }: { view: string; onView: (v: string) => void }) {
  return (
    <div className="rb-head">
      <div className="rb-head__intro">
        <h1 className="rb-head__title">Roles &amp; permissions</h1>
        <p className="rb-head__sub">Manage your team and access control across the Chiya Estate platform.</p>
      </div>
      <div className="rb-seg" role="tablist" aria-label="View">
        <button type="button" role="tab" aria-selected={view === "detail"} className={"rb-seg__btn" + (view === "detail" ? " is-active" : "")} onClick={() => onView("detail")}>
          Detail
        </button>
        <button type="button" role="tab" aria-selected={view === "matrix"} className={"rb-seg__btn" + (view === "matrix" ? " is-active" : "")} onClick={() => onView("matrix")}>
          Role matrix
        </button>
      </div>
    </div>
  );
}

function RoleList({ roles, selectedId, onSelect, onCreate }: { roles: RoleState[]; selectedId: string; onSelect: (id: string) => void; onCreate: () => void }) {
  return (
    <aside className="rb-list" aria-label="Roles">
      <div className="rb-list__eyebrow">Select role</div>
      <div className="rb-list__items">
        {roles.map((r) => {
          const sel = r.id === selectedId;
          return (
            <button key={r.id} type="button" className={"rb-roleitem" + (sel ? " is-selected" : "")} onClick={() => onSelect(r.id)} aria-pressed={sel}>
              <span className={"rb-roleicon rb-roleicon--" + r.dot}>
                <Icon name={r.icon || "shield"} size={17} />
              </span>
              <span className="rb-roleitem__body">
                <span className="rb-roleitem__name">{r.name}</span>
                <span className="rb-roleitem__meta">
                  {r.users} {r.users === 1 ? "member" : "members"}
                </span>
              </span>
              <span className="rb-roleitem__chev">
                <Icon name="chevron-right" size={16} />
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="rb-list__create" onClick={onCreate}>
        <Icon name="plus" size={16} /> Create new role
      </button>
    </aside>
  );
}

function PermissionGroup({ cat, group, role, locked, onToggle }: { cat: Cat; group: Group; role: RoleState; locked: boolean; onToggle: (id: string, v: boolean) => void }) {
  const perms = CAT_FLAT[cat.key].filter((p) => p.groupId === group.id);
  const on = perms.filter((p) => role.grant[p.permId]).length;
  const total = perms.length;
  const allOn = on === total;
  const anyOn = on > 0;
  const setMaster = (checked: boolean) => perms.forEach((p) => onToggle(p.permId, checked));
  return (
    <section className={"rb-group" + (anyOn ? "" : " is-off")}>
      <header className="rb-group__head">
        <span className="rb-group__label">{group.label}</span>
        <span className="rb-group__count">
          {on}/{total}
        </span>
        <span className="rb-group__ctrl">
          <Switch checked={allOn} disabled={locked} aria-label={"Enable all " + group.label + " permissions"} onChange={(e) => setMaster(e.target.checked)} />
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
              <Switch checked={!!role.grant[p.permId]} disabled={locked} aria-label={p.label} onChange={(e) => onToggle(p.permId, e.target.checked)} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PermissionsTab({ role, locked, activeCat, onCat, onToggle, onScope }: { role: RoleState; locked: boolean; activeCat: string; onCat: (k: string) => void; onToggle: (id: string, v: boolean) => void; onScope: (id: string, v: string) => void }) {
  const cat = CATS.find((c) => c.key === activeCat) || CATS[0];
  return (
    <div className="rb-permissions">
      {locked && (
        <div className="rb-locknote">
          <Icon name="lock" size={15} />
          <span>Super admin always has full access. Its permissions are locked to protect platform integrity.</span>
        </div>
      )}
      <nav className="rb-catnav" aria-label="Permission categories">
        {CATS.map((c) => (
          <button key={c.key} type="button" className={"rb-cat" + (c.key === activeCat ? " is-active" : "")} onClick={() => onCat(c.key)} aria-pressed={c.key === activeCat}>
            {c.label}
            <span className="rb-cat__badge">{CAT_FLAT[c.key].length}</span>
          </button>
        ))}
      </nav>
      <div className="rb-groups">
        {cat.groups.map((g) => (
          <PermissionGroup key={g.id} cat={cat} group={g} role={role} locked={locked} onToggle={onToggle} onScope={onScope} />
        ))}
      </div>
    </div>
  );
}

function RoleSettingsTab({ role }: { role: RoleState }) {
  const enabled = countGrant(role.grant);
  const users = usersFor(role, 5);
  const canDelete = ADMIN.role === "Super Admin" && !role.locked;
  return (
    <div className="rb-settings">
      <section className="rb-setblock">
        <h3 className="rb-setblock__title">Role details</h3>
        <div className="rb-setgrid">
          <Input label="Role name" defaultValue={role.name} iconLeading="tag" readOnly={role.system} />
          <div className="rb-setfield">
            <span className="rb-setfield__label">Role status</span>
            <div className="rb-statuspill">
              <span className="rb-statusdot" /> {role.status}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <Textarea label="Role description" rows={3} defaultValue={role.desc} readOnly={role.system} />
        </div>
      </section>

      <section className="rb-setblock">
        <h3 className="rb-setblock__title">Assigned members</h3>
        <div className="rb-assigned">
          <AvatarGroup avatars={users.map((p) => ({ src: p.src, name: p.name }))} max={5} size="md" />
          <div className="rb-assigned__meta">
            <span className="rb-assigned__count">{role.users}</span>
            <span className="rb-assigned__lbl">
              {role.users === 1 ? "member has" : "members have"} this role · {enabled} permissions granted
            </span>
          </div>
          <span style={{ flex: "1 1 auto" }} />
          <Button hierarchy="secondary" size="sm" iconLeading="user-plus">
            Manage members
          </Button>
        </div>
      </section>

      <section className="rb-setblock">
        <h3 className="rb-setblock__title">Actions</h3>
        <div className="rb-actions">
          <Button hierarchy="secondary" iconLeading="pencil" disabled={role.system}>
            Edit role
          </Button>
          <Button hierarchy="secondary" iconLeading="copy">
            Duplicate role
          </Button>
          <button type="button" className="rb-delbtn" disabled={!canDelete} title={canDelete ? undefined : "System roles can't be deleted"}>
            <Icon name="trash-2" size={16} /> Delete role
          </button>
        </div>
        <p className="rb-actions__note">
          <Icon name="info" size={14} /> System roles are protected and can&apos;t be deleted.
        </p>
      </section>
    </div>
  );
}

function RoleDetail({
  role,
  detailTab,
  onDetailTab,
  activeCat,
  onCat,
  onToggle,
  onScope,
}: {
  role: RoleState;
  detailTab: string;
  onDetailTab: (v: string) => void;
  activeCat: string;
  onCat: (k: string) => void;
  onToggle: (id: string, v: boolean) => void;
  onScope: (id: string, v: string) => void;
}) {
  const locked = !!role.locked;
  const enabled = countGrant(role.grant);
  return (
    <section className="rb-detail" aria-label={role.name + " details"}>
      <header className="rb-detail__head">
        <h2 className="rb-detail__name">
          {role.name} permissions
          <span className="rb-grantbadge">
            <Icon name="shield-check" size={13} /> {enabled}/{TOTAL_PERMS} granted
          </span>
        </h2>
        <p className="rb-detail__desc">{role.desc}</p>
      </header>
      <div className="rb-detail__tabs">
        <Tabs
          variant="line"
          value={detailTab}
          onChange={onDetailTab}
          items={[
            { value: "permissions", label: "Permissions", icon: "shield-check" },
            { value: "settings", label: "Role setting", icon: "settings" },
          ]}
        />
      </div>
      <div className="rb-detail__body">
        {detailTab === "permissions" ? (
          <PermissionsTab role={role} locked={locked} activeCat={activeCat} onCat={onCat} onToggle={onToggle} onScope={onScope} />
        ) : (
          <RoleSettingsTab role={role} />
        )}
      </div>
    </section>
  );
}

function MatrixCell({ level }: { level: "full" | "none" }) {
  const glyph = level === "full" ? "✓" : "✕";
  return (
    <span className={"rb-cell rb-cell--" + level} title={level === "full" ? "Full access" : "No access"}>
      {glyph}
    </span>
  );
}

function RoleMatrix({ roles }: { roles: RoleState[] }) {
  return (
    <section className="rb-matrixcard">
      <header className="rb-matrixcard__head">
        <div>
          <h2 className="rb-matrixcard__title">Role permission matrix</h2>
          <p className="rb-matrixcard__desc">Overview of permissions across all roles.</p>
        </div>
        <div className="rb-legend">
          <span className="rb-legend__item">
            <span className="rb-cell rb-cell--full">✓</span> Full access
          </span>
          <span className="rb-legend__item">
            <span className="rb-cell rb-cell--none">✕</span> No access
          </span>
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
            {MATRIX_ROWS.map((row, i) => {
              const showGroup = MATRIX_ROWS.findIndex((x) => x.group === row.group) === i;
              return (
                <Fragment key={row.cat + row.idx + row.label}>
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
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RolesApp() {
  const [roles, setRoles] = useState<RoleState[]>(() => ROLES_SEED.map((r) => ({ ...r, ...buildRole(r.spec) })));
  const [view, setView] = useState("detail");
  const [selectedId, setSelectedId] = useState("super-admin");
  const [detailTab, setDetailTab] = useState("permissions");
  const [activeCat, setActiveCat] = useState("dashboard");

  const selectRole = (id: string) => {
    setSelectedId(id);
    setDetailTab("permissions");
    setActiveCat("dashboard");
  };
  const toggle = (permId: string, val: boolean) => setRoles((rs) => rs.map((r) => (r.id === selectedId ? { ...r, grant: { ...r.grant, [permId]: val } } : r)));
  const setScope = (scopeId: string, val: string) => setRoles((rs) => rs.map((r) => (r.id === selectedId ? { ...r, scope: { ...r.scope, [scopeId]: val } } : r)));

  const selectedRole = roles.find((r) => r.id === selectedId) || roles[0];

  return (
    <>
      <RolesHeader view={view} onView={setView} />
      {view === "detail" ? (
        <div className="rb-split">
          <RoleList roles={roles} selectedId={selectedId} onSelect={selectRole} onCreate={() => {}} />
          <RoleDetail role={selectedRole} detailTab={detailTab} onDetailTab={setDetailTab} activeCat={activeCat} onCat={setActiveCat} onToggle={toggle} onScope={setScope} />
        </div>
      ) : (
        <RoleMatrix roles={roles} />
      )}
    </>
  );
}
