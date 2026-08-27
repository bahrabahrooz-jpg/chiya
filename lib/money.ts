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
export const DISPLAY_DECIMALS: Record<CurrencyCode, number> = {
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

/* ------------------------------- allocation -------------------------------- */

/**
 * SPLIT AN AMOUNT INTO INSTALMENTS THAT ADD BACK UP TO IT — EXACTLY.
 *
 * The one rounding rule for every payment schedule in the system, written here
 * because it is money arithmetic and money arithmetic lives in this file.
 *
 * The shape people actually agree to is a round figure repeated, with the last
 * payment absorbing whatever is left: "$4,084 a month for two years, and the
 * last one is $4,068". So the per-instalment amount is rounded UP to a WHOLE
 * unit of the currency — nobody signs up to pay $4,083.34 — and the final
 * instalment takes the remainder.
 *
 * ⚠ THE LAST INSTALMENT CLOSES THE BALANCE TO EXACTLY ZERO. That is the whole
 * contract of this function. Rounding each instalment independently and hoping
 * leaves a few cents outstanding on a fully paid sale, and an invoice that can
 * never be settled is not a rounding error to the person holding it.
 *
 * Rounding up cannot outrun the total on any realistic schedule, but on a small
 * one it could (twenty-four instalments of a $100 balance), and a negative final
 * instalment would be worse than an unrounded schedule. So that case falls back
 * to the largest-remainder method: every instalment within one minor unit of
 * every other, the odd units handed to the earliest ones, and the same exact
 * total. Both paths sum to `total`; only the shape differs.
 */
export function splitIntoInstallments(total: Money, count: number): Money[] {
  if (count <= 0) return [];
  if (count === 1) return [total];

  const scale = scaleOf(total.currency);
  /* Round the repeated figure up to a whole unit of the currency — a whole
     dollar, a whole dinar — which is the granularity a schedule is agreed at. */
  const per = Math.ceil(total.amount / count / scale) * scale;
  const last = total.amount - per * (count - 1);

  if (last > 0 && last <= per) {
    return Array.from({ length: count }, (_, i) => ({
      amount: i === count - 1 ? last : per,
      currency: total.currency,
    }));
  }

  /* Largest remainder: base for everyone, one extra minor unit to the first
     `remainder` of them. Sums to `total` by construction. */
  const base = Math.floor(total.amount / count);
  const remainder = total.amount - base * count;
  return Array.from({ length: count }, (_, i) => ({
    amount: base + (i < remainder ? 1 : 0),
    currency: total.currency,
  }));
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
  const scale = 10 ** MINOR_UNITS[toCurrency];
  /* Round in whole units, not minor ones, so the step reads as a round number
     to a person rather than to the storage format. */
  const round = (step: number) => roundMinor(converted.amount / (step * scale)) * step * scale;

  /* ⚠ A STEP TOO COARSE FOR THE FIGURE ROUNDS IT AWAY. The dinar step is a
     million, so anything under half a million came back as "≈ 0 IQD" — true of
     a $375 commission, and of any rent under about $382. Zero is not an
     approximation of a real amount, it is a wrong answer, so the step drops by
     powers of ten until the figure survives it. */
  let step = APPROX_STEP[toCurrency];
  let rounded = round(step);
  while (rounded === 0 && converted.amount !== 0 && step > 1) {
    step /= 10;
    rounded = round(step);
  }
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

/* ----------------------------------------------------------------------------
   Amounts in words

   A contract prints every figure twice: once in digits and once spelled out —
   `140,000 $ [ One hundred forty thousand Dollar USD ]`. The words are not
   decoration. They are the anti-tampering device that has been on financial
   paper for centuries: a digit can be altered with one stroke of a pen, a
   sentence cannot, and where the two disagree the words are what a court reads.

   That is also why this is written here rather than pulled from a package. The
   spelled-out amount has to agree with `formatMoney` EXACTLY — same rounding,
   same minor units, same display precision — and the only way to guarantee that
   is to build both from the same integer.
   ------------------------------------------------------------------------- */

/**
 * How one language spells a number, as data rather than as code.
 *
 * Three languages compose numbers differently and the differences are not
 * cosmetic: Arabic says the units BEFORE the tens ("واحد وعشرون" — one and
 * twenty), and both Arabic and Kurdish build their hundreds as single words
 * rather than as "three" + "hundred". Encoding that as a table per language and
 * ONE composer below keeps the three in step; three hand-written composers
 * would drift the first time any of them was corrected.
 */
interface NumberWords {
  /** 0–19, spelled out individually — every language here is irregular below 20. */
  ones: string[];
  /** Tens, indexed by the tens digit: index 2 is twenty. 0 and 1 are unused. */
  tens: string[];
  /** Hundreds, indexed by the hundreds digit: index 1 is one hundred. */
  hundreds: string[];
  /** Thousand / million / billion, indexed by group. Index 0 (units) is "". */
  scales: string[];
  /** Joins tens to units, and hundreds to the rest: "and" in Arabic/Kurdish. */
  and: string;
  /**
   * Whether `and` is written joined to the word that follows it.
   *
   * Arabic's waw is a clitic — مائة وأربعون is one orthographic unit and
   * "مائة و أربعون" with a space is simply misspelled. Kurdish writes the same
   * conjunction as a free word (سەد و چل). The difference is orthography, not
   * style, so it is stated per language rather than guessed at the call site.
   */
  andAttaches: boolean;
  /** True where units are spoken before tens — Arabic. */
  unitsBeforeTens: boolean;
  /**
   * Plural scale words, used when the group counting them is 3–10.
   *
   * Arabic counts 3–10 with a plural noun (ثلاثة آلاف) and 11 upwards with the
   * singular (أحد عشر ألفاً). Absent for languages whose scale word does not
   * inflect. See the review note on `moneyToWords`.
   */
  scalePlurals?: string[];
  /** Dual scale words (exactly two): Arabic ألفان rather than اثنان ألف. */
  scaleDuals?: string[];
  /**
   * Whether a leading "one" is dropped before a scale word — Arabic ألف and
   * Kurdish هەزار both mean "one thousand" on their own, where English needs
   * the "one" ("one thousand", never "thousand").
   */
  omitOneBeforeScale: boolean;
  /** Currency names, singular, as a contract states them. */
  currency: Record<CurrencyCode, { major: string; minor: string }>;
  /** Joins the whole part to the fractional part. */
  fractionJoin: string;
  /** Prefix for a negative amount — a credit note reads as one. */
  minus: string;
}

const WORDS_EN: NumberWords = {
  ones: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"],
  tens: ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"],
  hundreds: ["", "one hundred", "two hundred", "three hundred", "four hundred", "five hundred", "six hundred", "seven hundred", "eight hundred", "nine hundred"],
  scales: ["", "thousand", "million", "billion", "trillion"],
  and: "",
  andAttaches: false,
  unitsBeforeTens: false,
  omitOneBeforeScale: false,
  currency: { USD: { major: "Dollar", minor: "Cent" }, IQD: { major: "Dinar", minor: "Fils" } },
  fractionJoin: "and",
  minus: "minus",
};

const WORDS_AR: NumberWords = {
  ones: ["صفر", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"],
  tens: ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"],
  hundreds: ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"],
  scales: ["", "ألف", "مليون", "مليار", "تريليون"],
  and: "و",
  andAttaches: true,
  unitsBeforeTens: true,
  scalePlurals: ["", "آلاف", "ملايين", "مليارات", "تريليونات"],
  scaleDuals: ["", "ألفان", "مليونان", "ملياران", "تريليونان"],
  omitOneBeforeScale: true,
  currency: { USD: { major: "دولار", minor: "سنت" }, IQD: { major: "دينار", minor: "فلس" } },
  fractionJoin: "و",
  minus: "سالب",
};

const WORDS_KU: NumberWords = {
  ones: ["سفر", "یەک", "دوو", "سێ", "چوار", "پێنج", "شەش", "حەوت", "هەشت", "نۆ", "دە", "یازدە", "دوازدە", "سێزدە", "چواردە", "پازدە", "شازدە", "حەڤدە", "هەژدە", "نۆزدە"],
  tens: ["", "", "بیست", "سی", "چل", "پەنجا", "شەست", "حەفتا", "هەشتا", "نەوەد"],
  hundreds: ["", "سەد", "دووسەد", "سێسەد", "چوارسەد", "پێنجسەد", "شەشسەد", "حەوتسەد", "هەشتسەد", "نۆسەد"],
  scales: ["", "هەزار", "ملیۆن", "ملیار", "تریلیۆن"],
  and: "و",
  andAttaches: false,
  unitsBeforeTens: false,
  omitOneBeforeScale: true,
  currency: { USD: { major: "دۆلار", minor: "سەنت" }, IQD: { major: "دینار", minor: "فلس" } },
  fractionJoin: "و",
  minus: "سالب",
};

const WORD_TABLES: Record<Lang, NumberWords> = { en: WORDS_EN, ar: WORDS_AR, ku: WORDS_KU };

/** Join non-empty parts with single spaces — every composition step below can
    legitimately produce nothing (a group of zero, an absent joiner). */
function joinWords(parts: (string | undefined)[]): string {
  return parts.filter((p) => p && p.length > 0).join(" ");
}

/** `a` and `b` with the language's conjunction between them, written joined or
    free according to `andAttaches`. */
function joinWithAnd(a: string, b: string, w: NumberWords): string {
  if (a.length === 0) return b;
  if (b.length === 0) return a;
  if (w.and.length === 0) return joinWords([a, b]);
  return w.andAttaches ? joinWords([a, w.and + b]) : joinWords([a, w.and, b]);
}

/** 0–999 in words. Returns "" for zero: a zero group inside a larger number
    contributes nothing, and a whole zero is handled by `integerToWords`. */
function tripleToWords(n: number, w: NumberWords): string {
  if (n === 0) return "";
  const head = w.hundreds[Math.floor(n / 100)] ?? "";
  const rest = n % 100;

  let tail = "";
  if (rest > 0 && rest < 20) {
    tail = w.ones[rest] ?? "";
  } else if (rest >= 20) {
    const tensWord = w.tens[Math.floor(rest / 10)] ?? "";
    const unitsWord = rest % 10 > 0 ? (w.ones[rest % 10] ?? "") : "";
    if (unitsWord.length === 0) tail = tensWord;
    /* Arabic speaks the unit first and joins with "و": واحد وعشرون. English
       hyphenates instead, which is why its table carries no joiner at all. */
    else if (w.unitsBeforeTens) tail = joinWithAnd(unitsWord, tensWord, w);
    else if (w.and.length > 0) tail = joinWithAnd(tensWord, unitsWord, w);
    else tail = tensWord + "-" + unitsWord;
  }

  return joinWithAnd(head, tail, w);
}

/**
 * One group of three with its scale word attached — "two hundred thousand".
 *
 * The scale word inflects with the count in Arabic, which is why this is a
 * function rather than a concatenation: ألف for one, ألفان for two, آلاف for
 * three to ten, and back to ألف from eleven up. English and Kurdish ignore all
 * of it and fall through to the plain scale word.
 */
function groupToWords(group: number, scaleIndex: number, w: NumberWords): string {
  const plainScale = w.scales[scaleIndex] ?? "";
  if (scaleIndex === 0) return tripleToWords(group, w);

  /* "ألف" and "هەزار" already mean ONE thousand; prefixing a "one" would read
     as a learner wrote it. English needs the "one" and keeps it. */
  if (group === 1 && w.omitOneBeforeScale) return plainScale;
  if (group === 2 && w.scaleDuals) return w.scaleDuals[scaleIndex] ?? plainScale;
  const scale = group >= 3 && group <= 10 && w.scalePlurals ? (w.scalePlurals[scaleIndex] ?? plainScale) : plainScale;
  return joinWords([tripleToWords(group, w), scale]);
}

/**
 * A non-negative integer in words. Split into groups of three from the right,
 * each group spelled out and given its scale word.
 *
 * A group of zero is SKIPPED rather than spelled: 943,200,000 reads "nine
 * hundred forty-three million two hundred thousand", never "... zero thousand".
 */
function integerToWords(value: number, w: NumberWords): string {
  if (value === 0) return w.ones[0] ?? "";
  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }
  let text = "";
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const group = groups[i] ?? 0;
    if (group === 0) continue;
    /* Groups are joined with the conjunction too, in the languages that use one:
       "تسعمائة وثلاثة وأربعون مليون ومائتا ألف". English simply spaces them. */
    text = joinWithAnd(text, groupToWords(group, i, w), w);
  }
  return text;
}

/** Capitalise the first letter. English only — Arabic and Kurdish scripts have
    no case, so applying one would be a no-op at best. */
function capitaliseFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * AN AMOUNT SPELLED OUT, for the bracketed half of a contract line.
 *
 * `140,000 $ [ One hundred forty thousand Dollar USD ]`
 *
 * Built from the SAME integer `formatMoney` prints, rounded to the SAME
 * displayed precision (DISPLAY_DECIMALS), so the digits and the words can never
 * disagree — which is the entire point of printing both. A dinar shows no
 * subunit because dinars are not quoted in fils; a dollar shows cents only when
 * there are any, because "and zero Cent" reads as though a machine wrote it.
 *
 * The ISO code is part of the output, not something the caller appends: "one
 * hundred forty thousand Dollar" is ambiguous across every dollar in the world,
 * and the code is what removes the ambiguity on a document that binds people.
 *
 * ⚠ EXACT, like `formatMoney`. This never converts and never approximates, so
 * it is safe on a contract, an invoice and a receipt — which is where it
 * belongs, and the only place it is used.
 */
export function moneyToWords(m: Money, lang: Lang): string {
  const w = WORD_TABLES[lang] ?? WORDS_EN;
  const names = w.currency[m.currency];

  const stored = MINOR_UNITS[m.currency];
  const shown = DISPLAY_DECIMALS[m.currency];
  const negative = m.amount < 0;
  const abs = Math.abs(m.amount);
  /* Rescale to the SHOWN precision first, rounding exactly as formatMoney does —
     a 999.6-dinar amount prints as 1,000 and must therefore read "one thousand". */
  const scaled = shown >= stored ? abs * 10 ** (shown - stored) : roundMinor(abs / 10 ** (stored - shown));
  const divisor = 10 ** shown;
  const whole = Math.trunc(scaled / divisor);
  const fraction = scaled % divisor;

  let text = joinWords([integerToWords(whole, w), names.major]);
  if (fraction > 0) {
    const cents = joinWords([integerToWords(fraction, w), names.minor]);
    /* The same clitic rule as everywhere else — Arabic writes ودولار joined,
       English writes a free "and". */
    text = w.andAttaches ? joinWords([text, w.fractionJoin + cents]) : joinWords([text, w.fractionJoin, cents]);
  }
  text = joinWords([negative ? w.minus : "", text, m.currency]);
  return lang === "en" ? capitaliseFirst(text) : text;
}
