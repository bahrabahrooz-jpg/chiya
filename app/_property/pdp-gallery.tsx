"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { CardStatusPill, FavoriteButton } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { usePdp } from "./pdp-context";

export interface PdpGalleryProps {
  images: string[];
  favorite: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

const VISIBLE = 5;

export function PdpGallery({ images, favorite, onFavorite, onShare }: PdpGalleryProps) {
  const { t } = useLang();
  const { property } = usePdp();
  const total = images.length;
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const go = (delta: number) => setActive((c) => (c + delta + total) % total);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  };

  const thumb = (i: number) => (
    <button
      key={i}
      type="button"
      className={"pdp-gal__thumb" + (i === active ? " pdp-gal__thumb--active" : "")}
      onClick={() => setActive(i)}
      aria-label={`View photo ${i + 1} of ${total}`}
      aria-current={i === active ? "true" : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[i]} alt={`${property.title} thumbnail ${i + 1}`} loading="lazy" />
    </button>
  );

  const hasMore = total > VISIBLE;
  const collapsedTiles = [];
  for (let i = 0; i < VISIBLE && i < total; i++) {
    if (hasMore && i === VISIBLE - 1) {
      collapsedTiles.push(
        <button
          key="more"
          type="button"
          className="pdp-gal__thumb pdp-gal__thumb--more"
          onClick={() => setExpanded(true)}
          aria-label={`Show all ${total} photos`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[i]} alt="" loading="lazy" />
          <span className="pdp-gal__more">
            <b>+{total - VISIBLE}</b>
            <span>More photos</span>
          </span>
        </button>,
      );
    } else {
      collapsedTiles.push(thumb(i));
    }
  }

  return (
    <div className="pdp-gal">
      <div className="pdp-gal__hero" ref={heroRef} tabIndex={0} onKeyDown={onKey}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={active} className="pdp-gal__img pdp-gal__img--enter" src={images[active]} alt={`${property.title} — photo ${active + 1}`} />
        <div className="pdp-gal__grad" />
        <div className="pdp-gal__tl">
          <CardStatusPill status={property.status} />
        </div>
        <div className="pdp-gal__tr">
          <IconButton icon="share-2" label="Share" variant="glass" className="cx-fav" onClick={onShare} />
          <FavoriteButton active={favorite} onToggle={onFavorite} />
        </div>
        {property.hasTour && (
          <span className="pdp-gal__tour">
            <Icon name="play-circle" size={15} />
            {t("pdp.tour")}
          </span>
        )}
        <span className="pdp-gal__count">
          <Icon name="images" size={14} />
          {active + 1} / {total}
        </span>
        <button className="pdp-gal__nav pdp-gal__nav--prev" type="button" aria-label="Previous photo" onClick={() => go(-1)}>
          <Icon name="chevron-left" size={22} />
        </button>
        <button className="pdp-gal__nav pdp-gal__nav--next" type="button" aria-label="Next photo" onClick={() => go(1)}>
          <Icon name="chevron-right" size={22} />
        </button>
      </div>

      {expanded ? (
        <>
          <div className="pdp-gal__strip pdp-gal__strip--all">{images.map((_, i) => thumb(i))}</div>
          <button className="pdp-gal__collapse" type="button" onClick={() => setExpanded(false)}>
            <Icon name="chevron-up" size={16} />
            Show fewer photos
          </button>
        </>
      ) : (
        <div className="pdp-gal__strip">{collapsedTiles}</div>
      )}
    </div>
  );
}
