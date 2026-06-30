"use client";

import { useRouter } from "next/navigation";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { EmptyState } from "@/components/data";
import { Button } from "@/components/ui/button";
import type { IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

export interface PlaceholderPageProps {
  active?: string | null;
  icon: IconName;
  /** i18n key for the title. */
  titleKey: string;
  /** i18n key for the description. */
  descKey: string;
}

/**
 * PlaceholderPage — routed stub for pages not present in the design export
 * (About, Contact). Keeps the site chrome consistent and the routes navigable
 * until real designs are provided.
 */
export function PlaceholderPage({ active = null, icon, titleKey, descKey }: PlaceholderPageProps) {
  const router = useRouter();
  const { t } = useLang();
  return (
    <>
      <InteriorHeader active={active} />
      <main style={{ minHeight: "62vh", display: "flex", alignItems: "center" }}>
        <div className="cx-container" style={{ maxWidth: 680, marginInline: "auto", padding: "72px 24px" }}>
          <EmptyState
            icon={icon}
            title={t(titleKey)}
            description={t(descKey)}
            action={
              <Button hierarchy="secondary" iconLeading="arrow-left" onClick={() => router.push("/")}>
                {t("ph.backHome")}
              </Button>
            }
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
