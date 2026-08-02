"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

/**
 * Admin change-password screen. Reached from the topbar profile dropdown; lives
 * inside the admin shell like the profile page and reuses its `pf-*` card chrome.
 * The field pattern (lock icon + eye toggle), live strength meter, and
 * requirements checklist mirror the admin reset flow. There is no backend: a real
 * API would verify the current password and persist the new one — here we
 * validate client-side, toast, and return to the profile.
 */

// Live requirements for the new password — same set as the admin reset flow.
const CHECKS: { key: string; test: (v: string) => boolean }[] = [
  { key: "admin.auth.check.len8", test: (v) => v.length >= 8 },
  { key: "admin.auth.check.upper", test: (v) => /[A-Z]/.test(v) },
  { key: "admin.auth.check.lower", test: (v) => /[a-z]/.test(v) },
  { key: "admin.auth.check.number", test: (v) => /\d/.test(v) },
  { key: "admin.auth.check.special", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/** Masked password field: leading lock icon, trailing eye toggle to reveal. */
function PwField({
  label,
  autoComplete,
  value,
  onChange,
  error,
}: {
  label: string;
  autoComplete: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <label className="apw-field">
      <span className="apw-label">{label}</span>
      <span className={"apw-wrap" + (error ? " is-bad" : "")}>
        <Icon name="lock" size={18} className="apw-ic" />
        <input
          type={show ? "text" : "password"}
          className="apw-input"
          placeholder={t("admin.chpw.placeholder")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="apw-peek"
          aria-label={show ? t("admin.auth.hidePw") : t("admin.auth.showPw")}
          onClick={() => setShow((s) => !s)}
        >
          <Icon name={show ? "eye-off" : "eye"} size={17} />
        </button>
      </span>
      {error ? <span className="apw-err">{error}</span> : null}
    </label>
  );
}

export function ChangePasswordApp() {
  const { t } = useLang();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; pw?: string; confirm?: string }>({});

  const results = CHECKS.map((c) => ({ key: c.key, met: c.test(pw) }));
  const passed = results.filter((r) => r.met).length;
  const level = pw.length === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const allMet = passed === CHECKS.length;
  const canSubmit = current.length > 0 && allMet && confirm === pw && pw !== current;

  const submit = () => {
    const next: typeof errors = {};
    if (current.length === 0) next.current = t("admin.chpw.errCurrent");
    if (pw.length > 0 && pw === current) next.pw = t("admin.chpw.errSame");
    if (confirm !== pw) next.confirm = t("admin.auth.pwNoMatch");
    setErrors(next);
    if (Object.keys(next).length > 0 || !allMet) return;

    setSaved(true);
    setTimeout(() => router.push("/admin/profile"), 900);
  };

  return (
    <>
      <div className="pf-head">
        <div className="pf-head__intro">
          <h1 className="pf-head__title">{t("admin.chpw.title")}</h1>
          <p className="pf-head__sub">{t("admin.chpw.sub")}</p>
        </div>
        <div className="pf-head__action">
          <Button hierarchy="secondary" size="lg" onClick={() => router.push("/admin/profile")}>
            {t("admin.topbar.cancel")}
          </Button>
          <Button hierarchy="primary" size="lg" iconLeading="check" onClick={submit} disabled={!canSubmit}>
            {t("admin.auth.updatePw")}
          </Button>
        </div>
      </div>

      <section className="pf-card">
        <div className="pf-card__head">
          <div>
            <h3 className="pf-card__title">{t("admin.chpw.cardTitle")}</h3>
            <p className="pf-card__desc">{t("admin.chpw.cardDesc")}</p>
          </div>
        </div>

        <div className="apw-stack">
          <PwField
            label={t("admin.chpw.current")}
            autoComplete="current-password"
            value={current}
            onChange={(v) => {
              setCurrent(v);
              if (errors.current || errors.pw) setErrors((x) => ({ ...x, current: undefined, pw: undefined }));
            }}
            error={errors.current}
          />

          <div>
            <PwField
              label={t("admin.auth.newPw")}
              autoComplete="new-password"
              value={pw}
              onChange={(v) => {
                setPw(v);
                if (errors.pw || errors.confirm) setErrors((x) => ({ ...x, pw: undefined, confirm: undefined }));
              }}
              error={errors.pw}
            />
            <div className="apw-strength" data-level={level}>
              <div className="apw-strength__bar">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={"apw-strength__seg" + (i < level ? " is-on" : "")} />
                ))}
              </div>
              <span className="apw-strength__label">{t(`admin.auth.strength.${level}`)}</span>
            </div>
          </div>

          <div>
            <PwField
              label={t("admin.auth.confirmPw")}
              autoComplete="new-password"
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                if (errors.confirm) setErrors((x) => ({ ...x, confirm: undefined }));
              }}
              error={errors.confirm}
            />
            <div className="apw-reqs-wrap">
              <span className="apw-reqs-title">{t("admin.chpw.reqsTitle")}</span>
              <ul className="apw-reqs">
                {results.map((r) => (
                  <li key={r.key} className={"apw-reqs__item" + (r.met ? " is-met" : "")}>
                    <span className="apw-reqs__icon">
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                    {t(r.key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {saved && (
        <div className="pf-toast" role="status">
          <Icon name="circle-check" size={18} />
          {t("admin.chpw.updated")}
        </div>
      )}
    </>
  );
}
