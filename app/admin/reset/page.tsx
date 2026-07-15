"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { verifyResetToken, consumeResetToken } from "@/lib/admin-reset";
import "../login/login.css";

type Status = "checking" | "valid" | "invalid" | "expired" | "done";

/** Live requirements for a new password, evaluated as the user types. */
const CHECKS: { labelKey: string; test: (v: string) => boolean }[] = [
  { labelKey: "admin.auth.check.len8", test: (v) => v.length >= 8 },
  { labelKey: "admin.auth.check.upper", test: (v) => /[A-Z]/.test(v) },
  { labelKey: "admin.auth.check.lower", test: (v) => /[a-z]/.test(v) },
  { labelKey: "admin.auth.check.number", test: (v) => /\d/.test(v) },
  { labelKey: "admin.auth.check.special", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export default function AdminResetPage() {
  const router = useRouter();
  const { t } = useLang();
  const [status, setStatus] = useState<Status>("checking");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");

  // Read + validate the token client-side (avoids the static-render bailout of
  // useSearchParams, and this page is client-only anyway). This must run in an
  // effect rather than a lazy initializer: `window` is absent during SSR, so
  // reading it at render time would produce a server/client hydration mismatch.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from a browser-only API on mount
    setToken(t);
    const res = verifyResetToken(t);
    if (res.ok) {
      setEmail(res.email);
      setStatus("valid");
    } else {
      setStatus(res.reason === "expired" ? "expired" : "invalid");
    }
  }, []);

  const results = CHECKS.map((c) => ({ labelKey: c.labelKey, met: c.test(pw) }));
  const passed = results.filter((r) => r.met).length;
  const level = pw.length === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const allMet = passed === CHECKS.length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!allMet) {
      setErr("admin.auth.pwNotMet");
      return;
    }
    if (pw !== confirm) {
      setErr("admin.auth.pwNoMatch");
      return;
    }
    // No backend: a real API would hash + persist the new password here, then
    // invalidate the token server-side. We just burn the local token.
    consumeResetToken(token);
    setStatus("done");
  };

  return (
    <div className="al-page">
      <div className="al-shell">
        {/* ---------- left: form ---------- */}
        <div className="al-left">
          <div className="al-head">
            <div className="al-brand">
              <span className="al-brand__mark" aria-hidden="true" />
              <span className="al-brand__name">CHIYA</span>
            </div>
          </div>

          <div className="al-mid">
            <span className="al-divider" aria-hidden="true" />
          </div>

          <div className="al-form-inner">
            {status === "checking" && (
              <div className="al-sent">
                <p className="al-desc">{t("admin.auth.checking")}</p>
              </div>
            )}

            {status === "valid" && (
              <>
                <h1 className="al-title">{t("admin.auth.newPwTitle")}</h1>
                <p className="al-desc">
                  {t("admin.auth.newPwDescPre")} <b>{email}</b>.
                </p>
                <form className="al-form al-form--tight" onSubmit={submit} noValidate>
                  <label className="al-field">
                    <span className="al-label">{t("admin.auth.newPw")}</span>
                    <span className="al-inputwrap">
                      <Icon name="lock" size={18} className="al-input__lead" />
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        className={"al-input al-input--pw" + (err ? " al-input--error" : "")}
                        placeholder="••••••••"
                        value={pw}
                        onChange={(e) => {
                          setPw(e.target.value);
                          setErr("");
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="al-pwtoggle"
                        aria-label={showPw ? t("admin.auth.hidePw") : t("admin.auth.showPw")}
                        onClick={() => setShowPw((v) => !v)}
                      >
                        <Icon name={showPw ? "eye-off" : "eye"} size={17} />
                      </button>
                    </span>
                    <div className="al-strength" data-level={level}>
                      <div className="al-strength__bar">
                        {[0, 1, 2, 3].map((i) => (
                          <span key={i} className={"al-strength__seg" + (i < level ? " is-on" : "")} />
                        ))}
                      </div>
                      <span className="al-strength__label">{t(`admin.auth.strength.${level}`)}</span>
                    </div>
                  </label>

                  <label className="al-field">
                    <span className="al-label">{t("admin.auth.confirmPw")}</span>
                    <span className="al-inputwrap">
                      <Icon name="lock" size={18} className="al-input__lead" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        required
                        className={"al-input al-input--pw" + (err ? " al-input--error" : "")}
                        placeholder="••••••••"
                        value={confirm}
                        onChange={(e) => {
                          setConfirm(e.target.value);
                          setErr("");
                        }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="al-pwtoggle"
                        aria-label={showConfirm ? t("admin.auth.hidePw") : t("admin.auth.showPw")}
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        <Icon name={showConfirm ? "eye-off" : "eye"} size={17} />
                      </button>
                    </span>
                    {err && <span className="al-errhint">{t(err)}</span>}
                    <ul className="al-reqs">
                      {results.map((r) => (
                        <li key={r.labelKey} className={"al-reqs__item" + (r.met ? " is-met" : "")}>
                          <span className="al-reqs__icon">
                            <Icon name="check" size={11} strokeWidth={3} />
                          </span>
                          {t(r.labelKey)}
                        </li>
                      ))}
                    </ul>
                  </label>

                  <Button type="submit" hierarchy="primary" size="lg" fullWidth disabled={!allMet || !confirm.trim()}>
                    {t("admin.auth.updatePw")}
                  </Button>
                  <Link className="al-back" href="/admin/login">
                    <Icon name="arrow-left" size={15} />
                    {t("admin.auth.backToLogin")}
                  </Link>
                </form>
              </>
            )}

            {(status === "invalid" || status === "expired") && (
              <div className="al-sent">
                <span className="al-sent__icon al-sent__icon--error">
                  <Icon name="circle-alert" size={22} />
                </span>
                <h1 className="al-title">{status === "expired" ? t("admin.auth.linkExpired") : t("admin.auth.linkInvalid")}</h1>
                <p className="al-desc">
                  {status === "expired" ? t("admin.auth.expiredDesc") : t("admin.auth.invalidDesc")}
                </p>
                <Link className="al-back" href="/admin/login">
                  <Icon name="arrow-left" size={15} />
                  {t("admin.auth.backToLogin")}
                </Link>
              </div>
            )}

            {status === "done" && (
              <div className="al-sent">
                <span className="al-sent__icon">
                  <Icon name="circle-check" size={22} />
                </span>
                <h1 className="al-title">{t("admin.auth.updatedTitle")}</h1>
                <p className="al-desc">{t("admin.auth.updatedDesc")}</p>
                <Button hierarchy="primary" size="lg" fullWidth onClick={() => router.push("/admin/login")}>
                  {t("admin.auth.login")}
                </Button>
              </div>
            )}
          </div>
          <div className="al-tail" aria-hidden="true" />
        </div>

        {/* ---------- right: image ---------- */}
        <div className="al-hero" aria-hidden="true" />
      </div>
    </div>
  );
}
