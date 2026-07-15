"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useLang, type Lang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { AdminSelect, AdminDatePicker } from "../_shared/filter-controls";
import { useAuditLog, resolveAuditParams, verbOf, descKeyOf, AUDIT_TODAY, type AuditCategory, type AuditEvent, type AuditVerb } from "../_shared/audit-log";

/* ---------------- category (= "module" column) presentation ---------------- */
const CAT_META: Record<AuditCategory, { icon: IconName; labelKey: string }> = {
  review: { icon: "star", labelKey: "admin.nav.reviews" },
  property: { icon: "building-2", labelKey: "admin.nav.properties" },
  member: { icon: "users", labelKey: "admin.nav.members" },
  agent: { icon: "badge-check", labelKey: "admin.nav.agents" },
  location: { icon: "map-pin", labelKey: "admin.nav.locations" },
  role: { icon: "key-round", labelKey: "admin.nav.roles" },
};
const CATEGORIES = Object.keys(CAT_META) as AuditCategory[];

/* Badge tone per verb: additive reads blue, destructive red, the two moderation
   outcomes borrow the review statuses' own green/grey. Declaration order is also
   the order of the Action filter's options. */
const VERB_VARIANT: Record<AuditVerb, BadgeVariant> = {
  create: "info",
  update: "warning",
  delete: "error",
  approve: "success",
  reject: "neutral",
};
const VERBS = Object.keys(VERB_VARIANT) as AuditVerb[];

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** The event's short verb phrase, with any "@key" params resolved for this language. */
function actionText(e: AuditEvent, t: TFn): string {
  return t(e.actionKey, resolveAuditParams(e.actionParams, t));
}
/** The sentence describing what the action changed, for the Details column. */
function descText(e: AuditEvent, t: TFn): string {
  const key = descKeyOf(e.actionKey);
  const s = t(key, resolveAuditParams(e.actionParams, t));
  // translate() echoes an unknown key back — fall back to the short verb phrase
  // so an action added without a description still reads as words.
  return s === key ? actionText(e, t) : s;
}
/** The optional trailing note: a translated `metaKey`, else the raw data `meta`. */
function metaText(e: AuditEvent, t: TFn): string | undefined {
  if (e.metaKey) return t(e.metaKey, resolveAuditParams(e.metaParams, t));
  return e.meta;
}

/* ---------------- timestamp helpers ----------------
   Both labels are derived straight from the ISO string rather than from the wall
   clock, so the server render and hydration always agree — an audit row states
   when it happened, which never depends on when you are reading it. */

/** The event's calendar day as YYYY-MM-DD — the single key the Time column and
    the date filter both read, so a row always filters onto the date it shows. */
function eventDayKey(at: string) {
  return at.slice(0, 10);
}
/** The same key for a date picked off the calendar (which is a local Date). */
function pickedDayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
/** The event's calendar date, formatted for `lang`. */
function dateLabel(at: string, lang: Lang) {
  const [y, mo, da] = eventDayKey(at).split("-").map(Number);
  return fmtDate(lang, new Date(y, mo - 1, da));
}
/** The event's time of day, formatted for `lang`. */
function timeLabel(at: string, lang: Lang, t: TFn) {
  const [hStr, mStr] = (at.split("T")[1] ?? "").split(":");
  let h = Number(hStr);
  const meridiem = h >= 12 ? t("admin.audit.pm") : t("admin.audit.am");
  h = h % 12 || 12;
  return `${localizeDigits(lang, String(h))}:${localizeDigits(lang, mStr)} ${meridiem}`;
}

