import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import "./navbar.css";

export interface WordmarkProps {
  /** SVG mark URL (e.g. /brand/chiya-logomark.svg). Falls back to an icon. */
  logoSrc?: string;
  href?: string;
  name?: string;
  suffix?: string;
}

/** Wordmark — the Chiya Estate brand lockup (mark + name). */
export function Wordmark({ logoSrc, href = "/", name = "Chiya", suffix = "Estate" }: WordmarkProps) {
  return (
    <a className="cx-brand" href={href}>
      <span className="cx-brand__mark">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="" />
        ) : (
          <Icon name="house" size={19} strokeWidth={2} />
        )}
      </span>
      <span className="cx-brand__name">
        {name}
        <span className="cx-brand__tld">{" " + suffix}</span>
      </span>
    </a>
  );
}

export interface NavLink {
  label: string;
  href?: string;
  active?: boolean;
}
export type NavbarVariant = "default" | "transparent" | "dark";

export interface NavbarProps {
  links?: NavLink[];
  actions?: ReactNode;
  logoSrc?: string;
  variant?: NavbarVariant;
  className?: string;
}

/**
 * Navbar — global top navigation: brand, centered links, and an actions slot.
 */
export function Navbar({ links = [], actions, logoSrc, variant = "default", className = "" }: NavbarProps) {
  return (
    <nav
      className={["cx-navbar", variant !== "default" ? `cx-navbar--${variant}` : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Wordmark logoSrc={logoSrc} />
      <div className="cx-navlinks">
        {links.map((l, i) => (
          <a key={i} href={l.href || "#"} className={"cx-navlink" + (l.active ? " cx-navlink--active" : "")}>
            {l.label}
          </a>
        ))}
      </div>
      <div className="cx-navbar__spacer" />
      {actions && <div className="cx-navbar__actions">{actions}</div>}
    </nav>
  );
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** Breadcrumb — path trail; the last item renders as the current page. */
export function Breadcrumb({ items = [] }: { items?: BreadcrumbItem[] }) {
  return (
    <nav className="cx-breadcrumb" aria-label="Breadcrumb">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {last ? (
              <span className="cx-breadcrumb__cur" aria-current="page">
                {it.label}
              </span>
            ) : (
              <a href={it.href || "#"}>{it.label}</a>
            )}
            {!last && (
              <span className="cx-breadcrumb__sep">
                <Icon name="chevron-right" size={15} />
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
