"use client";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n";
import { fmtNum, valueKey } from "@/lib/fmt";
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
  const { t, lang } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const { me } = useAgentData();

  return (
    <>
      <div className="agx-head">
        <div className="agx-head__intro">
          <h1 className="agx-title">{t("agent.profile.title")}</h1>
          <p className="agx-sub">{t("agent.profile.sub")}</p>
        </div>
      </div>

      <section className="pf-hero">
        <Avatar name={me.name} src={me.img || undefined} size="xl" verified={me.verification === "Verified"} />
        <div className="pf-hero__meta">
          <h2 className="pf-hero__name">{me.name}</h2>
          <div className="pf-hero__tags">
            <Badge variant="brand" size="md" icon="badge-check">{t("role.agent")}</Badge>
            <span className="pf-hero__dot">·</span>
            <span className="pf-hero__job">{tOr(`city.${me.city}`, me.city)}</span>
          </div>
        </div>
      </section>

      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">{t("agent.profile.details")}</h3>
            <p className="pf-card__desc">{t("agent.profile.detailsDesc")}</p>
          </div>
        </div>
        <div className="pf-grid">
          <Row label={t("admin.mp.emailAddress")} value={me.email} />
          <Row label={t("admin.members.th.phone")} value={me.phone} />
          <Row label={t("admin.pd.f.city")} value={tOr(`city.${me.city}`, me.city)} />
          <Row label={t("agent.profile.verification")} value={<Badge variant={me.verification === "Verified" ? "success" : "warning"} size="sm" dot>{t(valueKey("status", me.verification))}</Badge>} />
          <Row label={t("admin.props.th.status")} value={<Badge variant={me.status === "Active" ? "success" : "warning"} size="sm" dot>{t(valueKey("status", me.status))}</Badge>} />
        </div>
      </section>

      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">{t("agent.profile.performance")}</h3>
            <p className="pf-card__desc">{t("agent.profile.performanceDesc")}</p>
          </div>
        </div>
        <div className="pf-grid">
          <Row label={t("admin.ad.kpi.active")} value={fmtNum(lang, me.listings)} />
          <Row label={t("status.sold")} value={fmtNum(lang, me.sold)} />
          <Row label={t("status.rented")} value={fmtNum(lang, me.rented)} />
          <Row label={t("agent.profile.membersServed")} value={fmtNum(lang, me.members)} />
        </div>
      </section>
    </>
  );
}
