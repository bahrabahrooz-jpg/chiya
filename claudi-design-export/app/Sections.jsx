const React = window.React;
const {
  PropertyCard, FeaturedPropertyCard, AgentCard, StatCard, Badge, Button, Icon, Avatar,
} = window.ChiyaEstateDesignSystem_686f57;

/* ---------- Section head ---------- */
function SectionHead({ eyebrow, title, sub, action, onAction, center }) {
  const { lang } = window.CxLang.useLang();
  return React.createElement("div", { className: "cxk-sechead" + (center ? " cxk-sechead--center" : "") },
    React.createElement("div", { className: "cxk-sechead__text" },
      eyebrow && React.createElement("div", { className: "cx-eyebrow" }, eyebrow),
      React.createElement("h2", { className: "cxk-sectitle" }, title),
      sub && React.createElement("p", { className: "cxk-secsub" }, sub)
    ),
    action && React.createElement(Button, {
      hierarchy: "tertiary",
      iconTrailing: lang === "ar" ? "arrow-left" : "arrow-right",
      onClick: onAction,
    }, action)
  );
}
window.CxSectionHead = SectionHead;

/* ---------- 04 · Featured properties ---------- */
function FeaturedProperties({ onOpen, onSearch }) {
  const { t } = window.CxLang.useLang();
  const d = window.CX_DATA;
  const f = d.featured;
  return React.createElement("section", { className: "cxk-section", "data-screen-label": "Featured properties" },
    React.createElement(SectionHead, {
      eyebrow: t("sec.feat.eyebrow"),
      title:   t("sec.feat.title"),
    }),
    React.createElement(FeaturedPropertyCard, {
      image: f.cover, thumbs: f.gallery, price: f.price, title: f.title, address: f.address,
      beds: f.beds, baths: f.baths, area: f.area, description: f.desc, agent: f.agent,
      actions: React.createElement(React.Fragment, null,
        React.createElement(Button, { hierarchy: "secondary", size: "sm", iconLeading: "calendar" },
          t("sec.feat.book")),
        React.createElement(Button, { hierarchy: "primary", size: "sm", onClick: function() { onOpen(f.id); } },
          t("sec.feat.view"))
      ),
    }),
    React.createElement("div", { style: { height: 44 } }),
    React.createElement(SectionHead, {
      eyebrow: t("sec.feat2.eyebrow"),
      title:   t("sec.feat2.title"),
      sub:     t("sec.feat2.sub"),
      action:  t("sec.feat2.action"),
      onAction: onSearch,
    }),
    React.createElement("div", { className: "cxk-grid3" },
      d.listings.map(function(l) {
        return React.createElement(PropertyCard, {
          key: l.id, image: l.cover, price: l.price, period: l.period,
          title: l.title, address: l.address,
          beds: l.beds, baths: l.baths, area: l.area,
          status: l.status, featured: l.featured,
          photoCount: l.photoCount,
          onClick: function() { onOpen(l.id); },
          style: { cursor: "pointer" },
        });
      })
    )
  );
}

/* ---------- 05 · Property categories ---------- */
const TYPE_BY_CAT = {
  Villas: "villa", Apartments: "apartment", Houses: "house",
  Commercial: "commercial", Land: "land",
};

function Categories({ onSearch }) {
  const { t } = window.CxLang.useLang();
  const cats = window.CX_DATA.categories;
  return React.createElement("section", { className: "cxk-section", "data-screen-label": "Property categories" },
    React.createElement(SectionHead, {
      eyebrow: t("sec.cats.eyebrow"),
      title:   t("sec.cats.title"),
      sub:     t("sec.cats.sub"),
    }),
    React.createElement("div", { className: "cxk-cats" },
      cats.map(function(c) {
        return React.createElement("a", {
          key: c.name, href: "#", className: "cxcat",
          onClick: function(e) { e.preventDefault(); onSearch && onSearch({ type: TYPE_BY_CAT[c.name] }); },
        },
          React.createElement("img", { className: "cxcat__img", src: c.image, alt: c.name, loading: "lazy" }),
          React.createElement("div", { className: "cxcat__grad" }),
          React.createElement("div", { className: "cxcat__body" },
            React.createElement("span", { className: "cxcat__ic" }, React.createElement(Icon, { name: c.icon, size: 20 })),
            React.createElement("div", { className: "cxcat__name" }, t("cat." + c.name)),
            React.createElement("div", { className: "cxcat__count" }, c.count + " " + t("sec.cats.listings"))
          )
        );
      })
    )
  );
}

