"use client";

/* eslint-disable @next/next/no-img-element */
import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import {
  AGENTS,
  AMENITIES,
  CITIES,
  CONDITIONS,
  COVER_IMG,
  DISTRICTS,
  EMPTY_FORM,
  FURNISHING,
  GALLERY_IMGS,
  ORIENTATIONS,
  PROPERTY_TYPES,
  PUBLISHED,
  STEPS,
  type ApAgent,
  type ApForm,
} from "./data";

export type Opt = { value: string; label: string };

export function ProgressStepper({ active }: { active: number }) {
  const nextLabel = STEPS[active + 1];
  return (
    <>
      <ol className="ap-steps" aria-label="Listing progress">
        {STEPS.map((label, i) => {
          const done = i < active;
          const isActive = i === active;
          const cls = ["ap-step", done ? "is-done" : "", isActive ? "is-active" : ""].filter(Boolean).join(" ");
          return (
            <Fragment key={label}>
              <li className={cls} aria-current={isActive ? "step" : undefined}>
                <span className="ap-step__dot">{done && <Icon name="check" size={14} strokeWidth={3} />}</span>
                <span className="ap-step__label">{label}</span>
              </li>
              {i < STEPS.length - 1 && <span className={"ap-conn" + (i < active ? " is-done" : "")} aria-hidden="true" />}
            </Fragment>
          );
        })}
      </ol>
      <div className="ap-steps-mini">
        <svg className="ap-steps-mini__ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border-default)" strokeWidth="3" />
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--brand-primary)" strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 17} strokeDashoffset={2 * Math.PI * 17 * (1 - (active + 1) / STEPS.length)} transform="rotate(-90 20 20)" />
          <text x="20" y="20" textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, fill: "var(--text-primary)" }}>
            {active + 1}/{STEPS.length}
          </text>
        </svg>
        <div className="ap-steps-mini__txt">
          <span className="ap-steps-mini__now">{STEPS[active]}</span>
          {nextLabel && <span className="ap-steps-mini__next">Next · {nextLabel}</span>}
        </div>
      </div>
    </>
  );
}

export function MapPicker() {
  return (
    <div className="ap-map" role="application" aria-label="Map location picker">
      <svg className="ap-map__svg" viewBox="0 0 800 392" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="800" height="392" fill="#E8EAED" />
        <rect x="56" y="44" width="150" height="120" rx="14" fill="#D6E0C4" />
        <rect x="612" y="232" width="150" height="128" rx="14" fill="#D6E0C4" />
        <path d="M-20 96 C 150 150, 250 60, 430 130 S 720 210, 840 168 L 840 226 C 720 268, 560 210, 430 188 S 150 208, -20 154 Z" fill="#C2D4DA" />
        <g fill="#DCDFE3">
          <rect x="250" y="56" width="92" height="56" rx="6" />
          <rect x="356" y="56" width="120" height="56" rx="6" />
          <rect x="250" y="232" width="92" height="60" rx="6" />
          <rect x="356" y="232" width="78" height="60" rx="6" />
          <rect x="448" y="232" width="120" height="60" rx="6" />
          <rect x="250" y="304" width="180" height="64" rx="6" />
          <rect x="612" y="56" width="92" height="56" rx="6" />
          <rect x="56" y="304" width="150" height="64" rx="6" />
        </g>
        <g stroke="#F4F5F7" strokeLinecap="round">
          <line x1="0" y1="200" x2="800" y2="216" strokeWidth="20" />
          <line x1="232" y1="0" x2="232" y2="392" strokeWidth="16" />
          <line x1="586" y1="0" x2="586" y2="392" strokeWidth="16" />
          <line x1="0" y1="36" x2="800" y2="36" strokeWidth="10" />
          <line x1="0" y1="300" x2="800" y2="300" strokeWidth="10" />
          <line x1="438" y1="0" x2="438" y2="392" strokeWidth="9" />
        </g>
        <line x1="-20" y1="392" x2="500" y2="-20" stroke="#EEF0F2" strokeWidth="13" strokeLinecap="round" />
      </svg>
      <div className="ap-map__search">
        <Icon name="search" size={18} />
        <input type="text" placeholder="Search address, place, or coordinates…" aria-label="Search map" />
        <button type="button" className="ap-map__search-btn">
          <Icon name="locate-fixed" size={15} />
          Locate
        </button>
      </div>
      <div className="ap-map__pin">
        <span className="ap-map__pin-ic">
          <Icon name="map-pin" size={22} strokeWidth={2.25} />
        </span>
        <span className="ap-map__pin-shadow" />
      </div>
      <button type="button" className="ap-map__locate" aria-label="Use my location">
        <Icon name="navigation" size={19} />
      </button>
      <div className="ap-map__zoom">
        <button type="button" className="ap-map__zbtn" aria-label="Zoom in">
          <Icon name="plus" size={19} strokeWidth={2.25} />
        </button>
        <button type="button" className="ap-map__zbtn" aria-label="Zoom out">
          <Icon name="minus" size={19} strokeWidth={2.25} />
        </button>
      </div>
      <div className="ap-map__hint">
        <Icon name="move" size={14} />
        Drag the map to position the pin
      </div>
    </div>
  );
}

