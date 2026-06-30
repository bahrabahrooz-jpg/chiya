"use client";

import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { Checkbox } from "@/components/ui/choice";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import * as D from "./data";
import type { Filters, FilterHandlers, RangeVal } from "./types";

const onlyDigits = (s: string) => (s || "").replace(/[^0-9]/g, "");
const commas = (s: string) => onlyDigits(s).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const parseRange = (v: string) => {
  const [a, b] = v.split("-");
  return { lo: a ? Number(a) : null, hi: b ? Number(b) : null };
};

function Section({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="srp-fsec">
      <button type="button" className="srp-fsec__head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="srp-fsec__title">
          {title}
          {count != null && count > 0 && <span className="srp-fsec__count">{count}</span>}
        </span>
        <Icon name="chevron-down" size={18} className={"srp-fsec__chev" + (open ? " srp-fsec__chev--open" : "")} />
      </button>
      {open && <div className="srp-fsec__body">{children}</div>}
    </div>
  );
}

function QuickRow({ options, value, onPick }: { options: D.Opt[]; value: string; onPick: (v: string) => void }) {
  const { t } = useLang();
  const opts = [{ value: "", label: "Any" }, ...options];
  const labelFor = (o: D.Opt) => (o.value === "" ? t("srp.any") : o.label === "Studio" ? t("srp.studio") : o.label);
  return (
    <div className="srp-quickrow">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          className={"srp-quick" + (value === o.value ? " srp-quick--on" : "")}
          onClick={() => onPick(o.value)}
        >
          {labelFor(o)}
        </button>
      ))}
    </div>
  );
}

function RangeGroup({
  presets,
  value,
  onPick,
  deal,
  kind,
}: {
  presets: D.Opt[];
  value: RangeVal | null;
  onPick: (p: RangeVal | null) => void;
  deal?: "buy" | "rent";
  kind: "price" | "size";
}) {
  const { t } = useLang();
  const [lo, setLo] = useState(value?.custom && value.lo != null ? String(value.lo) : "");
  const [hi, setHi] = useState(value?.custom && value.hi != null ? String(value.hi) : "");
  const isCustom = !!value?.custom;
  const presetPrefix = kind === "size" ? "preset.size." : deal === "rent" ? "preset.rent." : "preset.buy.";

  const makeLabel = (l: number | null, h: number | null) => {
    const any = t("srp.any");
    if (kind === "size") {
      const a = l ? commas(String(l)) : any;
      const b = h ? commas(String(h)) : any;
      return a + " – " + b + " m²";
    }
    const suffix = deal === "rent" ? "/mo" : "";
    const fmt = (n: number) => "$" + commas(String(n));
    return (l ? fmt(l) : any) + " – " + (h ? fmt(h) : any) + suffix;
  };

  const applyCustom = () => {
    const l = lo ? Number(onlyDigits(lo)) : null;
    const h = hi ? Number(onlyDigits(hi)) : null;
    if (l == null && h == null) return;
    onPick({ lo: l, hi: h, label: makeLabel(l, h), custom: true });
  };

  return (
    <>
      <div className="srp-presets">
        {presets.map((p, idx) => {
          const sel = value && !value.custom && value.preset === p.value;
          const label = t(presetPrefix + idx);
          return (
            <button
              key={p.value}
              type="button"
              className={"srp-radio" + (sel ? " srp-radio--on" : "")}
              onClick={() => {
                if (sel) {
                  onPick(null);
                  return;
                }
                const r = parseRange(p.value);
                onPick({ lo: r.lo, hi: r.hi, label, preset: p.value });
              }}
            >
              <span className="srp-radio__dot" />
              <span className="srp-radio__label">{label}</span>
            </button>
          );
        })}
      </div>
      <div className="srp-custom">
        <div className="srp-custom__label">
          {kind === "size" ? t("srp.customSize") : deal === "rent" ? t("srp.customRent") : t("srp.customPrice")}
        </div>
        <div className="srp-range">
          <Input
            size="sm"
            placeholder={t("srp.min")}
            inputMode="numeric"
            iconLeading={kind === "size" ? undefined : "dollar-sign"}
            value={commas(lo)}
            onChange={(e) => setLo(onlyDigits(e.target.value))}
          />
          {kind === "size" && <span className="srp-range__unit">m²</span>}
          <span className="srp-range__dash">–</span>
          <Input
            size="sm"
            placeholder={t("srp.max")}
            inputMode="numeric"
            iconLeading={kind === "size" ? undefined : "dollar-sign"}
            value={commas(hi)}
            onChange={(e) => setHi(onlyDigits(e.target.value))}
          />
          {kind === "size" && <span className="srp-range__unit">m²</span>}
        </div>
        <Button hierarchy={isCustom ? "primary" : "secondary"} size="sm" fullWidth onClick={applyCustom}>
          {isCustom ? t("srp.customApplied") : t("srp.applyCustom")}
        </Button>
      </div>
    </>
  );
}

