"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { LANGS, dirFor, translate, useLang, type Lang } from "@/lib/i18n";
import { fmtDate, fmtNum, fmtPercent, localizeDigits } from "@/lib/fmt";
import { formatMoney, moneyToWords, type Money } from "@/lib/money";
import { fromIso } from "@/lib/dates";
import { usePlatformSettings } from "@/lib/platform-settings";
import { useContracts } from "../_shared/contracts-store";
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
   THE CONTRACT, ON PAPER.

   The Print button on the contract page had been disabled since that screen was
   written — `TODO(contract print/PDF task): no document is rendered yet`. This
   is the document.

   ⚠ THIS IS NOT A REVIEWED LEGAL TEMPLATE, AND IT DOES NOT PRETEND TO BE.

   The data layer models the clause VARIABLES — a late-rent rate, a notice
   period, a vacate date — and says in as many words that the wording they are
   interpolated into "is fixed legal wording and is pending legal review". That
   note is correct, and inventing the wording here would be the worst way to
   resolve it: plausible-looking legal prose nobody qualified has read, printed
   on a page two people sign.

   So the document states the terms that were AGREED, plainly and accurately,
   under a heading that says that is what they are. Every figure on it is real
   and comes off the record. When the reviewed wording arrives it drops into
   `Clauses` below and nothing else has to move.

   ONE DOCUMENT, NOT A TWO-COPY SHEET. A receipt is half a page, so two fit on
   one sheet with a cut line between them. A contract runs to a full page and
   every party signs the SAME text, so it prints once and you take as many
   copies as there are signatories. There is deliberately no "tenant's copy"
   here: a contract that says something different to each side is not one.
   ========================================================================== */

/* ---------------- small pieces ---------------- */

