"use client";

import { SectionHeader } from "@/components/layout";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useSiteContent, pick } from "@/lib/site-content";
import { TESTIMONIAL_AVATARS } from "@/lib/home-data";

/** Testimonials — client stories. Name / detail / quote are CMS-managed (edited
    at /admin/content); the avatar and 5-star rating stay decorative in code. */
export function Testimonials() {
  const { lang } = useLang();
  const { content } = useSiteContent();
  const head = content.home.sections.test;
  return (
    <section className="cxk-section cxk-reviewband">
      <div className="cxk-container">
        <SectionHeader
          align="center"
          eyebrow={pick(head.eyebrow, lang)}
          title={pick(head.title, lang)}
          subtitle={pick(head.sub, lang)}
        />
        <div className="cxk-grid3">
          {content.home.testimonials.map((item, i) => {
            const name = pick(item.name, lang);
            return (
              <figure key={i} className="cxtest">
                <div className="cxtest__stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Icon key={s} name="star" size={16} fill="currentColor" />
                  ))}
                </div>
                <blockquote className="cxtest__quote">{`“${pick(item.quote, lang)}”`}</blockquote>
                <figcaption className="cxtest__by">
                  <Avatar src={TESTIMONIAL_AVATARS[i]} name={name} size="md" />
                  <div>
                    <div className="cxtest__name">{name}</div>
                    <div className="cxtest__loc">{pick(item.loc, lang)}</div>
                  </div>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
