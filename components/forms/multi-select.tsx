"use client";

import { useRef, useState } from "react";
import { useClickOutside } from "@/lib/use-click-outside";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import "./multi-select.css";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  id?: string;
}

/**
 * MultiSelect — pick several options from a dropdown. The trigger shows the
 * selected values as removable chips; the panel lists checkbox options.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  label,
  hint,
  error,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false), open);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const selected = options.filter((o) => value.includes(o.value));

  const control = (
    <div className="cx-msel" ref={ref}>
      <button
        type="button"
        className="cx-msel__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cx-msel__tags">
          {selected.length === 0 ? (
            <span className="cx-msel__ph">{placeholder}</span>
          ) : (
            selected.map((o) => (
              <span key={o.value} className="cx-msel__chip">
                {o.label}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Remove ${o.label}`}
                  className="cx-msel__chipx"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                >
                  <Icon name="x" size={12} strokeWidth={2.5} />
                </span>
              </span>
            ))
          )}
        </span>
        <Icon name="chevron-down" size={18} className="cx-msel__chev" />
      </button>
      {open && (
        <div className="cx-msel__panel" role="listbox" aria-multiselectable="true">
          {options.map((o) => {
            const sel = value.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={sel}
                className={"cx-msel__opt" + (sel ? " cx-msel__opt--sel" : "")}
                onClick={() => toggle(o.value)}
              >
                <span className="cx-msel__check">{sel && <Icon name="check" size={13} strokeWidth={3} />}</span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      {control}
    </Field>
  );
}
