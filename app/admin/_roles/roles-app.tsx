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
  ROLES_SEED_V2,
  SCOPE_OPTS_V2,
  buildRoleV2,
  cellOf,
  countGrantV2,
  sectionPerms,
  sectionsFor,
  totalFor,
  viewIdOf,
  type FlatPermV2,
  type GroupV2,
  type RoleStateV2,
  type ScopeVal,
  type SectionV2,
  type SurfaceV2,
} from "./data";

/* ----------------------------------------------------------------------------
   Roles & permissions V2 — the proposed redesign running beside the live
   screen (/admin/roles) for comparison. Same layout language (rb- classes),
   new mechanics: sidebar-mirrored sections, per-section scope, a view-root
   dependency cascade, lock-out prevention, self-moderation warning, clone-on-
   create and per-toggle audit events. Spec: docs/roles-permissions-design.md.
   ------------------------------------------------------------------------- */

const permSurface = (surface: SurfaceV2): "staff" | "member" => (surface === "member" ? "member" : "staff");

function RolesV2Header({ view, onView }: { view: string; onView: (v: string) => void }) {
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

function RoleList({ roles, selectedId, onSelect, onCreate }: { roles: RoleStateV2[]; selectedId: string; onSelect: (id: string) => void; onCreate: () => void }) {
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

/** Own / Team / Organisational — one reach per scopeable section. */
function ScopeSelect({ value, disabled, onChange }: { value: ScopeVal; disabled: boolean; onChange: (v: ScopeVal) => void }) {
  const { t } = useLang();
  return (
    <span className="rb-scope">
      <select value={value} disabled={disabled} aria-label={t("admin.rolesV2.scopeAria")} onChange={(e) => onChange(e.target.value as ScopeVal)}>
        {SCOPE_OPTS_V2.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.labelKey)}
          </option>
        ))}
      </select>
      <span className="rb-scope__chev">
        <Icon name="chevron-down" size={15} />
      </span>
    </span>
  );
}

