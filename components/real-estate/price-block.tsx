import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { PropertyStatusBadge, type PropertyStatus } from "./property-status-badge";

export interface PriceBlockProps {
  price: string;
  period?: string;
  status?: PropertyStatus;
  /** Secondary unit price, e.g. "$2,950 / m²". */
  perUnit?: string;
  /** Supporting line, e.g. "Est. $3,200/mo with financing". */
  estimate?: ReactNode;
  size?: "md" | "lg";
  className?: string;
}

/**
 * PriceBlock — the headline price display for property detail / hero contexts:
 * a large tabular price, status badge, optional per-unit price and an estimate.
 */
export function PriceBlock({ price, period, status, perUnit, estimate, size = "lg", className = "" }: PriceBlockProps) {
  return (
    <div className={["flex flex-col gap-2", className].filter(Boolean).join(" ")}>
      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className="cx-tnum font-bold"
          style={{
            fontSize: size === "lg" ? 38 : 28,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--brand-primary)",
          }}
        >
          {price}
          {period && (
            <span style={{ fontSize: size === "lg" ? 18 : 15, fontWeight: 600, color: "var(--text-tertiary)" }}>
              {" "}/ {period}
            </span>
          )}
        </span>
        {status && <PropertyStatusBadge status={status} size="md" />}
      </div>
      {(perUnit || estimate) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {perUnit && (
            <span className="cx-tnum cx-text-sm" style={{ color: "var(--text-tertiary)" }}>
              {perUnit}
            </span>
          )}
          {estimate && (
            <span className="cx-text-sm flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="wallet" size={14} />
              {estimate}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
