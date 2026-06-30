"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/icon-button";
import "./property-gallery.css";

export interface PropertyGalleryProps {
  images: string[];
  status?: string;
  /** Extra badges shown top-start alongside the status. */
  badges?: ReactNode;
  maxThumbs?: number;
  onExpand?: () => void;
  className?: string;
}

/**
 * PropertyGallery — main stage + thumbnail strip with prev/next navigation and
 * a photo counter. Manages its own active index.
 */
export function PropertyGallery({ images, status, badges, maxThumbs = 5, onExpand, className = "" }: PropertyGalleryProps) {
  const [i, setI] = useState(0);
  const n = images.length;
  const go = (d: number) => setI((p) => (p + d + n) % n);
  const thumbs = images.slice(0, maxThumbs);
  const extra = n - thumbs.length;

  return (
    <div className={["cx-gallery", className].filter(Boolean).join(" ")}>
      <div className="cx-gallery__stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`Property photo ${i + 1}`} />
        <div className="cx-gallery__topleft">
          {status && (
            <Badge variant="solid" size="md" dot>
              {status}
            </Badge>
          )}
          {badges}
        </div>
        <div className="cx-gallery__topright">
          <IconButton icon="share-2" label="Share" variant="glass" />
          <IconButton icon="heart" label="Save" variant="glass" />
        </div>
        {n > 1 && (
          <div className="cx-gallery__nav cx-gallery__nav--prev">
            <IconButton icon="chevron-left" label="Previous" variant="glass" onClick={() => go(-1)} />
          </div>
        )}
        {n > 1 && (
          <div className="cx-gallery__nav cx-gallery__nav--next">
            <IconButton icon="chevron-right" label="Next" variant="glass" onClick={() => go(1)} />
          </div>
        )}
        <button type="button" className="cx-gallery__counter" onClick={onExpand}>
          <Icon name="images" size={14} />
          {i + 1} / {n}
        </button>
      </div>
      <div className="cx-gallery__strip">
        {thumbs.map((src, ti) => (
          <div
            key={ti}
            className={"cx-gallery__thumb" + (ti === i ? " cx-gallery__thumb--active" : "")}
            onClick={() => setI(ti)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
            {ti === thumbs.length - 1 && extra > 0 && (
              <div className="cx-gallery__more" onClick={onExpand}>
                +{extra} more
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
