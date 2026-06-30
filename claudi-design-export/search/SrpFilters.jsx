const React = window.React;
const { Icon, Checkbox, Button, Input } = window.ChiyaEstateDesignSystem_686f57;
const { useState } = React;

const D = window.SRP_DATA;

/* ---------- helpers ---------- */
const onlyDigits = (s) => (s || "").replace(/[^0-9]/g, "");
const commas = (s) => onlyDigits(s).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseRange = (v) => {
  const [a, b] = v.split("-");
  return { lo: a ? Number(a) : null, hi: b ? Number(b) : null };
};

/* ---------- collapsible section ---------- */
function Section({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return React.createElement("div", { className: "srp-fsec" },
    React.createElement("button", {
      type: "button", className: "srp-fsec__head", "aria-expanded": open,
      onClick: () => setOpen((o) => !o),
    },
      React.createElement("span", { className: "srp-fsec__title" }, title,
        count != null && count > 0 && React.createElement("span", { className: "srp-fsec__count" }, count)),
      React.createElement(Icon, { name: "chevron-down", size: 18, className: "srp-fsec__chev" + (open ? " srp-fsec__chev--open" : "") })),
    open && React.createElement("div", { className: "srp-fsec__body" }, children)
  );
}

/* ---------- quick-pick row (beds / baths) ---------- */
function QuickRow({ options, value, onPick, includeAny = true }) {
  const { t } = window.CxLang.useLang();
  const opts = includeAny ? [{ value: "", label: t("srp.any") }, ...options] : options;
  return React.createElement("div", { className: "srp-quickrow" },
    opts.map((o) => React.createElement("button", {
      key: o.value, type: "button",
      className: "srp-quick" + (value === o.value ? " srp-quick--on" : ""),
      onClick: () => onPick(o.value),
    }, o.tkey ? t(o.tkey) : o.label)));
}

/* ---------- preset + custom range (price / size) ---------- */
function RangeGroup({ presets, value, onPick, deal, kind }) {
  const { t } = window.CxLang.useLang();
  const [lo, setLo] = useState(value && value.custom && value.lo != null ? String(value.lo) : "");
  const [hi, setHi] = useState(value && value.custom && value.hi != null ? String(value.hi) : "");
  const isCustom = value && value.custom;

  const makeLabel = (l, h) => {
    const anyW = t("srp.any");
    if (kind === "size") {
      const a = l ? commas(String(l)) : anyW;
      const b = h ? commas(String(h)) : anyW;
      return a + " – " + b + " m²";
    }
    const suffix = deal === "rent" ? "/mo" : "";
    const fmt = (n) => "$" + commas(String(n));
    const a = l ? fmt(l) : anyW;
    const b = h ? fmt(h) : anyW;
    return a + " – " + b + suffix;
  };

  const applyCustom = () => {
    const l = lo ? Number(onlyDigits(lo)) : null;
    const h = hi ? Number(onlyDigits(hi)) : null;
    if (l == null && h == null) return;
    onPick({ lo: l, hi: h, label: makeLabel(l, h), custom: true });
  };

  return React.createElement(React.Fragment, null,
    React.createElement("div", { className: "srp-presets" },
      presets.map((p) => {
        const sel = value && !value.custom && value.preset === p.value;
        return React.createElement("button", {
          key: p.value, type: "button",
          className: "srp-radio" + (sel ? " srp-radio--on" : ""),
          onClick: () => {
            if (sel) { onPick(null); return; }
            const r = parseRange(p.value);
            onPick({ lo: r.lo, hi: r.hi, label: p.tkey ? t(p.tkey) : p.label, preset: p.value });
          },
        },
          React.createElement("span", { className: "srp-radio__dot" }),
          React.createElement("span", { className: "srp-radio__label" }, p.tkey ? t(p.tkey) : p.label));
      })),
    React.createElement("div", { className: "srp-custom" },
      React.createElement("div", { className: "srp-custom__label" },
        kind === "size" ? t("srp.customSize") : (deal === "rent" ? t("srp.customRent") : t("srp.customPrice"))),
      React.createElement("div", { className: "srp-range" },
        React.createElement(Input, {
          size: "sm", placeholder: t("srp.min"), inputMode: "numeric",
          iconLeading: kind === "size" ? undefined : "dollar-sign",
          value: kind === "size" ? commas(lo) : commas(lo),
          onChange: (e) => setLo(onlyDigits(e.target.value)),
        }),
        kind === "size" && React.createElement("span", { className: "srp-range__unit" }, "m²"),
        React.createElement("span", { className: "srp-range__dash" }, "–"),
        React.createElement(Input, {
          size: "sm", placeholder: t("srp.max"), inputMode: "numeric",
          iconLeading: kind === "size" ? undefined : "dollar-sign",
          value: commas(hi),
          onChange: (e) => setHi(onlyDigits(e.target.value)),
        }),
        kind === "size" && React.createElement("span", { className: "srp-range__unit" }, "m²")),
      React.createElement(Button, {
        hierarchy: isCustom ? "primary" : "secondary", size: "sm",
        fullWidth: true, onClick: applyCustom,
      }, isCustom ? t("srp.customApplied") : t("srp.applyCustom")))
  );
}

/* ---------- the panel ---------- */
function SrpFilters({ deal, setDeal, f, on, activeCount, onClearAll }) {
  const { t } = window.CxLang.useLang();
  // type counts for the current transaction type
  const typeCounts = {};
  D.listings.forEach((l) => { if (l.deal === deal) typeCounts[l.type] = (typeCounts[l.type] || 0) + 1; });

  const priceLabel = deal === "rent" ? t("srp.sec.monthlyRent") : t("srp.sec.priceRange");
  const presets = deal === "rent" ? D.rentPresets : D.buyPresets;

  return React.createElement("div", { className: "srp-filters" },
    React.createElement("div", { className: "srp-filters__top" },
      React.createElement("div", { className: "srp-filters__title" },
        React.createElement(Icon, { name: "sliders-horizontal", size: 18 }), t("srp.filters"),
        activeCount > 0 && React.createElement("span", { className: "srp-filters__badge" }, activeCount)),
      activeCount > 0 && React.createElement("button", { type: "button", className: "srp-clear", onClick: onClearAll },
        t("srp.clearAll"))),

    // Property type
    React.createElement(Section, { title: t("srp.sec.type"), count: f.types.length },
      React.createElement("div", { className: "srp-typelist" },
        D.propertyTypes.map((ty) => React.createElement("div", {
          key: ty.value, role: "checkbox", "aria-checked": f.types.includes(ty.value),
          className: "srp-typerow" + (f.types.includes(ty.value) ? " srp-typerow--on" : ""),
          onClick: () => on.toggleType(ty.value),
        },
          React.createElement("span", { className: "srp-cbox" },
            React.createElement(Checkbox, { checked: f.types.includes(ty.value), readOnly: true })),
          React.createElement(Icon, { name: ty.icon, size: 17, className: "srp-typerow__ic" }),
          React.createElement("span", { className: "srp-typerow__label" }, ty.tkey ? t(ty.tkey) : ty.label),
          React.createElement("span", { className: "srp-typerow__count" }, typeCounts[ty.value] || 0))))),

    // Price / monthly rent
    React.createElement(Section, { title: priceLabel, count: f.price ? 1 : 0 },
      React.createElement(RangeGroup, { presets, value: f.price, onPick: on.setPrice, deal, kind: "price" })),

    // Property size
    React.createElement(Section, { title: t("srp.sec.size"), count: f.size ? 1 : 0 },
      React.createElement(RangeGroup, { presets: D.sizePresets, value: f.size, onPick: on.setSize, kind: "size" })),

    // Bedrooms
    React.createElement(Section, { title: t("srp.sec.beds"), count: f.beds !== "" ? 1 : 0 },
      React.createElement(QuickRow, { options: D.beds, value: f.beds, onPick: on.setBeds })),

    // Bathrooms
    React.createElement(Section, { title: t("srp.sec.baths"), count: f.baths !== "" ? 1 : 0 },
      React.createElement(QuickRow, { options: D.baths, value: f.baths, onPick: on.setBaths })),

    // Amenities
    React.createElement(Section, { title: t("srp.sec.amenities"), count: f.amenities.length },
      React.createElement("div", { className: "srp-amen" },
        D.amenities.map((a) => React.createElement("div", {
          key: a.value, role: "checkbox", "aria-checked": f.amenities.includes(a.value),
          className: "srp-amenrow" + (f.amenities.includes(a.value) ? " srp-amenrow--on" : ""),
          onClick: () => on.toggleAmenity(a.value),
        },
          React.createElement("span", { className: "srp-cbox" },
            React.createElement(Checkbox, { checked: f.amenities.includes(a.value), readOnly: true })),
          React.createElement(Icon, { name: a.icon, size: 16, className: "srp-amenrow__ic" }),
          React.createElement("span", { className: "srp-amenrow__label" }, a.tkey ? t(a.tkey) : a.label)))))
  );
}

window.SrpFilters = SrpFilters;
