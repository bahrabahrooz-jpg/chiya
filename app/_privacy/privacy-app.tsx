"use client";

import { LegalDocument, type LegalSection } from "../_legal/legal-document";
import { useLang } from "@/lib/i18n";

/** Number of policy sections — keys live at privacy.s<i>.title / privacy.s<i>.body. */
const COUNT = 7;

/**
 * PrivacyApp — the public "Privacy Policy" page. i18n-driven sections rendered
 * through the shared LegalDocument reading layout (en/ar).
 */
export function PrivacyApp() {
  const { t } = useLang();
  const sections: LegalSection[] = Array.from({ length: COUNT }, (_, i) => ({
    id: `s${i + 1}`,
    heading: t(`privacy.s${i + 1}.title`),
    body: t(`privacy.s${i + 1}.body`),
  }));

  return (
    <LegalDocument
      eyebrow={t("privacy.eyebrow")}
      title={t("privacy.title")}
      lastUpdated={t("privacy.updated")}
      intro={t("privacy.intro")}
      sections={sections}
    />
  );
}
