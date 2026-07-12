"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useClickOutside } from "@/lib/use-click-outside";
import { STATUS_LABEL, type MemberListing } from "@/lib/listings";
import "@/components/real-estate/property-card.css";
import "./my-listings.css";

const STATUS_VARIANT: Record<MemberListing["status"], BadgeVariant> = {
  draft: "neutral",
  pending: "warning",
  published: "success",
  rejected: "error",
};

export interface ListingCardProps {
  listing: MemberListing;
  onView: (l: MemberListing) => void;
  onEdit: (l: MemberListing) => void;
  onDelete: (l: MemberListing) => void;
}

/**
 * ListingCard — a member's submitted property, using the same premium card
 * design as the public search results (`cx-prop`). The favourite/heart slot is
 * replaced with a quick-actions menu (View · Edit · Delete).
 */
export function ListingCard({ listing, onView, onEdit, onDelete }: ListingCardProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const dealLabel = listing.deal === "rent" ? "For Rent" : "For Sale";
  const run = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <article className="cx-prop">
      <div className="cx-prop__media">
        {listing.cover ? (
          <img src={listing.cover} alt={listing.title} loading="lazy" />
        ) : (
          <span className="ml-prop__ph">
            <Icon name="image" size={30} />
          </span>
        )}
        <div className="cx-prop__grad" />
        <div className="cx-prop__badges">
          <Badge variant={listing.deal === "rent" ? "info" : "success"} size="sm" icon={listing.deal === "rent" ? "key" : "tag"}>
            {dealLabel}
          </Badge>
          <Badge variant={STATUS_VARIANT[listing.status]} size="sm" dot>
            {STATUS_LABEL[listing.status]}
          </Badge>
        </div>
        <div className="cx-prop__fav">
          <div className="ml-qa" ref={ref}>
            <button
              type="button"
              className="ml-qa__btn"
              aria-label="Quick actions"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((o) => !o);
              }}
            >
              <Icon name="ellipsis-vertical" size={20} />
            </button>
            {open && (
              <div className="ml-qa__menu" role="menu">
                <button type="button" className="ml-qa__item" role="menuitem" onClick={run(() => onView(listing))}>
                  <Icon name="eye" size={16} />
                  View
                </button>
                <button type="button" className="ml-qa__item" role="menuitem" onClick={run(() => onEdit(listing))}>
                  <Icon name="pencil" size={16} />
                  Edit
                </button>
                <button type="button" className="ml-qa__item ml-qa__item--danger" role="menuitem" onClick={run(() => onDelete(listing))}>
                  <Icon name="trash-2" size={16} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="cx-prop__body">
        <div className="cx-prop__titleln">
          <div className="cx-prop__title">{listing.title}</div>
          <div className="cx-prop__price">
            {listing.price || "Price on request"}
            {listing.price && listing.deal === "rent" && <small> /mo</small>}
          </div>
        </div>
        <div className="cx-prop__addr">
          <Icon name="map-pin" size={14} />
          <span>{listing.location}</span>
        </div>
        <div className="cx-prop__specs">
          <div className="cx-prop__spec">
            <Icon name="bed-double" size={17} />
            <b>{listing.beds ?? 0}</b>Beds
          </div>
          <div className="cx-prop__spec">
            <Icon name="bath" size={17} />
            <b>{listing.baths ?? 0}</b>Baths
          </div>
          <div className="cx-prop__spec">
            <Icon name="maximize" size={16} />
            <b>{listing.area || 0}</b>
          </div>
        </div>
      </div>
    </article>
  );
}
