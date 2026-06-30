const React = window.React;
const { Wordmark, Icon, Button } = window.ChiyaEstateDesignSystem_686f57;

const SOCIAL = [
  { label: "Instagram", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.41-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.17.42-.36 1.04-.41 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.41 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.17 1.04.36 2.19.41 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.41.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.17-.42.36-1.04.41-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.41-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.17-1.04-.36-2.19-.41-1.24-.06-1.61-.07-4.76-.07Zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36Zm5.48-1.62a1.24 1.24 0 1 1 0 2.48 1.24 1.24 0 0 1 0-2.48Z"/></svg>' },
  { label: "Facebook", svg: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>' },
  { label: "X", svg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.96 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z"/></svg>' },
  { label: "YouTube", svg: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.5 6.5a3 3 0 0 0-2.11-2.13C19.5 3.86 12 3.86 12 3.86s-7.5 0-9.39.51A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.11 2.13c1.89.51 9.39.51 9.39.51s7.5 0 9.39-.51A3 3 0 0 0 23.5 17.5c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z"/></svg>' },
];

/* ---------- 11 · Premium CTA ---------- */
function PremiumCTA({ onSearch, onContact }) {
  const actions = [
    { icon: "search", title: "Find a property", desc: "Browse verified luxury listings across Kurdistan.", cta: "Explore homes", onClick: onSearch },
    { icon: "messages-square", title: "Contact an agent", desc: "Speak with a verified Chiya agent — no obligation.", cta: "Talk to an agent", onClick: onContact },
    { icon: "key", title: "Submit a property", desc: "List your home and reach serious, pre-qualified buyers.", cta: "List property", onClick: onContact },
  ];
  return React.createElement("section", { className: "cxk-cta", "data-screen-label": "Premium call to action" },
    React.createElement("div", { className: "cxk-cta__inner" },
      React.createElement("div", { className: "cx-eyebrow cxk-cta__eyebrow" }, "Get started"),
      React.createElement("h2", { className: "cxk-cta__title" }, "Your next move with Chiya"),
      React.createElement("p", { className: "cxk-cta__sub" },
        "Whether you're buying, renting, or selling — start with people you can trust."),
      React.createElement("div", { className: "cxk-cta__grid" },
        actions.map((a) => React.createElement("div", { key: a.title, className: "cxcta-card" },
          React.createElement("span", { className: "cxcta-card__ic" }, React.createElement(Icon, { name: a.icon, size: 24 })),
          React.createElement("h3", { className: "cxcta-card__title" }, a.title),
          React.createElement("p", { className: "cxcta-card__desc" }, a.desc),
          React.createElement("button", { className: "cxcta-card__btn", type: "button", onClick: a.onClick },
            a.cta, React.createElement(Icon, { name: "arrow-right", size: 17 }))))))
  );
}

/* ---------- 12 · Footer ---------- */
function SiteFooter() {
  const cols = [
    { h: "Properties", items: ["Buy", "Rent", "Luxury properties", "Featured listings", "Commercial properties"] },
    { h: "Agents", items: ["Find an agent", "Verified agents", "Join as an agent"] },
    { h: "Company", items: ["About Chiya", "Blog", "FAQ", "Contact"] },
  ];
  const contact = [
    { icon: "map-pin", text: "100 Meter Road, Erbil, Kurdistan" },
    { icon: "phone", text: "+964 750 000 0000" },
    { icon: "mail", text: "hello@chiyaestate.com" },
  ];
  return React.createElement("footer", { className: "cxk-footer", "data-screen-label": "Footer" },
    React.createElement("div", { className: "cxk-footer__inner" },
      React.createElement("div", { className: "cxk-footer__brand" },
        React.createElement(Wordmark, { logoSrc: "assets/chiya-logomark.svg" }),
        React.createElement("p", null, "Luxury homes across the Kurdistan Region of Iraq — connecting you with verified agents and exceptional properties."),
        React.createElement("ul", { className: "cxk-footer__contact" },
          contact.map((c) => React.createElement("li", { key: c.text },
            React.createElement(Icon, { name: c.icon, size: 16 }), React.createElement("span", null, c.text)))),
        React.createElement("div", { className: "cxk-footer__social" },
          SOCIAL.map((s) =>
            React.createElement("a", { key: s.label, href: "#", "aria-label": s.label,
              dangerouslySetInnerHTML: { __html: s.svg } })))),
      React.createElement("div", { className: "cxk-footer__cols" },
        cols.map((c) => React.createElement("div", { key: c.h, className: "cxk-footer__col" },
          React.createElement("h4", null, c.h),
          c.items.map((i) => React.createElement("a", { key: i, href: "#" }, i)))))),
    React.createElement("div", { className: "cxk-footer__bar" },
      React.createElement("span", null, "\u00A9 2026 Chiya Estate. All rights reserved."),
      React.createElement("div", { className: "cxk-footer__right" },
        React.createElement("button", { className: "cxk-footer__lang", type: "button" },
          React.createElement(Icon, { name: "globe", size: 15 }), "English"),
        React.createElement("div", { className: "cxk-footer__legal" },
          React.createElement("a", { href: "#" }, "Privacy"),
          React.createElement("a", { href: "#" }, "Terms"),
          React.createElement("a", { href: "#" }, "Cookies"))))
  );
}

window.CxPremiumCTA = PremiumCTA;
window.SiteFooter = SiteFooter;
