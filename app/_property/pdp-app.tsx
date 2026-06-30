"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/feedback/toast";
import { useLang } from "@/lib/i18n";
import { property, gallery, agent } from "./data";
import { PdpGallery } from "./pdp-gallery";
import { PdpMain } from "./pdp-main";
import { ActionPanel, BookModal } from "./pdp-aside";
import { PdpSimilar } from "./pdp-similar";

export function PdpApp() {
  const { t } = useLang();
  const [favMain, setFavMain] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bookOpen, setBookOpen] = useState(false);

  const toggleMainFav = () => {
    setFavMain(true);
    toast({ title: "Saved to your favourites", variant: "success" });
  };
  const toggleFav = (id: string) => setFavorites((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const onCall = () => toast({ title: `Calling ${agent.phone}…` });
  const onWhatsApp = () => toast({ title: `Opening WhatsApp with ${agent.name}…` });
  const onShare = () => toast({ title: "Listing link copied to clipboard", variant: "success" });
  const onDownload = () => toast({ title: "Preparing brochure download…" });

  return (
    <>
      <main className="pdp pdp-wrap">
        <nav className="pdp-crumb" aria-label="Breadcrumb">
          <Link className="pdp-crumb__link" href="/">
            <Icon name="home" size={14} />
            {t("srp.crumb.home")}
          </Link>
          <Icon name="chevron-right" size={14} className="pdp-crumb__sep" />
          <Link className="pdp-crumb__link" href="/search">
            {t("nav.buy")}
          </Link>
          <Icon name="chevron-right" size={14} className="pdp-crumb__sep" />
          <Link className="pdp-crumb__link" href="/search?q=Erbil">
            {t("city.Erbil")}
          </Link>
          <Icon name="chevron-right" size={14} className="pdp-crumb__sep" />
          <span className="pdp-crumb__current">{property.title}</span>
        </nav>

        <PdpGallery images={gallery} favorite={favMain} onFavorite={toggleMainFav} onShare={onShare} />

        <div className="pdp-head">
          <div>
            <div className="pdp-head__title">{property.title}</div>
            <div className="pdp-head__addr">
              <Icon name="map-pin" size={17} />
              <Link href="/search?q=Erbil">{property.address}</Link>
            </div>
          </div>
          <div className="pdp-head__priceblock">
            <div className="pdp-head__price">${property.price.toLocaleString("en-US")}</div>
          </div>
        </div>

        <div className="pdp-body">
          <PdpMain onDownload={onDownload} />
          <aside className="pdp-aside pdp-aside--desktop">
            <ActionPanel onBook={() => setBookOpen(true)} onCall={onCall} onWhatsApp={onWhatsApp} />
          </aside>
        </div>

        <PdpSimilar favorites={favorites} onFavorite={toggleFav} />
      </main>

      <div className="pdp-mobar">
        <div className="pdp-mobar__inner">
          <button className="pdp-mobar__btn" type="button" onClick={onCall}>
            <Icon name="phone" size={18} />
            {t("pdp.call")}
          </button>
          <button className="pdp-mobar__btn pdp-mobar__btn--wa" type="button" onClick={onWhatsApp}>
            <Icon name="message-circle" size={18} />
            {t("pdp.whatsapp")}
          </button>
          <button className="pdp-mobar__btn pdp-mobar__btn--book" type="button" onClick={() => setBookOpen(true)}>
            <Icon name="calendar-check" size={18} />
            {t("pdp.book")}
          </button>
        </div>
      </div>

      <BookModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </>
  );
}
