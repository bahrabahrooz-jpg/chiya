"use client";

import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { useSaveGate } from "@/lib/favorites";
import { homeListings } from "@/lib/home-data";
import { formatPrice } from "@/lib/money";
import { useApproxPrice } from "@/lib/use-approx-price";
import { usePublicCatalog } from "@/lib/public-catalog";
import { useSiteContent, pick } from "@/lib/site-content";

/** Featured properties — the featured grid, live from the admin catalog; the
    band header copy is CMS-managed (edited at /admin/content). */
export function FeaturedSection() {
  const router = useRouter();
  const { t, lang } = useLang();
  const { isPropertySaved, saveProperty } = useSaveGate();
  const { featuredProperties } = usePublicCatalog();
  const { content } = useSiteContent();
  /* Above the early return: hooks must run in the same order every render. */
  const approxOf = useApproxPrice();
  const head = content.home.sections.feat2;
  const listings = homeListings(featuredProperties);
  // Pure curation — hide the whole band when nothing is featured.
  if (listings.length === 0) return null;
  /* Each card shows its listing's OWN currency — the grid mixes dollar and
     dinar prices, which is what the market actually looks like. */
  const priceOf = (l: (typeof listings)[number]) => formatPrice(lang, l.price);
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={pick(head.eyebrow, lang)}
        title={pick(head.title, lang)}
        subtitle={pick(head.sub, lang)}
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
            price={priceOf(l)}
            approxPrice={approxOf(l.price)}
            period={l.period}
            title={l.title}
            address={l.address}
            beds={l.beds}
            baths={l.baths}
            area={l.area}
            status={l.status}
            featured={l.featured}
            photoCount={l.photoCount}
            favorite={isPropertySaved(l.id)}
            onFavorite={() =>
              saveProperty({
                id: l.id,
                image: l.cover,
                price: priceOf(l),
                period: l.period,
                title: l.title,
                address: l.address,
                beds: l.beds,
                baths: l.baths,
                area: l.area,
                status: l.status,
                href: `/property/${l.id}`,
              })
            }
            onClick={() => router.push(`/property/${l.id}`)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>
    </section>
  );
}
