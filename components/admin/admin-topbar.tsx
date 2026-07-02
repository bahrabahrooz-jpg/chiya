"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAdminAuth } from "@/lib/admin-auth";
import { ADMIN, LANGUAGES, NOTIFICATIONS } from "./admin-data";

type MenuId = "notif" | "profile" | "lang" | null;

function ProfileMenu({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const items: { icon: "user" | "settings"; label: string }[] = [
    { icon: "user", label: "My profile" },
    { icon: "settings", label: "Account settings" },
  ];
  return (
    <div className="ax-menu ax-menu--profile" role="menu">
      <div className="ax-menu-profilecard">
        <Avatar name={ADMIN.name} size="lg" verified />
        <span className="ax-menu-profilecard__meta">
          <span className="ax-menu-profilecard__name">{ADMIN.name}</span>
          <span className="ax-menu-profilecard__mail">{ADMIN.email}</span>
          <span style={{ marginTop: 6 }}>
            <Badge variant="gold" size="sm" icon="shield-check">
              Super Admin
            </Badge>
          </span>
        </span>
      </div>
      <div className="ax-menu__sect">
        {items.map((it) => (
          <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={onClose}>
            <Icon name={it.icon} size={18} />
            {it.label}
          </button>
        ))}
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item is-danger" role="menuitem" onClick={onLogout}>
          <Icon name="log-out" size={18} />
          Log out
        </button>
      </div>
    </div>
  );
}

function LanguageMenu({ current, onPick }: { current: string; onPick: (code: string) => void }) {
  return (
    <div className="ax-menu ax-menu--lang" role="menu">
      <div className="ax-menu__head">
        <h4>Language</h4>
      </div>
      <div className="ax-menu__sect">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            className="ax-menu-item"
            role="menuitemradio"
            aria-checked={current === l.code}
            onClick={() => onPick(l.code)}
          >
            <span
              className="ax-flag"
              style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)" }}
            >
              {l.code}
            </span>
            <span className="ax-menu-item__lbl">
              {l.label}
              <span className="ax-menu-item__sub">{l.native}</span>
            </span>
            {current === l.code && (
              <span className="ax-menu-item__check">
                <Icon name="check" size={17} strokeWidth={2.5} />
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function NotifMenu({ onClose }: { onClose: () => void }) {
  const unread = NOTIFICATIONS.filter((n) => n.unread).length;
  return (
    <div className="ax-menu ax-menu--notif" role="menu">
      <div className="ax-menu__head">
        <h4>Notifications</h4>
        {unread > 0 && (
          <Badge variant="brand" size="sm">
            {unread} new
          </Badge>
        )}
      </div>
      <div className="ax-notif-list">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className={"ax-notif" + (n.unread ? " is-unread" : "")} onClick={onClose}>
            <span className={"ax-notif__ic ax-notif__ic--" + n.kind}>
              <Icon name={n.icon} size={18} />
            </span>
            <div className="ax-notif__body">
              <p className="ax-notif__title">{n.title}</p>
              <p className="ax-notif__desc">{n.desc}</p>
              <div className="ax-notif__time">{n.time}</div>
            </div>
            {n.unread && <span className="ax-notif__udot" />}
          </div>
        ))}
      </div>
      <div className="ax-menu__foot">
        <Button hierarchy="secondary" size="sm" onClick={onClose}>
          Mark all as read
        </Button>
      </div>
    </div>
  );
}

function LogoutModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal
      open
      onClose={onCancel}
      icon="log-out"
      title="Log out?"
      size="sm"
      footer={
        <>
          <Button hierarchy="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button hierarchy="destructive" iconLeading="log-out" onClick={onConfirm}>
            Log out
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
        Are you sure you want to log out? You&apos;ll need to sign in again to access the admin dashboard.
      </p>
    </Modal>
  );
}

export function AdminTopbar({
  openMenu,
  setOpenMenu,
  onHamburger,
}: {
  openMenu: MenuId;
  setOpenMenu: (m: MenuId) => void;
  onHamburger: () => void;
}) {
  const router = useRouter();
  const { logout } = useAdminAuth();
  const [lang, setLang] = useState("EN");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const toggle = (m: Exclude<MenuId, null>) => setOpenMenu(openMenu === m ? null : m);

  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>

      {/* Version B — search-first utility strip */}
      <div className="ax-tb-search ax-tb-search--lead">
        <span className="ax-tb-search__lead">
          <Icon name="search" size={18} />
        </span>
        <input type="text" placeholder="Search properties, members, agents…" aria-label="Global search" />
      </div>

      <div className="ax-tb-spacer" />

      <div className="ax-tb-actions">
        {/* color mode */}
        <ThemeToggle />

        <div className="ax-tb-divider" />

        {/* language */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={"ax-tb-btn" + (openMenu === "lang" ? " is-open" : "")}
            aria-label="Language"
            aria-haspopup="true"
            aria-expanded={openMenu === "lang"}
            onClick={() => toggle("lang")}
          >
            <Icon name="globe" size={20} />
            <span className="ax-lbl">{lang}</span>
          </button>
          {openMenu === "lang" && (
            <LanguageMenu
              current={lang}
              onPick={(code) => {
                setLang(code);
                setOpenMenu(null);
              }}
            />
          )}
        </div>

        {/* notifications */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={"ax-tb-btn" + (openMenu === "notif" ? " is-open" : "")}
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={openMenu === "notif"}
            onClick={() => toggle("notif")}
          >
            <Icon name="bell" size={20} />
            <span className="ax-tb-dot" />
          </button>
          {openMenu === "notif" && <NotifMenu onClose={() => setOpenMenu(null)} />}
        </div>

        <div className="ax-tb-divider" />

        {/* profile */}
        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={"ax-tb-profile" + (openMenu === "profile" ? " is-open" : "")}
            aria-haspopup="true"
            aria-expanded={openMenu === "profile"}
            onClick={() => toggle("profile")}
          >
            <Avatar name={ADMIN.name} size="sm" verified />
            <span className="ax-tb-profile__meta">
              <span className="ax-tb-profile__name">{ADMIN.name}</span>
              <span className="ax-tb-profile__role">{ADMIN.role}</span>
            </span>
            <Icon name="chevron-down" size={16} />
          </button>
          {openMenu === "profile" && (
            <ProfileMenu
              onClose={() => setOpenMenu(null)}
              onLogout={() => {
                setOpenMenu(null);
                setLogoutOpen(true);
              }}
            />
          )}
        </div>
      </div>

      {logoutOpen && (
        <LogoutModal
          onCancel={() => setLogoutOpen(false)}
          onConfirm={() => {
            setLogoutOpen(false);
            logout();
            router.push("/admin/login");
          }}
        />
      )}
    </header>
  );
}

export type { MenuId };
