"use client";

import { useEffect } from "react";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { useLang } from "@/lib/i18n";
import { Button, ErrorScreen } from "./_error/error-screen";

/**
 * The public site's crash screen.
 *
 * NOTE FOR WHOEVER TOUCHES THIS NEXT: the retry prop is `unstable_retry`, not
 * `reset`. This version of Next renamed it, and the old name compiles fine and
 * silently gives you an undefined function — a "Try again" button that does
 * nothing. Check node_modules/next/dist/docs before changing the signature.
 *
 * `error.message` is only the real message in development; in production a
 * server-side error arrives generic, with `digest` as the handle to match it to
 * the server log. That digest is the one useful thing here, so it is shown —
 * quietly, as a reference number, because it means nothing to the visitor but
 * everything to whoever they report the problem to.
 */
export default function SiteError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const { t } = useLang();

  useEffect(() => {
    // No error service wired up in this build; the console is the log.
    console.error(error);
  }, [error]);

  return (
    <>
      <InteriorHeader />
      <ErrorScreen
        icon="triangle-alert"
        title={t("err.500.title")}
        body={t("err.500.body")}
        reference={error.digest ? t("err.500.ref", { digest: error.digest }) : undefined}
      >
        <Button hierarchy="primary" size="lg" iconLeading="rotate-cw" onClick={() => unstable_retry()}>
          {t("err.500.retry")}
        </Button>
        <Button href="/" hierarchy="secondary" size="lg" iconLeading="house">
          {t("err.500.home")}
        </Button>
      </ErrorScreen>
      <Footer />
    </>
  );
}
