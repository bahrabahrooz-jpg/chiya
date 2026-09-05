"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { openAuth, useAuth } from "@/lib/auth";
import { canCancel, useViewings, type Viewing } from "@/lib/viewings";
import { useLang } from "@/lib/i18n";
import { valueKey } from "@/lib/fmt";
import "./account.css";

/**
 * ViewingsApp — the member's "My Viewings" page. Lists the viewing requests the
 * member has sent to agents (from the property "Request a viewing" modal),
 * mirroring the mobile app's Viewings tab with the website's cards and chrome.
 */
export function ViewingsApp() {
  const { user } = useAuth();
  const { items, cancel } = useViewings();
  const [pendingCancel, setPendingCancel] = useState<Viewing | null>(null);

  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to view your viewings.", next: "/viewings" });
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

  return (
    <main className="acc-main">
      <Container>
        <nav className="acc-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <span>My Viewings</span>
        </nav>

        <PageHeader title="My Viewings" subtitle="Viewing requests you’ve sent to agents." />

        {items.length > 0 ? (
          <div className="acc-viewlist">
            {items.map((v) => (
              <ViewingCard key={v.id} viewing={v} onCancel={() => setPendingCancel(v)} />
            ))}
          </div>
        ) : (
          <div className="acc-empty">
            <span className="acc-empty__ic" aria-hidden="true">
              <Icon name="calendar-check" size={30} />
            </span>
            <h2 className="acc-empty__title">No viewings yet</h2>
            <p className="acc-empty__desc">Book a viewing from any property and it’ll show up here.</p>
            <div style={{ marginTop: 14 }}>
              <Button hierarchy="primary" iconLeading="search" href="/search">
                Browse properties
              </Button>
            </div>
          </div>
        )}
      </Container>

      <Modal
        open={!!pendingCancel}
        onClose={() => setPendingCancel(null)}
        icon="x"
        title="Cancel this viewing?"
        subtitle={pendingCancel ? `Your viewing request for ${pendingCancel.title} will be withdrawn.` : undefined}
        size="sm"
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setPendingCancel(null)}>
              Keep
            </Button>
            <Button
              hierarchy="destructive"
              iconLeading="x"
              onClick={() => {
                if (pendingCancel) cancel(pendingCancel.id);
                setPendingCancel(null);
              }}
            >
              Cancel viewing
            </Button>
          </>
        }
      />
    </main>
  );
}

/* Status → badge modifier. Requested has no modifier: it is the base style, and
   it is what every request starts as. */
const BADGE_MOD: Record<string, string> = {
  Confirmed: " acc-view__badge--confirmed",
  Completed: " acc-view__badge--completed",
  Cancelled: " acc-view__badge--cancelled",
  "No Show": " acc-view__badge--noshow",
};
const BADGE_ICON: Record<string, IconName> = {
  Requested: "clock",
  Confirmed: "calendar-check",
  Completed: "check-check",
  Cancelled: "circle-x",
  "No Show": "user-x",
};

function ViewingCard({ viewing: v, onCancel }: { viewing: Viewing; onCancel: () => void }) {
  const router = useRouter();
  const { t } = useLang();
  return (
    <article
      className="acc-view"
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/property/${v.propertyId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/property/${v.propertyId}`);
        }
      }}
    >
      <div className="acc-view__top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="acc-view__thumb" src={v.cover} alt={v.title} loading="lazy" />
        <div className="acc-view__info">
          <span className={"acc-view__badge" + (BADGE_MOD[v.status] ?? "")}>
            <Icon name={BADGE_ICON[v.status] ?? "clock"} size={12} />
            {t(valueKey("status", v.status))}
          </span>
          <div className="acc-view__title">{v.title}</div>
          <div className="acc-view__addr">
            <Icon name="map-pin" size={13} />
            <span>{v.address}</span>
          </div>
        </div>
        {/* A viewing that has already happened, or has already been called off,
            cannot be cancelled — the button would be one that cannot mean
            anything, so it is not offered at all. */}
        {canCancel(v) && (
          <button
            type="button"
            className="acc-view__cancel"
            aria-label="Cancel viewing"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            <Icon name="x" size={16} />
          </button>
        )}
      </div>

      <div className="acc-view__when">
        <Icon name="calendar-check" size={16} />
        {/* Already display strings — the diary stores them the way it shows
            them, so there is nothing left to format here. */}
        <span className="acc-view__date">{v.date}</span>
        <span className="acc-view__time">at {v.time}</span>
      </div>

      <div className="acc-view__agent">
        <Avatar src={v.agentPhoto} name={v.agentName} size="xs" />
        <span className="acc-view__with">
          with <b>{v.agentName}</b>
        </span>
      </div>
    </article>
  );
}

function SignInGate() {
  return (
    <div className="acc-empty">
      <span className="acc-empty__ic" aria-hidden="true">
        <Icon name="lock" size={30} />
      </span>
      <h2 className="acc-empty__title">Sign in to view your viewings</h2>
      <p className="acc-empty__desc">Track the viewing requests you’ve sent to agents, all in one place.</p>
      <div style={{ marginTop: 14 }}>
        <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/viewings" })}>
          Sign in
        </Button>
      </div>
    </div>
  );
}
