import type { CSSProperties, ReactNode } from "react";
import "./hero.css";

export interface HeroProps {
  /** Background image URL (served from /public or remote). */
  image?: string;
  /** Scrim style: light (default, daytime) or dark (for dark photography). */
  overlay?: "light" | "dark";
  /** Slow Ken-Burns push on the background. */
  animate?: boolean;
  align?: "start" | "center";
  minHeight?: number;
  className?: string;
  /** Foreground content (rendered above the scrim). */
  children?: ReactNode;
}

/**
 * Hero — full-bleed photographic banner with a built-in legibility scrim and
 * an optional slow background motion. Compose the headline / search inside.
 */
export function Hero({
  image,
  overlay = "light",
  animate = false,
  align = "center",
  minHeight,
  className = "",
  children,
}: HeroProps) {
  const style = minHeight ? ({ "--cx-hero-h": `${minHeight}px` } as CSSProperties) : undefined;
  return (
    <section className={["cx-hero", animate ? "cx-hero--animate" : "", className].filter(Boolean).join(" ")} style={style}>
      <div className="cx-hero__media" aria-hidden="true">
        {image && <div className="cx-hero__bg" style={{ backgroundImage: `url(${image})` }} />}
        <div className={"cx-hero__grad" + (overlay === "dark" ? " cx-hero__grad--dark" : "")} />
      </div>
      <div className={"cx-hero__inner" + (align === "center" ? " cx-hero__inner--center" : "")}>{children}</div>
    </section>
  );
}
