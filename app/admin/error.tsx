"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

/**
 * Crash screen inside the admin.
 *
 * The retry prop is `unstable_retry`, not `reset` — renamed in this version of
 * Next, and the old name compiles to an undefined function rather than an
 * error. See the note in app/error.tsx.
 *
 * The digest is shown because this audience can act on it: staff reporting a
 * broken screen with a reference is the difference between a fixable report and
 * "it didn't work".
 */
export default function AdminError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const { t } = useLang();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="ax-empty">
      <div className="ax-empty__art">
        <Icon name="triangle-alert" size={44} strokeWidth={1.5} />
      </div>
      <h2>{t("admin.err.500.title")}</h2>
      <p>{t("admin.err.500.body")}</p>
      <div className="ax-empty__actions">
        <Button hierarchy="primary" size="lg" iconLeading="rotate-cw" onClick={() => unstable_retry()}>
          {t("err.500.retry")}
        </Button>
        <Button href="/admin" hierarchy="secondary" size="lg" iconLeading="layout-dashboard">
          {t("admin.err.back")}
        </Button>
      </div>
      {error.digest && <div className="ax-empty__hint">{t("err.500.ref", { digest: error.digest })}</div>}
    </div>
  );
}
