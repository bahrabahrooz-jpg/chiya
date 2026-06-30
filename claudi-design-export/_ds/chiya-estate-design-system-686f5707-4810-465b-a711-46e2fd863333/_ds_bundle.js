/* @ds-bundle: {"format":3,"namespace":"ChiyaEstateDesignSystem_686f57","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"IconButton","sourcePath":"components/buttons/IconButton.jsx"},{"name":"AnalyticsCard","sourcePath":"components/dashboard/AnalyticsCard.jsx"},{"name":"ApprovalCard","sourcePath":"components/dashboard/ApprovalCard.jsx"},{"name":"Sparkline","sourcePath":"components/dashboard/StatCard.jsx"},{"name":"StatCard","sourcePath":"components/dashboard/StatCard.jsx"},{"name":"Table","sourcePath":"components/data/Table.jsx"},{"name":"Avatar","sourcePath":"components/feedback/Avatar.jsx"},{"name":"AvatarGroup","sourcePath":"components/feedback/Avatar.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Tag","sourcePath":"components/feedback/Badge.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Radio","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Switch","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Textarea","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"Wordmark","sourcePath":"components/navigation/Navbar.jsx"},{"name":"Navbar","sourcePath":"components/navigation/Navbar.jsx"},{"name":"Breadcrumb","sourcePath":"components/navigation/Navbar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"AgentCard","sourcePath":"components/realestate/AgentCard.jsx"},{"name":"AppointmentWidget","sourcePath":"components/realestate/AppointmentWidget.jsx"},{"name":"FeaturedPropertyCard","sourcePath":"components/realestate/FeaturedPropertyCard.jsx"},{"name":"MapPanel","sourcePath":"components/realestate/MapPanel.jsx"},{"name":"PropertyCard","sourcePath":"components/realestate/PropertyCard.jsx"},{"name":"PropertyGallery","sourcePath":"components/realestate/PropertyGallery.jsx"},{"name":"SearchBar","sourcePath":"components/realestate/SearchFilters.jsx"},{"name":"SearchFilters","sourcePath":"components/realestate/SearchFilters.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"8b8a9b507014","components/buttons/IconButton.jsx":"8b2d68fb20ca","components/dashboard/AnalyticsCard.jsx":"b77d2609c9cb","components/dashboard/ApprovalCard.jsx":"1f3e5e1cdb17","components/dashboard/StatCard.jsx":"1fe40ab69689","components/data/Table.jsx":"469cebda9ece","components/feedback/Avatar.jsx":"d5507c75031e","components/feedback/Badge.jsx":"8a3ffd8ac543","components/feedback/Modal.jsx":"8f439ac29bfc","components/forms/Checkbox.jsx":"be8d8063964d","components/forms/Input.jsx":"2314f7a9a5f3","components/forms/Select.jsx":"59e28bf0e5ad","components/icon/Icon.jsx":"c0ee297cf988","components/navigation/Navbar.jsx":"8bf6fd28db7e","components/navigation/Tabs.jsx":"0c710e9724fa","components/realestate/AgentCard.jsx":"728dac9f2a58","components/realestate/AppointmentWidget.jsx":"c02a09227ee2","components/realestate/FeaturedPropertyCard.jsx":"09ad4c39e26c","components/realestate/MapPanel.jsx":"0f3e508259f4","components/realestate/PropertyCard.jsx":"ce32357308cc","components/realestate/PropertyGallery.jsx":"f9fbcf48b29e","components/realestate/SearchFilters.jsx":"a5b398d7d1c1","ui_kits/mobile/MobileScreens.jsx":"b3185ec2a036","ui_kits/mobile/MobileShared.jsx":"a995faca2483","ui_kits/mobile/android-frame.jsx":"70c8c3059eeb","ui_kits/mobile/ios-frame.jsx":"be3343be4b51","ui_kits/website/DetailScreen.jsx":"6758bf55f16a","ui_kits/website/HomeScreen.jsx":"e3968b94e9c6","ui_kits/website/ListingsScreen.jsx":"04fa83eef378","ui_kits/website/SiteFooter.jsx":"0162a4fbc876","ui_kits/website/SiteHeader.jsx":"c0dffada4458","ui_kits/website/data.js":"05a6eac9dc4b"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.ChiyaEstateDesignSystem_686f57 = window.ChiyaEstateDesignSystem_686f57 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/icon/Icon.jsx
try { (() => {
const React = window.React;
const CX_ICON_CACHE = {};
function cxPascal(name) {
  if (CX_ICON_CACHE[name]) return CX_ICON_CACHE[name];
  const p = String(name).replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
  CX_ICON_CACHE[name] = p;
  return p;
}

/**
 * Icon — renders a Lucide line icon by name, inheriting `currentColor`.
 * Requires the Lucide UMD bundle (window.lucide) to be present.
 */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  color,
  style,
  className,
  ...rest
}) {
  const lib = typeof window !== "undefined" && window.lucide ? window.lucide.icons || window.lucide : {};
  const node = lib[cxPascal(name)] || lib[name];
  const children = Array.isArray(node) ? node : node && node.icon ? node.icon : [];
  return React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color || "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    style: {
      display: "block",
      flex: "none",
      ...style
    },
    "aria-hidden": "true",
    ...rest
  }, children.map((c, i) => Array.isArray(c) ? React.createElement(c[0], {
    key: i,
    ...c[1]
  }) : null));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/buttons/Button.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-button-css")) {
  const s = document.createElement("style");
  s.id = "cx-button-css";
  s.textContent = `
  .cx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;
    font-family:var(--font-sans);font-weight:600;letter-spacing:-0.01em;white-space:nowrap;
    border:1px solid transparent;border-radius:var(--radius-control);cursor:pointer;
    transition:background-color .16s ease,color .16s ease,border-color .16s ease,box-shadow .16s ease,transform .06s ease;
    text-decoration:none;-webkit-tap-highlight-color:transparent;user-select:none;}
  .cx-btn:focus-visible{outline:none;box-shadow:var(--shadow-focus-brand);}
  .cx-btn:active{transform:translateY(0.5px);}
  .cx-btn[disabled],.cx-btn[aria-disabled="true"]{cursor:not-allowed;opacity:.5;transform:none;box-shadow:none;}
  .cx-btn--full{width:100%;}
  /* sizes */
  .cx-btn--sm{height:36px;padding:0 14px;font-size:14px;gap:6px;}
  .cx-btn--md{height:40px;padding:0 16px;font-size:14px;}
  .cx-btn--lg{height:44px;padding:0 18px;font-size:16px;}
  .cx-btn--xl{height:52px;padding:0 22px;font-size:16px;gap:10px;}
  .cx-btn--icon.cx-btn--sm{width:36px;padding:0;}
  .cx-btn--icon.cx-btn--md{width:40px;padding:0;}
  .cx-btn--icon.cx-btn--lg{width:44px;padding:0;}
  .cx-btn--icon.cx-btn--xl{width:52px;padding:0;}
  /* primary */
  .cx-btn--primary{background:var(--brand-primary);color:var(--text-on-brand);box-shadow:var(--shadow-xs);}
  .cx-btn--primary:hover{background:var(--brand-primary-hover);}
  .cx-btn--primary:active{background:var(--brand-primary-active);}
  /* accent */
  .cx-btn--accent{background:var(--brand-accent);color:var(--text-on-accent);box-shadow:var(--shadow-xs);}
  .cx-btn--accent:hover{background:var(--brand-accent-hover);}
  .cx-btn--accent:focus-visible{box-shadow:var(--shadow-focus-accent);}
  /* secondary */
  .cx-btn--secondary{background:var(--surface-card);color:var(--gray-800);border-color:var(--border-default);box-shadow:var(--shadow-xs);}
  .cx-btn--secondary:hover{background:var(--gray-50);border-color:var(--border-strong);}
  /* tertiary */
  .cx-btn--tertiary{background:transparent;color:var(--gray-700);}
  .cx-btn--tertiary:hover{background:var(--gray-100);}
  /* link */
  .cx-btn--link{background:transparent;color:var(--text-brand);height:auto;padding:0;}
  .cx-btn--link:hover{color:var(--brand-primary-hover);text-decoration:underline;text-underline-offset:3px;}
  .cx-btn--link:active{transform:none;}
  /* destructive */
  .cx-btn--destructive{background:var(--error-500);color:#fff;box-shadow:var(--shadow-xs);}
  .cx-btn--destructive:hover{background:var(--error-600);}
  .cx-btn--destructive:focus-visible{box-shadow:var(--shadow-focus-error);}
  .cx-btn__spin{animation:cx-spin .7s linear infinite;}
  @keyframes cx-spin{to{transform:rotate(360deg);}}
  `;
  document.head.appendChild(s);
}
const CX_BTN_ICON_SIZE = {
  sm: 16,
  md: 18,
  lg: 20,
  xl: 20
};
function renderIcon(icon, size, key) {
  if (!icon) return null;
  if (typeof icon === "string") return React.createElement(__ds_scope.Icon, {
    key,
    name: icon,
    size
  });
  return React.createElement(React.Fragment, {
    key
  }, icon);
}

/**
 * Button — primary action control for Chiya Estate.
 */
function Button({
  children,
  hierarchy = "primary",
  size = "md",
  iconLeading,
  iconTrailing,
  iconOnly,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  href,
  className = "",
  ...rest
}) {
  const iSize = CX_BTN_ICON_SIZE[size] || 18;
  const cls = ["cx-btn", `cx-btn--${hierarchy}`, `cx-btn--${size}`, iconOnly ? "cx-btn--icon" : "", fullWidth ? "cx-btn--full" : "", className].filter(Boolean).join(" ");
  const content = loading ? [React.createElement(__ds_scope.Icon, {
    key: "s",
    name: "loader-circle",
    size: iSize,
    className: "cx-btn__spin"
  }), iconOnly ? null : React.createElement("span", {
    key: "t"
  }, children)] : iconOnly ? renderIcon(iconOnly, iSize, "i") : [renderIcon(iconLeading, iSize, "l"), children != null ? React.createElement("span", {
    key: "t"
  }, children) : null, renderIcon(iconTrailing, iSize, "r")];
  const Tag = href ? "a" : "button";
  const tagProps = href ? {
    href
  } : {
    type,
    disabled: disabled || loading
  };
  return React.createElement(Tag, {
    className: cls,
    "aria-disabled": disabled || loading || undefined,
    ...tagProps,
    ...rest
  }, content);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/buttons/IconButton.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-iconbtn-css")) {
  const s = document.createElement("style");
  s.id = "cx-iconbtn-css";
  s.textContent = `
  .cx-iconbtn{display:inline-flex;align-items:center;justify-content:center;
    border:1px solid transparent;border-radius:var(--radius-control);cursor:pointer;flex:none;
    transition:background-color .16s ease,color .16s ease,border-color .16s ease,box-shadow .16s ease,transform .06s ease;
    -webkit-tap-highlight-color:transparent;color:var(--gray-600);background:transparent;}
  .cx-iconbtn:focus-visible{outline:none;box-shadow:var(--shadow-focus-brand);}
  .cx-iconbtn:active{transform:translateY(0.5px);}
  .cx-iconbtn[disabled]{cursor:not-allowed;opacity:.45;}
  .cx-iconbtn--sm{width:32px;height:32px;border-radius:var(--radius-sm);}
  .cx-iconbtn--md{width:40px;height:40px;}
  .cx-iconbtn--lg{width:44px;height:44px;}
  .cx-iconbtn--default{background:var(--surface-card);border-color:var(--border-default);color:var(--gray-700);box-shadow:var(--shadow-xs);}
  .cx-iconbtn--default:hover{background:var(--gray-50);border-color:var(--border-strong);}
  .cx-iconbtn--ghost:hover{background:var(--gray-100);color:var(--gray-800);}
  .cx-iconbtn--brand{background:var(--brand-primary);color:#fff;}
  .cx-iconbtn--brand:hover{background:var(--brand-primary-hover);}
  .cx-iconbtn--glass{background:rgba(255,255,255,0.82);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    color:var(--green-800);border-radius:var(--radius-full);box-shadow:var(--shadow-sm);}
  .cx-iconbtn--glass:hover{background:#fff;}
  .cx-iconbtn--glass.cx-iconbtn--active{color:var(--error-500);}
  `;
  document.head.appendChild(s);
}
const CX_IB_SIZE = {
  sm: 16,
  md: 20,
  lg: 20
};

/**
 * IconButton — square, icon-only control. The `glass` variant is tuned for
 * overlaying on property photography (favorite / share).
 */
function IconButton({
  icon,
  label,
  variant = "default",
  size = "md",
  active = false,
  disabled = false,
  className = "",
  ...rest
}) {
  const iSize = CX_IB_SIZE[size] || 20;
  const cls = ["cx-iconbtn", `cx-iconbtn--${variant}`, `cx-iconbtn--${size}`, active ? "cx-iconbtn--active" : "", className].filter(Boolean).join(" ");
  return React.createElement("button", {
    className: cls,
    type: "button",
    "aria-label": label,
    "aria-pressed": active || undefined,
    disabled,
    ...rest
  }, typeof icon === "string" ? React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iSize,
    fill: active && variant === "glass" ? "currentColor" : "none"
  }) : icon);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/AnalyticsCard.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-analytics-css")) {
  const s = document.createElement("style");
  s.id = "cx-analytics-css";
  s.textContent = `
  .cx-analytics{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-card);
    padding:22px;font-family:var(--font-sans);box-shadow:var(--shadow-xs);display:flex;flex-direction:column;gap:20px;}
  .cx-analytics__head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
  .cx-analytics__title{font-family:var(--font-display);font-weight:600;font-size:19px;color:var(--text-primary);}
  .cx-analytics__sub{font-size:13px;color:var(--text-tertiary);margin-top:2px;}
  .cx-analytics__metric{display:flex;align-items:baseline;gap:10px;margin-top:10px;}
  .cx-analytics__big{font-weight:700;font-size:30px;letter-spacing:-0.02em;color:var(--text-primary);font-variant-numeric:tabular-nums;}
  .cx-analytics__delta{display:inline-flex;align-items:center;gap:3px;font-size:13px;font-weight:700;color:var(--success-600);}
  .cx-analytics__period{display:flex;gap:2px;background:var(--gray-100);border-radius:var(--radius-pill);padding:3px;}
  .cx-analytics__period button{border:none;background:transparent;font-family:inherit;font-size:12px;font-weight:600;
    color:var(--text-tertiary);padding:5px 12px;border-radius:var(--radius-pill);cursor:pointer;transition:all .14s;}
  .cx-analytics__period button.is-active{background:var(--surface-card);color:var(--green-800);box-shadow:var(--shadow-sm);}
  .cx-chart{display:flex;align-items:flex-end;gap:10px;height:160px;padding-top:8px;}
  .cx-chart__col{flex:1;display:flex;flex-direction:column;align-items:center;gap:8px;height:100%;justify-content:flex-end;}
  .cx-chart__bars{display:flex;align-items:flex-end;gap:3px;width:100%;height:100%;justify-content:center;}
  .cx-chart__bar{width:46%;max-width:22px;border-radius:4px 4px 0 0;transition:height .4s cubic-bezier(.2,.7,.2,1);}
  .cx-chart__bar--a{background:var(--brand-primary);}
  .cx-chart__bar--b{background:var(--brand-accent);}
  .cx-chart__lbl{font-size:11px;font-weight:600;color:var(--text-tertiary);}
  .cx-chart__col.is-peak .cx-chart__lbl{color:var(--text-primary);}
  .cx-analytics__legend{display:flex;gap:18px;}
  .cx-analytics__leg{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:600;color:var(--text-secondary);}
  .cx-analytics__dot{width:9px;height:9px;border-radius:3px;}
  `;
  document.head.appendChild(s);
}

/**
 * AnalyticsCard — chart card for dashboards. Renders a single- or two-series
 * bar chart from `data` ([{label, a, b}]) with a header metric and legend.
 */
