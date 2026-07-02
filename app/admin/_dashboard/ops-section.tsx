"use client";

import { Fragment } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { ACTION_ITEMS, ACTIVITY_ITEMS, type ActionItem } from "./data";
import { useProperties } from "../_shared/properties-store";

const ACTION_HREF: Record<string, string> = {
  properties: "/admin/properties?status=pending",
  agents: "/admin/agents?verification=Pending",
};

function ActionCard({ item, count }: { item: ActionItem; count: number }) {
  return (
    <div className="ax-action">
      <div className="ax-action__head">
        <span className={"ax-chip ax-chip--" + item.tone}>
          <Icon name={item.icon} size={21} />
        </span>
        <h3 className="ax-action__title">{item.title}</h3>
      </div>
      <div className="ax-action__count">
        <span className="ax-action__num">{count.toLocaleString("en-US")}</span>
        <span className="ax-action__unit">{item.unit}</span>
      </div>
      <p className="ax-action__desc">{item.desc}</p>
      <div className="ax-action__foot">
        <Button href={ACTION_HREF[item.key]} hierarchy="primary" size="md" iconTrailing="arrow-right">
          {item.cta}
        </Button>
      </div>
    </div>
  );
}

export function OpsSection() {
  const { counts, agentCounts } = useProperties();
  const actionCounts: Record<string, number> = {
    properties: counts.pending,
    agents: agentCounts.pending,
  };
  return (
    <section className="ax-section ax-grid2" aria-label="Pending approvals and recent activity">
      <div className="ax-col">
        <div className="ax-section__head">
          <div className="ax-section__heading">
            <h2 className="ax-section__title">Pending approvals</h2>
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
            <h2 className="ax-section__title">Recent activity</h2>
          </div>
          <Link className="ax-viewall" href="/admin/properties">
            View all <Icon name="arrow-right" size={15} />
          </Link>
        </div>
        <div className="ax-feed">
          {ACTIVITY_ITEMS.map((a) => (
            <div className="ax-feed__item" key={a.id}>
              <span className={"ax-chip ax-chip--sm ax-chip--" + a.tone}>
                <Icon name={a.icon} size={17} />
              </span>
              <div className="ax-feed__body">
                <p className="ax-feed__text">
                  {a.parts.map((p, i) => (p.b ? <b key={i}>{p.b}</b> : <Fragment key={i}>{p.t}</Fragment>))}
                </p>
                <span className="ax-feed__time">{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
