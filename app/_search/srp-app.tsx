"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Breadcrumb } from "@/components/navigation";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import * as D from "./data";
import { emptyFilters, type Filters, type RangeVal } from "./types";
import { SrpFilters } from "./srp-filters";
import { SrpResults } from "./srp-results";

const detectCity = (q: string): string | null => {
  const s = (q || "").toLowerCase();
  if (s.includes("erbil") || s.includes("ankawa") || s.includes("shaqlawa") || s.includes("dream city") || s.includes("empire")) return "Erbil";
  if (s.includes("duhok") || s.includes("sarsang") || s.includes("azadi") || s.includes("masike")) return "Duhok";
  if (s.includes("sulay") || s.includes("suli") || s.includes("goizha")) return "Sulaymaniyah";
  return null;
};

const commasNum = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function rangeLabel(lo: number | null, hi: number | null, d: string, kind: string) {
  if (kind === "size") {
    return (lo != null ? commasNum(lo) : "Any") + " – " + (hi != null ? commasNum(hi) : "Any") + " m²";
  }
  const suffix = d === "rent" ? "/mo" : "";
  return (lo != null ? "$" + commasNum(lo) : "Any") + " – " + (hi != null ? "$" + commasNum(hi) : "Any") + suffix;
}

function parseRangeParam(raw: string | null, presets: D.Opt[], d: string, kind: string): RangeVal | null {
  if (!raw) return null;
  const parts = raw.split("-");
  const lo = parts[0] !== "" && parts[0] != null ? Number(parts[0]) : null;
  const hi = parts[1] !== "" && parts[1] != null ? Number(parts[1]) : null;
  if (lo == null && hi == null) return null;
  const match = presets.find((p) => p.value === raw);
  if (match) return { lo, hi, label: match.label, preset: match.value };
  return { lo, hi, label: rangeLabel(lo, hi, d, kind), custom: true };
}

function sortListings(list: D.SrpListing[], sort: string) {
  const arr = [...list];
  if (sort === "price-asc") return arr.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return arr.sort((a, b) => b.price - a.price);
  if (sort === "most-viewed") return arr.sort((a, b) => (b.photoCount || 0) - (a.photoCount || 0));
  if (sort === "newest") {
    const rank = (l: D.SrpListing) => (l.pstatus === "new" || l.status === "New" ? 0 : 1);
    return arr.sort((a, b) => rank(a) - rank(b));
  }
  return arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

export function SrpApp() {
  const params = useSearchParams();
  const { t } = useLang();

  const init = useMemo(() => {
    const f: Filters = { ...emptyFilters };
    const dealVal = params.get("deal") === "rent" ? "rent" : "buy";
    const type = params.get("type");
    const bedsParam = params.get("beds");
    if (type && D.propertyTypes.some((t) => t.value === type)) f.types = [type];
    if (bedsParam && D.beds.some((b) => b.value === bedsParam)) f.beds = bedsParam;
    f.price = parseRangeParam(params.get("price"), dealVal === "rent" ? D.rentPresets : D.buyPresets, dealVal, "price");
    f.size = parseRangeParam(params.get("size"), D.sizePresets, dealVal, "size");
    return { deal: dealVal as "buy" | "rent", query: params.get("q") || "", filters: f };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deal (buy/rent) tracks the live URL so the breadcrumb, results, and header
  // nav stay in sync when switching via the header links (client-side nav).
  const deal: "buy" | "rent" = params.get("deal") === "rent" ? "rent" : "buy";
  const [query, setQuery] = useState(init.query);
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState("grid");
  const [filters, setFilters] = useState<Filters>(init.filters);
  const [favorites, setFavorites] = useState<string[]>([]);
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
    toggleType: (v: string) => setFilters((f) => ({ ...f, types: f.types.includes(v) ? f.types.filter((x) => x !== v) : [...f.types, v] })),
    setPrice: (p: RangeVal | null) => setFilters((f) => ({ ...f, price: p })),
    setSize: (p: RangeVal | null) => setFilters((f) => ({ ...f, size: p })),
    setBeds: (v: string) => setFilters((f) => ({ ...f, beds: f.beds === v ? "" : v })),
    setBaths: (v: string) => setFilters((f) => ({ ...f, baths: f.baths === v ? "" : v })),
    toggleAmenity: (v: string) => setFilters((f) => ({ ...f, amenities: f.amenities.includes(v) ? f.amenities.filter((x) => x !== v) : [...f.amenities, v] })),
    toggleStatus: (v: string) => setFilters((f) => ({ ...f, pstatus: f.pstatus.includes(v) ? f.pstatus.filter((x) => x !== v) : [...f.pstatus, v] })),
  };

  const clearAll = () => setFilters(emptyFilters);
  const browseAll = () => {
    setFilters(emptyFilters);
    setQuery("");
  };
  const toggleFav = (id: string) => setFavorites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const activeCount =
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
    let list = D.listings.filter((l) => l.deal === deal);
    if (q) list = list.filter((l) => (l.city + " " + l.address + " " + l.title + " " + l.type).toLowerCase().includes(q));
    if (filters.types.length) list = list.filter((l) => filters.types.includes(l.type));
    if (filters.price) list = list.filter((l) => (filters.price!.lo == null || l.price >= filters.price!.lo) && (filters.price!.hi == null || l.price <= filters.price!.hi));
    if (filters.size) list = list.filter((l) => l.area != null && (filters.size!.lo == null || l.area >= filters.size!.lo) && (filters.size!.hi == null || l.area <= filters.size!.hi));
    if (filters.beds !== "") list = list.filter((l) => (l.beds || 0) >= Number(filters.beds));
    if (filters.baths !== "") list = list.filter((l) => (l.baths || 0) >= Number(filters.baths));
    if (filters.amenities.length) list = list.filter((l) => filters.amenities.every((a) => (l.amenities || []).includes(a)));
    return sortListings(list, sort);
  }, [deal, query, filters, sort]);

  const total = baseline ? (city ? D.BASE_COUNT[city] : 1284) : results.length;

  // Simulated load on any change — drives the skeleton cards (faithful to the export).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 460);
    return () => clearTimeout(t);
  }, [deal, query, filters, sort, view]);

  // active chips (filters only — never the search query)
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.types.forEach((ty) => {
    chips.push({ key: "type-" + ty, label: t("type." + ty), onRemove: () => on.toggleType(ty) });
  });
  if (filters.price) chips.push({ key: "price", label: filters.price.label, onRemove: () => on.setPrice(null) });
  if (filters.size) chips.push({ key: "size", label: filters.size.label, onRemove: () => on.setSize(null) });
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

  const filterPanel = <SrpFilters deal={deal} f={filters} on={on} activeCount={activeCount} onClearAll={clearAll} />;

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
            onSearch={() => {}}
            onOpenFilters={() => setDrawerOpen(true)}
            chips={chips}
            onClearAll={clearAll}
            onBrowseAll={browseAll}
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
