"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

/** Crash screen inside the agent console. The retry prop is `unstable_retry`,
    not `reset` — see the note in app/error.tsx. */
export default function AgentError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
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
        <Button href="/agent" hierarchy="secondary" size="lg" iconLeading="layout-dashboard">
          {t("admin.err.back")}
        </Button>
      </div>
      {error.digest && <div className="ax-empty__hint">{t("err.500.ref", { digest: error.digest })}</div>}
    </div>
  );
}