/* ---------- 06 · Popular locations ---------- */
function Locations({ onSearch }) {
  const { t, lang } = window.CxLang.useLang();
  const locs = window.CX_DATA.locations;
  return React.createElement("section", { className: "cxk-section", "data-screen-label": "Popular locations" },
    React.createElement(SectionHead, {
      eyebrow: t("sec.locs.eyebrow"),
      title:   t("sec.locs.title"),
      sub:     t("sec.locs.sub"),
    }),
    React.createElement("div", { className: "cxk-grid3" },
      locs.map(function(l) {
        var cityName = t("city." + l.city) !== "city." + l.city ? t("city." + l.city) : l.city;
        var blurb = t("loc.blurb." + l.city) !== "loc.blurb." + l.city ? t("loc.blurb." + l.city) : l.blurb;
        return React.createElement("a", {
          key: l.city, href: "#", className: "cxloc",
          onClick: function(e) { e.preventDefault(); onSearch && onSearch({ q: l.city }); },
        },
          React.createElement("div", { className: "cxloc__media" },
            React.createElement("img", { src: l.image, alt: cityName, loading: "lazy" }),
            React.createElement("div", { className: "cxloc__grad" }),
            React.createElement("div", { className: "cxloc__count" },
              React.createElement(Icon, { name: "home", size: 13 }),
              l.count + " " + t("sec.locs.properties")
            )
          ),
          React.createElement("div", { className: "cxloc__body" },
            React.createElement("div", { className: "cxloc__head" },
              React.createElement("h3", { className: "cxloc__city" }, cityName),
              React.createElement(Icon, { name: lang === "ar" ? "arrow-up-left" : "arrow-up-right", size: 20 })
            ),
            React.createElement("p", { className: "cxloc__blurb" }, blurb)
          )
        );
      })
    )
  );
}

/* ---------- 07 · Why Chiya ---------- */
function WhyChiya() {
  const { t } = window.CxLang.useLang();
  const pillars = window.CX_DATA.pillars;
  return React.createElement("section", { className: "cxk-whyband", "data-screen-label": "Why Chiya Estate" },
    React.createElement("div", { className: "cxk-container" },
      React.createElement(SectionHead, {
        center: true,
        eyebrow: t("sec.why.eyebrow"),
        title:   t("sec.why.title"),
        sub:     t("sec.why.sub"),
      }),
      React.createElement("div", { className: "cxk-grid4" },
        pillars.map(function(p) {
          var title = p.key != null && t("why." + p.key + ".title") !== "why." + p.key + ".title" ? t("why." + p.key + ".title") : p.title;
          var desc  = p.key != null && t("why." + p.key + ".desc")  !== "why." + p.key + ".desc"  ? t("why." + p.key + ".desc")  : p.desc;
          return React.createElement("div", { key: p.title, className: "cxpillar" },
            React.createElement("span", { className: "cxpillar__ic" }, React.createElement(Icon, { name: p.icon, size: 24 })),
            React.createElement("h3", { className: "cxpillar__title" }, title),
            React.createElement("p",  { className: "cxpillar__desc"  }, desc)
          );
        })
      )
    )
  );
}

/* ---------- 08 · Featured agents ---------- */
const AGENT_PROFILE_PAGE = "Website-Agent Profile.html";

