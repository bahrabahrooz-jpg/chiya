"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import "./toast.css";

export type ToastVariant = "brand" | "success" | "warning" | "error" | "info";

export interface ToastOptions {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  /** Auto-dismiss after ms (default 4500; 0 = sticky). */
  duration?: number;
}
interface ToastRecord extends ToastOptions {
  id: number;
}

const VARIANT_ICON: Record<ToastVariant, IconName> = {
  brand: "circle-check",
  success: "circle-check",
  warning: "triangle-alert",
  error: "circle-alert",
  info: "info",
};

/* ---- module store ---- */
let toasts: ToastRecord[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  toasts = [...toasts];
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function dismiss(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  const tm = timers.get(id);
  if (tm) {
    clearTimeout(tm);
    timers.delete(id);
  }
  emit();
}

/** Imperatively show a toast from anywhere (returns the toast id). */
export function toast(opts: ToastOptions): number {
  const id = nextId++;
  toasts = [...toasts, { id, variant: "brand", duration: 4500, ...opts }];
  const duration = opts.duration ?? 4500;
  if (duration > 0) timers.set(id, setTimeout(() => dismiss(id), duration));
  emit();
  return id;
}
toast.dismiss = dismiss;

/** Hook form — returns the same imperative API for ergonomic use in components. */
export function useToast() {
  return { toast, dismiss };
}

const noopSubscribe = () => () => {};
function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * Toaster — mount once near the app root. Renders the stacked toast portal and
 * subscribes to the module store. Trigger toasts with `toast(...)` / `useToast`.
 */
export function Toaster() {
  const items = useSyncExternalStore(subscribe, () => toasts, () => toasts);
  const isClient = useIsClient();

  // Clear timers on unmount.
  useEffect(() => () => timers.forEach((t) => clearTimeout(t)), []);

  if (!isClient) return null;

  return createPortal(
    <div className="cx-toaster" role="region" aria-label="Notifications" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="cx-toast">
          <span className={`cx-toast__icon cx-toast__icon--${t.variant}`}>
            <Icon name={VARIANT_ICON[t.variant ?? "brand"]} size={18} />
          </span>
          <div className="cx-toast__body">
            <div className="cx-toast__title">{t.title}</div>
            {t.description && <div className="cx-toast__desc">{t.description}</div>}
          </div>
          <button type="button" className="cx-toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
            <Icon name="x" size={15} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
