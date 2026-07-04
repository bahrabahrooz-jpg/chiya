"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAgentData } from "../_shared/agent-data";
import "../_shared/agent.css";
import "@/app/admin/profile/profile.css";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="pf-row">
      <span className="pf-row__label">{label}</span>
      <span className="pf-row__value">{value}</span>
    </div>
  );
}

export default function AgentProfilePage() {
  const { me } = useAgentData();

  return (
    <>
      <div className="agx-head">
        <div className="agx-head__intro">
          <h1 className="agx-title">My profile</h1>
          <p className="agx-sub">Your agent details and performance on the platform.</p>
        </div>
      </div>

      <section className="pf-hero">
        <Avatar name={me.name} src={me.img || undefined} size="xl" verified={me.verification === "Verified"} />
        <div className="pf-hero__meta">
          <h2 className="pf-hero__name">{me.name}</h2>
          <div className="pf-hero__tags">
            <Badge variant="brand" size="md" icon="badge-check">Agent</Badge>
            <span className="pf-hero__dot">·</span>
            <span className="pf-hero__job">{me.agency}</span>
          </div>
        </div>
      </section>

      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">Details</h3>
            <p className="pf-card__desc">Your contact information and coverage.</p>
          </div>
        </div>
        <div className="pf-grid">
          <Row label="Email address" value={me.email} />
          <Row label="Phone" value={me.phone} />
          <Row label="City" value={me.city} />
          <Row label="Agency" value={me.agency} />
          <Row label="Verification" value={<Badge variant={me.verification === "Verified" ? "success" : "warning"} size="sm" dot>{me.verification}</Badge>} />
          <Row label="Status" value={<Badge variant={me.status === "Active" ? "success" : "warning"} size="sm" dot>{me.status}</Badge>} />
        </div>
      </section>

      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">Performance</h3>
            <p className="pf-card__desc">Your live activity across the platform.</p>
          </div>
        </div>
        <div className="pf-grid">
          <Row label="Active listings" value={me.listings} />
          <Row label="Sold" value={me.sold} />
          <Row label="Rented" value={me.rented} />
          <Row label="Members served" value={me.members} />
        </div>
      </section>
    </>
  );
}
