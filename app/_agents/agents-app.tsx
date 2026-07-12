"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { useClickOutside } from "@/lib/use-click-outside";
import { useLang } from "@/lib/i18n";
import { agents, cities, sortOptions, type DirAgent } from "./data";
import { AgentDirCard } from "./agent-dir-card";

const PER_PAGE = 12;

interface Filters {
  city: string;
  verifiedOnly: boolean;
}
const emptyFilters: Filters = { city: "", verifiedOnly: false };

function sortAgents(list: DirAgent[], sort: string) {
  const arr = [...list];
  if (sort === "rating") return arr.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  if (sort === "newest") return arr.sort((a, b) => b.since - a.since || b.rating - a.rating);
  return arr.sort((a, b) => b.listings - a.listings);
}

function pageList(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const out: (number | string)[] = [1];
  const lo = Math.max(2, current - 1);
  const hi = Math.min(total - 1, current + 1);
  if (lo > 2) out.push("gap-l");
  for (let p = lo; p <= hi; p++) out.push(p);
  if (hi < total - 1) out.push("gap-r");
  out.push(total);
  return out;
}

function AgentsSort({ sort, setSort }: { sort: string; setSort: (s: string) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const current = sortOptions.find((o) => o.value === sort) || sortOptions[0];
  return (
    <div className="agt-sort" ref={ref}>
      <button type="button" className={"agt-sort__btn" + (open ? " agt-sort__btn--open" : "")} onClick={() => setOpen((v) => !v)}>
        <Icon name="arrow-up-down" size={17} className="agt-sort__lead" />
        <span className="agt-sort__cap">{t("srp.sortLabel")}</span>
        <span className="agt-sort__val">{t("agents.sort." + current.value)}</span>
        <Icon name="chevron-down" size={16} className={"agt-sort__chev" + (open ? " agt-sort__chev--open" : "")} />
      </button>
      {open && (
        <div className="agt-sort__panel">
          {sortOptions.map((o) => (
            <button key={o.value} type="button" className={"agt-sort__opt" + (o.value === sort ? " agt-sort__opt--on" : "")} onClick={() => { setSort(o.value); setOpen(false); }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <Icon name={o.icon as IconName} size={16} />
                {t("agents.sort." + o.value)}
              </span>
              {o.value === sort && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CityPopover({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);
  const opts = [{ value: "", label: t("agents.allCities") }, ...cities.map((c) => ({ value: c, label: t("city." + c) }))];
  return (
    <div className="agt-pop" ref={ref}>
      <button type="button" className={"agt-sort__btn" + (open ? " agt-sort__btn--open" : "")} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Icon name="map-pin" size={17} className="agt-sort__lead" />
        <span className="agt-sort__cap">{t("agents.cityCap")}</span>
        <span className="agt-sort__val">{value ? t("city." + value) : t("agents.allCities")}</span>
        <Icon name="chevron-down" size={16} className={"agt-sort__chev" + (open ? " agt-sort__chev--open" : "")} />
      </button>
      {open && (
        <div className="agt-panel">
          <div className="agt-panel__scroll">
            <div className="agt-panel__label">{t("agents.cityCap").replace(":", "")}</div>
            {opts.map((o) => (
              <button key={o.value} type="button" className={"agt-row" + (value === o.value ? " agt-row--sel" : "")} onClick={() => { onPick(o.value); setOpen(false); }}>
                <span>{o.label}</span>
                {value === o.value && <Icon name="check" size={17} className="agt-row__check" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterControls({ filters, on }: { filters: Filters; on: { setCity: (v: string) => void; toggleVerified: () => void } }) {
  const { t } = useLang();
  return (
    <>
      <div className="agt-ctl agt-ctl--block">
        <label className="agt-ctl__label">{t("agents.cityCap").replace(":", "")}</label>
        <Select size="md" value={filters.city} onChange={(e) => on.setCity(e.target.value)} options={[{ value: "", label: t("agents.allCities") }, ...cities.map((c) => ({ value: c, label: t("city." + c) }))]} />
      </div>
      <button type="button" className={"agt-verified agt-verified--block" + (filters.verifiedOnly ? " agt-verified--on" : "")} onClick={on.toggleVerified} aria-pressed={filters.verifiedOnly}>
        <span className="agt-verified__box">{filters.verifiedOnly && <Icon name="check" size={13} strokeWidth={3} />}</span>
        <Icon name="badge-check" size={16} className="agt-verified__ic" />
        {t("agents.verifiedOnly")}
      </button>
    </>
  );
}

export function AgentsApp() {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState("listings");
  const [saved, setSaved] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<DirAgent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const stickyRef = useRef<HTMLDivElement>(null);

  const on = {
    setCity: (v: string) => setFilters((f) => ({ ...f, city: v })),
    toggleVerified: () => setFilters((f) => ({ ...f, verifiedOnly: !f.verifiedOnly })),
  };
  const clearAll = () => {
    setFilters(emptyFilters);
    setQuery("");
  };

  const activeCount = (filters.city ? 1 : 0) + (filters.verifiedOnly ? 1 : 0);
  const showClear = (filters.verifiedOnly ? 1 : 0) + (query ? 1 : 0) > 0;

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = agents.slice();
    if (q) list = list.filter((a) => a.name.toLowerCase().includes(q));
    if (filters.city) list = list.filter((a) => a.city === filters.city);
    if (filters.verifiedOnly) list = list.filter((a) => a.verified);
    return sortAgents(list, sort);
  }, [query, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  // Reset to page 1 when the query/filters/sort change (adjust state during render).
  const filterKey = `${query}|${filters.city}|${filters.verifiedOnly}|${sort}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) {
    setPrevKey(filterKey);
    setPage(1);
  }

  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PER_PAGE;
  const paged = results.slice(pageStart, pageStart + PER_PAGE);

  const goPage = (p: number) => {
    const next = Math.min(Math.max(1, p), totalPages);
    setPage(next);
    requestAnimationFrame(() => {
      const el = stickyRef.current;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 6, behavior: "smooth" });
    });
  };

  const onSave = (agent: DirAgent) => {
    setPendingAgent(agent);
    setAuthOpen(true);
  };

  return (
    <>
      <main className="agt-main">
        <div className="agt-container">
          <nav className="agt-crumb" aria-label="Breadcrumb">
            <div className="agt-crumb__inner">
              <Link className="agt-crumb__link" href="/">
                Home
              </Link>
              <Icon name="chevron-right" size={15} className="agt-crumb__sep" />
              <span className="agt-crumb__current" aria-current="page">
                {t("agents.crumb")}
              </span>
            </div>
          </nav>

          <header className="agt-hero">
            <div className="agt-hero__text">
              <h1 className="agt-hero__title">{t("agents.heroTitle")}</h1>
              <p className="agt-hero__sub">
                <b>{results.length}</b>{" "}
                {results.length === 1 ? t("agents.verifiedAgent") : t("agents.verifiedAgents")}
                {filters.city ? " " + t("agents.inCity") + " " + t("city." + filters.city) : " " + t("agents.across")}
              </p>
            </div>
          </header>

          <div className="agt-stickybar" ref={stickyRef}>
            <div className="agt-toolbar">
              <form className="agt-toolbar__search" onSubmit={(e) => e.preventDefault()}>
                <div className="agt-searchbar">
                  <Icon name="search" size={20} className="agt-searchbar__ic" />
                  <input className="agt-searchbar__input" type="text" placeholder={t("agents.searchPh")} value={query} onChange={(e) => setQuery(e.target.value)} />
                  {query && (
                    <button type="button" className="agt-searchbar__clear" aria-label={t("srp.clearSearch")} onClick={() => setQuery("")}>
                      <Icon name="x" size={16} />
                    </button>
                  )}
                </div>
                <div className="agt-toolbar__controls">
                  <CityPopover value={filters.city} onPick={on.setCity} />
                  <AgentsSort sort={sort} setSort={setSort} />
                </div>
                <button type="button" className="agt-toolbar__mfilters" onClick={() => setDrawerOpen(true)}>
                  <Icon name="sliders-horizontal" size={18} />
                  {t("agents.filters")}
                </button>
              </form>
            </div>
          </div>

          <div className="agt-resbar">
            <div />
            {activeCount > 0 && showClear && (
              <button type="button" className="agt-resbar__clear" onClick={clearAll}>
                <Icon name="x" size={14} />
                {t("agents.clearFilters")}
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <>
              <div className="agt-grid agt-grid--c3">
                {paged.map((a) => (
                  <AgentDirCard key={a.id} agent={a} saved={saved.includes(a.id)} onSave={onSave} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="agt-pager" aria-label="Pagination">
                  <div className="agt-pager__info">
                    {t("agents.showing")} <b>{pageStart + 1}–{pageStart + paged.length}</b> {t("agents.of")} <b>{results.length}</b> {t("agents.agentsLower")}
                  </div>
                  <div className="agt-pager__ctrls">
                    <button type="button" className="agt-pager__nav" disabled={safePage <= 1} onClick={() => goPage(safePage - 1)}>
                      <Icon name="chevron-left" size={15} />
                      {t("srp.prev")}
                    </button>
                    {pageList(safePage, totalPages).map((p) =>
                      typeof p === "string" ? (
                        <span key={p} className="agt-pager__num agt-pager__num--gap">…</span>
                      ) : (
                        <button key={p} type="button" className={"agt-pager__num" + (p === safePage ? " agt-pager__num--on" : "")} aria-current={p === safePage ? "page" : undefined} onClick={() => goPage(p)}>
                          {p}
                        </button>
                      ),
                    )}
                    <button type="button" className="agt-pager__nav" disabled={safePage >= totalPages} onClick={() => goPage(safePage + 1)}>
                      {t("srp.next")}
                      <Icon name="chevron-right" size={15} />
                    </button>
                  </div>
                </nav>
              )}
            </>
          ) : (
            <div className="agt-empty">
              <span className="agt-empty__ic">
                <Icon name="users" size={30} />
              </span>
              <h2 className="agt-empty__title">{t("agents.empty.title")}</h2>
              <p className="agt-empty__sub">{t("agents.empty.sub")}</p>
              <Button hierarchy="secondary" iconLeading="rotate-ccw" onClick={clearAll}>
                {t("agents.clearFilters")}
              </Button>
            </div>
          )}
        </div>
      </main>

      <Modal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        size="sm"
        icon={pendingAgent ? "heart" : "user-round"}
        title={pendingAgent ? t("agents.save.title") : t("agents.save.welcome")}
        subtitle={
          pendingAgent
            ? `${t("agents.save.sub")} ${pendingAgent.name} ${t("agents.save.subEnd")}`
            : t("agents.save.subGeneric")
        }
        footer={
          <>
            <Button hierarchy="secondary" onClick={() => setAuthOpen(false)}>
              {t("agents.login")}
            </Button>
            <Button hierarchy="primary" onClick={() => { if (pendingAgent) setSaved((s) => (s.includes(pendingAgent.id) ? s : [...s, pendingAgent.id])); setAuthOpen(false); }}>
              {t("agents.createAccount")}
            </Button>
          </>
        }
      >
        <ul className="agt-authlist">
          {[t("agents.save.li1"), t("agents.save.li2"), t("agents.save.li3")].map((li) => (
            <li key={li}>
              <Icon name="check" size={16} />
              {li}
            </li>
          ))}
        </ul>
      </Modal>

      <div className={"agt-drawer" + (drawerOpen ? " agt-drawer--open" : "")}>
        <div className="agt-drawer__scrim" onClick={() => setDrawerOpen(false)} />
        <div className="agt-drawer__sheet">
          <div className="agt-drawer__head">
            <span className="agt-drawer__title">{t("agents.filterTitle")}</span>
            <button type="button" className="agt-drawer__close" aria-label={t("srp.closeFilters")} onClick={() => setDrawerOpen(false)}>
              <Icon name="x" size={20} />
            </button>
          </div>
          <div className="agt-drawer__body">
            <FilterControls filters={filters} on={on} />
            <div className="agt-drawer__sortwrap">
              <label className="agt-ctl__label">{t("agents.sortBy")}</label>
              <AgentsSort sort={sort} setSort={setSort} />
            </div>
          </div>
          <div className="agt-drawer__foot">
            <button type="button" className="agt-drawer__apply" onClick={() => setDrawerOpen(false)}>
              {t("agents.show")} {results.length} {t("agents.agentsLower")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
