const React = window.React;
const { Wordmark, Button, Icon } = window.ChiyaEstateDesignSystem_686f57;

const AGT_NAV = ["Buy", "Rent", "Sell", "Agents", "About", "Blog", "Contact"];
const AGT_HOME = "Website-Homepage.html";
const AGT_SRP = "Website-Search Results page.html";

// Solid interior header — matches the search-results header, "Agents" active.
function AgentsHeader({ onLogin, onRegister }) {
  const go = (l) => {
    if (l === "Buy") window.location.href = AGT_SRP + "?deal=buy";
    else if (l === "Rent") window.location.href = AGT_SRP + "?deal=rent";
    else if (l === "Agents") {/* current page */}
    else window.location.href = AGT_HOME;
  };
  return React.createElement("header", { className: "cxh cxh--solid" },
    React.createElement("div", { className: "cxh__inner" },
      React.createElement("div", { className: "cxh__brand", onClick: () => { window.location.href = AGT_HOME; }, style: { cursor: "pointer" } },
        React.createElement(Wordmark, { logoSrc: "assets/chiya-logomark.svg" })),
      React.createElement("nav", { className: "cxh__nav" },
        AGT_NAV.map((l) =>
          React.createElement("a", {
            key: l, href: "#",
            className: "cxh__link" + (l === "Agents" ? " cxh__link--active" : ""),
            onClick: (e) => { e.preventDefault(); go(l); },
          }, l))),
      React.createElement("div", { className: "cxh__actions" },
        React.createElement("button", { className: "cxh__lang", type: "button" },
          React.createElement(Icon, { name: "globe", size: 16 }), "EN"),
        React.createElement(window.CxThemeToggle, null),
        React.createElement("span", { className: "cxh__divider" }),
        React.createElement(Button, { hierarchy: "primary", size: "sm", className: "cxh__login", onClick: onLogin }, "Login")))
  );
}

window.AgentsHeader = AgentsHeader;
