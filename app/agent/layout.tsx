"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AgentTopbar } from "@/components/agent/agent-topbar";
import { AGENT_NAV_GROUPS, activeAgentNavId } from "@/components/agent/agent-data";
import { PropertiesProvider } from "@/app/admin/_shared/properties-store";
import { ContractsProvider } from "@/app/admin/_shared/contracts-store";
import { useAgentSession } from "@/lib/agent-session";
import "@/components/admin/admin-shell.css";

function categoryFor(w: number) {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  /* The sign-in page renders bare — no shell, no guard — so it stays reachable
     while signed out and cannot loop against the redirect below. Mirrors the
     admin layout's treatment of /admin/login. */
  if (pathname === "/agent/login") {
    return <div className="ax-authpage">{children}</div>;
  }
  return <AgentShell>{children}</AgentShell>;
}

function AgentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeAgentNavId(pathname);

  /* The lock. The console had none: /agent opened straight into a named
     agent's listings, members and commission reports, and the topbar's Logout
     button flipped a flag nothing was watching. Soft, like the admin's — the
     flag defaults to signed-in so demos are never blocked — but an explicit
     logout now actually ends the session. */
  const { authed } = useAgentSession();
  useEffect(() => {
    if (!authed) router.replace("/agent/login");
  }, [authed, router]);

  const [collapsed, setCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const catRef = useRef<string>("desktop");

  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    const apply = () => {
      const cat = categoryFor(window.innerWidth);
      if (cat !== catRef.current) {
        catRef.current = cat;
        if (cat !== "mobile") setDrawerOpen(false);
      }
    };
    catRef.current = "desktop";
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  const onNavigate = useCallback(() => {
    if (typeof window !== "undefined" && categoryFor(window.innerWidth) === "mobile") {
      setDrawerOpen(false);
    }
  }, []);

  // Signed out → render nothing while the effect above redirects to the login.
  if (!authed) return null;

  /* Same nesting as the admin layout — the transitions hook reads both stores,
     and a contract's consequences land on a property. */
  return (
    <PropertiesProvider>
      <ContractsProvider>
      <div className="ax-app" data-layout="B">
        <AdminSidebar
          collapsed={collapsed}
          drawerOpen={drawerOpen}
          active={active}
          groups={AGENT_NAV_GROUPS}
          homeHref="/agent"
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onNavigate={onNavigate}
        />

        {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

        <div className="ax-main">
          <AgentTopbar onHamburger={() => setDrawerOpen(true)} />
          <main className="ax-content">{children}</main>
        </div>
      </div>
      </ContractsProvider>
    </PropertiesProvider>
  );
}
