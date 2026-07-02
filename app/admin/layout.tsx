"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar, AdminTopbar, activeNavId, type MenuId } from "@/components/admin";
import { PropertiesProvider } from "./_shared/properties-store";
import { useAdminAuth } from "@/lib/admin-auth";
import "@/components/admin/admin-shell.css";

function categoryFor(w: number) {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // The login page renders bare (no shell, no guard) so it can't loop on itself.
  if (pathname === "/admin/login") {
    return <div className="ax-authpage">{children}</div>;
  }
  return <AdminShell>{children}</AdminShell>;
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const active = activeNavId(pathname);
  const { authed } = useAdminAuth();

  // Soft gate: an explicit logout flips the flag → bounce to the login page.
  // The flag defaults to signed-in, so demos are never blocked.
  useEffect(() => {
    if (!authed) router.replace("/admin/login");
  }, [authed, router]);

  // SSR-safe defaults: collapsed sidebar by default,
  // corrected on mount/resize for tablet/mobile.
  const [collapsed, setCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const catRef = useRef<string>("desktop");

  // close menus + drawer when the route changes (render-phase guard, no effect)
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpenMenu(null);
    setDrawerOpen(false);
  }

  // initialise + respond to breakpoint crossings
  useEffect(() => {
    const apply = () => {
      const cat = categoryFor(window.innerWidth);
      if (cat !== catRef.current) {
        catRef.current = cat;
        if (cat === "tablet") setCollapsed(true);
        if (cat === "desktop") setCollapsed(true);
        if (cat !== "mobile") setDrawerOpen(false);
      }
    };
    catRef.current = "desktop";
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  // ESC closes menus + drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onNavigate = useCallback(() => {
    setOpenMenu(null);
    if (typeof window !== "undefined" && categoryFor(window.innerWidth) === "mobile") {
      setDrawerOpen(false);
    }
  }, []);

  // Signed out → render nothing while the effect above redirects to the login.
  if (!authed) return null;

  return (
    <PropertiesProvider>
      <div className="ax-app" data-layout="B">
        <AdminSidebar
          collapsed={collapsed}
          drawerOpen={drawerOpen}
          active={active}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onNavigate={onNavigate}
        />

        {drawerOpen && <div className="ax-backdrop" onClick={() => setDrawerOpen(false)} />}

        <div className="ax-main">
          <AdminTopbar openMenu={openMenu} setOpenMenu={setOpenMenu} onHamburger={() => setDrawerOpen(true)} />
          <main className="ax-content">{children}</main>
        </div>

        {openMenu && <div className="ax-menu-backdrop" onClick={() => setOpenMenu(null)} />}
      </div>
    </PropertiesProvider>
  );
}
