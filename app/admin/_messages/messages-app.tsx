"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtRelative, valueKey, popupLeft } from "@/lib/fmt";
import { adminMenuRoot } from "../_shared/menu-portal";
import { AdminSelect } from "../_shared/filter-controls";
import { logAudit } from "../_shared/audit-log";
import {
  EMPTY_FILTERS,
  ITEMS_PER_PAGE,
  MESSAGE_STATUS,
  SOURCES,
  STATUS_TABS,
  TODAY,
  type MessageFilters,
  type MessageRecord,
  type MessageStatus,
} from "./data";
import { deleteMessage, restoreMessage, setMessageStatus, useMessages } from "./messages-store";

const SOURCE_ICON: Record<string, IconName> = { Website: "globe", Mobile: "smartphone" };

function PaginationFooter({ currentPage, totalItems, onPageChange }: { currentPage: number; totalItems: number; onPageChange: (p: number) => void }) {
  const { t, lang } = useLang();
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const start = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalItems);
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  const getPages = (): (number | "…")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, "…", totalPages];
    if (currentPage >= totalPages - 3) return [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", currentPage - 1, currentPage, currentPage + 1, "…", totalPages];
  };
  if (totalItems === 0) return null;
  return (
    <div className="mp-tablefooter">
      <span className="mp-pagination__info">
        {t("admin.messages.showingRange", { start: fmtNum(lang, start), end: fmtNum(lang, end), total: fmtNum(lang, totalItems) })}
      </span>
      <div className="mp-pagination">
        <button type="button" className="mp-page-btn mp-page-btn--nav" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <Icon name="chevron-left" size={15} />
          {t("admin.props.prev")}
        </button>
        {getPages().map((p, i) =>
          p === "…" ? (
            <span key={"e" + i} className="mp-page-ellipsis">
              …
            </span>
          ) : (
            <button key={p} type="button" className={"mp-page-btn" + (p === currentPage ? " is-active" : "")} onClick={() => onPageChange(p)}>
              {fmtNum(lang, p)}
            </button>
          ),
        )}
        <button type="button" className="mp-page-btn mp-page-btn--nav" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          {t("admin.props.next")}
          <Icon name="chevron-right" size={15} />
        </button>
      </div>
    </div>
  );
}

function RowActions({
  open,
  onToggle,
  status,
  onReply,
  onToggleRead,
  onArchive,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  status: MessageStatus;
  onReply: () => void;
  onToggleRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { t, lang } = useLang();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null);
      return;
    }
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: popupLeft(r, 208, isRtl(lang)) });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, lang]);

  const archived = status === "Archived";
  const menu =
    pos &&
    createPortal(
      <div className="mp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
        <div className="mp-amenu__sect">
          {!archived && (
            <button type="button" className="mp-aitem" role="menuitem" onClick={onReply}>
              <Icon name="reply" size={17} />
              {t("admin.messages.reply")}
            </button>
          )}
          <button type="button" className="mp-aitem" role="menuitem" onClick={onToggleRead}>
            <Icon name={status === "New" ? "mail-open" : "mail"} size={17} />
            {t(status === "New" ? "admin.messages.markRead" : "admin.messages.markUnread")}
          </button>
          <button type="button" className="mp-aitem" role="menuitem" onClick={onArchive}>
            <Icon name={archived ? "archive-restore" : "archive"} size={17} />
            {t(archived ? "admin.messages.unarchive" : "admin.messages.archive")}
          </button>
        </div>
        <div className="mp-amenu__sect">
          <button type="button" className="mp-aitem mp-aitem--danger" role="menuitem" onClick={onDelete}>
            <Icon name="trash-2" size={17} />
            {t("admin.messages.delete")}
          </button>
        </div>
      </div>,
      adminMenuRoot(),
    );

  return (
    <div className="mp-actions">
      <button ref={btnRef} type="button" className={"mp-kebab" + (open ? " is-open" : "")} aria-label={t("admin.messages.actions")} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </div>
  );
}

