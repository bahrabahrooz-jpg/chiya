"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLang } from "@/lib/i18n";
import { fmtNum, valueKey } from "@/lib/fmt";
import { LOCATION_DEF } from "@/app/admin/_data/catalog";
import { useAgentProfile, type AgentProfile } from "@/lib/agent-profile";
import { useAgentData } from "../_shared/agent-data";
import "../_shared/agent.css";
import "@/app/admin/profile/profile.css";

function Row({ label, value }: { label: string; value: ReactNode }) {
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
  const { profile, update } = useAgentProfile();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AgentProfile>(profile);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Cities are a fixed catalog list, not free text — the display name is looked
  // up by the canonical English value (`city.<City>`), so keep storing that.
  const cityOptions = LOCATION_DEF.map((c) => ({ value: c.city, label: tOr(`city.${c.city}`, c.city) }));

  // Downscale any picked image to a 256×256 square JPEG data URL — small enough
  // to persist in localStorage, and center-cropped so portraits look right.
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const SIZE = 256;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, SIZE, SIZE);
      setForm((f) => ({ ...f, avatar: canvas.toDataURL("image/jpeg", 0.85) }));
    };
    img.src = url;
  };
  const removePhoto = () => setForm((f) => ({ ...f, avatar: "" }));

  const startEdit = () => {
    setForm(profile);
    setEditing(true);
  };
  const cancel = () => {
    setForm(profile);
    setEditing(false);
  };
  const save = () => {
    update(form);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };
  const set = (k: keyof AgentProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const verified = me.verification === "Verified";

  return (
    <>
      <div className="agx-head">
        <div className="agx-head__intro">
          <h1 className="agx-title">{t("agent.profile.title")}</h1>
          <p className="agx-sub">{t("agent.profile.sub")}</p>
        </div>
        <div className="agx-head__action">
          {editing ? (
            <>
              <Button hierarchy="secondary" size="lg" onClick={cancel}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button hierarchy="primary" size="lg" iconLeading="check" onClick={save} disabled={!form.name.trim() || !form.email.trim()}>
                {t("admin.profile.save")}
              </Button>
            </>
          ) : (
            <Button hierarchy="primary" size="lg" iconLeading="pencil" onClick={startEdit}>
              {t("admin.profile.edit")}
            </Button>
          )}
        </div>
      </div>

      {/* identity hero */}
      <section className="pf-hero">
        <div className="pf-hero__avatar">
          <Avatar name={(editing ? form : profile).name} src={(editing ? form.avatar : profile.avatar) || undefined} size="xl" verified={verified} />
          {editing && (
            <button type="button" className="pf-avatar__cam" onClick={() => fileRef.current?.click()} aria-label={t("admin.profile.changePhoto")}>
              <Icon name="camera" size={16} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="pf-avatar__file" onChange={onPickFile} aria-hidden="true" tabIndex={-1} />
        </div>
        <div className="pf-hero__meta">
          <h2 className="pf-hero__name">{profile.name}</h2>
          {editing ? (
            <div className="pf-hero__photo">
              <Button hierarchy="secondary" size="sm" iconLeading="upload" onClick={() => fileRef.current?.click()}>
                {form.avatar ? t("admin.profile.changePhoto") : t("admin.profile.uploadPhoto")}
              </Button>
              {form.avatar && (
                <Button hierarchy="secondary" size="sm" iconLeading="trash-2" onClick={removePhoto}>
                  {t("admin.profile.remove")}
                </Button>
              )}
              <span className="pf-hero__hint">{t("admin.profile.photoHint")}</span>
            </div>
          ) : (
            <div className="pf-hero__tags">
              <Badge variant="brand" size="md" icon="badge-check">
                {t("role.agent")}
              </Badge>
              <span className="pf-hero__dot">·</span>
              <span className="pf-hero__job">{tOr(`city.${profile.city}`, profile.city)}</span>
            </div>
          )}
        </div>
      </section>

      {/* personal information */}
      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">{t("admin.profile.personalInfo")}</h3>
            <p className="pf-card__desc">{t("admin.profile.personalDesc")}</p>
          </div>
        </div>
        {editing ? (
          <div className="pf-grid">
            <Input label={t("admin.profile.fullName")} value={form.name} onChange={set("name")} />
            <Input label={t("admin.profile.email")} type="email" iconLeading="mail" value={form.email} onChange={set("email")} />
            <Input label={t("admin.profile.phone")} iconLeading="phone" value={form.phone} onChange={set("phone")} />
            <Select label={t("admin.pd.f.city")} value={form.city} onChange={set("city")} options={cityOptions} />
          </div>
        ) : (
          <div className="pf-grid">
            <Row label={t("admin.profile.fullName")} value={profile.name} />
            <Row label={t("admin.profile.email")} value={profile.email} />
            <Row label={t("admin.profile.phone")} value={profile.phone} />
            <Row label={t("admin.pd.f.city")} value={tOr(`city.${profile.city}`, profile.city)} />
          </div>
        )}
      </section>

      {/* account */}
      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">{t("admin.profile.account")}</h3>
            <p className="pf-card__desc">{t("admin.profile.accountDesc")}</p>
          </div>
        </div>
        <div className="pf-grid">
          <Row label={t("admin.profile.role")} value={<Badge variant="brand" size="sm" icon="badge-check">{t("role.agent")}</Badge>} />
          <Row label={t("admin.profile.accountId")} value={me.id} />
          <Row
            label={t("agent.profile.verification")}
            value={<Badge variant={verified ? "success" : "warning"} size="sm" dot>{t(valueKey("status", me.verification))}</Badge>}
          />
          <Row
            label={t("admin.profile.status")}
            value={<Badge variant={me.status === "Active" ? "success" : "warning"} size="sm" dot>{t(valueKey("status", me.status))}</Badge>}
          />
        </div>
      </section>

      {/* performance */}
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

      {saved && (
        <div className="pf-toast" role="status">
          <Icon name="circle-check" size={18} />
          {t("admin.profile.updated")}
        </div>
      )}
    </>
  );
}
