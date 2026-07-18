"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { usePdp } from "./pdp-context";

function QuickFacts() {
  const { t } = useLang();
  const { property } = usePdp();
  const facts = [
    { icon: "bed-double", val: property.beds, lbl: t("pdp.beds") },
    { icon: "bath", val: property.baths, lbl: t("pdp.baths") },
    { icon: "maximize-2", val: property.area + " m²", lbl: t("pdp.area") },
  ] as const;
  return (
    <div className="pdp-facts">
      {facts.map((f) => (
        <div key={f.lbl} className="pdp-fact">
          <div className="pdp-fact__lbl">{f.lbl}</div>
          <div className="pdp-fact__row">
            <span className="pdp-fact__ic">
              <Icon name={f.icon} size={19} />
            </span>
            <div className="pdp-fact__val">{f.val}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Description() {
  const { t } = useLang();
  const { description } = usePdp();
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("pdp.about")}</h2>
      <div className={"pdp-desc" + (expanded ? "" : " pdp-desc--clamped")}>
        {description.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <button className="pdp-readmore" type="button" onClick={() => setExpanded((v) => !v)}>
        {expanded ? t("pdp.showLess") : t("pdp.readMore")}
        <Icon name={expanded ? "chevron-up" : "chevron-down"} size={17} />
      </button>
    </section>
  );
}

function Features() {
  const { t } = useLang();
  const { features } = usePdp();
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("pdp.features")}</h2>
      <div className="pdp-fgrid">
        {features.map((f) => (
          <div key={f.label} className="pdp-frow">
            <span className="pdp-frow__ic">
              <Icon name={f.icon as IconName} size={19} />
            </span>
            <div className="pdp-frow__txt">
              <div className="pdp-frow__lbl">{f.label}</div>
              <div className="pdp-frow__val">{f.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Amenities() {
  const { t } = useLang();
  const { amenities } = usePdp();
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("pdp.amenities")}</h2>
      <div className="pdp-amen">
        {amenities.map((a) => (
          <div key={a.label} className="pdp-amenrow">
            <span className="pdp-amenrow__ic">
              <Icon name={a.icon as IconName} size={17} />
            </span>
            {a.label}
          </div>
        ))}
      </div>
    </section>
  );
}

function Location() {
  const { t } = useLang();
  const { property } = usePdp();
  const { lat, lng } = property;
  // Google Maps embed (keyless "output=embed" form) so the preview matches the
  // mobile app's Google map, dropping a marker at the property's coordinates.
  const embedSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&hl=en&output=embed`;
  // Matches the mobile app: opens Google Maps with a route to the property,
  // letting Google fill in the origin from the viewer's current location.
  const directionsLink = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("pdp.location")}</h2>
      <div className="pdp-loc">
        <div className="pdp-loc__map pdp-loc__map--real">
          <iframe className="pdp-loc__frame" title={`Map of ${property.address}`} src={embedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <a
            className="pdp-loc__expand"
            href={directionsLink}
            target="_blank"
            rel="noopener"
            aria-label={`${t("pdp.directions")} — ${property.address}`}
          >
            <Icon name="navigation" size={14} />
            {t("pdp.directions")}
          </a>
        </div>
        <div className="pdp-loc__addr">
          <Icon name="map-pin" size={15} />
          <span>{property.address}</span>
        </div>
      </div>
    </section>
  );
}

export function PdpMain() {
  return (
    <div className="pdp-content">
      <QuickFacts />
      <Description />
      <Features />
      <Amenities />
      <Location />
    </div>
  );
}
