"use client";

import { Icon } from "@/components/ui/icon";
import { FavoriteButton } from "./favorite-button";
import { useLang } from "@/lib/i18n";
import "./agent-card.css";

export interface AgentCardProps {
  name: string;
  photo?: string;
  city?: string;
  verified?: boolean;
  rating?: number;
  listings?: number;
  favorite?: boolean;
  onFavorite?: () => void;
  /** Navigate to the agent profile (whole card is the link). */
  href?: string;
  className?: string;
  onClick?: React.MouseEventHandler;
  style?: React.CSSProperties;
}

/** Landscape banner variant of an agent portrait — mirrors the mobile app helper:
    widen an Unsplash headshot to a half-body 2:1 crop, keeping the face in frame. */
function agentBannerPhoto(photo: string): string {
  if (!photo.includes("images.unsplash.com")) return photo;
  return photo.replace(/\?.*$/, "?w=900&h=450&fit=crop&crop=faces");
}

/**
 * AgentCard — lean "browse" card matching the mobile app: a banner photo with a
 * Verified pill + save heart, then name, city, and a `★ rating · N listings` line.
 * The whole card links to the agent profile.
 */
export function AgentCard({
  name,
  photo,
  city,
  verified = true,
  rating,
  listings,
  favorite = false,
  onFavorite,
  href,
  className = "",
  onClick,
  style,
}: AgentCardProps) {
  const { t } = useLang();
  const Tag = href ? "a" : "article";
  return (
    <Tag
      className={["cx-agent", className].filter(Boolean).join(" ")}
      style={style}
      onClick={onClick}
      {...(href ? { href } : {})}
    >
      <div className="cx-agent__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? (
          <img src={agentBannerPhoto(photo)} alt={name} loading="lazy" />
        ) : (
          <div className="cx-agent__initials" aria-hidden="true">
            {name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
        )}
        {verified && (
          <span className="cx-agent__verify">
            <Icon name="badge-check" size={14} />
            {t("pdp.verified")}
          </span>
        )}
        {onFavorite && (
          <div className="cx-agent__fav">
            <FavoriteButton size="sm" active={favorite} onToggle={onFavorite} />
          </div>
        )}
      </div>
      <div className="cx-agent__body">
        <div className="cx-agent__name">{name}</div>
        {city && (
          <div className="cx-agent__loc">
            <Icon name="map-pin" size={13} />
            <span>{city}</span>
          </div>
        )}
        {/* A 0 rating means "no approved reviews yet", not a score — hide it. */}
        {rating != null && rating > 0 && (
          <div className="cx-agent__stat">
            <Icon name="star" size={14} fill="currentColor" />
            <b>{rating.toFixed(1)}</b>
            {listings != null && listings > 0 && (
              <span>
                · {listings} {t("agents.card.listings")}
              </span>
            )}
          </div>
        )}
      </div>
    </Tag>
  );
}