function FeaturedAgents() {
  const { t } = window.CxLang.useLang();
  const a = window.CX_DATA.agents;
  const list = [a.lana, a.daban, a.avan, a.shene];
  function goDirectory() { window.location.href = "Website-Agent Page.html"; }
  function goProfile()   { window.location.href = AGENT_PROFILE_PAGE; }
  return React.createElement("section", { className: "cxk-section", "data-screen-label": "Featured agents" },
    React.createElement(SectionHead, {
      eyebrow: t("sec.agents.eyebrow"),
      title:   t("sec.agents.title"),
      sub:     t("sec.agents.sub"),
      action:  t("sec.agents.action"),
      onAction: goDirectory,
    }),
    React.createElement("div", { className: "cxk-grid4" },
      list.map(function(ag) {
        return React.createElement(AgentCard, {
          key: ag.name, ...ag,
          onClick: goProfile,
          style: { cursor: "pointer" },
          onCall:    function(e) { e && e.stopPropagation(); },
          onMessage: function(e) { e && e.stopPropagation(); },
        });
      })
    )
  );
}

/* ---------- 09 · Market insights ---------- */
function MarketInsights() {
  const { t } = window.CxLang.useLang();
  const ins = window.CX_DATA.insights;
  return React.createElement("section", { className: "cxk-section", "data-screen-label": "Market insights" },
    React.createElement(SectionHead, {
      eyebrow: t("sec.insights.eyebrow"),
      title:   t("sec.insights.title"),
      sub:     t("sec.insights.sub"),
      action:  t("sec.insights.action"),
    }),
    React.createElement("div", { className: "cxk-grid4" },
      ins.map(function(s, i) {
        var subMap = { "vs last year": "ins.vsyear", "this quarter": "ins.quarter", "faster than 2024": "ins.faster" };
        var label = t("ins." + i + ".label") !== "ins." + i + ".label" ? t("ins." + i + ".label") : s.label;
        var sub = subMap[s.sub] ? t(subMap[s.sub]) : s.sub;
        var delta = s.delta === "9 days" ? t("ins.days") : s.delta;
        return React.createElement(StatCard, { key: s.label, ...s, label: label, sub: sub, delta: delta });
      })
    )
  );
}

/* ---------- 10 · Testimonials ---------- */
function Testimonials() {
  const { t } = window.CxLang.useLang();
  const items = window.CX_DATA.testimonials;
  return React.createElement("section", { className: "cxk-section", "data-screen-label": "Testimonials" },
    React.createElement(SectionHead, {
      center: true,
      eyebrow: t("sec.test.eyebrow"),
      title:   t("sec.test.title"),
      sub:     t("sec.test.sub"),
    }),
    React.createElement("div", { className: "cxk-grid3" },
      items.map(function(item) {
        // Translate via i18n key when present, else fall back to the original content.
        var tr = function(suffix, fallback) {
          if (item.key == null) return fallback;
          var k = "test." + item.key + "." + suffix;
          var v = t(k);
          return v === k ? fallback : v;
        };
        var name = tr("name", item.name);
        return React.createElement("figure", { key: item.name, className: "cxtest" },
          React.createElement("div", { className: "cxtest__stars" },
            Array.from({ length: item.rating }).map(function(_, i) {
              return React.createElement(Icon, { key: i, name: "star", size: 16, fill: "currentColor" });
            })
          ),
          React.createElement("blockquote", { className: "cxtest__quote" }, "\u201C" + tr("quote", item.quote) + "\u201D"),
          React.createElement("figcaption", { className: "cxtest__by" },
            React.createElement(Avatar, { src: item.avatar, name: name, size: "md" }),
            React.createElement("div", null,
              React.createElement("div", { className: "cxtest__name" }, name),
              React.createElement("div", { className: "cxtest__loc"  }, tr("loc", item.location))
            )
          )
        );
      })
    )
  );
}

window.CxFeaturedProperties = FeaturedProperties;
window.CxCategories         = Categories;
window.CxLocations          = Locations;
window.CxWhyChiya           = WhyChiya;
window.CxFeaturedAgents     = FeaturedAgents;
window.CxMarketInsights     = MarketInsights;
window.CxTestimonials       = Testimonials;
