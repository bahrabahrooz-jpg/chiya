"use client";

import { ADMIN } from "@/components/admin";
import { useLang } from "@/lib/i18n";

export function WelcomeHeader() {
  const { t } = useLang();
  return (
    <header className="ax-welcome">
      <div className="ax-welcome__intro">
        <h1 className="ax-welcome__greeting">
          {t("admin.dash.hello", { name: ADMIN.first })}
          <span className="ax-welcome__wave" role="img" aria-label={t("admin.dash.wave")}>
            👋
          </span>
        </h1>
        <p className="ax-welcome__sub">{t("admin.dash.welcomeSub")}</p>
      </div>
    </header>
  );
}
