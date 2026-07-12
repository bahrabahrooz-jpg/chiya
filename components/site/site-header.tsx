"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { IconButton } from "@/components/ui/icon-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { AuthButton } from "./auth-button";
import { NotificationBell } from "./notification-bell";
import "./site-header.css";

const NAV: { key: string; href: string }[] = [
  { key: "buy", href: "/search?deal=buy" },
  { key: "rent", href: "/search?deal=rent" },
  { key: "sell", href: "/my-listings" },
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

/**
 * Gate the "List your property" nav item behind authentication: listing needs an
 * account. A signed-out click opens the auth modal (and redirects to My Listings
 * after auth); a signed-in click follows the link straight to My Listings.
 * Returns a per-key onClick (undefined for ungated links).
 */
export function useSellGate() {
  const { user, openAuth } = useAuth();
  const { t } = useLang();
  return (key: string) =>
    key === "sell"
      ? (e: MouseEvent<HTMLAnchorElement>) => {
          if (user) return; // signed in → let the link navigate to /my-listings
          e.preventDefault();
          openAuth("login", { note: t("auth.gate.list"), next: "/my-listings" });
        }
      : undefined;
}

interface BarProps {
  variant: "static" | "sticky";
  show?: boolean;
  active: string | null;
  onOpenMenu: () => void;
}

function HeaderBar({ variant, show, active, onOpenMenu }: BarProps) {
  const { t } = useLang();
  const gate = useSellGate();
  const transparent = variant === "static";
  const cls =
    "cxh" +
    (variant === "sticky" ? " cxh--solid cxh--sticky" : " cxh--static") +
    (variant === "sticky" && show ? " cxh--show" : "");

  return (
    <header className={cls} aria-hidden={variant === "sticky" && !show ? "true" : undefined}>
      <div className="cxh__inner">
        <div className="cxh__brand">
          <Brand />
        </div>
        <nav className="cxh__nav">
          {NAV.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className={"cxh__link" + (active === key ? " cxh__link--active" : "")}
              onClick={gate(key)}
            >
              {t("nav." + key)}
            </Link>
          ))}
        </nav>
        <div className="cxh__actions">
          <ThemeToggle variant={transparent ? "glass" : undefined} />
          <span className="cxh__divider" />
          <LanguageSwitcher variant={transparent ? "glass" : undefined} />
          <NotificationBell variant={transparent ? "glass" : "ghost"} />
          <span className="cxh__divider" />
          <AuthButton size="sm" />
          <span className="cxh__menu">
            <IconButton
              icon="menu"
              label="Open menu"
              variant={transparent ? "glass" : "ghost"}
              onClick={onOpenMenu}
            />
          </span>
        </div>
      </div>
    </header>
  );
}

export interface SiteHeaderProps {
  /** Active nav key (e.g. "buy"). */
  active?: string | null;
  /** Element id that, once scrolled past, reveals the sticky bar. */
  stickyAfterId?: string;
}

/**
 * SiteHeader — the marketing site header: a transparent bar overlaid on the
 * hero, plus a solid bar that slides down once the page is scrolled past the
 * featured section. Faithful recreation of the export's dual-header.
 */
export function SiteHeader({ active = null, stickyAfterId = "properties" }: SiteHeaderProps) {
  const { t } = useLang();
  const gate = useSellGate();
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const headerH = 84;
    const onScroll = () => {
      const target = document.getElementById(stickyAfterId);
      const reached = target ? target.getBoundingClientRect().top <= headerH : window.scrollY > 600;
      setStuck(reached);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [stickyAfterId]);

  return (
    <>
      <HeaderBar variant="static" active={active} onOpenMenu={() => setMenuOpen(true)} />
      <HeaderBar variant="sticky" show={stuck} active={active} onOpenMenu={() => setMenuOpen(true)} />
      <MobileNav
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        links={NAV.map(({ key, href }) => ({ label: t("nav." + key), href, active: active === key, onClick: gate(key) }))}
        header={<Brand />}
      />
    </>
  );
}
