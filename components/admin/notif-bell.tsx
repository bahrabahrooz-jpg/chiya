"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useClickOutside } from "@/lib/use-click-outside";
import type { AdminNotification } from "@/lib/admin-notifications";
// Reuse the public site's bell styling so admin / agent match the website 1:1.
import "@/components/site/notification-bell.css";

export interface NotifBellData {
  all: AdminNotification[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: (ids: string[]) => void;
}

/**
 * NotifBell — the admin / agent topbar notifications dropdown. A faithful port
 * of the website's `NotificationBell` (same `.cxn` markup + styles): a compact
 * preview list with a "Mark all as read" affordance and a "View all
 * notifications" link to the full screen. Data comes from the scoped
 * admin/agent notifications store.
 */
export function NotifBell({ data, viewAllHref }: { data: NotifBellData; viewAllHref: string }) {
  const { all, unread, markRead, markAllRead } = data;
  const { t } = useLang();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const preview = all.slice(0, 6);
  const openItem = (n: AdminNotification) => {
    markRead(n.id);
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  return (
    <div className="cxn" ref={ref}>
      <button
        type="button"
        className={"cxn__btn" + (open ? " is-open" : "")}
        aria-label={t("admin.notif.title")}
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
              <h4>{t("admin.notif.title")}</h4>
              {unread > 0 && <span className="cxn__count">{unread}</span>}
            </div>
            {unread > 0 && (
              <button
                type="button"
                className="cxn__markread"
                onClick={() => markAllRead(all.map((n) => n.id))}
              >
                <Icon name="check-check" size={15} />
                {t("admin.notif.markAll")}
              </button>
            )}
          </div>
          <div className="cxn__list">
            {preview.length === 0 && (
              <div className="cxn__empty">
                <span className="cxn__empty-ic">
                  <Icon name="bell" size={22} strokeWidth={1.75} />
                </span>
                <p className="cxn__empty-title">{t("admin.notif.caughtUp")}</p>
                <p className="cxn__empty-desc">{t("admin.notif.empty")}</p>
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
                  <span className="cxn__time">{n.time}</span>
                </span>
                {!n.read && <span className="cxn__udot" aria-hidden="true" />}
              </button>
            ))}
          </div>
          <div className="cxn__foot">
            <Link href={viewAllHref} className="cxn__seeall" onClick={() => setOpen(false)}>
              {t("admin.notif.viewAllNotifs")}
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
