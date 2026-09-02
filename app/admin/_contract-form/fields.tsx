"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/avatar";
/* The wizard's own listbox — see SelectInput. Imported rather than rebuilt so
   the two full-page admin forms open an identical menu. */
import { Dropdown, useTopbarClip } from "../_add-property/add-property-app";
import { Icon, type IconName } from "@/components/ui/icon";
import { useLang } from "@/lib/i18n";
import { fmtDate, localizeDigits, monthName, weekdayName } from "@/lib/fmt";
import { ANCHOR_ISO, addMonths, fromIso, toIso } from "@/lib/dates";
import { useApproxGuidance } from "@/lib/use-approx-price";
import { DISPLAY_DECIMALS, formatMoney, type CurrencyCode, type Money } from "@/lib/money";

/* =============================================================================
   The contract form's layout primitives.

   THESE EXIST BECAUSE OF ONE REVIEW NOTE: the earlier version of this screen
   was rejected as cramped. Three inputs to a row, bare radios, a label and
   nothing else to say what the field was for. Every rule below is the fix for
   something specific, and they are components rather than conventions because a
   convention is what the fourth section quietly stops following.

   · ONE QUESTION PER ROW. `Row` is full width and always stacks. There is no
     two-column variant to reach for. Two values that genuinely belong together
     — an amount and its currency, a date and a duration — go inside ONE row as
     a `Pair`, because they are one answer, not two.

   · THE ROW IS FULL WIDTH; THE CONTROL IS THE WIDTH OF ITS ANSWER. A date, a
     term in months, a page count and a percentage are all short, and stretching
     them across seven hundred pixels made the form read as a wall of identical
     bars with no clue which ones wanted a word and which wanted two digits.
     `width="sm" | "md"` caps the control. The row around it does not move, so
     the single column and its rhythm are unchanged.

   · A HINT IS FOR A FIELD THAT NEEDS ONE. It used to be required, and that was
     the right call when a hint was the only explanation a field could carry —
     but it put a grey sentence under "City" and "Copies", and a hint that says
     nothing is what teaches people to stop reading the hints that do. The load
     it was carrying now sits in two better places: the summary panel, which
     shows every figure as it is typed, and the review step, which shows the
     whole document before it is signed. So: keep the hint wherever it names
     the clause a value prints into — "Item 21 · paid by whichever party breaks
     the contract" — and drop it where the label already said everything.

   · CHOICES ARE CARDS WITH A DESCRIPTION. A bare radio labelled "Our office"
     does not tell anybody that choosing it means the agency starts collecting
     rent and raising twelve invoices a year. `ChoiceCards` will not render
     without a description line.

   · MONEY IS BIG, RIGHT-ALIGNED AND TABULAR, and carries a live approximate
     line underneath. See `MoneyField`.

   · CONDITIONAL BLOCKS ARE REMOVED, NOT DISABLED. There is no `disabled` prop
     on `Row` on purpose. A greyed-out field says "you could fill this in"; on a
     sale there is nothing to fill in, so it is not there.
   ========================================================================== */

/** How wide the CONTROL may get. The row is always full width. */
export type FieldWidth = "sm" | "md" | "full";

const widthClass = (w: FieldWidth | undefined) => (w && w !== "full" ? " cn-input--" + w : "");

/* ----------------------------------------------------------------------------
   Rows
   ------------------------------------------------------------------------- */

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="cn-section">
      <h3 className="cn-section__title">{title}</h3>
      <div className="cn-section__body">{children}</div>
    </section>
  );
}

/**
 * One question. Full width, always.
 *
 * `hint` is optional — see the header note on what changed and why. Pass one
 * when the label alone does not say which clause the value prints into; leave
 * it off when it does.
 */