function AnalyticsCard({
  title,
  subtitle,
  metric,
  delta,
  periods = ["7d", "30d", "12m"],
  activePeriod,
  data = [],
  series = ["Views"],
  onPeriod,
  className = "",
  ...rest
}) {
  const max = Math.max(...data.flatMap(d => [d.a || 0, d.b || 0]), 1);
  const peak = data.reduce((mi, d, i, arr) => (d.a || 0) > (arr[mi].a || 0) ? i : mi, 0);
  const two = series.length > 1;
  return React.createElement("div", {
    className: ["cx-analytics", className].filter(Boolean).join(" "),
    ...rest
  }, React.createElement("div", {
    className: "cx-analytics__head"
  }, React.createElement("div", null, React.createElement("div", {
    className: "cx-analytics__title"
  }, title), subtitle && React.createElement("div", {
    className: "cx-analytics__sub"
  }, subtitle), metric != null && React.createElement("div", {
    className: "cx-analytics__metric"
  }, React.createElement("span", {
    className: "cx-analytics__big"
  }, metric), delta != null && React.createElement("span", {
    className: "cx-analytics__delta"
  }, React.createElement(__ds_scope.Icon, {
    name: "trending-up",
    size: 14
  }), delta))), periods && React.createElement("div", {
    className: "cx-analytics__period"
  }, periods.map(p => React.createElement("button", {
    key: p,
    className: (activePeriod || periods[0]) === p ? "is-active" : "",
    onClick: onPeriod ? () => onPeriod(p) : undefined
  }, p)))), React.createElement("div", {
    className: "cx-chart"
  }, data.map((d, i) => React.createElement("div", {
    key: i,
    className: "cx-chart__col" + (i === peak ? " is-peak" : "")
  }, React.createElement("div", {
    className: "cx-chart__bars"
  }, React.createElement("div", {
    className: "cx-chart__bar cx-chart__bar--a",
    style: {
      height: (d.a || 0) / max * 100 + "%"
    }
  }), two && React.createElement("div", {
    className: "cx-chart__bar cx-chart__bar--b",
    style: {
      height: (d.b || 0) / max * 100 + "%"
    }
  })), React.createElement("div", {
    className: "cx-chart__lbl"
  }, d.label)))), React.createElement("div", {
    className: "cx-analytics__legend"
  }, series.map((s, i) => React.createElement("div", {
    key: i,
    className: "cx-analytics__leg"
  }, React.createElement("span", {
    className: "cx-analytics__dot",
    style: {
      background: i === 0 ? "var(--brand-primary)" : "var(--brand-accent)"
    }
  }), s))));
}
Object.assign(__ds_scope, { AnalyticsCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/AnalyticsCard.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/StatCard.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-stat-css")) {
  const s = document.createElement("style");
  s.id = "cx-stat-css";
  s.textContent = `
  .cx-stat{display:flex;flex-direction:column;gap:14px;background:var(--surface-card);border:1px solid var(--border-subtle);
    border-radius:var(--radius-card);padding:20px;font-family:var(--font-sans);box-shadow:var(--shadow-xs);}
  .cx-stat__top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
  .cx-stat__label{font-size:13px;font-weight:600;color:var(--text-tertiary);}
  .cx-stat__icon{display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:var(--radius-md);flex:none;}
  .cx-stat__icon--brand{background:var(--brand-subtle);color:var(--green-700);}
  .cx-stat__icon--gold{background:var(--brand-accent-subtle);color:var(--gold-700);}
  .cx-stat__icon--info{background:var(--info-50);color:var(--info-600);}
  .cx-stat__icon--success{background:var(--success-50);color:var(--success-600);}
  .cx-stat__value{font-weight:700;font-size:32px;line-height:1;letter-spacing:-0.02em;color:var(--text-primary);font-variant-numeric:tabular-nums;}
  .cx-stat__foot{display:flex;align-items:center;gap:8px;font-size:13px;}
  .cx-stat__delta{display:inline-flex;align-items:center;gap:3px;font-weight:700;font-variant-numeric:tabular-nums;}
  .cx-stat__delta--up{color:var(--success-600);}
  .cx-stat__delta--down{color:var(--error-600);}
  .cx-stat__sub{color:var(--text-tertiary);}
  .cx-spark{display:flex;align-items:flex-end;gap:3px;height:36px;}
  .cx-spark__bar{flex:1;border-radius:2px;background:var(--green-100);min-height:3px;transition:background-color .2s;}
  .cx-spark__bar--peak{background:var(--brand-accent);}
  `;
  document.head.appendChild(s);
}

/** Sparkline — tiny bar chart for stat cards. `data` is an array of numbers. */
function Sparkline({
  data = [],
  peakLast = true
}) {
  const max = Math.max(...data, 1);
  return React.createElement("div", {
    className: "cx-spark"
  }, data.map((v, i) => React.createElement("div", {
    key: i,
    className: "cx-spark__bar" + (peakLast && i === data.length - 1 ? " cx-spark__bar--peak" : ""),
    style: {
      height: Math.max(8, v / max * 100) + "%"
    }
  })));
}

/**
 * StatCard — KPI tile for dashboards: label, big value, trend delta, an
 * icon chip, and an optional sparkline.
 */
function StatCard({
  label,
  value,
  delta,
  deltaDir,
  sub,
  icon,
  tone = "brand",
  spark,
  className = "",
  ...rest
}) {
  return React.createElement("div", {
    className: ["cx-stat", className].filter(Boolean).join(" "),
    ...rest
  }, React.createElement("div", {
    className: "cx-stat__top"
  }, React.createElement("span", {
    className: "cx-stat__label"
  }, label), icon && React.createElement("span", {
    className: `cx-stat__icon cx-stat__icon--${tone}`
  }, React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 20
  }))), React.createElement("div", {
    className: "cx-stat__value"
  }, value), spark && React.createElement(Sparkline, {
    data: spark
  }), (delta != null || sub) && React.createElement("div", {
    className: "cx-stat__foot"
  }, delta != null && React.createElement("span", {
    className: "cx-stat__delta cx-stat__delta--" + (deltaDir || "up")
  }, React.createElement(__ds_scope.Icon, {
    name: deltaDir === "down" ? "trending-down" : "trending-up",
    size: 15
  }), delta), sub && React.createElement("span", {
    className: "cx-stat__sub"
  }, sub)));
}
Object.assign(__ds_scope, { Sparkline, StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/data/Table.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-table-css")) {
  const s = document.createElement("style");
  s.id = "cx-table-css";
  s.textContent = `
  .cx-tablewrap{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);
    overflow:hidden;font-family:var(--font-sans);}
  .cx-table{width:100%;border-collapse:collapse;}
  .cx-table th{text-align:left;font-size:12px;font-weight:600;color:var(--text-tertiary);text-transform:uppercase;
    letter-spacing:0.04em;padding:12px 16px;background:var(--gray-50);border-bottom:1px solid var(--border-subtle);white-space:nowrap;}
  .cx-table th.cx-th--sort{cursor:pointer;user-select:none;}
  .cx-table th.cx-th--sort:hover{color:var(--text-secondary);}
  .cx-th__inner{display:inline-flex;align-items:center;gap:5px;}
  .cx-table td{padding:14px 16px;font-size:14px;color:var(--text-secondary);border-bottom:1px solid var(--border-subtle);vertical-align:middle;}
  .cx-table tr:last-child td{border-bottom:none;}
  .cx-table tbody tr{transition:background-color .12s ease;}
  .cx-table--hover tbody tr:hover{background:var(--gray-25);}
  .cx-table td.cx-td--num{font-variant-numeric:tabular-nums;text-align:right;color:var(--text-primary);font-weight:600;}
  .cx-table th.cx-th--num{text-align:right;}
  .cx-table__primary{color:var(--text-primary);font-weight:600;}
  .cx-table__cellflex{display:flex;align-items:center;gap:10px;}
  .cx-table__sub{font-size:12px;color:var(--text-tertiary);font-weight:400;margin-top:1px;}
  `;
  document.head.appendChild(s);
}

/**
 * Table — data table for dashboards and admin views. `columns` are
 * [{key,header,align,sortable,render}]; `rows` are arbitrary objects.
 */
function Table({
  columns = [],
  rows = [],
  hover = true,
  sortKey,
  sortDir = "asc",
  onSort,
  rowKey,
  className = ""
}) {
  return React.createElement("div", {
    className: ["cx-tablewrap", className].filter(Boolean).join(" ")
  }, React.createElement("table", {
    className: "cx-table" + (hover ? " cx-table--hover" : "")
  }, React.createElement("thead", null, React.createElement("tr", null, columns.map(c => {
    const isNum = c.align === "right" || c.numeric;
    const active = sortKey === c.key;
    return React.createElement("th", {
      key: c.key,
      className: [isNum ? "cx-th--num" : "", c.sortable ? "cx-th--sort" : ""].filter(Boolean).join(" "),
      onClick: c.sortable && onSort ? () => onSort(c.key) : undefined
    }, React.createElement("span", {
      className: "cx-th__inner"
    }, c.header, c.sortable && React.createElement(__ds_scope.Icon, {
      name: active ? sortDir === "asc" ? "arrow-up" : "arrow-down" : "chevrons-up-down",
      size: 13,
      style: {
        opacity: active ? 1 : 0.5
      }
    })));
  }))), React.createElement("tbody", null, rows.map((r, ri) => React.createElement("tr", {
    key: rowKey ? r[rowKey] : ri
  }, columns.map(c => {
    const isNum = c.align === "right" || c.numeric;
    return React.createElement("td", {
      key: c.key,
      className: isNum ? "cx-td--num" : ""
    }, c.render ? c.render(r[c.key], r) : r[c.key]);
  }))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Table.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Avatar.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-avatar-css")) {
  const s = document.createElement("style");
  s.id = "cx-avatar-css";
  s.textContent = `
  .cx-avatar{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;
    font-family:var(--font-sans);font-weight:600;color:var(--green-800);background:var(--green-50);
    border-radius:var(--radius-full);overflow:hidden;background-clip:padding-box;}
  .cx-avatar--ring{box-shadow:0 0 0 2px var(--surface-card),0 0 0 3px var(--border-subtle);}
  .cx-avatar--gold{box-shadow:0 0 0 2px var(--surface-card),0 0 0 3.5px var(--brand-accent);}
  .cx-avatar img{width:100%;height:100%;object-fit:cover;display:block;}
  .cx-avatar--xs{width:24px;height:24px;font-size:10px;}
  .cx-avatar--sm{width:32px;height:32px;font-size:12px;}
  .cx-avatar--md{width:40px;height:40px;font-size:14px;}
  .cx-avatar--lg{width:48px;height:48px;font-size:16px;}
  .cx-avatar--xl{width:64px;height:64px;font-size:20px;}
  .cx-avatar__badge{position:absolute;right:-1px;bottom:-1px;display:flex;align-items:center;justify-content:center;
    border-radius:50%;background:var(--success-500);color:#fff;border:2px solid var(--surface-card);}
  .cx-avatar__badge--verified{background:var(--brand-accent);color:var(--green-900);}
  .cx-avatargroup{display:inline-flex;align-items:center;}
  .cx-avatargroup > *{margin-left:-10px;box-shadow:0 0 0 2px var(--surface-card);border-radius:var(--radius-full);}
  .cx-avatargroup > *:first-child{margin-left:0;}
  .cx-avatargroup__more{display:inline-flex;align-items:center;justify-content:center;background:var(--gray-100);
    color:var(--gray-600);font-family:var(--font-sans);font-weight:600;border-radius:var(--radius-full);}
  `;
  document.head.appendChild(s);
}
const CX_AV_PX = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64
};
function initials(name) {
  if (!name) return "";
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase();
}

/**
 * Avatar — agent / user portrait with initials fallback and an optional
 * status or verified badge.
 */
function Avatar({
  src,
  name,
  size = "md",
  ring,
  status,
  verified,
  className = "",
  ...rest
}) {
  const cls = ["cx-avatar", `cx-avatar--${size}`, verified ? "cx-avatar--gold" : ring ? "cx-avatar--ring" : "", className].filter(Boolean).join(" ");
  const bSize = size === "xl" || size === "lg" ? 18 : 14;
  return React.createElement("span", {
    className: cls,
    ...rest
  }, src ? React.createElement("img", {
    src,
    alt: name || ""
  }) : initials(name), (status || verified) && React.createElement("span", {
    className: "cx-avatar__badge" + (verified ? " cx-avatar__badge--verified" : ""),
    style: {
      width: bSize,
      height: bSize
    }
  }, verified && React.createElement(__ds_scope.Icon, {
    name: "check",
    size: bSize - 7,
    strokeWidth: 3.5
  })));
}

/** AvatarGroup — overlapping stack with a +N overflow chip. */
function AvatarGroup({
  avatars = [],
  max = 4,
  size = "sm"
}) {
  const shown = avatars.slice(0, max);
  const extra = avatars.length - shown.length;
  const px = CX_AV_PX[size] || 32;
  return React.createElement("span", {
    className: "cx-avatargroup"
  }, shown.map((a, i) => React.createElement(Avatar, {
    key: i,
    size,
    ...a
  })), extra > 0 && React.createElement("span", {
    className: "cx-avatargroup__more",
    style: {
      width: px,
      height: px,
      fontSize: px * 0.36
    }
  }, "+" + extra));
}
Object.assign(__ds_scope, { Avatar, AvatarGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-badge-css")) {
  const s = document.createElement("style");
  s.id = "cx-badge-css";
  s.textContent = `
  .cx-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-sans);font-weight:600;
    white-space:nowrap;border:1px solid transparent;line-height:1;}
  .cx-badge--sm{font-size:11px;padding:3px 8px;border-radius:var(--radius-sm);letter-spacing:.01em;}
  .cx-badge--md{font-size:12px;padding:4px 10px;border-radius:var(--radius-pill);}
  .cx-badge--lg{font-size:13px;padding:6px 12px;border-radius:var(--radius-pill);}
  .cx-badge__dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none;}
  .cx-badge--neutral{background:var(--gray-100);color:var(--gray-700);border-color:var(--gray-200);}
  .cx-badge--brand{background:var(--brand-subtle);color:var(--green-700);border-color:var(--green-100);}
  .cx-badge--accent{background:var(--brand-accent-subtle);color:var(--gold-700);border-color:var(--gold-100);}
  .cx-badge--success{background:var(--success-50);color:var(--success-700);border-color:var(--success-100);}
  .cx-badge--warning{background:var(--warning-50);color:var(--warning-700);border-color:var(--warning-100);}
  .cx-badge--error{background:var(--error-50);color:var(--error-700);border-color:var(--error-100);}
  .cx-badge--info{background:var(--info-50);color:var(--info-700);border-color:var(--info-100);}
  .cx-badge--solid{background:var(--brand-primary);color:#fff;border-color:transparent;}
  .cx-badge--gold{background:var(--brand-accent);color:var(--green-900);border-color:transparent;}
  /* Tag: removable filter chip */
  .cx-tag{display:inline-flex;align-items:center;gap:6px;font-family:var(--font-sans);font-size:13px;font-weight:500;
    color:var(--gray-700);background:var(--surface-card);border:1px solid var(--border-default);
    border-radius:var(--radius-pill);padding:5px 6px 5px 12px;line-height:1;}
  .cx-tag__x{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;
    color:var(--text-tertiary);cursor:pointer;border:none;background:transparent;transition:background-color .14s,color .14s;}
  .cx-tag__x:hover{background:var(--gray-100);color:var(--gray-700);}
  `;
  document.head.appendChild(s);
}

/**
 * Badge — compact status / category label. Listing states ("Verified",
 * "New", "For Rent") and metrics deltas.
 */
function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
  icon,
  className = "",
  ...rest
}) {
  const cls = ["cx-badge", `cx-badge--${variant}`, `cx-badge--${size}`, className].filter(Boolean).join(" ");
  return React.createElement("span", {
    className: cls,
    ...rest
  }, dot && React.createElement("span", {
    className: "cx-badge__dot"
  }), icon && React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === "lg" ? 14 : 12
  }), children);
}

/** Tag — removable filter chip used in the search filter bar. */
function Tag({
  children,
  onRemove,
  className = "",
  ...rest
}) {
  return React.createElement("span", {
    className: ["cx-tag", className].filter(Boolean).join(" "),
    ...rest
  }, children, onRemove && React.createElement("button", {
    type: "button",
    className: "cx-tag__x",
    "aria-label": "Remove",
    onClick: onRemove
  }, React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 13,
    strokeWidth: 2.5
  })));
}
Object.assign(__ds_scope, { Badge, Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/ApprovalCard.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-approval-css")) {
  const s = document.createElement("style");
  s.id = "cx-approval-css";
  s.textContent = `
  .cx-approval{display:flex;align-items:center;gap:16px;background:var(--surface-card);border:1px solid var(--border-subtle);
    border-radius:var(--radius-card);padding:14px 16px;font-family:var(--font-sans);transition:box-shadow .18s,border-color .18s;}
  .cx-approval:hover{box-shadow:var(--shadow-sm);border-color:var(--border-default);}
  .cx-approval__thumb{width:72px;height:60px;border-radius:var(--radius-md);object-fit:cover;flex:none;background:var(--gray-100);}
  .cx-approval__main{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;}
  .cx-approval__titlerow{display:flex;align-items:center;gap:9px;}
  .cx-approval__title{font-weight:600;font-size:15px;color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cx-approval__price{font-size:14px;font-weight:700;color:var(--brand-primary);font-variant-numeric:tabular-nums;}
  .cx-approval__meta{display:flex;align-items:center;gap:14px;font-size:12px;color:var(--text-tertiary);flex-wrap:wrap;}
  .cx-approval__sub{display:flex;align-items:center;gap:6px;}
  .cx-approval__sub b{font-weight:600;color:var(--text-secondary);}
  .cx-approval__actions{display:flex;align-items:center;gap:8px;flex:none;}
  .cx-approval__btn{display:inline-flex;align-items:center;gap:6px;height:38px;padding:0 14px;border-radius:var(--radius-control);
    font-size:13px;font-weight:600;cursor:pointer;border:1px solid transparent;transition:background-color .14s,border-color .14s,color .14s;}
  .cx-approval__btn--approve{background:var(--brand-primary);color:#fff;}
  .cx-approval__btn--approve:hover{background:var(--brand-primary-hover);}
  .cx-approval__btn--reject{background:var(--surface-card);color:var(--error-600);border-color:var(--error-100);}
  .cx-approval__btn--reject:hover{background:var(--error-50);border-color:var(--error-500);}
  .cx-approval__btn--ghost{background:var(--surface-card);color:var(--gray-600);border-color:var(--border-default);}
  .cx-approval__btn--ghost:hover{background:var(--gray-50);}
  `;
  document.head.appendChild(s);
}
const APPR_STATUS = {
  pending: {
    variant: "warning",
    label: "Pending review"
  },
  approved: {
    variant: "success",
    label: "Approved"
  },
  rejected: {
    variant: "error",
    label: "Rejected"
  },
  changes: {
    variant: "info",
    label: "Changes requested"
  }
};

/**
 * ApprovalCard — a listing-moderation queue row: property summary, the
 * submitting agent, submission meta, status, and approve/reject actions.
 */
function ApprovalCard({
  image,
  title,
  price,
  agent,
  submitted,
  location,
  status = "pending",
  onApprove,
  onReject,
  onView,
  className = "",
  ...rest
}) {
  const st = APPR_STATUS[status] || APPR_STATUS.pending;
  const decided = status === "approved" || status === "rejected";
  return React.createElement("div", {
    className: ["cx-approval", className].filter(Boolean).join(" "),
    ...rest
  }, React.createElement("img", {
    className: "cx-approval__thumb",
    src: image,
    alt: ""
  }), React.createElement("div", {
    className: "cx-approval__main"
  }, React.createElement("div", {
    className: "cx-approval__titlerow"
  }, React.createElement("span", {
    className: "cx-approval__title"
  }, title), price && React.createElement("span", {
    className: "cx-approval__price"
  }, price), React.createElement(__ds_scope.Badge, {
    variant: st.variant,
    size: "sm",
    dot: true
  }, st.label)), React.createElement("div", {
    className: "cx-approval__meta"
  }, agent && React.createElement("span", {
    className: "cx-approval__sub"
  }, React.createElement(__ds_scope.Avatar, {
    src: agent.avatar,
    name: agent.name,
    size: "xs",
    verified: agent.verified
  }), React.createElement("b", null, agent.name)), location && React.createElement("span", {
    className: "cx-approval__sub"
  }, React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 13
  }), location), submitted && React.createElement("span", {
    className: "cx-approval__sub"
  }, React.createElement(__ds_scope.Icon, {
    name: "clock",
    size: 13
  }), submitted))), React.createElement("div", {
    className: "cx-approval__actions"
  }, React.createElement("button", {
    className: "cx-approval__btn cx-approval__btn--ghost",
    onClick: onView
  }, React.createElement(__ds_scope.Icon, {
    name: "eye",
    size: 15
  }), "Review"), !decided && React.createElement("button", {
    className: "cx-approval__btn cx-approval__btn--reject",
    onClick: onReject
  }, React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 15
  }), "Reject"), !decided && React.createElement("button", {
    className: "cx-approval__btn cx-approval__btn--approve",
    onClick: onApprove
  }, React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 15
  }), "Approve")));
}
Object.assign(__ds_scope, { ApprovalCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/ApprovalCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-modal-css")) {
  const s = document.createElement("style");
  s.id = "cx-modal-css";
  s.textContent = `
  .cx-overlay{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;
    background:var(--surface-overlay);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
    animation:cx-fade .18s ease;}
  @keyframes cx-fade{from{opacity:0;}to{opacity:1;}}
  @keyframes cx-rise{from{opacity:0;transform:translateY(8px) scale(.985);}to{opacity:1;transform:none;}}
  .cx-modal{position:relative;width:100%;background:var(--surface-card);border-radius:var(--radius-modal);
    box-shadow:var(--shadow-2xl);animation:cx-rise .22s cubic-bezier(.2,.7,.2,1);display:flex;flex-direction:column;
    max-height:calc(100vh - 48px);overflow:hidden;}
  .cx-modal--sm{max-width:400px;}
  .cx-modal--md{max-width:512px;}
  .cx-modal--lg{max-width:680px;}
  .cx-modal--xl{max-width:880px;}
  .cx-modal__head{display:flex;align-items:flex-start;gap:16px;padding:24px 24px 0;}
  .cx-modal__headicon{flex:none;display:flex;align-items:center;justify-content:center;width:44px;height:44px;
    border-radius:var(--radius-lg);background:var(--brand-subtle);color:var(--green-700);}
  .cx-modal__titles{flex:1;display:flex;flex-direction:column;gap:4px;}
  .cx-modal__title{font-family:var(--font-display);font-weight:600;font-size:22px;line-height:28px;color:var(--text-primary);}
  .cx-modal__sub{font-family:var(--font-sans);font-size:14px;line-height:20px;color:var(--text-tertiary);}
  .cx-modal__close{flex:none;display:flex;align-items:center;justify-content:center;width:36px;height:36px;border:none;
    background:transparent;color:var(--text-tertiary);border-radius:var(--radius-sm);cursor:pointer;transition:background-color .14s,color .14s;}
  .cx-modal__close:hover{background:var(--gray-100);color:var(--gray-700);}
  .cx-modal__body{padding:18px 24px;overflow:auto;font-family:var(--font-sans);font-size:15px;line-height:22px;color:var(--text-secondary);}
  .cx-modal__foot{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:16px 24px 24px;
    border-top:1px solid var(--border-subtle);margin-top:auto;}
  .cx-modal__foot--spread{justify-content:space-between;}
  `;
  document.head.appendChild(s);
}

/**
 * Modal — centered dialog with overlay, optional header icon, and a footer
 * slot for actions. Controlled via `open` + `onClose`.
 */
function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  children,
  footer,
  footerSpread = false,
  className = ""
}) {
  if (!open) return null;
  return React.createElement("div", {
    className: "cx-overlay",
    onClick: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, React.createElement("div", {
    className: ["cx-modal", `cx-modal--${size}`, className].filter(Boolean).join(" "),
    role: "dialog",
    "aria-modal": "true"
  }, (title || icon) && React.createElement("div", {
    className: "cx-modal__head"
  }, icon && React.createElement("div", {
    className: "cx-modal__headicon"
  }, React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 22
  })), React.createElement("div", {
    className: "cx-modal__titles"
  }, title && React.createElement("div", {
    className: "cx-modal__title"
  }, title), subtitle && React.createElement("div", {
    className: "cx-modal__sub"
  }, subtitle)), onClose && React.createElement("button", {
    type: "button",
    className: "cx-modal__close",
    "aria-label": "Close",
    onClick: onClose
  }, React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 20
  }))), React.createElement("div", {
    className: "cx-modal__body"
  }, children), footer && React.createElement("div", {
    className: "cx-modal__foot" + (footerSpread ? " cx-modal__foot--spread" : "")
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-choice-css")) {
  const s = document.createElement("style");
  s.id = "cx-choice-css";
  s.textContent = `
  .cx-choice{display:inline-flex;align-items:flex-start;gap:10px;font-family:var(--font-sans);cursor:pointer;user-select:none;}
  .cx-choice--disabled{cursor:not-allowed;opacity:.55;}
  .cx-choice__box{position:relative;flex:none;display:flex;align-items:center;justify-content:center;
    width:20px;height:20px;background:var(--surface-card);border:1.5px solid var(--border-strong);
    transition:background-color .14s ease,border-color .14s ease,box-shadow .14s ease;color:#fff;}
  .cx-choice__box--check{border-radius:6px;}
  .cx-choice__box--radio{border-radius:var(--radius-full);}
  .cx-choice input{position:absolute;opacity:0;width:0;height:0;margin:0;}
  .cx-choice input:focus-visible + .cx-choice__box{box-shadow:var(--shadow-focus-brand);border-color:var(--border-focus);}
  .cx-choice input:checked + .cx-choice__box--check{background:var(--brand-primary);border-color:var(--brand-primary);}
  .cx-choice input:checked + .cx-choice__box--radio{border-color:var(--brand-primary);border-width:6px;}
  .cx-choice__tick{opacity:0;transition:opacity .12s ease;}
  .cx-choice input:checked + .cx-choice__box .cx-choice__tick{opacity:1;}
  .cx-choice__text{display:flex;flex-direction:column;gap:2px;padding-top:1px;}
  .cx-choice__label{font-size:15px;font-weight:500;color:var(--text-primary);line-height:20px;}
  .cx-choice__desc{font-size:13px;color:var(--text-tertiary);line-height:18px;}
  /* Switch */
  .cx-switch{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-sans);cursor:pointer;user-select:none;}
  .cx-switch--disabled{cursor:not-allowed;opacity:.55;}
  .cx-switch__track{position:relative;flex:none;width:42px;height:24px;border-radius:var(--radius-full);
    background:var(--gray-300);transition:background-color .18s ease,box-shadow .18s ease;}
  .cx-switch__thumb{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:var(--radius-full);
    background:#fff;box-shadow:var(--shadow-sm);transition:transform .18s cubic-bezier(.4,0,.2,1);}
  .cx-switch input{position:absolute;opacity:0;width:0;height:0;margin:0;}
  .cx-switch input:checked + .cx-switch__track{background:var(--brand-primary);}
  .cx-switch input:checked + .cx-switch__track .cx-switch__thumb{transform:translateX(18px);}
  .cx-switch input:focus-visible + .cx-switch__track{box-shadow:var(--shadow-focus-brand);}
  `;
  document.head.appendChild(s);
}
function ChoiceBase({
  kind,
  label,
  description,
  disabled,
  className = "",
  id,
  ...rest
}) {
  return React.createElement("label", {
    className: ["cx-choice", disabled ? "cx-choice--disabled" : "", className].filter(Boolean).join(" "),
    htmlFor: id
  }, React.createElement("input", {
    id,
    type: kind === "radio" ? "radio" : "checkbox",
    disabled,
    ...rest
  }), React.createElement("span", {
    className: `cx-choice__box cx-choice__box--${kind === "radio" ? "radio" : "check"}`
  }, kind !== "radio" && React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 14,
    strokeWidth: 3,
    className: "cx-choice__tick"
  })), (label || description) && React.createElement("span", {
    className: "cx-choice__text"
  }, label && React.createElement("span", {
    className: "cx-choice__label"
  }, label), description && React.createElement("span", {
    className: "cx-choice__desc"
  }, description)));
}

