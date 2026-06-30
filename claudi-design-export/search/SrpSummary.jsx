const React = window.React;
const { Button, Icon, Breadcrumb } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef, useEffect } = React;

const HOME_URL = "Website-Homepage.html";
const SD = window.SRP_DATA;

// Translate a city/place name when a key exists, else fall back to the raw value.
function placeLabel(t, value) {
  if (!value) return value;
  const k = "city." + value;
  const tr = t(k);
  return tr === k ? value : tr;
}

// Breadcrumb — Home / Buy / Erbil, using the approved DS Breadcrumb component.
function SrpCrumb({ deal, city, query }) {
  const { t } = window.CxLang.useLang();
  const dealLabel = deal === "rent" ? t("deal.rent") : t("deal.buy");
  const current = city ? placeLabel(t, city) : ((query && query.trim()) || t("srp.kurdistan"));
  return React.createElement(Breadcrumb, {
    items: [
      { label: t("srp.crumb.home"), href: HOME_URL },
      { label: dealLabel, href: HOME_URL + "?deal=" + deal },
      { label: current },
    ],
  });
}

/* ---------- sort dropdown (custom popover, floats above cards) ---------- */
function SortMenu({ value, onChange }) {
  const { t } = window.CxLang.useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const current = SD.sortOptions.find((o) => o.value === value) || SD.sortOptions[0];
  const optLabel = (o) => (o.tkey ? t(o.tkey) : o.label);
  return React.createElement("div", { className: "srp-sort", ref },
    React.createElement("button", {
      type: "button", className: "srp-sort__btn" + (open ? " srp-sort__btn--open" : ""),
      "aria-expanded": open, onClick: () => setOpen((o) => !o),
    },
      React.createElement(Icon, { name: "arrow-up-down", size: 16, className: "srp-sort__lead" }),
      React.createElement("span", { className: "srp-sort__cap" }, t("srp.sortLabel")),
      React.createElement("span", { className: "srp-sort__val" }, optLabel(current)),
      React.createElement(Icon, { name: "chevron-down", size: 16, className: "srp-sort__chev" + (open ? " srp-sort__chev--open" : "") })),
    open && React.createElement("div", { className: "srp-sort__panel" },
      SD.sortOptions.map((o) => React.createElement("button", {
        key: o.value, type: "button",
        className: "srp-sort__opt" + (o.value === value ? " srp-sort__opt--on" : ""),
        onClick: () => { onChange(o.value); setOpen(false); },
      },
        React.createElement("span", null, optLabel(o)),
        o.value === value && React.createElement(Icon, { name: "check", size: 17 }))))
  );
}

/* ---------- view toggle ---------- */
function ViewToggle({ view, onChange }) {
  const { t } = window.CxLang.useLang();
  return React.createElement("div", { className: "srp-view" },
    [["grid", "layout-grid", t("srp.gridView")], ["map", "map", t("srp.mapView")]].map(([v, ic, label]) =>
      React.createElement("button", {
        key: v, type: "button",
        className: "srp-view__btn" + (view === v ? " srp-view__btn--on" : ""),
        onClick: () => onChange(v), title: label,
      },
        React.createElement(Icon, { name: ic, size: 17 }))));
}

// Top zone — just the breadcrumb now. The search bar, title, and tools live
// inside the right results column (above the cards), beside the filters rail.
function SrpSummary({ deal, city, query }) {
  return React.createElement("div", { className: "srp-top" },
    React.createElement("div", { className: "srp-top__crumb" },
      React.createElement(SrpCrumb, { deal, city, query })));
}

window.SrpCrumb = SrpCrumb;
window.SrpSummary = SrpSummary;
window.SortMenu = SortMenu;
window.ViewToggle = ViewToggle;
