"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Breadcrumb } from "@/components/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { useClickOutside } from "@/lib/use-click-outside";
import { useLang } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { AgentCard } from "@/components/real-estate";
import { AgentFiltersPanel } from "./agent-filters";
import {
  agents,
  sortOptions,
  experienceMatch,
  countAgentFilters,
  emptyAgentFilters,
  type DirAgent,
  type AgentFilters,
} from "./data";

const PER_PAGE = 12;

function sortAgents(list: DirAgent[], sort: string) {
  const arr = [...list];
  if (sort === "rating") return arr.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  if (sort === "experience") return arr.sort((a, b) => b.experience - a.experience || b.rating - a.rating);
  if (sort === "listings") return arr.sort((a, b) => b.listings - a.listings);
  return arr; // "default" → natural order
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

/** Sort dropdown — reuses the SRP sort-menu chrome (.srp-sort*). */
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
        <span className="srp-sort__val">{t("agents.sort." + current.value)}</span>
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
              <span>{t("agents.sort." + o.value)}</span>
              {o.value === value && <Icon name="check" size={17} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentsApp() {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<AgentFilters>(emptyAgentFilters);
  const [sort, setSort] = useState("default");
  const { user } = useAuth();
  const { isAgentSaved, toggleAgent } = useFavorites();
  const [saved, setSaved] = useState<string[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<DirAgent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const asideScrollRef = useRef<HTMLDivElement>(null);

  // Premium fade overlays on the sticky filter rail — only when it overflows.
  useEffect(() => {
    const el = asideScrollRef.current;
    if (!el) return;
    const aside = el.closest(".srp-aside");
    if (!aside) return;
    const update = () => {
      aside.classList.toggle("is-fade-top", el.scrollTop > 2);
      aside.classList.toggle("is-fade-bottom", el.scrollTop + el.clientHeight < el.scrollHeight - 2);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const on = {
    toggleCity: (v: string) =>
      setFilters((f) => ({ ...f, cities: f.cities.includes(v) ? f.cities.filter((x) => x !== v) : [...f.cities, v] })),
    toggleLanguage: (v: string) =>
      setFilters((f) => ({ ...f, languages: f.languages.includes(v) ? f.languages.filter((x) => x !== v) : [...f.languages, v] })),
    setExperience: (v: string) => setFilters((f) => ({ ...f, experience: f.experience === v ? "" : v })),
  };
  const clearAll = () => {
    setFilters(emptyAgentFilters);
    setQuery("");
  };

  const activeCount = countAgentFilters(filters);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = agents.slice();
    if (filters.cities.length) list = list.filter((a) => filters.cities.includes(a.city));
    if (filters.languages.length) list = list.filter((a) => filters.languages.some((l) => a.languages.includes(l)));
    if (filters.experience) list = list.filter((a) => experienceMatch(a.experience, filters.experience));
    if (q) list = list.filter((a) => `${a.name} ${a.city}`.toLowerCase().includes(q));
    return sortAgents(list, sort);
  }, [query, filters, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  // Reset to page 1 when the query/filters/sort change (adjust state during render).
  const filterKey = `${query}|${filters.cities.join(",")}|${filters.languages.join(",")}|${filters.experience}|${sort}`;
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
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const onSave = (agent: DirAgent) => {
    // Signed in → save straight to the shared store (powers the Saved page).
    // Signed out → keep the account-creation gate from the export.
    if (user) {
      toggleAgent({
        id: agent.id,
        name: agent.name,
        photo: agent.photo,
        city: agent.city,
        verified: agent.verified,
        rating: agent.rating,
        listings: agent.listings,
        href: `/agents/${agent.id}`,
      });
      return;
    }
    setPendingAgent(agent);
    setAuthOpen(true);
  };

  // Active-filter chips (filters only — never the free-text search query).
  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.cities.forEach((c) => chips.push({ key: "city-" + c, label: t("city." + c), onRemove: () => on.toggleCity(c) }));
  filters.languages.forEach((l) => chips.push({ key: "lang-" + l, label: t("admin.agents.langOpt." + l), onRemove: () => on.toggleLanguage(l) }));
  if (filters.experience) chips.push({ key: "exp", label: t("agents.exp." + filters.experience), onRemove: () => on.setExperience("") });

  const filterPanel = <AgentFiltersPanel f={filters} on={on} activeCount={activeCount} onClearAll={clearAll} />;

  return (
    <>
      <div className="srp-top">
        <div className="srp-top__crumb">
          <Breadcrumb items={[{ label: t("srp.crumb.home"), href: "/" }, { label: t("agents.crumb") }]} />
        </div>
      </div>

      <main className="srp-main">
        <div className="srp-layout">
          <aside className="srp-aside">
            <div className="srp-aside__fade srp-aside__fade--top" aria-hidden="true" />
            <div className="srp-aside__scroll" ref={asideScrollRef}>
              {filterPanel}
            </div>
            <div className="srp-aside__fade srp-aside__fade--bottom" aria-hidden="true" />
          </aside>

          <div className="srp-results">
            <div className="srp-rtop">
              <h1 className="srp-rhead__title">{t("agents.resTitle")}</h1>
              <p className="srp-rhead__count">
                <b>{results.length}</b>{" "}
                {results.length === 1 ? t("agents.verifiedAgent") : t("agents.verifiedAgents")}
                {activeCount > 0 && <span className="srp-rhead__note"> · {t("agents.filtered")}</span>}
              </p>
            </div>

            <div className="srp-rhead">
              <form className="srp-toolbar__search" role="search" onSubmit={(e) => e.preventDefault()}>
                <div className="srp-bar">
                  <Icon name="search" size={20} className="srp-bar__ic" />
                  <input
                    className="srp-bar__input"
                    type="text"
                    aria-label={t("agents.searchPh")}
                    placeholder={t("agents.searchPh")}
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
                <button type="button" className="srp-summary__filters" onClick={() => setDrawerOpen(true)} aria-label={t("srp.filters")}>
                  <Icon name="sliders-horizontal" size={18} />
                  <span className="srp-summary__filters-txt">{t("srp.filters")}</span>
                </button>
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
                  <button type="button" className="srp-chips__clear" onClick={clearAll}>
                    {t("srp.clearAll")}
                  </button>
                </div>
              </div>
            )}

            {results.length > 0 ? (
              <>
                <div className="srp-grid">
                  {paged.map((a) => (
                    <AgentCard
                      key={a.id}
                      name={a.name}
                      photo={a.photo}
                      city={a.city}
                      verified={a.verified}
                      rating={a.rating}
                      listings={a.listings}
                      favorite={user ? isAgentSaved(a.id) : saved.includes(a.id)}
                      onFavorite={() => onSave(a)}
                      href={`/agents/${a.id}`}
                    />
                  ))}
                </div>
                <div className="srp-pager">
                  <span className="srp-pager__info">
                    {t("agents.showing")} <b>{pageStart + 1}–{pageStart + paged.length}</b> {t("agents.of")} <b>{results.length}</b> {t("agents.agentsLower")}
                  </span>
                  <div className="srp-pager__ctrls">
                    <button type="button" className="pp-page-btn pp-page-btn--nav" disabled={safePage === 1} onClick={() => goPage(safePage - 1)}>
                      <Icon name="chevron-left" size={15} className="srp-pager__previc" />
                      {t("srp.prev")}
                    </button>
                    {pageTokens(safePage, totalPages).map((p, i) =>
                      p === "…" ? (
                        <span key={"gap-" + i} className="pp-page-ellipsis">
                          …
                        </span>
                      ) : (
                        <button key={p} type="button" className={"pp-page-btn" + (p === safePage ? " is-active" : "")} onClick={() => goPage(p)}>
                          {p}
                        </button>
                      ),
                    )}
                    <button type="button" className="pp-page-btn pp-page-btn--nav" disabled={safePage === totalPages} onClick={() => goPage(safePage + 1)}>
                      {t("srp.next")}
                      <Icon name="chevron-right" size={15} className="srp-pager__nextic" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="srp-empty">
                <div className="srp-empty__ic">
                  <Icon name="users" size={30} />
                </div>
                <h3 className="srp-empty__title">{t("agents.empty.title")}</h3>
                <p className="srp-empty__sub">{t("agents.empty.sub")}</p>
                <div className="srp-empty__actions">
                  <Button hierarchy="secondary" iconLeading="rotate-ccw" onClick={clearAll}>
                    {t("agents.clearFilters")}
                  </Button>
                </div>
              </div>
            )}
          </div>
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

      {/* mobile filter drawer */}
      <div className={"srp-drawer" + (drawerOpen ? " srp-drawer--open" : "")}>
        <div className="srp-drawer__scrim" onClick={() => setDrawerOpen(false)} />
        <div className="srp-drawer__sheet">
          <div className="srp-drawer__head">
            <span className="srp-drawer__title">{t("agents.filterTitle")}</span>
            <button type="button" className="srp-drawer__close" aria-label={t("srp.closeFilters")} onClick={() => setDrawerOpen(false)}>
              <Icon name="x" size={20} />
            </button>
          </div>
          <div className="srp-drawer__body">{filterPanel}</div>
          <div className="srp-drawer__foot">
            <button type="button" className="srp-drawer__apply" onClick={() => setDrawerOpen(false)}>
              {t("agents.show")} {results.length} {t("agents.agentsLower")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
