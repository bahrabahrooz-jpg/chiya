"use client";

import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";

interface CtaCard {
  icon: IconName;
  key: "find" | "agent" | "list";
  href: string;
}

const CARDS: CtaCard[] = [
  { icon: "search", key: "find", href: "/search" },
  { icon: "messages-square", key: "agent", href: "/agents" },
  { icon: "key", key: "list", href: "/contact" },
];

/** Premium CTA — the closing call-to-action band. */
export function PremiumCta() {
  const { t } = useLang();
  return (
    <section className="cxk-cta">
      <div className="cxk-cta__inner">
        <h2 className="cxk-cta__title">{t("cta.title")}</h2>
        <p className="cxk-cta__sub">{t("cta.sub")}</p>
        <div className="cxk-cta__grid">
          {CARDS.map((c) => (
            <div key={c.key} className="cxcta-card">
              <span className="cxcta-card__ic">
                <Icon name={c.icon} size={24} />
              </span>
              <h3 className="cxcta-card__title">{t(`cta.${c.key}.title`)}</h3>
              <p className="cxcta-card__desc">{t(`cta.${c.key}.desc`)}</p>
              <Link className="cxcta-card__btn" href={c.href}>
                {t(`cta.${c.key}.cta`)}
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
