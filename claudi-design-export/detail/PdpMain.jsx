const React = window.React;
const { Icon, MapPanel, Button } = window.ChiyaEstateDesignSystem_686f57;
const { useState } = React;

const D = window.PDP_DATA;

function QuickFacts({ p }) {
  const facts = [
    { icon: "bed-double", val: p.beds, lbl: "Bedrooms" },
    { icon: "bath", val: p.baths, lbl: "Bathrooms" },
    { icon: "maximize-2", val: p.area + " m²", lbl: "Built-up area" },
  ];
  return React.createElement("div", { className: "pdp-facts" },
    facts.map((f) => React.createElement("div", { key: f.lbl, className: "pdp-fact" },
      React.createElement("div", { className: "pdp-fact__lbl" }, f.lbl),
      React.createElement("div", { className: "pdp-fact__row" },
        React.createElement("span", { className: "pdp-fact__ic" }, React.createElement(Icon, { name: f.icon, size: 19 })),
        React.createElement("div", { className: "pdp-fact__val" }, f.val)))));
}

function Description({ paragraphs }) {
  const [expanded, setExpanded] = useState(false);
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Description" },
    React.createElement("h2", { className: "pdp-sec__title" }, "About this home"),
    React.createElement("div", { className: "pdp-desc" + (expanded ? "" : " pdp-desc--clamped") },
      paragraphs.map((t, i) => React.createElement("p", { key: i }, t))),
    React.createElement("button", { className: "pdp-readmore", type: "button", onClick: () => setExpanded((v) => !v) },
      expanded ? "Show less" : "Read full description",
      React.createElement(Icon, { name: expanded ? "chevron-up" : "chevron-down", size: 17 })));
}

function Features({ features }) {
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Property features" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Property features"),
    React.createElement("div", { className: "pdp-fgrid" },
      features.map((f) => React.createElement("div", { key: f.label, className: "pdp-frow" },
        React.createElement("span", { className: "pdp-frow__ic" }, React.createElement(Icon, { name: f.icon, size: 19 })),
        React.createElement("div", { className: "pdp-frow__txt" },
          React.createElement("div", { className: "pdp-frow__lbl" }, f.label),
          React.createElement("div", { className: "pdp-frow__val" }, f.value))))));
}

function Amenities({ amenities }) {
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Amenities" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Amenities"),
    React.createElement("div", { className: "pdp-amen" },
      amenities.map((a) => React.createElement("div", { key: a.label, className: "pdp-amenrow" },
        React.createElement("span", { className: "pdp-amenrow__ic" }, React.createElement(Icon, { name: a.icon, size: 17 })),
        a.label))));
}

function Location({ p, nearby }) {
  // Shaqlawa Hills, Erbil, Kurdistan Region
  const lat = 36.4078, lng = 44.3239;
  const d = 0.018;
  const bbox = [lng - d, lat - d * 0.62, lng + d, lat + d * 0.62].join("%2C");
  const embedSrc = "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox +
    "&layer=mapnik&marker=" + lat + "%2C" + lng;
  const fullLink = "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=14/" + lat + "/" + lng;
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Location" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Location & neighbourhood"),
    React.createElement("div", { className: "pdp-loc" },
      React.createElement("div", { className: "pdp-loc__map pdp-loc__map--real" },
        React.createElement("iframe", {
          className: "pdp-loc__frame", title: "Map of " + p.address,
          src: embedSrc, loading: "lazy",
          referrerPolicy: "no-referrer-when-downgrade",
        }),
        React.createElement("div", { className: "pdp-loc__badge" },
          React.createElement(Icon, { name: "map-pin", size: 15 }),
          React.createElement("span", null, p.neighborhood + ", " + p.city)),
        React.createElement("a", {
          className: "pdp-loc__expand", href: fullLink, target: "_blank", rel: "noopener",
        }, React.createElement(Icon, { name: "maximize", size: 14 }), "View larger map")))
  );
}

function FloorPlan({ onDownload }) {
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Floor plan" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Floor plan & documents"),
    React.createElement("div", { className: "pdp-floor" },
      React.createElement("div", { className: "pdp-floor__plan" },
        React.createElement("img", {
          src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&h=625&fit=crop",
          alt: "Floor plan", style: { opacity: .9 },
        }),
        React.createElement("button", { className: "pdp-floor__expand", type: "button", onClick: onDownload },
          React.createElement(Icon, { name: "maximize", size: 15 }), "View floor plan")),
      React.createElement("div", { className: "pdp-doc" },
        React.createElement("div", { className: "pdp-docrow" },
          React.createElement("span", { className: "pdp-docrow__ic" }, React.createElement(Icon, { name: "file-text", size: 20 })),
          React.createElement("div", { className: "pdp-docrow__txt" },
            React.createElement("b", null, "Property brochure"),
            React.createElement("span", null, "PDF · 4.2 MB · floor plans, specs & finishes"))),
        React.createElement(Button, { hierarchy: "secondary", iconLeading: "download", fullWidth: true, onClick: onDownload }, "Download brochure"),
        React.createElement(Button, { hierarchy: "tertiary", iconLeading: "ruler", fullWidth: true, onClick: onDownload }, "Request site plan")))
  );
}

function PdpMain({ onDownload }) {
  const p = D.property;
  return React.createElement("div", { className: "pdp-content" },
    React.createElement(QuickFacts, { p }),
    React.createElement(Description, { paragraphs: D.description }),
    React.createElement(Features, { features: D.features }),
    React.createElement(Amenities, { amenities: D.amenities }),
    React.createElement(Location, { p, nearby: D.nearby }),
    React.createElement(FloorPlan, { onDownload }));
}

window.PdpMain = PdpMain;
