/**
 * Chiya mobile — currency display and comparison.
 *
 * A deliberate MIRROR of the web app's lib/money.ts + the placement table in
 * lib/fmt.ts, not a second design. This is a separate Expo app with its own
 * module root, so it cannot import from the web `lib/`; keeping the two in step
 * is a manual job, exactly like components/home/data.ts mirrors the admin
 * catalog. If the placement rules or the supported currencies change on the web,
 * change them here in the same commit.
 *
 * Scaled down on purpose. The mobile app only DISPLAYS and FILTERS prices — it
 * never invoices, never totals, and never rounds tax — so it carries plain
 * whole-unit numbers plus a currency code rather than the full minor-unit Money
 * type. The moment this app needs to add two amounts together, it should get the
 * real thing instead of growing arithmetic here.
 */

/** The platform supports USD and IQD and nothing else. Mirrors CurrencyCode in
    the web app's lib/platform-settings. */
export type CurrencyCode = "USD" | "IQD";

/** How each currency's marker sits against the number. Mirrors PLACEMENT in the
    web app's lib/fmt: "$" is a sign and binds tight, "IQD" is a word and needs
    air after the digits. */
const PLACEMENT: Record<CurrencyCode, { marker: string; trails: boolean }> = {
  USD: { marker: "$", trails: false },
  IQD: { marker: "IQD", trails: true },
};

/** Just the marker, for an input adornment or a segmented control. */
export const currencyMarker = (c: CurrencyCode) => PLACEMENT[c].marker;

const commas = (n: number) => Math.round(n).toLocaleString("en-US");

/**
 * A price in its OWN currency. Exact — never converted.
 *
 * Every listing renders through this, so a dollar listing and a dinar listing
 * in the same list each say what they actually cost. Sorting may have compared
 * them at a rate; that figure never reaches the screen.
 */
export function formatPriceIn(amount: number, currency: CurrencyCode): string {
  const p = PLACEMENT[currency];
  return p.trails ? `${commas(amount)} ${p.marker}` : `${p.marker}${commas(amount)}`;
}

/** Short form for a tight space — "$1.2M", "620M IQD". Shortens, never converts. */
export function abbreviatePrice(amount: number, currency: CurrencyCode): string {
  const abs = Math.abs(amount);
  const pick = (div: number, suffix: string) => {
    const v = abs / div;
    return (v < 10 && v % 1 >= 0.05 ? v.toFixed(1) : String(Math.round(v))) + suffix;
  };
  const text = abs >= 1e9 ? pick(1e9, "B") : abs >= 1e6 ? pick(1e6, "M") : abs >= 1e3 ? pick(1e3, "K") : String(Math.round(abs));
  const p = PLACEMENT[currency];
  return p.trails ? `${text} ${p.marker}` : `${p.marker}${text}`;
}

/**
 * Units of `to` per 1 unit of `from`, from the single IQD_PER_USD constant.
 *
 * Mirrors the web app's settings rate. There is no settings store on mobile, so
 * this is a constant rather than something staff can edit here — the web admin
 * is where a rate is changed, and this figure has to be updated alongside it.
 */
export const IQD_PER_USD = 1310;

export function rateBetween(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1;
  return from === "USD" ? IQD_PER_USD : 1 / IQD_PER_USD;
}

/**
 * Normalise a price into one currency FOR SORTING AND FILTERING ONLY.
 *
 * The single place mobile approximates across currencies — same rule as
 * `normaliseFor` on the web. Returns a plain number so it cannot be handed to a
 * formatter by accident: a 4,500,000 IQD flat must sort below a $500,000 villa,
 * and the card beside it still shows its own real price.
 */
export function normalisePrice(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  return amount * rateBetween(from, to);
}
