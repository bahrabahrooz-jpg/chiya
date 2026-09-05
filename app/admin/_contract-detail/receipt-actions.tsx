"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { LANGS, translate, useLang, type Lang } from "@/lib/i18n";

/* ============================================================================
   Print and download a receipt WITHOUT LEAVING THE CONTRACT.

   The papers used to be links: press one and the console navigated to the
   receipt screen, where you picked a language and pressed Print, then walked
   back. Three screens for a thing that happens at a counter with somebody
   standing there waiting — and the receipt row read as a row you open rather
   than as a document you hand over.

   ⚠ EACH CONTROL IS TWO CONTROLS, AND THE SPLIT IS THE WHOLE POINT. The label
   half does the ordinary thing; the caret half is a shortcut past it. They were
   one button that only opened a menu, which meant the clerk who just wanted the
   paper had to answer a question before getting it, and there was no way at all
   to reach the sheet itself any more.

     Print  → opens the receipt screen, where the sheet is on screen, the three
              languages sit across the top and Print is a button. That is where
              you go when you want to LOOK at the paper before it comes out.
     Print ⌄ → the three languages, and picking one prints that copy on the spot,
              from this row, without the screen ever changing.

   Download works the same way except that its label half needs no screen: there
   is nothing to preview in a file, so it saves the sheet in the console's own
   language immediately, and the caret is there for the copy that has to be in
   somebody else's.

   ⚠ THE LANGUAGE IS THE POINT OF THE MENU, not a setting. The tenant reads
   Kurdish whether or not the clerk's console does, and the same payment is
   handed to a landlord who may read Arabic. So the language is chosen at the
   moment of printing, per copy, and it is named IN ITSELF in the menu — a
   Kurdish tenant should not have to find the word "Kurdish" written in English
   first. Nothing here changes the console.

   HOW IT PRINTS. The receipt page is loaded into an off-screen iframe at the
   language that was picked and printed from there, so the browser lays out the
   real sheet — the same route, the same stylesheet, the same two copies with
   the cut line between them. Rendering a second copy of that layout here would
   be a second thing to keep in step with the first.

   HOW IT DOWNLOADS. There is no PDF writer in this app and no print service
   behind it, so a download is the sheet itself: one self-contained HTML file
   with the styles folded in, which opens and prints anywhere and carries its
   own language and direction. Calling it a PDF when it is not is the kind of
   small lie that costs somebody an afternoon.
   ========================================================================== */

type Job = { lang: Lang; action: "print" | "download" };

