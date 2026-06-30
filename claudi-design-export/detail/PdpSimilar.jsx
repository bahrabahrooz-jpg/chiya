const React = window.React;
const { PropertyCard } = window.ChiyaEstateDesignSystem_686f57;

const SD = window.PDP_DATA;

function PdpSimilar({ favorites, onFavorite }) {
  const fmt = (n) => "$" + n.toLocaleString("en-US");
  return React.createElement("section", { className: "pdp-similar", "data-screen-label": "Similar properties" },
    React.createElement("div", { className: "pdp-similar__head" },
      React.createElement("div", null,
        React.createElement("div", { className: "pdp-similar__eyebrow" }, "Keep exploring"),
        React.createElement("h2", { className: "pdp-similar__title" }, "Similar properties")),
      React.createElement("a", { className: "pdp-similar__link", href: "Website-Search Results page.html" },
        "View all villas in Erbil",
        React.createElement(window.ChiyaEstateDesignSystem_686f57.Icon, { name: "arrow-right", size: 18 }))),
    React.createElement("div", { className: "pdp-similar__grid" },
      SD.similar.map((l) => React.createElement(PropertyCard, {
        key: l.id, image: l.cover, price: fmt(l.price),
        title: l.title, address: l.address, beds: l.beds, baths: l.baths, area: l.area,
        status: l.status, featured: l.featured, photoCount: l.photoCount,
        favorite: favorites.includes(l.id),
        onFavorite: (e) => { e.preventDefault(); e.stopPropagation(); onFavorite(l.id); },
        style: { cursor: "pointer" },
      })))
  );
}

window.PdpSimilar = PdpSimilar;
