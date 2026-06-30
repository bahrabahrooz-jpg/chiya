const React = window.React;
const { Wordmark, Button, Icon } = window.ChiyaEstateDesignSystem_686f57;

const PDP_NAV = ["Buy", "Rent", "Sell", "Agents", "About", "Blog", "Contact"];
// nav items that require auth before proceeding (Sell → submit-property flow)
const PDP_NAV_AUTH = { Sell: true };

function PdpHeader({ onNav, onAuth }) {
  return React.createElement("header", { className: "cxh cxh--solid", "data-screen-label": "Header" },
    React.createElement("div", { className: "cxh__inner" },
      React.createElement("div", { className: "cxh__brand" },
        React.createElement(Wordmark, { logoSrc: "assets/chiya-logomark.svg" })),
      React.createElement("nav", { className: "cxh__nav" },
        PDP_NAV.map((l) =>
          React.createElement("button", {
            key: l, type: "button",
            className: "cxh__link" + (l === "Buy" ? " cxh__link--active" : ""),
            onClick: () => { if (PDP_NAV_AUTH[l]) onAuth("register", "Create an account to list your property"); else onNav && onNav(l); },
          }, l))),
      React.createElement("div", { className: "cxh__actions" },
        React.createElement("button", { className: "cxh__lang", type: "button" },
          React.createElement(Icon, { name: "globe", size: 16 }), "EN"),
        React.createElement(window.CxThemeToggle, null),
        React.createElement("span", { className: "cxh__divider" }),
        React.createElement(Button, { hierarchy: "primary", size: "sm", className: "cxh__login", onClick: () => onAuth("login") }, "Login")))
  );
}

window.PdpHeader = PdpHeader;
