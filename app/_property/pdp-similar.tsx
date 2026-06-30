"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { PropertyCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { similar } from "./data";

export function PdpSimilar({ favorites, onFavorite }: { favorites: string[]; onFavorite: (id: string) => void }) {
  const router = useRouter();
  const { t } = useLang();
  const fmt = (n: number) => "$" + n.toLocaleString("en-US");
  return (
    <section className="pdp-similar">
      <div className="pdp-similar__head">
        <div>
          <div className="pdp-similar__eyebrow">{t("pdp.keepExploring")}</div>
          <h2 className="pdp-similar__title">{t("pdp.similar")}</h2>
        </div>
        <Link className="pdp-similar__link" href="/search">
          {t("pdp.viewAllVillas")}
          <Icon name="arrow-right" size={18} />
        </Link>
      </div>
      <div className="pdp-similar__grid">
        {similar.map((l) => (
          <PropertyCard
            key={l.id}
            image={l.cover}
            price={fmt(l.price)}
            title={l.title}
            address={l.address}
            beds={l.beds}
            baths={l.baths}
            area={l.area}
            status={l.status}
            featured={l.featured}
            photoCount={l.photoCount}
            favorite={favorites.includes(l.id)}
            onFavorite={() => onFavorite(l.id)}
            onClick={() => router.push(`/property/${l.id}`)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>
    </section>
  );
}
