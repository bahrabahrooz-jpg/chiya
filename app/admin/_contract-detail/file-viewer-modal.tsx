"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { fromIso } from "@/lib/dates";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import { fileSize, type ContractFile } from "../_shared/contract-files";

/* =============================================================================
   LOOK AT THE PAPER.

   ⚠ THIS IS THE ANSWER TO "WHY IS THERE A DOWNLOAD BUTTON?". There was a
   moment where a filed document could be taken away but never looked at, which
   made Download the only way to answer "is this the right scan?" — you saved a
   copy to your own computer, opened it there, and now a second copy of a
   tenant's ID was loose in the world because somebody wanted to check a
   filename. That is a bad trade for a glance.

   So opening is the row's PRIMARY action and download is demoted into here,
   behind the look. The common need — see it — costs one click and copies
   nothing. The rare need — keep it, email it, print it — is still one more
   click away, and by then you have seen what you are taking.

   NO EDITING, NO ROTATE, NO ANNOTATE. This is a window, not a tool. A document
   that could be altered in the app is a document the app can no longer swear
   to, and the whole point of filing the signed contract is being able to swear
   to it.
   ========================================================================== */

export function FileViewerModal({ file, onClose }: { file: ContractFile; onClose: () => void }) {
  const { t, lang } = useLang();
  const [url] = useState<string | null>(() => (file.blob ? URL.createObjectURL(file.blob) : null));
  const size = fileSize(file.bytes);
  const isImage = file.mime.startsWith("image/");

  /* Made ONCE, at mount, in a lazy initialiser rather than in an effect: the
     modal is mounted for exactly one file, so there is nothing to re-sync, and
     a URL minted on every render would leak a blob handle per keystroke
     elsewhere on the page. The effect below only has to hand it back. */
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const download = () => {
    const blob =
      file.blob ??
      new Blob([`${file.name}\n\n${t("admin.ct.doc.demoFile")}\n`], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = file.blob ? file.name : `${file.name}.txt`;
    a.click();
    URL.revokeObjectURL(href);
  };

  return (
    <FinanceModal
      icon={isImage ? "image" : "file-text"}
      wide
      title={file.name}
      sub={t("admin.ct.doc.addedMeta", {
        who: file.addedBy,
        date: fmtDate(lang, fromIso(file.addedOn)),
        size: t(size.unit === "mb" ? "admin.ct.doc.mb" : "admin.ct.doc.kb", {
          n: size.unit === "mb" ? localizeDigits(lang, String(size.n)) : fmtNum(lang, size.n),
        }),
      })}
      onClose={onClose}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" onClick={download}>
            <Icon name="download" size={16} />
            {t("admin.ct.doc.download")}
          </button>
        </>
      }
    >
      <div className="ctd-view">
        {url && isImage ? (
          /* eslint-disable-next-line @next/next/no-img-element -- a blob URL from
             the viewer's own machine; there is no remote asset to optimise. */
          <img className="ctd-view__img" src={url} alt={file.name} />
        ) : url ? (
          <iframe className="ctd-view__frame" src={url} title={file.name} />
        ) : (
          /* Seeded rows carry no bytes — see contract-files.ts. Saying so is
             better than an empty grey rectangle that looks like a failure. */
          <div className="ctd-view__none">
            <span className="ctd-view__noneic">
              <Icon name="file-question" size={22} />
            </span>
            <p>{t("admin.ct.doc.demoFile")}</p>
          </div>
        )}
      </div>
    </FinanceModal>
  );
}
