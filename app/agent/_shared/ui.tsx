"use client";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useLang, type Lang } from "@/lib/i18n";
import { valueKey } from "@/lib/fmt";
import { formatPrice, type Money } from "@/lib/money";

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
 * A listing's price plus its "/mo" suffix, in the listing's OWN currency.
 *
 * Not a component, so `lang` and the "/mo" label come from the caller — every
 * call site is already inside a component holding `useLang()`.
 *
 * Was called `money`, which now reads as the constructor in lib/money; renamed
 * so a call site can't look like it is building an amount when it is rendering
 * one.
 */
export function priceLabel(lang: Lang, p: { price: Money; per?: string }, perLabel = "") {
  return formatPrice(lang, p.price) + (p.per ? perLabel : "");
}
