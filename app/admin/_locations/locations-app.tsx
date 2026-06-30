"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/data/stat-card";
import {
  KPI_DATA,
  LOCATION_TREE,
  TOTAL_NODES,
  TYPE_CONFIG,
  TYPE_OPTIONS,
  getParentOptions,
  nodeMatchesSearch,
  type LocationNode,
} from "./data";

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

function LocationToast({ isOut, onDismiss }: { isOut: boolean; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className={`lc-toast${visible && !isOut ? " is-in" : ""}${isOut ? " is-out" : ""}`}>
      <span className="lc-toast__icon">
        <Icon name="check" size={20} strokeWidth={2.25} />
      </span>
      <div className="lc-toast__body">
        <p className="lc-toast__title">Location created successfully</p>
        <p className="lc-toast__msg">The location has been added and is now available throughout the platform.</p>
        <div className="lc-toast__actions">
          <button type="button" className="lc-toast__btn lc-toast__btn--dismiss" onClick={onDismiss}>
            Dismiss
          </button>
          <button type="button" className="lc-toast__btn lc-toast__btn--view">
            View details
          </button>
        </div>
      </div>
      <button type="button" className="lc-toast__close" aria-label="Close" onClick={onDismiss}>
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
      <div className="lc-toast__progress" />
    </div>
  );
}

interface FormErrors {
  name?: boolean;
  type?: boolean;
  parentId?: boolean;
}

function LocationModal({ onClose, onCreate, initialData }: { onClose: () => void; onCreate: (name: string) => void; initialData: LocationNode | null }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData ? { name: initialData.name, type: initialData.type as string, parentId: "", description: initialData.description || "" } : { name: "", type: "", parentId: "", description: "" },
  );
  const [errors, setErrors] = useState<FormErrors>({});

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const parentOptions = getParentOptions(form.type);
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
    onCreate(form.name.trim());
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
            <h2 className="lc-modal__title" id="lc-modal-title">
              {isEdit ? "Edit location" : "Add location"}
            </h2>
          </div>
          <button type="button" className="lc-modal__close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="lc-modal__body">
          <div className="lc-fields">
            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-name">
                Location name
              </label>
              <input
                id="lc-f-name"
                type="text"
                className={"lc-input" + (errors.name ? " is-error" : "")}
                placeholder="e.g. Italian Village, Barzan Heights…"
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  setErrors((er) => ({ ...er, name: false }));
                }}
              />
              {errors.name && (
                <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>
                  Location name is required.
                </span>
              )}
            </div>

            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-type">
                Location type
              </label>
              <Dropdown
                id="lc-f-type"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={(v) => {
                  set("type", v);
                  set("parentId", "");
                  setErrors((er) => ({ ...er, type: false, parentId: false }));
                }}
                error={errors.type}
                placeholder="Select type…"
              />
              {errors.type && (
                <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>
                  Please select a location type.
                </span>
              )}
            </div>

            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-parent">
                Parent location
                {form.type === "city" && <span className="lc-optional">Not applicable for cities</span>}
              </label>
              <Dropdown
                id="lc-f-parent"
                options={parentOptions.map((n) => ({ value: n.id, label: n.name, icon: TYPE_CONFIG[n.type]?.icon, sub: TYPE_CONFIG[n.type]?.label }))}
                value={form.parentId}
                onChange={(v) => {
                  set("parentId", v);
                  setErrors((er) => ({ ...er, parentId: false }));
                }}
                disabled={parentDisabled}
                error={errors.parentId}
                placeholder={parentDisabled ? (form.type === "city" ? "— Not applicable —" : "Select a type first…") : "Select parent location…"}
              />
              {errors.parentId && (
                <span className="lc-field__hint" style={{ color: "var(--error-600)" }}>
                  Please select a parent location.
                </span>
              )}
            </div>

            <div className="lc-field">
              <label className="lc-field__label" htmlFor="lc-f-desc">
                Description <span className="lc-optional">(Optional)</span>
              </label>
              <textarea id="lc-f-desc" className="lc-textarea" placeholder="Brief description of this location, its character, or notable features…" value={form.description} onChange={(e) => set("description", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="lc-modal__foot">
          <Button hierarchy="secondary" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button hierarchy="primary" size="md" onClick={handleSubmit} disabled={!isValid}>
            {isEdit ? "Save changes" : "Create location"}
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
        style={{ paddingTop: 9, paddingBottom: 9, paddingRight: 14, paddingLeft: 14 + depth * 20 }}
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
        <span className="lc-node__name">{node.name}</span>
        <span className="lc-node__props">{node.properties.toLocaleString()}</span>
      </div>
      {isExpanded &&
        hasChildren &&
        node.children.map((child) => (
          <TreeNode key={child.id} node={child} depth={depth + 1} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} searchQuery={searchQuery} />
        ))}
    </div>
  );
}

