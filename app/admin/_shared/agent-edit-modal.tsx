"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXPERIENCE_OPTIONS, LANGUAGE_OPTIONS, SERVICE_AREA_OPTIONS } from "../_agents-admin/data";
import { useLang } from "@/lib/i18n";
import { fmtNum, valueKey } from "@/lib/fmt";

export type SelectOption = { value: string; label: string };

export function Field({ label, htmlFor, children }: { label?: ReactNode; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="cx-field">
      {label && (
        <label className="cx-field__label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

export function CustomSelect({ value, onChange, options, clearable }: { value: string; onChange: (v: string) => void; options: SelectOption[]; clearable?: boolean }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const placeholder = options.find((o) => o.value === "")?.label || t("admin.aem.select");
  const items = options.filter((o) => o.value !== "");

  const calcPos = () => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
  };
  const toggle = () => {
    if (!open) calcPos();
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (document.querySelector(".ap-custdrop")?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  return (
    <div className="ap-selwrap" ref={btnRef}>
      <button type="button" className={"ap-selbtn" + (open ? " is-open" : "") + (value ? " has-value" : "")} onClick={toggle}>
        <span className="ap-selbtn__label">{items.find((o) => o.value === value)?.label || placeholder}</span>
        {clearable && value && (
          <span
            className="ap-selbtn__clear"
            role="button"
            tabIndex={0}
            aria-label={t("admin.props.clear")}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setOpen(false);
            }}
          >
            <Icon name="x" size={12} />
          </span>
        )}
        <Icon name="chevron-down" size={14} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div className="ap-custdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
            {items.map((o) => (
              <button
                key={o.value}
                type="button"
                className={"ap-custdrop__item" + (value === o.value ? " is-selected" : "")}
                onClick={() => {
                  onChange(value === o.value ? "" : o.value);
                  setOpen(false);
                }}
              >
                {o.label}
                {value === o.value && <Icon name="check" size={15} strokeWidth={2.5} />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function AvatarUpload({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const { t } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  return (
    <div className="aa-photo">
      <div className="aa-photo__ring">
        <button type="button" className={"aa-photo__disc" + (value ? " has-img" : "")} onClick={() => inputRef.current?.click()} aria-label={t("admin.aem.uploadPhotoAria")}>
          {value ? <img src={value} alt="" /> : <Icon name="image-plus" size={26} strokeWidth={1.6} />}
        </button>
        <button type="button" className="aa-photo__edit" onClick={() => inputRef.current?.click()} aria-label={value ? t("admin.aem.changePhoto") : t("admin.aem.uploadPhoto")}>
          <Icon name={value ? "pencil" : "camera"} size={14} strokeWidth={2} />
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden onChange={onPick} />
      </div>
      <div className="aa-photo__meta">
        <span className="aa-photo__label">
          {t("admin.aem.profilePhoto")} <span>{t("admin.ap.optional")}</span>
        </span>
        {value ? (
          <button type="button" className="aa-photo__remove" onClick={() => onChange(null)}>
            <Icon name="trash-2" size={13} strokeWidth={2} />
            {t("admin.aem.removePhoto")}
          </button>
        ) : (
          <span className="aa-photo__hint">{t("admin.aem.photoHint")}</span>
        )}
      </div>
    </div>
  );
}

/**
 * `options`/`values` stay canonical English (they are what gets saved); the
 * caller passes `labelFor` to control display, since the same component backs
 * both the languages and the service-areas fields.
 */
export function MultiSelect({
  values,
  onChange,
  options,
  placeholder,
  labelFor,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
  labelFor?: (v: string) => string;
}) {
  const { t, lang } = useLang();
  const show = (v: string) => (labelFor ? labelFor(v) : v);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const searchable = options.length > 6;
  const calcPos = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, minWidth: r.width });
  };
  const toggle = () => {
    if (!open) {
      calcPos();
      setQuery("");
    }
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current?.contains(e.target as Node)) return;
      if (document.querySelector(".aa-msdrop")?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);
  const toggleVal = (v: string) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const remove = (e: React.MouseEvent, v: string) => {
    e.stopPropagation();
    onChange(values.filter((x) => x !== v));
  };

  const ctrlRef = useRef<HTMLDivElement>(null);
  const measRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(values.length);
  useLayoutEffect(() => {
    const ctrl = ctrlRef.current,
      meas = measRef.current;
    if (!ctrl || !meas) return;
    const measure = () => {
      const cs = getComputedStyle(ctrl);
      const avail = ctrl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const gap = 6,
        reserve = 46;
      const chips = [...meas.children];
      let used = 0,
        count = 0;
      for (let i = 0; i < chips.length; i++) {
        const w = chips[i].getBoundingClientRect().width + (count > 0 ? gap : 0);
        const needBadge = chips.length - (i + 1) > 0 ? reserve + gap : 0;
        if (used + w + needBadge <= avail) {
          used += w;
          count++;
        } else break;
      }
      setVisible(Math.max(count, chips.length ? 1 : 0));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ctrl);
    return () => ro.disconnect();
  }, [values]);

  const shown = values.slice(0, visible);
  const hidden = values.length - shown.length;

  return (
    <div className="aa-ms" ref={ref}>
      <div className={"aa-ms__control" + (open ? " is-open" : "")} onClick={toggle} ref={ctrlRef}>
        {values.length === 0 && <span className="aa-ms__placeholder">{placeholder}</span>}
        {shown.map((v) => (
          <span key={v} className="aa-ms__chip">
            {show(v)}
            <button type="button" className="aa-ms__chipx" onClick={(e) => remove(e, v)} aria-label={t("admin.aem.removeValue", { value: show(v) })}>
              <Icon name="x" size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        {hidden > 0 && <span className="aa-ms__chip aa-ms__chip--count">+{fmtNum(lang, hidden)}</span>}
        <span className="aa-ms__chev">
          <Icon name="chevron-down" size={16} />
        </span>
      </div>
      <div className="aa-ms__measure" aria-hidden="true" ref={measRef}>
        {values.map((v) => (
          <span key={v} className="aa-ms__chip">
            {show(v)}
            <span className="aa-ms__chipx">
              <Icon name="x" size={12} strokeWidth={2.5} />
            </span>
          </span>
        ))}
      </div>
      {open &&
        pos &&
        createPortal(
          <div className="aa-msdrop" style={{ top: pos.top, left: pos.left, minWidth: pos.minWidth }}>
            {searchable && (
              <div className="aa-msdrop__search">
                <Icon name="search" size={15} />
                <input type="text" autoFocus value={query} placeholder={t("admin.aem.searchAreas")} onChange={(e) => setQuery(e.target.value)} />
                {query && (
                  <button type="button" className="aa-msdrop__searchx" aria-label={t("admin.props.clearSearch")} onClick={() => setQuery("")}>
                    <Icon name="x" size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            )}
            <div className="aa-msdrop__list">
              {options
                .filter((o) => show(o).toLowerCase().includes(query.trim().toLowerCase()) || o.toLowerCase().includes(query.trim().toLowerCase()))
                .map((o) => {
                  const sel = values.includes(o);
                  return (
                    <button key={o} type="button" className={"aa-msdrop__item" + (sel ? " is-selected" : "")} onClick={() => toggleVal(o)}>
                      <span className="aa-msdrop__check">{sel && <Icon name="check" size={12} strokeWidth={3.2} />}</span>
                      {show(o)}
                    </button>
                  );
                })}
              {searchable && options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())).length === 0 && (
                <div className="aa-msdrop__empty">No areas match “{query.trim()}”</div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

function DiscardChangesDialog({ onContinue, onDiscard }: { onContinue: () => void; onDiscard: () => void }) {
  const { t } = useLang();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onContinue();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onContinue]);
  return createPortal(
    <div
      className="mp-modal-backdrop"
      style={{ zIndex: 600 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onContinue();
      }}
    >
      <div className="mp-modal" role="alertdialog" aria-modal="true" aria-labelledby="ea-discard-title">
        <div className="mp-modal__icon mp-modal__icon--warn">
          <Icon name="triangle-alert" size={24} strokeWidth={1.8} />
        </div>
        <h2 className="mp-modal__title" id="ea-discard-title">
          {t("admin.aem.discardTitle")}
        </h2>
        <p className="mp-modal__body">{t("admin.aem.discardBody")}</p>
        <div className="mp-modal__actions">
          <button type="button" className="mp-modal__cancel" onClick={onDiscard}>
            {t("admin.aem.discard")}
          </button>
          <button type="button" className="mp-modal__confirm mp-modal__confirm--brand" onClick={onContinue}>
            {t("admin.aem.continueEditing")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export interface AgentEditSeed {
  img: string | null;
  name: string;
  phone: string;
  email: string;
  experience: string;
  languages: string[];
  areas: string[];
  status: string;
}

export function EditAgentModal({ seed, onCancel, onSave }: { seed: AgentEditSeed; onCancel: () => void; onSave: (values: AgentEditSeed) => void }) {
  const { t } = useLang();
  const tOr = (key: string, fallback: string) => {
    const out = t(key);
    return out === key ? fallback : out;
  };
  const initial = useMemo(() => seed, [seed]);

  const [photo, setPhoto] = useState<string | null>(initial.img);
  const [fullName, setFullName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [experience, setExperience] = useState(initial.experience);
  const [languages, setLanguages] = useState(initial.languages);
  const [areas, setAreas] = useState(initial.areas);
  const [status, setStatus] = useState(initial.status);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const current: AgentEditSeed = { img: photo, name: fullName, phone, email, experience, languages, areas, status };
  const dirty = JSON.stringify(current) !== JSON.stringify(initial);

  const requestClose = useCallback(() => {
    if (dirty) setConfirmDiscard(true);
    else onCancel();
  }, [dirty, onCancel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmDiscard) requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose, confirmDiscard]);

  const canSave = fullName.trim() && email.trim();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    onSave({ img: photo, name: fullName.trim(), phone: phone.trim(), email: email.trim(), experience, languages, areas, status });
  };

  return createPortal(
    <div
      className="aa-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <form className="aa-modal" role="dialog" aria-modal="true" aria-labelledby="ea-title" onSubmit={submit}>
        <header className="aa-modal__head">
          <div className="aa-modal__headmain">
            <span className="aa-modal__icon">
              <Icon name="user-pen" size={22} strokeWidth={1.9} />
            </span>
            <div>
              <h2 className="aa-modal__title" id="ea-title">
                {t("admin.ad.editAgent")}
              </h2>
              <p className="aa-modal__desc">{t("admin.aem.sub")}</p>
            </div>
          </div>
          <button type="button" className="aa-modal__close" aria-label={t("admin.props.close")} onClick={requestClose}>
            <Icon name="x" size={18} />
          </button>
        </header>

        <div className="aa-modal__body">
          <AvatarUpload value={photo} onChange={setPhoto} />

          <section className="aa-sect">
            <Input label={t("admin.aem.fullName")} id="ea-name" placeholder="e.g. Lana Aziz" iconLeading="user" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <div className="aa-grid2">
              <Input label={t("admin.mp.phoneNumber")} id="ea-phone" type="tel" placeholder="+964 770 000 0000" iconLeading="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Input label={t("admin.mp.emailAddress")} id="ea-email" type="email" placeholder="name@chiya.estate" iconLeading="mail" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-stack">
              <Field label={t("admin.aem.languagesSpoken")}>
                <MultiSelect values={languages} onChange={setLanguages} options={LANGUAGE_OPTIONS} placeholder={t("admin.aem.selectLanguages")} labelFor={(v) => tOr(valueKey("admin.ad.lang", v), v)} />
              </Field>
              <Field label={t("admin.ad.serviceAreas")}>
                <MultiSelect values={areas} onChange={setAreas} options={SERVICE_AREA_OPTIONS} placeholder={t("admin.aem.selectAreas")} labelFor={(v) => tOr(`city.${v}`, tOr(`loc.${v}`, v))} />
              </Field>
            </div>
          </section>

          <section className="aa-sect">
            <div className="aa-grid2">
              <Field label={t("admin.aem.yearsExperience")} htmlFor="ea-exp">
                <CustomSelect value={experience} onChange={setExperience} options={[{ value: "", label: t("admin.aem.select") }, ...EXPERIENCE_OPTIONS.map((o) => ({ value: o.value, label: t(o.labelKey) }))]} />
              </Field>
              <Field label={t("admin.props.th.status")} htmlFor="ea-status">
                <CustomSelect value={status} onChange={(v) => setStatus(v || "Active")} options={[{ value: "", label: t("admin.aem.selectStatus") }, { value: "Active", label: t("status.active") }, { value: "Suspended", label: t("status.suspended") }]} />
              </Field>
            </div>
          </section>
        </div>

        <footer className="aa-modal__foot">
          <button type="button" className="mp-modal__cancel" onClick={requestClose}>
            {t("admin.common.cancel")}
          </button>
          <Button hierarchy="primary" size="md" type="submit" disabled={!canSave}>
            {t("admin.ap.saveChanges")}
          </Button>
        </footer>
      </form>
      {confirmDiscard && <DiscardChangesDialog onContinue={() => setConfirmDiscard(false)} onDiscard={onCancel} />}
    </div>,
    document.body,
  );
}
