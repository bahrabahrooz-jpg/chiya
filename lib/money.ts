/**
 * Chiya Estate — the money primitive.
 *
 * THE RULE: no code outside this file performs arithmetic on a monetary value.
 * Not `a.price + b.price`, not `total * 0.05`, not `Math.round(fee)`. Every
 * addition, subtraction, percentage and rounding of money goes through the
 * functions below. Two reasons, and both of them bite in an invoice:
 *
 *  1. Floats do not hold decimal money. `0.1 + 0.2 !== 0.3`, so a total summed
 *     from float lines drifts, and an invoice never lands *exactly* on paid —
 *     it lands on 0.0000000001 outstanding, forever. So a Money holds an
 *     INTEGER count of minor units (cents, fils) and nothing else.
 *  2. A number carries no currency. `720000` is meaningless on its own; adding
 *     a USD figure to an IQD one is a bug that silently produces a plausible
 *     number. Every operation here throws on a currency mismatch rather than
 *     coercing.
 *
 * Conversion between currencies always takes an explicit rate. This module
 * never looks a rate up and never hardcodes one — a converted amount is only
 * ever as good as the rate someone chose, and that choice belongs to the caller
 * (and, for a signed contract, gets frozen onto the record).
 *
 * ---------------------------------------------------------------------------
 * WHERE CURRENCY IS DECIDED — the governing principle for the whole platform.
 *
 * Currency is chosen in exactly ONE place: the add-property form. Everywhere
 * downstream it is inherited and read-only.
 *
 *     property  →  contract  →  invoice  →  payment
 *
 * A contract takes the property's currency; the invoices raised against it
 * take the contract's; a payment records what arrived and converts it back to
 * the invoice's. No screen further down that chain offers a currency picker,
 * because changing one would silently restate an agreed figure.
 *
 * There is exactly ONE deliberate exception: the dual-currency opt-in on a
 * contract (ContractRecord.dualCurrency), where the parties agree to settle in a
 * second currency at a rate they negotiate. That rate is frozen onto the
 * contract at signing and is never re-read from settings — see
 * ContractRecord.agreedRate.
 *
 * The settings exchange rate is for BROWSING ONLY: approximate lines, filter
 * matching, and price sorting. It never touches a contract, an invoice, a
 * receipt or a payment. See formatApprox below.
 * ---------------------------------------------------------------------------
 */

import type { CurrencyCode } from "@/lib/platform-settings";
import type { Lang } from "@/lib/i18n";
import { fmtCurrencyParts, fmtDate } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";

export type { CurrencyCode };

/** An amount of money in one currency. */
export interface Money {
  /** Integer amount in the currency's minor unit (cents, fils). Never fractional. */
  amount: number;
  currency: CurrencyCode;
}

/* ------------------------------- currencies -------------------------------- */

/**
 * ISO 4217 minor-unit exponents — how many decimal places the currency's minor
 * unit divides into. Storage is in these units, so getting one wrong misprices
 * everything in that currency by a factor of ten.
 *
 * IQD is 3, not 2: the Iraqi dinar divides into 1000 fils. (The brief guessed 0;
 * ISO 4217 is the authority and it says 3.) See DISPLAY_DECIMALS for why that
 * does not mean IQD renders with three decimal places.
 */
export const MINOR_UNITS: Record<CurrencyCode, number> = {
  USD: 2,
  IQD: 3,
};

/**
 * How many decimal places to SHOW — deliberately separate from MINOR_UNITS.
 *
 * Iraqi fils have not circulated in decades; IQD prices are quoted and paid in
 * whole dinars, so rendering "1,000.000 IQD" would read as a bug even though
 * the stored exponent is correct. Storage keeps full ISO precision, display
 * rounds to what people actually use.
 */
const DISPLAY_DECIMALS: Record<CurrencyCode, number> = {
  USD: 2,
  IQD: 0,
};

/** Minor units per whole unit, e.g. 100 for USD, 1000 for IQD. */
function scaleOf(currency: CurrencyCode): number {
  return 10 ** MINOR_UNITS[currency];
}

