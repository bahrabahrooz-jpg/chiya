"use client";

import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export default function AdminSettingsPage() {
  const { t } = useLang();
  return (
    <div className="ax-empty">
      <div className="ax-empty__art">
        <Icon name="settings" size={44} strokeWidth={1.5} />
        <span className="ax-empty__badge">
          <Icon name="wrench" size={20} strokeWidth={2.25} />
        </span>
      </div>
      <h2>{t("admin.settings.title")}</h2>
      <p>{t("admin.settings.body")}</p>
      <div className="ax-empty__actions">
        <Button href="/admin" hierarchy="primary" size="lg" iconLeading="layout-dashboard">
          {t("admin.settings.back")}
        </Button>
      </div>
    </div>
  );
}
