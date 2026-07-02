"use client";

import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/choice";
import { Tabs } from "@/components/navigation/tabs";
import { ADMIN } from "@/components/admin";
import {
  CATS,
  CAT_FLAT,
  MATRIX_ROWS,
  ROLES_SEED,
  TOTAL_PERMS,
  buildRole,
  cellLevel,
  countGrant,
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

function PermissionsTab({ role, locked, activeCat, onCat, onToggle }: { role: RoleState; locked: boolean; activeCat: string; onCat: (k: string) => void; onToggle: (id: string, v: boolean) => void }) {
  const cat = CATS.find((c) => c.key === activeCat) || CATS[0];
  return (
    <div className="rb-permissions">
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
          <PermissionGroup key={g.id} cat={cat} group={g} role={role} locked={locked} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

const ROLE_ICONS: IconName[] = ["shield-check", "badge-check", "user", "users", "key", "star", "crown", "briefcase", "gauge", "settings"];

function IconPicker({ role, onIcon }: { role: RoleState; onIcon: (v: IconName) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rb-iconpick">
      <button type="button" className="rb-iconpick__btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Choose role icon">
        <span className={"rb-roleicon rb-roleicon--" + role.dot}>
          <Icon name={role.icon} size={18} />
        </span>
      </button>
      {open && (
        <>
          <button type="button" className="rb-iconpick__scrim" aria-label="Close icon picker" onClick={() => setOpen(false)} />
          <div className="rb-iconpick__pop" role="menu">
            {ROLE_ICONS.map((name) => (
              <button
                key={name}
                type="button"
                role="menuitemradio"
                aria-checked={name === role.icon}
                className={"rb-iconpick__opt" + (name === role.icon ? " is-active" : "")}
                onClick={() => {
                  onIcon(name);
                  setOpen(false);
                }}
              >
                <Icon name={name} size={18} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const DESC_MAX = 240;

function DescriptionField({ defaultValue, readOnly }: { defaultValue: string; readOnly?: boolean }) {
  const [val, setVal] = useState(defaultValue);
  const remaining = DESC_MAX - val.length;
  return (
    <div className="rb-descfield">
      <Textarea label="Role description" rows={3} value={val} maxLength={DESC_MAX} readOnly={readOnly} onChange={(e) => setVal(e.target.value)} />
      <span className={"rb-desccount" + (remaining <= 20 ? " is-low" : "")}>{remaining} characters left</span>
    </div>
  );
}

function DeleteRoleModal({ role, onCancel, onConfirm }: { role: RoleState; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div className="rb-confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="rb-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rb-del-ttl">
        <span className="rb-confirm__icon rb-confirm__icon--danger">
          <Icon name="trash-2" size={22} strokeWidth={1.9} />
        </span>
        <h3 id="rb-del-ttl" className="rb-confirm__title">
          Delete role?
        </h3>
        <p className="rb-confirm__msg">
          Are you sure you want to delete the <strong>{role.name}</strong> role? Members assigned to it will lose its permissions. This action cannot be undone.
        </p>
        <div className="rb-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button hierarchy="destructive" size="md" type="button" iconLeading="trash-2" onClick={onConfirm}>
            Delete role
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RoleSettingsTab({ role, onIcon, onDelete }: { role: RoleState; onIcon: (v: IconName) => void; onDelete: () => void }) {
  const canDelete = ADMIN.role === "Super Admin" && !role.locked;
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="rb-settings">
      <section className="rb-setblock">
        <header className="rb-setblock__head">
          <h3 className="rb-setblock__title">Role detail</h3>
          <p className="rb-setblock__sub">Basic identity for this role — its name, icon and description.</p>
        </header>
        <div className="rb-setrow">
          <div className="rb-setrow__field">
            <Input label="Role name" defaultValue={role.name} disabled={role.id === "super-admin"} />
          </div>
          <div className="rb-setfield">
            <span className="rb-setfield__label">Icon</span>
            <IconPicker role={role} onIcon={onIcon} />
          </div>
        </div>
        <div className="rb-setrow">
          <div className="rb-setrow__field">
            <DescriptionField key={role.id} defaultValue={role.desc} readOnly={role.system} />
          </div>
        </div>
      </section>

      {role.id !== "super-admin" && (
        <section className="rb-setblock">
          <div className="rb-setbody rb-dangerrow">
            <div className="rb-danger__text">
              <h3 className="rb-danger__title">Delete this role</h3>
              <p className="rb-danger__sub">Permanently remove this role. Members assigned to it will lose its permissions.</p>
            </div>
            <Button hierarchy="secondary-destructive" iconLeading="trash-2" disabled={!canDelete} title={canDelete ? undefined : "System roles can't be deleted"} onClick={() => setConfirmOpen(true)}>
              Delete role
            </Button>
          </div>
        </section>
      )}

      {confirmOpen && (
        <DeleteRoleModal
          role={role}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onDelete();
          }}
        />
      )}
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
  onIcon,
  onDelete,
}: {
  role: RoleState;
  detailTab: string;
  onDetailTab: (v: string) => void;
  activeCat: string;
  onCat: (k: string) => void;
  onToggle: (id: string, v: boolean) => void;
  onIcon: (v: IconName) => void;
  onDelete: () => void;
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
          <PermissionsTab role={role} locked={locked} activeCat={activeCat} onCat={onCat} onToggle={onToggle} />
        ) : (
          <RoleSettingsTab role={role} onIcon={onIcon} onDelete={onDelete} />
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
  const setIcon = (icon: IconName) => setRoles((rs) => rs.map((r) => (r.id === selectedId ? { ...r, icon } : r)));
  const deleteRole = () => {
    const next = roles.find((r) => r.id !== selectedId);
    setRoles((rs) => rs.filter((r) => r.id !== selectedId));
    if (next) selectRole(next.id);
  };

  const selectedRole = roles.find((r) => r.id === selectedId) || roles[0];

  return (
    <>
      <RolesHeader view={view} onView={setView} />
      {view === "detail" ? (
        <div className="rb-split">
          <RoleList roles={roles} selectedId={selectedId} onSelect={selectRole} onCreate={() => {}} />
          <RoleDetail role={selectedRole} detailTab={detailTab} onDetailTab={setDetailTab} activeCat={activeCat} onCat={setActiveCat} onToggle={toggle} onIcon={setIcon} onDelete={deleteRole} />
        </div>
      ) : (
        <RoleMatrix roles={roles} />
      )}
    </>
  );
}