function Row({ k, v, mono }: { k: string; v: ReactNode; mono?: boolean }) {
  /* An absent term prints nothing at all. "Not stated" on a signed page is a
     blank somebody can fill in afterwards. */
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="cd-row">
      <dt>{k}</dt>
      <dd className={mono ? "cd-mono" : undefined}>{v}</dd>
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
}: {
  t: (k: string, p?: Record<string, string | number>) => string;
  role: string;
  name: string;
  phone?: string;
  idNumber?: string;
  signer?: SignerOverride;
}) {
  return (
    <div className="cd-party">
      <span className="cd-party__role">{role}</span>
      <span className="cd-party__name">{name}</span>
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
function Clauses({
  c,
  t,
  lang,
}: {
  c: ContractRecord;
  t: (k: string, p?: Record<string, string | number>) => string;
  lang: Lang;
}) {
  const money = (n: number): string => formatMoney(lang, { amount: Math.round(n * 100), currency: c.price.currency } as Money);

  const line = (key: ClauseKey): string | undefined => {
    const v = clauseValue(c, key);
    if (v === undefined || v === "") return undefined;
    switch (key) {
      case "lateRentPenalty": {
        /* The basis decides whether the figure is money or a percentage. A "5"
           meaning five per cent a day and a "5" meaning five dollars a day are
           the same number and a completely different obligation, so the two are
           always read together. */
        return clauseValue(c, "lateRentBasis") === "percent_per_day"
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

  const lines = clauseKeysFor(templateOf(c))
    .map(line)
    .filter((x): x is string => !!x);

  /* The notice period is stated even where the parties wrote none down: the app
     applies a default to every tenancy, so the tenancy HAS one, and leaving the
     only clause with a silent default off the paper is where an argument
     starts. See DEFAULT_NOTICE_DAYS. */
  if (templateOf(c) === "lease" && clauseValue(c, "noticeDays") === undefined) {
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

/* ---------------- the document ---------------- */

export function ContractDocApp({ id }: { id: string }) {
  /* `ui` dresses the toolbar; `lang` is the PAPER's. The two part company the
     moment somebody prints an Arabic lease from an English console — the same
     split, and the same reasoning, as the receipt. */
  const { t: ui, lang: uiLang } = useLang();
  /* ?lang= is how the Documents tab prints this sheet without anybody having
     to come here and choose — the same contract receipt-app.tsx honours. Read
     once, as the initial value, so the picker above still wins the moment
     somebody touches it. */
  const asked = useSearchParams().get("lang");
  const [picked, setLang] = useState<Lang | null>(() => (LANGS.includes(asked as Lang) ? (asked as Lang) : null));
  const lang = picked ?? uiLang;
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(lang, key, params), [lang]);

  const { settings } = usePlatformSettings();
  const g = settings.general;
  const { getContract } = useContracts();
  const { properties, members, agents } = useProperties();

  const c = getContract(id);

  const facts = useMemo(() => {
    if (!c) return undefined;
    const property = properties.find((p) => p.id === c.propertyId);
    const owner = members.find((m) => m.id === c.ownerId);
    const buyer = c.buyerId ? members.find((m) => m.id === c.buyerId) : undefined;
    return {
      property,
      ownerPhone: owner?.phone,
      ownerName: owner?.name ?? c.ownerId,
      counterpartyName: buyer?.name ?? c.buyerExternal?.name ?? "",
      counterpartyPhone: buyer?.phone ?? c.buyerExternal?.phone,
      /* Only an off-platform party carries an id number on the contract; a
         member's is on their record, not on this agreement. */
      counterpartyIdNumber: c.buyerExternal?.idNumber,
      agentName: agents.find((a) => a.id === c.agentId)?.name ?? c.agentId,
      /* The city has a catalog entry ("city.Erbil"), the area and district do
         not — so the one that CAN be translated is, and the two that cannot are
         left as the canonical names they are stored under. */
      address: property
        ? [...new Set([property.area, property.district].filter(Boolean)), t("city." + property.city)].filter(Boolean).join(", ")
        : "",
    };
  }, [c, properties, members, agents, t]);

  if (!c || !facts) {
    return (
      <div className="cd-missing">
        <span className="cd-missing__art">
          <Icon name="file-x" size={26} strokeWidth={1.6} />
        </span>
        <h1>{ui("admin.cd.notFound")}</h1>
        <p>{ui("admin.cd.notFoundSub")}</p>
      </div>
    );
  }

  const template = templateOf(c);
  const lease = template === "lease";
  const schedule = hasInstallments(c) ? installmentSchedule(c) : [];
  const ownerFee = ownerCommissionOf(c);
  const tenantFee = tenantCommissionOf(c);
  const mgmt = managementFeeAmount(c);
  const ownerRole = t(lease ? "admin.pd.landlord" : "admin.pd.seller");
  const partyRole = t(lease ? "admin.pd.tenant" : "admin.pd.buyer");
  /* The schedule earns a section of its own only on an instalment sale, so the
     two after it shift up by one rather than leaving a gap in the numbering. */
  const nFees = schedule.length > 0 ? 5 : 4;

  return (
    <div className="cd-page">
      {/* Screen furniture — none of it prints. See the print rules in cd.css. */}
      <div className="cd-toolbar">
        <Link className="cd-back" href={`/admin/contracts/${encodeURIComponent(c.id)}`}>
          <Icon name="arrow-left" size={15} />
          {ui("admin.cd.back")}
        </Link>
        <div className="cd-tools">
          {/* The language of the PAPER, not of the console. */}
          <div className="cd-langs" role="group" aria-label={ui("admin.cd.langAria")}>
            {LANGS.map((code) => (
              <button
                key={code}
                type="button"
                className={"cd-lang" + (lang === code ? " is-active" : "")}
                aria-pressed={lang === code}
                lang={code}
                onClick={() => setLang(code)}
              >
                {translate(code, "lang." + code)}
              </button>
            ))}
          </div>
          <Button hierarchy="primary" size="md" iconLeading="printer" onClick={() => window.print()}>
            {ui("admin.cd.print")}
          </Button>
        </div>
      </div>

      {/* ⚠ SAID ON SCREEN, NEVER ON THE PAPER. Whoever is printing needs to know
          the clause wording is pending review. The two people signing do not
          need a disclaimer printed across their agreement. */}
      <p className="cd-hint">{ui("admin.cd.draftNote")}</p>

      <article className="cd-sheet" lang={lang} dir={dirFor(lang)}>
        <div className="cd-band">
          <span className="cd-band__org">
            <b className="cd-band__name">{g.platformName}</b>
            <span className="cd-band__eyebrow">{t("admin.cd.band")}</span>
          </span>
          <span className="cd-band__no">{localizeDigits(lang, c.id)}</span>
        </div>

        <header className="cd-head">
          <h1 className="cd-title">{t(`admin.cd.title.${template}`)}</h1>
          <p className="cd-place">
            {t("admin.cd.madeAt", {
              city: facts.property ? t("city." + facts.property.city) : "",
              date: fmtDate(lang, fromIso(c.signedOn || c.createdOn)),
            })}
          </p>
        </header>

        <Section n={1} title={t("admin.cd.s.parties")}>
          <div className="cd-parties">
            <Party t={t} role={ownerRole} name={facts.ownerName} phone={facts.ownerPhone} signer={c.signerOverride} />
            <Party
              t={t}
              role={partyRole}
              name={facts.counterpartyName}
              phone={facts.counterpartyPhone}
              idNumber={facts.counterpartyIdNumber}
              signer={c.buyerSignerOverride}
            />
          </div>
          <p className="cd-brokered">{t("admin.cd.brokeredBy", { agency: g.platformName, agent: facts.agentName })}</p>
        </Section>

        <Section n={2} title={t("admin.cd.s.property")}>
          <dl className="cd-rows">
            <Row k={t("admin.cd.f.code")} v={localizeDigits(lang, c.propertyId)} mono />
            <Row k={t("admin.cd.f.name")} v={facts.property?.title} />
            <Row k={t("admin.cd.f.type")} v={facts.property?.type} />
            <Row k={t("admin.cd.f.address")} v={facts.address} />
          </dl>
        </Section>

        <Section n={3} title={t(lease ? "admin.cd.s.rent" : "admin.cd.s.price")}>
          <dl className="cd-rows">
            {lease ? (
              <>
                <Row k={t("admin.cd.f.rentPerCycle")} v={formatMoney(lang, c.price)} />
                <Row k={t("admin.cd.f.cycle")} v={c.cycle ? t(`admin.cn.cycle.${c.cycle}`) : undefined} />
                <Row k={t("admin.cd.f.termMonths")} v={c.termMonths ? fmtNum(lang, c.termMonths) : undefined} />
                <Row k={t("admin.cd.f.startsOn")} v={c.startsOn ? fmtDate(lang, fromIso(c.startsOn)) : undefined} />
                <Row k={t("admin.cd.f.endsOn")} v={c.endsOn ? fmtDate(lang, fromIso(c.endsOn)) : undefined} />
                <Row k={t("admin.cd.f.deposit")} v={c.insuranceDeposit ? formatMoney(lang, c.insuranceDeposit) : undefined} />
                <Row
                  k={t("admin.cd.f.rentPaidTo")}
                  v={t(c.rentPaidTo === "agency" ? "admin.cd.collect.agency" : "admin.cd.collect.owner")}
                />
                <Row k={t("admin.cd.f.managementFee")} v={mgmt && mgmt.amount > 0 ? formatMoney(lang, mgmt) : undefined} />
              </>
            ) : (
              <>
                <Row k={t("admin.cd.f.price")} v={formatMoney(lang, c.price)} />
                <Row k={t("admin.cd.f.downPayment")} v={c.downPayment ? formatMoney(lang, c.downPayment) : undefined} />
                <Row k={t("admin.cd.f.holdingDeposit")} v={c.deposit ? formatMoney(lang, c.deposit) : undefined} />
              </>
            )}
          </dl>
          {/* IN WORDS AS WELL AS FIGURES, on the one number the whole document
              exists for. A handwritten alteration to a figure can be argued
              with; a written-out sentence cannot. */}
          <p className="cd-words">
            {t(lease ? "admin.cd.rentWords" : "admin.cd.priceWords", { words: moneyToWords(c.price, lang) })}
          </p>
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
            <Row k={t(lease ? "admin.cn.f.landlordFee" : "admin.cn.f.sellerFee")} v={formatMoney(lang, ownerFee.amount)} />
            {tenantFee.basis !== "none" && (
              <Row k={t(lease ? "admin.cn.f.tenantFee" : "admin.cn.f.buyerFee")} v={formatMoney(lang, tenantFee.amount)} />
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
    </div>
  );
}
