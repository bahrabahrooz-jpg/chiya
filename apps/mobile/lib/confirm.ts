import { useSyncExternalStore } from "react";
import { type LucideIcon } from "lucide-react-native";

/**
 * Confirm — a tiny global store powering the app-wide confirmation sheet, so any
 * screen can prompt with `confirm({ ... })` (imperative, like Alert.alert) while
 * the UI stays a Chiya-styled bottom sheet rendered once at the root.
 */
export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Amber "warning" styling (icon + confirm button) — softer than destructive. */
  warning?: boolean;
  icon?: LucideIcon;
  onConfirm: () => void;
}

let current: ConfirmOptions | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Open the confirmation sheet. */
export function confirm(options: ConfirmOptions) {
  current = options;
  emit();
}

/** Close it (Cancel, scrim tap, or after confirming). */
export function dismissConfirm() {
  current = null;
  emit();
}

export function useConfirm(): ConfirmOptions | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
}
