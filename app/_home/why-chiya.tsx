"use client";

import { SectionHeader } from "@/components/layout";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useSiteContent, pick } from "@/lib/site-content";
import { PILLAR_ICONS } from "@/lib/home-data";

/** Why Chiya — the trust pillars on a deep forest band. Copy is CMS-managed
    (edited at /admin/content); the pillar icons stay fixed here. */
export function WhyChiya() {
  const { lang } = useLang();
  const { content } = useSiteContent();
  const head = content.home.sections.why;
  return (
    <section className="cxk-whyband">
      <div className="cxk-container">
        <SectionHeader
          align="center"
          eyebrow={pick(head.eyebrow, lang)}
          title={pick(head.title, lang)}
          subtitle={pick(head.sub, lang)}
        />
        <div className="cxk-grid4">
          {content.home.pillars.map((p, i) => (
            <div key={i} className="cxpillar">
              <span className="cxpillar__ic">
                <Icon name={PILLAR_ICONS[i] ?? "circle"} size={24} />
              </span>
              <h3 className="cxpillar__title">{pick(p.title, lang)}</h3>
              <p className="cxpillar__desc">{pick(p.desc, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
