"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { MESSAGING_SECTIONS, type MessagingSectionId } from "./data";
import { LogSection } from "./log-section";
import { TemplatesSection } from "./templates-section";
import { WhatsAppSection } from "./whatsapp-section";

/* ============================================================================
   Messaging — the hub for everything the platform says to tenants and landlords.

   THE SHELL IS THE SETTINGS SCREEN'S, class for class: the same st-split, the
   same sx-nav card down the left, the same title-only section head. A person
   who has used Settings or Content has used this. Only the three panes differ.

   WHY IT IS ITS OWN DESTINATION AND NOT A SETTINGS SECTION. Two of the three
   panes are configuration and would sit happily under Settings; the third is a
   log, and a log is read, not set. The house placement rule says config goes in
   Settings and operational evidence goes in the sidebar (see the Audit log) —
   and this screen's daily job is the log. Putting the log behind Settings would
   bury the one question the feature exists to answer.

   ⚠ NOT the same thing as Messages (/admin/messages). That is the INBOX —
   enquiries strangers send us from the website's contact form. This is the
   OUTBOX — what we say to the two people on a contract, on a schedule. They
   sit in different sidebar groups for exactly that reason.
   ========================================================================== */

export function MessagingApp() {
  const { t } = useLang();
  const [active, setActive] = useState<MessagingSectionId>("log");

  /* The pane heading is the nav item's own label — one copy, so the two cannot
     drift. Same arrangement as Settings. */
  const headLabelKey = MESSAGING_SECTIONS.find((s) => s.id === active)?.labelKey ?? "admin.wa.pageTitle";

  return (
    <>
      <div className="pf-head wa-head">
        <div className="pf-head__intro">
          <h1 className="pf-head__title">{t("admin.wa.pageTitle")}</h1>
          <p className="pf-head__sub">{t("admin.wa.pageSub")}</p>
        </div>
      </div>

      <div className="st-split">
        <nav className="st-nav sx-nav" aria-label={t("admin.wa.pageTitle")}>
          <div className="sx-navgroup">
            {MESSAGING_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={"st-navitem sx-navitem" + (active === s.id ? " is-active" : "")}
                onClick={() => setActive(s.id)}
                aria-current={active === s.id}
              >
                <span className="st-navitem__icon">
                  <Icon name={s.icon} size={18} />
                </span>
                <span className="st-navitem__body">
                  <span className="st-navitem__label">{t(s.labelKey)}</span>
                  <span className="st-navitem__desc">{t(s.descKey)}</span>
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="st-detail">
          <div className="sx-sectionhead">
            <h2 className="sx-sectionhead__title">{t(headLabelKey)}</h2>
          </div>

          {active === "log" && <LogSection />}
          {active === "templates" && <TemplatesSection />}
          {active === "whatsapp" && <WhatsAppSection />}
        </div>
      </div>
    </>
  );
}