/** Checkbox — square check control with optional label + description. */
function Checkbox(props) {
  return React.createElement(ChoiceBase, {
    kind: "check",
    ...props
  });
}

/** Radio — circular single-choice control. Group via shared `name`. */
function Radio(props) {
  return React.createElement(ChoiceBase, {
    kind: "radio",
    ...props
  });
}

/** Switch — on/off toggle for settings and filters. */
function Switch({
  label,
  disabled,
  className = "",
  id,
  ...rest
}) {
  return React.createElement("label", {
    className: ["cx-switch", disabled ? "cx-switch--disabled" : "", className].filter(Boolean).join(" "),
    htmlFor: id
  }, React.createElement("input", {
    id,
    type: "checkbox",
    role: "switch",
    disabled,
    ...rest
  }), React.createElement("span", {
    className: "cx-switch__track"
  }, React.createElement("span", {
    className: "cx-switch__thumb"
  })), label && React.createElement("span", {
    className: "cx-choice__label"
  }, label));
}
Object.assign(__ds_scope, { Checkbox, Radio, Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-field-css")) {
  const s = document.createElement("style");
  s.id = "cx-field-css";
  s.textContent = `
  .cx-field{display:flex;flex-direction:column;gap:6px;font-family:var(--font-sans);}
  .cx-field__label{font-size:14px;font-weight:600;color:var(--text-primary);letter-spacing:-0.005em;}
  .cx-field__req{color:var(--brand-accent);margin-left:2px;}
  .cx-field__hint{font-size:13px;line-height:18px;color:var(--text-tertiary);}
  .cx-field__hint--error{color:var(--text-error);}
  .cx-inputwrap{position:relative;display:flex;align-items:center;}
  .cx-input{width:100%;font-family:var(--font-sans);color:var(--text-primary);background:var(--surface-card);
    border:1px solid var(--border-default);border-radius:var(--radius-control);
    transition:border-color .15s ease,box-shadow .15s ease;outline:none;appearance:none;}
  .cx-input::placeholder{color:var(--text-placeholder);}
  .cx-input:hover{border-color:var(--border-strong);}
  .cx-input:focus{border-color:var(--border-focus);box-shadow:var(--shadow-focus-brand);}
  .cx-input--sm{height:36px;font-size:14px;padding:0 12px;}
  .cx-input--md{height:42px;font-size:15px;padding:0 14px;}
  .cx-input--lg{height:48px;font-size:16px;padding:0 16px;}
  .cx-input--haslead.cx-input--sm{padding-left:36px;}
  .cx-input--haslead.cx-input--md{padding-left:42px;}
  .cx-input--haslead.cx-input--lg{padding-left:46px;}
  .cx-input--hastrail{padding-right:42px;}
  .cx-input--error{border-color:var(--error-500);}
  .cx-input--error:focus{box-shadow:var(--shadow-focus-error);}
  .cx-input:disabled{background:var(--gray-50);color:var(--text-disabled);cursor:not-allowed;}
  .cx-input__icon{position:absolute;color:var(--text-tertiary);pointer-events:none;display:flex;}
  .cx-input__icon--lead{left:13px;}
  .cx-input__icon--trail{right:13px;}
  .cx-textarea{min-height:96px;padding:10px 14px;line-height:22px;resize:vertical;}
  `;
  document.head.appendChild(s);
}
function Field({
  label,
  required,
  hint,
  error,
  htmlFor,
  children
}) {
  return React.createElement("div", {
    className: "cx-field"
  }, label && React.createElement("label", {
    className: "cx-field__label",
    htmlFor
  }, label, required && React.createElement("span", {
    className: "cx-field__req"
  }, "*")), children, (error || hint) && React.createElement("span", {
    className: "cx-field__hint" + (error ? " cx-field__hint--error" : "")
  }, error || hint));
}

/**
 * Input — text field with optional label, hint/error, and leading/trailing icons.
 */
function Input({
  label,
  hint,
  error,
  required,
  size = "md",
  iconLeading,
  iconTrailing,
  id,
  className = "",
  ...rest
}) {
  const cls = ["cx-input", `cx-input--${size}`, iconLeading ? "cx-input--haslead" : "", iconTrailing ? "cx-input--hastrail" : "", error ? "cx-input--error" : ""].filter(Boolean).join(" ");
  const field = React.createElement("div", {
    className: "cx-inputwrap"
  }, iconLeading && React.createElement("span", {
    className: "cx-input__icon cx-input__icon--lead"
  }, React.createElement(__ds_scope.Icon, {
    name: iconLeading,
    size: size === "sm" ? 16 : 18
  })), React.createElement("input", {
    id,
    className: cls,
    ...rest
  }), iconTrailing && React.createElement("span", {
    className: "cx-input__icon cx-input__icon--trail"
  }, React.createElement(__ds_scope.Icon, {
    name: iconTrailing,
    size: size === "sm" ? 16 : 18
  })));
  if (!label && !hint && !error) return field;
  return React.createElement(Field, {
    label,
    required,
    hint,
    error,
    htmlFor: id
  }, field);
}

/**
 * Textarea — multi-line text field with the same label/hint/error contract.
 */
function Textarea({
  label,
  hint,
  error,
  required,
  id,
  className = "",
  ...rest
}) {
  const cls = ["cx-input", "cx-textarea", error ? "cx-input--error" : "", className].filter(Boolean).join(" ");
  const field = React.createElement("textarea", {
    id,
    className: cls,
    ...rest
  });
  if (!label && !hint && !error) return field;
  return React.createElement(Field, {
    label,
    required,
    hint,
    error,
    htmlFor: id
  }, field);
}
Object.assign(__ds_scope, { Input, Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-select-css")) {
  const s = document.createElement("style");
  s.id = "cx-select-css";
  s.textContent = `
  .cx-selectwrap{position:relative;display:flex;align-items:center;}
  .cx-select{width:100%;font-family:var(--font-sans);color:var(--text-primary);background:var(--surface-card);
    border:1px solid var(--border-default);border-radius:var(--radius-control);appearance:none;outline:none;cursor:pointer;
    transition:border-color .15s ease,box-shadow .15s ease;}
  .cx-select:hover{border-color:var(--border-strong);}
  .cx-select:focus{border-color:var(--border-focus);box-shadow:var(--shadow-focus-brand);}
  .cx-select--sm{height:36px;font-size:14px;padding:0 36px 0 12px;}
  .cx-select--md{height:42px;font-size:15px;padding:0 40px 0 14px;}
  .cx-select--lg{height:48px;font-size:16px;padding:0 42px 0 16px;}
  .cx-select--placeholder{color:var(--text-placeholder);}
  .cx-select--error{border-color:var(--error-500);}
  .cx-select:disabled{background:var(--gray-50);color:var(--text-disabled);cursor:not-allowed;}
  .cx-select__chev{position:absolute;right:13px;color:var(--text-tertiary);pointer-events:none;display:flex;}
  `;
  document.head.appendChild(s);
}

/**
 * Select — native select styled to match Input, with a chevron affordance.
 * Pass `options` as [{value,label}] or use children <option>s.
 */
function Select({
  label,
  hint,
  error,
  required,
  size = "md",
  placeholder,
  options,
  value,
  defaultValue,
  id,
  className = "",
  children,
  ...rest
}) {
  const isPlaceholder = (value ?? defaultValue ?? "") === "" && placeholder;
  const cls = ["cx-select", `cx-select--${size}`, isPlaceholder ? "cx-select--placeholder" : "", error ? "cx-select--error" : "", className].filter(Boolean).join(" ");
  const opts = [placeholder ? React.createElement("option", {
    key: "_ph",
    value: "",
    disabled: true
  }, placeholder) : null, ...(options || []).map(o => React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)), children];
  const control = React.createElement("div", {
    className: "cx-selectwrap"
  }, React.createElement("select", {
    id,
    className: cls,
    value,
    defaultValue: value == null ? defaultValue : undefined,
    ...rest
  }, opts), React.createElement("span", {
    className: "cx-select__chev"
  }, React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 18
  })));
  if (!label && !hint && !error) return control;
  return React.createElement("div", {
    className: "cx-field"
  }, label && React.createElement("label", {
    className: "cx-field__label",
    htmlFor: id
  }, label, required && React.createElement("span", {
    className: "cx-field__req"
  }, "*")), control, (error || hint) && React.createElement("span", {
    className: "cx-field__hint" + (error ? " cx-field__hint--error" : "")
  }, error || hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Navbar.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-navbar-css")) {
  const s = document.createElement("style");
  s.id = "cx-navbar-css";
  s.textContent = `
  .cx-navbar{display:flex;align-items:center;gap:32px;height:72px;padding:0 32px;background:var(--surface-card);
    border-bottom:1px solid var(--border-subtle);font-family:var(--font-sans);}
  .cx-navbar--transparent{background:transparent;border-bottom-color:transparent;}
  .cx-navbar--dark{background:var(--surface-brand-deep);border-bottom-color:rgba(255,255,255,.08);}
  .cx-brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none;flex:none;}
  .cx-brand__mark{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9px;
    background:var(--brand-primary);color:var(--brand-accent);}
  .cx-brand__mark img{width:34px;height:34px;}
  .cx-brand__name{font-family:var(--font-display);font-weight:600;font-size:23px;letter-spacing:-0.01em;color:var(--text-primary);line-height:1;}
  .cx-navbar--dark .cx-brand__name{color:#fff;}
  .cx-brand__tld{color:var(--brand-accent);}
  .cx-navlinks{display:flex;align-items:center;gap:4px;}
  .cx-navlink{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;font-size:15px;font-weight:500;
    color:var(--text-secondary);text-decoration:none;border-radius:var(--radius-sm);transition:color .14s,background-color .14s;}
  .cx-navlink:hover{color:var(--text-primary);background:var(--gray-50);}
  .cx-navlink--active{color:var(--brand-primary);font-weight:600;}
  .cx-navbar--dark .cx-navlink{color:rgba(255,255,255,.72);}
  .cx-navbar--dark .cx-navlink:hover{color:#fff;background:rgba(255,255,255,.08);}
  .cx-navbar--dark .cx-navlink--active{color:var(--brand-accent);}
  .cx-navbar__spacer{flex:1;}
  .cx-navbar__actions{display:flex;align-items:center;gap:12px;flex:none;}
  /* breadcrumb */
  .cx-breadcrumb{display:flex;align-items:center;gap:8px;font-family:var(--font-sans);font-size:14px;flex-wrap:wrap;}
  .cx-breadcrumb a,.cx-breadcrumb span{color:var(--text-tertiary);text-decoration:none;font-weight:500;}
  .cx-breadcrumb a:hover{color:var(--text-secondary);}
  .cx-breadcrumb__sep{color:var(--border-strong);display:flex;}
  .cx-breadcrumb__cur{color:var(--text-primary);font-weight:600;}
  `;
  document.head.appendChild(s);
}

/** Wordmark — the Chiya Estate lockup. Pass `logoSrc` to use the SVG mark. */
function Wordmark({
  logoSrc,
  dark,
  name = "Chiya",
  suffix = "Estate"
}) {
  return React.createElement("a", {
    className: "cx-brand",
    href: "#"
  }, React.createElement("span", {
    className: "cx-brand__mark"
  }, logoSrc ? React.createElement("img", {
    src: logoSrc,
    alt: ""
  }) : React.createElement(__ds_scope.Icon, {
    name: "house",
    size: 19,
    strokeWidth: 2
  })), React.createElement("span", {
    className: "cx-brand__name"
  }, name, React.createElement("span", {
    className: "cx-brand__tld"
  }, " " + suffix)));
}

/**
 * Navbar — global top navigation. Compose links + actions as children, or
 * pass `links` data and `actions` node.
 */
function Navbar({
  links = [],
  actions,
  logoSrc,
  variant = "default",
  className = ""
}) {
  const cls = ["cx-navbar", variant !== "default" ? `cx-navbar--${variant}` : "", className].filter(Boolean).join(" ");
  return React.createElement("nav", {
    className: cls
  }, React.createElement(Wordmark, {
    logoSrc,
    dark: variant === "dark"
  }), React.createElement("div", {
    className: "cx-navlinks"
  }, links.map((l, i) => React.createElement("a", {
    key: i,
    href: l.href || "#",
    className: "cx-navlink" + (l.active ? " cx-navlink--active" : "")
  }, l.label))), React.createElement("div", {
    className: "cx-navbar__spacer"
  }), actions && React.createElement("div", {
    className: "cx-navbar__actions"
  }, actions));
}

/** Breadcrumb — path trail; items are [{label, href}], last is current. */
function Breadcrumb({
  items = []
}) {
  return React.createElement("nav", {
    className: "cx-breadcrumb",
    "aria-label": "Breadcrumb"
  }, items.map((it, i) => {
    const last = i === items.length - 1;
    return React.createElement(React.Fragment, {
      key: i
    }, last ? React.createElement("span", {
      className: "cx-breadcrumb__cur",
      "aria-current": "page"
    }, it.label) : React.createElement("a", {
      href: it.href || "#"
    }, it.label), !last && React.createElement("span", {
      className: "cx-breadcrumb__sep"
    }, React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 15
    })));
  }));
}
Object.assign(__ds_scope, { Wordmark, Navbar, Breadcrumb });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Navbar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-tabs-css")) {
  const s = document.createElement("style");
  s.id = "cx-tabs-css";
  s.textContent = `
  .cx-tabs{display:flex;align-items:center;gap:4px;font-family:var(--font-sans);}
  .cx-tabs--line{gap:24px;border-bottom:1px solid var(--border-subtle);}
  .cx-tab{display:inline-flex;align-items:center;gap:7px;font-size:14px;font-weight:600;color:var(--text-tertiary);
    cursor:pointer;border:none;background:transparent;transition:color .14s ease,background-color .14s ease,box-shadow .14s ease;white-space:nowrap;}
  .cx-tab:hover{color:var(--text-secondary);}
  /* pill variant */
  .cx-tabs--pill{background:var(--gray-100);padding:4px;border-radius:var(--radius-pill);gap:2px;}
  .cx-tabs--pill .cx-tab{padding:7px 16px;border-radius:var(--radius-pill);}
  .cx-tabs--pill .cx-tab--active{color:var(--green-800);background:var(--surface-card);box-shadow:var(--shadow-sm);}
  /* line variant */
  .cx-tabs--line .cx-tab{padding:0 1px 12px;border-bottom:2px solid transparent;margin-bottom:-1px;border-radius:0;}
  .cx-tabs--line .cx-tab--active{color:var(--brand-primary);border-bottom-color:var(--brand-accent);}
  /* segmented variant */
  .cx-tabs--seg{border:1px solid var(--border-default);border-radius:var(--radius-md);padding:0;overflow:hidden;gap:0;}
  .cx-tabs--seg .cx-tab{padding:9px 16px;border-radius:0;border-right:1px solid var(--border-subtle);}
  .cx-tabs--seg .cx-tab:last-child{border-right:none;}
  .cx-tabs--seg .cx-tab--active{color:var(--green-800);background:var(--brand-subtle);}
  .cx-tab__count{font-size:12px;font-weight:600;color:var(--text-tertiary);background:var(--gray-100);
    border-radius:var(--radius-pill);padding:1px 7px;line-height:16px;}
  .cx-tab--active .cx-tab__count{background:var(--brand-subtle);color:var(--green-700);}
  `;
  document.head.appendChild(s);
}

