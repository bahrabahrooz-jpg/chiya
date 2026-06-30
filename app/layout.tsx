import type { Metadata } from "next";
import {
  Cairo,
  Cormorant_Garamond,
  Hanken_Grotesk,
  IBM_Plex_Mono,
  Noto_Sans_Arabic,
} from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { LANG_INIT_SCRIPT } from "@/lib/i18n";
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

/* Arabic / Kurdish (RTL) — Cairo display + Noto Sans Arabic UI */
const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
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
      className={`${hanken.variable} ${cormorant.variable} ${plexMono.variable} ${cairo.variable} ${notoArabic.variable}`}
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
