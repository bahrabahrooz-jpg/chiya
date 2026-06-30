"use client";

import { IconButton, type IconButtonSize, type IconButtonVariant } from "@/components/ui/icon-button";
import { toast } from "@/components/feedback/toast";

export interface ShareButtonProps {
  title?: string;
  text?: string;
  /** URL to share; defaults to the current page. */
  url?: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  className?: string;
}

/**
 * ShareButton — uses the native Web Share sheet when available, otherwise
 * copies the link to the clipboard and confirms with a toast.
 */
export function ShareButton({ title, text, url, size = "md", variant = "glass", className }: ShareButtonProps) {
  const onShare = async () => {
    const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url: shareUrl });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Link copied", description: "The listing link is on your clipboard.", variant: "success" });
    } catch {
      /* user cancelled the share sheet — ignore */
    }
  };

  return (
    <IconButton icon="share-2" label="Share" variant={variant} size={size} onClick={onShare} className={className} />
  );
}
