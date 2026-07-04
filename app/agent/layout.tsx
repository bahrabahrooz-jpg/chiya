"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AgentTopbar } from "@/components/agent/agent-topbar";
import { AGENT_NAV_GROUPS, activeAgentNavId } from "@/components/agent/agent-data";
import { PropertiesProvider } from "@/app/admin/_shared/properties-store";
import "@/components/admin/admin-shell.css";

function categoryFor(w: number) {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeAgentNavId(pathname);

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

  return (
    <PropertiesProvider>
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
    </PropertiesProvider>
  );
}
