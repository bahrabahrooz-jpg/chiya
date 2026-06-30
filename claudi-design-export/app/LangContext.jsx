const React = window.React;
const { createContext, useContext, useState, useEffect } = React;

/* ============================================================
   CHIYA ESTATE — i18n / Language Context
   Supports: English (en) · Arabic (ar)
   Usage:
     const { t, lang, setLang } = window.CxLang.useLang();
   ============================================================ */

const TRANSLATIONS = {
  en: {
    /* ---- Language switcher ---- */
    "lang.en": "English",
    "lang.ar": "Arabic",
    "lang.ku": "Kurdish",

    /* ---- Navigation ---- */
    "nav.buy": "Buy",
    "nav.rent": "Rent",
    "nav.sell": "Sell",
    "nav.agents": "Agents",
    "nav.about": "About",
    "nav.blog": "Blog",
    "nav.contact": "Contact",
    "nav.login": "Login",
    "nav.signup": "Sign Up",

    /* ---- Hero ---- */
    "hero.badge": "Kurdistan's luxury home network",
    "hero.title": "Discover exceptional\nproperties across Kurdistan",
    "hero.sub": "Verified listings, trusted agents, and a hand-picked collection of premium homes — across Erbil, Duhok, and Sulaymaniyah.",

    /* ---- Search bar labels ---- */
    "search.lookingTo": "Looking to",
    "search.location": "Location",
    "search.propertyType": "Property type",
    "search.price": "Price",
    "search.cta": "Search",

    /* ---- Deal options ---- */
    "deal.buy": "Buy",
    "deal.buy.sub": "Find a home to own",
    "deal.rent": "Rent",
    "deal.rent.sub": "Find a place to lease",

    /* ---- Location options ---- */
    "loc.all": "All locations",
    "loc.all.sub": "Across Kurdistan",
    "loc.erbil.sub": "248 listings",
    "loc.duhok.sub": "86 listings",
    "loc.sulaymaniyah.sub": "154 listings",
    "loc.halabja.sub": "32 listings",

    /* ---- Property type options ---- */
    "type.all": "All property types",
    "type.apartment": "Apartment",
    "type.villa": "Villa",
    "type.house": "House",
    "type.commercial": "Commercial",
    "type.land": "Land",

    /* ---- Buy price options ---- */
    "price.any": "Any price",
    "price.buy.u100k": "Under $100k",
    "price.buy.100-250": "$100k \u2013 $250k",
    "price.buy.250-500": "$250k \u2013 $500k",
    "price.buy.500-1m": "$500k \u2013 $1M",
    "price.buy.1m+": "$1M+",

    /* ---- Rent price options ---- */
    "price.rent.u1k": "Under $1,000/mo",
    "price.rent.1-2.5": "$1,000 \u2013 $2,500/mo",
    "price.rent.2.5-5": "$2,500 \u2013 $5,000/mo",
    "price.rent.5k+": "$5,000/mo+",

    /* ---- Featured section ---- */
    "sec.feat.eyebrow": "Featured",
    "sec.feat.title": "This week\u2019s signature listing",
    "sec.feat.book": "Book a viewing",
    "sec.feat.view": "View details",
    "sec.feat2.eyebrow": "Premium listings",
    "sec.feat2.title": "Featured properties",
    "sec.feat2.sub": "Six of the most exceptional homes available right now, shown by verified Chiya agents.",
    "sec.feat2.action": "View all properties",

    /* ---- Categories section ---- */
    "sec.cats.eyebrow": "Browse by type",
    "sec.cats.title": "Find the right kind of home",
    "sec.cats.sub": "From mountain villas to downtown apartments \u2014 explore Kurdistan by property type.",
    "sec.cats.listings": "listings",
    "cat.Villas": "Villas",
    "cat.Apartments": "Apartments",
    "cat.Houses": "Houses",
    "cat.Commercial": "Commercial",
    "cat.Land": "Land",

    /* ---- Locations section ---- */
    "sec.locs.eyebrow": "Popular locations",
    "sec.locs.title": "Explore Kurdistan\u2019s leading markets",
    "sec.locs.sub": "Discover homes in the region\u2019s most sought-after cities.",
    "sec.locs.properties": "properties",

    /* ---- Why Chiya section ---- */
    "sec.why.eyebrow": "Why Chiya Estate",
    "sec.why.title": "Built on trust, made for luxury",
    "sec.why.sub": "We do the diligence so every home you see is genuine, every agent is verified, and every step is secure.",
    "why.0.title": "Verified agents",
    "why.0.desc": "Every agent is ID-checked and licence-verified before they can list with Chiya.",
    "why.1.title": "Admin-approved listings",
    "why.1.desc": "Each property is reviewed and approved by our team \u2014 no duplicates, no ghost listings.",
    "why.2.title": "Luxury properties",
    "why.2.desc": "A hand-curated collection of Kurdistan's most exceptional homes and estates.",
    "why.3.title": "Secure platform",
    "why.3.desc": "Encrypted messaging, protected viewings, and no-obligation enquiries throughout.",

    /* ---- Agents section ---- */
    "sec.agents.eyebrow": "Concierge",
    "sec.agents.title": "Meet our verified agents",
    "sec.agents.sub": "Licensed, ID-checked professionals who know every neighborhood.",
    "sec.agents.action": "Browse all agents",

    /* ---- Market insights section ---- */
    "sec.insights.eyebrow": "Market insights",
    "sec.insights.title": "Kurdistan property market at a glance",
    "sec.insights.sub": "Live pricing and demand signals, updated monthly by the Chiya research team.",
    "sec.insights.action": "Full market report",

    /* ---- Testimonials section ---- */
    "sec.test.eyebrow": "Loved by clients",
    "sec.test.title": "Trusted by buyers, renters, and owners",
    "sec.test.sub": "Real stories from people who found their place through Chiya.",
    "test.0.name": "Hawar & Nyan",
    "test.0.loc": "Bought in Dream City, Erbil",
    "test.0.quote": "Our Chiya agent understood exactly what we wanted. Every viewing was a home we genuinely loved \u2014 we signed within three weeks.",
    "test.1.name": "Sara Aziz",
    "test.1.loc": "Rented in Italian Village, Erbil",
    "test.1.quote": "As someone relocating from abroad, the verified listings gave me real confidence. No surprises, no wasted trips.",
    "test.2.name": "Karwan Jamal",
    "test.2.loc": "Sold a villa in Sarsang, Duhok",
    "test.2.quote": "Listing with Chiya brought serious, pre-qualified buyers only. The whole process felt premium from start to finish.",
    "loc.blurb.Erbil": "The capital's gated communities, Dream City villas, and downtown penthouses.",
    "loc.blurb.Duhok": "Mountain-framed homes and tranquil retreats above the Sarsang valley.",
    "loc.blurb.Sulaymaniyah": "Cultural heart of Kurdistan \u2014 leafy boulevards and modern residences.",
    "ins.0.label": "Average villa price",
    "ins.1.label": "Average apartment price",
    "ins.2.label": "Active listings",
    "ins.3.label": "Avg. days to sell",
    "ins.vsyear": "vs last year",
    "ins.quarter": "this quarter",
    "ins.faster": "faster than 2024",
    "ins.days": "9 days",

    /* ---- CTA section ---- */
    "cta.eyebrow": "Get started",
    "cta.title": "Your next move with Chiya",
    "cta.sub": "Whether you\u2019re buying, renting, or selling \u2014 start with people you can trust.",
    "cta.find.title": "Find a property",
    "cta.find.desc": "Browse verified luxury listings across Kurdistan.",
    "cta.find.cta": "Explore homes",
    "cta.agent.title": "Contact an agent",
    "cta.agent.desc": "Speak with a verified Chiya agent \u2014 no obligation.",
    "cta.agent.cta": "Talk to an agent",
    "cta.list.title": "Submit a property",
    "cta.list.desc": "List your home and reach serious, pre-qualified buyers.",
    "cta.list.cta": "List property",

    /* ---- Footer ---- */
    "footer.tagline": "Luxury homes across the Kurdistan Region of Iraq \u2014 connecting you with verified agents and exceptional properties.",
    "footer.col.properties": "Properties",
    "footer.col.buy": "Buy",
    "footer.col.rent": "Rent",
    "footer.col.luxury": "Luxury properties",
    "footer.col.featured": "Featured listings",
    "footer.col.commercial": "Commercial properties",
    "footer.col.agents": "Agents",
    "footer.col.findAgent": "Find an agent",
    "footer.col.verified": "Verified agents",
    "footer.col.joinAgent": "Join as an agent",
    "footer.col.company": "Company",
    "footer.col.about": "About Chiya",
    "footer.col.blog": "Blog",
    "footer.col.faq": "FAQ",
    "footer.col.contact": "Contact",
    "footer.copyright": "\u00A9 2026 Chiya Estate. All rights reserved.",
    "footer.lang": "English",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.cookies": "Cookies",

    /* ---- Search results page ---- */
    "srp.filters": "Filters",
    "srp.clearAll": "Clear all",
    "srp.activeFilters": "Active filters",
    "srp.sec.type": "Property type",
    "srp.sec.priceRange": "Price range",
    "srp.sec.monthlyRent": "Monthly rent",
    "srp.sec.size": "Property size",
    "srp.sec.beds": "Bedrooms",
    "srp.sec.baths": "Bathrooms",
    "srp.sec.amenities": "Amenities",
    "srp.any": "Any",
    "srp.studio": "Studio",
    "srp.bedsSuffix": "beds",
    "srp.bathsSuffix": "baths",
    "srp.customSize": "Custom size",
    "srp.customRent": "Custom monthly rent",
    "srp.customPrice": "Custom price range",
    "srp.min": "Min",
    "srp.max": "Max",
    "srp.applyCustom": "Apply custom range",
    "srp.customApplied": "Custom range applied",
    "srp.searchPlaceholder": "Search city, neighborhood, or project",
    "srp.searchAria": "Search properties",
    "srp.clearSearch": "Clear search",
    "srp.sortLabel": "Sort:",
    "srp.gridView": "Grid",
    "srp.mapView": "Map",
    "srp.titleSale": "Properties for sale in",
    "srp.titleRent": "Properties for rent in",
    "srp.results": "Results",
    "srp.result": "Result",
    "srp.filtered": "filtered",
    "srp.empty.title": "No properties found",
    "srp.empty.sub": "Try adjusting your filters or searching a nearby area.",
    "srp.empty.clear": "Clear all filters",
    "srp.empty.browse": "Browse all properties",
    "srp.prev": "Previous",
    "srp.next": "Next",
    "srp.show": "Show",
    "srp.resultsLower": "results",
    "srp.showing": "Showing",
    "srp.of": "of",
    "srp.propertiesLower": "properties",
    "srp.crumb.home": "Home",
    "srp.crumb.results": "Search results",
    "srp.homes": "homes",
    "srp.kurdistanRegion": "Kurdistan Region",
    "srp.kurdistan": "Kurdistan",
    "srp.closeFilters": "Close filters",
    "city.Erbil": "Erbil",
    "city.Duhok": "Duhok",
    "city.Sulaymaniyah": "Sulaymaniyah",
    "deal.buy": "Buy",
    "deal.rent": "Rent",

    /* ---- Amenities ---- */
    "amen.parking": "Parking",
    "amen.garden": "Garden",
    "amen.pool": "Pool",
    "amen.balcony": "Balcony",
    "amen.elevator": "Elevator",
    "amen.security": "Security",
    "amen.furnished": "Furnished",

    /* ---- Property status ---- */
    "pstatus.ready": "Ready",
    "pstatus.construction": "Under construction",
    "pstatus.new": "New listing",

    /* ---- Sort options ---- */
    "sort.recommended": "Featured",
    "sort.newest": "Newest",
    "sort.price-asc": "Price: low to high",
    "sort.price-desc": "Price: high to low",
    "sort.most-viewed": "Most viewed",

    /* ---- Price / size presets ---- */
    "preset.buy.0": "Up to $150K",
    "preset.buy.1": "$150K \u2013 $400K",
    "preset.buy.2": "$300K \u2013 $600K",
    "preset.buy.3": "$600K \u2013 $1M",
    "preset.buy.4": "$1M and above",
    "preset.rent.0": "Up to $1,000/mo",
    "preset.rent.1": "$1,000 \u2013 $2,500/mo",
    "preset.rent.2": "$2,500 \u2013 $5,000/mo",
    "preset.rent.3": "$5,000/mo and above",
    "preset.size.0": "Up to 100 m\u00b2",
    "preset.size.1": "100 \u2013 200 m\u00b2",
    "preset.size.2": "200 \u2013 300 m\u00b2",
    "preset.size.3": "300 \u2013 500 m\u00b2",
    "preset.size.4": "500 m\u00b2 and above",
  },

  ar: {
    /* ---- Language switcher ---- */
    "lang.en": "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629",
    "lang.ar": "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    "lang.ku": "\u0627\u0644\u0643\u0631\u062f\u064a\u0629",

    /* ---- Navigation ---- */
    "nav.buy": "\u0634\u0631\u0627\u0621",
    "nav.rent": "\u0625\u064a\u062c\u0627\u0631",
    "nav.sell": "\u0628\u064a\u0639",
    "nav.agents": "\u0627\u0644\u0648\u0643\u0644\u0627\u0621",
    "nav.about": "\u0645\u0646 \u0646\u062d\u0646",
    "nav.blog": "\u0627\u0644\u0645\u062f\u0648\u0646\u0629",
    "nav.contact": "\u062a\u0648\u0627\u0635\u0644",
    "nav.login": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
    "nav.signup": "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",

    /* ---- Hero ---- */
    "hero.badge": "\u0634\u0628\u0643\u0629 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0641\u0627\u062e\u0631\u0629 \u0641\u064a \u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "hero.title": "\u0627\u0643\u062a\u0634\u0641 \u0639\u0642\u0627\u0631\u0627\u062a\n\u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629 \u0641\u064a \u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "hero.sub": "\u0642\u0648\u0627\u0626\u0645 \u0645\u0648\u062b\u0642\u0629 \u0648\u0648\u0643\u0644\u0627\u0621 \u0645\u0648\u062b\u0648\u0642\u0648\u0646 \u0648\u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u062e\u062a\u0627\u0631\u0629 \u0645\u0646 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0641\u0627\u062e\u0631\u0629 \u2014 \u0641\u064a \u0623\u0631\u0628\u064a\u0644 \u0648\u062f\u0647\u0648\u0643 \u0648\u0627\u0644\u0633\u0644\u064a\u0645\u0627\u0646\u064a\u0629.",

    /* ---- Search bar labels ---- */
    "search.lookingTo": "\u0623\u0628\u062d\u062b \u0639\u0646",
    "search.location": "\u0627\u0644\u0645\u0648\u0642\u0639",
    "search.propertyType": "\u0646\u0648\u0639 \u0627\u0644\u0639\u0642\u0627\u0631",
    "search.price": "\u0627\u0644\u0633\u0639\u0631",
    "search.cta": "\u0628\u062d\u062b",

    /* ---- Deal options ---- */
    "deal.buy": "\u0634\u0631\u0627\u0621",
    "deal.buy.sub": "\u062c\u062f \u0645\u0646\u0632\u0644\u0627\u064b \u0644\u0644\u062a\u0645\u0644\u0643",
    "deal.rent": "\u0625\u064a\u062c\u0627\u0631",
    "deal.rent.sub": "\u062c\u062f \u0645\u0643\u0627\u0646\u0627\u064b \u0644\u0644\u0625\u064a\u062c\u0627\u0631",

    /* ---- Location options ---- */
    "loc.all": "\u062c\u0645\u064a\u0639 \u0627\u0644\u0645\u0648\u0627\u0642\u0639",
    "loc.all.sub": "\u0641\u064a \u0623\u0631\u062c\u0627\u0621 \u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "loc.erbil.sub": "248 \u0642\u0627\u0626\u0645\u0629",
    "loc.duhok.sub": "86 \u0642\u0627\u0626\u0645\u0629",
    "loc.sulaymaniyah.sub": "154 \u0642\u0627\u0626\u0645\u0629",
    "loc.halabja.sub": "32 \u0642\u0627\u0626\u0645\u0629",

    /* ---- Property type options ---- */
    "type.all": "\u062c\u0645\u064a\u0639 \u0623\u0646\u0648\u0627\u0639 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a",
    "type.apartment": "\u0634\u0642\u0629",
    "type.villa": "\u0641\u064a\u0644\u0627",
    "type.house": "\u0645\u0646\u0632\u0644",
    "type.commercial": "\u062a\u062c\u0627\u0631\u064a",
    "type.land": "\u0623\u0631\u0636",

    /* ---- Buy price options ---- */
    "price.any": "\u0623\u064a \u0633\u0639\u0631",
    "price.buy.u100k": "\u0623\u0642\u0644 \u0645\u0646 $100 \u0623\u0644\u0641",
    "price.buy.100-250": "$100 \u2013 $250 \u0623\u0644\u0641",
    "price.buy.250-500": "$250 \u2013 $500 \u0623\u0644\u0641",
    "price.buy.500-1m": "$500 \u0623\u0644\u0641 \u2013 $1 \u0645\u0644\u064a\u0648\u0646",
    "price.buy.1m+": "\u0623\u0643\u062b\u0631 \u0645\u0646 $1 \u0645\u0644\u064a\u0648\u0646",

    /* ---- Rent price options ---- */
    "price.rent.u1k": "\u0623\u0642\u0644 \u0645\u0646 $1,000/\u0634\u0647\u0631",
    "price.rent.1-2.5": "$1,000 \u2013 $2,500/\u0634\u0647\u0631",
    "price.rent.2.5-5": "$2,500 \u2013 $5,000/\u0634\u0647\u0631",
    "price.rent.5k+": "\u0623\u0643\u062b\u0631 \u0645\u0646 $5,000/\u0634\u0647\u0631",

    /* ---- Featured section ---- */
    "sec.feat.eyebrow": "\u0645\u0645\u064a\u0632",
    "sec.feat.title": "\u0627\u0644\u0639\u0642\u0627\u0631 \u0627\u0644\u0645\u0645\u064a\u0632 \u0644\u0647\u0630\u0627 \u0627\u0644\u0623\u0633\u0628\u0648\u0639",
    "sec.feat.book": "\u0627\u062d\u062c\u0632 \u0645\u0639\u0627\u064a\u0646\u0629",
    "sec.feat.view": "\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644",
    "sec.feat2.eyebrow": "\u0642\u0648\u0627\u0626\u0645 \u0645\u0645\u064a\u0632\u0629",
    "sec.feat2.title": "\u0639\u0642\u0627\u0631\u0627\u062a \u0645\u0645\u064a\u0632\u0629",
    "sec.feat2.sub": "\u0633\u062a\u0629 \u0645\u0646 \u0623\u0631\u0642\u0649 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0627\u0644\u0622\u0646\u060c \u064a\u0639\u0631\u0636\u0647\u0627 \u0648\u0643\u0644\u0627\u0621 \u0634\u064a\u0627 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0648\u0646.",
    "sec.feat2.action": "\u0639\u0631\u0636 \u062c\u0645\u064a\u0639 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a",

    /* ---- Categories section ---- */
    "sec.cats.eyebrow": "\u062a\u0635\u0641\u062d \u062d\u0633\u0628 \u0627\u0644\u0646\u0648\u0639",
    "sec.cats.title": "\u062c\u062f \u0627\u0644\u0646\u0648\u0639 \u0627\u0644\u0645\u0646\u0627\u0633\u0628 \u0645\u0646 \u0627\u0644\u0645\u0646\u0627\u0632\u0644",
    "sec.cats.sub": "\u0645\u0646 \u0627\u0644\u0641\u064a\u0644\u0627\u062a \u0627\u0644\u062c\u0628\u0644\u064a\u0629 \u0625\u0644\u0649 \u0634\u0642\u0642 \u0648\u0633\u0637 \u0627\u0644\u0645\u062f\u064a\u0646\u0629 \u2014 \u0627\u0633\u062a\u0643\u0634\u0641 \u0643\u0631\u062f\u0633\u062a\u0627\u0646 \u062d\u0633\u0628 \u0646\u0648\u0639 \u0627\u0644\u0639\u0642\u0627\u0631.",
    "sec.cats.listings": "\u0642\u0627\u0626\u0645\u0629",
    "cat.Villas": "\u0641\u064a\u0644\u0627\u062a",
    "cat.Apartments": "\u0634\u0642\u0642",
    "cat.Houses": "\u0645\u0646\u0627\u0632\u0644",
    "cat.Commercial": "\u062a\u062c\u0627\u0631\u064a",
    "cat.Land": "\u0623\u0631\u0627\u0636\u064a",

    /* ---- Locations section ---- */
    "sec.locs.eyebrow": "\u0627\u0644\u0645\u0648\u0627\u0642\u0639 \u0627\u0644\u0634\u0627\u0626\u0639\u0629",
    "sec.locs.title": "\u0627\u0633\u062a\u0643\u0634\u0641 \u0623\u0628\u0631\u0632 \u0623\u0633\u0648\u0627\u0642 \u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "sec.locs.sub": "\u0627\u0643\u062a\u0634\u0641 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0641\u064a \u0623\u0643\u062b\u0631 \u0645\u062f\u0646 \u0627\u0644\u0645\u0646\u0637\u0642\u0629 \u0637\u0644\u0628\u0627\u064b.",
    "sec.locs.properties": "\u0639\u0642\u0627\u0631",

    /* ---- Why Chiya section ---- */
    "sec.why.eyebrow": "\u0644\u0645\u0627\u0630\u0627 \u0634\u064a\u0627 \u0625\u0633\u062a\u064a\u062a",
    "sec.why.title": "\u0645\u0628\u0646\u064a\u0629 \u0639\u0644\u0649 \u0627\u0644\u062b\u0642\u0629\u060c \u0635\u0646\u0639\u062a \u0644\u0644\u0631\u0641\u0627\u0647\u064a\u0629",
    "sec.why.sub": "\u0646\u062d\u0646 \u0646\u0628\u0630\u0644 \u0627\u0644\u0639\u0646\u0627\u064a\u0629 \u0627\u0644\u0644\u0627\u0632\u0645\u0629 \u062d\u062a\u0649 \u064a\u0643\u0648\u0646 \u0643\u0644 \u0645\u0646\u0632\u0644 \u062a\u0631\u0627\u0647 \u062d\u0642\u064a\u0642\u064a\u0627\u064b\u060c \u0648\u0643\u0644 \u0648\u0643\u064a\u0644 \u0645\u0648\u062b\u0642\u0627\u064b\u060c \u0648\u0643\u0644 \u062e\u0637\u0648\u0629 \u0622\u0645\u0646\u0629.",
    "why.0.title": "\u0648\u0643\u0644\u0627\u0621 \u0645\u0648\u062b\u0642\u0648\u0646",
    "why.0.desc": "\u064a\u062e\u0636\u0639 \u0643\u0644 \u0648\u0643\u064a\u0644 \u0644\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0647\u0648\u064a\u0629 \u0648\u0627\u0644\u062a\u0631\u062e\u064a\u0635 \u0642\u0628\u0644 \u0623\u0646 \u064a\u062a\u0645\u0643\u0646 \u0645\u0646 \u0627\u0644\u0625\u062f\u0631\u0627\u062c \u0645\u0639 \u0634\u064a\u0627.",
    "why.1.title": "\u0642\u0648\u0627\u0626\u0645 \u0645\u0639\u062a\u0645\u062f\u0629 \u0645\u0646 \u0627\u0644\u0625\u062f\u0627\u0631\u0629",
    "why.1.desc": "\u062a\u062a\u0645 \u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u0627\u0639\u062a\u0645\u0627\u062f \u0643\u0644 \u0639\u0642\u0627\u0631 \u0645\u0646 \u0642\u0628\u0644 \u0641\u0631\u064a\u0642\u0646\u0627 \u2014 \u0628\u0644\u0627 \u062a\u0643\u0631\u0627\u0631\u060c \u0648\u0628\u0644\u0627 \u0642\u0648\u0627\u0626\u0645 \u0648\u0647\u0645\u064a\u0629.",
    "why.2.title": "\u0639\u0642\u0627\u0631\u0627\u062a \u0641\u0627\u062e\u0631\u0629",
    "why.2.desc": "\u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646\u062a\u0642\u0627\u0629 \u0628\u0639\u0646\u0627\u064a\u0629 \u0645\u0646 \u0623\u0631\u0648\u0639 \u0645\u0646\u0627\u0632\u0644 \u0648\u0639\u0642\u0627\u0631\u0627\u062a \u0643\u0631\u062f\u0633\u062a\u0627\u0646.",
    "why.3.title": "\u0645\u0646\u0635\u0629 \u0622\u0645\u0646\u0629",
    "why.3.desc": "\u0645\u0631\u0627\u0633\u0644\u0627\u062a \u0645\u0634\u0641\u0651\u0631\u0629\u060c \u0648\u0645\u0639\u0627\u064a\u0646\u0627\u062a \u0645\u062d\u0645\u064a\u0629\u060c \u0648\u0627\u0633\u062a\u0641\u0633\u0627\u0631\u0627\u062a \u062f\u0648\u0646 \u0627\u0644\u062a\u0632\u0627\u0645 \u0641\u064a \u0643\u0644 \u0627\u0644\u0645\u0631\u0627\u062d\u0644.",

    /* ---- Agents section ---- */
    "sec.agents.eyebrow": "\u062e\u062f\u0645\u0629 \u0627\u0644\u0643\u0648\u0646\u0633\u064a\u0631\u062c",
    "sec.agents.title": "\u062a\u0639\u0631\u0641 \u0639\u0644\u0649 \u0648\u0643\u0644\u0627\u0626\u0646\u0627 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u064a\u0646",
    "sec.agents.sub": "\u0645\u062d\u062a\u0631\u0641\u0648\u0646 \u0645\u0631\u062e\u0635\u0648\u0646 \u0648\u0645\u0648\u062b\u0642\u0648 \u0627\u0644\u0647\u0648\u064a\u0629 \u064a\u0639\u0631\u0641\u0648\u0646 \u0643\u0644 \u062d\u064a.",
    "sec.agents.action": "\u062a\u0635\u0641\u062d \u062c\u0645\u064a\u0639 \u0627\u0644\u0648\u0643\u0644\u0627\u0621",

    /* ---- Market insights section ---- */
    "sec.insights.eyebrow": "\u0631\u0624\u0649 \u0627\u0644\u0633\u0648\u0642",
    "sec.insights.title": "\u0646\u0638\u0631\u0629 \u0639\u0644\u0649 \u0633\u0648\u0642 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0641\u064a \u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "sec.insights.sub": "\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0633\u0639\u0627\u0631 \u0648\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u062d\u064a\u0629\u060c \u062a\u064f\u062d\u062f\u0651\u062b \u0634\u0647\u0631\u064a\u0627\u064b \u0645\u0646 \u0642\u0650\u0628\u064e\u0644 \u0641\u0631\u064a\u0642 \u0623\u0628\u062d\u0627\u062b \u0634\u064a\u0627.",
    "sec.insights.action": "\u0627\u0644\u062a\u0642\u0631\u064a\u0631 \u0627\u0644\u0643\u0627\u0645\u0644 \u0644\u0644\u0633\u0648\u0642",

    /* ---- Testimonials section ---- */
    "sec.test.eyebrow": "\u0645\u062d\u0628\u0648\u0628 \u0645\u0646 \u0627\u0644\u0639\u0645\u0644\u0627\u0621",
    "sec.test.title": "\u0645\u0648\u062b\u0648\u0642 \u0628\u0647 \u0645\u0646 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0646 \u0648\u0627\u0644\u0645\u0633\u062a\u0623\u062c\u0631\u064a\u0646 \u0648\u0627\u0644\u0645\u0644\u0627\u0643",
    "sec.test.sub": "\u0642\u0635\u0635 \u062d\u0642\u064a\u0642\u064a\u0629 \u0645\u0646 \u0623\u0634\u062e\u0627\u0635 \u0648\u062c\u062f\u0648\u0627 \u0645\u0643\u0627\u0646\u0647\u0645 \u0645\u0646 \u062e\u0644\u0627\u0644 \u0634\u064a\u0627.",
    "test.0.name": "\u0647\u0648\u0627\u0631 \u0648\u0646\u064a\u0627\u0646",
    "test.0.loc": "\u0627\u0634\u062a\u0631\u064a\u0627 \u0641\u064a \u062f\u0631\u064a\u0645 \u0633\u064a\u062a\u064a\u060c \u0623\u0631\u0628\u064a\u0644",
    "test.0.quote": "\u0641\u0647\u0645 \u0648\u0643\u064a\u0644 \u0634\u064a\u0627 \u0628\u0627\u0644\u0636\u0628\u0637 \u0645\u0627 \u0643\u0646\u0627 \u0646\u0631\u064a\u062f\u0647. \u0643\u0627\u0646\u062a \u0643\u0644 \u0645\u0639\u0627\u064a\u0646\u0629 \u0645\u0646\u0632\u0644\u0627\u064b \u0623\u062d\u0628\u0628\u0646\u0627\u0647 \u062d\u0642\u0627\u064b \u2014 \u0648\u0648\u0642\u0651\u0639\u0646\u0627 \u062e\u0644\u0627\u0644 \u062b\u0644\u0627\u062b\u0629 \u0623\u0633\u0627\u0628\u064a\u0639.",
    "test.1.name": "\u0633\u0627\u0631\u0629 \u0639\u0632\u064a\u0632",
    "test.1.loc": "\u0627\u0633\u062a\u0623\u062c\u0631\u062a \u0641\u064a \u0627\u0644\u0642\u0631\u064a\u0629 \u0627\u0644\u0625\u064a\u0637\u0627\u0644\u064a\u0629\u060c \u0623\u0631\u0628\u064a\u0644",
    "test.1.quote": "\u0628\u0648\u0635\u0641\u064a \u0642\u0627\u062f\u0645\u0629 \u0645\u0646 \u0627\u0644\u062e\u0627\u0631\u062c\u060c \u0645\u0646\u062d\u062a\u0646\u064a \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0648\u062b\u0651\u0642\u0629 \u062b\u0642\u0629 \u062d\u0642\u064a\u0642\u064a\u0629. \u0644\u0627 \u0645\u0641\u0627\u062c\u0622\u062a\u060c \u0648\u0644\u0627 \u0631\u062d\u0644\u0627\u062a \u0636\u0627\u0626\u0639\u0629.",
    "test.2.name": "\u0643\u0627\u0631\u0648\u0627\u0646 \u062c\u0645\u0627\u0644",
    "test.2.loc": "\u0628\u0627\u0639 \u0641\u064a\u0644\u0627 \u0641\u064a \u0633\u0631\u0633\u0646\u0643\u060c \u062f\u0647\u0648\u0643",
    "test.2.quote": "\u062c\u0644\u0628\u062a \u0634\u064a\u0627 \u0645\u0634\u062a\u0631\u064a\u0646 \u062c\u0627\u062f\u0651\u064a\u0646 \u0648\u0645\u0624\u0647\u0651\u0644\u064a\u0646 \u0641\u0642\u0637. \u0643\u0627\u0646\u062a \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0628\u0631\u0645\u062a\u0647\u0627 \u0641\u0627\u062e\u0631\u0629 \u0645\u0646 \u0627\u0644\u0628\u062f\u0627\u064a\u0629 \u0625\u0644\u0649 \u0627\u0644\u0646\u0647\u0627\u064a\u0629.",
    "loc.blurb.Erbil": "\u0645\u062c\u062a\u0645\u0639\u0627\u062a \u0627\u0644\u0639\u0627\u0635\u0645\u0629 \u0627\u0644\u0645\u0633\u0648\u0651\u0631\u0629\u060c \u0648\u0641\u064a\u0644\u0627\u062a \u062f\u0631\u064a\u0645 \u0633\u064a\u062a\u064a\u060c \u0648\u0628\u0646\u062a\u0647\u0627\u0648\u0633\u0627\u062a \u0648\u0633\u0637 \u0627\u0644\u0645\u062f\u064a\u0646\u0629.",
    "loc.blurb.Duhok": "\u0645\u0646\u0627\u0632\u0644 \u062a\u062d\u064a\u0637 \u0628\u0647\u0627 \u0627\u0644\u062c\u0628\u0627\u0644 \u0648\u0645\u0644\u0627\u0630\u0627\u062a \u0647\u0627\u062f\u0626\u0629 \u0641\u0648\u0642 \u0648\u0627\u062f\u064a \u0633\u0631\u0633\u0646\u0643.",
    "loc.blurb.Sulaymaniyah": "\u0642\u0644\u0628 \u0643\u0631\u062f\u0633\u062a\u0627\u0646 \u0627\u0644\u062b\u0642\u0627\u0641\u064a \u2014 \u0634\u0648\u0627\u0631\u0639 \u062e\u0636\u0631\u0627\u0621 \u0648\u0645\u0633\u0627\u0643\u0646 \u062d\u062f\u064a\u062b\u0629.",
    "ins.0.label": "\u0645\u062a\u0648\u0633\u0637 \u0633\u0639\u0631 \u0627\u0644\u0641\u064a\u0644\u0627",
    "ins.1.label": "\u0645\u062a\u0648\u0633\u0637 \u0633\u0639\u0631 \u0627\u0644\u0634\u0642\u0629",
    "ins.2.label": "\u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0646\u0634\u0637\u0629",
    "ins.3.label": "\u0645\u062a\u0648\u0633\u0637 \u0623\u064a\u0627\u0645 \u0627\u0644\u0628\u064a\u0639",
    "ins.vsyear": "\u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0645\u0627\u0636\u064a",
    "ins.quarter": "\u0647\u0630\u0627 \u0627\u0644\u0631\u0628\u0639",
    "ins.faster": "\u0623\u0633\u0631\u0639 \u0645\u0646 2024",
    "ins.days": "9 \u0623\u064a\u0627\u0645",

    /* ---- CTA section ---- */
    "cta.eyebrow": "\u0627\u0628\u062f\u0623 \u0627\u0644\u0622\u0646",
    "cta.title": "\u062e\u0637\u0648\u062a\u0643 \u0627\u0644\u0642\u0627\u062f\u0645\u0629 \u0645\u0639 \u0634\u064a\u0627",
    "cta.sub": "\u0633\u0648\u0627\u0621 \u0643\u0646\u062a \u062a\u0634\u062a\u0631\u064a \u0623\u0648 \u062a\u0633\u062a\u0623\u062c\u0631 \u0623\u0648 \u062a\u0628\u064a\u0639 \u2014 \u0627\u0628\u062f\u0623 \u0645\u0639 \u0623\u0634\u062e\u0627\u0635 \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0648\u062b\u0648\u0642 \u0628\u0647\u0645.",
    "cta.find.title": "\u062c\u062f \u0639\u0642\u0627\u0631\u0627\u064b",
    "cta.find.desc": "\u062a\u0635\u0641\u062d \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0641\u062e\u0627\u0645\u0629 \u0627\u0644\u0645\u0648\u062b\u0642\u0629 \u0641\u064a \u0643\u0631\u062f\u0633\u062a\u0627\u0646.",
    "cta.find.cta": "\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0645\u0646\u0627\u0632\u0644",
    "cta.agent.title": "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0648\u0643\u064a\u0644",
    "cta.agent.desc": "\u062a\u062d\u062f\u062b \u0645\u0639 \u0648\u0643\u064a\u0644 \u0634\u064a\u0627 \u0627\u0644\u0645\u0639\u062a\u0645\u062f \u2014 \u0628\u062f\u0648\u0646 \u0627\u0644\u062a\u0632\u0627\u0645.",
    "cta.agent.cta": "\u062a\u062d\u062f\u062b \u0645\u0639 \u0648\u0643\u064a\u0644",
    "cta.list.title": "\u0623\u0636\u0641 \u0639\u0642\u0627\u0631\u0627\u064b",
    "cta.list.desc": "\u0623\u062f\u0631\u062c \u0645\u0646\u0632\u0644\u0643 \u0648\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0645\u0634\u062a\u0631\u064a\u0646 \u062c\u0627\u062f\u064a\u0646 \u0648\u0645\u0624\u0647\u0644\u064a\u0646.",
    "cta.list.cta": "\u0625\u062f\u0631\u0627\u062c \u0627\u0644\u0639\u0642\u0627\u0631",

    /* ---- Footer ---- */
    "footer.tagline": "\u0645\u0646\u0627\u0632\u0644 \u0641\u0627\u062e\u0631\u0629 \u0641\u064a \u0625\u0642\u0644\u064a\u0645 \u0643\u0631\u062f\u0633\u062a\u0627\u0646 \u0627\u0644\u0639\u0631\u0627\u0642 \u2014 \u0646\u0631\u0628\u0637\u0643 \u0628\u0648\u0643\u0644\u0627\u0621 \u0645\u0648\u062b\u0648\u0642\u064a\u0646 \u0648\u0639\u0642\u0627\u0631\u0627\u062a \u0627\u0633\u062a\u062b\u0646\u0627\u0626\u064a\u0629.",
    "footer.col.properties": "\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a",
    "footer.col.buy": "\u0634\u0631\u0627\u0621",
    "footer.col.rent": "\u0625\u064a\u062c\u0627\u0631",
    "footer.col.luxury": "\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0627\u0644\u0641\u0627\u062e\u0631\u0629",
    "footer.col.featured": "\u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0645\u0645\u064a\u0632\u0629",
    "footer.col.commercial": "\u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629",
    "footer.col.agents": "\u0627\u0644\u0648\u0643\u0644\u0627\u0621",
    "footer.col.findAgent": "\u062c\u062f \u0648\u0643\u064a\u0644\u0627\u064b",
    "footer.col.verified": "\u0627\u0644\u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0645\u0639\u062a\u0645\u062f\u0648\u0646",
    "footer.col.joinAgent": "\u0627\u0646\u0636\u0645 \u0643\u0648\u0643\u064a\u0644",
    "footer.col.company": "\u0627\u0644\u0634\u0631\u0643\u0629",
    "footer.col.about": "\u0639\u0646 \u0634\u064a\u0627",
    "footer.col.blog": "\u0627\u0644\u0645\u062f\u0648\u0646\u0629",
    "footer.col.faq": "\u0627\u0644\u0623\u0633\u0626\u0644\u0629 \u0627\u0644\u0634\u0627\u0626\u0639\u0629",
    "footer.col.contact": "\u062a\u0648\u0627\u0635\u0644",
    "footer.copyright": "\u00A9 2026 \u0634\u064a\u0627 \u0625\u0633\u062a\u064a\u062a. \u062c\u0645\u064a\u0639 \u0627\u0644\u062d\u0642\u0648\u0642 \u0645\u062d\u0641\u0648\u0638\u0629.",
    "footer.lang": "\u0627\u0644\u0639\u0631\u0628\u064a\u0629",
    "footer.privacy": "\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629",
    "footer.terms": "\u0627\u0644\u0634\u0631\u0648\u0637",
    "footer.cookies": "\u0645\u0644\u0641\u0627\u062a \u0627\u0644\u0627\u0631\u062a\u0628\u0627\u0637",

    /* ---- Search results page ---- */
    "srp.filters": "\u0627\u0644\u062a\u0635\u0641\u064a\u0629",
    "srp.clearAll": "\u0645\u0633\u062d \u0627\u0644\u0643\u0644",
    "srp.activeFilters": "\u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062a\u0635\u0641\u064a\u0629 \u0627\u0644\u0646\u0634\u0637\u0629",
    "srp.sec.type": "\u0646\u0648\u0639 \u0627\u0644\u0639\u0642\u0627\u0631",
    "srp.sec.priceRange": "\u0646\u0637\u0627\u0642 \u0627\u0644\u0633\u0639\u0631",
    "srp.sec.monthlyRent": "\u0627\u0644\u0625\u064a\u062c\u0627\u0631 \u0627\u0644\u0634\u0647\u0631\u064a",
    "srp.sec.size": "\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0642\u0627\u0631",
    "srp.sec.beds": "\u063a\u0631\u0641 \u0627\u0644\u0646\u0648\u0645",
    "srp.sec.baths": "\u0627\u0644\u062d\u0645\u0627\u0645\u0627\u062a",
    "srp.sec.amenities": "\u0627\u0644\u0645\u0631\u0627\u0641\u0642",
    "srp.any": "\u0627\u0644\u0643\u0644",
    "srp.studio": "\u0627\u0633\u062a\u0648\u062f\u064a\u0648",
    "srp.bedsSuffix": "\u063a\u0631\u0641 \u0646\u0648\u0645",
    "srp.bathsSuffix": "\u062d\u0645\u0627\u0645\u0627\u062a",
    "srp.customSize": "\u0645\u0633\u0627\u062d\u0629 \u0645\u062e\u0635\u0635\u0629",
    "srp.customRent": "\u0625\u064a\u062c\u0627\u0631 \u0634\u0647\u0631\u064a \u0645\u062e\u0635\u0635",
    "srp.customPrice": "\u0646\u0637\u0627\u0642 \u0633\u0639\u0631 \u0645\u062e\u0635\u0635",
    "srp.min": "\u0627\u0644\u0623\u062f\u0646\u0649",
    "srp.max": "\u0627\u0644\u0623\u0639\u0644\u0649",
    "srp.applyCustom": "\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u0646\u0637\u0627\u0642 \u0627\u0644\u0645\u062e\u0635\u0635",
    "srp.customApplied": "\u062a\u0645 \u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u0646\u0637\u0627\u0642",
    "srp.searchPlaceholder": "\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u062f\u064a\u0646\u0629 \u0623\u0648 \u062d\u064a \u0623\u0648 \u0645\u0634\u0631\u0648\u0639",
    "srp.searchAria": "\u0627\u0644\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a",
    "srp.clearSearch": "\u0645\u0633\u062d \u0627\u0644\u0628\u062d\u062b",
    "srp.sortLabel": "\u062a\u0631\u062a\u064a\u0628:",
    "srp.gridView": "\u0634\u0628\u0643\u0629",
    "srp.mapView": "\u062e\u0631\u064a\u0637\u0629",
    "srp.titleSale": "\u0639\u0642\u0627\u0631\u0627\u062a \u0644\u0644\u0628\u064a\u0639 \u0641\u064a",
    "srp.titleRent": "\u0639\u0642\u0627\u0631\u0627\u062a \u0644\u0644\u0625\u064a\u062c\u0627\u0631 \u0641\u064a",
    "srp.results": "\u0646\u062a\u064a\u062c\u0629",
    "srp.result": "\u0646\u062a\u064a\u062c\u0629",
    "srp.filtered": "\u0645\u064f\u0635\u0641\u0651\u0627\u0629",
    "srp.empty.title": "\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0639\u0642\u0627\u0631\u0627\u062a",
    "srp.empty.sub": "\u062d\u0627\u0648\u0644 \u062a\u0639\u062f\u064a\u0644 \u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062a\u0635\u0641\u064a\u0629 \u0623\u0648 \u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0645\u0646\u0637\u0642\u0629 \u0642\u0631\u064a\u0628\u0629.",
    "srp.empty.clear": "\u0645\u0633\u062d \u062c\u0645\u064a\u0639 \u0639\u0648\u0627\u0645\u0644 \u0627\u0644\u062a\u0635\u0641\u064a\u0629",
    "srp.empty.browse": "\u062a\u0635\u0641\u062d \u062c\u0645\u064a\u0639 \u0627\u0644\u0639\u0642\u0627\u0631\u0627\u062a",
    "srp.prev": "\u0627\u0644\u0633\u0627\u0628\u0642",
    "srp.next": "\u0627\u0644\u062a\u0627\u0644\u064a",
    "srp.show": "\u0639\u0631\u0636",
    "srp.resultsLower": "\u0646\u062a\u064a\u062c\u0629",
    "srp.showing": "\u0639\u0631\u0636",
    "srp.of": "\u0645\u0646",
    "srp.propertiesLower": "\u0639\u0642\u0627\u0631",
    "srp.crumb.home": "\u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629",
    "srp.crumb.results": "\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0628\u062d\u062b",
    "srp.homes": "\u0645\u0646\u0632\u0644",
    "srp.kurdistanRegion": "\u0625\u0642\u0644\u064a\u0645 \u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "srp.kurdistan": "\u0643\u0631\u062f\u0633\u062a\u0627\u0646",
    "srp.closeFilters": "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062a\u0635\u0641\u064a\u0629",
    "city.Erbil": "\u0623\u0631\u0628\u064a\u0644",
    "city.Duhok": "\u062f\u0647\u0648\u0643",
    "city.Sulaymaniyah": "\u0627\u0644\u0633\u0644\u064a\u0645\u0627\u0646\u064a\u0629",
    "deal.buy": "\u0634\u0631\u0627\u0621",
    "deal.rent": "\u0625\u064a\u062c\u0627\u0631",

    /* ---- Amenities ---- */
    "amen.parking": "\u0645\u0648\u0642\u0641 \u0633\u064a\u0627\u0631\u0627\u062a",
    "amen.garden": "\u062d\u062f\u064a\u0642\u0629",
    "amen.pool": "\u0645\u0633\u0628\u062d",
    "amen.balcony": "\u0634\u0631\u0641\u0629",
    "amen.elevator": "\u0645\u0635\u0639\u062f",
    "amen.security": "\u0623\u0645\u0646",
    "amen.furnished": "\u0645\u0641\u0631\u0648\u0634",

    /* ---- Property status ---- */
    "pstatus.ready": "\u062c\u0627\u0647\u0632",
    "pstatus.construction": "\u0642\u064a\u062f \u0627\u0644\u0625\u0646\u0634\u0627\u0621",
    "pstatus.new": "\u0642\u0627\u0626\u0645\u0629 \u062c\u062f\u064a\u062f\u0629",

    /* ---- Sort options ---- */
    "sort.recommended": "\u0645\u0645\u064a\u0632",
    "sort.newest": "\u0627\u0644\u0623\u062d\u062f\u062b",
    "sort.price-asc": "\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0642\u0644 \u0625\u0644\u0649 \u0627\u0644\u0623\u0639\u0644\u0649",
    "sort.price-desc": "\u0627\u0644\u0633\u0639\u0631: \u0645\u0646 \u0627\u0644\u0623\u0639\u0644\u0649 \u0625\u0644\u0649 \u0627\u0644\u0623\u0642\u0644",
    "sort.most-viewed": "\u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u0634\u0627\u0647\u062f\u0629",

    /* ---- Price / size presets ---- */
    "preset.buy.0": "\u062d\u062a\u0649 $150 \u0623\u0644\u0641",
    "preset.buy.1": "$150 \u2013 $400 \u0623\u0644\u0641",
    "preset.buy.2": "$300 \u2013 $600 \u0623\u0644\u0641",
    "preset.buy.3": "$600 \u0623\u0644\u0641 \u2013 $1 \u0645\u0644\u064a\u0648\u0646",
    "preset.buy.4": "$1 \u0645\u0644\u064a\u0648\u0646 \u0648\u0623\u0643\u062b\u0631",
    "preset.rent.0": "\u062d\u062a\u0649 $1,000/\u0634\u0647\u0631",
    "preset.rent.1": "$1,000 \u2013 $2,500/\u0634\u0647\u0631",
    "preset.rent.2": "$2,500 \u2013 $5,000/\u0634\u0647\u0631",
    "preset.rent.3": "$5,000/\u0634\u0647\u0631 \u0648\u0623\u0643\u062b\u0631",
    "preset.size.0": "\u062d\u062a\u0649 100 \u0645\u00b2",
    "preset.size.1": "100 \u2013 200 \u0645\u00b2",
    "preset.size.2": "200 \u2013 300 \u0645\u00b2",
    "preset.size.3": "300 \u2013 500 \u0645\u00b2",
    "preset.size.4": "500 \u0645\u00b2 \u0648\u0623\u0643\u062b\u0631",
  }
};

/* ---- Context ---- */
const LangContext = createContext(null);

function LangProvider({ children }) {
  const [lang, setLangState] = useState(function() {
    try { return localStorage.getItem("cx-lang") || "en"; } catch(e) { return "en"; }
  });

  const setLang = function(l) {
    setLangState(l);
    try { localStorage.setItem("cx-lang", l); } catch(e) {}
  };

  useEffect(function() {
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  var t = function(key) {
    var dict = TRANSLATIONS[lang];
    if (dict && dict[key] !== undefined) return dict[key];
    var en = TRANSLATIONS.en;
    if (en && en[key] !== undefined) return en[key];
    return key;
  };

  return React.createElement(LangContext.Provider, { value: { lang: lang, setLang: setLang, t: t } }, children);
}

function useLang() {
  var ctx = useContext(LangContext);
  if (!ctx) return { lang: "en", setLang: function() {}, t: function(k) { return k; } };
  return ctx;
}

window.CxLang = { LangProvider: LangProvider, useLang: useLang };
