"use client";

import { useLang } from "@/lib/i18n";
import "./globals.css";

/**
 * Last resort — the root layout itself failed.
 *
 * This REPLACES app/layout.tsx when it fires, so nothing that layout provides
 * exists here: no fonts, no theme/direction init script, no <Toaster>. It has
 * to bring its own <html> and <body> and its own stylesheet, which is why this
 * is plainer than app/error.tsx and deliberately stays that way — a fallback
 * with dependencies is a fallback that can fail too.
 *
 * useLang works without a provider (it reads localStorage through an external
 * store), so the text is still in the visitor's language and the direction is
 * still right, which is the part that matters most in Arabic and Kurdish.
 *
 * No metadata export is possible in an error boundary; React's <title> is the
 * documented way, and it is used below.
 */
export default function GlobalError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  const { t, lang, dir } = useLang();
  return (
    <html lang={lang} dir={dir}>
      <body>
        <title>{t("err.500.title")}</title>
        <main className="nfg-main">
          <h1 className="nfg-title">{t("err.500.title")}</h1>
          <p className="nfg-body">{t("err.500.body")}</p>
          <button type="button" className="nfg-btn" onClick={() => unstable_retry()}>
            {t("err.500.retry")}
          </button>
          {error.digest && <p className="nfg-ref">{t("err.500.ref", { digest: error.digest })}</p>}
        </main>
        {/* Inline because a stylesheet is one more thing that can be the reason
            we are on this page at all. Tokens still resolve — globals.css is
            imported above — with literal fallbacks if even that failed. */}
        <style>{`
          .nfg-main {
            min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 12px;
            padding: 40px 24px; text-align: center;
            background: var(--surface-page, #FBFAF8); color: var(--text-primary, #1A1D1B);
            font-family: var(--font-sans, system-ui, sans-serif);
          }
          .nfg-title {
            margin: 0; font-family: var(--font-display, Georgia, serif);
            font-size: 30px; line-height: 38px; font-weight: 600;
          }
          .nfg-body { margin: 0; max-width: 460px; font-size: 16px; line-height: 24px; color: var(--text-secondary, #55605A); }
          .nfg-btn {
            margin-top: 12px; height: 44px; padding: 0 22px; border: 0; cursor: pointer;
            border-radius: var(--radius-control, 8px);
            background: var(--brand-primary, #2E6B4F); color: var(--text-on-brand, #FFF);
            font-family: inherit; font-size: 15px; font-weight: 600;
          }
          .nfg-btn:focus-visible { outline: 2px solid var(--border-focus, #2E6B4F); outline-offset: 2px; }
          .nfg-ref { margin: 20px 0 0; font-family: var(--font-mono, ui-monospace, monospace); font-size: 12px; color: var(--text-tertiary, #7A857F); word-break: break-all; }
        `}</style>
      </body>
    </html>
  );
}
