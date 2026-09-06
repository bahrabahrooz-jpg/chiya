"use client";

import { useMemo, type ReactNode } from "react";
import { dirFor, translate, type Lang } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtPercent, localizeDigits } from "@/lib/fmt";
import { formatMoney, moneyToWords, type Money } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { usePlatformSettings } from "@/lib/platform-settings";
import { useProperties } from "../_shared/properties-store";
import {
  DEFAULT_NOTICE_DAYS,
  clauseKeysFor,
  clauseValue,
  hasInstallments,
  installmentSchedule,
  managementFeeAmount,
  ownerCommissionOf,
  templateOf,
  tenantCommissionOf,
  type ClauseKey,
  type ContractRecord,
  type SignerOverride,
} from "../_data/contracts";

/* =============================================================================
   THE SHEET — the contract, on paper.

   Lifted out of contract-doc-app.tsx unchanged so that TWO screens can render
   the same paper: the print page, and the contract form, which now shows this
   sheet filling in as the questions are answered.

   THAT IS THE WHOLE REASON THIS FILE EXISTS. A preview that is a second,
   simpler drawing of the document is a lie the moment either one is edited —
   somebody adds a clause to the paper and the preview keeps promising the old
   page. There is ONE document in this codebase and both screens mount it.

   ⚠ STILL NOT A REVIEWED LEGAL TEMPLATE. Every note in contract-doc-app.tsx
   about the clause wording being pending review applies here, because this is
   that code.

   ONE ADDITION: `blanks`. On the print page an unanswered term prints nothing
   at all — "not stated" on a signed page is a gap somebody can fill in
   afterwards, and that rule is not negotiable. On the FORM the opposite is
   true: the reader is watching the document being written, so a term nobody
   has reached yet shows as a ruled blank. It is the only way the page reads as
   a document being filled in rather than one that is mysteriously short.
   ========================================================================== */

type Translate = (k: string, p?: Record<string, string | number>) => string;

/** A stored record, or the half-written one the form is holding. */
export type SheetRecord = Omit<ContractRecord, "previousPublication">;

/* A ruled blank. Never rendered on the print page — see `blanks` above. */
function Blank({ wide }: { wide?: boolean }) {
  return <span className={"cd-blank" + (wide ? " cd-blank--wide" : "")} aria-hidden="true" />;
}

