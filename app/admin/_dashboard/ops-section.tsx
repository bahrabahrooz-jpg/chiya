"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { fmtNum } from "@/lib/fmt";
import { ACTION_ITEMS, ACTIVITY_ITEMS, type ActionItem } from "./data";
import { useProperties } from "../_shared/properties-store";

const ACTION_HREF: Record<string, string> = {
  properties: "/admin/properties?status=pending",
  agents: "/admin/agents?verification=Pending",
};

function ActionCard({ item, count }: { item: ActionItem; count: number }) {
  const { t, lang } = useLang();
  return (
    <div className="ax-action">
      <div className="ax-action__head">
        <span className={"ax-chip ax-chip--" + item.tone}>
          <Icon name={item.icon} size={21} />
        </span>
        <h3 className="ax-action__title">{t(`admin.dash.action.${item.key}.title`)}</h3>
      </div>
      <div className="ax-action__count">
        <span className="ax-action__num">{fmtNum(lang, count)}</span>
        <span className="ax-action__unit">{t(`admin.dash.action.${item.key}.unit`)}</span>
      </div>
      <p className="ax-action__desc">{t(`admin.dash.action.${item.key}.desc`)}</p>
      <div className="ax-action__foot">
        <Button href={ACTION_HREF[item.key]} hierarchy="primary" size="md" iconTrailing="arrow-right">
          {t(`admin.dash.action.${item.key}.cta`)}
        </Button>
      </div>
    </div>
  );
}

export function OpsSection() {
  const { t, lang } = useLang();
  const { counts, agentCounts } = useProperties();
  const actionCounts: Record<string, number> = {
    properties: counts.pending,
    agents: agentCounts.pending,
  };
  return (
    <section className="ax-section ax-grid2" aria-label={t("admin.dash.opsAria")}>
      <div className="ax-col">
        <div className="ax-section__head">
          <div className="ax-section__heading">
            <h2 className="ax-section__title">{t("admin.dash.pendingApprovals")}</h2>
          </div>
        </div>
        <div className="ax-actions">
          {ACTION_ITEMS.map((it) => (
            <ActionCard key={it.key} item={it} count={actionCounts[it.key] ?? 0} />
          ))}
        </div>
      </div>

      <div className="ax-col">
        <div className="ax-section__head">
          <div className="ax-section__heading">
            <h2 className="ax-section__title">{t("admin.dash.recentActivity")}</h2>
          </div>
          <Link className="ax-viewall" href="/admin/properties">
            {t("admin.common.viewAll")} <Icon name="arrow-right" size={15} />
          </Link>
        </div>
        <div className="ax-feed">
          {ACTIVITY_ITEMS.map((a) => {
            const params = a.params
              ? Object.fromEntries(Object.entries(a.params).map(([k, v]) => [k, typeof v === "number" ? fmtNum(lang, v) : v]))
              : undefined;
            const time = a.timeParams ? t(a.timeKey, { count: fmtNum(lang, a.timeParams.count) }) : t(a.timeKey);
            return (
              <div className="ax-feed__item" key={a.id}>
                <span className={"ax-chip ax-chip--sm ax-chip--" + a.tone}>
                  <Icon name={a.icon} size={17} />
                </span>
                <div className="ax-feed__body">
                  <p className="ax-feed__text">{t(`admin.dash.activity.${a.id}`, params)}</p>
                  <span className="ax-feed__time">{time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