/* -------------------------------- rounding --------------------------------- */

/**
 * The single rounding entry point. Every operation that can produce a fraction
 * of a minor unit — percentOf, tax, convert — ends here, so the whole system
 * rounds one way.
 *
 * MODE: half away from zero (2.5 → 3, −2.5 → −3).
 *
 * Why: invoicing convention rounds tax and commission half-up, so an accountant
 * checking a line by hand gets the number the system got — banker's rounding
 * would be defensible statistically and surprising on a receipt. And handling
 * the sign symmetrically matters more here than the tie rule does: a credit note
 * is the arithmetic negation of the invoice it reverses, so the two must cancel
 * to exactly zero. Plain `Math.round` biases toward +∞ (it turns −2.5 into −2),
 * which would leave a one-fils residue on a reversed line.
 */
export function roundMinor(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/* ------------------------------ constructors ------------------------------- */

/** Money from a whole-unit amount: money(1250.5, "USD") → 125050 cents. */
export function money(major: number, currency: CurrencyCode): Money {
  return { amount: roundMinor(major * scaleOf(currency)), currency };
}

/** Money from a raw minor-unit amount, e.g. straight off a stored record. */
export function fromMinor(amount: number, currency: CurrencyCode): Money {
  return { amount: roundMinor(amount), currency };
}

/** A zero amount in the given currency — the identity for add/sumMoney. */
export function zeroMoney(currency: CurrencyCode): Money {
  return { amount: 0, currency };
}

/** The whole-unit value, for display and for handing to a chart. Lossy by
    definition (it is a float again) — never feed it back into arithmetic. */
export function toMajor(m: Money): number {
  return m.amount / scaleOf(m.currency);
}

/* ------------------------------- arithmetic -------------------------------- */

/** Throws unless both amounts are in the same currency. No silent coercion:
    mixing currencies is a bug, and quietly picking one hides it. */
function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new Error(`money: currency mismatch — cannot combine ${a.currency} and ${b.currency}. Convert with an explicit rate first.`);
  }
}

/** a + b. Throws on mixed currencies. */
export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount + b.amount, currency: a.currency };
}

/** a − b. Throws on mixed currencies. May go negative (a credit note does). */
export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return { amount: a.amount - b.amount, currency: a.currency };
}

/** Multiply by a plain count — a quantity on an invoice line, not money. */
export function multiply(m: Money, factor: number): Money {
  return { amount: roundMinor(m.amount * factor), currency: m.currency };
}

/** `rate` percent of an amount: percentOf(money(1000,"USD"), 2.5) → $25.00.
    A rate is a percentage, not a fraction — 2.5 means 2.5%, not 250%. */
export function percentOf(m: Money, rate: number): Money {
  return { amount: roundMinor((m.amount * rate) / 100), currency: m.currency };
}

/**
 * Sum a list. `currency` is required and not inferred from the first element:
 * an empty list still has to produce a typed zero, and there is no neutral
 * currency to fall back on. Throws if any element disagrees with it.
 */
export function sumMoney(list: Money[], currency: CurrencyCode): Money {
  return list.reduce<Money>((acc, m) => add(acc, m), zeroMoney(currency));
}

/** −1 / 0 / 1, like a sort comparator. Throws on mixed currencies. */
export function compareMoney(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  return a.amount === b.amount ? 0 : a.amount < b.amount ? -1 : 1;
}

/** Exactly zero — what "fully paid" means, and why the integer amount matters. */
export function isZero(m: Money): boolean {
  return m.amount === 0;
}

export function isNegative(m: Money): boolean {
  return m.amount < 0;
}

/** Same currency and same amount. */
export function equalsMoney(a: Money, b: Money): boolean {
  return a.currency === b.currency && a.amount === b.amount;
}

/** The larger of two amounts — clamps an outstanding balance at zero when an
    overpayment would otherwise take it negative. Throws on mixed currencies. */
export function maxMoney(a: Money, b: Money): Money {
  return compareMoney(a, b) >= 0 ? a : b;
}

