"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import "./banner-upload.css";

/**
 * Wide banner-image picker — the counterpart to <AvatarUpload> (agent-edit-modal)
 * for the full-bleed photographs behind a page hero, where the crop is a wide
 * rectangle rather than a disc.
 *
 * Two things it does that a thumbnail field cannot, both deliberate:
 *
 *  - The preview is rendered at the real aspect ratio and full card width. This
 *    is the largest image on the site; judging it from a stamp is guesswork.
 *  - `children` draw over the photo. Callers pass the very headline the public
 *    page lays on top, so an admin sees dark-text-on-dark-photo while they are
 *    still choosing — not after a visitor reports it.
 *
 * There is no upload endpoint, so the file is read to a data: URL and handed
 * back through onChange; persistence is the caller's store's problem. Because
 * that blob ends up in localStorage, MAX_MB is enforced here and reported
 * inline (silently dropping an oversized file reads as a broken button).
 *
 * No remove: a hero without a photo is a broken page. `defaultValue` instead
 * surfaces a "reset to default" once the image differs from the shipped one.
 */

const MAX_MB = 5;

export function BannerUpload({
  label,
  value,
  onChange,
  hint,
  defaultValue,
  ratio = "21 / 9",
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  /** Shipped image; when `value` differs, a reset control appears. */
  defaultValue?: string;
  /** Aspect ratio of the preview — match the real band (CSS `aspect-ratio`). */
  ratio?: string;
  /** Overlay drawn on the photo, e.g. the hero headline. Decorative. */
  children?: React.ReactNode;
}) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(t("admin.banner.tooLarge", { mb: String(MAX_MB) }));
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.onerror = () => setError(t("admin.banner.readFailed"));
    reader.readAsDataURL(file);
  };

  const canReset = defaultValue !== undefined && value !== defaultValue;

  return (
    <div className="bn-field">
      <span className="bn-field__label">{label}</span>

      <button type="button" className="bn-frame" style={{ aspectRatio: ratio }} onClick={() => inputRef.current?.click()}>
        {/* Plain <img>: the source is a data: URL as often as a static path, and
            the frame is a fixed-ratio box, so next/image buys nothing here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="bn-frame__img" src={value} alt="" />
        <span className="bn-frame__scrim" />
        {children ? (
          <span className="bn-frame__overlay" aria-hidden="true">
            {children}
          </span>
        ) : null}
        <span className="bn-frame__btn">
          <Icon name="image-plus" size={16} strokeWidth={2} />
          {t("admin.banner.change")}
        </span>
      </button>

      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onPick} />

      {error ? (
        <p className="bn-field__error" role="alert">
          <Icon name="circle-alert" size={14} />
          {error}
        </p>
      ) : null}

      <div className="bn-field__foot">
        {hint ? <span className="bn-field__hint">{hint}</span> : <span />}
        {canReset ? (
          <button
            type="button"
            className="bn-field__reset"
            onClick={() => {
              setError(null);
              onChange(defaultValue);
            }}
          >
            <Icon name="rotate-ccw" size={13} strokeWidth={2} />
            {t("admin.banner.reset")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
