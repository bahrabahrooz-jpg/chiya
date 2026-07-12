"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { property, description, features, amenities } from "./data";

function QuickFacts() {
  const { t } = useLang();
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
  const lat = 36.4078;
  const lng = 44.3239;
  const d = 0.018;
  const bbox = [lng - d, lat - d * 0.62, lng + d, lat + d * 0.62].join("%2C");
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const fullLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=14/${lat}/${lng}`;
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("pdp.location")}</h2>
      <div className="pdp-loc">
        <div className="pdp-loc__map pdp-loc__map--real">
          <iframe className="pdp-loc__frame" title={`Map of ${property.address}`} src={embedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          <div className="pdp-loc__badge">
            <Icon name="map-pin" size={15} />
            <span>{property.neighborhood + ", " + property.city}</span>
          </div>
          <a className="pdp-loc__expand" href={fullLink} target="_blank" rel="noopener">
            <Icon name="maximize" size={14} />
            {t("pdp.viewLargerMap")}
          </a>
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
