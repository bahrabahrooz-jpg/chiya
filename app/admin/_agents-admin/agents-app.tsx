"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/choice";
import { StatCard } from "@/components/data/stat-card";
import {
  AGENTS_PER_PAGE,
  AGENT_STATUS,
  EMPTY_FILTERS,
  EXPERIENCE_OPTIONS,
  KPI_CARDS,
  LANGUAGE_OPTIONS,
  SERVICE_AREA_OPTIONS,
  VERIFICATION,
  VERIFICATION_TABS,
  deriveAreas,
  type AgentFilters,
  type AgentRecord,
} from "./data";
import { useProperties } from "../_shared/properties-store";
import { AvatarUpload, CustomSelect, EditAgentModal, Field, MultiSelect, type AgentEditSeed, type SelectOption } from "../_shared/agent-edit-modal";

function ActionMenu({
  open,
  onToggle,
  onClose,
  btnClass,
  ariaLabel,
  status,
  verification,
  onStatus,
  onVerify,
  onDelete,
  onEdit,
  onView,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  btnClass?: string;
  ariaLabel?: string;
  status: string;
  verification: string;
  onStatus: () => void;
  onVerify: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  onView?: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const suspended = status === "Suspended";
  const verified = verification === "Verified";
  useEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null);
      return;
    }
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(12, r.right - 196) });
    };
    update();
  }, [open]);
  const menu =
    pos &&
    createPortal(
      <div className="ag-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
        <div className="ag-amenu__sect">
          <button type="button" className="ag-aitem" role="menuitem" onClick={onView || onClose}>
            <Icon name="id-card" size={17} />
            View details
          </button>
          <button type="button" className="ag-aitem" role="menuitem" onClick={onEdit || onClose}>
            <Icon name="pencil" size={17} />
            Edit agent
          </button>
          <button type="button" className="ag-aitem" role="menuitem" onClick={onStatus}>
            <Icon name={suspended ? "circle-check" : "circle-pause"} size={17} />
            {suspended ? "Activate agent" : "Suspend agent"}
          </button>
          <button type="button" className="ag-aitem" role="menuitem" onClick={onVerify}>
            <Icon name={verified ? "shield-x" : "badge-check"} size={17} />
            {verified ? "Revoke verification" : "Verify agent"}
          </button>
        </div>
        <div className="ag-amenu__sect">
          <button type="button" className="ag-aitem mp-aitem--danger ag-aitem--danger" role="menuitem" onClick={onDelete}>
            <Icon name="trash-2" size={17} />
            Delete agent
          </button>
        </div>
      </div>,
      document.body,
    );
  return (
    <>
      <button ref={btnRef} type="button" className={(btnClass || "") + (open ? " is-open" : "")} aria-label={ariaLabel || "Agent actions"} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </>
  );
}

interface CardHandlers {
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onView: (a: AgentRecord) => void;
  onEditRequest: (a: AgentRecord) => void;
  onStatusRequest: (a: AgentRecord) => void;
  onVerifyRequest: (a: AgentRecord) => void;
  onDeleteRequest: (a: AgentRecord) => void;
}

