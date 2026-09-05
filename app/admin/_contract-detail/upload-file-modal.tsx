"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtNum, localizeDigits } from "@/lib/fmt";
import { CancelButton, FinanceModal } from "../_shared/finance/modal-shell";
import { Labelled, SelectField } from "../_shared/finance/controls";
import { TODAY } from "../_shared/finance";
import { addContractFile, fileSize, FILE_KINDS, type ContractFileKind } from "../_shared/contract-files";

/* =============================================================================
   Put a paper on a contract.

   ⚠ IT ASKS FOR TWO THINGS: THE FILE, AND WHAT THE FILE IS. Nothing else.
   The uploader is whoever is signed in and the date is today — both are facts
   the app already holds, and asking a person to retype a fact the app knows is
   how you get a records screen full of wrong dates.

   WHAT IT IS is asked rather than guessed. The extension tells you the format,
   not the document: a deed photographed on a phone and a deed scanned to PDF
   are the same paper, and only the person holding it can say which it is. That
   answer is what the row's second line reads, and what makes a list of six
   files scannable instead of six filenames somebody has to parse.

   NO NAME FIELD. The filename is the name. A second, typed title would drift
   from the file the moment anyone replaced it, and the one thing a document
   list must never do is describe a file it is not actually holding.
   ========================================================================== */

export function UploadFileModal({ contractId, onClose }: { contractId: string; onClose: () => void }) {
  const { t, lang } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<File | null>(null);
  const [kind, setKind] = useState<ContractFileKind>("signedContract");

  const confirm = () => {
    if (!picked) return;
    addContractFile(contractId, picked, kind, TODAY);
    onClose();
  };

  const size = picked ? fileSize(picked.size) : null;

  return (
    <FinanceModal
      icon="upload"
      title={t("admin.ct.doc.uploadTitle")}
      sub={t("admin.ct.doc.uploadDesc")}
      onClose={onClose}
      actions={
        <>
          <CancelButton onClick={onClose} />
          <button type="button" className="fm-btn fm-btn--primary" disabled={!picked} onClick={confirm}>
            <Icon name="upload" size={16} />
            {t("admin.ct.doc.upload")}
          </button>
        </>
      }
    >
      {/* The picker is one target, not a button beside a filename: the whole
          panel is clickable, so the hit area matches what it looks like. */}
      <button type="button" className="ctd-drop" onClick={() => inputRef.current?.click()}>
        <span className="ctd-drop__ic">
          <Icon name={picked ? "file-check" : "upload"} size={20} />
        </span>
        {picked && size ? (
          <span className="ctd-drop__txt">
            <span className="ctd-drop__name">{picked.name}</span>
            <span className="ctd-drop__hint">
              {t(size.unit === "mb" ? "admin.ct.doc.mb" : "admin.ct.doc.kb", {
                n: size.unit === "mb" ? localizeDigits(lang, String(size.n)) : fmtNum(lang, size.n),
              })}
            </span>
          </span>
        ) : (
          <span className="ctd-drop__txt">
            <span className="ctd-drop__name">{t("admin.ct.doc.chooseFile")}</span>
            <span className="ctd-drop__hint">{t("admin.ct.doc.uploadDesc")}</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => setPicked(e.target.files?.[0] ?? null)}
      />

      <Labelled label={t("admin.ct.doc.pickKind")} htmlFor="ctd-upload-kind">
        <SelectField
          id="ctd-upload-kind"
          value={kind}
          onChange={setKind}
          options={FILE_KINDS.map((k) => ({ value: k, label: t(`admin.ct.doc.kind.${k}`) }))}
          ariaLabel={t("admin.ct.doc.pickKind")}
        />
      </Labelled>
    </FinanceModal>
  );
}