export function FieldLabel({ children, optional, htmlFor }: { children: React.ReactNode; optional?: boolean; htmlFor?: string }) {
  return (
    <label className="ap-label" htmlFor={htmlFor}>
      {children}
      {optional && <span className="ap-label__opt">(Optional)</span>}
    </label>
  );
}

export function RadioCards({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string; sub: string; icon: IconName }[] }) {
  return (
    <div className="ap-cards" role="radiogroup">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className={"ap-rcard" + (on ? " is-on" : "")} onClick={() => onChange(o.value)}>
            <span className="ap-rcard__ic">
              <Icon name={o.icon} size={20} />
            </span>
            <span className="ap-rcard__txt">
              <span className="ap-rcard__title">{o.label}</span>
              <span className="ap-rcard__sub">{o.sub}</span>
            </span>
            <span className="ap-rcard__check">
              <Icon name="check" size={12} strokeWidth={3} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, suffix }: { value: number; onChange: (v: number) => void; min?: number; suffix?: string }) {
  return (
    <div className="ap-stepper">
      <button type="button" className="ap-stepper__btn" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Icon name="minus" size={18} strokeWidth={2.25} />
      </button>
      <span className="ap-stepper__val">
        {value}
        {suffix && <small>{suffix}</small>}
      </span>
      <button type="button" className="ap-stepper__btn" aria-label="Increase" onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={18} strokeWidth={2.25} />
      </button>
    </div>
  );
}

export function useTopbarClip(triggerRef: React.RefObject<HTMLElement | null>) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; right: number; clipTop: number } | null>(null);
  const calc = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const nav = document.querySelector(".ax-topbar");
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const top = r.bottom + 8;
    setCoords({ top, left: r.left, width: r.width, right: window.innerWidth - r.right, clipTop: Math.max(0, navBottom - top) });
  };
  return { coords, setCoords, calc };
}

