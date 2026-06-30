"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/layout";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { locations } from "@/lib/home-data";

/** Popular locations — city cards into the search. */
export function Locations() {
  const { t, lang } = useLang();
  return (
    <section className="cxk-section">
      <SectionHeader
        eyebrow={t("sec.locs.eyebrow")}
        title={t("sec.locs.title")}
        subtitle={t("sec.locs.sub")}
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