function AgentCard({ a, openMenu, setOpenMenu, onView, onEditRequest, onStatusRequest, onVerifyRequest, onDeleteRequest }: { a: AgentRecord } & CardHandlers) {
  const ver = VERIFICATION[a.verification] || VERIFICATION.Pending;
  const st = AGENT_STATUS[a.status] || { variant: "neutral" as const, dot: false };
  const verified = a.verification === "Verified";
  return (
    <article className="ag-card">
      <div className="ag-card__status">
        <Badge variant={st.variant} size="sm" dot={st.dot} className="ag-statusbadge">
          {a.status}
        </Badge>
      </div>
      <div className="ag-actions">
        <ActionMenu
          open={openMenu === a.id}
          onToggle={() => setOpenMenu(openMenu === a.id ? null : a.id)}
          onClose={() => setOpenMenu(null)}
          onView={() => {
            setOpenMenu(null);
            onView(a);
          }}
          onEdit={() => {
            setOpenMenu(null);
            onEditRequest(a);
          }}
          onStatus={() => {
            setOpenMenu(null);
            onStatusRequest(a);
          }}
          onVerify={() => {
            setOpenMenu(null);
            onVerifyRequest(a);
          }}
          onDelete={() => {
            setOpenMenu(null);
            onDeleteRequest(a);
          }}
          btnClass="ag-card__kebab"
          ariaLabel={"Actions for " + a.name}
          status={a.status}
          verification={a.verification}
        />
      </div>

      <div className="ag-card__top">
        <Avatar src={a.img || undefined} name={a.name} size="xl" verified={verified} ring={!verified} />
        <div className="ag-card__name">{a.name}</div>
        <div className="ag-card__agency">
          <Icon name="building-2" size={13} />
          {a.agency}
        </div>
        <div className="ag-card__id">{a.id}</div>
        <div className="ag-card__verify">
          <Badge variant={ver.variant} size="sm" icon={ver.icon}>
            {ver.label}
          </Badge>
        </div>
      </div>

      <div className="ag-card__contact">
        <div className="ag-card__row ag-card__row--phone">
          <Icon name="phone" size={15} />
          <span>{a.phone}</span>
        </div>
        <div className="ag-card__row">
          <Icon name="mail" size={15} />
          <span>{a.email}</span>
        </div>
        <div className="ag-card__row">
          <Icon name="map-pin" size={15} />
          <span>
            {a.city} · {a.area}
          </span>
        </div>
      </div>

      <div className="ag-card__stats">
        <div className="ag-stat ag-stat--listings">
          <b>{a.listings}</b>
          <span>Listings</span>
        </div>
        <div className="ag-stat">
          <b>{a.sold}</b>
          <span>Sold</span>
        </div>
        <div className="ag-stat">
          <b>{a.rented}</b>
          <span>Rented</span>
        </div>
        <div className="ag-stat">
          <b>{a.members}</b>
          <span>Members</span>
        </div>
      </div>

      <div className="ag-card__foot">
        <Button hierarchy="primary" size="md" iconLeading="id-card" onClick={() => onView(a)}>
          View details
        </Button>
        <Button hierarchy="secondary" size="md" iconLeading="pencil" onClick={() => onEditRequest(a)}>
          Edit
        </Button>
      </div>
    </article>
  );
}

function NoResults({ inset }: { inset?: boolean }) {
  return (
    <div className="ag-noresults" style={inset ? { border: "none", boxShadow: "none", background: "transparent" } : undefined}>
      <span className="ag-noresults__art">
        <Icon name="search-x" size={26} strokeWidth={1.6} />
      </span>
      <h3>No agents found</h3>
      <p>Try adjusting your search or clearing the filters to see more agents.</p>
    </div>
  );
}

function AgentGrid({ rows, ...h }: { rows: AgentRecord[] } & CardHandlers) {
  if (rows.length === 0) return <NoResults />;
  return (
    <div className="ag-grid">
      {rows.map((a) => (
        <AgentCard key={a.id} a={a} {...h} />
      ))}
    </div>
  );
}

