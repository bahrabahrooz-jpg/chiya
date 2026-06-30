/* ============================================================
   CHIYA ESTATE — THEME ENGINE
   - Pre-paint init (no flash): set [data-theme] before body renders.
   - localStorage persistence + system-preference fallback.
   - Cross-tab + same-page broadcast.
   - window.ChiyaTheme API + window.CxThemeToggle React control.
   Load this in <head> BEFORE the page renders.
   ============================================================ */
(function () {
  "use strict";
  var KEY = "cx-theme";

  function systemPref() {
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function current() {
    var s = stored();
    return (s === "dark" || s === "light") ? s : systemPref();
  }
  function apply(theme) {
    var el = document.documentElement;
    el.setAttribute("data-theme", theme === "dark" ? "dark" : "light");
    try { el.style.colorScheme = theme === "dark" ? "dark" : "light"; } catch (e) {}
  }

  /* ---- pre-paint ---- */
  apply(current());

  var subs = [];
  function broadcast(theme) {
    for (var i = 0; i < subs.length; i++) {
      try { subs[i](theme); } catch (e) {}
    }
  }

  var Theme = {
    get: current,
    isExplicit: function () { return stored() === "dark" || stored() === "light"; },
    set: function (theme) {
      theme = theme === "dark" ? "dark" : "light";
      try { localStorage.setItem(KEY, theme); } catch (e) {}
      apply(theme);
      broadcast(theme);
    },
    toggle: function () { Theme.set(current() === "dark" ? "light" : "dark"); },
    subscribe: function (fn) {
      subs.push(fn);
      return function () { subs = subs.filter(function (f) { return f !== fn; }); };
    }
  };
  window.ChiyaTheme = Theme;

  /* ---- follow system changes until the user picks explicitly ---- */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onMq = function () {
      if (!Theme.isExplicit()) { apply(systemPref()); broadcast(current()); }
    };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  /* ---- cross-tab sync ---- */
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) { apply(current()); broadcast(current()); }
  });

  /* ============================================================
     React segmented toggle — window.CxThemeToggle
     References window.React only at call time, so it is safe to
     define before React's UMD bundle has loaded.
     Props: { variant?: "glass" }
     ============================================================ */
  window.CxThemeToggle = function CxThemeToggle(props) {
    var React = window.React;
    var st = React.useState(Theme.get());
    var theme = st[0], setTheme = st[1];

    React.useEffect(function () {
      return Theme.subscribe(function (t) { setTheme(t); });
    }, []);

    var DS = window.ChiyaEstateDesignSystem_686f57 || {};
    var Icon = DS.Icon;
    function glyph(name) {
      return Icon ? React.createElement(Icon, { name: name, size: 15 }) : null;
    }

    var variant = (props && props.variant) ? props.variant : "";
    var isDark = theme === "dark";

    return React.createElement("div", {
      className: "cx-thtog" + (isDark ? " is-dark" : "") + (variant ? " cx-thtog--" + variant : ""),
      role: "group",
      "aria-label": "Color theme"
    },
      React.createElement("span", { className: "cx-thtog__thumb", "aria-hidden": "true" }),
      React.createElement("button", {
        type: "button",
        className: "cx-thtog__opt" + (!isDark ? " is-on" : ""),
        "aria-pressed": !isDark,
        "aria-label": "Light mode",
        onClick: function () { Theme.set("light"); }
      }, glyph("sun")),
      React.createElement("button", {
        type: "button",
        className: "cx-thtog__opt" + (isDark ? " is-on" : ""),
        "aria-pressed": isDark,
        "aria-label": "Dark mode",
        onClick: function () { Theme.set("dark"); }
      }, glyph("moon"))
    );
  };
})();
