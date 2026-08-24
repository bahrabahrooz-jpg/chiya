import type { CurrencyCode } from "@/lib/money";

/**
 * A selected range — either one of the presets or a hand-typed custom one.
 *
 * Boundaries are WHOLE units in `Filters.priceCurrency` (or m² for size).
 *
 * There is deliberately NO `label` here. A label stored at selection time is a
 * translation frozen at that moment: pick "Up to $150K" in English, switch to
 * Arabic, and the chip stays English — and now that the figure depends on the
 * filter currency too, a stored label would go stale in a second way. Labels
 * are generated at render time by `rangeLabel` in ./labels.
 */
export interface RangeVal {
  lo: number | null;
  hi: number | null;
  preset?: string;
  custom?: boolean;
}

export interface Filters {
  cities: string[];
  areas: string[];
  projects: string[];
  types: string[];
  price: RangeVal | null;
  /**
   * The currency the price filter is expressed in.
   *
   * Filter STATE, not component state, for the same reason every other filter
   * value is: a shared URL and the back button have to reproduce the search
   * someone was actually looking at. A dinar browser sending a link that reopens
   * in dollars has shared the wrong search.
   *
   * Listings priced in the other currency still match, converted at the settings
   * rate — see normaliseFor() and the note under the filter.
   */
  priceCurrency: CurrencyCode;
  size: RangeVal | null;
  beds: string;
  baths: string;
  amenities: string[];
  pstatus: string[];
}

export interface FilterHandlers {
  toggleCity: (v: string) => void;
  toggleArea: (v: string) => void;
  toggleProject: (v: string) => void;
  toggleType: (v: string) => void;
  setPrice: (p: RangeVal | null) => void;
  /** Switching currency clears any active price range: the buckets are a
      different ladder, and a dollar range silently reinterpreted as dinars
      would filter to nothing and look broken. */
  setPriceCurrency: (c: CurrencyCode) => void;
  setSize: (p: RangeVal | null) => void;
  setBeds: (v: string) => void;
  setBaths: (v: string) => void;
  toggleAmenity: (v: string) => void;
  toggleStatus: (v: string) => void;
}

/* `priceCurrency` is seeded from the platform default by the search app, which
   has settings in scope; this constant only needs a valid starting value. */
export const emptyFilters: Filters = {
  cities: [],
  areas: [],
  projects: [],
  types: [],
  price: null,
  priceCurrency: "USD",
  size: null,
  beds: "",
  baths: "",
  amenities: [],
  pstatus: [],
};
