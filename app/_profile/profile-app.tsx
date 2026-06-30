"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PropertyCard } from "@/components/real-estate";
import { useClickOutside } from "@/lib/use-click-outside";
import { toast } from "@/components/feedback/toast";
import { useLang } from "@/lib/i18n";
import * as D from "./data";

const { agent } = D;

function Crumb() {
  const { t } = useLang();
  return (
    <nav className="pdp-crumb" aria-label="Breadcrumb">
      <Link className="pdp-crumb__link" href="/">
        <Icon name="home" size={15} />
        {t("srp.crumb.home")}
      </Link>
      <Icon name="chevron-right" size={15} className="pdp-crumb__sep" />
      <Link className="pdp-crumb__link" href="/agents">
        {t("agents.crumb")}
      </Link>
      <Icon name="chevron-right" size={15} className="pdp-crumb__sep" />
      <span className="pdp-crumb__current" aria-current="page">
        {agent.name}
      </span>
    </nav>
  );
}

function Hero({ saved, onSave, onShare, onCall, onWhatsApp, onEmail }: {
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
}) {
  const { t } = useLang();
  return (
    <header className="pro-hero">
      <div className="pro-hero__photowrap">
        <div className="pro-hero__photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={agent.photo} alt={agent.name} />
          <div className="pro-hero__photograd" />
          {agent.verified && (
            <span className="pro-hero__vbadge">
              <Icon name="badge-check" size={15} />
              {t("profile.verifiedAgent")}
            </span>
          )}
        </div>
      </div>

      <div className="pro-hero__body">
        <div className="pro-hero__namerow">
          <div className="pro-hero__nameblock">
            <div className="pro-hero__eyebrow">{agent.title}</div>
            <h1 className="pro-hero__name">{agent.name}</h1>
          </div>
          <div className="pro-hero__nameactions">
            <button type="button" onClick={onSave} className={"pro-secbtn" + (saved ? " pro-secbtn--saved" : "")}>
              <Icon name="heart" size={17} fill={saved ? "currentColor" : "none"} />
              {saved ? t("profile.saved") : t("profile.save")}
            </button>
            <button type="button" className="pro-secbtn" onClick={onShare}>
              <Icon name="share-2" size={17} />
              {t("profile.share")}
            </button>
          </div>
        </div>

        <div className="pro-hero__meta">
          <span className="pro-hero__metaitem">
            <Icon name="building-2" size={16} />
            {agent.agency}
          </span>
          <span className="pro-hero__dot" />
          <span className="pro-hero__metaitem">
            <Icon name="map-pin" size={16} />
            {agent.city}
          </span>
        </div>

        <div className="pro-hero__facts">
          <div className="pro-hero__fact">
            <Icon name="star" size={16} fill="currentColor" className="pro-hero__star" />
            <span>
              <b>{agent.rating.toFixed(1)}</b> ({agent.reviews} {t("profile.reviews")})
            </span>
          </div>
          <span className="pro-hero__vrule" />
          <div className="pro-hero__fact">
            <Icon name="calendar-check" size={16} />
            <span>
              <b>{agent.experience}</b> {t("profile.yearsExp")}
            </span>
          </div>
          <span className="pro-hero__vrule" />
          <div className="pro-hero__fact">
            <Icon name="languages" size={16} />
            <span>{agent.languages.join(" · ")}</span>
          </div>
        </div>

        <div className="pro-hero__rule" />
        <p className="pro-hero__intro">{D.intro}</p>

        <div className="pro-hero__actions">
          <button type="button" className="pro-act pro-act--wa" onClick={onWhatsApp}>
            <Icon name="message-circle" size={19} />
            {t("profile.whatsapp")}
          </button>
          <button type="button" className="pro-act pro-act--call" onClick={onCall}>
            <Icon name="phone" size={18} />
            {t("profile.call")}
          </button>
          <button type="button" className="pro-act pro-act--email" onClick={onEmail}>
            <Icon name="mail" size={18} />
            {t("profile.email")}
          </button>
        </div>

        <div className="pro-hero__respond">
          <Icon name="zap" size={15} />
          <span>
            {t("profile.respond")} <b>{t("profile.respondVal")}</b>
          </span>
        </div>
      </div>
    </header>
  );
}

