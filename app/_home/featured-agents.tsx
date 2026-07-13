"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { agents, type Agent } from "@/lib/home-data";

const list = [agents.lana, agents.daban, agents.avan, agents.shene];
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

/** Featured agents — verified agent profiles. */
export function FeaturedAgents() {
  const router = useRouter();
  const { t } = useLang();
  const { user } = useAuth();
  const { isAgentSaved, toggleAgent } = useFavorites();
  const [saved, setSaved] = useState<string[]>([]);
  const toggleSave = (ag: Agent) => {
    const id = slug(ag.name);
    if (user) {
      toggleAgent({
        id,
        name: ag.name,
        photo: ag.avatar,
        city: ag.city,
        verified: ag.verified,
        rating: ag.rating,
        listings: ag.listings,
        href: `/agents/${id}`,
      });
      return;
    }
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={t("sec.agents.eyebrow")}
        title={t("sec.agents.title")}
        subtitle={t("sec.agents.sub")}
        action={
          <Button hierarchy="tertiary" iconTrailing="arrow-right" onClick={() => router.push("/agents")}>
            {t("sec.agents.action")}
          </Button>
        }
      />
      <div className="cxk-grid4">
        {list.map((ag) => (
          <AgentCard
            key={ag.name}
            name={ag.name}
            photo={ag.avatar}
            city={ag.city}
            verified={ag.verified}
            rating={ag.rating}
            listings={ag.listings}
            favorite={user ? isAgentSaved(slug(ag.name)) : saved.includes(slug(ag.name))}
            onFavorite={() => toggleSave(ag)}
            href={`/agents/${slug(ag.name)}`}
          />
        ))}
      </div>
    </section>
  );
}
