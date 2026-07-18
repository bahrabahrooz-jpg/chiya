"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n";

interface PreviewLink {
  href: string;
  key: string;
  desc: string;
  icon: IconName;
  source: "export" | "placeholder";
}

const PAGES: PreviewLink[] = [
  { href: "/", key: "home", desc: "Hero search, featured listing, categories, locations, agents, testimonials, CTA.", icon: "house", source: "export" },
  { href: "/search?deal=buy", key: "search", desc: "Filters, sort, grid + interactive map view, pagination.", icon: "search", source: "export" },
  { href: "/property/olive-grove", key: "property", desc: "Gallery, facts, description, features, amenities, map, agent panel.", icon: "building-2", source: "export" },
  { href: "/agents", key: "agents", desc: "Searchable, filterable grid of verified agents.", icon: "users", source: "export" },
  { href: "/agents/lana-aziz", key: "profile", desc: "Hero, performance metrics, listings, recently sold, reviews.", icon: "user-round", source: "export" },
  { href: "/about", key: "about", desc: "Not in the export — routed placeholder.", icon: "info", source: "placeholder" },
  { href: "/contact", key: "contact", desc: "Not in the export — routed placeholder.", icon: "mail", source: "placeholder" },
  { href: "/login", key: "login", desc: "Opens the auth modal.", icon: "log-in", source: "placeholder" },
  { href: "/register", key: "register", desc: "Opens the auth modal.", icon: "user-plus", source: "placeholder" },
];

export default function PreviewPage() {
  const { t } = useLang();
  return (
    <main className="min-h-screen bg-page text-ink">
      <div className="cx-container" style={{ maxWidth: 1100, marginInline: "auto", padding: "64px 24px 96px" }}>
        <header className="flex flex-col gap-2 border-b border-border-subtle pb-8">
          <span className="cx-eyebrow">{t("preview.eyebrow")}</span>
          <h1 className="cx-display-lg">{t("preview.title")}</h1>
          <p className="cx-text-md max-w-xl">{t("preview.intro")}</p>
        </header>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="cx-card cx-card--hover group flex flex-col gap-4 p-6"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-card)",
                boxShadow: "var(--shadow-card)",
                textDecoration: "none",
                transition: "box-shadow .25s ease, transform .25s ease, border-color .25s ease",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex items-center justify-center"
                  style={{ width: 44, height: 44, borderRadius: "var(--radius-lg)", background: "var(--brand-subtle)", color: "var(--green-700)" }}
                >
                  <Icon name={p.icon} size={22} />
                </span>
                <Badge variant={p.source === "export" ? "brand" : "neutral"} size="sm">
                  {p.source === "export" ? t("preview.export") : t("preview.placeholder")}
                </Badge>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="cx-display-xs" style={{ fontSize: 20, lineHeight: "26px" }}>
                  {t("preview.p." + p.key)}
                </span>
                <span className="cx-text-sm" style={{ color: "var(--text-secondary)" }}>
                  {p.desc}
                </span>
              </div>
              <span
                className="cx-mono mt-auto inline-flex items-center gap-1.5 text-[12px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                {p.href}
                <Icon name="arrow-right" size={13} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
