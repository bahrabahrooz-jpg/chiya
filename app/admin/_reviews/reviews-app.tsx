"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLang, isRtl } from "@/lib/i18n";
import { fmtDate, fmtNum, valueKey, popupLeft } from "@/lib/fmt";
import {
  EMPTY_FILTERS,
  ITEMS_PER_PAGE,
  REVIEWS,
  REVIEW_STATUS,
  STATUS_TABS,
  type ReviewFilters,
  type ReviewRecord,
  type ReviewStatus,
} from "./data";
import { logAudit } from "../_shared/audit-log";

function Stars({ value }: { value: number }) {
  const { t, lang } = useLang();
  return (
    <span className="rv-stars" aria-label={t("admin.reviews.starsAria", { value: fmtNum(lang, value) })}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={15} strokeWidth={2} className={i <= value ? "rv-star is-on" : "rv-star"} fill={i <= value ? "currentColor" : "none"} />
      ))}
    </span>
  );
}

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
        {t("admin.reviews.showingRange", { start: fmtNum(lang, start), end: fmtNum(lang, end), total: fmtNum(lang, totalItems) })}
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

function RowActions({ open, onToggle, status, onApprove, onReject, onDelete }: { open: boolean; onToggle: () => void; status: ReviewStatus; onApprove: () => void; onReject: () => void; onDelete: () => void }) {
  const { t, lang } = useLang();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useEffect(() => {
    if (!open || !btnRef.current) {
      setPos(null);
      return;
    }
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: popupLeft(r, 196, isRtl(lang)) });
  }, [open, lang]);

  const menu =
    pos &&
    createPortal(
      <div className="mp-amenu" role="menu" style={{ top: pos.top, left: pos.left }}>
        <div className="mp-amenu__sect">
          {status !== "Approved" && (
            <button type="button" className="mp-aitem" role="menuitem" onClick={onApprove}>
              <Icon name="circle-check" size={17} />
              {t("admin.reviews.approve")}
            </button>
          )}
          {status !== "Rejected" && (
            <button type="button" className="mp-aitem" role="menuitem" onClick={onReject}>
              <Icon name="circle-x" size={17} />
              {t("admin.reviews.reject")}
            </button>
          )}
        </div>
        <div className="mp-amenu__sect">
          <button type="button" className="mp-aitem mp-aitem--danger" role="menuitem" onClick={onDelete}>
            <Icon name="trash-2" size={17} />
            {t("admin.reviews.delete")}
          </button>
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="mp-actions">
      <button ref={btnRef} type="button" className={"mp-kebab" + (open ? " is-open" : "")} aria-label={t("admin.reviews.actions")} aria-haspopup="menu" aria-expanded={open} onClick={onToggle}>
        <Icon name="more-horizontal" size={19} />
      </button>
      {open && menu}
    </div>
  );
}