function MessageDetail({ m }: { m: MessageRecord }) {
  const { t } = useLang();
  return (
    <div className="msg-detail" id={"msg-d-" + m.id} role="region">
      <div className="msg-detail__meta">
        <div className="msg-detail__field">
          <span className="msg-detail__label">{t("admin.messages.detail.from")}</span>
          <span className="msg-detail__value">{m.name}</span>
        </div>
        <div className="msg-detail__field">
          <span className="msg-detail__label">{t("admin.messages.detail.email")}</span>
          <a className="msg-detail__link" href={`mailto:${m.email}`} dir="ltr">
            {m.email}
          </a>
        </div>
        {m.propertyTitle && (
          <div className="msg-detail__field">
            <span className="msg-detail__label">{t("admin.messages.detail.property")}</span>
            <a className="msg-detail__link" href={`/admin/properties/${encodeURIComponent(m.propertyId!)}`}>
              {m.propertyTitle}
            </a>
          </div>
        )}
      </div>
      <div className="msg-detail__body">
        <span className="msg-detail__label">{t("admin.messages.detail.message")}</span>
        <p className="msg-detail__text">{m.body}</p>
      </div>
    </div>
  );
}

function MessageRow({
  m,
  expanded,
  onToggleExpand,
  openMenu,
  setOpenMenu,
  onReply,
  onToggleRead,
  onArchive,
  onDeleteRequest,
}: {
  m: MessageRecord;
  expanded: boolean;
  onToggleExpand: () => void;
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onReply: (m: MessageRecord) => void;
  onToggleRead: (m: MessageRecord) => void;
  onArchive: (m: MessageRecord) => void;
  onDeleteRequest: (m: MessageRecord) => void;
}) {
  const { t, lang } = useLang();
  const st = MESSAGE_STATUS[m.status];
  const unread = m.status === "New";
  // From the stored instant rather than re-parsing the display string — that
  // parse is engine-dependent and can yield an Invalid Date.
  const received = new Date(m.sortAt);
  return (
    <div className={"mp-row msg-row" + (unread ? " is-unread" : "") + (expanded ? " is-expanded" : "")}>
      <div className="mp-col--member">
        <div className="mp-member">
          <Avatar src={m.memberImg || undefined} name={m.name} size="md" />
          <div className="mp-member__body">
            <span className="mp-member__name">{m.name}</span>
            <span className="mp-member__id" dir="ltr">
              {m.email}
            </span>
          </div>
        </div>
      </div>

      <div className="msg-col--subject">
        <span className="mp-celllabel">{t("admin.messages.th.subject")}</span>
        <button
          type="button"
          className="msg-subjectbtn"
          aria-expanded={expanded}
          aria-controls={"msg-d-" + m.id}
          onClick={onToggleExpand}
        >
          <Icon name={expanded ? "chevron-down" : "chevron-right"} size={15} className="msg-chevron" />
          <span className="msg-subjecttext">
            <span className="msg-subject">{m.subject}</span>
            <span className="msg-preview">{m.body}</span>
          </span>
        </button>
      </div>

      <div className="msg-col--source">
        <span className="mp-celllabel">{t("admin.messages.th.source")}</span>
        <Badge variant="neutral" size="sm" className="msg-sourcebadge">
          <Icon name={SOURCE_ICON[m.source]} size={13} strokeWidth={2} />
          {t(m.source === "Website" ? "admin.messages.source.website" : "admin.messages.source.mobile")}
        </Badge>
      </div>

      <div className="mp-col--joined">
        <span className="mp-celllabel">{t("admin.messages.th.received")}</span>
        <span className="mp-date">{fmtDate(lang, received)}</span>
        {/* Relative to the demo's fixed "now", never `new Date()` — a live
            clock here would render differently on the server and the client. */}
        <span className="msg-rel">{fmtRelative(lang, received, t, TODAY)}</span>
      </div>

      <div className="mp-col--status">
        <span className="mp-celllabel">{t("admin.messages.th.status")}</span>
        <Badge variant={st.variant} size="sm" dot={st.dot} className="mp-statusbadge">
          {t(valueKey("status", m.status))}
        </Badge>
      </div>

      <div className="msg-col--actions">
        {m.status !== "Archived" && m.status !== "Replied" ? (
          <div className="msg-quickactions">
            <button type="button" className="msg-reply" onClick={() => onReply(m)}>
              <Icon name="reply" size={15} strokeWidth={2.2} />
              {t("admin.messages.replyShort")}
            </button>
          </div>
        ) : null}
        <RowActions
          open={openMenu === m.id}
          onToggle={() => setOpenMenu(openMenu === m.id ? null : m.id)}
          status={m.status}
          onReply={() => {
            setOpenMenu(null);
            onReply(m);
          }}
          onToggleRead={() => {
            setOpenMenu(null);
            onToggleRead(m);
          }}
          onArchive={() => {
            setOpenMenu(null);
            onArchive(m);
          }}
          onDelete={() => {
            setOpenMenu(null);
            onDeleteRequest(m);
          }}
        />
      </div>
    </div>
  );
}

