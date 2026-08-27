"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import "./finance-modals.css";

/* ----------------------------------------------------------------------------
   The confirmation these modals leave behind.

   MODALS CONFIRM AND STAY — none of them navigate — so the toast is the only
   thing that says the action landed. Same shape and same timing as the
   pp-toast the properties screens use, in the fm- namespace and shipped with
   this folder, because two of the three screens that open these modals (the
   contracts list and the contract detail page) have no toaster of their own and
   copying a fourth one into their route stylesheets is how the existing five
   copies happened.

   A screen that ALREADY has a toaster keeps it — the property detail page
   pushes these confirmations through its own.
   ------------------------------------------------------------------------- */

export type ToastTone = "success" | "brand" | "danger";

export interface FinanceToast {
  id: number;
  tone: ToastTone;
  icon: IconName;
  title: string;
  msg: string;
  out?: boolean;
}

const VISIBLE_MS = 5000;
const EXIT_MS = 380;

export function useFinanceToasts(): [FinanceToast[], (t: Omit<FinanceToast, "id">) => void, (id: number) => void] {
  const [toasts, setToasts] = useState<FinanceToast[]>([]);

  const push = useCallback((toast: Omit<FinanceToast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { ...toast, id }]);
    setTimeout(() => setToasts((ts) => ts.map((x) => (x.id === id ? { ...x, out: true } : x))), VISIBLE_MS);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), VISIBLE_MS + EXIT_MS);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.map((x) => (x.id === id ? { ...x, out: true } : x)));
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), EXIT_MS);
  }, []);

  return [toasts, push, dismiss];
}

function ToastCard({ toast, onDismiss }: { toast: FinanceToast; onDismiss: () => void }) {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div
      className={
        "fm-toast" +
        (toast.tone === "danger" ? " fm-toast--danger" : "") +
        (visible && !toast.out ? " is-in" : "") +
        (toast.out ? " is-out" : "")
      }
    >
      <span className={"fm-toast__icon fm-toast__icon--" + toast.tone}>
        <Icon name={toast.icon} size={20} strokeWidth={2.25} />
      </span>
      <div className="fm-toast__body">
        <p className="fm-toast__title">{toast.title}</p>
        <p className="fm-toast__msg">{toast.msg}</p>
      </div>
      <button type="button" className="fm-toast__close" aria-label={t("admin.props.close")} onClick={onDismiss}>
        <Icon name="x" size={16} strokeWidth={2} />
      </button>
      <div className="fm-toast__progress" />
    </div>
  );
}

export function FinanceToaster({ toasts, onDismiss }: { toasts: FinanceToast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="fm-toaster" aria-live="polite">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}
