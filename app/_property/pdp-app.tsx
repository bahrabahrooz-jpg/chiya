"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/feedback/toast";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useSaveGate, type SavedProperty } from "@/lib/favorites";
import { formatPrice } from "@/lib/money";
import { useApproxPrice } from "@/lib/use-approx-price";
import type { PdpData } from "./data";
import { PdpProvider, usePdp } from "./pdp-context";
import { PdpGallery } from "./pdp-gallery";
import { PdpMain } from "./pdp-main";
import { ActionPanel, BookModal } from "./pdp-aside";
import { PdpSimilar } from "./pdp-similar";

/** Renders the detail page for the property resolved by the /property/[id]
    route. The data is built on the server (buildPdp) and passed in, so the admin
    catalog stays out of the client bundle. */
export function PdpApp({ data }: { data: PdpData }) {
  return (
    <PdpProvider value={data}>
      <PdpAppInner />
    </PdpProvider>
  );
}

function PdpAppInner() {
  const { t, lang } = useLang();
  const approxOf = useApproxPrice();
  const { property, gallery, agent, similar } = usePdp();
  const approxPrice = approxOf(property.price);
  const { user } = useAuth();
  const { properties: savedProps, isPropertySaved, saveProperty } = useSaveGate();
  const [bookOpen, setBookOpen] = useState(false);

  const favMain = isPropertySaved(property.id);
  const favorites = savedProps.map((p) => p.id);

  const toggleMainFav = () => {
    // Signed out → the save gate opens the login modal (nothing is saved yet).
    const willSave = !!user && !isPropertySaved(property.id);
    saveProperty({
      id: property.id,
      image: gallery[0],
      price: formatPrice(lang, property.price),
      title: property.title,
      address: property.address,
      beds: property.beds,
      baths: property.baths,
      area: property.area,
      status: property.status,
      href: `/property/${property.id}`,
    });
    if (willSave) toast({ title: "Saved to your favourites", variant: "success" });
  };
  const toggleFav = (id: string) => {
    const s = similar.find((x) => x.id === id);
    if (!s) return;
    const snap: SavedProperty = {
      id: s.id,
      image: s.cover,
      price: formatPrice(lang, s.price),
      title: s.title,
      address: s.address,
      beds: s.beds,
      baths: s.baths,
      area: s.area,
      status: s.status,
      href: `/property/${s.id}`,
    };
    saveProperty(snap);
  };
  const onCall = () => toast({ title: `Calling ${agent.phone}…` });
  const onWhatsApp = () => toast({ title: `Opening WhatsApp with ${agent.name}…` });
  const onShare = () => toast({ title: "Listing link copied to clipboard", variant: "success" });

  return (
    <>
      <main className="pdp pdp-wrap">
        <nav className="pdp-crumb" aria-label="Breadcrumb">
          <Link className="pdp-crumb__link" href="/">
            {t("srp.crumb.home")}
          </Link>
          <Icon name="chevron-right" size={14} className="pdp-crumb__sep" />
          <Link className="pdp-crumb__link" href={`/search?deal=${property.deal}`}>
            {property.deal === "rent" ? t("nav.rent") : t("nav.buy")}
          </Link>
          <Icon name="chevron-right" size={14} className="pdp-crumb__sep" />
          <Link className="pdp-crumb__link" href={`/search?q=${encodeURIComponent(property.city)}`}>
            {t("city." + property.city)}
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
              <Link href={`/search?q=${encodeURIComponent(property.city)}`}>{property.address}</Link>
            </div>
          </div>
          <div className="pdp-head__priceblock">
            <div className="pdp-head__price">
              {formatPrice(lang, property.price)}
              {property.per ? <span className="pdp-head__per">{property.per}</span> : null}
            </div>
            {/* Convenience only, and off unless an admin turns it on. The
                authoritative figure is the one above, in the currency the
                property is actually listed in. */}
            {approxPrice && <div className="pdp-head__approx">{approxPrice}</div>}
          </div>
        </div>

        <div className="pdp-body">
          <PdpMain />
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