/* ------------------------------- conversion -------------------------------- */

/**
 * Convert at an EXPLICIT rate — units of `toCurrency` per whole unit of
 * `m.currency`. Nothing here looks a rate up or holds a table of them: a rate is
 * a decision with a date on it, and a record that needs one stores the rate it
 * was signed at (see ContractRecord.agreedRate) rather than re-deriving it later.
 *
 * The two currencies' minor-unit exponents differ, so the scale is corrected as
 * part of the conversion — USD cents to IQD fils is ×1000/100 on top of the rate.
 */
export function convert(m: Money, toCurrency: CurrencyCode, rate: number): Money {
  if (m.currency === toCurrency) return m;
  const converted = (m.amount / scaleOf(m.currency)) * rate * scaleOf(toCurrency);
  return { amount: roundMinor(converted), currency: toCurrency };
}

/* ------------------------------- formatting -------------------------------- */

export interface FormatMoneyOptions {
  /** Show the ISO code ("USD 1,200") instead of the symbol ("$1,200") — for
      multi-currency lists where a bare "$" would not say which dollar. */
  useCode?: boolean;
  /** Override the currency's display precision (DISPLAY_DECIMALS). */
  decimals?: number;
}

/** Group the integer part with en-US thousands separators. Takes a digit string,
    so a very large amount cannot lose precision on the way through a float. */
