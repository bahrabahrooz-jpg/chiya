"use client";

import { SectionHeader } from "@/components/layout";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { testimonials } from "@/lib/home-data";

/** Testimonials — client stories. */
export function Testimonials() {
  const { t } = useLang();
  return (
    <section className="cxk-section">
      <SectionHeader
        align="center"
        eyebrow={t("sec.test.eyebrow")}
        title={t("sec.test.title")}
        subtitle={t("sec.test.sub")}
      />
      <div className="cxk-grid3">
        {testimonials.map((item, i) => {
          const name = t(`test.${i}.name`);
          return (
            <figure key={i} className="cxtest">
              <div className="cxtest__stars">
                {Array.from({ length: item.rating }).map((_, s) => (
                  <Icon key={s} name="star" size={16} fill="currentColor" />
                ))}
              </div>
              <blockquote className="cxtest__quote">{`“${t(`test.${i}.quote`)}”`}</blockquote>
              <figcaption className="cxtest__by">
                <Avatar src={item.avatar} name={name} size="md" />
                <div>
                  <div className="cxtest__name">{name}</div>
                  <div className="cxtest__loc">{t(`test.${i}.loc`)}</div>
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
