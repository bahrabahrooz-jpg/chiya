const React = window.React;
const { Icon } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useEffect, useMemo, useRef } = React;

const A = window.SRP_DATA;
const BASE_COUNT = { Erbil: 248, Duhok: 86, Sulaymaniyah: 154 };

const detectCity = (q) => {
  const s = (q || "").toLowerCase();
  if (s.includes("erbil") || s.includes("ankawa") || s.includes("shaqlawa") || s.includes("dream city") || s.includes("empire")) return "Erbil";
  if (s.includes("duhok") || s.includes("sarsang") || s.includes("azadi") || s.includes("masike")) return "Duhok";
  if (s.includes("sulay") || s.includes("suli") || s.includes("goizha")) return "Sulaymaniyah";
  return null;
};

const emptyFilters = { types: [], price: null, size: null, beds: "", baths: "", amenities: [], pstatus: [] };

function sortListings(list, sort) {
  const arr = [...list];
  if (sort === "price-asc") return arr.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return arr.sort((a, b) => b.price - a.price);
  if (sort === "most-viewed") return arr.sort((a, b) => (b.photoCount || 0) - (a.photoCount || 0));
  if (sort === "newest") return arr.sort((a, b) => {
    const rank = (l) => (l.pstatus === "new" || l.status === "New" ? 0 : 1);
    return rank(a) - rank(b);
  });
  // recommended → featured first
  return arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
}

