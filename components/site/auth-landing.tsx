"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { EmptyState } from "@/components/data";
import { Button } from "@/components/ui/button";
import { openAuth, useAuth, type AuthMode } from "@/lib/auth";
import { useLang } from "@/lib/i18n";

/**
 * AuthLandingPage — backing page for the /login and /register routes. Auth is a
 * modal in Chiya, so this opens it on arrival (and offers a button to reopen if
 * dismissed). Already-signed-in users just see a friendly confirmation.
 */
export function AuthLandingPage({ mode }: { mode: AuthMode }) {
  const { user } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  useEffect(() => {
    openAuth(mode);
  }, [mode]);

  const signedOut = !user;
  return (
    <>
      <InteriorHeader />
      <main style={{ minHeight: "62vh", display: "flex", alignItems: "center" }}>
        <div className="cx-container" style={{ maxWidth: 680, marginInline: "auto", padding: "72px 24px" }}>
          {signedOut ? (
            <EmptyState
              icon={mode === "login" ? "log-in" : "user-plus"}
              title={mode === "login" ? t("auth.landing.loginTitle") : t("auth.landing.registerTitle")}
              description={t("auth.landing.desc")}
              action={
                <Button hierarchy="primary" iconLeading={mode === "login" ? "log-in" : "user-plus"} onClick={() => openAuth(mode)}>
                  {mode === "login" ? t("auth.landing.login") : t("auth.landing.create")}
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="circle-check"
              title={`${t("auth.landing.signedIn")} ${user.name.split(" ")[0]}`}
              description={t("auth.landing.browse")}
              action={
                <Button hierarchy="secondary" iconLeading="arrow-left" onClick={() => router.push("/")}>
                  {t("ph.backHome")}
                </Button>
              }
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