function ReviewRow({
  r,
  openMenu,
  setOpenMenu,
  onApprove,
  onReject,
  onDeleteRequest,
  hideAgent,
  readOnly,
}: {
  r: ReviewRecord;
  openMenu: string | null;
  setOpenMenu: (v: string | null) => void;
  onApprove: (r: ReviewRecord) => void;
  onReject: (r: ReviewRecord) => void;
  onDeleteRequest: (r: ReviewRecord) => void;
  hideAgent: boolean;
  readOnly: boolean;
}) {
  const { t, lang } = useLang();
  const st = REVIEW_STATUS[r.status];
  const pending = r.status === "Pending";
  return (
    <div className="mp-row">
      <div className="mp-col--member">
        <div className="mp-member">
          <Avatar src={r.memberImg || undefined} name={r.memberName} size="md" />
          <div className="mp-member__body">
            <span className="mp-member__name">{r.memberName}</span>
            <span className="mp-member__id">{r.memberId}</span>
          </div>
        </div>
      </div>
      <div className="rv-col--rating">
        <span className="mp-celllabel">{t("admin.reviews.th.rating")}</span>
        <Stars value={r.stars} />
      </div>
      <div className="rv-col--review">
        <span className="mp-celllabel">{t("admin.reviews.th.review")}</span>
        <p className="rv-reviewtext">{r.text}</p>
      </div>
      {!hideAgent && (
        <div className="rv-col--agent">
          <span className="mp-celllabel">{t("admin.reviews.th.agent")}</span>
          <span className="rv-agent">
            <Avatar src={r.agentImg || undefined} name={r.agentName} size="sm" />
            <span className="rv-agent__name">{r.agentName}</span>
          </span>
        </div>
      )}
      <div className="mp-col--joined">
        <span className="mp-celllabel">{t("admin.reviews.th.submitted")}</span>
        <span className="mp-date">{fmtDate(lang, new Date(r.submitted))}</span>
      </div>
      <div className="mp-col--status">
        <span className="mp-celllabel">{t("admin.reviews.th.status")}</span>
        <Badge variant={st.variant} size="sm" dot={st.dot} className="mp-statusbadge">
          {t(valueKey("status", r.status))}
        </Badge>
      </div>
      {!readOnly && (
        <div className="rv-col--actions">
          {pending ? (
            <div className="rv-quickactions">
              <button type="button" className="rv-approve" aria-label={t("admin.reviews.approve")} onClick={() => onApprove(r)}>
                <Icon name="check" size={15} strokeWidth={2.4} />
                {t("admin.reviews.approveShort")}
              </button>
              <button type="button" className="rv-reject" aria-label={t("admin.reviews.reject")} onClick={() => onReject(r)}>
                <Icon name="x" size={15} strokeWidth={2.4} />
              </button>
            </div>
          ) : (
            <RowActions
              open={openMenu === r.id}
              onToggle={() => setOpenMenu(openMenu === r.id ? null : r.id)}
              status={r.status}
              onApprove={() => {
                setOpenMenu(null);
                onApprove(r);
              }}
              onReject={() => {
                setOpenMenu(null);
                onReject(r);
              }}
              onDelete={() => {
                setOpenMenu(null);
                onDeleteRequest(r);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function DeleteReviewModal({ review, onCancel, onConfirm }: { review: ReviewRecord; onCancel: () => void; onConfirm: () => void }) {
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
      <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="rv-del-title">
        <div className="mp-modal__icon">
          <Icon name="trash-2" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="rv-del-title">
          {t("admin.reviews.deleteTitle")}
        </h2>
        <p className="mp-modal__body">{t("admin.reviews.deleteBody", { member: review.memberName, agent: review.agentName })}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onCancel}>
            {t("admin.topbar.cancel")}
          </button>
          <button type="button" className="mp-modal__delete" onClick={onConfirm}>
            <Icon name="trash-2" size={15} />
            {t("admin.reviews.delete")}
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
 * Reviews moderation table. `scopeAgent` narrows it to one agent's reviews and
 * drops the now-redundant agent column; `readOnly` hides every moderation
 * control. The agent surface passes both — agents read reviews about
 * themselves, only an admin approves or rejects them.
 */
export function ReviewsApp({ scopeAgent, readOnly = false }: { scopeAgent?: string; readOnly?: boolean } = {}) {
  const { t, lang } = useLang();
  const hideAgent = !!scopeAgent;
  const [reviews, setReviews] = useState<ReviewRecord[]>(() => (scopeAgent ? REVIEWS.filter((r) => r.agentName === scopeAgent) : REVIEWS));
  const [filters, setFilters] = useState<ReviewFilters>(EMPTY_FILTERS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ReviewRecord | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const setFilter = (k: keyof ReviewFilters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setCurrentPage(1);
  };
  const hasActive = Object.values(filters).some(Boolean);

  const setStatus = (id: string, status: ReviewStatus) => setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));

  const approve = (r: ReviewRecord) => {
    setStatus(r.id, "Approved");
    logAudit({ category: "review", actionKey: "audit.action.approvedReview", target: `${r.memberName} → ${r.agentName}`, targetId: r.id });
    setToast({
      variant: "success",
      icon: "circle-check",
      title: t("admin.reviews.toast.approvedTitle"),
      message: t("admin.reviews.toast.approvedMsg", { member: r.memberName, agent: r.agentName }),
    });
  };
  const reject = (r: ReviewRecord) => {
    setStatus(r.id, "Rejected");
    logAudit({ category: "review", actionKey: "audit.action.rejectedReview", target: `${r.memberName} → ${r.agentName}`, targetId: r.id });
    setToast({ variant: "warn", icon: "circle-x", title: t("admin.reviews.toast.rejectedTitle"), message: t("admin.reviews.toast.rejectedMsg", { member: r.memberName }) });
  };
  const confirmDelete = () => {
    const target = deleteTarget!;
    setReviews((rs) => rs.filter((r) => r.id !== target.id));
    setDeleteTarget(null);
    logAudit({ category: "review", actionKey: "audit.action.deletedReview", target: `${target.memberName} → ${target.agentName}`, targetId: target.id });
    setToast({
      variant: "danger",
      title: t("admin.reviews.toast.deletedTitle"),
      message: t("admin.reviews.toast.deletedMsg", { member: target.memberName }),
      onUndo: () => setReviews((rs) => [target, ...rs]),
    });
  };

  useEffect(() => {
    if (!openMenu) return;
    const close = () => setOpenMenu(null);
    window.addEventListener("scroll", close, true);
    return () => window.removeEventListener("scroll", close, true);
  }, [openMenu]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return reviews.filter((r) => {
      if (filters.status && r.status !== filters.status) return false;
      if (q) {
        const hay = [r.memberName, r.agentName, r.text, r.memberId].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [filters, reviews]);

  const totalPages = Math.max(1, Math.ceil(rows.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pagedRows = rows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const shown = hasActive ? rows.length : reviews.length;

  return (
    <>
      <header className="mp-head">
        <div className="mp-head__intro">
          <h1 className="mp-head__title">{t("admin.reviews.title")}</h1>
          <p className="mp-head__sub">{t(readOnly ? "agent.reviews.sub" : "admin.reviews.sub")}</p>
        </div>
      </header>

      <section className="mp-tablecard">
        <header className="mp-tablecard__head">
          <div className="mp-tablecard__titlerow">
            <div className="mp-tablecard__heading">
              <h2 className="mp-tablecard__title">{t("admin.reviews.tableTitle")}</h2>
              <span className="mp-tablecard__count">{fmtNum(lang, shown)}</span>
            </div>
            {hasActive && (
              <div className="mp-tablecard__resultnote">
                <span>{t("admin.props.shownOf", { shown: fmtNum(lang, rows.length), total: fmtNum(lang, reviews.length) })}</span>
              </div>
            )}
          </div>

          <div className="mp-tabrow">
            <div className="mp-tabs" role="tablist" aria-label={t("admin.reviews.filterAria")}>
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.id || "all"}
                  type="button"
                  role="tab"
                  aria-selected={filters.status === tab.id}
                  className={"mp-tab" + (filters.status === tab.id ? " is-active" : "")}
                  onClick={() => setFilter("status", tab.id)}
                >
                  {tab.id === "" ? t("admin.reviews.tabAll") : t(valueKey("status", tab.id))}
                </button>
              ))}
            </div>
            <div className="mp-tabrow__right">
              <div className="mp-tabsearch">
                <span className="mp-tabsearch__lead">
                  <Icon name="search" size={16} />
                </span>
                <input type="text" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} placeholder={t("admin.reviews.searchPh")} aria-label={t("admin.reviews.searchAria")} />
              </div>
            </div>
          </div>
        </header>

        <div className={"mp-table mp-table--reviews" + (hideAgent ? " mp-table--noagent" : "") + (readOnly ? " mp-table--noactions" : "")}>
          <div className="mp-thead" role="row">
            <span className="mp-th mp-col--member">{t("admin.reviews.th.member")}</span>
            <span className="mp-th rv-col--rating">{t("admin.reviews.th.rating")}</span>
            <span className="mp-th rv-col--review">{t("admin.reviews.th.review")}</span>
            {!hideAgent && <span className="mp-th rv-col--agent">{t("admin.reviews.th.agent")}</span>}
            <span className="mp-th mp-col--joined">{t("admin.reviews.th.submitted")}</span>
            <span className="mp-th mp-col--status">{t("admin.reviews.th.status")}</span>
            {!readOnly && <span className="mp-th rv-col--actions">{t("admin.reviews.th.actions")}</span>}
          </div>
          {pagedRows.length > 0 ? (
            pagedRows.map((r) => (
              <ReviewRow key={r.id} r={r} openMenu={openMenu} setOpenMenu={setOpenMenu} onApprove={approve} onReject={reject} onDeleteRequest={setDeleteTarget} hideAgent={hideAgent} readOnly={readOnly} />
            ))
          ) : (
            <div className="mp-noresults">
              <span className="mp-noresults__art">
                <Icon name="search-x" size={26} strokeWidth={1.6} />
              </span>
              <h3>{t("admin.reviews.empty.title")}</h3>
              <p>{t("admin.reviews.empty.sub")}</p>
            </div>
          )}
        </div>
        <PaginationFooter currentPage={page} totalItems={rows.length} onPageChange={setCurrentPage} />
      </section>

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      {deleteTarget && <DeleteReviewModal review={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />}
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
    </>
  );
}
