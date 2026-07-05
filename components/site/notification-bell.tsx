"use client";

import { useMemo, useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { type IconButtonVariant } from "@/components/ui/icon-button";
import { Badge } from "@/components/ui/badge";
import { useClickOutside } from "@/lib/use-click-outside";
import { useAuth } from "@/lib/auth";
import { useListings, type MemberListing } from "@/lib/listings";
import "./notification-bell.css";

type Kind = "info" | "success" | "warning" | "error";
interface Notif {
  id: string;
  icon: IconName;
  kind: Kind;
  title: string;
  desc: string;
  ts: number;
}

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function statusNotif(l: MemberListing): Notif {
  const ts = new Date(l.updatedAt).getTime() || Date.now();
  const map: Record<MemberListing["status"], Omit<Notif, "id" | "ts">> = {
    pending: { icon: "clock", kind: "warning", title: `“${l.title}” is pending review`, desc: "Our team is verifying the details before it goes live." },
    published: { icon: "circle-check", kind: "success", title: `“${l.title}” is now live`, desc: "Your listing is published and visible to buyers and renters." },
    rejected: { icon: "circle-alert", kind: "error", title: `“${l.title}” needs changes`, desc: "Review the feedback and resubmit your listing." },
    draft: { icon: "file-pen", kind: "info", title: `“${l.title}” saved as draft`, desc: "Finish and submit it whenever you're ready." },
  };
  return { id: `${l.id}-${l.status}`, ts, ...map[l.status] };
}

/**
 * NotificationBell — member notifications in the website header. Renders only
 * when signed in. Items are derived from the member's own listings (status
 * updates) plus a welcome, so the panel reflects real activity rather than
 * fake data. Styled to sit alongside the language / theme controls.
 */
export function NotificationBell({ variant }: { variant?: IconButtonVariant }) {
  const { user } = useAuth();
  const { items: listings } = useListings();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const notifs = useMemo<Notif[]>(() => {
    const fromListings = [...listings]
      .sort((a, b) => (new Date(b.updatedAt).getTime() || 0) - (new Date(a.updatedAt).getTime() || 0))
      .slice(0, 6)
      .map(statusNotif);
    const welcome: Notif = {
      id: "welcome",
      icon: "sparkles",
      kind: "info",
      title: "Welcome to Chiya",
      desc: "Submit a property to reach qualified buyers and renters across Kurdistan.",
      ts: 0,
    };
    return [...fromListings, welcome];
  }, [listings]);

  if (!user) return null;

  const unread = notifs.filter((n) => !readIds.has(n.id)).length;
  const markAllRead = () => setReadIds(new Set(notifs.map((n) => n.id)));

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
        <Icon name="bell" size={20} />
        {unread > 0 && <span className="cxn__dot" aria-hidden="true" />}
      </button>
      {open && (
        <div className="cxn__menu" role="menu">
          <div className="cxn__head">
            <h4>Notifications</h4>
            {unread > 0 && (
              <Badge variant="brand" size="sm">
                {unread} new
              </Badge>
            )}
          </div>
          <div className="cxn__list">
            {notifs.map((n) => {
              const isUnread = !readIds.has(n.id);
              return (
                <button
                  key={n.id}
                  type="button"
                  className={"cxn__item" + (isUnread ? " is-unread" : "")}
                  role="menuitem"
                  onClick={() => setReadIds((s) => new Set(s).add(n.id))}
                >
                  <span className={"cxn__ic cxn__ic--" + n.kind}>
                    <Icon name={n.icon} size={18} />
                  </span>
                  <span className="cxn__body">
                    <span className="cxn__title">{n.title}</span>
                    <span className="cxn__desc">{n.desc}</span>
                    {n.ts > 0 && <span className="cxn__time">{timeAgo(n.ts)}</span>}
                  </span>
                  {isUnread && <span className="cxn__udot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
          <div className="cxn__foot">
            <button type="button" className="cxn__markread" onClick={markAllRead} disabled={unread === 0}>
              <Icon name="check-check" size={16} />
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
