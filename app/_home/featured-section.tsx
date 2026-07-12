"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { listings } from "@/lib/home-data";

/** Featured properties — the featured grid. */
export function FeaturedSection() {
  const router = useRouter();
  const { t } = useLang();
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={t("sec.feat2.eyebrow")}
        title={t("sec.feat2.title")}
        subtitle={t("sec.feat2.sub")}
        action={
          <Button hierarchy="tertiary" iconTrailing="arrow-right" onClick={() => router.push("/search")}>
            {t("sec.feat2.action")}
          </Button>
        }
      />
      <div className="cxk-grid3">
        {listings.map((l) => (
          <PropertyCard
            key={l.id}
            image={l.cover}
            price={l.price}
            period={l.period}
            title={l.title}
            address={l.address}
            beds={l.beds}
            baths={l.baths}
            area={l.area}
            status={l.status}
            featured={l.featured}
            photoCount={l.photoCount}
            onClick={() => router.push(`/property/${l.id}`)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>
    </section>
  );
}