/**
 * Tabs — view switcher. `variant`: pill (default), line, or segmented.
 * Controlled via `value` + `onChange`; items are [{value,label,icon,count}].
 */
function Tabs({
  items = [],
  value,
  onChange,
  variant = "pill",
  className = ""
}) {
  const cls = ["cx-tabs", `cx-tabs--${variant}`, className].filter(Boolean).join(" ");
  return React.createElement("div", {
    className: cls,
    role: "tablist"
  }, items.map(it => {
    const active = it.value === value;
    return React.createElement("button", {
      key: it.value,
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: "cx-tab" + (active ? " cx-tab--active" : ""),
      onClick: () => onChange && onChange(it.value)
    }, it.icon && React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 16
    }), it.label, it.count != null && React.createElement("span", {
      className: "cx-tab__count"
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/realestate/AgentCard.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-agent-css")) {
  const s = document.createElement("style");
  s.id = "cx-agent-css";
  s.textContent = `
  .cx-agent{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;background:var(--surface-card);
    border:1px solid var(--border-subtle);border-radius:var(--radius-card);padding:24px 20px;font-family:var(--font-sans);
    box-shadow:var(--shadow-card);transition:box-shadow .22s ease,transform .22s ease;}
  .cx-agent:hover{box-shadow:var(--shadow-card-hover);transform:translateY(-2px);}
  .cx-agent__name{font-family:var(--font-display);font-weight:600;font-size:20px;line-height:24px;color:var(--text-primary);}
  .cx-agent__agency{display:flex;align-items:center;justify-content:center;gap:5px;font-size:13px;color:var(--text-tertiary);margin-top:2px;}
  .cx-agent__rating{display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--text-primary);}
  .cx-agent__rating svg{color:var(--brand-accent);}
  .cx-agent__rating span{color:var(--text-tertiary);font-weight:500;}
  .cx-agent__stats{display:flex;width:100%;border-top:1px solid var(--border-subtle);padding-top:14px;}
  .cx-agent__stat{flex:1;display:flex;flex-direction:column;gap:2px;}
  .cx-agent__stat + .cx-agent__stat{border-left:1px solid var(--border-subtle);}
  .cx-agent__stat b{font-size:18px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;}
  .cx-agent__stat span{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--text-tertiary);}
  .cx-agent__actions{display:flex;gap:8px;width:100%;}
  .cx-agent__btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;height:40px;border-radius:var(--radius-control);
    font-size:14px;font-weight:600;cursor:pointer;transition:background-color .15s,border-color .15s;border:1px solid transparent;}
  .cx-agent__btn--primary{background:var(--brand-primary);color:#fff;}
  .cx-agent__btn--primary:hover{background:var(--brand-primary-hover);}
  .cx-agent__btn--ghost{background:var(--surface-card);color:var(--gray-700);border-color:var(--border-default);}
  .cx-agent__btn--ghost:hover{background:var(--gray-50);}
  .cx-agent--row{flex-direction:row;text-align:left;align-items:center;gap:16px;padding:16px;}
  .cx-agent--row .cx-agent__main{flex:1;display:flex;flex-direction:column;gap:2px;}
  `;
  document.head.appendChild(s);
}

/**
 * AgentCard — verified agent profile with rating, stats, and contact actions.
 * `layout="row"` renders a compact horizontal variant for lists.
 */
function AgentCard({
  name,
  avatar,
  agency,
  verified = true,
  rating,
  reviews,
  listings,
  sales,
  experience,
  layout = "stack",
  onCall,
  onMessage,
  className = "",
  ...rest
}) {
  if (layout === "row") {
    return React.createElement("article", {
      className: ["cx-agent", "cx-agent--row", className].filter(Boolean).join(" "),
      ...rest
    }, React.createElement(__ds_scope.Avatar, {
      src: avatar,
      name,
      size: "lg",
      verified
    }), React.createElement("div", {
      className: "cx-agent__main"
    }, React.createElement("div", {
      className: "cx-agent__name",
      style: {
        fontSize: 17
      }
    }, name), React.createElement("div", {
      className: "cx-agent__agency"
    }, React.createElement(__ds_scope.Icon, {
      name: "building-2",
      size: 13
    }), agency)), rating != null && React.createElement("div", {
      className: "cx-agent__rating"
    }, React.createElement(__ds_scope.Icon, {
      name: "star",
      size: 15,
      fill: "currentColor"
    }), rating));
  }
  return React.createElement("article", {
    className: ["cx-agent", className].filter(Boolean).join(" "),
    ...rest
  }, React.createElement(__ds_scope.Avatar, {
    src: avatar,
    name,
    size: "xl",
    verified
  }), React.createElement("div", null, React.createElement("div", {
    className: "cx-agent__name"
  }, name), React.createElement("div", {
    className: "cx-agent__agency"
  }, React.createElement(__ds_scope.Icon, {
    name: "building-2",
    size: 14
  }), agency), verified && React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, React.createElement(__ds_scope.Badge, {
    variant: "brand",
    size: "sm",
    icon: "badge-check"
  }, "Verified Agent"))), rating != null && React.createElement("div", {
    className: "cx-agent__rating"
  }, React.createElement(__ds_scope.Icon, {
    name: "star",
    size: 16,
    fill: "currentColor"
  }), rating, reviews != null && React.createElement("span", null, "(" + reviews + " reviews)")), React.createElement("div", {
    className: "cx-agent__stats"
  }, listings != null && React.createElement("div", {
    className: "cx-agent__stat"
  }, React.createElement("b", null, listings), React.createElement("span", null, "Listings")), sales != null && React.createElement("div", {
    className: "cx-agent__stat"
  }, React.createElement("b", null, sales), React.createElement("span", null, "Sold")), experience != null && React.createElement("div", {
    className: "cx-agent__stat"
  }, React.createElement("b", null, experience), React.createElement("span", null, "Years"))), React.createElement("div", {
    className: "cx-agent__actions"
  }, React.createElement("button", {
    className: "cx-agent__btn cx-agent__btn--ghost",
    onClick: onMessage
  }, React.createElement(__ds_scope.Icon, {
    name: "message-circle",
    size: 16
  }), "Message"), React.createElement("button", {
    className: "cx-agent__btn cx-agent__btn--primary",
    onClick: onCall
  }, React.createElement(__ds_scope.Icon, {
    name: "phone",
    size: 16
  }), "Call")));
}
Object.assign(__ds_scope, { AgentCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/AgentCard.jsx", error: String((e && e.message) || e) }); }

// components/realestate/AppointmentWidget.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-appt-css")) {
  const s = document.createElement("style");
  s.id = "cx-appt-css";
  s.textContent = `
  .cx-appt{background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-card);
    box-shadow:var(--shadow-lg);font-family:var(--font-sans);overflow:hidden;}
  .cx-appt__head{padding:20px 22px;border-bottom:1px solid var(--border-subtle);}
  .cx-appt__priceln{display:flex;align-items:baseline;gap:6px;}
  .cx-appt__price{font-weight:700;font-size:26px;letter-spacing:-0.01em;color:var(--text-primary);font-variant-numeric:tabular-nums;}
  .cx-appt__per{font-size:14px;color:var(--text-tertiary);font-weight:500;}
  .cx-appt__est{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-tertiary);margin-top:4px;}
  .cx-appt__body{padding:20px 22px;display:flex;flex-direction:column;gap:16px;}
  .cx-appt__seclbl{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text-tertiary);margin-bottom:9px;}
  .cx-appt__dates{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;}
  .cx-appt__date{display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px;border-radius:var(--radius-md);
    border:1px solid var(--border-default);cursor:pointer;background:var(--surface-card);transition:border-color .14s,background-color .14s;}
  .cx-appt__date:hover{border-color:var(--border-strong);}
  .cx-appt__date--active{background:var(--brand-primary);border-color:var(--brand-primary);}
  .cx-appt__date--active .cx-appt__dow,.cx-appt__date--active .cx-appt__dnum{color:#fff;}
  .cx-appt__dow{font-size:11px;font-weight:600;text-transform:uppercase;color:var(--text-tertiary);}
  .cx-appt__dnum{font-size:17px;font-weight:700;color:var(--text-primary);font-variant-numeric:tabular-nums;}
  .cx-appt__slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
  .cx-appt__slot{padding:9px 4px;text-align:center;border-radius:var(--radius-md);border:1px solid var(--border-default);
    font-size:14px;font-weight:600;color:var(--text-secondary);cursor:pointer;background:var(--surface-card);transition:all .14s;}
  .cx-appt__slot:hover{border-color:var(--border-strong);color:var(--text-primary);}
  .cx-appt__slot--active{background:var(--brand-subtle);border-color:var(--green-300);color:var(--green-800);}
  .cx-appt__slot--off{opacity:.4;cursor:not-allowed;text-decoration:line-through;}
  .cx-appt__agentrow{display:flex;align-items:center;gap:11px;padding:12px;background:var(--gray-50);border-radius:var(--radius-md);}
  .cx-appt__agentrow b{font-size:14px;font-weight:600;color:var(--text-primary);display:block;line-height:1.3;}
  .cx-appt__agentrow span{font-size:12px;color:var(--text-tertiary);}
  .cx-appt__cta{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;height:50px;border:none;
    background:var(--brand-primary);color:#fff;border-radius:var(--radius-control);font-size:16px;font-weight:600;cursor:pointer;transition:background-color .15s;}
  .cx-appt__cta:hover{background:var(--brand-primary-hover);}
  .cx-appt__note{display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:var(--text-tertiary);}
  `;
  document.head.appendChild(s);
}

/**
 * AppointmentWidget — sticky "book a viewing" panel for the property detail
 * page: price header, date picker, time slots, agent, and a CTA.
 */
function AppointmentWidget({
  price,
  period,
  estimate,
  dates = [],
  times = [],
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  agent,
  ctaLabel = "Request a viewing",
  onSubmit,
  className = ""
}) {
  return React.createElement("div", {
    className: ["cx-appt", className].filter(Boolean).join(" ")
  }, React.createElement("div", {
    className: "cx-appt__head"
  }, React.createElement("div", {
    className: "cx-appt__priceln"
  }, React.createElement("span", {
    className: "cx-appt__price"
  }, price), period && React.createElement("span", {
    className: "cx-appt__per"
  }, "/ " + period)), estimate && React.createElement("div", {
    className: "cx-appt__est"
  }, React.createElement(__ds_scope.Icon, {
    name: "trending-up",
    size: 14
  }), estimate)), React.createElement("div", {
    className: "cx-appt__body"
  }, dates.length > 0 && React.createElement("div", null, React.createElement("div", {
    className: "cx-appt__seclbl"
  }, "Select a date"), React.createElement("div", {
    className: "cx-appt__dates"
  }, dates.map((d, i) => React.createElement("button", {
    key: i,
    className: "cx-appt__date" + ((selectedDate ?? 0) === i ? " cx-appt__date--active" : ""),
    onClick: onSelectDate ? () => onSelectDate(i) : undefined
  }, React.createElement("span", {
    className: "cx-appt__dow"
  }, d.dow), React.createElement("span", {
    className: "cx-appt__dnum"
  }, d.day))))), times.length > 0 && React.createElement("div", null, React.createElement("div", {
    className: "cx-appt__seclbl"
  }, "Available times"), React.createElement("div", {
    className: "cx-appt__slots"
  }, times.map((t, i) => React.createElement("button", {
    key: i,
    disabled: t.off,
    className: "cx-appt__slot" + (t.off ? " cx-appt__slot--off" : "") + (selectedTime === i ? " cx-appt__slot--active" : ""),
    onClick: t.off || !onSelectTime ? undefined : () => onSelectTime(i)
  }, t.label || t)))), agent && React.createElement("div", {
    className: "cx-appt__agentrow"
  }, React.createElement(__ds_scope.Avatar, {
    src: agent.avatar,
    name: agent.name,
    size: "md",
    verified: agent.verified
  }), React.createElement("div", null, React.createElement("b", null, agent.name), React.createElement("span", null, agent.agency || "Your viewing agent"))), React.createElement("button", {
    className: "cx-appt__cta",
    onClick: onSubmit
  }, React.createElement(__ds_scope.Icon, {
    name: "calendar-check",
    size: 19
  }), ctaLabel), React.createElement("div", {
    className: "cx-appt__note"
  }, React.createElement(__ds_scope.Icon, {
    name: "shield-check",
    size: 14
  }), "Free · no obligation · confirmed in 24h")));
}
Object.assign(__ds_scope, { AppointmentWidget });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/AppointmentWidget.jsx", error: String((e && e.message) || e) }); }

// components/realestate/FeaturedPropertyCard.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-featured-css")) {
  const s = document.createElement("style");
  s.id = "cx-featured-css";
  s.textContent = `
  .cx-feat{display:grid;grid-template-columns:1.15fr 1fr;background:var(--surface-card);border:1px solid var(--border-subtle);
    border-radius:var(--radius-card-lg);overflow:hidden;font-family:var(--font-sans);box-shadow:var(--shadow-lg);}
  .cx-feat__media{position:relative;min-height:340px;background:var(--gray-100);}
  .cx-feat__media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
  .cx-feat__grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(11,32,24,.55),transparent 50%);}
  .cx-feat__badges{position:absolute;top:16px;left:16px;display:flex;gap:8px;z-index:2;}
  .cx-feat__fav{position:absolute;top:16px;right:16px;z-index:2;}
  .cx-feat__thumbs{position:absolute;left:16px;bottom:16px;display:flex;gap:8px;z-index:2;}
  .cx-feat__thumb{width:54px;height:42px;border-radius:8px;object-fit:cover;border:2px solid rgba(255,255,255,.85);box-shadow:var(--shadow-md);}
  .cx-feat__thumb--more{display:flex;align-items:center;justify-content:center;background:rgba(11,32,24,.66);
    color:#fff;font-size:12px;font-weight:700;backdrop-filter:blur(4px);}
  .cx-feat__body{display:flex;flex-direction:column;padding:28px;gap:18px;}
  .cx-feat__eyebrow{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;letter-spacing:.12em;
    text-transform:uppercase;color:var(--text-accent);}
  .cx-feat__title{font-family:var(--font-display);font-weight:600;font-size:30px;line-height:36px;letter-spacing:-0.01em;color:var(--text-primary);}
  .cx-feat__addr{display:flex;align-items:center;gap:6px;font-size:14px;color:var(--text-tertiary);margin-top:-8px;}
  .cx-feat__price{font-weight:700;font-size:30px;letter-spacing:-0.01em;color:var(--brand-primary);font-variant-numeric:tabular-nums;}
  .cx-feat__price small{font-size:15px;font-weight:600;color:var(--text-tertiary);}
  .cx-feat__specs{display:flex;flex-wrap:wrap;gap:10px;}
  .cx-feat__spec{display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--gray-50);
    border:1px solid var(--border-subtle);border-radius:var(--radius-md);font-size:13px;font-weight:500;color:var(--text-secondary);}
  .cx-feat__spec b{color:var(--text-primary);font-weight:700;}
  .cx-feat__spec svg{color:var(--green-500);}
  .cx-feat__desc{font-size:14px;line-height:22px;color:var(--text-secondary);}
  .cx-feat__foot{display:flex;align-items:center;gap:12px;margin-top:auto;padding-top:18px;border-top:1px solid var(--border-subtle);}
  .cx-feat__agent{display:flex;flex-direction:column;gap:1px;line-height:1.2;}
  .cx-feat__agent b{font-size:14px;font-weight:600;color:var(--text-primary);}
  .cx-feat__agent span{font-size:12px;color:var(--text-tertiary);}
  @media (max-width:760px){.cx-feat{grid-template-columns:1fr;}.cx-feat__media{min-height:240px;}}
  `;
  document.head.appendChild(s);
}

/**
 * FeaturedPropertyCard — large two-pane hero card for the homepage and
 * "featured" rails. Photography on the left, rich detail on the right.
 */
function FeaturedPropertyCard({
  image,
  thumbs = [],
  eyebrow = "Featured Listing",
  price,
  period,
  title,
  address,
  beds,
  baths,
  area,
  areaUnit = "m²",
  description,
  agent,
  status = "For Sale",
  favorite = false,
  onFavorite,
  actions,
  className = "",
  ...rest
}) {
  const extraThumbs = thumbs.length > 3 ? thumbs.length - 3 : 0;
  return React.createElement("article", {
    className: ["cx-feat", className].filter(Boolean).join(" "),
    ...rest
  }, React.createElement("div", {
    className: "cx-feat__media"
  }, React.createElement("img", {
    src: image,
    alt: title
  }), React.createElement("div", {
    className: "cx-feat__grad"
  }), React.createElement("div", {
    className: "cx-feat__badges"
  }, React.createElement(__ds_scope.Badge, {
    variant: "gold",
    size: "md",
    icon: "star"
  }, "Featured"), React.createElement(__ds_scope.Badge, {
    variant: "solid",
    size: "md",
    dot: true
  }, status)), React.createElement("div", {
    className: "cx-feat__fav"
  }, React.createElement(__ds_scope.IconButton, {
    icon: "heart",
    label: "Save",
    variant: "glass",
    active: favorite,
    onClick: onFavorite
  })), thumbs.length > 0 && React.createElement("div", {
    className: "cx-feat__thumbs"
  }, thumbs.slice(0, 3).map((t, i) => i === 2 && extraThumbs > 0 ? React.createElement("div", {
    key: i,
    className: "cx-feat__thumb cx-feat__thumb--more"
  }, "+" + extraThumbs) : React.createElement("img", {
    key: i,
    src: t,
    className: "cx-feat__thumb",
    alt: ""
  })))), React.createElement("div", {
    className: "cx-feat__body"
  }, React.createElement("div", {
    className: "cx-feat__eyebrow"
  }, React.createElement(__ds_scope.Icon, {
    name: "sparkles",
    size: 14
  }), eyebrow), React.createElement("div", null, React.createElement("div", {
    className: "cx-feat__title"
  }, title), React.createElement("div", {
    className: "cx-feat__addr"
  }, React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 15
  }), address)), React.createElement("div", {
    className: "cx-feat__price"
  }, price, period && React.createElement("small", null, " /" + period)), React.createElement("div", {
    className: "cx-feat__specs"
  }, beds != null && React.createElement("div", {
    className: "cx-feat__spec"
  }, React.createElement(__ds_scope.Icon, {
    name: "bed-double",
    size: 17
  }), React.createElement("b", null, beds), "Bedrooms"), baths != null && React.createElement("div", {
    className: "cx-feat__spec"
  }, React.createElement(__ds_scope.Icon, {
    name: "bath",
    size: 17
  }), React.createElement("b", null, baths), "Bathrooms"), area != null && React.createElement("div", {
    className: "cx-feat__spec"
  }, React.createElement(__ds_scope.Icon, {
    name: "maximize-2",
    size: 16
  }), React.createElement("b", null, area), areaUnit)), description && React.createElement("div", {
    className: "cx-feat__desc"
  }, description), React.createElement("div", {
    className: "cx-feat__foot"
  }, agent && React.createElement(React.Fragment, null, React.createElement(__ds_scope.Avatar, {
    src: agent.avatar,
    name: agent.name,
    size: "md",
    verified: agent.verified
  }), React.createElement("div", {
    className: "cx-feat__agent"
  }, React.createElement("b", null, agent.name), React.createElement("span", null, agent.agency || "Chiya verified agent"))), React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      gap: 8
    }
  }, actions))));
}
Object.assign(__ds_scope, { FeaturedPropertyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/FeaturedPropertyCard.jsx", error: String((e && e.message) || e) }); }

// components/realestate/MapPanel.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-map-css")) {
  const s = document.createElement("style");
  s.id = "cx-map-css";
  s.textContent = `
  .cx-map{position:relative;border-radius:var(--radius-card);overflow:hidden;font-family:var(--font-sans);
    background:
      radial-gradient(120% 90% at 18% 12%, #DCE7DC 0%, transparent 45%),
      radial-gradient(120% 90% at 85% 80%, #E6E0D2 0%, transparent 50%),
      #EAEAE2;}
  .cx-map__roads{position:absolute;inset:0;opacity:.5;pointer-events:none;
    background-image:
      linear-gradient(90deg,transparent 0 calc(50% - 3px),#fff calc(50% - 3px) calc(50% + 3px),transparent calc(50% + 3px)),
      linear-gradient(18deg,transparent 0 calc(32% - 2px),#fff calc(32% - 2px) calc(32% + 2px),transparent calc(32% + 2px)),
      linear-gradient(-26deg,transparent 0 calc(70% - 2px),#fff calc(70% - 2px) calc(70% + 2px),transparent calc(70% + 2px)),
      linear-gradient(0deg,transparent 0 calc(64% - 2px),#fff calc(64% - 2px) calc(64% + 2px),transparent calc(64% + 2px));}
  .cx-map__water{position:absolute;width:38%;height:30%;right:-6%;top:-8%;background:#C9DBE0;border-radius:0 0 0 60%;transform:rotate(8deg);opacity:.7;}
  .cx-map__pin{position:absolute;transform:translate(-50%,-100%);z-index:2;}
  .cx-map__pill{display:inline-flex;align-items:center;gap:5px;height:30px;padding:0 12px;border-radius:var(--radius-pill);
    background:var(--surface-card);color:var(--text-primary);font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;
    box-shadow:var(--shadow-md);border:1px solid var(--border-subtle);cursor:pointer;white-space:nowrap;
    transition:transform .14s,background-color .14s,color .14s;}
  .cx-map__pill:hover{transform:scale(1.06);}
  .cx-map__pin--active .cx-map__pill{background:var(--brand-primary);color:#fff;border-color:transparent;box-shadow:var(--shadow-lg);}
  .cx-map__pin--active .cx-map__pill svg{color:var(--brand-accent);}
  .cx-map__pin--cluster .cx-map__pill{background:var(--brand-accent);color:var(--green-900);border-color:transparent;}
  .cx-map__ctrls{position:absolute;right:14px;bottom:14px;display:flex;flex-direction:column;gap:8px;z-index:3;}
  .cx-map__zoom{display:flex;flex-direction:column;background:var(--surface-card);border:1px solid var(--border-subtle);
    border-radius:var(--radius-md);overflow:hidden;box-shadow:var(--shadow-sm);}
  .cx-map__zoom button{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:none;
    background:transparent;color:var(--gray-700);cursor:pointer;transition:background-color .14s;}
  .cx-map__zoom button:hover{background:var(--gray-50);}
  .cx-map__zoom button + button{border-top:1px solid var(--border-subtle);}
  .cx-map__chip{position:absolute;left:14px;top:14px;z-index:3;display:inline-flex;align-items:center;gap:7px;
    padding:8px 14px;background:var(--surface-card);border:1px solid var(--border-subtle);border-radius:var(--radius-pill);
    font-size:13px;font-weight:600;color:var(--text-secondary);box-shadow:var(--shadow-sm);}
  .cx-map__chip svg{color:var(--green-500);}
  `;
  document.head.appendChild(s);
}

/**
 * MapPanel — interactive map surface with price pins, clusters, and zoom
 * controls. `pins` are [{x,y,price,active,cluster}] in 0–100 percentages.
 */
function MapPanel({
  pins = [],
  areaLabel = "Erbil · 124 homes",
  height = 420,
  onPin,
  className = ""
}) {
  return React.createElement("div", {
    className: ["cx-map", className].filter(Boolean).join(" "),
    style: {
      height
    }
  }, React.createElement("div", {
    className: "cx-map__water"
  }), React.createElement("div", {
    className: "cx-map__roads"
  }), areaLabel && React.createElement("div", {
    className: "cx-map__chip"
  }, React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 15
  }), areaLabel), pins.map((p, i) => React.createElement("div", {
    key: i,
    className: ["cx-map__pin", p.active ? "cx-map__pin--active" : "", p.cluster ? "cx-map__pin--cluster" : ""].filter(Boolean).join(" "),
    style: {
      left: p.x + "%",
      top: p.y + "%"
    }
  }, React.createElement("button", {
    className: "cx-map__pill",
    onClick: onPin ? () => onPin(p, i) : undefined
  }, p.active && React.createElement(__ds_scope.Icon, {
    name: "home",
    size: 13
  }), p.cluster ? p.price + " homes" : p.price))), React.createElement("div", {
    className: "cx-map__ctrls"
  }, React.createElement("div", {
    className: "cx-map__zoom"
  }, React.createElement("button", {
    "aria-label": "Zoom in"
  }, React.createElement(__ds_scope.Icon, {
    name: "plus",
    size: 18
  })), React.createElement("button", {
    "aria-label": "Zoom out"
  }, React.createElement(__ds_scope.Icon, {
    name: "minus",
    size: 18
  }))), React.createElement(__ds_scope.IconButton, {
    icon: "locate-fixed",
    label: "My location",
    variant: "default"
  })));
}
Object.assign(__ds_scope, { MapPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/MapPanel.jsx", error: String((e && e.message) || e) }); }

// components/realestate/PropertyCard.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-propcard-css")) {
  const s = document.createElement("style");
  s.id = "cx-propcard-css";
  s.textContent = `
  .cx-prop{display:flex;flex-direction:column;background:var(--surface-card);border:1px solid var(--border-subtle);
    border-radius:var(--radius-card);overflow:hidden;font-family:var(--font-sans);box-shadow:var(--shadow-card);
    transition:box-shadow .25s ease,transform .25s ease,border-color .25s ease;}
  .cx-prop:hover{box-shadow:var(--shadow-card-hover);transform:translateY(-3px);border-color:var(--border-default);}
  .cx-prop__media{position:relative;aspect-ratio:4/3;overflow:hidden;background:var(--gray-100);}
  .cx-prop__media img{width:100%;height:100%;object-fit:cover;transition:transform .5s cubic-bezier(.2,.7,.2,1);}
  .cx-prop:hover .cx-prop__media img{transform:scale(1.05);}
  .cx-prop__badges{position:absolute;top:12px;left:12px;display:flex;gap:6px;z-index:2;}
  .cx-prop__fav{position:absolute;top:12px;right:12px;z-index:2;}
  .cx-prop__count{position:absolute;bottom:12px;right:12px;z-index:2;display:inline-flex;align-items:center;gap:5px;
    padding:4px 9px;border-radius:var(--radius-pill);font-size:12px;font-weight:600;color:#fff;
    background:rgba(11,32,24,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
  .cx-prop__grad{position:absolute;inset:0;background:linear-gradient(to top,rgba(11,32,24,.28),transparent 38%);pointer-events:none;}
  .cx-prop__body{display:flex;flex-direction:column;gap:12px;padding:16px;}
  .cx-prop__priceln{display:flex;align-items:baseline;justify-content:space-between;gap:8px;}
  .cx-prop__price{font-family:var(--font-sans);font-weight:700;font-size:22px;letter-spacing:-0.01em;color:var(--text-primary);font-variant-numeric:tabular-nums;}
  .cx-prop__price small{font-size:14px;font-weight:600;color:var(--text-tertiary);}
  .cx-prop__title{font-family:var(--font-display);font-weight:600;font-size:19px;line-height:24px;color:var(--text-primary);
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cx-prop__addr{display:flex;align-items:center;gap:5px;font-size:13px;color:var(--text-tertiary);}
  .cx-prop__addr span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .cx-prop__specs{display:flex;align-items:center;gap:16px;padding-top:12px;border-top:1px solid var(--border-subtle);}
  .cx-prop__spec{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:500;color:var(--text-secondary);}
  .cx-prop__spec b{font-weight:600;color:var(--text-primary);}
  .cx-prop__spec svg{color:var(--green-500);}
  `;
  document.head.appendChild(s);
}
const STATUS_VARIANT = {
  "For Sale": "success",
  "For Rent": "info",
  Pending: "warning",
  Sold: "error",
  New: "solid"
};

/**
 * PropertyCard — the workhorse listing card used across grids and search.
 */
function PropertyCard({
  image,
  price,
  period,
  title,
  address,
  beds,
  baths,
  area,
  areaUnit = "m²",
  status = "For Sale",
  featured = false,
  photoCount,
  favorite = false,
  onFavorite,
  href,
  className = "",
  ...rest
}) {
  return React.createElement("article", {
    className: ["cx-prop", className].filter(Boolean).join(" "),
    ...rest
  }, React.createElement("div", {
    className: "cx-prop__media"
  }, React.createElement("img", {
    src: image,
    alt: title,
    loading: "lazy"
  }), React.createElement("div", {
    className: "cx-prop__grad"
  }), React.createElement("div", {
    className: "cx-prop__badges"
  }, featured && React.createElement(__ds_scope.Badge, {
    variant: "gold",
    size: "sm",
    icon: "star"
  }, "Featured"), status && React.createElement(__ds_scope.Badge, {
    variant: STATUS_VARIANT[status] || "neutral",
    size: "sm",
    dot: true
  }, status)), React.createElement("div", {
    className: "cx-prop__fav"
  }, React.createElement(__ds_scope.IconButton, {
    icon: "heart",
    label: "Save",
    variant: "glass",
    size: "sm",
    active: favorite,
    onClick: onFavorite
  })), photoCount != null && React.createElement("div", {
    className: "cx-prop__count"
  }, React.createElement(__ds_scope.Icon, {
    name: "image",
    size: 13
  }), photoCount)), React.createElement("div", {
    className: "cx-prop__body"
  }, React.createElement("div", {
    className: "cx-prop__priceln"
  }, React.createElement("div", {
    className: "cx-prop__price"
  }, price, period && React.createElement("small", null, " /" + period))), React.createElement("div", null, React.createElement("div", {
    className: "cx-prop__title"
  }, title), React.createElement("div", {
    className: "cx-prop__addr"
  }, React.createElement(__ds_scope.Icon, {
    name: "map-pin",
    size: 14
  }), React.createElement("span", null, address))), React.createElement("div", {
    className: "cx-prop__specs"
  }, beds != null && React.createElement("div", {
    className: "cx-prop__spec"
  }, React.createElement(__ds_scope.Icon, {
    name: "bed-double",
    size: 17
  }), React.createElement("b", null, beds), "Beds"), baths != null && React.createElement("div", {
    className: "cx-prop__spec"
  }, React.createElement(__ds_scope.Icon, {
    name: "bath",
    size: 17
  }), React.createElement("b", null, baths), "Baths"), area != null && React.createElement("div", {
    className: "cx-prop__spec"
  }, React.createElement(__ds_scope.Icon, {
    name: "maximize-2",
    size: 16
  }), React.createElement("b", null, area), areaUnit))));
}
Object.assign(__ds_scope, { PropertyCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/PropertyCard.jsx", error: String((e && e.message) || e) }); }

// components/realestate/PropertyGallery.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-gallery-css")) {
  const s = document.createElement("style");
  s.id = "cx-gallery-css";
  s.textContent = `
  .cx-gallery{font-family:var(--font-sans);display:flex;flex-direction:column;gap:12px;}
  .cx-gallery__stage{position:relative;aspect-ratio:16/10;border-radius:var(--radius-card);overflow:hidden;background:var(--gray-100);}
  .cx-gallery__stage img{width:100%;height:100%;object-fit:cover;}
  .cx-gallery__nav{position:absolute;top:50%;transform:translateY(-50%);z-index:2;}
  .cx-gallery__nav--prev{left:14px;}
  .cx-gallery__nav--next{right:14px;}
  .cx-gallery__topright{position:absolute;top:14px;right:14px;display:flex;gap:8px;z-index:2;}
  .cx-gallery__topleft{position:absolute;top:14px;left:14px;z-index:2;}
  .cx-gallery__counter{position:absolute;bottom:14px;right:14px;z-index:2;display:inline-flex;align-items:center;gap:6px;
    padding:6px 12px;border-radius:var(--radius-pill);font-size:13px;font-weight:600;color:#fff;
    background:rgba(11,32,24,.62);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);}
  .cx-gallery__strip{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:10px;}
  .cx-gallery__thumb{position:relative;aspect-ratio:4/3;border-radius:var(--radius-md);overflow:hidden;cursor:pointer;
    background:var(--gray-100);border:2px solid transparent;transition:border-color .15s,opacity .15s;}
  .cx-gallery__thumb img{width:100%;height:100%;object-fit:cover;}
  .cx-gallery__thumb:not(.cx-gallery__thumb--active){opacity:.72;}
  .cx-gallery__thumb:hover{opacity:1;}
  .cx-gallery__thumb--active{border-color:var(--brand-accent);opacity:1;}
  .cx-gallery__more{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    background:rgba(11,32,24,.6);color:#fff;font-size:15px;font-weight:700;}
  `;
  document.head.appendChild(s);
}

/**
 * PropertyGallery — main stage + thumbnail strip with prev/next navigation
 * and a photo counter. Self-contained (manages its own active index).
 */
function PropertyGallery({
  images = [],
  status,
  badges,
  maxThumbs = 5,
  onExpand,
  className = ""
}) {
  const [i, setI] = React.useState(0);
  const n = images.length;
  const go = d => setI(p => (p + d + n) % n);
  const thumbs = images.slice(0, maxThumbs);
  const extra = n - thumbs.length;
  return React.createElement("div", {
    className: ["cx-gallery", className].filter(Boolean).join(" ")
  }, React.createElement("div", {
    className: "cx-gallery__stage"
  }, React.createElement("img", {
    src: images[i],
    alt: "Property photo " + (i + 1)
  }), React.createElement("div", {
    className: "cx-gallery__topleft",
    style: {
      display: "flex",
      gap: 8
    }
  }, status && React.createElement(__ds_scope.Badge, {
    variant: "solid",
    size: "md",
    dot: true
  }, status), badges), React.createElement("div", {
    className: "cx-gallery__topright"
  }, React.createElement(__ds_scope.IconButton, {
    icon: "share-2",
    label: "Share",
    variant: "glass"
  }), React.createElement(__ds_scope.IconButton, {
    icon: "heart",
    label: "Save",
    variant: "glass"
  })), n > 1 && React.createElement("div", {
    className: "cx-gallery__nav cx-gallery__nav--prev"
  }, React.createElement(__ds_scope.IconButton, {
    icon: "chevron-left",
    label: "Previous",
    variant: "glass",
    onClick: () => go(-1)
  })), n > 1 && React.createElement("div", {
    className: "cx-gallery__nav cx-gallery__nav--next"
  }, React.createElement(__ds_scope.IconButton, {
    icon: "chevron-right",
    label: "Next",
    variant: "glass",
    onClick: () => go(1)
  })), React.createElement("button", {
    className: "cx-gallery__counter",
    onClick: onExpand,
    style: {
      border: "none",
      cursor: "pointer"
    }
  }, React.createElement(__ds_scope.Icon, {
    name: "images",
    size: 14
  }), i + 1 + " / " + n)), React.createElement("div", {
    className: "cx-gallery__strip"
  }, thumbs.map((src, ti) => React.createElement("div", {
    key: ti,
    className: "cx-gallery__thumb" + (ti === i ? " cx-gallery__thumb--active" : ""),
    onClick: () => setI(ti)
  }, React.createElement("img", {
    src,
    alt: ""
  }), ti === thumbs.length - 1 && extra > 0 && React.createElement("div", {
    className: "cx-gallery__more",
    onClick: onExpand
  }, "+" + extra + " more")))));
}
Object.assign(__ds_scope, { PropertyGallery });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/PropertyGallery.jsx", error: String((e && e.message) || e) }); }

// components/realestate/SearchFilters.jsx
try { (() => {
const React = window.React;
if (typeof document !== "undefined" && !document.getElementById("cx-search-css")) {
  const s = document.createElement("style");
  s.id = "cx-search-css";
  s.textContent = `
  .cx-searchbar{display:flex;align-items:stretch;gap:0;background:var(--surface-card);border:1px solid var(--border-subtle);
    border-radius:var(--radius-pill);box-shadow:var(--shadow-lg);padding:6px;font-family:var(--font-sans);}
  .cx-searchbar__seg{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:8px 18px;position:relative;flex:1;min-width:0;cursor:pointer;border-radius:var(--radius-pill);transition:background-color .14s;}
  .cx-searchbar__seg:hover{background:var(--gray-50);}
  .cx-searchbar__seg + .cx-searchbar__seg::before{content:"";position:absolute;left:0;top:18%;height:64%;width:1px;background:var(--border-subtle);}
  .cx-searchbar__seg:hover + .cx-searchbar__seg::before,.cx-searchbar__seg:hover::before{opacity:0;}
  .cx-searchbar__lbl{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--text-tertiary);}
  .cx-searchbar__val{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:500;color:var(--text-primary);}
  .cx-searchbar__val svg{color:var(--green-500);}
  .cx-searchbar__val--ph{color:var(--text-placeholder);font-weight:400;}
  .cx-searchbar__go{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:8px;align-self:center;
    height:56px;padding:0 28px;margin-left:4px;background:var(--brand-primary);color:#fff;border:none;border-radius:var(--radius-pill);
    font-size:15px;font-weight:600;cursor:pointer;transition:background-color .15s;}
  .cx-searchbar__go:hover{background:var(--brand-primary-hover);}
  /* filter toolbar */
  .cx-filterbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:var(--font-sans);}
  .cx-filterbtn{display:inline-flex;align-items:center;gap:7px;height:40px;padding:0 14px;background:var(--surface-card);
    border:1px solid var(--border-default);border-radius:var(--radius-pill);font-size:14px;font-weight:500;color:var(--text-secondary);
    cursor:pointer;transition:border-color .14s,background-color .14s,color .14s;}
  .cx-filterbtn:hover{border-color:var(--border-strong);color:var(--text-primary);}
  .cx-filterbtn--active{background:var(--brand-subtle);border-color:var(--green-200);color:var(--green-800);font-weight:600;}
  .cx-filterbtn svg:last-child{color:var(--text-tertiary);}
  .cx-filterbtn__count{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;
    background:var(--brand-primary);color:#fff;border-radius:var(--radius-pill);font-size:11px;font-weight:700;}
  .cx-filtertags{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .cx-filterbar__clear{font-size:13px;font-weight:600;color:var(--text-brand);background:none;border:none;cursor:pointer;padding:4px;}
  .cx-filterbar__clear:hover{text-decoration:underline;}
  `;
  document.head.appendChild(s);
}

/**
 * SearchBar — the marquee location/type/price search used on the homepage
 * and listings hero. Segments are display-only triggers; wire `onSearch`.
 */
function SearchBar({
  segments,
  onSearch
}) {
  const defaults = segments || [{
    label: "Location",
    value: "Erbil, Iraq",
    icon: "map-pin"
  }, {
    label: "Type",
    value: "Villa",
    icon: "home"
  }, {
    label: "Price",
    value: "Any",
    placeholder: true,
    icon: "wallet"
  }];
  return React.createElement("div", {
    className: "cx-searchbar"
  }, defaults.map((s, i) => React.createElement("div", {
    key: i,
    className: "cx-searchbar__seg"
  }, React.createElement("span", {
    className: "cx-searchbar__lbl"
  }, s.label), React.createElement("span", {
    className: "cx-searchbar__val" + (s.placeholder ? " cx-searchbar__val--ph" : "")
  }, s.icon && React.createElement(__ds_scope.Icon, {
    name: s.icon,
    size: 16
  }), s.value))), React.createElement("button", {
    className: "cx-searchbar__go",
    onClick: onSearch
  }, React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 18
  }), "Search"));
}

/**
 * SearchFilters — the secondary filter toolbar: quick filter buttons plus a
 * row of removable active-filter Tags.
 */
function SearchFilters({
  filters = [],
  activeTags = [],
  onClear,
  onRemoveTag
}) {
  return React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, React.createElement("div", {
    className: "cx-filterbar"
  }, filters.map((f, i) => React.createElement("button", {
    key: i,
    className: "cx-filterbtn" + (f.active ? " cx-filterbtn--active" : ""),
    onClick: f.onClick
  }, f.icon && React.createElement(__ds_scope.Icon, {
    name: f.icon,
    size: 16
  }), f.label, f.count != null && React.createElement("span", {
    className: "cx-filterbtn__count"
  }, f.count), f.dropdown !== false && React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 15
  })))), activeTags.length > 0 && React.createElement("div", {
    className: "cx-filtertags"
  }, activeTags.map((t, i) => React.createElement(__ds_scope.Tag, {
    key: i,
    onRemove: onRemoveTag ? () => onRemoveTag(t) : undefined
  }, t)), onClear && React.createElement("button", {
    className: "cx-filterbar__clear",
    onClick: onClear
  }, "Clear all")));
}
Object.assign(__ds_scope, { SearchBar, SearchFilters });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/realestate/SearchFilters.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/MobileScreens.jsx
try { (() => {
const React = window.React;
const {
  Icon,
  Badge,
  Avatar,
  Button,
  AppointmentWidget,
  PropertyGallery
} = window.ChiyaEstateDesignSystem_686f57;

// ── Explore (home feed) ─────────────────────────────────────
function ExploreScreen({
  onOpen,
  saved,
  onSave
}) {
  const data = window.CX_DATA;
  const cats = [{
    ic: "home",
    t: "Villas"
  }, {
    ic: "building",
    t: "Apartments"
  }, {
    ic: "trees",
    t: "Estates"
  }, {
    ic: "key",
    t: "For rent"
  }, {
    ic: "tower-control",
    t: "New"
  }];
  return React.createElement("div", {
    className: "cxm-screen"
  }, React.createElement("div", {
    className: "cxm-top"
  }, React.createElement("div", {
    className: "cxm-top__row"
  }, React.createElement("div", null, React.createElement("div", {
    className: "cxm-top__hi"
  }, "Good morning"), React.createElement("div", {
    className: "cxm-top__loc"
  }, React.createElement(Icon, {
    name: "map-pin",
    size: 15
  }), "Erbil, Iraq", React.createElement(Icon, {
    name: "chevron-down",
    size: 15
  }))), React.createElement(Avatar, {
    name: "You",
    size: "md",
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop"
  })), React.createElement("div", {
    className: "cxm-searchpill"
  }, React.createElement(Icon, {
    name: "search",
    size: 18
  }), React.createElement("span", null, "Search villas, areas, agents…"), React.createElement("span", {
    className: "cxm-searchpill__filter"
  }, React.createElement(Icon, {
    name: "sliders-horizontal",
    size: 17
  })))), React.createElement("div", {
    className: "cxm-cats"
  }, cats.map((c, i) => React.createElement("button", {
    key: c.t,
    className: "cxm-cat" + (i === 0 ? " is-on" : "")
  }, React.createElement("span", {
    className: "cxm-cat__ic"
  }, React.createElement(Icon, {
    name: c.ic,
    size: 20
  })), React.createElement("span", null, c.t)))), React.createElement("div", {
    className: "cxm-sec"
  }, React.createElement("div", {
    className: "cxm-sec__head"
  }, React.createElement("h3", null, "Featured this week"), React.createElement("a", null, "See all")), React.createElement("div", {
    className: "cxm-feed"
  }, data.listings.map(l => React.createElement(window.CxmProp, {
    key: l.id,
    l,
    onOpen,
    saved: saved.includes(l.id),
    onSave
  })))));
}

// ── Detail ──────────────────────────────────────────────────
function MDetailScreen({
  id,
  onBack,
  saved,
  onSave
}) {
  const l = window.CX_DATA.byId(id) || window.CX_DATA.listings[0];
  const isSaved = saved.includes(l.id);
  return React.createElement("div", {
    className: "cxm-detail"
  }, React.createElement("div", {
    className: "cxm-detail__hero"
  }, React.createElement("img", {
    src: l.cover,
    alt: l.title
  }), React.createElement("div", {
    className: "cxm-detail__herograd"
  }), React.createElement("div", {
    className: "cxm-detail__herotop"
  }, React.createElement("button", {
    className: "cxm-roundbtn",
    onClick: onBack
  }, React.createElement(Icon, {
    name: "arrow-left",
    size: 20
  })), React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, React.createElement("button", {
    className: "cxm-roundbtn"
  }, React.createElement(Icon, {
    name: "share-2",
    size: 18
  })), React.createElement("button", {
    className: "cxm-roundbtn" + (isSaved ? " is-on" : ""),
    onClick: () => onSave(l.id)
  }, React.createElement(Icon, {
    name: "heart",
    size: 18,
    fill: isSaved ? "currentColor" : "none"
  })))), React.createElement("div", {
    className: "cxm-detail__herobadges"
  }, l.featured && React.createElement(Badge, {
    variant: "gold",
    size: "sm",
    icon: "star"
  }, "Featured"), React.createElement(Badge, {
    variant: "solid",
    size: "sm",
    dot: true
  }, l.status)), React.createElement("div", {
    className: "cxm-detail__herocount"
  }, React.createElement(Icon, {
    name: "image",
    size: 14
  }), "1 / " + l.photoCount)), React.createElement("div", {
    className: "cxm-detail__sheet"
  }, React.createElement("div", {
    className: "cxm-detail__priceln"
  }, React.createElement("span", {
    className: "cxm-detail__price"
  }, l.price, l.period && React.createElement("small", null, " /" + l.period)), React.createElement(Badge, {
    variant: "brand",
    size: "sm",
    icon: "badge-check"
  }, "Verified")), React.createElement("h1", {
    className: "cxm-detail__title"
  }, l.title), React.createElement("div", {
    className: "cxm-detail__addr"
  }, React.createElement(Icon, {
    name: "map-pin",
    size: 15
  }), l.address), React.createElement("div", {
    className: "cxm-detail__specs"
  }, [["bed-double", l.beds, "Beds"], ["bath", l.baths, "Baths"], ["maximize-2", l.area + " m²", "Area"], ["home", l.type, "Type"]].map(([ic, v, lab]) => React.createElement("div", {
    key: lab,
    className: "cxm-detail__spec"
  }, React.createElement(Icon, {
    name: ic,
    size: 19
  }), React.createElement("b", null, v), React.createElement("span", null, lab)))), React.createElement("div", {
    className: "cxm-detail__block"
  }, React.createElement("h3", null, "About"), React.createElement("p", null, l.desc)), React.createElement("div", {
    className: "cxm-agentrow"
  }, React.createElement(Avatar, {
    src: l.agent.avatar,
    name: l.agent.name,
    size: "lg",
    verified: true
  }), React.createElement("div", {
    className: "cxm-agentrow__main"
  }, React.createElement("b", null, l.agent.name), React.createElement("span", null, l.agent.agency + " · ⭐ " + l.agent.rating)), React.createElement("button", {
    className: "cxm-roundbtn cxm-roundbtn--solid"
  }, React.createElement(Icon, {
    name: "message-circle",
    size: 19
  }))), React.createElement("div", {
    style: {
      height: 92
    }
  })), React.createElement("div", {
    className: "cxm-bookbar"
  }, React.createElement("div", null, React.createElement("div", {
    className: "cxm-bookbar__lbl"
  }, "Viewing"), React.createElement("div", {
    className: "cxm-bookbar__val"
  }, "Sat 14 · 2:00 PM")), React.createElement(Button, {
    hierarchy: "primary",
    size: "lg",
    iconLeading: "calendar-check"
  }, "Book viewing")));
}
window.CxmExplore = ExploreScreen;
window.CxmDetail = MDetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/MobileScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/MobileShared.jsx
try { (() => {
const React = window.React;
const {
  Icon,
  Badge,
  IconButton,
  Avatar
} = window.ChiyaEstateDesignSystem_686f57;

// ── Bottom tab bar ──────────────────────────────────────────
function TabBar({
  active,
  onChange
}) {
  const tabs = [{
    id: "explore",
    icon: "compass",
    label: "Explore"
  }, {
    id: "search",
    icon: "search",
    label: "Search"
  }, {
    id: "saved",
    icon: "heart",
    label: "Saved"
  }, {
    id: "profile",
    icon: "user",
    label: "Profile"
  }];
  return React.createElement("div", {
    className: "cxm-tabbar"
  }, tabs.map(t => React.createElement("button", {
    key: t.id,
    className: "cxm-tab" + (active === t.id ? " cxm-tab--active" : ""),
    onClick: () => onChange(t.id)
  }, React.createElement(Icon, {
    name: t.icon,
    size: 23,
    strokeWidth: active === t.id ? 2.4 : 1.9
  }), React.createElement("span", null, t.label))));
}

// ── Mobile property card ────────────────────────────────────
function MProp({
  l,
  onOpen,
  saved,
  onSave
}) {
  return React.createElement("article", {
    className: "cxm-prop",
    onClick: () => onOpen(l.id)
  }, React.createElement("div", {
    className: "cxm-prop__media"
  }, React.createElement("img", {
    src: l.cover,
    alt: l.title
  }), React.createElement("div", {
    className: "cxm-prop__grad"
  }), React.createElement("div", {
    className: "cxm-prop__badges"
  }, l.featured && React.createElement(Badge, {
    variant: "gold",
    size: "sm",
    icon: "star"
  }, "Featured"), React.createElement(Badge, {
    variant: l.status === "For Rent" ? "info" : "success",
    size: "sm",
    dot: true
  }, l.status)), React.createElement("button", {
    className: "cxm-prop__fav" + (saved ? " is-on" : ""),
    onClick: e => {
      e.stopPropagation();
      onSave(l.id);
    }
  }, React.createElement(Icon, {
    name: "heart",
    size: 19,
    fill: saved ? "currentColor" : "none"
  }))), React.createElement("div", {
    className: "cxm-prop__body"
  }, React.createElement("div", {
    className: "cxm-prop__priceln"
  }, React.createElement("span", {
    className: "cxm-prop__price"
  }, l.price, l.period && React.createElement("small", null, " /" + l.period)), React.createElement("span", {
    className: "cxm-prop__type"
  }, l.type)), React.createElement("div", {
    className: "cxm-prop__title"
  }, l.title), React.createElement("div", {
    className: "cxm-prop__addr"
  }, React.createElement(Icon, {
    name: "map-pin",
    size: 13
  }), l.address), React.createElement("div", {
    className: "cxm-prop__specs"
  }, React.createElement("span", null, React.createElement(Icon, {
    name: "bed-double",
    size: 15
  }), l.beds), React.createElement("span", null, React.createElement(Icon, {
    name: "bath",
    size: 15
  }), l.baths), React.createElement("span", null, React.createElement(Icon, {
    name: "maximize-2",
    size: 14
  }), l.area + " m²"))));
}
window.CxmTabBar = TabBar;
window.CxmProp = MProp;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/MobileShared.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/android-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// Android.jsx — Simplified Android (Material 3) device frame
// Status bar + top app bar + content + gesture nav + keyboard.
// Based on Figma M3 spec. No dependencies, no image assets.
// Exports (to window): AndroidDevice, AndroidStatusBar, AndroidAppBar, AndroidListItem, AndroidNavBar, AndroidKeyboard
//
// Usage — wrap your screen content in <AndroidDevice> to get the bezel, status
// bar and gesture nav (props: title, large, keyboard, dark):
//
//   <AndroidDevice title="Inbox" large>
//     ...your screen content...
//   </AndroidDevice>
//   <AndroidDevice title="Compose" keyboard>…</AndroidDevice>
/* END USAGE */

const MD_C = {
  surface: '#f4fbf8',
  surfaceVariant: '#dae5e1',
  inverseOnSurface: '#ecf2ef',
  secondaryContainer: '#cde8e1',
  primaryFixedDim: '#83d5c6',
  onSurface: '#171d1b',
  onSurfaceVar: '#49454f',
  onPrimaryContainer: '#00201c',
  primary: '#006a60',
  frameBorder: 'rgba(116,119,117,0.5)'
};

// ─────────────────────────────────────────────────────────────
// Status bar (time left, wifi/cell/battery right)
// ─────────────────────────────────────────────────────────────
function AndroidStatusBar({
  dark = false
}) {
  const c = dark ? '#fff' : MD_C.onSurface;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 40,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'relative',
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 128,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 400,
      letterSpacing: 0.25,
      lineHeight: '20px',
      color: c
    }
  }, "9:30")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: '50%',
      top: 8,
      transform: 'translateX(-50%)',
      width: 24,
      height: 24,
      borderRadius: 100,
      background: '#2e2e2e'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      paddingRight: 2
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    style: {
      marginRight: -2
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8 13.3L.67 5.97a10.37 10.37 0 0114.66 0L8 13.3z",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16",
    style: {
      marginRight: -2
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M14.67 14.67V1.33L1.33 14.67h13.34z",
    fill: c
  }))), /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 16 16"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "3.75",
    y: "2",
    width: "8.5",
    height: "13",
    rx: "1.5",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "5.5",
    y: "0.9",
    width: "5",
    height: "2",
    rx: "0.5",
    fill: c
  }))));
}

