"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useAdminAuth } from "@/lib/admin-auth";
import { createResetToken } from "@/lib/admin-reset";
import "./login.css";

type Mode = "signin" | "forgot";

export default function AdminLoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const { login } = useAdminAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [emailErr, setEmailErr] = useState(false);
  const [pwErr, setPwErr] = useState(false);

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    // No backend here, so treat a malformed email or too-short password as a
    // failed sign-in and surface a per-field error.
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const passwordOk = password.trim().length >= 6;
    setEmailErr(!emailOk);
    setPwErr(!passwordOk);
    if (!emailOk || !passwordOk) return;
    login();
    router.push("/admin");
  };
  const sendReset = (e: FormEvent) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    setEmailErr(!emailOk);
    if (!emailOk) return;
    // Prototype: mint a reset token locally instead of emailing a link.
    setResetToken(createResetToken(email.trim()));
    setSent(true);
  };
  // Re-issues the token — the real endpoint would send a fresh reset email.
  const resend = () => setResetToken(createResetToken(email.trim()));
  const toForgot = () => {
    setMode("forgot");
    setSent(false);
    setResetToken("");
    setEmailErr(false);
    setPwErr(false);
  };
  const toSignIn = () => {
    setMode("signin");
    setSent(false);
    setResetToken("");
    setEmailErr(false);
    setPwErr(false);
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
            {mode === "signin" && (
              <>
                <h1 className="al-title">{t("admin.auth.welcome")}</h1>
                <p className="al-desc">{t("admin.auth.loginDesc")}</p>
                <form className="al-form" onSubmit={signIn} noValidate>
                  <label className="al-field">
                    <span className="al-label">{t("admin.auth.email")}</span>
                    <span className="al-inputwrap">
                      <Icon name="mail" size={18} className="al-input__lead" />
                      <input
                        type="email"
                        required
                        className={"al-input" + (emailErr ? " al-input--error" : "")}
                        placeholder={t("admin.auth.emailPh")}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailErr(false);
                        }}
                        aria-invalid={emailErr}
                        autoComplete="email"
                      />
                    </span>
                    {emailErr && <span className="al-errhint">{t("admin.auth.emailErr")}</span>}
                  </label>

                  <label className="al-field">
                    <span className="al-label">{t("admin.auth.password")}</span>
                    <span className="al-inputwrap">
                      <Icon name="lock" size={18} className="al-input__lead" />
                      <input
                        type={showPw ? "text" : "password"}
                        required
                        className={"al-input al-input--pw" + (pwErr ? " al-input--error" : "")}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPwErr(false);
                        }}
                        aria-invalid={pwErr}
                        autoComplete="current-password"
                      />
                      <button type="button" className="al-pwtoggle" aria-label={showPw ? t("admin.auth.hidePw") : t("admin.auth.showPw")} onClick={() => setShowPw((v) => !v)}>
                        <Icon name={showPw ? "eye-off" : "eye"} size={17} />
                      </button>
                    </span>
                    {pwErr && <span className="al-errhint">{t("admin.auth.pwErr")}</span>}
                  </label>

                  <div className="al-row">
                    <label className="al-check">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      <span className="al-check__box">
                        <Icon name="check" size={12} strokeWidth={3} />
                      </span>
                      {t("admin.auth.remember")}
                    </label>
                    <button type="button" className="al-link" onClick={toForgot}>
                      {t("admin.auth.forgot")}
                    </button>
                  </div>

                  <Button type="submit" hierarchy="primary" size="lg" fullWidth disabled={!email.trim() || !password.trim()}>
                    {t("admin.auth.login")}
                  </Button>
                </form>
              </>
            )}

            {mode === "forgot" && !sent && (
              <>
                <h1 className="al-title">{t("admin.auth.resetTitle")}</h1>
                <p className="al-desc">{t("admin.auth.resetDesc")}</p>
                <form className="al-form" onSubmit={sendReset} noValidate>
                  <label className="al-field">
                    <span className="al-label">{t("admin.auth.email")}</span>
                    <span className="al-inputwrap">
                      <Icon name="mail" size={18} className="al-input__lead" />
                      <input
                        type="email"
                        required
                        className={"al-input" + (emailErr ? " al-input--error" : "")}
                        placeholder={t("admin.auth.emailPh")}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailErr(false);
                        }}
                        aria-invalid={emailErr}
                        autoComplete="email"
                      />
                    </span>
                    {emailErr && <span className="al-errhint">{t("admin.auth.emailErr")}</span>}
                  </label>
                  <Button type="submit" hierarchy="primary" size="lg" fullWidth disabled={!email.trim()}>
                    {t("admin.auth.resetTitle")}
                  </Button>
                  <button type="button" className="al-back" onClick={toSignIn}>
                    <Icon name="arrow-left" size={15} />
                    {t("admin.auth.backToLogin")}
                  </button>
                </form>
              </>
            )}

            {mode === "forgot" && sent && (
              <div className="al-sent">
                <span className="al-sent__icon">
                  <Icon name="mail" size={22} />
                </span>
                <h1 className="al-title">{t("admin.auth.checkInbox")}</h1>
                <p className="al-desc">
                  {t("admin.auth.sentPre")} <b>{email || t("admin.auth.yourEmail")}</b>.<br />
                  {t("admin.auth.sentPost")}
                </p>
                {/* No real email is sent — "Open email app" stands in for opening the
                    inbox and clicking the reset link, so it jumps straight to reset. */}
                <a className="al-sent__link" href={`/admin/reset?token=${resetToken}`}>
                  {t("admin.auth.openEmail")}
                </a>
                <p className="al-sent__resend">
                  {t("admin.auth.noEmail")}{" "}
                  <button type="button" className="al-sent__link" onClick={resend}>
                    {t("admin.auth.resend")}
                  </button>
                </p>
                <button type="button" className="al-back" onClick={toSignIn}>
                  <Icon name="arrow-left" size={15} />
                  {t("admin.auth.backToLogin")}
                </button>
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
