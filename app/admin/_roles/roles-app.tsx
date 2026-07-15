"use client";

import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/choice";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/navigation/tabs";
import { ADMIN } from "@/components/admin";
import { useLang } from "@/lib/i18n";
import { fmtNum, permKey } from "@/lib/fmt";
import { logAudit } from "../_shared/audit-log";
import {
  MATRIX_ROWS,
  ROLES_SEED,
  buildRole,
  catsFor,
  cellLevel,
  countGrant,
  flatFor,
  totalPermsFor,
  type Cat,
  type Group,
  type RoleState,
  type Surface,
} from "./data";

function RolesHeader({ view, onView }: { view: string; onView: (v: string) => void }) {
  const { t } = useLang();
  return (
    <div className="rb-head">
      <div className="rb-head__intro">
        <h1 className="rb-head__title">{t("admin.roles.title")}</h1>
        <p className="rb-head__sub">{t("admin.roles.sub")}</p>
      </div>
      <div className="rb-seg" role="tablist" aria-label={t("admin.agents.viewMode")}>
        <button type="button" role="tab" aria-selected={view === "detail"} className={"rb-seg__btn" + (view === "detail" ? " is-active" : "")} onClick={() => onView("detail")}>
          {t("admin.roles.viewDetail")}
        </button>
        <button type="button" role="tab" aria-selected={view === "matrix"} className={"rb-seg__btn" + (view === "matrix" ? " is-active" : "")} onClick={() => onView("matrix")}>
          {t("admin.roles.viewMatrix")}
        </button>
      </div>
    </div>
  );
}

function RoleList({ roles, selectedId, onSelect, onCreate }: { roles: RoleState[]; selectedId: string; onSelect: (id: string) => void; onCreate: () => void }) {
  const { t, lang, dir } = useLang();
  return (
    <aside className="rb-list" aria-label={t("admin.roles.rolesAria")}>
      <div className="rb-list__eyebrow">{t("admin.roles.selectRole")}</div>
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
                  {fmtNum(lang, r.users)} {t(r.users === 1 ? "admin.roles.memberOne" : "admin.roles.memberMany")}
                </span>
              </span>
              <span className="rb-roleitem__chev">
                <Icon name={dir === "rtl" ? "chevron-left" : "chevron-right"} size={16} />
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="rb-list__create" onClick={onCreate}>
        <Icon name="plus" size={16} /> {t("admin.roles.createNew")}
      </button>
    </aside>
  );
}

