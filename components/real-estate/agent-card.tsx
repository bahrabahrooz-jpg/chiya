"use client";

import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import "./agent-card.css";

export interface AgentCardProps {
  name: string;
  avatar?: string;
  agency?: string;
  verified?: boolean;
  rating?: number;
  reviews?: number;
  listings?: number;
  sales?: number;
  experience?: number;
  /** "stack" (default profile card) or "row" (compact list item). */
  layout?: "stack" | "row";
  onCall?: () => void;
  onMessage?: () => void;
  className?: string;
  /** Make the whole card clickable (e.g. open the agent profile). */
  onClick?: React.MouseEventHandler;
  style?: React.CSSProperties;
}

/**
 * AgentCard — verified agent profile with rating, stats, and contact actions.
 * `layout="row"` renders a compact horizontal variant for lists.
 */
export function AgentCard({
  name,
  avatar,
  agency,
  verified = true,
  rating,
  reviews,
  listings,
  sales,
  experience,
  layout = "stack",
  onCall,
  onMessage,
  className = "",
  onClick,
  style,
}: AgentCardProps) {
  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };
  if (layout === "row") {
    return (
      <article
        className={["cx-agent", "cx-agent--row", className].filter(Boolean).join(" ")}
        onClick={onClick}
        style={style}
      >
        <Avatar src={avatar} name={name} size="lg" verified={verified} />
        <div className="cx-agent__main">
          <div className="cx-agent__name" style={{ fontSize: 17 }}>
            {name}
          </div>
          <div className="cx-agent__agency">
            <Icon name="building-2" size={13} />
            {agency}
          </div>
        </div>
        {rating != null && (
          <div className="cx-agent__rating">
            <Icon name="star" size={15} fill="currentColor" />
            {rating}
          </div>
        )}
      </article>
    );
  }

  return (
    <article className={["cx-agent", className].filter(Boolean).join(" ")} onClick={onClick} style={style}>
      <Avatar src={avatar} name={name} size="xl" verified={verified} />
      <div>
        <div className="cx-agent__name">{name}</div>
        <div className="cx-agent__agency">
          <Icon name="building-2" size={14} />
          {agency}
        </div>
        {verified && (
          <div style={{ marginTop: 8 }}>
            <Badge variant="brand" size="sm" icon="badge-check">
              Verified Agent
            </Badge>
          </div>
        )}
      </div>
      {rating != null && (
        <div className="cx-agent__rating">
          <Icon name="star" size={16} fill="currentColor" />
          {rating}
          {reviews != null && <span>({reviews} reviews)</span>}
        </div>
      )}
      <div className="cx-agent__stats">
        {listings != null && (
          <div className="cx-agent__stat">
            <b>{listings}</b>
            <span>Listings</span>
          </div>
        )}
        {sales != null && (
          <div className="cx-agent__stat">
            <b>{sales}</b>
            <span>Sold</span>
          </div>
        )}
        {experience != null && (
          <div className="cx-agent__stat">
            <b>{experience}</b>
            <span>Years</span>
          </div>
        )}
      </div>
      <div className="cx-agent__actions">
        <button className="cx-agent__btn cx-agent__btn--ghost" onClick={stop(onMessage)}>
          <Icon name="message-circle" size={16} />
          Message
        </button>
        <button className="cx-agent__btn cx-agent__btn--primary" onClick={stop(onCall)}>
          <Icon name="phone" size={16} />
          Call
        </button>
      </div>
    </article>
  );
}
