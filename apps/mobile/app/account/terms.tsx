import { useTranslation } from "@/lib/i18n";
import { LegalDocument, type LegalSection } from "@/components/account/LegalDocument";

export default function TermsScreen() {
  const { t } = useTranslation();
  const sections: LegalSection[] = [
    { heading: t("terms.s1Title"), body: t("terms.s1Body") },
    { heading: t("terms.s2Title"), body: t("terms.s2Body") },
    { heading: t("terms.s3Title"), body: t("terms.s3Body") },
    { heading: t("terms.s4Title"), body: t("terms.s4Body") },
    { heading: t("terms.s5Title"), body: t("terms.s5Body") },
    { heading: t("terms.s6Title"), body: t("terms.s6Body") },
    { heading: t("terms.s7Title"), body: t("terms.s7Body") },
    { heading: t("terms.s8Title"), body: t("terms.s8Body") },
  ];
  return <LegalDocument title={t("terms.title")} lastUpdated={t("terms.updated")} sections={sections} />;
}
