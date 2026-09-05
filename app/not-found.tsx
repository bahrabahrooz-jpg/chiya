"use client";

import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { useLang } from "@/lib/i18n";
import { Button, ErrorScreen } from "./_error/error-screen";

/**
 * The public site's 404.
 *
 * Reached two ways: an address that matches nothing, and notFound() thrown by
 * /property/[id] or /agents/[id] — which is the common one. Only Published
 * listings have a detail page, so every time a property is sold, archived or
 * unpublished, its link goes dead everywhere it was ever shared. In a market
 * where listings travel by WhatsApp that is not an edge case, it is Tuesday.
 *
 * So this page assumes the visitor did nothing wrong and was probably looking
 * at a specific flat: it says the listing may be gone rather than blaming the
 * address, and it offers the search page, because somebody who wanted one home
 * usually still wants a home.
 */
export default function NotFound() {
  const { t } = useLang();
  return (
    <>
      <InteriorHeader />
      <ErrorScreen icon="map-pin-off" code={t("err.404.code")} title={t("err.404.title")} body={t("err.404.body")}>
        <Button href="/search" hierarchy="primary" size="lg" iconLeading="search">
          {t("err.404.browse")}
        </Button>
        <Button href="/" hierarchy="secondary" size="lg" iconLeading="house">
          {t("err.404.home")}
        </Button>
      </ErrorScreen>
      <Footer />
    </>
  );
}
