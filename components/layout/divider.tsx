import type { ReactNode } from "react";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  /** Optional centered label (horizontal only). */
  label?: ReactNode;
  className?: string;
}

/**
 * Divider — a hairline separator using the subtle border token. Supports a
 * vertical orientation and an optional centered label.
 */
export function Divider({ orientation = "horizontal", label, className = "" }: DividerProps) {
  if (orientation === "vertical") {
    return (
      <span
        role="separator"
        aria-orientation="vertical"
        className={className}
        style={{ width: 1, alignSelf: "stretch", background: "var(--border-subtle)", flex: "none" }}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        className={["flex items-center gap-4", className].filter(Boolean).join(" ")}
      >
        <span style={{ height: 1, flex: 1, background: "var(--border-subtle)" }} />
        <span className="cx-text-sm" style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>
          {label}
        </span>
        <span style={{ height: 1, flex: 1, background: "var(--border-subtle)" }} />
      </div>
    );
  }

  return (
    <hr
      className={className}
      style={{ border: 0, height: 1, background: "var(--border-subtle)", margin: 0 }}
    />
  );
}