// ─────────────────────────────────────────────────────────────
// Top app bar (Material 3 small/medium)
// ─────────────────────────────────────────────────────────────
function AndroidAppBar({
  title = 'Title',
  large = false
}) {
  const iconDot = /*#__PURE__*/React.createElement("div", {
    style: {
      width: 48,
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: MD_C.onSurfaceVar,
      opacity: 0.3
    }
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: MD_C.surface,
      padding: '4px 4px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      display: 'flex',
      alignItems: 'center',
      gap: 4
    }
  }, iconDot, !large && /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 22,
      fontWeight: 400,
      color: MD_C.onSurface,
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, title), large && /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), iconDot), large && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '16px 16px 20px',
      fontSize: 28,
      fontWeight: 400,
      color: MD_C.onSurface,
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// List item (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidListItem({
  headline,
  supporting,
  leading
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '12px 16px',
      minHeight: 56,
      boxSizing: 'border-box',
      fontFamily: 'Roboto, system-ui, sans-serif'
    }
  }, leading && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      background: MD_C.primary,
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 18,
      fontWeight: 500,
      flexShrink: 0
    }
  }, leading), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: MD_C.onSurface,
      lineHeight: '24px'
    }
  }, headline), supporting && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: MD_C.onSurfaceVar,
      lineHeight: '20px'
    }
  }, supporting)));
}

