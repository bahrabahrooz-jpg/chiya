"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { StatCard } from "@/components/data/stat-card";
import { useLang, type Lang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { useAuditLog, resolveAuditParams, CURRENT_ACTOR_NAME, type AuditCategory, type AuditEvent } from "../_shared/audit-log";

/* ---------------- category presentation ---------------- */
const CAT_META: Record<AuditCategory, { icon: IconName; labelKey: string }> = {
  review: { icon: "star", labelKey: "admin.nav.reviews" },
  property: { icon: "building-2", labelKey: "admin.nav.properties" },
  member: { icon: "users", labelKey: "admin.nav.members" },
  agent: { icon: "badge-check", labelKey: "admin.nav.agents" },
  location: { icon: "map-pin", labelKey: "admin.nav.locations" },
  role: { icon: "key-round", labelKey: "admin.nav.roles" },
};
const CATEGORIES = Object.keys(CAT_META) as AuditCategory[];

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** The event's verb phrase, with any "@key" params resolved for this language. */
function actionText(e: AuditEvent, t: TFn): string {
  return t(e.actionKey, resolveAuditParams(e.actionParams, t));
}
/** The optional detail line: a translated `metaKey`, else the raw data `meta`. */
function metaText(e: AuditEvent, t: TFn): string | undefined {
  if (e.metaKey) return t(e.metaKey, resolveAuditParams(e.metaParams, t));
  return e.meta;
}

/* ---------------- deterministic date helpers (hydration-safe) ----------------
   Absolute labels are derived straight from the ISO string (UTC) so server and
   the first client render agree. Relative "2h ago" / "Today" upgrades only after
   mount, once `now` is known. */
function isoDayKey(at: string) {
  return at.slice(0, 10); // YYYY-MM-DD (UTC)
}
/** Parse the day key without timezone drift, then format it for `lang`. */
function absDay(dayKey: string, lang: Lang) {
  const [y, mo, da] = dayKey.split("-").map(Number);
  return fmtDate(lang, new Date(y, mo - 1, da));
}
function absTime(at: string, lang: Lang, t: TFn) {
  const time = at.split("T")[1] ?? "";
  const [hStr, mStr] = time.split(":");
  let h = Number(hStr);
  const meridiem = h >= 12 ? t("admin.audit.pm") : t("admin.audit.am");
  h = h % 12 || 12;
  return `${localizeDigits(lang, String(h))}:${localizeDigits(lang, mStr)} ${meridiem}`;
}
function relTime(at: string, now: number, lang: Lang, t: TFn) {
  const diff = now - new Date(at).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return t("admin.audit.justNow");
  if (min < 60) return t("admin.audit.minAgo", { count: fmtNum(lang, min) });
  const h = Math.round(min / 60);
  if (h < 24) return t("admin.audit.hrAgo", { count: fmtNum(lang, h) });
  const d = Math.round(h / 24);
  if (d < 7) return t("admin.audit.dayAgo", { count: fmtNum(lang, d) });
  return absDay(isoDayKey(at), lang);
}
function dayLabel(dayKey: string, now: number | null, lang: Lang, t: TFn) {
  if (now != null) {
    const todayKey = new Date(now).toISOString().slice(0, 10);
    const yestKey = new Date(now - 86_400_000).toISOString().slice(0, 10);
    if (dayKey === todayKey) return t("time.today");
    if (dayKey === yestKey) return t("time.yesterday");
  }
  return absDay(dayKey, lang);
}

interface DayGroup {
  key: string;
  events: AuditEvent[];
}

export function AuditApp() {
  const { t, lang } = useLang();
  const events = useAuditLog();
  const [now, setNow] = useState<number | null>(null);
  const [category, setCategory] = useState<AuditCategory | "">("");
  const [q, setQ] = useState("");

  // Establish the wall clock only after mount so relative labels never diverge
  // between the server render and hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the wall clock after mount avoids an SSR hydration mismatch on relative timestamps
    setNow(Date.now());
  }, []);

  const kpis = useMemo(() => {
    const todayKey = now != null ? new Date(now).toISOString().slice(0, 10) : null;
    return {
      total: events.length,
      today: todayKey ? events.filter((e) => isoDayKey(e.at) === todayKey).length : 0,
      mine: events.filter((e) => e.actor.name === CURRENT_ACTOR_NAME).length,
    };
  }, [events, now]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return events.filter((e) => {
      if (category && e.category !== category) return false;
      if (needle) {
        // Match against the rendered text so search works in the active language.
        const hay = [actionText(e, t), e.target, e.actor.name, e.actor.role, metaText(e, t) ?? ""].join(" ").toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [events, category, q, t]);

  // Group the (already newest-first) list by calendar day. Order is preserved.
  const groups = useMemo<DayGroup[]>(() => {
    const out: DayGroup[] = [];
    let current: DayGroup | null = null;
    for (const e of filtered) {
      const key = isoDayKey(e.at);
      if (!current || current.key !== key) {
        current = { key, events: [] };
        out.push(current);
      }
      current.events.push(e);
    }
    return out;
  }, [filtered]);

  return (
    <>
      <header className="mp-head">
        <div className="mp-head__intro">
          <h1 className="mp-head__title">{t("admin.audit.title")}</h1>
          <p className="mp-head__sub">{t("admin.audit.sub")}</p>
        </div>
      </header>

      <div className="au-demo-note" role="note">
        <Icon name="info" size={16} strokeWidth={2} />
        <span>{t("admin.audit.demoNote")}</span>
      </div>

      <div className="mp-kpis">
        <StatCard label={t("admin.audit.kpi.total")} value={fmtNum(lang, kpis.total)} icon="scroll-text" tone="brand" sub={t("admin.audit.kpiSub.total")} />
        <StatCard label={t("admin.audit.kpi.today")} value={fmtNum(lang, kpis.today)} icon="calendar-check" tone="gold" sub={t("admin.audit.kpiSub.today")} />
        <StatCard label={t("admin.audit.kpi.mine")} value={fmtNum(lang, kpis.mine)} icon="user-round" tone="info" sub={CURRENT_ACTOR_NAME} />
      </div>

      <section className="mp-tablecard">
        <header className="mp-tablecard__head">
          <div className="mp-tablecard__titlerow">
            <div className="mp-tablecard__heading">
              <h2 className="mp-tablecard__title">{t("admin.audit.activity")}</h2>
              <span className="mp-tablecard__count">{fmtNum(lang, filtered.length)}</span>
            </div>
          </div>

          <div className="mp-tabrow">
            <div className="mp-tabs" role="tablist" aria-label={t("admin.audit.filterAria")}>
              <button type="button" role="tab" aria-selected={category === ""} className={"mp-tab" + (category === "" ? " is-active" : "")} onClick={() => setCategory("")}>
                {t("admin.audit.tabAll")}
              </button>
              {CATEGORIES.map((c) => (
                <button key={c} type="button" role="tab" aria-selected={category === c} className={"mp-tab" + (category === c ? " is-active" : "")} onClick={() => setCategory(c)}>
                  {t(CAT_META[c].labelKey)}
                </button>
              ))}
            </div>
            <div className="mp-tabrow__right">
              <div className="mp-tabsearch">
                <span className="mp-tabsearch__lead">
                  <Icon name="search" size={16} />
                </span>
                <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.audit.searchPh")} aria-label={t("admin.audit.searchAria")} />
              </div>
            </div>
          </div>
        </header>

        {groups.length > 0 ? (
          <div className="au-feed">
            {groups.map((g) => (
              <div className="au-group" key={g.key}>
                <div className="au-group__label">{dayLabel(g.key, now, lang, t)}</div>
                <ul className="au-list">
                  {g.events.map((e) => {
                    const note = metaText(e, t);
                    return (
                      <li className="au-row" key={e.id}>
                        <span className={"au-cat au-cat--" + e.category} aria-hidden="true">
                          <Icon name={CAT_META[e.category].icon} size={16} strokeWidth={2.1} />
                        </span>
                        <div className="au-row__body">
                          <div className="au-row__top">
                            <p className="au-row__action">
                              <span className="au-row__verb">{actionText(e, t)}</span>
                              <span className="au-row__target"> · {e.target}</span>
                            </p>
                            <span className="au-row__time" title={`${absDay(isoDayKey(e.at), lang)} · ${absTime(e.at, lang, t)}`}>
                              {now != null ? relTime(e.at, now, lang, t) : absTime(e.at, lang, t)}
                            </span>
                          </div>
                          <div className="au-row__meta">
                            <span className="au-actor">
                              <Avatar name={e.actor.name} size="xs" />
                              <span className="au-actor__name">{e.actor.name}</span>
                              <span className="au-actor__role">{e.actor.role}</span>
                            </span>
                            {note && <span className="au-row__note">{note}</span>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="mp-noresults">
            <span className="mp-noresults__art">
              <Icon name="search-x" size={26} strokeWidth={1.6} />
            </span>
            <h3>{t("admin.audit.empty.title")}</h3>
            <p>{t("admin.audit.empty.sub")}</p>
          </div>
        )}
      </section>
    </>
  );
}