function DeleteMessageModal({ message, onCancel, onConfirm }: { message: MessageRecord; onCancel: () => void; onConfirm: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return createPortal(
    <div
      className="mp-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="msg-del-title">
        <div className="mp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="msg-del-title">
          {t("admin.messages.deleteTitle")}
        </h2>
        <p className="mp-modal__body">{t("admin.messages.deleteBody", { name: message.name })}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </button>
          <button type="button" className="mp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.messages.delete")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

interface ToastData {
  variant?: "danger" | "warn" | "success";
  icon?: IconName;
  title: string;
  message: string;
  onUndo?: () => void;
}
const TOAST_DURATION = 6000;

function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const { t } = useLang();
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLeaving(true);
    setTimeout(onDismiss, 340);
  }, [onDismiss]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  const startTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(close, TOAST_DURATION);
  }, [close]);
  useEffect(() => {
    startTimer();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [startTimer]);
  const pause = () => {
    if (timer.current) clearTimeout(timer.current);
  };
  const cls = ["mp-toast", shown && !leaving ? "is-in" : "", leaving ? "is-out" : ""].filter(Boolean).join(" ");
  const danger = toast.variant === "danger";
  const warn = toast.variant === "warn";
  const iconCls = danger ? " mp-toast__icon--danger" : warn ? " mp-toast__icon--warn" : "";
  const iconName = toast.icon || (danger ? "trash-2" : "check");
  return createPortal(
    <div className="mp-toaster" aria-live="polite" aria-atomic="true">
      <div className={cls} role="status" style={{ ["--mp-toast-dur" as string]: TOAST_DURATION + "ms" }} onMouseEnter={pause} onMouseLeave={startTimer}>
        <span className={"mp-toast__icon" + iconCls}>
          <Icon name={iconName} size={20} strokeWidth={danger ? 1.9 : 2.2} />
        </span>
        <div className="mp-toast__body">
          <p className="mp-toast__title">{toast.title}</p>
          <p className="mp-toast__msg">{toast.message}</p>
          <div className="mp-toast__actions">
            <button type="button" className="mp-toast__btn mp-toast__btn--dismiss" onClick={close}>
              {t("admin.props.dismiss")}
            </button>
            {toast.onUndo && (
              <button
                type="button"
                className="mp-toast__btn mp-toast__btn--undo"
                onClick={() => {
                  toast.onUndo?.();
                  close();
                }}
              >
                <Icon name="undo-2" size={15} />
                {t("admin.props.undo")}
              </button>
            )}
          </div>
        </div>
        <button type="button" className="mp-toast__close" aria-label={t("admin.members.dismissNotif")} onClick={close}>
          <Icon name="x" size={17} />
        </button>
        <span className="mp-toast__progress" />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Contact enquiries inbox. Messages arrive from the website's contact form and
 * the mobile app; the admin reads, answers and files them. Opening a row marks
 * it read, which is why the detail expands in place rather than navigating —
 * this is a queue you page through, and a route round-trip would drop the
 * filter and page you were working in.
 */
export function MessagesApp() {
  const { t, lang } = useLang();
  const messages = useMessages();
  const [filters, setFilters] = useState<MessageFilters>(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<MessageRecord | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const setFilter = (k: keyof MessageFilters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCurrentPage(1);
  };
  const hasActive = Object.values(filters).some(Boolean);
  const unread = messages.filter((m) => m.status === "New").length;

  const toggleExpand = (m: MessageRecord) => {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    // Opening an unopened message is what marks it read — no separate step.
    if (next && m.status === "New") setMessageStatus(m.id, "Read");
  };

  const reply = (m: MessageRecord) => {
    const prev = m.status;
    const subject = t("admin.messages.replySubject", { subject: m.subject });
    window.location.href = `mailto:${m.email}?subject=${encodeURIComponent(subject)}`;
    setMessageStatus(m.id, "Replied");
    logAudit({ category: "message", actionKey: "audit.action.repliedMessage", target: m.name, targetId: m.id, meta: m.subject });
    setToast({
      variant: "success",
      icon: "reply",
      title: t("admin.messages.toast.repliedTitle"),
      // "Marked as replied", not "reply sent": opening a mailto: hands off to
      // the admin's mail client and we never learn whether anything was sent.
      message: t("admin.messages.toast.repliedMsg", { name: m.name }),
      onUndo: () => setMessageStatus(m.id, prev),
    });
  };

  const toggleRead = (m: MessageRecord) => {
    const next: MessageStatus = m.status === "New" ? "Read" : "New";
    setMessageStatus(m.id, next);
    if (next === "New") setOpenId((id) => (id === m.id ? null : id));
  };

  const archive = (m: MessageRecord) => {
    const prev = m.status;
    const next: MessageStatus = m.status === "Archived" ? "Read" : "Archived";
    setMessageStatus(m.id, next);
    if (next === "Archived") setOpenId((id) => (id === m.id ? null : id));
    logAudit({
      category: "message",
      actionKey: next === "Archived" ? "audit.action.archivedMessage" : "audit.action.unarchivedMessage",
      target: m.name,
      targetId: m.id,
      meta: m.subject,
    });
    setToast({
      variant: next === "Archived" ? "warn" : "success",
      icon: next === "Archived" ? "archive" : "archive-restore",
      title: t(next === "Archived" ? "admin.messages.toast.archivedTitle" : "admin.messages.toast.unarchivedTitle"),
      message: t(next === "Archived" ? "admin.messages.toast.archivedMsg" : "admin.messages.toast.unarchivedMsg", { name: m.name }),
      onUndo: () => setMessageStatus(m.id, prev),
    });
  };

  const confirmDelete = () => {
    const target = deleteTarget!;
    deleteMessage(target.id);
    setDeleteTarget(null);
    setOpenId((id) => (id === target.id ? null : id));
    logAudit({ category: "message", actionKey: "audit.action.deletedMessage", target: target.name, targetId: target.id, meta: target.subject });
    setToast({
      variant: "danger",
      title: t("admin.messages.toast.deletedTitle"),
      message: t("admin.messages.toast.deletedMsg", { name: target.name }),
      onUndo: () => restoreMessage(target),
    });
  };

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return messages.filter((m) => {
      if (filters.status && m.status !== filters.status) return false;
      if (filters.source && m.source !== filters.source) return false;
      if (q) {
        const hay = [m.name, m.email, m.subject, m.body, m.propertyTitle ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, messages]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const shown = hasActive ? rows.length : messages.length;

  return (
    <>
      <header className="mp-head">
        <div className="mp-head__intro">
          <h1 className="mp-head__title">{t("admin.messages.title")}</h1>
          <p className="mp-head__sub">{t("admin.messages.sub")}</p>
        </div>
      </header>

      <section className="mp-tablecard">
        <header className="mp-tablecard__head">
          <div className="mp-tablecard__titlerow">
            <div className="mp-tablecard__heading">
              <h2 className="mp-tablecard__title">{t("admin.messages.tableTitle")}</h2>
              <span className="mp-tablecard__count">{fmtNum(lang, shown)}</span>
              {unread > 0 && <span className="msg-unreadpill">{t("admin.messages.unreadCount", { count: fmtNum(lang, unread) })}</span>}
            </div>
            {hasActive && (
              <div className="mp-tablecard__resultnote">
                <span>{t("admin.props.shownOf", { shown: fmtNum(lang, rows.length), total: fmtNum(lang, messages.length) })}</span>
              </div>
            )}
          </div>

          <div className="mp-tabrow">
            <div className="mp-tabs" role="tablist" aria-label={t("admin.messages.filterAria")}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id || "all"}
                  type="button"
                  role="tab"
                  aria-selected={filters.status === tab.id}
                  className={"mp-tab" + (filters.status === tab.id ? " is-active" : "")}
                  onClick={() => setFilter("status", tab.id)}
                >
                  {tab.id === "" ? t("admin.messages.tabAll") : t(valueKey("status", tab.id))}
                </button>
              ))}
            </div>
            <div className="mp-tabrow__right">
              <AdminSelect
                value={filters.source}
                onChange={(v) => setFilter("source", v)}
                options={SOURCES.map((s) => ({ value: s, label: t(s === "Website" ? "admin.messages.source.website" : "admin.messages.source.mobile") }))}
                placeholder={t("admin.messages.allSources")}
                ariaLabel={t("admin.messages.sourceAria")}
              />
              <div className="mp-tabsearch">
                <span className="mp-tabsearch__lead">
                  <Icon name="search" size={16} />
                </span>
                <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder={t("admin.messages.searchPh")} aria-label={t("admin.messages.searchAria")} />
              </div>
            </div>
          </div>
        </header>

        <div className="mp-table mp-table--messages">
          <div className="mp-thead" role="row">
            <span className="mp-th mp-col--member">{t("admin.messages.th.sender")}</span>
            <span className="mp-th msg-col--subject">{t("admin.messages.th.subject")}</span>
            <span className="mp-th msg-col--source">{t("admin.messages.th.source")}</span>
            <span className="mp-th mp-col--joined">{t("admin.messages.th.received")}</span>
            <span className="mp-th mp-col--status">{t("admin.messages.th.status")}</span>
            <span className="mp-th msg-col--actions">{t("admin.messages.th.actions")}</span>
          </div>
          {pagedRows.length > 0 ? (
            pagedRows.map((m) => (
              <div key={m.id} className="msg-group">
                <MessageRow
                  m={m}
                  expanded={openId === m.id}
                  onToggleExpand={() => toggleExpand(m)}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                  onReply={reply}
                  onToggleRead={toggleRead}
                  onArchive={archive}
                  onDeleteRequest={setDeleteTarget}
                />
                {openId === m.id && <MessageDetail m={m} />}
              </div>
            ))
          ) : (
            <div className="mp-noresults">
              <span className="mp-noresults__art">
                <Icon name="search-x" size={26} strokeWidth={1.6} />
              </span>
              <h3>{t("admin.messages.empty.title")}</h3>
              <p>{t("admin.messages.empty.sub")}</p>
            </div>
          )}
        </div>
        <PaginationFooter currentPage={page} totalItems={rows.length} onPageChange={setCurrentPage} />
      </section>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      {deleteTarget && <DeleteMessageModal message={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