function Row({ k, v, mono, blanks }: { k: string; v: ReactNode; mono?: boolean; blanks?: boolean }) {
  /* An absent term prints nothing at all. On the form it IS a ruled blank,
     because there the document is visibly still being written. */
  const empty = v === undefined || v === null || v === "";
  if (empty && !blanks) return null;
  return (
    <div className="cd-row">
      <dt>{k}</dt>
      <dd className={mono ? "cd-mono" : undefined}>{empty ? <Blank /> : v}</dd>
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="cd-sec">
      <h2 className="cd-sec__head">
        <span className="cd-sec__n">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * A party, as the document names them.
 *
 * ⚠ A SIGNER OVERRIDE IS PRINTED, NEVER HIDDEN. Power of attorney, an heir, a
 * company representative — the property still belongs to the owner, but the
 * paper is signed by somebody else, and a contract that cannot say so is one
 * that quietly misstates who agreed to it. The reason is required on the record
 * for exactly this line.
 */
function Party({
  t,
  role,
  name,
  phone,
  idNumber,
  signer,
  blanks,
}: {
  t: Translate;
  role: string;
  name: string;
  phone?: string;
  idNumber?: string;
  signer?: SignerOverride;
  blanks?: boolean;
}) {
  return (
    <div className="cd-party">
      <span className="cd-party__role">{role}</span>
      <span className="cd-party__name">{name ? name : blanks ? <Blank wide /> : name}</span>
      {phone && <span className="cd-party__line cd-ltr">{phone}</span>}
      {idNumber && (
        <span className="cd-party__line">
          {t("admin.cd.idNumber")} <span className="cd-mono">{idNumber}</span>
        </span>
      )}
      {signer && (
        <span className="cd-party__signer">
          {t("admin.cd.signedBy", { name: signer.name })}
          <span className="cd-party__why">{t("admin.cd.signerWhy", { reason: signer.reason })}</span>
        </span>
      )}
    </div>
  );
}

/* ---------------- the agreed terms ---------------- */

/**
 * The clause variables, said as sentences.
 *
 * ONE ENTRY PER KEY THE TEMPLATE DECLARES, walked off `clauseKeysFor` rather
 * than a list of its own — that function is the single declaration of the set,
 * and a second list here would drift from it the first time a clause is added.
 *
 * A key with no value produces no line: it was not agreed, and printing "not
 * stated" leaves a blank on a signed page.
 */
function Clauses({ c, t, lang }: { c: SheetRecord; t: Translate; lang: Lang }) {
  const rec = c as ContractRecord;
  const money = (n: number): string =>
    formatMoney(lang, { amount: Math.round(n * 100), currency: c.price.currency } as Money);

  const line = (key: ClauseKey): string | undefined => {
    const v = clauseValue(rec, key);
    if (v === undefined || v === "") return undefined;
    switch (key) {
      case "lateRentPenalty": {
        /* The basis decides whether the figure is money or a percentage. A "5"
           meaning five per cent a day and a "5" meaning five dollars a day are
           the same number and a completely different obligation, so the two are
           always read together. */
        return clauseValue(rec, "lateRentBasis") === "percent_per_day"
          ? t("admin.cd.cl.lateRentPct", { rate: fmtPercent(lang, Number(v)) })
          : t("admin.cd.cl.lateRentFlat", { amount: money(Number(v)) });
      }
      case "lateRentBasis":
        return undefined; // read by lateRentPenalty above; never its own line
      case "regretPenalty":
        return t("admin.cd.cl.regret", { amount: money(Number(v)) });
      case "vacateByDate":
        return t("admin.cd.cl.vacateBy", { date: fmtDate(lang, fromIso(String(v))) });
      case "dailyVacatePenalty":
        return t("admin.cd.cl.dailyVacate", { amount: money(Number(v)) });
      case "noticeDays":
        return t("admin.cd.cl.notice", { days: fmtNum(lang, Number(v)) });
      case "breachPenalty":
        return t("admin.cd.cl.breach", { amount: money(Number(v)) });
      case "evacuationDate":
        return t("admin.cd.cl.evacuation", { date: fmtDate(lang, fromIso(String(v))) });
      case "dailyDelayPenalty":
        return t("admin.cd.cl.dailyDelay", { amount: money(Number(v)) });
      case "registrationDeposit":
        return t("admin.cd.cl.registration", { amount: money(Number(v)) });
      default:
        return undefined;
    }
  };

  const lines = clauseKeysFor(templateOf(rec))
    .map(line)
    .filter((x): x is string => !!x);

  /* The notice period is stated even where the parties wrote none down: the app
     applies a default to every tenancy, so the tenancy HAS one, and leaving the
     only clause with a silent default off the paper is where an argument
     starts. See DEFAULT_NOTICE_DAYS. */
  if (templateOf(rec) === "lease" && clauseValue(rec, "noticeDays") === undefined) {
    lines.push(t("admin.cd.cl.notice", { days: fmtNum(lang, DEFAULT_NOTICE_DAYS) }));
  }

  if (!lines.length) return <p className="cd-none">{t("admin.cd.noClauses")}</p>;

  return (
    <ol className="cd-clauses">
      {lines.map((text, i) => (
        <li key={i}>{text}</li>
      ))}
    </ol>
  );
}

/* ---------------- the sheet ---------------- */

/**
 * The document itself, with no screen furniture around it.
 *
 * @param c       the contract — stored, or the one the form is still writing
 * @param lang    the language of the PAPER, which is not the console's
 * @param blanks  show unanswered terms as ruled blanks (the form; never print)
 */
export function ContractSheet({ c, lang, blanks }: { c: SheetRecord; lang: Lang; blanks?: boolean }) {
  const t: Translate = useMemo(() => (key, params) => translate(lang, key, params), [lang]);
  const { settings } = usePlatformSettings();
  const g = settings.general;
  const { properties, members, agents } = useProperties();
  const rec = c as ContractRecord;

  const facts = useMemo(() => {
    const property = properties.find((p) => p.id === c.propertyId);
    const owner = members.find((m) => m.id === c.ownerId);
    const buyer = c.buyerId ? members.find((m) => m.id === c.buyerId) : undefined;
    return {
      property,
      ownerPhone: owner?.phone,
      /* Falling back to the raw id is right on a stored contract and wrong on a
         half-written one, where the id is simply not chosen yet — there the
         blank is the honest answer. */
      ownerName: owner?.name ?? (blanks ? "" : c.ownerId),
      counterpartyName: buyer?.name ?? "",
      counterpartyPhone: buyer?.phone,
      /* Off the member record now that every counterparty is one. It used to
         come off an external block typed onto the contract, which meant the
         printed document was the only place the number existed. */
      counterpartyIdNumber: buyer?.idNumber,
      agentName: agents.find((a) => a.id === c.agentId)?.name ?? (blanks ? "" : c.agentId),
      /* The city has a catalog entry ("city.Erbil"), the area and district do
         not — so the one that CAN be translated is, and the two that cannot are
         left as the canonical names they are stored under. */
      address: property
        ? [...new Set([property.area, property.district].filter(Boolean)), t("city." + property.city)]
            .filter(Boolean)
            .join(", ")
        : "",
    };
  }, [c, properties, members, agents, t, blanks]);

  const template = templateOf(rec);
  const lease = template === "lease";
  const schedule = hasInstallments(c) ? installmentSchedule(rec) : [];
  const ownerFee = ownerCommissionOf(rec);
  const tenantFee = tenantCommissionOf(rec);
  const mgmt = managementFeeAmount(rec);
  const ownerRole = t(lease ? "admin.pd.landlord" : "admin.pd.seller");
  const partyRole = t(lease ? "admin.pd.tenant" : "admin.pd.buyer");
  /* The schedule earns a section of its own only on an instalment sale, so the
     two after it shift up by one rather than leaving a gap in the numbering. */
  const nFees = schedule.length > 0 ? 5 : 4;
  /* The figure written out is worth nothing while the figure is still zero:
     "zero US dollars" under a rent nobody has typed reads as an agreed term. */
  const showWords = c.price.amount > 0;

  return (
    <article className="cd-sheet" lang={lang} dir={dirFor(lang)}>
      <div className="cd-band">
        <span className="cd-band__org">
          <b className="cd-band__name">{g.platformName}</b>
          <span className="cd-band__eyebrow">{t("admin.cd.band")}</span>
        </span>
        {/* A contract nobody has saved has no number yet, and an empty chip is
            worse than none. */}
        {c.id && <span className="cd-band__no">{localizeDigits(lang, c.id)}</span>}
      </div>

      <header className="cd-head">
        <h1 className="cd-title">{t("admin.cd.title." + template)}</h1>
        {/* THE PLACE ONLY ONCE THERE IS ONE. On the form this sheet is read
            before a property has been chosen, and "Made at on 30/06/2026" is
            not a sentence — so the line without a place is its own string
            rather than the same one with a hole in it. */}
        <p className="cd-place">
          {facts.property
            ? t("admin.cd.madeAt", {
                city: t("city." + facts.property.city),
                date: fmtDate(lang, fromIso(c.signedOn || c.createdOn)),
              })
            : t("admin.cd.madeOn", { date: fmtDate(lang, fromIso(c.signedOn || c.createdOn)) })}
        </p>
      </header>

      <Section n={1} title={t("admin.cd.s.parties")}>
        <div className="cd-parties">
          <Party
            t={t}
            blanks={blanks}
            role={ownerRole}
            name={facts.ownerName}
            phone={facts.ownerPhone}
            signer={c.signerOverride}
          />
          <Party
            t={t}
            blanks={blanks}
            role={partyRole}
            name={facts.counterpartyName}
            phone={facts.counterpartyPhone}
            idNumber={facts.counterpartyIdNumber}
            signer={c.buyerSignerOverride}
          />
        </div>
        {facts.agentName && (
          <p className="cd-brokered">{t("admin.cd.brokeredBy", { agency: g.platformName, agent: facts.agentName })}</p>
        )}
      </Section>

      <Section n={2} title={t("admin.cd.s.property")}>
        <dl className="cd-rows">
          <Row blanks={blanks} k={t("admin.cd.f.code")} v={c.propertyId ? localizeDigits(lang, c.propertyId) : ""} mono />
          <Row blanks={blanks} k={t("admin.cd.f.name")} v={facts.property?.title} />
          <Row blanks={blanks} k={t("admin.cd.f.type")} v={facts.property?.type} />
          <Row blanks={blanks} k={t("admin.cd.f.address")} v={facts.address} />
        </dl>
      </Section>

      <Section n={3} title={t(lease ? "admin.cd.s.rent" : "admin.cd.s.price")}>
        <dl className="cd-rows">
          {lease ? (
            <>
              <Row blanks={blanks} k={t("admin.cd.f.rentPerCycle")} v={c.price.amount ? formatMoney(lang, c.price) : ""} />
              <Row blanks={blanks} k={t("admin.cd.f.cycle")} v={c.cycle ? t("admin.cn.cycle." + c.cycle) : undefined} />
              <Row blanks={blanks} k={t("admin.cd.f.termMonths")} v={c.termMonths ? fmtNum(lang, c.termMonths) : undefined} />
              <Row blanks={blanks} k={t("admin.cd.f.startsOn")} v={c.startsOn ? fmtDate(lang, fromIso(c.startsOn)) : undefined} />
              <Row blanks={blanks} k={t("admin.cd.f.endsOn")} v={c.endsOn ? fmtDate(lang, fromIso(c.endsOn)) : undefined} />
              <Row k={t("admin.cd.f.deposit")} v={c.insuranceDeposit ? formatMoney(lang, c.insuranceDeposit) : undefined} />
              <Row
                blanks={blanks}
                k={t("admin.cd.f.rentPaidTo")}
                v={c.rentPaidTo ? t(c.rentPaidTo === "agency" ? "admin.cd.collect.agency" : "admin.cd.collect.owner") : undefined}
              />
              <Row k={t("admin.cd.f.managementFee")} v={mgmt && mgmt.amount > 0 ? formatMoney(lang, mgmt) : undefined} />
            </>
          ) : (
            <>
              <Row blanks={blanks} k={t("admin.cd.f.price")} v={c.price.amount ? formatMoney(lang, c.price) : ""} />
              <Row k={t("admin.cd.f.downPayment")} v={c.downPayment ? formatMoney(lang, c.downPayment) : undefined} />
              <Row k={t("admin.cd.f.holdingDeposit")} v={c.deposit ? formatMoney(lang, c.deposit) : undefined} />
            </>
          )}
        </dl>
        {/* IN WORDS AS WELL AS FIGURES, on the one number the whole document
            exists for. A handwritten alteration to a figure can be argued
            with; a written-out sentence cannot. */}
        {showWords && (
          <p className="cd-words">
            {t(lease ? "admin.cd.rentWords" : "admin.cd.priceWords", { words: moneyToWords(c.price, lang) })}
          </p>
        )}
      </Section>

      {schedule.length > 0 && (
        <Section n={4} title={t("admin.cd.s.schedule")}>
          <table className="cd-table">
            <thead>
              <tr>
                <th>{t("admin.cd.sch.no")}</th>
                <th>{t("admin.cd.sch.due")}</th>
                <th className="cd-num">{t("admin.cd.sch.amount")}</th>
                <th className="cd-num">{t("admin.cd.sch.balance")}</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((s) => (
                <tr key={s.index}>
                  <td>{fmtNum(lang, s.index)}</td>
                  <td>{fmtDate(lang, fromIso(s.dueOn))}</td>
                  <td className="cd-num">{formatMoney(lang, s.amount)}</td>
                  <td className="cd-num">{formatMoney(lang, s.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* BOTH SIDES PAY, on a tenancy and on a sale alike — two figures rather
          than one, because they are two agreements with two different people. */}
      <Section n={nFees} title={t("admin.cd.s.fees")}>
        <dl className="cd-rows">
          <Row
            blanks={blanks}
            k={t(lease ? "admin.cn.f.landlordFee" : "admin.cn.f.sellerFee")}
            v={ownerFee.amount.amount ? formatMoney(lang, ownerFee.amount) : ""}
          />
          {tenantFee.basis !== "none" && (
            <Row
              blanks={blanks}
              k={t(lease ? "admin.cn.f.tenantFee" : "admin.cn.f.buyerFee")}
              v={tenantFee.amount.amount ? formatMoney(lang, tenantFee.amount) : ""}
            />
          )}
        </dl>
      </Section>

      <Section n={nFees + 1} title={t("admin.cd.s.terms")}>
        <Clauses c={c} t={t} lang={lang} />
        {c.notes && <p className="cd-notes">{c.notes}</p>}
      </Section>

      {/* EVERY PARTY SIGNS THE SAME PAGE, with a name under each rule so a line
          is one person's to sign rather than anyone's. */}
      <footer className="cd-signs">
        <div className="cd-sign">
          <span className="cd-sign__rule" />
          <span className="cd-sign__role">{ownerRole}</span>
          <span className="cd-sign__name">{c.signerOverride?.name ?? facts.ownerName}</span>
        </div>
        <div className="cd-sign">
          <span className="cd-sign__rule" />
          <span className="cd-sign__role">{partyRole}</span>
          <span className="cd-sign__name">{c.buyerSignerOverride?.name ?? facts.counterpartyName}</span>
        </div>
        <div className="cd-sign">
          <span className="cd-sign__rule" />
          <span className="cd-sign__role">{t("admin.cd.forAgency")}</span>
          <span className="cd-sign__name">{facts.agentName}</span>
        </div>
      </footer>

      <p className="cd-contact">
        {/* Latin runs isolated — without it the bidi algorithm walks the "+"
            on a phone number to the far end of an Arabic line. */}
        <span className="cd-ltr">{g.contactPhone}</span>
        <span aria-hidden="true">·</span>
        <span>{g.officeAddress}</span>
        {g.contactEmail && (
          <>
            <span aria-hidden="true">·</span>
            <span className="cd-ltr">{g.contactEmail}</span>
          </>
        )}
      </p>
    </article>
  );
}
