const React = window.React;
const { Icon, Avatar, Badge, Button, PropertyCard } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef, useEffect, useMemo } = React;

const M = window.PROFILE_DATA;

/* ---------- Breadcrumb: Home / Agents / Daban Ali ---------- */
function ProfileCrumb({ agent }) {
  return React.createElement("nav", { className: "pdp-crumb", "aria-label": "Breadcrumb" },
    React.createElement("a", { className: "pdp-crumb__link", href: "Website-Homepage.html" },
      React.createElement(Icon, { name: "home", size: 15 }), "Home"),
    React.createElement(Icon, { name: "chevron-right", size: 15, className: "pdp-crumb__sep" }),
    React.createElement("a", { className: "pdp-crumb__link", href: "Website-Agent Page.html" }, "Agents"),
    React.createElement(Icon, { name: "chevron-right", size: 15, className: "pdp-crumb__sep" }),
    React.createElement("span", { className: "pdp-crumb__current", "aria-current": "page" }, agent.name));
}

/* ---------- Hero — portrait + all agent info, contact, actions ---------- */
function ProfileHero({ agent, saved, onSave, onShare, onCall, onWhatsApp, onEmail }) {
  return React.createElement("header", { className: "pro-hero", "data-screen-label": "Agent profile hero" },
    React.createElement("div", { className: "pro-hero__photowrap" },
      React.createElement("div", { className: "pro-hero__photo" },
        React.createElement("img", { src: agent.photo, alt: agent.name }),
        React.createElement("div", { className: "pro-hero__photograd" }),
        agent.verified && React.createElement("span", { className: "pro-hero__vbadge" },
          React.createElement(Icon, { name: "badge-check", size: 15 }), "Verified agent"))),

    React.createElement("div", { className: "pro-hero__body" },
      React.createElement("div", { className: "pro-hero__namerow" },
        React.createElement("div", { className: "pro-hero__nameblock" },
          React.createElement("div", { className: "pro-hero__eyebrow" }, agent.title),
          React.createElement("h1", { className: "pro-hero__name" }, agent.name)),
        React.createElement("div", { className: "pro-hero__nameactions" },
          React.createElement("button", {
            type: "button", onClick: onSave,
            className: "pro-secbtn" + (saved ? " pro-secbtn--saved" : ""),
          },
            React.createElement(Icon, { name: "heart", size: 17, fill: saved ? "currentColor" : "none" }),
            saved ? "Saved" : "Save agent"),
          React.createElement("button", { type: "button", className: "pro-secbtn", onClick: onShare },
            React.createElement(Icon, { name: "share-2", size: 17 }), "Share"))),

      React.createElement("div", { className: "pro-hero__meta" },
        React.createElement("span", { className: "pro-hero__metaitem" },
          React.createElement(Icon, { name: "building-2", size: 16 }), agent.agency),
        React.createElement("span", { className: "pro-hero__dot" }),
        React.createElement("span", { className: "pro-hero__metaitem" },
          React.createElement(Icon, { name: "map-pin", size: 16 }), agent.city)),

      React.createElement("div", { className: "pro-hero__facts" },
        React.createElement("div", { className: "pro-hero__fact" },
          React.createElement(Icon, { name: "star", size: 16, fill: "currentColor", className: "pro-hero__star" }),
          React.createElement("span", null,
            React.createElement("b", null, agent.rating.toFixed(1)), " (" + agent.reviews + " reviews)")),
        React.createElement("span", { className: "pro-hero__vrule" }),
        React.createElement("div", { className: "pro-hero__fact" },
          React.createElement(Icon, { name: "calendar-check", size: 16 }),
          React.createElement("span", null, React.createElement("b", null, agent.experience), " years experience")),
        React.createElement("span", { className: "pro-hero__vrule" }),
        React.createElement("div", { className: "pro-hero__fact" },
          React.createElement(Icon, { name: "languages", size: 16 }),
          React.createElement("span", null, agent.languages.join(" · ")))),

      React.createElement("div", { className: "pro-hero__rule" }),
      React.createElement("p", { className: "pro-hero__intro" }, M.intro),

      React.createElement("div", { className: "pro-hero__actions" },
        React.createElement("button", { type: "button", className: "pro-act pro-act--wa", onClick: onWhatsApp },
          React.createElement(Icon, { name: "message-circle", size: 19 }), "WhatsApp"),
        React.createElement("button", { type: "button", className: "pro-act pro-act--call", onClick: onCall },
          React.createElement(Icon, { name: "phone", size: 18 }), "Call agent"),
        React.createElement("button", { type: "button", className: "pro-act pro-act--email", onClick: onEmail },
          React.createElement(Icon, { name: "mail", size: 18 }), "Email agent")),

      React.createElement("div", { className: "pro-hero__respond" },
        React.createElement(Icon, { name: "zap", size: 15 }),
        React.createElement("span", null, "Avg. response time: ", React.createElement("b", null, "within 1 hour")))));
}

