import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import "./sidebar.css";

export interface SidebarItem {
  icon: IconName;
  label: string;
  href?: string;
  active?: boolean;
  badge?: string | number;
  onClick?: () => void;
}
export interface SidebarGroup {
  heading?: string;
  items: SidebarItem[];
}

export interface SidebarProps {
  groups: SidebarGroup[];
  /** Brand / header slot (e.g. a Wordmark). */
  header?: ReactNode;
  /** Footer slot (e.g. a user chip). */
  footer?: ReactNode;
  collapsed?: boolean;
  className?: string;
}

/**
 * Sidebar — vertical navigation shell for admin / dashboard layouts. Grouped
 * items with icons, active state, and optional count badges. `collapsed`
 * narrows it to an icon rail.
 */
export function Sidebar({ groups, header, footer, collapsed = false, className = "" }: SidebarProps) {
  return (
    <aside
      className={["cx-sidebar", collapsed ? "cx-sidebar--collapsed" : "", className].filter(Boolean).join(" ")}
    >
      {header && <div className="cx-sidebar__head">{header}</div>}
      <nav className="cx-sidebar__nav">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.heading && <div className="cx-sidebar__group">{g.heading}</div>}
            {g.items.map((it, i) => {
              const cls = "cx-sidebar__item" + (it.active ? " cx-sidebar__item--active" : "");
              const inner = (
                <>
                  <Icon name={it.icon} size={19} />
                  <span className="cx-sidebar__label">{it.label}</span>
                  {it.badge != null && <span className="cx-sidebar__badge">{it.badge}</span>}
                </>
              );
              return it.href ? (
                <a key={i} href={it.href} className={cls} aria-current={it.active ? "page" : undefined} title={it.label}>
                  {inner}
                </a>
              ) : (
                <button key={i} type="button" className={cls} onClick={it.onClick} title={it.label}>
                  {inner}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      {footer && <div className="cx-sidebar__foot">{footer}</div>}
    </aside>
  );
}
