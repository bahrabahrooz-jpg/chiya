import type { Metadata } from "next";
import {
  Amiri,
  Cormorant_Garamond,
  Hanken_Grotesk,
  IBM_Plex_Mono,
  Noto_Sans_Arabic,
} from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
// From ./config, not the "use client" barrel: importing it from there makes this
// a client reference that Flight resolves back to a string during SSR, rather
// than a plain server-evaluated constant. Also keeps the catalogs out of the
// root layout's graph.
import { LANG_INIT_SCRIPT } from "@/lib/i18n/config";
import { Toaster } from "@/components/feedback/toast";
import { AuthModalHost } from "@/components/site/auth-modal";
import "./globals.css";

/* Display — luxury serif (headings, property names, prices-as-hero) */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

/* UI / body — premium grotesk */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
  display: "swap",
});

/* Data / IDs — tabular mono */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
});

/* Arabic / Kurdish (RTL) — Amiri display + Noto Sans Arabic UI.
   Amiri, not Cairo: Cairo has no glyphs for the Kurdish-only letters (ڕ ڵ ۆ ێ ە),
   so Sorani headings fell back per-glyph and lost their cursive joins. Amiri covers
   Sorani, and its Naskh serif mirrors Cormorant's role on the Latin side — it's also
   what the mobile app uses (apps/mobile/theme/tokens.ts). Ships 400/700 only, so the
   600 headings resolve upward to 700. */
const amiri = Amiri({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});
const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-noto-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chiya Estate — Luxury Real Estate in Kurdistan",
  description:
    "Chiya Estate connects buyers, renters, owners, and verified agents through a premium real estate experience across the Kurdistan Region of Iraq.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${hanken.variable} ${cormorant.variable} ${plexMono.variable} ${amiri.variable} ${notoArabic.variable}`}
    >
      <head>
        {/* Pre-paint init — set theme + direction before first paint (no flash) */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Toaster />
        <AuthModalHost />
      </body>
    </html>
  );
}
