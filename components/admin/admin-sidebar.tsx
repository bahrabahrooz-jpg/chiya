"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { NAV_GROUPS, type NavItemDef } from "./admin-data";

function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItemDef;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const cls = ["ax-nav-item", active ? "is-active" : "", item.disabled ? "is-disabled" : ""]
    .filter(Boolean)
    .join(" ");
  const ref = useRef<HTMLAnchorElement>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);

  const showTip = () => {
    if (!collapsed || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setTip({ top: r.top + r.height / 2, left: r.right + 14 });
  };
  const hideTip = () => setTip(null);

  return (
    <Link
      ref={ref}
      href={item.disabled ? "#" : item.href}
      className={cls}
      aria-current={active ? "page" : undefined}
      aria-disabled={item.disabled || undefined}
      onClick={(e) => {
        if (item.disabled) {
          e.preventDefault();
          return;
        }
        onNavigate();
      }}
      onMouseEnter={showTip}
      onMouseLeave={hideTip}
      onFocus={showTip}
      onBlur={hideTip}
    >
      <Icon name={item.icon} size={20} />
      <span className="ax-nav-text">{item.label}</span>
      {item.tag && <span className="ax-nav-item__tag">{item.tag}</span>}
      {tip &&
        collapsed &&
        createPortal(
          <span className="ax-nav-tip" role="tooltip" style={{ top: tip.top, left: tip.left }}>
            {item.label}
          </span>,
          document.body,
        )}
    </Link>
  );
}

export function AdminSidebar({
  collapsed,
  drawerOpen,
  active,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  drawerOpen: boolean;
  active: string;
  onToggleCollapse: () => void;
  onNavigate: () => void;
}) {
  const cls = ["ax-sidebar", collapsed ? "is-collapsed" : "", drawerOpen ? "is-drawer-open" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={cls} aria-label="Primary navigation">
      <div className="ax-sb-head">
        <Link className="ax-sb-logo" href="/admin" onClick={onNavigate}>
          <span className="ax-sb-logo__txt">
            <span className="ax-sb-logo__name">
              Chiya<span> Estate</span>
            </span>
          </span>
        </Link>
      </div>

      <button
        type="button"
        className="ax-collapse-btn"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapse}
      >
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={15} strokeWidth={2.25} />
      </button>

      <nav className="ax-nav">
        {NAV_GROUPS.map((g) => (
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{g.label}</div>
            {g.items.map((it) => (
              <NavItem
                key={it.id}
                item={it}
                active={active === it.id}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
