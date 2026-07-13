"use client";

import Link from "next/link";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { Accordion, type AccordionItem } from "@/components/data";
import { useLang } from "@/lib/i18n";
import "./faq.css";

/** Number of Q&A entries — keys live at faq.q.<i>.q / faq.q.<i>.a. */
const COUNT = 8;

/**
 * FaqApp — the public "Frequently asked questions" page. A design-system
 * Accordion over i18n-driven Q&A (en/ar), closing with a prompt to Contact.
 */
export function FaqApp() {
  const { t } = useLang();
  const items: AccordionItem[] = Array.from({ length: COUNT }, (_, i) => ({
    id: `q${i}`,
    title: t(`faq.q.${i}.q`),
    content: t(`faq.q.${i}.a`),
  }));

  return (
    <>
      <InteriorHeader />
      <main className="cxfaq">
        <section className="cxfaq-hero">
          <div className="cxfaq-container">
            <span className="cxfaq-hero__eyebrow">{t("faq.hero.eyebrow")}</span>
            <h1 className="cxfaq-hero__title">{t("faq.hero.title")}</h1>
            <p className="cxfaq-hero__sub">{t("faq.hero.sub")}</p>
          </div>
        </section>

        <section className="cxfaq-body">
          <div className="cxfaq-container cxfaq-body__inner">
            <Accordion items={items} defaultOpen="q0" />

            <div className="cxfaq-cta">
              <h2 className="cxfaq-cta__title">{t("faq.cta.title")}</h2>
              <p className="cxfaq-cta__text">{t("faq.cta.text")}</p>
              <Link className="cxfaq-cta__btn" href="/contact">
                {t("faq.cta.btn")}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
