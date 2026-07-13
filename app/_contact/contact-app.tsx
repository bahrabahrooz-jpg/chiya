"use client";

import { useState, type FormEvent } from "react";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Card } from "@/components/data";
import { toast } from "@/components/feedback/toast";
import { useLang } from "@/lib/i18n";
import "./contact.css";

/**
 * ContactApp — the public "Contact Chiya" page: a message form paired with the
 * company's contact channels. The form is a client-side demo (no backend yet):
 * on submit it validates required fields and surfaces a success toast. Copy is
 * i18n-driven (en/ar).
 */
export function ContactApp() {
  const { t } = useLang();
  const [sending, setSending] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    // No contact backend yet — simulate the round-trip and confirm receipt.
    setTimeout(() => {
      setSending(false);
      (e.target as HTMLFormElement).reset();
      toast({ title: t("contact.toast.sent"), variant: "success" });
    }, 700);
  }

  return (
    <>
      <InteriorHeader active="contact" />
      <main className="cxct">
        <section className="cxct-hero">
          <div className="cxct-container">
            <span className="cxct-hero__eyebrow">{t("contact.hero.eyebrow")}</span>
            <h1 className="cxct-hero__title">{t("contact.hero.title")}</h1>
            <p className="cxct-hero__sub">{t("contact.hero.sub")}</p>
          </div>
        </section>

        <section className="cxct-body">
          <div className="cxct-container cxct-body__grid">
            <div className="cxct-formcard">
              <form className="cxct-form" onSubmit={handleSubmit}>
                <Input
                  id="ct-name"
                  name="name"
                  label={t("contact.form.name")}
                  placeholder={t("contact.form.namePh")}
                  required
                />
                <Input
                  id="ct-email"
                  name="email"
                  type="email"
                  label={t("contact.form.email")}
                  placeholder={t("contact.form.emailPh")}
                  required
                />
                <Input
                  id="ct-subject"
                  name="subject"
                  label={t("contact.form.subject")}
                  placeholder={t("contact.form.subjectPh")}
                  required
                />
                <Textarea
                  id="ct-message"
                  name="message"
                  label={t("contact.form.message")}
                  placeholder={t("contact.form.messagePh")}
                  rows={5}
                  required
                />
                <Button type="submit" size="lg" iconTrailing="send" loading={sending}>
                  {sending ? t("contact.form.sending") : t("contact.form.submit")}
                </Button>
              </form>
            </div>

            <aside className="cxct-info">
              <div className="cxct-info__cards">
                <Card hoverable className="cxct-card">
                  <div className="cxct-card__body">
                    <span className="cxct-card__ic">
                      <Icon name="mail" size={20} />
                    </span>
                    <h3 className="cxct-card__title">{t("contact.info.email.label")}</h3>
                    <a className="cxct-card__link" href={`mailto:${t("contact.info.email.value")}`} dir="ltr">
                      {t("contact.info.email.value")}
                    </a>
                  </div>
                </Card>

                <Card hoverable className="cxct-card">
                  <div className="cxct-card__body">
                    <span className="cxct-card__ic">
                      <Icon name="phone" size={20} />
                    </span>
                    <h3 className="cxct-card__title">{t("contact.info.phone.label")}</h3>
                    <a
                      className="cxct-card__link"
                      href={`tel:+${t("contact.info.phone.value").replace(/\D/g, "")}`}
                      dir="ltr"
                    >
                      {t("contact.info.phone.value")}
                    </a>
                  </div>
                </Card>

                <Card hoverable className="cxct-card cxct-card--wide">
                  <div className="cxct-card__body">
                    <span className="cxct-card__ic">
                      <Icon name="map-pin" size={20} />
                    </span>
                    <h3 className="cxct-card__title">{t("contact.info.office.label")}</h3>
                    <p className="cxct-card__text">{t("contact.info.office.value")}</p>
                  </div>
                </Card>

                <Card hoverable className="cxct-card cxct-card--wide">
                  <div className="cxct-card__body">
                    <span className="cxct-card__ic">
                      <Icon name="clock" size={20} />
                    </span>
                    <h3 className="cxct-card__title">{t("contact.info.hours.label")}</h3>
                    <p className="cxct-card__text">{t("contact.info.hours.value")}</p>
                  </div>
                </Card>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
