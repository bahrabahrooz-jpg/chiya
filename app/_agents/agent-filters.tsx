"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { Checkbox } from "@/components/ui/choice";
import { useLang } from "@/lib/i18n";
import {
  cities,
  languageOpts,
  experienceBands,
  type AgentFilters,
  type AgentFilterHandlers,
} from "./data";

/* The agent filter panel reuses the SRP filter chrome (.srp-filters / .srp-fsec
   / .srp-typerow / .srp-quick) so the directory matches the search page exactly.
   Filter set mirrors the mobile Agents tab: City (multi), Language (multi),
   Experience band (single). */

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

/** Multi-select checkbox list (City, Language). */
function CheckGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="srp-typelist">
      {options.map((o) => {
        const on_ = selected.includes(o.value);
        return (
          <div
            key={o.value}
            role="checkbox"
            aria-checked={on_}
            className={"srp-typerow" + (on_ ? " srp-typerow--on" : "")}
            onClick={() => onToggle(o.value)}
          >
            <span className="srp-cbox">
              <Checkbox checked={on_} readOnly />
            </span>
            <span className="srp-typerow__label">{o.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export interface AgentFiltersPanelProps {
  f: AgentFilters;
  on: AgentFilterHandlers;
  activeCount: number;
  onClearAll: () => void;
}

export function AgentFiltersPanel({ f, on, activeCount, onClearAll }: AgentFiltersPanelProps) {
  const { t } = useLang();
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

      <Section title={t("agents.sec.city")} count={f.cities.length}>
        <CheckGroup
          options={cities.map((c) => ({ value: c, label: t("city." + c) }))}
          selected={f.cities}
          onToggle={on.toggleCity}
        />
      </Section>

      <Section title={t("agents.sec.language")} count={f.languages.length}>
        <CheckGroup
          options={languageOpts.map((l) => ({ value: l, label: t("admin.agents.langOpt." + l) }))}
          selected={f.languages}
          onToggle={on.toggleLanguage}
        />
      </Section>

      <Section title={t("agents.sec.experience")} count={f.experience ? 1 : 0}>
        <CheckGroup
          options={experienceBands.map((b) => ({ value: b.value, label: t("agents.exp." + b.value) }))}
          selected={f.experience ? [f.experience] : []}
          onToggle={on.setExperience}
        />
      </Section>
    </div>
  );
}
