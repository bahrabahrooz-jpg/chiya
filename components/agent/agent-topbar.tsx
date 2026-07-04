"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NOTIFICATIONS } from "@/components/admin/admin-data";
import { useAgentSession } from "@/lib/agent-session";

type MenuId = "notif" | "profile" | null;

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

function ProfileMenu({ name, avatar, onNavigate, onLogout }: { name: string; avatar: string; onNavigate: (path: string) => void; onLogout: () => void }) {
  return (
    <div className="ax-menu ax-menu--profile" role="menu">
      <div className="ax-menu-profilecard">
        <Avatar name={name} src={avatar || undefined} size="lg" verified />
        <span className="ax-menu-profilecard__meta">
          <span className="ax-menu-profilecard__name">{name}</span>
          <span style={{ marginTop: 3, fontSize: 13, fontWeight: 400, color: "var(--text-secondary)" }}>Agent</span>
        </span>
      </div>
      <div className="ax-menu__sect">
        <button type="button" className="ax-menu-item" role="menuitem" onClick={() => onNavigate("/agent/profile")}>
          <Icon name="user" size={18} />
          My profile
        </button>
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

export function AgentTopbar({ onHamburger }: { onHamburger: () => void }) {
  const router = useRouter();
  const { agent, logout } = useAgentSession();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const toggle = (m: Exclude<MenuId, null>) => setOpenMenu(openMenu === m ? null : m);

  return (
    <header className="ax-topbar">
      <button type="button" className="ax-tb-btn ax-hamburger" aria-label="Open menu" onClick={onHamburger}>
        <Icon name="menu" size={22} />
      </button>

      <div className="ax-tb-search ax-tb-search--lead">
        <span className="ax-tb-search__lead">
          <Icon name="search" size={18} />
        </span>
        <input type="text" placeholder="Search my properties, viewings…" aria-label="Search" />
      </div>

      <div className="ax-tb-spacer" />

      <div className="ax-tb-actions">
        <ThemeToggle />
        <div className="ax-tb-divider" />

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

        <div style={{ position: "relative" }}>
          <button
            type="button"
            className={"ax-tb-profile" + (openMenu === "profile" ? " is-open" : "")}
            aria-haspopup="true"
            aria-expanded={openMenu === "profile"}
            onClick={() => toggle("profile")}
          >
            <Avatar name={agent.name} src={agent.img || undefined} size="sm" verified />
            <span className="ax-tb-profile__meta">
              <span className="ax-tb-profile__name">{agent.name}</span>
              <span className="ax-tb-profile__role">Agent</span>
            </span>
            <Icon name="chevron-down" size={16} />
          </button>
          {openMenu === "profile" && (
            <ProfileMenu
              name={agent.name}
              avatar={agent.img || ""}
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

      {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}

      {logoutOpen && (
        <Modal
          open
          onClose={() => setLogoutOpen(false)}
          icon="log-out"
          title="Log out?"
          size="sm"
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setLogoutOpen(false)}>
                Cancel
              </Button>
              <Button
                hierarchy="destructive"
                iconLeading="log-out"
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                  router.push("/");
                }}
              >
                Log out
              </Button>
            </>
          }
        >
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
            Are you sure you want to log out? You&apos;ll need to sign in again to access your workspace.
          </p>
        </Modal>
      )}
    </header>
  );
}
