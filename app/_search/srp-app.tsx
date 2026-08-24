"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/navigation";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useSaveGate, type SavedProperty } from "@/lib/favorites";
import { usePublicCatalog } from "@/lib/public-catalog";
import { formatPrice, money, normaliseFor, type CurrencyCode } from "@/lib/money";
import { rateFor, usePlatformSettings } from "@/lib/platform-settings";
import * as D from "./data";
import { rangeLabel } from "./labels";
import { emptyFilters, type Filters, type RangeVal } from "./types";
import { SrpFilters } from "./srp-filters";
import { SrpResults } from "./srp-results";

const detectCity = (q: string): string | null => {
  const s = (q || "").toLowerCase();
  if (s.includes("erbil") || s.includes("ankawa") || s.includes("gulan") || s.includes("english village") || s.includes("empire") || s.includes("dream city") || s.includes("naz city")) return "Erbil";
  if (s.includes("duhok") || s.includes("masike") || s.includes("malta")) return "Duhok";
  if (s.includes("sulay") || s.includes("suli") || s.includes("salim") || s.includes("sarchnar")) return "Sulaymaniyah";
  return null;
};

/** Parse a `lo-hi` URL range. An exact bucket match is recorded as a preset so
    the filter panel shows it selected; anything else is a custom range. */
function parseRangeParam(raw: string | null, buckets: { value: string }[]): RangeVal | null {
  if (!raw) return null;
  const parts = raw.split("-");
  const lo = parts[0] !== "" && parts[0] != null ? Number(parts[0]) : null;
  const hi = parts[1] !== "" && parts[1] != null ? Number(parts[1]) : null;
  if (lo == null && hi == null) return null;
  const match = buckets.find((p) => p.value === raw);
  return match ? { lo, hi, preset: match.value } : { lo, hi, custom: true };
}

/**
 * Sort, with prices normalised to ONE currency first.
 *
 * On raw numbers a 4,500,000 IQD flat sorts above an $850,000 villa, which is
 * simply wrong — it is about a quarter the price. Every comparison goes through
 * `normaliseFor`, the single place a cross-currency approximation is allowed to
 * happen, and the result is used ONLY to order the list: each card still renders
 * its own real price via formatMoney, and the normalised figure never appears.
 */
function sortListings(list: D.SrpListing[], sort: string, to: CurrencyCode, rate: (c: CurrencyCode) => number) {
  const arr = [...list];
  const norm = (l: D.SrpListing) => normaliseFor(l.price, to, rate(l.price.currency));
  if (sort === "price-asc") return arr.sort((a, b) => norm(a) - norm(b));
  if (sort === "price-desc") return arr.sort((a, b) => norm(b) - norm(a));
  if (sort === "newest") {
    const rank = (l: D.SrpListing) => (l.pstatus === "new" || l.status === "New" ? 0 : 1);
    return arr.sort((a, b) => rank(a) - rank(b));
  }
  if (sort === "recommended") return arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  return arr; // "default" → natural order
}

