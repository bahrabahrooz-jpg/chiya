"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Tag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/real-estate";
import { useLang } from "@/lib/i18n";
import { sortOptions, PAGE_SIZE, type SrpListing } from "./data";
import { useClickOutside } from "@/lib/use-click-outside";
import { RealMap, buildMarkers } from "./real-map";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

function SortMenu({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  const current = sortOptions.find((o) => o.value === value) || sortOptions[0];
  return (
    <div className="srp-sort" ref={ref}>
      <button
        type="button"
        className={"srp-sort__btn" + (open ? " srp-sort__btn--open" : "")}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="arrow-up-down" size={16} className="srp-sort__lead" />
        <span className="srp-sort__cap">{t("srp.sortLabel")}</span>
        <span className="srp-sort__val">{t("sort." + current.value)}</span>
        <Icon name="chevron-down" size={16} className={"srp-sort__chev" + (open ? " srp-sort__chev--open" : "")} />
      </button>
      {open && (
        <div className="srp-sort__panel">
          {sortOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              className={"srp-sort__opt" + (o.value === value ? " srp-sort__opt--on" : "")}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <span>{t("sort." + o.value)}</span>
              {o.value === value && <Icon name="check" size={17} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: string; onChange: (v: string) => void }) {
  const { t } = useLang();
  return (
    <div className="srp-view">
      {([["grid", "layout-grid", t("srp.gridView")], ["map", "map", t("srp.mapView")]] as const).map(([v, ic, label]) => (
        <button
          key={v}
          type="button"
          className={"srp-view__btn" + (view === v ? " srp-view__btn--on" : "")}
          onClick={() => onChange(v)}
          title={label}
        >
          <Icon name={ic} size={17} />
        </button>
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="srp-skel">
      <div className="srp-skel__img" />
      <div className="srp-skel__body">
        <div className="srp-skel__line srp-skel__line--price" />
        <div className="srp-skel__line srp-skel__line--title" />
        <div className="srp-skel__line srp-skel__line--addr" />
        <div className="srp-skel__specs">
          <div className="srp-skel__chip" />
          <div className="srp-skel__chip" />
          <div className="srp-skel__chip" />
        </div>
      </div>
    </div>
  );
}

/** Page tokens for the grid pager: all pages when few, else 1 … window … last. */
function pageTokens(current: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const left = Math.max(2, current - 1);
  const right = Math.min(count - 1, current + 1);
  const out: (number | "…")[] = [1];
  if (left > 2) out.push("…");
  for (let p = left; p <= right; p++) out.push(p);
  if (right < count - 1) out.push("…");
  out.push(count);
  return out;
}

function EmptyState({ onClearAll }: { onClearAll: () => void }) {
  const { t } = useLang();
  return (
    <div className="srp-empty">
      <div className="srp-empty__ic">
        <Icon name="search-x" size={30} />
      </div>
      <h3 className="srp-empty__title">{t("srp.empty.title")}</h3>
      <p className="srp-empty__sub">{t("srp.empty.sub")}</p>
      <div className="srp-empty__actions">
        <Button hierarchy="secondary" iconLeading="rotate-ccw" onClick={onClearAll}>
          {t("srp.empty.clear")}
        </Button>
      </div>
    </div>
  );
}

export interface SrpResultsProps {
  results: SrpListing[];
  total: number;
  baseline: boolean;
  city: string | null;
  query: string;
  setQuery: (q: string) => void;
  onSearch: () => void;
  view: string;
  sort: string;
  setSort: (s: string) => void;
  setView: (v: string) => void;
  page: number;
  setPage: (p: number) => void;
  onOpenFilters: () => void;
  chips: Chip[];
  onClearAll: () => void;
  loading: boolean;
  favorites: string[];
  onFavorite: (id: string) => void;
  deal: "buy" | "rent";
}

export function SrpResults({
  results,
  total,
  baseline,
  city,
  query,
  setQuery,
  onSearch,
  view,
  sort,
  setSort,
  setView,
  page,
  setPage,
  onOpenFilters,
  chips,
  onClearAll,
  loading,
  favorites,
  onFavorite,
  deal,
}: SrpResultsProps) {
  const router = useRouter();
  const { t } = useLang();
  const cityName = city ? t("city." + city) : null;
  const place = cityName || (query && query.trim()) || t("srp.kurdistan");
  const titleText = deal === "rent" ? t("srp.titleRent") : t("srp.titleSale");
  const fmtPrice = (l: SrpListing) => "$" + l.price.toLocaleString("en-US");

  const renderCard = (l: SrpListing) => (
    <PropertyCard
      key={l.id}
      image={l.cover}
      price={fmtPrice(l)}
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
  );

  // Grid view paginates; the map view lists every result alongside its markers.
  const pageCount = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = results.slice(start, start + PAGE_SIZE);
  const gridCards = pageItems.map(renderCard);
  const mapCards = results.map(renderCard);
  const goTo = (p: number) => setPage(Math.min(Math.max(p, 1), pageCount));

  const pins = buildMarkers(results);
  const mapArea = (cityName || t("srp.kurdistanRegion")) + " · " + total.toLocaleString("en-US") + " " + t("srp.homes");

  return (
    <div className="srp-results">
      <div className="srp-rtop">
        <h1 className="srp-rhead__title">
          {titleText} <span className="srp-rhead__place">{place}</span>
        </h1>
        <p className="srp-rhead__count">
          <b>{total.toLocaleString("en-US")}</b> {total === 1 ? t("srp.result") : t("srp.results")}
          {!baseline && <span className="srp-rhead__note"> · {t("srp.filtered")}</span>}
        </p>
      </div>

      <div className="srp-rhead">
        <form
          className="srp-toolbar__search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch();
          }}
        >
          <div className="srp-bar">
            <Icon name="search" size={20} className="srp-bar__ic" />
            <input
              className="srp-bar__input"
              type="text"
              aria-label={t("srp.searchAria")}
              placeholder={t("srp.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className="srp-bar__clear" aria-label={t("srp.clearSearch")} onClick={() => setQuery("")}>
                <Icon name="x" size={15} />
              </button>
            )}
          </div>
        </form>
        <div className="srp-rhead__tools">
          <SortMenu value={sort} onChange={setSort} />
          {/* Switcher + Filters stay grouped so they wrap together (and Filters
              sits beside the view switcher) on narrow screens. */}
          <div className="srp-rhead__viewfilter">
            <ViewToggle view={view} onChange={setView} />
            <button type="button" className="srp-summary__filters" onClick={onOpenFilters} aria-label={t("srp.filters")}>
              <Icon name="sliders-horizontal" size={18} />
              <span className="srp-summary__filters-txt">{t("srp.filters")}</span>
            </button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="srp-chips">
          <span className="srp-chips__label">{t("srp.activeFilters")}</span>
          <div className="srp-chips__row">
            {chips.map((c) => (
              <Tag key={c.key} onRemove={c.onRemove}>
                {c.label}
              </Tag>
            ))}
            <button type="button" className="srp-chips__clear" onClick={onClearAll}>
              {t("srp.clearAll")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={"srp-grid" + (view === "map" ? " srp-grid--split" : "")}>
          {Array.from({ length: view === "map" ? 4 : 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <EmptyState onClearAll={onClearAll} />
      ) : view === "map" ? (
        <div className="srp-split">
          <div className="srp-split__list">
            <div className="srp-grid srp-grid--split">{mapCards}</div>
          </div>
          <div className="srp-split__map">
            <RealMap markers={pins} city={city} areaLabel={mapArea} />
          </div>
        </div>
      ) : (
        <>
          <div className="srp-grid">{gridCards}</div>
          <div className="srp-pager">
            <span className="srp-pager__info">
                {t("srp.showing")} <b>{(start + 1).toLocaleString("en-US")}–{(start + pageItems.length).toLocaleString("en-US")}</b> {t("srp.of")}{" "}
                <b>{total.toLocaleString("en-US")}</b> {t("srp.propertiesLower")}
              </span>
              <div className="srp-pager__ctrls">
                <button
                  type="button"
                  className="pp-page-btn pp-page-btn--nav"
                  disabled={safePage === 1}
                  onClick={() => goTo(safePage - 1)}
                >
                  <Icon name="chevron-left" size={15} className="srp-pager__previc" />
                  {t("srp.prev")}
                </button>
                {pageTokens(safePage, pageCount).map((p, i) =>
                  p === "…" ? (
                    <span key={"gap-" + i} className="pp-page-ellipsis">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      className={"pp-page-btn" + (p === safePage ? " is-active" : "")}
                      onClick={() => goTo(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  className="pp-page-btn pp-page-btn--nav"
                  disabled={safePage === pageCount}
                  onClick={() => goTo(safePage + 1)}
                >
                  {t("srp.next")}
                  <Icon name="chevron-right" size={15} className="srp-pager__nextic" />
                </button>
              </div>
            </div>
        </>
      )}
    </div>
  );
}