export function AuditApp() {
  const { t, lang } = useLang();
  const events = useAuditLog();
  const [category, setCategory] = useState<AuditCategory | "">("");
  const [verb, setVerb] = useState<AuditVerb | "">("");
  const [date, setDate] = useState<Date | null>(null);
  const [q, setQ] = useState("");

  const hasFilters = !!(category || verb || date || q);
  const clearAll = () => {
    setCategory("");
    setVerb("");
    setDate(null);
    setQ("");
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const dayKey = date ? pickedDayKey(date) : "";
    return events.filter((e) => {
      if (category && e.category !== category) return false;
      if (verb && verbOf(e.actionKey) !== verb) return false;
      if (dayKey && eventDayKey(e.at) !== dayKey) return false;
      if (needle) {
        // Match against the rendered text — every column, in the active language.
        const hay = [t("audit.verb." + verbOf(e.actionKey)), descText(e, t), e.target, e.actor.name, t("role." + e.actor.role), t(CAT_META[e.category].labelKey), metaText(e, t) ?? ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [events, category, verb, date, q, t]);

  return (
    <>
      <header className="mp-head">
        <div className="mp-head__intro">
          <h1 className="mp-head__title">{t("admin.audit.title")}</h1>
          <p className="mp-head__sub">{t("admin.audit.sub")}</p>
        </div>
      </header>

      <section className="mp-tablecard">
        <header className="mp-tablecard__head">
          <div className="mp-tablecard__titlerow">
            <div className="mp-tablecard__heading">
              <h2 className="mp-tablecard__title">{t("admin.audit.activity")}</h2>
              <span className="mp-tablecard__count">{fmtNum(lang, filtered.length)}</span>
            </div>
          </div>

          <div className="mp-tabrow">
            <div className="au-filters">
              <AdminSelect
                value={category}
                onChange={(v) => setCategory(v as AuditCategory | "")}
                options={CATEGORIES.map((c) => ({ value: c, label: t(CAT_META[c].labelKey) }))}
                placeholder={t("admin.audit.allModules")}
                ariaLabel={t("admin.audit.allModules")}
              />
              <AdminSelect
                value={verb}
                onChange={(v) => setVerb(v as AuditVerb | "")}
                options={VERBS.map((v) => ({ value: v, label: t("audit.verb." + v) }))}
                placeholder={t("admin.audit.allActions")}
                ariaLabel={t("admin.audit.allActions")}
              />
              <AdminDatePicker
                value={date}
                onChange={setDate}
                placeholder={t("admin.audit.anyDate")}
                today={AUDIT_TODAY}
                ariaLabel={t("admin.audit.anyDate")}
              />
              {hasFilters && (
                <button type="button" className="mp-clearbtn" onClick={clearAll}>
                  <Icon name="x" size={14} />
                  {t("admin.props.clearAll")}
                </button>
              )}
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

        {filtered.length > 0 ? (
          <div className="mp-table mp-table--audit">
            <div className="mp-thead">
              <span className="mp-th">{t("admin.audit.col.user")}</span>
              <span className="mp-th">{t("admin.audit.col.action")}</span>
              <span className="mp-th">{t("admin.audit.col.module")}</span>
              <span className="mp-th">{t("admin.audit.col.details")}</span>
              <span className="mp-th">{t("admin.audit.col.time")}</span>
            </div>

            {filtered.map((e) => {
              const verb = verbOf(e.actionKey);
              const note = metaText(e, t);
              return (
                <div className="mp-row au-row" key={e.id}>
                  <div className="au-col au-col--user">
                    <Avatar name={e.actor.name} size="sm" />
                    <span className="au-user__body">
                      <span className="au-user__name">{e.actor.name}</span>
                      <span className="au-user__role">{t("role." + e.actor.role)}</span>
                    </span>
                  </div>

                  <div className="au-col au-col--action">
                    <Badge variant={VERB_VARIANT[verb]} size="sm" className="au-verb">
                      {t("audit.verb." + verb)}
                    </Badge>
                  </div>

                  <div className="au-col au-col--module">
                    <span className={"au-cat au-cat--" + e.category} aria-hidden="true">
                      <Icon name={CAT_META[e.category].icon} size={14} strokeWidth={2.1} />
                    </span>
                    <span className="au-module__label">{t(CAT_META[e.category].labelKey)}</span>
                  </div>

                  <div className="au-col au-col--details">
                    <span className="au-details__target">{e.target}</span>
                    <p className="au-details__desc">
                      {descText(e, t)}
                      {note && <span className="au-details__note"> · {note}</span>}
                    </p>
                  </div>

                  <div className="au-col au-col--time">
                    <span className="au-time__date">{dateLabel(e.at, lang)}</span>
                    <span className="au-time__clock">{timeLabel(e.at, lang, t)}</span>
                  </div>
                </div>
              );
            })}
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
