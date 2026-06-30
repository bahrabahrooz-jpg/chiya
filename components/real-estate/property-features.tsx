import type { CSSProperties } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import "./property-features.css";

export interface PropertyFact {
  icon: IconName;
  value: string | number;
  label: string;
}
export interface PropertyFeature {
  label: string;
}

export interface PropertyFeaturesProps {
  /** Headline facts (beds / baths / area / type) shown as tiles. */
  facts?: PropertyFact[];
  /** Amenities / features list shown with check marks. */
  features?: PropertyFeature[];
  columns?: number;
  className?: string;
}

/**
 * PropertyFeatures — the property detail facts + amenities block: a row of key
 * fact tiles (beds/baths/area/…) and a check-marked grid of amenities.
 */
export function PropertyFeatures({ facts = [], features = [], columns = 2, className = "" }: PropertyFeaturesProps) {
  return (
    <div className={["cx-feats", className].filter(Boolean).join(" ")}>
      {facts.length > 0 && (
        <div className="cx-feats__facts">
          {facts.map((f, i) => (
            <div key={i} className="cx-feats__fact">
              <Icon name={f.icon} size={20} />
              <span className="cx-feats__factval">{f.value}</span>
              <span className="cx-feats__factlbl">{f.label}</span>
            </div>
          ))}
        </div>
      )}
      {features.length > 0 && (
        <div className="cx-feats__grid" style={{ "--cx-feat-cols": columns } as CSSProperties}>
          {features.map((f, i) => (
            <div key={i} className="cx-feats__item">
              <span className="cx-feats__check">
                <Icon name="check" size={13} strokeWidth={3} />
              </span>
              {f.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
