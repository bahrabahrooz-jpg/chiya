/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PROP_STATUS, RECENT_AGENTS, RECENT_PROPERTIES, type RecentAgent, type RecentProperty } from "./data";

function PropertyRow({ item }: { item: RecentProperty }) {
  const st = PROP_STATUS[item.status] || { variant: "neutral" as const, dot: false };
  return (
    <Link className="ax-row ax-row--link" href={`/admin/properties/${item.id}`}>
      <img className="ax-row__thumb" src={item.img} alt="" loading="lazy" />
      <div className="ax-row__main">
        <div className="ax-row__title">{item.title}</div>
        <div className="ax-row__meta">
          <span className="ax-row__loc">
            <Icon name="map-pin" size={13} />
            {item.location}
          </span>
          <span className="ax-row__sep" />
          <span className="ax-row__agent">
            <Avatar name={item.agent} size="xs" />
            <b>{item.agent}</b>
          </span>
        </div>
      </div>
      <div className="ax-row__end">
        <Badge variant={st.variant} size="sm" dot={st.dot}>
          {item.status}
        </Badge>
      </div>
    </Link>
  );
}

function AgentRow({ item }: { item: RecentAgent }) {
  return (
    <Link className="ax-row ax-row--link" href={`/admin/agents/${item.id}`}>
      <span className="ax-row__avatar">
        <Avatar src={item.img} name={item.name} size="lg" verified={item.verified} />
      </span>
      <div className="ax-row__main">
        <div className="ax-row__title">{item.name}</div>
        <div className="ax-row__meta">
          <span className="ax-row__loc">{item.team}</span>
          <span className="ax-row__sep" />
          <span className="ax-row__joined">Joined {item.joined}</span>
        </div>
      </div>
      <div className="ax-row__end">
        {item.verified ? (
          <Badge variant="brand" size="sm" icon="badge-check">
            Verified
          </Badge>
        ) : (
          <Badge variant="warning" size="sm" dot>
            Pending
          </Badge>
        )}
      </div>
    </Link>
  );
}

export function RecentSection() {
  return (
    <section className="ax-section ax-grid2 ax-grid2--stretch" aria-label="Recent properties and recent agents">
      <div className="ax-col">
        <div className="ax-section__head">
          <div className="ax-section__heading">
            <h2 className="ax-section__title">Recent properties</h2>
          </div>
          <Link className="ax-viewall" href="/admin/properties">
            View all <Icon name="arrow-right" size={15} />
          </Link>
        </div>
        <div className="ax-listcard">
          {RECENT_PROPERTIES.filter((p) => p.status === "Published").slice(0, 3).map((p) => (
            <PropertyRow key={p.id} item={p} />
          ))}
        </div>
      </div>
      <div className="ax-col">
        <div className="ax-section__head">
          <div className="ax-section__heading">
            <h2 className="ax-section__title">Recent agents</h2>
          </div>
          <Link className="ax-viewall" href="/admin/agents">
            View all <Icon name="arrow-right" size={15} />
          </Link>
        </div>
        <div className="ax-listcard">
          {RECENT_AGENTS.filter((a) => a.verified).map((a) => (
            <AgentRow key={a.id} item={a} />
          ))}
        </div>
      </div>
    </section>
  );
}
