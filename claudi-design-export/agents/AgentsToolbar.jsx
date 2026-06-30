const React = window.React;
const { Icon, Select, Button } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef, useEffect } = React;

const A_T = window.AGT_DATA;

/* ---- Sort dropdown — mirrors the search-results sort control ---- */
function AgentsSort({ sort, setSort }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const current = A_T.sortOptions.find((o) => o.value === sort) || A_T.sortOptions[0];
  return React.createElement("div", { className: "agt-sort", ref },
    React.createElement("button", {
      type: "button", className: "agt-sort__btn" + (open ? " agt-sort__btn--open" : ""),
      onClick: () => setOpen((v) => !v),
    },
      React.createElement(Icon, { name: "arrow-up-down", size: 17, className: "agt-sort__lead" }),
      React.createElement("span", { className: "agt-sort__cap" }, "Sort:"),
      React.createElement("span", { className: "agt-sort__val" }, current.label),
      React.createElement(Icon, { name: "chevron-down", size: 16, className: "agt-sort__chev" + (open ? " agt-sort__chev--open" : "") })),
    open && React.createElement("div", { className: "agt-sort__panel" },
      A_T.sortOptions.map((o) =>
        React.createElement("button", {
          key: o.value, type: "button",
          className: "agt-sort__opt" + (o.value === sort ? " agt-sort__opt--on" : ""),
          onClick: () => { setSort(o.value); setOpen(false); },
        },
          React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 9 } },
            React.createElement(Icon, { name: o.icon, size: 16 }), o.label),
          o.value === sort && React.createElement(Icon, { name: "check", size: 16 }))))
  );
}

/* ---- Filter controls (City / Agency / Verified) — shared desktop + drawer ---- */
function AgentsFilterControls({ filters, on, stacked }) {
  return React.createElement(React.Fragment, null,
    React.createElement("div", { className: "agt-ctl" + (stacked ? " agt-ctl--block" : "") },
      stacked && React.createElement("label", { className: "agt-ctl__label" }, "City"),
      React.createElement(Select, {
        size: "md", value: filters.city, onChange: (e) => on.setCity(e.target.value),
        options: [{ value: "", label: "All cities" }, ...A_T.cities.map((c) => ({ value: c, label: c }))],
      })),
    React.createElement("div", { className: "agt-ctl" + (stacked ? " agt-ctl--block" : "") },
      stacked && React.createElement("label", { className: "agt-ctl__label" }, "Agency"),
      React.createElement(Select, {
        size: "md", value: filters.agency, onChange: (e) => on.setAgency(e.target.value),
        options: [{ value: "", label: "All agencies" }, ...A_T.agencies.map((a) => ({ value: a, label: a }))],
      })),
    React.createElement("button", {
      type: "button",
      className: "agt-verified" + (filters.verifiedOnly ? " agt-verified--on" : "") + (stacked ? " agt-verified--block" : ""),
      onClick: () => on.toggleVerified(),
      "aria-pressed": filters.verifiedOnly,
    },
      React.createElement("span", { className: "agt-verified__box" },
        filters.verifiedOnly && React.createElement(Icon, { name: "check", size: 13, strokeWidth: 3 })),
      React.createElement(Icon, { name: "badge-check", size: 16, className: "agt-verified__ic" }),
      "Verified agents only")
  );
}

/* ---- Homepage-style chip popover (desktop toolbar) ---- */
function AgtPopover({ id, icon, caption, label, openId, setOpenId, align, children }) {
  const ref = useRef(null);
  const open = openId === id;
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpenId(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpenId(null); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open, setOpenId]);
  return React.createElement("div", { className: "agt-pop", ref },
    React.createElement("button", {
      type: "button",
      className: "agt-sort__btn" + (open ? " agt-sort__btn--open" : ""),
      "aria-expanded": open,
      onClick: () => setOpenId(open ? null : id),
    },
      React.createElement(Icon, { name: icon, size: 17, className: "agt-sort__lead" }),
      caption && React.createElement("span", { className: "agt-sort__cap" }, caption + ":"),
      React.createElement("span", { className: "agt-sort__val" }, label),
      React.createElement(Icon, { name: "chevron-down", size: 16, className: "agt-sort__chev" + (open ? " agt-sort__chev--open" : "") })),
    open && React.createElement("div", { className: "agt-panel" + (align === "right" ? " agt-panel--right" : "") }, children)
  );
}

function AgtListPanel({ label, options, value, onPick }) {
  return React.createElement("div", { className: "agt-panel__scroll" },
    React.createElement("div", { className: "agt-panel__label" }, label),
    options.map((o) => React.createElement("button", {
      key: o.value, type: "button",
      className: "agt-row" + (value === o.value ? " agt-row--sel" : ""),
      onClick: () => onPick(o.value),
    },
      React.createElement("span", null, o.label),
      value === o.value && React.createElement(Icon, { name: "check", size: 17, className: "agt-row__check" }))));
}

/* ---- Desktop filter chips (City / Agency popovers + Verified toggle) ---- */
function AgentsFilterChips({ filters, on }) {
  const [openId, setOpenId] = useState(null);
  const cityOpts = [{ value: "", label: "All cities" }, ...A_T.cities.map((c) => ({ value: c, label: c }))];
  const agencyOpts = [{ value: "", label: "All agencies" }, ...A_T.agencies.map((a) => ({ value: a, label: a }))];
  return React.createElement(React.Fragment, null,
    React.createElement(AgtPopover, {
      id: "city", icon: "map-pin", caption: "City", label: filters.city || "All cities", openId, setOpenId,
    }, React.createElement(AgtListPanel, {
      label: "City", options: cityOpts, value: filters.city,
      onPick: (v) => { on.setCity(v); setOpenId(null); },
    }))
  );
}

/* ---- Desktop toolbar card ---- */
function AgentsToolbar({ query, setQuery, filters, on, sort, setSort, onOpenFilters }) {
  return React.createElement("div", { className: "agt-toolbar" },
    React.createElement("form", { className: "agt-toolbar__search", onSubmit: (e) => e.preventDefault() },
      React.createElement("div", { className: "agt-searchbar" },
        React.createElement(Icon, { name: "search", size: 20, className: "agt-searchbar__ic" }),
        React.createElement("input", {
          className: "agt-searchbar__input", type: "text",
          placeholder: "Search by agent name or agency",
          value: query, onChange: (e) => setQuery(e.target.value),
        }),
        query && React.createElement("button", {
          type: "button", className: "agt-searchbar__clear", "aria-label": "Clear search",
          onClick: () => setQuery(""),
        }, React.createElement(Icon, { name: "x", size: 16 }))),
      React.createElement("div", { className: "agt-toolbar__controls" },
        React.createElement(AgentsFilterChips, { filters, on }),
        React.createElement(AgentsSort, { sort, setSort })),
      React.createElement("button", { type: "button", className: "agt-toolbar__mfilters", onClick: onOpenFilters },
        React.createElement(Icon, { name: "sliders-horizontal", size: 18 }), "Filters"))
  );
}

window.AgentsToolbar = AgentsToolbar;
window.AgentsSort = AgentsSort;
window.AgentsFilterControls = AgentsFilterControls;
