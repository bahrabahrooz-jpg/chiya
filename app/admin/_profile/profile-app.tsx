"use client";

import { useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/lib/i18n";
import { useAdminProfile, type AdminProfile } from "@/lib/admin-profile";

function Row({ label, value, full }: { label: string; value: ReactNode; full?: boolean }) {
  return (
    <div className={"pf-row" + (full ? " pf-row--full" : "")}>
      <span className="pf-row__label">{label}</span>
      <span className="pf-row__value">{value}</span>
    </div>
  );
}

export function ProfileApp() {
  const { t } = useLang();
  const { profile, update } = useAdminProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<AdminProfile>(profile);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
  const set = (k: keyof AdminProfile) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <>
      <div className="pf-head">
        <div className="pf-head__intro">
          <h1 className="pf-head__title">{t("admin.profile.title")}</h1>
          <p className="pf-head__sub">{t("admin.profile.sub")}</p>
        </div>
        <div className="pf-head__action">
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
          <Avatar name={(editing ? form : profile).name} src={(editing ? form.avatar : profile.avatar) || undefined} size="xl" verified />
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
              <Badge variant="brand" size="md" icon="shield-check">
                {t("role.superAdmin")}
              </Badge>
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
            <Input label={t("admin.profile.location")} iconLeading="map-pin" value={form.location} onChange={set("location")} />
          </div>
        ) : (
          <div className="pf-grid">
            <Row label={t("admin.profile.fullName")} value={profile.name} />
            <Row label={t("admin.profile.email")} value={profile.email} />
            <Row label={t("admin.profile.phone")} value={profile.phone} />
            <Row label={t("admin.profile.location")} value={profile.location} />
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
          <Row label={t("admin.profile.role")} value={<Badge variant="brand" size="sm" icon="shield-check">{t("role.superAdmin")}</Badge>} />
          <Row label={t("admin.profile.accountId")} value="ADM-001" />
          <Row label={t("admin.profile.memberSince")} value={t("admin.profile.memberSinceVal")} />
          <Row label={t("admin.profile.status")} value={<Badge variant="success" size="sm" dot>{t("status.active")}</Badge>} />
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