export function Dropdown({ id, options, value, onChange, placeholder }: { id?: string; options: Opt[]; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef);

  const openDropdown = () => {
    calc();
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = options.find((o) => o.value === value);
  return (
    <>
      <button ref={triggerRef} type="button" id={id} className={["lc-dd__trigger", open && "is-open"].filter(Boolean).join(" ")} onClick={() => (open ? setOpen(false) : openDropdown())} aria-haspopup="listbox" aria-expanded={open}>
        {selected ? (
          <span className="lc-dd__val">
            <span className="lc-dd__val-txt">{selected.label}</span>
          </span>
        ) : (
          <span className="lc-dd__placeholder">{placeholder || "Select…"}</span>
        )}
        <Icon name="chevron-down" size={18} style={{ color: "var(--text-tertiary)", flexShrink: 0, transition: "transform .16s ease", transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={panelRef} className="lc-dd__panel" style={{ top: coords.top, left: coords.left, width: coords.width, clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }} role="listbox">
            <div className="lc-dd__scroll">
              {options.map((o) => (
                <button
                  key={o.value || "__empty"}
                  type="button"
                  className={"lc-dd__row" + (value === o.value ? " is-selected" : "")}
                  role="option"
                  aria-selected={value === o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <span className="lc-dd__body">
                    <span className="lc-dd__row-title">{o.label}</span>
                  </span>
                  {value === o.value && <Icon name="check" size={16} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function ComboSelect({ side, value, onChange, options }: { side: "left" | "right"; value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef);

  const openDropdown = () => {
    calc();
    setOpen(true);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={"ap-combo__sel ap-combo__sel--" + side}>
      <button ref={triggerRef} type="button" className={"ap-combo__sel-btn" + (open ? " is-open" : "")} onClick={() => (open ? setOpen(false) : openDropdown())} aria-haspopup="listbox" aria-expanded={open} aria-label="Unit">
        {value}
      </button>
      <span className={"ap-combo__sel__chev" + (open ? " is-open" : "")}>
        <Icon name="chevron-down" size={16} />
      </span>
      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            className="lc-dd__panel ap-combo__panel"
            style={{ ...(side === "right" ? { top: coords.top, right: coords.right } : { top: coords.top, left: coords.left }), clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }}
            role="listbox"
          >
            <div className="lc-dd__scroll">
              {options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className={"lc-dd__row" + (value === o ? " is-selected" : "")}
                  role="option"
                  aria-selected={value === o}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                >
                  <span className="lc-dd__body">
                    <span className="lc-dd__row-title">{o}</span>
                  </span>
                  {value === o && <Icon name="check" size={16} style={{ color: "var(--brand-primary)", flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

export function CoverImage() {
  return (
    <div className="ap-cover">
      <img className="ap-cover__img" src={COVER_IMG} alt="Cover preview" />
      <div className="ap-cover__grad" />
      <span className="ap-cover__badge">
        <Icon name="star" size={14} strokeWidth={2.5} />
        Cover photo
      </span>
      <div className="ap-cover__actions">
        <IconButton icon="repeat-2" label="Replace cover image" variant="glass" />
        <IconButton icon="trash-2" label="Remove cover image" variant="glass" />
      </div>
      <span className="ap-cover__foot">
        <Icon name="image" size={14} />
        exterior-front.jpg
        <span className="ap-cover__dot" />
        2.4 MB
      </span>
    </div>
  );
}

export function GalleryGrid() {
  return (
    <div className="ap-gal">
      {GALLERY_IMGS.map((g) => (
        <div className="ap-gal__item" key={g.id} role="group" aria-label="Gallery image">
          <img className="ap-gal__img" src={g.url} alt="" />
          <span className="ap-gal__top" />
          <span className="ap-gal__handle" aria-label="Drag to reorder" title="Drag to reorder">
            <Icon name="grip-vertical" size={15} />
          </span>
          <div className="ap-gal__acts">
            <button type="button" className={"ap-gal__abtn" + (g.cover ? " is-on" : "")} aria-label="Set as cover" title="Set as cover">
              <Icon name="star" size={14} strokeWidth={2.25} />
            </button>
            <button type="button" className="ap-gal__abtn ap-gal__abtn--danger" aria-label="Remove image" title="Remove">
              <Icon name="x" size={15} strokeWidth={2.5} />
            </button>
          </div>
          {g.cover && (
            <span className="ap-gal__cover">
              <Icon name="star" size={11} strokeWidth={2.5} />
              Cover
            </span>
          )}
        </div>
      ))}
      <button type="button" className="ap-drop ap-gal__add" aria-label="Add more images">
        <span className="ap-drop__ic">
          <Icon name="plus" size={20} strokeWidth={2.25} />
        </span>
        <span className="ap-drop__title">Add more</span>
      </button>
    </div>
  );
}

export function VideoUpload() {
  const pct = 64;
  return (
    <div className="ap-vid">
      <div className="ap-vid__row">
        <span className="ap-vid__ic">
          <Icon name="video" size={22} />
        </span>
        <div className="ap-vid__meta">
          <span className="ap-vid__name">olive-grove-walkthrough.mp4</span>
          <span className="ap-vid__sub">84.2 MB · uploading…</span>
        </div>
        <button type="button" className="ap-vid__cancel" aria-label="Cancel upload" title="Cancel">
          <Icon name="x" size={17} strokeWidth={2.25} />
        </button>
      </div>
      <div>
        <div className="ap-vid__track">
          <span className="ap-vid__fill" style={{ width: pct + "%" }} />
        </div>
        <div className="ap-vid__pct" style={{ marginTop: 8 }}>
          <span>Uploading video</span>
          <b>{pct}%</b>
        </div>
      </div>
    </div>
  );
}

export function AgentSelect({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef);
  const toggle = () => {
    if (!open) calc();
    setOpen((v) => !v);
  };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", calc, true);
    window.addEventListener("resize", calc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", calc, true);
      window.removeEventListener("resize", calc);
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <button type="button" ref={triggerRef} id={id} className={"ap-agentsel__trigger" + (open ? " is-open" : "")} onClick={toggle} aria-haspopup="listbox" aria-expanded={open}>
        <span className="ap-agentsel__placeholder">
          <Icon name="user" size={17} />
          Select agent
        </span>
        <Icon name="chevron-down" size={17} className="ap-agentsel__chev" />
      </button>
      {open &&
        coords &&
        createPortal(
          <div ref={panelRef} className="ap-agentsel__drop" style={{ top: coords.top, left: coords.left, width: coords.width, clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }} role="listbox">
            {AGENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                className={"ap-agentsel__row" + (value === a.id ? " is-selected" : "")}
                role="option"
                aria-selected={value === a.id}
                onClick={() => {
                  onChange(value === a.id ? "" : a.id);
                  setOpen(false);
                }}
              >
                <Avatar src={a.avatar} name={a.name} size="sm" verified />
                <span className="ap-agentsel__body">
                  <span className="ap-agentsel__name">{a.name}</span>
                  <span className="ap-agentsel__area">{a.area}</span>
                </span>
                {value === a.id && (
                  <span className="ap-agentsel__check">
                    <Icon name="check" size={16} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

export function AgentSummary({ agent, onClear }: { agent: ApAgent; onClear: () => void }) {
  return (
    <div className="ap-agentcard">
      <Avatar src={agent.avatar} name={agent.name} size="lg" verified />
      <div className="ap-agentcard__meta">
        <span className="ap-agentcard__name">
          {agent.name}
          <Badge variant="brand" size="sm" icon="badge-check">
            Verified
          </Badge>
        </span>
        <span className="ap-agentcard__phone">
          <Icon name="phone" size={14} />
          {agent.phone}
        </span>
      </div>
      <button type="button" className="ap-agentcard__remove" aria-label="Remove assigned agent" onClick={onClear}>
        <Icon name="x" size={17} />
      </button>
    </div>
  );
}

export function SubHead({ title, desc, optional }: { title: string; desc: string; optional?: boolean }) {
  return (
    <div className="ap-subhead">
      <h3 className="ap-subhead__title">
        {title}
        {optional && (
          <span className="ap-label__opt" style={{ marginLeft: 8 }}>
            (Optional)
          </span>
        )}
      </h3>
      <p className="ap-subhead__desc">{desc}</p>
    </div>
  );
}

export function AmenityGrid({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (label: string) => onChange(value.includes(label) ? value.filter((x) => x !== label) : [...value, label]);
  return (
    <div className="ap-amen" role="group" aria-label="Amenities">
      {AMENITIES.map((a) => {
        const on = value.includes(a.label);
        return (
          <button key={a.label} type="button" aria-pressed={on} className={"ap-amen__item" + (on ? " is-on" : "")} onClick={() => toggle(a.label)}>
            <span className="ap-amen__ic">
              <Icon name={a.icon} size={16} />
            </span>
            <span className="ap-amen__label">{a.label}</span>
            {on && (
              <span className="ap-amen__check">
                <Icon name="check" size={11} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CustomAmenities({ items, onAdd, onRemove }: { items: string[]; onAdd: (t: string) => void; onRemove: (i: number) => void }) {
  const [val, setVal] = useState("");
  const add = () => {
    const t = val.trim();
    if (!t) return;
    onAdd(t);
    setVal("");
  };
  return (
    <div className="ap-custom-wrap">
      <div className="ap-custom">
        <input
          className="ap-custom__input"
          type="text"
          placeholder="Amenity name"
          aria-label="Custom amenity name"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={add}>
          Add amenity
        </Button>
      </div>
      {items.length > 0 && (
        <div className="ap-taglist">
          {items.map((it, i) => (
            <span className="ap-tag" key={it + i}>
              {it}
              <button type="button" className="ap-tag__rm" aria-label={"Remove " + it} onClick={() => onRemove(i)}>
                <Icon name="x" size={13} strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReviewSection({ icon, title, onEdit, children }: { icon: IconName; title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="ap-rev__sect">
      <div className="ap-rev__head">
        <h3 className="ap-rev__htitle">
          <span className="ap-rev__hic">
            <Icon name={icon} size={18} />
          </span>
          {title}
        </h3>
        <button type="button" className="ap-rev__edit" onClick={onEdit}>
          Edit
          <Icon name="arrow-right" size={15} strokeWidth={2.25} />
        </button>
      </div>
      {children}
    </div>
  );
}

export function RevItem({ k, v, full, price, tnum }: { k: string; v: React.ReactNode; full?: boolean; price?: boolean; tnum?: boolean }) {
  const empty = v === undefined || v === null || v === "" || v === "—";
  const cls = ["ap-rev__v", price ? "ap-rev__v--price" : "", tnum ? "cx-tnum" : "", empty ? "ap-rev__v--muted" : ""].filter(Boolean).join(" ");
  return (
    <div className={"ap-rev__item" + (full ? " ap-rev__item--full" : "")}>
      <span className="ap-rev__k">{k}</span>
      <span className={cls}>{empty ? "Not provided" : v}</span>
    </div>
  );
}

function PublishedSuccess() {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const reveal = () => {
      if (document.visibilityState !== "visible" || el.dataset.revealed) return;
      el.dataset.revealed = "1";
      el.classList.add("pp-go");
      timer = setTimeout(() => el.classList.remove("pp-go"), 1500);
    };
    reveal();
    document.addEventListener("visibilitychange", reveal);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", reveal);
    };
  }, []);
  return (
    <div className="pp-stage" ref={stageRef}>
      <section className="pp-card" aria-labelledby="pp-title">
        <div className="pp-mark" aria-hidden="true">
          <span className="pp-mark__halo" />
          <span className="pp-mark__ring" />
          <span className="pp-mark__disc">
            <Icon name="check" size={46} strokeWidth={2.4} />
          </span>
          <span className="pp-mark__spark">
            <Icon name="sparkles" size={18} strokeWidth={2} />
          </span>
        </div>
        <h1 className="pp-title" id="pp-title">
          Property published
        </h1>
        <p className="pp-desc">Your property has been published successfully and is now visible on the Chiya Estate platform.</p>
        <div className="pp-listing">
          <div className="pp-listing__media">
            <img src={PUBLISHED.cover} alt="" />
            <span className="pp-listing__badge">
              <Icon name="circle-check" size={12} strokeWidth={2.5} />
              Published
            </span>
          </div>
          <div className="pp-listing__body">
            <div className="pp-listing__tags">
              <Badge variant="success" size="sm" icon="tag">
                {PUBLISHED.listing}
              </Badge>
              <span className="pp-listing__ref">
                <Icon name="hash" size={12} />
                {PUBLISHED.ref}
              </span>
            </div>
            <h2 className="pp-listing__name">{PUBLISHED.title}</h2>
            <span className="pp-listing__addr">
              <Icon name="map-pin" size={14} />
              {PUBLISHED.address}
            </span>
            <div className="pp-listing__row">
              <span className="pp-listing__price cx-tnum">{PUBLISHED.price}</span>
              <span className="pp-listing__specs">
                <span>
                  <Icon name="bed-double" size={15} />
                  {PUBLISHED.beds}
                </span>
                <span>
                  <Icon name="bath" size={15} />
                  {PUBLISHED.baths}
                </span>
                <span className="cx-tnum">
                  <Icon name="maximize-2" size={15} />
                  {PUBLISHED.area}
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="pp-actions">
          <Button hierarchy="primary" size="lg" iconLeading="eye" onClick={() => router.push("/admin/properties/CH-2041")}>
            View property
          </Button>
          <div className="pp-actions__row">
            <Button hierarchy="secondary" size="lg" iconLeading="plus" onClick={() => router.push("/admin/properties/new")}>
              Add another property
            </Button>
          </div>
          <div className="pp-actions__back">
            <Button hierarchy="link" size="lg" iconLeading="arrow-left" onClick={() => router.push("/admin/properties")}>
              Back to properties
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function AddPropertyApp() {
  const [f, setF] = useState<ApForm>(EMPTY_FORM);
  const set = <K extends keyof ApForm>(k: K, v: ApForm[K]) => setF((s) => ({ ...s, [k]: v }));
  const [step, setStep] = useState(0);
  const goTo = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const CUR: Record<string, string> = { USD: "$", EUR: "€", IQD: "IQD " };
  const fmtNum = (n: string | number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const priceStr = f.price ? (CUR[f.currency] || "") + fmtNum(f.price) : "$450,000";
  const areaStr = f.area ? fmtNum(f.area) + " " + (f.areaUnit === "sqm" ? "m²" : f.areaUnit) : "420 m²";
  const rev = {
    listing: f.listing === "rent" ? "For rent" : "For sale",
    type: f.type || "Villa",
    title: f.title || "Olive Grove Estate",
    price: priceStr,
    area: areaStr,
    city: f.city || "Erbil",
    district: f.district || "Ankawa",
    street: f.street || "60 Meter Street, Block 4",
    building: f.building || "Villa 128",
    lat: f.lat || "36.19085",
    lng: f.lng || "44.00947",
    year: f.year || "2022",
    orientation: f.orientation || "South facing",
    ownerName: f.ownerName || "Hêmin Abdullah",
    ownerPhone: f.ownerPhone || "+964 750 412 8890",
    ownerEmail: f.ownerEmail || "hemin@email.com",
  };
  const revAgent = AGENTS.find((a) => a.id === f.agent) || AGENTS[0];
  const AMEN_IC: Record<string, IconName> = Object.fromEntries(AMENITIES.map((a) => [a.label, a.icon]));

  if (step === 6) return <PublishedSuccess />;

  return (
    <div className="ap-wrap">
      <nav className="ap-crumbs" aria-label="Breadcrumb">
        <Link href="/admin/properties">
          <Icon name="building-2" size={14} />
          Properties
        </Link>
        <span className="ap-crumbs__sep">
          <Icon name="chevron-right" size={14} />
        </span>
        <span className="ap-crumbs__current" aria-current="page">
          Add property
        </span>
      </nav>

      <div className="ap-title">
        <h1>Add property</h1>
        <p>Create a new property listing step by step.</p>
      </div>

      <ProgressStepper active={step} />

      {step === 0 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Property details</h2>
            <p className="ap-card__desc">Provide the basic information about the property listing.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>Listing type</FieldLabel>
                <RadioCards
                  value={f.listing}
                  onChange={(v) => set("listing", v)}
                  options={[
                    { value: "sale", label: "For sale", sub: "List for purchase", icon: "tag" },
                    { value: "rent", label: "For rent", sub: "Offer as a rental", icon: "key" },
                  ]}
                />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-type">Property type</FieldLabel>
                <Dropdown id="ap-type" placeholder="Select property type" value={f.type} onChange={(v) => set("type", v)} options={PROPERTY_TYPES.map((t) => ({ value: t, label: t }))} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-title">Property title</FieldLabel>
                <Input id="ap-title" size="lg" placeholder="e.g. Olive Grove Estate — Ankawa, Erbil" value={f.title} onChange={(e) => set("title", e.target.value)} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-desc">Property description</FieldLabel>
                <Textarea id="ap-desc" rows={5} placeholder="Describe the home, the lifestyle, and what makes it special — natural light, finishes, location, views…" value={f.description} onChange={(e) => set("description", e.target.value)} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-price">Price</FieldLabel>
                <div className="ap-combo">
                  <ComboSelect side="left" value={f.currency} onChange={(v) => set("currency", v)} options={["USD", "IQD"]} />
                  <input id="ap-price" className="ap-combo__input" inputMode="numeric" placeholder="Enter price" value={f.price} onChange={(e) => set("price", e.target.value.replace(/[^\d]/g, ""))} />
                </div>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-area">Area size</FieldLabel>
                <div className="ap-combo">
                  <input id="ap-area" className="ap-combo__input" inputMode="numeric" placeholder="Enter area size" value={f.area} onChange={(e) => set("area", e.target.value.replace(/[^\d]/g, ""))} />
                  <ComboSelect side="right" value={f.areaUnit} onChange={(v) => set("areaUnit", v)} options={["sqm", "sq ft"]} />
                </div>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" href="/admin/properties">
              Cancel
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(1)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Location</h2>
            <p className="ap-card__desc">Add the property location and map details.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field">
                <FieldLabel htmlFor="ap-city">City</FieldLabel>
                <Dropdown id="ap-city" placeholder="Select city" value={f.city} onChange={(v) => set("city", v)} options={CITIES.map((c) => ({ value: c, label: c }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-district">Area / district</FieldLabel>
                <Dropdown id="ap-district" placeholder="Select area or district" value={f.district} onChange={(v) => set("district", v)} options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-street">Street address</FieldLabel>
                <Input id="ap-street" size="lg" placeholder="e.g. 60 Meter Street, Block 4" value={f.street} onChange={(e) => set("street", e.target.value)} />
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-building" optional>
                  Building number
                </FieldLabel>
                <Input id="ap-building" size="lg" placeholder="e.g. Villa 128 / Tower B" value={f.building} onChange={(e) => set("building", e.target.value)} />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel>Map location</FieldLabel>
                <MapPicker />
                <span className="ap-hint">Search for an address or drag the map to drop the pin precisely on the property.</span>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-lat">Latitude</FieldLabel>
                <div className="ap-coord">
                  <span className="ap-coord__tag">
                    <Icon name="compass" size={14} />
                    Lat
                  </span>
                  <input id="ap-lat" inputMode="decimal" placeholder="36.19085" value={f.lat} onChange={(e) => set("lat", e.target.value.replace(/[^\d.\-]/g, ""))} />
                </div>
              </div>
              <div className="ap-field">
                <FieldLabel htmlFor="ap-lng">Longitude</FieldLabel>
                <div className="ap-coord">
                  <span className="ap-coord__tag">
                    <Icon name="compass" size={14} />
                    Lng
                  </span>
                  <input id="ap-lng" inputMode="decimal" placeholder="44.00947" value={f.lng} onChange={(e) => set("lng", e.target.value.replace(/[^\d.\-]/g, ""))} />
                </div>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-locnotes" optional>
                  Location notes
                </FieldLabel>
                <Textarea id="ap-locnotes" rows={4} placeholder="Landmarks, access instructions, or directions that help locate the property…" value={f.locNotes} onChange={(e) => set("locNotes", e.target.value)} />
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(0)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(2)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Media</h2>
            <p className="ap-card__desc">Upload property photos, videos, and visual assets for the listing.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-grid">
              <div className="ap-field ap-col-full">
                <FieldLabel>Cover image</FieldLabel>
                <CoverImage />
                <span className="ap-hint">The cover photo headlines the listing across search results and the property page. Drag a new image here or replace it to change.</span>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel>Gallery images</FieldLabel>
                <GalleryGrid />
                <span className="ap-hint">Drag to reorder · hover an image to set it as cover or remove it.</span>
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel optional>Video upload</FieldLabel>
                <VideoUpload />
              </div>
              <div className="ap-field ap-col-full">
                <FieldLabel htmlFor="ap-tour" optional>
                  Virtual tour URL
                </FieldLabel>
                <Input id="ap-tour" size="lg" type="url" iconLeading="link" placeholder="https://..." value={f.tourUrl} onChange={(e) => set("tourUrl", e.target.value)} />
                <span className="ap-hint">Link a Matterport, YouTube, or 360° walkthrough.</span>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(1)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(3)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="ap-card">
          <div className="ap-card__body">
            <div className="ap-sect">
              <SubHead title="Property features" desc="Enter the property's specifications and characteristics." />
              <div className="ap-grid">
                <div className="ap-field">
                  <FieldLabel>Bedrooms</FieldLabel>
                  <Stepper value={f.beds} onChange={(v) => set("beds", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel>Bathrooms</FieldLabel>
                  <Stepper value={f.baths} onChange={(v) => set("baths", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel optional>Parking spaces</FieldLabel>
                  <Stepper value={f.parking} onChange={(v) => set("parking", v)} min={0} />
                </div>
                <div className="ap-field">
                  <FieldLabel optional>Levels / floors</FieldLabel>
                  <Stepper value={f.floors} onChange={(v) => set("floors", v)} min={1} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-year" optional>
                    Year built
                  </FieldLabel>
                  <Input id="ap-year" size="lg" inputMode="numeric" maxLength={4} placeholder="e.g. 2022" value={f.year} onChange={(e) => set("year", e.target.value.replace(/[^\d]/g, "").slice(0, 4))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-orientation" optional>
                    Orientation
                  </FieldLabel>
                  <Dropdown id="ap-orientation" placeholder="Select orientation" value={f.orientation} onChange={(v) => set("orientation", v)} options={ORIENTATIONS.map((o) => ({ value: o, label: o }))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-condition">Property condition</FieldLabel>
                  <Dropdown id="ap-condition" placeholder="Select condition" value={f.condition} onChange={(v) => set("condition", v)} options={CONDITIONS.map((o) => ({ value: o, label: o }))} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-furnishing">Furnishing</FieldLabel>
                  <Dropdown id="ap-furnishing" placeholder="Select furnishing" value={f.furnishing} onChange={(v) => set("furnishing", v)} options={FURNISHING.map((o) => ({ value: o, label: o }))} />
                </div>
              </div>
            </div>
            <div className="ap-sect">
              <SubHead title="Amenities" desc="Select all amenities available for this property." />
              <AmenityGrid value={f.amenities} onChange={(v) => set("amenities", v)} />
              <div className="ap-field">
                <FieldLabel optional>Custom amenities</FieldLabel>
                <CustomAmenities
                  items={f.customAmenities}
                  onAdd={(t) => set("customAmenities", f.customAmenities.includes(t) ? f.customAmenities : [...f.customAmenities, t])}
                  onRemove={(i) => set("customAmenities", f.customAmenities.filter((_, idx) => idx !== i))}
                />
                <span className="ap-hint">Add anything specific to this property that isn&apos;t listed above.</span>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(2)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(4)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Ownership &amp; assignment</h2>
            <p className="ap-card__desc">Add the property owner information and assign the property to an agent.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-owner-name">Owner full name</FieldLabel>
                  <Input id="ap-owner-name" size="lg" iconLeading="user" placeholder="e.g. Hêmin Abdullah" value={f.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-owner-phone">Phone number</FieldLabel>
                  <Input id="ap-owner-phone" size="lg" type="tel" iconLeading="phone" placeholder="+964 750 000 0000" value={f.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} />
                </div>
                <div className="ap-field">
                  <FieldLabel htmlFor="ap-owner-email">Email address</FieldLabel>
                  <Input id="ap-owner-email" size="lg" type="email" iconLeading="mail" placeholder="owner@email.com" value={f.ownerEmail} onChange={(e) => set("ownerEmail", e.target.value)} />
                </div>
              </div>
            </div>
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-agent">Assigned agent</FieldLabel>
                  {(() => {
                    const sel = AGENTS.find((a) => a.id === f.agent);
                    return sel ? <AgentSummary agent={sel} onClear={() => set("agent", "")} /> : <AgentSelect id="ap-agent" value={f.agent} onChange={(v) => set("agent", v)} />;
                  })()}
                </div>
              </div>
            </div>
            <div className="ap-sect ap-sect--flush">
              <div className="ap-grid">
                <div className="ap-field ap-col-full">
                  <FieldLabel htmlFor="ap-notes" optional>
                    Internal notes
                  </FieldLabel>
                  <Textarea id="ap-notes" rows={4} placeholder="Pricing flexibility, owner availability, key handover details, or anything the team should know…" value={f.internalNotes} onChange={(e) => set("internalNotes", e.target.value)} />
                  <span className="ap-staffnote">
                    <Icon name="lock" size={14} />
                    Visible only to staff and administrators. Not displayed on the public website.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(3)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="secondary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => goTo(5)}>
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="ap-card">
          <div className="ap-card__head">
            <h2 className="ap-card__title">Review &amp; publish</h2>
            <p className="ap-card__desc">Review all property information before submitting the listing for approval.</p>
          </div>
          <div className="ap-card__body">
            <div className="ap-rev">
              <ReviewSection icon="home" title="Property details" onEdit={() => goTo(0)}>
                <div className="ap-rev__grid">
                  <RevItem k="Listing title" v={rev.title} full />
                  <RevItem k="Property type" v={rev.type} />
                  <RevItem k="Listing type" v={rev.listing} />
                  <RevItem k="Price" v={rev.price} price tnum />
                  <RevItem k="Area size" v={rev.area} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="map-pin" title="Location" onEdit={() => goTo(1)}>
                <div className="ap-rev__grid">
                  <RevItem k="City" v={rev.city} />
                  <RevItem k="Area / district" v={rev.district} />
                  <RevItem k="Street address" v={rev.street} full />
                  <RevItem k="Building number" v={rev.building} />
                  <RevItem k="Coordinates" v={rev.lat + ", " + rev.lng} tnum />
                </div>
              </ReviewSection>
              <ReviewSection icon="image" title="Media" onEdit={() => goTo(2)}>
                <div className="ap-rev__media">
                  <div className="ap-rev__thumbs">
                    {GALLERY_IMGS.slice(0, 4).map((g, i) => (
                      <span className={"ap-rev__thumb" + (i === 0 ? " ap-rev__thumb--cover" : "")} key={g.id}>
                        <img src={g.url} alt="" />
                        {i === 0 && (
                          <span className="ap-rev__thumb-tag">
                            <Icon name="star" size={9} strokeWidth={2.5} />
                            Cover
                          </span>
                        )}
                      </span>
                    ))}
                    <span className="ap-rev__more">+8</span>
                  </div>
                  <div className="ap-rev__stats">
                    <span className="ap-rev__stat">
                      <Icon name="image" size={16} />
                      <b>12</b> photos uploaded
                    </span>
                    <span className="ap-rev__stat">
                      <Icon name="video" size={16} />
                      <b>1</b> video uploaded
                    </span>
                    <span className="ap-rev__stat">
                      <Icon name="star" size={16} />
                      Cover photo selected
                    </span>
                  </div>
                </div>
              </ReviewSection>
              <ReviewSection icon="ruler" title="Property features" onEdit={() => goTo(3)}>
                <div className="ap-rev__grid">
                  <RevItem k="Bedrooms" v={f.beds} tnum />
                  <RevItem k="Bathrooms" v={f.baths} tnum />
                  <RevItem k="Parking spaces" v={f.parking} tnum />
                  <RevItem k="Levels / floors" v={f.floors} tnum />
                  <RevItem k="Year built" v={rev.year} tnum />
                  <RevItem k="Orientation" v={rev.orientation} />
                  <RevItem k="Condition" v={f.condition} />
                  <RevItem k="Furnishing" v={f.furnishing} />
                </div>
              </ReviewSection>
              <ReviewSection icon="sparkles" title="Amenities" onEdit={() => goTo(3)}>
                <div className="ap-rev__amen">
                  {f.amenities.map((a) => (
                    <span className="ap-rev__pill" key={a}>
                      <Icon name={AMEN_IC[a] || "check"} size={15} />
                      {a}
                    </span>
                  ))}
                  {f.customAmenities.map((a) => (
                    <span className="ap-rev__pill ap-rev__pill--custom" key={"c-" + a}>
                      <Icon name="sparkles" size={14} />
                      {a}
                    </span>
                  ))}
                </div>
              </ReviewSection>
              <ReviewSection icon="user-round" title="Ownership & assignment" onEdit={() => goTo(4)}>
                <div className="ap-rev__grid">
                  <RevItem k="Owner" v={rev.ownerName} />
                  <RevItem k="Owner phone" v={rev.ownerPhone} tnum />
                  <RevItem k="Owner email" v={rev.ownerEmail} full />
                  <div className="ap-rev__item ap-rev__item--full">
                    <span className="ap-rev__k">Assigned agent</span>
                    <span className="ap-rev__agent">
                      <Avatar src={revAgent.avatar} name={revAgent.name} size="xs" verified />
                      <span className="ap-rev__agent-name">
                        {revAgent.name}
                        <Badge variant="brand" size="sm" icon="badge-check">
                          Verified
                        </Badge>
                      </span>
                    </span>
                  </div>
                </div>
              </ReviewSection>
            </div>
          </div>
          <div className="ap-foot">
            <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(4)}>
              Previous
            </Button>
            <div className="ap-foot__right">
              <Button hierarchy="tertiary" size="lg" iconLeading="save">
                Save draft
              </Button>
              <Button hierarchy="primary" size="lg" onClick={() => goTo(6)}>
                Publish property
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