export function ReceiptActions({
  href,
  fileStem,
  /* WHICH ELEMENT ON THE LOADED PAGE IS THE PAPER. Receipts are ".rc-sheet";
     the contract document is ".cd-sheet". It was hardcoded while receipts were
     the only caller, so pointing this at the contract printed correctly and
     downloaded an empty file — the one failure mode a download must never
     have. Named per caller rather than sniffed, because a page with no sheet
     at all is a bug, not a default. */
  sheet = ".rc-sheet",
}: {
  href: string;
  fileStem: string;
  sheet?: string;
}) {
  const { t, lang: uiLang } = useLang();
  const frame = useRef<HTMLIFrameElement>(null);
  const job = useRef<Job | null>(null);
  const [menu, setMenu] = useState<Job["action"] | null>(null);
  const [busy, setBusy] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  /* A menu that stays open behind the sheet you just printed is a menu nobody
     closed. Escape and a click elsewhere both put it away. */
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [menu]);

  /* useCallback because the body reads the clock: React's purity rule will not
     have an impure call in a function declared bare in the render body, since
     it cannot tell that this one only ever runs from a click. */
  const start = useCallback(
    (action: Job["action"], lang: Lang) => {
      setMenu(null);
      setBusy(true);
      job.current = { lang, action };
      /* Re-pointed every time, cache-busted, so picking Arabic straight after
         English reloads the sheet instead of reprinting the one already there. */
      if (frame.current) frame.current.src = `${href}?lang=${lang}&t=${Date.now()}`;
    },
    [href],
  );

  const onFrameLoad = useCallback(() => {
    const pending = job.current;
    const win = frame.current?.contentWindow;
    if (!pending || !win) return;
    job.current = null;

    /* WAIT FOR THE SHEET, don't guess at a delay. The receipt reads the
       contracts store, which hydrates from localStorage in an effect after
       mount — so at `load` the frame is often still empty, and a fixed pause
       either prints a blank page on a slow machine or makes everyone wait on a
       fast one. Poll for the sheet and act the moment it exists; give up
       quietly after a few seconds rather than printing nothing. */
    const started = Date.now();
    const tick = () => {
      const found = win.document.querySelector(sheet);
      if (!found) {
        if (Date.now() - started > 5000) setBusy(false);
        else window.setTimeout(tick, 60);
        return;
      }
      try {
        if (pending.action === "print") {
          win.focus();
          win.print();
        } else {
          downloadSheet(win.document, pending.lang, fileStem, sheet);
        }
      } finally {
        setBusy(false);
      }
    };
    tick();
  }, [fileStem, sheet]);

  /* The caret half. It is never the label's own dropdown arrow — it is a second
     button with its own hit area, its own focus ring and its own name, because
     it does a different thing from the half beside it. */
  const caret = (action: Job["action"], label: string) => (
    <>
      <button
        type="button"
        className={"ctd-rcpt__caretbtn" + (menu === action ? " is-open" : "")}
        aria-haspopup="menu"
        aria-expanded={menu === action}
        aria-label={label}
        title={label}
        disabled={busy}
        onClick={() => setMenu((m) => (m === action ? null : action))}
      >
        <Icon name="chevron-down" size={13} />
      </button>
      {menu === action && (
        <div className="ctd-rcpt__menu" role="menu">
          <span className="ctd-rcpt__menuhead">{t("admin.ct.rcpt.inLanguage")}</span>
          {LANGS.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitem"
              lang={code}
              className={"ctd-rcpt__lang" + (code === uiLang ? " is-current" : "")}
              onClick={() => start(action, code)}
            >
              {translate(code, "lang." + code)}
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="ctd-rcpt__actions" ref={wrap}>
      {/* PRINT — the label half goes to the paper. The receipt screen shows the
          sheet with the three languages across the top and its own Print
          button, which is the older, slower, look-first route and the one
          somebody wants when they are not sure what they are about to hand
          over. It stays a link so it middle-clicks and opens in a tab. */}
      <div className="ctd-rcpt__split">
        <Link href={href} className="ctd-rcpt__btn">
          <Icon name="printer" size={15} />
          {t("admin.ct.rcpt.print")}
        </Link>
        {caret("print", t("admin.ct.rcpt.printLang"))}
      </div>

      {/* DOWNLOAD — nothing to preview, so the label half saves the file at
          once, in the language the console is already in. */}
      <div className="ctd-rcpt__split">
        <button type="button" className="ctd-rcpt__btn" disabled={busy} onClick={() => start("download", uiLang)}>
          <Icon name="download" size={15} />
          {t("admin.ct.rcpt.download")}
        </button>
        {caret("download", t("admin.ct.rcpt.downloadLang"))}
      </div>

      {/* Off-screen rather than display:none — a frame that is not laid out has
          nothing for the browser to print. */}
      <iframe ref={frame} onLoad={onFrameLoad} className="ctd-rcpt__frame" title="" aria-hidden="true" tabIndex={-1} />
    </div>
  );
}

/**
 * The sheet, on its own, as a file.
 *
 * Only `.rc-sheet` travels: the console's shell, the toolbar and the back link
 * are furniture around the paper, not the paper. The page's own CSS is read out
 * of the loaded document and inlined, so the file opens with its layout intact
 * on a machine that has never seen this app.
 */
function downloadSheet(doc: Document, lang: Lang, fileStem: string, selector: string) {
  const sheet = doc.querySelector(selector);
  if (!sheet) return;

  let css = "";
  for (const styles of Array.from(doc.styleSheets)) {
    try {
      css += Array.from(styles.cssRules)
        .map((rule) => rule.cssText)
        .join("\n");
    } catch {
      /* A stylesheet from another origin cannot be read. There are none in this
         app; if one ever appears, the file simply loses those rules rather than
         failing to save. */
    }
  }

  const html = `<!doctype html>
<html lang="${lang}" dir="${doc.documentElement.dir || "ltr"}">
<head><meta charset="utf-8"><title>${fileStem}</title><style>${css}</style></head>
<body class="rc-page">${sheet.outerHTML}</body>
</html>`;

  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileStem}-${lang}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* Freed on the next tick — revoking it before the click has been handled
     cancels the save in Safari. */
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
