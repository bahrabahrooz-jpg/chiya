"use client";

import Link from "next/link";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { Accordion, type AccordionItem } from "@/components/data";
import { useLang } from "@/lib/i18n";
import { useSiteContent, pick } from "@/lib/site-content";
import "./faq.css";

/**
 * FaqApp — the public "Frequently asked questions" page. A design-system
 * Accordion over the CMS-managed Q&A (edited at /admin/content, seeded from the
 * original i18n copy), closing with a prompt to Contact.
 */
export function FaqApp() {
  const { t, lang } = useLang();
  const { content } = useSiteContent();
  const items: AccordionItem[] = content.faq.map((e) => ({
    id: e.id,
    title: pick(e.q, lang),
    content: pick(e.a, lang),
  }));
  const firstId = content.faq[0]?.id;

  return (
    <>
      <InteriorHeader />
      <main className="cxfaq">
        <section className="cxfaq-hero">
          <div className="cxfaq-container">
            <span className="cxfaq-hero__eyebrow">{pick(content.faqHero.eyebrow, lang)}</span>
            <h1 className="cxfaq-hero__title">{pick(content.faqHero.title, lang)}</h1>
            <p className="cxfaq-hero__sub">{pick(content.faqHero.sub, lang)}</p>
          </div>
        </section>

        <section className="cxfaq-body">
          <div className="cxfaq-container cxfaq-body__inner">
            <Accordion items={items} defaultOpen={firstId} />

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
