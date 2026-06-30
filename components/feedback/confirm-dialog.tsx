"use client";

import type { ReactNode } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/components/ui/icon";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" uses a destructive confirm button + alert icon. */
  tone?: "default" | "danger";
  icon?: IconName;
  loading?: boolean;
}

/**
 * ConfirmDialog — a focused yes/no dialog built on Modal. Use `tone="danger"`
 * for destructive actions (delete, reject) — it switches the confirm button to
 * destructive and shows an alert icon.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  icon,
  loading = false,
}: ConfirmDialogProps) {
  const headIcon: IconName = icon ?? (tone === "danger" ? "triangle-alert" : "circle-help");
  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={headIcon}
      title={title}
      subtitle={description}
      size="sm"
      footer={
        <>
          <Button hierarchy="tertiary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button hierarchy={tone === "danger" ? "destructive" : "primary"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description ? null : <span style={{ color: "var(--text-secondary)" }}>This action requires confirmation.</span>}
    </Modal>
  );
}
