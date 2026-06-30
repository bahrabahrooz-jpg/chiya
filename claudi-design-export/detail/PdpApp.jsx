const React = window.React;
const { Icon, Modal, Input, Button } = window.ChiyaEstateDesignSystem_686f57;
const { useState, useRef, useEffect } = React;

const APP = window.PDP_DATA;

/* ---------- toast ---------- */
function Toast({ msg }) {
  if (!msg) return null;
  return React.createElement("div", {
    style: {
      position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 3000,
      display: "inline-flex", alignItems: "center", gap: 9, padding: "12px 18px",
      background: "var(--gray-950)", color: "#fff", borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-2xl)",
    },
  }, React.createElement(Icon, { name: "check-circle", size: 17, style: { color: "var(--brand-accent)" } }), msg);
}

/* ---------- auth (login / register) modal ---------- */
function AuthModal({ open, mode, message, onClose, onSwitch, onSuccess }) {
  if (!open) return null;
  const isLogin = mode === "login";
  return React.createElement(Modal, {
    open: true, onClose, size: "sm", icon: isLogin ? "log-in" : "user-plus",
    title: isLogin ? "Welcome back" : "Create your account",
    subtitle: isLogin ? "Sign in to continue with Chiya Estate." : "Join Chiya to save homes and book viewings.",
  },
    React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 14 } },
      message && React.createElement("div", {
        style: {
          display: "flex", alignItems: "center", gap: 9, padding: "11px 13px",
          background: "var(--brand-subtle)", border: "1px solid var(--green-100)",
          borderRadius: "var(--radius-md)", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--green-800)",
        },
      }, React.createElement(Icon, { name: "info", size: 16, style: { color: "var(--green-600)", flex: "none" } }), message),
      !isLogin && React.createElement(Input, { label: "Full name", placeholder: "Your name", iconLeading: "user" }),
      React.createElement(Input, { label: "Email", placeholder: "you@email.com", iconLeading: "mail", type: "email" }),
      React.createElement(Input, { label: "Password", placeholder: "••••••••", iconLeading: "lock", type: "password" }),
      React.createElement(Button, { hierarchy: "primary", size: "lg", fullWidth: true, onClick: onSuccess },
        isLogin ? "Sign in" : "Create account"),
      React.createElement("div", {
        style: { textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--text-tertiary)" },
      },
        isLogin ? "New to Chiya? " : "Already have an account? ",
        React.createElement("button", {
          type: "button", onClick: onSwitch,
          style: { background: "none", border: "none", cursor: "pointer", color: "var(--brand-primary)", fontWeight: 600, fontFamily: "var(--font-sans)", fontSize: 13.5 },
        }, isLogin ? "Create an account" : "Sign in")))
  );
}

