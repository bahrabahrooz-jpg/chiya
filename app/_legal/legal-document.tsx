"use client";

import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { useLang } from "@/lib/i18n";
import "./legal.css";

export interface LegalSection {
  /** Stable anchor id used by the table-of-contents jump links. */
  id: string;
  heading: string;
  body: string;
}

export interface LegalDocumentProps {
  eyebrow: string;
  title: string;
  /** Formatted "Last updated" value (the label wrapping is handled here). */
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

/**
 * LegalDocument — the public reading layout shared by the Privacy Policy and
 * Terms & Conditions pages. A centered title band with a "Last updated" pill,
 * then a two-column body: a sticky table of contents beside numbered heading +
 * body sections. The TOC collapses away on narrow screens. RTL-aware through
 * the document's writing direction (logical properties throughout).
 */
export function LegalDocument({ eyebrow, title, lastUpdated, intro, sections }: LegalDocumentProps) {
  const { t } = useLang();
  return (
    <>
      <InteriorHeader />
      <main className="cxlg">
        <section className="cxlg-hero">
          <div className="cxlg-container">
            <span className="cxlg-hero__eyebrow">{eyebrow}</span>
            <h1 className="cxlg-hero__title">{title}</h1>
            <p className="cxlg-hero__sub">{intro}</p>
            <span className="cxlg-hero__pill">{t("legal.lastUpdated").replace("{date}", lastUpdated)}</span>
          </div>
        </section>

        <section className="cxlg-body">
          <div className="cxlg-container cxlg-body__grid">
            <nav className="cxlg-toc" aria-label={t("legal.contents")}>
              <span className="cxlg-toc__label">{t("legal.contents")}</span>
              <ol className="cxlg-toc__list">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`}>
                      <span className="cxlg-toc__num">{i + 1}</span>
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <article className="cxlg-doc">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="cxlg-sec">
                  <h2 className="cxlg-sec__title">
                    <span className="cxlg-sec__num">{i + 1}</span>
                    {s.heading}
                  </h2>
                  <p className="cxlg-sec__body">{s.body}</p>
                </section>
              ))}
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
