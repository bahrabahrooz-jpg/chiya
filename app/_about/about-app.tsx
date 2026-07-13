"use client";

import Link from "next/link";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SectionHeader } from "@/components/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import "./about.css";

interface Stat {
  key: "listings" | "agents" | "cities" | "years";
}

const STATS: Stat[] = [
  { key: "listings" },
  { key: "agents" },
  { key: "cities" },
  { key: "years" },
];

interface Value {
  icon: IconName;
}

/** The four brand values, rendered as icon cards. */
const VALUES: Value[] = [
  { icon: "shield-check" },
  { icon: "eye" },
  { icon: "handshake" },
  { icon: "map-pin" },
];

/**
 * AboutApp — the public "About Chiya" page. Marketing narrative built from the
 * design-system chrome (InteriorHeader, SectionHeader, Footer) and page-local
 * bands styled in about.css. All copy is i18n-driven (en/ar).
 */
export function AboutApp() {
  const { t } = useLang();
  return (
    <>
      <InteriorHeader active="about" />
      <main className="cxab">
        <section className="cxab-hero">
          <div className="cxab-container">
            <span className="cxab-hero__eyebrow">{t("about.hero.eyebrow")}</span>
            <h1 className="cxab-hero__title">{t("about.hero.title")}</h1>
            <p className="cxab-hero__sub">{t("about.hero.sub")}</p>
          </div>
        </section>

        <section className="cxab-stats">
          <div className="cxab-container cxab-stats__grid">
            {STATS.map((s) => (
              <div key={s.key} className="cxab-stat">
                <span className="cxab-stat__value">{t(`about.stat.${s.key}.value`)}</span>
                <span className="cxab-stat__label">{t(`about.stat.${s.key}.label`)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="cxab-story">
          <div className="cxab-container cxab-story__grid">
            <div className="cxab-story__media">
              <img src="/images/hero-villa-bright.png" alt="" loading="lazy" />
            </div>
            <div className="cxab-story__text">
              <span className="cxab-story__eyebrow">{t("about.story.eyebrow")}</span>
              <h2 className="cxab-story__title">{t("about.story.title")}</h2>
              <p className="cxab-story__body">{t("about.story.p1")}</p>
              <p className="cxab-story__body">{t("about.story.p2")}</p>
            </div>
          </div>
        </section>

        <section className="cxab-values">
          <div className="cxab-container">
            <SectionHeader
              align="center"
              title={t("about.values.title")}
              subtitle={t("about.values.sub")}
            />
            <div className="cxab-values__grid">
              {VALUES.map((v, i) => (
                <div key={i} className="cxab-value">
                  <span className="cxab-value__ic">
                    <Icon name={v.icon} size={24} />
                  </span>
                  <h3 className="cxab-value__title">{t(`about.value.${i}.title`)}</h3>
                  <p className="cxab-value__desc">{t(`about.value.${i}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cxab-cta">
          <div className="cxab-cta__inner">
            <h2 className="cxab-cta__title">{t("about.cta.title")}</h2>
            <p className="cxab-cta__sub">{t("about.cta.sub")}</p>
            <div className="cxab-cta__actions">
              <Link className="cxab-cta__btn cxab-cta__btn--primary" href="/search">
                {t("about.cta.browse")}
                <Icon name="arrow-right" size={18} />
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
