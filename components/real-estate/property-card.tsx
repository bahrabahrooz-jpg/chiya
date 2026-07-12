"use client";

import { Icon } from "@/components/ui/icon";
import { FavoriteButton } from "./favorite-button";
import { CardStatusPill, type PropertyStatus } from "./property-status-badge";
import "./property-card.css";

export interface PropertyCardProps {
  image: string;
  price: string;
  period?: string;
  title: string;
  address: string;
  beds?: number;
  baths?: number;
  area?: number;
  areaUnit?: string;
  status?: PropertyStatus;
  /** Retained for API compat; the "Featured" tag is no longer rendered. */
  featured?: boolean;
  photoCount?: number;
  favorite?: boolean;
  onFavorite?: () => void;
  href?: string;
  className?: string;
  /** Make the whole card clickable (navigate). */
  onClick?: React.MouseEventHandler;
  style?: React.CSSProperties;
}

/**
 * PropertyCard — the workhorse listing card used across grids and search.
 * Photo with a status badge + favorite, then price, title, address,
 * and a beds/baths/area spec row.
 */
export function PropertyCard({
  image,
  price,
  period,
  title,
  address,
  beds,
  baths,
  area,
  areaUnit = "m²",
  status = "For Sale",
  photoCount,
  favorite = false,
  onFavorite,
  href,
  className = "",
  onClick,
  style,
}: PropertyCardProps) {
  const Tag = href ? "a" : "article";
  return (
    <Tag
      className={["cx-prop", className].filter(Boolean).join(" ")}
      style={style}
      onClick={onClick}
      {...(href ? { href } : {})}
    >
      <div className="cx-prop__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} loading="lazy" />
        <div className="cx-prop__grad" />
        <div className="cx-prop__badges">
          {status && <CardStatusPill status={status} />}
        </div>
        <div className="cx-prop__fav">
          <FavoriteButton size="sm" active={favorite} onToggle={onFavorite} />
        </div>
        {photoCount != null && (
          <div className="cx-prop__count">
            <Icon name="image" size={13} />
            {photoCount}
          </div>
        )}
      </div>
      <div className="cx-prop__body">
        <div className="cx-prop__titleln">
          <div className="cx-prop__title">{title}</div>
          <div className="cx-prop__price">
            {price}
            {period && <small> /{period}</small>}
          </div>
        </div>
        <div className="cx-prop__addr">
          <Icon name="map-pin" size={14} />
          <span>{address}</span>
        </div>
        <div className="cx-prop__specs">
          {beds != null && (
            <div className="cx-prop__spec">
              <Icon name="bed-double" size={17} />
              <b>{beds}</b>Beds
            </div>
          )}
          {baths != null && (
            <div className="cx-prop__spec">
              <Icon name="bath" size={17} />
              <b>{baths}</b>Baths
            </div>
          )}
          {area != null && (
            <div className="cx-prop__spec">
              <Icon name="maximize" size={16} />
              <b>{area}</b>
              {areaUnit}
            </div>
          )}
        </div>
      </div>
    </Tag>
  );
}
