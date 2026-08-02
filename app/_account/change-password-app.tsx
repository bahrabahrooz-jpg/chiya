"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/data";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/layout/container";
import { toast } from "@/components/feedback/toast";
import { openAuth, useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import "@/components/site/auth-modal.css";
import "./account.css";

/**
 * ChangePasswordApp — the member's "Change password" screen, reached from the
 * header avatar dropdown. Reuses the exact field pattern from the login / forgot
 * flow (auth-modal): a masked password input with a leading lock icon and a
 * trailing eye toggle to peek, a live strength meter, and a requirements
 * checklist. Rebuilt with the website page chrome (breadcrumb + header + footer).
 * There is no backend: a real API would verify the current password and persist
 * the new one — here we validate client-side and toast.
 */

// Live requirements for the new password — same set as the login/reset flow.
const CHECKS: { key: string; test: (v: string) => boolean }[] = [
  { key: "chpw.check.len8", test: (v) => v.length >= 8 },
  { key: "chpw.check.upper", test: (v) => /[A-Z]/.test(v) },
  { key: "chpw.check.lower", test: (v) => /[a-z]/.test(v) },
  { key: "chpw.check.number", test: (v) => /\d/.test(v) },
  { key: "chpw.check.special", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * PwField — the same masked-input-with-eye-toggle field used by the auth modal's
 * login and forgot-password forms. Leading lock icon, dots hidden by default, and
 * a trailing eye button to reveal the value.
 */
function PwField({
  name,
  label,
  placeholder,
  value,
  onChange,
  error,
  autoComplete,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const { t } = useLang();
  const [show, setShow] = useState(false);
  return (
    <label className="cxa-field">
      <span className="cxa-label">{label}</span>
      <div className={"cxa-inputwrap" + (error ? " cxa-bad" : "")}>
        <span className="cxa-ic">
          <Icon name="lock" size={18} />
        </span>
        <input
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCorrect="off"
          spellCheck={false}
        />
        <button
          type="button"
          className="cxa-peek"
          aria-label={show ? t("chpw.hide") : t("chpw.show")}
          onClick={() => setShow((s) => !s)}
        >
          <Icon name={show ? "eye-off" : "eye"} size={18} />
        </button>
      </div>
      <span className="cxa-err">{error}</span>
    </label>
  );
}

export function ChangePasswordApp() {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ current?: string; pw?: string; confirm?: string }>({});

  // Changing the password requires an account; nudge signed-out visitors to the modal.
  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to change your password.", next: "/account/change-password" });
  }, [user]);

  if (!user) {
    return (
      <main className="acc-main">
        <Container>
          <EmptyState
            icon="lock"
            title="Sign in to change your password"
            description="You need to be signed in to update your Chiya account password."
            action={
              <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/account/change-password" })}>
                Sign in
              </Button>
            }
          />
        </Container>
      </main>
    );
  }

  const results = CHECKS.map((c) => ({ key: c.key, met: c.test(pw) }));
  const passed = results.filter((r) => r.met).length;
  const level = pw.length === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : passed === 4 ? 3 : 4;
  const allMet = passed === CHECKS.length;
  const canSubmit = current.length > 0 && allMet && confirm === pw && pw !== current;

  const submit = () => {
    const next: typeof errors = {};
    if (current.length === 0) next.current = t("chpw.errCurrent");
    if (pw.length > 0 && pw === current) next.pw = t("chpw.errSame");
    if (confirm !== pw) next.confirm = t("chpw.errMatch");
    setErrors(next);
    if (Object.keys(next).length > 0 || !allMet) return;

    setBusy(true);
    // No backend: simulate the round-trip, then toast and return to the profile.
    setTimeout(() => {
      setBusy(false);
      toast({ title: t("chpw.toastUpdated"), variant: "success" });
      router.push("/account/profile");
    }, 600);
  };

  return (
    <main className="acc-main">
      <Container className="acc-prof-shell" style={{ maxWidth: 780 }}>
        <nav className="acc-crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Icon name="chevron-right" size={14} />
          <span>{t("chpw.crumb")}</span>
        </nav>

        <PageHeader title={t("chpw.title")} subtitle={t("chpw.subtitle")} />

        <form
          className="cxa-form"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          noValidate
        >
          <PwField
            name="current-password"
            label={t("chpw.current")}
            placeholder={t("chpw.placeholder")}
            value={current}
            onChange={(v) => {
              setCurrent(v);
              if (errors.current || errors.pw) setErrors((x) => ({ ...x, current: undefined, pw: undefined }));
            }}
            autoComplete="current-password"
            error={errors.current}
          />

          <div>
            <PwField
              name="new-password"
              label={t("chpw.new")}
              placeholder={t("chpw.placeholder")}
              value={pw}
              onChange={(v) => {
                setPw(v);
                if (errors.pw || errors.confirm) setErrors((x) => ({ ...x, pw: undefined, confirm: undefined }));
              }}
              autoComplete="new-password"
              error={errors.pw}
            />
            <div className="cxa-strength" data-level={level}>
              <div className="cxa-strength__bar">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={"cxa-strength__seg" + (i < level ? " is-on" : "")} />
                ))}
              </div>
              <span className="cxa-strength__label">{t(`chpw.strength.${level}`)}</span>
            </div>
          </div>

          <div>
            <PwField
              name="confirm-password"
              label={t("chpw.confirm")}
              placeholder={t("chpw.placeholder")}
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                if (errors.confirm) setErrors((x) => ({ ...x, confirm: undefined }));
              }}
              autoComplete="new-password"
              error={errors.confirm}
            />
            <div className="cxa-reqs-wrap">
              <span className="cxa-reqs-title">{t("chpw.reqsTitle")}</span>
              <ul className="cxa-reqs">
                {results.map((r) => (
                  <li key={r.key} className={"cxa-reqs__item" + (r.met ? " is-met" : "")}>
                    <span className="cxa-reqs__icon">
                      <Icon name="check" size={11} strokeWidth={3} />
                    </span>
                    {t(r.key)}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="acc-chpw__foot">
            <Button hierarchy="secondary" type="button" onClick={() => router.push("/account/profile")}>
              {t("chpw.cancel")}
            </Button>
            <Button hierarchy="primary" type="submit" iconLeading="check" loading={busy} disabled={!canSubmit || busy}>
              {busy ? t("chpw.updating") : t("chpw.update")}
            </Button>
          </div>
        </form>
      </Container>
    </main>
  );
}
