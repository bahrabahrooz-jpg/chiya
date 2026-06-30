const React = window.React;
const { Wordmark, Button, Icon } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useEffect, useRef } = React;

const NAV_KEYS = ["buy", "rent", "sell", "agents", "about", "blog", "contact"];

/* ---- Language switcher dropdown ---- */
function LangSwitcher() {
  const { lang, setLang, t } = window.CxLang.useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(function() {
    if (!open) return;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function() { document.removeEventListener("mousedown", onDoc); };
  }, [open]);

  return React.createElement("div", { className: "cxh__langsw", ref: ref },
    React.createElement("button", {
      type: "button",
      className: "cxh__lang",
      "aria-expanded": open,
      "aria-label": "Switch language",
      onClick: function() { setOpen(function(o) { return !o; }); },
    },
      React.createElement(Icon, { name: "globe", size: 16 }),
      lang === "ar" ? "AR" : "EN"
    ),
    open && React.createElement("div", { className: "cxh__langdrop" },
      ["en", "ar", "ku"].map(function(l) {
        return React.createElement("button", {
          key: l,
          type: "button",
          className: "cxh__langopt" + (lang === l ? " cxh__langopt--sel" : ""),
          onClick: function() { setLang(l); setOpen(false); },
        },
          React.createElement("span", null, t("lang." + l)),
          lang === l && React.createElement(Icon, { name: "check", size: 14, style: { marginInlineStart: "auto" } })
        );
      })
    )
  );
}

/* ---- Single header bar ---- */
function HeaderBar({ onSearch, variant, show }) {
  const { t } = window.CxLang.useLang();
  const [active, setActive] = useState(null);

  const cls =
    "cxh" +
    (variant === "sticky" ? " cxh--solid cxh--sticky" : " cxh--static") +
    (variant === "sticky" && show ? " cxh--show" : "");

  return React.createElement("header", {
    className: cls,
    "aria-hidden": variant === "sticky" && !show ? "true" : undefined,
  },
    React.createElement("div", { className: "cxh__inner" },
      React.createElement("div", { className: "cxh__brand" },
        React.createElement(Wordmark, { logoSrc: "assets/chiya-logomark.svg" })),
      React.createElement("nav", { className: "cxh__nav" },
        NAV_KEYS.map(function(key, i) {
          return React.createElement("a", {
            key: key,
            href: "#",
            className: "cxh__link" + (active === key ? " cxh__link--active" : ""),
            onClick: function(e) {
              e.preventDefault();
              setActive(key);
              if (key === "buy" || key === "rent") onSearch && onSearch({ deal: key });
              else if (key === "agents") window.location.href = "Website-Agent Page.html";
            },
          }, t("nav." + key));
        })
      ),
      React.createElement("div", { className: "cxh__actions" },
        React.createElement(LangSwitcher),
        React.createElement(window.CxThemeToggle, { variant: variant === "static" ? "glass" : undefined }),
        React.createElement("span", { className: "cxh__divider" }),
        React.createElement(Button, { hierarchy: "primary", size: "sm", className: "cxh__login" }, t("nav.login"))
      )
    )
  );
}

/* ---- Dual-header controller ---- */
function SiteHeader({ onSearch }) {
  const [stuck, setStuck] = useState(false);

  useEffect(function() {
    var headerH = 84;
    function onScroll() {
      var featured = document.getElementById("properties");
      var reached = featured
        ? featured.getBoundingClientRect().top <= headerH
        : window.scrollY > 600;
      setStuck(reached);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return function() {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return React.createElement(React.Fragment, null,
    React.createElement(HeaderBar, { onSearch: onSearch, variant: "static" }),
    React.createElement(HeaderBar, { onSearch: onSearch, variant: "sticky", show: stuck })
  );
}

window.SiteHeader = SiteHeader;
