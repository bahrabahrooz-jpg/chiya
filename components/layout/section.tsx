import type { ReactNode } from "react";
import "./section.css";

export interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned action (e.g. "View all" link). */
  action?: ReactNode;
  align?: "start" | "center";
}

/** SectionHeader — eyebrow + display title + subtitle, with an optional action. */
export function SectionHeader({ eyebrow, title, subtitle, action, align = "start" }: SectionHeaderProps) {
  return (
    <div className={"cx-sechead" + (align === "center" ? " cx-sechead--center" : "")}>
      <div className="cx-sechead__text">
        {eyebrow && <div className="cx-eyebrow cx-sechead__eyebrow">{eyebrow}</div>}
        {title && <h2 className="cx-sectitle">{title}</h2>}
        {subtitle && <p className="cx-secsub">{subtitle}</p>}
      </div>
      {action && align !== "center" && <div className="cx-sechead__action">{action}</div>}
    </div>
  );
}

export interface SectionProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title">,
    SectionHeaderProps {
  /** Reduce vertical padding. */
  tight?: boolean;
  /** Remove top padding (to butt against the previous section). */
  flushTop?: boolean;
  children?: ReactNode;
}

/**
 * Section — a vertical page band with consistent rhythm and an optional header.
 * Pass `eyebrow`/`title`/`subtitle`/`action` to render the standard heading.
 */
export function Section({
  tight,
  flushTop,
  eyebrow,
  title,
  subtitle,
  action,
  align,
  className = "",
  children,
  ...rest
}: SectionProps) {
  const hasHeader = eyebrow || title || subtitle || action;
  return (
    <section
      className={["cx-section", tight ? "cx-section--tight" : "", flushTop ? "cx-section--flush-top" : "", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {hasHeader && (
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} action={action} align={align} />
      )}
      {children}
    </section>
  );
}
