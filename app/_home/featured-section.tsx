"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { FeaturedPropertyCard, PropertyCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { featured, listings } from "@/lib/home-data";

/** Featured properties — the signature listing hero + the featured grid. */
export function FeaturedSection() {
  const router = useRouter();
  const { t } = useLang();
  return (
    <section className="cxk-section">
      <SectionHeader eyebrow={t("sec.feat.eyebrow")} title={t("sec.feat.title")} />
      <FeaturedPropertyCard
        image={featured.cover}
        thumbs={featured.gallery}
        price={featured.price}
        title={featured.title}
        address={featured.address}
        beds={featured.beds}
        baths={featured.baths}
        area={featured.area}
        description={featured.desc}
        agent={featured.agent}
        actions={
          <>
            <Button hierarchy="secondary" size="sm" iconLeading="calendar" onClick={() => router.push(`/property/${featured.id}`)}>
              {t("sec.feat.book")}
            </Button>
            <Button hierarchy="primary" size="sm" onClick={() => router.push(`/property/${featured.id}`)}>
              {t("sec.feat.view")}
            </Button>
          </>
        }
      />

      <div style={{ height: 44 }} />

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