function AgentRow({ a, openMenu, setOpenMenu, onView, onEditRequest, onStatusRequest, onVerifyRequest, onDeleteRequest }: { a: AgentRecord } & CardHandlers) {
  const ver = VERIFICATION[a.verification] || VERIFICATION.Pending;
  const st = AGENT_STATUS[a.status] || { variant: "neutral" as const, dot: false };
  const verified = a.verification === "Verified";
  const num = (v: number, mod?: string) => <span className={"ag-num" + (v === 0 ? " ag-num--zero" : "") + (mod ? " ag-num--" + mod : "")}>{v}</span>;
  return (
    <div
      className="ag-row"
      role="button"
      tabIndex={0}
      style={{ cursor: "pointer" }}
      onClick={() => onView(a)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(a);
        }
      }}
    >
      <div className="ag-col--agent">
        <div className="ag-agent">
          <Avatar src={a.img || undefined} name={a.name} size="md" verified={verified} ring={!verified} />
          <div className="ag-agent__body">
            <span className="ag-agent__name">{a.name}</span>
            <span className="ag-agent__id">{a.id}</span>
          </div>
        </div>
      </div>
      <div className="ag-col--verification">
        <span className="ag-celllabel">Verification</span>
        <Badge variant={ver.variant} size="sm" icon={ver.icon}>
          {ver.label}
        </Badge>
      </div>
      <div className="ag-col--phone">
        <span className="ag-celllabel">Phone</span>
        <span className="ag-cell ag-cell--phone">
          <Icon name="phone" size={14} />
          {a.phone}
        </span>
      </div>
      <div className="ag-col--city">
        <span className="ag-celllabel">Location</span>
        <span className="ag-cell">
          <Icon name="map-pin" size={14} />
          {a.city}
        </span>
      </div>
      <div className="ag-col--listings ag-col--num">
        <span className="ag-celllabel">Listings</span>
        {num(a.listings, "listings")}
      </div>
      <div className="ag-col--sold ag-col--num">
        <span className="ag-celllabel">Sold</span>
        {num(a.sold)}
      </div>
      <div className="ag-col--rented ag-col--num">
        <span className="ag-celllabel">Rented</span>
        {num(a.rented)}
      </div>
      <div className="ag-col--status">
        <span className="ag-celllabel">Status</span>
        <Badge variant={st.variant} size="sm" dot={st.dot} className="ag-statusbadge">
          {a.status}
        </Badge>
      </div>
      <div className="ag-col--actions" onClick={(e) => e.stopPropagation()}>
        <div className="ag-actions">
          <ActionMenu
            open={openMenu === a.id}
            onToggle={() => setOpenMenu(openMenu === a.id ? null : a.id)}
            onClose={() => setOpenMenu(null)}
            onView={() => {
              setOpenMenu(null);
              onView(a);
            }}
            onEdit={() => {
              setOpenMenu(null);
              onEditRequest(a);
            }}
            onStatus={() => {
              setOpenMenu(null);
              onStatusRequest(a);
            }}
            onVerify={() => {
              setOpenMenu(null);
              onVerifyRequest(a);
            }}
            onDelete={() => {
              setOpenMenu(null);
              onDeleteRequest(a);
            }}
            btnClass="ag-kebab"
            ariaLabel={"Actions for " + a.name}
            status={a.status}
            verification={a.verification}
          />
        </div>
      </div>
    </div>
  );
}

function PaginationFooter({ currentPage, totalItems, onPageChange }: { currentPage: number; totalItems: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / AGENTS_PER_PAGE));
  const start = Math.min((currentPage - 1) * AGENTS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * AGENTS_PER_PAGE, totalItems);
  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };
  if (totalItems === 0) return null;
  return (
    <div className="ag-tablefooter">
      <span className="ag-pagination__info">
        Showing{" "}
        <b>
          {start.toLocaleString("en-US")}–{end.toLocaleString("en-US")}
        </b>{" "}
        of <b>{totalItems.toLocaleString("en-US")}</b> agents
      </span>
      <div className="ag-pagination">
        <button type="button" className="ag-page-btn ag-page-btn--nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />
          Previous
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={"e" + i} className="ag-page-ellipsis">
              …
            </span>
          ) : (
            <button key={p} type="button" className={"ag-page-btn" + (p === currentPage ? " is-active" : "")} onClick={() => onPageChange(p)}>
              {p}
            </button>
          ),
        )}
        <button type="button" className="ag-page-btn ag-page-btn--nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
          <Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>
  );
}

function AgentTable({
  rows,
  currentPage,
  totalItems,
  onPageChange,
  ...h
}: { rows: AgentRecord[]; currentPage: number; totalItems: number; onPageChange: (p: number) => void } & CardHandlers) {
  return (
    <section className="ag-tablecard ag-tablecard--joined">
      <div className="ag-tbl">
        <div className="ag-thead" role="row">
          <span className="ag-th ag-col--agent">Agent</span>
          <span className="ag-th ag-col--verification">Verification</span>
          <span className="ag-th ag-col--phone">Phone</span>
          <span className="ag-th ag-col--city">Location</span>
          <span className="ag-th ag-th--num ag-col--listings">Listings</span>
          <span className="ag-th ag-th--num ag-col--sold">Sold</span>
          <span className="ag-th ag-th--num ag-col--rented">Rented</span>
          <span className="ag-th ag-col--status">Status</span>
          <span className="ag-th ag-col--actions">Actions</span>
        </div>
        {rows.length > 0 ? rows.map((a) => <AgentRow key={a.id} a={a} {...h} />) : <NoResults inset />}
      </div>
      <PaginationFooter currentPage={currentPage} totalItems={totalItems} onPageChange={onPageChange} />
    </section>
  );
}