function App() {
  const p = APP.property;
  const agent = APP.agent;

  // Auth gating is handled globally by the shared auth modal (auth/auth-modal.js),
  // which intercepts protected actions, shows the login/register modal, and replays
  // the click on success. Locally we treat actions as allowed so the replay runs.
  const [loggedIn, setLoggedIn] = useState(true);
  const [auth, setAuth] = useState({ open: false, mode: "login", message: "" });
  const [bookOpen, setBookOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [favMain, setFavMain] = useState(false);
  const [toast, setToast] = useState("");
  const pending = useRef(null);

  const toastTimer = useRef(null);
  const showToast = (m) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const openAuth = (mode, message) => setAuth({ open: true, mode: mode || "login", message: message || "" });
  const requireAuth = (action, message) => {
    if (loggedIn) { action(); return; }
    pending.current = action;
    openAuth("login", message);
  };
  const onAuthSuccess = () => {
    setLoggedIn(true);
    setAuth((a) => ({ ...a, open: false }));
    showToast("Signed in");
    if (pending.current) { const a = pending.current; pending.current = null; setTimeout(a, 60); }
  };

  // actions
  const toggleMainFav = () => requireAuth(() => { setFavMain(true); showToast("Saved to your favourites"); }, "Sign in to save this home to your favourites");
  const toggleFav = (id) => requireAuth(() => {
    setFavorites((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  }, "Sign in to save homes to your favourites");
  const onBook = () => requireAuth(() => setBookOpen(true), "Sign in to book a viewing for this home");
  const onWhatsApp = () => { showToast("Opening WhatsApp with " + agent.name + "…"); };
  const onCall = () => { showToast("Calling " + agent.phone + "…"); };
  const onEmail = () => { showToast("Opening email to " + agent.name + "…"); };
  const onShare = () => { showToast("Listing link copied to clipboard"); };
  const onDownload = () => { showToast("Preparing brochure download…"); };

  const panelProps = { p, agent, favorite: favMain, onWhatsApp, onCall, onEmail, onBook };

  return React.createElement(React.Fragment, null,
    React.createElement(window.PdpHeader, {
      onNav: () => {}, onAuth: (mode, message) => openAuth(mode, message),
    }),

    React.createElement("main", { className: "pdp pdp-wrap" },
      // breadcrumb
      React.createElement("nav", { className: "pdp-crumb", "aria-label": "Breadcrumb" },
        React.createElement("a", { className: "pdp-crumb__link", href: "Website-Homepage.html" },
          React.createElement(Icon, { name: "home", size: 14 }), "Home"),
        React.createElement(Icon, { name: "chevron-right", size: 14, className: "pdp-crumb__sep" }),
        React.createElement("a", { className: "pdp-crumb__link", href: "Website-Search Results page.html" }, "Buy"),
        React.createElement(Icon, { name: "chevron-right", size: 14, className: "pdp-crumb__sep" }),
        React.createElement("a", { className: "pdp-crumb__link", href: "Website-Search Results page.html?q=Erbil" }, "Erbil"),
        React.createElement(Icon, { name: "chevron-right", size: 14, className: "pdp-crumb__sep" }),
        React.createElement("span", { className: "pdp-crumb__current" }, p.title)),

      // gallery
      React.createElement(window.PdpGallery, {
        images: APP.gallery, property: p, favorite: favMain, onFavorite: toggleMainFav, onShare,
      }),

      // title row
      React.createElement("div", { className: "pdp-head" },
        React.createElement("div", null,
          React.createElement("div", { className: "pdp-head__title" }, p.title),
          React.createElement("div", { className: "pdp-head__addr" },
            React.createElement(Icon, { name: "map-pin", size: 17 }),
            React.createElement("a", { href: "Website-Search Results page.html?q=Erbil" }, p.address))),
        React.createElement("div", { className: "pdp-head__priceblock" },
          React.createElement("div", { className: "pdp-head__price" }, "$" + p.price.toLocaleString("en-US")))),

      // body: content + sticky panel
      React.createElement("div", { className: "pdp-body" },
        React.createElement(window.PdpMain, { onDownload }),
        React.createElement("aside", { className: "pdp-aside pdp-aside--desktop" },
          React.createElement(window.PdpActionPanel, panelProps))),

      // similar
      React.createElement(window.PdpSimilar, { favorites, onFavorite: toggleFav })),

    // footer (shared site footer)
    React.createElement(window.SiteFooter),

    // mobile sticky contact bar
    React.createElement("div", { className: "pdp-mobar" },
      React.createElement("div", { className: "pdp-mobar__inner" },
        React.createElement("button", { className: "pdp-mobar__btn", type: "button", onClick: onCall },
          React.createElement(Icon, { name: "phone", size: 18 }), "Call"),
        React.createElement("button", { className: "pdp-mobar__btn pdp-mobar__btn--wa", type: "button", onClick: onWhatsApp },
          React.createElement(Icon, { name: "message-circle", size: 18 }), "WhatsApp"),
        React.createElement("button", { className: "pdp-mobar__btn pdp-mobar__btn--book", type: "button", onClick: onBook },
          React.createElement(Icon, { name: "calendar-check", size: 18 }), "Book"))),

    // modals + toast
    React.createElement(AuthModal, {
      open: auth.open, mode: auth.mode, message: auth.message,
      onClose: () => setAuth((a) => ({ ...a, open: false })),
      onSwitch: () => setAuth((a) => ({ ...a, mode: a.mode === "login" ? "register" : "login" })),
      onSuccess: onAuthSuccess,
    }),
    React.createElement(window.PdpBookModal, { open: bookOpen, onClose: () => setBookOpen(false), p, agent }),
    React.createElement(Toast, { msg: toast })
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
