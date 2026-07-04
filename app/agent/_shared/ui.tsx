import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { fmtUSD } from "@/app/admin/_data/catalog";

const PROP_VARIANT: Record<string, BadgeVariant> = {
  Published: "success",
  Pending: "warning",
  Sold: "error",
  Rented: "info",
  Draft: "neutral",
};
export function PropStatus({ status }: { status: string }) {
  return (
    <Badge variant={PROP_VARIANT[status] ?? "neutral"} size="sm" dot>
      {status}
    </Badge>
  );
}

const VIEW_VARIANT: Record<string, BadgeVariant> = {
  Scheduled: "info",
  Confirmed: "success",
  Completed: "brand",
  Cancelled: "error",
  "No Show": "warning",
};
export function ViewStatus({ status }: { status: string }) {
  return (
    <Badge variant={VIEW_VARIANT[status] ?? "neutral"} size="sm" dot>
      {status}
    </Badge>
  );
}

export function money(p: { price: number; per?: string }) {
  return fmtUSD(p.price) + (p.per ?? "");
}
