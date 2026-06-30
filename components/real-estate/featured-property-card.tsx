"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { FavoriteButton } from "./favorite-button";

import "./featured-property-card.css";

export interface FeaturedAgent {
  name: string;
  avatar?: string;
  agency?: string;
  verified?: boolean;
}

export interface FeaturedPropertyCardProps {
  image: string;
  thumbs?: string[];
  eyebrow?: string;
  price: string;
  period?: string;
  title: string;
  address: string;
  beds?: number;
  baths?: number;
  area?: number;
  areaUnit?: string;
  description?: string;
  agent?: FeaturedAgent;
  status?: string;
  favorite?: boolean;
  onFavorite?: () => void;
  actions?: ReactNode;
  className?: string;
}

/**
 * FeaturedPropertyCard — large two-pane hero card for the homepage and
 * "featured" rails: photography + gallery strip on one side, rich detail
 * (price, specs, description, agent, actions) on the other.
 */
export function FeaturedPropertyCard({
  image,
  thumbs = [],
  eyebrow = "Featured listing",
  price,
  period,
  title,
  address,
  beds,
  baths,
  area,
  areaUnit = "m²",
  description,
  agent,
  status = "For Sale",
  favorite = false,
  onFavorite,
  actions,
  className = "",
}: FeaturedPropertyCardProps) {
  const extraThumbs = thumbs.length > 3 ? thumbs.length - 3 : 0;
  return (
    <article className={["cx-feat", className].filter(Boolean).join(" ")}>
      <div className="cx-feat__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} />
        <div className="cx-feat__grad" />
        <div className="cx-feat__badges">
          <Badge variant="gold" size="md" icon="star">
            Featured
          </Badge>
          <Badge variant="solid" size="md" dot>
            {status}
          </Badge>
        </div>
        <div className="cx-feat__fav">
          <FavoriteButton active={favorite} onToggle={onFavorite} />
        </div>
        {thumbs.length > 0 && (
          <div className="cx-feat__thumbs">
            {thumbs.slice(0, 3).map((t, i) =>
              i === 2 && extraThumbs > 0 ? (
                <div key={i} className="cx-feat__thumb cx-feat__thumb--more">
                  +{extraThumbs}
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={t} className="cx-feat__thumb" alt="" />
              ),
            )}
          </div>
        )}
      </div>

      <div className="cx-feat__body">
        <div className="cx-feat__eyebrow">
          <Icon name="sparkles" size={14} />
          {eyebrow}
        </div>
        <div>
          <div className="cx-feat__title">{title}</div>
          <div className="cx-feat__addr">
            <Icon name="map-pin" size={15} />
            {address}
          </div>
        </div>
        <div className="cx-feat__price">
          {price}
          {period && <small> /{period}</small>}
        </div>
        <div className="cx-feat__specs">
          {beds != null && (
            <div className="cx-feat__spec">
              <Icon name="bed-double" size={17} />
              <b>{beds}</b>Bedrooms
            </div>
          )}
          {baths != null && (
            <div className="cx-feat__spec">
              <Icon name="bath" size={17} />
              <b>{baths}</b>Bathrooms
            </div>
          )}
          {area != null && (
            <div className="cx-feat__spec">
              <Icon name="maximize-2" size={16} />
              <b>{area}</b>
              {areaUnit}
            </div>
          )}
        </div>
        {description && <div className="cx-feat__desc">{description}</div>}
        <div className="cx-feat__foot">
          {agent && (
            <>
              <Avatar src={agent.avatar} name={agent.name} size="md" verified={agent.verified} />
              <div className="cx-feat__agent">
                <b>{agent.name}</b>
                <span>{agent.agency || "Chiya verified agent"}</span>
              </div>
            </>
          )}
          {actions && <div className="cx-feat__actions">{actions}</div>}
        </div>
      </div>
    </article>
  );
}
