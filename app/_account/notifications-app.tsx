"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { useClickOutside } from "@/lib/use-click-outside";
import { openAuth, useAuth } from "@/lib/auth";
import { useNotifications, timeAgo, type AppNotification } from "@/lib/notifications";
import "./account.css";

type Filter = "all" | "unread";

/**
 * NotifItemMenu — the per-row "⋮" overflow menu (Mark as read / unread, Delete).
 * Mirrors the mobile app's per-notification ActionSheet. Manages its own open
 * state + click-outside, and stops propagation so opening the menu never fires
 * the row's "open notification" handler.
 */
function NotifItemMenu({
  read,
  onRead,
  onUnread,
  onDelete,
}: {
  read: boolean;
  onRead: () => void;
  onUnread: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div
      className="acc-menuwrap"
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="acc-notif__menu"
        aria-label="Notification actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="ellipsis-vertical" size={18} />
      </button>
      {open && (
        <div className="acc-menu" role="menu">
          {read ? (
            <button type="button" className="acc-menu__item" role="menuitem" onClick={() => { setOpen(false); onUnread(); }}>
              <Icon name="mail" size={17} />
              Mark as unread
            </button>
          ) : (
            <button type="button" className="acc-menu__item" role="menuitem" onClick={() => { setOpen(false); onRead(); }}>
              <Icon name="check" size={17} />
              Mark as read
            </button>
          )}
          <button type="button" className="acc-menu__item acc-menu__item--danger" role="menuitem" onClick={() => { setOpen(false); onDelete(); }}>
            <Icon name="trash-2" size={17} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * NotifHeaderMenu — the top-right "⋯" menu (Mark all as read / Clear all),
 * mirroring the mobile Notifications screen header menu.
 */
function NotifHeaderMenu({
  unread,
  onMarkAll,
  onClearAll,
}: {
  unread: number;
  onMarkAll: () => void;
  onClearAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="acc-menuwrap" ref={ref}>
      <button
        type="button"
        className="acc-hmenu"
        aria-label="Notification options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="ellipsis" size={20} />
      </button>
      {open && (
        <div className="acc-menu" role="menu">
          {unread > 0 && (
            <button type="button" className="acc-menu__item" role="menuitem" onClick={() => { setOpen(false); onMarkAll(); }}>
              <Icon name="check-check" size={17} />
              Mark all as read
            </button>
          )}
          <button type="button" className="acc-menu__item acc-menu__item--danger" role="menuitem" onClick={() => { setOpen(false); onClearAll(); }}>
            <Icon name="trash-2" size={17} />
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * NotificationsApp — the member's full notifications feed. Derived from the
 * shared notifications store (listing status updates + seeded activity), with
 * All / Unread filters, per-item read/unread + delete via an overflow menu, and
 * bulk actions — the website counterpart of the mobile Notifications screen.
 */
export function NotificationsApp() {
  const { user } = useAuth();
  const { all, unread, markRead, markUnread, markAllRead, remove, clear } = useNotifications();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to view your notifications.", next: "/notifications" });
  }, [user]);

  if (!user) {
    return (
      <main className="acc-main">
        <Container>
          <div className="acc-empty">
            <span className="acc-empty__ic" aria-hidden="true">
              <Icon name="lock" size={30} />
            </span>
            <h2 className="acc-empty__title">Sign in to view notifications</h2>
            <p className="acc-empty__desc">Stay on top of your listing activity and updates from Chiya.</p>
            <div style={{ marginTop: 14 }}>
              <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/notifications" })}>
                Sign in
              </Button>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  const list = filter === "unread" ? all.filter((n) => !n.read) : all;

  const open = (n: AppNotification) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  const tabs: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", count: unread || undefined },
  ];

  return (
    <main className="acc-main">
      <Container className="acc-col">
        <nav className="acc-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <span>Notifications</span>
        </nav>

        <PageHeader
          title="Notifications"
          subtitle="Updates on your listings and activity across Chiya."
          actions={
            all.length > 0 ? (
              <NotifHeaderMenu
                unread={unread}
                onMarkAll={() => markAllRead(all.map((n) => n.id))}
                onClearAll={() => setConfirmClear(true)}
              />
            ) : undefined
          }
        />

        {all.length > 0 && (
          <div className="acc-seg" role="tablist" aria-label="Notification filter">
            {tabs.map((tk) => (
              <button
                key={tk.key}
                type="button"
                role="tab"
                aria-selected={filter === tk.key}
                className={"acc-seg__btn" + (filter === tk.key ? " is-active" : "")}
                onClick={() => setFilter(tk.key)}
              >
                {tk.label}
                {tk.count != null && <span className="acc-seg__count">{tk.count}</span>}
              </button>
            ))}
          </div>
        )}

        {all.length === 0 ? (
          <div className="acc-empty">
            <span className="acc-empty__ic" aria-hidden="true">
              <Icon name="bell" size={30} />
            </span>
            <h2 className="acc-empty__title">You’re all caught up</h2>
            <p className="acc-empty__desc">
              We’ll let you know here when there’s activity on your listings or account.
            </p>
          </div>
        ) : list.length === 0 ? (
          <div className="acc-empty">
            <span className="acc-empty__ic" aria-hidden="true">
              <Icon name="check-check" size={30} />
            </span>
            <h2 className="acc-empty__title">No unread notifications</h2>
            <p className="acc-empty__desc">You’ve read everything — nice work.</p>
          </div>
        ) : (
          <div className="acc-notiflist">
            {list.map((n) => (
              <div
                key={n.id}
                className={"acc-notif" + (!n.read ? " is-unread" : "")}
                role="button"
                tabIndex={0}
                onClick={() => open(n)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    open(n);
                  }
                }}
              >
                <span className="acc-notif__ic">
                  <Icon name={n.icon} size={20} />
                </span>
                <span className="acc-notif__body">
                  <span className="acc-notif__titlerow">
                    <span className="acc-notif__title">{n.title}</span>
                    {!n.read && <span className="acc-notif__udot" aria-hidden="true" />}
                  </span>
                  <span className="acc-notif__desc">{n.desc}</span>
                  {n.ts > 0 && <span className="acc-notif__time">{timeAgo(n.ts)}</span>}
                </span>
                <NotifItemMenu
                  read={n.read}
                  onRead={() => markRead(n.id)}
                  onUnread={() => markUnread(n.id)}
                  onDelete={() => remove(n.id)}
                />
              </div>
            ))}
          </div>
        )}
      </Container>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        icon="trash-2"
        title="Clear all notifications?"
        subtitle="This removes every notification from your inbox. This can’t be undone."
        size="sm"
        footerSpread
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button
              hierarchy="destructive"
              iconLeading="trash-2"
              onClick={() => {
                clear(all.map((n) => n.id));
                setConfirmClear(false);
              }}
            >
              Clear all
            </Button>
          </>
        }
      />
    </main>
  );
}
