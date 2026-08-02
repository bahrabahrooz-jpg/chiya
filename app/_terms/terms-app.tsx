"use client";

import { LegalDocument, type LegalSection } from "../_legal/legal-document";
import { useLang } from "@/lib/i18n";
import { useSiteContent, pick } from "@/lib/site-content";

/**
 * TermsApp — the public "Terms and Conditions" page. CMS-managed clauses
 * (edited at /admin/content, seeded from the original i18n copy) rendered
 * through the shared LegalDocument reading layout.
 */
export function TermsApp() {
  const { lang } = useLang();
  const { content } = useSiteContent();
  const doc = content.legal.terms;
  const sections: LegalSection[] = doc.sections.map((s) => ({
    id: s.id,
    heading: pick(s.heading, lang),
    body: pick(s.body, lang),
  }));

  return (
    <LegalDocument
      eyebrow={pick(doc.eyebrow, lang)}
      title={pick(doc.title, lang)}
      lastUpdated={doc.updated}
      intro={pick(doc.intro, lang)}
      sections={sections}
    />
  );
}
