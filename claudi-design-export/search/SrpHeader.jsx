const React = window.React;
const { Wordmark, Button, Icon } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useEffect, useRef } = React;

// nav items: i18n key + the deal value they map to (for active state)
const SRP_NAV = [
  { key: "buy",     deal: "buy" },
  { key: "rent",    deal: "rent" },
  { key: "sell" },
  { key: "agents" },
  { key: "about" },
  { key: "blog" },
  { key: "contact" },
];

/* ---- Language switcher (shared pattern with the homepage header) ---- */
function SrpLangSwitcher() {
  const { lang, setLang, t } = window.CxLang.useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(function () {
    if (!open) return undefined;
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return function () { document.removeEventListener("mousedown", onDoc); };
  }, [open]);

  return React.createElement("div", { className: "cxh__langsw", ref: ref },
    React.createElement("button", {
      type: "button", className: "cxh__lang",
      "aria-expanded": open, "aria-label": "Switch language",
      onClick: function () { setOpen(function (o) { return !o; }); },
    },
      React.createElement(Icon, { name: "globe", size: 16 }),
      lang === "ar" ? "AR" : "EN"),
    open && React.createElement("div", { className: "cxh__langdrop" },
      ["en", "ar", "ku"].map(function (l) {
        return React.createElement("button", {
          key: l, type: "button",
          className: "cxh__langopt" + (lang === l ? " cxh__langopt--sel" : ""),
          onClick: function () { setLang(l); setOpen(false); },
        },
          lang === l && React.createElement(Icon, { name: "check", size: 14 }),
          t("lang." + l));
      }))
  );
}

// Solid header used across interior pages (no transparent-over-hero state).
function SrpHeader({ deal, onNav }) {
  const { t } = window.CxLang.useLang();
  return React.createElement("header", { className: "cxh cxh--solid srp-header" },
    React.createElement("div", { className: "cxh__inner" },
      React.createElement("div", { className: "cxh__brand" },
        React.createElement(Wordmark, { logoSrc: "assets/chiya-logomark.svg" })),
      React.createElement("nav", { className: "cxh__nav" },
        SRP_NAV.map((item) => {
          const active = (item.deal === "buy" && deal === "buy") || (item.deal === "rent" && deal === "rent");
          return React.createElement("a", {
            key: item.key, href: "#",
            className: "cxh__link" + (active ? " cxh__link--active" : ""),
            onClick: (e) => {
              e.preventDefault();
              if (item.key === "agents") { window.location.href = "Website-Agent Page.html"; return; }
              onNav && onNav(item.deal);
            },
          }, t("nav." + item.key));
        })),
      React.createElement("div", { className: "cxh__actions" },
        React.createElement(SrpLangSwitcher),
        React.createElement(window.CxThemeToggle, null),
        React.createElement("span", { className: "cxh__divider" }),
        React.createElement(Button, { hierarchy: "primary", size: "sm", className: "cxh__login" }, t("nav.login"))))
  );
}

window.SrpHeader = SrpHeader;
