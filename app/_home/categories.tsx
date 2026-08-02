"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { homeCategories } from "@/lib/home-data";
import { publicCountByType } from "@/lib/site-properties";
import { usePublicCatalog } from "@/lib/public-catalog";
import { useSiteContent, pick } from "@/lib/site-content";

const TYPE_BY_CAT: Record<string, string> = {
  Villas: "villa",
  Apartments: "apartment",
  Houses: "house",
  Office: "office",
  Land: "land",
};

/** Property categories — photo-led type tiles, live counts from the catalog;
    the band header copy is CMS-managed (edited at /admin/content). */
export function Categories() {
  const { t, lang } = useLang();
  const { publicRecords } = usePublicCatalog();
  const { content } = useSiteContent();
  const head = content.home.sections.cats;
  const categories = homeCategories(publicCountByType(publicRecords));
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={pick(head.eyebrow, lang)}
        title={pick(head.title, lang)}
        subtitle={pick(head.sub, lang)}
      />
      <div className="cxk-cats">
        {categories.map((c) => (
          <Link key={c.name} href={`/search?type=${TYPE_BY_CAT[c.name] || ""}`} className="cxcat">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cxcat__img" src={c.image} alt={c.name} loading="lazy" />
            <div className="cxcat__grad" />
            <div className="cxcat__body">
              <span className="cxcat__ic">
                <Icon name={c.icon as IconName} size={20} />
              </span>
              <div className="cxcat__name">{t("cat." + c.name)}</div>
              <div className="cxcat__count">{c.count} {t("sec.cats.listings")}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
