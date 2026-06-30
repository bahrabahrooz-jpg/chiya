const React = window.React;
const { Icon, Button, Modal } = window.ChiyaEstateDesignSystem_686f57;
const { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio } = window;
const { useState, useMemo, useEffect } = React;

const A = window.AGT_DATA;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "perPage": 12,
  "columns": "3",
  "showExtraStats": true,
  "showWhatsapp": true
}/*EDITMODE-END*/;

// Build a windowed page list with ellipses: 1 … 3 4 [5] 6 7 … 12
function pageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out = [1];
  const lo = Math.max(2, current - 1), hi = Math.min(total - 1, current + 1);
  if (lo > 2) out.push("gap-l");
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < total - 1) out.push("gap-r");
  out.push(total);
  return out;
}
const HOME = "Website-Homepage.html";
const AGENT_DETAIL_PAGE = "Website-Agent Profile.html";

function sortAgents(list, sort) {
  const arr = [...list];
  if (sort === "rating") return arr.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  if (sort === "newest") return arr.sort((a, b) => b.since - a.since || b.rating - a.rating);
  // default: most listings
  return arr.sort((a, b) => b.listings - a.listings);
}

/* ---- Breadcrumb: Home / Agents ---- */
function AgentsCrumb() {
  return React.createElement("nav", { className: "agt-crumb", "aria-label": "Breadcrumb" },
    React.createElement("div", { className: "agt-crumb__inner" },
      React.createElement("a", { className: "agt-crumb__link", href: HOME },
        React.createElement(Icon, { name: "home", size: 15 }), "Home"),
      React.createElement(Icon, { name: "chevron-right", size: 15, className: "agt-crumb__sep" }),
      React.createElement("span", { className: "agt-crumb__current", "aria-current": "page" }, "Agents"))
  );
}

