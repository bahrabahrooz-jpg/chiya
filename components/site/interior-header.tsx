"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { AuthButton } from "./auth-button";
import "./site-header.css";

interface NavItem {
  key: string;
  href: string;
}

const NAV: NavItem[] = [
  { key: "buy", href: "/search?deal=buy" },
  { key: "rent", href: "/search?deal=rent" },
  { key: "sell", href: "#" },
  { key: "agents", href: "/agents" },
  { key: "about", href: "/about" },
  { key: "blog", href: "#" },
  { key: "contact", href: "/contact" },
];

function Brand() {
  return (
    <Link className="cxh-brand" href="/" aria-label="Chiya Estate">
      <span className="cxh-brand__mark" />
      <span className="cxh-brand__name">Chiya</span>
    </Link>
  );
}

export interface InteriorHeaderProps {
  /** Active nav key (e.g. "buy", "agents"). */
  active?: string | null;
}

/**
 * InteriorHeader — the solid, non-sticky header used across interior website
 * pages (search, property detail, agents, profile). Ported from the export's
 * `.cxh.cxh--solid` interior header.
 */
export function InteriorHeader({ active = null }: InteriorHeaderProps) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="cxh cxh--solid cxh--interior">
        <div className="cxh__inner">
          <div className="cxh__brand">
            <Brand />
          </div>
          <nav className="cxh__nav">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={"cxh__link" + (active === item.key ? " cxh__link--active" : "")}
              >
                {t("nav." + item.key)}
              </Link>
            ))}
          </nav>
          <div className="cxh__actions">
            <LanguageSwitcher />
            <ThemeToggle />
            <span className="cxh__divider" />
            <AuthButton size="sm" />
            <span className="cxh__menu">
              <IconButton icon="menu" label="Open menu" variant="ghost" onClick={() => setMenuOpen(true)} />
            </span>
          </div>
        </div>
      </header>
      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={NAV.map((item) => ({ label: t("nav." + item.key), href: item.href, active: active === item.key }))}
        header={<Brand />}
        footer={
          <>
            <AuthButton fullWidth />
            <div className="cx-mnav__row">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </>
        }
      />
    </>
  );
}