// ─────────────────────────────────────────────────────────────
// Gesture nav bar (pill)
// ─────────────────────────────────────────────────────────────
function AndroidNavBar({
  dark = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 24,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 108,
      height: 4,
      borderRadius: 2,
      background: dark ? '#fff' : MD_C.onSurface,
      opacity: 0.4
    }
  }));
}

// ─────────────────────────────────────────────────────────────
// Device frame — wraps everything
// ─────────────────────────────────────────────────────────────
function AndroidDevice({
  children,
  width = 412,
  height = 892,
  dark = false,
  title,
  large = false,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 18,
      overflow: 'hidden',
      background: dark ? '#1d1b20' : MD_C.surface,
      border: `8px solid ${MD_C.frameBorder}`,
      boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }
  }, /*#__PURE__*/React.createElement(AndroidStatusBar, {
    dark: dark
  }), title !== undefined && /*#__PURE__*/React.createElement(AndroidAppBar, {
    title: title,
    large: large
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(AndroidKeyboard, null), /*#__PURE__*/React.createElement(AndroidNavBar, {
    dark: dark
  }));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — Gboard (Material 3)
// ─────────────────────────────────────────────────────────────
function AndroidKeyboard() {
  let _k = 0;
  const key = (l, {
    flex = 1,
    bg = MD_C.surface,
    r = 6,
    minW,
    fs = 21
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: _k++,
    style: {
      height: 46,
      borderRadius: r,
      flex,
      minWidth: minW,
      background: bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Roboto, system-ui',
      fontSize: fs,
      color: MD_C.onPrimaryContainer
    }
  }, l);
  const row = (keys, style = {}) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      justifyContent: 'center',
      ...style
    }
  }, keys.map(l => key(l)));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: MD_C.inverseOnSurface,
      padding: '0 8px 8px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], {
    padding: '0 20px'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, key('', {
    bg: MD_C.surfaceVariant
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      flex: 7,
      minWidth: 274
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l))), key('', {
    bg: MD_C.surfaceVariant
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6
    }
  }, key('?123', {
    bg: MD_C.secondaryContainer,
    r: 100,
    minW: 58,
    fs: 14
  }), key(',', {
    bg: MD_C.surfaceVariant
  }), key('', {
    flex: 3,
    minW: 154
  }), key('.', {
    bg: MD_C.surfaceVariant
  }), key('', {
    bg: MD_C.primaryFixedDim,
    r: 100,
    minW: 58
  }))));
}
Object.assign(window, {
  AndroidDevice,
  AndroidStatusBar,
  AndroidAppBar,
  AndroidListItem,
  AndroidNavBar,
  AndroidKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/android-frame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mobile/ios-frame.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// iOS.jsx — Simplified iOS 26 (Liquid Glass) device frame
// Based on the iOS 26 UI Kit + Figma status bar spec. No assets, no deps.
// Exports (to window): IOSDevice, IOSStatusBar, IOSNavBar, IOSGlassPill, IOSList, IOSListRow, IOSKeyboard
//
// Usage — wrap your screen content in <IOSDevice> to get the bezel, status bar
// and home indicator (props: title, dark, keyboard):
//
//   <IOSDevice title="Settings">
//     ...your screen content...
//   </IOSDevice>
//   <IOSDevice dark title="Search" keyboard>…</IOSDevice>
/* END USAGE */

// ─────────────────────────────────────────────────────────────
// Status bar
// ─────────────────────────────────────────────────────────────
function IOSStatusBar({
  dark = false,
  time = '9:41'
}) {
  const c = dark ? '#fff' : '#000';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 154,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '21px 24px 19px',
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 20,
      width: '100%'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 1.5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: '-apple-system, "SF Pro", system-ui',
      fontWeight: 590,
      fontSize: 17,
      lineHeight: '22px',
      color: c
    }
  }, time)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingTop: 1,
      paddingRight: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "19",
    height: "12",
    viewBox: "0 0 19 12"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "7.5",
    width: "3.2",
    height: "4.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.8",
    y: "5",
    width: "3.2",
    height: "7",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.6",
    y: "2.5",
    width: "3.2",
    height: "9.5",
    rx: "0.7",
    fill: c
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.4",
    y: "0",
    width: "3.2",
    height: "12",
    rx: "0.7",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "12",
    viewBox: "0 0 17 12"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z",
    fill: c
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "8.5",
    cy: "10.5",
    r: "1.5",
    fill: c
  })), /*#__PURE__*/React.createElement("svg", {
    width: "27",
    height: "13",
    viewBox: "0 0 27 13"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.5",
    y: "0.5",
    width: "23",
    height: "12",
    rx: "3.5",
    stroke: c,
    strokeOpacity: "0.35",
    fill: "none"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "2",
    width: "20",
    height: "9",
    rx: "2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z",
    fill: c,
    fillOpacity: "0.4"
  }))));
}

