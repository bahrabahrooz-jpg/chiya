"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/feedback/toast";
import { useClickOutside } from "@/lib/use-click-outside";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

function initials(name: string) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

export interface AuthButtonProps {
  /** Size of the "Login" button when signed out. */
  size?: ButtonProps["size"];
  fullWidth?: boolean;
}

/**
 * AuthButton — the header auth control. Shows "Login" (opens the auth modal)
 * when signed out, or an account chip with a dropdown menu when signed in.
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

  const first = user.name ? user.name.split(" ")[0] : t("acct.account");
  const menuItem = (msgKey: string) => () => {
    setMenuOpen(false);
    toast({ title: t(msgKey) });
  };

  return (
    <div className="cxa-acct" ref={ref} onClick={() => setMenuOpen((o) => !o)}>
      <span className="cxa-acct__av">{initials(user.name)}</span>
      <span className="cxa-acct__nm">{first}</span>
      <span className="cxa-acct__cv">
        <Icon name="chevron-down" size={16} />
      </span>
      {menuOpen && (
        <div className="cxa-menu" onClick={(e) => e.stopPropagation()}>
          <div className="cxa-menu__id">
            <div className="cxa-menu__nm">{user.name || t("acct.member")}</div>
            <div className="cxa-menu__em">{user.email || user.phone || t("acct.chiyaMember")}</div>
            <span className="cxa-menu__role">{user.type === "agent" ? t("acct.role.agent") : t("acct.role.customer")}</span>
          </div>
          <button type="button" className="cxa-menu__item" onClick={menuItem("acct.toast.saved")}>
            <Icon name="heart" size={17} />
            {t("acct.saved")}
          </button>
          <button type="button" className="cxa-menu__item" onClick={menuItem("acct.toast.agents")}>
            <Icon name="bookmark" size={17} />
            {t("acct.agents")}
          </button>
          <button type="button" className="cxa-menu__item" onClick={menuItem("acct.toast.viewings")}>
            <Icon name="calendar" size={17} />
            {t("acct.viewings")}
          </button>
          <button
            type="button"
            className="cxa-menu__item cxa-menu__item--danger"
            onClick={() => {
              setMenuOpen(false);
              logout();
              toast({ title: t("acct.toast.loggedout") });
            }}
          >
            <Icon name="log-out" size={17} />
            {t("acct.logout")}
          </button>
        </div>
      )}
    </div>
  );
}