/* ---------- Performance stats (single horizontal strip) ---------- */
function TrustMetrics({ agent }) {
  return React.createElement("section", { className: "pro-metrics", "data-screen-label": "Performance stats" },
    M.metrics.map((m) => React.createElement("div", { key: m.label, className: "pro-metric" },
      React.createElement("span", { className: "pro-metric__ic" }, React.createElement(Icon, { name: m.icon, size: 22 })),
      React.createElement("div", { className: "pro-metric__txt" },
        React.createElement("div", { className: "pro-metric__val" }, m.value),
        React.createElement("div", { className: "pro-metric__lbl" }, m.label),
        React.createElement("div", { className: "pro-metric__desc" }, m.desc)))));
}

/* ---------- About + specialties + service areas ---------- */
function About({ agent }) {
  return React.createElement("section", { className: "pdp-sec pro-about", "data-screen-label": "About agent" },
    React.createElement("h2", { className: "pdp-sec__title" }, "About " + agent.name),
    React.createElement("div", { className: "pdp-desc" }, M.about.map((p, i) => React.createElement("p", { key: i }, p))),
    React.createElement("div", { className: "pro-tags" },
      React.createElement("div", { className: "pro-tagblock" },
        React.createElement("div", { className: "pro-taglabel" }, "Specialties"),
        React.createElement("div", { className: "pro-chips" },
          M.specialties.map((s) => React.createElement("span", { key: s, className: "pro-chip" }, s)))),
      React.createElement("div", { className: "pro-tagblock" },
        React.createElement("div", { className: "pro-taglabel" }, "Service areas"),
        React.createElement("div", { className: "pro-chips" },
          M.areas.map((a) => React.createElement("span", { key: a.name, className: "pro-chip" },
            React.createElement(Icon, { name: "map-pin", size: 15 }), a.name))))));
}

/* ---------- Why clients choose this agent ---------- */
function WhyChoose() {
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Why clients choose" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Why clients choose Daban"),
    React.createElement("div", { className: "pro-why" },
      M.whyChoose.map((w) => React.createElement("article", { key: w.title, className: "pro-whycard" },
        React.createElement("span", { className: "pro-whycard__ic" }, React.createElement(Icon, { name: w.icon, size: 22 })),
        React.createElement("h3", { className: "pro-whycard__title" }, w.title),
        React.createElement("p", { className: "pro-whycard__desc" }, w.desc)))));
}

/* ---------- Areas covered ---------- */
function AreasCovered() {
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Areas covered" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Areas covered"),
    React.createElement("div", { className: "pro-areas" },
      M.areas.map((a) => React.createElement("div", { key: a.name, className: "pro-area" },
        React.createElement("span", { className: "pro-area__ic" }, React.createElement(Icon, { name: "map-pin", size: 17 })),
        React.createElement("div", { className: "pro-area__txt" },
          React.createElement("span", { className: "pro-area__name" }, a.name),
          React.createElement("span", { className: "pro-area__note" }, a.note))))));
}

