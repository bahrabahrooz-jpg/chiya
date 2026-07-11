import { useTranslation } from "@/lib/i18n";
import { LegalDocument, type LegalSection } from "@/components/account/LegalDocument";

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const sections: LegalSection[] = [
    { heading: t("privacy.s1Title"), body: t("privacy.s1Body") },
    { heading: t("privacy.s2Title"), body: t("privacy.s2Body") },
    { heading: t("privacy.s3Title"), body: t("privacy.s3Body") },
    { heading: t("privacy.s4Title"), body: t("privacy.s4Body") },
    { heading: t("privacy.s5Title"), body: t("privacy.s5Body") },
    { heading: t("privacy.s6Title"), body: t("privacy.s6Body") },
    { heading: t("privacy.s7Title"), body: t("privacy.s7Body") },
  ];
  return <LegalDocument title={t("privacy.title")} lastUpdated={t("privacy.updated")} sections={sections} />;
}
