"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useLang, LANGS, type Lang } from "@/lib/i18n";
import { logAudit } from "../_shared/audit-log";
import {
  useSiteContent,
  pick,
  HOME_SECTION_IDS,
  type SiteContent,
  type Loc,
  type FaqEntry,
  type LegalSectionContent,
  type HomeSectionId,
  type HomeTestimonial,
} from "@/lib/site-content";
import { CONTENT_SECTIONS, ABOUT_VALUE_ICONS, HOME_PILLAR_ICONS, HOME_SECTION_LABEL_KEYS, type ContentSectionId } from "./data";

/* ----------------------------------------------------------------------------
   Content (CMS) hub — the super admin's editor for public marketing content:
   FAQ, footer social + contact, legal pages, and About copy. Same shell as the
   Settings screen (st-split section-nav + pf-card detail); the ct-namespace
   adds the CMS-specific pieces (the per-language LocField, list rows, and
   add/reorder/delete controls).

   Every editable string is a Loc { en, ar, ku }. Each section edits a local
   draft and auto-saves the whole content blob shortly after edits settle
   (persisted via useSiteContent, + a logAudit entry + a toast) — see
   useAutoSave. There is no manual Save/Cancel bar.
   ------------------------------------------------------------------------- */

const LANG_LABEL: Record<Lang, string> = { en: "EN", ar: "AR", ku: "KU" };
const isRtlLang = (l: Lang) => l === "ar" || l === "ku";

/** The EN/AR/KU tab strip. Standalone so it can be shared across several
    LocFields (e.g. the FAQ modal switches question + answer together). */
function LangSwitch({ label, sub, onSub, flag }: { label: string; sub: Lang; onSub: (l: Lang) => void; flag?: (l: Lang) => boolean }) {
  return (
    <div className="ct-langsw" role="tablist" aria-label={label}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={sub === l}
          className={"ct-langsw__btn" + (sub === l ? " is-active" : "") + (flag?.(l) ? " is-empty" : "")}
          onClick={() => onSub(l)}
        >
          {LANG_LABEL[l]}
        </button>
      ))}
    </div>
  );
}

/** A single localized field: a label, an EN/AR/KU switch, and the bound input.
    The active sub-language defaults to a local state (independent of the app's
    display language, so an English admin can still fill in Arabic), but callers
    can pass `sub`/`onSub` to drive it externally — used to keep the FAQ modal's
    question and answer on the same language at once. */
function LocField({
  label,
  value,
  onChange,
  textarea,
  rows,
  placeholder,
  sub: subProp,
  onSub,
  hideSwitch,
}: {
  label: string;
  value: Loc;
  onChange: (next: Loc) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
  sub?: Lang;
  onSub?: (l: Lang) => void;
  hideSwitch?: boolean;
}) {
  const [localSub, setLocalSub] = useState<Lang>("en");
  const sub = subProp ?? localSub;
  const setSub = onSub ?? setLocalSub;
  const rtl = isRtlLang(sub);
  return (
    <div className="ct-locfield">
      <div className="ct-locfield__top">
        <span className="ct-locfield__label">{label}</span>
        {!hideSwitch && <LangSwitch label={label} sub={sub} onSub={setSub} flag={(l) => !value[l]?.trim()} />}
      </div>
      {textarea ? (
        <Textarea
          value={value[sub]}
          dir={rtl ? "rtl" : "ltr"}
          rows={rows ?? 3}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [sub]: e.target.value })}
        />
      ) : (
        <Input
          value={value[sub]}
          dir={rtl ? "rtl" : "ltr"}
          placeholder={placeholder}
          onChange={(e) => onChange({ ...value, [sub]: e.target.value })}
        />
      )}
    </div>
  );
}

