"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/feedback/toast";
import { useLang } from "@/lib/i18n";
import { openAuth, useAuth } from "@/lib/auth";
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
    route. The page's own data is built on the server (buildPdp) and passed in.
    The booking modal is the one exception: it reads and writes the agency's
    live viewings diary, which is a client store built on the admin catalogue,
    so that catalogue is in this page's bundle. The homepage, search and agent
    pages already carry it via lib/public-catalog, so it is a shared chunk
    rather than a new download for anyone browsing the site. */
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

  /* Requesting a viewing needs an account, for the same reason listing a
     property does: the request goes to a real person at the agency who has to
     call somebody back. Booking anonymously produced a diary entry with a date,
     a time and nobody attached to it. Signed in, the member record supplies the
     name and phone, so nothing has to be asked for twice. */
  const requestBook = () => {
    if (!user) return openAuth("login", { note: t("auth.gate.bookViewing") });
    setBookOpen(true);
  };

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
            <ActionPanel onBook={requestBook} onCall={onCall} onWhatsApp={onWhatsApp} />
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
          <button className="pdp-mobar__btn pdp-mobar__btn--book" type="button" onClick={requestBook}>
            <Icon name="calendar-check" size={18} />
            {t("pdp.book")}
          </button>
        </div>
      </div>

      <BookModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </>
  );
}
