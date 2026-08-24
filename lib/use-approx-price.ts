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
  const { lang } = useLang();
  const { settings } = usePlatformSettings();
  const on = settings.listings.showApproxPrice;
  const asOf = settings.listings.ratesUpdatedOn;

  return useCallback(
    (m: Money) => {
      if (!on) return null;
      const to = approxTarget(settings, m.currency);
      if (!to || to === m.currency) return null;
      /* The rate is quoted per unit of the DEFAULT currency, so converting the
         other way is the reciprocal — getting this backwards is the difference
         between "≈ 1.1 billion dinars" and "≈ 527 dinars". */
      const dflt = settings.general.defaultCurrency;
      const rate = m.currency === dflt ? rateFor(settings, to) : 1 / rateFor(settings, m.currency);
      return formatApprox(lang, m, to, rate, asOf);
    },
    [lang, on, asOf, settings],
  );
}