function groupDigits(intText: string): string {
  return intText.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * EXACT. The record's own currency, to the minor unit.
 *
 * Use this wherever a figure is AUTHORITATIVE — a listing price, a contract value,
 * a contract, an invoice line, a payment, anything someone might act on. It
 * never converts and never approximates: what it prints is what the record
 * holds. Its counterpart is `formatApprox`, which does convert and says so; the
 * two are named apart precisely so a converted figure can never be mistaken for
 * a real one at a call site.
 *
 * The digit string is built from the INTEGER minor units — split into whole and
 * fractional halves and grouped as text — so no float ever touches a printed
 * amount. Symbol placement and Arabic-Indic digits then come from lib/fmt, the
 * same path `fmtCurrency` takes, so a Money and a bare number never render
 * differently.
 */
export function formatMoney(lang: Lang, m: Money, opts: FormatMoneyOptions = {}): string {
  const scale = MINOR_UNITS[m.currency];
  const show = opts.decimals ?? DISPLAY_DECIMALS[m.currency];
  const negative = m.amount < 0;
  const abs = Math.abs(m.amount);

  // Rescale to the shown precision first — showing fewer places than the
  // currency stores (IQD: 3 stored, 0 shown) must ROUND, not truncate, or a
  // 999.6-dinar line would print as 999.
  const shown = show >= scale ? abs * 10 ** (show - scale) : roundMinor(abs / 10 ** (scale - show));
  let text = groupDigits(String(Math.trunc(shown / 10 ** show)));
  if (show > 0) text += "." + String(shown % 10 ** show).padStart(show, "0");
  return (negative ? "-" : "") + fmtCurrencyParts(lang, text, m.currency, opts.useCode ?? false);
}

/**
 * A LISTING price — exact, in its own currency, and to WHOLE UNITS.
 *
 * Same figure `formatMoney` would give, minus the decimal places. Property is
 * advertised as "$850,000", never "$850,000.00": the cents on an asking price
 * are noise, and printing them makes a headline read like an invoice line.
 *
 * The distinction is real, not cosmetic. `formatMoney` keeps its decimals
 * because an invoice, a commission and a payment need them — a column of
 * amounts that has to add up shows every place it holds. A listing has no
 * column to line up with and no cents to lose, so it drops them.
 *
 * Use this for asking prices, rents and anything a member browses. Use
 * `formatMoney` for anything financial.
 */
export function formatPrice(lang: Lang, m: Money): string {
  return formatMoney(lang, m, { decimals: 0 });
}

/**
 * How coarsely an approximate figure is rounded, per currency — in whole units.
 *
 * A converted amount is only as good as the rate behind it, and that rate is a
 * number a member of staff typed into a settings box last Tuesday. Printing
 * "≈ 943,200,000 IQD" off it claims precision to the dinar that nobody has;
 * "≈ 943,000,000 IQD" tells the same story honestly. Rounding hard is not a
 * cosmetic choice — it is the figure admitting what it is.
 */
const APPROX_STEP: Record<CurrencyCode, number> = {
  USD: 100,
  IQD: 1_000_000,
};

/**
 * APPROXIMATE. Live conversion at the current settings rate.
 *
 * ⚠ FORBIDDEN ON CONTRACTS, INVOICES, RECEIPTS AND PAYMENT RECORDS. ⚠
 *
 * Those documents carry a rate frozen when the parties agreed it
 * (ContractRecord.agreedRate) and are NEVER recalculated. An invoice reprinted in
 * five years has to show the numbers it showed on its issue date; running it
 * through today's rate would quietly rewrite a demand for money that somebody
 * has already paid. Use `dualFigures` (app/admin/_data/contracts) there instead.
 *
 * This is for BROWSING ONLY: the muted second line on a listing card, the PDP
 * price block, and the search filter's cross-currency note.
 *
 * Always renders a leading "≈" AND the date the rate was set — both are part of
 * the output, not the caller's job to remember. `asOf` is required and is
 * printed, so an approximate figure cannot appear anywhere without saying when
 * it was true: "≈ 943,000,000 IQD · 30 Jun 2026". Callers pass
 * `settings.listings.ratesUpdatedOn`.
 */
export function formatApprox(lang: Lang, m: Money, toCurrency: CurrencyCode, rate: number, asOf: string): string {
  const converted = convert(m, toCurrency, rate);
  const step = APPROX_STEP[toCurrency];
  const scale = 10 ** MINOR_UNITS[toCurrency];
  /* Round in whole units, not minor ones, so the step reads as a round number
     to a person rather than to the storage format. */
  const rounded = roundMinor(converted.amount / (step * scale)) * step * scale;
  const figure = formatMoney(lang, { amount: rounded, currency: toCurrency }, { decimals: 0 });
  return `≈ ${figure} · ${fmtDate(lang, fromIso(asOf), "dmy")}`;
}

/**
 * Short form for somewhere a full figure will not fit — a map pin, a narrow
 * column. "$1.2M", "1.2B IQD".
 *
 * Abbreviating is the right answer where the alternative is wrapping or
 * clipping, and dinar figures are three orders of magnitude longer than the
 * dollar ones these layouts were built for. It is still EXACT in the sense that
 * matters — it never converts, only shortens the record's own figure — so it is
 * safe anywhere `formatMoney` is, given the space constraint that motivated it.
 */
export function abbreviateMoney(lang: Lang, m: Money): string {
  const major = Math.abs(toMajor(m));
  const sign = m.amount < 0 ? "-" : "";
  const pick = (div: number, suffix: string) => {
    const v = major / div;
    /* One decimal only when it changes the reading: 1.2M, but 5M not 5.0M. */
    return (v < 10 && v % 1 >= 0.05 ? v.toFixed(1) : String(Math.round(v))) + suffix;
  };
  const text = major >= 1e9 ? pick(1e9, "B") : major >= 1e6 ? pick(1e6, "M") : major >= 1e3 ? pick(1e3, "K") : String(Math.round(major));
  return sign + fmtCurrencyParts(lang, text, m.currency);
}

/**
 * Normalise to one currency FOR SORTING AND FILTERING ONLY. Never displayed.
 *
 * The whole approximation for machine comparison lives in this one function, so
 * there is exactly one place where a dinar figure and a dollar figure are
 * pretended to be commensurable. Returns a plain number, not a Money, precisely
 * so it cannot be handed to a formatter by accident and end up on screen: a
 * 300,000 IQD flat must sort below a $500,000 villa, but the card beside it
 * still shows its own real price via `formatMoney`.
 */
export function normaliseFor(m: Money, to: CurrencyCode, rate: number): number {
  return m.currency === to ? m.amount : convert(m, to, rate).amount;
}
