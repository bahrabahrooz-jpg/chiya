"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/layout/page-header";
import { useLang } from "@/lib/i18n";
import { useClickOutside } from "@/lib/use-click-outside";
import type { AdminNotification } from "@/lib/admin-notifications";
// Reuse the member account screen styling so the full notifications screen
// matches the public website 1:1.
import "@/app/_account/account.css";

type Filter = "all" | "unread";

export interface NotifScreenData {
  all: AdminNotification[];
  unread: number;
  markRead: (id: string) => void;
  markUnread: (id: string) => void;
  markAllRead: (ids: string[]) => void;
  remove: (id: string) => void;
  clear: (ids: string[]) => void;
}

/** Per-row "⋮" overflow menu (Mark as read / unread, Delete). */
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
  const { t } = useLang();
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
        aria-label={t("admin.notif.actions")}
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
              {t("admin.notif.markUnread")}
            </button>
          ) : (
            <button type="button" className="acc-menu__item" role="menuitem" onClick={() => { setOpen(false); onRead(); }}>
              <Icon name="check" size={17} />
              {t("admin.notif.markRead")}
            </button>
          )}
          <button type="button" className="acc-menu__item acc-menu__item--danger" role="menuitem" onClick={() => { setOpen(false); onDelete(); }}>
            <Icon name="trash-2" size={17} />
            {t("admin.notif.delete")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Top-right "⋯" menu (Mark all as read / Clear all). */
function NotifHeaderMenu({
  unread,
  onMarkAll,
  onClearAll,
}: {
  unread: number;
  onMarkAll: () => void;
  onClearAll: () => void;
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div className="acc-menuwrap" ref={ref}>
      <button
        type="button"
        className="acc-hmenu"
        aria-label={t("admin.notif.options")}
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
              {t("admin.notif.markAll")}
            </button>
          )}
          <button type="button" className="acc-menu__item acc-menu__item--danger" role="menuitem" onClick={() => { setOpen(false); onClearAll(); }}>
            <Icon name="trash-2" size={17} />
            {t("admin.notif.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * NotifScreen — the admin / agent full notifications feed reached via the
 * topbar bell's "View all notifications" link. A faithful port of the website's
 * member Notifications screen (same `.acc-*` markup + styles): All / Unread
 * filters, per-item read/unread + delete, and bulk actions. Rendered inside the
 * admin shell content area.
 */
export function NotifScreen({
  data,
  homeHref,
  homeLabel,
  subtitle,
}: {
  data: NotifScreenData;
  homeHref: string;
  homeLabel: string;
  subtitle: string;
}) {
  const { all, unread, markRead, markUnread, markAllRead, remove, clear } = data;
  const { t } = useLang();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [confirmClear, setConfirmClear] = useState(false);

  const list = filter === "unread" ? all.filter((n) => !n.read) : all;

  const open = (n: AdminNotification) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  const tabs: { key: Filter; label: string; count?: number }[] = [
    { key: "all", label: t("admin.notif.filterAll") },
    { key: "unread", label: t("admin.notif.filterUnread"), count: unread || undefined },
  ];

  return (
    <div className="acc-col">
      <PageHeader
        breadcrumb={
          <nav className="acc-crumb" aria-label={t("admin.common.breadcrumb")}>
            <Link href={homeHref}>{homeLabel}</Link>
            <Icon name="chevron-right" size={14} />
            <span>{t("admin.notif.title")}</span>
          </nav>
        }
        title={t("admin.notif.title")}
        subtitle={subtitle}
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
        <div className="acc-seg" role="tablist" aria-label={t("admin.notif.filterAria")}>
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
          <h2 className="acc-empty__title">{t("admin.notif.caughtUp")}</h2>
          <p className="acc-empty__desc">{t("admin.notif.caughtUpDesc")}</p>
        </div>
      ) : list.length === 0 ? (
        <div className="acc-empty">
          <span className="acc-empty__ic" aria-hidden="true">
            <Icon name="check-check" size={30} />
          </span>
          <h2 className="acc-empty__title">{t("admin.notif.noUnread")}</h2>
          <p className="acc-empty__desc">{t("admin.notif.noUnreadDesc")}</p>
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
                <span className="acc-notif__time">{n.time}</span>
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

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        icon="trash-2"
        title={t("admin.notif.clearTitle")}
        subtitle={t("admin.notif.clearBody")}
        size="sm"
        footerSpread
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setConfirmClear(false)}>
              {t("admin.topbar.cancel")}
            </Button>
            <Button
              hierarchy="destructive"
              iconLeading="trash-2"
              onClick={() => {
                clear(all.map((n) => n.id));
                setConfirmClear(false);
              }}
            >
              {t("admin.notif.clearAll")}
            </Button>
          </>
        }
      />
    </div>
  );
}