function TreePanel({ expandedIds, selectedId, onToggle, onSelect, searchQuery }: { expandedIds: Set<string>; selectedId: string | undefined; onToggle: (id: string) => void; onSelect: (n: LocationNode) => void; searchQuery: string }) {
  const hasAnyMatch = LOCATION_TREE.some((n) => nodeMatchesSearch(n, searchQuery));
  return (
    <div className="lc-treepanel" role="tree" aria-label="Location hierarchy">
      <div className="lc-treepanel__head">
        <h2 className="lc-treepanel__title">Location hierarchy</h2>
        <span className="lc-treepanel__badge">{TOTAL_NODES}</span>
      </div>
      <div className="lc-tree">
        {LOCATION_TREE.map((node) => (
          <TreeNode key={node.id} node={node} depth={0} expandedIds={expandedIds} selectedId={selectedId} onToggle={onToggle} onSelect={onSelect} searchQuery={searchQuery} />
        ))}
        {searchQuery && !hasAnyMatch && <div className="lc-tree-empty">No locations match your search.</div>}
      </div>
    </div>
  );
}

function DetailPanel({ location, onEdit, onDelete }: { location: LocationNode | null; onEdit: () => void; onDelete: () => void }) {
  if (!location) {
    return (
      <div className="lc-detailpanel">
        <div className="lc-detail-empty">
          <div className="lc-detail-empty__art">
            <Icon name="map-pin" size={28} strokeWidth={1.5} />
          </div>
          <h3>Select a location</h3>
          <p>Choose a city, district, or project from the hierarchy to view its details.</p>
        </div>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[location.type];
  const childCount = location.children?.length || 0;
  const childLabel = location.type === "city" ? "Districts / Areas" : location.type === "district" ? "Projects" : "Sub-locations";

  const fields: { label: string; value: React.ReactNode; num?: boolean; muted?: boolean }[] = [
    { label: "Location type", value: <Badge variant={typeConf.variant} icon={typeConf.icon} size="sm">{typeConf.label}</Badge> },
    { label: "Parent location", value: location.parent || "—", muted: !location.parent },
    { label: "Properties assigned", value: location.properties.toLocaleString(), num: true },
    { label: childLabel, value: childCount, num: true },
    { label: "Created", value: location.created },
    { label: "Last updated", value: location.updated },
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
  name: string;
  out?: boolean;
}

export function LocationsApp() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["erbil", "100-meter", "duhok", "sulaymaniyah"]));
  const [selectedNode, setSelectedNode] = useState<LocationNode | null>(null);
  const [modal, setModal] = useState<null | "add" | "edit">(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const pushToast = useCallback((name: string) => {
    const id = Date.now();
    setToasts((ts) => [...ts, { id, name }]);
    setTimeout(() => setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t))), 6000);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 6380);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, out: true } : t)));
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 380);
  }, []);

  const handleCreate = useCallback(
    (name: string) => {
      setModal(null);
      pushToast(name);
    },
    [pushToast],
  );

  const handleDelete = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <>
      <header className="lc-head">
        <div>
          <h1 className="lc-head__title">Locations</h1>
          <p className="lc-head__sub">Manage cities, districts, and residential projects used throughout the platform.</p>
        </div>
        <div className="lc-head__action">
          <Button hierarchy="primary" iconLeading="plus" onClick={() => setModal("add")}>
            Add location
          </Button>
        </div>
      </header>

      <div className="lc-kpis">
        {KPI_DATA.map((k) => (
          <StatCard key={k.key} label={k.label} value={k.value} icon={k.icon} tone={k.tone} sub={k.sub} />
        ))}
      </div>

      <div className="lc-split">
        <TreePanel expandedIds={expandedIds} selectedId={selectedNode?.id} onToggle={toggleExpanded} onSelect={setSelectedNode} searchQuery="" />
        <DetailPanel location={selectedNode} onEdit={() => setModal("edit")} onDelete={handleDelete} />
      </div>

      {modal && <LocationModal onClose={() => setModal(null)} onCreate={handleCreate} initialData={modal === "edit" ? selectedNode : null} />}

      <div className="lc-toaster" aria-live="polite">
        {toasts.map((t) => (
          <LocationToast key={t.id} isOut={!!t.out} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </>
  );
}