const emptyFilters = { city: "", agency: "", verifiedOnly: false };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [sort, setSort] = useState("listings");
  const [saved, setSaved] = useState([]);
  // Auth gating handled globally by the shared auth modal (auth/auth-modal.js).
  const [loggedIn] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAgent, setPendingAgent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [page, setPage] = useState(1);
  const stickyRef = React.useRef(null);

  useEffect(() => {
    let raf, last = null;
    const tick = () => {
      const el = stickyRef.current;
      if (el) {
        const s = el.getBoundingClientRect().top <= 0;
        if (s !== last) { last = s; setStuck(s); }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const on = {
    setCity: (v) => setFilters((f) => ({ ...f, city: v })),
    setAgency: (v) => setFilters((f) => ({ ...f, agency: v })),
    toggleVerified: () => setFilters((f) => ({ ...f, verifiedOnly: !f.verifiedOnly })),
  };
  const clearAll = () => { setFilters(emptyFilters); setQuery(""); };

  const activeCount = (filters.city ? 1 : 0) + (filters.agency ? 1 : 0) + (filters.verifiedOnly ? 1 : 0);
  // "Clear filters" is redundant when location is the only thing narrowing results
  // (the location filter has its own control), so only offer it for the other filters.
  const showClear = (filters.agency ? 1 : 0) + (filters.verifiedOnly ? 1 : 0) + (query ? 1 : 0) > 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = A.agents.slice();
    if (q) list = list.filter((a) => (a.name + " " + a.agency).toLowerCase().includes(q));
    if (filters.city) list = list.filter((a) => a.city === filters.city);
    if (filters.agency) list = list.filter((a) => a.agency === filters.agency);
    if (filters.verifiedOnly) list = list.filter((a) => a.verified);
    return sortAgents(list, sort);
  }, [query, filters, sort]);

  // ---- pagination ----
  const perPage = t.perPage;
  const totalPages = Math.max(1, Math.ceil(results.length / perPage));
  // keep page in range whenever results or page size change
  useEffect(() => { setPage(1); }, [query, filters, sort, perPage]);
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * perPage;
  const paged = results.slice(pageStart, pageStart + perPage);

  const goPage = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    // bring the user to the top of the grid (just under the sticky toolbar)
    requestAnimationFrame(() => {
      const el = stickyRef.current;
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 6;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  };

  // Save agent → gated behind login
  const onSave = (agent) => {
    if (!loggedIn) { setPendingAgent(agent); setAuthOpen(true); return; }
    setSaved((s) => (s.includes(agent.id) ? s.filter((x) => x !== agent.id) : [...s, agent.id]));
  };
  const onView = (agent) => { window.location.href = AGENT_DETAIL_PAGE + "?agent=" + agent.id; };

  const toolbar = React.createElement(window.AgentsToolbar, {
    query, setQuery, filters, on, sort, setSort, onOpenFilters: () => setDrawerOpen(true),
  });

  return React.createElement(React.Fragment, null,
    React.createElement(window.AgentsHeader, {
      onLogin: () => { setPendingAgent(null); setAuthOpen(true); },
      onRegister: () => { setPendingAgent(null); setAuthOpen(true); },
    }),

    React.createElement("main", { className: "agt-main" },
      React.createElement("div", { className: "agt-container" },
        React.createElement(AgentsCrumb, null),

        // hero / page header
        React.createElement("header", { className: "agt-hero", "data-screen-label": "Agents directory header" },
          React.createElement("div", { className: "agt-hero__text" },
            React.createElement("h1", { className: "agt-hero__title" }, "Find trusted real estate agents"),
            React.createElement("p", { className: "agt-hero__sub" },
              React.createElement("b", null, results.length),
              results.length === 1 ? " verified agent" : " verified agents",
              filters.city ? " in " + filters.city : " across Kurdistan")),
          ),

        // toolbar (sticky to top while scrolling)
        React.createElement("div", { className: "agt-stickybar" + (stuck ? " agt-stickybar--stuck" : ""), ref: stickyRef }, toolbar),

        // results bar
        React.createElement("div", { className: "agt-resbar" },
          React.createElement("div", null),
          activeCount > 0 && showClear && React.createElement("button", { type: "button", className: "agt-resbar__clear", onClick: clearAll },
            React.createElement(Icon, { name: "x", size: 14 }), "Clear filters")),

        // grid / empty
        results.length > 0
          ? React.createElement(React.Fragment, null,
              React.createElement("div", { className: "agt-grid" + (t.columns === "3" ? " agt-grid--c3" : "") },
                paged.map((a) => React.createElement(window.AgentDirCard, {
                  key: a.id, agent: a, saved: saved.includes(a.id), onSave, onView,
                  showExtraStats: t.showExtraStats, showWhatsapp: t.showWhatsapp,
                }))),
              totalPages > 1 && React.createElement(Pager, {
                page: safePage, totalPages, perPage, total: results.length, pageStart, shown: paged.length, onGo: goPage,
              }))
          : React.createElement("div", { className: "agt-empty" },
              React.createElement("span", { className: "agt-empty__ic" },
                React.createElement(Icon, { name: "users", size: 30 })),
              React.createElement("h2", { className: "agt-empty__title" }, "No agents match your search"),
              React.createElement("p", { className: "agt-empty__sub" },
                "Try a different city or agency, or clear your filters to see every verified agent."),
              React.createElement(Button, { hierarchy: "secondary", iconLeading: "rotate-ccw", onClick: clearAll }, "Clear filters")))),

    React.createElement(window.SiteFooter, null),

    // login / register modal (Save agent gate)
    React.createElement(Modal, {
      open: authOpen, onClose: () => setAuthOpen(false), size: "sm",
      icon: pendingAgent ? "heart" : "user-round",
      title: pendingAgent ? "Save this agent" : "Welcome to Chiya",
      subtitle: pendingAgent
        ? "Log in or create a free account to save " + pendingAgent.name + " and build your shortlist."
        : "Log in or create a free account to save agents and manage your enquiries.",
      footer: React.createElement(React.Fragment, null,
        React.createElement(Button, { hierarchy: "secondary", onClick: () => setAuthOpen(false) }, "Log in"),
        React.createElement(Button, { hierarchy: "primary", onClick: () => setAuthOpen(false) }, "Create account")),
    },
      React.createElement("ul", { className: "agt-authlist" },
        ["Save and compare verified agents", "Track viewings and enquiries in one place", "Get notified when matching homes are listed"].map((t) =>
          React.createElement("li", { key: t },
            React.createElement(Icon, { name: "check", size: 16 }), t)))),

    // mobile filter drawer
    React.createElement("div", { className: "agt-drawer" + (drawerOpen ? " agt-drawer--open" : "") },
      React.createElement("div", { className: "agt-drawer__scrim", onClick: () => setDrawerOpen(false) }),
      React.createElement("div", { className: "agt-drawer__sheet" },
        React.createElement("div", { className: "agt-drawer__head" },
          React.createElement("span", { className: "agt-drawer__title" }, "Filter agents"),
          React.createElement("button", { type: "button", className: "agt-drawer__close", "aria-label": "Close", onClick: () => setDrawerOpen(false) },
            React.createElement(Icon, { name: "x", size: 20 }))),
        React.createElement("div", { className: "agt-drawer__body" },
          React.createElement(window.AgentsFilterControls, { filters, on, stacked: true }),
          React.createElement("div", { className: "agt-drawer__sortwrap" },
            React.createElement("label", { className: "agt-ctl__label" }, "Sort by"),
            React.createElement(window.AgentsSort, { sort, setSort }))),
        React.createElement("div", { className: "agt-drawer__foot" },
          React.createElement("button", { type: "button", className: "agt-drawer__apply", onClick: () => setDrawerOpen(false) },
            "Show " + results.length + (results.length === 1 ? " agent" : " agents"))))),

    // ---- Tweaks panel ----
    React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: "Directory" }),
      React.createElement(TweakSlider, {
        label: "Agents per page", value: t.perPage, min: 6, max: 21, step: 3,
        onChange: (v) => setTweak("perPage", v),
      }),
      React.createElement(TweakSection, { label: "Agent cards" }),
      React.createElement(TweakToggle, {
        label: "Show sold & years", value: t.showExtraStats,
        onChange: (v) => setTweak("showExtraStats", v),
      }),
      React.createElement(TweakToggle, {
        label: "Show WhatsApp button", value: t.showWhatsapp,
        onChange: (v) => setTweak("showWhatsapp", v),
      }))
  );
}

