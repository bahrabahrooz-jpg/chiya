"use client";

import Link from "next/link";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SectionHeader } from "@/components/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { useSiteContent, pick } from "@/lib/site-content";
import "./about.css";

/** The four brand-value icons — fixed layout; the copy is CMS-managed. */
const VALUE_ICONS: IconName[] = ["shield-check", "eye", "handshake", "map-pin"];

/**
 * AboutApp — the public "About Chiya" page. Marketing narrative built from the
 * design-system chrome (InteriorHeader, SectionHeader, Footer) and page-local
 * bands styled in about.css. Copy is CMS-managed (edited at /admin/content,
 * seeded from the original i18n text).
 */
export function AboutApp() {
  const { t, lang } = useLang();
  const { content } = useSiteContent();
  const ab = content.about;
  return (
    <>
      <InteriorHeader active="about" />
      <main className="cxab">
        <section className="cxab-hero">
          <div className="cxab-container">
            <h1 className="cxab-hero__title">{pick(ab.heroTitle, lang)}</h1>
            <p className="cxab-hero__sub">{pick(ab.heroSub, lang)}</p>
          </div>
        </section>

        <section className="cxab-values">
          <div className="cxab-container">
            <SectionHeader
              align="center"
              title={pick(ab.valuesTitle, lang)}
              subtitle={pick(ab.valuesSub, lang)}
            />
            <div className="cxab-values__grid">
              {ab.values.map((v, i) => (
                <div key={i} className="cxab-value">
                  <span className="cxab-value__ic">
                    <Icon name={VALUE_ICONS[i] ?? "circle"} size={24} />
                  </span>
                  <h3 className="cxab-value__title">{pick(v.title, lang)}</h3>
                  <p className="cxab-value__desc">{pick(v.desc, lang)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cxab-cta">
          <div className="cxab-cta__inner">
            <h2 className="cxab-cta__title">{pick(ab.ctaTitle, lang)}</h2>
            <p className="cxab-cta__sub">{pick(ab.ctaSub, lang)}</p>
            <div className="cxab-cta__actions">
              <Link className="cxab-cta__btn cxab-cta__btn--primary" href="/search">
                {t("about.cta.browse")}
              </Link>
              <Link className="cxab-cta__btn cxab-cta__btn--ghost" href="/contact">
                {t("about.cta.contact")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
