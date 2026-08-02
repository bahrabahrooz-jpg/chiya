"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { useSaveGate } from "@/lib/favorites";
import { homeAgents, type Agent } from "@/lib/home-data";
import { usePublicCatalog } from "@/lib/public-catalog";
import { useSiteContent, pick } from "@/lib/site-content";

/** Featured agents — admin-curated verified agents, live from the catalog; the
    band header copy is CMS-managed (edited at /admin/content). */
export function FeaturedAgents() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { isAgentSaved, saveAgent } = useSaveGate();
  const { featuredAgents } = usePublicCatalog();
  const { content } = useSiteContent();
  const head = content.home.sections.agents;
  const list = homeAgents(featuredAgents).slice(0, 4);
  // Pure curation — hide the whole band when no agent is featured.
  if (list.length === 0) return null;
  const toggleSave = (ag: Agent) =>
    saveAgent({
      id: ag.id,
      name: ag.name,
      photo: ag.avatar,
      city: ag.city,
      verified: ag.verified,
      rating: ag.rating,
      listings: ag.listings,
      href: `/agents/${ag.id}`,
    });
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={pick(head.eyebrow, lang)}
        title={pick(head.title, lang)}
        subtitle={pick(head.sub, lang)}
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
            favorite={isAgentSaved(ag.id)}
            onFavorite={() => toggleSave(ag)}
            href={`/agents/${ag.id}`}
          />
        ))}
      </div>
    </section>
  );
}
