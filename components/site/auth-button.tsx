"use client";

import { useRef, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Avatar } from "@/components/ui/avatar";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";
import { useClickOutside } from "@/lib/use-click-outside";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

export interface AuthButtonProps {
  /** Size of the "Login" button when signed out. */
  size?: ButtonProps["size"];
  fullWidth?: boolean;
}

/**
 * AuthButton — the header auth control. When signed out it shows "Login" (opens
 * the auth modal). When signed in the entire right side of the nav collapses to
 * a single user avatar that opens the account dropdown.
 */
export function AuthButton({ size = "sm", fullWidth }: AuthButtonProps) {
  const { user, openAuth, logout } = useAuth();
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setMenuOpen(false), menuOpen);

  if (!user) {
    return (
      <Button hierarchy="primary" size={size} fullWidth={fullWidth} onClick={() => openAuth("login")}>
        {t("nav.login")}
      </Button>
    );
  }

  const soon = (msgKey: string) => () => {
    setMenuOpen(false);
    toast({ title: t(msgKey) });
  };

  const items: { icon: IconName; label: string; onClick: () => void }[] = [
    { icon: "user", label: t("acct.profile"), onClick: soon("acct.toast.profile") },
    { icon: "heart", label: t("acct.savedProps"), onClick: soon("acct.toast.saved") },
    { icon: "bell", label: t("acct.notifications"), onClick: soon("acct.toast.notifications") },
    { icon: "settings", label: t("acct.settings"), onClick: soon("acct.toast.settings") },
  ];

  return (
    <div className={"cxa-acct cxa-acct--av" + (fullWidth ? " cxa-acct--full" : "")} ref={ref}>
      <button
        type="button"
        className={"cxa-avbtn" + (fullWidth ? "" : " cxa-avbtn--icon")}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={t("acct.account")}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <Avatar name={user.name || t("acct.member")} size="sm" />
        {fullWidth && (
          <>
            <span className="cxa-avbtn__meta">
              <span className="cxa-avbtn__name">{user.name || t("acct.member")}</span>
              <span className="cxa-avbtn__role">{user.type === "agent" ? t("acct.role.agent") : t("acct.role.customer")}</span>
            </span>
            <span className="cxa-acct__cv">
              <Icon name="chevron-down" size={16} />
            </span>
          </>
        )}
      </button>
      {menuOpen && (
        <div className="cxa-menu" role="menu">
          <div className="cxa-menu__card">
            <Avatar name={user.name || t("acct.member")} size="lg" />
            <span className="cxa-menu__meta">
              <span className="cxa-menu__nm">{user.name || t("acct.member")}</span>
              <span className="cxa-menu__sub">{user.type === "agent" ? t("acct.role.agent") : t("acct.role.customer")}</span>
            </span>
          </div>
          <div className="cxa-menu__sect">
            {items.map((it) => (
              <button key={it.label} type="button" className="cxa-menu__item" role="menuitem" onClick={it.onClick}>
                <Icon name={it.icon} size={18} />
                {it.label}
              </button>
            ))}
          </div>
          <div className="cxa-menu__sect">
            <button
              type="button"
              className="cxa-menu__item cxa-menu__item--danger"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                logout();
                toast({ title: t("acct.toast.loggedout") });
              }}
            >
              <Icon name="log-out" size={18} />
              {t("acct.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
