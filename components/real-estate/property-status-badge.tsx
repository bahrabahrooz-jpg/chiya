import { Badge, type BadgeVariant, type BadgeSize } from "@/components/ui/badge";
import "./card-status-pill.css";

export type PropertyStatus = "For Sale" | "For Rent" | "Pending" | "Sold" | "New" | (string & {});

/** Listing-status → Badge variant mapping (shared across cards & galleries). */
export const STATUS_VARIANT: Record<string, BadgeVariant> = {
  "For Sale": "success",
  "For Rent": "info",
  Pending: "warning",
  Sold: "error",
  New: "solid",
};

export interface PropertyStatusBadgeProps {
  status: PropertyStatus;
  size?: BadgeSize;
  dot?: boolean;
}

/** PropertyStatusBadge — renders a listing status with the correct semantic color. */
export function PropertyStatusBadge({ status, size = "sm", dot = true }: PropertyStatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANT[status] || "neutral"} size={size} dot={dot}>
      {status}
    </Badge>
  );
}

/** Text colour for the photo-overlay pill (mobile matches brand green for the
    common Sale/Rent states; other states keep their semantic colour). */
const PILL_COLOR: Record<string, string> = {
  "For Sale": "var(--brand-primary)",
  "For Rent": "var(--brand-primary)",
  New: "var(--brand-primary)",
  Pending: "var(--warning-600)",
  Sold: "var(--error-500)",
};

/**
 * CardStatusPill — the status tag overlaid on property-card photos. Solid
 * near-white pill with brand-coloured text, matching the mobile app badge.
 */
export function CardStatusPill({ status }: { status: PropertyStatus }) {
  return (
    <span className="cx-statuspill" style={{ color: PILL_COLOR[status] || "var(--brand-primary)" }}>
      {status}
    </span>
  );
}
