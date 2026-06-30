"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "./favorite-button";
import { PropertyStatusBadge, type PropertyStatus } from "./property-status-badge";
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
 * Photo with status/featured badges + favorite, then price, title, address,
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
  featured = false,
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
          {featured && (
            <Badge variant="gold" size="sm" icon="star">
              Featured
            </Badge>
          )}
          {status && <PropertyStatusBadge status={status} />}
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
        <div className="cx-prop__priceln">
          <div className="cx-prop__price">
            {price}
            {period && <small> /{period}</small>}
          </div>
        </div>
        <div>
          <div className="cx-prop__title">{title}</div>
          <div className="cx-prop__addr">
            <Icon name="map-pin" size={14} />
            <span>{address}</span>
          </div>
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
              <Icon name="maximize-2" size={16} />
              <b>{area}</b>
              {areaUnit}
            </div>
          )}
        </div>
      </div>
    </Tag>
  );
}
