"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/lib/admin-auth";
import "./login.css";

type Mode = "signin" | "forgot";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [sent, setSent] = useState(false);
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
    setSent(true);
  };
  const toForgot = () => {
    setMode("forgot");
    setSent(false);
    setEmailErr(false);
    setPwErr(false);
  };
  const toSignIn = () => {
    setMode("signin");
    setSent(false);
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
                <h1 className="al-title">Welcome back</h1>
                <p className="al-desc">Sign in to access the admin dashboard.</p>
                <form className="al-form" onSubmit={signIn} noValidate>
                  <label className="al-field">
                    <span className="al-label">Email</span>
                    <span className="al-inputwrap">
                      <Icon name="mail" size={18} className="al-input__lead" />
                      <input
                        type="email"
                        required
                        className={"al-input" + (emailErr ? " al-input--error" : "")}
                        placeholder="you@chiya.estate"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailErr(false);
                        }}
                        aria-invalid={emailErr}
                        autoComplete="email"
                      />
                    </span>
                    {emailErr && <span className="al-errhint">Enter a valid email address.</span>}
                  </label>

                  <label className="al-field">
                    <span className="al-label">Password</span>
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
                      <button type="button" className="al-pwtoggle" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw((v) => !v)}>
                        <Icon name={showPw ? "eye-off" : "eye"} size={17} />
                      </button>
                    </span>
                    {pwErr && <span className="al-errhint">Password must be at least 6 characters.</span>}
                  </label>

                  <div className="al-row">
                    <label className="al-check">
                      <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                      <span className="al-check__box">
                        <Icon name="check" size={12} strokeWidth={3} />
                      </span>
                      Remember me
                    </label>
                    <button type="button" className="al-link" onClick={toForgot}>
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" hierarchy="primary" size="lg" fullWidth iconTrailing="arrow-right" disabled={!email.trim() || !password.trim()}>
                    Sign in
                  </Button>
                </form>
              </>
            )}

            {mode === "forgot" && !sent && (
              <>
                <h1 className="al-title">Reset password</h1>
                <p className="al-desc">Enter the email linked to your account and we&apos;ll send you a reset link.</p>
                <form className="al-form" onSubmit={sendReset} noValidate>
                  <label className="al-field">
                    <span className="al-label">Email</span>
                    <span className="al-inputwrap">
                      <Icon name="mail" size={18} className="al-input__lead" />
                      <input
                        type="email"
                        required
                        className={"al-input" + (emailErr ? " al-input--error" : "")}
                        placeholder="you@chiya.estate"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailErr(false);
                        }}
                        aria-invalid={emailErr}
                        autoComplete="email"
                      />
                    </span>
                    {emailErr && <span className="al-errhint">Enter a valid email address.</span>}
                  </label>
                  <Button type="submit" hierarchy="primary" size="lg" fullWidth iconTrailing="arrow-right" disabled={!email.trim()}>
                    Send reset link
                  </Button>
                  <button type="button" className="al-back" onClick={toSignIn}>
                    <Icon name="arrow-left" size={15} />
                    Back to sign in
                  </button>
                </form>
              </>
            )}

            {mode === "forgot" && sent && (
              <div className="al-sent">
                <span className="al-sent__icon">
                  <Icon name="mail-check" size={26} />
                </span>
                <h1 className="al-title">Check your inbox</h1>
                <p className="al-desc">
                  If an account exists for <b>{email || "that address"}</b>, we&apos;ve sent a password reset link. It may take a minute to arrive.
                </p>
                <Button hierarchy="secondary" size="lg" fullWidth iconLeading="arrow-left" onClick={toSignIn}>
                  Back to sign in
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
