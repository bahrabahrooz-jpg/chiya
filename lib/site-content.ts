"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Lang } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { ar } from "@/lib/i18n/ar";
import { ku } from "@/lib/i18n/ku";

/**
 * Site-content store — the marketing/CMS layer the super admin edits: the FAQ,
 * footer social + contact, the legal pages (Privacy / Terms), and the About
 * page copy. Distinct from the operational admin (properties, viewings) and
 * from platform config (lib/admin-settings.ts) — this is the public-facing
 * *content* that used to be hardcoded in i18n and only a developer could change.
 *
 * Same external-store shape as lib/admin-settings.ts: module `current` +
 * listeners, versioned localStorage key, a deterministic DEFAULT_CONTENT seed
 * so SSR and the first client render agree (no hydration mismatch), and a
 * deep-merging parse() so fields added in a later build survive an old cache.
 *
 * DEFAULT_CONTENT is seeded from the *current* i18n catalogs, so the public
 * pages look identical to today until an admin actually edits something. There
 * is no backend — edits persist to this browser only.
 */

/** A string in all three site languages. Blank AR/KU fall back to EN via pick(). */
export interface Loc {
  en: string;
  ar: string;
  ku: string;
}

export interface FaqEntry {
  id: string;
  q: Loc;
  a: Loc;
}

export interface LegalSectionContent {
  id: string;
  heading: Loc;
  body: Loc;
}

export interface LegalPage {
  /** Page hero: eyebrow + title above the reading layout. */
  eyebrow: Loc;
  title: Loc;
  /** Plain "Last updated" display string (not localized in the demo). */
  updated: string;
  intro: Loc;
  sections: LegalSectionContent[];
}

export interface AboutValue {
  title: Loc;
  desc: Loc;
}

/** A homepage band header (eyebrow / title / subtitle) — the copy above a
    data-driven section. The section's *content* stays derived; only the framing
    text is CMS-managed. */
export interface SectionHead {
  eyebrow: Loc;
  title: Loc;
  sub: Loc;
}

/** The homepage section ids the CMS owns copy for. Order matches the page. */
export type HomeSectionId = "feat2" | "cats" | "locs" | "why" | "agents" | "test";
export const HOME_SECTION_IDS: HomeSectionId[] = ["feat2", "cats", "locs", "why", "agents", "test"];

export interface HomePillar {
  title: Loc;
  desc: Loc;
}

export interface HomeTestimonial {
  name: Loc;
  loc: Loc;
  quote: Loc;
}

export interface HomeCtaCard {
  cta: Loc;
}

export interface SiteContent {
  home: {
    heroTitle: Loc;
    heroSub: Loc;
    sections: Record<HomeSectionId, SectionHead>;
    pillars: HomePillar[];
    testimonials: HomeTestimonial[];
    ctaTitle: Loc;
    ctaSub: Loc;
    ctaCards: { find: HomeCtaCard; agent: HomeCtaCard; list: HomeCtaCard };
  };
  faq: FaqEntry[];
  faqHero: SectionHead;
  footer: {
    social: { linkedin: string; instagram: string; facebook: string };
    contact: { address: Loc; phone: string; email: string };
  };
  legal: {
    privacy: LegalPage;
    terms: LegalPage;
  };
  about: {
    heroTitle: Loc;
    heroSub: Loc;
    valuesTitle: Loc;
    valuesSub: Loc;
    values: AboutValue[];
    ctaTitle: Loc;
    ctaSub: Loc;
  };
}

/** Read a localized string with an English fallback for empty translations. */
export function pick(loc: Loc | undefined, lang: Lang): string {
  if (!loc) return "";
  return loc[lang]?.trim() ? loc[lang] : loc.en;
}

/* --------------------------- seed from i18n --------------------------- */
/* Build a Loc from a catalog key across all three languages. Reading the live
   catalogs (rather than copying strings) keeps the CMS seed in lockstep with
   whatever the i18n files currently say. */
const loc = (key: string): Loc => ({ en: en[key as keyof typeof en] ?? "", ar: ar[key as keyof typeof en] ?? "", ku: ku[key as keyof typeof en] ?? "" });

const FAQ_COUNT = 8;
const PRIVACY_COUNT = 7;
const TERMS_COUNT = 8;
const ABOUT_VALUES = 4;
const HOME_PILLARS = 4;
const HOME_TESTIMONIALS = 3;

function seedFaq(): FaqEntry[] {
  return Array.from({ length: FAQ_COUNT }, (_, i) => ({
    id: `q${i}`,
    q: loc(`faq.q.${i}.q`),
    a: loc(`faq.q.${i}.a`),
  }));
}

function seedLegal(prefix: "privacy" | "terms", count: number): LegalPage {
  return {
    eyebrow: loc(`${prefix}.eyebrow`),
    title: loc(`${prefix}.title`),
    updated: en[`${prefix}.updated` as keyof typeof en] ?? "",
    intro: loc(`${prefix}.intro`),
    sections: Array.from({ length: count }, (_, i) => ({
      id: `s${i + 1}`,
      heading: loc(`${prefix}.s${i + 1}.title`),
      body: loc(`${prefix}.s${i + 1}.body`),
    })),
  };
}

