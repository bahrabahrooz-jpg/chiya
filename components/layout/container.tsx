import type { ReactNode } from "react";

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "2xl";

const MAX: Record<ContainerSize, string> = {
  sm: "var(--container-sm)",
  md: "var(--container-md)",
  lg: "var(--container-lg)",
  xl: "var(--container-xl)",
  "2xl": "var(--container-2xl)",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  children?: ReactNode;
}

/**
 * Container — centered content column with responsive gutters (20 → 48 → 80px),
 * capped at a design-system max width. Defaults to the 1280px content width.
 */
export function Container({ size = "xl", className = "", style, children, ...rest }: ContainerProps) {
  return (
    <div
      className={["cx-container", className].filter(Boolean).join(" ")}
      style={{ maxWidth: MAX[size], ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