const METRIC_KEYS = ["active", "sold", "years", "rating"] as const;
function TrustMetrics() {
  const { t } = useLang();
  return (
    <section className="pro-metrics">
      {D.metrics.map((m, i) => {
        const k = METRIC_KEYS[i];
        return (
          <div key={m.label} className="pro-metric">
            <span className="pro-metric__ic">
              <Icon name={m.icon as IconName} size={22} />
            </span>
            <div className="pro-metric__txt">
              <div className="pro-metric__val">{m.value}</div>
              <div className="pro-metric__lbl">{t("profile.metric." + k)}</div>
              <div className="pro-metric__desc">{t("profile.metric." + k + "Desc")}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

function About() {
  const { t } = useLang();
  return (
    <section className="pdp-sec pro-about">
      <h2 className="pdp-sec__title">{t("profile.about")} {agent.name}</h2>
      <div className="pdp-desc">
        {D.about.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="pro-tags">
        <div className="pro-tagblock">
          <div className="pro-taglabel">{t("profile.specialties")}</div>
          <div className="pro-chips">
            {D.specialties.map((s) => (
              <span key={s} className="pro-chip">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="pro-tagblock">
          <div className="pro-taglabel">{t("profile.areas")}</div>
          <div className="pro-chips">
            {D.areas.map((a) => (
              <span key={a.name} className="pro-chip">
                <Icon name="map-pin" size={15} />
                {a.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const PROFILE_SORT_KEYS: Record<string, string> = {
  newest: "sort.newest",
  "price-desc": "sort.price-desc",
  "price-asc": "sort.price-asc",
};
function SortMenu({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const current = D.sortOptions.find((o) => o.value === value) || D.sortOptions[0];
  const lbl = (v: string) => t(PROFILE_SORT_KEYS[v] || "sort.newest");
  return (
    <div className="agt-sort" ref={ref}>
      <button type="button" className={"agt-sort__btn" + (open ? " agt-sort__btn--open" : "")} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="arrow-up-down" size={16} className="agt-sort__lead" />
        <span className="agt-sort__cap">{t("srp.sortLabel")}</span>
        <span className="agt-sort__val">{lbl(current.value)}</span>
        <Icon name="chevron-down" size={16} className={"agt-sort__chev" + (open ? " agt-sort__chev--open" : "")} />
      </button>
      {open && (
        <div className="agt-sort__panel">
          {D.sortOptions.map((o) => (
            <button key={o.value} type="button" className={"agt-sort__opt" + (o.value === value ? " agt-sort__opt--on" : "")} onClick={() => { onChange(o.value); setOpen(false); }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <Icon name={o.icon as IconName} size={16} />
                {lbl(o.value)}
              </span>
              {o.value === value && <Icon name="check" size={17} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function sortListings(list: D.ProListing[], sort: string) {
  const arr = [...list];
  if (sort === "price-desc") return arr.sort((a, b) => b.price - a.price);
  if (sort === "price-asc") return arr.sort((a, b) => a.price - b.price);
  return arr.sort((a, b) => a.since - b.since);
}

function ActiveListings({ favorites, onFavorite }: { favorites: string[]; onFavorite: (id: string) => void }) {
  const router = useRouter();
  const { t } = useLang();
  const [sort, setSort] = useState("newest");
  const list = useMemo(() => sortListings(D.listings, sort), [sort]);
  const fmt = (l: D.ProListing) => "$" + l.price.toLocaleString("en-US");
  return (
    <section className="pdp-sec pro-listings">
      <div className="pro-secrow">
        <div>
          <h2 className="pdp-sec__title" style={{ margin: 0 }}>
            {t("profile.activeListings")}
          </h2>
          <p className="pro-secrow__sub">
            <b>{agent.listings}</b> {t("profile.listingsSub")}
          </p>
        </div>
        <SortMenu value={sort} onChange={setSort} />
      </div>
      <div className="pro-listgrid">
        {list.map((l) => (
          <PropertyCard
            key={l.id}
            image={l.cover}
            price={fmt(l)}
            period={l.deal === "rent" ? "mo" : undefined}
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
      <div className="pro-listmore">
        <Button hierarchy="secondary" size="lg" iconTrailing="arrow-right" onClick={() => router.push("/search")}>
          {t("profile.viewAll")} {agent.listings} {t("profile.listings")}
        </Button>
      </div>
    </section>
  );
}

function RecentlySold() {
  const { t } = useLang();
  const fmt = (n: number) => "$" + n.toLocaleString("en-US");
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("profile.sold")}</h2>
      <p className="pdp-sec__lead">{t("profile.soldLead")}</p>
      <div className="pro-soldgrid">
        {D.sold.map((s) => (
          <article key={s.id} className="pro-sold">
            <div className="pro-sold__media">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.cover} alt={s.title} loading="lazy" />
              <span className="pro-sold__badge">{s.deal}</span>
            </div>
            <div className="pro-sold__body">
              <div className="pro-sold__price">
                {fmt(s.price)}
                {s.deal === "Rented" && <small> /mo</small>}
              </div>
              <div className="pro-sold__title">{s.title}</div>
              <div className="pro-sold__addr">
                <Icon name="map-pin" size={13} />
                {s.address}
              </div>
              <div className="pro-sold__foot">
                <span className="pro-sold__specs">{s.beds + " bd · " + s.baths + " ba · " + s.area + " m²"}</span>
                <span className="pro-sold__when">
                  <Icon name="circle-check" size={13} />
                  {s.when}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Stars({ n, size = 15 }: { n: number; size?: number }) {
  return (
    <span className="pro-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} fill={i <= n ? "currentColor" : "none"} className={i <= n ? "pro-stars__on" : "pro-stars__off"} />
      ))}
    </span>
  );
}

function Reviews() {
  const { t } = useLang();
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("profile.reviewsTitle")}</h2>
      <div className="pro-rev__list">
        {D.reviews.map((r) => (
          <article key={r.id} className="pro-revcard">
            <div className="pro-revcard__head">
              <Avatar src={r.avatar} name={r.name} size="md" />
              <div className="pro-revcard__id">
                <div className="pro-revcard__name">{r.name}</div>
                <div className="pro-revcard__deal">{r.deal}</div>
              </div>
              <span className="pro-revcard__when">{r.when}</span>
            </div>
            <Stars n={r.stars} />
            <p className="pro-revcard__text">{`“${r.text}”`}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProfileApp() {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);

  const onSave = () => setAuthOpen(true);
  const onShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: agent.name + " · Chiya Estate", url: location.href }).catch(() => {});
    } else {
      toast({ title: "Profile link copied", variant: "success" });
    }
  };
  const onWhatsApp = () => window.open("https://wa.me/" + agent.whatsapp, "_blank", "noopener");
  const onCall = () => {
    window.location.href = "tel:" + agent.phone.replace(/\s+/g, "");
  };
  const onEmail = () => {
    window.location.href = "mailto:" + agent.email;
  };
  const onFavorite = (id: string) =>
    setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  return (
    <>
      <main className="pro-main">
        <div className="pdp">
          <Crumb />
          <Hero saved={saved} onSave={onSave} onShare={onShare} onCall={onCall} onWhatsApp={onWhatsApp} onEmail={onEmail} />
          <TrustMetrics />
          <div className="pdp-body pro-body">
            <div className="pdp-content">
              <About />
              <ActiveListings favorites={favorites} onFavorite={onFavorite} />
              <RecentlySold />
              <Reviews />
            </div>
          </div>
        </div>
      </main>

      <Modal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        size="sm"
        icon="heart"
        title={t("agents.save.title")}
        subtitle={`${t("agents.save.sub")} ${agent.name} ${t("agents.save.subEnd")}`}
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setAuthOpen(false)}>
              {t("agents.login")}
            </Button>
            <Button hierarchy="primary" onClick={() => { setSaved(true); setAuthOpen(false); }}>
              {t("agents.createAccount")}
            </Button>
          </>
        }
      >
        <ul className="agt-authlist">
          {[t("agents.save.li1"), t("agents.save.li2"), t("agents.save.li3")].map((x) => (
            <li key={x}>
              <Icon name="check" size={16} />
              {x}
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
