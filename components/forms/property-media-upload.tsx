"use client";

import { useId } from "react";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import "./property-media-upload.css";

export interface MediaItem {
  id: string;
  /** Preview URL (object URL or remote). */
  url: string;
}

export interface PropertyMediaUploadProps {
  items: MediaItem[];
  onAdd?: (files: FileList) => void;
  onRemove?: (id: string) => void;
  /** Promote a photo to cover (moves it first). */
  onSetCover?: (id: string) => void;
  className?: string;
}

/**
 * PropertyMediaUpload — the property photo manager for the add/edit listing
 * flow: a responsive thumbnail grid with a cover badge, per-photo remove /
 * set-cover actions, and an add tile. The first item is the cover.
 */
export function PropertyMediaUpload({ items, onAdd, onRemove, onSetCover, className = "" }: PropertyMediaUploadProps) {
  const inputId = useId();
  return (
    <div className={["cx-media", className].filter(Boolean).join(" ")}>
      <div className="cx-media__grid">
        {items.map((m, i) => (
          <div key={m.id} className="cx-media__tile">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt="" />
            {i === 0 && (
              <span className="cx-media__cover">
                <Icon name="star" size={11} fill="currentColor" />
                Cover
              </span>
            )}
            <div className="cx-media__actions">
              {i !== 0 && onSetCover ? (
                <IconButton icon="star" label="Set as cover" variant="glass" size="sm" onClick={() => onSetCover(m.id)} />
              ) : (
                <span />
              )}
              {onRemove && (
                <IconButton icon="trash-2" label="Remove photo" variant="glass" size="sm" onClick={() => onRemove(m.id)} />
              )}
            </div>
          </div>
        ))}

        <label htmlFor={inputId} className="cx-media__add" tabIndex={0}>
          <Icon name="image-plus" size={24} />
          Add photos
          <input
            id={inputId}
            type="file"
            accept="image/*"
            multiple
            style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
            onChange={(e) => {
              if (e.target.files) onAdd?.(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
    </div>
  );
}
