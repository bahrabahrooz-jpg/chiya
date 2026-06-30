/* ============================================================================
   Chiya Estate — Authentication Modal Flow (shared, drop-in)
   ----------------------------------------------------------------------------
   A single self-contained controller used across every public page. It renders
   one modal with two states (Login / Register), dims the current page behind it,
   and intercepts protected actions globally so the user never leaves the page:

     • Login / Register in the top navigation
     • Save property (heart)        • Save agent
     • Book a viewing               • Sell / list property

   When a protected action is clicked while logged out, the modal opens, the
   click is held, and after a successful login/register the original action is
   replayed so it "just continues". State persists in localStorage.

   Public API (window.ChiyaAuth):
     .open(mode, opts)   mode = "login" | "register"; opts = { intent, onSuccess }
     .close()
     .isAuthed()  .user()  .logout()
   ========================================================================== */
(function () {
  "use strict";
  if (window.ChiyaAuth) return;

  var LS_KEY = "chiya_auth_user_v1";
  var BRAND_LOGO = "assets/chiya-symbol.svg";

  /* ----- language (mirrors the page's cx-lang / <html dir>) --------------- */
  function curLang() {
    try {
      if (document.documentElement.dir === "rtl") return "ar";
      if (document.documentElement.lang === "ar") return "ar";
      if (localStorage.getItem("cx-lang") === "ar") return "ar";
    } catch (e) {}
    return "en";
  }
  function isAr() { return curLang() === "ar"; }
  var STR = {
    en: {
      "login.title": "Welcome back",
      "login.sub": "Sign in to save homes, follow agents, and book viewings.",
      "register.title": "Create your account",
      "register.sub": "Join Chiya to save homes, manage enquiries, and book viewings.",
      "f.id.l": "Email or phone number",         "f.id.ph": "you@email.com",
      "f.pw.l": "Password",                      "f.pw.ph": "Your password",
      "f.name.l": "Full name",                   "f.name.ph": "Your full name",
      "f.email.l": "Email",                      "f.email.ph": "you@email.com",
      "f.phone.l": "Phone number",               "f.phone.ph": "+964 7XX XXX XXXX",
      "f.npw.ph": "Create a password",
      "f.confirm.l": "Confirm password",         "f.confirm.ph": "Repeat password",
      "forgot": "Forgot password?",
      "login.submit": "Login",
      "register.submit": "Create account",
      "or": "or",
      "google": "Continue with Google",
      "login.switchPre": "New to Chiya?",        "login.switchAct": "Create an account",
      "register.switchPre": "Already have an account?", "register.switchAct": "Sign in",
      "login.trust": "Your details are encrypted and never shared. Verified agents only.",
      "register.trust": "By continuing you agree to Chiya's Terms and Privacy Policy.",
      "iam": "I am a",
      "type.customer.t": "Customer", "type.customer.d": "Buy, rent, sell or list your own home.",
      "type.agent.t": "Agent",       "type.agent.d": "Real estate professional managing listings.",
      "err.id": "Enter your email or phone number",
      "err.pw": "Enter your password",
      "err.name": "Enter your full name",
      "err.email": "Enter a valid email",
      "err.phone": "Enter a valid phone number",
      "err.pwShort": "At least 6 characters",
      "err.confirm": "Passwords do not match",
      "load.signin": "Signing in\u2026",
      "load.create": "Creating account\u2026",
      "load.google": "Connecting to Google\u2026",
      "welcome.named": "Welcome, ",
      "welcome.generic": "You're signed in",
      "aria.show": "Show password", "aria.hide": "Hide password", "aria.close": "Close",
      "forgot.toast": "Password reset link sent to your email",
      "intent.list.note": "Create a free account to list your property. Customers and agents are welcome.",
      "intent.list.toast": "You're in \u2014 let's list your property",
      "intent.agent.note": "Sign in to save this agent to your shortlist.",
      "intent.agent.toast": "Agent saved to your shortlist",
      "intent.book.note": "Sign in to book a viewing. It's free, with no obligation \u2014 confirmed in 24h.",
      "intent.book.toast": "Let's book your viewing",
      "intent.save.note": "Sign in to save this home to your favourites.",
      "intent.save.toast": "Saved to your favourites",
      "chip.account": "Account",
      "role.agent": "Agent", "role.customer": "Customer",
      "member": "Member", "chiyaMember": "Chiya member",
      "menu.saved": "Saved homes", "menu.agents": "Saved agents", "menu.viewings": "My viewings", "menu.logout": "Log out",
      "toast.saved": "Opening your saved homes", "toast.agents": "Opening your saved agents", "toast.viewings": "Opening your viewings",
      "toast.loggedout": "You've been logged out"
    },
    ar: {
      "login.title": "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0639\u0648\u062f\u062a\u0643",
      "login.sub": "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062d\u0641\u0638 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0648\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0648\u0643\u0644\u0627\u0621 \u0648\u062d\u062c\u0632 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0627\u062a.",
      "register.title": "\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0643",
      "register.sub": "\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0634\u064a\u0627 \u0644\u062d\u0641\u0638 \u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0648\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0648\u062d\u062c\u0632 \u0627\u0644\u0645\u0639\u0627\u064a\u0646\u0627\u062a.",
      "f.id.l": "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0623\u0648 \u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641", "f.id.ph": "you@email.com",
      "f.pw.l": "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", "f.pw.ph": "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062e\u0627\u0635\u0629 \u0628\u0643",
      "f.name.l": "\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644", "f.name.ph": "\u0627\u0633\u0645\u0643 \u0627\u0644\u0643\u0627\u0645\u0644",
      "f.email.l": "\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a", "f.email.ph": "you@email.com",
      "f.phone.l": "\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641", "f.phone.ph": "+964 7XX XXX XXXX",
      "f.npw.ph": "\u0623\u0646\u0634\u0626 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631",
      "f.confirm.l": "\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", "f.confirm.ph": "\u0623\u0639\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      "forgot": "\u0646\u0633\u064a\u062a \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061f",
      "login.submit": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
      "register.submit": "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628",
      "or": "\u0623\u0648",
      "google": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0639\u0628\u0631 Google",
      "login.switchPre": "\u062c\u062f\u064a\u062f \u0639\u0644\u0649 \u0634\u064a\u0627\u061f", "login.switchAct": "\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0627\u064b",
      "register.switchPre": "\u0644\u062f\u064a\u0643 \u062d\u0633\u0627\u0628 \u0628\u0627\u0644\u0641\u0639\u0644\u061f", "register.switchAct": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
      "login.trust": "\u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0645\u0634\u0641\u0651\u0631\u0629 \u0648\u0644\u0627 \u062a\u064f\u0634\u0627\u0631\u064e\u0643 \u0623\u0628\u062f\u0627\u064b. \u0648\u0643\u0644\u0627\u0621 \u0645\u0648\u062b\u0651\u0642\u0648\u0646 \u0641\u0642\u0637.",
      "register.trust": "\u0628\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0641\u0625\u0646\u0643 \u062a\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0634\u0631\u0648\u0637 \u0634\u064a\u0627 \u0648\u0633\u064a\u0627\u0633\u0629 \u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629.",
      "iam": "\u0623\u0646\u0627",
      "type.customer.t": "\u0639\u0645\u064a\u0644", "type.customer.d": "\u0634\u0631\u0627\u0621 \u0623\u0648 \u0627\u0633\u062a\u0626\u062c\u0627\u0631 \u0623\u0648 \u0628\u064a\u0639 \u0623\u0648 \u0625\u062f\u0631\u0627\u062c \u0645\u0646\u0632\u0644\u0643.",
      "type.agent.t": "\u0648\u0643\u064a\u0644", "type.agent.d": "\u0645\u062d\u062a\u0631\u0641 \u0639\u0642\u0627\u0631\u064a \u064a\u062f\u064a\u0631 \u0627\u0644\u0642\u0648\u0627\u0626\u0645.",
      "err.id": "\u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0623\u0648 \u0631\u0642\u0645 \u0647\u0627\u062a\u0641\u0643",
      "err.pw": "\u0623\u062f\u062e\u0644 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
      "err.name": "\u0623\u062f\u062e\u0644 \u0627\u0633\u0645\u0643 \u0627\u0644\u0643\u0627\u0645\u0644",
      "err.email": "\u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u0627\u064b \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u064b \u0635\u0627\u0644\u062d\u0627\u064b",
      "err.phone": "\u0623\u062f\u062e\u0644 \u0631\u0642\u0645 \u0647\u0627\u062a\u0641 \u0635\u0627\u0644\u062d\u0627\u064b",
      "err.pwShort": "6 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644",
      "err.confirm": "\u0643\u0644\u0645\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646",
      "load.signin": "\u062c\u0627\u0631\u064d \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644\u2026",
      "load.create": "\u062c\u0627\u0631\u064d \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628\u2026",
      "load.google": "\u062c\u0627\u0631\u064d \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0640 Google\u2026",
      "welcome.named": "\u0645\u0631\u062d\u0628\u0627\u064b\u060c ",
      "welcome.generic": "\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644\u0643",
      "aria.show": "\u0625\u0638\u0647\u0627\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", "aria.hide": "\u0625\u062e\u0641\u0627\u0621 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631", "aria.close": "\u0625\u063a\u0644\u0627\u0642",
      "forgot.toast": "\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0625\u0644\u0649 \u0628\u0631\u064a\u062f\u0643",
      "intent.list.note": "\u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0627\u064b \u0645\u062c\u0627\u0646\u064a\u0627\u064b \u0644\u0625\u062f\u0631\u0627\u062c \u0639\u0642\u0627\u0631\u0643. \u0646\u0631\u062d\u0628 \u0628\u0627\u0644\u0639\u0645\u0644\u0627\u0621 \u0648\u0627\u0644\u0648\u0643\u0644\u0627\u0621.",
      "intent.list.toast": "\u062a\u0645 \u062a\u0633\u062c\u064a\u0644\u0643 \u2014 \u0644\u0646\u062f\u0631\u062c \u0639\u0642\u0627\u0631\u0643",
      "intent.agent.note": "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062d\u0641\u0638 \u0647\u0630\u0627 \u0627\u0644\u0648\u0643\u064a\u0644 \u0641\u064a \u0642\u0627\u0626\u0645\u062a\u0643.",
      "intent.agent.toast": "\u062a\u0645 \u062d\u0641\u0638 \u0627\u0644\u0648\u0643\u064a\u0644 \u0641\u064a \u0642\u0627\u0626\u0645\u062a\u0643",
      "intent.book.note": "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062d\u062c\u0632 \u0645\u0639\u0627\u064a\u0646\u0629. \u0645\u062c\u0627\u0646\u0627\u064b \u0648\u0628\u062f\u0648\u0646 \u0627\u0644\u062a\u0632\u0627\u0645 \u2014 \u064a\u064f\u0624\u0643\u0651\u062f \u062e\u0644\u0627\u0644 24 \u0633\u0627\u0639\u0629.",
      "intent.book.toast": "\u0644\u0646\u062d\u062c\u0632 \u0645\u0639\u0627\u064a\u0646\u062a\u0643",
      "intent.save.note": "\u0633\u062c\u0651\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062d\u0641\u0638 \u0647\u0630\u0627 \u0627\u0644\u0645\u0646\u0632\u0644 \u0641\u064a \u0645\u0641\u0636\u0651\u0644\u062a\u0643.",
      "intent.save.toast": "\u062a\u0645 \u0627\u0644\u062d\u0641\u0638 \u0641\u064a \u0645\u0641\u0636\u0651\u0644\u062a\u0643",
      "chip.account": "\u0627\u0644\u062d\u0633\u0627\u0628",
      "role.agent": "\u0648\u0643\u064a\u0644", "role.customer": "\u0639\u0645\u064a\u0644",
      "member": "\u0639\u0636\u0648", "chiyaMember": "\u0639\u0636\u0648 \u0634\u064a\u0627",
      "menu.saved": "\u0627\u0644\u0645\u0646\u0627\u0632\u0644 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629", "menu.agents": "\u0627\u0644\u0648\u0643\u0644\u0627\u0621 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0648\u0646", "menu.viewings": "\u0645\u0639\u0627\u064a\u0646\u0627\u062a\u064a", "menu.logout": "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
      "toast.saved": "\u0641\u062a\u062d \u0645\u0646\u0627\u0632\u0644\u0643 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629", "toast.agents": "\u0641\u062a\u062d \u0648\u0643\u0644\u0627\u0626\u0643 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u064a\u0646", "toast.viewings": "\u0641\u062a\u062d \u0645\u0639\u0627\u064a\u0646\u0627\u062a\u0643",
      "toast.loggedout": "\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c\u0643"
    }
  };
  function L(key, fb) {
    var d = STR[curLang()];
    if (d && d[key] != null) return d[key];
    if (STR.en[key] != null) return STR.en[key];
    return fb != null ? fb : key;
  }

  /* ----- tiny Lucide-style icon set (24/1.75 round) ----------------------- */
  function svg(inner, opts) {
    opts = opts || {};
    return '<svg viewBox="0 0 24 24" width="' + (opts.size || 20) + '" height="' + (opts.size || 20) +
      '" fill="' + (opts.fill || "none") + '" stroke="currentColor" stroke-width="' + (opts.sw || 1.75) +
      '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + "</svg>";
  }
  var I = {
    x: function (s) { return svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', { size: s }); },
    mail: function (s) { return svg('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>', { size: s }); },
    lock: function (s) { return svg('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>', { size: s }); },
    eye: function (s) { return svg('<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>', { size: s }); },
    eyeOff: function (s) { return svg('<path d="M10.73 5.08a10.74 10.74 0 0 1 11.2 6.57 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49"/><path d="M14.08 14.16a3 3 0 0 1-4.24-4.24"/><path d="M17.48 17.5a10.75 10.75 0 0 1-15.42-5.15 1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14"/><path d="m2 2 20 20"/>', { size: s }); },
    phone: function (s) { return svg('<path d="M13.83 19.04a16 16 0 0 1-8.87-8.87l1.6-1.6a2 2 0 0 0 .45-2.11 12.84 12.84 0 0 1-.7-2.74A2 2 0 0 0 4.31 2H3.1a2 2 0 0 0-2 2.2A18.81 18.81 0 0 0 19.8 22.9a2 2 0 0 0 2.2-2v-1.2a2 2 0 0 0-1.72-2 12.84 12.84 0 0 1-2.74-.7 2 2 0 0 0-2.11.45z"/>', { size: s }); },
    user: function (s) { return svg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>', { size: s }); },
    check: function (s) { return svg('<path d="M20 6 9 17l-5-5"/>', { size: s }); },
    shield: function (s) { return svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>', { size: s }); },
    chevron: function (s) { return svg('<path d="m6 9 6 6 6-6"/>', { size: s }); },
    logout: function (s) { return svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>', { size: s }); },
    home: function (s) { return svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', { size: s }); },
    briefcase: function (s) { return svg('<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>', { size: s }); },
    heart: function (s) { return svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>', { size: s }); },
    calendar: function (s) { return svg('<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/>', { size: s }); },
    key: function (s) { return svg('<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>', { size: s }); },
    bookmark: function (s) { return svg('<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>', { size: s }); }
  };
  var GOOGLE_G = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">' +
    '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>' +
    '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>' +
    '<path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>' +
    '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z"/></svg>';

  /* ----- styles ----------------------------------------------------------- */
  function injectCSS() {
    if (document.getElementById("cxa-css")) return;
    var s = document.createElement("style");
    s.id = "cxa-css";
    s.textContent = [
      ".cxa-overlay{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:24px;",
      "background:rgba(11,32,24,.48);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);font-family:var(--font-sans,system-ui);}",
      ".cxa-sheet{position:relative;width:100%;max-width:524px;max-height:calc(100vh - 48px);background:var(--surface-card,#fff);",
      "border-radius:22px;box-shadow:var(--shadow-2xl,0 24px 60px -12px rgba(11,32,24,.34));display:flex;flex-direction:column;overflow:hidden;}",
      ".cxa-overlay.cxa-anim .cxa-sheet{animation:cxa-shin .26s cubic-bezier(.2,.7,.2,1);}",
      "@keyframes cxa-shin{from{transform:translateY(16px) scale(.99);}to{transform:none;}}",
      ".cxa-scroll{overflow-y:auto;padding:34px 38px 30px;}",
      ".cxa-scroll::-webkit-scrollbar{width:7px;}.cxa-scroll::-webkit-scrollbar-thumb{background:var(--gray-200,#e3e0d8);border-radius:8px;}",
      ".cxa-grab{display:none;}",
      ".cxa-close{position:absolute;top:16px;right:16px;z-index:3;display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;",
      "border:1px solid var(--border-subtle,#ece9e1);background:var(--surface-card,#fff);border-radius:50%;color:var(--text-tertiary,#8a857a);cursor:pointer;",
      "transition:background-color .15s,color .15s,border-color .15s;}",
      ".cxa-close:hover{background:var(--gray-50,#f4f2ec);color:var(--text-primary,#23211c);border-color:var(--border-default,#e0ddd3);}",
      ".cxa-brand{display:inline-flex;align-items:center;gap:9px;margin-bottom:20px;}",
      ".cxa-brand img{width:30px;height:30px;border-radius:0;display:block;}",
      ".cxa-brand b{font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:19px;text-transform:uppercase;letter-spacing:.16em;color:var(--green-700,#18402F);white-space:nowrap;}",
      ".cxa-title{font-family:var(--font-display,Georgia,serif);font-weight:600;font-size:30px;line-height:1.1;letter-spacing:-.02em;color:var(--text-primary,#23211c);margin:0;text-wrap:balance;}",
      ".cxa-sub{font-size:15px;line-height:22px;color:var(--text-secondary,#5f5b51);margin:9px 0 0;}",
      ".cxa-intent{display:flex;align-items:flex-start;gap:10px;margin-top:18px;padding:12px 14px;border-radius:12px;",
      "background:var(--green-50,#eef3ee);border:1px solid var(--green-100,#dde8de);font-size:13.5px;line-height:19px;color:var(--green-800,#1c4434);}",
      ".cxa-intent svg{flex:none;color:var(--green-600,#2f6b4f);margin-top:1px;}",
      ".cxa-form{margin-top:24px;display:flex;flex-direction:column;gap:16px;}",
      ".cxa-typesel{display:flex;flex-direction:column;gap:9px;}",
      ".cxa-typesel__lab{font-size:13px;font-weight:600;color:var(--text-primary,#23211c);}",
      ".cxa-typegrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}",
      ".cxa-type{position:relative;display:flex;gap:11px;align-items:flex-start;text-align:left;padding:13px 14px;cursor:pointer;",
      "background:var(--surface-card,#fff);border:1.5px solid var(--border-default,#e0ddd3);border-radius:13px;transition:border-color .15s,background-color .15s,box-shadow .15s;}",
      ".cxa-type:hover{border-color:var(--border-strong,#c9c5b8);}",
      ".cxa-type[aria-checked='true']{border-color:var(--brand-primary,#18402f);background:var(--green-50,#eef3ee);box-shadow:0 0 0 1px var(--brand-primary,#18402f) inset;}",
      ".cxa-type__ic{flex:none;display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;",
      "background:var(--gray-100,#efece5);color:var(--green-700,#23543e);transition:background-color .15s,color .15s;}",
      ".cxa-type[aria-checked='true'] .cxa-type__ic{background:var(--brand-primary,#18402f);color:#fff;}",
      ".cxa-type__t{display:block;font-size:14.5px;font-weight:600;color:var(--text-primary,#23211c);line-height:18px;}",
      ".cxa-type__d{display:block;font-size:11.5px;line-height:15px;color:var(--text-tertiary,#8a857a);margin-top:3px;}",
      ".cxa-type__tick{position:absolute;top:9px;right:9px;width:18px;height:18px;border-radius:50%;background:var(--brand-primary,#18402f);color:#fff;",
      "display:none;align-items:center;justify-content:center;}",
      ".cxa-type[aria-checked='true'] .cxa-type__tick{display:inline-flex;}",
      ".cxa-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}",
      ".cxa-field{display:flex;flex-direction:column;gap:6px;}",
      ".cxa-label{font-size:13px;font-weight:600;color:var(--text-primary,#23211c);}",
      ".cxa-inputwrap{display:flex;align-items:center;gap:10px;height:48px;padding:0 14px;background:var(--surface-card,#fff);",
      "border:1px solid var(--border-default,#e0ddd3);border-radius:var(--radius-control,9px);transition:border-color .15s,box-shadow .15s;}",
      ".cxa-inputwrap:focus-within{border-color:var(--border-focus,#18402f);box-shadow:var(--shadow-focus-brand,0 0 0 4px rgba(24,64,47,.13));}",
      ".cxa-inputwrap.cxa-bad{border-color:var(--error-500,#c0392b);box-shadow:0 0 0 4px rgba(192,57,43,.12);}",
      ".cxa-ic{flex:none;color:var(--green-600,#2f6b4f);display:inline-flex;}",
      ".cxa-inputwrap input{flex:1;min-width:0;border:none;outline:none;background:transparent;font-family:inherit;font-size:15px;color:var(--text-primary,#23211c);}",
      ".cxa-inputwrap input::placeholder{color:var(--text-placeholder,#a8a499);}",
      ".cxa-peek{flex:none;display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border:none;background:none;",
      "color:var(--text-tertiary,#8a857a);cursor:pointer;border-radius:7px;}",
      ".cxa-peek:hover{background:var(--gray-100,#efece5);color:var(--text-primary,#23211c);}",
      ".cxa-err{font-size:12px;color:var(--text-error,#c0392b);min-height:0;}",
      ".cxa-aux{display:flex;justify-content:flex-end;margin-top:-4px;}",
      ".cxa-link{background:none;border:none;cursor:pointer;font-family:inherit;font-size:13.5px;font-weight:600;color:var(--brand-primary,#18402f);padding:2px;}",
      ".cxa-link:hover{text-decoration:underline;text-underline-offset:3px;}",
      ".cxa-submit{height:52px;border:none;border-radius:var(--radius-control,9px);background:var(--brand-primary,#18402f);color:#fff;",
      "font-family:inherit;font-size:16px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:9px;",
      "box-shadow:var(--shadow-xs,0 1px 2px rgba(11,32,24,.08));transition:background-color .15s,transform .06s;margin-top:2px;}",
      ".cxa-submit:hover{background:var(--brand-primary-hover,#143426);}",
      ".cxa-submit:active{transform:translateY(.5px);}",
      ".cxa-submit[disabled]{opacity:.65;cursor:default;}",
      ".cxa-spin{width:18px;height:18px;border:2.2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:cxa-rot .7s linear infinite;}",
      "@keyframes cxa-rot{to{transform:rotate(360deg);}}",
      ".cxa-or{display:flex;align-items:center;gap:14px;margin:20px 0;color:var(--text-tertiary,#8a857a);font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;}",
      ".cxa-or::before,.cxa-or::after{content:'';height:1px;flex:1;background:var(--border-subtle,#ece9e1);}",
      ".cxa-google{width:100%;height:50px;border:1px solid var(--border-default,#e0ddd3);border-radius:var(--radius-control,9px);background:var(--surface-card,#fff);",
      "color:var(--text-primary,#23211c);font-family:inherit;font-size:15px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:11px;",
      "transition:background-color .15s,border-color .15s;}",
      ".cxa-google:hover{background:var(--gray-50,#f4f2ec);border-color:var(--border-strong,#c9c5b8);}",
      ".cxa-switch{margin-top:22px;text-align:center;font-size:14px;color:var(--text-secondary,#5f5b51);}",
      ".cxa-switch button{background:none;border:none;cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;color:var(--brand-primary,#18402f);padding:2px 3px;white-space:nowrap;}",
      ".cxa-switch button:hover{text-decoration:underline;text-underline-offset:3px;}",
      ".cxa-trust{margin-top:20px;padding-top:18px;border-top:1px solid var(--border-subtle,#ece9e1);display:flex;align-items:center;gap:9px;",
      "font-size:12.5px;line-height:17px;color:var(--text-tertiary,#8a857a);}",
      ".cxa-trust svg{flex:none;color:var(--green-600,#2f6b4f);}",
      /* logged-in nav chip */
      ".cxh__actions[data-cxa-authed] .cx-btn{display:none!important;}",
      ".cxa-acct{position:relative;display:inline-flex;align-items:center;gap:9px;height:42px;padding:0 12px 0 6px;border:1px solid var(--border-default,#e0ddd3);",
      "background:var(--surface-card,#fff);border-radius:var(--radius-pill,999px);cursor:pointer;font-family:var(--font-sans,system-ui);transition:border-color .15s,box-shadow .15s;}",
      ".cxa-acct:hover{border-color:var(--border-strong,#c9c5b8);}",
      ".cxa-acct__av{flex:none;width:32px;height:32px;border-radius:50%;background:var(--brand-primary,#18402f);color:#fff;display:inline-flex;align-items:center;justify-content:center;",
      "font-size:13px;font-weight:700;letter-spacing:.01em;}",
      ".cxa-acct__nm{font-size:14px;font-weight:600;color:var(--text-primary,#23211c);max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".cxa-acct__cv{color:var(--text-tertiary,#8a857a);display:inline-flex;}",
      ".cxa-menu{position:absolute;top:calc(100% + 8px);right:0;z-index:30;width:222px;background:var(--surface-card,#fff);border:1px solid var(--border-subtle,#ece9e1);",
      "border-radius:14px;box-shadow:var(--shadow-2xl,0 18px 44px -10px rgba(11,32,24,.3));padding:8px;display:none;}",
      ".cxa-menu.cxa-open{display:block;animation:cxa-pop .14s cubic-bezier(.2,.7,.2,1);}",
      "@keyframes cxa-pop{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:none;}}",
      ".cxa-menu__id{padding:8px 10px 10px;border-bottom:1px solid var(--border-subtle,#ece9e1);margin-bottom:6px;}",
      ".cxa-menu__nm{font-size:14px;font-weight:700;color:var(--text-primary,#23211c);}",
      ".cxa-menu__em{font-size:12.5px;color:var(--text-tertiary,#8a857a);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}",
      ".cxa-menu__role{display:inline-flex;align-items:center;gap:5px;margin-top:8px;padding:3px 9px;border-radius:999px;background:var(--green-50,#eef3ee);",
      "color:var(--green-800,#1c4434);font-size:11px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;}",
      ".cxa-menu__item{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 10px;border:none;background:none;cursor:pointer;",
      "border-radius:9px;font-family:inherit;font-size:14px;font-weight:500;color:var(--text-primary,#23211c);transition:background-color .13s;}",
      ".cxa-menu__item:hover{background:var(--gray-50,#f4f2ec);}",
      ".cxa-menu__item svg{color:var(--text-tertiary,#8a857a);}",
      ".cxa-menu__item--danger{color:var(--text-error,#c0392b);}.cxa-menu__item--danger svg{color:var(--text-error,#c0392b);}",
      /* toast */
      ".cxa-toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%) translateY(16px);z-index:9500;display:flex;align-items:center;gap:10px;",
      "padding:13px 20px;border-radius:13px;background:var(--gray-950,#181712);color:#fff;font-family:var(--font-sans,system-ui);font-size:14.5px;font-weight:500;",
      "box-shadow:0 14px 34px -8px rgba(11,32,24,.5);opacity:0;transition:opacity .22s ease,transform .22s cubic-bezier(.2,.7,.2,1);pointer-events:none;max-width:90vw;}",
      ".cxa-toast.cxa-in{opacity:1;transform:translateX(-50%) translateY(0);}",
      ".cxa-toast svg{flex:none;color:var(--brand-accent,#c9a24b);}",
      "@media (max-width:560px){",
      ".cxa-overlay{padding:0;align-items:flex-end;}",
      ".cxa-sheet{max-width:100%;max-height:94vh;border-radius:22px 22px 0 0;}",
      ".cxa-overlay.cxa-anim .cxa-sheet{animation:cxa-shup .28s cubic-bezier(.2,.7,.2,1);}",
      "@keyframes cxa-shup{from{transform:translateY(100%);}to{transform:none;}}",
      ".cxa-scroll{padding:14px 22px 26px;}",
      ".cxa-grab{display:block;width:40px;height:4px;border-radius:99px;background:var(--gray-200,#e3e0d8);margin:2px auto 14px;}",
      ".cxa-title{font-size:26px;}",
      ".cxa-row{grid-template-columns:1fr;gap:16px;}",
      ".cxa-close{top:12px;right:12px;}",
      "}",
      "@media (prefers-reduced-motion:reduce){.cxa-overlay,.cxa-sheet{animation:none!important;}.cxa-toast{transition:none;}.cxa-spin{animation:none;}}",
      /* ---- RTL (Arabic) ---- */
      '[dir="rtl"] .cxa-close{right:auto;left:16px;}',
      '[dir="rtl"] .cxa-type{text-align:right;}',
      '[dir="rtl"] .cxa-type__tick{right:auto;left:9px;}',
      '[dir="rtl"] .cxa-menu{right:auto;left:0;}',
      '[dir="rtl"] .cxa-menu__item{text-align:right;}',
      '[dir="rtl"] .cxa-acct{padding:0 6px 0 12px;}',
      '[dir="rtl"] .cxa-acct__cv{transform:scaleX(-1);}',
      '[dir="rtl"] .cxa-or{letter-spacing:0;}',
      '@media (max-width:560px){[dir="rtl"] .cxa-close{right:auto;left:12px;}}'
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ----- state ------------------------------------------------------------ */
  function load() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "null"); } catch (e) { return null; } }
  function save(u) { try { localStorage.setItem(LS_KEY, JSON.stringify(u)); } catch (e) {} }
  function isAuthed() { return !!load(); }

  var overlayEl = null, scrollEl = null;
  var mode = "login";          // "login" | "register"
  var regType = "customer";    // "customer" | "agent"
  var pending = null;          // { el, run, toast, label }
  var onSuccessCb = null;
  var lastFocus = null;

  /* ----- field markup ----------------------------------------------------- */
  function field(opts) {
    var icon = opts.icon ? '<span class="cxa-ic">' + opts.icon + "</span>" : "";
    var peek = opts.peek ? '<button type="button" class="cxa-peek" data-peek aria-label="' + L("aria.show") + '">' + I.eye(18) + "</button>" : "";
    return '<label class="cxa-field" data-field="' + opts.name + '">' +
      '<span class="cxa-label">' + opts.label + "</span>" +
      '<div class="cxa-inputwrap">' + icon +
      '<input name="' + opts.name + '" type="' + (opts.type || "text") + '" placeholder="' + (opts.ph || "") +
      '" autocomplete="' + (opts.ac || "off") + '" inputmode="' + (opts.im || "text") + '"/>' + peek +
      "</div><span class=\"cxa-err\" data-err></span></label>";
  }

  /* ----- render body ------------------------------------------------------ */
  function intentNote() {
    if (!pending || !pending.note) return "";
    return '<div class="cxa-intent">' + I.shield(16) + "<span>" + pending.note + "</span></div>";
  }

  function renderLogin() {
    return '<div class="cxa-brand"><img src="' + BRAND_LOGO + '" alt=""/><b>CHIYA</b></div>' +
      '<h2 class="cxa-title">' + L("login.title") + '</h2>' +
      '<p class="cxa-sub">' + L("login.sub") + '</p>' +
      intentNote() +
      '<form class="cxa-form" novalidate>' +
        field({ name: "id", label: L("f.id.l"), icon: I.mail(18), ph: L("f.id.ph"), ac: "username" }) +
        field({ name: "password", label: L("f.pw.l"), icon: I.lock(18), type: "password", ph: L("f.pw.ph"), ac: "current-password", peek: true }) +
        '<div class="cxa-aux"><button type="button" class="cxa-link" data-forgot>' + L("forgot") + '</button></div>' +
        '<button type="submit" class="cxa-submit">' + L("login.submit") + '</button>' +
      "</form>" +
      '<div class="cxa-or"><span>' + L("or") + '</span></div>' +
      '<button type="button" class="cxa-google" data-google>' + GOOGLE_G + L("google") + "</button>" +
      '<div class="cxa-switch">' + L("login.switchPre") + ' <button type="button" data-switch="register">' + L("login.switchAct") + '</button></div>' +
      '<div class="cxa-trust">' + I.shield(16) + L("login.trust") + "</div>";
  }

  function typeCard(val, icon, title, desc) {
    return '<button type="button" class="cxa-type" data-type="' + val + '" role="radio" aria-checked="' + (regType === val) + '">' +
      '<span class="cxa-type__ic">' + icon + "</span>" +
      '<span><span class="cxa-type__t">' + title + "</span><span class=\"cxa-type__d\">" + desc + "</span></span>" +
      '<span class="cxa-type__tick">' + I.check(12) + "</span></button>";
  }

  function renderRegister() {
    return '<div class="cxa-brand"><img src="' + BRAND_LOGO + '" alt=""/><b>CHIYA</b></div>' +
      '<h2 class="cxa-title">' + L("register.title") + '</h2>' +
      '<p class="cxa-sub">' + L("register.sub") + '</p>' +
      intentNote() +
      '<form class="cxa-form" novalidate>' +
        '<div class="cxa-typesel"><span class="cxa-typesel__lab">' + L("iam") + '</span>' +
          '<div class="cxa-typegrid" role="radiogroup">' +
            typeCard("customer", I.home(18), L("type.customer.t"), L("type.customer.d")) +
            typeCard("agent", I.briefcase(18), L("type.agent.t"), L("type.agent.d")) +
          "</div></div>" +
        field({ name: "name", label: L("f.name.l"), icon: I.user(18), ph: L("f.name.ph"), ac: "name" }) +
        field({ name: "email", label: L("f.email.l"), icon: I.mail(18), type: "email", ph: L("f.email.ph"), ac: "email", im: "email" }) +
        field({ name: "phone", label: L("f.phone.l"), icon: I.phone(18), type: "tel", ph: L("f.phone.ph"), ac: "tel", im: "tel" }) +
        field({ name: "password", label: L("f.pw.l"), icon: I.lock(18), type: "password", ph: L("f.npw.ph"), ac: "new-password", peek: true }) +
        field({ name: "confirm", label: L("f.confirm.l"), icon: I.lock(18), type: "password", ph: L("f.confirm.ph"), ac: "new-password", peek: true }) +
        '<button type="submit" class="cxa-submit">' + L("register.submit") + '</button>' +
      "</form>" +
      '<div class="cxa-or"><span>' + L("or") + '</span></div>' +
      '<button type="button" class="cxa-google" data-google>' + GOOGLE_G + L("google") + "</button>" +
      '<div class="cxa-switch">' + L("register.switchPre") + ' <button type="button" data-switch="login">' + L("register.switchAct") + '</button></div>' +
      '<div class="cxa-trust">' + I.shield(16) + L("register.trust") + "</div>";
  }

  function paint() {
    scrollEl.innerHTML = '<div class="cxa-grab"></div>' + (mode === "login" ? renderLogin() : renderRegister());
    bindBody();
    var first = scrollEl.querySelector("input");
    if (first && window.matchMedia("(min-width:561px)").matches) setTimeout(function () { try { first.focus(); } catch (e) {} }, 60);
  }

  /* ----- validation ------------------------------------------------------- */
  function setErr(name, msg) {
    var f = scrollEl.querySelector('[data-field="' + name + '"]');
    if (!f) return;
    f.querySelector("[data-err]").textContent = msg || "";
    f.querySelector(".cxa-inputwrap").classList.toggle("cxa-bad", !!msg);
  }
  function val(name) {
    var el = scrollEl.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : "";
  }
  function emailish(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  function submit() {
    var ok = true;
    if (mode === "login") {
      var id = val("id"), pw = val("password");
      if (!id) { setErr("id", L("err.id")); ok = false; } else setErr("id", "");
      if (!pw) { setErr("password", L("err.pw")); ok = false; } else setErr("password", "");
      if (!ok) return;
      finish({ name: nameFromId(id), email: id.indexOf("@") > -1 ? id : "", phone: id.indexOf("@") > -1 ? "" : id, type: "customer" });
    } else {
      var nm = val("name"), em = val("email"), ph = val("phone"), p1 = val("password"), p2 = val("confirm");
      if (!nm) { setErr("name", L("err.name")); ok = false; } else setErr("name", "");
      if (!emailish(em)) { setErr("email", L("err.email")); ok = false; } else setErr("email", "");
      if (ph.replace(/\D/g, "").length < 7) { setErr("phone", L("err.phone")); ok = false; } else setErr("phone", "");
      if (p1.length < 6) { setErr("password", L("err.pwShort")); ok = false; } else setErr("password", "");
      if (p2 !== p1 || !p2) { setErr("confirm", L("err.confirm")); ok = false; } else setErr("confirm", "");
      if (!ok) return;
      finish({ name: nm, email: em, phone: ph, type: regType });
    }
  }
  function nameFromId(id) {
    if (id.indexOf("@") > -1) {
      var p = id.split("@")[0].replace(/[._-]+/g, " ").trim();
      return p.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }
    return "Member";
  }

  function finish(user) {
    var btn = scrollEl.querySelector(".cxa-submit");
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="cxa-spin"></span>' + (mode === "login" ? L("load.signin") : L("load.create")); }
    setTimeout(function () {
      save(user);
      syncNav();
      var welcome = (user.name && user.name !== "Member") ? L("welcome.named") + user.name.split(" ")[0] : L("welcome.generic");
      var p = pending; var cb = onSuccessCb;
      hardClose();
      if (p && p.run) {
        showToast(p.toast || welcome, I.check(17));
        p.run();
      } else {
        showToast(welcome, I.check(17));
      }
      if (cb) try { cb(user); } catch (e) {}
    }, 620);
  }

  /* ----- body event binding ---------------------------------------------- */
  function bindBody() {
    var form = scrollEl.querySelector(".cxa-form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    scrollEl.querySelectorAll("[data-switch]").forEach(function (b) {
      b.addEventListener("click", function () { mode = b.getAttribute("data-switch"); paint(); });
    });
    scrollEl.querySelectorAll("[data-peek]").forEach(function (b) {
      b.addEventListener("click", function () {
        var inp = b.parentElement.querySelector("input");
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        b.innerHTML = show ? I.eyeOff(18) : I.eye(18);
        b.setAttribute("aria-label", show ? L("aria.hide") : L("aria.show"));
      });
    });
    scrollEl.querySelectorAll("[data-type]").forEach(function (b) {
      b.addEventListener("click", function () {
        regType = b.getAttribute("data-type");
        scrollEl.querySelectorAll("[data-type]").forEach(function (x) { x.setAttribute("aria-checked", x === b); });
      });
    });
    var g = scrollEl.querySelector("[data-google]");
    if (g) g.addEventListener("click", function () {
      g.disabled = true; g.innerHTML = '<span class="cxa-spin" style="border-color:rgba(24,64,47,.3);border-top-color:var(--brand-primary,#18402f)"></span>' + L("load.google");
      setTimeout(function () { finish({ name: "Chiya Member", email: "member@gmail.com", phone: "", type: mode === "register" ? regType : "customer" }); }, 640);
    });
    var fp = scrollEl.querySelector("[data-forgot]");
    if (fp) fp.addEventListener("click", function () { showToast(L("forgot.toast"), I.mail(17)); });
    scrollEl.querySelectorAll("input").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var f = inp.closest("[data-field]");
        if (f && f.querySelector("[data-err]").textContent) { f.querySelector("[data-err]").textContent = ""; f.querySelector(".cxa-inputwrap").classList.remove("cxa-bad"); }
      });
    });
  }

  /* ----- open / close ----------------------------------------------------- */
  function ensureDom() {
    if (overlayEl) return;
    injectCSS();
    overlayEl = document.createElement("div");
    overlayEl.className = "cxa-overlay";
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");
    overlayEl.innerHTML = '<div class="cxa-sheet"><button type="button" class="cxa-close" aria-label="Close">' + I.x(20) + '</button><div class="cxa-scroll"></div></div>';
    document.body.appendChild(overlayEl);
    scrollEl = overlayEl.querySelector(".cxa-scroll");
    overlayEl.addEventListener("click", function (e) { if (e.target === overlayEl) close(); });
    overlayEl.querySelector(".cxa-close").addEventListener("click", close);
  }

  function open(m, opts) {
    opts = opts || {};
    if (isAuthed()) { // already signed in — just run any action
      if (opts.onSuccess) opts.onSuccess(load());
      return;
    }
    ensureDom();
    overlayEl.dir = isAr() ? "rtl" : "ltr";
    mode = (m === "register") ? "register" : "login";
    regType = "customer";
    onSuccessCb = opts.onSuccess || null;
    if (opts.intent) pending = opts.intent; // {note,run,toast}
    lastFocus = document.activeElement;
    paint();
    document.body.style.overflow = "hidden";
    overlayEl.style.display = "flex";
    overlayEl.style.opacity = "";
    overlayEl.style.transition = "";
    overlayEl.classList.remove("cxa-anim");
    void overlayEl.offsetWidth;        // restart entrance animation
    overlayEl.classList.add("cxa-anim");
    setTimeout(function () { if (overlayEl) overlayEl.classList.remove("cxa-anim"); }, 380);
    document.addEventListener("keydown", onKey);
  }
  function onKey(e) { if (e.key === "Escape") close(); }

  function close() { teardown(false); }
  function hardClose() { teardown(true); }
  function teardown(keepPending) {
    if (!overlayEl) return;
    overlayEl.classList.remove("cxa-anim");
    overlayEl.style.transition = "opacity .16s ease";
    overlayEl.style.opacity = "0";
    document.removeEventListener("keydown", onKey);
    document.body.style.overflow = "";
    var prevFocus = lastFocus;
    setTimeout(function () { if (overlayEl) { overlayEl.style.display = "none"; overlayEl.style.transition = ""; } }, 180);
    if (!keepPending) { pending = null; onSuccessCb = null; }
    if (!keepPending && prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
  }

  /* ----- toast ------------------------------------------------------------ */
  var toastEl = null, toastT = null;
  function showToast(msg, icon) {
    if (!toastEl) { toastEl = document.createElement("div"); toastEl.className = "cxa-toast"; document.body.appendChild(toastEl); }
    toastEl.dir = isAr() ? "rtl" : "ltr";
    toastEl.innerHTML = (icon || I.check(17)) + "<span>" + msg + "</span>";
    requestAnimationFrame(function () { toastEl.classList.add("cxa-in"); });
    if (toastT) clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("cxa-in"); }, 2600);
  }

  /* ----- logged-in nav reflection ---------------------------------------- */
  function initials(name) {
    var parts = (name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "C";
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  }
  function buildChip(actions, u) {
    var chip = document.createElement("div");
    chip.className = "cxa-acct";
    chip.setAttribute("data-cxa-chip", "");
    chip.setAttribute("data-cxa-lang", curLang());
    chip.innerHTML =
      '<span class="cxa-acct__av">' + initials(u.name) + "</span>" +
      '<span class="cxa-acct__nm">' + (u.name ? u.name.split(" ")[0] : L("chip.account")) + "</span>" +
      '<span class="cxa-acct__cv">' + I.chevron(16) + "</span>" +
      '<div class="cxa-menu" data-menu>' +
        '<div class="cxa-menu__id"><div class="cxa-menu__nm">' + (u.name || L("member")) + "</div>" +
          '<div class="cxa-menu__em">' + (u.email || u.phone || L("chiyaMember")) + "</div>" +
          '<span class="cxa-menu__role">' + (u.type === "agent" ? L("role.agent") : L("role.customer")) + "</span></div>" +
        '<button type="button" class="cxa-menu__item" data-mi="saved">' + I.heart(17) + L("menu.saved") + "</button>" +
        '<button type="button" class="cxa-menu__item" data-mi="agents">' + I.bookmark(17) + L("menu.agents") + "</button>" +
        '<button type="button" class="cxa-menu__item" data-mi="viewings">' + I.calendar(17) + L("menu.viewings") + "</button>" +
        '<button type="button" class="cxa-menu__item cxa-menu__item--danger" data-mi="logout">' + I.logout(17) + L("menu.logout") + "</button>" +
      "</div>";
    var menu = chip.querySelector("[data-menu]");
    chip.addEventListener("click", function (e) {
      if (e.target.closest("[data-mi]")) return;
      e.stopPropagation();
      menu.classList.toggle("cxa-open");
    });
    menu.addEventListener("click", function (e) {
      var mi = e.target.closest("[data-mi]"); if (!mi) return;
      e.stopPropagation();
      menu.classList.remove("cxa-open");
      var act = mi.getAttribute("data-mi");
      if (act === "logout") { logout(); }
      else if (act === "saved") showToast(L("toast.saved"), I.heart(17));
      else if (act === "agents") showToast(L("toast.agents"), I.bookmark(17));
      else if (act === "viewings") showToast(L("toast.viewings"), I.calendar(17));
    });
    actions.appendChild(chip);
  }
  function syncNav() {
    var authed = isAuthed();
    var u = load() || {};
    document.querySelectorAll(".cxh__actions").forEach(function (actions) {
      var chip = actions.querySelector("[data-cxa-chip]");
      if (authed) {
        actions.setAttribute("data-cxa-authed", "");
        if (chip && chip.getAttribute("data-cxa-lang") !== curLang()) { chip.remove(); chip = null; }
        if (!chip) buildChip(actions, u);
        else {
          chip.querySelector(".cxa-acct__av").textContent = initials(u.name);
          chip.querySelector(".cxa-acct__nm").textContent = u.name ? u.name.split(" ")[0] : L("chip.account");
        }
      } else {
        actions.removeAttribute("data-cxa-authed");
        if (chip) chip.remove();
      }
    });
  }
  function logout() {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    syncNav();
    showToast(L("toast.loggedout"), I.logout(17));
  }
  // close any open account menu on outside click
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cxa-chip]")) return;
    document.querySelectorAll(".cxa-menu.cxa-open").forEach(function (m) { m.classList.remove("cxa-open"); });
  });

  /* ----- global interception of protected actions ------------------------ */
  var bypass = false;
  function txt(el) { return (el.textContent || "").trim().toLowerCase(); }

  // returns null, or {mode, intent:{note,toast,run?}, replay:bool}
  function classify(target) {
    var el = target.closest("a,button");
    if (!el) return null;

    // --- explicit hooks ---
    if (el.matches('[data-auth="login"]')) return { mode: "login" };
    if (el.matches('[data-auth="register"]')) return { mode: "register" };

    var inActions = !!el.closest(".cxh__actions");
    var t = txt(el);

    // The theme toggle lives in the header actions but is never auth-gated.
    if (el.closest(".cx-thtog")) return null;

    // --- nav login / register (language-independent) ---
    if (inActions && !el.closest(".cxa-acct") && !el.closest(".cxh__langsw")) {
      // login button carries a stable class regardless of language
      if (el.classList.contains("cxh__login") || el.closest(".cxh__login")) return { mode: "login" };
      if (t === "login" || t === "log in" || t === "sign in") return { mode: "login" };
      if (t === "register" || t === "sign up" || t === "signup") return { mode: "register" };
      // Arabic labels
      if (t === "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644") return { mode: "login" };
      if (t === "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628") return { mode: "register" };
      // any remaining action button (the primary one) is sign up
      if (el.closest("button")) return { mode: "register" };
    }

    // --- sell / list property ---
    var inNav = !!el.closest(".cxh__nav");
    if ((inNav && t === "sell") || /\blist (your )?property\b/.test(t)) {
      return { mode: "register", replay: false, intent: {
        note: L("intent.list.note"),
        toast: L("intent.list.toast")
      }};
    }

    // --- save agent (check before generic save) ---
    if (el.matches('.agt-card__save,[aria-label="Save agent"]') ||
        (t === "save agent" || t === "saved") && el.closest(".pro-hero__actions,.cx-agent,.agt-card")) {
      return { mode: "login", replay: true, intent: {
        note: L("intent.agent.note"),
        toast: L("intent.agent.toast")
      }};
    }

    // --- book a viewing ---
    if (el.matches(".pdp-book,.pdp-mobar__btn--book") || /\b(book|request|schedule) (a )?viewing\b/.test(t) ||
        (t === "book" && el.closest(".pdp-mobar"))) {
      return { mode: "login", replay: true, intent: {
        note: L("intent.book.note"),
        toast: L("intent.book.toast")
      }};
    }

    // --- save property (heart / save) ---
    if (el.matches('[aria-label="Save"],[aria-label="Saved"]') ||
        ((t === "save" || t === "saved") && el.closest(".pdp, .srp-results, .cxk-section, [data-screen-label]"))) {
      return { mode: "login", replay: true, intent: {
        note: L("intent.save.note"),
        toast: L("intent.save.toast")
      }};
    }

    return null;
  }

  document.addEventListener("click", function (e) {
    if (bypass) return;            // replayed click — let it through to React
    if (isAuthed()) return;        // logged in — everything proceeds normally
    var hit;
    try { hit = classify(e.target); } catch (err) { hit = null; }
    if (!hit) return;

    e.preventDefault();
    e.stopPropagation();
    if (e.stopImmediatePropagation) e.stopImmediatePropagation();

    var actionable = e.target.closest("a,button");
    var intent = hit.intent ? Object.assign({}, hit.intent) : null;
    if (intent && hit.replay !== false && actionable) {
      intent.run = function () {
        bypass = true;
        try { actionable.click(); } finally { setTimeout(function () { bypass = false; }, 0); }
      };
    } else if (intent) {
      intent.run = function () {}; // no replay (e.g. sell → would route to add-property flow)
    }
    open(hit.mode, { intent: intent });
  }, true); // capture phase — runs before React's root listener

  /* ----- boot ------------------------------------------------------------- */
  function boot() {
    injectCSS();
    syncNav();
    // Deep links: #login / #register / #signin / #signup open the modal.
    var h = (location.hash || "").toLowerCase();
    if (!isAuthed() && /^#(login|signin|sign-in)$/.test(h)) open("login");
    else if (!isAuthed() && /^#(register|signup|sign-up|join)$/.test(h)) open("register");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // Re-apply nav chip after React re-renders (debounced).
  var navT = null;
  var mo = new MutationObserver(function () {
    if (navT) return;
    navT = setTimeout(function () { navT = null; if (isAuthed()) syncNav(); }, 120);
  });
  if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  else document.addEventListener("DOMContentLoaded", function () { mo.observe(document.body, { childList: true, subtree: true }); });

  // Re-translate the nav chip when the page language flips (html dir/lang).
  var langMo = new MutationObserver(function () { if (isAuthed()) syncNav(); });
  langMo.observe(document.documentElement, { attributes: true, attributeFilter: ["dir", "lang"] });

  /* ----- public API ------------------------------------------------------- */
  window.ChiyaAuth = {
    open: function (m, opts) { open(m, opts); },
    close: close,
    isAuthed: isAuthed,
    user: load,
    logout: logout,
    require: function (run, opts) {
      opts = opts || {};
      if (isAuthed()) { run && run(); return; }
      open(opts.mode || "login", { intent: { note: opts.note, toast: opts.toast, run: run || function () {} } });
    }
  };
})();
