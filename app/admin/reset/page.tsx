"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { verifyResetToken, consumeResetToken } from "@/lib/admin-reset";
import "../login/login.css";

type Status = "checking" | "valid" | "invalid" | "expired" | "done";

/** Live requirements for a new password, evaluated as the user types. */
const CHECKS: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One special character", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const STRENGTH_LABELS = ["Not determined", "Weak", "Fair", "Good", "Strong"];

export default function AdminResetPage() {
  const router = useRouter();
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

  const results = CHECKS.map((c) => ({ label: c.label, met: c.test(pw) }));
  const passed = results.filter((r) => r.met).length;
  const level = pw.length === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const allMet = passed === CHECKS.length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!allMet) {
      setErr("Password doesn’t meet all the requirements.");
      return;
    }
    if (pw !== confirm) {
      setErr("Passwords don’t match.");
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
                <p className="al-desc">Checking your reset link…</p>
              </div>
            )}

            {status === "valid" && (
              <>
                <h1 className="al-title">Create new password</h1>
                <p className="al-desc">
                  Choose a new password for <b>{email}</b>.
                </p>
                <form className="al-form al-form--tight" onSubmit={submit} noValidate>
                  <label className="al-field">
                    <span className="al-label">New password</span>
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
                        aria-label={showPw ? "Hide password" : "Show password"}
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
                      <span className="al-strength__label">{STRENGTH_LABELS[level]}</span>
                    </div>
                  </label>

                  <label className="al-field">
                    <span className="al-label">Confirm new password</span>
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
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                        onClick={() => setShowConfirm((v) => !v)}
                      >
                        <Icon name={showConfirm ? "eye-off" : "eye"} size={17} />
                      </button>
                    </span>
                    {err && <span className="al-errhint">{err}</span>}
                    <ul className="al-reqs">
                      {results.map((r) => (
                        <li key={r.label} className={"al-reqs__item" + (r.met ? " is-met" : "")}>
                          <span className="al-reqs__icon">
                            <Icon name="check" size={11} strokeWidth={3} />
                          </span>
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  </label>

                  <Button type="submit" hierarchy="primary" size="lg" fullWidth disabled={!allMet || !confirm.trim()}>
                    Update password
                  </Button>
                  <Link className="al-back" href="/admin/login">
                    <Icon name="arrow-left" size={15} />
                    Back to log in
                  </Link>
                </form>
              </>
            )}

            {(status === "invalid" || status === "expired") && (
              <div className="al-sent">
                <span className="al-sent__icon al-sent__icon--error">
                  <Icon name="circle-alert" size={22} />
                </span>
                <h1 className="al-title">{status === "expired" ? "Link expired" : "Invalid link"}</h1>
                <p className="al-desc">
                  {status === "expired"
                    ? "This reset link has expired. Request a new one to continue."
                    : "This reset link is invalid or has already been used. Request a new one to continue."}
                </p>
                <Link className="al-back" href="/admin/login">
                  <Icon name="arrow-left" size={15} />
                  Back to log in
                </Link>
              </div>
            )}

            {status === "done" && (
              <div className="al-sent">
                <span className="al-sent__icon">
                  <Icon name="circle-check" size={22} />
                </span>
                <h1 className="al-title">Password updated</h1>
                <p className="al-desc">You can now log in with your new password.</p>
                <Button hierarchy="primary" size="lg" fullWidth onClick={() => router.push("/admin/login")}>
                  Log in
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
