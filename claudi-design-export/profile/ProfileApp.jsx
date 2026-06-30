const React = window.React;
const { Icon, Button, Modal } = window.ChiyaEstateDesignSystem_686f57;
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakToggle } = window;
const { useState } = React;

const G = window.PROFILE_DATA;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "listingCols": "3",
  "showSold": true,
  "showReviews": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const agent = G.agent;

  // Auth gating handled globally by the shared auth modal (auth/auth-modal.js).
  const [loggedIn] = useState(true);
  const [savedAgent, setSavedAgent] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authIntent, setAuthIntent] = useState(null); // "save" | "follow" | "book" | null
  const [bookOpen, setBookOpen] = useState(false);

  // ---- contact actions (allowed logged-out) ----
  const onWhatsApp = () => window.open("https://wa.me/" + agent.whatsapp, "_blank", "noopener");
  const onCall = () => { window.location.href = "tel:" + agent.phone.replace(/\s+/g, ""); };
  const onEmail = () => { window.location.href = "mailto:" + agent.email; };

  // ---- gated actions ----
  const requireLogin = (intent) => { setAuthIntent(intent); setAuthOpen(true); };
  const onSaveAgent = () => { if (!loggedIn) return requireLogin("save"); setSavedAgent((s) => !s); };
  const onBook = () => { if (!loggedIn) return requireLogin("book"); setBookOpen(true); };
  const onShare = () => {
    if (navigator.share) navigator.share({ title: agent.name + " · Chiya Estate", url: location.href }).catch(() => {});
  };

  const onFavorite = (id) => {
    if (!loggedIn) return requireLogin("save");
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  };
  const onOpenListing = () => { window.location.href = "Chiya Estate Property Detail.html"; };

  const authCopy = {
    save: { icon: "heart", title: "Save this agent", sub: "Log in or create a free account to save " + agent.name + " to your shortlist." },
    follow: { icon: "user-round-plus", title: "Follow this agent", sub: "Get notified when " + agent.name + " lists a new home that matches you." },
    book: { icon: "calendar-check", title: "Book a viewing", sub: "Log in or create a free account to request a viewing with " + agent.name + "." },
  }[authIntent] || { icon: "user-round", title: "Welcome to Chiya", sub: "Log in or create a free account to continue." };

  const proceedAuth = () => {
    setAuthOpen(false);
    // After a real login the gated action would resume; here we simply close.
  };

  return React.createElement(React.Fragment, null,
    React.createElement(window.ProfileHeader, {
      onLogin: () => requireLogin(null),
      onRegister: () => requireLogin(null),
    }),

    React.createElement("main", { className: "pro-main" },
      React.createElement("div", { className: "pdp" },
        React.createElement(window.ProfileCrumb, { agent }),
        React.createElement(window.ProfileHero, { agent, saved: savedAgent, onSave: onSaveAgent, onShare, onCall, onWhatsApp, onEmail }),
        React.createElement(window.ProfileTrustMetrics, { agent }),

        React.createElement("div", { className: "pdp-body pro-body" },
          React.createElement("div", { className: "pdp-content" },
            React.createElement(window.ProfileAbout, { agent }),
            React.createElement("div", { className: t.listingCols === "2" ? "pro-cols2" : "" },
              React.createElement(window.ProfileActiveListings, { agent, favorites, onFavorite, onOpen: onOpenListing })),
            t.showSold && React.createElement(window.ProfileRecentlySold, null),
            t.showReviews && React.createElement(window.ProfileReviews, { agent }))))),

    React.createElement(window.SiteFooter, null),

    // login / register gate
    React.createElement(Modal, {
      open: authOpen, onClose: () => setAuthOpen(false), size: "sm",
      icon: authCopy.icon, title: authCopy.title, subtitle: authCopy.sub,
      footer: React.createElement(React.Fragment, null,
        React.createElement(Button, { hierarchy: "secondary", onClick: proceedAuth }, "Log in"),
        React.createElement(Button, { hierarchy: "primary", onClick: proceedAuth }, "Create account")),
    },
      React.createElement("ul", { className: "agt-authlist" },
        ["Save and follow verified agents", "Book viewings and track enquiries", "Get alerts when matching homes are listed"].map((x) =>
          React.createElement("li", { key: x },
            React.createElement(Icon, { name: "check", size: 16 }), x)))),

    // tweaks
    React.createElement(TweaksPanel, null,
      React.createElement(TweakSection, { label: "Listings" }),
      React.createElement(TweakRadio, {
        label: "Listings per row", value: t.listingCols, options: ["2", "3"],
        onChange: (v) => setTweak("listingCols", v),
      }),
      React.createElement(TweakSection, { label: "Sections" }),
      React.createElement(TweakToggle, {
        label: "Recently sold & rented", value: t.showSold,
        onChange: (v) => setTweak("showSold", v),
      }),
      React.createElement(TweakToggle, {
        label: "Reviews", value: t.showReviews,
        onChange: (v) => setTweak("showReviews", v),
      }))
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
