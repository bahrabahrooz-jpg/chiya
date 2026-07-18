"use client";

import Link from "next/link";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SectionHeader } from "@/components/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import "./about.css";

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
            <h1 className="cxab-hero__title">{t("about.hero.title")}</h1>
            <p className="cxab-hero__sub">{t("about.hero.sub")}</p>
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
