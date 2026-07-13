"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { type IconButtonVariant } from "@/components/ui/icon-button";
import { useClickOutside } from "@/lib/use-click-outside";
import { useAuth } from "@/lib/auth";
import { useNotifications, timeAgo, type AppNotification } from "@/lib/notifications";
import "./notification-bell.css";

/**
 * NotificationBell — member notifications in the website header. Renders only
 * when signed in. Items come from the shared notifications store (derived from
 * the member's listings + a welcome), so the bell and the Notifications page
 * stay in sync. A compact preview; "See all" links to the full page.
 */
export function NotificationBell({ variant }: { variant?: IconButtonVariant }) {
  const { user } = useAuth();
  const { all, unread, markRead, markAllRead } = useNotifications();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  if (!user) return null;

  const preview = all.slice(0, 6);
  const openItem = (n: AppNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div className="cxn" ref={ref}>
      <button
        type="button"
        className={"cxn__btn" + (variant === "glass" ? " cxn__btn--bare" : "") + (open ? " is-open" : "")}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="bell" size={20} strokeWidth={2} />
        {unread > 0 && <span className="cxn__dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="cxn__menu" role="menu">
          <div className="cxn__head">
            <div className="cxn__head-l">
              <h4>Notifications</h4>
              {unread > 0 && <span className="cxn__count">{unread}</span>}
            </div>
            {unread > 0 && (
              <button
                type="button"
                className="cxn__markread"
                onClick={() => markAllRead(all.map((n) => n.id))}
              >
                <Icon name="check-check" size={15} />
                Mark all as read
              </button>
            )}
          </div>
          <div className="cxn__list">
            {preview.length === 0 && (
              <div className="cxn__empty">
                <span className="cxn__empty-ic">
                  <Icon name="bell" size={22} strokeWidth={1.75} />
                </span>
                <p className="cxn__empty-title">You&apos;re all caught up</p>
                <p className="cxn__empty-desc">New notifications will show up here.</p>
              </div>
            )}
            {preview.map((n) => (
              <button
                key={n.id}
                type="button"
                className={"cxn__item" + (!n.read ? " is-unread" : "")}
                role="menuitem"
                onClick={() => openItem(n)}
              >
                <span className="cxn__ic">
                  <Icon name={n.icon} size={18} />
                </span>
                <span className="cxn__body">
                  <span className="cxn__title">{n.title}</span>
                  <span className="cxn__desc">{n.desc}</span>
                  {n.ts > 0 && <span className="cxn__time">{timeAgo(n.ts)}</span>}
                </span>
                {!n.read && <span className="cxn__udot" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="cxn__foot">
            <Link href="/notifications" className="cxn__seeall" onClick={() => setOpen(false)}>
              View all notifications
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