function AgentsPanel({
  filters,
  setFilter,
  onClear,
  hasActive,
  view,
  setView,
  rows,
  totalCount,
  cityOptions,
  filtersOpen,
  onToggleFilters,
}: {
  filters: AgentFilters;
  setFilter: (k: keyof AgentFilters, v: string) => void;
  onClear: () => void;
  hasActive: boolean;
  view: string;
  setView: (v: string) => void;
  rows: AgentRecord[];
  totalCount: number;
  cityOptions: string[];
  filtersOpen: boolean;
  onToggleFilters: () => void;
}) {
  const opt = (arr: string[]): SelectOption[] => arr.map((v) => ({ value: v, label: v }));
  const shown = hasActive ? rows.length : totalCount;
  const activeAdvCount = (["city", "listings", "status"] as const).filter((k) => filters[k]).length;
  return (
    <section className={"ap-panel" + (view === "table" ? " ap-panel--joined" : "")}>
      <header className="ap-panel__head">
        <div className="ap-panel__titlerow">
          <div className="ap-panel__heading">
            <h2 className="ap-panel__title">All agents</h2>
            <span className="ap-panel__count">{shown.toLocaleString("en-US")}</span>
          </div>
          {hasActive && (
            <div className="ap-resultnote">
              <span>
                <b>{rows.length}</b> of {totalCount.toLocaleString("en-US")} agents shown
              </span>
            </div>
          )}
        </div>

        <div className="ap-tabrow">
          <div className="ap-tabs" role="tablist" aria-label="Filter by verification">
            {VERIFICATION_TABS.map((tab) => (
              <button
                key={tab.id || "all"}
                type="button"
                role="tab"
                aria-selected={filters.verification === tab.id}
                className={"ap-tab" + (filters.verification === tab.id ? " is-active" : "")}
                onClick={() => setFilter("verification", tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="ap-tabrow__right">
            <div className="ap-tabsearch">
              <span className="ap-tabsearch__lead">
                <Icon name="search" size={16} />
              </span>
              <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder="Search agents…" aria-label="Search agents" />
            </div>
            <button
              type="button"
              className={"ap-filterbtn" + (filtersOpen ? " is-open" : "") + (activeAdvCount > 0 && !filtersOpen ? " has-active" : "")}
              aria-expanded={filtersOpen}
              onClick={onToggleFilters}
            >
              <Icon name="sliders-horizontal" size={15} />
              Filters
              {activeAdvCount > 0 && <span className="ap-filterbtn__badge">{activeAdvCount}</span>}
            </button>
            <div className="ap-viewswitch" role="tablist" aria-label="View mode">
              <button type="button" role="tab" aria-label="Cards" aria-selected={view === "cards"} className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")}>
                <Icon name="layout-grid" size={16} />
              </button>
              <button type="button" role="tab" aria-selected={view === "table"} className={view === "table" ? "is-active" : ""} onClick={() => setView("table")} aria-label="Table">
                <Icon name="list" size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className={"ap-filterbar" + (filtersOpen ? " is-open" : "")}>
          <div className="ap-filterbar__inner">
            <div className="ap-filterbar__row">
              <CustomSelect value={filters.city} onChange={(v) => setFilter("city", v)} options={[{ value: "", label: "Location" }, ...opt(cityOptions)]} clearable />
              <CustomSelect value={filters.status} onChange={(v) => setFilter("status", v)} options={[{ value: "", label: "Status" }, ...opt(["Active", "Suspended"])]} clearable />
              <div className="ap-filterbar__actions">
                <button type="button" className="ap-clearbtn" onClick={onClear}>
                  <Icon name="x" size={14} />
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    </section>
  );
}

function StatusAgentModal({ agent, onCancel, onConfirm }: { agent: AgentRecord; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const suspending = agent.status !== "Suspended";
  const copy = suspending
    ? { icon: "circle-pause" as IconName, iconCls: "mp-modal__icon--warn", title: "Suspend agent", body: "Are you sure you want to suspend this agent? They will no longer be able to access their account or appear to clients until reactivated.", cta: "Suspend agent", ctaCls: "mp-modal__confirm--warn" }
    : { icon: "circle-check" as IconName, iconCls: "mp-modal__icon--brand", title: "Activate agent", body: "Are you sure you want to activate this agent? They will regain access to their account and become visible to clients again.", cta: "Activate agent", ctaCls: "mp-modal__confirm--brand" };
  return createPortal(
    <div
      className="mp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="ag-status-title">
        <div className={"mp-modal__icon " + copy.iconCls}>
          <Icon name={copy.icon} size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="ag-status-title">
          {copy.title}
        </h2>
        <p className="mp-modal__body">{copy.body}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className={"mp-modal__confirm " + copy.ctaCls} onClick={onConfirm}>
            {copy.cta}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function DeleteAgentModal({ agent, onCancel, onConfirm }: { agent: AgentRecord; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div
      className="mp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="ag-del-title">
        <div className="mp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="ag-del-title">
          Delete agent?
        </h2>
        <p className="mp-modal__body">
          Are you sure you want to delete <strong>{agent.name}</strong>? This action cannot be undone and will permanently remove the agent profile.
        </p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="mp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            Delete agent
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface AgToast {
  variant?: "danger" | "warn" | "success";
  icon?: IconName;
  title: string;
  message: string;
  undo?: boolean;
}
const TOAST_DURATION = 6000;

function Toast({ toast, onDismiss, onView, onUndo }: { toast: AgToast; onDismiss: () => void; onView: () => void; onUndo: () => void }) {
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(onDismiss, 340);
  }, [onDismiss]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const startTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(close, TOAST_DURATION);
  }, [close]);
  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [startTimer]);
  const pause = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const cls = ["ag-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  const danger = toast.variant === "danger";
  const warn = toast.variant === "warn";
  const iconCls = danger ? " ag-toast__icon--danger" : warn ? " ag-toast__icon--warn" : "";
  const iconName = toast.icon || (danger ? "trash-2" : "check");
  return createPortal(
    <div className="ag-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" style={{ ["--ag-toast-dur" as string]: TOAST_DURATION + "ms" }} onMouseEnter={pause} onMouseLeave={startTimer}>
        <span className={"ag-toast__icon" + iconCls}>
          <Icon name={iconName} size={20} strokeWidth={danger ? 1.9 : 2.3} />
        </span>
        <div className="ag-toast__body">
          <p className="ag-toast__title">{toast.title}</p>
          <p className="ag-toast__msg">{toast.message}</p>
          <div className="ag-toast__actions">
            <button type="button" className="ag-toast__btn ag-toast__btn--dismiss" onClick={close}>
              Dismiss
            </button>
            {!danger && (
              <button type="button" className="ag-toast__btn ag-toast__btn--view" onClick={onView}>
                View details
              </button>
            )}
            {danger && toast.undo && (
              <button type="button" className="ag-toast__btn ag-toast__btn--view" onClick={onUndo}>
                <Icon name="undo-2" size={15} strokeWidth={2} style={{ marginRight: 6 }} /> Undo
              </button>
            )}
          </div>
        </div>
        <button type="button" className="ag-toast__close" aria-label="Dismiss notification" onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="ag-toast__progress" />
      </div>
    </div>,
    document.body,
  );
}

function AddAgentModal({ onCancel, onCreate }: { onCancel: () => void; onCreate: (a: Partial<AgentRecord>) => void }) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [status, setStatus] = useState("Active");
  const [invite, setInvite] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const canCreate = fullName.trim() && email.trim();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    onCreate({ name: fullName.trim(), email: email.trim(), img: photo, status });
  };

  return createPortal(
    <div
      className="aa-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form className="aa-modal" role="dialog" aria-modal="true" aria-labelledby="aa-title" onSubmit={submit}>
        <header className="aa-modal__head">
          <div className="aa-modal__headmain">
            <span className="aa-modal__icon">
              <Icon name="user-plus" size={22} strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="aa-modal__title" id="aa-title">
                Add Agent
              </h2>
              <p className="aa-modal__desc">Create a new agent profile and invite them to access the platform.</p>
            </div>
          </div>
          <button type="button" className="aa-modal__close" aria-label="Close" onClick={onCancel}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="aa-modal__body">
          <AvatarUpload value={photo} onChange={setPhoto} />

          <section className="aa-sect">
            <Input label="Full Name" id="aa-name" placeholder="e.g. Lana Aziz" iconLeading="user" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="aa-grid2">
              <Input label="Phone Number" id="aa-phone" type="tel" placeholder="+964 770 000 0000" iconLeading="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label="Email Address" id="aa-email" type="email" placeholder="name@chiya.estate" iconLeading="mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-stack">
              <Field label="Languages Spoken">
                <MultiSelect values={languages} onChange={setLanguages} options={LANGUAGE_OPTIONS} placeholder="Select languages" />
              </Field>
              <Field label="Service Areas">
                <MultiSelect values={areas} onChange={setAreas} options={SERVICE_AREA_OPTIONS} placeholder="Select areas" />
              </Field>
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-grid2">
              <Field label="Years of Experience" htmlFor="aa-exp">
                <CustomSelect value={experience} onChange={setExperience} options={[{ value: "", label: "Select" }, ...EXPERIENCE_OPTIONS]} />
              </Field>
              <Field label="Status" htmlFor="aa-status">
                <CustomSelect value={status} onChange={(v) => setStatus(v || "Active")} options={[{ value: "", label: "Select status" }, { value: "Active", label: "Active" }, { value: "Suspended", label: "Suspended" }]} />
              </Field>
            </div>
            <div className="aa-invitebox">
              <Checkbox id="aa-invite" checked={invite} onChange={(e) => setInvite(e.target.checked)} label="Send Invitation Email" description="The agent will receive an email invitation to create their password and access the platform." />
            </div>
          </section>
        </div>

        <footer className="aa-modal__foot">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            Cancel
          </button>
          <Button hierarchy="primary" size="md" type="submit" disabled={!canCreate}>
            Create Agent
          </Button>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

export function AgentsApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { agents, agentCounts, addAgent, removeAgent, updateAgent, locationTree } = useProperties();
  const cityOptions = useMemo(() => locationTree.map((c) => c.name).sort((a, b) => a.localeCompare(b)), [locationTree]);
  const [filters, setFilters] = useState<AgentFilters>(() => {
    const v = searchParams.get("verification");
    return v && VERIFICATION_TABS.some((t) => t.id === v) ? { ...EMPTY_FILTERS, verification: v } : EMPTY_FILTERS;
  });
  const [view, setView] = useState("table");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<AgToast | null>(null);
  const [statusTarget, setStatusTarget] = useState<AgentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgentRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgentRecord | null>(null);
  const lastDeleted = useRef<{ agent: AgentRecord; index: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const setFilter = (k: keyof AgentFilters, v: string) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters(EMPTY_FILTERS);
  const hasActive = Object.values(filters).some(Boolean);

  useEffect(() => {
    window.localStorage.setItem("chiya.agents.view", view);
  }, [view]);

  const viewProfile = (a?: AgentRecord) => router.push(a ? `/admin/agents/${encodeURIComponent(a.id)}` : "/admin/agents");

  const handleCreate = (values: Partial<AgentRecord>) => {
    setAddOpen(false);
    addAgent({
      id: "A-" + (3000 + Math.floor(Math.random() * 9000)),
      name: values.name || "New agent",
      agency: values.agency || "Chiya Prime",
      phone: values.phone || "",
      email: values.email || "",
      city: values.city || "Erbil",
      area: values.area || "Ankawa",
      verification: "Pending",
      listings: 0,
      sold: 0,
      rented: 0,
      members: 0,
      status: values.status || "Active",
      img: values.img ?? null,
    });
    setToast({ variant: "success", icon: "badge-check", title: "Agent Created Successfully", message: "The agent profile has been created and an invitation email has been sent." });
  };

  const handleSaveEdit = (values: AgentEditSeed) => {
    if (editTarget) {
      updateAgent(editTarget.id, {
        name: values.name,
        email: values.email,
        phone: values.phone || editTarget.phone,
        img: values.img,
        status: values.status,
        experience: values.experience,
        languages: values.languages,
        areas: values.areas,
      });
    }
    setEditTarget(null);
    setToast({ variant: "success", icon: "badge-check", title: "Agent Updated Successfully", message: "The agent profile has been updated." });
  };

  const handleStatusConfirm = () => {
    const target = statusTarget!;
    const suspending = target.status !== "Suspended";
    const next = suspending ? "Suspended" : "Active";
    updateAgent(target.id, { status: next });
    setStatusTarget(null);
    setToast(
      suspending
        ? { variant: "warn", icon: "circle-pause", title: "Agent suspended", message: "The agent account has been suspended successfully." }
        : { variant: "success", icon: "circle-check", title: "Agent activated", message: "The agent account has been activated successfully." },
    );
  };
  const handleVerifyToggle = (target: AgentRecord) => {
    const verifying = target.verification !== "Verified";
    const next = verifying ? "Verified" : "Pending";
    updateAgent(target.id, { verification: next });
    setToast(
      verifying
        ? { variant: "success", icon: "badge-check", title: "Agent verified", message: `${target.name} is now verified and can be assigned to listings.` }
        : { variant: "warn", icon: "shield-x", title: "Verification revoked", message: `${target.name} is now pending and can no longer be assigned to listings.` },
    );
  };
  const handleDeleteConfirm = () => {
    const target = deleteTarget!;
    const index = agents.findIndex((a) => a.id === target.id);
    lastDeleted.current = { agent: target, index };
    removeAgent(target.id);
    setDeleteTarget(null);
    setToast({ variant: "danger", undo: true, title: "Agent deleted", message: target.name + " has been permanently removed from the Agents directory." });
  };
  const handleUndo = () => {
    const d = lastDeleted.current;
    if (d) {
      addAgent(d.agent);
      lastDeleted.current = null;
    }
    setToast({ variant: "success", icon: "rotate-ccw", title: "Deletion undone", message: (d ? d.agent.name : "The agent") + " has been restored to the Agents directory." });
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return agents.filter((a) => {
      if (filters.verification && a.verification !== filters.verification) return false;
      if (filters.city && a.city !== filters.city) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.listings === "with" && a.listings === 0) return false;
      if (filters.listings === "none" && a.listings > 0) return false;
      if (filters.listings === "10+" && a.listings < 10) return false;
      if (q) {
        const hay = [a.name, a.phone, a.email, a.agency, a.id, a.city].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, agents]);

  // reset to first page whenever the filtered result set or view changes (render-phase guard)
  const resetKey = `${rows.length}|${view}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / AGENTS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((page - 1) * AGENTS_PER_PAGE, page * AGENTS_PER_PAGE);

  const handlers: CardHandlers = {
    openMenu,
    setOpenMenu,
    onView: viewProfile,
    onEditRequest: setEditTarget,
    onStatusRequest: setStatusTarget,
    onVerifyRequest: handleVerifyToggle,
    onDeleteRequest: setDeleteTarget,
  };

  return (
    <>
      <header className="ap-head">
        <div className="ap-head__intro">
          <h1 className="ap-head__title">Agents</h1>
          <p className="ap-head__sub">Manage agent profiles, verification status, assigned listings, and performance.</p>
        </div>
        <div className="ap-head__action">
          <Button hierarchy="primary" size="lg" iconLeading="user-plus" onClick={() => setAddOpen(true)}>
            Add agent
          </Button>
        </div>
      </header>

      <div className="ap-kpis">
        {KPI_CARDS.map((c) => (
          <StatCard key={c.key} label={c.label} value={agentCounts[c.field].toLocaleString("en-US")} icon={c.icon} tone={c.tone} sub={c.sub} />
        ))}
      </div>

      <AgentsPanel filters={filters} setFilter={setFilter} onClear={clear} hasActive={hasActive} view={view} setView={setView} rows={rows} totalCount={agents.length} cityOptions={cityOptions} filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((o) => !o)} />

      {view === "cards" ? <AgentGrid rows={rows} {...handlers} /> : <AgentTable rows={pagedRows} currentPage={page} totalItems={rows.length} onPageChange={setCurrentPage} {...handlers} />}

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      {addOpen && <AddAgentModal onCancel={() => setAddOpen(false)} onCreate={handleCreate} />}
      {editTarget && (
        <EditAgentModal
          seed={{
            img: editTarget.img,
            name: editTarget.name,
            phone: editTarget.phone,
            email: editTarget.email,
            experience: editTarget.experience || "3-5",
            languages: editTarget.languages || ["English", "Kurdish"],
            areas: editTarget.areas || deriveAreas(editTarget),
            status: editTarget.status || "Active",
          }}
          onCancel={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}
      {statusTarget && <StatusAgentModal agent={statusTarget} onCancel={() => setStatusTarget(null)} onConfirm={handleStatusConfirm} />}
      {deleteTarget && <DeleteAgentModal agent={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirm} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} onView={() => viewProfile()} onUndo={handleUndo} />}
    </>
  );
}