/** Plain (non-localized) labelled field — for URLs, phone, email. */
function PlainField({
  label,
  value,
  onChange,
  placeholder,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: import("@/components/ui/icon").IconName;
}) {
  return (
    <label className="ct-plain">
      <span className="ct-locfield__label">{label}</span>
      <Input value={value} placeholder={placeholder} iconLeading={icon} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Card({ title, desc, children, action }: { title: string; desc?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="pf-card">
      <div className="pf-card__head">
        <div>
          <h3 className="pf-card__title">{title}</h3>
          {desc ? <p className="pf-card__desc">{desc}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Auto-save hook: keeps a local editing `draft` for smooth typing and pushes
    it to the store shortly after edits stop. Replaces the old manual Save bar —
    every change persists on its own, so there is no dirty/Cancel/Save state.

    `initial` seeds the draft once (each section remounts when the nav switches,
    so it re-seeds naturally). `persist` fires debounced, only after the draft
    diverges from what was first loaded. */
function useAutoSave<T>(initial: T, persist: (next: T) => void): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [draft, setDraft] = useState<T>(initial);
  const persistRef = useRef(persist);
  const baselineRef = useRef<string>(JSON.stringify(initial));

  useEffect(() => {
    persistRef.current = persist;
  });

  useEffect(() => {
    const serialized = JSON.stringify(draft);
    if (serialized === baselineRef.current) return;
    const id = setTimeout(() => {
      baselineRef.current = serialized;
      persistRef.current(draft);
    }, 600);
    return () => clearTimeout(id);
  }, [draft]);

  return [draft, setDraft];
}

const EMPTY_LOC: Loc = { en: "", ar: "", ku: "" };
const newId = () => "x" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* --------------------------------- FAQ ------------------------------------ */

/** The FAQ add/edit modal: one entry's question + answer, sharing a single
    EN/AR/KU switcher so both fields move to the same language together. Edits a
    local copy and hands it back on Save — the parent commits it into the draft
    list, which then auto-saves. */
function FaqEntryModal({
  entry,
  isNew,
  onClose,
  onApply,
}: {
  entry: FaqEntry;
  isNew: boolean;
  onClose: () => void;
  onApply: (next: FaqEntry) => void;
}) {
  const { t } = useLang();
  const [sub, setSub] = useState<Lang>("en");
  const [q, setQ] = useState<Loc>(entry.q);
  const [a, setA] = useState<Loc>(entry.a);
  const canSave = q.en.trim().length > 0 && a.en.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isNew ? "admin.content.faq.addTitle" : "admin.content.faq.editTitle")}
      size="lg"
      footer={
        <>
          <Button hierarchy="secondary" onClick={onClose}>
            {t("admin.topbar.cancel")}
          </Button>
          <Button hierarchy="primary" disabled={!canSave} onClick={() => onApply({ ...entry, q, a })}>
            {t(isNew ? "admin.content.faq.add" : "admin.content.faq.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="ct-modalfields">
        <div className="ct-modalfields__langrow">
          <LangSwitch label={t("admin.content.faq.q")} sub={sub} onSub={setSub} flag={(l) => !q[l]?.trim() || !a[l]?.trim()} />
        </div>
        <LocField label={t("admin.content.faq.q")} value={q} onChange={setQ} sub={sub} onSub={setSub} hideSwitch />
        <LocField label={t("admin.content.faq.a")} value={a} onChange={setA} sub={sub} onSub={setSub} hideSwitch textarea rows={4} />
      </div>
    </Modal>
  );
}

function FaqSection({ content, onSave }: { content: SiteContent; onSave: (patch: Partial<SiteContent>, section: string) => void }) {
  const { t, lang } = useLang();
  const section = t("admin.content.nav.faq");
  const [draft, setDraft] = useAutoSave<FaqEntry[]>(content.faq, (faq) => onSave({ faq }, section));
  const [hero, setHero] = useAutoSave(content.faqHero, (faqHero) => onSave({ faqHero }, section));
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  // `editing` holds the index being edited; -1 means the add flow.
  const [editing, setEditing] = useState<number | null>(null);

  const applyEntry = (next: FaqEntry) => {
    setDraft((d) => (editing === -1 ? [...d, next] : d.map((e, idx) => (idx === editing ? next : e))));
    setEditing(null);
  };

  const editingEntry = editing === -1 ? { id: newId(), q: { ...EMPTY_LOC }, a: { ...EMPTY_LOC } } : editing !== null ? draft[editing] : null;

  return (
    <>
      <Card title={t("admin.content.about.heroTitle")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.home.eyebrow")} value={hero.eyebrow} onChange={(eyebrow) => setHero((h) => ({ ...h, eyebrow }))} />
          <LocField label={t("admin.content.home.title")} value={hero.title} onChange={(title) => setHero((h) => ({ ...h, title }))} />
          <LocField label={t("admin.content.home.sub")} value={hero.sub} onChange={(sub) => setHero((h) => ({ ...h, sub }))} textarea rows={2} />
        </div>
      </Card>

      <Card
        title={t("admin.content.faq.title")}
        desc={t("admin.content.faq.desc")}
        action={
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setEditing(-1)}>
            {t("admin.content.faq.add")}
          </Button>
        }
      >
        <div className="ct-list">
          {draft.map((e, i) => (
            <div key={e.id} className="ct-faqrow">
              <div className="ct-faqrow__main">
                <span className="ct-item__num">{i + 1}</span>
                <div className="ct-faqrow__qa">
                  <p className="ct-faqrow__q">{pick(e.q, lang)}</p>
                  <p className="ct-faqrow__a">{pick(e.a, lang)}</p>
                </div>
              </div>
              <div className="ct-faqrow__ctl">
                <button type="button" className="ct-iconbtn" onClick={() => setEditing(i)} aria-label={t("admin.content.faq.edit")}>
                  <Icon name="pencil" size={16} />
                </button>
                <button type="button" className="ct-iconbtn ct-iconbtn--danger" onClick={() => setConfirmDel(i)} aria-label={t("admin.content.delete")}>
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            </div>
          ))}
          {draft.length === 0 && <p className="ct-empty">{t("admin.content.faq.empty")}</p>}
        </div>
      </Card>

      {editingEntry && <FaqEntryModal entry={editingEntry} isNew={editing === -1} onClose={() => setEditing(null)} onApply={applyEntry} />}

      {confirmDel !== null && (
        <Modal
          open
          onClose={() => setConfirmDel(null)}
          icon="trash-2"
          title={t("admin.content.faq.delTitle")}
          subtitle={t("admin.content.faq.delBody")}
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setConfirmDel(null)}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button
                hierarchy="destructive"
                iconLeading="trash-2"
                onClick={() => {
                  setDraft((d) => d.filter((_, idx) => idx !== confirmDel));
                  setConfirmDel(null);
                }}
              >
                {t("admin.content.delete")}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

/* -------------------------------- Footer ---------------------------------- */

function FooterSection({ content, onSave }: { content: SiteContent; onSave: (patch: Partial<SiteContent>, section: string) => void }) {
  const { t } = useLang();
  const section = t("admin.content.nav.footer");
  const [draft, setDraft] = useAutoSave(content.footer, (footer) => onSave({ footer }, section));
  const setSocial = (k: keyof typeof draft.social, v: string) => setDraft((d) => ({ ...d, social: { ...d.social, [k]: v } }));
  const setContact = <K extends keyof typeof draft.contact>(k: K, v: (typeof draft.contact)[K]) => setDraft((d) => ({ ...d, contact: { ...d.contact, [k]: v } }));

  return (
    <>
      <Card title={t("admin.content.footer.socialTitle")} desc={t("admin.content.footer.socialDesc")}>
        <div className="ct-fields">
          <PlainField label={t("admin.content.footer.linkedin")} value={draft.social.linkedin} onChange={(v) => setSocial("linkedin", v)} placeholder="https://linkedin.com/company/…" icon="link" />
          <PlainField label={t("admin.content.footer.instagram")} value={draft.social.instagram} onChange={(v) => setSocial("instagram", v)} placeholder="https://instagram.com/…" icon="link" />
          <PlainField label={t("admin.content.footer.facebook")} value={draft.social.facebook} onChange={(v) => setSocial("facebook", v)} placeholder="https://facebook.com/…" icon="link" />
        </div>
      </Card>

      <Card title={t("admin.content.footer.contactTitle")} desc={t("admin.content.footer.contactDesc")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.footer.address")} value={draft.contact.address} onChange={(address) => setContact("address", address)} />
          <PlainField label={t("admin.content.footer.phone")} value={draft.contact.phone} onChange={(v) => setContact("phone", v)} icon="phone" />
          <PlainField label={t("admin.content.footer.email")} value={draft.contact.email} onChange={(v) => setContact("email", v)} icon="mail" />
        </div>
      </Card>
    </>
  );
}

/* --------------------------------- Legal ---------------------------------- */

/** The legal-section add/edit modal: one clause's heading + body, sharing a
    single EN/AR/KU switcher so both fields move to the same language together.
    Mirrors FaqEntryModal — edits a local copy and hands it back on Save. */
function LegalSectionModal({
  section,
  isNew,
  onClose,
  onApply,
}: {
  section: LegalSectionContent;
  isNew: boolean;
  onClose: () => void;
  onApply: (next: LegalSectionContent) => void;
}) {
  const { t } = useLang();
  const [sub, setSub] = useState<Lang>("en");
  const [heading, setHeading] = useState<Loc>(section.heading);
  const [body, setBody] = useState<Loc>(section.body);
  const canSave = heading.en.trim().length > 0 && body.en.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isNew ? "admin.content.legal.addTitle" : "admin.content.legal.editTitle")}
      size="lg"
      footer={
        <>
          <Button hierarchy="secondary" onClick={onClose}>
            {t("admin.topbar.cancel")}
          </Button>
          <Button hierarchy="primary" disabled={!canSave} onClick={() => onApply({ ...section, heading, body })}>
            {t(isNew ? "admin.content.legal.add" : "admin.content.legal.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="ct-modalfields">
        <div className="ct-modalfields__langrow">
          <LangSwitch label={t("admin.content.legal.heading")} sub={sub} onSub={setSub} flag={(l) => !heading[l]?.trim() || !body[l]?.trim()} />
        </div>
        <LocField label={t("admin.content.legal.heading")} value={heading} onChange={setHeading} sub={sub} onSub={setSub} hideSwitch />
        <LocField label={t("admin.content.legal.body")} value={body} onChange={setBody} sub={sub} onSub={setSub} hideSwitch textarea rows={4} />
      </div>
    </Modal>
  );
}

function LegalSectionEditor({ content, onSave }: { content: SiteContent; onSave: (patch: Partial<SiteContent>, section: string) => void }) {
  const { t, lang } = useLang();
  const section = t("admin.content.nav.legal");
  const [page, setPage] = useState<"privacy" | "terms">("privacy");
  const [draft, setDraft] = useAutoSave(content.legal, (legal) => onSave({ legal }, section));
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  // `editing` holds the index being edited; -1 means the add flow.
  const [editing, setEditing] = useState<number | null>(null);

  const doc = draft[page];
  const setDoc = (next: Partial<typeof doc>) => setDraft((d) => ({ ...d, [page]: { ...d[page], ...next } }));

  const applySection = (next: LegalSectionContent) => {
    setDoc({ sections: editing === -1 ? [...doc.sections, next] : doc.sections.map((s, idx) => (idx === editing ? next : s)) });
    setEditing(null);
  };

  const editingSection =
    editing === -1 ? { id: newId(), heading: { ...EMPTY_LOC }, body: { ...EMPTY_LOC } } : editing !== null ? doc.sections[editing] : null;

  return (
    <>
      <div className="ct-subtabs" role="tablist" aria-label={t("admin.content.legal.title")}>
        {(["privacy", "terms"] as const).map((p) => (
          <button key={p} type="button" role="tab" aria-selected={page === p} className={"ct-subtab" + (page === p ? " is-active" : "")} onClick={() => setPage(p)}>
            {t(p === "privacy" ? "admin.content.legal.privacy" : "admin.content.legal.terms")}
          </button>
        ))}
      </div>

      <Card title={t("admin.content.legal.metaTitle")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.home.eyebrow")} value={doc.eyebrow} onChange={(eyebrow) => setDoc({ eyebrow })} />
          <LocField label={t("admin.content.home.title")} value={doc.title} onChange={(title) => setDoc({ title })} />
          <PlainField label={t("admin.content.legal.updated")} value={doc.updated} onChange={(v) => setDoc({ updated: v })} placeholder="January 2026" icon="calendar" />
          <LocField label={t("admin.content.legal.intro")} value={doc.intro} onChange={(intro) => setDoc({ intro })} textarea rows={2} />
        </div>
      </Card>

      <Card
        title={t("admin.content.legal.sections")}
        desc={t("admin.content.legal.sectionsDesc")}
        action={
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setEditing(-1)}>
            {t("admin.content.legal.add")}
          </Button>
        }
      >
        <div className="ct-list">
          {doc.sections.map((s, i) => (
            <div key={s.id} className="ct-faqrow">
              <div className="ct-faqrow__main">
                <span className="ct-item__num">{i + 1}</span>
                <div className="ct-faqrow__qa">
                  <p className="ct-faqrow__q">{pick(s.heading, lang)}</p>
                  <p className="ct-faqrow__a">{pick(s.body, lang)}</p>
                </div>
              </div>
              <div className="ct-faqrow__ctl">
                <button type="button" className="ct-iconbtn" onClick={() => setEditing(i)} aria-label={t("admin.content.legal.edit")}>
                  <Icon name="pencil" size={16} />
                </button>
                <button type="button" className="ct-iconbtn ct-iconbtn--danger" onClick={() => setConfirmDel(i)} aria-label={t("admin.content.delete")}>
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            </div>
          ))}
          {doc.sections.length === 0 && <p className="ct-empty">{t("admin.content.legal.empty")}</p>}
        </div>
      </Card>

      {editingSection && <LegalSectionModal section={editingSection} isNew={editing === -1} onClose={() => setEditing(null)} onApply={applySection} />}

      {confirmDel !== null && (
        <Modal
          open
          onClose={() => setConfirmDel(null)}
          icon="trash-2"
          title={t("admin.content.legal.delTitle")}
          subtitle={t("admin.content.legal.delBody")}
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setConfirmDel(null)}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button
                hierarchy="destructive"
                iconLeading="trash-2"
                onClick={() => {
                  setDoc({ sections: doc.sections.filter((_, idx) => idx !== confirmDel) });
                  setConfirmDel(null);
                }}
              >
                {t("admin.content.delete")}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

/* ---------------------------------- Home ---------------------------------- */

/** Testimonial add/edit modal: name + detail + quote sharing one EN/AR/KU
    switcher. Mirrors FaqEntryModal. */
function TestimonialModal({
  entry,
  isNew,
  onClose,
  onApply,
}: {
  entry: HomeTestimonial;
  isNew: boolean;
  onClose: () => void;
  onApply: (next: HomeTestimonial) => void;
}) {
  const { t } = useLang();
  const [sub, setSub] = useState<Lang>("en");
  const [name, setName] = useState<Loc>(entry.name);
  const [loc, setLoc] = useState<Loc>(entry.loc);
  const [quote, setQuote] = useState<Loc>(entry.quote);
  const canSave = name.en.trim().length > 0 && quote.en.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isNew ? "admin.content.home.tAddTitle" : "admin.content.home.tEditTitle")}
      size="lg"
      footer={
        <>
          <Button hierarchy="secondary" onClick={onClose}>
            {t("admin.topbar.cancel")}
          </Button>
          <Button hierarchy="primary" disabled={!canSave} onClick={() => onApply({ name, loc, quote })}>
            {t(isNew ? "admin.content.home.addTestimonial" : "admin.content.legal.saveChanges")}
          </Button>
        </>
      }
    >
      <div className="ct-modalfields">
        <div className="ct-modalfields__langrow">
          <LangSwitch label={t("admin.content.home.tName")} sub={sub} onSub={setSub} flag={(l) => !name[l]?.trim() || !quote[l]?.trim()} />
        </div>
        <LocField label={t("admin.content.home.tName")} value={name} onChange={setName} sub={sub} onSub={setSub} hideSwitch />
        <LocField label={t("admin.content.home.tLoc")} value={loc} onChange={setLoc} sub={sub} onSub={setSub} hideSwitch />
        <LocField label={t("admin.content.home.tQuote")} value={quote} onChange={setQuote} sub={sub} onSub={setSub} hideSwitch textarea rows={4} />
      </div>
    </Modal>
  );
}

function HomeSection({ content, onSave }: { content: SiteContent; onSave: (patch: Partial<SiteContent>, section: string) => void }) {
  const { t, lang } = useLang();
  const section = t("admin.content.nav.home");
  const [draft, setDraft] = useAutoSave(content.home, (home) => onSave({ home }, section));
  const [confirmDel, setConfirmDel] = useState<number | null>(null);
  // `editing` holds the testimonial index; -1 means the add flow.
  const [editing, setEditing] = useState<number | null>(null);

  const setHead = (id: HomeSectionId, next: Partial<{ eyebrow: Loc; title: Loc; sub: Loc }>) =>
    setDraft((d) => ({ ...d, sections: { ...d.sections, [id]: { ...d.sections[id], ...next } } }));
  const setPillar = (i: number, next: Partial<{ title: Loc; desc: Loc }>) =>
    setDraft((d) => ({ ...d, pillars: d.pillars.map((p, idx) => (idx === i ? { ...p, ...next } : p)) }));
  const setCta = (k: "find" | "agent" | "list", cta: Loc) =>
    setDraft((d) => ({ ...d, ctaCards: { ...d.ctaCards, [k]: { cta } } }));

  const applyTestimonial = (next: HomeTestimonial) => {
    setDraft((d) => ({ ...d, testimonials: editing === -1 ? [...d.testimonials, next] : d.testimonials.map((tm, idx) => (idx === editing ? next : tm)) }));
    setEditing(null);
  };
  const editingEntry =
    editing === -1 ? { name: { ...EMPTY_LOC }, loc: { ...EMPTY_LOC }, quote: { ...EMPTY_LOC } } : editing !== null ? draft.testimonials[editing] : null;

  return (
    <>
      <Card title={t("admin.content.home.heroTitle")} desc={t("admin.content.home.heroDesc")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.home.headline")} value={draft.heroTitle} onChange={(heroTitle) => setDraft((d) => ({ ...d, heroTitle }))} textarea rows={2} />
          <LocField label={t("admin.content.home.subhead")} value={draft.heroSub} onChange={(heroSub) => setDraft((d) => ({ ...d, heroSub }))} textarea rows={2} />
        </div>
      </Card>

      <Card title={t("admin.content.home.sectionsTitle")} desc={t("admin.content.home.sectionsDesc")}>
        <div className="ct-list ct-list--values">
          {HOME_SECTION_IDS.map((id) => (
            <div key={id} className="ct-item">
              <div className="ct-item__head">
                <span className="ct-item__num">{t(HOME_SECTION_LABEL_KEYS[id])}</span>
              </div>
              <LocField label={t("admin.content.home.eyebrow")} value={draft.sections[id].eyebrow} onChange={(eyebrow) => setHead(id, { eyebrow })} />
              <LocField label={t("admin.content.home.title")} value={draft.sections[id].title} onChange={(title) => setHead(id, { title })} />
              <LocField label={t("admin.content.home.sub")} value={draft.sections[id].sub} onChange={(sub) => setHead(id, { sub })} textarea rows={2} />
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("admin.content.home.pillarsTitle")} desc={t("admin.content.home.pillarsDesc")}>
        <div className="ct-list ct-list--values">
          {draft.pillars.map((p, i) => (
            <div key={i} className="ct-item">
              <div className="ct-item__head">
                <span className="ct-valicon">
                  <Icon name={HOME_PILLAR_ICONS[i] ?? "circle"} size={18} />
                </span>
                <span className="ct-item__num">{t("admin.content.home.pillar", { n: String(i + 1) })}</span>
              </div>
              <LocField label={t("admin.content.home.pillarTitle")} value={p.title} onChange={(title) => setPillar(i, { title })} />
              <LocField label={t("admin.content.home.pillarDesc")} value={p.desc} onChange={(desc) => setPillar(i, { desc })} textarea rows={2} />
            </div>
          ))}
        </div>
      </Card>

      <Card
        title={t("admin.content.home.testimonialsTitle")}
        desc={t("admin.content.home.testimonialsDesc")}
        action={
          <Button hierarchy="secondary" size="sm" iconLeading="plus" onClick={() => setEditing(-1)}>
            {t("admin.content.home.addTestimonial")}
          </Button>
        }
      >
        <div className="ct-list">
          {draft.testimonials.map((tm, i) => (
            <div key={i} className="ct-faqrow">
              <div className="ct-faqrow__main">
                <span className="ct-item__num">{i + 1}</span>
                <div className="ct-faqrow__qa">
                  <p className="ct-faqrow__q">{pick(tm.name, lang)}</p>
                  <p className="ct-faqrow__a">{pick(tm.quote, lang)}</p>
                </div>
              </div>
              <div className="ct-faqrow__ctl">
                <button type="button" className="ct-iconbtn" onClick={() => setEditing(i)} aria-label={t("admin.content.faq.edit")}>
                  <Icon name="pencil" size={16} />
                </button>
                <button type="button" className="ct-iconbtn ct-iconbtn--danger" onClick={() => setConfirmDel(i)} aria-label={t("admin.content.delete")}>
                  <Icon name="trash-2" size={16} />
                </button>
              </div>
            </div>
          ))}
          {draft.testimonials.length === 0 && <p className="ct-empty">{t("admin.content.home.tEmpty")}</p>}
        </div>
      </Card>

      <Card title={t("admin.content.home.ctaTitle")} desc={t("admin.content.home.ctaDesc")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.home.ctaHeading")} value={draft.ctaTitle} onChange={(ctaTitle) => setDraft((d) => ({ ...d, ctaTitle }))} />
          <LocField label={t("admin.content.home.ctaSub")} value={draft.ctaSub} onChange={(ctaSub) => setDraft((d) => ({ ...d, ctaSub }))} textarea rows={2} />
          <LocField label={t("admin.content.home.ctaFind")} value={draft.ctaCards.find.cta} onChange={(v) => setCta("find", v)} />
          <LocField label={t("admin.content.home.ctaAgent")} value={draft.ctaCards.agent.cta} onChange={(v) => setCta("agent", v)} />
          <LocField label={t("admin.content.home.ctaList")} value={draft.ctaCards.list.cta} onChange={(v) => setCta("list", v)} />
        </div>
      </Card>

      {editingEntry && <TestimonialModal entry={editingEntry} isNew={editing === -1} onClose={() => setEditing(null)} onApply={applyTestimonial} />}

      {confirmDel !== null && (
        <Modal
          open
          onClose={() => setConfirmDel(null)}
          icon="trash-2"
          title={t("admin.content.home.tDelTitle")}
          subtitle={t("admin.content.home.tDelBody")}
          footer={
            <>
              <Button hierarchy="secondary" onClick={() => setConfirmDel(null)}>
                {t("admin.topbar.cancel")}
              </Button>
              <Button
                hierarchy="destructive"
                iconLeading="trash-2"
                onClick={() => {
                  setDraft((d) => ({ ...d, testimonials: d.testimonials.filter((_, idx) => idx !== confirmDel) }));
                  setConfirmDel(null);
                }}
              >
                {t("admin.content.delete")}
              </Button>
            </>
          }
        />
      )}
    </>
  );
}

/* --------------------------------- About ---------------------------------- */

function AboutSection({ content, onSave }: { content: SiteContent; onSave: (patch: Partial<SiteContent>, section: string) => void }) {
  const { t } = useLang();
  const section = t("admin.content.nav.about");
  const [draft, setDraft] = useAutoSave(content.about, (about) => onSave({ about }, section));
  const setVal = (i: number, next: Partial<{ title: Loc; desc: Loc }>) => setDraft((d) => ({ ...d, values: d.values.map((v, idx) => (idx === i ? { ...v, ...next } : v)) }));

  return (
    <>
      <Card title={t("admin.content.about.heroTitle")} desc={t("admin.content.about.heroDesc")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.about.headline")} value={draft.heroTitle} onChange={(heroTitle) => setDraft((d) => ({ ...d, heroTitle }))} />
          <LocField label={t("admin.content.about.subhead")} value={draft.heroSub} onChange={(heroSub) => setDraft((d) => ({ ...d, heroSub }))} textarea rows={2} />
        </div>
      </Card>

      <Card title={t("admin.content.about.valuesTitle")} desc={t("admin.content.about.valuesDesc")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.about.valuesHeading")} value={draft.valuesTitle} onChange={(valuesTitle) => setDraft((d) => ({ ...d, valuesTitle }))} />
          <LocField label={t("admin.content.about.valuesSub")} value={draft.valuesSub} onChange={(valuesSub) => setDraft((d) => ({ ...d, valuesSub }))} />
        </div>
        <div className="ct-list ct-list--values">
          {draft.values.map((v, i) => (
            <div key={i} className="ct-item">
              <div className="ct-item__head">
                <span className="ct-valicon">
                  <Icon name={ABOUT_VALUE_ICONS[i] ?? "circle"} size={18} />
                </span>
                <span className="ct-item__num">{t("admin.content.about.value", { n: String(i + 1) })}</span>
              </div>
              <LocField label={t("admin.content.about.valTitle")} value={v.title} onChange={(title) => setVal(i, { title })} />
              <LocField label={t("admin.content.about.valDesc")} value={v.desc} onChange={(desc) => setVal(i, { desc })} textarea rows={2} />
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("admin.content.about.ctaTitle")} desc={t("admin.content.about.ctaDesc")}>
        <div className="ct-fields">
          <LocField label={t("admin.content.about.ctaHeading")} value={draft.ctaTitle} onChange={(ctaTitle) => setDraft((d) => ({ ...d, ctaTitle }))} />
          <LocField label={t("admin.content.about.ctaSub")} value={draft.ctaSub} onChange={(ctaSub) => setDraft((d) => ({ ...d, ctaSub }))} textarea rows={2} />
        </div>
      </Card>
    </>
  );
}

/* ----------------------------------- Hub ---------------------------------- */

export function ContentApp() {
  const { t } = useLang();
  const { content, save } = useSiteContent();
  const [active, setActive] = useState<ContentSectionId>("faq");
  const [toast, setToast] = useState(false);

  const commit = (patch: Partial<SiteContent>, section: string) => {
    save({ ...content, ...patch });
    logAudit({ category: "settings", actionKey: "audit.action.updatedContent", target: section });
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  return (
    <>
      <div className="pf-head">
        <div className="pf-head__intro">
          <h1 className="pf-head__title">{t("admin.content.pageTitle")}</h1>
          <p className="pf-head__sub">{t("admin.content.pageSub")}</p>
        </div>
      </div>

      <div className="st-split">
        <nav className="st-nav" aria-label={t("admin.content.pageTitle")}>
          {CONTENT_SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={"st-navitem" + (active === s.id ? " is-active" : "")}
              onClick={() => setActive(s.id)}
              aria-current={active === s.id}
            >
              <span className="st-navitem__icon">
                <Icon name={s.icon} size={18} />
              </span>
              <span className="st-navitem__body">
                <span className="st-navitem__label">{t(s.labelKey)}</span>
                <span className="st-navitem__desc">{t(s.descKey)}</span>
              </span>
            </button>
          ))}
        </nav>

        <div className="st-detail">
          {active === "home" && <HomeSection content={content} onSave={commit} />}
          {active === "faq" && <FaqSection content={content} onSave={commit} />}
          {active === "footer" && <FooterSection content={content} onSave={commit} />}
          {active === "legal" && <LegalSectionEditor content={content} onSave={commit} />}
          {active === "about" && <AboutSection content={content} onSave={commit} />}
        </div>
      </div>

      {toast && (
        <div className="pf-toast" role="status">
          <Icon name="circle-check" size={18} />
          {t("admin.content.saved")}
        </div>
      )}
    </>
  );
}
