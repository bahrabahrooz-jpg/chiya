import type { CSSProperties, ReactNode } from "react";
import "./card.css";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header slot, rendered above the body with a divider. */
  header?: ReactNode;
  /** Footer slot, rendered below the body with a divider. */
  footer?: ReactNode;
  /** Inner padding (default 24px). Set false for flush media cards. */
  padded?: boolean;
  /** Lift on hover (for clickable cards). */
  hoverable?: boolean;
  children?: ReactNode;
}

/**
 * Card — the primary surface container: white, hairline border, 16px radius,
 * soft card shadow. Optional header/footer slots and a hover lift.
 */
export function Card({
  header,
  footer,
  padded = true,
  hoverable = false,
  className = "",
  style,
  children,
  ...rest
}: CardProps) {
  const base: CSSProperties = {
    background: "var(--surface-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-card)",
    boxShadow: "var(--shadow-card)",
    overflow: "hidden",
    transition: "box-shadow .25s ease, transform .25s ease, border-color .25s ease",
    ...style,
  };
  const pad = padded ? "p-6" : "";
  return (
    <div
      className={["cx-card", hoverable ? "cx-card--hover" : "", className].filter(Boolean).join(" ")}
      style={base}
      {...rest}
    >
      {header && (
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          {header}
        </div>
      )}
      <div className={pad}>{children}</div>
      {footer && (
        <div className="px-6 py-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          {footer}
        </div>
      )}
    </div>
  );
}
