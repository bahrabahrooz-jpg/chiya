"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useLang, type Lang } from "@/lib/i18n";
import { fmtCurrency, valueKey } from "@/lib/fmt";

const PROP_VARIANT: Record<string, BadgeVariant> = {
  Published: "success",
  Pending: "warning",
  Sold: "error",
  Rented: "info",
  Draft: "neutral",
};
export function PropStatus({ status }: { status: string }) {
  const { t } = useLang();
  return (
    <Badge variant={PROP_VARIANT[status] ?? "neutral"} size="sm" dot>
      {t(valueKey("status", status))}
    </Badge>
  );
}

const VIEW_VARIANT: Record<string, BadgeVariant> = {
  Requested: "info",
  Confirmed: "success",
  Completed: "brand",
  Cancelled: "error",
  "No Show": "warning",
};
export function ViewStatus({ status }: { status: string }) {
  const { t } = useLang();
  return (
    <Badge variant={VIEW_VARIANT[status] ?? "neutral"} size="sm" dot>
      {t(valueKey("status", status))}
    </Badge>
  );
}

/**
 * Not a component, so `lang` and the "/mo" label come from the caller — every
 * call site is already inside a component holding `useLang()`.
 */
export function money(lang: Lang, p: { price: number; per?: string }, perLabel = "") {
  return fmtCurrency(lang, p.price) + (p.per ? perLabel : "");
}
