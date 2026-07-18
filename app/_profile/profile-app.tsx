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
import { openAuth, useAuth } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import * as D from "./data";
import type { AgentProfile, ProfileAgent } from "./data";

/** Relative "N ago" label for a review, from its age in days. */
function useRelative() {
  const { t } = useLang();
  return (days: number) => {
    if (days <= 0) return t("profile.reviewJustNow");
    if (days < 7) return t("profile.daysAgo", { count: String(days) });
    if (days < 30) {
      const w = Math.round(days / 7);
      return t("profile.weeksAgo", { count: String(w) });
    }
    if (days < 365) {
      const m = Math.round(days / 30);
      return t("profile.monthsAgo", { count: String(m) });
    }
    const y = Math.round(days / 365);
    return t("profile.yearsAgo", { count: String(y) });
  };
}

function Crumb({ agent }: { agent: ProfileAgent }) {
  const { t } = useLang();
  return (
    <nav className="pdp-crumb" aria-label="Breadcrumb">
      <Link className="pdp-crumb__link" href="/">
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

function Hero({ agent, intro, saved, onSave, onShare, onCall, onWhatsApp, onEmail }: {
  agent: ProfileAgent;
  intro: string;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  onCall: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
}) {
  const { t } = useLang();
  const initials = agent.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <header className="pro-hero">
      <div className="pro-hero__photowrap">
        <div className="pro-hero__photo">
          {agent.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agent.photo} alt={agent.name} />
          ) : (
            <div className="pro-hero__initials" aria-hidden="true">{initials}</div>
          )}
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
            <Icon name="map-pin" size={16} />
            {agent.city}
          </span>
        </div>

        <div className="pro-hero__facts">
          {agent.reviews > 0 && (
            <>
              <div className="pro-hero__fact">
                <Icon name="star" size={16} fill="currentColor" className="pro-hero__star" />
                <span>
                  <b>{agent.rating.toFixed(1)}</b> ({agent.reviews} {t("profile.reviews")})
                </span>
              </div>
              <span className="pro-hero__vrule" />
            </>
          )}
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
        <p className="pro-hero__intro">{intro}</p>

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
function TrustMetrics({ metrics }: { metrics: D.Metric[] }) {
  const { t } = useLang();
  return (
    <section className="pro-metrics">
      {metrics.map((m, i) => {
        const k = METRIC_KEYS[i];
        return (
          <div key={k} className="pro-metric">
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

function About({ agent, about, areas }: { agent: ProfileAgent; about: string[]; areas: D.Area[] }) {
  const { t } = useLang();
  return (
    <section className="pdp-sec pro-about">
      <h2 className="pdp-sec__title">{t("profile.about")} {agent.name}</h2>
      <div className="pdp-desc">
        {about.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <div className="pro-tags">
        <div className="pro-tagblock">
          <div className="pro-taglabel">{t("profile.areas")}</div>
          <div className="pro-chips">
            {areas.map((a) => (
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
  default: "sort.default",
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
              <span>{lbl(o.value)}</span>
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
  if (sort === "newest") return arr.sort((a, b) => a.since - b.since);
  return arr; // "default" → natural order
}

function ActiveListings({ agent, listings, favorites, onFavorite }: { agent: ProfileAgent; listings: D.ProListing[]; favorites: string[]; onFavorite: (id: string) => void }) {
  const router = useRouter();
  const { t } = useLang();
  const [sort, setSort] = useState("default");
  const list = useMemo(() => sortListings(listings, sort), [listings, sort]);
  const fmt = (l: D.ProListing) => "$" + l.price.toLocaleString("en-US");
  if (!listings.length) return null;
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

function RecentlySold({ sold }: { sold: D.Sold[] }) {
  const { t } = useLang();
  const fmt = (n: number) => "$" + n.toLocaleString("en-US");
  if (!sold.length) return null;
  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("profile.sold")}</h2>
      <p className="pdp-sec__lead">{t("profile.soldLead")}</p>
      <div className="pro-soldgrid">
        {sold.map((s) => (
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

/** A working member review — either seeded from data or authored by the signed-in member. */
interface RevItem {
  id: string;
  name: string;
  avatar?: string;
  stars: number;
  when: string;
  deal?: string;
  text: string;
  own?: boolean;
  pending?: boolean;
}

/** Interactive 1–5 star picker used by the review composer. */
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="pro-ratepick" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={i === value}
          aria-label={`${i} / 5`}
          className="pro-ratepick__btn"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
        >
          <Icon name="star" size={28} fill={i <= active ? "currentColor" : "none"} className={i <= active ? "pro-ratepick__on" : "pro-ratepick__off"} />
        </button>
      ))}
    </div>
  );
}

/** Compose a new review or edit an existing one (star rating + free text). */
function ReviewComposer({ initial, onSubmit, onCancel }: {
  initial?: RevItem | null;
  onSubmit: (stars: number, text: string) => void;
  onCancel?: () => void;
}) {
  const { t } = useLang();
  const editing = !!initial;
  const [rating, setRating] = useState(initial?.stars ?? 0);
  const [text, setText] = useState(initial?.text ?? "");
  const canPost = rating > 0 && text.trim().length > 0;

  const submit = () => {
    if (!canPost) return;
    onSubmit(rating, text.trim());
    if (!editing) {
      setRating(0);
      setText("");
    }
  };

  return (
    <div className="pro-revcomposer">
      <div className="pro-revcomposer__head">
        <span className="pro-revcomposer__title">{editing ? t("profile.editReviewTitle") : t("profile.rateExperience")}</span>
        {onCancel && (
          <button type="button" className="pro-revcomposer__cancel" onClick={onCancel}>
            {t("profile.reviewCancel")}
          </button>
        )}
      </div>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        className="pro-revcomposer__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("profile.reviewPlaceholder")}
        rows={3}
      />
      <div className="pro-revcomposer__actions">
        <Button hierarchy="primary" iconLeading={editing ? "check" : "send"} disabled={!canPost} onClick={submit}>
          {editing ? t("profile.updateReview") : t("profile.postReview")}
        </Button>
      </div>
    </div>
  );
}

function Reviews({ agent, reviews }: { agent: ProfileAgent; reviews: D.Review[] }) {
  const { t } = useLang();
  const { user } = useAuth();
  const { profile } = useProfile();
  const rel = useRelative();

  const seed = useMemo<RevItem[]>(
    () =>
      reviews.map((r) => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        stars: r.stars,
        when: rel(r.daysAgo),
        deal: r.dealKey ? t(r.dealKey, { title: r.dealTitle ?? "" }) : undefined,
        text: r.text,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reviews],
  );
  const [items, setItems] = useState<RevItem[]>(seed);
  const [editing, setEditing] = useState<RevItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const authorName = profile.fullName || user?.name || t("acct.member");

  /* A member's own submission is held for moderation — it shows a Pending badge
     and is not counted toward the public rating (mirrors the admin queue). */
  const addReview = (stars: number, text: string) =>
    setItems((rs) => [
      { id: "own-" + Date.now(), name: authorName, avatar: profile.avatar || undefined, stars, when: t("profile.reviewJustNow"), deal: t("profile.reviewYou"), text, own: true, pending: true },
      ...rs,
    ]);
  const updateReview = (id: string, stars: number, text: string) =>
    setItems((rs) => rs.map((r) => (r.id === id ? { ...r, stars, text, when: t("profile.reviewEdited") } : r)));
  const deleteReview = (id: string) => setItems((rs) => rs.filter((r) => r.id !== id));

  const publicCount = agent.reviews;

  return (
    <section className="pdp-sec">
      <h2 className="pdp-sec__title">{t("profile.reviewsTitle")}</h2>

      {user ? (
        <ReviewComposer
          key={editing?.id ?? "new"}
          initial={editing}
          onSubmit={(stars, text) => {
            if (editing) {
              updateReview(editing.id, stars, text);
              toast({ title: t("profile.reviewUpdated"), variant: "success" });
            } else {
              addReview(stars, text);
              toast({ title: t("profile.reviewPosted"), variant: "success" });
            }
            setEditing(null);
          }}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      ) : (
        <div className="pro-revsignin">
          <div className="pro-revsignin__txt">
            <div className="pro-revsignin__title">{t("profile.signInToReview")}</div>
            <p className="pro-revsignin__sub">{t("profile.signInToReviewSub")}</p>
          </div>
          <Button hierarchy="secondary" iconLeading="log-in" onClick={() => openAuth("login", { note: t("profile.signInToReview") })}>
            {t("profile.signInToReviewBtn")}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="pro-revempty">
          <span className="pro-revempty__ic">
            <Icon name="message-square" size={26} />
          </span>
          <div className="pro-revempty__title">{t("profile.noReviews")}</div>
          <p className="pro-revempty__sub">{t("profile.noReviewsSub", { name: agent.name })}</p>
        </div>
      ) : (
        <div className="pro-rev__list">
          {items.map((r) => (
            <article key={r.id} className={"pro-revcard" + (r.own ? " pro-revcard--own" : "")}>
              <div className="pro-revcard__head">
                <Avatar src={r.avatar} name={r.name} size="md" />
                <div className="pro-revcard__id">
                  <div className="pro-revcard__name">
                    {r.name}
                    {r.pending && <span className="pro-revcard__pending">{t("profile.pendingBadge")}</span>}
                  </div>
                  {r.deal && <div className="pro-revcard__deal">{r.deal}</div>}
                </div>
                <span className="pro-revcard__when">{r.when}</span>
              </div>
              <Stars n={r.stars} />
              <p className="pro-revcard__text">{`“${r.text}”`}</p>
              {r.pending && <p className="pro-revcard__pendingnote">{t("profile.pendingNote")}</p>}
              {r.own && user && (
                <div className="pro-revcard__actions">
                  <button type="button" className="pro-revcard__act" onClick={() => setEditing(r)}>
                    <Icon name="pencil" size={15} />
                    {t("profile.reviewEdit")}
                  </button>
                  <button type="button" className="pro-revcard__act pro-revcard__act--danger" onClick={() => setPendingDelete(r.id)}>
                    <Icon name="trash-2" size={15} />
                    {t("profile.reviewDelete")}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {publicCount > 0 && <p className="pro-rev__count">{t("profile.basedOn", { count: String(publicCount) })}</p>}

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        icon="trash-2"
        title={t("profile.deleteReviewTitle")}
        subtitle={t("profile.deleteReviewSub")}
        size="sm"
        footerSpread
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setPendingDelete(null)}>
              {t("profile.reviewCancel")}
            </Button>
            <Button
              hierarchy="destructive"
              iconLeading="trash-2"
              onClick={() => {
                if (pendingDelete) {
                  if (editing?.id === pendingDelete) setEditing(null);
                  deleteReview(pendingDelete);
                  toast({ title: t("profile.reviewDeleted") });
                }
                setPendingDelete(null);
              }}
            >
              {t("profile.reviewDelete")}
            </Button>
          </>
        }
      />
    </section>
  );
}

export function ProfileApp({ profile }: { profile: AgentProfile }) {
  const { t } = useLang();
  const { agent } = profile;
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
          <Crumb agent={agent} />
          <Hero agent={agent} intro={profile.intro} saved={saved} onSave={onSave} onShare={onShare} onCall={onCall} onWhatsApp={onWhatsApp} onEmail={onEmail} />
          <TrustMetrics metrics={profile.metrics} />
          <div className="pdp-body pro-body">
            <div className="pdp-content">
              <About agent={agent} about={profile.about} areas={profile.areas} />
              <ActiveListings agent={agent} listings={profile.listings} favorites={favorites} onFavorite={onFavorite} />
              <RecentlySold sold={profile.sold} />
              <Reviews agent={agent} reviews={profile.reviews} />
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