function PermissionGroup({ cat, group, role, locked, onToggle }: { cat: Cat; group: Group; role: RoleState; locked: boolean; onToggle: (id: string, v: boolean) => void }) {
  const { t, lang } = useLang();
  const surface = (role.surface ?? "admin") === "member" ? "member" : "staff";
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const perms = flatFor(role.surface ?? "admin")[cat.key].filter((p) => p.groupId === group.id);
  const on = perms.filter((p) => role.grant[p.permId]).length;
  const total = perms.length;
  const allOn = on === total;
  const anyOn = on > 0;
  const setMaster = (checked: boolean) => perms.forEach((p) => onToggle(p.permId, checked));
  const groupLabel = tOr(`perm.group.${group.id}`, group.label);
  return (
    <section className={"rb-group" + (anyOn ? "" : " is-off")}>
      <header className="rb-group__head">
        <span className="rb-group__label">{groupLabel}</span>
        <span className="rb-group__count">
          {fmtNum(lang, on)}/{fmtNum(lang, total)}
        </span>
        <span className="rb-group__ctrl">
          <Switch checked={allOn} disabled={locked} aria-label={t("admin.roles.enableAll", { group: groupLabel })} onChange={(e) => setMaster(e.target.checked)} />
        </span>
      </header>
      <div className="rb-rows">
        {perms.map((p) => {
          const label = tOr(permKey(surface, p.label) + ".label", p.label);
          return (
            <div className="rb-row" key={p.permId}>
              <span className="rb-row__text">
                <span className="rb-row__label">{label}</span>
                <span className="rb-row__desc">{tOr(permKey(surface, p.label) + ".desc", p.desc)}</span>
              </span>
              <span className="rb-row__sw">
                <Switch checked={!!role.grant[p.permId]} disabled={locked} aria-label={label} onChange={(e) => onToggle(p.permId, e.target.checked)} />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PermissionsTab({ role, locked, activeCat, onCat, onToggle }: { role: RoleState; locked: boolean; activeCat: string; onCat: (k: string) => void; onToggle: (id: string, v: boolean) => void }) {
  const surface = role.surface ?? "admin";
  const cats = catsFor(surface);
  const catFlat = flatFor(surface);
  const cat = cats.find((c) => c.key === activeCat) || cats[0];
  return (
    <div className="rb-permissions">
      <nav className="rb-catnav" aria-label="Permission categories">
        {cats.map((c) => (
          <button key={c.key} type="button" className={"rb-cat" + (c.key === activeCat ? " is-active" : "")} onClick={() => onCat(c.key)} aria-pressed={c.key === activeCat}>
            {c.label}
            <span className="rb-cat__badge">{catFlat[c.key].length}</span>
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
  const { t, lang } = useLang();
  const [val, setVal] = useState(defaultValue);
  const remaining = DESC_MAX - val.length;
  return (
    <div className="rb-descfield">
      <Textarea label={t("admin.roles.roleDesc")} rows={3} value={val} maxLength={DESC_MAX} readOnly={readOnly} onChange={(e) => setVal(e.target.value)} />
      <span className={"rb-desccount" + (remaining <= 20 ? " is-low" : "")}>{t("admin.roles.charsLeft", { count: fmtNum(lang, remaining) })}</span>
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
  const { t } = useLang();
  const canDelete = ADMIN.role === "Super Admin" && !role.locked;
  const [confirmOpen, setConfirmOpen] = useState(false);
  return (
    <div className="rb-settings">
      <section className="rb-setblock">
        <header className="rb-setblock__head">
          <h3 className="rb-setblock__title">{t("admin.roles.detailTitle")}</h3>
          <p className="rb-setblock__sub">{t("admin.roles.detailSub")}</p>
        </header>
        <div className="rb-setrow">
          <div className="rb-setrow__field">
            <Input label={t("admin.roles.roleName")} defaultValue={role.name} disabled={role.id === "super-admin"} />
          </div>
          <div className="rb-setfield">
            <span className="rb-setfield__label">{t("admin.roles.icon")}</span>
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
              <h3 className="rb-danger__title">{t("admin.roles.deleteTitle")}</h3>
              <p className="rb-danger__sub">{t("admin.roles.deleteSub")}</p>
            </div>
            <Button hierarchy="secondary-destructive" iconLeading="trash-2" disabled={!canDelete} title={canDelete ? undefined : t("admin.roles.systemLocked")} onClick={() => setConfirmOpen(true)}>
              {t("admin.roles.deleteRole")}
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
  const { t, lang } = useLang();
  const locked = !!role.locked;
  const surface = role.surface ?? "admin";
  const enabled = countGrant(role.grant, surface);
  return (
    <section className="rb-detail" aria-label={t("admin.roles.detailsAria", { name: role.name })}>
      <header className="rb-detail__head">
        <h2 className="rb-detail__name">
          {t("admin.roles.rolePermissions", { name: role.name })}
          <span className="rb-grantbadge">
            <Icon name="shield-check" size={13} /> {t("admin.roles.granted", { on: fmtNum(lang, enabled), total: fmtNum(lang, totalPermsFor(surface)) })}
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
            { value: "permissions", label: t("admin.roles.tab.permissions"), icon: "shield-check" },
            { value: "settings", label: t("admin.roles.tab.settings"), icon: "settings" },
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

const ROLE_TYPES: { value: Surface; labelKey: string; icon: IconName; hintKey: string }[] = [
  { value: "admin", labelKey: "admin.roles.surface.staff", icon: "users", hintKey: "admin.roles.surface.staffHint" },
  { value: "member", labelKey: "admin.roles.surface.member", icon: "user", hintKey: "admin.roles.surface.memberHint" },
];

/** Gate on `open` so the form resets each time the modal is opened. */
function CreateRoleModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (v: { name: string; desc: string; icon: IconName; surface: Surface }) => void }) {
  if (!open) return null;
  return <CreateRoleForm open={open} onClose={onClose} onCreate={onCreate} />;
}

function CreateRoleForm({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (v: { name: string; desc: string; icon: IconName; surface: Surface }) => void }) {
  const { t } = useLang();
  const [surface, setSurface] = useState<Surface>("admin");
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("shield-check");
  const [desc, setDesc] = useState("");
  const canSubmit = name.trim().length > 0;

  const footer = (
    <>
      <Button hierarchy="secondary" size="lg" onClick={onClose}>
        Cancel
      </Button>
      <Button hierarchy="primary" size="lg" iconLeading="plus" disabled={!canSubmit} onClick={() => onCreate({ name, desc, icon, surface })}>
        Create role
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} size="lg" icon="shield-check" title={t("admin.roles.createNew")} subtitle={t("admin.roles.createSub")} footer={footer} className="rb-createmodal">
      <div className="rb-create">
        <div className="rb-create__field">
          <span className="rb-create__label">{t("admin.roles.roleType")}</span>
          <div className="rb-typegrid" role="radiogroup" aria-label={t("admin.roles.roleType")}>
            {ROLE_TYPES.map((rt) => (
              <button key={rt.value} type="button" role="radio" aria-checked={surface === rt.value} className={"rb-typecard" + (surface === rt.value ? " is-active" : "")} onClick={() => setSurface(rt.value)}>
                <span className="rb-typecard__icon">
                  <Icon name={rt.icon} size={18} />
                </span>
                <span className="rb-typecard__body">
                  <span className="rb-typecard__label">{t(rt.labelKey)}</span>
                  <span className="rb-typecard__hint">{t(rt.hintKey)}</span>
                </span>
                {surface === rt.value && (
                  <span className="rb-typecard__check">
                    <Icon name="check" size={15} strokeWidth={2.6} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <Input label={t("admin.roles.roleName")} value={name} autoFocus iconLeading="shield" placeholder={t("admin.roles.roleNamePh")} onChange={(e) => setName(e.target.value)} />

        <div className="rb-create__field">
          <span className="rb-create__label">{t("admin.roles.icon")}</span>
          <div className="rb-create__icons" role="radiogroup" aria-label={t("admin.roles.roleIcon")}>
            {ROLE_ICONS.map((name) => (
              <button key={name} type="button" role="radio" aria-checked={name === icon} className={"rb-iconpick__opt" + (name === icon ? " is-active" : "")} onClick={() => setIcon(name)} aria-label={name}>
                <Icon name={name} size={18} />
              </button>
            ))}
          </div>
        </div>

        <Textarea label={t("admin.roles.roleDesc")} rows={3} value={desc} maxLength={DESC_MAX} placeholder={t("admin.roles.roleDescPh")} onChange={(e) => setDesc(e.target.value)} />
      </div>
    </Modal>
  );
}

export function RolesApp() {
  const [roles, setRoles] = useState<RoleState[]>(() => ROLES_SEED.map((r) => ({ ...r, surface: r.surface ?? "admin", ...buildRole(r.spec, r.surface ?? "admin") })));
  const [view, setView] = useState("detail");
  const [selectedId, setSelectedId] = useState("super-admin");
  const [detailTab, setDetailTab] = useState("permissions");
  const [activeCat, setActiveCat] = useState("dashboard");
  const [createOpen, setCreateOpen] = useState(false);

  const selectRole = (id: string) => {
    const role = roles.find((r) => r.id === id);
    setSelectedId(id);
    setDetailTab("permissions");
    setActiveCat(catsFor(role?.surface ?? "admin")[0].key);
  };
  const toggle = (permId: string, val: boolean) => setRoles((rs) => rs.map((r) => (r.id === selectedId ? { ...r, grant: { ...r.grant, [permId]: val } } : r)));
  const setIcon = (icon: IconName) => setRoles((rs) => rs.map((r) => (r.id === selectedId ? { ...r, icon } : r)));
  const deleteRole = () => {
    const removed = roles.find((r) => r.id === selectedId);
    const next = roles.find((r) => r.id !== selectedId);
    logAudit({ category: "role", actionKey: "audit.action.deletedRole", target: removed?.name ?? selectedId, targetId: selectedId });
    setRoles((rs) => rs.filter((r) => r.id !== selectedId));
    if (next) selectRole(next.id);
  };
  const createRole = (v: { name: string; desc: string; icon: IconName; surface: Surface }) => {
    const id = "role-" + Date.now().toString(36);
    const created = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const tone = v.surface === "member" ? "info" : "brand";
    const newRole: RoleState = {
      id,
      name: v.name.trim(),
      tone,
      dot: tone,
      icon: v.icon,
      system: false,
      surface: v.surface,
      status: "Active",
      users: 0,
      created,
      desc: v.desc.trim(),
      spec: {},
      ...buildRole({}, v.surface),
    };
    logAudit({
      category: "role",
      actionKey: "audit.action.createdRole",
      target: newRole.name,
      targetId: id,
      metaKey: v.surface === "member" ? "audit.meta.memberSurface" : "audit.meta.adminSurface",
    });
    setRoles((rs) => [...rs, newRole]);
    setCreateOpen(false);
    setView("detail");
    setSelectedId(id);
    setDetailTab("permissions");
    setActiveCat(catsFor(v.surface)[0].key);
  };

  const selectedRole = roles.find((r) => r.id === selectedId) || roles[0];

  return (
    <>
      <RolesHeader view={view} onView={setView} />
      {view === "detail" ? (
        <div className="rb-split">
          <RoleList roles={roles} selectedId={selectedId} onSelect={selectRole} onCreate={() => setCreateOpen(true)} />
          <RoleDetail role={selectedRole} detailTab={detailTab} onDetailTab={setDetailTab} activeCat={activeCat} onCat={setActiveCat} onToggle={toggle} onIcon={setIcon} onDelete={deleteRole} />
        </div>
      ) : (
        <RoleMatrix roles={roles} />
      )}
      <CreateRoleModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createRole} />
    </>
  );
}
