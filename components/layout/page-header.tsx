import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** Breadcrumb node, rendered above the title. */
  breadcrumb?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned actions (buttons, etc.). */
  actions?: ReactNode;
  className?: string;
}

/**
 * PageHeader — the standard heading block for app / admin pages: optional
 * breadcrumb, a display title, supporting copy, and a right-aligned actions slot.
 */
export function PageHeader({ breadcrumb, title, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <div className={["flex flex-col gap-4", className].filter(Boolean).join(" ")}>
      {breadcrumb}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="cx-display-sm">{title}</h1>
          {subtitle && <p className="cx-text-md" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
