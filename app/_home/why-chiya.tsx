"use client";

import { SectionHeader } from "@/components/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { pillars } from "@/lib/home-data";

/** Why Chiya — the trust pillars on a deep forest band. */
export function WhyChiya() {
  const { t } = useLang();
  return (
    <section className="cxk-whyband">
      <div className="cxk-container">
        <SectionHeader
          align="center"
          eyebrow={t("sec.why.eyebrow")}
          title={t("sec.why.title")}
          subtitle={t("sec.why.sub")}
        />
        <div className="cxk-grid4">
          {pillars.map((p, i) => (
            <div key={i} className="cxpillar">
              <span className="cxpillar__ic">
                <Icon name={p.icon as IconName} size={24} />
              </span>
              <h3 className="cxpillar__title">{t(`why.${i}.title`)}</h3>
              <p className="cxpillar__desc">{t(`why.${i}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
