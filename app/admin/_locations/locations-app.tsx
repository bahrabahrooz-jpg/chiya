"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum } from "@/lib/fmt";
import {
  KPI_META,
  TYPE_CONFIG,
  TYPE_OPTIONS,
  countNodes,
  getParentOptions,
  nodeMatchesSearch,
  type LocationNode,
} from "./data";
import { useProperties } from "../_shared/properties-store";

interface DDOption {
  value: string;
  label: string;
  icon?: IconName;
  sub?: string;
}

function Dropdown({
  id,
  options,
  value,
  onChange,
  disabled,
  error,
  placeholder,
}: {
  id?: string;
  options: DDOption[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (disabled || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 8, left: r.left, width: r.width });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={["lc-dd__trigger", open && "is-open", error && "is-error", disabled && "is-disabled"].filter(Boolean).join(" ")}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openDropdown())}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="lc-dd__val">
            <span className="lc-dd__val-ic">{selected.icon && <Icon name={selected.icon} size={14} />}</span>
            <span className="lc-dd__val-txt">{selected.label}</span>
          </span>
        ) : (
          <span className="lc-dd__placeholder">{placeholder || "Select…"}</span>
        )}
        <Icon name="chevron-down" size={16} style={{ color: "var(--text-tertiary)", flexShrink: 0, transition: "transform .16s ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open &&
        coords &&
        createPortal(
          <div ref={panelRef} className="lc-dd__panel" style={{ top: coords.top, left: coords.left, width: coords.width }} role="listbox">
            <div className="lc-dd__scroll">
              {options.map((o) => (
                <button
                  key={o.value || "__empty"}
                  type="button"
                  className={"lc-dd__row" + (value === o.value ? " is-selected" : "")}
                  role="option"
                  aria-selected={value === o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
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
                  {value === o.value && <Icon name="check" size={15} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

interface ToastAction {
  label: string;
  icon: IconName;
  onClick: () => void;
}
function LocationToast({ title, msg, tone, action, isOut, onDismiss }: { title: string; msg: string; tone: "success" | "danger"; action?: ToastAction; isOut: boolean; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className={`lc-toast${tone === "danger" ? " lc-toast--danger" : ""}${visible && !isOut ? " is-in" : ""}${isOut ? " is-out" : ""}`}>
      <span className="lc-toast__icon">
        <Icon name={tone === "danger" ? "trash-2" : "check"} size={20} strokeWidth={2.25} />
      </span>
      <div className="lc-toast__body">
        <p className="lc-toast__title">{title}</p>
        <p className="lc-toast__msg">{msg}</p>
        <div className="lc-toast__actions">
          <button type="button" className="lc-toast__btn lc-toast__btn--dismiss" onClick={onDismiss}>
            Dismiss
          </button>
          {action && (
            <button
              type="button"
              className="lc-toast__btn lc-toast__btn--view"
              onClick={() => {
                action.onClick();
                onDismiss();
              }}
            >
              <Icon name={action.icon} size={15} />
              {action.label}
            </button>
          )}
        </div>
      </div>
      <button type="button" className="lc-toast__close" aria-label="Close" onClick={onDismiss}>
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
      <div className="lc-toast__progress" />
    </div>
  );
}

/** Locate a node and its ancestor ids in the tree (for "View details"). */
function findNodePath(nodes: LocationNode[], id: string, trail: string[] = []): { node: LocationNode; ancestors: string[] } | null {
  for (const n of nodes) {
    if (n.id === id) return { node: n, ancestors: trail };
    if (n.children?.length) {
      const r = findNodePath(n.children, id, [...trail, n.id]);
      if (r) return r;
    }
  }
  return null;
}

function DeleteLocationModal({ node, onCancel, onConfirm }: { node: LocationNode; onCancel: () => void; onConfirm: () => void }) {
  const { t, lang } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const childCount = node.children?.length || 0;
  const typeLabel = t(`admin.locations.type.${node.type}`).toLowerCase();
  // Built from parts so each clause (sub-locations / mapped properties) can be
  // pluralized and ordered naturally per language.
  const body = [
    t("admin.locations.del.base", { type: typeLabel, name: node.name }),
    childCount > 0 ? t(childCount === 1 ? "admin.locations.del.subOne" : "admin.locations.del.subMany", { count: fmtNum(lang, childCount) }) : "",
    node.properties > 0 ? t(node.properties === 1 ? "admin.locations.del.propOne" : "admin.locations.del.propMany", { count: fmtNum(lang, node.properties) }) : "",
    t("admin.locations.del.undone"),
  ]
    .filter(Boolean)
    .join(" ");
  return createPortal(
    <div className="lc-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="lc-confirm" role="alertdialog" aria-modal="true" aria-labelledby="lc-del-title">
        <span className="lc-confirm__icon">
          <Icon name="trash-2" size={22} strokeWidth={1.9} />
        </span>
        <h2 className="lc-confirm__title" id="lc-del-title">
          {t("admin.locations.deleteTitle")}
        </h2>
        <p className="lc-confirm__msg">{body}</p>
        <div className="lc-confirm__actions">
          <Button hierarchy="secondary" size="md" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </Button>
          <Button hierarchy="destructive" size="md" iconLeading="trash-2" onClick={onConfirm}>
            {t("admin.locations.deleteLocation")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface FormErrors {
  name?: boolean;
  type?: boolean;
  parentId?: boolean;
}

function LocationModal({ onClose, onCreate, initialData, tree }: { onClose: () => void; onCreate: (data: { name: string; type: string; parentId: string }) => void; initialData: LocationNode | null; tree: LocationNode[] }) {
  const { t } = useLang();
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData ? { name: initialData.name, type: initialData.type as string, parentId: "", description: initialData.description || "" } : { name: "", type: "", parentId: "", description: "" },
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const parentOptions = getParentOptions(tree, form.type);
  const parentDisabled = !form.type || form.type === "city";

  // mandatory: name + type, and a parent unless the type is a city (description is optional)
  const isValid = !!form.name.trim() && !!form.type && (form.type === "city" || !!form.parentId);

  const validate = (): FormErrors => {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = true;
    if (!form.type) e.type = true;
    if (form.type && form.type !== "city" && !form.parentId) e.parentId = true;
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onCreate({ name: form.name.trim(), type: form.type, parentId: form.parentId });
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return createPortal(
    <div className="lc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lc-modal" role="dialog" aria-modal="true" aria-labelledby="lc-modal-title">
        <div className="lc-modal__head">
          <div className="lc-modal__headleft">
            <span className="lc-modal__headicon">
              <Icon name={isEdit ? "pencil" : "map-pin"} size={20} strokeWidth={1.75} />
            </span>
            <div className="lc-modal__heading">
              <h2 className="lc-modal__title" id="lc-modal-title">
                {isEdit ? t("admin.locations.edit") : t("admin.locations.add")}
              </h2>
              <p className="lc-modal__desc">{isEdit ? t("admin.locations.editDesc") : t("admin.locations.addDesc")}</p>
            </div>
          </div>
          <button type="button" className="lc-modal__close" aria-label={t("admin.props.close")} onClick={onClose}>
            <Icon name="x" size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="lc-modal__body">
          <div className="lc-fields">
            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-name">
                {t("admin.locations.field.name")}
              </label>
              <input
                id="lc-f-name"
                type="text"
                className={"lc-input" + (errors.name ? " is-error" : "")}
                placeholder={t("admin.locations.namePh")}
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  setErrors((er) => ({ ...er, name: false }));
                }}
              />
              {errors.name && (
                <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>
                  {t("admin.locations.err.name")}
                </span>
              )}
            </div>

            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-type">
                {t("admin.locations.field.type")}
              </label>
              <Dropdown
                id="lc-f-type"
                options={TYPE_OPTIONS.map((o) => ({ ...o, label: t(`admin.locations.type.${o.value}`), sub: t(`admin.locations.typeSub.${o.value}`) }))}
                value={form.type}
                onChange={(v) => {
                  set("type", v);
                  set("parentId", "");
                  setErrors((er) => ({ ...er, type: false, parentId: false }));
                }}
                error={errors.type}
                placeholder={t("admin.locations.selectType")}
              />
              {errors.type && (
                <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>
                  {t("admin.locations.err.type")}
                </span>
              )}
            </div>

            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-parent">
                {t("admin.locations.field.parent")}
                {form.type === "city" && <span className="lc-optional">{t("admin.locations.notApplicableCities")}</span>}
              </label>
              <Dropdown
                id="lc-f-parent"
                options={parentOptions.map((n) => ({ value: n.id, label: n.name, icon: TYPE_CONFIG[n.type]?.icon, sub: t(`admin.locations.type.${n.type}`) }))}
                value={form.parentId}
                onChange={(v) => {
                  set("parentId", v);
                  setErrors((er) => ({ ...er, parentId: false }));
                }}
                disabled={parentDisabled}
                error={errors.parentId}
                placeholder={parentDisabled ? (form.type === "city" ? t("admin.locations.notApplicable") : t("admin.locations.selectTypeFirst")) : t("admin.locations.selectParent")}
              />
              {errors.parentId && (
                <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>
                  {t("admin.locations.err.parent")}
                </span>
              )}
            </div>

            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-desc">
                {t("admin.locations.field.description")} <span className="lc-optional">{t("admin.members.optional")}</span>
              </label>
              <textarea id="lc-f-desc" className="lc-textarea" placeholder={t("admin.locations.descPh")} value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="lc-modal__foot">
          <Button hierarchy="secondary" size="md" onClick={onClose}>
            {t("admin.topbar.cancel")}
          </Button>
          <Button hierarchy="primary" size="md" onClick={handleSubmit} disabled={!isValid}>
            {isEdit ? t("admin.profile.save") : t("admin.locations.create")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TreeNode({
  node,
  depth,
  expandedIds,
  selectedId,
  onToggle,
  onSelect,
  searchQuery,
}: {
  node: LocationNode;
  depth: number;
  expandedIds: Set<string>;
  selectedId: string | undefined;
  onToggle: (id: string) => void;
  onSelect: (n: LocationNode) => void;
  searchQuery: string;
}) {
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const hasChildren = node.children?.length > 0;
  if (searchQuery && !nodeMatchesSearch(node, searchQuery)) return null;

  const q = searchQuery ? searchQuery.toLowerCase() : "";
  const childHasMatch = hasChildren && !!q && node.children.some((c) => nodeMatchesSearch(c, q));
  const isExpanded = searchQuery ? childHasMatch : expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const typeConf = TYPE_CONFIG[node.type];

  return (
    <div>
      <div
        className={`lc-node${isSelected ? " is-selected" : ""}`}
        // Logical padding: the depth indent has to follow the reading direction.
        style={{ paddingTop: 9, paddingBottom: 9, paddingInlineEnd: 14, paddingInlineStart: 14 + depth * 20 }}
        onClick={() => onSelect(node)}
        role="treeitem"
        aria-selected={isSelected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(node);
          }
        }}
      >
        <span
          className="lc-node__toggle"
          style={{ visibility: hasChildren ? "visible" : "hidden" }}
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              onToggle(node.id);
            }
          }}
        >
          <Icon name={isExpanded ? "chevron-down" : "chevron-right"} size={14} strokeWidth={2.5} />
        </span>
        <span className={`lc-node__typeicon lc-node__typeicon--${node.type}`}>
          <Icon name={typeConf.icon} size={15} strokeWidth={1.75} />
        </span>
        <span className="lc-node__name">{tOr(`city.${node.name}`, tOr(`loc.${node.name}`, node.name))}</span>
        <span className="lc-node__props">{fmtNum(lang, node.properties)}</span>
      </div>
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} searchQuery={searchQuery} />
        ))}
    </div>
  );
}

function TreePanel({ tree, expandedIds, selectedId, onToggle, onSelect, searchQuery }: { tree: LocationNode[]; expandedIds: Set<string>; selectedId: string | undefined; onToggle: (id: string) => void; onSelect: (n: LocationNode) => void; searchQuery: string }) {
  const hasAnyMatch = tree.some((n) => nodeMatchesSearch(n, searchQuery));
  return (
    <div className="lc-treepanel" role="tree" aria-label="Location hierarchy">
      <div className="lc-treepanel__head">
        <h2 className="lc-treepanel__title">Location hierarchy</h2>
        <span className="lc-treepanel__badge">{countNodes(tree)}</span>
      </div>
      <div className="lc-tree">
        {tree.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} searchQuery={searchQuery} />
        ))}
        {searchQuery && !hasAnyMatch && <div className="lc-tree-empty">No locations match your search.</div>}
      </div>
    </div>
  );
}

function DetailPanel({ location, onEdit, onDelete }: { location: LocationNode | null; onEdit: () => void; onDelete: () => void }) {
  const { t, lang } = useLang();
  if (!location) {
    return (
      <div className="lc-detailpanel">
        <div className="lc-detail-empty">
          <div className="lc-detail-empty__art">
            <Icon name="map-pin" size={28} strokeWidth={1.5} />
          </div>
          <h3>{t("admin.locations.selectPrompt.title")}</h3>
          <p>{t("admin.locations.selectPrompt.sub")}</p>
        </div>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[location.type];
  const childCount = location.children?.length || 0;
  const childLabel =
    location.type === "city" ? t("admin.locations.children.city") : location.type === "district" ? t("admin.locations.children.district") : t("admin.locations.children.other");

  const fields: { label: string; value: React.ReactNode; num?: boolean; muted?: boolean }[] = [
    { label: t("admin.locations.field.type"), value: <Badge variant={typeConf.variant} icon={typeConf.icon} size="sm">{t(`admin.locations.type.${location.type}`)}</Badge> },
    { label: t("admin.locations.field.parent"), value: location.parent || "—", muted: !location.parent },
    { label: t("admin.locations.field.properties"), value: fmtNum(lang, location.properties), num: true },
    { label: childLabel, value: fmtNum(lang, childCount), num: true },
    { label: t("admin.locations.field.created"), value: fmtDate(lang, new Date(location.created)) },
    { label: t("admin.locations.field.updated"), value: fmtDate(lang, new Date(location.updated)) },
  ];

  return (
    <div className="lc-detailpanel">
      <div className="lc-detail__head">
        <div className="lc-detail__headleft">
          <span className={`lc-detail__icon lc-detail__icon--${location.type}`}>
            <Icon name={typeConf.icon} size={24} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="lc-detail__name">{location.name}</h2>
            <div className="lc-detail__meta">
              <Badge variant={typeConf.variant} size="sm">
                {typeConf.label}
              </Badge>
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
          <Button hierarchy="secondary" size="sm" iconLeading="pencil" onClick={onEdit}>
            Edit
          </Button>
          <Button hierarchy="secondary-destructive" size="sm" iconLeading="trash-2" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>

      <div className="lc-detail__body">
        <div className="lc-detail__grid">
          {fields.map(({ label, value, num, muted }) => (
            <div key={label} className="lc-detail__field">
              <span className="lc-detail__fieldlabel">{label}</span>
              <span className={`lc-detail__fieldval${num ? " lc-detail__fieldval--num" : ""}${muted ? " lc-detail__fieldval--muted" : ""}`}>{value}</span>
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

    </div>
  );
}

interface ToastItem {
  id: number;
  title: string;
  msg: string;
  tone: "success" | "danger";
  action?: ToastAction;
  out?: boolean;
}

export function LocationsApp() {
  const { t, lang } = useLang();
  const { locationTree, locationCounts, locationDefs, addLocation, removeLocation, restoreLocations } = useProperties();
  const treeRef = useRef(locationTree);
  useEffect(() => {
    treeRef.current = locationTree;
  }, [locationTree]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["erbil", "100-meter", "duhok", "sulaymaniyah"]));
  const [selectedNode, setSelectedNode] = useState<LocationNode | null>(null);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [deleteTarget, setDeleteTarget] = useState<LocationNode | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pushToast = useCallback((title: string, msg: string, tone: "success" | "danger" = "success", action?: ToastAction) => {
    const id = Date.now();
    setToasts((ts) => [...ts, { id, title, msg, tone, action }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t))), 6000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 6380);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  }, []);

  const handleCreate = useCallback(
    (data: { name: string; type: string; parentId: string }) => {
      addLocation(data.name, data.type as "city" | "district" | "project", data.parentId);
      setModal(null);
      const id = data.name.toLowerCase().replace(/\s+/g, "-");
      pushToast(t("admin.locations.toast.createdTitle"), t("admin.locations.toast.createdMsg", { name: data.name }), "success", {
        label: t("admin.props.viewDetails"),
        icon: "arrow-up-right",
        onClick: () => {
          const path = findNodePath(treeRef.current, id);
          if (!path) return;
          setSelectedNode(path.node);
          setExpandedIds((prev) => new Set([...prev, ...path.ancestors, id]));
        },
      });
    },
    [addLocation, pushToast, t],
  );

  const handleDeleteConfirm = useCallback(() => {
    const node = deleteTarget!;
    const snapshot = locationDefs; // structure before removal, for undo
    removeLocation(node.type, node.id);
    setDeleteTarget(null);
    setSelectedNode(null);
    pushToast(t("admin.locations.toast.deletedTitle"), t("admin.locations.toast.deletedMsg", { name: node.name }), "danger", {
      label: t("admin.props.undo"),
      icon: "undo-2",
      onClick: () => {
        restoreLocations(snapshot);
        pushToast(t("admin.locations.toast.restoredTitle"), t("admin.locations.toast.restoredMsg", { name: node.name }), "success");
      },
    });
  }, [deleteTarget, locationDefs, removeLocation, restoreLocations, pushToast, t]);

  return (
    <>
      <header className="lc-head">
        <div>
          <h1 className="lc-head__title">{t("admin.locations.title")}</h1>
          <p className="lc-head__sub">{t("admin.locations.sub")}</p>
        </div>
        <div className="lc-head__action">
          <Button hierarchy="primary" size="lg" iconLeading="plus" onClick={() => setModal("add")}>
            {t("admin.locations.add")}
          </Button>
        </div>
      </header>

      <div className="lc-kpis">
        {KPI_META.map((k) => (
          <StatCard
            key={k.key}
            label={t(`admin.locations.kpi.${k.key}`)}
            value={fmtNum(lang, locationCounts[k.field])}
            icon={k.icon}
            tone={k.tone}
            sub={t(`admin.locations.kpiSub.${k.key}`)}
          />
        ))}
      </div>

      <div className="lc-split">
        <TreePanel tree={locationTree} expandedIds={expandedIds} selectedId={selectedNode?.id} onToggle={toggleExpanded} onSelect={setSelectedNode} searchQuery="" />
        <DetailPanel location={selectedNode} onEdit={() => setModal("edit")} onDelete={() => selectedNode && setDeleteTarget(selectedNode)} />
      </div>

      {modal && <LocationModal tree={locationTree} onClose={() => setModal(null)} onCreate={handleCreate} initialData={modal === "edit" ? selectedNode : null} />}
      {deleteTarget && <DeleteLocationModal node={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}

      <div className="lc-toaster" aria-live="polite">
        {toasts.map((t) => (
          <LocationToast key={t.id} title={t.title} msg={t.msg} tone={t.tone} action={t.action} isOut={!!t.out} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
