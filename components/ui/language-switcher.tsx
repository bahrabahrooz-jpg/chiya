"use client";

import { useRef, useState } from "react";
import { LANGS, LANG_READY, useLang, type Lang } from "@/lib/i18n";
import { useClickOutside } from "@/lib/use-click-outside";
import { Icon } from "./icon";
import "./language-switcher.css";

export interface LanguageSwitcherProps {
  variant?: "footer" | "glass";
  /** Open the dropdown above the trigger — for triggers near the bottom of a panel (e.g. mobile nav footer). */
  dropUp?: boolean;
  className?: string;
}

const SHORT: Record<Lang, string> = { en: "EN", ar: "AR", ku: "KU" };

/**
 * LanguageSwitcher — globe trigger + dropdown bound to the i18n engine.
 * Switching updates <html dir/lang> (RTL flips automatically). `footer` and
 * `glass` variants restyle for dark bands / hero overlays.
 */
export function LanguageSwitcher({ variant, dropUp, className = "" }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div
      ref={ref}
      className={["cx-langsw", variant ? `cx-langsw--${variant}` : "", dropUp ? "cx-langsw--up" : "", className]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="cx-langsw__trigger"
        aria-expanded={open}
        aria-label="Switch language"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="globe" size={variant === "footer" ? 15 : 16} />
        <span className="cx-langsw__code">{variant === "footer" ? t("footer.lang") : SHORT[lang]}</span>
      </button>
      {open && (
        <div className="cx-langsw__drop" role="menu">
          {LANGS.map((l) => (
            <button
              key={l}
              type="button"
              role="menuitemradio"
              aria-checked={lang === l}
              className={"cx-langsw__opt" + (lang === l ? " cx-langsw__opt--sel" : "")}
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
            >
              <span>{t("lang." + l)}</span>
              {!LANG_READY[l] && <span className="cx-langsw__soon">{t("lang.soon")}</span>}
              {lang === l && <Icon name="check" size={14} className="cx-langsw__check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
