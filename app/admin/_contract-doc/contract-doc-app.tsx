"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { LANGS, translate, useLang, type Lang } from "@/lib/i18n";
import { useContracts } from "../_shared/contracts-store";
import { ContractSheet } from "./contract-sheet";

/* =============================================================================
   THE CONTRACT, ON PAPER — the print page.

   The Print button on the contract page had been disabled since that screen was
   written — `TODO(contract print/PDF task): no document is rendered yet`. This
   is the document.

   ⚠ THIS IS NOT A REVIEWED LEGAL TEMPLATE, AND IT DOES NOT PRETEND TO BE.

   The data layer models the clause VARIABLES — a late-rent rate, a notice
   period, a vacate date — and says in as many words that the wording they are
   interpolated into "is fixed legal wording and is pending legal review". That
   note is correct, and inventing the wording here would be the worst way to
   resolve it: plausible-looking legal prose nobody qualified has read, printed
   on a page two people sign.

   So the document states the terms that were AGREED, plainly and accurately,
   under a heading that says that is what they are. Every figure on it is real
   and comes off the record. When the reviewed wording arrives it drops into
   `Clauses` in contract-sheet.tsx and nothing else has to move.

   ONE DOCUMENT, NOT A TWO-COPY SHEET. A receipt is half a page, so two fit on
   one sheet with a cut line between them. A contract runs to a full page and
   every party signs the SAME text, so it prints once and you take as many
   copies as there are signatories. There is deliberately no "tenant's copy"
   here: a contract that says something different to each side is not one.

   THE SHEET ITSELF LIVES IN contract-sheet.tsx. It moved out the day the
   contract FORM started showing the same paper filling in as the questions are
   answered — see the header note there. What is left in this file is the
   screen furniture around it: the back link, the language picker, the print
   button and the pending-review note, none of which belongs on the paper.
   ========================================================================== */

export function ContractDocApp({ id }: { id: string }) {
  /* `ui` dresses the toolbar; `lang` is the PAPER's. The two part company the
     moment somebody prints an Arabic lease from an English console — the same
     split, and the same reasoning, as the receipt. */
  const { t: ui, lang: uiLang } = useLang();
  /* ?lang= is how the Documents tab prints this sheet without anybody having
     to come here and choose — the same contract receipt-app.tsx honours. Read
     once, as the initial value, so the picker above still wins the moment
     somebody touches it. */
  const asked = useSearchParams().get("lang");
  const [picked, setLang] = useState<Lang | null>(() => (LANGS.includes(asked as Lang) ? (asked as Lang) : null));
  const lang = picked ?? uiLang;

  const { getContract } = useContracts();
  const c = getContract(id);

  if (!c) {
    return (
      <div className="cd-missing">
        <span className="cd-missing__art">
          <Icon name="file-x" size={26} strokeWidth={1.6} />
        </span>
        <h1>{ui("admin.cd.notFound")}</h1>
        <p>{ui("admin.cd.notFoundSub")}</p>
      </div>
    );
  }

  return (
    <div className="cd-page">
      {/* Screen furniture — none of it prints. See the print rules in cd.css. */}
      <div className="cd-toolbar">
        <Link className="cd-back" href={`/admin/contracts/${encodeURIComponent(c.id)}`}>
          <Icon name="arrow-left" size={15} />
          {ui("admin.cd.back")}
        </Link>
        <div className="cd-tools">
          {/* The language of the PAPER, not of the console. */}
          <div className="cd-langs" role="group" aria-label={ui("admin.cd.langAria")}>
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                className={"cd-lang" + (lang === code ? " is-active" : "")}
                aria-pressed={lang === code}
                lang={code}
                onClick={() => setLang(code)}
              >
                {translate(code, "lang." + code)}
              </button>
            ))}
          </div>
          <Button hierarchy="primary" size="md" iconLeading="printer" onClick={() => window.print()}>
            {ui("admin.cd.print")}
          </Button>
        </div>
      </div>

      {/* ⚠ SAID ON SCREEN, NEVER ON THE PAPER. Whoever is printing needs to know
          the clause wording is pending review. The two people signing do not
          need a disclaimer printed across their agreement. */}
      <p className="cd-hint">{ui("admin.cd.draftNote")}</p>

      {/* NO `blanks` HERE. An unanswered term prints nothing at all — a ruled
          blank on a signed page is a line somebody can fill in afterwards. */}
      <ContractSheet c={c} lang={lang} />
    </div>
  );
}
