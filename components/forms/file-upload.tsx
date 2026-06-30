"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import "./file-upload.css";

export interface FileUploadProps {
  /** Accept attribute, e.g. "image/*,.pdf". */
  accept?: string;
  multiple?: boolean;
  /** Controlled file list. */
  files?: File[];
  onChange?: (files: File[]) => void;
  title?: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * FileUpload — drag-and-drop dropzone with a click-to-browse fallback and a
 * removable file list. Controlled via `files` + `onChange`.
 */
export function FileUpload({
  accept,
  multiple = true,
  files = [],
  onChange,
  title,
  hint = "PNG, JPG or PDF up to 10MB",
  className = "",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [drag, setDrag] = useState(false);

  const add = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    const next = multiple ? [...files, ...Array.from(incoming)] : [Array.from(incoming)[0]];
    onChange?.(next);
  };
  const remove = (i: number) => onChange?.(files.filter((_, idx) => idx !== i));

  return (
    <div className={["cx-upload", className].filter(Boolean).join(" ")}>
      <label
        htmlFor={inputId}
        className={"cx-upload__zone" + (drag ? " cx-upload__zone--drag" : "")}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
      >
        <span className="cx-upload__ic">
          <Icon name="cloud-upload" size={24} />
        </span>
        <span className="cx-upload__title">{title ?? <><b>Click to upload</b> or drag and drop</>}</span>
        <span className="cx-upload__hint">{hint}</span>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0 }}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <div className="cx-upload__list">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="cx-upload__file">
              <Icon name="file" size={20} className="cx-upload__fileic" />
              <div className="cx-upload__filemeta">
                <div className="cx-upload__filename">{f.name}</div>
                <div className="cx-upload__filesize">{formatSize(f.size)}</div>
              </div>
              <IconButton icon="trash-2" label={`Remove ${f.name}`} variant="ghost" size="sm" onClick={() => remove(i)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
