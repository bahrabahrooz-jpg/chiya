"use client";

import { useLang } from "@/lib/i18n";
import { Icon } from "@/components/ui/icon";
import "./footer.css";

export interface FooterLink {
  label: string;
  href?: string;
}
export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}
export interface FooterContact {
  icon: import("@/components/ui/icon").IconName;
  text: string;
}

export interface FooterProps {
  columns?: FooterColumn[];
  contact?: FooterContact[];
}

type T = (key: string) => string;
const defaultColumns = (t: T): FooterColumn[] => [
  {
    heading: t("footer.col.properties"),
    links: [
      { label: t("footer.col.buy") },
      { label: t("footer.col.rent") },
      { label: t("footer.col.luxury") },
      { label: t("footer.col.featured") },
      { label: t("footer.col.commercial") },
    ],
  },
  {
    heading: t("footer.col.agents"),
    links: [{ label: t("footer.col.findAgent") }, { label: t("footer.col.verified") }, { label: t("footer.col.joinAgent") }],
  },
  {
    heading: t("footer.col.company"),
    links: [{ label: t("footer.col.about") }, { label: t("footer.col.blog") }, { label: t("footer.col.faq") }, { label: t("footer.col.contact") }],
  },
];

const DEFAULT_CONTACT: FooterContact[] = [
  { icon: "map-pin", text: "100 Meter Road, Erbil, Kurdistan" },
  { icon: "phone", text: "+964 750 000 0000" },
  { icon: "mail", text: "hello@chiyaestate.com" },
];

// Brand glyphs as inline SVG (lucide dropped brand icons) — from the export.
const SOCIAL: { label: string; path: string; size: number }[] = [
  {
    label: "LinkedIn",
    size: 18,
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z",
  },
  {
    label: "Instagram",
    size: 18,
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.62c-3.15 0-3.52.01-4.76.07-1.15.05-1.77.24-2.19.41-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.17.42-.36 1.04-.41 2.19-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.05 1.15.24 1.77.41 2.19.21.55.47.94.88 1.35.41.41.8.67 1.35.88.42.17 1.04.36 2.19.41 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c1.15-.05 1.77-.24 2.19-.41.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.17-.42.36-1.04.41-2.19.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.05-1.15-.24-1.77-.41-2.19a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.42-.17-1.04-.36-2.19-.41-1.24-.06-1.61-.07-4.76-.07Zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6Zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36Zm5.48-1.62a1.24 1.24 0 1 1 0 2.48 1.24 1.24 0 0 1 0-2.48Z",
  },
  {
    label: "Facebook",
    size: 18,
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z",
  },
];

/**
 * Footer — the global site footer: brand lockup, contact, social, link
 * columns, and a bottom bar with the language switcher + legal links.
 */
export function Footer({ columns, contact = DEFAULT_CONTACT }: FooterProps) {
  const { t } = useLang();
  const cols = columns ?? defaultColumns(t);
  return (
    <footer className="cx-footer">
      <div className="cx-footer__inner">
        <div className="cx-footer__brand">
          <span className="cx-footer__brandlockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="cx-footer__symbol" src="/brand/chiya-symbol-white.svg" alt="" />
            <span className="cx-footer__name">Chiya</span>
          </span>
          <p>{t("footer.tagline")}</p>
          <ul className="cx-footer__contact">
            {contact.map((c) => (
              <li key={c.text}>
                <Icon name={c.icon} size={16} />
                <span>{c.text}</span>
              </li>
            ))}
          </ul>
          <div className="cx-footer__social">
            {SOCIAL.map(({ label, path, size }) => (
              <a key={label} href="#" aria-label={label}>
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="cx-footer__cols">
          {cols.map((col) => (
            <div key={col.heading} className="cx-footer__col">
              <h4>{col.heading}</h4>
              {col.links.map((l) => (
                <a key={l.label} href={l.href || "#"}>
                  {l.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="cx-footer__bar">
        <span>{t("footer.copyright")}</span>
      </div>
    </footer>
  );
}
