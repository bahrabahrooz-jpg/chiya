const React = window.React;
const { PropertyCard, MapPanel, Tag, Button, Icon, IconButton } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef, useEffect } = React;

const RD = window.SRP_DATA;

/* ---------- skeleton card ---------- */
function SkeletonCard() {
  return React.createElement("div", { className: "srp-skel" },
    React.createElement("div", { className: "srp-skel__img" }),
    React.createElement("div", { className: "srp-skel__body" },
      React.createElement("div", { className: "srp-skel__line srp-skel__line--price" }),
      React.createElement("div", { className: "srp-skel__line srp-skel__line--title" }),
      React.createElement("div", { className: "srp-skel__line srp-skel__line--addr" }),
      React.createElement("div", { className: "srp-skel__specs" },
        React.createElement("div", { className: "srp-skel__chip" }),
        React.createElement("div", { className: "srp-skel__chip" }),
        React.createElement("div", { className: "srp-skel__chip" }))));
}

/* ---------- empty state ---------- */
function EmptyState({ onClearAll, onBrowseAll }) {
  const { t } = window.CxLang.useLang();
  return React.createElement("div", { className: "srp-empty" },
    React.createElement("div", { className: "srp-empty__ic" }, React.createElement(Icon, { name: "search-x", size: 30 })),
    React.createElement("h3", { className: "srp-empty__title" }, t("srp.empty.title")),
    React.createElement("p", { className: "srp-empty__sub" }, t("srp.empty.sub")),
    React.createElement("div", { className: "srp-empty__actions" },
      React.createElement(Button, { hierarchy: "primary", iconLeading: "rotate-ccw", onClick: onClearAll }, t("srp.empty.clear")),
      React.createElement(Button, { hierarchy: "secondary", iconLeading: "layout-grid", onClick: onBrowseAll }, t("srp.empty.browse"))));
}

/* ---------- price → short pin label ---------- */
const shortPrice = (l) => {
  if (l.deal === "rent") return "$" + (l.price >= 1000 ? (l.price / 1000).toFixed(l.price % 1000 ? 1 : 0) + "k" : l.price);
  if (l.price >= 1000000) return "$" + (l.price / 1000000).toFixed(l.price % 1000000 ? 1 : 0) + "M";
  return "$" + Math.round(l.price / 1000) + "k";
};
const PIN_POS = [
  { x: 28, y: 34 }, { x: 52, y: 24 }, { x: 70, y: 44 }, { x: 40, y: 58 },
  { x: 62, y: 66 }, { x: 22, y: 70 }, { x: 80, y: 30 }, { x: 47, y: 80 },
  { x: 33, y: 48 }, { x: 66, y: 54 }, { x: 18, y: 52 }, { x: 75, y: 72 },
  { x: 55, y: 42 }, { x: 38, y: 28 },
];

/* ---------- real Leaflet map (Kurdistan Region) ---------- */
// Real city centres across the Kurdistan Region. Each listing is placed near
// its own city so the map matches whatever the search resolves to.
const CITY_GEO = {
  Erbil:        { lat: 36.1911, lng: 43.9930 },
  Sulaymaniyah: { lat: 35.5556, lng: 45.4329 },
  Duhok:        { lat: 36.8669, lng: 42.9503 },
};
const KURDISTAN = { lat: 36.20, lng: 44.10, zoom: 7 };

// Deterministic spread of a city's listings around its centre (golden-angle spiral).
function buildMarkers(results, shortPrice) {
  const seen = {};
  return results.slice(0, 40).map((l, i) => {
    const base = CITY_GEO[l.city] || CITY_GEO.Erbil;
    const n = (seen[l.city] = (seen[l.city] || 0) + 1) - 1;
    const ang = n * 2.39996;
    const r = 0.012 + 0.0065 * Math.sqrt(n);
    return {
      lat: base.lat + r * Math.sin(ang) * 0.72,
      lng: base.lng + r * Math.cos(ang),
      price: shortPrice(l), address: l.address, active: i === 0,
    };
  });
}

