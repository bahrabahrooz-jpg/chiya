"use client";

import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import "./map-panel.css";

export interface MapPin {
  /** Position as 0–100 percentages of the panel. */
  x: number;
  y: number;
  price: string | number;
  active?: boolean;
  cluster?: boolean;
}

export interface MapPanelProps {
  pins?: MapPin[];
  areaLabel?: string;
  height?: number;
  onPin?: (pin: MapPin, index: number) => void;
  className?: string;
}

/**
 * MapPanel — stylized map surface with price pins, clusters, and zoom controls.
 * A lightweight placeholder for a real map embed; pins are positioned by %.
 */
export function MapPanel({ pins = [], areaLabel = "Erbil · 124 homes", height = 420, onPin, className = "" }: MapPanelProps) {
  return (
    <div className={["cx-map", className].filter(Boolean).join(" ")} style={{ height }}>
      <div className="cx-map__water" />
      <div className="cx-map__roads" />
      {areaLabel && (
        <div className="cx-map__chip">
          <Icon name="map-pin" size={15} />
          {areaLabel}
        </div>
      )}
      {pins.map((p, i) => (
        <div
          key={i}
          className={["cx-map__pin", p.active ? "cx-map__pin--active" : "", p.cluster ? "cx-map__pin--cluster" : ""]
            .filter(Boolean)
            .join(" ")}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <button className="cx-map__pill" onClick={onPin ? () => onPin(p, i) : undefined}>
            {p.active && <Icon name="home" size={13} />}
            {p.cluster ? `${p.price} homes` : p.price}
          </button>
        </div>
      ))}
      <div className="cx-map__ctrls">
        <div className="cx-map__zoom">
          <button aria-label="Zoom in">
            <Icon name="plus" size={18} />
          </button>
          <button aria-label="Zoom out">
            <Icon name="minus" size={18} />
          </button>
        </div>
        <IconButton icon="locate-fixed" label="My location" variant="default" />
      </div>
    </div>
  );
}
