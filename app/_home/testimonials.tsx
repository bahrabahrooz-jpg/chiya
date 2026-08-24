"use client";

import { SectionHeader } from "@/components/layout";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtNum } from "@/lib/fmt";
import { useSiteContent, pick } from "@/lib/site-content";
import { homeFeaturedReviews } from "@/lib/site-reviews";

/**
 * Testimonials — approved member reviews the admin featured at /admin/content.
 * Every part of a card comes from the review record: the reviewer, the rating
 * they actually gave, and the deal that prompted it. Only the band's framing
 * copy above (eyebrow / title / subtitle) is CMS text.
 *
 * The quote renders in the language it was written in on all three locales. It
 * is someone's words, not site copy, so it is never translated.
 */
export function Testimonials() {
  const { t, lang } = useLang();
  const { content } = useSiteContent();
  const head = content.home.sections.test;
  const reviews = homeFeaturedReviews(content.home.featuredReviews);
  // Nothing featured — or every pick has since lost its approval. Drop the whole
  // band rather than leave a heading standing over an empty grid.
  if (reviews.length === 0) return null;
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
          {reviews.map((r) => (
            <figure key={r.id} className="cxtest">
              {/* starsAria / deal keys live in the admin namespace but are shared
                  public strings — same arrangement as lib/site-agents' dealKey. */}
              <div className="cxtest__stars" aria-label={t("admin.reviews.starsAria", { value: fmtNum(lang, r.stars) })}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Icon
                    key={s}
                    name="star"
                    size={16}
                    className={"cxtest__star" + (s <= r.stars ? " is-on" : "")}
                    fill={s <= r.stars ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <blockquote className="cxtest__quote">{`“${r.text}”`}</blockquote>
              <figcaption className="cxtest__by">
                {/* Members deliberately carry no photo — initials render. */}
                <Avatar name={r.name} size="md" />
                <div>
                  <div className="cxtest__name">{r.name}</div>
                  <div className="cxtest__loc">
                    {r.dealKey
                      ? t(r.dealKey, { title: r.dealTitle ?? "" })
                      : t("sec.test.withAgent", { agent: r.agentName })}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
