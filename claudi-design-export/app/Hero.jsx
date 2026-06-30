const React = window.React;
const { Badge, Icon } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef, useEffect } = React;

/* ---------- Translated option builders ---------- */
function getDeals(t) {
  return [
    { value: "buy",  label: t("deal.buy"),  icon: "tag",            sub: t("deal.buy.sub") },
    { value: "rent", label: t("deal.rent"), icon: "key",            sub: t("deal.rent.sub") },
  ];
}

function getLocations(t) {
  return [
    { value: "",               label: t("loc.all"),   sub: t("loc.all.sub"),           icon: "map" },
    { value: "Erbil",          label: "Erbil",         sub: t("loc.erbil.sub"),          icon: "map-pin" },
    { value: "Duhok",          label: "Duhok",         sub: t("loc.duhok.sub"),          icon: "map-pin" },
    { value: "Sulaymaniyah",   label: "Sulaymaniyah",  sub: t("loc.sulaymaniyah.sub"),   icon: "map-pin" },
    { value: "Halabja",        label: "Halabja",       sub: t("loc.halabja.sub"),        icon: "map-pin" },
  ];
}

function getTypes(t) {
  return [
    { value: "",           label: t("type.all"),        icon: "layout-grid" },
    { value: "apartment",  label: t("type.apartment"),  icon: "building-2" },
    { value: "villa",      label: t("type.villa"),      icon: "home" },
    { value: "house",      label: t("type.house"),      icon: "house" },
    { value: "commercial", label: t("type.commercial"), icon: "store" },
    { value: "land",       label: t("type.land"),       icon: "trees" },
  ];
}

function getBuyPrices(t) {
  return [
    { value: "",           label: t("price.any") },
    { value: "0-100000",   label: t("price.buy.u100k") },
    { value: "100000-250000", label: t("price.buy.100-250") },
    { value: "250000-500000", label: t("price.buy.250-500") },
    { value: "500000-1000000", label: t("price.buy.500-1m") },
    { value: "1000000-",  label: t("price.buy.1m+") },
  ];
}

function getRentPrices(t) {
  return [
    { value: "",       label: t("price.any") },
    { value: "0-1000", label: t("price.rent.u1k") },
    { value: "1000-2500", label: t("price.rent.1-2.5") },
    { value: "2500-5000", label: t("price.rent.2.5-5") },
    { value: "5000-",  label: t("price.rent.5k+") },
  ];
}

