"use client";

import { LegalDocument, type LegalSection } from "../_legal/legal-document";
import { useLang } from "@/lib/i18n";
import { useSiteContent, pick } from "@/lib/site-content";

/**
 * PrivacyApp — the public "Privacy Policy" page. CMS-managed sections (edited at
 * /admin/content, seeded from the original i18n copy) rendered through the
 * shared LegalDocument reading layout.
 */
export function PrivacyApp() {
  const { lang } = useLang();
  const { content } = useSiteContent();
  const doc = content.legal.privacy;
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