export function Row({
  label,
  hint,
  htmlFor,
  optional,
  error,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  optional?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="cn-row">
      {/* An empty label renders nothing — used where the section heading above
          already names the field and repeating it would be the third time. The
          control carries an aria-label in that case. */}
      {label && (
        <label className="cn-row__label" htmlFor={htmlFor}>
          {label}
          {optional && <span className="cn-row__opt">{optional}</span>}
        </label>
      )}
      {hint && <p className="cn-row__hint">{hint}</p>}
      <div className="cn-row__control">{children}</div>
      {error && (
        <p className="cn-row__error" role="alert">
          <Icon name="alert-circle" size={14} />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Two short answers side by side.
 *
 * Distinct from `Pair` below, which is two controls making ONE answer. This is
 * two separate questions that both happen to be short — a signing date and a
 * handover date, a city and a copy count. Stacking every one of those full
 * width is what made this form three screens long when the wizard beside it
 * fits as much in one.
 *
 * Anything needing the width — a search, choice cards, a paragraph — wraps in
 * `<Full>`.
 */
export function Grid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 }) {
  return <div className={"cn-grid" + (cols === 3 ? " cn-grid--3" : "")}>{children}</div>;
}

/** One row spanning both columns of a `Grid`. */
export function Full({ children }: { children: ReactNode }) {
  return <div className="cn-grid__full">{children}</div>;
}

/** One row two columns wide inside a three-column `Grid` — a `Pair` needs the
    room of two answers because it holds two controls. */
export function Wide({ children }: { children: ReactNode }) {
  return <div className="cn-grid__wide">{children}</div>;
}

/**
 * Two controls that are ONE answer — an amount and its currency, a date and a
 * term length. The only sanctioned way to put two inputs on one line.
 *
 * `equal` splits the row down the middle on the grid's own gap, so each half
 * lands exactly on a column of the `Grid` around it. Use it where a third box
 * sits beside the pair — the start date, the term and the end date are three
 * boxes on one line, and three widths on one line reads as three unrelated
 * fields. Without it the pair hugs: `lead` takes the room, the second control
 * takes what it needs.
 */
export function Pair({ children, lead = "1fr", equal }: { children: ReactNode; lead?: string; equal?: boolean }) {
  return (
    <div
      className={"cn-pair" + (equal ? " cn-pair--equal" : "")}
      style={equal ? undefined : { gridTemplateColumns: `${lead} auto` }}
    >
      {children}
    </div>
  );
}

/**
 * A value the form worked out, shown where somebody would look for it.
 *
 * This is the one figure the summary panel could not cover. "When does it end"
 * is a DATE, it is asked in the same breath as the start and the length, and it
 * is checked against the paper right there — sending the eye to a panel on the
 * far side of the screen for it is asking somebody to hold three dates in their
 * head. Read-only by construction: there is no input to type into, because a
 * derived value that can be typed over is one that will disagree with whatever
 * produced it.
 */
export function ReadOut({ label, value }: { label: string; value?: string }) {
  return (
    <div className="cn-row">
      <span className="cn-row__label">{label}</span>
      <div className={"cn-readout cx-tnum" + (value ? "" : " is-empty")}>{value ?? "—"}</div>
    </div>
  );
}

/* `Derived` used to live here — a small read-only chip showing a figure the
   form worked out, rendered inside the row that produced it. There were five of
   them and they were the problem the summary panel now solves: the end date sat
   under the term, the split sat under the fee, the two commissions sat under
   their own bases, and the one thing nobody could see was all of them at once.
   Every one of those figures is in ./summary now. */

/* `GroupDivider` used to live here — a labelled rule introducing a second kind
   of thing INSIDE a section, used once, over the penalties that share a group
   with the commissions. It was a heading below a heading: it split five
   questions of the same kind into two blocks with two rhythms, and the sentence
   it carried ("charged only if it happens") is on every one of those fields as
   a hint already. Sections divide this form; nothing divides a section. */

/* ----------------------------------------------------------------------------
   What you picked
   ------------------------------------------------------------------------- */

/**
 * A chosen property — with its photograph.
 *
 * The picture is the point. A grey box reading "Marble Hill Villa · CH-3200"
 * is something you have to read to check; the photo of the villa is something
 * you recognise, and recognising the wrong unit before signing a contract on
 * it is the entire job this card does.
 */
export function PickedProperty({
  img,
  title,
  meta,
  badge,
  onChange,
  changeLabel,
}: {
  img?: string;
  title: string;
  meta: string;
  badge?: ReactNode;
  /** Absent when the property came locked from a property page or a draft. */
  onChange?: () => void;
  changeLabel: string;
}) {
  return (
    <div className="cn-pick">
      {/* eslint-disable-next-line @next/next/no-img-element -- same as every
          other property thumbnail in admin; these are seed paths, not a CDN. */}
      <img className="cn-pick__thumb" src={img} alt="" loading="lazy" />
      <span className="cn-pick__meta">
        <span className="cn-pick__name">
          {title}
          {badge}
        </span>
        <span className="cn-pick__sub">
          <Icon name="map-pin" size={14} />
          {meta}
        </span>
      </span>
      {onChange ? (
        <button type="button" className="cn-pick__change" onClick={onChange}>
          <Icon name="repeat" size={14} />
          {changeLabel}
        </button>
      ) : (
        <span className="cn-pick__lock" aria-hidden="true">
          <Icon name="lock" size={16} />
        </span>
      )}
    </div>
  );
}

/**
 * A person on the contract — owner, buyer, tenant.
 *
 * Same card, an Avatar instead of a photograph. `Avatar` draws initials when
 * there is no picture, which most members do not have, so the card never
 * collapses to a blank square.
 */
export function PickedParty({
  img,
  name,
  phone,
  onChange,
  changeLabel,
  locked,
}: {
  img?: string | null;
  name: string;
  phone?: string;
  onChange?: () => void;
  changeLabel: string;
  /** The owner is taken from the property and is not editable here. */
  locked?: boolean;
}) {
  return (
    <div className="cn-pick">
      <Avatar src={img || undefined} name={name} size="lg" />
      <span className="cn-pick__meta">
        <span className="cn-pick__name">{name}</span>
        {phone && (
          <span className="cn-pick__sub">
            <Icon name="phone" size={14} />
            {phone}
          </span>
        )}
      </span>
      {locked || !onChange ? (
        <span className="cn-pick__lock" aria-hidden="true">
          <Icon name="lock" size={16} />
        </span>
      ) : (
        <button type="button" className="cn-pick__change" onClick={onChange}>
          <Icon name="repeat" size={14} />
          {changeLabel}
        </button>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Choices
   ------------------------------------------------------------------------- */

export interface Choice<T extends string> {
  value: T;
  label: string;
  /** Required. What picking this actually does — see the header note. */
  desc: string;
  icon?: IconName;
}

/** Radio cards. Never a segmented pill, never a bare radio list. */
export function ChoiceCards<T extends string>({
  value,
  options,
  onChange,
  name,
  columns = 2,
}: {
  value: T;
  options: Choice<T>[];
  onChange: (v: T) => void;
  name: string;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className={"cn-choices cn-choices--" + columns} role="radiogroup" aria-label={name}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            className={"cn-choice" + (active ? " is-active" : "")}
            onClick={() => onChange(o.value)}
          >
            {o.icon && (
              <span className="cn-choice__ic" aria-hidden="true">
                <Icon name={o.icon} size={18} />
              </span>
            )}
            <span className="cn-choice__txt">
              <span className="cn-choice__label">{o.label}</span>
              <span className="cn-choice__desc">{o.desc}</span>
            </span>
            <span className="cn-choice__tick" aria-hidden="true">
              {active && <Icon name="check" size={14} strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Inputs
   ------------------------------------------------------------------------- */

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
  width,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  width?: FieldWidth;
}) {
  return (
    <input
      id={id}
      type="text"
      className={"cn-input" + widthClass(width)}
      /* THE BROWSER'S SAVED DETAILS ARE THE WRONG PERSON'S.
         Every text field on this form asks about somebody ELSE — the tenant's
         name, the proxy's phone, the id number on a passport, the city on the
         paper. The browser reads `cn-city` and offers the operator's own saved
         address; accept it once by reflex and a legal document carries the
         wrong details. Off on all of them, not just the city. */
      autoComplete="off"
      /* dir="auto", NOT "rtl".
         Party names really are written in Arabic or Kurdish script inside an
         English document, and these fields used to be forced right-to-left for
         it — which put the placeholder against the wrong edge and made typing a
         Latin name start from the right. "auto" lets the FIRST CHARACTER decide:
         type Kurdish and it flips, type English and it does not, and an empty
         field follows its placeholder. */
      dir="auto"
      value={value}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Internal notes and anything else that runs to more than a line. Full width
    by construction — a paragraph is the one answer that wants the room. */
export function TextArea({
  id,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      className="cn-textarea"
      dir="auto"
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function NumberInput({
  id,
  value,
  onChange,
  placeholder,
  min,
  max,
  suffix,
  width,
  /** Rates are not whole numbers — 1,310.5 dinars to the dollar is ordinary. */
  decimal,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  suffix?: string;
  width?: FieldWidth;
  decimal?: boolean;
}) {
  return (
    <div className={"cn-suffixwrap" + widthClass(width)}>
      <input
        id={id}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        className="cn-input cn-input--num cx-tnum"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          /* Kept as TEXT and clamped only at the edges, for the same reason
             MoneyField holds text: "1." and "1,3" are what a half-typed number
             looks like, and rounding those mid-keystroke changes what was
             typed. */
          const cleaned = decimal
            ? e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
            : e.target.value.replace(/[^\d]/g, "");
          if (cleaned === "") return onChange("");
          const n = Number(cleaned);
          /* "." on its own is not a number yet. Let it stand rather than
             swallowing the keystroke that was going to make it one. */
          if (!Number.isFinite(n)) return onChange(cleaned);
          if (min !== undefined && n < min) return onChange(String(min));
          if (max !== undefined && n > max) return onChange(String(max));
          onChange(cleaned);
        }}
      />
      {suffix && <span className="cn-suffixwrap__suffix">{suffix}</span>}
    </div>
  );
}

/**
 * A DATE, IN THE HOUSE CALENDAR — not the browser's.
 *
 * The previous version was `<input type="date">` with the system's little grey
 * button hidden behind one of our icons. That is a costume, not a control: it
 * still showed mm/dd/yyyy in whatever order the machine's locale felt like, and
 * it still opened the operating system's calendar — a different typeface, a
 * different week, and no Kurdish or Arabic month names anywhere in it, dropped
 * into the middle of a screen that is otherwise entirely ours.
 *
 * This one reads the date through `fmtDate`, so it says "1 Aug 2027" in the
 * interface's own language and digits, and opens a grid built from the same
 * `monthName` / `weekdayName` the rest of the app uses.
 *
 * PORTALLED TO THE BODY, like the wizard's Dropdown and for the same reason:
 * .ap-card is `overflow: hidden`, so a panel positioned inside it is cut off at
 * the card's edge. Coordinates come from `useTopbarClip`, which also keeps it
 * from riding up over the admin topbar.
 */
export function DateInput({
  id,
  value,
  onChange,
  readOnly,
  /* FULL BY DEFAULT — it fills whatever it is given, exactly as a dropdown
     does. It used to default to "sm", which capped it at 190px, and the result
     was three different date widths in one section: a 135px start date, a
     470px signing date and a read-out somewhere between. A date is not a
     narrower kind of answer than a dropdown; it just holds fewer characters. */
  width = "full",
}: {
  id?: string;
  value: string;
  onChange?: (iso: string) => void;
  readOnly?: boolean;
  width?: FieldWidth;
}) {
  const { t, lang } = useLang();
  const fallback = useId();
  const [open, setOpen] = useState(false);
  /* Which month the grid is showing. Follows the selection when there is one,
     and the app's own "today" when there is not — see ANCHOR_ISO. */
  const [view, setView] = useState(() => value || ANCHOR_ISO);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { coords, calc } = useTopbarClip(triggerRef, open);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node) && !panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const viewDate = fromIso(view);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  /* Day 0 of the next month is the last day of this one. */
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDow = new Date(year, month, 1).getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: startDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const openPanel = () => {
    if (readOnly) return;
    setView(value || ANCHOR_ISO);
    calc();
    setOpen(true);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id ?? fallback}
        disabled={readOnly}
        className={"cn-dp__trigger" + widthClass(width) + (open ? " is-open" : "") + (readOnly ? " is-readonly" : "")}
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "cn-dp__val cx-tnum" : "cn-dp__ph"}>
          {value ? fmtDate(lang, fromIso(value)) : t("admin.cn.date.choose")}
        </span>
        <Icon name="calendar" size={17} className="cn-dp__ic" />
      </button>

      {open && coords &&
        createPortal(
          <div
            ref={panelRef}
            className="cn-dp__panel"
            style={{ top: coords.top, insetInlineStart: coords.left, clipPath: coords.clipTop ? `inset(${coords.clipTop}px 0 0 0)` : undefined }}
            role="dialog"
            aria-label={t("admin.cn.date.choose")}
          >
            <div className="cn-dp__head">
              {/* The arrows point through TIME, so they swap in Arabic and
                  Kurdish along with the reading direction — chevron-left is
                  "back" only in a left-to-right month. */}
              <button type="button" className="cn-dp__nav" onClick={() => setView(addMonths(view, -1))} aria-label={t("admin.cn.date.prev")}>
                <Icon name="chevron-left" size={17} />
              </button>
              <span className="cn-dp__month">
                {monthName(lang, month, true)} {localizeDigits(lang, String(year))}
              </span>
              <button type="button" className="cn-dp__nav" onClick={() => setView(addMonths(view, 1))} aria-label={t("admin.cn.date.next")}>
                <Icon name="chevron-right" size={17} />
              </button>
            </div>

            <div className="cn-dp__grid" role="grid">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={"h" + i} className="cn-dp__dow">{weekdayName(lang, i)}</span>
              ))}
              {cells.map((d, i) => {
                if (d === null) return <span key={"e" + i} className="cn-dp__blank" />;
                const iso = toIso(new Date(year, month, d));
                return (
                  <button
                    key={iso}
                    type="button"
                    className={
                      "cn-dp__day" +
                      (iso === value ? " is-selected" : "") +
                      (iso === ANCHOR_ISO ? " is-today" : "")
                    }
                    aria-current={iso === ANCHOR_ISO ? "date" : undefined}
                    aria-pressed={iso === value}
                    onClick={() => { onChange?.(iso); setOpen(false); triggerRef.current?.focus(); }}
                  >
                    {localizeDigits(lang, String(d))}
                  </button>
                );
              })}
            </div>

            <div className="cn-dp__foot">
              <button type="button" className="cn-dp__today" onClick={() => { onChange?.(ANCHOR_ISO); setOpen(false); triggerRef.current?.focus(); }}>
                {t("admin.cn.date.today")}
              </button>
              {value && (
                <button type="button" className="cn-dp__clear" onClick={() => { onChange?.(""); setOpen(false); triggerRef.current?.focus(); }}>
                  {t("admin.cn.date.clear")}
                </button>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

export function SelectInput<T extends string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  width,
}: {
  id?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
  width?: FieldWidth;
}) {
  /* THE HOUSE DROPDOWN, NOT A NATIVE ONE.
     This was a bare <select> with a chevron drawn over it, which meant every
     choice on this form opened the operating system's own list — a different
     typeface, a different highlight colour and a different shape on every
     machine, sitting inside a screen that is otherwise entirely ours. The
     add-property wizard already renders its own listbox; this is that one, so
     the two forms open the same menu. Same props as before, so nothing at the
     call sites had to change. */
  return (
    <div className={"cn-selectwrap" + widthClass(width)} aria-label={ariaLabel}>
      <Dropdown
        id={id}
        value={value}
        options={options}
        onChange={(v) => onChange(v as T)}
      />
    </div>
  );
}

/* ----------------------------------------------------------------------------
   Money
   ------------------------------------------------------------------------- */

/**
 * A money input, at the size a money input deserves.
 *
 * Bigger than a text field, right-aligned, tabular figures — a column of
 * amounts that has to be checked against a piece of paper reads far faster that
 * way, and dinar figures run to nine digits.
 *
 * ⚠ THE APPROXIMATE LINE UNDERNEATH IS GUIDANCE AND NOTHING ELSE. It converts
 * at today's settings rate so the two people at the desk can sanity-check a
 * dollar figure against dinars they think in. It is NEVER stored and it NEVER
 * reaches the document — the contract prints one currency, and an approximate
 * figure printed beside a contractual one is how an estimate becomes binding.
 * See `useApproxGuidance`.
 */
export function MoneyField({
  id,
  value,
  onChange,
  currency,
  parsed,
  placeholder,
  quickFill,
  autoFocus,
  quote,
  error,
}: {
  id?: string;
  value: string;
  onChange: (text: string) => void;
  /** The currency the CONTRACT is written in. Fixed by the property. */
  currency: CurrencyCode;
  /** The parsed amount, for the approximate line. Undefined while half-typed. */
  parsed?: Money;
  placeholder?: string;
  /** An optional one-tap fill — "Same as one month" on the deposit. */
  quickFill?: { label: string; onFill: () => void };
  autoFocus?: boolean;
  /**
   * Dinars to the dollar — the same familiar quote the rate field takes, and
   * the contract's own agreed rate once one is set. Only used to convert what
   * somebody typed; it never changes what the contract says.
   */
  quote: number;
  error?: boolean;
}) {
  const { t, lang } = useLang();
  const approx = useApproxGuidance();

  /* WHICH CURRENCY THEY ARE TYPING IN — not which one the contract is in.
     Those are different questions and only the first one is a preference.
     An agent whose head is in dollars can type dollars against a dinar
     listing; the contract still states dinars, because that is what the
     property is listed in and a contract that quietly restated the agreed
     figure in another currency would be a different agreement. */
  const [entry, setEntry] = useState<CurrencyCode>(currency);
  /* Only used while typing in the OTHER currency. When the box shows the
     contract's own currency the parent's `value` is the box, with no copy
     here to fall out of step with it — which is why there is no effect
     syncing the two. */
  const [otherText, setOtherText] = useState("");
  const raw = entry === currency ? value : otherText;

  const toContract = (text: string, from: CurrencyCode): string => {
    if (from === currency) return text;
    const n = Number(text.replace(/,/g, ""));
    if (!Number.isFinite(n) || !quote) return "";
    /* quote is IQD per 1 USD, so it multiplies going to dinars and divides
       coming back. Rounded to the contract currency's own precision — a dinar
       figure with decimals is not a dinar figure. */
    const converted = currency === "IQD" ? n * quote : n / quote;
    return converted ? converted.toFixed(DISPLAY_DECIMALS[currency]) : "";
  };

  const onEntryChange = (text: string) => {
    if (entry === currency) {
      onChange(text);
      return;
    }
    setOtherText(text);
    onChange(toContract(text, entry));
  };

  const switchEntry = (to: CurrencyCode) => {
    if (to === entry) return;
    if (to === currency) {
      /* `value` already holds the contract figure — nothing to convert. */
      setEntry(to);
      return;
    }
    /* Carry the amount across rather than clearing it: switching the unit is
       not the same as changing your mind about the number. */
    const n = Number(value.replace(/,/g, ""));
    setOtherText(
      Number.isFinite(n) && n && quote
        ? (currency === "IQD" ? n / quote : n * quote).toFixed(DISPLAY_DECIMALS[to])
        : "",
    );
    setEntry(to);
  };

  const typingInOther = entry !== currency;
  /* What the contract will state, spelled out, whenever that is not simply
     what they just typed. This is the binding figure and it is never hidden. */
  const contractLine = typingInOther && parsed ? t("admin.cn.money.states", { amount: formatMoney(lang, parsed) }) : null;
  const approxLine = !typingInOther && parsed ? approx(parsed) : null;

  return (
    <div className="cn-money">
      <div className={"cn-money__field" + (error ? " is-error" : "")}>
        {/* The currency LEADS, and it is what you are TYPING IN. Only two
            currencies exist, so this is a two-way switch rather than a list. */}
        <div className="cn-money__curwrap">
          <select
            className="cn-money__cur"
            value={entry}
            onChange={(e) => switchEntry(e.target.value as CurrencyCode)}
            aria-label={t("admin.cn.money.typeIn")}
          >
            <option value="USD">USD</option>
            <option value="IQD">IQD</option>
          </select>
          {/* Wrapped in a span, like .cn-selectwrap__chev below. The class does
              not survive on <Icon> itself — lucide's DynamicIcon dropped it and
              the chevron never rendered at all, which left this reading as a
              plain label rather than something you can change. */}
          <span className="cn-money__curchev" aria-hidden="true">
            <Icon name="chevron-down" size={13} />
          </span>
        </div>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="cn-money__input cx-tnum"
          value={raw}
          placeholder={placeholder ?? (DISPLAY_DECIMALS[entry] > 0 ? "0.00" : "0")}
          autoFocus={autoFocus}
          onChange={(e) => onEntryChange(e.target.value)}
        />
      </div>
      <div className="cn-money__under">
        {/* Always rendered, even when empty, so the row does not jump height the
            moment somebody types the first digit. */}
        <span className={"cn-money__approx" + (contractLine ? " cn-money__approx--states" : "")}>
          {contractLine ?? approxLine ?? " "}
        </span>
        {quickFill && (
          <button type="button" className="cn-money__quick" onClick={quickFill.onFill}>
            {quickFill.label}
          </button>
        )}
      </div>
    </div>
  );
}

/* Money ↔ input text is already solved, in the finance controls the payment
   and invoice modals share. Re-exported rather than reimplemented: the parsing
   is fiddly (grouping separators, Arabic-Indic digits, a half-typed "1.") and
   two copies of it would be two things to fix the next time somebody finds a
   character it chokes on. */
export { moneyToText, textToMoney } from "../_shared/finance/controls";

/* ----------------------------------------------------------------------------
   The consequence bar
   ------------------------------------------------------------------------- */

/**
 * WHAT PRESSING THE BUTTON WILL ACTUALLY DO, in a sentence that rewrites itself
 * from the current state of the form.
 *
 * "Signing will create 2 commission invoices of $350 each, hold $700 deposit,
 * and mark this property Rented until 1 Aug 2027."
 *
 * On every step, not just the last one. Every exit from this screen either
 * changes what the public website shows or creates financial records, and
 * nobody should find out which afterwards. It is built from the same
 * `plannedInvoices` list that signing actually issues, so it cannot promise one
 * thing and do another.
 */
export function ConsequenceBar({ text, tone = "info" }: { text: string; tone?: "info" | "warn" }) {
  return (
    <div className={"cn-consequence cn-consequence--" + tone} role="status">
      <Icon name={tone === "warn" ? "alert-triangle" : "info"} size={17} className="cn-consequence__ic" />
      <p className="cn-consequence__txt">{text}</p>
    </div>
  );
}

/** The amendment banner — a signed contract being changed is not the same act
    as writing a new one, and the screen has to say so before anything else. */
export function AmendBanner({ title, body }: { title: string; body: string }) {
  const { lang } = useLang();
  void lang;
  return (
    <div className="cn-amend" role="note">
      <Icon name="file-text" size={18} className="cn-amend__ic" />
      <div className="cn-amend__txt">
        <strong className="cn-amend__title">{title}</strong>
        <span className="cn-amend__body">{body}</span>
      </div>
    </div>
  );
}
