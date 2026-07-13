"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { categories } from "@/lib/home-data";

const TYPE_BY_CAT: Record<string, string> = {
  Villas: "villa",
  Apartments: "apartment",
  Houses: "house",
  Office: "office",
  Land: "land",
};

/** Property categories — photo-led type tiles. */
export function Categories() {
  const { t } = useLang();
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={t("sec.cats.eyebrow")}
        title={t("sec.cats.title")}
        subtitle={t("sec.cats.sub")}
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
