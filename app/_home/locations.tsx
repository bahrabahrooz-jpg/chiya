"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { homeLocations } from "@/lib/home-data";
import { publicCountByCity } from "@/lib/site-properties";
import { usePublicCatalog } from "@/lib/public-catalog";
import { useSiteContent, pick } from "@/lib/site-content";

/** Popular locations — city cards into the search, live counts from the catalog;
    the band header copy is CMS-managed (edited at /admin/content). */
export function Locations() {
  const { t, lang } = useLang();
  const { publicRecords } = usePublicCatalog();
  const { content } = useSiteContent();
  const head = content.home.sections.locs;
  const locations = homeLocations(publicCountByCity(publicRecords));
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={pick(head.eyebrow, lang)}
        title={pick(head.title, lang)}
        subtitle={pick(head.sub, lang)}
      />
      <div className="cxk-grid3">
        {locations.map((l) => (
          <Link key={l.city} href={`/search?q=${encodeURIComponent(l.city)}`} className="cxloc">
            <div className="cxloc__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.image} alt={l.city} loading="lazy" />
              <div className="cxloc__grad" />
              <div className="cxloc__count">
                <Icon name="home" size={13} />
                {l.count} {t("sec.locs.properties")}
              </div>
            </div>
            <div className="cxloc__body">
              <div className="cxloc__head">
                <h3 className="cxloc__city">{t("city." + l.city)}</h3>
                <Icon name={lang === "ar" || lang === "ku" ? "arrow-up-left" : "arrow-up-right"} size={20} />
              </div>
              <p className="cxloc__blurb">{t("loc.blurb." + l.city)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
