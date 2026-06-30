import type { CSSProperties, ReactNode } from "react";

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fixed column count (1–12). Ignored when `min` is set. */
  cols?: number;
  /** Min column width for an auto-fit responsive grid, e.g. "280px". */
  min?: string;
  /** Gap between cells (any CSS length / token). Defaults to the grid gutter. */
  gap?: string;
  children?: ReactNode;
}

/**
 * Grid — thin CSS-grid helper. Pass `cols` for a fixed N-column grid, or `min`
 * for an auto-fit grid that wraps responsively without media queries.
 */
export function Grid({ cols = 12, min, gap = "var(--grid-gutter)", className = "", style, children, ...rest }: GridProps) {
  const gridStyle: CSSProperties = {
    display: "grid",
    gap,
    gridTemplateColumns: min ? `repeat(auto-fill, minmax(${min}, 1fr))` : `repeat(${cols}, minmax(0, 1fr))`,
    ...style,
  };
  return (
    <div className={className} style={gridStyle} {...rest}>
      {children}
    </div>
  );
}
