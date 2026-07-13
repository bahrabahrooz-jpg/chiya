"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/icon";
import { useClickOutside } from "@/lib/use-click-outside";
import { useLang } from "@/lib/i18n";
import "./home.css";

type T = (key: string) => string;

interface Option {
  value: string;
  label: string;
  sub?: string;
  icon?: IconName;
}

const getDeals = (t: T): Option[] => [
  { value: "buy", label: t("deal.buy"), icon: "tag" },
  { value: "rent", label: t("deal.rent"), icon: "key" },
];
const getLocations = (t: T): Option[] => [
  { value: "", label: t("loc.all"), icon: "map" },
  { value: "Erbil", label: t("city.Erbil"), icon: "map-pin" },
  { value: "Sulaymaniyah", label: t("city.Sulaymaniyah"), icon: "map-pin" },
  { value: "Duhok", label: t("city.Duhok"), icon: "map-pin" },
];
const getTypes = (t: T): Option[] => [
  { value: "", label: t("type.all"), icon: "layout-grid" },
  { value: "apartment", label: t("type.apartment"), icon: "building-2" },
  { value: "villa", label: t("type.villa"), icon: "home" },
  { value: "house", label: t("type.house"), icon: "house" },
  { value: "office", label: t("type.office"), icon: "briefcase" },
  { value: "land", label: t("type.land"), icon: "trees" },
];
const getBuyPrices = (t: T): Option[] => [
  { value: "", label: t("price.any") },
  { value: "0-100000", label: t("price.buy.u100k") },
  { value: "100000-250000", label: t("price.buy.100-250") },
  { value: "250000-500000", label: t("price.buy.250-500") },
  { value: "500000-1000000", label: t("price.buy.500-1m") },
  { value: "1000000-", label: t("price.buy.1m+") },
];
const getRentPrices = (t: T): Option[] => [
  { value: "", label: t("price.any") },
  { value: "0-1000", label: t("price.rent.u1k") },
  { value: "1000-2500", label: t("price.rent.1-2.5") },
  { value: "2500-5000", label: t("price.rent.2.5-5") },
  { value: "5000-", label: t("price.rent.5k+") },
];

interface FieldProps {
  id: string;
  label: string;
  icon?: IconName;
  options: Option[];
  value: string;
  placeholder: string;
  align?: "right";
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onPick: (value: string) => void;
}

function Field({ id, label, icon, options, value, placeholder, align, openId, setOpenId, onPick }: FieldProps) {
  const ref = useRef<HTMLDivElement>(null);
  const open = openId === id;
  const selected = options.find((o) => o.value === value && o.value !== "");
  useClickOutside(ref, () => setOpenId(null), open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpenId]);

  return (
    <div className={"cxpop cxpop--" + id} ref={ref}>
      <button
        type="button"
        className={"cxfield" + (selected ? "" : " cxfield--empty") + (open ? " cxfield--open" : "")}
        aria-expanded={open}
        onClick={() => setOpenId(open ? null : id)}
      >
        <span className="cxfield__label">{label}</span>
        <span className="cxfield__val">
          {icon && <Icon name={icon} size={18} />}
          <span className="cxfield__txt">{selected ? selected.label : placeholder}</span>
          <Icon name="chevron-down" size={16} className="cxfield__chev" />
        </span>
      </button>
      {open && (
        <div className={"cxpanel" + (align === "right" ? " cxpanel--right" : "")}>
          <div className="cxpanel__scroll cxpanel__scroll--pad">
            {options.map((o) => (
              <button
                key={o.value || "__all"}
                type="button"
                className={"cxrow" + ((value || "") === o.value ? " cxrow--sel" : "")}
                onClick={() => {
                  onPick(o.value);
                  setOpenId(null);
                }}
              >
                {o.icon && <Icon name={o.icon} size={18} className="cxrow__ic" />}
                <span className="cxrow__title">{o.label}</span>
                {(value || "") === o.value && o.value !== "" && (
                  <Icon name="check" size={17} className="cxrow__check" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroSearch() {
  const router = useRouter();
  const { t } = useLang();
  const [deal, setDeal] = useState("buy");
  const [openId, setOpenId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [price, setPrice] = useState("");
  const DEALS = getDeals(t);
  const LOCATIONS = getLocations(t);
  const TYPES = getTypes(t);
  const prices = deal === "rent" ? getRentPrices(t) : getBuyPrices(t);

  useEffect(() => {
    document.body.classList.toggle("cx-pop-open", openId !== null);
    return () => document.body.classList.remove("cx-pop-open");
  }, [openId]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("deal", deal);
    if (location) params.set("q", location);
    if (type) params.set("type", type);
    if (price) params.set("price", price);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="cxsearch">
      <form className="cxbar" onSubmit={submit}>
        <Field
          id="deal"
          label={t("search.lookingTo")}
          icon={deal === "rent" ? "key" : "tag"}
          options={DEALS}
          value={deal}
          placeholder={t("deal.buy")}
          openId={openId}
          setOpenId={setOpenId}
          onPick={(d) => {
            setDeal(d);
            setPrice("");
          }}
        />
        <span className="cxbar__sep" />
        <Field
          id="location"
          label={t("search.location")}
          icon="map-pin"
          options={LOCATIONS}
          value={location}
          placeholder={t("loc.all")}
          openId={openId}
          setOpenId={setOpenId}
          onPick={setLocation}
        />
        <span className="cxbar__sep" />
        <Field
          id="type"
          label={t("search.propertyType")}
          icon="building-2"
          options={TYPES}
          value={type}
          placeholder={t("type.all")}
          openId={openId}
          setOpenId={setOpenId}
          onPick={setType}
        />
        <span className="cxbar__sep" />
        <Field
          id="price"
          label={t("search.price")}
          icon="wallet"
          options={prices}
          value={price}
          placeholder={t("price.any")}
          openId={openId}
          setOpenId={setOpenId}
          onPick={setPrice}
        />
        <span className="cxbar__sep" />
        <button type="submit" className="cxbar__go">
          <Icon name="search" size={19} />
          <span>{t("search.cta")}</span>
        </button>
      </form>
    </div>
  );
}

/** Hero — full-bleed villa photograph, headline, and the unified search bar. */
export function Hero() {
  const { t } = useLang();
  return (
    <section className="cxhero">
      <div className="cxhero__media">
        <div className="cxhero__bg" />
        <div className="cxhero__grad" />
      </div>
      <div className="cxhero__inner">
        <h1 className="cxhero__title">{t("hero.title")}</h1>
        <p className="cxhero__sub">{t("hero.sub")}</p>
        <HeroSearch />
      </div>
    </section>
  );
}
