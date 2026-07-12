"use client";

import { IconButton, type IconButtonSize, type IconButtonVariant } from "@/components/ui/icon-button";

export interface FavoriteButtonProps {
  active?: boolean;
  onToggle?: () => void;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  className?: string;
}

/**
 * FavoriteButton — a heart save toggle. Defaults to the glass variant for
 * floating over property photography; fills + turns red when active.
 */
export function FavoriteButton({
  active = false,
  onToggle,
  size = "md",
  variant = "glass",
  className,
}: FavoriteButtonProps) {
  return (
    <IconButton
      icon="heart"
      label={active ? "Remove from saved" : "Save listing"}
      variant={variant}
      size={size}
      active={active}
      onClick={(e) => {
        // Don't let a favorite click trigger a parent card link/onClick.
        e.preventDefault();
        e.stopPropagation();
        onToggle?.();
      }}
      // cx-fav pins the mobile-app heart look (34px near-white circle, 18px
      // glyph, #33383F idle / red when saved) regardless of the size prop.
      className={["cx-fav", className].filter(Boolean).join(" ")}
    />
  );
}