/* ---------- Listings sort dropdown (matches directory sort popover) ---------- */
function SortMenu({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  const current = M.sortOptions.find((o) => o.value === value) || M.sortOptions[0];
  return React.createElement("div", { className: "agt-sort", ref },
    React.createElement("button", {
      type: "button", className: "agt-sort__btn" + (open ? " agt-sort__btn--open" : ""),
      "aria-expanded": open, onClick: () => setOpen((o) => !o),
    },
      React.createElement(Icon, { name: "arrow-up-down", size: 16, className: "agt-sort__lead" }),
      React.createElement("span", { className: "agt-sort__cap" }, "Sort:"),
      React.createElement("span", { className: "agt-sort__val" }, current.label),
      React.createElement(Icon, { name: "chevron-down", size: 16, className: "agt-sort__chev" + (open ? " agt-sort__chev--open" : "") })),
    open && React.createElement("div", { className: "agt-sort__panel" },
      M.sortOptions.map((o) => React.createElement("button", {
        key: o.value, type: "button",
        className: "agt-sort__opt" + (o.value === value ? " agt-sort__opt--on" : ""),
        onClick: () => { onChange(o.value); setOpen(false); },
      },
        React.createElement("span", { style: { display: "inline-flex", alignItems: "center", gap: 9 } },
          React.createElement(Icon, { name: o.icon, size: 16 }), o.label),
        o.value === value && React.createElement(Icon, { name: "check", size: 17 }))))
  );
}

function sortListings(list, sort) {
  const arr = [...list];
  if (sort === "price-desc") return arr.sort((a, b) => b.price - a.price);
  if (sort === "price-asc") return arr.sort((a, b) => a.price - b.price);
  return arr.sort((a, b) => a.since - b.since); // newest = smallest "days ago"
}

/* ---------- Active listings ---------- */
function ActiveListings({ agent, favorites, onFavorite, onOpen }) {
  const [sort, setSort] = useState("newest");
  const fmt = (l) => "$" + l.price.toLocaleString("en-US");
  const list = useMemo(() => sortListings(M.listings, sort), [sort]);
  return React.createElement("section", { className: "pdp-sec pro-listings", "data-screen-label": "Active listings" },
    React.createElement("div", { className: "pro-secrow" },
      React.createElement("div", null,
        React.createElement("h2", { className: "pdp-sec__title", style: { margin: 0 } }, "Active listings"),
        React.createElement("p", { className: "pro-secrow__sub" },
          React.createElement("b", null, agent.listings), " homes for sale & rent across Erbil")),
      React.createElement(SortMenu, { value: sort, onChange: setSort })),
    React.createElement("div", { className: "pro-listgrid" },
      list.map((l) => React.createElement(PropertyCard, {
        key: l.id, image: l.cover, price: fmt(l), period: l.deal === "rent" ? "mo" : undefined,
        title: l.title, address: l.address, beds: l.beds, baths: l.baths, area: l.area,
        status: l.status, featured: l.featured, photoCount: l.photoCount,
        favorite: favorites.includes(l.id),
        onFavorite: (e) => { e.preventDefault(); e.stopPropagation(); onFavorite(l.id); },
        onClick: () => onOpen(l), style: { cursor: "pointer" },
      }))),
    React.createElement("div", { className: "pro-listmore" },
      React.createElement(Button, { hierarchy: "secondary", size: "lg", iconTrailing: "arrow-right",
        onClick: () => { window.location.href = "Website-Search Results page.html"; } },
        "View all " + agent.listings + " listings")));
}

/* ---------- Recently sold / rented ---------- */
function RecentlySold() {
  const fmt = (n) => "$" + n.toLocaleString("en-US");
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Recently sold" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Recently sold & rented"),
    React.createElement("p", { className: "pdp-sec__lead" }, "A track record of confident closings \u2014 proof of performance across Erbil\u2019s premier communities."),
    React.createElement("div", { className: "pro-soldgrid" },
      M.sold.map((s) => React.createElement("article", { key: s.id, className: "pro-sold" },
        React.createElement("div", { className: "pro-sold__media" },
          React.createElement("img", { src: s.cover, alt: s.title, loading: "lazy" }),
          React.createElement("span", { className: "pro-sold__badge" }, s.deal)),
        React.createElement("div", { className: "pro-sold__body" },
          React.createElement("div", { className: "pro-sold__price" }, fmt(s.price), s.deal === "Rented" && React.createElement("small", null, " /mo")),
          React.createElement("div", { className: "pro-sold__title" }, s.title),
          React.createElement("div", { className: "pro-sold__addr" },
            React.createElement(Icon, { name: "map-pin", size: 13 }), s.address),
          React.createElement("div", { className: "pro-sold__foot" },
            React.createElement("span", { className: "pro-sold__specs" },
              s.beds + " bd · " + s.baths + " ba · " + s.area + " m²"),
            React.createElement("span", { className: "pro-sold__when" },
              React.createElement(Icon, { name: "circle-check", size: 13 }), s.when))))))
  );
}

/* ---------- Reviews ---------- */
function Stars({ n, size = 15 }) {
  return React.createElement("span", { className: "pro-stars" },
    [1, 2, 3, 4, 5].map((i) => React.createElement(Icon, {
      key: i, name: "star", size, fill: i <= n ? "currentColor" : "none",
      className: i <= n ? "pro-stars__on" : "pro-stars__off",
    })));
}

function Reviews({ agent }) {
  return React.createElement("section", { className: "pdp-sec", "data-screen-label": "Reviews" },
    React.createElement("h2", { className: "pdp-sec__title" }, "Reviews"),
    React.createElement("div", { className: "pro-rev__list" },
      M.reviews.map((r) => React.createElement("article", { key: r.id, className: "pro-revcard" },
        React.createElement("div", { className: "pro-revcard__head" },
          React.createElement(Avatar, { src: r.avatar, name: r.name, size: "md" }),
          React.createElement("div", { className: "pro-revcard__id" },
            React.createElement("div", { className: "pro-revcard__name" }, r.name),
            React.createElement("div", { className: "pro-revcard__deal" }, r.deal)),
          React.createElement("span", { className: "pro-revcard__when" }, r.when)),
        React.createElement(Stars, { n: r.stars }),
        React.createElement("p", { className: "pro-revcard__text" }, "\u201C" + r.text + "\u201D"))))
  );
}

window.ProfileCrumb = ProfileCrumb;
window.ProfileHero = ProfileHero;
window.ProfileTrustMetrics = TrustMetrics;
window.ProfileAbout = About;
window.ProfileWhyChoose = WhyChoose;
window.ProfileAreasCovered = AreasCovered;
window.ProfileActiveListings = ActiveListings;
window.ProfileRecentlySold = RecentlySold;
window.ProfileReviews = Reviews;