export interface SrpFiltersProps {
  deal: "buy" | "rent";
  f: Filters;
  on: FilterHandlers;
  activeCount: number;
  onClearAll: () => void;
}

export function SrpFilters({ deal, f, on, activeCount, onClearAll }: SrpFiltersProps) {
  const { t } = useLang();
  const typeCounts: Record<string, number> = {};
  D.listings.forEach((l) => {
    if (l.deal === deal) typeCounts[l.type] = (typeCounts[l.type] || 0) + 1;
  });
  const priceLabel = deal === "rent" ? t("srp.sec.monthlyRent") : t("srp.sec.priceRange");
  const presets = deal === "rent" ? D.rentPresets : D.buyPresets;

  return (
    <div className="srp-filters">
      <div className="srp-filters__top">
        <div className="srp-filters__title">
          <Icon name="sliders-horizontal" size={18} />
          {t("srp.filters")}
          {activeCount > 0 && <span className="srp-filters__badge">{activeCount}</span>}
        </div>
        {activeCount > 0 && (
          <button type="button" className="srp-clear" onClick={onClearAll}>
            {t("srp.clearAll")}
          </button>
        )}
      </div>

      <Section title={t("srp.sec.type")} count={f.types.length}>
        <div className="srp-typelist">
          {D.propertyTypes.map((ty) => {
            const on_ = f.types.includes(ty.value);
            return (
              <div
                key={ty.value}
                role="checkbox"
                aria-checked={on_}
                className={"srp-typerow" + (on_ ? " srp-typerow--on" : "")}
                onClick={() => on.toggleType(ty.value)}
              >
                <span className="srp-cbox">
                  <Checkbox checked={on_} readOnly />
                </span>
                <Icon name={ty.icon as IconName} size={17} className="srp-typerow__ic" />
                <span className="srp-typerow__label">{t("type." + ty.value)}</span>
                <span className="srp-typerow__count">{typeCounts[ty.value] || 0}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title={priceLabel} count={f.price ? 1 : 0}>
        <RangeGroup presets={presets} value={f.price} onPick={on.setPrice} deal={deal} kind="price" />
      </Section>

      <Section title={t("srp.sec.size")} count={f.size ? 1 : 0}>
        <RangeGroup presets={D.sizePresets} value={f.size} onPick={on.setSize} kind="size" />
      </Section>

      <Section title={t("srp.sec.beds")} count={f.beds !== "" ? 1 : 0}>
        <QuickRow options={D.beds} value={f.beds} onPick={on.setBeds} />
      </Section>

      <Section title={t("srp.sec.baths")} count={f.baths !== "" ? 1 : 0}>
        <QuickRow options={D.baths} value={f.baths} onPick={on.setBaths} />
      </Section>

      <Section title={t("srp.sec.amenities")} count={f.amenities.length}>
        <div className="srp-amen">
          {D.amenities.map((a) => {
            const on_ = f.amenities.includes(a.value);
            return (
              <div
                key={a.value}
                role="checkbox"
                aria-checked={on_}
                className={"srp-amenrow" + (on_ ? " srp-amenrow--on" : "")}
                onClick={() => on.toggleAmenity(a.value)}
              >
                <span className="srp-cbox">
                  <Checkbox checked={on_} readOnly />
                </span>
                <Icon name={a.icon as IconName} size={16} className="srp-amenrow__ic" />
                <span className="srp-amenrow__label">{t("amen." + a.value)}</span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
