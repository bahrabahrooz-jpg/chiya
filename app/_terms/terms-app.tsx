"use client";

import { LegalDocument, type LegalSection } from "../_legal/legal-document";
import { useLang } from "@/lib/i18n";

/** Number of clauses — keys live at terms.s<i>.title / terms.s<i>.body. */
const COUNT = 8;

/**
 * TermsApp — the public "Terms and Conditions" page. i18n-driven clauses
 * rendered through the shared LegalDocument reading layout (en/ar).
 */
export function TermsApp() {
  const { t } = useLang();
  const sections: LegalSection[] = Array.from({ length: COUNT }, (_, i) => ({
    id: `s${i + 1}`,
    heading: t(`terms.s${i + 1}.title`),
    body: t(`terms.s${i + 1}.body`),
  }));

  return (
    <LegalDocument
      eyebrow={t("terms.eyebrow")}
      title={t("terms.title")}
      lastUpdated={t("terms.updated")}
      intro={t("terms.intro")}
      sections={sections}
    />
  );
}
