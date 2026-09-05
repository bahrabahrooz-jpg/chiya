"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

/**
 * 404 inside the agent console — same reason the admin has its own: without it
 * the public site's header and footer render inside the agent shell.
 */
export default function AgentNotFound() {
  const { t } = useLang();
  return (
    <div className="ax-empty">
      <div className="ax-empty__art">
        <Icon name="file-question" size={44} strokeWidth={1.5} />
      </div>
      <h2>{t("admin.err.404.title")}</h2>
      <p>{t("admin.err.404.body")}</p>
      <div className="ax-empty__actions">
        <Button href="/agent" hierarchy="primary" size="lg" iconLeading="layout-dashboard">
          {t("admin.err.back")}
        </Button>
      </div>
    </div>
  );
}