/* ---- Pager ---- */
function Pager({ page, totalPages, perPage, total, pageStart, shown, onGo }) {
  return React.createElement("nav", { className: "agt-pager", "aria-label": "Pagination" },
    React.createElement("div", { className: "agt-pager__info" },
      "Showing ", React.createElement("b", null, (pageStart + 1) + "\u2013" + (pageStart + shown)),
      " of ", React.createElement("b", null, total), " agents"),
    React.createElement("div", { className: "agt-pager__ctrls" },
      React.createElement("button", {
        type: "button", className: "agt-pager__nav", disabled: page <= 1, onClick: () => onGo(page - 1),
      }, React.createElement(Icon, { name: "chevron-left", size: 15 }), "Previous"),
      pageList(page, totalPages).map((p) =>
        typeof p === "string"
          ? React.createElement("span", { key: p, className: "agt-pager__num agt-pager__num--gap" }, "\u2026")
          : React.createElement("button", {
              key: p, type: "button",
              className: "agt-pager__num" + (p === page ? " agt-pager__num--on" : ""),
              "aria-current": p === page ? "page" : undefined,
              onClick: () => onGo(p),
            }, p)),
      React.createElement("button", {
        type: "button", className: "agt-pager__nav", disabled: page >= totalPages, onClick: () => onGo(page + 1),
      }, "Next", React.createElement(Icon, { name: "chevron-right", size: 15 }))));
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