/** A band header seeded from the `sec.<id>.*` i18n keys. */
function seedHead(id: HomeSectionId): SectionHead {
  return { eyebrow: loc(`sec.${id}.eyebrow`), title: loc(`sec.${id}.title`), sub: loc(`sec.${id}.sub`) };
}

function seedHome(): SiteContent["home"] {
  return {
    heroTitle: loc("hero.title"),
    heroSub: loc("hero.sub"),
    sections: HOME_SECTION_IDS.reduce(
      (acc, id) => ((acc[id] = seedHead(id)), acc),
      {} as Record<HomeSectionId, SectionHead>,
    ),
    pillars: Array.from({ length: HOME_PILLARS }, (_, i) => ({ title: loc(`why.${i}.title`), desc: loc(`why.${i}.desc`) })),
    testimonials: Array.from({ length: HOME_TESTIMONIALS }, (_, i) => ({
      name: loc(`test.${i}.name`),
      loc: loc(`test.${i}.loc`),
      quote: loc(`test.${i}.quote`),
    })),
    ctaTitle: loc("cta.title"),
    ctaSub: loc("cta.sub"),
    ctaCards: { find: { cta: loc("cta.find.cta") }, agent: { cta: loc("cta.agent.cta") }, list: { cta: loc("cta.list.cta") } },
  };
}

export const DEFAULT_CONTENT: SiteContent = {
  home: seedHome(),
  faq: seedFaq(),
  faqHero: { eyebrow: loc("faq.hero.eyebrow"), title: loc("faq.hero.title"), sub: loc("faq.hero.sub") },
  footer: {
    // Currently the footer renders href="#" — seed blank so the admin fills in
    // the real profile URLs; a blank URL renders as a disabled icon.
    social: { linkedin: "", instagram: "", facebook: "" },
    contact: {
      // Mirrors the footer's DEFAULT_CONTACT (address was hardcoded English).
      address: { en: "100 Meter Road, Erbil, Kurdistan", ar: "100 Meter Road, Erbil, Kurdistan", ku: "100 Meter Road, Erbil, Kurdistan" },
      phone: "+964 750 000 0000",
      email: "hello@chiyaestate.com",
    },
  },
  legal: {
    privacy: seedLegal("privacy", PRIVACY_COUNT),
    terms: seedLegal("terms", TERMS_COUNT),
  },
  about: {
    heroTitle: loc("about.hero.title"),
    heroSub: loc("about.hero.sub"),
    valuesTitle: loc("about.values.title"),
    valuesSub: loc("about.values.sub"),
    values: Array.from({ length: ABOUT_VALUES }, (_, i) => ({
      title: loc(`about.value.${i}.title`),
      desc: loc(`about.value.${i}.desc`),
    })),
    ctaTitle: loc("about.cta.title"),
    ctaSub: loc("about.cta.sub"),
  },
};

// Bump when the DEFAULT_CONTENT schema changes so stale caches are dropped.
const KEY = "chiya:site-content:v2";

let current: SiteContent = DEFAULT_CONTENT;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Deep-merge stored content over defaults so newly-added fields always exist.
    Arrays (faq, sections, values) are replaced wholesale when present — the
    admin owns their length — otherwise the default array is kept. */
function parse(raw: string | null): SiteContent {
  if (!raw) return DEFAULT_CONTENT;
  try {
    const p = JSON.parse(raw) as Partial<SiteContent>;
    const ph = p.home;
    return {
      home: {
        ...DEFAULT_CONTENT.home,
        ...ph,
        // Fixed-key record: merge each band over its default so a section added
        // in a later build always exists even in an old cache.
        sections: HOME_SECTION_IDS.reduce(
          (acc, id) => ((acc[id] = { ...DEFAULT_CONTENT.home.sections[id], ...ph?.sections?.[id] }), acc),
          {} as Record<HomeSectionId, SectionHead>,
        ),
        pillars: ph?.pillars ?? DEFAULT_CONTENT.home.pillars,
        testimonials: ph?.testimonials ?? DEFAULT_CONTENT.home.testimonials,
        ctaCards: { ...DEFAULT_CONTENT.home.ctaCards, ...ph?.ctaCards },
      },
      faq: p.faq ?? DEFAULT_CONTENT.faq,
      faqHero: { ...DEFAULT_CONTENT.faqHero, ...p.faqHero },
      footer: {
        social: { ...DEFAULT_CONTENT.footer.social, ...p.footer?.social },
        contact: { ...DEFAULT_CONTENT.footer.contact, ...p.footer?.contact },
      },
      legal: {
        privacy: { ...DEFAULT_CONTENT.legal.privacy, ...p.legal?.privacy },
        terms: { ...DEFAULT_CONTENT.legal.terms, ...p.legal?.terms },
      },
      about: { ...DEFAULT_CONTENT.about, ...p.about },
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    current = parse(localStorage.getItem(KEY));
  } catch {
    /* noop */
  }
}

function subscribe(onChange: () => void) {
  hydrate();
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      current = parse(e.newValue);
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return DEFAULT_CONTENT;
}

export function useSiteContent() {
  const content = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((next: SiteContent) => {
    current = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(current));
    } catch {
      /* noop */
    }
    emit();
  }, []);

  return { content, save };
}
