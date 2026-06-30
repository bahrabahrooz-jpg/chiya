import { Badge, type BadgeVariant, type BadgeSize } from "@/components/ui/badge";

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