// ─────────────────────────────────────────────────────────────
// Liquid glass pill — blur + tint + shine
// ─────────────────────────────────────────────────────────────
function IOSGlassPill({
  children,
  dark = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      minWidth: 44,
      borderRadius: 9999,
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: dark ? '0 2px 6px rgba(0,0,0,0.35), 0 6px 16px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.07), 0 3px 10px rgba(0,0,0,0.06)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.28)' : 'rgba(255,255,255,0.5)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 9999,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15), inset -1px -1px 1px rgba(255,255,255,0.08)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      padding: '0 4px'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Navigation bar — glass pills + large title
// ─────────────────────────────────────────────────────────────
function IOSNavBar({
  title = 'Title',
  dark = false,
  trailingIcon = true
}) {
  const muted = dark ? 'rgba(255,255,255,0.6)' : '#404040';
  const text = dark ? '#fff' : '#000';
  const pillIcon = content => /*#__PURE__*/React.createElement(IOSGlassPill, {
    dark: dark
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, content));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      paddingTop: 62,
      paddingBottom: 10,
      position: 'relative',
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }
  }, pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "20",
    viewBox: "0 0 12 20",
    fill: "none",
    style: {
      marginLeft: -1
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M10 2L2 10l8 8",
    stroke: muted,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), trailingIcon && pillIcon(/*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "6",
    viewBox: "0 0 22 6"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "3",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "3",
    r: "2.5",
    fill: muted
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "3",
    r: "2.5",
    fill: muted
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 16px',
      fontFamily: '-apple-system, system-ui',
      fontSize: 34,
      fontWeight: 700,
      lineHeight: '41px',
      color: text,
      letterSpacing: 0.4
    }
  }, title));
}

// ─────────────────────────────────────────────────────────────
// Grouped list (inset card, r:26) + row (52px)
// ─────────────────────────────────────────────────────────────
function IOSListRow({
  title,
  detail,
  icon,
  chevron = true,
  isLast = false,
  dark = false
}) {
  const text = dark ? '#fff' : '#000';
  const sec = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const ter = dark ? 'rgba(235,235,245,0.3)' : 'rgba(60,60,67,0.3)';
  const sep = dark ? 'rgba(84,84,88,0.65)' : 'rgba(60,60,67,0.12)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      minHeight: 52,
      padding: '0 16px',
      position: 'relative',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      letterSpacing: -0.43
    }
  }, icon && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 30,
      height: 30,
      borderRadius: 7,
      background: icon,
      marginRight: 12,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      color: text
    }
  }, title), detail && /*#__PURE__*/React.createElement("span", {
    style: {
      color: sec,
      marginRight: 6
    }
  }, detail), chevron && /*#__PURE__*/React.createElement("svg", {
    width: "8",
    height: "14",
    viewBox: "0 0 8 14",
    style: {
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M1 1l6 6-6 6",
    stroke: ter,
    strokeWidth: "2",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })), !isLast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      left: icon ? 58 : 16,
      height: 0.5,
      background: sep
    }
  }));
}
function IOSList({
  header,
  children,
  dark = false
}) {
  const hc = dark ? 'rgba(235,235,245,0.6)' : 'rgba(60,60,67,0.6)';
  const bg = dark ? '#1C1C1E' : '#fff';
  return /*#__PURE__*/React.createElement("div", null, header && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: '-apple-system, system-ui',
      fontSize: 13,
      color: hc,
      textTransform: 'uppercase',
      padding: '8px 36px 6px',
      letterSpacing: -0.08
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      background: bg,
      borderRadius: 26,
      margin: '0 16px',
      overflow: 'hidden'
    }
  }, children));
}

// ─────────────────────────────────────────────────────────────
// Device frame
// ─────────────────────────────────────────────────────────────
function IOSDevice({
  children,
  width = 402,
  height = 874,
  dark = false,
  title,
  keyboard = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      borderRadius: 48,
      overflow: 'hidden',
      position: 'relative',
      background: dark ? '#000' : '#F2F2F7',
      boxShadow: '0 40px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.12)',
      fontFamily: '-apple-system, system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 11,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 126,
      height: 37,
      borderRadius: 24,
      background: '#000',
      zIndex: 50
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10
    }
  }, /*#__PURE__*/React.createElement(IOSStatusBar, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }
  }, title !== undefined && /*#__PURE__*/React.createElement(IOSNavBar, {
    title: title,
    dark: dark
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflow: 'auto'
    }
  }, children), keyboard && /*#__PURE__*/React.createElement(IOSKeyboard, {
    dark: dark
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 60,
      height: 34,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingBottom: 8,
      pointerEvents: 'none'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 139,
      height: 5,
      borderRadius: 100,
      background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.25)'
    }
  })));
}