function RealMap({ markers, areaLabel, city }) {
  const elRef = React.useRef(null);
  const mapRef = React.useRef(null);
  const layerRef = React.useRef(null);

  React.useEffect(() => {
    if (!window.L || !elRef.current || mapRef.current) return;
    const start = CITY_GEO[city] || KURDISTAN;
    const map = window.L.map(elRef.current, {
      center: [start.lat, start.lng], zoom: start.zoom || 12, scrollWheelZoom: false,
      zoomControl: false, attributionControl: false,
    });
    window.L.control.zoom({ position: "topright" }).addTo(map);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap', maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    if (layerRef.current) { layerRef.current.remove(); }
    const group = window.L.layerGroup().addTo(map);
    layerRef.current = group;
    const latlngs = [];
    markers.forEach((m) => {
      const html = '<span class="srp-mpin' + (m.active ? " is-active" : "") + '">' + m.price + "</span>";
      const icon = window.L.divIcon({ className: "srp-mpin-wrap", html, iconSize: null });
      window.L.marker([m.lat, m.lng], { icon, riseOnHover: true })
        .bindPopup("<b>" + m.price + "</b><br>" + (m.address || ""))
        .addTo(group);
      latlngs.push([m.lat, m.lng]);
    });
    if (latlngs.length) {
      map.fitBounds(window.L.latLngBounds(latlngs).pad(0.25), { animate: true, maxZoom: 14 });
    } else {
      const c = CITY_GEO[city] || KURDISTAN;
      map.setView([c.lat, c.lng], c.zoom || 12, { animate: true });
    }
  }, [markers, city]);

  return React.createElement("div", { className: "srp-realmap" },
    React.createElement("div", { className: "srp-realmap__canvas", ref: elRef }),
    React.createElement("div", { className: "srp-realmap__badge" },
      React.createElement(Icon, { name: "map-pin", size: 15 }),
      React.createElement("span", null, areaLabel)));
}

