const React = window.React;
const { Avatar, Badge, Icon, Button, IconButton } = window.ChiyaEstateDesignSystem_686f57;

const AGENT_DETAIL = "Website-Agent Profile.html";

function AgentDirCard({ agent, saved, onSave, onView, showExtraStats = true, showWhatsapp = true }) {
  const a = agent;
  return React.createElement("article", { className: "agt-card", "data-screen-label": "Agent · " + a.name },
    // save (favorite) — requires login
    React.createElement("button", {
      type: "button",
      className: "agt-card__save" + (saved ? " agt-card__save--on" : ""),
      "aria-label": "Save agent", "aria-pressed": saved,
      onClick: () => onSave(a),
    }, React.createElement(Icon, { name: "heart", size: 18, fill: saved ? "currentColor" : "none" })),

    // portrait
    React.createElement("div", { className: "agt-card__photo" },
      React.createElement(Avatar, { src: a.photo, name: a.name, size: "xl", verified: a.verified })),

    // identity
    React.createElement("div", { className: "agt-card__id" },
      React.createElement("h3", { className: "agt-card__name" }, a.name),
      a.verified && React.createElement(Badge, { variant: "brand", size: "sm", icon: "badge-check" }, "Verified")),

    // meta: agency · city
    React.createElement("div", { className: "agt-card__meta" },
      React.createElement("span", { className: "agt-card__metaitem" },
        React.createElement(Icon, { name: "building-2", size: 14 }), a.agency),
      React.createElement("span", { className: "agt-card__dot" }),
      React.createElement("span", { className: "agt-card__metaitem" },
        React.createElement(Icon, { name: "map-pin", size: 14 }), a.city)),

    // rating
    React.createElement("div", { className: "agt-card__rating" },
      React.createElement(Icon, { name: "star", size: 15, fill: "currentColor" }),
      React.createElement("b", null, a.rating.toFixed(1)),
      React.createElement("span", null, "(" + a.reviews + " reviews)")),

    // stat strip
    showExtraStats
      ? React.createElement("div", { className: "agt-card__stats" },
          React.createElement("div", { className: "agt-card__stat" },
            React.createElement("b", null, a.listings),
            React.createElement("span", null, "Active")),
          React.createElement("div", { className: "agt-card__stat" },
            React.createElement("b", null, a.sold),
            React.createElement("span", null, "Sold")),
          React.createElement("div", { className: "agt-card__stat" },
            React.createElement("b", null, a.experience),
            React.createElement("span", null, "Years")))
      : React.createElement("div", { className: "agt-card__listings" },
          React.createElement(Icon, { name: "building-2", size: 15 }),
          React.createElement("b", null, a.listings), " active listings"),

    // contact actions
    React.createElement("div", { className: "agt-card__contact" },
      React.createElement("a", {
        className: "agt-card__cbtn agt-card__cbtn--ghost",
        href: "tel:" + a.phone.replace(/\s+/g, ""),
        "aria-label": "Call " + a.name,
      }, React.createElement(Icon, { name: "phone", size: 16 }), "Call"),
      showWhatsapp && React.createElement("a", {
        className: "agt-card__cbtn agt-card__cbtn--wa",
        href: "https://wa.me/" + a.whatsapp, target: "_blank", rel: "noopener",
        "aria-label": "WhatsApp " + a.name,
      }, React.createElement(Icon, { name: "message-circle", size: 16 }), "WhatsApp")),

    // view profile
    React.createElement(Button, {
      hierarchy: "primary", size: "md", fullWidth: true, iconTrailing: "arrow-right",
      onClick: () => onView(a),
    }, "View profile")
  );
}

window.AgentDirCard = AgentDirCard;