function PermissionGroupV2({
  section,
  group,
  role,
  locked,
  guardedIds,
  onToggle,
  onMaster,
}: {
  section: SectionV2;
  group: GroupV2;
  role: RoleStateV2;
  locked: boolean;
  /** Permission ids whose switches are frozen by the lock-out guard. */
  guardedIds: string[];
  onToggle: (perm: FlatPermV2, v: boolean) => void;
  onMaster: (section: SectionV2, group: GroupV2, v: boolean) => void;
}) {
  const { t, lang } = useLang();
  const surface = permSurface(role.surface);
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const perms = sectionPerms(role.surface, section.key).filter((p) => p.groupId === group.id);
  const on = perms.filter((p) => role.grant[p.id]).length;
  const total = perms.length;
  const allOn = on === total;
  const anyOn = on > 0;
  const masterGuarded = perms.some((p) => guardedIds.includes(p.id));
  const groupLabel = tOr(`perm.group.${group.id}`, group.label);
  return (
    <section className={"rb-group" + (anyOn ? "" : " is-off")}>
      <header className="rb-group__head">
        <span className="rb-group__label">{groupLabel}</span>
        <span className="rb-group__count">
          {fmtNum(lang, on)}/{fmtNum(lang, total)}
        </span>
        <span className="rb-group__ctrl">
          <Switch checked={allOn} disabled={locked || masterGuarded} aria-label={t("admin.roles.enableAll", { group: groupLabel })} onChange={(e) => onMaster(section, group, e.target.checked)} />
        </span>
      </header>
      <div className="rb-rows">
        {perms.map((p) => {
          const label = tOr(permKey(surface, p.label) + ".label", p.label);
          const guarded = guardedIds.includes(p.id);
          return (
            <div className="rb-row" key={p.id}>
              <span className="rb-row__text">
                <span className="rb-row__label">{label}</span>
                <span className="rb-row__desc">{tOr(permKey(surface, p.label) + ".desc", p.desc)}</span>
              </span>
              <span className="rb-row__sw">
                <Switch checked={!!role.grant[p.id]} disabled={locked || guarded} aria-label={label} onChange={(e) => onToggle(p, e.target.checked)} />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PermissionsTabV2({
  role,
  roles,
  locked,
  activeSection,
  onSection,
  onToggle,
  onMaster,
  onScope,
}: {
  role: RoleStateV2;
  roles: RoleStateV2[];
  locked: boolean;
  activeSection: string;
  onSection: (k: string) => void;
  onToggle: (perm: FlatPermV2, v: boolean) => void;
  onMaster: (section: SectionV2, group: GroupV2, v: boolean) => void;
  onScope: (sectionKey: string, v: ScopeVal) => void;
}) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const sections = sectionsFor(role.surface);
  const section = sections.find((s) => s.key === activeSection) || sections[0];
  const scope = role.scope[section.key] ?? "org";

  /* Lock-out prevention: the last staff role able to manage permissions can
     never toggle that reach away — otherwise nobody could reopen this screen. */
  const lastEditor =
    role.surface === "admin" &&
    !!role.grant["roles.edit"] &&
    !roles.some((r) => r.id !== role.id && r.surface === "admin" && r.grant["roles.edit"]);
  const guardedIds = lastEditor ? ["roles.edit", "roles.view"] : [];

  /* Self-moderation conflict: moderating reviews at "own" reach means a role
     could approve reviews written about itself. */
  const conflict = section.key === "reviews" && scope === "own" && (!!role.grant["reviews.approve"] || !!role.grant["reviews.reject"]);

  return (
    <div className="rb-permissions">
      <nav className="rb-catnav" aria-label={t("admin.rolesV2.sectionsAria")}>
        {sections.map((s) => {
          const perms = sectionPerms(role.surface, s.key);
          const on = perms.filter((perm) => role.grant[perm.id]).length;
          return (
            <button key={s.key} type="button" className={"rb-cat" + (s.key === section.key ? " is-active" : "")} onClick={() => onSection(s.key)} aria-pressed={s.key === section.key}>
              {tOr(s.labelKey, s.label)}
              <span className="rb-cat__badge">
                {fmtNum(lang, on)}/{fmtNum(lang, perms.length)}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="rb-groups">
        {role.surface === "admin" && (
          <div className="rb2-scopebar">
            <span className="rb2-scopebar__text">
              <span className="rb2-scopebar__label">{t("admin.rolesV2.scopeAria")}</span>
              <span className="rb2-scopebar__hint">{t("admin.rolesV2.scopeHint")}</span>
            </span>
            {section.scopeable ? (
              <ScopeSelect value={scope} disabled={locked} onChange={(v) => onScope(section.key, v)} />
            ) : (
              <span className="rb2-orgtag">
                <Icon name="globe" size={13} /> {t("admin.rolesV2.orgWide")}
              </span>
            )}
          </div>
        )}
        {conflict && (
          <div className="rb-locknote" role="alert">
            <Icon name="triangle-alert" size={16} />
            {t("admin.rolesV2.conflict")}
          </div>
        )}
        {lastEditor && section.key === "roles" && (
          <div className="rb-locknote">
            <Icon name="lock" size={16} />
            {t("admin.rolesV2.lockout")}
          </div>
        )}
        {section.groups.map((g) => (
          <PermissionGroupV2 key={g.id} section={section} group={g} role={role} locked={locked} guardedIds={guardedIds} onToggle={onToggle} onMaster={onMaster} />
        ))}
      </div>
    </div>
  );
}

const ROLE_ICONS: IconName[] = ["shield-check", "badge-check", "user", "users", "key", "star", "crown", "briefcase", "gauge", "settings"];
const DESC_MAX = 240;

function IconPicker({ role, onIcon }: { role: RoleStateV2; onIcon: (v: IconName) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  return (
    <div className="rb-iconpick">
      <button type="button" className="rb-iconpick__btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label={t("admin.roles.roleIcon")}>
        <span className={"rb-roleicon rb-roleicon--" + role.dot}>
          <Icon name={role.icon} size={18} />
        </span>
      </button>
      {open && (
        <>
          <button type="button" className="rb-iconpick__scrim" aria-label={t("admin.common.cancel")} onClick={() => setOpen(false)} />
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

/** Confirm hiding a whole section — revoking `view` clears everything in it. */
function HideSectionModal({ sectionLabel, onCancel, onConfirm }: { sectionLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div className="rb-confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="rb-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rb2-hide-ttl">
        <span className="rb-confirm__icon rb-confirm__icon--danger">
          <Icon name="eye-off" size={22} strokeWidth={1.9} />
        </span>
        <h3 id="rb2-hide-ttl" className="rb-confirm__title">
          {t("admin.rolesV2.hideTitle", { section: sectionLabel })}
        </h3>
        <p className="rb-confirm__msg">{t("admin.rolesV2.hideMsg", { section: sectionLabel })}</p>
        <div className="rb-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>
            {t("admin.common.cancel")}
          </Button>
          <Button hierarchy="destructive" size="md" type="button" iconLeading="eye-off" onClick={onConfirm}>
            {t("admin.rolesV2.hideConfirm")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Delete with a reassignment guard: assigned users must land on another role. */
function DeleteRoleModalV2({ role, targets, onCancel, onConfirm }: { role: RoleStateV2; targets: RoleStateV2[]; onCancel: () => void; onConfirm: (reassignId: string | null) => void }) {
  const { t, lang } = useLang();
  const needsReassign = role.users > 0 && targets.length > 0;
  const [reassignId, setReassignId] = useState("");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div className="rb-confirm-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="rb-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rb2-del-ttl">
        <span className="rb-confirm__icon rb-confirm__icon--danger">
          <Icon name="trash-2" size={22} strokeWidth={1.9} />
        </span>
        <h3 id="rb2-del-ttl" className="rb-confirm__title">
          {t("admin.rolesV2.delTitle")}
        </h3>
        <p className="rb-confirm__msg">{t("admin.rolesV2.delMsg", { name: role.name, count: fmtNum(lang, role.users) })}</p>
        {needsReassign && (
          <div className="rb2-reassign">
            <span className="rb2-reassign__label">{t("admin.rolesV2.reassignTo", { count: fmtNum(lang, role.users) })}</span>
            <span className="rb-scope rb2-reassign__select">
              <select value={reassignId} aria-label={t("admin.rolesV2.reassignTo", { count: fmtNum(lang, role.users) })} onChange={(e) => setReassignId(e.target.value)}>
                <option value="" disabled>
                  {t("admin.rolesV2.reassignPh")}
                </option>
                {targets.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <span className="rb-scope__chev">
                <Icon name="chevron-down" size={15} />
              </span>
            </span>
          </div>
        )}
        <div className="rb-confirm__actions">
          <Button hierarchy="secondary" size="md" type="button" onClick={onCancel}>
            {t("admin.common.cancel")}
          </Button>
          <Button hierarchy="destructive" size="md" type="button" iconLeading="trash-2" disabled={needsReassign && !reassignId} onClick={() => onConfirm(needsReassign ? reassignId : null)}>
            {t("admin.roles.deleteRole")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function RoleSettingsTabV2({ role, targets, onIcon, onDelete }: { role: RoleStateV2; targets: RoleStateV2[]; onIcon: (v: IconName) => void; onDelete: (reassignId: string | null) => void }) {
  const { t } = useLang();
  const canDelete = ADMIN.role === "Super Admin" && !role.system && !role.locked;
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
            <Input label={t("admin.roles.roleName")} defaultValue={role.name} disabled={role.system} />
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
        <DeleteRoleModalV2
          role={role}
          targets={targets}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={(reassignId) => {
            setConfirmOpen(false);
            onDelete(reassignId);
          }}
        />
      )}
    </div>
  );
}

function RoleDetailV2({
  role,
  roles,
  detailTab,
  onDetailTab,
  activeSection,
  onSection,
  onToggle,
  onMaster,
  onScope,
  onIcon,
  onDelete,
}: {
  role: RoleStateV2;
  roles: RoleStateV2[];
  detailTab: string;
  onDetailTab: (v: string) => void;
  activeSection: string;
  onSection: (k: string) => void;
  onToggle: (perm: FlatPermV2, v: boolean) => void;
  onMaster: (section: SectionV2, group: GroupV2, v: boolean) => void;
  onScope: (sectionKey: string, v: ScopeVal) => void;
  onIcon: (v: IconName) => void;
  onDelete: (reassignId: string | null) => void;
}) {
  const { t, lang } = useLang();
  const locked = !!role.locked;
  const enabled = countGrantV2(role.grant, role.surface);
  return (
    <section className="rb-detail" aria-label={t("admin.roles.detailsAria", { name: role.name })}>
      <header className="rb-detail__head">
        <h2 className="rb-detail__name">
          {t("admin.roles.rolePermissions", { name: role.name })}
          <span className="rb-grantbadge">
            <Icon name="shield-check" size={13} /> {t("admin.roles.granted", { on: fmtNum(lang, enabled), total: fmtNum(lang, totalFor(role.surface)) })}
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
          <PermissionsTabV2 role={role} roles={roles} locked={locked} activeSection={activeSection} onSection={onSection} onToggle={onToggle} onMaster={onMaster} onScope={onScope} />
        ) : (
          <RoleSettingsTabV2 role={role} targets={roles.filter((r) => r.id !== role.id && r.surface === role.surface && !r.locked)} onIcon={onIcon} onDelete={onDelete} />
        )}
      </div>
    </section>
  );
}

/* ---------------------------------- matrix --------------------------------- */

function MatrixCellV2({ role, perm }: { role: RoleStateV2; perm: FlatPermV2 }) {
  const { t } = useLang();
  const cell = cellOf(role, perm);
  if (cell === "none") {
    return (
      <span className="rb-cell rb-cell--none" title={t("admin.rolesV2.matrix.none")}>
        ✕
      </span>
    );
  }
  const scoped = cell !== "org";
  const scopeLabel = t(SCOPE_OPTS_V2.find((o) => o.value === cell)?.labelKey ?? "admin.rolesV2.scope.org");
  return (
    <span className={"rb-cell " + (scoped ? "rb-cell--scoped" : "rb-cell--full")} title={scoped ? scopeLabel : t("admin.rolesV2.matrix.full")}>
      ✓{scoped && <sup className="rb2-cellsup">{scopeLabel.charAt(0)}</sup>}
    </span>
  );
}

/** One surface's roles × its full catalogue — staff and member never mix. */
function MatrixCardV2({ surface, roles }: { surface: SurfaceV2; roles: RoleStateV2[] }) {
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  const cols = roles.filter((r) => r.surface === surface);
  const sections = sectionsFor(surface);
  const pSurface = permSurface(surface);
  if (!cols.length) return null;
  return (
    <section className="rb-matrixcard">
      <header className="rb-matrixcard__head">
        <div>
          <h2 className="rb-matrixcard__title">{t(surface === "member" ? "admin.rolesV2.matrix.member" : "admin.rolesV2.matrix.staff")}</h2>
          <p className="rb-matrixcard__desc">{t("admin.rolesV2.matrix.desc")}</p>
        </div>
        <div className="rb-legend">
          <span className="rb-legend__item">
            <span className="rb-cell rb-cell--full">✓</span> {t("admin.rolesV2.matrix.full")}
          </span>
          <span className="rb-legend__item">
            <span className="rb-cell rb-cell--scoped">✓</span> {t("admin.rolesV2.matrix.scoped")}
          </span>
          <span className="rb-legend__item">
            <span className="rb-cell rb-cell--none">✕</span> {t("admin.rolesV2.matrix.none")}
          </span>
        </div>
      </header>
      <div className="rb-matrix-wrap">
        <table className="rb-matrix">
          <thead>
            <tr>
              <th className="rb-matrix__th rb-matrix__th--perm">{t("admin.roles.matrixPermission")}</th>
              {cols.map((r) => (
                <th key={r.id} className="rb-matrix__th rb-matrix__th--role">
                  <span className={"rb-matrix__roledot rb-matrix__roledot--" + r.dot} />
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.key}>
                <tr className="rb-matrix__grouprow">
                  <td colSpan={cols.length + 1}>{tOr(section.labelKey, section.label)}</td>
                </tr>
                {sectionPerms(surface, section.key).map((perm) => (
                  <tr key={perm.id} className="rb-matrix__tr">
                    <td className="rb-matrix__td rb-matrix__td--perm">{tOr(permKey(pSurface, perm.label) + ".label", perm.label)}</td>
                    {cols.map((r) => (
                      <td key={r.id} className="rb-matrix__td rb-matrix__td--cell">
                        <MatrixCellV2 role={r} perm={perm} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* -------------------------------- create role ------------------------------ */

interface CreateRoleV2Input {
  name: string;
  desc: string;
  icon: IconName;
  surface: SurfaceV2;
  cloneId: string | null;
}

/** Gate on `open` so the form resets each time the modal is opened. */
function CreateRoleModalV2({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (v: CreateRoleV2Input) => void }) {
  if (!open) return null;
  return <CreateRoleFormV2 open={open} onClose={onClose} onCreate={onCreate} />;
}

function CreateRoleFormV2({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (v: CreateRoleV2Input) => void }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<IconName>("shield-check");
  const [desc, setDesc] = useState("");
  const canSubmit = name.trim().length > 0;
  // New roles are created as blank admin roles; permissions are set after creating.
  const surface: SurfaceV2 = "admin";
  const cloneId: string | null = null;

  const footer = (
    <>
      <Button hierarchy="secondary" size="lg" onClick={onClose}>
        {t("admin.common.cancel")}
      </Button>
      <Button hierarchy="primary" size="lg" iconLeading="plus" disabled={!canSubmit} onClick={() => onCreate({ name, desc, icon, surface, cloneId })}>
        {t("admin.roles.createNew")}
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} size="lg" icon="shield-check" title={t("admin.roles.createNew")} subtitle={t("admin.roles.createSub")} footer={footer} className="rb-createmodal">
      <div className="rb-create">
        <Input label={t("admin.roles.roleName")} value={name} autoFocus iconLeading="shield" placeholder={t("admin.roles.roleNamePh")} onChange={(e) => setName(e.target.value)} />

        <div className="rb-create__field">
          <span className="rb-create__label">{t("admin.roles.icon")}</span>
          <div className="rb-create__icons" role="radiogroup" aria-label={t("admin.roles.roleIcon")}>
            {ROLE_ICONS.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={n === icon} className={"rb-iconpick__opt" + (n === icon ? " is-active" : "")} onClick={() => setIcon(n)} aria-label={n}>
                <Icon name={n} size={18} />
              </button>
            ))}
          </div>
        </div>

        <Textarea label={t("admin.roles.roleDesc")} rows={3} value={desc} maxLength={DESC_MAX} placeholder={t("admin.roles.roleDescPh")} onChange={(e) => setDesc(e.target.value)} />
      </div>
    </Modal>
  );
}

/* ----------------------------------- app ----------------------------------- */

export function RolesApp() {
  const { t } = useLang();
  const [roles, setRoles] = useState<RoleStateV2[]>(() => ROLES_SEED_V2.map((r) => ({ ...r, ...buildRoleV2(r.spec, r.surface) })));
  const [view, setView] = useState("detail");
  const [selectedId, setSelectedId] = useState("super-admin");
  const [detailTab, setDetailTab] = useState("permissions");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [createOpen, setCreateOpen] = useState(false);
  /** Section pending the "hide this whole page?" cascade confirm. */
  const [hideAsk, setHideAsk] = useState<SectionV2 | null>(null);

  const selected = roles.find((r) => r.id === selectedId) || roles[0];
  const tOr = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };

  const selectRole = (id: string) => {
    const role = roles.find((r) => r.id === id);
    setSelectedId(id);
    setDetailTab("permissions");
    setActiveSection(sectionsFor(role?.surface ?? "admin")[0].key);
  };

  const mutateSelected = (fn: (r: RoleStateV2) => RoleStateV2) => setRoles((rs) => rs.map((r) => (r.id === selectedId ? fn(r) : r)));

  const setGrants = (ids: string[], val: boolean) =>
    mutateSelected((r) => ({ ...r, grant: { ...r.grant, ...Object.fromEntries(ids.map((id) => [id, val])) } }));

  const auditToggle = (granted: boolean, metaKey: string) =>
    logAudit({
      category: "role",
      actionKey: granted ? "audit.action.grantedPermission" : "audit.action.revokedPermission",
      target: selected.name,
      targetId: selected.id,
      metaKey,
    });

  const toggle = (perm: FlatPermV2, val: boolean) => {
    const surface = permSurface(selected.surface);
    const viewId = viewIdOf(perm.sectionKey);
    if (val) {
      // Dependency cascade: any grant implies the section's view root.
      setGrants(perm.id === viewId ? [perm.id] : [perm.id, viewId], true);
      auditToggle(true, permKey(surface, perm.label) + ".label");
      return;
    }
    if (perm.id === viewId) {
      const section = sectionsFor(selected.surface).find((s) => s.key === perm.sectionKey);
      const others = sectionPerms(selected.surface, perm.sectionKey).some((p2) => p2.id !== perm.id && selected.grant[p2.id]);
      if (section && others) {
        setHideAsk(section); // revoking view hides the page — confirm before clearing
        return;
      }
    }
    setGrants([perm.id], false);
    auditToggle(false, permKey(surface, perm.label) + ".label");
  };

  const master = (section: SectionV2, group: GroupV2, val: boolean) => {
    const groupPerms = sectionPerms(selected.surface, section.key).filter((p2) => p2.groupId === group.id);
    const viewId = viewIdOf(section.key);
    if (val) {
      setGrants([...groupPerms.map((p2) => p2.id), viewId], true);
      auditToggle(true, "perm.group." + group.id);
      return;
    }
    if (groupPerms.some((p2) => p2.id === viewId)) {
      setHideAsk(section); // the group holds the view root — same cascade as above
      return;
    }
    setGrants(groupPerms.map((p2) => p2.id), false);
    auditToggle(false, "perm.group." + group.id);
  };

  const confirmHide = () => {
    if (!hideAsk) return;
    setGrants(sectionPerms(selected.surface, hideAsk.key).map((p2) => p2.id), false);
    auditToggle(false, hideAsk.labelKey);
    setHideAsk(null);
  };

  const setScope = (sectionKey: string, val: ScopeVal) => {
    mutateSelected((r) => ({ ...r, scope: { ...r.scope, [sectionKey]: val } }));
    const section = sectionsFor(selected.surface).find((s) => s.key === sectionKey);
    logAudit({
      category: "role",
      actionKey: "audit.action.updatedRoleScope",
      actionParams: { scope: "@" + (SCOPE_OPTS_V2.find((o) => o.value === val)?.labelKey ?? "admin.rolesV2.scope.org") },
      target: selected.name,
      targetId: selected.id,
      metaKey: section?.labelKey,
    });
  };

  const setIcon = (icon: IconName) => mutateSelected((r) => ({ ...r, icon }));

  const deleteRole = (reassignId: string | null) => {
    const removed = roles.find((r) => r.id === selectedId);
    const next = roles.find((r) => r.id !== selectedId);
    logAudit({ category: "role", actionKey: "audit.action.deletedRole", target: removed?.name ?? selectedId, targetId: selectedId });
    setRoles((rs) =>
      rs
        .filter((r) => r.id !== selectedId)
        .map((r) => (reassignId && r.id === reassignId && removed ? { ...r, users: r.users + removed.users } : r)),
    );
    if (next) selectRole(next.id);
  };

  const createRole = (v: CreateRoleV2Input) => {
    const id = "role-" + Date.now().toString(36);
    const base = v.cloneId ? roles.find((r) => r.id === v.cloneId) : null;
    const built = base ? { grant: { ...base.grant }, scope: { ...base.scope } } : buildRoleV2({}, v.surface);
    const newRole: RoleStateV2 = {
      id,
      name: v.name.trim(),
      dot: v.surface === "member" ? "info" : "brand",
      icon: v.icon,
      system: false,
      surface: v.surface,
      users: 0,
      desc: v.desc.trim(),
      spec: {},
      ...built,
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
    setActiveSection(sectionsFor(v.surface)[0].key);
  };

  return (
    <>
      <RolesV2Header view={view} onView={setView} />
      {view === "detail" ? (
        <div className="rb-split">
          <RoleList roles={roles} selectedId={selectedId} onSelect={selectRole} onCreate={() => setCreateOpen(true)} />
          <RoleDetailV2
            role={selected}
            roles={roles}
            detailTab={detailTab}
            onDetailTab={setDetailTab}
            activeSection={activeSection}
            onSection={setActiveSection}
            onToggle={toggle}
            onMaster={master}
            onScope={setScope}
            onIcon={setIcon}
            onDelete={deleteRole}
          />
        </div>
      ) : (
        <div className="rb2-matrixstack">
          <MatrixCardV2 surface="admin" roles={roles} />
          <MatrixCardV2 surface="member" roles={roles} />
        </div>
      )}
      {hideAsk && <HideSectionModal sectionLabel={tOr(hideAsk.labelKey, hideAsk.label)} onCancel={() => setHideAsk(null)} onConfirm={confirmHide} />}
      <CreateRoleModalV2 open={createOpen} onClose={() => setCreateOpen(false)} onCreate={createRole} />
    </>
  );
}
