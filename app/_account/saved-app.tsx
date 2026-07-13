"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { PropertyCard, AgentCard } from "@/components/real-estate";
import type { PropertyStatus } from "@/components/real-estate";
import { openAuth, useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import "./account.css";

type Tab = "properties" | "agents";

/**
 * SavedApp — the member's saved homes & agents. Two tabs backed by the shared
 * favorites store (the same store the heart toggles across the site write to),
 * mirroring the mobile Saved screen with the website's cards and chrome.
 */
export function SavedApp() {
  const { user } = useAuth();
  const { properties, agents, toggleProperty, toggleAgent } = useFavorites();
  const [tab, setTab] = useState<Tab>("properties");

  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to view your saved items.", next: "/saved" });
  }, [user]);

  if (!user) {
    return (
      <main className="acc-main">
        <Container>
          <SignInGate />
        </Container>
      </main>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "properties", label: "Properties", count: properties.length },
    { key: "agents", label: "Agents", count: agents.length },
  ];

  return (
    <main className="acc-main">
      <Container>
        <nav className="acc-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <span>Saved</span>
        </nav>

        <PageHeader title="Saved" subtitle="Homes and agents you’ve saved for later." />

        <div className="acc-seg" role="tablist" aria-label="Saved filter">
          {tabs.map((tk) => (
            <button
              key={tk.key}
              type="button"
              role="tab"
              aria-selected={tab === tk.key}
              className={"acc-seg__btn" + (tab === tk.key ? " is-active" : "")}
              onClick={() => setTab(tk.key)}
            >
              {tk.label}
              <span className="acc-seg__count">{tk.count}</span>
            </button>
          ))}
        </div>

        {tab === "properties" ? (
          properties.length > 0 ? (
            <div className="acc-grid">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  image={p.image}
                  price={p.price}
                  period={p.period}
                  title={p.title}
                  address={p.address}
                  beds={p.beds}
                  baths={p.baths}
                  area={p.area}
                  areaUnit={p.areaUnit}
                  status={p.status as PropertyStatus | undefined}
                  href={p.href || `/property/${p.id}`}
                  favorite
                  onFavorite={() => toggleProperty(p)}
                />
              ))}
            </div>
          ) : (
            <EmptyBlock
              icon="heart"
              title="No saved homes yet"
              desc="Tap the heart on any property to keep it here for later."
              cta={<Button hierarchy="primary" iconLeading="search" href="/search">Browse properties</Button>}
            />
          )
        ) : agents.length > 0 ? (
          <div className="acc-grid">
            {agents.map((a) => (
              <AgentCard
                key={a.id}
                name={a.name}
                photo={a.photo}
                city={a.city}
                verified={a.verified}
                rating={a.rating}
                listings={a.listings}
                href={a.href || `/agents/${a.id}`}
                favorite
                onFavorite={() => toggleAgent(a)}
              />
            ))}
          </div>
        ) : (
          <EmptyBlock
            icon="users"
            title="No saved agents yet"
            desc="Save the agents you trust to find them again quickly."
            cta={<Button hierarchy="primary" iconLeading="users" href="/agents">Browse agents</Button>}
          />
        )}
      </Container>
    </main>
  );
}

function EmptyBlock({
  icon,
  title,
  desc,
  cta,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  desc: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="acc-empty">
      <span className="acc-empty__ic" aria-hidden="true">
        <Icon name={icon} size={30} />
      </span>
      <h2 className="acc-empty__title">{title}</h2>
      <p className="acc-empty__desc">{desc}</p>
      <div style={{ marginTop: 14 }}>{cta}</div>
    </div>
  );
}

function SignInGate() {
  return (
    <div className="acc-empty">
      <span className="acc-empty__ic" aria-hidden="true">
        <Icon name="lock" size={30} />
      </span>
      <h2 className="acc-empty__title">Sign in to view your saved items</h2>
      <p className="acc-empty__desc">Save homes and agents across the site and find them all here.</p>
      <div style={{ marginTop: 14 }}>
        <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/saved" })}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
