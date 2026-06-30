/* ==================================================================
   Notice — Chiya Estate design-system component  ·  feedback/
   ------------------------------------------------------------------
   Inline callout / banner for status messages and contextual guidance.
   Token-driven, six semantic variants, optional icon + title.

   Usage:
     const { Notice } = window.ChiyaEstateDesignSystem_686f57;
     <Notice variant="gold" icon="shield-check" title="Submitted for review">
       Its status becomes <b>Pending approval</b> until an admin approves it.
     </Notice>

   Props:
     variant : "gold" | "brand" | "info" | "success" | "warning" | "error"  (default "gold")
     icon    : Lucide icon name. Omit to use the variant's default; pass null to hide.
     title   : optional bold heading line
     children: body copy (supports <b> for inline emphasis)
================================================================== */
(function () {
  const DS = window.ChiyaEstateDesignSystem_686f57;
  if (!DS) { console.warn("Notice: ChiyaEstateDesignSystem bundle not loaded"); return; }
  const { Icon } = DS;

  const VARIANTS = {
    gold:    { bg: "var(--gold-50)",    border: "var(--gold-200)",    icBg: "var(--gold-100)",    icBorder: "var(--gold-200)",    ic: "var(--gold-600)",    em: "var(--green-700)" },
    brand:   { bg: "var(--green-50)",   border: "var(--green-100)",   icBg: "var(--green-100)",   icBorder: "var(--green-200)",   ic: "var(--green-700)",   em: "var(--green-700)" },
    info:    { bg: "var(--info-50)",    border: "var(--info-100)",    icBg: "var(--info-100)",    icBorder: "var(--info-100)",    ic: "var(--info-600)",    em: "var(--info-700)" },
    success: { bg: "var(--success-50)", border: "var(--success-100)", icBg: "var(--success-100)", icBorder: "var(--success-100)", ic: "var(--success-600)", em: "var(--success-700)" },
    warning: { bg: "var(--warning-50)", border: "var(--warning-100)", icBg: "var(--warning-100)", icBorder: "var(--warning-100)", ic: "var(--warning-600)", em: "var(--warning-700)" },
    error:   { bg: "var(--error-50)",   border: "var(--error-100)",   icBg: "var(--error-100)",   icBorder: "var(--error-100)",   ic: "var(--error-600)",   em: "var(--error-700)" },
  };
  const DEFAULT_ICON = {
    gold: "shield-check", brand: "info", info: "info",
    success: "circle-check", warning: "triangle-alert", error: "circle-alert",
  };

  /* inject the component's stylesheet once */
  const CSS = `
  .cx-notice {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 18px; border-radius: var(--radius-card, 16px);
    border: 1px solid var(--border-subtle);
  }
  .cx-notice__ic {
    flex: none; width: 40px; height: 40px; border-radius: var(--radius-md, 10px);
    display: flex; align-items: center; justify-content: center;
  }
  .cx-notice__body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .cx-notice__title {
    font-family: var(--font-sans); font-size: 14.5px; font-weight: 700;
    letter-spacing: -.005em; color: var(--text-primary);
  }
  .cx-notice__desc {
    font-family: var(--font-sans); font-size: 13px; line-height: 1.5;
    color: var(--text-secondary); text-wrap: pretty;
  }
  .cx-notice__desc b { font-weight: 700; color: var(--cx-em, inherit); }
  `;
  if (!document.getElementById("cx-notice-styles")) {
    const tag = document.createElement("style");
    tag.id = "cx-notice-styles";
    tag.textContent = CSS;
    document.head.appendChild(tag);
  }

  function Notice({ variant = "gold", icon, title, children, className, style }) {
    const v = VARIANTS[variant] || VARIANTS.gold;
    const name = icon === null ? null : (icon || DEFAULT_ICON[variant] || "info");
    const cls = ["cx-notice", className].filter(Boolean).join(" ");
    return React.createElement(
      "div",
      { className: cls, style: { background: v.bg, borderColor: v.border, ...style }, role: "note" },
      name && React.createElement(
        "span",
        { className: "cx-notice__ic", style: { background: v.icBg, color: v.ic, border: "1px solid " + v.icBorder } },
        React.createElement(Icon, { name: name, size: 20 })
      ),
      React.createElement(
        "div",
        { className: "cx-notice__body" },
        title && React.createElement("span", { className: "cx-notice__title" }, title),
        React.createElement("span", { className: "cx-notice__desc", style: { "--cx-em": v.em } }, children)
      )
    );
  }

  DS.Notice = Notice;
})();
