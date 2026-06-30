import type { ReactNode } from "react";

/** Content-canvas page header (Version B). */
export function AdminPageHeader({
  title,
  eyebrow,
  sub,
  actions,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="ax-page-head" style={actions ? { display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 } : undefined}>
      <div>
        {eyebrow && <div className="ax-page-head__eyebrow">{eyebrow}</div>}
        <h1 className="ax-page-head__title">{title}</h1>
        {sub && <p className="ax-page-head__sub">{sub}</p>}
      </div>
      {actions}
    </div>
  );
}
