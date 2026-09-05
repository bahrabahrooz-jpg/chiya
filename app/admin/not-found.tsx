"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

/**
 * 404 inside the admin.
 *
 * Separate from the site's so it renders in the admin's own chrome. Without it
 * the root not-found takes over and puts the public website's header and footer
 * inside the admin shell — two navigations on one screen.
 *
 * Reached by a bad receipt id (/admin/receipts/[kind]/[id] throws notFound())
 * and by any mistyped admin address. Uses the shell's ax-empty pattern, the
 * same one behind the agent's Settings placeholder.
 */
export default function AdminNotFound() {
  const { t } = useLang();
  return (
    <div className="ax-empty">
      <div className="ax-empty__art">
        <Icon name="file-question" size={44} strokeWidth={1.5} />
      </div>
      <h2>{t("admin.err.404.title")}</h2>
      <p>{t("admin.err.404.body")}</p>
      <div className="ax-empty__actions">
        <Button href="/admin" hierarchy="primary" size="lg" iconLeading="layout-dashboard">
          {t("admin.err.back")}
        </Button>
      </div>
    </div>
  );
}