// ─────────────────────────────────────────────────────────────
// Keyboard — iOS 26 liquid glass
// ─────────────────────────────────────────────────────────────
function IOSKeyboard({
  dark = false
}) {
  const glyph = dark ? 'rgba(255,255,255,0.7)' : '#595959';
  const sugg = dark ? 'rgba(255,255,255,0.6)' : '#333';
  const keyBg = dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.85)';

  // special-key icons
  const icons = {
    shift: /*#__PURE__*/React.createElement("svg", {
      width: "19",
      height: "17",
      viewBox: "0 0 19 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M9.5 1L1 9.5h4.5V16h8V9.5H18L9.5 1z",
      fill: glyph
    })),
    del: /*#__PURE__*/React.createElement("svg", {
      width: "23",
      height: "17",
      viewBox: "0 0 23 17"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M7 1h13a2 2 0 012 2v11a2 2 0 01-2 2H7l-6-7.5L7 1z",
      fill: "none",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinejoin: "round"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M10 5l7 7M17 5l-7 7",
      stroke: glyph,
      strokeWidth: "1.6",
      strokeLinecap: "round"
    })),
    ret: /*#__PURE__*/React.createElement("svg", {
      width: "20",
      height: "14",
      viewBox: "0 0 20 14"
    }, /*#__PURE__*/React.createElement("path", {
      d: "M18 1v6H4m0 0l4-4M4 7l4 4",
      fill: "none",
      stroke: "#fff",
      strokeWidth: "1.8",
      strokeLinecap: "round",
      strokeLinejoin: "round"
    }))
  };
  const key = (content, {
    w,
    flex,
    ret,
    fs = 25,
    k
  } = {}) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      height: 42,
      borderRadius: 8.5,
      flex: flex ? 1 : undefined,
      width: w,
      minWidth: 0,
      background: ret ? '#08f' : keyBg,
      boxShadow: '0 1px 0 rgba(0,0,0,0.075)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, "SF Compact", system-ui',
      fontSize: fs,
      fontWeight: 458,
      color: ret ? '#fff' : glyph
    }
  }, content);
  const row = (keys, pad = 0) => /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      justifyContent: 'center',
      padding: `0 ${pad}px`
    }
  }, keys.map(l => key(l, {
    flex: true,
    k: l
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 15,
      borderRadius: 27,
      overflow: 'hidden',
      padding: '11px 0 2px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: dark ? '0 -2px 20px rgba(0,0,0,0.09)' : '0 -1px 6px rgba(0,0,0,0.018), 0 -3px 20px rgba(0,0,0,0.012)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      background: dark ? 'rgba(120,120,128,0.14)' : 'rgba(255,255,255,0.25)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 27,
      boxShadow: dark ? 'inset 1.5px 1.5px 1px rgba(255,255,255,0.15)' : 'inset 1.5px 1.5px 1px rgba(255,255,255,0.7), inset -1px -1px 1px rgba(255,255,255,0.4)',
      border: dark ? '0.5px solid rgba(255,255,255,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
      pointerEvents: 'none'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 20,
      alignItems: 'center',
      padding: '8px 22px 13px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, ['"The"', 'the', 'to'].map((w, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 1,
      height: 25,
      background: '#ccc',
      opacity: 0.3
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      textAlign: 'center',
      fontFamily: '-apple-system, system-ui',
      fontSize: 17,
      color: sugg,
      letterSpacing: -0.43,
      lineHeight: '22px'
    }
  }, w)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 13,
      padding: '0 6.5px',
      width: '100%',
      boxSizing: 'border-box',
      position: 'relative'
    }
  }, row(['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']), row(['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'], 20), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 14.25,
      alignItems: 'center'
    }
  }, key(icons.shift, {
    w: 45,
    k: 'shift'
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6.5,
      flex: 1
    }
  }, ['z', 'x', 'c', 'v', 'b', 'n', 'm'].map(l => key(l, {
    flex: true,
    k: l
  }))), key(icons.del, {
    w: 45,
    k: 'del'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 6,
      alignItems: 'center'
    }
  }, key('ABC', {
    w: 92.25,
    fs: 18,
    k: 'abc'
  }), key('', {
    flex: true,
    k: 'space'
  }), key(icons.ret, {
    w: 92.25,
    ret: true,
    k: 'ret'
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 56,
      width: '100%',
      position: 'relative'
    }
  }));
}
Object.assign(window, {
  IOSDevice,
  IOSStatusBar,
  IOSNavBar,
  IOSGlassPill,
  IOSList,
  IOSListRow,
  IOSKeyboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mobile/ios-frame.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/DetailScreen.jsx
try { (() => {
const React = window.React;
const {
  PropertyGallery,
  AppointmentWidget,
  AgentCard,
  Badge,
  Button,
  Breadcrumb,
  Icon,
  MapPanel,
  IconButton
} = window.ChiyaEstateDesignSystem_686f57;
function SpecChip({
  icon,
  value,
  label
}) {
  return React.createElement("div", {
    className: "cxk-spec"
  }, React.createElement("span", {
    className: "cxk-spec__ic"
  }, React.createElement(Icon, {
    name: icon,
    size: 20
  })), React.createElement("div", null, React.createElement("div", {
    className: "cxk-spec__v"
  }, value), React.createElement("div", {
    className: "cxk-spec__l"
  }, label)));
}
function DetailScreen({
  id,
  onBack
}) {
  const l = window.CX_DATA.byId(id) || window.CX_DATA.listings[0];
  const [d, setD] = React.useState(1);
  const [t, setT] = React.useState(2);
  const features = ["Infinity pool", "Private cinema", "Smart home", "2-car garage", "Marble kitchen", "Mountain views", "Solar power", "24/7 security"];
  return React.createElement("div", {
    className: "cxk-container cxk-detail"
  }, React.createElement("div", {
    className: "cxk-detail__top"
  }, React.createElement(Breadcrumb, {
    items: [{
      label: "Home"
    }, {
      label: "Erbil"
    }, {
      label: l.title
    }]
  }), React.createElement(Button, {
    hierarchy: "tertiary",
    iconLeading: "arrow-left",
    onClick: onBack
  }, "Back to results")), React.createElement(PropertyGallery, {
    images: l.gallery,
    status: l.status
  }), React.createElement("div", {
    className: "cxk-detail__grid"
  }, React.createElement("div", {
    className: "cxk-detail__main"
  }, React.createElement("div", {
    className: "cxk-detail__titlerow"
  }, React.createElement("div", null, React.createElement("h1", {
    className: "cxk-detail__title"
  }, l.title), React.createElement("div", {
    className: "cxk-detail__addr"
  }, React.createElement(Icon, {
    name: "map-pin",
    size: 16
  }), l.address)), React.createElement("div", {
    className: "cxk-detail__price"
  }, l.price, l.period && React.createElement("small", null, " /" + l.period))), React.createElement("div", {
    className: "cxk-detail__badges"
  }, React.createElement(Badge, {
    variant: "success",
    dot: true
  }, l.status), l.featured && React.createElement(Badge, {
    variant: "gold",
    icon: "star"
  }, "Featured"), React.createElement(Badge, {
    variant: "brand",
    icon: "badge-check"
  }, "Verified listing")), React.createElement("div", {
    className: "cxk-specstrip"
  }, React.createElement(SpecChip, {
    icon: "bed-double",
    value: l.beds,
    label: "Bedrooms"
  }), React.createElement(SpecChip, {
    icon: "bath",
    value: l.baths,
    label: "Bathrooms"
  }), React.createElement(SpecChip, {
    icon: "maximize-2",
    value: l.area + " m²",
    label: "Built area"
  }), React.createElement(SpecChip, {
    icon: "home",
    value: l.type,
    label: "Property"
  })), React.createElement("section", {
    className: "cxk-detail__block"
  }, React.createElement("h3", null, "About this home"), React.createElement("p", null, l.desc)), React.createElement("section", {
    className: "cxk-detail__block"
  }, React.createElement("h3", null, "Features & amenities"), React.createElement("div", {
    className: "cxk-features"
  }, features.map(f => React.createElement("div", {
    key: f,
    className: "cxk-feature"
  }, React.createElement(Icon, {
    name: "check",
    size: 16
  }), f)))), React.createElement("section", {
    className: "cxk-detail__block"
  }, React.createElement("h3", null, "Location"), React.createElement(MapPanel, {
    height: 300,
    areaLabel: l.address,
    pins: [{
      x: 50,
      y: 48,
      price: l.price,
      active: true
    }]
  }))), React.createElement("aside", {
    className: "cxk-detail__side"
  }, React.createElement(AppointmentWidget, {
    price: l.price,
    period: l.period,
    estimate: "Est. $3,980/mo · 20% down",
    dates: [{
      dow: "Fri",
      day: 13
    }, {
      dow: "Sat",
      day: 14
    }, {
      dow: "Sun",
      day: 15
    }, {
      dow: "Mon",
      day: 16
    }],
    times: [{
      label: "9:00"
    }, {
      label: "11:00"
    }, {
      label: "2:00"
    }, {
      label: "3:30",
      off: true
    }, {
      label: "5:00"
    }, {
      label: "6:30"
    }],
    selectedDate: d,
    selectedTime: t,
    onSelectDate: setD,
    onSelectTime: setT,
    agent: l.agent
  }), React.createElement(AgentCard, {
    ...l.agent,
    layout: "stack"
  }))));
}
window.DetailScreen = DetailScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/DetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/HomeScreen.jsx
try { (() => {
const React = window.React;
const {
  SearchBar,
  PropertyCard,
  FeaturedPropertyCard,
  AgentCard,
  Badge,
  Button,
  Icon
} = window.ChiyaEstateDesignSystem_686f57;
function HomeHero({
  onSearch
}) {
  return React.createElement("section", {
    className: "cxk-hero"
  }, React.createElement("div", {
    className: "cxk-hero__bg"
  }), React.createElement("div", {
    className: "cxk-hero__grad"
  }), React.createElement("div", {
    className: "cxk-hero__inner"
  }, React.createElement(Badge, {
    variant: "gold",
    size: "lg",
    icon: "sparkles"
  }, "Kurdistan's luxury home network"), React.createElement("h1", {
    className: "cxk-hero__title"
  }, "Find your place\nin Kurdistan"), React.createElement("p", {
    className: "cxk-hero__sub"
  }, "Hand-picked villas, apartments, and estates across Erbil, Duhok, and Sulaymaniyah — every listing shown by a verified Chiya agent."), React.createElement("div", {
    className: "cxk-hero__search"
  }, React.createElement(SearchBar, {
    onSearch
  })), React.createElement("div", {
    className: "cxk-hero__trust"
  }, [["shield-check", "Verified agents only"], ["badge-check", "ID-checked listings"], ["calendar-check", "Viewings in 24h"]].map(([ic, t]) => React.createElement("span", {
    key: t,
    className: "cxk-trust"
  }, React.createElement(Icon, {
    name: ic,
    size: 16
  }), t)))));
}
function SectionHead({
  eyebrow,
  title,
  action,
  onAction
}) {
  return React.createElement("div", {
    className: "cxk-sechead"
  }, React.createElement("div", null, eyebrow && React.createElement("div", {
    className: "cx-eyebrow"
  }, eyebrow), React.createElement("h2", {
    className: "cxk-sectitle"
  }, title)), action && React.createElement(Button, {
    hierarchy: "tertiary",
    iconTrailing: "arrow-right",
    onClick: onAction
  }, action));
}
function HomeScreen({
  onOpen,
  onSearch
}) {
  const data = window.CX_DATA;
  const featured = data.byId("olive-grove");
  const grid = data.listings.filter(l => l.id !== "olive-grove").slice(0, 6);
  const agents = [data.agents.lana, data.agents.daban, data.agents.shene, data.agents.aram];
  return React.createElement("div", null, React.createElement(HomeHero, {
    onSearch
  }), React.createElement("div", {
    className: "cxk-container"
  }, React.createElement("section", {
    className: "cxk-section"
  }, React.createElement(SectionHead, {
    eyebrow: "Featured",
    title: "This week's signature listing"
  }), React.createElement(FeaturedPropertyCard, {
    image: featured.cover,
    thumbs: featured.gallery.slice(1, 6),
    price: featured.price,
    title: featured.title,
    address: featured.address,
    beds: featured.beds,
    baths: featured.baths,
    area: featured.area,
    description: featured.desc,
    agent: featured.agent,
    actions: React.createElement(React.Fragment, null, React.createElement(Button, {
      hierarchy: "secondary",
      size: "sm",
      iconLeading: "calendar"
    }, "Tour"), React.createElement(Button, {
      hierarchy: "primary",
      size: "sm",
      onClick: () => onOpen(featured.id)
    }, "View details"))
  })), React.createElement("section", {
    className: "cxk-section"
  }, React.createElement(SectionHead, {
    eyebrow: "Browse",
    title: "Homes you'll love",
    action: "See all homes",
    onAction: () => onSearch && onSearch()
  }), React.createElement("div", {
    className: "cxk-grid3"
  }, grid.map(l => React.createElement(PropertyCard, {
    key: l.id,
    image: l.cover,
    price: l.price,
    period: l.period,
    title: l.title,
    address: l.address,
    beds: l.beds,
    baths: l.baths,
    area: l.area,
    status: l.status,
    featured: l.featured,
    photoCount: l.photoCount,
    onClick: () => onOpen(l.id),
    style: {
      cursor: "pointer"
    }
  })))), React.createElement("section", {
    className: "cxk-section"
  }, React.createElement(SectionHead, {
    eyebrow: "Concierge",
    title: "Meet our verified agents",
    action: "All agents"
  }), React.createElement("div", {
    className: "cxk-grid4"
  }, agents.map(a => React.createElement(AgentCard, {
    key: a.name,
    ...a
  }))))), React.createElement("section", {
    className: "cxk-cta"
  }, React.createElement("div", {
    className: "cxk-cta__inner"
  }, React.createElement("h2", {
    className: "cxk-cta__title"
  }, "Own a home worth showing?"), React.createElement("p", {
    className: "cxk-cta__sub"
  }, "List with Chiya and reach serious, pre-qualified buyers — guided by a verified agent from listing to keys."), React.createElement("div", {
    className: "cxk-cta__actions"
  }, React.createElement(Button, {
    hierarchy: "accent",
    size: "xl",
    iconLeading: "key"
  }, "List your property"), React.createElement(Button, {
    hierarchy: "secondary",
    size: "xl"
  }, "Talk to an agent")))));
}
window.HomeScreen = HomeScreen;
window.CxSectionHead = SectionHead;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/ListingsScreen.jsx
try { (() => {
const React = window.React;
const {
  SearchBar,
  SearchFilters,
  PropertyCard,
  MapPanel,
  Tabs,
  Select,
  Icon,
  Breadcrumb
} = window.ChiyaEstateDesignSystem_686f57;
function ListingsScreen({
  onOpen
}) {
  const data = window.CX_DATA;
  const [view, setView] = React.useState("split");
  const [active, setActive] = React.useState(0);
  const [tags, setTags] = React.useState(["Villa", "Apartment", "$300k–$1.5M"]);
  const list = data.listings;
  const pins = [{
    x: 26,
    y: 40,
    price: "$620k",
    active: active === 0
  }, {
    x: 54,
    y: 30,
    price: "$285k",
    active: active === 1
  }, {
    x: 70,
    y: 58,
    price: "$1.2M",
    active: active === 2
  }, {
    x: 40,
    y: 66,
    price: "$1,850",
    active: active === 3
  }, {
    x: 80,
    y: 38,
    price: "$430k",
    active: active === 4
  }, {
    x: 60,
    y: 74,
    price: "$2,800",
    active: active === 5
  }];
  return React.createElement("div", {
    className: "cxk-listings"
  }, React.createElement("div", {
    className: "cxk-listings__bar"
  }, React.createElement("div", {
    className: "cxk-listings__searchwrap"
  }, React.createElement(SearchBar, {})), React.createElement(SearchFilters, {
    filters: [{
      label: "Price",
      icon: "wallet"
    }, {
      label: "Beds & Baths",
      icon: "bed-double"
    }, {
      label: "Property type",
      icon: "home",
      active: true,
      count: 2
    }, {
      label: "Verified only",
      icon: "badge-check",
      dropdown: false,
      active: true
    }, {
      label: "More filters",
      icon: "sliders-horizontal"
    }],
    activeTags: tags,
    onRemoveTag: t => setTags(p => p.filter(x => x !== t)),
    onClear: () => setTags([])
  })), React.createElement("div", {
    className: "cxk-listings__head"
  }, React.createElement("div", null, React.createElement(Breadcrumb, {
    items: [{
      label: "Home"
    }, {
      label: "Erbil"
    }, {
      label: "Homes for sale"
    }]
  }), React.createElement("h1", {
    className: "cxk-listings__title"
  }, "Homes in Erbil ", React.createElement("span", null, "· 124 results"))), React.createElement("div", {
    className: "cxk-listings__tools"
  }, React.createElement(Select, {
    defaultValue: "relevance",
    options: [{
      value: "relevance",
      label: "Sort: Recommended"
    }, {
      value: "low",
      label: "Price: Low to high"
    }, {
      value: "high",
      label: "Price: High to low"
    }, {
      value: "new",
      label: "Newest first"
    }]
  }), React.createElement(Tabs, {
    variant: "seg",
    value: view,
    onChange: setView,
    items: [{
      value: "grid",
      label: "Grid",
      icon: "layout-grid"
    }, {
      value: "split",
      label: "Split",
      icon: "columns-2"
    }, {
      value: "map",
      label: "Map",
      icon: "map"
    }]
  }))), React.createElement("div", {
    className: "cxk-listings__body cxk-listings__body--" + view
  }, view !== "map" && React.createElement("div", {
    className: "cxk-listings__results"
  }, React.createElement("div", {
    className: view === "split" ? "cxk-grid2" : "cxk-grid3"
  }, list.map((l, i) => React.createElement(PropertyCard, {
    key: l.id,
    image: l.cover,
    price: l.price,
    period: l.period,
    title: l.title,
    address: l.address,
    beds: l.beds,
    baths: l.baths,
    area: l.area,
    status: l.status,
    featured: l.featured,
    photoCount: l.photoCount,
    onClick: () => onOpen(l.id),
    onMouseEnter: () => setActive(i),
    style: {
      cursor: "pointer"
    }
  })))), view !== "grid" && React.createElement("div", {
    className: "cxk-listings__map"
  }, React.createElement(MapPanel, {
    pins,
    areaLabel: "Erbil · 124 homes",
    height: "100%",
    onPin: (p, i) => {
      setActive(i);
      onOpen(list[i].id);
    }
  }))));
}
window.ListingsScreen = ListingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/ListingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteFooter.jsx
try { (() => {
const React = window.React;
const {
  Icon,
  Wordmark
} = window.ChiyaEstateDesignSystem_686f57;
function SiteFooter() {
  const cols = [{
    h: "Explore",
    items: ["Buy", "Rent", "New projects", "Sold prices", "Neighborhoods"]
  }, {
    h: "For owners",
    items: ["List a property", "Pricing", "Agent program", "Valuations"]
  }, {
    h: "Company",
    items: ["About Chiya", "Verified agents", "Careers", "Press", "Contact"]
  }];
  return React.createElement("footer", {
    className: "cxk-footer"
  }, React.createElement("div", {
    className: "cxk-footer__inner"
  }, React.createElement("div", {
    className: "cxk-footer__brand"
  }, React.createElement(Wordmark, {
    logoSrc: "../../assets/chiya-logomark.svg"
  }), React.createElement("p", null, "Luxury homes across the Kurdistan Region of Iraq — connecting you with verified agents and exceptional properties."), React.createElement("div", {
    className: "cxk-footer__social"
  }, ["instagram", "facebook", "twitter", "youtube"].map(n => React.createElement("a", {
    key: n,
    href: "#",
    "aria-label": n
  }, React.createElement(Icon, {
    name: n,
    size: 18
  }))))), React.createElement("div", {
    className: "cxk-footer__cols"
  }, cols.map(c => React.createElement("div", {
    key: c.h,
    className: "cxk-footer__col"
  }, React.createElement("h4", null, c.h), c.items.map(i => React.createElement("a", {
    key: i,
    href: "#"
  }, i)))))), React.createElement("div", {
    className: "cxk-footer__bar"
  }, React.createElement("span", null, "© 2026 Chiya Estate. All rights reserved."), React.createElement("div", {
    className: "cxk-footer__legal"
  }, React.createElement("a", {
    href: "#"
  }, "Privacy"), React.createElement("a", {
    href: "#"
  }, "Terms"), React.createElement("a", {
    href: "#"
  }, "Cookies"))));
}
window.SiteFooter = SiteFooter;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteFooter.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteHeader.jsx
try { (() => {
const React = window.React;
const {
  Navbar,
  Button,
  IconButton
} = window.ChiyaEstateDesignSystem_686f57;
function SiteHeader({
  active = "buy",
  onNav,
  onList
}) {
  const links = [{
    label: "Buy",
    active: active === "buy"
  }, {
    label: "Rent",
    active: active === "rent"
  }, {
    label: "New Projects"
  }, {
    label: "Agents"
  }, {
    label: "Sell"
  }];
  return React.createElement("div", {
    className: "cxk-header",
    onClick: e => {
      const a = e.target.closest(".cx-navlink, .cx-brand");
      if (!a || !onNav) return;
      const label = (a.textContent || "").trim();
      if (a.classList.contains("cx-brand") || label.startsWith("Buy")) {
        e.preventDefault();
        onNav("home");
      }
    }
  }, React.createElement(Navbar, {
    logoSrc: "../../assets/chiya-logomark.svg",
    links,
    actions: React.createElement(React.Fragment, null, React.createElement(IconButton, {
      icon: "heart",
      label: "Saved",
      variant: "ghost"
    }), React.createElement(Button, {
      hierarchy: "tertiary",
      size: "sm"
    }, "Sign in"), React.createElement(Button, {
      hierarchy: "primary",
      size: "sm",
      iconLeading: "plus",
      onClick: onList
    }, "List property"))
  }));
}
window.SiteHeader = SiteHeader;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/data.js
try { (() => {
// Shared demo data for the Chiya Estate website UI kit.
window.CX_DATA = function () {
  const img = (id, w = 800, h = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop`;
  const agents = {
    lana: {
      name: "Lana Hassan",
      agency: "Chiya Premier",
      verified: true,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop",
      rating: 4.9,
      reviews: 128,
      listings: 42,
      sales: 210,
      experience: 9
    },
    daban: {
      name: "Daban Ali",
      agency: "Chiya Premier",
      verified: true,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop",
      rating: 4.8,
      reviews: 96,
      listings: 31,
      sales: 175,
      experience: 7
    },
    shene: {
      name: "Shene Karim",
      agency: "Erbil Estates",
      verified: true,
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop",
      rating: 5.0,
      reviews: 64,
      listings: 18,
      sales: 120,
      experience: 5
    },
    aram: {
      name: "Aram Botani",
      agency: "Chiya Premier",
      verified: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop",
      rating: 4.7,
      reviews: 73,
      listings: 24,
      sales: 140,
      experience: 6
    }
  };
  const listings = [{
    id: "marble-hill",
    title: "Marble Hill Villa",
    address: "Ankawa, Erbil",
    price: "$620,000",
    priceNum: 620000,
    status: "For Sale",
    featured: true,
    beds: 4,
    baths: 3,
    area: 420,
    type: "Villa",
    photoCount: 28,
    agent: agents.daban,
    cover: img("1613977257363-707ba9348227", 1000, 750),
    gallery: ["1613977257363-707ba9348227", "1600596542815-ffad4c1539a9", "1600585154340-be6161a56a0c", "1600210492493-0946911123ea", "1600607687939-ce8a6c25118c", "1600566753086-00f18fb6b3ea", "1600573472550-8090b5e0745e"].map(i => img(i, 1000, 700)),
    desc: "A crown-jewel residence framed by olive terraces and panoramic mountain views — handcrafted stonework, an infinity pool, private cinema, and a chef's kitchen finished in Iraqi marble."
  }, {
    id: "cedar-court",
    title: "Cedar Court 4B",
    address: "Dream City, Erbil",
    price: "$285,000",
    priceNum: 285000,
    status: "For Sale",
    beds: 2,
    baths: 2,
    area: 130,
    type: "Apartment",
    photoCount: 16,
    agent: agents.lana,
    cover: img("1545324418-cc1a3fa10c00"),
    gallery: ["1545324418-cc1a3fa10c00", "1502672260266-1c1ef2d93688", "1493809842364-78817add7ffb", "1556912172-45b7abe8b7e1"].map(i => img(i, 1000, 700)),
    desc: "Light-filled corner apartment in Dream City with floor-to-ceiling glazing, a wraparound balcony, and concierge service."
  }, {
    id: "olive-grove",
    title: "Olive Grove Estate",
    address: "Shaqlawa Hills",
    price: "$1,240,000",
    priceNum: 1240000,
    status: "For Sale",
    featured: true,
    beds: 6,
    baths: 5,
    area: 680,
    type: "Villa",
    photoCount: 34,
    agent: agents.daban,
    cover: img("1613490493576-7fde63acd811"),
    gallery: ["1613490493576-7fde63acd811", "1600047509807-ba8f99d2cdde", "1600573472592-401b489a3cdc", "1600121848594-d8644e57abab"].map(i => img(i, 1000, 700)),
    desc: "Set above Shaqlawa's olive terraces — a stone-clad estate with mountain panoramas, infinity pool, and a private orchard."
  }, {
    id: "park-residence",
    title: "Park Residence 12",
    address: "Italian Village, Erbil",
    price: "$1,850",
    priceNum: 1850,
    period: "mo",
    status: "For Rent",
    beds: 2,
    baths: 2,
    area: 115,
    type: "Apartment",
    photoCount: 12,
    agent: agents.shene,
    cover: img("1502672260266-1c1ef2d93688"),
    gallery: ["1502672260266-1c1ef2d93688", "1493809842364-78817add7ffb", "1554995207-c18c203602cb"].map(i => img(i, 1000, 700)),
    desc: "Fully furnished two-bed in the Italian Village with resort amenities, 24/7 security, and walkable cafés."
  }, {
    id: "garden-townhouse",
    title: "Garden Townhouse",
    address: "Empire City, Erbil",
    price: "$430,000",
    priceNum: 430000,
    status: "For Sale",
    beds: 3,
    baths: 3,
    area: 240,
    type: "Townhouse",
    photoCount: 20,
    agent: agents.aram,
    cover: img("1568605114967-8130f3a36994"),
    gallery: ["1568605114967-8130f3a36994", "1600585154526-990dced4db0d", "1600566752355-35792bedcfea"].map(i => img(i, 1000, 700)),
    desc: "Three-storey townhouse with a private garden, double garage, and rooftop terrace in gated Empire City."
  }, {
    id: "skyline-penthouse",
    title: "Skyline Penthouse",
    address: "Downtown, Erbil",
    price: "$2,800",
    priceNum: 2800,
    period: "mo",
    status: "For Rent",
    beds: 3,
    baths: 3,
    area: 210,
    type: "Penthouse",
    photoCount: 24,
    agent: agents.lana,
    cover: img("1600607687939-ce8a6c25118c"),
    gallery: ["1600607687939-ce8a6c25118c", "1600566753086-00f18fb6b3ea", "1600573472550-8090b5e0745e"].map(i => img(i, 1000, 700)),
    desc: "A glass-wrapped penthouse over the Erbil skyline with a private terrace, smart-home system, and citadel views."
  }];
  return {
    agents,
    listings,
    byId: id => listings.find(l => l.id === id)
  };
}();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.AnalyticsCard = __ds_scope.AnalyticsCard;

__ds_ns.ApprovalCard = __ds_scope.ApprovalCard;

__ds_ns.Sparkline = __ds_scope.Sparkline;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.AvatarGroup = __ds_scope.AvatarGroup;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Wordmark = __ds_scope.Wordmark;

__ds_ns.Navbar = __ds_scope.Navbar;

__ds_ns.Breadcrumb = __ds_scope.Breadcrumb;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.AgentCard = __ds_scope.AgentCard;

__ds_ns.AppointmentWidget = __ds_scope.AppointmentWidget;

__ds_ns.FeaturedPropertyCard = __ds_scope.FeaturedPropertyCard;

__ds_ns.MapPanel = __ds_scope.MapPanel;

__ds_ns.PropertyCard = __ds_scope.PropertyCard;

__ds_ns.PropertyGallery = __ds_scope.PropertyGallery;

__ds_ns.SearchBar = __ds_scope.SearchBar;

__ds_ns.SearchFilters = __ds_scope.SearchFilters;

})();