function App() {
  const { t } = window.CxLang.useLang();
  // ---- seed from URL params (handoff from homepage search) ----
  const commasNum = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const rangeLabel = (lo, hi, d, kind) => {
    if (kind === "size") {
      const a = lo != null ? commasNum(lo) : "Any";
      const b = hi != null ? commasNum(hi) : "Any";
      return a + " – " + b + " m²";
    }
    const suffix = d === "rent" ? "/mo" : "";
    const a = lo != null ? "$" + commasNum(lo) : "Any";
    const b = hi != null ? "$" + commasNum(hi) : "Any";
    return a + " – " + b + suffix;
  };
  const parseRangeParam = (raw, presets, d, kind) => {
    if (!raw) return null;
    const parts = raw.split("-");
    const lo = parts[0] !== "" && parts[0] != null ? Number(parts[0]) : null;
    const hi = parts[1] !== "" && parts[1] != null ? Number(parts[1]) : null;
    if (lo == null && hi == null) return null;
    const match = presets.find((p) => p.value === raw);
    if (match) return { lo, hi, label: match.label, preset: match.value };
    return { lo, hi, label: rangeLabel(lo, hi, d, kind), custom: true };
  };

  const initFromUrl = (() => {
    const p = new URLSearchParams(window.location.search);
    const f = { ...emptyFilters };
    const dealVal = p.get("deal") === "rent" ? "rent" : "buy";
    const type = p.get("type");
    const beds = p.get("beds");
    if (type && A.propertyTypes.some((t) => t.value === type)) f.types = [type];
    if (beds && A.beds.some((b) => b.value === beds)) f.beds = beds;
    f.price = parseRangeParam(p.get("price"), dealVal === "rent" ? A.rentPresets : A.buyPresets, dealVal, "price");
    f.size = parseRangeParam(p.get("size"), A.sizePresets, dealVal, "size");
    return {
      deal: dealVal,
      query: p.has("q") ? p.get("q") : "Erbil",
      filters: f,
    };
  })();

  const [deal, setDealRaw] = useState(initFromUrl.deal);
  const [query, setQuery] = useState(initFromUrl.query);
  const [sort, setSort] = useState("recommended");
  const [view, setView] = useState("grid");
  const [filters, setFilters] = useState(initFromUrl.filters);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const asideScrollRef = useRef(null);

  // ---- fade overlays: show only when there is hidden content above/below ----
  useEffect(() => {
    const el = asideScrollRef.current;
    if (!el) return;
    const aside = el.closest(".srp-aside");
    const update = () => {
      const top = el.scrollTop > 2;
      const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
      aside.classList.toggle("is-fade-top", top);
      aside.classList.toggle("is-fade-bottom", bottom);
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

  const setDeal = (d) => { setDealRaw(d); setFilters((f) => ({ ...f, price: null })); };

  // ---- filter handlers ----
  const on = {
    toggleType: (v) => setFilters((f) => ({ ...f, types: f.types.includes(v) ? f.types.filter((x) => x !== v) : [...f.types, v] })),
    setPrice: (p) => setFilters((f) => ({ ...f, price: p })),
    setSize: (p) => setFilters((f) => ({ ...f, size: p })),
    setBeds: (v) => setFilters((f) => ({ ...f, beds: f.beds === v ? "" : v })),
    setBaths: (v) => setFilters((f) => ({ ...f, baths: f.baths === v ? "" : v })),
    toggleAmenity: (v) => setFilters((f) => ({ ...f, amenities: f.amenities.includes(v) ? f.amenities.filter((x) => x !== v) : [...f.amenities, v] })),
    toggleStatus: (v) => setFilters((f) => ({ ...f, pstatus: f.pstatus.includes(v) ? f.pstatus.filter((x) => x !== v) : [...f.pstatus, v] })),
  };

  const clearAll = () => setFilters(emptyFilters);
  const browseAll = () => { setFilters(emptyFilters); setQuery(""); };

  const toggleFav = (id) => setFavorites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const activeCount =
    filters.types.length + (filters.price ? 1 : 0) + (filters.size ? 1 : 0) +
    (filters.beds !== "" ? 1 : 0) + (filters.baths !== "" ? 1 : 0) +
    filters.amenities.length + filters.pstatus.length;

  const city = detectCity(query);
  const baseline = activeCount === 0;

  // ---- filtering ----
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = A.listings.filter((l) => l.deal === deal);
    if (q) list = list.filter((l) => (l.city + " " + l.address + " " + l.title + " " + l.type).toLowerCase().includes(q));
    if (filters.types.length) list = list.filter((l) => filters.types.includes(l.type));
    if (filters.price) list = list.filter((l) =>
      (filters.price.lo == null || l.price >= filters.price.lo) && (filters.price.hi == null || l.price <= filters.price.hi));
    if (filters.size) list = list.filter((l) =>
      l.area != null && (filters.size.lo == null || l.area >= filters.size.lo) && (filters.size.hi == null || l.area <= filters.size.hi));
    if (filters.beds !== "") list = list.filter((l) => (l.beds || 0) >= Number(filters.beds));
    if (filters.baths !== "") list = list.filter((l) => (l.baths || 0) >= Number(filters.baths));
    if (filters.amenities.length) list = list.filter((l) => filters.amenities.every((a) => (l.amenities || []).includes(a)));
    if (filters.pstatus.length) list = list.filter((l) => filters.pstatus.includes(l.pstatus));
    return sortListings(list, sort);
  }, [deal, query, filters, sort]);

  const total = baseline ? (city ? BASE_COUNT[city] : 1284) : results.length;

  // ---- loading simulation on any change ----
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 460);
    return () => clearTimeout(t);
  }, [deal, query, filters, sort, view]);

  // ---- active chips (filters only — never the search query) ----
  const chips = [];
  filters.types.forEach((ty) => {
    const o = A.propertyTypes.find((x) => x.value === ty);
    chips.push({ key: "type-" + ty, label: o ? (o.tkey ? t(o.tkey) : o.label) : ty, onRemove: () => on.toggleType(ty) });
  });
  if (filters.price) chips.push({ key: "price", label: filters.price.label, onRemove: () => on.setPrice(null) });
  if (filters.size) chips.push({ key: "size", label: filters.size.label, onRemove: () => on.setSize(null) });
  if (filters.beds !== "") {
    const o = A.beds.find((x) => x.value === filters.beds);
    const lbl = (o && o.value === "0") ? t("srp.studio") : (o ? o.label + " " + t("srp.bedsSuffix") : "");
    chips.push({ key: "beds", label: lbl, onRemove: () => on.setBeds("") });
  }
  if (filters.baths !== "") {
    const o = A.baths.find((x) => x.value === filters.baths);
    chips.push({ key: "baths", label: o ? o.label + " " + t("srp.bathsSuffix") : "", onRemove: () => on.setBaths("") });
  }
  filters.amenities.forEach((a) => {
    const o = A.amenities.find((x) => x.value === a);
    chips.push({ key: "amen-" + a, label: o ? (o.tkey ? t(o.tkey) : o.label) : a, onRemove: () => on.toggleAmenity(a) });
  });
  filters.pstatus.forEach((p) => {
    const o = A.propertyStatus.find((x) => x.value === p);
    chips.push({ key: "pstatus-" + p, label: o ? (o.tkey ? t(o.tkey) : o.label) : p, onRemove: () => on.toggleStatus(p) });
  });

  const filterPanel = React.createElement(window.SrpFilters, {
    deal, setDeal, f: filters, on, activeCount, onClearAll: clearAll,
  });

  return React.createElement(React.Fragment, null,
    React.createElement(window.SrpHeader, { deal, onNav: (d) => { if (d === "buy") setDeal("buy"); else if (d === "rent") setDeal("rent"); } }),
    React.createElement(window.SrpSummary, {
      query, deal, city,
    }),
    React.createElement("main", { className: "srp-main" },
      React.createElement("div", { className: "srp-layout" },
        React.createElement("aside", { className: "srp-aside" },
          React.createElement("div", { className: "srp-aside__fade srp-aside__fade--top", "aria-hidden": "true" }),
          React.createElement("div", { className: "srp-aside__scroll", ref: asideScrollRef }, filterPanel),
          React.createElement("div", { className: "srp-aside__fade srp-aside__fade--bottom", "aria-hidden": "true" })),
        React.createElement(window.SrpResults, {
          results, total, baseline, city, query, setQuery, view,
          sort, setSort, setView, onSearch: () => {}, onOpenFilters: () => setDrawerOpen(true),
          chips, onClearAll: clearAll, onBrowseAll: browseAll, loading, favorites, onFavorite: toggleFav, deal,
        }))),

    React.createElement(window.SiteFooter),

    // mobile drawer
    React.createElement("div", { className: "srp-drawer" + (drawerOpen ? " srp-drawer--open" : "") },
      React.createElement("div", { className: "srp-drawer__scrim", onClick: () => setDrawerOpen(false) }),
      React.createElement("div", { className: "srp-drawer__sheet" },
        React.createElement("div", { className: "srp-drawer__head" },
          React.createElement("span", { className: "srp-drawer__title" }, t("srp.filters")),
          React.createElement("button", { type: "button", className: "srp-drawer__close", "aria-label": t("srp.closeFilters"), onClick: () => setDrawerOpen(false) },
            React.createElement(Icon, { name: "x", size: 20 }))),
        React.createElement("div", { className: "srp-drawer__body" }, filterPanel),
        React.createElement("div", { className: "srp-drawer__foot" },
          React.createElement("button", { type: "button", className: "srp-drawer__apply", onClick: () => setDrawerOpen(false) },
            t("srp.show") + " " + (baseline ? total.toLocaleString("en-US") : results.length) + " " + t("srp.resultsLower")))))
  );
}

function Root() {
  return React.createElement(window.CxLang.LangProvider, null, React.createElement(App));
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(Root));
