"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminProfile } from "@/lib/admin-profile";
import { useAdminNotifications } from "@/lib/admin-notifications";
import { NotifBell } from "./notif-bell";
import { ADMIN } from "./admin-data";

type MenuId = "notif" | "profile" | "lang" | null;

function ProfileMenu({ name, avatar, onNavigate, onLogout }: { name: string; avatar: string; onNavigate: (path: string) => void; onLogout: () => void }) {
  const items: { icon: "user" | "settings"; label: string; path: string }[] = [
    { icon: "user", label: "My profile", path: "/admin/profile" },
    { icon: "settings", label: "Account settings", path: "/admin/settings" },
  ];
  return (
    <div className="ax-menu ax-menu--profile" role="menu">
      <div className="ax-menu-profilecard">
        <Avatar name={name} src={avatar || undefined} size="lg" verified />
        <span className="ax-menu-profilecard__meta">
          <span className="ax-menu-profilecard__name">{name}</span>
          <span style={{ marginTop: 3, fontSize: 13, fontWeight: 400, color: "var(--text-secondary)" }}>Super Admin</span>
        </span>
      </div>
      <div className="ax-menu__sect">
        {items.map((it) => (
          <button key={it.label} type="button" className="ax-menu-item" role="menuitem" onClick={() => onNavigate(it.path)}>
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
  const { profile } = useAdminProfile();
  const notifications = useAdminNotifications();
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
        <LanguageSwitcher />

        {/* notifications */}
        <NotifBell data={notifications} viewAllHref="/admin/notifications" />

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
            <Avatar name={profile.name} src={profile.avatar || undefined} size="sm" verified />
            <span className="ax-tb-profile__meta">
              <span className="ax-tb-profile__name">{profile.name}</span>
              <span className="ax-tb-profile__role">{ADMIN.role}</span>
            </span>
            <Icon name="chevron-down" size={16} />
          </button>
          {openMenu === "profile" && (
            <ProfileMenu
              name={profile.name}
              avatar={profile.avatar}
              onNavigate={(path) => {
                setOpenMenu(null);
                router.push(path);
              }}
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
