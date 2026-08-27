"use client";

import { useCallback } from "react";
import { useLang } from "@/lib/i18n";
import { formatApprox, type Money } from "@/lib/money";
import { approxTarget, rateFor, usePlatformSettings } from "@/lib/platform-settings";

/**
 * The optional "≈ 1,113,500,000 IQD · 30 Jun 2026" line shown under a price on
 * the public site.
 *
 * A CONVENIENCE, and deliberately off by default (Settings → Listings →
 * `showApproxPrice`). Nothing depends on it: every surface that uses it renders
 * the real price first and this underneath, so turning it off — or dropping it
 * entirely — changes nothing else.
 *
 * Returns `null` when the toggle is off, when there is no other currency to
 * convert into, or when the price is already in that currency. Callers render
 * the line only when they get a string back, which keeps the "is this even
 * applicable" decision here rather than repeated at every call site.
 *
 * ⚠ Public browsing surfaces only — listing cards and the PDP. Never a contract,
 * an invoice, a receipt or a payment: those read the rate frozen on their deal.
 * See formatApprox in lib/money.
 */
export function useApproxPrice(): (m: Money) => string | null {
  const { settings } = usePlatformSettings();
  const on = settings.listings.showApproxPrice;
  const approx = useApproxGuidance();

  return useCallback((m: Money) => (on ? approx(m) : null), [on, approx]);
}

/**
 * The same "≈ 917,000 IQD · 18 Aug" line, shown UNDER A MONEY INPUT while
 * somebody is filling a form in.
 *
 * Separate from `useApproxPrice` for two reasons, and both matter:
 *
 * 1. IT IS NOT GATED on Settings → Listings → `showApproxPrice`. That toggle
 *    decides what MEMBERS see while browsing the public website. This line is
 *    an aid for the member of staff at the keyboard, agreeing a number with two
 *    people sitting across the desk from them, and turning off a website
 *    feature has nothing to do with whether they get it.
 *
 * 2. ⚠ IT IS GUIDANCE, NEVER A TERM. It converts at TODAY'S settings rate, and
 *    that rate moves. The contract prints ONE currency and the approximate
 *    figure never appears on it — putting it there would make an estimate
 *    somebody typed into a settings box last Tuesday into something a court
 *    could enforce. Nothing computed here is stored: it is derived at render
 *    from the amount in the field, and it disappears with the form.
 *
 * The rule this sits under is unchanged: `formatApprox` is forbidden on
 * contracts, invoices, receipts and payment records. A form input is none of
 * those — it is the thing you use BEFORE there is a record.
 */
export function useApproxGuidance(): (m: Money) => string | null {
  const { lang } = useLang();
  const { settings } = usePlatformSettings();
  const asOf = settings.listings.ratesUpdatedOn;

  return useCallback(
    (m: Money) => {
      const to = approxTarget(settings, m.currency);
      if (!to || to === m.currency) return null;
      /* The rate is quoted per unit of the DEFAULT currency, so converting the
         other way is the reciprocal — getting this backwards is the difference
         between "≈ 1.1 billion dinars" and "≈ 527 dinars". */
      const dflt = settings.general.defaultCurrency;
      const rate = m.currency === dflt ? rateFor(settings, to) : 1 / rateFor(settings, m.currency);
      return formatApprox(lang, m, to, rate, asOf);
    },
    [lang, asOf, settings],
  );
}
