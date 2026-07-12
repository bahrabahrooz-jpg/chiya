"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import type { DirAgent } from "./data";

export interface AgentDirCardProps {
  agent: DirAgent;
  saved: boolean;
  onSave: (a: DirAgent) => void;
}

export function AgentDirCard({ agent: a, saved, onSave }: AgentDirCardProps) {
  const router = useRouter();
  const { t } = useLang();
  return (
    <article className="agt-card">
      <button
        type="button"
        className={"agt-card__save" + (saved ? " agt-card__save--on" : "")}
        aria-label="Save agent"
        aria-pressed={saved}
        onClick={() => onSave(a)}
      >
        <Icon name="heart" size={18} fill={saved ? "currentColor" : "none"} />
      </button>

      <div className="agt-card__photo">
        <Avatar src={a.photo} name={a.name} size="xl" verified={a.verified} />
      </div>

      <div className="agt-card__id">
        <h3 className="agt-card__name">{a.name}</h3>
        {a.verified && (
          <Badge variant="brand" size="sm" icon="badge-check">
            {t("pdp.verified")}
          </Badge>
        )}
      </div>

      <div className="agt-card__meta">
        <span className="agt-card__metaitem">
          <Icon name="map-pin" size={14} />
          {a.city}
        </span>
      </div>

      <div className="agt-card__rating">
        <Icon name="star" size={15} fill="currentColor" />
        <b>{a.rating.toFixed(1)}</b>
        <span>({a.reviews} {t("agents.card.reviews")})</span>
      </div>

      <div className="agt-card__stats">
        <div className="agt-card__stat">
          <b>{a.listings}</b>
          <span>{t("agents.card.active")}</span>
        </div>
        <div className="agt-card__stat">
          <b>{a.sold}</b>
          <span>{t("agents.card.sold")}</span>
        </div>
        <div className="agt-card__stat">
          <b>{a.experience}</b>
          <span>{t("agents.card.years")}</span>
        </div>
      </div>

      <div className="agt-card__contact">
        <a className="agt-card__cbtn agt-card__cbtn--ghost" href={"tel:" + a.phone.replace(/\s+/g, "")} aria-label={"Call " + a.name}>
          <Icon name="phone" size={16} />
          {t("agents.card.call")}
        </a>
        <a className="agt-card__cbtn agt-card__cbtn--wa" href={"https://wa.me/" + a.whatsapp} target="_blank" rel="noopener" aria-label={"WhatsApp " + a.name}>
          <Icon name="message-circle" size={16} />
          {t("agents.card.whatsapp")}
        </a>
      </div>

      <Button hierarchy="primary" size="md" fullWidth iconTrailing="arrow-right" onClick={() => router.push(`/agents/${a.id}`)}>
        {t("agents.card.viewProfile")}
      </Button>
    </article>
  );
}