export function SrpApp() {
  const params = useSearchParams();
  const { t, lang } = useLang();
  const { settings } = usePlatformSettings();
  const defaultCurrency = settings.general.defaultCurrency;
  /* Units of `c` per 1 unit of the default currency — the browsing rate, used
     for sorting and range matching only, never for a figure on screen. */
  const rate = useMemo(() => (c: CurrencyCode) => rateFor(settings, c), [settings]);
  // Live listings from the admin catalog (reflects featured/status edits without
  // a reload). Falls back to the seed when there's no stored data.
  const { siteProperties } = usePublicCatalog();
  const listings = useMemo(() => D.srpListings(siteProperties), [siteProperties]);

  const init = useMemo(() => {
    const f: Filters = { ...emptyFilters };
    const dealVal = params.get("deal") === "rent" ? "rent" : "buy";
    const type = params.get("type");
    const bedsParam = params.get("beds");
    if (type && D.propertyTypes.some((t) => t.value === type)) f.types = [type];
    if (bedsParam && D.beds.some((b) => b.value === bedsParam)) f.beds = bedsParam;
    /* The filter currency rides in the URL like every other filter value, so a
       shared link reopens the search someone was actually looking at. An
       unrecognised code falls back to the platform default rather than throwing
       — a hand-edited URL should not blank the page. */
    const curParam = params.get("cur");
    f.priceCurrency = curParam === "USD" || curParam === "IQD" ? curParam : defaultCurrency;
    f.price = parseRangeParam(params.get("price"), D.presetsFor(dealVal, f.priceCurrency));
    f.size = parseRangeParam(params.get("size"), D.sizePresets);
    return { deal: dealVal as "buy" | "rent", query: params.get("q") || "", filters: f };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deal (buy/rent) tracks the live URL so the breadcrumb, results, and header
  // nav stay in sync when switching via the header links (client-side nav).
  const deal: "buy" | "rent" = params.get("deal") === "rent" ? "rent" : "buy";
  const [query, setQuery] = useState(init.query);
  const [sort, setSort] = useState("default");
  const [view, setView] = useState("grid");
  const [filters, setFilters] = useState<Filters>(init.filters);
  const [page, setPage] = useState(1);
  const { properties: savedProps, saveProperty } = useSaveGate();
  const favorites = useMemo(() => savedProps.map((p) => p.id), [savedProps]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const asideScrollRef = useRef<HTMLDivElement>(null);

  // premium fade overlays — only when content overflows that edge
  useEffect(() => {
    const el = asideScrollRef.current;
    if (!el) return;
    const aside = el.closest(".srp-aside");
    if (!aside) return;
    const update = () => {
      aside.classList.toggle("is-fade-top", el.scrollTop > 2);
      aside.classList.toggle("is-fade-bottom", el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const on = {
    toggleCity: (v: string) =>
      setFilters((f) => {
        const cities = f.cities.includes(v) ? f.cities.filter((x) => x !== v) : [...f.cities, v];
        // Re-scope areas/projects to the new city selection; drop out-of-scope picks.
        const validAreas = new Set(D.areaOptions(cities).map((o) => o.value));
        const validProjects = new Set(D.projectOptions(cities).map((o) => o.value));
        return {
          ...f,
          cities,
          areas: f.areas.filter((a) => validAreas.has(a)),
          projects: f.projects.filter((p) => validProjects.has(p)),
        };
      }),
    toggleArea: (v: string) => setFilters((f) => ({ ...f, areas: f.areas.includes(v) ? f.areas.filter((x) => x !== v) : [...f.areas, v] })),
    toggleProject: (v: string) => setFilters((f) => ({ ...f, projects: f.projects.includes(v) ? f.projects.filter((x) => x !== v) : [...f.projects, v] })),
    toggleType: (v: string) => setFilters((f) => ({ ...f, types: f.types.includes(v) ? f.types.filter((x) => x !== v) : [...f.types, v] })),
    setPrice: (p: RangeVal | null) => setFilters((f) => ({ ...f, price: p })),
    /* Switching currency drops any active range. The two ladders are different
       numbers, so carrying "150000–400000" across to dinars would silently mean
       a ~$115–305 band and return nothing — which reads as a broken filter
       rather than as a unit change. */
    setPriceCurrency: (c: CurrencyCode) => setFilters((f) => (f.priceCurrency === c ? f : { ...f, priceCurrency: c, price: null })),
    setSize: (p: RangeVal | null) => setFilters((f) => ({ ...f, size: p })),
    setBeds: (v: string) => setFilters((f) => ({ ...f, beds: f.beds === v ? "" : v })),
    setBaths: (v: string) => setFilters((f) => ({ ...f, baths: f.baths === v ? "" : v })),
    toggleAmenity: (v: string) => setFilters((f) => ({ ...f, amenities: f.amenities.includes(v) ? f.amenities.filter((x) => x !== v) : [...f.amenities, v] })),
    toggleStatus: (v: string) => setFilters((f) => ({ ...f, pstatus: f.pstatus.includes(v) ? f.pstatus.filter((x) => x !== v) : [...f.pstatus, v] })),
  };

  /* Clearing filters keeps the currency the member is browsing in — it is how
     they read prices, not a filter they set. */
  const clearAll = () => setFilters({ ...emptyFilters, priceCurrency: filters.priceCurrency });

  /** Display snapshot persisted when a search result is saved. The price is
      frozen as TEXT at save time, in the listing's own currency. */
  const toSavedProperty = (l: D.SrpListing): SavedProperty => ({
    id: l.id,
    image: l.cover,
    price: formatPrice(lang, l.price),
    period: l.deal === "rent" ? "mo" : undefined,
    title: l.title,
    address: l.address,
    beds: l.beds,
    baths: l.baths,
    area: l.area,
    status: l.status,
    href: `/property/${l.id}`,
  });

  const toggleFav = (id: string) => {
    const l = listings.find((x) => x.id === id);
    if (l) saveProperty(toSavedProperty(l));
  };

  const activeCount =
    filters.cities.length +
    filters.areas.length +
    filters.projects.length +
    filters.types.length +
    (filters.price ? 1 : 0) +
    (filters.size ? 1 : 0) +
    (filters.beds !== "" ? 1 : 0) +
    (filters.baths !== "" ? 1 : 0) +
    filters.amenities.length +
    filters.pstatus.length;

  const city = detectCity(query);
  const baseline = activeCount === 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = listings.filter((l) => l.deal === deal);
    if (q) list = list.filter((l) => (l.city + " " + l.address + " " + l.title + " " + l.type).toLowerCase().includes(q));
    if (filters.cities.length) list = list.filter((l) => filters.cities.includes(l.city));
    if (filters.areas.length) list = list.filter((l) => filters.areas.some((a) => l.address.toLowerCase().includes(a.toLowerCase())));
    if (filters.projects.length) list = list.filter((l) => filters.projects.some((p) => l.address.toLowerCase().includes(p.toLowerCase())));
    if (filters.types.length) list = list.filter((l) => filters.types.includes(l.type));
    if (filters.price) {
      /* Both sides are normalised into the FILTER's currency, so a dinar-priced
         listing is matched against a dollar range at the current rate (and vice
         versa) rather than being excluded for being in the wrong units. The
         boundaries are whole units, so they go through money() to compare like
         with like. A listing near an edge can drift in or out as the rate moves
         — the note under the filter says so. */
      const cur = filters.priceCurrency;
      const lo = filters.price.lo != null ? money(filters.price.lo, cur).amount : null;
      const hi = filters.price.hi != null ? money(filters.price.hi, cur).amount : null;
      list = list.filter((l) => {
        const n = normaliseFor(l.price, cur, rate(l.price.currency));
        return (lo == null || n >= lo) && (hi == null || n <= hi);
      });
    }
    if (filters.size) list = list.filter((l) => l.area != null && (filters.size!.lo == null || l.area >= filters.size!.lo) && (filters.size!.hi == null || l.area <= filters.size!.hi));
    if (filters.beds !== "") list = list.filter((l) => (l.beds || 0) >= Number(filters.beds));
    if (filters.baths !== "") list = list.filter((l) => (l.baths || 0) >= Number(filters.baths));
    if (filters.amenities.length) list = list.filter((l) => filters.amenities.every((a) => (l.amenities || []).includes(a)));
    return sortListings(list, sort, defaultCurrency, rate);
  }, [listings, deal, query, filters, sort, rate, defaultCurrency]);

  // Honest count — the real number of available listings matching the current
  // deal + query + filters (no inflated placeholder totals).
  const total = results.length;

  // Simulated load on any change — drives the skeleton cards (faithful to the export).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 460);
    return () => clearTimeout(t);
  }, [deal, query, filters, sort, view]);

  // A change to the result set (not the view) returns to the first page.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [deal, query, filters, sort]);

  // active chips (filters only — never the search query)
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  const allAreas = D.areaOptions([]);
  const allProjects = D.projectOptions([]);
  const labelOf = (opts: D.Opt[], v: string) => opts.find((o) => o.value === v)?.label ?? v;
  filters.cities.forEach((c) => {
    chips.push({ key: "city-" + c, label: t("city." + c), onRemove: () => on.toggleCity(c) });
  });
  filters.areas.forEach((a) => {
    chips.push({ key: "area-" + a, label: labelOf(allAreas, a), onRemove: () => on.toggleArea(a) });
  });
  filters.projects.forEach((p) => {
    chips.push({ key: "project-" + p, label: labelOf(allProjects, p), onRemove: () => on.toggleProject(p) });
  });
  filters.types.forEach((ty) => {
    chips.push({ key: "type-" + ty, label: t("type." + ty), onRemove: () => on.toggleType(ty) });
  });
  /* Chip labels are generated here, not read off the stored filter, so they
     follow the active language and the active filter currency. */
  if (filters.price) chips.push({ key: "price", label: rangeLabel(t, lang, filters.price, "price", filters.priceCurrency, deal), onRemove: () => on.setPrice(null) });
  if (filters.size) chips.push({ key: "size", label: rangeLabel(t, lang, filters.size, "size", filters.priceCurrency, deal), onRemove: () => on.setSize(null) });
  if (filters.beds !== "") {
    const o = D.beds.find((x) => x.value === filters.beds);
    chips.push({ key: "beds", label: o?.value === "0" ? t("srp.studio") : o ? o.label + " " + t("srp.sec.beds") : "", onRemove: () => on.setBeds("") });
  }
  if (filters.baths !== "") {
    const o = D.baths.find((x) => x.value === filters.baths);
    chips.push({ key: "baths", label: o ? o.label + " " + t("srp.sec.baths") : "", onRemove: () => on.setBaths("") });
  }
  filters.amenities.forEach((a) => {
    chips.push({ key: "amen-" + a, label: t("amen." + a), onRemove: () => on.toggleAmenity(a) });
  });

  const dealLabel = deal === "rent" ? t("deal.rent") : t("deal.buy");
  const current = city ? t("city." + city) : (query && query.trim()) || t("srp.kurdistan");

  const filterPanel = <SrpFilters deal={deal} f={filters} on={on} activeCount={activeCount} onClearAll={clearAll} listings={listings} />;

  return (
    <>
      <div className="srp-top">
        <div className="srp-top__crumb">
          <Breadcrumb
            items={[
              { label: t("srp.crumb.home"), href: "/" },
              { label: dealLabel, href: "/search?deal=" + deal },
              { label: current },
            ]}
          />
        </div>
      </div>

      <main className="srp-main">
        <div className="srp-layout">
          <aside className="srp-aside">
            <div className="srp-aside__fade srp-aside__fade--top" aria-hidden="true" />
            <div className="srp-aside__scroll" ref={asideScrollRef}>
              {filterPanel}
            </div>
            <div className="srp-aside__fade srp-aside__fade--bottom" aria-hidden="true" />
          </aside>

          <SrpResults
            results={results}
            total={total}
            baseline={baseline}
            city={city}
            query={query}
            setQuery={setQuery}
            view={view}
            sort={sort}
            setSort={setSort}
            setView={setView}
            page={page}
            setPage={setPage}
            onSearch={() => {}}
            onOpenFilters={() => setDrawerOpen(true)}
            chips={chips}
            onClearAll={clearAll}
            loading={loading}
            favorites={favorites}
            onFavorite={toggleFav}
            deal={deal}
          />
        </div>
      </main>

      {/* mobile drawer */}
      <div className={"srp-drawer" + (drawerOpen ? " srp-drawer--open" : "")}>
        <div className="srp-drawer__scrim" onClick={() => setDrawerOpen(false)} />
        <div className="srp-drawer__sheet">
          <div className="srp-drawer__head">
            <span className="srp-drawer__title">{t("srp.filters")}</span>
            <button type="button" className="srp-drawer__close" aria-label={t("srp.closeFilters")} onClick={() => setDrawerOpen(false)}>
              <Icon name="x" size={20} />
            </button>
          </div>
          <div className="srp-drawer__body">{filterPanel}</div>
          <div className="srp-drawer__foot">
            <button type="button" className="srp-drawer__apply" onClick={() => setDrawerOpen(false)}>
              {t("srp.show")} {baseline ? total.toLocaleString("en-US") : results.length} {t("srp.resultsLower")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
