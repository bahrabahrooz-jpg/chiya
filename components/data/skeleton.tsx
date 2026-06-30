import type { CSSProperties } from "react";
import "./skeleton.css";

export type SkeletonVariant = "rect" | "text" | "circle";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  /** Number of stacked lines (text variant). */
  lines?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Skeleton — animated loading placeholder. Use `variant="text"` with `lines`
 * for paragraphs, `circle` for avatars, or `rect` (default) for media/cards.
 */
export function Skeleton({ variant = "rect", width, height, lines = 1, className = "", style }: SkeletonProps) {
  const cls = ["cx-skel", variant !== "rect" ? `cx-skel--${variant}` : "", className].filter(Boolean).join(" ");

  if (variant === "text" && lines > 1) {
    return (
      <div className="flex flex-col gap-2" style={{ width }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cls}
            style={{ height: height ?? 12, width: i === lines - 1 ? "70%" : "100%", ...style }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cls}
      style={{
        width,
        height: height ?? (variant === "text" ? 12 : variant === "circle" ? width : 16),
        ...style,
      }}
    />
  );
}
