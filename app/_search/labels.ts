/**
 * Range labels for the search filters — generated, never translated.
 *
 * The price buckets used to be nine value-bearing strings in each of the three
 * dictionaries ("Up to $150K", "تا $١٥٠ هەزار"). That baked the dollar into the
 * *translations*, so a member browsing in dinars saw dollar buckets in Kurdish
 * with no way to correct it, and every change to a boundary meant editing
 * thirty strings across three files.
 *
 * Now the dictionaries hold sentence SHAPES with a slot — "Up to {max}",
 * "{min} – {max}", "{min} and above" — and the figure is produced here from the
 * bucket boundary and the active filter currency. Adding a currency, or moving
 * a boundary, touches no dictionary at all.
 *
 * Size ranges keep their own keys and their own unit: m² is not a currency and
 * has nothing to do with any of this.
 */

import { abbreviateMoney, money, type CurrencyCode } from "@/lib/money";
import type { Lang } from "@/lib/i18n";
import type { RangeVal } from "./types";

type T = (key: string, params?: Record<string, string | number>) => string;

/** en-US thousands grouping for a plain (non-money) figure, digits localized
    by the caller's `t`-free path — used for m², which carries no currency. */
const commas = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

/**
 * Render one boundary as money in the filter's currency, ABBREVIATED.
 *
 * Abbreviated because a bucket edge is a bracket, not a price — nobody choosing
 * a budget needs "200,000,000 IQD" to the dinar, and the design has always read
 * "$150K" / "$1M". It is also what keeps the filter usable: written in full, a
 * dinar range label is "200,000,000 IQD – 500,000,000 IQD", roughly twice the
 * width of the sidebar it has to sit in.
 *
 * Boundaries are stored as whole units (150000, 200000000) because that is how
 * they are written and read; `money()` scales them to minor units so the figure
 * goes through the same formatter — and therefore the same symbol placement and
 * Arabic-Indic digits — as every real price on the page.
 */
const edge = (lang: Lang, n: number, cur: CurrencyCode) => abbreviateMoney(lang, money(n, cur));

/**
 * The label for a price range. `lo`/`hi` null means open on that side.
 *
 * The three shapes exist because "0 – $150K" reads worse than "Up to $150K" and
 * "$1M – Any" reads worse than "$1M and above" — the open-ended cases are how
 * people actually describe a budget.
 */
export function priceRangeLabel(t: T, lang: Lang, r: RangeVal, cur: CurrencyCode, deal: "buy" | "rent"): string {
  const lo = r.lo != null && r.lo > 0 ? edge(lang, r.lo, cur) : null;
  const hi = r.hi != null ? edge(lang, r.hi, cur) : null;
  let text: string;
  if (lo && hi) text = t("preset.range.between", { min: lo, max: hi });
  else if (hi) text = t("preset.range.upTo", { max: hi });
  else if (lo) text = t("preset.range.above", { min: lo });
  else return t("srp.any");
  /* Rent is quoted per month, so the suffix belongs on the whole range rather
     than on each figure — "$1,000 – $2,500/mo", not "$1,000/mo – $2,500/mo". */
  return deal === "rent" ? t("preset.range.perMo", { range: text }) : text;
}

/** The label for a size range. Unchanged in spirit — m² is not money. */
export function sizeRangeLabel(t: T, r: RangeVal): string {
  const any = t("srp.any");
  const lo = r.lo != null && r.lo > 0 ? commas(r.lo) : null;
  const hi = r.hi != null ? commas(r.hi) : null;
  if (lo && hi) return `${lo} – ${hi} m²`;
  if (hi) return `${any} – ${hi} m²`;
  if (lo) return `${lo} – ${any} m²`;
  return any;
}

/** Whichever of the two applies. The one entry point for a filter chip. */
export function rangeLabel(
  t: T,
  lang: Lang,
  r: RangeVal,
  kind: "price" | "size",
  cur: CurrencyCode,
  deal: "buy" | "rent",
): string {
  return kind === "size" ? sizeRangeLabel(t, r) : priceRangeLabel(t, lang, r, cur, deal);
}
