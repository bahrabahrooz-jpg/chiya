import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export interface EmptyStateProps {
  icon?: IconName;
  title: ReactNode;
  description?: ReactNode;
  /** Action slot (e.g. a Button). */
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState — friendly placeholder for empty lists / no-results views: an
 * icon medallion, a title, supporting copy, and an optional action.
 */
export function EmptyState({ icon = "search-x", title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div
      className={["flex flex-col items-center justify-center gap-4 px-6 py-16 text-center", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-xl)",
          background: "var(--surface-sunken)",
          color: "var(--text-tertiary)",
        }}
      >
        <Icon name={icon} size={26} />
      </span>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="cx-display-xs">{title}</h3>
        {description && (
          <p className="cx-text-sm" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
