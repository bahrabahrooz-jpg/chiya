"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { agents } from "@/lib/home-data";

const list = [agents.lana, agents.daban, agents.avan, agents.shene];
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

/** Featured agents — verified agent profiles. */
export function FeaturedAgents() {
  const router = useRouter();
  const { t } = useLang();
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
            avatar={ag.avatar}
            agency={ag.agency}
            verified={ag.verified}
            rating={ag.rating}
            reviews={ag.reviews}
            listings={ag.listings}
            sales={ag.sales}
            experience={ag.experience}
            onClick={() => router.push(`/agents/${slug(ag.name)}`)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>
    </section>
  );
}