/* ---------- results area ---------- */
function SrpResults({
  results, total, baseline, city, query, setQuery, onSearch, view,
  sort, setSort, setView, onOpenFilters,
  chips, onClearAll, onBrowseAll, loading, favorites, onFavorite, deal,
}) {
  const { t } = window.CxLang.useLang();
  const cityKey = city ? "city." + city : null;
  const cityName = cityKey ? (t(cityKey) === cityKey ? city : t(cityKey)) : null;
  const submit = (e) => { e.preventDefault(); onSearch && onSearch(); };
  const place = cityName || (query && query.trim()) || t("srp.kurdistan");
  const titleText = deal === "rent" ? t("srp.titleRent") : t("srp.titleSale");
  const fmtPrice = (l) => "$" + l.price.toLocaleString("en-US");
  const cards = results.map((l, i) => React.createElement(PropertyCard, {
    key: l.id, image: l.cover, price: fmtPrice(l), period: l.deal === "rent" ? "mo" : undefined,
    title: l.title, address: l.address, beds: l.beds, baths: l.baths, area: l.area,
    status: l.status, featured: l.featured, photoCount: l.photoCount,
    favorite: favorites.includes(l.id), onFavorite: (e) => { e.preventDefault(); e.stopPropagation(); onFavorite(l.id); },
    onClick: () => { window.location.href = "Website-Property Detail.html" + (l.id ? "?id=" + encodeURIComponent(l.id) : ""); },
    style: { cursor: "pointer" },
  }));

  const pins = buildMarkers(results, shortPrice);
  const mapArea = (cityName || t("srp.kurdistanRegion")) + " · " + total.toLocaleString("en-US") + " " + t("srp.homes");

  return React.createElement("div", { className: "srp-results" },
    // search bar + Search button (top of the right column)
    // title + count at the top (where the search bar used to be)
    React.createElement("div", { className: "srp-rtop" },
      React.createElement("h1", { className: "srp-rhead__title" },
        titleText, " ",
        React.createElement("span", { className: "srp-rhead__place" }, place)),
      React.createElement("p", { className: "srp-rhead__count" },
        React.createElement("b", null, total.toLocaleString("en-US")),
        " ", total === 1 ? t("srp.result") : t("srp.results"),
        !baseline && React.createElement("span", { className: "srp-rhead__note" }, " · " + t("srp.filtered")))),

    // search bar (left) next to sort / view tools (right)
    React.createElement("div", { className: "srp-rhead" },
      React.createElement("form", { className: "srp-toolbar__search", onSubmit: submit, role: "search" },
        React.createElement("div", { className: "srp-bar" },
          React.createElement(Icon, { name: "search", size: 20, className: "srp-bar__ic" }),
          React.createElement("input", {
            className: "srp-bar__input", type: "text",
            "aria-label": t("srp.searchAria"),
            placeholder: t("srp.searchPlaceholder"),
            value: query, onChange: (e) => setQuery(e.target.value),
          }),
          query && React.createElement("button", {
            type: "button", className: "srp-bar__clear", "aria-label": t("srp.clearSearch"),
            onClick: () => setQuery(""),
          }, React.createElement(Icon, { name: "x", size: 15 })))),
      React.createElement("div", { className: "srp-rhead__tools" },
        React.createElement(window.SortMenu, { value: sort, onChange: setSort }),
        React.createElement(window.ViewToggle, { view, onChange: setView }),
        React.createElement("button", { type: "button", className: "srp-summary__filters", onClick: onOpenFilters },
          React.createElement(Icon, { name: "sliders-horizontal", size: 18 }), t("srp.filters")))),

    // active chips
    chips.length > 0 && React.createElement("div", { className: "srp-chips" },
      React.createElement("span", { className: "srp-chips__label" }, t("srp.activeFilters")),
      React.createElement("div", { className: "srp-chips__row" },
        chips.map((c) => React.createElement(Tag, { key: c.key, onRemove: c.onRemove }, c.label)),
        React.createElement("button", { type: "button", className: "srp-chips__clear", onClick: onClearAll },
          React.createElement(Icon, { name: "x", size: 14 }), t("srp.clearAll")))),

    // body: loading / empty / grid / map
    loading
      ? React.createElement("div", { className: "srp-grid" + (view === "map" ? " srp-grid--split" : "") },
          Array.from({ length: view === "map" ? 4 : 6 }).map((_, i) => React.createElement(SkeletonCard, { key: i })))
      : results.length === 0
        ? React.createElement(EmptyState, { onClearAll, onBrowseAll })
        : view === "map"
          ? React.createElement("div", { className: "srp-split" },
              React.createElement("div", { className: "srp-split__list" },
                React.createElement("div", { className: "srp-grid srp-grid--split" }, cards)),
              React.createElement("div", { className: "srp-split__map" },
                React.createElement(RealMap, {
                  markers: pins, city,
                  areaLabel: mapArea,
                })))
          : React.createElement(React.Fragment, null,
              React.createElement("div", { className: "srp-grid" }, cards),
              baseline && React.createElement("div", { className: "srp-pager" },
                React.createElement("span", { className: "srp-pager__info" },
                  t("srp.showing"), " ",
                  React.createElement("b", null, "1\u2013" + results.length),
                  " ", t("srp.of"), " ",
                  React.createElement("b", null, total.toLocaleString("en-US")),
                  " ", t("srp.propertiesLower")),
                React.createElement("div", { className: "srp-pager__ctrls" },
                  React.createElement("button", { type: "button", className: "pp-page-btn pp-page-btn--nav", disabled: true },
                    React.createElement(Icon, { name: "chevron-left", size: 15, className: "srp-pager__previc" }), t("srp.prev")),
                  ["1", "2", "3", "4", "…", "21"].map((p, i) =>
                    p === "…"
                      ? React.createElement("span", { key: i, className: "pp-page-ellipsis" }, "…")
                      : React.createElement("button", {
                          key: i, type: "button",
                          className: "pp-page-btn" + (p === "1" ? " is-active" : ""),
                        }, p)),
                  React.createElement("button", { type: "button", className: "pp-page-btn pp-page-btn--nav" },
                    t("srp.next"), React.createElement(Icon, { name: "chevron-right", size: 15, className: "srp-pager__nextic" })))))
  );
}

window.SrpResults = SrpResults;
