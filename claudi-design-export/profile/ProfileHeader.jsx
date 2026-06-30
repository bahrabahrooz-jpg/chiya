const React = window.React;
const { Wordmark, Button, Icon } = window.ChiyaEstateDesignSystem_686f57;

const PRO_NAV = ["Buy", "Rent", "Sell", "Agents", "About", "Blog", "Contact"];
const PRO_HOME = "Website-Homepage.html";
const PRO_SRP = "Website-Search Results page.html";
const PRO_DIR = "Website-Agent Page.html";

// Solid interior header — identical to the Agents directory / Search results header.
function ProfileHeader({ onLogin, onRegister }) {
  const go = (l) => {
    if (l === "Buy") window.location.href = PRO_SRP + "?deal=buy";
    else if (l === "Rent") window.location.href = PRO_SRP + "?deal=rent";
    else if (l === "Agents") window.location.href = PRO_DIR;
    else window.location.href = PRO_HOME;
  };
  return React.createElement("header", { className: "cxh cxh--solid" },
    React.createElement("div", { className: "cxh__inner" },
      React.createElement("div", { className: "cxh__brand", onClick: () => { window.location.href = PRO_HOME; }, style: { cursor: "pointer" } },
        React.createElement(Wordmark, { logoSrc: "assets/chiya-logomark.svg" })),
      React.createElement("nav", { className: "cxh__nav" },
        PRO_NAV.map((l) =>
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

window.ProfileHeader = ProfileHeader;
