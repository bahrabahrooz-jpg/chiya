"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { toast } from "@/components/feedback/toast";
import { useAuth, type AuthUser, type UserType } from "@/lib/auth";
import { useLang } from "@/lib/i18n";
import "./auth-modal.css";

type T = (key: string) => string;

const noopSub = () => () => {};
const useIsClient = () => useSyncExternalStore(noopSub, () => true, () => false);

const GoogleG = () => (
  <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
  </svg>
);

function nameFromId(id: string) {
  if (id.includes("@")) {
    const p = id.split("@")[0].replace(/[._-]+/g, " ").trim();
    return p.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "Member";
}
const emailish = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function Field({
  name,
  label,
  icon,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  peek,
}: {
  name: string;
  label: string;
  icon: "mail" | "lock" | "user" | "phone";
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  peek?: boolean;
}) {
  const [show, setShow] = useState(false);
  const inputType = peek ? (show ? "text" : "password") : type;
  return (
    <label className="cxa-field">
      <span className="cxa-label">{label}</span>
      <div className={"cxa-inputwrap" + (error ? " cxa-bad" : "")}>
        <span className="cxa-ic">
          <Icon name={icon} size={18} />
        </span>
        <input name={name} type={inputType} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
        {peek && (
          <button type="button" className="cxa-peek" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>
            <Icon name={show ? "eye-off" : "eye"} size={18} />
          </button>
        )}
      </div>
      <span className="cxa-err">{error}</span>
    </label>
  );
}

function welcomeMsg(t: T, user: AuthUser) {
  return user.name && user.name !== "Member" ? t("auth.welcomeNamed") + " " + user.name.split(" ")[0] : t("auth.welcome");
}

function LoginForm({ onAuthed }: { onAuthed: (u: AuthUser) => void }) {
  const { t } = useLang();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<{ id?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof err = {};
    if (!id.trim()) next.id = "Enter your email or phone number";
    if (!pw.trim()) next.pw = "Enter your password";
    setErr(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setTimeout(() => {
      onAuthed({ name: nameFromId(id.trim()), email: id.includes("@") ? id.trim() : "", phone: id.includes("@") ? "" : id.trim(), type: "customer" });
    }, 620);
  };

  return (
    <form className="cxa-form" noValidate onSubmit={submit}>
      <Field name="id" label={t("auth.f.id.l")} icon="mail" placeholder={t("auth.f.id.ph")} value={id} onChange={setId} error={err.id} />
      <Field name="password" label={t("auth.f.pw.l")} icon="lock" type="password" placeholder={t("auth.f.pw.ph")} value={pw} onChange={setPw} error={err.pw} peek />
      <div className="cxa-aux">
        <button type="button" className="cxa-link" onClick={() => toast({ title: t("auth.forgotToast"), variant: "success" })}>
          {t("auth.forgot")}
        </button>
      </div>
      <button type="submit" className="cxa-submit" disabled={busy}>
        {busy ? (
          <>
            <span className="cxa-spin" />
            {t("auth.load.signin")}
          </>
        ) : (
          t("auth.login.submit")
        )}
      </button>
    </form>
  );
}

function TypeCard({ val, current, onPick, icon, title, desc }: { val: UserType; current: UserType; onPick: (v: UserType) => void; icon: "house" | "briefcase"; title: string; desc: string }) {
  return (
    <button type="button" className="cxa-type" role="radio" aria-checked={current === val} onClick={() => onPick(val)}>
      <span className="cxa-type__ic">
        <Icon name={icon} size={18} />
      </span>
      <span>
        <span className="cxa-type__t">{title}</span>
        <span className="cxa-type__d">{desc}</span>
      </span>
      <span className="cxa-type__tick">
        <Icon name="check" size={12} strokeWidth={3} />
      </span>
    </button>
  );
}

function RegisterForm({ onAuthed }: { onAuthed: (u: AuthUser) => void }) {
  const { t } = useLang();
  const [regType, setRegType] = useState<UserType>("customer");
  const [v, setV] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (val: string) => setV((s) => ({ ...s, [k]: val }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!v.name.trim()) next.name = "Enter your full name";
    if (!emailish(v.email.trim())) next.email = "Enter a valid email";
    if (v.phone.replace(/\D/g, "").length < 7) next.phone = "Enter a valid phone number";
    if (v.password.length < 6) next.password = "At least 6 characters";
    if (!v.confirm || v.confirm !== v.password) next.confirm = "Passwords do not match";
    setErr(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setTimeout(() => {
      onAuthed({ name: v.name.trim(), email: v.email.trim(), phone: v.phone.trim(), type: regType });
    }, 620);
  };

  return (
    <form className="cxa-form" noValidate onSubmit={submit}>
      <div className="cxa-typesel">
        <span className="cxa-typesel__lab">{t("auth.iam")}</span>
        <div className="cxa-typegrid" role="radiogroup">
          <TypeCard val="customer" current={regType} onPick={setRegType} icon="house" title={t("auth.type.customer.t")} desc={t("auth.type.customer.d")} />
          <TypeCard val="agent" current={regType} onPick={setRegType} icon="briefcase" title={t("auth.type.agent.t")} desc={t("auth.type.agent.d")} />
        </div>
      </div>
      <Field name="name" label={t("auth.f.name.l")} icon="user" placeholder={t("auth.f.name.ph")} value={v.name} onChange={set("name")} error={err.name} />
      <Field name="email" label={t("auth.f.email.l")} icon="mail" type="email" placeholder={t("auth.f.email.ph")} value={v.email} onChange={set("email")} error={err.email} />
      <Field name="phone" label={t("auth.f.phone.l")} icon="phone" type="tel" placeholder={t("auth.f.phone.ph")} value={v.phone} onChange={set("phone")} error={err.phone} />
      <Field name="password" label={t("auth.f.pw.l")} icon="lock" type="password" placeholder={t("auth.f.npw.ph")} value={v.password} onChange={set("password")} error={err.password} peek />
      <Field name="confirm" label={t("auth.f.confirm.l")} icon="lock" type="password" placeholder={t("auth.f.confirm.ph")} value={v.confirm} onChange={set("confirm")} error={err.confirm} peek />
      <button type="submit" className="cxa-submit" disabled={busy}>
        {busy ? (
          <>
            <span className="cxa-spin" />
            {t("auth.load.create")}
          </>
        ) : (
          t("auth.register.submit")
        )}
      </button>
    </form>
  );
}

/**
 * AuthModalHost — mount once near the app root. Renders the login / register
 * modal whenever the auth store is opened. Faithful recreation of the export's
 * auth-modal.js (bespoke sheet, not the design-system Modal).
 */
export function AuthModalHost() {
  const { open, mode, intent, login, closeAuth, setMode } = useAuth();
  const { t } = useLang();
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeAuth]);

  if (!open || !isClient) return null;

  const isLogin = mode === "login";
  const onAuthed = (user: AuthUser) => {
    login(user);
    toast({ title: intent?.toast || welcomeMsg(t, user), variant: "success" });
  };
  const onGoogle = () =>
    onAuthed({ name: "Chiya Member", email: "member@gmail.com", phone: "", type: "customer" });

  return createPortal(
    <div className="cxa-overlay" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && closeAuth()}>
      <div className="cxa-sheet">
        <button type="button" className="cxa-close" aria-label="Close" onClick={closeAuth}>
          <Icon name="x" size={20} />
        </button>
        <div className="cxa-scroll">
          <div className="cxa-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/chiya-symbol.svg" alt="" />
            <b>CHIYA</b>
          </div>
          <h2 className="cxa-title">{isLogin ? t("auth.login.title") : t("auth.register.title")}</h2>
          <p className="cxa-sub">{isLogin ? t("auth.login.sub") : t("auth.register.sub")}</p>
          {intent?.note && (
            <div className="cxa-intent">
              <Icon name="shield-check" size={16} />
              <span>{intent.note}</span>
            </div>
          )}

          {isLogin ? <LoginForm onAuthed={onAuthed} /> : <RegisterForm onAuthed={onAuthed} />}

          <div className="cxa-or">
            <span>{t("auth.or")}</span>
          </div>
          <button type="button" className="cxa-google" onClick={onGoogle}>
            <GoogleG />
            {t("auth.google")}
          </button>

          <div className="cxa-switch">
            {isLogin ? t("auth.login.switchPre") + " " : t("auth.register.switchPre") + " "}
            <button type="button" onClick={() => setMode(isLogin ? "register" : "login")}>
              {isLogin ? t("auth.login.switchAct") : t("auth.register.switchAct")}
            </button>
          </div>
          <div className="cxa-trust">
            <Icon name="shield-check" size={16} />
            {isLogin ? t("auth.login.trust") : t("auth.register.trust")}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
