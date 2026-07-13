"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

interface CtaAction {
  icon: IconName;
  key: "find" | "agent" | "list";
  href: string;
}

const ACTIONS: CtaAction[] = [
  { icon: "search", key: "find", href: "/search" },
  { icon: "messages-square", key: "agent", href: "/agents" },
  { icon: "house-plus", key: "list", href: "/my-listings/new" },
];

/** Premium CTA — the closing call-to-action band: headline over a dimmed photo,
    with the primary action + two secondary links as pill buttons (no cards). */
export function PremiumCta() {
  const { t } = useLang();
  return (
    <section className="cxk-cta">
      <div className="cxk-cta__inner">
        <h2 className="cxk-cta__title">{t("cta.title")}</h2>
        <p className="cxk-cta__sub">{t("cta.sub")}</p>
        <div className="cxk-cta__actions">
          {ACTIONS.map((a) => (
            <Link
              key={a.key}
              className="cxk-cta__btn cxk-cta__btn--outline"
              href={a.href}
            >
              <Icon name={a.icon} size={18} />
              {t(`cta.${a.key}.cta`)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
