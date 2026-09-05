"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { useAgentSession } from "@/lib/agent-session";
/* The admin's login stylesheet, not a copy of it. The agent console is the
   admin shell scoped to one agent — same sidebar, same topbar, same CSS — so
   its sign-in screen is the same screen with different words on it. A second
   stylesheet would be the two drifting apart by the second change. */
import "@/app/admin/login/login.css";

/**
 * Agent sign-in.
 *
 * WHY THIS EXISTS. The agent console had no lock at all: no guard on the
 * layout and no page like this one, so typing /agent walked straight into a
 * named agent's listings, members and commission reports. The topbar has had a
 * working Logout button the whole time — it flipped the session flag, nothing
 * watched the flag, and the console carried on as though nothing had happened.
 *
 * NO PASSWORD RESET HERE, deliberately. The admin's reset flow mints a real
 * token (lib/admin-reset) and hands it to a reset page. There is no agent
 * equivalent, and a "Forgot password?" link that goes nowhere is worse than an
 * absent one — so the link is absent until the flow exists.
 *
 * DEMO SCOPE: there are no agent accounts, so any well-formed email and a
 * password of six characters signs in as the session's demo agent. The check is
 * a shape check, not authentication, exactly as on the admin login.
 */
export default function AgentLoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const { login } = useAgentSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [emailErr, setEmailErr] = useState(false);
  const [pwErr, setPwErr] = useState(false);

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    const passwordOk = password.trim().length >= 6;
    setEmailErr(!emailOk);
    setPwErr(!passwordOk);
    if (!emailOk || !passwordOk) return;
    login();
    router.push("/agent");
  };

  return (
    <div className="al-page">
      <div className="al-shell">
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
            <h1 className="al-title">{t("agent.auth.welcome")}</h1>
            <p className="al-desc">{t("agent.auth.desc")}</p>
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
              </div>

              <Button type="submit" hierarchy="primary" size="lg" fullWidth disabled={!email.trim() || !password.trim()}>
                {t("admin.auth.login")}
              </Button>
            </form>
          </div>
          <div className="al-tail" aria-hidden="true" />
        </div>

        <div className="al-hero" aria-hidden="true" />
      </div>
    </div>
  );
}
