"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/data";
import { toast } from "@/components/feedback/toast";
import { openAuth, useAuth } from "@/lib/auth";
import { useListings, STATUS_LABEL, type ListingStatus, type MemberListing } from "@/lib/listings";
import { ListingCard } from "./listing-card";
import "./my-listings.css";

type Tab = "all" | ListingStatus;
const TABS: Tab[] = ["all", "draft", "pending", "published", "rejected"];
const TAB_LABEL: Record<Tab, string> = { all: "All", ...STATUS_LABEL };

/**
 * MyListingsApp — the member's listings hub. Same website header/footer and
 * design system as the rest of the site; only the content column changes. Shows
 * a sign-in prompt for signed-out visitors, an empty state for members with no
 * listings, and a filterable grid of premium cards otherwise.
 */
export function MyListingsApp() {
  const { user } = useAuth();
  const { items, remove } = useListings();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [deleteTarget, setDeleteTarget] = useState<MemberListing | null>(null);

  // Listing requires an account; nudge signed-out visitors into the auth modal.
  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to manage your property listings.", next: "/my-listings" });
  }, [user]);

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: items.length, draft: 0, pending: 0, published: 0, rejected: 0 };
    for (const it of items) c[it.status] += 1;
    return c;
  }, [items]);

  const visible = tab === "all" ? items : items.filter((l) => l.status === tab);

  const onView = (l: MemberListing) =>
    toast({ title: l.status === "published" ? "Opening your published listing" : `“${l.title}” is ${STATUS_LABEL[l.status].toLowerCase()}` });
  const onEdit = (l: MemberListing) => router.push(`/my-listings/new?edit=${encodeURIComponent(l.id)}`);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    remove(deleteTarget.id);
    toast({ title: "Listing deleted", variant: "success" });
    setDeleteTarget(null);
  };

  if (!user) {
    return (
      <main className="ml-main">
        <Container>
          <EmptyState
            icon="lock"
            title="Sign in to view your listings"
            description="Listing a property on Chiya Estate requires a member account. Sign in or create one to get started."
            action={
              <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/my-listings" })}>
                Sign in
              </Button>
            }
          />
        </Container>
      </main>
    );
  }

  return (
    <main className="ml-main">
      <Container>
        <nav className="ml-crumb" aria-label="Breadcrumb">
          <Link href="/">
            <Icon name="home" size={14} />
            Home
          </Link>
          <Icon name="chevron-right" size={14} />
          <span>My Properties</span>
        </nav>

        <PageHeader
          title="My Properties"
          subtitle="Manage your submitted properties and track their publication status."
          actions={
            <Button hierarchy="primary" iconLeading="plus" href="/my-listings/new">
              Submit New Property
            </Button>
          }
        />

        <div className="ml-tabs" role="tablist" aria-label="Filter by status">
          {TABS.map((tk) => (
            <button
              key={tk}
              type="button"
              role="tab"
              aria-selected={tab === tk}
              className={"ml-tab" + (tab === tk ? " is-active" : "")}
              onClick={() => setTab(tk)}
            >
              {TAB_LABEL[tk]}
              <span className="ml-tab__count">{counts[tk]}</span>
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="ml-empty">
            <span className="ml-empty__ic" aria-hidden="true">🏠</span>
            <h2 className="ml-empty__title">You haven&apos;t submitted any properties yet.</h2>
            <p className="ml-empty__desc">
              Start by creating your first listing and reach qualified buyers and renters across Kurdistan.
            </p>
            <div className="ml-empty__cta">
              <Button hierarchy="primary" size="lg" iconLeading="plus" href="/my-listings/new">
                Submit Your First Property
              </Button>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="inbox"
            title={`No ${TAB_LABEL[tab].toLowerCase()} listings`}
            description="Nothing here yet — try another filter or create a new listing."
          />
        ) : (
          <div className="ml-grid">
            {visible.map((l) => (
              <ListingCard key={l.id} listing={l} onView={onView} onEdit={onEdit} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </Container>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        icon="trash-2"
        title="Delete this listing?"
        subtitle={deleteTarget ? `“${deleteTarget.title}” will be permanently removed. This can’t be undone.` : undefined}
        size="sm"
        footerSpread
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button hierarchy="destructive" iconLeading="trash-2" onClick={confirmDelete}>
              Delete listing
            </Button>
          </>
        }
      />
    </main>
  );
}
