"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar, AdminTopbar, activeNavId, type MenuId } from "@/components/admin";
import "@/components/admin/admin-shell.css";

function categoryFor(w: number) {
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const active = activeNavId(pathname);

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

  return (
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
  );
}
