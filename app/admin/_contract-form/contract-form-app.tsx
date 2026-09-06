"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLang } from "@/lib/i18n";
import { fmtDate, fmtNum, localizeDigits } from "@/lib/fmt";
import { addDays, fromIso } from "@/lib/dates";
import { formatMoney, isZero, money, moneyToWords, multiply, percentOf, splitIntoInstallments, sumMoney, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";
import { rateFor, usePlatformSettings } from "@/lib/platform-settings";
import { projectNameOf } from "../_data/catalog";
import {
  CYCLE_MONTHS,
  DEFAULT_NOTICE_DAYS,
  DEFAULT_SALE_COMMISSION_RATE,
  INSTALLMENT_MONTHS,
  PLATFORM_CURRENCY,
  clauseKeysFor,
  deriveEndsOn,
  financedAmount,
  installmentSchedule,
  type CommissionBasis,
  type ContractKind,
  type ContractTemplate,
  type InstallmentFrequency,
  type InstallmentsPaidTo,
  type RentCycle,
  type RentPaidTo,
} from "../_data/contracts";
import { useContracts } from "../_shared/contracts-store";
import { useProperties } from "../_shared/properties-store";
/* The members page's add modal and its record factory, so a member created in
   the middle of a contract is the same member as one created from the list. */
import { AddMemberModal } from "../_members/add-member-modal";
import { newMemberRecord } from "../_members/data";
import { useFinanceActions, TODAY } from "../_shared/finance";
import { draftEndsOn, draftPrice, toContractRecord, type ContractDraft } from "../_shared/finance/invoice-generation";
/* THE PAPER, LIVE. The same sheet the print page renders — not a second,
   simpler drawing of it. See the header note in contract-sheet.tsx. */
import { ContractSheet } from "../_contract-doc/contract-sheet";
import { FinanceToaster, useFinanceToasts } from "../_shared/finance/toaster";
/* The review step is the add-property wizard's, not a second one that looks
   like it — same components, same CSS, already imported by the route. */
import { ProgressStepper, RevItem, ReviewSection } from "../_add-property/add-property-app";
import {
  AmendBanner,
  ChoiceCards,
  ConsequenceBar,
  DateInput,
  MoneyField,
  NumberInput,
  Pair,
  PickedParty,
  ReadOut,
  PickedProperty,
  Row,
  Full,
  Wide,
  Grid,
  Section,
  SelectInput,
  TextArea,
  TextInput,
  moneyToText,
  textToMoney,
  type Choice,
} from "./fields";

/* =============================================================================
   THE CONTRACT FORM — a full page, not a modal.

   It replaces NewContractModal, which is deleted. A modal was the wrong
   container for this from the start: the lease form asks about twenty
   questions, several of them consequential, and a 460px panel forced three
   inputs onto every row and a bare radio wherever a decision needed
   explaining. The earlier design was rejected as cramped, and the fix is not
   tighter spacing — it is a page.

   IT LOOKS LIKE THE ADD-PROPERTY WIZARD ON PURPOSE. Same shell, same
   breadcrumbs, same progress rail, same footer, imported from the same CSS
   rather than rebuilt (see app/admin/contracts/new/page.tsx). Two full-page
   admin workflows that look almost-but-not-quite alike read as though the
   difference means something.

   THE DOCUMENT TYPE IS CHOSEN BEFORE THIS OPENS. A sale and a lease are
   different papers with different clauses, and branching mid-form would ask
   half the questions twice and throw away the answers to the rest when
   somebody changed their mind on step 2. `kind` arrives from the URL:
   /admin/contracts/new?type=lease. The one thing still chosen INSIDE the form
   is how a sale is paid — in full or in instalments — because that is a
   payment arrangement rather than a different set of obligations, and it is
   asked once, on the money step, as two cards.

   FOUR STEPS:
     1  property and parties
     2  money and term
     3  penalties and signing
     4  review

   THE FOURTH IS THE ONE THIS SCREEN WAS MISSING. Signing raises invoices,
   freezes an exchange rate and moves the property off the market, and until now
   the only thing standing in front of that was a `Preview` toggle at the bottom
   of step 3 that listed some figures. The add-property wizard — which this
   screen shares its chrome with — has had a review step since it was written,
   so this one is not a new pattern: it is `ReviewSection` and `RevItem`
   imported from there, over the `.ap-rev__*` CSS the route already loads.
   `Save and sign` lives on that step and nowhere else.

   BESIDE THE FORM, A SUMMARY PANEL. Every figure the contract states, in one
   place, updating as it is typed — see ./summary. It replaced five `Derived`
   chips that each sat inside the row that produced them, which meant the deal
   as a whole was never visible anywhere.

   AND ON EVERY STEP: `Save draft`, and a CONSEQUENCE BAR that says in a
   sentence what the buttons will actually do — rewritten from the current state
   of the form, and counted off the same `plannedInvoices` list that signing
   issues. The bar is the ACTION; the panel is the DOCUMENT. Keeping them
   separate is deliberate: merged, they would be one paragraph that is half
   figures and half warning, and the warning is the half people skip.
   ========================================================================== */

const STEP_KEYS = ["admin.cn.step.parties", "admin.cn.step.money", "admin.cn.step.review"] as const;

/** The last step's index, named because four places ask "are we on it". */
const REVIEW = 2;

/** How many result rows the property search shows. The full list is never
    rendered — see the note on the search itself. */
const SEARCH_LIMIT = 7;

const CYCLE_CHOICES: RentCycle[] = ["monthly", "quarterly", "biannual", "yearly"];

export interface ContractFormProps {
  /** Sale or tenancy — fixed by the entry point, never changed on the form. */
  kind: ContractKind;
  /** Pre-selected and locked: opened from a property page or the wizard. */
  lockedPropertyId?: string;
  /** A DRAFT being corrected. */
  editingId?: string;
  /** A SIGNED contract being amended. See the banner and §10. */
  amendingId?: string;
  /** A tenancy that is ending — seeds a NEW contract that follows it. */
  renewingId?: string;
  basePath?: string;
}

export function ContractFormApp({ kind, lockedPropertyId, editingId, amendingId, renewingId, basePath = "/admin/contracts" }: ContractFormProps) {
  const { t, lang } = useLang();
  const router = useRouter();
  const { settings } = usePlatformSettings();
  const { properties, members, agents, addMember } = useProperties();
  const { contracts } = useContracts();
  const actions = useFinanceActions();
  const [toasts, pushToast, dismissToast] = useFinanceToasts();

  const existing = useMemo(
    () => contracts.find((c) => c.id === (amendingId ?? editingId ?? renewingId)),
    [contracts, amendingId, editingId, renewingId],
  );
  const amending = !!amendingId && !!existing;

  /**
   * A RENEWAL — the same form, seeded from the tenancy that is ending.
   *
   * It writes a NEW contract, never an extension: rent almost always changes,
   * and overwriting the old record would destroy the document a dispute would
   * be settled against. Everything carries over — the property, the parties,
   * the agent, the commission, the clauses — because almost none of it changes
   * and retyping twenty answers is how a renewal gets postponed.
   *
   * TWO THINGS DELIBERATELY DO NOT CARRY: the term starts the day after the old
   * one ends, and the signing date is blank. Those are the two facts that are
   * genuinely new, and inheriting either would date the renewal to last year.
   */
  const renewing = !!renewingId && !!existing;

  /* ---------------------------------------------------------------------------
     State. Money is held as the TEXT somebody typed, never as a number: "1,4"
     and "1." are what a half-typed amount looks like, and rounding those into a
     number while the cursor is still in the field changes what they typed.
     ------------------------------------------------------------------------ */

  const [step, setStep] = useState(1); // TEMP-SHOT

  /* step 1 — property and parties */
  const [propertyId, setPropertyId] = useState(existing?.propertyId ?? lockedPropertyId ?? "");
  const [propertyQuery, setPropertyQuery] = useState("");
  const [signerOpen, setSignerOpen] = useState(!!existing?.signerOverride);
  /* The same four questions for the OTHER side. A company sends whoever holds
     the seal; a family sends the son who lives in the country. Kept separate
     from the owner's because a contract can be signed by proxies on both sides
     at once, and the two reasons are different reasons. */
  const [bSignerOpen, setBSignerOpen] = useState(!!existing?.buyerSignerOverride);
  const [bSignerName, setBSignerName] = useState(existing?.buyerSignerOverride?.name ?? "");
  const [bSignerPhone, setBSignerPhone] = useState(existing?.buyerSignerOverride?.phone ?? "");
  const [bSignerId, setBSignerId] = useState(existing?.buyerSignerOverride?.idNumber ?? "");
  const [bSignerReason, setBSignerReason] = useState(existing?.buyerSignerOverride?.reason ?? "");
  const [signerName, setSignerName] = useState(existing?.signerOverride?.name ?? "");
  const [signerPhone, setSignerPhone] = useState(existing?.signerOverride?.phone ?? "");
  const [signerId, setSignerId] = useState(existing?.signerOverride?.idNumber ?? "");
  const [signerReason, setSignerReason] = useState(existing?.signerOverride?.reason ?? "");
  const [buyerId, setBuyerId] = useState(existing?.buyerId ?? "");
  const [partyQuery, setPartyQuery] = useState("");
  /* The add-member modal, opened from either half of the counterparty field.
     Creating the member here and selecting them is the whole point — a contract
     is the moment somebody's details are actually in front of you, and sending
     the user to /admin/members to type them in and then back again is how the
     free-text box wins. */
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  /* The paper, on a screen too narrow to hold it beside the form. Wide screens
     never read this — the panel is always there and there is nothing to open. */
  const [paperOpen, setPaperOpen] = useState(false);
  /**
   * The chosen counterparty owns the property that was chosen afterwards.
   *
   * The member search already refuses to offer the owner — but only once a
   * property is known, and the counterparty can now be chosen first. So the
   * same rule is enforced again at the other end: picking a property clears a
   * counterparty who turns out to own it, and this says so. A contract with
   * the same person on both sides is not a contract.
   */
  const [ownerClash, setOwnerClash] = useState(false);
  const [agentId, setAgentId] = useState(existing?.agentId ?? "");

  /* step 2 — money */
  const [salePayment, setSalePayment] = useState<"sale_full" | "sale_installments">(
    existing?.template === "sale_installments" ? "sale_installments" : "sale_full",
  );
  const [priceText, setPriceText] = useState(existing && existing.kind === "sale" ? moneyToText(existing.price) : "");
  const [downText, setDownText] = useState(existing?.downPayment ? moneyToText(existing.downPayment) : "");
  const [instCount, setInstCount] = useState(String(existing?.installmentCount ?? 12));
  const [instFreq, setInstFreq] = useState<InstallmentFrequency>(existing?.installmentFrequency ?? "monthly");
  const [firstInstOn, setFirstInstOn] = useState(existing?.firstInstallmentOn ?? "");
  const [instPaidTo, setInstPaidTo] = useState<InstallmentsPaidTo>(existing?.installmentsPaidTo ?? "seller");
  const [showAllInstallments, setShowAllInstallments] = useState(false);

  /* A SALE's holding deposit — consideration, and nothing like the tenancy
     deposit below. The record has carried it and the detail screen has shown it
     since the seed was written; this is the first form that can set one. */
  const [saleDepositText, setSaleDepositText] = useState(existing?.deposit ? moneyToText(existing.deposit) : "");

  const [rentText, setRentText] = useState(existing?.monthlyRent ? moneyToText(existing.monthlyRent) : "");
  const [cycle, setCycle] = useState<RentCycle>(existing?.cycle ?? "monthly");
  const [termText, setTermText] = useState(String(existing?.termMonths ?? 12));
  /* A renewal starts the day after the old term ends — no gap, no overlap. Any
     other default would have somebody typing a date they had just read off the
     screen above. */
  const [startsOn, setStartsOn] = useState(
    renewing && existing?.endsOn ? addDays(existing.endsOn, 1) : (existing?.startsOn ?? ""),
  );
  const [depositText, setDepositText] = useState(existing?.insuranceDeposit ? moneyToText(existing.insuranceDeposit) : "");
  /**
   * NEITHER IS ASKED FOR ANY MORE, and both are still carried.
   *
   * The handover date defaulted to the signing date and almost never differed
   * from it; the expected payment method was stated on the form and shown
   * nowhere afterwards — what actually arrives is recorded on each payment.
   * They are read off an existing contract so that reopening a draft or
   * amending a signed one keeps the terms it was written with, rather than
   * quietly dropping them because a field left the screen.
   */
  const payMethod = existing?.expectedPaymentMethod;
  const [rentPaidTo, setRentPaidTo] = useState<RentPaidTo>(existing?.rentPaidTo ?? "owner");
  const [feeType, setFeeType] = useState<"percent" | "fixed">(existing?.managementFee?.type ?? "percent");
  const [feeText, setFeeText] = useState(existing?.managementFee ? String(existing.managementFee.value) : "5");

  const [ownerBasis, setOwnerBasis] = useState<CommissionBasis>(existing?.ownerCommission?.basis ?? (kind === "rent" ? "half_month" : "percent"));
  const [ownerValue, setOwnerValue] = useState(String(existing?.ownerCommission?.value ?? existing?.commissionRate ?? ""));
  /* The counterparty's side: half a month on a tenancy, a percentage of the
     price on a sale. A sale REOPENED from before buyers were charged keeps the
     "none" it was written with — an amendment does not quietly add a fee the
     parties never signed. */
  const [tenantBasis, setTenantBasis] = useState<CommissionBasis>(existing?.tenantCommission?.basis ?? (kind === "rent" ? "half_month" : "percent"));
  const [tenantValue, setTenantValue] = useState(String(existing?.tenantCommission?.value ?? ""));
  /* NO LONGER ASKED, AND STILL CARRIED — the same rule as the handover date and
     the payment method above. The row that collected it is gone (see the note
     where it stood), so an existing contract keeps the reason it was written
     with rather than losing it because a field left the screen. */
  const overrideReason = existing?.commissionOverrideReason ?? "";

  /* step 3 — clauses and signing */
  const [clauses, setClauses] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const key of clauseKeysFor(kind === "rent" ? "lease" : "sale_full")) {
      const v = existing?.clauses?.[key];
      seed[key] = v === undefined ? "" : String(v);
    }
    if (kind === "rent" && !seed.noticeDays) seed.noticeDays = String(DEFAULT_NOTICE_DAYS);
    /* THE FORM ONLY STATES AN AMOUNT PER DAY. A contract written with a
       PERCENTAGE per day keeps neither the basis nor the figure behind it: "2"
       meant two percent of the rent, and the field it would land in now reads
       it as two dollars. Cleared, so the calculated day takes over — which is
       what the row shows and what the record then stores. */
    if (kind === "rent" && seed.lateRentBasis === "percent_per_day") seed.lateRentPenalty = "";
    if (kind === "rent") seed.lateRentBasis = "per_day";
    return seed;
  });
  const setClause = (key: string, value: string) => setClauses((c) => ({ ...c, [key]: value }));

  /* Blank on a renewal: it has not been signed yet, and inheriting last year's
     date would sign it into the past. Blank is also what makes it a draft until
     somebody fills it in — see the hint on the field. */
  const [signingDate, setSigningDate] = useState(renewing ? "" : (existing?.signedOn ?? ""));
  const handoverOn = existing?.handoverOn ?? "";
  const [city, setCity] = useState(existing?.city ?? "");
  const [copies, setCopies] = useState(String(existing?.copies ?? 3));
  const [organizerId, setOrganizerId] = useState(existing?.organizerId ?? "");
  /* Where the signed original is kept is no longer asked. The RECORD still
     carries it — the contract detail screen reads it to say the system holds no
     document — so an existing contract keeps whatever it was written with
     instead of losing it because a field left the screen. */
  const externalPaperwork = existing?.externalPaperwork ?? false;
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [amendReason, setAmendReason] = useState("");
  const [blocked, setBlocked] = useState<string | null>(null);

  /**
   * The currency terms an EXISTING contract already carries.
   *
   * Read, never edited. The form stopped asking about either of these — see the
   * note where the currency group used to be — but a draft being reopened or a
   * signed contract being amended must keep the terms it was written with, so
   * they ride through the draft untouched instead of being silently dropped.
   */
  const dualCurrency = existing?.dualCurrency ?? false;
  const agreedRateOnRecord = existing?.agreedRate;

  /* Set when somebody presses Next with gaps. Cleared on every move, so the
     list never outlives the problem it describes. */
  const [showMissing, setShowMissing] = useState(false);

  /* ---------------------------------------------------------------------------
     Derived. Nothing below is state, because a figure that is stored is a figure
     that can disagree with the field that produced it.
     ------------------------------------------------------------------------ */

  /**
   * The property this contract is written on — and never one listed the other
   * way round.
   *
   * ⚠ THE SEARCH IS NOT THE ONLY WAY IN. It filters by `listing` already, on
   * the grounds that a lease on a for-sale listing is refused by the data layer
   * and offering one would build a record that cannot be saved. But `?property=`
   * skips the search entirely, so a link — from a property page, from the
   * add-property wizard, from someone's notes — could put a sale listing into a
   * lease form and reach the same dead end with no way to see why. The rule is
   * enforced here instead, where both paths pass through.
   */
  const property = useMemo(() => {
    const found = properties.find((p) => p.id === propertyId);
    return found && found.listing === kind ? found : undefined;
  }, [properties, propertyId, kind]);

  /** A property arrived in the URL and was refused for the reason above. */
  const lockedMismatch = useMemo(
    () => !!lockedPropertyId && properties.some((p) => p.id === lockedPropertyId && p.listing !== kind),
    [properties, lockedPropertyId, kind],
  );

  /**
   * WHERE THE PAPER IS SIGNED — the property's city unless somebody types over
   * it.
   *
   * The field has always DISPLAYED the property's city as its value while the
   * state behind it stayed empty, so a form showing "Erbil" was refused by
   * `Next` for a missing city and saved a contract with none. The check and the
   * record read this now, which is the same thing the field shows.
   */
  const signedCity = city || property?.city || "";

  const lease = kind === "rent";
  const template: ContractTemplate = lease ? "lease" : salePayment;

  /* Currency is INHERITED from the property and never chosen here — see the
     header of lib/money. A contract in a different currency from its listing
     would silently restate the agreed figure. */
  const currency: CurrencyCode = property?.price.currency ?? settings.general.defaultCurrency;
  const toMoney = (text: string) => textToMoney(text, currency);

  const salePrice = toMoney(priceText);
  const monthlyRent = toMoney(rentText);
  const downPayment = toMoney(downText);
  const insuranceDeposit = toMoney(depositText);
  const saleDeposit = toMoney(saleDepositText);
  const termMonths = Number(termText) || 0;
  const installmentCount = Number(instCount) || 0;

  /* ---- currency ----------------------------------------------------------

     THE CONTRACT IS PRICED IN THE PROPERTY’S CURRENCY. It always was; the form
     no longer offers an opinion about it either.

     What survives here is one number: `quote`, dinars to the dollar, taken
     from settings. It is NOT a contractual term and nothing stores it — it is
     what the money fields divide by when somebody types an amount in the
     currency they happen to think in. The frozen `agreedRate` that DOES go on
     the record is set at save time from the same settings rate, by
     `agreedRateFor` in the finance layer, and an existing contract keeps
     whatever rate it was written with. */
  const secondaryCurrency: CurrencyCode = currency === "USD" ? "IQD" : "USD";
  /* Always dinars per dollar, whichever way round the contract is written. */
  const quoteCurrency: CurrencyCode = currency === PLATFORM_CURRENCY ? secondaryCurrency : currency;
  const quote = useMemo(() => rateFor(settings, quoteCurrency), [settings, quoteCurrency]);

  /**
   * THE DAY THE PROPERTY HAS TO BE EMPTY.
   *
   * On a tenancy that is the day the term runs out; on a sale it is the day the
   * keys change hands. Both were asked for as free dates beside their penalty,
   * which let somebody type a move-out date that contradicted the term they had
   * just agreed — or leave it blank, and print a clause with a hole in it.
   *
   * Derived here and written straight onto the record. NEITHER KIND ASKS FOR IT
   * ANY MORE — both rows are gone, and the notes standing where they were say
   * why. Nothing overrides it now: the day the keys move is the handover date,
   * which is a question the form asks once, at the top of the money step.
   */
  const mustBeOutBy = lease
    ? (startsOn && termMonths > 0 ? deriveEndsOn(startsOn, termMonths) : "")
    : (handoverOn || signingDate);

  /**
   * WHAT ONE LATE DAY COSTS — worked out from the rent, exactly like a
   * commission.
   *
   * It used to be an empty box beside a dropdown asking whether the number in
   * it meant dinars a day or a percentage of the rent a day. Two questions to
   * answer before the field said anything, and the answer to both was always
   * the same in practice: a day of the rent. So it is calculated — the month's
   * rent over a thirty-day month — shown in the field, and typed over when the
   * parties agreed something else. The same rule the commissions follow.
   *
   * THIRTY DAYS, NOT THE CALENDAR'S. A late day in February would otherwise
   * cost more than one in March, off the same rent, on a charge that has to be
   * defensible in one printed sentence.
   */
  const LATE_DAYS_PER_MONTH = 30;
  const dailyLate = monthlyRent ? multiply(monthlyRent, 1 / LATE_DAYS_PER_MONTH) : zeroMoney(currency);
  /** What somebody typed, or the calculated day — this is what the field shows
      AND what the record stores. A figure on screen that the contract does not
      carry is a missing clause one step later. */
  const lateTyped = String(clauses.lateRentPenalty ?? "").trim();
  const lateText = lateTyped || (isZero(dailyLate) ? "" : moneyToText(dailyLate));

  const owner = useMemo(() => members.find((m) => m.id === (property?.ownerId ?? "")), [members, property]);

  /* The agent who wrote it — the property's own, which is right in every
     ordinary case. A property with nobody assigned gets a picker rather than a
     silent default: a contract with the wrong name on it is worse than one more
     field. */
  const propertyAgentId = useMemo(() => {
    const name = property?.agent?.name;
    return name ? (agents.find((a) => a.name === name)?.id ?? "") : "";
  }, [property, agents]);
  const effectiveAgentId = propertyAgentId || agentId;

  /**
   * A PERCENTAGE WITH NO RATE IS NOT ZERO, IT IS THE STANDARD ONE.
   *
   * Both sale commissions are percentages and both fields start empty, so the
   * fee came out at nothing until somebody typed a rate the office already has.
   * ONE STANDARD, BOTH SIDES — see DEFAULT_SALE_COMMISSION_RATE. Only a sale
   * ever starts on a percentage; a tenancy is stated in months.
   *
   * ⚠ THESE, NOT THE RAW FIELDS, ARE WHAT THE DRAFT SAVES. The rate on screen
   * and the rate on the record have to be one number. They were two — the form
   * showed the default and stored a zero — so a sale saved without touching the
   * commission row came out at 0% with the right figure printed above it.
   */
  const ownerPct = ownerValue || (ownerBasis === "percent" ? String(DEFAULT_SALE_COMMISSION_RATE) : "");
  const tenantPct = tenantValue || (tenantBasis === "percent" ? String(DEFAULT_SALE_COMMISSION_RATE) : "");

  const draft: ContractDraft = useMemo(() => {
    const commission = (basis: CommissionBasis, value: string) => ({
      basis,
      ...(basis === "percent" || basis === "fixed" ? { value: Number(value) || 0 } : {}),
      amount: zeroMoney(currency), // recomputed by toContractRecord from the basis
    });
    return {
      template,
      propertyId,
      ownerId: property?.ownerId ?? "",
      ...(bSignerOpen && bSignerName.trim() && bSignerReason.trim()
        ? { buyerSignerOverride: { name: bSignerName.trim(), phone: bSignerPhone.trim(), idNumber: bSignerId.trim() || undefined, reason: bSignerReason.trim() } }
        : {}),
      ...(signerOpen && signerName.trim() && signerReason.trim()
        ? { signerOverride: { name: signerName.trim(), phone: signerPhone.trim(), idNumber: signerId.trim() || undefined, reason: signerReason.trim() } }
        : {}),
      ...(buyerId ? { buyerId } : {}),
      agentId: effectiveAgentId,
      ...(lease
        ? {
            monthlyRent,
            cycle,
            termMonths,
            startsOn,
            insuranceDeposit,
            ...(payMethod ? { expectedPaymentMethod: payMethod } : {}),
            rentPaidTo,
            ...(rentPaidTo === "agency" ? { managementFee: { type: feeType, value: Number(feeText) || 0 } } : {}),
          }
        : {
            salePrice,
            ...(saleDeposit ? { deposit: saleDeposit } : {}),
            /* Outside the block below: a down payment is a term of any sale, not
               a property of a schedule. On a full-payment sale it changes no
               invoice — see plannedInvoices — it simply records what was handed
               over on the day. */
            downPayment,
            ...(template === "sale_installments"
              ? {
                  installmentCount,
                  installmentFrequency: instFreq,
                  firstInstallmentOn: firstInstOn,
                  installmentsPaidTo: instPaidTo,
                }
              : {}),
          }),
      ownerCommission: commission(ownerBasis, ownerPct),
      tenantCommission: commission(tenantBasis, tenantPct),
      ...(overrideReason.trim() ? { commissionOverrideReason: overrideReason.trim() } : {}),
      /* The derived date is saved, though nothing on the form asks for it. A
         clause the document prints and the record does not hold is a hole in
         the paper, found at the printer rather than here. */
      clauses: {
        ...clauses,
        /* The calculated day goes on the record whether or not anybody typed
           over it, and the basis with it: this form only ever states an amount
           per day now, so a contract it saves says so rather than leaving
           `latePenaltyFor` to assume. */
        ...(lease ? { lateRentPenalty: lateText, lateRentBasis: "per_day" } : {}),
        ...(lease && !clauses.vacateByDate && mustBeOutBy ? { vacateByDate: mustBeOutBy } : {}),
        ...(!lease && !clauses.evacuationDate && mustBeOutBy ? { evacuationDate: mustBeOutBy } : {}),
      },
      signingDate,
      ...(handoverOn ? { handoverOn } : {}),
      city: signedCity,
      copies: Number(copies) || 0,
      organizerId,
      externalPaperwork,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      /* The chain. Signing this retires the tenancy it names — see saveContract. */
      ...(renewing && existing ? { replacesContractId: existing.id } : {}),
      dualCurrency,
    };
  }, [
    template, propertyId, property, signerOpen, signerName, signerPhone, signerId, signerReason,
    bSignerOpen, bSignerName, bSignerPhone, bSignerId, bSignerReason, buyerId, effectiveAgentId, lease, monthlyRent, cycle, termMonths, startsOn, insuranceDeposit, payMethod, rentPaidTo,
    feeType, feeText, salePrice, saleDeposit, downPayment, installmentCount, instFreq, firstInstOn, instPaidTo, ownerBasis, ownerPct,
    tenantBasis, tenantPct, overrideReason, clauses, mustBeOutBy, lateText, signingDate, handoverOn, signedCity, copies, organizerId, currency,
    externalPaperwork, notes, dualCurrency, renewing, existing,
  ]);

  const price = draftPrice(draft);
  const endsOn = draftEndsOn(draft);

  /**
   * THE PAPER, AS IT STANDS RIGHT NOW.
   *
   * The same record `save` would write, built from the same draft by the same
   * function — so what the panel shows and what the printer prints cannot
   * disagree. It is rebuilt on every keystroke and stored nowhere.
   *
   * ⚠ THIS IS NOT THE SUMMARY PANEL THAT WAS REMOVED. That one repeated the
   * form's own figures back in a second column, which is why it went: the term
   * end belongs beside the dates and each commission beside its own field, and
   * they live there now. This is the DOCUMENT — the page two people sign,
   * which the form has never shown and which is the only reason any of these
   * questions are being asked.
   *
   * The id is blank unless a saved draft is being reopened. A contract nobody
   * has saved has no number, and inventing one on the paper would be the one
   * figure on it that is not true.
   */
  const paper = useMemo(
    () => toContractRecord(draft, { id: editingId && existing ? existing.id : "", createdOn: TODAY }),
    [draft, editingId, existing],
  );

  const commissionOf = (basis: CommissionBasis, value: string): Money => {
    if (!price) return zeroMoney(currency);
    const monthly = monthlyRent ?? price;
    switch (basis) {
      case "none": return zeroMoney(currency);
      case "half_month": return percentOf(monthly, 50);
      case "one_month": return monthly;
      case "percent": return percentOf(price, Number(value) || 0);
      case "fixed": return money(Number(value) || 0, currency);
    }
  };
  const ownerFee = commissionOf(ownerBasis, ownerPct);
  /* Both sides, on a tenancy AND on a sale — the buyer pays here too. */
  const tenantFee = commissionOf(tenantBasis, tenantPct);

  /**
   * WHAT ONE INSTALMENT COSTS — the figure the deal is actually agreed on.
   *
   * "Thirty percent down, then twelve hundred a month" is how a payment plan is
   * quoted in this market; nobody agrees to "forty-eight payments" and works
   * the rest out afterwards. So it is shown beside the count, worked out as it
   * is typed, the same way the tenancy shows its end date beside the term.
   *
   * SPLIT WITHOUT THE DATES, which is why this is not read off `schedule`
   * below. The amounts depend on the balance and the count; only the DUE DATES
   * need a first-due date. Gating the figure on the calendar left the section
   * silent at exactly the moment somebody was typing the count to check it.
   *
   * Same two functions the schedule itself calls — `financedAmount` for the
   * balance and `splitIntoInstallments` for the rounding — so the number on
   * screen cannot disagree with the invoices signing raises.
   */
  /** What the schedule has to clear: the price less anything paid at signing. */
  const financedBalance = useMemo(
    /* The holding deposit comes off too — it is part of the price, and money
       the buyer has already put down cannot be spread over the schedule as
       well. See financedAmount. */
    () => (salePrice ? financedAmount({ price: salePrice, downPayment, deposit: saleDeposit }) : undefined),
    [salePrice, downPayment, saleDeposit],
  );

  const instAmounts = useMemo(() => {
    /* A down payment typed larger than the price. The record refuses one, but
       it is reachable mid-keystroke, and a negative instalment on screen reads
       as arithmetic nobody can trust. Nothing is shown instead. */
    if (template !== "sale_installments" || !financedBalance || financedBalance.amount <= 0 || installmentCount <= 0) return [];
    return splitIntoInstallments(financedBalance, installmentCount);
  }, [template, financedBalance, installmentCount]);

  const schedule = useMemo(
    () =>
      template === "sale_installments" && salePrice && installmentCount > 0 && firstInstOn
        ? installmentSchedule({ price: salePrice, downPayment, deposit: saleDeposit, installmentCount, installmentFrequency: instFreq, firstInstallmentOn: firstInstOn })
        : [],
    [template, salePrice, downPayment, saleDeposit, installmentCount, instFreq, firstInstOn],
  );

  /* THE plan — the same list signing issues, so the consequence bar cannot
     promise one thing and the button do another. */
  const plan = useMemo(() => (property ? actions.previewPlan(draft) : []), [actions, draft, property]);
  const planTotal = useMemo(
    () => sumMoney(plan.filter((p) => p.amount.currency === currency).map((p) => p.amount), currency),
    [plan, currency],
  );

  /* ---------------------------------------------------------------------------
     Validation — per step, so somebody is told at the point they can fix it.

     WHAT IS MISSING, NOT WHETHER ANYTHING IS. This used to be an array of
     booleans feeding `disabled` on the Next button, which meant a form with one
     empty field and a form with nine looked exactly alike: a dead button and no
     way to know why. Each entry is now the list of gaps, in the order the
     fields appear on the step, so the first one is also the one to put the
     cursor in. `[]` means the step is done.

     Each gap carries the id of the control it belongs to. An id that is not
     rendered — the agent picker on a property that already has one — cannot be
     a gap, which is why those cases are guarded here rather than in the JSX.
     ------------------------------------------------------------------------ */

  type Gap = { key: string; id?: string };

  const missingOn = (n: number): Gap[] => {
    const gaps: Gap[] = [];
    if (n === 0) {
      if (!property) gaps.push({ key: "admin.cn.missing.property", id: "cn-prop" });
      if (property && !property.ownerId) gaps.push({ key: "admin.cn.missing.owner" });
      if (!buyerId) gaps.push({ key: "admin.cn.missing.counterparty", id: "cn-member" });
      if (signerOpen && !signerName.trim()) gaps.push({ key: "admin.cn.missing.signerName", id: "cn-signer" });
      if (signerOpen && signerName.trim() && !signerReason.trim()) gaps.push({ key: "admin.cn.missing.signerReason", id: "cn-signerwhy" });
      if (bSignerOpen && !bSignerName.trim()) gaps.push({ key: "admin.cn.missing.signerName", id: "cn-bsigner" });
      if (bSignerOpen && bSignerName.trim() && !bSignerReason.trim()) gaps.push({ key: "admin.cn.missing.signerReason", id: "cn-bsignerwhy" });
      /* Only a gap when the picker is on screen: a property with an agent
         assigned answers this question by itself. */
      if (property && !effectiveAgentId && !propertyAgentId) gaps.push({ key: "admin.cn.missing.agent", id: "cn-agent" });
      return gaps;
    }
    if (n === 1) {
      if (lease) {
        if (!monthlyRent) gaps.push({ key: "admin.cn.missing.rent", id: "cn-rent" });
        if (!startsOn) gaps.push({ key: "admin.cn.missing.startsOn", id: "cn-starts" });
        if (termMonths <= 0) gaps.push({ key: "admin.cn.missing.term", id: "cn-starts" });
      } else {
        if (!salePrice) gaps.push({ key: "admin.cn.missing.price", id: "cn-price" });
        if (template === "sale_installments" && installmentCount <= 0) gaps.push({ key: "admin.cn.missing.instCount", id: "cn-count" });
        if (template === "sale_installments" && !firstInstOn) gaps.push({ key: "admin.cn.missing.firstDue", id: "cn-first" });
      }
      /* Signing moved onto this step with the dates, so its gaps did too. */
      if (!signingDate) gaps.push({ key: "admin.cn.missing.signedOn", id: "cn-signed" });
      if (!signedCity.trim()) gaps.push({ key: "admin.cn.missing.city", id: "cn-city" });
      if (amending && !amendReason.trim()) gaps.push({ key: "admin.cn.missing.amendReason", id: "cn-amendwhy" });
      return gaps;
    }
    return gaps;
  };

  /**
   * The gap on one specific control, once somebody has asked to move on.
   *
   * The list above the footer says what is missing; this puts the same thing on
   * the field itself, so a form with three gaps marks three fields rather than
   * making somebody match a list against a page.
   */
  const gapOn = (id: string): string | undefined => {
    if (!showMissing) return undefined;
    const hit = missingOn(step).find((g) => g.id === id);
    return hit ? t(hit.key) : undefined;
  };

  /* Everything, for the review step and the sign button. */
  const allGaps = [...missingOn(0), ...missingOn(1)];
  const canSign = allGaps.length === 0;
  /* Saving a DRAFT needs only enough to identify what the draft is about. A
     half-written contract is the entire point of a draft. */
  const canDraft = missingOn(0).length === 0;

  /* ---------------------------------------------------------------------------
     The consequence sentence.

     Assembled by SHAPE, not by concatenation: each branch below picks ONE
     complete sentence out of the catalog and interpolates it. Kurdish and
     Arabic put the clauses of a sentence like this in a different order from
     English, and gluing "Signing will create" + "2 invoices" + "and mark"
     together would produce something no translator could fix.
     ------------------------------------------------------------------------ */
  const consequence = ((): { text: string; tone: "info" | "warn" } | null => {
    /* NOTHING TO SAY, SO NOTHING IS SAID. This used to render "pick a property
       and set the money, and this line will say exactly what saving will do" —
       a promise about a future message, occupying the same blue band that later
       carries the real one. A bar that is sometimes filler is a bar people learn
       to skip, and the sentence it eventually holds is the one thing on this
       screen nobody should skip. */
    if (!property) return null;
    const propertyTitle = property.title;
    if (amending) {
      return { text: t("admin.cn.conseq.amend", { id: existing?.id ?? "", count: fmtNum(lang, (existing?.amendments?.length ?? 0) + 1) }), tone: "warn" as const };
    }
    /* Also the answer when the money is not typed yet: a draft ALREADY holds
       the property off the public website, whatever else is still blank, and
       that is a consequence somebody should not discover afterwards. */
    if (!signingDate || !price) {
      return { text: t("admin.cn.conseq.draft", { property: propertyTitle }), tone: "info" as const };
    }
    const count = fmtNum(lang, plan.length);
    const total = formatMoney(lang, planTotal);
    if (!lease) {
      return {
        text:
          template === "sale_installments"
            ? t("admin.cn.conseq.saleInstallments", { count, installments: fmtNum(lang, schedule.length), total, property: propertyTitle })
            : t("admin.cn.conseq.sale", { count, total, property: propertyTitle }),
        tone: "info" as const,
      };
    }
    const until = endsOn ? fmtDate(lang, fromIso(endsOn)) : "—";
    return {
      text:
        insuranceDeposit && insuranceDeposit.amount > 0
          ? t("admin.cn.conseq.leaseDeposit", { count, total, deposit: formatMoney(lang, insuranceDeposit), property: propertyTitle, until })
          : t("admin.cn.conseq.lease", { count, total, property: propertyTitle, until }),
      tone: "info" as const,
    };
  })();

  /* ---------------------------------------------------------------------------
     Exits
     ------------------------------------------------------------------------ */

  /**
   * Move to a step and put the reader back at the top of it.
   *
   * NOT `window.scrollTo`. The admin shell is `height: 100vh; overflow: hidden`
   * with `.ax-content` as the scroll container (components/admin/admin-shell.css),
   * so the window never scrolls and scrolling it did nothing — every step change
   * left the reader wherever the last one had them, halfway down a new form.
   */
  /**
   * Choose a property — and check it against the counterparty already chosen.
   *
   * The two questions can now be answered in either order, so the rule that a
   * landlord cannot also be the tenant has to hold in both. The member search
   * enforces it one way by never offering the owner; this enforces it the
   * other, by clearing a counterparty the newly-chosen property turns out to
   * belong to.
   */
  const choosePropertyId = (p: { id: string; ownerId?: string }) => {
    setPropertyId(p.id);
    setPropertyQuery("");
    if (buyerId && p.ownerId && buyerId === p.ownerId) {
      setBuyerId("");
      setOwnerClash(true);
    }
  };

  const goTo = (n: number) => {
    setStep(n);
    setShowMissing(false);
    document.querySelector(".ax-content")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** The step that owns a gap — the only two that can hold one. */
  const stepOfFirstGap = () => (missingOn(0).length > 0 ? 0 : 1);

  /**
   * Take somebody to the first thing they have not filled in.
   *
   * Used from the review step, where the fields themselves are not on screen.
   * Marking them is useless from there, so this moves to the step holding the
   * first gap and lets that step's own field errors do the talking.
   */
  const jumpToFirstGap = () => {
    const n = stepOfFirstGap();
    setStep(n);
    setShowMissing(true);
    document.querySelector(".ax-content")?.scrollTo({ top: 0, behavior: "smooth" });
    const target = missingOn(n).find((g) => g.id)?.id;
    if (target) {
      /* After the step has painted — the field does not exist until then. */
      requestAnimationFrame(() => {
        const el = document.getElementById(target);
        el?.focus();
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    }
  };

  /**
   * Next, or say what is stopping it.
   *
   * The button is never disabled. A dead button is the worst answer to "why
   * can't I continue" — it withholds the one thing the person needs. Pressing
   * it with gaps lists them and moves the cursor into the first.
   */
  const tryAdvance = (to: number) => {
    const gaps = missingOn(step);
    if (gaps.length === 0) {
      goTo(to);
      return;
    }
    setShowMissing(true);
    /* The first gap that names a control on screen. Some gaps — a property with
       no registered owner — have nothing to focus, and skipping those is why
       this looks for an id rather than taking gaps[0]. */
    const target = gaps.find((g) => g.id)?.id;
    if (target) {
      const el = document.getElementById(target);
      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  };

  const finish = (contractId: string, signed: boolean, invoiceCount: number) => {
    router.push(`${basePath}/${encodeURIComponent(contractId)}`);
    void signed;
    void invoiceCount;
  };

  const save = (withSignature: boolean) => {
    if (!property) return;
    const body: ContractDraft = withSignature ? draft : { ...draft, signingDate: "" };

    if (amending && existing) {
      if (!actions.moneyAmendable(existing.id)) {
        setBlocked(t("admin.cn.amend.blocked"));
        return;
      }
      const ok = actions.amendContract(existing.id, draft, amendReason.trim());
      if (!ok) {
        setBlocked(t("admin.cn.amend.blocked"));
        return;
      }
      finish(existing.id, true, 0);
      return;
    }

    if (editingId && existing) {
      actions.updateDraft(existing.id, body);
      if (!withSignature) {
        pushToast({ tone: "brand", icon: "file-pen", title: t("admin.fin.toast.draftedTitle"), msg: t("admin.fin.toast.draftedMsg", { id: existing.id }) });
        return;
      }
      finish(existing.id, true, plan.length);
      return;
    }

    const { contract, invoiceCount } = actions.saveContract(body);
    finish(contract.id, withSignature, invoiceCount);
  };

  /* ---------------------------------------------------------------------------
     Options — built here rather than in a data file because every one of them
     carries a translated description line, and a description that lives away
     from the thing it describes is one that stops matching it.
     ------------------------------------------------------------------------ */

  const salePaymentChoices: Choice<"sale_full" | "sale_installments">[] = [
    { value: "sale_full", label: t("admin.cn.pay.full"), desc: t("admin.cn.pay.fullDesc"), icon: "banknote" },
    { value: "sale_installments", label: t("admin.cn.pay.installments"), desc: t("admin.cn.pay.installmentsDesc"), icon: "calendar" },
  ];
  const rentPaidToChoices: Choice<RentPaidTo>[] = [
    { value: "owner", label: t("admin.cn.collect.landlord"), desc: t("admin.cn.collect.landlordDesc"), icon: "user" },
    { value: "agency", label: t("admin.cn.collect.agency"), desc: t("admin.cn.collect.agencyDesc"), icon: "building" },
  ];
  const instPaidToChoices: Choice<InstallmentsPaidTo>[] = [
    { value: "seller", label: t("admin.cn.instTo.seller"), desc: t("admin.cn.instTo.sellerDesc"), icon: "user" },
    { value: "agency", label: t("admin.cn.instTo.agency"), desc: t("admin.cn.instTo.agencyDesc"), icon: "building" },
  ];
  /* The basis list is no longer offered as a choice — see commissionRow. The
     bases themselves still exist on the record and still drive the arithmetic;
     what is gone is the dropdown asking somebody to pick one. */

  /* ---------------------------------------------------------------------------
     Search — never the whole list.

     Both searches render nothing until somebody types. A dropdown that opens
     onto two hundred properties is not a chooser, it is a scroll, and the agent
     already knows which unit they mean — they just need to confirm they picked
     the right one, which is what the owner and the listing-type badge on each
     row are for.
     ------------------------------------------------------------------------ */

  const propertyResults = useMemo(() => {
    const q = propertyQuery.trim().toLowerCase();
    if (!q) return [];
    return properties
      /* Only properties listed the way this contract is written. A lease on a
         for-sale listing is refused by the data layer, so offering one here
         would let somebody build a record that cannot be saved. */
      .filter((p) => p.listing === kind)
      .filter((p) => {
        const project = projectNameOf(p) ?? "";
        return [p.id, p.title, p.unitNumber ?? "", project, p.district, p.city].join(" ").toLowerCase().includes(q);
      })
      .slice(0, SEARCH_LIMIT);
  }, [properties, propertyQuery, kind]);

  const memberResults = useMemo(() => {
    const q = partyQuery.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => m.id !== property?.ownerId)
      .filter((m) => [m.name, m.phone, m.email].join(" ").toLowerCase().includes(q))
      .slice(0, SEARCH_LIMIT);
  }, [members, partyQuery, property]);

  const selectedMember = useMemo(() => members.find((m) => m.id === buyerId), [members, buyerId]);
  /** Is there a buyer or tenant yet — by account, or by name typed in? */
  const counterpartyChosen = !!selectedMember;

  /* ------------------------------------------------------------------------ */

  const counterpartyLabel = lease ? t("admin.cn.f.tenant") : t("admin.cn.f.buyer");
  const ownerLabel = lease ? t("admin.cn.f.landlord") : t("admin.cn.f.seller");

  /**
   * A COMMISSION, WITH THE MONEY IN FRONT.
   *
   * It was a dropdown and nothing else until you chose "a fixed amount" — so
   * the screen told you the rule ("half a month's rent") and never the figure,
   * and the only way to see what the agency was actually charging was to look
   * at the summary panel. The amount is the answer to the question; the basis
   * is a note on how it was reached.
   *
   * TYPING IN THE AMOUNT SWITCHES THE BASIS TO FIXED, because that is what
   * typing a number over a calculated one means.
   *
   * Written as a function rather than a component: a component declared inside
   * a render is a new type on every keystroke, and React would remount the
   * input and drop the caret.
   */
  const commissionRow = (a: {
    id: string;
    basis: CommissionBasis;
    setBasis: (b: CommissionBasis) => void;
    value: string;
    setValue: (v: string) => void;
    amount: Money;
    label: string;
  }) => (
    /* ONE BOX. THE MONEY.
       The basis dropdown went first. It listed how the figure was reached — half
       a month, one month, a percentage — and once the figure itself is on screen
       and editable, that is a note about arithmetic rather than a question
       anybody needs to answer.

       THE RATE BOX WENT THE SAME WAY, for the same reason. It sat beside the
       money on a sale, and the two were one answer written twice: change the
       rate and the sum moved, type the sum and the rate stopped applying. Both
       sides of a sale start at the house standard now
       (DEFAULT_SALE_COMMISSION_RATE) and a tenancy at half a month's rent, so
       the rate is a constant the office sets rather than a term negotiated on
       each contract. What IS negotiated is the sum, and that is typed straight
       in — which makes it a fixed amount, because that is what typing a number
       over a calculated one means. */
    <MoneyField
      quote={quote}
      currency={currency}
      id={a.id}
      value={a.basis === "fixed" ? a.value : moneyToText(a.amount)}
      onChange={(v) => { a.setBasis("fixed"); a.setValue(v); }}
      parsed={a.amount}
    />
  );

  /* The chrome every step shares: what is missing (only after somebody has
     asked to move on), what the buttons will do, and the buttons. */
  /**
   * The chrome every step shares: what the buttons will do, and the buttons.
   *
   * NO LIST OF WHAT IS MISSING. There used to be a red panel above the footer
   * naming every gap, and it was the wrong place to say it: the fields are
   * right there on the same screen, so a list is an index to a page you are
   * already looking at. Each field says it for itself now — see `gapOn`.
   */
  const stepChrome = (buttons: React.ReactNode) => {
    return (
      <>
        {/* NO CONSEQUENCE BAR HERE. It used to sit above the footer on all four
            steps, which meant three of its four appearances described a button
            nobody was about to press. It lives on the review step now, directly
            over the signature — the one moment it is actually about. */}
        <div className="ap-foot">{buttons}</div>
      </>
    );
  };

  const draftButton = (
    <Button hierarchy="secondary" size="lg" iconLeading="save" onClick={() => save(false)} disabled={!canDraft}>
      {t("admin.ap.saveDraft")}
    </Button>
  );

  return (
    <div className="ap-wrap cn-wrap">
      <div className="cn-head">
        <nav className="ap-crumbs" aria-label={t("admin.common.breadcrumb")}>
          <Link href={basePath}>
            <Icon name="arrow-left" size={15} />
            {t("admin.ct.title")}
          </Link>
          <span className="ap-crumbs__sep" aria-hidden="true">
            <Icon name="chevron-right" size={14} />
          </span>
          <span className="ap-crumbs__current">{t(amending ? "admin.cn.amendTitle" : renewing ? "admin.cn.renewTitle" : lease ? "admin.cn.titleLease" : "admin.cn.titleSale")}</span>
        </nav>

        <div className="ap-title">
          <h1>{t(amending ? "admin.cn.amendTitle" : renewing ? "admin.cn.renewTitle" : lease ? "admin.cn.titleLease" : "admin.cn.titleSale")}</h1>
          <p>{t(lease ? "admin.cn.subLease" : "admin.cn.subSale")}</p>
        </div>

        {/* WHAT IS ABOUT TO HAPPEN TO THE OLD TENANCY, before anything is
            typed. A renewal looks exactly like a new contract on screen —
            every field is filled in — so without this nobody would know the
            document they are looking at is tied to another one, or that
            signing it retires that one. */}
        {renewing && existing && (
          <AmendBanner
            title={t("admin.cn.renew.bannerTitle", { id: localizeDigits(lang, existing.id) })}
            body={t("admin.cn.renew.bannerBody", {
              ends: existing.endsOn ? fmtDate(lang, fromIso(existing.endsOn)) : "—",
            })}
          />
        )}

        {amending && existing && (
          <AmendBanner
            title={t("admin.cn.amend.bannerTitle", { id: localizeDigits(lang, existing.id) })}
            body={t("admin.cn.amend.bannerBody")}
          />
        )}

        <ProgressStepper active={step} steps={STEP_KEYS} />
      </div>

      {/* TWO COLUMNS, AND THE SECOND ONE IS THE DOCUMENT.

          ⚠ THE SUMMARY PANEL IS NOT BACK. That one held every figure the form
          had just asked for, restated in a second column, which is exactly why
          it went: the term end belongs beside the dates, each commission
          beside its own field, and what signing will do on the review step
          where the decision is. All of that stays where it is.

          What is in the second column now is the CONTRACT — the page the two
          parties sign, the same sheet the printer prints, filling in as the
          questions are answered. It is not a restatement of the answers; it is
          the thing the answers are for, and the form has never shown it.

          A panel on a wide screen, a fold below the form on a narrow one. See
          .cn-split in cn.css. */}
      <div className="cn-split">
        <div className="cn-form">

          {/* ================= STEP 1 — property and parties ================= */}
          {step === 0 && (
            <section className="ap-card">
              <div className="ap-card__head">
                <h2 className="ap-card__title">{t("admin.cn.step.parties")}</h2>
                <p className="ap-card__desc">{t("admin.cn.partiesDesc")}</p>
              </div>
              <div className="ap-card__body">
                {/* BOTH GROUPS GET A HEADING. The card is called "Property and
                    parties" — it names two things, so a body with a heading on
                    one half and none on the other reads as two unrelated halves.
                    The duplicate is gone from the other end instead: the field
                    label under this heading used to say "Property" again, so the
                    heading does that job and the input carries an aria-label. */}
                <Section title={t("admin.cn.g.property")}>
                  <Row label="" htmlFor="cn-prop" error={gapOn("cn-prop")}>
                    {property ? (
                      <PickedProperty
                        img={property.img}
                        title={property.title}
                        meta={[
                          localizeDigits(lang, property.id),
                          property.unitNumber ? localizeDigits(lang, property.unitNumber) : "",
                          projectNameOf(property) ?? "",
                          property.district,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        badge={
                          <Badge variant={property.listing === "rent" ? "info" : "brand"} size="sm">
                            {t("admin.ct.kind." + property.listing)}
                          </Badge>
                        }
                        changeLabel={t("admin.cn.change")}
                        /* Locked when it arrived in the URL or on a saved draft —
                           the padlock says so instead of a missing button. */
                        onChange={
                          !lockedPropertyId && !existing
                            ? () => { setPropertyId(""); setPropertyQuery(""); }
                            : undefined
                        }
                      />
                    ) : (
                      <div className="cn-search">
                        <span className="cn-search__ic" aria-hidden="true">
                          <Icon name="search" size={17} />
                        </span>
                        <input
                          id="cn-prop"
                          className="cn-search__input"
                          aria-label={t("admin.ct.f.property")}
                          value={propertyQuery}
                          placeholder={t("admin.cn.propertySearchPh")}
                          onChange={(e) => setPropertyQuery(e.target.value)}
                        />
                        {propertyResults.length > 0 && (
                          <ul className="cn-results" role="listbox" aria-label={t("admin.cn.propertyResults")}>
                            {propertyResults.map((p) => {
                              const ownerName = members.find((m) => m.id === p.ownerId)?.name ?? p.owner.name;
                              return (
                                <li key={p.id}>
                                  <button type="button" className="cn-result" onClick={() => choosePropertyId(p)}>
                                    <span className="cn-result__main">
                                      <span className="cn-result__title">{p.title}</span>
                                      <span className="cn-result__meta">
                                        {localizeDigits(lang, p.id)}
                                        {p.unitNumber ? ` · ${localizeDigits(lang, p.unitNumber)}` : ""}
                                        {` · ${ownerName}`}
                                      </span>
                                    </span>
                                    <Badge variant={p.listing === "rent" ? "info" : "brand"} size="sm">
                                      {t("admin.ct.kind." + p.listing)}
                                    </Badge>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {propertyQuery.trim() && propertyResults.length === 0 && <p className="cn-empty">{t("admin.cn.noProperties")}</p>}
                      </div>
                    )}
                  </Row>

                  {/* Say why the property in the link was not taken. Silence here
                      would look like the parameter had simply been ignored. */}
                  {lockedMismatch && (
                    <p className="cn-row__error" role="alert">
                      <Icon name="alert-circle" size={14} />
                      {t(lease ? "admin.cn.err.notForRent" : "admin.cn.err.notForSale")}
                    </p>
                  )}

                  {/* Property creation is NOT embedded. A whole second wizard inside
                      this one would be two half-finished forms and one back button
                      between them. The link opens the wizard that already exists and
                      returns here with the property selected. */}
                  {!property && (!lockedPropertyId || lockedMismatch) && (
                    <p className="cn-aside">
                      {t("admin.cn.notListed")}{" "}
                      <Link className="cn-aside__link" href={`/admin/properties/new?contract=${kind}`}>
                        {t("admin.cn.addProperty")}
                      </Link>
                    </p>
                  )}
                </Section>

                {/* NOT GATED ON THE PROPERTY. Who is renting and which unit are
                    two independent questions, and hiding one behind the other
                    made the first screen a single search box that then reflowed
                    the moment you used it. The OWNER stays gated, because the
                    owner is not a question — it is an answer the property gives,
                    and an empty "Landlord" slot would be asking for something
                    nobody can supply yet. */}
                {/* Named by the actual people, and named per contract. "Who is
                    signing" was wrong twice over: the agent below is not signing,
                    and the landlord card says who the landlord IS, not who signs
                    for them — that is the override behind it. "Parties" would be
                    right but repeats the card title two lines up. */}
                <Section title={t(lease ? "admin.cn.g.partiesLease" : "admin.cn.g.partiesSale")}>
                  {/* ALWAYS RENDERED, even before there is a property to fill it.
                      The heading above promises a landlord; showing nothing until
                      a property is picked makes the heading a lie and the card
                      arrive from nowhere. A waiting slot says where the answer
                      comes from — which is also why this is not a search. An
                      owner has more than one property, so searching the owner
                      would still leave the unit to choose, and the unit is what
                      the contract is actually about. */}
                  <Row label={ownerLabel}>
                    {property ? (
                      <PickedParty
                        img={owner?.img}
                        name={owner?.name ?? property.owner.name}
                        phone={owner?.phone ?? property.owner.phone}
                        changeLabel={t("admin.cn.change")}
                        locked
                      />
                    ) : (
                      <p className="cn-pending">
                        <Icon name="corner-left-up" size={15} />
                        {t("admin.cn.ownerPending")}
                      </p>
                    )}
                      {property && !signerOpen && (
                        <button type="button" className="cn-inlinebtn" onClick={() => setSignerOpen(true)}>
                          <Icon name="user-plus" size={15} />
                          {t("admin.cn.signerOverride")}
                        </button>
                      )}
                  </Row>

                  {/* Removed, not disabled, when nobody is signing on the owner's
                      behalf — see the note in ./fields. */}
                  {property && signerOpen && (
                      <>
                        <Grid>
                          <Full>
                            <Row label={t("admin.cn.f.signerName")} htmlFor="cn-signer" error={gapOn("cn-signer")}>
                              <TextInput id="cn-signer" value={signerName} onChange={setSignerName} placeholder={t("admin.cn.ph.name")} />
                            </Row>
                          </Full>
                          <Row label={t("admin.cn.f.signerPhone")} htmlFor="cn-signerphone">
                            <TextInput id="cn-signerphone" value={signerPhone} onChange={setSignerPhone} placeholder={t("admin.cn.ph.phone")} />
                          </Row>
                          <Row label={t("admin.cn.f.signerId")} htmlFor="cn-signerid" optional={t("admin.fin.optional")}>
                            <TextInput id="cn-signerid" value={signerId} onChange={setSignerId} placeholder={t("admin.cn.ph.idNumber")} />
                          </Row>
                          <Full>
                            <Row
                              label={t("admin.cn.f.signerReason")}
                              hint={t("admin.cn.h.signerReason")}
                              htmlFor="cn-signerwhy"
                              error={gapOn("cn-signerwhy") ?? (signerName.trim() && !signerReason.trim() ? t("admin.cn.err.signerReason") : undefined)}
                            >
                              <TextInput id="cn-signerwhy" value={signerReason} onChange={setSignerReason} placeholder={t("admin.cn.ph.signerReason")} />
                            </Row>
                          </Full>
                        </Grid>
                        <p className="cn-aside">
                          <button type="button" className="cn-aside__link" onClick={() => { setSignerOpen(false); setSignerName(""); setSignerReason(""); }}>
                            {t("admin.cn.signerCancel")}
                          </button>
                        </p>
                      </>
                    )}

                  {/* NO CHOICE CARDS HERE. "Are they already in the system?" is a
                      mode switch, not a decision with consequences, and two big
                      described cards made the loudest thing on this screen the
                      least important question on it. Cards are for choices that
                      change what happens — "Our office" collecting the rent means
                      twelve invoices a year, and that earns its size.
                      This is the property picker's pattern instead, three rows up:
                      search first, with a quiet way out for the case it cannot
                      cover. */}

                  {/* The tenant they had chosen turned out to own the unit they
                      then picked. Cleared rather than silently kept: a contract
                      with the same person on both sides is not a contract. */}
                  {ownerClash && (
                    <p className="cn-row__error" role="alert">
                      <Icon name="alert-circle" size={14} />
                      {t("admin.cn.err.ownerIsParty")}
                    </p>
                  )}

                  <Row label={counterpartyLabel} htmlFor="cn-member" error={gapOn("cn-member")}>
                    {selectedMember ? (
                      <PickedParty
                        img={selectedMember.img}
                        name={selectedMember.name}
                        phone={selectedMember.phone}
                        changeLabel={t("admin.cn.change")}
                        onChange={() => { setBuyerId(""); setOwnerClash(false); }}
                      />
                    ) : (
                      <div className="cn-search">
                        <span className="cn-search__ic" aria-hidden="true">
                          <Icon name="search" size={17} />
                        </span>
                        <input
                          id="cn-member"
                          className="cn-search__input"
                          value={partyQuery}
                          placeholder={t("admin.cn.memberSearchPh")}
                          onChange={(e) => setPartyQuery(e.target.value)}
                        />
                        {memberResults.length > 0 && (
                          <ul className="cn-results" role="listbox" aria-label={t("admin.cn.memberResults")}>
                            {memberResults.map((m) => (
                              <li key={m.id}>
                                <button type="button" className="cn-result" onClick={() => { setBuyerId(m.id); setPartyQuery(""); setOwnerClash(false); }}>
                                  <span className="cn-result__main">
                                    <span className="cn-result__title">{m.name}</span>
                                    <span className="cn-result__meta">{m.phone}</span>
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </Row>
                  {/* ONE WAY OUT OF "THEY ARE NOT IN THE LIST", because there
                      is only one truth. This used to offer a second — type a
                      name and a phone number straight onto the contract — and
                      that person then existed nowhere else in the system: no
                      language, no consent, no ID, no profile, no history. The
                      rent reminders this contract raises went out in the
                      agency's default language and nobody could mute them,
                      because there was nothing to mute.

                      It survived as long as it did because adding a member was
                      genuinely slower — that form demanded an email address.
                      It does not any more, so both doors cost a name and a
                      number and there is no reason for two. See canSubmit in
                      _members/add-member-modal. */}
                  {!selectedMember && (
                    <p className="cn-aside">
                      {t("admin.cn.notRegistered")}{" "}
                      <button type="button" className="cn-aside__link" onClick={() => setAddMemberOpen(true)}>
                        {t("admin.cn.addMember")}
                      </button>
                    </p>
                  )}

                  {/* ONLY ONCE SOMEBODY IS CHOSEN. "Someone else is signing for
                      the tenant" is meaningless before there is a tenant, and an
                      empty proxy block above an empty party field would be two
                      unanswered questions where there is one. */}
                  {counterpartyChosen && !bSignerOpen && (
                    <button type="button" className="cn-inlinebtn" onClick={() => setBSignerOpen(true)}>
                      <Icon name="user-plus" size={15} />
                      {t("admin.cn.signerOverride")}
                    </button>
                  )}

                  {counterpartyChosen && bSignerOpen && (
                    <Grid>
                      <Full>
                        <Row label={t("admin.cn.f.signerName")} htmlFor="cn-bsigner" error={gapOn("cn-bsigner")}>
                          <TextInput id="cn-bsigner" value={bSignerName} onChange={setBSignerName} placeholder={t("admin.cn.ph.name")} />
                        </Row>
                      </Full>
                      <Row label={t("admin.cn.f.signerPhone")} htmlFor="cn-bsignerphone">
                        <TextInput id="cn-bsignerphone" value={bSignerPhone} onChange={setBSignerPhone} placeholder={t("admin.cn.ph.phone")} />
                      </Row>
                      <Row label={t("admin.cn.f.signerId")} htmlFor="cn-bsignerid" optional={t("admin.fin.optional")}>
                        <TextInput id="cn-bsignerid" value={bSignerId} onChange={setBSignerId} placeholder={t("admin.cn.ph.idNumber")} />
                      </Row>
                      <Full>
                        <Row
                          label={t("admin.cn.f.signerReason")}
                          hint={t("admin.cn.h.signerReason")}
                          htmlFor="cn-bsignerwhy"
                          error={gapOn("cn-bsignerwhy") ?? (bSignerName.trim() && !bSignerReason.trim() ? t("admin.cn.err.signerReason") : undefined)}
                        >
                          <TextInput id="cn-bsignerwhy" value={bSignerReason} onChange={setBSignerReason} placeholder={t("admin.cn.ph.signerReason")} />
                        </Row>
                      </Full>
                      <Full>
                        <p className="cn-aside">
                          <button type="button" className="cn-aside__link" onClick={() => { setBSignerOpen(false); setBSignerName(""); setBSignerReason(""); }}>
                            {t(lease ? "admin.cn.signerCancelTenant" : "admin.cn.signerCancelBuyer")}
                          </button>
                        </p>
                      </Full>
                    </Grid>
                  )}

                    {property && !propertyAgentId && (
                      <Row label={t("admin.ct.f.agent")} htmlFor="cn-agent" error={gapOn("cn-agent")}>
                        <SelectInput
                          id="cn-agent"
                          value={agentId}
                          onChange={setAgentId}
                          options={[{ value: "", label: t("admin.cn.selectAgent") }, ...agents.filter((a) => a.verification === "Verified").map((a) => ({ value: a.id, label: a.name }))]}
                        />
                      </Row>
                    )}
                </Section>
              </div>

              {stepChrome(
                <>
                  <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" href={basePath}>
                    {t("admin.common.cancel")}
                  </Button>
                  <div className="ap-foot__right">
                    {draftButton}
                    <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => tryAdvance(1)}>
                      {t("admin.ap.nextBtn")}
                    </Button>
                  </div>
                </>,
              )}
            </section>
          )}

          {/* ================= STEP 2 — money and term ================= */}
          {step === 1 && (
            <section className="ap-card">
              <div className="ap-card__head">
                <h2 className="ap-card__title">{t("admin.cn.step.money")}</h2>
                <p className="ap-card__desc">{t(lease ? "admin.cn.moneyDescLease" : "admin.cn.moneyDescSale")}</p>
              </div>
              <div className="ap-card__body">
                {/* EVERY DATE ON THE CONTRACT, IN THE ORDER THEY ARE AGREED.

                    Not the order a database would list them. At the desk the
                    term is negotiated first — "from the first of August, for a
                    year" — and the end date falls out of that, which is why it
                    is shown rather than asked. The signing date and the handover
                    come after, because they are arrangements about the paper and
                    the keys rather than about the deal.

                    They also check each other: a term starting before the
                    signature is a typo you can only catch with all four in one
                    place, which they were not until now. */}
                <Section title={t("admin.cn.g.dates")}>
                  {/* THREE COLUMNS ON A LEASE, because the dates line holds
                      three boxes — starts on, runs for, ends on — and they are
                      one sentence read left to right. Sized alike so they read
                      that way; see .cn-grid--3. A sale has no term, so it opens
                      straight on the signature line below. */}
                  {lease && (
                    <Grid cols={3}>
                      <Wide>
                        <Row label={t("admin.cn.f.term")} htmlFor="cn-starts" error={gapOn("cn-starts")}>
                          <Pair equal>
                            <DateInput id="cn-starts" value={startsOn} onChange={setStartsOn} />
                            <NumberInput value={termText} onChange={setTermText} min={1} max={240} suffix={t("admin.cn.months")} />
                          </Pair>
                        </Row>
                      </Wide>
                      {/* Worked out, never typed — see ReadOut. */}
                      <ReadOut label={t("admin.ct.f.endsOn")} value={endsOn ? fmtDate(lang, fromIso(endsOn)) : undefined} />
                    </Grid>
                  )}

                  {/* WHEN IT IS SIGNED AND WHERE, ON ONE LINE. "Signed in" spent
                      its life four groups down with the copies and the organiser,
                      which split one fact about one signature across the top and
                      the bottom of the step. Its own grid rather than the term's:
                      in three columns the pair would sit under a two-column box
                      and leave a hole where the end date is. */}
                  <Grid>
                    <Row label={t("admin.ct.f.signedOn")} hint={t("admin.cn.h.signingDate")} htmlFor="cn-signed" error={gapOn("cn-signed")}>
                      <DateInput id="cn-signed" value={signingDate} onChange={setSigningDate} />
                    </Row>
                    {/* A HINT ON BOTH SIDES OR ON NEITHER. The grid aligns the
                        tops of its cells (see .cn-grid), so a hint under one
                        label and not the other drops that control a line lower
                        than the one beside it. This one earns its place anyway:
                        the value arrives from the property, and the paper is not
                        always signed in the city the property stands in. */}
                    <Row label={t("admin.cn.f.city")} hint={t("admin.cn.h.city")} htmlFor="cn-city" error={gapOn("cn-city")}>
                      <TextInput id="cn-city" value={signedCity} onChange={setCity} placeholder={t("admin.cn.ph.city")} />
                    </Row>
                  </Grid>
                </Section>

                {lease ? (
                  <>
                    {/* WHAT THE TENANT PAYS, AND NOTHING ELSE.
                        This group used to be followed by a "Commission and
                        collection" one holding three unrelated answers at once —
                        who the rent is paid to, what we keep for collecting it,
                        and what each side owes us at signing. The commissions are
                        charges and sit with the other charges below; the
                        collection arrangement is an arrangement and closes the
                        step. */}
                    <Section title={t("admin.cn.g.rent")}>
                      {/* Every figure these rows used to derive under themselves —
                          the per-cycle invoice, the end date, the split — is in the
                          summary panel beside the form now. See ./summary. */}
                      <Grid>
                        <Row label={t("admin.cn.f.monthlyRent")} htmlFor="cn-rent" error={gapOn("cn-rent")}>
                          <MoneyField quote={quote} error={!!gapOn("cn-rent")} id="cn-rent" value={rentText} onChange={setRentText} currency={currency} parsed={monthlyRent} autoFocus />
                        </Row>

                        <Row label={t("admin.cn.f.paidEvery")} htmlFor="cn-cycle">
                          <SelectInput
                            id="cn-cycle"
                            value={cycle}
                            onChange={setCycle}
                            options={CYCLE_CHOICES.map((c) => ({ value: c, label: t("admin.cn.cycle." + c, { months: fmtNum(lang, CYCLE_MONTHS[c]) }) }))}
                          />
                        </Row>

                        <Row label={t("admin.cn.f.deposit")} hint={t("admin.cn.h.deposit")} htmlFor="cn-deposit" optional={t("admin.fin.optional")}>
                          <MoneyField
                            quote={quote} id="cn-deposit"
                            value={depositText}
                            onChange={setDepositText}
                            currency={currency}
                            parsed={insuranceDeposit}
                            quickFill={monthlyRent ? { label: t("admin.cn.sameAsMonth"), onFill: () => setDepositText(moneyToText(monthlyRent)) } : undefined}
                          />
                        </Row>
                      </Grid>
                    </Section>
                  </>
                ) : (
                  <>
                    <Section title={t("admin.cn.g.price")}>
                      <Row label={t("admin.ct.f.price")} htmlFor="cn-price" error={gapOn("cn-price")}>
                        <MoneyField quote={quote} error={!!gapOn("cn-price")} id="cn-price" value={priceText} onChange={setPriceText} currency={currency} parsed={salePrice} autoFocus />
                      </Row>

                      {/* THE HOLDING DEPOSIT — money down to take the property off
                          the market. Nothing like a tenancy deposit: this is part
                          of the price and it is the seller's the moment it is paid,
                          which is why it sits here beside the price rather than
                          with the tenancy terms. The record has carried it since
                          the seed and the detail screen has always shown it; this
                          is the first form that can set one. */}
                      <Row label={t("admin.cn.f.deposit.sale")} hint={t("admin.cn.h.saleDeposit")} htmlFor="cn-saledep" optional={t("admin.fin.optional")}>
                        <MoneyField quote={quote} id="cn-saledep" value={saleDepositText} onChange={setSaleDepositText} currency={currency} parsed={saleDeposit} />
                      </Row>

                      {/* MONEY DOWN ON THE DAY, ON EITHER KIND OF SALE. It lived
                          in the schedule group below and so could only be stated
                          on an instalment sale, which said a buyer paying in full
                          never puts anything down on signing day. They routinely
                          do — the balance simply falls due at completion instead
                          of over a schedule. Asked above the choice because it is
                          a fact about the deal; the choice underneath is about
                          what is left after it. */}
                      <Row label={t("admin.cn.f.downPayment")} hint={t("admin.cn.h.downPayment")} htmlFor="cn-down" optional={t("admin.fin.optional")}>
                        <MoneyField quote={quote} id="cn-down" value={downText} onChange={setDownText} currency={currency} parsed={downPayment} />
                      </Row>

                      <Row label={t("admin.cn.f.howPaid")}>
                        <ChoiceCards value={salePayment} options={salePaymentChoices} onChange={setSalePayment} name={t("admin.cn.f.howPaid")} />
                      </Row>
                    </Section>

                    {template === "sale_installments" && (
                      <Section title={t("admin.cn.g.schedule")}>
                        {/* THREE BOXES, ONE SENTENCE — "twelve payments, every
                            month, four thousand each". Two are asked and the
                            third is worked out, which is the tenancy's dates
                            line exactly (start, term, end) and the rule the
                            whole form follows: a figure lives in the row that
                            produces it. Sized alike so the line reads as one
                            answer rather than three unrelated fields, which is
                            why neither control states a width here.

                            The hint belongs to the count because it is the one
                            sentence explaining the section: the schedule spreads
                            what is LEFT after the down payment, never the
                            price. */}
                        <Grid cols={3}>
                          <Row label={t("admin.cn.f.instCount")} hint={t("admin.cn.h.instCount")} htmlFor="cn-count" error={gapOn("cn-count")}>
                            <NumberInput id="cn-count" value={instCount} onChange={setInstCount} min={1} max={360} suffix={t("admin.cn.payments")} />
                          </Row>
                          <Row label={t("admin.cn.f.instFreq")} htmlFor="cn-freq">
                            <SelectInput
                              id="cn-freq"
                              value={instFreq}
                              onChange={setInstFreq}
                              options={(["monthly", "quarterly", "biannual"] as InstallmentFrequency[]).map((f) => ({
                                value: f,
                                label: t("admin.cn.freq." + f, { months: fmtNum(lang, INSTALLMENT_MONTHS[f]) }),
                              }))}
                            />
                          </Row>
                          {/* Worked out, never typed — see ReadOut and instAmounts. */}
                          <ReadOut
                            label={t("admin.cn.f.eachInstallment")}
                            value={instAmounts.length ? formatMoney(lang, instAmounts[0]) : undefined}
                          />
                        </Grid>

                        {/* A date, but not a CONTRACT date — it only means
                            anything beside the count and the rhythm, and it
                            appears only once instalments are chosen, which is a
                            choice made in this section. Above in Dates it would
                            sit over the answer that summons it.

                            Below the line above rather than in it: it is what
                            the dated list underneath steps forward from, so it
                            sits directly over the thing it builds. */}
                        <Row label={t("admin.cn.f.firstDue")} hint={t("admin.cn.h.firstDue")} htmlFor="cn-first" error={gapOn("cn-first")}>
                          <DateInput id="cn-first" value={firstInstOn} onChange={setFirstInstOn} />
                        </Row>

                        {schedule.length > 0 && (
                          <div className="cn-schedule">
                            {/* THE TWO FACTS THE READ-OUT ABOVE CANNOT CARRY: the
                                balance this list clears, and the odd last
                                payment rounding leaves behind. It used to say
                                "12 × $4,166.67" as well, which is now the
                                figure beside the count — and a number read in
                                two places is the summary panel's mistake
                                repeated at close range. */}
                            <p className="cn-schedule__summary">
                              {t("admin.cn.d.installmentSummary", {
                                total: financedBalance ? formatMoney(lang, financedBalance) : "",
                                last: formatMoney(lang, schedule[schedule.length - 1].amount),
                              })}
                            </p>
                            <button type="button" className="cn-schedule__toggle" onClick={() => setShowAllInstallments((v) => !v)}>
                              {t(showAllInstallments ? "admin.cn.hideAll" : "admin.cn.seeAll")}
                              <Icon name={showAllInstallments ? "chevron-up" : "chevron-down"} size={15} />
                            </button>
                            {showAllInstallments && (
                              <ol className="cn-schedule__list">
                                {schedule.map((line) => (
                                  <li key={line.index} className="cn-schedule__row">
                                    <span className="cn-schedule__n">{fmtNum(lang, line.index)}</span>
                                    <span className="cn-schedule__date">{fmtDate(lang, fromIso(line.dueOn))}</span>
                                    <span className="cn-schedule__amt cx-tnum">{formatMoney(lang, line.amount)}</span>
                                    <span className="cn-schedule__bal cx-tnum">{formatMoney(lang, line.balanceAfter)}</span>
                                  </li>
                                ))}
                              </ol>
                            )}
                          </div>
                        )}

                        <Row label={t("admin.cn.f.instPaidTo")}>
                          <ChoiceCards value={instPaidTo} options={instPaidToChoices} onChange={setInstPaidTo} name={t("admin.cn.f.instPaidTo")} />
                        </Row>
                      </Section>
                    )}
                  </>
                )}

                {/* NO CURRENCY QUESTION AT ALL.

                    There used to be a tickbox here asking whether the parties
                    had agreed the other currency could be paid too, and a rate
                    field behind it. Both are gone, because neither is a decision
                    somebody writing a contract should be asked to make:

                    · WHAT THE CONTRACT IS PRICED IN is the property’s currency.
                      That was never a choice on this screen and still is not.
                    · WHAT SOMEBODY TYPES IN is a convenience, and the money
                      field already handles it — type dollars or dinars, it
                      converts and shows what the contract will state.
                    · WHETHER A SECOND FIGURE PRINTS on the paper is a property of
                      the DOCUMENT, not of the deal being agreed here.

                    A contract that needs a frozen rate still gets one: it is
                    filled from settings on save, exactly as it was before this
                    screen ever offered to ask. See `agreedRateFor`. */}

                {/* ONE GROUP FOR EVERY CHARGE ON TOP OF THE RENT OR THE PRICE.

                    The commissions and the penalties were two stops on the step
                    with the collection arrangement wedged between them, and they
                    are the same kind of answer: a sum the office may bill that is
                    not the rent and not the price. The commission is charged once
                    at signing; the penalties are charged only if something goes
                    wrong, which is what each penalty's own hint says.

                    NO SECOND HEADING INSIDE IT. There was a labelled rule here —
                    "If either side breaks the agreement" — splitting the group in
                    two. It made one topic look like two, gave the same kind of
                    question two different rhythms, and pushed the last three
                    fields most of a screen further down to say something the
                    hints under them were already saying. The group's own title
                    covers both halves.

                    PENALTIES LIVE WITH THE MONEY. Every one of them is a sum — a
                    charge per late day, a figure for pulling out, a daily rate for
                    not vacating — so putting them on the signing step split the
                    money across two screens and left the last step holding one
                    topic and a wall of amounts it had nothing to do with. */}
                <Section title={t("admin.cn.g.commissionPenalties")}>
                  {/* ONE GRID FOR THE WHOLE GROUP, so every field on it lands on
                      the same two columns: the commissions on the first line, the
                      two charges on the second, the notice period alone on the
                      third. It was two grids with a rule between them, and the one
                      full-width field in the lower half made an optional charge
                      the widest box on the step.

                      BOTH SIDES ON ONE ROW. They were two sections, each holding a
                      single field labelled "Worked out as" — identical twins one
                      above the other, and the only thing telling them apart was a
                      heading you had already scrolled past. Side by side, with the
                      party as the label, the difference is the point. */}
                  <Grid>
                    {lease ? (
                      <>
                        <Row label={t("admin.cn.f.landlordFee")} hint={t("admin.cn.h.landlordFee")} htmlFor="cn-obasis">
                          {commissionRow({
                            id: "cn-obasis",
                            basis: ownerBasis,
                            setBasis: setOwnerBasis,
                            value: ownerValue,
                            setValue: setOwnerValue,
                            amount: ownerFee,
                            label: t("admin.cn.f.landlordFee"),
                          })}
                        </Row>
                        <Row label={t("admin.cn.f.tenantFee")} hint={t("admin.cn.h.tenantFee")} htmlFor="cn-tbasis">
                          {commissionRow({
                            id: "cn-tbasis",
                            basis: tenantBasis,
                            setBasis: setTenantBasis,
                            value: tenantValue,
                            setValue: setTenantValue,
                            amount: tenantFee,
                            label: t("admin.cn.f.tenantFee"),
                          })}
                        </Row>

                        {/* LATE RENT — A DAY OF THE RENT, IN THE BOX, EDITABLE.
                            One money field: the basis dropdown beside it asked
                            whether the empty number meant currency or percent, and
                            both answers described the same charge. See `dailyLate`.
                            Calculated and offered on an overdue invoice, never
                            charged automatically — the hint says so, because the
                            field name alone reads like an auto-charge.

                            ONE COLUMN, LIKE EVERY OTHER CHARGE HERE. It used to
                            take the full width, which made the widest field on the
                            group the one optional charge on it. */}
                        <Row label={t("admin.cn.f.lateRent")} hint={t("admin.cn.h.lateRent")} htmlFor="cn-late" optional={t("admin.fin.optional")}>
                          <MoneyField
                            quote={quote}
                            currency={currency}
                            id="cn-late"
                            value={lateText}
                            onChange={(v) => setClause("lateRentPenalty", v)}
                            parsed={toMoney(lateText)}
                          />
                        </Row>

                        {/* PULLING OUT. Clause text only: nothing in the system
                            ever raises an invoice for it. Beside the late day
                            because they are the same question asked twice — what
                            it costs to break this — and the two answers are read
                            against each other. */}
                        <Row label={t("admin.cn.f.regret")} hint={t("admin.cn.h.regret")} htmlFor="cn-regret" optional={t("admin.fin.optional")}>
                          <MoneyField quote={quote} currency={currency} id="cn-regret" value={String(clauses.regretPenalty ?? "")} onChange={(v) => setClause("regretPenalty", v)} parsed={toMoney(String(clauses.regretPenalty ?? ""))} />
                        </Row>

                        {/* NOT VACATING IS NO LONGER ASKED. It was a date and a
                            daily charge for staying on past the end — and the date
                            is the term end, which the form already works out three
                            groups up, so the row asked for an answer it had and
                            invited somebody to type one that contradicted it. The
                            CLAUSE is untouched: `vacateByDate` is still written on
                            the record from the derived end date (see the draft),
                            and a contract that already carries a daily charge keeps
                            it through a reopened draft or an amendment. */}

                        {/* A LENGTH OF TIME, NOT A SUM — so it starts its own line
                            under the two charges rather than pairing with one of
                            them, and it stays one column wide. */}
                        <Row label={t("admin.cn.f.noticeDays")} hint={t("admin.cn.h.noticeDays")} htmlFor="cn-notice">
                          <NumberInput id="cn-notice" value={clauses.noticeDays ?? ""} onChange={(v) => setClause("noticeDays", v)} min={0} max={365} width="sm" suffix={t("admin.cn.days")} />
                        </Row>
                      </>
                    ) : (
                      <>
                        <Row label={t("admin.cn.f.sellerFee")} hint={t("admin.cn.h.sellerFee")} htmlFor="cn-obasis">
                          {commissionRow({
                            id: "cn-obasis",
                            basis: ownerBasis,
                            setBasis: setOwnerBasis,
                            value: ownerValue,
                            setValue: setOwnerValue,
                            amount: ownerFee,
                            label: t("admin.cn.f.sellerFee"),
                          })}
                        </Row>

                        {/* THE BUYER PAYS TOO. Beside the seller's and worked the
                            same way, because it is the same question asked of the
                            other party — and reading the two together is how
                            anybody checks what the office earns on the deal. Same
                            standard rate on both sides, and each typed over on
                            its own when the parties agreed something else. */}
                        <Row label={t("admin.cn.f.buyerFee")} hint={t("admin.cn.h.buyerFee")} htmlFor="cn-tbasis">
                          {commissionRow({
                            id: "cn-tbasis",
                            basis: tenantBasis,
                            setBasis: setTenantBasis,
                            value: tenantValue,
                            setValue: setTenantValue,
                            amount: tenantFee,
                            label: t("admin.cn.f.buyerFee"),
                          })}
                        </Row>

                        {/* "WHY THE RATE DIFFERS" IS NO LONGER ASKED.
                            It appeared whenever the seller's rate was not the
                            mandate on the listing, and it had exactly one way in:
                            the rate box beside the money. With that box gone the
                            rate is a house constant, the mandate is what a seller
                            agreed to at listing rather than what this contract
                            charges, and the row could only ever have fired on
                            every sale at once or never.

                            THE FIELD IS STILL CARRIED. `commissionOverrideReason`
                            rides through from an existing contract, exactly as
                            the handover date and the payment method do, so
                            reopening a draft or amending a signed sale keeps the
                            reason it was written with instead of dropping it —
                            and the audit line that reads it (see
                            logCommissionOverride) still has something to say. */}

                        {/* The two sums a sale can be broken for, side by side —
                            same reason the tenancy pairs its two. */}
                        <Row label={t("admin.cn.f.breach")} hint={t("admin.cn.h.breach")} htmlFor="cn-breach" optional={t("admin.fin.optional")}>
                          <MoneyField quote={quote} currency={currency} id="cn-breach" value={String(clauses.breachPenalty ?? "")} onChange={(v) => setClause("breachPenalty", v)} parsed={toMoney(String(clauses.breachPenalty ?? ""))} />
                        </Row>
                        <Row label={t("admin.cn.f.registration")} hint={t("admin.cn.h.registration")} htmlFor="cn-reg" optional={t("admin.fin.optional")}>
                          <MoneyField quote={quote} currency={currency} id="cn-reg" value={String(clauses.registrationDeposit ?? "")} onChange={(v) => setClause("registrationDeposit", v)} parsed={toMoney(String(clauses.registrationDeposit ?? ""))} />
                        </Row>

                        {/* NOT HANDING OVER IS NO LONGER ASKED — the sale's twin
                            of the tenancy row above, and gone for the same
                            reason. It was a date and a daily charge for missing
                            it, and the date is the handover day, which the form
                            works out from the handover or the signing date (see
                            mustBeOutBy). The row pre-filled that answer and then
                            invited somebody to type one contradicting it. The
                            CLAUSE is untouched: `evacuationDate` is still written
                            on the record from the derived date (see the draft),
                            and a sale that already carries a daily charge keeps
                            it through a reopened draft or an amendment. */}
                      </>
                    )}
                  </Grid>
                </Section>

                {/* WHAT THE PAPER ITSELF SAYS — how many originals exist, who
                    arranged it, and anything else worth writing down. Facts about
                    the document rather than about the deal. WHERE it was signed
                    is no longer one of them: it is half of the signature line and
                    it sits with the other half, at the top of the step. */}
                <Section title={t("admin.cn.g.paperwork")}>
                  <Grid>
                    <Row label={t("admin.cn.f.copies")} htmlFor="cn-copies">
                      <NumberInput id="cn-copies" value={copies} onChange={setCopies} min={1} max={9} width="sm" suffix={t("admin.cn.copiesUnit")} />
                    </Row>
                    <Full>
                      <Row label={t("admin.cn.f.organizer")} htmlFor="cn-org">
                        <SelectInput
                          id="cn-org"
                          value={organizerId}
                          onChange={setOrganizerId}
                          options={[{ value: "", label: t("admin.cn.selectOrganizer") }, ...settings.team.staff.map((s) => ({ value: s.id, label: s.name }))]}
                        />
                      </Row>
                    </Full>

                    <Full>
                      <Row label={t("admin.cn.f.notes")} htmlFor="cn-notes" optional={t("admin.fin.optional")}>
                        <TextArea id="cn-notes" value={notes} onChange={setNotes} placeholder={t("admin.cn.ph.notes")} />
                      </Row>
                    </Full>
                  </Grid>
                </Section>

                {/* LAST, BECAUSE IT IS ABOUT AFTERWARDS.
                    Everything above is what the contract SAYS — the term, the
                    rent, what is charged and what the paper looks like. This is
                    what the office DOES once it is signed: take the rent in and
                    pass it on, or leave the landlord to collect it himself. It
                    sat in the middle of the money, above the commissions, where
                    it read as one more figure in the deal instead of the standing
                    arrangement it is. */}
                {lease && (
                  <Section title={t("admin.cn.g.collection")}>
                    <Row label={t("admin.cn.f.rentPaidTo")}>
                      <ChoiceCards value={rentPaidTo} options={rentPaidToChoices} onChange={setRentPaidTo} name={t("admin.cn.f.rentPaidTo")} />
                    </Row>

                    {/* The fee appears only when the agency collects. Removed,
                        not disabled — there is nothing to fill in when the
                        landlord takes the rent himself. */}
                    {rentPaidTo === "agency" && (
                      <Row label={t("admin.ct.f.managementFee")} hint={t("admin.cn.h.managementFee")} htmlFor="cn-fee">
                        <Pair lead="auto">
                          <SelectInput
                            value={feeType}
                            onChange={setFeeType}
                            ariaLabel={t("admin.ct.f.managementFee")}
                            options={[
                              { value: "percent", label: t("admin.cn.fee.percent") },
                              { value: "fixed", label: t("admin.cn.fee.fixed") },
                            ]}
                          />
                          {feeType === "percent" ? (
                            <NumberInput id="cn-fee" value={feeText} onChange={setFeeText} width="sm" decimal suffix="%" />
                          ) : (
                            <MoneyField quote={quote} currency={currency} id="cn-fee" value={feeText} onChange={setFeeText} parsed={toMoney(feeText)} />
                          )}
                        </Pair>
                      </Row>
                    )}
                  </Section>
                )}

                {amending && (
                  <Section title={t("admin.cn.g.amendment")}>
                    <Row
                      label={t("admin.cn.f.amendReason")}
                      hint={t("admin.cn.h.amendReason")}
                      htmlFor="cn-amendwhy"
                      error={blocked ?? gapOn("cn-amendwhy")}
                    >
                      <TextInput id="cn-amendwhy" value={amendReason} onChange={setAmendReason} placeholder={t("admin.cn.ph.amendReason")} />
                    </Row>
                  </Section>
                )}
              </div>

              {stepChrome(
                <>
                  <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(0)}>
                    {t("admin.ap.prev")}
                  </Button>
                  <div className="ap-foot__right">
                    {draftButton}
                    <Button hierarchy="primary" size="lg" iconTrailing="arrow-right" onClick={() => tryAdvance(REVIEW)}>
                      {t("admin.ap.nextBtn")}
                    </Button>
                  </div>
                </>,
              )}
            </section>
          )}

          {/* ================= STEP 3 — penalties and signing ================= */}

          {/* ================= STEP 4 — review ================= */}
          {/* The last thing between a half-read form and a signature that raises
              invoices, freezes a rate and takes the property off the market. Built
              from the add-property wizard's own ReviewSection / RevItem so the two
              workflows end the same way — and every group's Edit goes back to the
              step that owns it rather than to the top of the form. */}
          {step === REVIEW && (
            <section className="ap-card">
              <div className="ap-card__head">
                <h2 className="ap-card__title">{t("admin.cn.step.review")}</h2>
                <p className="ap-card__desc">{t("admin.cn.reviewDesc")}</p>
              </div>
              <div className="ap-card__body">
                <ReviewSection icon="home" title={t("admin.cn.g.property")} onEdit={() => goTo(0)}>
                  <div className="ap-rev__grid">
                    <RevItem k={t("admin.ct.f.property")} v={property?.title} full />
                    <RevItem k={ownerLabel} v={owner?.name ?? property?.owner.name} />
                    <RevItem k={counterpartyLabel} v={selectedMember?.name} />
                    {/* Named by the side they signed for, so two proxies on one
                        contract do not read as the same person twice. */}
                    {signerOpen && signerName.trim() && (
                      <RevItem k={t("admin.cn.rev.signedFor", { party: ownerLabel })} v={signerName.trim()} />
                    )}
                    {bSignerOpen && bSignerName.trim() && (
                      <RevItem k={t("admin.cn.rev.signedFor", { party: counterpartyLabel })} v={bSignerName.trim()} />
                    )}
                    <RevItem k={t("admin.ct.f.agent")} v={agents.find((a) => a.id === effectiveAgentId)?.name} />
                  </div>
                </ReviewSection>

                <ReviewSection icon="banknote" title={t("admin.cn.g.money")} onEdit={() => goTo(1)}>
                  <div className="ap-rev__grid">
                    {lease ? (
                      <>
                        <RevItem k={t("admin.cn.f.monthlyRent")} v={monthlyRent ? formatMoney(lang, monthlyRent) : undefined} price tnum />
                        <RevItem k={t("admin.cn.f.paidEvery")} v={t("admin.cn.cycleShort." + cycle)} />
                        <RevItem k={t("admin.cn.sum.starts")} v={startsOn ? fmtDate(lang, fromIso(startsOn)) : undefined} tnum />
                        <RevItem k={t("admin.ct.f.endsOn")} v={endsOn ? fmtDate(lang, fromIso(endsOn)) : undefined} tnum />
                        <RevItem k={t("admin.cn.f.deposit")} v={insuranceDeposit && !isZero(insuranceDeposit) ? formatMoney(lang, insuranceDeposit) : undefined} tnum />
                        <RevItem k={t("admin.cn.f.rentPaidTo")} v={t("admin.cn.collect." + (rentPaidTo === "agency" ? "agency" : "landlord"))} />
                      </>
                    ) : (
                      <>
                        <RevItem k={t("admin.ct.f.price")} v={salePrice ? formatMoney(lang, salePrice) : undefined} price tnum />
                        <RevItem k={t("admin.cn.f.howPaid")} v={t("admin.cn.pay." + (template === "sale_installments" ? "installments" : "full"))} />
                        <RevItem k={t("admin.cn.f.deposit.sale")} v={saleDeposit && !isZero(saleDeposit) ? formatMoney(lang, saleDeposit) : undefined} tnum />
                        {/* Only when there is one. On a full-payment sale a down
                            payment is the exception rather than a blank waiting
                            to be filled, and an empty line here would read as a
                            gap rather than as "none was taken". */}
                        {downPayment && !isZero(downPayment) && (
                          <RevItem k={t("admin.cn.f.downPayment")} v={formatMoney(lang, downPayment)} tnum />
                        )}
                        {template === "sale_installments" && (
                          <RevItem
                            k={t("admin.cn.g.schedule")}
                            v={schedule.length ? t("admin.cn.sum.payments", { count: fmtNum(lang, schedule.length) }) : undefined}
                            tnum
                          />
                        )}
                      </>
                    )}
                    <RevItem k={t(lease ? "admin.cn.f.landlordFee" : "admin.cn.f.sellerFee")} v={formatMoney(lang, ownerFee)} tnum />
                    {/* Both sides on both kinds. Hidden when the contract waives
                        this one — an old sale being amended states no buyer's
                        fee, and a line reading "—" would look like a gap rather
                        than the term it is. */}
                    {tenantBasis !== "none" && (
                      <RevItem k={t(lease ? "admin.cn.f.tenantFee" : "admin.cn.f.buyerFee")} v={formatMoney(lang, tenantFee)} tnum />
                    )}
                    {/* Only on a contract that actually carries a frozen rate —
                        an amended one, or a draft written before all listings
                        moved to dollars. Shown as the familiar quote, never the
                        reciprocal the record stores. */}
                    {agreedRateOnRecord && (
                      <RevItem
                        k={t("admin.cn.f.agreedRate")}
                        v={agreedRateOnRecord ? t("admin.cn.rateValue", { base: PLATFORM_CURRENCY, quote: quoteCurrency, rate: localizeDigits(lang, String(quote)) }) : undefined}
                        tnum
                      />
                    )}
                    {dualCurrency && <RevItem k={t("admin.cn.sum.settledIn")} v={secondaryCurrency} />}
                  </div>
                </ReviewSection>

                <ReviewSection icon="file-signature" title={t("admin.cn.g.paperwork")} onEdit={() => goTo(1)}>
                  <div className="ap-rev__grid">
                    <RevItem k={t("admin.ct.f.signedOn")} v={signingDate ? fmtDate(lang, fromIso(signingDate)) : undefined} tnum />
                    <RevItem k={t("admin.cn.f.city")} v={city || property?.city} />
                    <RevItem k={t("admin.cn.f.copies")} v={copies ? localizeDigits(lang, copies) : undefined} tnum />
                    <RevItem k={t("admin.cn.f.organizer")} v={settings.team.staff.find((s) => s.id === organizerId)?.name} />
                    {externalPaperwork && <RevItem k={t("admin.cn.f.paperwork")} v={t("admin.cn.rev.paperExternal")} />}
                    {notes.trim() && <RevItem k={t("admin.cn.f.notes")} v={notes.trim()} full />}
                  </div>
                </ReviewSection>

                {/* WHAT SIGNING WILL DO — the same plannedInvoices list the
                    signature actually issues, so this cannot promise one thing and
                    the button do another. Not editable: it is a consequence, not a
                    field, and the way to change it is to change the terms above. */}
                <ReviewSection icon="receipt" title={t("admin.cn.g.willDo")} onEdit={() => goTo(1)}>
                  <div className="cn-plan">
                    <p className="cn-plan__note">{t("admin.cn.planNote")}</p>
                    {price && (
                      <dl className="cn-plan__list">
                        <div className="cn-plan__row">
                          <dt>{t(lease ? "admin.cn.f.monthlyRent" : "admin.ct.f.price")}</dt>
                          {/* formatMoney AND moneyToWords — never formatApprox. Both
                              halves of a contract figure are authoritative, and the
                              words are what a court reads when the two disagree. */}
                          <dd>
                            <span className="cx-tnum">{formatMoney(lang, lease ? (monthlyRent ?? price) : price)}</span>
                            <span className="cn-plan__words">[ {moneyToWords(lease ? (monthlyRent ?? price) : price, lang)} ]</span>
                          </dd>
                        </div>
                        {plan.map((p, i) => (
                          <div className="cn-plan__row" key={i}>
                            <dt>{p.description}</dt>
                            <dd>
                              <span className="cx-tnum">{formatMoney(lang, p.amount)}</span>
                              <span className="cn-plan__words">{fmtDate(lang, fromIso(p.dueOn))}</span>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {plan.length === 0 && <p className="cn-plan__empty">{t("admin.cn.planEmpty")}</p>}
                    {/* TODO(contract print/PDF task): this is a summary of the
                        figures, not the document. The clause wording is fixed legal
                        text pending review, and rendering the paper itself is its
                        own piece of work. */}
                  </div>
                </ReviewSection>

                {amending && (
                  <Section title={t("admin.cn.g.amendment")}>
                    <Row
                      label={t("admin.cn.f.amendReason")}
                      hint={t("admin.cn.h.amendReason")}
                      htmlFor="cn-amendwhy"
                      error={blocked ?? undefined}
                    >
                      <TextInput id="cn-amendwhy" value={amendReason} onChange={setAmendReason} placeholder={t("admin.cn.ph.amendReason")} />
                    </Row>
                  </Section>
                )}
              </div>

              {consequence && <ConsequenceBar text={consequence.text} tone={consequence.tone} />}

              <div className="ap-foot">
                <Button hierarchy="tertiary" size="lg" iconLeading="arrow-left" onClick={() => goTo(1)}>
                  {t("admin.ap.prev")}
                </Button>
                <div className="ap-foot__right">
                  {!amending && draftButton}
                  <Button
                    hierarchy="primary"
                    size="lg"
                    iconLeading="file-signature"
                    onClick={() => {
                      /* GO TO THE PROBLEM, DO NOT DESCRIBE IT. The fields that
                         are missing are on an earlier step, so there is nothing
                         here to mark — and a red list naming them would leave
                         somebody to find them by hand. This jumps to the step
                         that owns the first gap, turns the field errors on, and
                         puts the cursor in it. */
                      if (!canSign) {
                        jumpToFirstGap();
                        return;
                      }
                      save(true);
                    }}
                  >
                    {t(amending ? "admin.cn.saveAmendment" : "admin.cn.saveAndSign")}
                  </Button>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* THE PAPER, LIVE.

            `blanks` is what makes it read as a document being written rather
            than one that came out short: a term nobody has reached yet is a
            ruled line, not a missing row. It is never passed on the printed
            page — see the note in contract-sheet.tsx.

            STICKY, AND WITH ITS OWN SCROLL. The form is long and the sheet is
            long, and locking them together would mean the paper scrolled past
            while somebody was still answering the question that fills it in. */}
        <aside className="cn-paper" aria-label={t("admin.cn.paper.aria")}>
          <div className="cn-paper__inner">
            <div className="cn-paper__head">
              <h2 className="cn-paper__title">{t("admin.cn.paper.title")}</h2>
              <p className="cn-paper__hint">{t("admin.cn.paper.hint")}</p>
            </div>
            <div className="cn-paper__stage">
              <div className="cn-paper__fit">
                <ContractSheet c={paper} lang={lang} blanks />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* THE SAME PAPER ON A NARROW SCREEN — a disclosure, not a dialog.

          A modal would need a focus trap, an Escape key and a scroll lock to
          be honest about being one, and all three would be machinery in the
          way of a thing somebody wants to glance at. Folded open in place, it
          is just more page, and the browser already knows how to scroll. */}
      <div className="cn-fold">
        <button
          type="button"
          className="cn-fold__btn"
          aria-expanded={paperOpen}
          aria-controls="cn-fold-body"
          onClick={() => setPaperOpen((v) => !v)}
        >
          <Icon name="file-text" size={16} />
          <span>{t(paperOpen ? "admin.cn.paper.close" : "admin.cn.paper.open")}</span>
          <span className={"cn-fold__chev" + (paperOpen ? " is-open" : "")}>
            <Icon name="chevron-down" size={16} />
          </span>
        </button>
        <div className="cn-fold__body" id="cn-fold-body" hidden={!paperOpen}>
          {/* Mounted only while open: on a wide screen the button above is
              display:none, so this never becomes a second copy of the sheet. */}
          {paperOpen && (
            <div className="cn-paper__fit cn-paper__fit--fold">
              <ContractSheet c={paper} lang={lang} blanks />
            </div>
          )}
        </div>
      </div>

      {/* Adding the counterparty without leaving the contract.

          The same modal the members page uses, so a tenant created here gets
          the same record — language, consent, ID and all. It SELECTS them on
          the way out: the reason somebody opened it was to fill this field, and
          leaving them to search for the person they just typed in is how a
          shortcut turns back into a chore. */}
      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        /* Whatever they typed into the search box comes with them. Somebody
           who has searched for "Renas" and found nothing has already written
           the first field of this form; asking for it again is the small
           friction that used to send people to the free-text door. */
        initial={{ name: partyQuery.trim() }}
        onSubmit={(v) => {
          const created = newMemberRecord(v);
          addMember(created);
          setAddMemberOpen(false);
          setBuyerId(created.id);
          setPartyQuery("");
          setOwnerClash(false);
          pushToast({ tone: "success", icon: "user-plus", title: t("admin.cn.memberAdded"), msg: created.name });
        }}
      />

      <FinanceToaster toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
