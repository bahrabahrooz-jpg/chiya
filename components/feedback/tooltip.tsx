import type { ReactNode } from "react";
import "./tooltip.css";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  /** Tooltip text / content. */
  content: ReactNode;
  side?: TooltipSide;
  children: ReactNode;
  className?: string;
}

/**
 * Tooltip — lightweight hover/focus label. CSS-driven (no JS state), so it is
 * SSR-safe and works for keyboard focus. Wrap any focusable trigger.
 */
export function Tooltip({ content, side = "top", children, className = "" }: TooltipProps) {
  return (
    <span className={["cx-tip", className].filter(Boolean).join(" ")}>
      {children}
      <span role="tooltip" className={`cx-tip__bubble cx-tip__bubble--${side}`}>
        {content}
      </span>
    </span>
  );
}
