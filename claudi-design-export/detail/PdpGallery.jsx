const React = window.React;
const { Icon, IconButton, Badge } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef } = React;

// In-page gallery: one hero image + thumbnail strip. No modal/lightbox.
// Thumbnails swap the hero in place; prev/next arrows do the same.
// The final collapsed thumbnail reveals the rest of the photos inline.
function PdpGallery({ images, property, favorite, onFavorite, onShare }) {
  const VISIBLE = 5; // tiles in the collapsed strip (last one carries the "+N" overlay)
  const total = images.length;
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const heroRef = useRef(null);

  const go = (delta) => setActive((c) => (c + delta + total) % total);
  const onKey = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
  };

  const thumb = (i) => React.createElement("button", {
    key: i, type: "button",
    className: "pdp-gal__thumb" + (i === active ? " pdp-gal__thumb--active" : ""),
    onClick: () => setActive(i),
    "aria-label": "View photo " + (i + 1) + " of " + total,
    "aria-current": i === active ? "true" : undefined,
  },
    React.createElement("img", { src: images[i], alt: property.title + " thumbnail " + (i + 1), loading: "lazy" }));

  // ---- hero ----
  const hero = React.createElement("div", {
    className: "pdp-gal__hero", ref: heroRef, tabIndex: 0, onKeyDown: onKey,
    "data-screen-label": "Image gallery",
  },
    React.createElement("img", {
      key: active, className: "pdp-gal__img pdp-gal__img--enter",
      src: images[active], alt: property.title + " \u2014 photo " + (active + 1),
    }),
    React.createElement("div", { className: "pdp-gal__grad" }),
    React.createElement("div", { className: "pdp-gal__tl" },
      property.featured && React.createElement(Badge, { variant: "gold", size: "md", icon: "star" }, "Featured"),
      React.createElement(Badge, { variant: "success", size: "md", dot: true }, property.status)),
    React.createElement("div", { className: "pdp-gal__tr" },
      React.createElement(IconButton, { icon: "share-2", label: "Share", variant: "glass", onClick: onShare }),
      React.createElement(IconButton, { icon: "heart", label: "Save", variant: "glass", active: favorite, onClick: onFavorite })),
    property.hasTour && React.createElement("span", { className: "pdp-gal__tour" },
      React.createElement(Icon, { name: "play-circle", size: 15 }), "360\u00b0 tour"),
    React.createElement("span", { className: "pdp-gal__count" },
      React.createElement(Icon, { name: "images", size: 14 }), (active + 1) + " / " + total),
    React.createElement("button", {
      className: "pdp-gal__nav pdp-gal__nav--prev", type: "button",
      "aria-label": "Previous photo", onClick: () => go(-1),
    }, React.createElement(Icon, { name: "chevron-left", size: 22 })),
    React.createElement("button", {
      className: "pdp-gal__nav pdp-gal__nav--next", type: "button",
      "aria-label": "Next photo", onClick: () => go(1),
    }, React.createElement(Icon, { name: "chevron-right", size: 22 })));

  // ---- collapsed strip: 4 thumbs + a "+N more" reveal tile ----
  const collapsedTiles = [];
  const hasMore = total > VISIBLE;
  for (let i = 0; i < VISIBLE && i < total; i++) {
    if (hasMore && i === VISIBLE - 1) {
      collapsedTiles.push(
        React.createElement("button", {
          key: "more", type: "button", className: "pdp-gal__thumb pdp-gal__thumb--more",
          onClick: () => setExpanded(true), "aria-label": "Show all " + total + " photos",
        },
          React.createElement("img", { src: images[i], alt: "", loading: "lazy" }),
          React.createElement("span", { className: "pdp-gal__more" },
            React.createElement("b", null, "+" + (total - VISIBLE)),
            React.createElement("span", null, "More photos"))));
    } else {
      collapsedTiles.push(thumb(i));
    }
  }

  const strip = expanded
    ? React.createElement(React.Fragment, null,
        React.createElement("div", { className: "pdp-gal__strip pdp-gal__strip--all" },
          images.map((_, i) => thumb(i))),
        React.createElement("button", {
          className: "pdp-gal__collapse", type: "button", onClick: () => setExpanded(false),
        }, React.createElement(Icon, { name: "chevron-up", size: 16 }), "Show fewer photos"))
    : React.createElement("div", { className: "pdp-gal__strip" }, collapsedTiles);

  return React.createElement("div", { className: "pdp-gal" }, hero, strip);
}

window.PdpGallery = PdpGallery;
