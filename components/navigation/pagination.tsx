"use client";

import { IconButton } from "@/components/ui/icon-button";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange?: (page: number) => void;
  /** Number of sibling pages around the current page. */
  siblings?: number;
  className?: string;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Build the page list with ellipses, e.g. [1, "…", 4, 5, 6, "…", 20]. */
function buildPages(page: number, pageCount: number, siblings: number): (number | "…")[] {
  const total = siblings * 2 + 5; // first, last, current, 2 ellipses + window
  if (pageCount <= total) return range(1, pageCount);

  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, pageCount);
  const showLeftDots = left > 2;
  const showRightDots = right < pageCount - 1;

  if (!showLeftDots && showRightDots) return [...range(1, siblings * 2 + 3), "…", pageCount];
  if (showLeftDots && !showRightDots) return [1, "…", ...range(pageCount - (siblings * 2 + 2), pageCount)];
  return [1, "…", ...range(left, right), "…", pageCount];
}

/**
 * Pagination — page navigation with prev/next, a windowed page list, and
 * ellipses. Controlled via `page` + `onChange`.
 */
export function Pagination({ page, pageCount, onChange, siblings = 1, className = "" }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = buildPages(page, pageCount, siblings);
  const go = (p: number) => onChange?.(Math.min(Math.max(p, 1), pageCount));

  return (
    <nav
      className={["flex items-center gap-1.5", className].filter(Boolean).join(" ")}
      aria-label="Pagination"
    >
      <IconButton
        icon="chevron-left"
        label="Previous page"
        size="sm"
        disabled={page <= 1}
        onClick={() => go(page - 1)}
      />
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`d${i}`} className="cx-text-sm px-1" style={{ color: "var(--text-tertiary)" }}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            aria-current={p === page ? "page" : undefined}
            onClick={() => go(p)}
            className="cx-tnum inline-flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-semibold transition-colors hover:bg-sunken"
            style={
              p === page
                ? { background: "var(--brand-primary)", color: "var(--text-on-brand)" }
                : { color: "var(--text-secondary)" }
            }
          >
            {p}
          </button>
        ),
      )}
      <IconButton
        icon="chevron-right"
        label="Next page"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => go(page + 1)}
      />
    </nav>
  );
}
