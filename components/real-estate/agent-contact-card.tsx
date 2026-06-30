"use client";

import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface AgentContactCardProps {
  name: string;
  avatar?: string;
  agency?: string;
  verified?: boolean;
  rating?: number;
  reviews?: number;
  /** Displayed phone number (e.g. "+964 750 …"). */
  phone?: string;
  onCall?: () => void;
  onMessage?: () => void;
  onWhatsapp?: () => void;
  className?: string;
}

/**
 * AgentContactCard — the compact "contact the listing agent" panel for the
 * property detail sidebar: identity + trust, then call / message actions.
 */
export function AgentContactCard({
  name,
  avatar,
  agency,
  verified = true,
  rating,
  reviews,
  phone,
  onCall,
  onMessage,
  onWhatsapp,
  className = "",
}: AgentContactCardProps) {
  return (
    <div
      className={["flex flex-col gap-4 p-5", className].filter(Boolean).join(" ")}
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-3.5">
        <Avatar src={avatar} name={name} size="lg" verified={verified} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="cx-display-xs" style={{ fontSize: 18, lineHeight: "22px" }}>
            {name}
          </span>
          {agency && (
            <span className="cx-text-sm flex items-center gap-1.5" style={{ color: "var(--text-tertiary)" }}>
              <Icon name="building-2" size={13} />
              {agency}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {verified && (
          <Badge variant="brand" size="sm" icon="badge-check">
            Verified
          </Badge>
        )}
        {rating != null && (
          <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            <Icon name="star" size={15} fill="currentColor" style={{ color: "var(--brand-accent)" }} />
            {rating}
            {reviews != null && (
              <span style={{ color: "var(--text-tertiary)", fontWeight: 500 }}>({reviews})</span>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <Button hierarchy="primary" iconLeading="phone" fullWidth onClick={onCall}>
          {phone ? `Call ${phone}` : "Call agent"}
        </Button>
        <div className="flex gap-2.5">
          <Button hierarchy="secondary" iconLeading="message-circle" fullWidth onClick={onMessage}>
            Message
          </Button>
          {onWhatsapp && (
            <Button hierarchy="secondary" iconLeading="message-square" fullWidth onClick={onWhatsapp}>
              WhatsApp
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 cx-text-xs" style={{ color: "var(--text-tertiary)" }}>
        <Icon name="shield-check" size={13} />
        ID-checked · responds within 24h
      </div>
    </div>
  );
}