/* ---------- Field popover ---------- */
function Field({ id, label, icon, options, value, placeholder, align, openId, setOpenId, onPick }) {
  const ref = useRef(null);
  const open = openId === id;
  const selected = options.find(function(o) { return o.value === value && o.value !== ""; });

  useEffect(function() {
    if (!open) return undefined;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpenId(null); }
    function onKey(e) { if (e.key === "Escape") setOpenId(null); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return function() {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpenId]);

  var valLabel = selected ? selected.label : placeholder;

  return React.createElement("div", { className: "cxpop", ref: ref },
    React.createElement("button", {
      type: "button",
      className: "cxfield" + (selected ? "" : " cxfield--empty") + (open ? " cxfield--open" : ""),
      "aria-expanded": open,
      onClick: function() { setOpenId(open ? null : id); },
    },
      React.createElement("span", { className: "cxfield__label" }, label),
      React.createElement("span", { className: "cxfield__val" },
        icon && React.createElement(Icon, { name: icon, size: 18 }),
        React.createElement("span", { className: "cxfield__txt" }, valLabel),
        React.createElement(Icon, { name: "chevron-down", size: 16, className: "cxfield__chev" })
      )
    ),
    open && React.createElement("div", { className: "cxpanel" + (align === "right" ? " cxpanel--right" : "") },
      React.createElement("div", { className: "cxpanel__scroll cxpanel__scroll--pad" },
        React.createElement("div", { className: "cxpanel__label" }, label),
        options.map(function(o) {
          return React.createElement("button", {
            key: o.value || "__all",
            type: "button",
            className: "cxrow" + ((value || "") === o.value ? " cxrow--sel" : ""),
            onClick: function() { onPick(o.value); setOpenId(null); },
          },
            o.icon && React.createElement("span", { className: "cxrow__ic cxrow__ic--tile" },
              React.createElement(Icon, { name: o.icon, size: 18 })
            ),
            React.createElement("span", { className: "cxrow__body" },
              React.createElement("span", { className: "cxrow__title" }, o.label),
              o.sub && React.createElement("span", { className: "cxrow__sub" }, o.sub)
            ),
            (value || "") === o.value && o.value !== "" &&
              React.createElement(Icon, { name: "check", size: 17, className: "cxrow__check" })
          );
        })
      )
    )
  );
}

/* ---------- Search bar ---------- */
function HeroSearch({ onSearch }) {
  const { t } = window.CxLang.useLang();
  const [deal, setDeal] = useState("buy");
  const [openId, setOpenId] = useState(null);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");

  var DEALS     = getDeals(t);
  var LOCATIONS = getLocations(t);
  var TYPES     = getTypes(t);
  var prices    = deal === "rent" ? getRentPrices(t) : getBuyPrices(t);

  function setDealMode(d) { setDeal(d); setPrice(""); }

  function submitSearch(e) {
    if (e) e.preventDefault();
    var params = { deal: deal };
    if (location) params.q = location;
    if (type)     params.type = type;
    if (price)    params.price = price;
    if (onSearch) { onSearch(params); return; }
    var u = new URLSearchParams();
    u.set("deal", deal);
    if (location) u.set("q", location);
    if (type)     u.set("type", type);
    if (price)    u.set("price", price);
    window.location.href = "Website-Search Results page.html?" + u.toString();
  }

  useEffect(function() {
    var open = openId !== null;
    document.body.classList.toggle("cx-pop-open", open);
    return function() { document.body.classList.remove("cx-pop-open"); };
  }, [openId]);

  return React.createElement("div", { className: "cxsearch" },
    React.createElement("form", {
      className: "cxbar",
      onSubmit: submitSearch,
    },
      /* Looking to */
      React.createElement(Field, {
        id: "deal", label: t("search.lookingTo"), icon: deal === "rent" ? "key" : "tag",
        options: DEALS, value: deal, placeholder: t("deal.buy"),
        openId: openId, setOpenId: setOpenId, onPick: setDealMode,
      }),
      React.createElement("span", { className: "cxbar__sep" }),

      /* Location */
      React.createElement(Field, {
        id: "location", label: t("search.location"), icon: "map-pin",
        options: LOCATIONS, value: location, placeholder: t("loc.all"),
        openId: openId, setOpenId: setOpenId, onPick: setLocation,
      }),
      React.createElement("span", { className: "cxbar__sep" }),

      /* Property type */
      React.createElement(Field, {
        id: "type", label: t("search.propertyType"), icon: "building-2",
        options: TYPES, value: type, placeholder: t("type.all"),
        openId: openId, setOpenId: setOpenId, onPick: setType,
      }),
      React.createElement("span", { className: "cxbar__sep" }),

      /* Price */
      React.createElement(Field, {
        id: "price", label: t("search.price"), icon: "wallet",
        options: prices, value: price, placeholder: t("price.any"), align: "right",
        openId: openId, setOpenId: setOpenId, onPick: setPrice,
      }),

      /* Search button */
      React.createElement("button", { type: "submit", className: "cxbar__go", onClick: submitSearch },
        React.createElement(Icon, { name: "search", size: 19 }),
        React.createElement("span", null, t("search.cta"))
      )
    )
  );
}

/* ---------- Hero section ---------- */
function Hero({ onSearch }) {
  const { t } = window.CxLang.useLang();
  return React.createElement("section", { className: "cxhero" },
    React.createElement("div", { className: "cxhero__media" },
      React.createElement("div", { className: "cxhero__bg" }),
      React.createElement("div", { className: "cxhero__grad" })
    ),
    React.createElement("div", { className: "cxhero__inner" },
      React.createElement("h1", { className: "cxhero__title" }, t("hero.title")),
      React.createElement("p",  { className: "cxhero__sub"   }, t("hero.sub")),
      React.createElement(HeroSearch, { onSearch: onSearch })
    )
  );
}

window.Hero = Hero;
