"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { NAV_GROUPS, type NavGroupDef, type NavItemDef } from "./admin-data";

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
  const { t, dir } = useLang();
  const cls = ["ax-nav-item", active ? "is-active" : "", item.disabled ? "is-disabled" : ""]
    .filter(Boolean)
    .join(" ");
  const ref = useRef<HTMLAnchorElement>(null);
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null);
  const label = t(item.labelKey);

  const showTip = () => {
    if (!collapsed || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    // Flyout sits on the inline-end side of the rail — mirror it in RTL.
    setTip({ top: r.top + r.height / 2, left: dir === "rtl" ? r.left - 14 : r.right + 14 });
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
      <span className="ax-nav-text">{label}</span>
      {item.tag && <span className="ax-nav-item__tag">{item.tag}</span>}
      {tip &&
        collapsed &&
        createPortal(
          <span
            className="ax-nav-tip"
            role="tooltip"
            style={{ top: tip.top, left: tip.left, transform: dir === "rtl" ? "translate(-100%, -50%)" : undefined }}
          >
            {label}
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
  groups = NAV_GROUPS,
  homeHref = "/admin",
}: {
  collapsed: boolean;
  drawerOpen: boolean;
  active: string;
  onToggleCollapse: () => void;
  onNavigate: () => void;
  groups?: NavGroupDef[];
  homeHref?: string;
}) {
  const { t, dir } = useLang();
  const rtl = dir === "rtl";
  const cls = ["ax-sidebar", collapsed ? "is-collapsed" : "", drawerOpen ? "is-drawer-open" : ""]
    .filter(Boolean)
    .join(" ");
  // The chevron points "outward" toward the collapse direction, which flips in RTL.
  const collapseIcon = collapsed
    ? rtl ? "chevron-left" : "chevron-right"
    : rtl ? "chevron-right" : "chevron-left";

  return (
    <aside className={cls} aria-label={t("admin.sidebar.primaryNav")}>
      <div className="ax-sb-head">
        <Link className="ax-sb-logo" href={homeHref} onClick={onNavigate}>
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
        aria-label={collapsed ? t("admin.sidebar.expand") : t("admin.sidebar.collapse")}
        title={collapsed ? t("admin.sidebar.expand") : t("admin.sidebar.collapse")}
        onClick={onToggleCollapse}
      >
        <Icon name={collapseIcon} size={15} strokeWidth={2.25} />
      </button>

      <nav className="ax-nav">
        {groups.map((g) => (
          <div className="ax-nav-group" key={g.label}>
            <div className="ax-nav-label">{t(g.labelKey)}</div>
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
