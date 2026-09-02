/* =============================================================================
   Chiya admin — contracts, invoices and payments.

   THE CONTRACT IS THE RECORD OF THE TRANSACTION. There is no separate "deal"
   sitting behind it. `catalog.ts` says what a property IS and who is linked to
   it; this file says what was AGREED on it — the parties, the money, the dates
   — and what was demanded and received against that agreement.

   It replaces the earlier `deals.ts`, where a DealRecord held the transaction
   and a ContractRecord held a document generated from it. Two records for one
   agreement meant two places for the price, two places for the parties, and two
   things to keep in step; the second one was never the authority for anything.
   Everything a DealRecord carried now lives on ContractRecord.

   Three record types, in dependency order:

     ContractRecord  the agreement — one transaction on one property
     InvoiceRecord   a demand for money against a contract, IMMUTABLE once issued
     PaymentRecord   money actually received against an invoice

   Three rules run through all of it:

   1. MONEY IS `Money`, NEVER A NUMBER. Every amount is an integer count of minor
      units with a currency attached, and every sum, percentage and comparison
      goes through lib/money. Nothing in this file does arithmetic with `+`.

   2. REFERENCE vs SNAPSHOT. A contract *references* its parties by id, so a
      renamed member flows through everywhere. An invoice *snapshots* them: it
      carries `billToId` for the link AND a frozen `billTo` block copied at issue
      time, so reprinting it in five years shows what it showed on the day.

   3. DERIVED VALUES ARE NEVER STORED. Invoice totals come from the lines.
      "Overdue" comes from the due date and the payments. Storing either would
      let a record disagree with itself.

   A note on property state: nothing in this file touches a property. The rules
   for how a contract moves its property's publication and availability are a
   real design decision, and they are made in ./property-state.ts — one module,
   four named transitions, no store calls. This file stays the record layer.
   ========================================================================== */

import { ANCHOR_ISO, addDays, addMonths, cycleDueDates, daysBetween, isOverdue } from "@/lib/dates";
import {
  add,
  compareMoney,
  convert,
  fromMinor,
  isNegative,
  isZero,
  maxMoney,
  money,
  multiply,
  percentOf,
  splitIntoInstallments,
  subtract,
  sumMoney,
  zeroMoney,
  type CurrencyCode,
  type Money,
} from "@/lib/money";
import { AGENTS, MEMBERS, PROPERTIES, agentById, memberById, type Publication } from "./catalog";
import type { OwnerLedgerEntry } from "./owner-ledger";

/* The platform's default currency. DEFAULT_PLATFORM_SETTINGS.general
   .defaultCurrency in lib/platform-settings is the authority, but that module is
   "use client" and this one is imported by server-rendered pages, so the value is
   restated here rather than dragging a client boundary into the data layer. */
export const PLATFORM_CURRENCY: CurrencyCode = "USD";

/* ----------------------------------------------------------------------------
   Contracts
   ------------------------------------------------------------------------- */

export type ContractKind = "sale" | "rent";

/**
 * Where a contract has got to. Four states, and the transitions between them
 * are one-way:
 *
 *   draft      typed up, nobody has signed. The ONLY editable state.
 *   signed     every party has signed. In force, and no longer editable.
 *   completed  handover done (sale) or the term ran out (tenancy).
 *   cancelled  abandoned. NEVER deleted — paid invoices hang off it.
 *
 * Correcting a signed contract is not an edit. It is a cancellation plus a
 * replacement linked by `replacesContractId` — see `isEditable` below.
 */
export type ContractStatus = "draft" | "signed" | "completed" | "cancelled";

/** How often rent falls due on a tenancy. */
export type RentCycle = "monthly" | "quarterly" | "biannual" | "yearly";

/** Who the tenant hands the rent to. Decides whether the agency raises a rent
    invoice every cycle (agency) or exactly one commission invoice (owner). */
export type RentPaidTo = "owner" | "agency";

/** What the agency charges for collecting and managing, when it collects. */
export interface ManagementFee {
  type: "percent" | "fixed";
  /** A percentage of each rent collection, or a flat amount per cycle in whole
      units of the contract's currency — see `managementFeeAmount`. */
  value: number;
}

/** A counterparty with no member account — most buyers and tenants never
    register, and requiring an account first would push the agency back to
    recording the transaction on paper. */
export interface ExternalParty {
  name: string;
  phone: string;
  /** Civil ID / passport number, when the paperwork captured one. */
  idNumber?: string;
}

/* ----------------------------------------------------------------------------
   Templates — which DOCUMENT is being written

   `kind` says what the transaction is; `template` says which paper it goes on.
   They are not the same question, which is why both exist. A full-price sale and
   a sale paid in instalments are the same kind of transaction and two genuinely
   different documents: different clauses, different signatures, and a payment
   schedule on one of them that the other has no place for.

   THE TEMPLATE IS CHOSEN BEFORE THE FORM OPENS, never inside it. Branching
   mid-form would mean asking half the questions twice and throwing away the
   answers to the other half when someone changed their mind on step 2.
   ------------------------------------------------------------------------- */

export type ContractTemplate = "sale_full" | "sale_installments" | "lease";

/** The transaction a template describes. One direction only: a template always
    implies its kind, a kind never implies a template. */
export function templateKind(template: ContractTemplate): ContractKind {
  return template === "lease" ? "rent" : "sale";
}

/** The template a property's listing type opens by default — what "Create
    contract" on a for-rent property means without asking. A sale defaults to
    full payment; instalments are the deliberate choice. */
export function defaultTemplate(listing: ContractKind): ContractTemplate {
  return listing === "rent" ? "lease" : "sale_full";
}

/**
 * WHO ACTUALLY SIGNED, when it is not the registered owner.
 *
 * Power of attorney, heirs selling an estate, a company representative signing
 * for a landlord that is a business. The property still belongs to `ownerId` —
 * that link is not rewritten — but the paper is signed by somebody else, and a
 * contract that cannot say so is a contract that quietly misstates who agreed
 * to it.
 *
 * `reason` is REQUIRED. "Someone else signed" with no explanation is exactly
 * the fact a dispute turns on, and it is unrecoverable afterwards.
 */
export interface SignerOverride {
  name: string;
  phone: string;
  idNumber?: string;
  reason: string;
}

/**
 * How a commission was ARRIVED AT — not just what it came to.
 *
 *   half_month  half of one month's rent. The ordinary tenancy fee here.
 *   one_month   a full month's rent.
 *   percent     a percentage of the price (`value` is the rate).
 *   fixed       a flat amount (`value` is in whole units of the currency).
 *   none        this party pays nothing. Raises NO invoice.
 *
 * The basis is stored alongside the amount rather than being recomputed from it
 * because the amount is what was agreed and the basis is why. Rent can be
 * renegotiated mid-term; "half a month" computed against the new rent would
 * silently restate a fee that was already invoiced.
 */
export type CommissionBasis = "half_month" | "one_month" | "percent" | "fixed" | "none";

export interface CommissionTerm {
  basis: CommissionBasis;
  /** The rate (percent) or the flat figure (fixed), in whole units. Unused by
      the month-based bases and by `none`. */
  value?: number;
  /** What it came to. Always present, always zero when the basis is `none`. */
  amount: Money;
}

/**
 * WHAT EACH SIDE OF A SALE PAYS, as a percentage of the agreed price. One
 * percent from the seller and one from the buyer.
 *
 * NOT THE MANDATE RATE, and deliberately not. The mandate is what a seller
 * signed up to when they listed, months before any buyer existed; the fee on
 * the contract is the house standard, the same on both sides, typed over
 * whenever the parties agreed something else. The two numbers were one for a
 * while, and the form defaulted a seller's fee from the listing — which meant
 * the same office charged a different fee on two identical deals because the
 * paperwork behind them was signed by different people.
 */
export const DEFAULT_SALE_COMMISSION_RATE = 1;

/** How often a sale instalment falls due. Deliberately a smaller set than
    RentCycle — nobody sells a flat on a yearly instalment plan. */
export type InstallmentFrequency = "monthly" | "quarterly" | "biannual";

export const INSTALLMENT_MONTHS: Record<InstallmentFrequency, number> = { monthly: 1, quarterly: 3, biannual: 6 };

/**
 * Who the buyer hands an instalment to.
 *
 * ⚠ THE FIELD THAT KEEPS THE FINANCE PAGE HONEST. A seller-paid instalment is
 * the SELLER'S money passing our desk, exactly as rent on an agency-collected
 * tenancy is the landlord's. Twenty-four instalments on a $98,000 sale is
 * ninety-eight thousand dollars that is not ours, and counting it would report
 * a business several times its real size — with numbers that look completely
 * ordinary on screen. Decided here, frozen onto each invoice as `payee`, and
 * filtered at the aggregation point by `isAgencyMoney`.
 */
export type InstallmentsPaidTo = "seller" | "agency";

/** How the parties expect to settle. Stated on the contract; what actually
    arrives is recorded per payment (PaymentRecord.method) and may differ. */
export type ExpectedPaymentMethod = "cash" | "bank_transfer" | "card" | "cheque";

/**
 * WHERE THE INSURANCE DEPOSIT HAS GOT TO.
 *
 *   held              we are holding it. The state every deposit starts in.
 *   returned          handed back in full at the end of the term.
 *   partly_returned   damages deducted, the remainder handed back.
 *   carried_forward   rolled into a renewal. No money moved.
 *
 * Undefined on a contract with no deposit — absence means "there was never
 * one", which is a different fact from "there was one and it is still held".
 *
 * NOT DECIDED AT SIGNING. Nobody knows at the start of a tenancy how it ends,
 * which is why closing a lease is an action on the contract screen and not a
 * field on the creation form.
 */
export type DepositStatus = "held" | "returned" | "partly_returned" | "carried_forward";

/**
 * A change made to a contract AFTER it was signed.
 *
 * Amending is not editing. The contract keeps its number, both parties keep the
 * document they already hold, and the amendment records what moved and why —
 * appended, never rewritten, so a contract amended three times shows all three.
 * Renumbering it would orphan every invoice and every receipt that names it.
 */
export interface ContractAmendment {
  amendedOn: string; // ISO
  /** Staff id from Settings → Team, matching PaymentRecord.recordedBy. */
  amendedBy: string;
  reason: string;
  /** Field-by-field, as text — this is a record for a person to read, not a
      patch to replay. Money and dates are formatted at the moment of the
      amendment so the line keeps saying what it said. */
  changes: Array<{ field: string; from: string; to: string }>;
}

/* ----------------------------------------------------------------------------
   Clause variables

   The fixed wording of a clause is legal text and is not written here (see the
   TODO below). What IS here is the handful of NUMBERS AND DATES that get
   dropped into that wording — the late-rent penalty, the vacate-by date, the
   registration deposit.

   A KEYED MAP, NOT LOOSE FIELDS, because the set differs per template: a lease
   has a late-rent penalty and no evacuation date, a sale has the reverse.
   Modelled as fifteen optional columns on ContractRecord, every screen would
   have to know which of them apply to the document in front of it, and the
   answer would end up encoded slightly differently in each one.

   The expected keys are declared ONCE, below, so a template and its variables
   cannot drift apart.

   TODO(contract wording task): the clause TEXT these values are interpolated
   into is fixed legal wording and is pending legal review. Only the variables
   are modelled here.
   ------------------------------------------------------------------------- */

/** How a late-rent charge is expressed: a flat sum per day, or a percentage of
    the rent per day. Stored as a clause variable, read by `latePenaltyFor`. */
export type LateRentBasis = "per_day" | "percent_per_day";

export const SALE_CLAUSE_KEYS = ["breachPenalty", "evacuationDate", "dailyDelayPenalty", "registrationDeposit"] as const;

export const LEASE_CLAUSE_KEYS = [
  "lateRentPenalty",
  "lateRentBasis",
  "regretPenalty",
  "vacateByDate",
  "dailyVacatePenalty",
  "noticeDays",
] as const;

export type SaleClauseKey = (typeof SALE_CLAUSE_KEYS)[number];
export type LeaseClauseKey = (typeof LEASE_CLAUSE_KEYS)[number];
export type ClauseKey = SaleClauseKey | LeaseClauseKey;

/**
 * The clause variables a template expects — the single declaration both the
 * form and the document read.
 *
 * A sale paid in instalments takes the same clauses as one paid in full: the
 * schedule is a payment arrangement, not a different set of obligations.
 */
export function clauseKeysFor(template: ContractTemplate): readonly ClauseKey[] {
  return template === "lease" ? LEASE_CLAUSE_KEYS : SALE_CLAUSE_KEYS;
}

/** Days of notice before a tenancy's end, when the contract states one. The
    default is stated here rather than at three call sites. */
export const DEFAULT_NOTICE_DAYS = 30;

export interface ContractRecord {
  id: string;
  kind: ContractKind;
  /**
   * Which document this is. Optional so the seed — written before templates
   * existed — still loads; read it through `templateOf`, never directly, so a
   * record without one still answers the question.
   */
  template?: ContractTemplate;
  status: ContractStatus;

  /** PropertyRecord id in catalog.ts. */
  propertyId: string;
  /** The seller (sale) or landlord (rent) — always the property's owner. */
  ownerId: string;
  /** The buyer or tenant, when they hold a member account. */
  buyerId?: string;
  /** The buyer or tenant when they do not. Never set alongside `buyerId`. */
  buyerExternal?: ExternalParty;
  /** Who signed for the owner, when it was not the owner. See SignerOverride. */
  signerOverride?: SignerOverride;
  /**
   * Who signed for the BUYER or TENANT, when it was not them.
   *
   * The mirror of `signerOverride`, and just as ordinary: a company sends
   * whoever holds the seal, a family sends the son who lives in the country.
   * Kept as its own field rather than a flag on one shared record, because a
   * contract can perfectly well be signed by proxies on both sides at once and
   * the two reasons are different reasons.
   */
  buyerSignerOverride?: SignerOverride;
  /** AgentRecord id of the agent who wrote the contract. */
  agentId: string;

  /**
   * The agreed figure: for a sale the price, for a tenancy the rent PER CYCLE.
   * NOT the property's asking price — an offer below asking is normal, and the
   * commission is charged on what was agreed.
   */
  price: Money;
  deposit?: Money;
  /** Always exactly percentOf(price, commissionRate) — asserted at module load. */
  commission: Money;
  /**
   * Agency commission as a percentage of `price` (2.5 means 2.5%).
   *
   * On a SALE this is the familiar rate. It starts at the house standard —
   * DEFAULT_SALE_COMMISSION_RATE, the same on both sides — and NOT at the
   * property's mandate: the mandate is what a seller agreed to at listing,
   * often months before there was a buyer or a price. Seed records predate that
   * and still follow their mandates, which is what the cross-check below holds
   * them to.
   *
   * On a TENANCY the base is one cycle's rent, so the ordinary "one month's
   * rent" fee is written as 100 and half a month as 50. That is a different
   * base from the mandate's rate (which is stated against the whole term), so
   * the two are deliberately NOT cross-checked — see the validation block.
   */
  commissionRate: number;
  /** Why a sale's rate differs from its mandate. Required whenever it does: a
      quiet discount is exactly the kind of thing that has to leave a trail. */
  commissionOverrideReason?: string;

  /* ---- commission, per party ----------------------------------------------

     BOTH PARTIES PAY, ON A TENANCY AND ON A SALE. The landlord pays for finding
     a tenant and the tenant pays for finding a home; the seller pays for finding
     a buyer and the buyer pays for finding the property. What differs is the
     SIZE of the two sides, not whether there are two — which is why this is two
     fields rather than one figure with a note beside it.

     ONE STANDARD RATE, BOTH SIDES — DEFAULT_SALE_COMMISSION_RATE. Either side
     is typed over on the contract when the parties agreed something else.

     Both are OPTIONAL so the seed, written when there was one commission,
     still loads. Read them through `ownerCommissionOf` / `tenantCommissionOf`,
     which fall back to the legacy single figure. `commission` above remains
     the OWNER-side amount on every record, old and new; the agency's whole
     earning on a contract is `totalCommission`.

     CHARGED ONCE, AT SIGNING. Never per cycle and never per instalment. */
  ownerCommission?: CommissionTerm;
  tenantCommission?: CommissionTerm;

  /** ISO — the day the agent typed it up. Not the day it took effect. */
  createdOn: string;
  /** ISO — the day the parties actually signed. The contract is in force from
      here, and `createdOn` is routinely days or weeks earlier. */
  signedOn?: string;
  /** ISO — keys handed over / completion. */
  handoverOn?: string;

  /* ---- tenancy terms (rent only) ---- */
  cycle?: RentCycle;
  termMonths?: number;
  /** ISO — when the term starts counting. Often LATER than `signedOn`. */
  startsOn?: string;
  /** ISO — derived from `startsOn` + `termMonths` (see `deriveEndsOn`). */
  endsOn?: string;
  rentPaidTo?: RentPaidTo;
  managementFee?: ManagementFee;
  /**
   * THE MONTHLY RATE the contract states — "$700 per month", the figure a
   * tenant would tell you if you asked what their rent is.
   *
   * Distinct from `price`, which is one CYCLE's rent and therefore the amount
   * on one invoice. On a monthly tenancy the two are equal; on a quarterly one
   * `price` is three times this. Both are stored because both are read: the
   * document prints the monthly rate, the invoice charges the cycle, and
   * dividing one back out of the other would round.
   *
   * Invariant, asserted at module load wherever it is present:
   *   price === multiply(monthlyRent, CYCLE_MONTHS[cycle])
   */
  monthlyRent?: Money;
  /**
   * Held against damage and returned at the end of the term.
   *
   * ⚠ NOT INCOME, AND NOT AN INVOICE. It is the tenant's money in our hands.
   * It raises no invoice at signing, never counts toward revenue, and appears
   * on the finance page under "Deposits held" — styled apart from revenue
   * precisely so the two can never be read as one number. See `depositStatus`
   * for where it goes afterwards.
   *
   * Separate from `deposit` above, which is a sale's holding deposit — money
   * that IS consideration and does get invoiced.
   */
  insuranceDeposit?: Money;
  /** How the parties expect rent to arrive. Stated, not enforced. */
  expectedPaymentMethod?: ExpectedPaymentMethod;

  /* ---- sale paid in instalments ---- */
  /** Paid at signing, before the schedule starts. Reduces the balance the
      instalments have to clear. */
  downPayment?: Money;
  installmentCount?: number;
  installmentFrequency?: InstallmentFrequency;
  /** ISO — when the first instalment falls due. Later than the signing date in
      almost every case, which is why it is asked for rather than derived. */
  firstInstallmentOn?: string;
  /** Whose money the instalments are. See InstallmentsPaidTo — this is the one
      that keeps six-figure pass-through out of the revenue figure. */
  installmentsPaidTo?: InstallmentsPaidTo;

  /* ---- the numbers and dates that print inside clauses ---- */
  /**
   * Clause variables, keyed by `ClauseKey`. Which keys are expected is decided
   * by the template — see `clauseKeysFor`, the single declaration of that set.
   *
   * Optional at the record level so the seed loads; read through
   * `clauseValue`, which returns undefined for anything unset rather than
   * making every caller guard the map itself.
   */
  clauses?: Record<string, string | number>;

  /* ---- the insurance deposit's lifecycle ---- */
  depositStatus?: DepositStatus;
  /** ISO — the day it was handed back or rolled forward. */
  depositReturnedOn?: string;
  /** Withheld for damage. Present only on `partly_returned`. */
  depositDeduction?: Money;
  /** Why it was withheld. Required alongside a deduction: a deduction with no
      stated reason is the one a tenant disputes. */
  depositDeductionReason?: string;
  /** The renewal the deposit was carried into. Present only on
      `carried_forward`, and the only record that no money moved. */
  depositCarriedToContractId?: string;

  /* ---- signing ---- */
  /** Where it was signed. Prints on the document; every contract states one. */
  city?: string;
  /** How many original copies were produced — one per party plus the file. */
  copies?: number;
  /** Staff id of whoever organised the signing, from Settings → Team. */
  organizerId?: string;

  /**
   * Changes made after signing, appended in order.
   *
   * The contract KEEPS ITS NUMBER through every amendment. See ContractAmendment.
   */
  amendments?: ContractAmendment[];

  /* ---- bookkeeping ---- */
  /**
   * The contract this one replaces — a renewal, or a signed contract that was
   * cancelled and re-papered.
   *
   * PRESENT FROM DAY ONE even though nothing writes it yet. A renewal chain
   * that was never recorded cannot be reconstructed afterwards: once the old
   * and new contracts both exist with no link between them, no amount of later
   * work can tell a renewal apart from an unrelated second tenancy.
   */
  replacesContractId?: string;
  /**
   * The signed paper lives somewhere else — a notary, a solicitor, the owner's
   * own file. Recorded here so the screen can say the system holds no document,
   * rather than implying one has gone missing. Also day-one for the same
   * reason: it is a fact about the day of signing, and unrecoverable later.
   */
  externalPaperwork?: boolean;

  cancelledOn?: string;
  /** Why it fell through. Kept because "cancelled" with no reason is unusable
      in a report, and the reason is never derivable after the fact. */
  cancelReason?: string;

  /* ---- currency ---- */
  /**
   * Whether the parties agreed to SETTLE in a second currency.
   *
   * Off by default, and that default matters: most contracts are struck and
   * paid in one currency, and an always-on second figure would put a converted
   * number beside every contractual one — which is exactly how an approximate
   * figure gets mistaken for a binding one.
   */
  dualCurrency: boolean;
  /** The settlement currency, when `dualCurrency` is on. Never equal to
      `price.currency` — asserted at module load. */
  secondaryCurrency?: CurrencyCode;
  /**
   * THE frozen exchange rate on this contract. A CONTRACTUAL TERM, not a market
   * reading — NEVER re-read from settings, and never recalculated.
   *
   * Reads as "units of the other currency per 1 unit of `price.currency`". It is
   * pre-filled from the settings rate when a contract is drawn up, but staff may
   * type anything: parties routinely agree a round 1,300 when the market says
   * 1,310, and their number is the one that binds. Once the contract is signed
   * it is immutable — enforced in _shared/contracts-store, not just in the UI,
   * because the UI is not the thing that guarantees it.
   *
   * Required when either the contract is not in the platform default currency
   * (so its value can be reported alongside everything else) or `dualCurrency`
   * is on. Forbidden otherwise, so a stale rate cannot sit on a record that has
   * no use for one.
   */
  agreedRate?: number;
  /** ISO day the rate was agreed. Present whenever `agreedRate` is. */
  agreedRateSetOn?: string;

  /**
   * The property's publication at the moment this contract reserved it.
   *
   * Written by onContractDrafted() in ./property-state.ts and read by
   * onContractCancelled(). Without it, cancelling could only ever guess where to
   * put the listing back — and guessing "published" would re-advertise a
   * property the owner had pulled.
   */
  previousPublication?: Publication;

  /** Free-text context for the admin. Not shown to any counterparty. */
  notes?: string;
}

/* ----------------------------------------------------------------------------
   The rules, as named functions.

   Every one of these is a decision about how a contract behaves, and each is
   written once here rather than as an inline condition at a call site. A rule
   spread across four `if`s in three screens is a rule that will be enforced in
   two of them by next month.
   ------------------------------------------------------------------------- */

/**
 * MAY THIS CONTRACT BE EDITED? Only while it is a draft.
 *
 * A signed contract is an agreement between people, not a form. Correcting one
 * means cancelling it and creating a replacement that points back at it with
 * `replacesContractId` — which leaves both documents on the record, which is
 * what the parties (and anyone auditing them later) actually need. Silently
 * rewriting a signed contract would make the copy in someone's drawer disagree
 * with the copy on the screen, and nothing would show that it had happened.
 */
export function isEditable(c: Pick<ContractRecord, "status">): boolean {
  return c.status === "draft";
}

/**
 * MAY THIS CONTRACT BE DELETED? Never.
 *
 * Paid invoices attach to cancelled contracts, and money that was received has
 * to stay attached to the reason it was received. Cancelling is the only way
 * out, and it leaves the record in place with a date and a reason on it.
 */
export function isDeletable(): boolean {
  return false;
}

/**
 * The day the contract came into force — `signedOn`, never `createdOn`.
 *
 * The two are genuinely different dates and routinely weeks apart: an agent
 * types the contract up when terms are agreed, and the parties sign when they
 * can both get to the office. Anything measuring "since the contract started"
 * reads this one.
 */
export function activeFrom(c: Pick<ContractRecord, "signedOn">): string | undefined {
  return c.signedOn;
}

/**
 * The day a tenancy's term starts counting — `startsOn`, falling back to the
 * signing date.
 *
 * Rent terms do NOT count from signature. A lease signed on the 12th commonly
 * starts on the 1st of the following month, and billing the tenant from the
 * 12th would be wrong by three weeks on every cycle for a year.
 */
export function termStart(c: Pick<ContractRecord, "startsOn" | "signedOn">): string | undefined {
  return c.startsOn ?? c.signedOn;
}

/** Calendar-month arithmetic for lease terms: the last day covered by a term of
    `months` months beginning on `startsOn`. A 12-month term from 2026-06-01 ends
    2027-05-31, not 2027-06-01 — the end date is the last day IN the term.

    Month stepping goes through lib/dates `addMonths`, which clamps to the end of
    the target month. Rolling the arithmetic by hand here (as this once did) let
    a term starting on the 31st overflow into the following month. */
export function deriveEndsOn(startsOn: string, months: number): string {
  return addDays(addMonths(startsOn, months), -1);
}

/** Is this contract in force right now? Signed, and not past its end date. */
export function isActive(c: ContractRecord, asOf: string = ANCHOR_ISO): boolean {
  if (c.status !== "signed") return false;
  if (!c.endsOn) return true;
  return daysBetween(c.endsOn, asOf) <= 0;
}

/** Has a tenancy run past its end date? Sales never expire, so they are never
    true. Derived, not stored — nothing rewrites a record at midnight (see the
    note on expireLease in _shared/contract-transitions). */
export function hasExpired(c: ContractRecord, asOf: string = ANCHOR_ISO): boolean {
  if (c.kind !== "rent" || !c.endsOn) return false;
  return daysBetween(c.endsOn, asOf) > 0;
}

/** Days until a contract's term ends — negative once it has. Undefined for
    anything with no end date, which is every sale. */
export function daysToExpiry(c: ContractRecord, asOf: string = ANCHOR_ISO): number | undefined {
  if (!c.endsOn) return undefined;
  return daysBetween(asOf, c.endsOn);
}

/** How many rent cycles a term contains — 12 monthly cycles in a year, 4
    quarterly, 2 biannual, 1 yearly. */
export const CYCLE_MONTHS: Record<RentCycle, number> = { monthly: 1, quarterly: 3, biannual: 6, yearly: 12 };

export function cycleCount(c: Pick<ContractRecord, "cycle" | "termMonths">): number {
  if (!c.cycle || !c.termMonths) return 0;
  return Math.round(c.termMonths / CYCLE_MONTHS[c.cycle]);
}

/**
 * The whole value of the contract — the sale price, or every cycle's rent added
 * up across the term.
 *
 * Separate from `price` on purpose. `price` is the contractual figure and the
 * commission base; this is what the transaction is worth, and it is the only
 * one of the two on which a sale and a tenancy can be compared.
 */
export function contractValue(c: ContractRecord): Money {
  if (c.kind === "sale") return c.price;
  const cycles = cycleCount(c);
  return cycles > 0 ? multiply(c.price, cycles) : c.price;
}

/** The management fee charged on one rent collection, when the agency collects.
    Undefined when there is no fee or the owner collects the rent themselves. */
export function managementFeeAmount(c: ContractRecord): Money | undefined {
  if (!c.managementFee || c.rentPaidTo !== "agency") return undefined;
  return c.managementFee.type === "percent" ? percentOf(c.price, c.managementFee.value) : money(c.managementFee.value, c.price.currency);
}

/* ----------------------------------------------------------------------------
   Templates, commissions and clauses — derived, never stored twice
   ------------------------------------------------------------------------- */

/**
 * Which document a contract is, for a record that may predate templates.
 *
 * The seed carries no `template`, so it is inferred from `kind` — a tenancy is
 * a lease, a sale is a full-price sale. An instalment sale is never inferred:
 * it is only ever an instalment sale if somebody said so, and guessing it from
 * the presence of a schedule would relabel a hand-written record.
 */
export function templateOf(c: Pick<ContractRecord, "template" | "kind">): ContractTemplate {
  return c.template ?? defaultTemplate(c.kind);
}

/** Does this contract carry an instalment schedule? The one test, so no screen
    re-decides it from a half-set field. */
export function hasInstallments(c: Pick<ContractRecord, "template" | "kind" | "installmentCount">): boolean {
  return templateOf(c) === "sale_installments" && (c.installmentCount ?? 0) > 0;
}

/**
 * WORK OUT A COMMISSION FROM ITS BASIS. One place, so the form's live figure
 * and the invoice raised at signing cannot come out differently.
 *
 * The month-based bases measure against the MONTHLY rent, not against `price` —
 * "half a month" on a quarterly tenancy is half of one month, not half of three.
 * That distinction is the whole reason `monthlyRent` is stored separately.
 */
export function commissionAmountFor(
  basis: CommissionBasis,
  value: number | undefined,
  base: { price: Money; monthlyRent?: Money },
): Money {
  const currency = base.price.currency;
  const monthly = base.monthlyRent ?? base.price;
  switch (basis) {
    case "none":
      return zeroMoney(currency);
    case "half_month":
      return percentOf(monthly, 50);
    case "one_month":
      return monthly;
    case "percent":
      return percentOf(base.price, value ?? 0);
    case "fixed":
      return money(value ?? 0, currency);
  }
}

/**
 * The OWNER's side of the commission — the seller's on a sale, the landlord's
 * on a tenancy.
 *
 * Falls back to the legacy single `commission`/`commissionRate` pair for every
 * record written before commissions were split in two, which is what lets the
 * seed load unchanged. `commission` has always been the owner-side figure: the
 * generation rule billed it to the owner from the first version.
 */
export function ownerCommissionOf(c: ContractRecord): CommissionTerm {
  return c.ownerCommission ?? { basis: "percent", value: c.commissionRate, amount: c.commission };
}

/**
 * The COUNTERPARTY's side — the tenant's on a tenancy, the buyer's on a sale.
 *
 * Absent on every legacy record, and on every sale written before buyers were
 * charged at all; both read as "nothing charged", which is what those contracts
 * actually said. A sale written now carries a buyer's side of its own — see
 * DEFAULT_SALE_COMMISSION_RATE.
 */
export function tenantCommissionOf(c: ContractRecord): CommissionTerm {
  return c.tenantCommission ?? { basis: "none", amount: zeroMoney(c.price.currency) };
}

/** What the agency earns on this contract in total — both sides added up. The
    figure a report means by "commission", as opposed to `commission`, which is
    one party's share of it. */
export function totalCommission(c: ContractRecord): Money {
  return add(ownerCommissionOf(c).amount, tenantCommissionOf(c).amount);
}

/** One clause variable, or undefined when the contract does not state it.
    Callers never touch the map directly — see ContractRecord.clauses. */
export function clauseValue(c: Pick<ContractRecord, "clauses">, key: ClauseKey): string | number | undefined {
  return c.clauses?.[key];
}

/** Days of notice this tenancy requires before its term ends. */
export function noticeDaysOf(c: Pick<ContractRecord, "clauses">): number {
  const stated = clauseValue(c, "noticeDays");
  const n = typeof stated === "number" ? stated : Number(stated);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_NOTICE_DAYS;
}

/* ----------------------------------------------------------------------------
   Instalment schedules
   ------------------------------------------------------------------------- */

/** One instalment, with what is still owed after it is paid. */
export interface InstallmentLine {
  /** 1-based, as the document numbers them. */
  index: number;
  dueOn: string;
  amount: Money;
  /** The balance remaining AFTER this instalment. Exactly zero on the last. */
  balanceAfter: Money;
}

/**
 * The amount the instalments have to clear — the price less anything paid at
 * signing. A down payment is consideration that has already changed hands, so
 * it is not part of the schedule.
 */
export function financedAmount(c: Pick<ContractRecord, "price" | "downPayment" | "deposit">): Money {
  /* BOTH COME OFF, and the holding deposit used to be missed. It is money down
     to take the property off the market and it is PART OF THE PRICE — see the
     note on `deposit` — so a schedule built on the price less only the down
     payment spreads money the buyer has already handed over. On a five-thousand
     deposit that is five thousand billed twice, split invisibly across every
     instalment. */
  const afterDown = c.downPayment ? subtract(c.price, c.downPayment) : c.price;
  return c.deposit ? subtract(afterDown, c.deposit) : afterDown;
}

/**
 * THE INSTALMENT SCHEDULE, and the only place one is built.
 *
 * Amounts come from `splitIntoInstallments` (lib/money — the one rounding rule)
 * and dates from `cycleDueDates` (lib/dates — the one date walk). Neither is
 * re-implemented here, which is what stops the schedule an agent reviews before
 * signing from differing from the invoices signing actually raises.
 *
 * The running balance is carried down the list and finishes at exactly zero.
 * That is asserted rather than hoped for: `splitIntoInstallments` guarantees the
 * amounts sum to the total, so the last `balanceAfter` cannot be anything else.
 */
export function installmentSchedule(
  c: Pick<ContractRecord, "price" | "downPayment" | "deposit" | "installmentCount" | "installmentFrequency" | "firstInstallmentOn">,
): InstallmentLine[] {
  const count = c.installmentCount ?? 0;
  if (count <= 0 || !c.installmentFrequency || !c.firstInstallmentOn) return [];

  const financed = financedAmount(c);
  const amounts = splitIntoInstallments(financed, count);
  const dates = cycleDueDates(c.firstInstallmentOn, INSTALLMENT_MONTHS[c.installmentFrequency], count);

  let balance = financed;
  return amounts.map((amount, i) => {
    balance = subtract(balance, amount);
    return { index: i + 1, dueOn: dates[i] ?? c.firstInstallmentOn!, amount, balanceAfter: balance };
  });
}

/* ----------------------------------------------------------------------------
   The insurance deposit
   ------------------------------------------------------------------------- */

/**
 * MONEY WE ARE HOLDING THAT IS NOT OURS.
 *
 * True only while the deposit is still held. Once it has been returned,
 * partly returned or carried into a renewal, the agency is no longer sitting on
 * it and it drops out of the "Deposits held" figure on the finance page.
 */
export function isDepositHeld(c: ContractRecord): boolean {
  return !!c.insuranceDeposit && (c.depositStatus ?? "held") === "held";
}

/**
 * The total held across a set of contracts, in one currency.
 *
 * ⚠ NEVER ADDED TO REVENUE. This is a liability — the tenants' money — and the
 * finance page renders it apart from every income figure for that reason. It
 * is single-currency for the same reason `receivablesAging` is: totalling a
 * mixed book needs a rate per contract per day, and inventing one would make
 * the figure confidently wrong.
 */
export function depositsHeld(currency: CurrencyCode = PLATFORM_CURRENCY, contracts: ContractRecord[] = CONTRACTS): Money {
  return sumMoney(
    contracts.filter((c) => isDepositHeld(c) && c.insuranceDeposit!.currency === currency).map((c) => c.insuranceDeposit!),
    currency,
  );
}

/**
 * A TENANCY THAT HAS ENDED AND WHOSE DEPOSIT NOBODY HAS DEALT WITH.
 *
 * The outstanding item this whole lifecycle exists for. A lease runs out, the
 * tenant moves on, and the deposit sits in the agency's account with nothing on
 * any screen saying it is there — until the tenant rings up a year later asking
 * for it. Surfaced on the contracts list and the finance page.
 *
 * A CANCELLED tenancy counts too: it ended early, but it still ended holding
 * somebody's money.
 */
export function depositNeedsClosing(c: ContractRecord, asOf: string = ANCHOR_ISO): boolean {
  if (!isDepositHeld(c)) return false;
  if (c.status === "cancelled" || c.status === "completed") return true;
  return hasExpired(c, asOf);
}

/** Every tenancy whose deposit is waiting to be dealt with. */
export function depositsAwaitingClosure(contracts: ContractRecord[] = CONTRACTS, asOf: string = ANCHOR_ISO): ContractRecord[] {
  return contracts.filter((c) => depositNeedsClosing(c, asOf));
}

/* ----------------------------------------------------------------------------
   Late rent — calculated, offered, never charged
   ------------------------------------------------------------------------- */

/**
 * WHAT A LATE-RENT PENALTY WOULD COME TO, if somebody decided to charge it.
 *
 * ⚠ NOTHING IN THIS SYSTEM CHARGES IT AUTOMATICALLY, and that is a decision
 * rather than an omission. Whether to enforce a penalty against a tenant who is
 * four days late for the first time in two years is a judgement somebody makes
 * every single time, and a system that raised the charge on its own would make
 * that judgement by default — silently, in the agency's own favour, on the one
 * class of record where the agency profits from the answer.
 *
 * So this returns a figure and an invoice row offers it as a button. Returns
 * undefined when the contract states no penalty, or when nothing is late.
 */
export function latePenaltyFor(
  contract: ContractRecord,
  daysLate: number,
): { amount: Money; days: number } | undefined {
  if (daysLate <= 0) return undefined;
  const stated = clauseValue(contract, "lateRentPenalty");
  const value = typeof stated === "number" ? stated : Number(stated);
  if (!Number.isFinite(value) || value <= 0) return undefined;

  const basis = (clauseValue(contract, "lateRentBasis") as LateRentBasis | undefined) ?? "per_day";
  const perDay = basis === "percent_per_day" ? percentOf(contract.price, value) : money(value, contract.price.currency);
  return { amount: multiply(perDay, daysLate), days: daysLate };
}

/**
 * The figure(s) a contract, invoice or receipt should display.
 *
 * ⚠ THE ONLY sanctioned way to show a second currency on a financial document.
 * It reads `agreedRate` off the contract and NOTHING off settings, so a document
 * renders identically today, next year, and after somebody edits the browsing
 * rate in the admin. `formatApprox` is forbidden on these surfaces precisely
 * because it does the opposite.
 *
 * Returns `secondary: undefined` when the contract settles in one currency,
 * which is the default and the common case — callers render one figure and stop.
 *
 * Note there is no `asOf` and no "≈": this is not an approximation. It is the
 * amount the parties agreed to settle, computed at the rate they agreed to
 * settle it at, and it is as binding as the primary figure beside it.
 */
export function dualFigures(c: ContractRecord, m: Money): { primary: Money; secondary?: Money } {
  if (!c.dualCurrency || !c.secondaryCurrency || !c.agreedRate) return { primary: m };
  return { primary: m, secondary: convert(m, c.secondaryCurrency, c.agreedRate) };
}

/* ----------------------------------------------------------------------------
   Invoices

   An issued invoice is immutable. "Draft" is the only editable state; once it is
   issued it is corrected with a credit note, never edited and never deleted.
   That is why `billTo` is a frozen copy rather than a lookup, why the totals come
   from the lines rather than being stored, and why voiding leaves the record in
   place with a reason attached.
   ------------------------------------------------------------------------- */

/** The party an invoice was addressed to, frozen at issue time. */
export interface BillTo {
  name: string;
  phone: string;
  email: string;
  address: string;
  /** Present for company counterparties; individuals have none. */
  taxId?: string;
  /**
   * Civil ID / passport number, when the paperwork captured one.
   *
   * The only identifying detail an off-platform counterparty leaves anywhere in
   * the system is their ExternalParty block on the contract, and a contract can
   * be superseded. Freezing the number onto the document means a receipt still
   * says who paid after the contract it came from has been replaced.
   */
  idNumber?: string;
}

export interface InvoiceLine {
  id: string;
  /**
   * THE FROZEN RECORD — what this line said on the day it was issued, in the
   * language whoever issued it was working in. Never rewritten. It is the text
   * a dispute reads, and it is what shows when there is no key below.
   */
  description: string;
  /**
   * THE SAME LINE, SAYABLE IN ANY LANGUAGE.
   *
   * A catalog key plus the facts that fill it, so an Arabic reader sees an
   * Arabic line rather than the English one the agent who signed the contract
   * happened to be looking at. Read through `invoiceLineText`, never directly.
   *
   * ⚠ THIS DOES NOT UNFREEZE THE LINE, and the distinction is the whole point.
   * The params are STORED, not looked up: the property name, the month, the
   * instalment number are the ones that were true at issue, exactly as
   * `billTo` is. Only the WORDING comes from the catalog. So the facts on a
   * five-year-old invoice can never drift — only the language follows whoever
   * is reading it.
   *
   * Absent on a charge somebody typed by hand. That has no template, and a
   * sentence a person wrote must be shown back to them verbatim.
   */
  descriptionKey?: string;
  descriptionParams?: Record<string, string | number>;
  /** A rent line's cycle, so the period it covers ("Jul 2026", "Jul–Sep 2026")
      reads in the reader's language as well. Resolved by `invoiceLineText`. */
  descriptionPeriod?: { dueOn: string; months: number };
  quantity: number;
  unitPrice: Money;
  /** Percentage, per line — a fee and a rent charge can be taxed differently. */
  taxRate: number;
}

/** What kind of demand this is. Drives the label and the icon; the money is the
    money either way. */
export type InvoiceCategory = "commission" | "rent" | "deposit" | "fee";

/**
 * WHOSE MONEY THIS INVOICE IS — and the single most consequential field on the
 * record.
 *
 *   agency  the agency has earned it. Commission, management fees, and any
 *           extra charge billed for the agency's own account.
 *   owner   it belongs to the landlord and merely passes through our hands.
 *           EVERY rent demand is one of these, and an instalment sale's
 *           instalments too: the money is the landlord's or the seller's
 *           whether it reaches them through us or straight from the payer.
 *
 * ⚠ NOT DECIDED BY `rentPaidTo`. That field says who physically collects, which
 * is a different question and changes only what happens after the money
 * arrives — the owner ledger and the payout. A tenancy the landlord collects
 * himself is still invoiced, and that demand is still his money.
 *
 * Frozen on the invoice, not looked up — a contract's terms can be superseded,
 * and a document issued last year has to keep saying whose money it was.
 *
 * ⚠ NOTHING WITH `payee: "owner"` IS REVENUE OR A RECEIVABLE. See
 * `isAgencyMoney` and the comment on `receivablesAging`.
 */
/**
 * A THIRD ANSWER, for money that belongs to neither of the two.
 *
 *   tenant  a tenancy's insurance deposit. It stays the TENANT'S money for the
 *           whole term — the agency merely holds it, and at the end he is
 *           entitled to all of it back unless there is a claim with evidence.
 *           It is not revenue, not a receivable, and not the landlord's either,
 *           so neither of the other two answers is true. `isAgencyMoney` says
 *           false and the owner ledger stays out of it; what makes a deduction
 *           the landlord's is closing the lease, not raising the demand.
 */
export type InvoicePayee = "agency" | "owner" | "tenant";

/**
 * The authored state of an invoice — what someone did to it, as opposed to what
 * the payments and the calendar say about it. `invoiceStatus()` derives the
 * settlement state on top of this.
 */
export type InvoiceLifecycle = "draft" | "issued" | "void";

/**
 * Everything an invoice can READ AS on a screen, once the due date and the
 * payments are taken into account. Five states, and every one of them is
 * derived — see `invoiceStatus`.
 */
export type InvoiceStatus = "not_due" | "due" | "paid" | "overdue" | "void";

export interface InvoiceRecord {
  id: string;
  /**
   * The human invoice number. Empty string while it is a draft — numbering
   * happens at issue, because a number handed to a draft that is later discarded
   * leaves a hole in the sequence. See nextInvoiceNumber().
   */
  number: string;
  contractId: string;
  category: InvoiceCategory;
  /** Whose money this is. Governs every finance figure — see InvoicePayee. */
  payee: InvoicePayee;
  status: InvoiceLifecycle;
  /** ISO. Absent while a draft. */
  issuedOn?: string;
  /** ISO. Overdue is measured against this and never stored. */
  dueOn: string;

  /** Live reference to the party billed, when they are on the platform. */
  billToId?: string;
  /** Frozen snapshot of that party as they were at issue time (rule 2). */
  billTo: BillTo;

  lines: InvoiceLine[];

  /* ---- void / credit note ---- */
  voidedOn?: string;
  voidReason?: string;
  /** On a voided invoice: the credit note that reverses it. */
  creditNoteId?: string;
  /** On a credit note: the invoice it reverses. The back-pointer is stored too so
      either document can be opened from the other without scanning the set. */
  creditNoteFor?: string;
}

/* ----------------------------------------------------------------------------
   Payments
   ------------------------------------------------------------------------- */

export type PaymentMethod = "bank_transfer" | "cash" | "card" | "cheque";

export interface PaymentRecord {
  id: string;
  invoiceId: string;

  /**
   * WHAT ACTUALLY ARRIVED — the money as the payer handed it over.
   *
   * A tenant settling a dollar invoice with a bag of cash dinars is ordinary
   * here, and recording that as a dollar payment throws away the only record of
   * what was really received. The receipt has to be able to say "3,406,000 IQD",
   * because that is what the tenant paid and what they will remember paying.
   */
  receivedAmount: Money;
  /** Convenience mirror of `receivedAmount.currency`, so a caller can branch on
      the currency without unpacking the amount. Asserted equal at module load. */
  receivedCurrency: CurrencyCode;
  /**
   * The rate used to turn `receivedAmount` into `amount`. Present ONLY when the
   * two currencies differ.
   *
   * Recorded per payment rather than read from the contract: a cash payment is
   * converted at the rate on the day it is taken, which is not necessarily the
   * rate the contract was signed at. Storing it is what makes the credit
   * reproducible — without it, "why was 3,406,000 IQD only worth $2,600?" has no
   * answer.
   */
  rateApplied?: number;

  /**
   * THE CREDIT against the invoice, in the INVOICE's currency.
   *
   * Derived from `receivedAmount` at `rateApplied`, but stored, because it is
   * what the invoice's balance is actually reduced by — re-deriving it later at
   * a different rate would silently change what an invoice has been paid.
   * Equals `receivedAmount` when no conversion happened.
   */
  amount: Money;

  receivedOn: string; // ISO
  method: PaymentMethod;
  /** Bank reference, cheque number, terminal receipt — whatever proves it. */
  reference: string;
  /** Staff id from Settings → Team (lib/platform-settings TeamSettings.staff). */
  recordedBy: string;

  /**
   * THE DAY THE OWNER ACKNOWLEDGED HE HAD THE MONEY — on a tenancy he collects
   * himself.
   *
   * ⚠ NOT THE PAYMENT DATE, and that is the whole reason it exists. `receivedOn`
   * is when the tenant handed the money over; the landlord may not be in the
   * office that day, and dating his receipt from the tenant's payment would put
   * a date on a paper he signs saying he received something a week earlier.
   *
   * Absent until somebody presses the button, and his receipt does not exist
   * before that: a receipt is proof a thing happened, so it cannot be issued in
   * advance of it happening. On an AGENCY-collected tenancy this stays empty —
   * there the hand-off is a payout, with its own record and its own date.
   */
  ownerReceiptedOn?: string;
}

/* ----------------------------------------------------------------------------
   Derivations — nothing below is ever stored on a record
   ------------------------------------------------------------------------- */

/**
 * IS THIS THE AGENCY'S MONEY? The rule behind every finance figure, written
 * once so no screen re-decides it.
 *
 * An agency-collected tenancy runs the whole rent roll through this system —
 * twelve demands a year, each for the full rent — and every fils of it belongs
 * to the landlord. Counting those as income would report a business several
 * times the size of the real one, and the error looks entirely plausible on the
 * screen: the numbers are real, the invoices are real, and nothing about the
 * total says it is wrong. What the agency earns on that tenancy is the
 * commission and the management fee, and those are the payee: "agency" records.
 */
export function isAgencyMoney(invoice: Pick<InvoiceRecord, "payee">): boolean {
  return invoice.payee === "agency";
}

/** The currency an invoice is denominated in (taken from its first line). */
export function invoiceCurrency(invoice: InvoiceRecord): CurrencyCode {
  return invoice.lines[0]?.unitPrice.currency ?? PLATFORM_CURRENCY;
}

/** One line's pre-tax amount: unit price × quantity. */
export function lineAmount(line: InvoiceLine): Money {
  return multiply(line.unitPrice, line.quantity);
}

export interface InvoiceTotals {
  subtotal: Money;
  tax: Money;
  total: Money;
}

/**
 * Totals, always recomputed from the lines. Tax is worked out per line and then
 * summed, so lines at different rates come out right; summing first and taxing
 * once would not.
 */
export function invoiceTotals(invoice: InvoiceRecord): InvoiceTotals {
  const cur = invoiceCurrency(invoice);
  const subtotal = sumMoney(invoice.lines.map(lineAmount), cur);
  const tax = sumMoney(
    invoice.lines.map((l) => percentOf(lineAmount(l), l.taxRate)),
    cur,
  );
  return { subtotal, tax, total: add(subtotal, tax) };
}

/** Everything received against one invoice. */
export function paidTotal(invoice: InvoiceRecord, payments: PaymentRecord[]): Money {
  const cur = invoiceCurrency(invoice);
  return sumMoney(
    payments.filter((p) => p.invoiceId === invoice.id).map((p) => p.amount),
    cur,
  );
}

/** What is still owed, floored at zero so an overpayment reads as settled rather
    than as a negative debt. */
export function outstanding(invoice: InvoiceRecord, payments: PaymentRecord[]): Money {
  const cur = invoiceCurrency(invoice);
  return maxMoney(subtract(invoiceTotals(invoice).total, paidTotal(invoice, payments)), zeroMoney(cur));
}

/**
 * The status an invoice actually reads as, right now.
 *
 * OVERDUE IS NEVER STORED — it is a function of the due date and the day you
 * ask, so a stored copy would be wrong by the next morning. Precedence, from
 * the top: void is an authored state and wins outright; a settled balance is
 * paid; anything still owing past its due date is overdue; on its due date it
 * is due; before that it is not yet due.
 *
 * A DRAFT reads as `not_due` — nothing has been demanded of anybody yet, so
 * there is no date to be late against. That is also what keeps the badge set on
 * screen to exactly five states.
 *
 * A credit note (negative total) settles at or below zero and so reads as paid —
 * correct: there is nothing to collect on it.
 */
export function invoiceStatus(invoice: InvoiceRecord, payments: PaymentRecord[], asOf: string = ANCHOR_ISO): InvoiceStatus {
  if (invoice.status === "void") return "void";
  if (invoice.status === "draft") return "not_due";
  const owed = outstanding(invoice, payments);
  if (isZero(owed)) return "paid";
  if (isOverdue(invoice.dueOn, asOf)) return "overdue";
  return daysBetween(invoice.dueOn, asOf) >= 0 ? "due" : "not_due";
}

/** Days past due, 0 when not yet overdue. What "12 days overdue" reads off. */
export function daysOverdue(invoice: InvoiceRecord, payments: PaymentRecord[], asOf: string = ANCHOR_ISO): number {
  if (invoiceStatus(invoice, payments, asOf) !== "overdue") return 0;
  return Math.max(0, daysBetween(invoice.dueOn, asOf));
}

/**
 * Build the credit note that reverses an issued invoice.
 *
 * Lives here rather than in the store because it is a rule about the documents,
 * not about state: a credit note must MIRROR what it reverses — the same lines
 * with the sign flipped, the same tax rates, and the same frozen `billTo`, so
 * the pair nets to exactly zero. A hand-built one that differs anywhere is how a
 * ledger quietly stops balancing.
 *
 * Only the void markers are dropped: the credit note is a live document in its
 * own right, and it carries `creditNoteFor` back to the invoice it cancels.
 */
export function buildCreditNote(original: InvoiceRecord, opts: { id: string; number: string; on: string }): InvoiceRecord {
  return {
    ...original,
    id: opts.id,
    number: opts.number,
    status: "issued",
    issuedOn: opts.on,
    // Nothing is owed on a reversal, so it is due the day it is raised.
    dueOn: opts.on,
    lines: original.lines.map((l) => ({ ...l, unitPrice: { ...l.unitPrice, amount: -l.unitPrice.amount } })),
    voidedOn: undefined,
    voidReason: undefined,
    creditNoteId: undefined,
    creditNoteFor: original.id,
  };
}

/* ------------------------------- numbering --------------------------------- */

/**
 * The next invoice number, and the ONLY place numbering lives.
 *
 * ⚠ NOT PRODUCTION-SAFE. The counter is kept in this browser's localStorage, so
 * two people issuing an invoice at the same time on two machines will both be
 * handed the same number and neither will know. Real invoice numbering has to be
 * allocated by a single authority — a database sequence — and that cannot exist
 * until there is a backend. Everything else in the finance model is designed so
 * that swapping this one function out is the whole change.
 *
 * One continuous sequence, no per-year reset: resetting a sequence safely needs
 * the same single authority, so inventing the ceremony here would only make the
 * gap harder to see.
 */
const INVOICE_SEQ_KEY = "chiya:invoice-seq:v1";
const INVOICE_PREFIX = "INV-";

/** Highest number in the seed — the floor a live number must clear. */
function seedSeqCeiling(): number {
  let max = 0;
  for (const inv of INVOICES) {
    const n = Number(inv.number.replace(INVOICE_PREFIX, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

export function nextInvoiceNumber(): string {
  const floor = seedSeqCeiling();
  let next = floor + 1;
  if (typeof window !== "undefined") {
    try {
      const stored = Number(window.localStorage.getItem(INVOICE_SEQ_KEY));
      if (Number.isFinite(stored) && stored >= next) next = stored + 1;
      window.localStorage.setItem(INVOICE_SEQ_KEY, String(next));
    } catch {}
  }
  return INVOICE_PREFIX + next;
}

/* ------------------------- contract numbering ------------------------------ */

/**
 * THE CONTRACT NUMBER — `S-2026-0009` for a sale, `L-2026-0047` for a lease.
 *
 * Prefix by kind, four-digit year, four-digit sequence, AND THE SEQUENCE RESETS
 * EACH YEAR. That is how the office already numbers its paper, and matching it
 * is not cosmetic: staff read these numbers aloud down a telephone, file them in
 * year folders, and quote them to a notary. A number that did not restart in
 * January would disagree with every physical file in the building by March.
 *
 * Sales and leases run SEPARATE sequences. They are different documents kept in
 * different files, and a shared counter would leave gaps in both.
 *
 * ⚠ NOT PRODUCTION-SAFE — the same limitation as `nextInvoiceNumber`, for the
 * same reason. The counter lives in this browser's localStorage, so two people
 * writing a contract at the same moment on two machines are both handed the same
 * number and neither is told. Real numbering has to be allocated by a single
 * authority — a database sequence — and that cannot exist until there is a
 * backend. Everything else here is arranged so that replacing this one function
 * is the whole change.
 */
const CONTRACT_SEQ_KEY = "chiya:contract-seq:v1";

/** The letter each kind of document is filed under. */
export const CONTRACT_PREFIX: Record<ContractKind, string> = { sale: "S", rent: "L" };

/** Highest sequence already used for this prefix and year, across the seed and
    the live records — the floor a new number has to clear. */
function contractSeqCeiling(prefix: string, year: number, contracts: ContractRecord[]): number {
  const pattern = new RegExp(`^${prefix}-${year}-(\\d{4})$`);
  let max = 0;
  for (const c of contracts) {
    const hit = pattern.exec(c.id);
    if (!hit) continue;
    const n = Number(hit[1]);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

export function nextContractNumber(kind: ContractKind, year: number, contracts: ContractRecord[] = CONTRACTS): string {
  const prefix = CONTRACT_PREFIX[kind];
  /* Keyed by prefix AND year, so January starts at 0001 again without anybody
     clearing anything — the reset falls out of the key rather than needing a
     ceremony that could be forgotten. */
  const storeKey = `${CONTRACT_SEQ_KEY}:${prefix}:${year}`;
  let next = contractSeqCeiling(prefix, year, contracts) + 1;
  if (typeof window !== "undefined") {
    try {
      const stored = Number(window.localStorage.getItem(storeKey));
      if (Number.isFinite(stored) && stored >= next) next = stored + 1;
      window.localStorage.setItem(storeKey, String(next));
    } catch {}
  }
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}

/* ----------------------------------------------------------------------------
   Seed — 12 contracts, one per scenario.

   Written the same way catalog.ts writes its seed: every property, member and
   agent id below already exists there, and a validation block at the end of this
   file throws at module load if any of it fails to reconcile. A seed that does
   not add up is worse than no seed — it teaches the screens built on top of it
   the wrong arithmetic.

   Coverage, one record each:
     CT-0201  signed sale — commission (plus tax) invoiced and PAID
     CT-0202  DRAFT sale in dinars — unsigned, nothing invoiced, property held
     CT-0203  CANCELLED sale whose deposit invoice was already PAID
     CT-0204  tenancy, rent paid to the OWNER — exactly one commission invoice
     CT-0205  tenancy in dinars, rent collected by the AGENCY with a management
              fee — 12 monthly invoices + 1 commission: one paid, one overdue,
              the rest not yet due
     CT-0206  RENEWAL — replaces CT-0207
     CT-0207  the tenancy CT-0206 renewed, run to completion
     CT-0208  completed sale held on EXTERNAL PAPERWORK — commission overdue
     CT-0209  completed sale in dinars, commission split into two instalments
     CT-0210  tenancy to an OFF-PLATFORM tenant (buyerExternal, no member id)
     CT-0211  completed sale, settled long ago
     CT-0212  DRAFT tenancy, agency-collected, with a management fee

   Two things the seed deliberately does NOT do:

   1. It does not rewrite catalog.ts. A DRAFT contract reserves its property
      (see ./property-state.ts), but the catalog's own seed predates contracts
      and still lists CH-3198 and CH-3191 as available. The reservation is
      applied by the transition at runtime, not baked in here, so the two only
      agree once someone drafts a contract through the UI. Signed and completed
      contracts ARE cross-checked against the property's availability below.

   2. It seeds no credit note. `buildCreditNote` exists and the store uses it,
      but the one voided invoice here (CT-0203's commission) was withdrawn when
      the contract was cancelled, before anyone had paid a fils against it —
      there is nothing to reverse.
   ------------------------------------------------------------------------- */

const usd = (major: number): Money => money(major, "USD");
const iqd = (major: number): Money => money(major, "IQD");

/**
 * The rate the dinar contracts below were struck at, as `agreedRate` states it:
 * units of the OTHER currency per 1 unit of the contract's own. A dinar contract
 * reported in dollars therefore carries the reciprocal of the familiar 1,310,
 * not 1,310 itself.
 */
const USD_PER_IQD = 1 / 1310;

/* Commission is stated as a rate and computed, never typed twice. */
function withCommission(price: Money, rate: number): { price: Money; commissionRate: number; commission: Money } {
  return { price, commissionRate: rate, commission: percentOf(price, rate) };
}

/**
 * BOTH SIDES OF THE COMMISSION, as terms rather than one headline figure.
 *
 * Every contract here used to carry `commission` alone — the owner’s side — so
 * the buyer-side and tenant-side fee the app models was never exercised by the
 * seed, and the two-invoice signing nobody could see in the demo.
 *
 * The owner’s term is DERIVED from the same rate as the headline, not typed
 * beside it: the validator asserts the two reconcile, and a figure typed twice
 * is a figure that eventually disagrees with itself. The other side is stated
 * however the parties agreed it — a percentage, a month’s rent, a flat sum, or
 * nothing at all.
 *
 * ⚠ `commission` must stay exactly percentOf(price, rate), so the OWNER side is
 * always a percentage here. A month-based owner fee on a quarterly tenancy
 * cannot be expressed as a clean percentage of the quarter, which is why the
 * month bases appear on the counterparty side.
 */
function fees(
  price: Money,
  ownerRate: number,
  tenant: { basis: CommissionBasis; value?: number },
  monthlyRent?: Money,
): {
  price: Money;
  commissionRate: number;
  commission: Money;
  ownerCommission: CommissionTerm;
  tenantCommission: CommissionTerm;
} {
  const commission = percentOf(price, ownerRate);
  const base = monthlyRent ? { price, monthlyRent } : { price };
  return {
    price,
    commissionRate: ownerRate,
    commission,
    ownerCommission: { basis: "percent", value: ownerRate, amount: commission },
    tenantCommission: {
      basis: tenant.basis,
      ...(tenant.value !== undefined ? { value: tenant.value } : {}),
      amount: commissionAmountFor(tenant.basis, tenant.value, base),
    },
  };
}

/* A tenancy's end date is derived, never typed — see deriveEndsOn. */
function term(startsOn: string, months: number): { startsOn: string; termMonths: number; endsOn: string } {
  return { startsOn, termMonths: months, endsOn: deriveEndsOn(startsOn, months) };
}

export const CONTRACTS: ContractRecord[] = [
  {
    id: "CT-0201",
    template: "sale_full",
    kind: "sale",
    status: "signed",
    propertyId: "CH-3187",
    ownerId: "M-5013",
    buyerId: "M-5006",
    agentId: "A-2107",
    ...fees(usd(720_000), 2.5, { basis: "percent", value: 1 }),
    /* Typed up in April, signed in June, keys handed over at the end of the
       month. Three different dates, and none of them is derivable from another. */
    createdOn: "2026-04-20",
    signedOn: "2026-06-12",
    handoverOn: "2026-06-30",
    dualCurrency: false,
  },
  {
    /* Listed at 900,000,000 IQD; agreed 20,000,000 under. Nothing has been
       signed and nothing has been invoiced — a draft demands no money. */
    id: "CT-0202",
    template: "sale_installments",
    kind: "sale",
    status: "draft",
    propertyId: "CH-3198",
    ownerId: "M-5006",
    buyerId: "M-5010",
    agentId: "A-2107",
    ...fees(usd(672_000), 2.5, { basis: "fixed", value: 2_500 }),
    createdOn: "2026-06-22",
    /* THE ONE INSTALMENT SALE. Without it `installmentSchedule`, the schedule
       table on the printed contract and the instalment invoice run were all
       code nothing in the demo reached. $172,000 down leaves $500,000 over
       twenty quarters — a round split, so the schedule closes to zero without
       a remainder hiding in the last row. */
    downPayment: usd(172_000),
    installmentCount: 20,
    installmentFrequency: "quarterly",
    firstInstallmentOn: "2026-09-01",
    /* The buyer pays the seller directly here; the agency wrote the paper and
       takes its fee, but the price never passes through our account. */
    installmentsPaidTo: "seller",
    clauses: {
      breachPenalty: 33_600,
      evacuationDate: "2026-08-15",
      dailyDelayPenalty: 250,
      registrationDeposit: 10_000,
    },
    dualCurrency: false,
    notes: "Buyer's bank confirmation still outstanding; not sent for signature yet.",
  },
  {
    /* THE CASE THAT PROVES CANCELLED RECORDS SURVIVE. The buyer paid a $5,000
       deposit three weeks before the contract fell through. That payment is
       real money that arrived, and it stays attached to the contract that
       explains why — which is exactly why cancelling never deletes. */
    id: "CT-0203",
    template: "sale_full",
    kind: "sale",
    status: "cancelled",
    propertyId: "CH-3195",
    ownerId: "M-5012",
    buyerId: "M-5001",
    agentId: "A-2107",
    ...fees(usd(320_000), 2.5, { basis: "none" }),
    deposit: usd(5_000),
    createdOn: "2026-05-18",
    cancelledOn: "2026-06-12",
    cancelReason: "Seller's account was suspended pending an ownership check; the sale could not proceed.",
    previousPublication: "published",
    dualCurrency: false,
  },
  {
    /* The tenant pays the landlord directly, so the agency raises ONE invoice
       on the whole tenancy — its own fee — and never touches the rent. */
    id: "CT-0204",
    template: "lease",
    kind: "rent",
    status: "signed",
    propertyId: "CH-3182",
    ownerId: "M-5003",
    buyerId: "M-5009",
    agentId: "A-2105",
    ...fees(usd(2_600), 100, { basis: "half_month" }), // one month from the landlord, half from the tenant
    insuranceDeposit: usd(2_600),
    createdOn: "2025-08-10",
    signedOn: "2025-08-18",
    cycle: "monthly",
    ...term("2025-08-20", 12),
    rentPaidTo: "owner",
    dualCurrency: false,
    notes: "Term runs out in under two months — the owner has been asked whether to renew.",
  },
  {
    /* The agency collects. That is what turns one fee into a thirteen-invoice
       schedule: a rent demand every cycle for the whole term, plus the agency's
       own commission, and an 8% management fee out of each collection. */
    id: "CT-0205",
    template: "lease",
    kind: "rent",
    status: "signed",
    propertyId: "CH-3181",
    ownerId: "M-5007",
    buyerId: "M-5003",
    agentId: "A-2106",
    ...fees(usd(3_400), 100, { basis: "one_month" }),
    /* A flat late charge, and a longer notice period than the app default. */
    clauses: { lateRentPenalty: 25, lateRentBasis: "per_day", noticeDays: 60 },
    insuranceDeposit: usd(6_800), // two months, as a company let usually is
    createdOn: "2026-05-20",
    signedOn: "2026-05-28",
    cycle: "monthly",
    /* Signed on the 28th, term starts on the 1st — the gap is ordinary, and it
       is why rent counts from `startsOn` and not from the signature. */
    ...term("2026-06-01", 12),
    rentPaidTo: "agency",
    managementFee: { type: "percent", value: 8 },
    dualCurrency: false,
  },
  {
    /* A RENEWAL. Points back at the tenancy it follows, which is the only thing
       that makes it a renewal rather than a second, unrelated let. The rent
       went up $50 and the deposit rolled over, so none is taken again. */
    id: "CT-0206",
    template: "lease",
    kind: "rent",
    status: "signed",
    propertyId: "CH-3180",
    ownerId: "M-5010",
    buyerId: "M-5002",
    agentId: "A-2104",
    ...fees(usd(900), 50, { basis: "none" }), // half a month from the landlord; nothing from a renewing tenant
    /* SOMEBODY OTHER THAN THE OWNER SIGNED. The flat belongs to the owner and
       that link is not rewritten — but a company sends whoever holds the seal,
       and a contract that cannot say so misstates who agreed to it. Printed on
       the document, reason and all. */
    signerOverride: {
      name: "Dashne Salih",
      phone: "+964 750 118 3306",
      idNumber: "00318842219",
      reason: "Signs for the owner under a general power of attorney registered in Erbil.",
    },
    createdOn: "2026-06-08",
    signedOn: "2026-06-15",
    cycle: "monthly",
    ...term("2026-06-20", 12),
    rentPaidTo: "owner",
    replacesContractId: "CT-0207",
    dualCurrency: false,
    notes: "Deposit carried over from CT-0207 — not re-taken.",
  },
  {
    id: "CT-0207",
    template: "lease",
    kind: "rent",
    status: "completed",
    propertyId: "CH-3180",
    ownerId: "M-5010",
    buyerId: "M-5002",
    agentId: "A-2104",
    ...fees(usd(850), 100, { basis: "half_month" }),
    insuranceDeposit: usd(850),
    createdOn: "2025-06-12",
    signedOn: "2025-06-19",
    cycle: "monthly",
    ...term("2025-06-20", 12),
    rentPaidTo: "owner",
    dualCurrency: false,
  },
  {
    /* The signed paper is with the notary who handled the title transfer. The
       system holds the terms and the money, and says plainly that it holds no
       document — which is a different thing from a document being missing. */
    id: "CT-0208",
    template: "sale_full",
    kind: "sale",
    status: "completed",
    propertyId: "CH-3185",
    ownerId: "M-5007",
    buyerId: "M-5002",
    agentId: "A-2107",
    ...fees(usd(540_000), 2.5, { basis: "percent", value: 1 }),
    /* The mirror: both sides can perfectly well send a proxy, and the two
       reasons are different reasons — which is why they are two fields. */
    buyerSignerOverride: {
      name: "Hemin Tahir",
      phone: "+964 751 440 7712",
      reason: "Buyer was abroad on the signing date; his brother signed under written authority.",
    },
    createdOn: "2026-01-15",
    signedOn: "2026-05-20",
    handoverOn: "2026-06-12",
    externalPaperwork: true,
    dualCurrency: false,
  },
  {
    /* Listed at 255,000,000 IQD, agreed at 250,000,000. The mandate on this
       listing is 3%, not the standard 2.5%, so the contract states 3% too. */
    id: "CT-0209",
    template: "sale_full",
    kind: "sale",
    status: "completed",
    propertyId: "CH-3186",
    ownerId: "M-5004",
    buyerId: "M-5001",
    agentId: "A-2105",
    ...fees(usd(191_000), 3, { basis: "none" }),
    createdOn: "2026-03-02",
    signedOn: "2026-05-20",
    handoverOn: "2026-06-26",
    dualCurrency: false,
    notes: "Commission split into two equal instalments at the seller's request.",
  },
  {
    /* The tenant never registered, so `buyerId` is absent and `buyerExternal`
       is the only record of who they are anywhere in the system. */
    id: "CT-0210",
    template: "lease",
    kind: "rent",
    status: "signed",
    propertyId: "CH-3183",
    ownerId: "M-5011",
    buyerExternal: { name: "Renas Faiq", phone: "+964 750 902 4417", idNumber: "00219884471" },
    agentId: "A-2107",
    ...fees(usd(1_600), 100, { basis: "half_month" }),
    /* The other way a late charge can be expressed — a percentage of the rent
       per day rather than a flat sum. The same stored number means a different
       obligation under each basis, which is why the seed carries both. */
    clauses: {
      lateRentPenalty: 0.5,
      lateRentBasis: "percent_per_day",
      regretPenalty: 1_600,
      vacateByDate: "2027-07-05",
      dailyVacatePenalty: 50,
    },
    insuranceDeposit: usd(1_600),
    createdOn: "2026-06-10",
    signedOn: "2026-06-26",
    cycle: "monthly",
    ...term("2026-06-30", 12),
    rentPaidTo: "owner",
    dualCurrency: false,
  },
  {
    id: "CT-0211",
    template: "sale_full",
    kind: "sale",
    status: "completed",
    propertyId: "CH-3184",
    ownerId: "M-5002",
    buyerId: "M-5005",
    agentId: "A-2104",
    ...fees(usd(260_000), 2.5, { basis: "fixed", value: 1_500 }),
    createdOn: "2025-11-20",
    signedOn: "2026-01-28",
    handoverOn: "2026-02-10",
    dualCurrency: false,
  },
  {
    id: "CT-0212",
    template: "lease",
    kind: "rent",
    status: "draft",
    propertyId: "CH-3191",
    ownerId: "M-5010",
    buyerId: "M-5008",
    agentId: "A-2104",
    /* THE ONE QUARTERLY TENANCY. Every other lease here bills monthly, so
       `cycleCount`, the period label on a rent invoice ("Jul – Sep 2026") and
       the monthly-rate column on a receipt were reachable only in theory. The
       monthly rate is STATED because the price is the quarter: the two are one
       figure seen two ways, and the validator asserts price = 3 × monthly. */
    ...fees(usd(2_700), 50, { basis: "one_month" }, usd(900)),
    monthlyRent: usd(900),
    insuranceDeposit: usd(900),
    createdOn: "2026-06-26",
    cycle: "quarterly",
    clauses: { noticeDays: 90 },
    ...term("2026-07-15", 12),
    rentPaidTo: "agency",
    managementFee: { type: "percent", value: 8 },
    dualCurrency: false,
    notes: "Tenant has asked for a mid-July start; awaiting the owner's signature.",
  },
];

/* -------------------------------- invoices ---------------------------------
   Numbered in one continuous sequence, in the order they were issued. The billTo
   blocks are written out in full rather than looked up: that is the point of a
   snapshot — editing a member later must not rewrite an issued document.
   ------------------------------------------------------------------------- */

/* Bill-to snapshots, as the parties were on the day each invoice went out. */
const BT = {
  shilan: { name: "Shilan Aziz", phone: "+964 770 331 5124", email: "shilan.aziz@gmail.com", address: "Villa 21, Italian Village, Erbil" },
  chiman: { name: "Chiman Rasul", phone: "+964 751 267 9145", email: "chiman.rasul@gmail.com", address: "House 44, English Village, Erbil" },
  avan: { name: "Avan Mustafa", phone: "+964 770 460 1173", email: "avan.mustafa@gmail.com", address: "Apt 12, Bakhtiari, Sulaymaniyah" },
  awat: { name: "Awat Faraj", phone: "+964 773 350 1287", email: "awat.faraj@gmail.com", address: "Floor 5, Gulan Tower, Gulan Street, Erbil", taxId: "IQ-TX-220914" },
  zana: { name: "Zana Ibrahim", phone: "+964 750 739 2264", email: "zana.ibrahim@gmail.com", address: "House 8, Malta, Duhok" },
  hersh: { name: "Hersh Qadir", phone: "+964 751 448 2019", email: "hersh.qadir@gmail.com", address: "Plot 7, Ankawa, Erbil" },
  nma: { name: "Nma Rashid", phone: "+964 773 902 6641", email: "nma.rashid@gmail.com", address: "Apt 3A, Dream City, Erbil" },
  kani: { name: "Kani Omar", phone: "+964 773 514 6098", email: "kani.omar@gmail.com", address: "Villa 9, Sarchnar, Sulaymaniyah" },
  tara: { name: "Tara Botan", phone: "+964 750 605 7812", email: "tara.botan@gmail.com", address: "House 61, Nizarke, Duhok" },
} satisfies Record<string, BillTo>;

/** Shorthand for the common single-quantity line. */
function line(id: string, description: string, unitPrice: Money, taxRate = 0, quantity = 1): InvoiceLine {
  return { id, description, quantity, unitPrice, taxRate };
}

/** A seeded line that also carries its catalog key, so it reads in the viewer's
    language instead of the English it was typed in. See InvoiceLine.descriptionKey. */
function tline(id: string, key: string, params: Record<string, string | number>, description: string, unitPrice: Money): InvoiceLine {
  return { id, description, descriptionKey: key, descriptionParams: params, quantity: 1, unitPrice, taxRate: 0 };
}

/**
 * The rent schedule on an agency-collected tenancy: one invoice per cycle for
 * the whole term, raised together when the contract is signed.
 *
 * Generated rather than typed out twelve times. Typing them would put twelve
 * chances to fat-finger a due date into the seed, and the whole point of the
 * schedule is that the dates step evenly.
 */
function rentSchedule(opts: {
  contractId: string;
  prefix: string;
  firstNumber: number;
  issuedOn: string;
  startsOn: string;
  cycle: RentCycle;
  count: number;
  amount: Money;
  /** Absent when the tenant holds no account — most tenants here. */
  billToId?: string;
  billTo: BillTo;
  label: string;
  /** The property on its own, for the translatable form of the same line. */
  property: string;
}): InvoiceRecord[] {
  const [y, m, d] = opts.startsOn.split("-").map(Number);
  const step = CYCLE_MONTHS[opts.cycle];
  const p2 = (n: number) => String(n).padStart(2, "0");
  /* The frozen text spells the period out the way a person reads it rather than
     as an ISO stub. The line ALSO carries its key and its cycle, so the same
     period re-renders in Arabic or Kurdish for a reader who wants it — see
     InvoiceLine.descriptionKey. */
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return Array.from({ length: opts.count }, (_, i) => {
    const due = new Date(y, m - 1 + i * step, d);
    const dueOn = `${due.getFullYear()}-${p2(due.getMonth() + 1)}-${p2(due.getDate())}`;
    const period = `${MON[due.getMonth()]} ${due.getFullYear()}`;
    return {
      id: `${opts.prefix}-R${p2(i + 1)}`,
      number: INVOICE_PREFIX + (opts.firstNumber + i),
      contractId: opts.contractId,
      category: "rent" as const,
      /* The landlord's money on EVERY tenancy — who physically collects it is
         a different question, and it is `rentPaidTo` that answers that one. */
      payee: "owner" as const,
      status: "issued" as const,
      issuedOn: opts.issuedOn,
      dueOn,
      ...(opts.billToId ? { billToId: opts.billToId } : {}),
      billTo: opts.billTo,
      lines: [
        {
          id: "L1",
          description: `${opts.label} — ${period}`,
          descriptionKey: "admin.fin.desc.rentPeriod",
          descriptionParams: { property: opts.property },
          descriptionPeriod: { dueOn, months: step },
          quantity: 1,
          unitPrice: opts.amount,
          taxRate: 0,
        },
      ],
    };
  });
}

export const INVOICES: InvoiceRecord[] = [
  {
    id: "INV-0207-C",
    number: "INV-1001",
    contractId: "CT-0207",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2025-06-16",
    dueOn: "2025-06-20",
    billToId: "M-5010",
    billTo: BT.tara,
    lines: [tline("L1", "admin.fin.desc.commissionLandlord", { months: 12, property: "Nizarke Sunset Terrace" }, "Agency commission — 12-month tenancy, Nizarke Sunset Terrace", usd(850))],
  },
  {
    id: "INV-0204-C",
    number: "INV-1002",
    contractId: "CT-0204",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2025-08-18",
    dueOn: "2025-08-25",
    billToId: "M-5003",
    billTo: BT.kani,
    lines: [tline("L1", "admin.fin.desc.commissionLandlord", { months: 12, property: "Sarchnar Cypress Villa" }, "Agency commission — 12-month tenancy, Sarchnar Cypress Villa", usd(2_600))],
  },
  {
    id: "INV-0211-C",
    number: "INV-1003",
    contractId: "CT-0211",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-02-10",
    dueOn: "2026-02-24",
    billToId: "M-5002",
    billTo: BT.zana,
    lines: [tline("L1", "admin.fin.desc.commissionSale", { property: "Malta Summit Grounds" }, "Agency commission — sale of Malta Summit Grounds", usd(6_500))],
  },
  {
    id: "INV-0203-D",
    number: "INV-1004",
    contractId: "CT-0203",
    category: "deposit",
    /* THE SELLER'S. Money down to take the property off the market is part of
       the price — see the note on ContractDraft.deposit — so it passes through
       the agency exactly as an instalment does. It was marked "agency" here,
       which read a fifth of a percent of the book as revenue. */
    payee: "owner",
    status: "issued",
    issuedOn: "2026-05-22",
    dueOn: "2026-06-05",
    billToId: "M-5001",
    billTo: BT.avan,
    lines: [tline("L1", "admin.fin.desc.saleDeposit", { property: "Ankawa Olive Grove Land" }, "Reservation deposit — Ankawa Olive Grove Land", usd(5_000))],
  },
  {
    /* Withdrawn when the contract was cancelled. Voided, not deleted: it went
       out, and a document that went out is a record. Nothing had been paid
       against it, so there is no credit note to reverse. */
    id: "INV-0203-C",
    number: "INV-1005",
    contractId: "CT-0203",
    category: "commission",
    payee: "agency",
    status: "void",
    issuedOn: "2026-05-22",
    dueOn: "2026-07-05",
    billToId: "M-5012",
    billTo: BT.hersh,
    lines: [tline("L1", "admin.fin.desc.commissionSale", { property: "Ankawa Olive Grove Land" }, "Agency commission — sale of Ankawa Olive Grove Land", usd(8_000))],
    voidedOn: "2026-06-12",
    voidReason: "Contract cancelled before completion — no commission is due.",
  },
  {
    id: "INV-0209-1",
    number: "INV-1006",
    contractId: "CT-0209",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-05-26",
    dueOn: "2026-06-10",
    billToId: "M-5004",
    billTo: BT.chiman,
    lines: [tline("L1", "admin.fin.desc.commissionInstalment", { index: 1, count: 2, property: "Bakhtiari Pearl Flat" }, "Agency commission — instalment 1 of 2, Bakhtiari Pearl Flat", usd(2_865))],
  },
  {
    id: "INV-0209-2",
    number: "INV-1007",
    contractId: "CT-0209",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-05-26",
    dueOn: "2026-08-10",
    billToId: "M-5004",
    billTo: BT.chiman,
    lines: [tline("L1", "admin.fin.desc.commissionInstalment", { index: 2, count: 2, property: "Bakhtiari Pearl Flat" }, "Agency commission — instalment 2 of 2, Bakhtiari Pearl Flat", usd(2_865))],
  },
  {
    id: "INV-0205-C",
    number: "INV-1008",
    contractId: "CT-0205",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-05-28",
    dueOn: "2026-06-10",
    billToId: "M-5007",
    billTo: BT.awat,
    lines: [tline("L1", "admin.fin.desc.commissionLandlord", { months: 12, property: "Ankawa Tower Suite" }, "Agency commission — 12-month tenancy, Ankawa Tower Suite", usd(3_400))],
  },
  /* CT-0205's twelve rent demands, INV-1009 … INV-1020. The first is 29 days
     past due against the seed anchor; the rest have not fallen due yet. */
  ...rentSchedule({
    contractId: "CT-0205",
    prefix: "INV-0205",
    firstNumber: 1009,
    issuedOn: "2026-05-28",
    startsOn: "2026-06-01",
    cycle: "monthly",
    count: 12,
    amount: usd(3_400),
    billToId: "M-5003",
    billTo: BT.kani,
    label: "Rent — Ankawa Tower Suite",
    property: "Ankawa Tower Suite",
  }),
  /* A TENANCY THE LANDLORD COLLECTS HIMSELF, and it is invoiced exactly like
     the agency-collected one above. That is the whole point: the office wrote
     the tenancy and manages it, so rent falls due on the first of the month
     whichever pocket the cash lands in. Who collects only changes what happens
     to the money afterwards. Term starts on the anchor, so one demand has
     fallen due and eleven have not. */
  ...rentSchedule({
    contractId: "CT-0210",
    prefix: "INV-0210",
    firstNumber: 1025,
    issuedOn: "2026-06-26",
    startsOn: "2026-06-30",
    cycle: "monthly",
    count: 12,
    amount: usd(1_600),
    billTo: { name: "Renas Faiq", phone: "+964 750 902 4417", email: "", address: "" },
    label: "Rent — Zaytun Court",
    property: "Zaytun Court",
  }),
  {
    /* Past due and unpaid: due 2026-06-18 against the 2026-06-30 anchor, so this
       reads as 12 days overdue. Nothing stores that — invoiceStatus() derives it. */
    id: "INV-0208-C",
    number: "INV-1021",
    contractId: "CT-0208",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-06-12",
    dueOn: "2026-06-18",
    billToId: "M-5007",
    billTo: BT.awat,
    lines: [tline("L1", "admin.fin.desc.commissionSale", { property: "Gulan Tower Office" }, "Agency commission — sale of Gulan Tower Office", usd(13_500))],
  },
  {
    id: "INV-0206-C",
    number: "INV-1022",
    contractId: "CT-0206",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-06-15",
    dueOn: "2026-06-29",
    billToId: "M-5010",
    billTo: BT.tara,
    lines: [tline("L1", "admin.fin.desc.commissionRenewal", { property: "Nizarke Sunset Terrace" }, "Renewal commission — Nizarke Sunset Terrace", usd(450))],
  },
  {
    /* The only seed invoice carrying tax, so the per-line tax path is exercised. */
    id: "INV-0201-C",
    number: "INV-1023",
    contractId: "CT-0201",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-06-30",
    dueOn: "2026-07-14",
    billToId: "M-5013",
    billTo: BT.shilan,
    lines: [
      /* A taxed, hand-written invoice — the tax rate makes it the one seeded
         document nobody generated, so its second line stays untranslatable
         plain text on purpose. See InvoiceLine.descriptionKey. */
      { ...tline("L1", "admin.fin.desc.commissionSale", { property: "Olive Grove Estate" }, "Agency commission — sale of Olive Grove Estate", usd(18_000)), taxRate: 5 },
      line("L2", "Title transfer handling", usd(1_200), 5),
    ],
  },
  {
    /* Due on receipt — the fee falls due the day the keys change hands, which
       is what puts a "Due" row on this screen rather than a "Not due" one. */
    id: "INV-0210-C",
    number: "INV-1024",
    contractId: "CT-0210",
    category: "commission",
    payee: "agency",
    status: "issued",
    issuedOn: "2026-06-30",
    dueOn: "2026-06-30",
    billToId: "M-5011",
    billTo: BT.nma,
    lines: [tline("L1", "admin.fin.desc.commissionLandlord", { months: 12, property: "Empire World Loft" }, "Agency commission — 12-month tenancy, Empire World Loft", usd(1_600))],
  },
];

/* -------------------------------- payments --------------------------------- */

/* The ordinary case: paid in the same currency the invoice demands, so what
   arrived and what was credited are the same amount. */
const paidAs = (m: Money) => ({ receivedAmount: m, receivedCurrency: m.currency, amount: m });

/* Paid in a DIFFERENT currency from the invoice — cash dinars against a dollar
   invoice, which is routine here. `received` is what came in, `rate` is what it
   was converted at on the day, and the credit is derived from the two so the
   three can never disagree. */
const paidIn = (received: Money, invoiceCur: CurrencyCode, rate: number) => ({
  receivedAmount: received,
  receivedCurrency: received.currency,
  rateApplied: rate,
  amount: convert(received, invoiceCur, rate),
});

export const PAYMENTS: PaymentRecord[] = [
  { id: "PAY-6001", invoiceId: "INV-0207-C", ...paidAs(usd(850)), receivedOn: "2025-06-19", method: "bank_transfer", reference: "TRF-250619-8841", recordedBy: "u-rawa" },
  /* Cash dinars against a dollar invoice — the ordinary way a tenancy gets
     settled here, and the case the receivedAmount fields exist for. 3,406,000
     IQD at 1,310 to the dollar credits exactly $2,600. The receipt says dinars
     because dinars are what changed hands. */
  { id: "PAY-6002", invoiceId: "INV-0204-C", ...paidIn(iqd(3_406_000), "USD", USD_PER_IQD), receivedOn: "2025-08-22", method: "cash", reference: "RCPT-2508-118", recordedBy: "u-sara" },
  { id: "PAY-6003", invoiceId: "INV-0211-C", ...paidAs(usd(6_500)), receivedOn: "2026-02-20", method: "bank_transfer", reference: "TRF-260220-4415", recordedBy: "u-rawa" },
  /* Paid three weeks before the contract fell through — and it stays on the
     record afterwards, attached to a cancelled contract. */
  { id: "PAY-6004", invoiceId: "INV-0203-D", ...paidAs(usd(5_000)), receivedOn: "2026-05-29", method: "card", reference: "POS-260529-0442", recordedBy: "u-lana" },
  { id: "PAY-6005", invoiceId: "INV-0205-C", ...paidAs(usd(3_400)), receivedOn: "2026-06-05", method: "bank_transfer", reference: "TRF-260605-7731", recordedBy: "u-rebin" },
  { id: "PAY-6006", invoiceId: "INV-0209-1", ...paidAs(usd(2_865)), receivedOn: "2026-06-08", method: "bank_transfer", reference: "TRF-260608-5528", recordedBy: "u-sara" },
  { id: "PAY-6007", invoiceId: "INV-0206-C", ...paidAs(usd(450)), receivedOn: "2026-06-22", method: "bank_transfer", reference: "TRF-260622-6183", recordedBy: "u-rawa" },
  /* Settled out of the completion funds on the day of handover. */
  { id: "PAY-6008", invoiceId: "INV-0201-C", ...paidAs(usd(20_160)), receivedOn: "2026-06-30", method: "bank_transfer", reference: "TRF-260630-1120", recordedBy: "u-lana" },
  /* RENT, THROUGH THE AGENCY. June on the Ankawa suite: the tenant paid us, so
     the money is the landlord's and it is sitting in our account until he comes
     for it. This is the payment the owner ledger below hangs off, and the one
     that makes the payouts screen, the landlord's card on the contract and the
     money report show real figures instead of zeroes. */
  { id: "PAY-6009", invoiceId: "INV-0205-R01", ...paidAs(usd(3_400)), receivedOn: "2026-06-03", method: "cash", reference: "RCPT-2606-241", recordedBy: "u-sara" },
  /* RENT, STRAIGHT TO THE LANDLORD. The same event recorded, and deliberately
     NO ledger line: the cash never entered the agency's account, so there is
     nothing to hold and nothing to hand over. Both parties still get a paper —
     see the two receipt links on the invoice row. */
  { id: "PAY-6010", invoiceId: "INV-0210-R01", ...paidAs(usd(1_600)), receivedOn: "2026-06-30", method: "cash", reference: "", recordedBy: "u-lana" },
];

/* -------------------------- the owner ledger ------------------------------- */

/**
 * WHAT THE AGENCY IS HOLDING FOR SOMEBODY ELSE, seeded.
 *
 * One collection: PAY-6009, June's rent on CT-0205. It produces the pair the
 * ledger always writes — the money in, and the management fee out — leaving
 * $3,128 owed to the landlord. Written here rather than derived because a
 * ledger line records what happened on a day, and the fee rate, the exchange
 * rate and any part payment all belong to that day (see the header of
 * ../_data/owner-ledger).
 *
 * ⚠ PAY-6010 HAS NO LINES HERE, and that is the point of having both. That
 * tenant paid his landlord directly; the agency never held a penny of it, so
 * there is nothing to owe him. A `collected` line there would invent a debt to
 * a landlord who has already been paid.
 */
export const LEDGER: OwnerLedgerEntry[] = [
  {
    id: "LED-5001",
    ownerId: "M-5007",
    contractId: "CT-0205",
    invoiceId: "INV-0205-R01",
    paymentId: "PAY-6009",
    kind: "collected",
    amount: usd(3_400),
    on: "2026-06-03",
    description: "Rent — Ankawa Tower Suite — Jun 2026",
  },
  {
    id: "LED-5002",
    ownerId: "M-5007",
    contractId: "CT-0205",
    invoiceId: "INV-0205-R01",
    paymentId: "PAY-6009",
    kind: "fee",
    /* Negative, like every kind that leaves the balance. 8% of the cycle's
       rent, which is what CT-0205's management fee states. */
    amount: usd(-272),
    on: "2026-06-03",
    description: "Management fee on INV-1009",
  },
];

/* ----------------------------------------------------------------------------
   Seed validation — runs at module load, exactly like catalog.ts's cross-link
   checks. A seed whose money does not add up would teach every screen built on
   it the wrong arithmetic, so it fails the dev server instead of rendering.
   ------------------------------------------------------------------------- */
{
  const propertyById = new Map(PROPERTIES.map((p) => [p.id, p]));
  const contractById = new Map(CONTRACTS.map((c) => [c.id, c]));
  const invoiceById = new Map(INVOICES.map((i) => [i.id, i]));

  if (contractById.size !== CONTRACTS.length) throw new Error("contracts: duplicate contract id");
  if (invoiceById.size !== INVOICES.length) throw new Error("contracts: duplicate invoice id");
  if (new Set(PAYMENTS.map((p) => p.id)).size !== PAYMENTS.length) throw new Error("contracts: duplicate payment id");

  /* Which contracts have been superseded — a replaced contract is history, so
     the property-state checks below skip it. */
  const replaced = new Set(CONTRACTS.map((c) => c.replacesContractId).filter(Boolean) as string[]);

  for (const c of CONTRACTS) {
    const property = propertyById.get(c.propertyId);
    if (!property) throw new Error(`contracts: ${c.id} references unknown property "${c.propertyId}"`);
    if (!agentById(c.agentId)) throw new Error(`contracts: ${c.id} references unknown agent "${c.agentId}"`);
    if (!memberById(c.ownerId)) throw new Error(`contracts: ${c.id} references unknown owner "${c.ownerId}"`);
    if (c.buyerId && !memberById(c.buyerId)) throw new Error(`contracts: ${c.id} references unknown buyer "${c.buyerId}"`);

    /* The owner side is the property's owner — always. A contract naming a
       different seller means one of the two records is wrong about who owns it. */
    if (property.ownerId && property.ownerId !== c.ownerId) {
      throw new Error(`contracts: ${c.id} names ${c.ownerId} as owner but ${property.id} belongs to ${property.ownerId}`);
    }
    if (property.listing !== c.kind) throw new Error(`contracts: ${c.id} is a ${c.kind} contract on a ${property.listing} listing`);
    /* Currency flows property → contract → invoice and is never re-decided. */
    if (property.price.currency !== c.price.currency) {
      throw new Error(`contracts: ${c.id} is priced in ${c.price.currency} on a ${property.price.currency} listing`);
    }

    /* A counterparty is either a member or an external block, never both — two
       records of who the same person is will disagree eventually. */
    if (c.buyerId && c.buyerExternal) throw new Error(`contracts: ${c.id} has both a linked and an external counterparty`);

    /* Dates. The three are independent facts, and each state needs its own. */
    if (c.status === "draft" && c.signedOn) throw new Error(`contracts: draft ${c.id} carries a signedOn — a draft is by definition unsigned`);
    if ((c.status === "signed" || c.status === "completed") && !c.signedOn) throw new Error(`contracts: ${c.id} is ${c.status} but has no signedOn`);
    if (c.status === "cancelled" && !c.cancelledOn) throw new Error(`contracts: ${c.id} is cancelled but has no cancelledOn`);
    if (c.status === "cancelled" && !c.cancelReason) throw new Error(`contracts: cancelled ${c.id} has no reason — "cancelled" with no reason is unusable in a report`);
    if (c.signedOn && daysBetween(c.createdOn, c.signedOn) < 0) throw new Error(`contracts: ${c.id} was signed before it was written`);

    /* Tenancy terms. `endsOn` is DERIVED, so the stored one has to be the one
       deriveEndsOn would produce — otherwise the two disagree the first time
       anything recomputes it. */
    if (c.kind === "rent") {
      if (!c.cycle) throw new Error(`contracts: tenancy ${c.id} has no billing cycle`);
      if (!c.termMonths) throw new Error(`contracts: tenancy ${c.id} has no term`);
      if (!c.startsOn) throw new Error(`contracts: tenancy ${c.id} has no start date`);
      if (!c.rentPaidTo) throw new Error(`contracts: tenancy ${c.id} does not say who the tenant pays`);
      if (c.endsOn !== deriveEndsOn(c.startsOn!, c.termMonths!)) {
        throw new Error(`contracts: tenancy ${c.id} stores endsOn ${c.endsOn}, but ${c.termMonths} months from ${c.startsOn} ends ${deriveEndsOn(c.startsOn!, c.termMonths!)}`);
      }
      if (c.termMonths % CYCLE_MONTHS[c.cycle] !== 0) throw new Error(`contracts: tenancy ${c.id} runs ${c.termMonths} months, which is not a whole number of ${c.cycle} cycles`);
    } else {
      if (c.cycle || c.termMonths || c.startsOn || c.endsOn || c.rentPaidTo || c.managementFee) {
        throw new Error(`contracts: sale ${c.id} carries tenancy terms`);
      }
    }
    /* A management fee only means something when the agency collects the rent. */
    if (c.managementFee && c.rentPaidTo !== "agency") throw new Error(`contracts: ${c.id} charges a management fee but the owner collects the rent`);

    /* Commission must BE the rate applied to the price, not a number that
       merely looks close to it. */
    const expected = percentOf(c.price, c.commissionRate);
    if (compareMoney(expected, c.commission) !== 0) {
      throw new Error(`contracts: ${c.id} commission does not reconcile — ${c.commissionRate}% of the price is not the stored amount`);
    }
    /**
     * ⚠ A SEED RULE, NOT THE APP'S. Every sale written here follows its
     * property's mandate, and differing from it needs a reason on the record.
     * A contract WRITTEN IN THE APP no longer starts from the mandate at all —
     * it starts at DEFAULT_SALE_COMMISSION_RATE — so this holds the hand-curated
     * records to what they claim about each other and nothing more. It runs over
     * the seed at module load and never over anything the form saves.
     *
     * A TENANCY is deliberately not checked. Its rate is stated against one
     * cycle's rent while the mandate's is stated against the whole term, so the
     * two numbers measure different things and "3 ≠ 100" would be a false
     * alarm. Cross-checking them properly needs the mandate to say which base
     * it means, which is a change to catalog.ts and its own piece of work.
     */
    if (c.kind === "sale" && property.mandate && property.mandate.commissionRate !== c.commissionRate && !c.commissionOverrideReason) {
      throw new Error(`contracts: ${c.id} is at ${c.commissionRate}% but ${property.id}'s mandate says ${property.mandate.commissionRate}% — state a commissionOverrideReason or fix the mandate`);
    }
    if (c.deposit && c.deposit.currency !== c.price.currency) throw new Error(`contracts: ${c.id} deposit is in a different currency from the price`);

    /* ---- template, and everything that hangs off it ---- */

    /* A template always implies its kind. The two disagreeing would mean a lease
       document on a sale, which no screen further down could recover from. */
    if (c.template && templateKind(c.template) !== c.kind) {
      throw new Error(`contracts: ${c.id} is a "${c.template}" document on a ${c.kind} contract`);
    }

    /* Clause variables must belong to the template that prints them. A lease
       carrying an `evacuationDate` is a field nothing will ever render, which is
       how a value someone typed goes quietly missing from the document. */
    if (c.clauses) {
      const allowed = new Set<string>(clauseKeysFor(templateOf(c)));
      for (const key of Object.keys(c.clauses)) {
        if (!allowed.has(key)) throw new Error(`contracts: ${c.id} states clause "${key}", which a ${templateOf(c)} document does not print`);
      }
    }

    /* The monthly rate and the per-cycle price are two views of one figure, and
       a record where they disagree would print one number and invoice another. */
    if (c.monthlyRent) {
      if (c.monthlyRent.currency !== c.price.currency) throw new Error(`contracts: ${c.id} states a monthly rent in a different currency from the price`);
      if (c.cycle && compareMoney(multiply(c.monthlyRent, CYCLE_MONTHS[c.cycle]), c.price) !== 0) {
        throw new Error(`contracts: ${c.id} bills ${c.cycle} but its price is not ${CYCLE_MONTHS[c.cycle]} × the stated monthly rent`);
      }
    }

    /* Each commission must BE its basis applied to the agreed figures, for the
       same reason the legacy single commission must — an amount that merely
       looks right beside its rate is an amount nobody can check. */
    for (const [label, term] of [
      ["owner", c.ownerCommission],
      ["tenant", c.tenantCommission],
    ] as const) {
      if (!term) continue;
      if (term.amount.currency !== c.price.currency) throw new Error(`contracts: ${c.id} ${label} commission is in a different currency from the price`);
      if (term.basis === "none" && !isZero(term.amount)) throw new Error(`contracts: ${c.id} ${label} commission has basis "none" but a non-zero amount`);
      const expectedTerm = commissionAmountFor(term.basis, term.value, c);
      if (compareMoney(expectedTerm, term.amount) !== 0) {
        throw new Error(`contracts: ${c.id} ${label} commission does not reconcile — "${term.basis}" of the agreed figures is not the stored amount`);
      }
    }
    /* `commission` is the OWNER's side on every record, legacy or not — see the
       note on ownerCommission. A record carrying both must say the same thing
       twice or neither figure can be trusted. */
    if (c.ownerCommission && compareMoney(c.ownerCommission.amount, c.commission) !== 0) {
      throw new Error(`contracts: ${c.id} states an owner commission that differs from its headline commission`);
    }
    /* A SALE HAS NO MONTHS TO COUNT. The month-based bases measure against the
       monthly rent, and a sale has none — `commissionAmountFor` would fall back
       to the price and quietly bill half of it. A sale states a percentage or a
       flat sum, on either side; the rule used to be "a sale has no buyer-side
       charge at all", which stopped being true when buyers started paying one. */
    if (c.kind === "sale") {
      for (const [label, term] of [
        ["owner", c.ownerCommission],
        ["tenant", c.tenantCommission],
      ] as const) {
        if (term && (term.basis === "half_month" || term.basis === "one_month")) {
          throw new Error(`contracts: sale ${c.id} states its ${label} commission as "${term.basis}" — a sale has no monthly rent to measure against`);
        }
      }
    }

    /* ---- the insurance deposit ----

       ⚠ THE TWO DEPOSIT FIELDS ARE NOT INTERCHANGEABLE, and putting a tenancy
       deposit in the wrong one is silent. `deposit` is a SALE’s holding
       deposit: consideration, invoiced, part of the price. `insuranceDeposit`
       is the TENANT’S money held against damage: never invoiced as income,
       counted under "Deposits held", and the only one with a lifecycle.

       Five seeded tenancies carried theirs in `deposit` for a while. Nothing
       failed. What happened instead is that `isDepositHeld` came back false for
       every one of them, so "Deposits held" read zero, no ended lease was ever
       flagged, and Close lease — the whole point of the lifecycle — could not
       be reached on any contract in the app. Hence the check below. */
    if (c.kind === "rent" && c.deposit) {
      throw new Error(`contracts: tenancy ${c.id} uses "deposit" — a tenancy’s security deposit is "insuranceDeposit"`);
    }
    if (c.insuranceDeposit) {
      if (c.kind !== "rent") throw new Error(`contracts: sale ${c.id} holds an insurance deposit — that is a tenancy term`);
      if (c.insuranceDeposit.currency !== c.price.currency) throw new Error(`contracts: ${c.id} insurance deposit is in a different currency from the rent`);
    }
    if (c.depositStatus && !c.insuranceDeposit) throw new Error(`contracts: ${c.id} states what became of a deposit it never held`);
    if (c.depositStatus === "partly_returned" && (!c.depositDeduction || !c.depositDeductionReason)) {
      throw new Error(`contracts: ${c.id} deducted from a deposit without stating both an amount and a reason`);
    }
    if (c.depositStatus === "carried_forward" && !c.depositCarriedToContractId) {
      throw new Error(`contracts: ${c.id} carried a deposit forward but names no contract it went to — the money would be untraceable`);
    }
    if (c.depositDeduction && c.depositStatus !== "partly_returned") {
      throw new Error(`contracts: ${c.id} records a deposit deduction but is not "partly_returned"`);
    }

    /* ---- money down at signing ----
       Checked on ANY sale, not only an instalment one: a buyer paying in full
       can still put money down on the day, and the two ways that figure can be
       wrong — a different currency from the price, or more than the price — are
       wrong whichever way the balance is then paid. */
    if (c.downPayment && c.downPayment.currency !== c.price.currency) throw new Error(`contracts: ${c.id} down payment is in a different currency from the price`);
    if (c.downPayment && compareMoney(c.downPayment, c.price) > 0) throw new Error(`contracts: ${c.id} down payment exceeds the price`);

    /* ---- instalments ---- */
    if (hasInstallments(c)) {
      if (!c.installmentFrequency) throw new Error(`contracts: instalment sale ${c.id} states no frequency`);
      if (!c.firstInstallmentOn) throw new Error(`contracts: instalment sale ${c.id} states no first due date`);
      if (!c.installmentsPaidTo) throw new Error(`contracts: instalment sale ${c.id} does not say who the buyer pays — see InstallmentsPaidTo`);
      /* The schedule must close the balance exactly. Asserted rather than
         assumed: it is the one property of splitIntoInstallments everything
         downstream relies on, and an unpayable final invoice is the failure. */
      const schedule = installmentSchedule(c);
      const closing = schedule[schedule.length - 1]?.balanceAfter;
      if (closing && !isZero(closing)) throw new Error(`contracts: ${c.id} instalment schedule does not close to zero`);
    } else if (c.installmentCount || c.installmentFrequency || c.firstInstallmentOn) {
      throw new Error(`contracts: ${c.id} carries instalment terms but is not an instalment sale`);
    }

    /* ---- who signed ---- */
    if (c.signerOverride && !c.signerOverride.reason.trim()) {
      throw new Error(`contracts: ${c.id} names a substitute signer with no stated reason — that is the fact a dispute turns on`);
    }
    if (c.buyerSignerOverride && !c.buyerSignerOverride.reason.trim()) {
      throw new Error(`contracts: ${c.id} names a substitute signer with no stated reason — that is the fact a dispute turns on`);
    }
    if (c.amendments?.length && c.status === "draft") {
      throw new Error(`contracts: draft ${c.id} carries amendments — a draft is edited, not amended`);
    }

    /* A frozen rate is required exactly when something needs one: a contract not
       in the platform currency (so its value can be reported alongside the rest)
       or one settling in a second currency. Forbidden otherwise, so a stale rate
       cannot sit unnoticed on a record that never consults it. */
    const needsRate = c.price.currency !== PLATFORM_CURRENCY || c.dualCurrency;
    if (needsRate && !c.agreedRate) throw new Error(`contracts: ${c.id} needs a frozen agreedRate (currency ${c.price.currency}, dualCurrency ${c.dualCurrency})`);
    if (!needsRate && c.agreedRate) throw new Error(`contracts: ${c.id} carries an agreedRate but nothing on it uses one`);
    if (c.agreedRate && !c.agreedRateSetOn) throw new Error(`contracts: ${c.id} has an agreedRate with no agreedRateSetOn — a rate with no date is not a term`);
    if (c.dualCurrency && !c.secondaryCurrency) throw new Error(`contracts: ${c.id} is dual-currency but names no secondaryCurrency`);
    if (c.secondaryCurrency && c.secondaryCurrency === c.price.currency) throw new Error(`contracts: ${c.id} settles in the same currency it is denominated in`);
    if (!c.dualCurrency && c.secondaryCurrency) throw new Error(`contracts: ${c.id} names a secondaryCurrency but is not dual-currency`);

    /* A replacement points at a real, earlier contract on the SAME property —
       that is what makes a renewal chain a chain rather than two loose records. */
    if (c.replacesContractId) {
      const prior = contractById.get(c.replacesContractId);
      if (!prior) throw new Error(`contracts: ${c.id} replaces missing contract "${c.replacesContractId}"`);
      if (prior.id === c.id) throw new Error(`contracts: ${c.id} replaces itself`);
      if (prior.propertyId !== c.propertyId) throw new Error(`contracts: ${c.id} replaces a contract on a different property`);
    }

    /* A contract in force has taken the property off the market, and the
       catalog has to agree. Skipped for drafts (the reservation is applied by
       the transition at runtime, not baked into catalog.ts — see the seed note)
       and for contracts a later one has replaced. */
    if (!replaced.has(c.id) && (c.status === "signed" || (c.status === "completed" && c.kind === "sale"))) {
      const want = c.kind === "sale" ? "sold" : "rented";
      if (property.availability !== want) {
        throw new Error(`contracts: ${c.id} is ${c.status} but ${property.id} reads "${property.availability}" rather than "${want}"`);
      }
    }
  }

  /* Invoices: numbering, currency, and the derived-totals contract. */
  const numbers = INVOICES.filter((i) => i.number).map((i) => i.number);
  if (new Set(numbers).size !== numbers.length) throw new Error("contracts: two invoices share a number");
  for (const inv of INVOICES) {
    const contract = contractById.get(inv.contractId);
    if (!contract) throw new Error(`contracts: invoice ${inv.id} references unknown contract "${inv.contractId}"`);
    if (!inv.lines.length) throw new Error(`contracts: invoice ${inv.id} has no lines`);
    if (inv.billToId && !memberById(inv.billToId)) throw new Error(`contracts: invoice ${inv.id} bills unknown member "${inv.billToId}"`);
    if (inv.status === "draft" && inv.number) throw new Error(`contracts: draft invoice ${inv.id} must not carry a number until it is issued`);
    if (inv.status !== "draft" && !inv.number) throw new Error(`contracts: issued invoice ${inv.id} has no number`);
    if (inv.status !== "draft" && !inv.issuedOn) throw new Error(`contracts: issued invoice ${inv.id} has no issue date`);
    if (inv.status === "void" && !inv.voidReason) throw new Error(`contracts: voided invoice ${inv.id} has no reason`);
    if (inv.creditNoteId && !invoiceById.has(inv.creditNoteId)) throw new Error(`contracts: invoice ${inv.id} points at a missing credit note`);
    if (inv.creditNoteFor && !invoiceById.has(inv.creditNoteFor)) throw new Error(`contracts: credit note ${inv.id} points at a missing invoice`);
    /* A DRAFT contract has demanded nothing of anybody — that is what makes it
       a draft, and an invoice against one would be a bill for an agreement that
       does not yet exist. */
    if (contract.status === "draft") throw new Error(`contracts: invoice ${inv.id} bills against draft contract ${contract.id}`);
    /* Payee. Commission is what the agency earned and is never anyone else's;
       an owner-payee invoice can only come from a tenancy the agency collects,
       because that is the only arrangement where the agency demands money that
       is not its own. Getting either backwards moves real figures on the finance
       page, so it fails at module load rather than at a month end. */
    if (inv.category === "commission" && inv.payee !== "agency") {
      throw new Error(`contracts: commission invoice ${inv.id} is payee "${inv.payee}" — commission is always the agency's money`);
    }
    /* THE ONE INVARIANT WORTH ASSERTING, now that a sale's holding deposit is
       the seller's too: commission is the agency's, and anything else may
       belong to somebody else. The older rule tried to enumerate which
       documents could carry owner money and kept being wrong as the model
       grew — a tenancy the landlord collected, then an instalment sale, then a
       holding deposit. Getting `payee` backwards moves real figures, so the
       thing to guard is the direction that is never true. */
    /* Rent is the landlord's money on EVERY tenancy, and instalments are the
       seller's — `rentPaidTo` and `installmentsPaidTo` decide who physically
       collects, never whose money it is. What this still refuses is an
       owner-payee invoice on a document that has no owner money in it at all:
       a full-price sale, where the only invoices are the two commissions. */
    /* A tenant-payee invoice is the insurance deposit and nothing else — it is
       the one demand whose money stays the payer's while we hold it. Anything
       else marked that way would drop out of every figure in the app with no
       screen able to explain where it went. */
    if (inv.payee === "tenant" && !(inv.category === "deposit" && contract.kind === "rent")) {
      throw new Error(`contracts: invoice ${inv.id} is payee "tenant" but is not a tenancy deposit`);
    }
    /* Every line, and therefore every total, in the contract's own currency —
       this is what makes the Money helpers safe to use across a whole invoice. */
    for (const l of inv.lines) {
      if (l.unitPrice.currency !== contract.price.currency) throw new Error(`contracts: invoice ${inv.id} line ${l.id} is not in the contract's currency`);
    }
    /* Totals are derived, so the only thing to assert is that the derivation is
       self-consistent: subtotal + tax must be the total, from the same lines. */
    const t = invoiceTotals(inv);
    if (compareMoney(add(t.subtotal, t.tax), t.total) !== 0) throw new Error(`contracts: invoice ${inv.id} totals do not reconcile`);
  }

  /* Payments: real invoice, credit in the invoice's currency, and the received
     amount reconciling to that credit at the rate recorded on the payment. */
  for (const p of PAYMENTS) {
    const inv = invoiceById.get(p.invoiceId);
    if (!inv) throw new Error(`contracts: payment ${p.id} references unknown invoice "${p.invoiceId}"`);
    const invCur = invoiceCurrency(inv);
    if (p.amount.currency !== invCur) throw new Error(`contracts: payment ${p.id} credits ${p.amount.currency} against a ${invCur} invoice`);
    if (p.receivedCurrency !== p.receivedAmount.currency) throw new Error(`contracts: payment ${p.id} receivedCurrency does not match receivedAmount`);
    const converted = p.receivedCurrency !== invCur;
    if (converted && !p.rateApplied) throw new Error(`contracts: payment ${p.id} arrived in ${p.receivedCurrency} against a ${invCur} invoice but records no rateApplied`);
    if (!converted && p.rateApplied) throw new Error(`contracts: payment ${p.id} records a rateApplied but no conversion happened`);
    /* The credit must BE the received amount converted — not a number that
       merely looks plausible beside it. */
    const want = converted ? convert(p.receivedAmount, invCur, p.rateApplied!) : p.receivedAmount;
    if (compareMoney(want, p.amount) !== 0) throw new Error(`contracts: payment ${p.id} credit does not reconcile with what was received`);
  }
  for (const inv of INVOICES) {
    const total = invoiceTotals(inv).total;
    /* Only a demand for money can be overpaid. A credit note's total is negative
       by construction — it gives money back — so "paid more than demanded" has no
       meaning there, and asserting it would fail every credit note in the set. */
    if (isNegative(total)) {
      if (!inv.creditNoteFor) throw new Error(`contracts: invoice ${inv.id} has a negative total but is not a credit note`);
      continue;
    }
    const paid = paidTotal(inv, PAYMENTS);
    if (compareMoney(paid, total) > 0) throw new Error(`contracts: invoice ${inv.id} has been paid more than it demands`);
  }

  /* The seed must actually exercise what it claims to cover — if a later edit
     quietly removes the overdue case, the derivation stops being tested. Every
     one of the five invoice badges has to be reachable, or a state ships
     unrendered and nobody notices until a customer hits it. */
  for (const want of ["not_due", "due", "paid", "overdue", "void"] as InvoiceStatus[]) {
    if (!INVOICES.some((i) => invoiceStatus(i, PAYMENTS) === want)) throw new Error(`contracts: seed no longer produces a "${want}" invoice`);
  }
  /* THE NON-DEFAULT-CURRENCY CONTRACT IS GONE, AND ON PURPOSE. Every listing
     is priced in dollars now, and a contract must match its listing (asserted
     above), so there is no dinar contract left to demand. The machinery that
     served one is untouched — `agreedRate`, `dualFigures` and the rules in
     currencyTerms all still work, and the cross-currency PAYMENT below still
     exercises money arriving in dinars against a dollar invoice, which is the
     case that actually happens at the desk. Restore this line the day a dinar
     listing comes back. */
  if (!CONTRACTS.some((c) => c.replacesContractId)) throw new Error("contracts: seed no longer contains a renewal chain");
  if (!CONTRACTS.some((c) => c.externalPaperwork)) throw new Error("contracts: seed no longer contains an externally-papered contract");
  if (!CONTRACTS.some((c) => c.buyerExternal)) throw new Error("contracts: seed no longer contains an off-platform counterparty");
  if (!CONTRACTS.some((c) => c.rentPaidTo === "agency" && c.managementFee)) throw new Error("contracts: seed no longer contains an agency-collected tenancy");
  /* The pass-through case has to stay reachable, or the one rule that keeps the
     rent roll out of revenue ships with nothing exercising it. */
  if (!INVOICES.some((i) => i.payee === "owner")) throw new Error("contracts: seed no longer contains an owner-payee invoice — the pass-through case is gone");
  if (!PAYMENTS.some((p) => p.receivedCurrency !== invoiceCurrency(invoiceById.get(p.invoiceId)!))) {
    throw new Error("contracts: seed no longer contains a payment made in a different currency from its invoice");
  }
  /* The cancelled-contract case is the one that proves records survive: money
     that arrived must still be attached to the contract that explains it. */
  {
    const cancelled = CONTRACTS.filter((c) => c.status === "cancelled");
    if (!cancelled.length) throw new Error("contracts: seed no longer contains a cancelled contract");
    const paidOnCancelled = cancelled.some((c) =>
      INVOICES.filter((i) => i.contractId === c.id).some((i) => invoiceStatus(i, PAYMENTS) === "paid"),
    );
    if (!paidOnCancelled) throw new Error("contracts: no cancelled contract carries a paid invoice — the case that proves cancelled records survive is gone");
  }

  /* ------------------------------------------------------------------------
     AN INVOICE REPRINTED IN FIVE YEARS SHOWS WHAT IT SHOWED ON ITS ISSUE DATE.

     The whole frozen-rate design exists for this one property, so it is checked
     rather than trusted. A dual-currency contract is rendered twice — once
     as-is, once against a contract object whose rate has been moved a long way
     — and the two must come out identical, because `dualFigures` is supposed to
     read the rate from the CONTRACT and nothing else.

     This would fail the moment someone "helpfully" reaches for the settings
     rate inside a document path, which is exactly the regression worth catching
     at module load rather than in a support ticket about a reprinted invoice
     that no longer matches the one in the customer's filing cabinet.
     ---------------------------------------------------------------------- */
  {
    const probe: ContractRecord = {
      ...CONTRACTS[0],
      dualCurrency: true,
      secondaryCurrency: CONTRACTS[0].price.currency === "USD" ? "IQD" : "USD",
      agreedRate: CONTRACTS[0].price.currency === "USD" ? 1310 : USD_PER_IQD,
      agreedRateSetOn: CONTRACTS[0].createdOn,
    };
    const atSigning = dualFigures(probe, probe.price).secondary;
    /* The same contract as it would be read after the market — and the admin's
       settings — have moved on. Only the rate the CONTRACT carries may matter. */
    const drifted: ContractRecord = { ...probe, agreedRate: probe.agreedRate! * 1.35 };
    const reprint = dualFigures(probe, probe.price).secondary;
    if (!atSigning || !reprint || compareMoney(atSigning, reprint) !== 0) {
      throw new Error("contracts: a reprinted document does not reproduce its original figures");
    }
    /* And prove the check has teeth: a genuinely different rate MUST produce a
       different figure, or the assertion above would pass on a stub. */
    const moved = dualFigures(drifted, drifted.price).secondary;
    if (!moved || compareMoney(atSigning, moved) === 0) {
      throw new Error("contracts: dualFigures ignores agreedRate — the reprint check is vacuous");
    }
  }
}

/* ----------------------------------------------------------------------------
   Lookups — the read side, shared by the store and by anything reading the seed
   ------------------------------------------------------------------------- */

export function getContractById(id: string, contracts: ContractRecord[] = CONTRACTS): ContractRecord | undefined {
  return contracts.find((c) => c.id === id);
}

/** Every contract written on one property, newest first. */
export function contractsByProperty(propertyId: string, contracts: ContractRecord[] = CONTRACTS): ContractRecord[] {
  return contracts.filter((c) => c.propertyId === propertyId).sort((a, b) => b.createdOn.localeCompare(a.createdOn));
}

/** Every contract an agent wrote, newest first. */
export function contractsByAgent(agentId: string, contracts: ContractRecord[] = CONTRACTS): ContractRecord[] {
  return contracts.filter((c) => c.agentId === agentId).sort((a, b) => b.createdOn.localeCompare(a.createdOn));
}

/** The contract this one replaced — the earlier link in a renewal chain. */
export function previousContract(c: ContractRecord, contracts: ContractRecord[] = CONTRACTS): ContractRecord | undefined {
  return c.replacesContractId ? contracts.find((x) => x.id === c.replacesContractId) : undefined;
}

/** The contract that replaced this one — the later link. Stored only on the
    replacement, so this is a scan; there are never enough contracts on one
    property for that to matter, and a second stored pointer would be a second
    thing to keep in step. */
export function replacedBy(c: ContractRecord, contracts: ContractRecord[] = CONTRACTS): ContractRecord | undefined {
  return contracts.find((x) => x.replacesContractId === c.id);
}

export function invoicesByContract(contractId: string, invoices: InvoiceRecord[] = INVOICES): InvoiceRecord[] {
  return invoices.filter((i) => i.contractId === contractId).sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

export function paymentsByInvoice(invoiceId: string, payments: PaymentRecord[] = PAYMENTS): PaymentRecord[] {
  return payments.filter((p) => p.invoiceId === invoiceId);
}

/**
 * What a contract is still owed, across all of its live invoices.
 *
 * Voided invoices are skipped — they were withdrawn, and counting them would
 * chase money nobody owes. Drafts are skipped too: nothing has been demanded.
 *
 * NOT A RECEIVABLE FIGURE. This is what the counterparty still owes ON THIS
 * CONTRACT, rent included, which is what a person looking at one tenancy wants
 * to see. The agency's own receivables are `receivablesAging`, which filters on
 * `isAgencyMoney` — do not swap one for the other.
 */
export function outstandingForContract(contractId: string, invoices: InvoiceRecord[] = INVOICES, payments: PaymentRecord[] = PAYMENTS): Money {
  const contract = getContractById(contractId);
  const cur = contract?.price.currency ?? PLATFORM_CURRENCY;
  const live = invoicesByContract(contractId, invoices).filter((i) => i.status === "issued");
  return sumMoney(
    live.map((i) => outstanding(i, payments)),
    cur,
  );
}

/* ------------------------------ list-screen counts ------------------------- */

/** Contracts in force right now — signed, and not run past their end date. */
export function activeContracts(contracts: ContractRecord[] = CONTRACTS, asOf: string = ANCHOR_ISO): ContractRecord[] {
  return contracts.filter((c) => isActive(c, asOf));
}

/** Drafts waiting for a signature. */
export function draftContracts(contracts: ContractRecord[] = CONTRACTS): ContractRecord[] {
  return contracts.filter((c) => c.status === "draft");
}

/**
 * Contracts whose term runs out within `days` — the renewal queue.
 *
 * Only ones still in force count. A contract that already ended is not
 * "expiring", it has expired, and putting it in the same number would make the
 * card say there is time to act when there is not.
 */
export function expiringWithin(days: number, contracts: ContractRecord[] = CONTRACTS, asOf: string = ANCHOR_ISO): ContractRecord[] {
  return contracts.filter((c) => {
    if (!isActive(c, asOf)) return false;
    const left = daysToExpiry(c, asOf);
    return left !== undefined && left >= 0 && left <= days;
  });
}

/**
 * The value signed in the calendar month `asOf` falls in.
 *
 * SINGLE-CURRENCY BY DESIGN. `currency` says which slice of the book to total,
 * and contracts in any other currency are left out rather than converted.
 * Totalling a mixed book needs a rate per contract per day, and inventing one
 * would make the card confidently wrong — so the count of what was left out is
 * returned alongside the figure, for a screen that wants to say so.
 */
export function signedValueInMonth(
  currency: CurrencyCode = PLATFORM_CURRENCY,
  asOf: string = ANCHOR_ISO,
  contracts: ContractRecord[] = CONTRACTS,
): { total: Money; excluded: number } {
  const month = asOf.slice(0, 7);
  let excluded = 0;
  const inMonth: Money[] = [];
  for (const c of contracts) {
    if (!c.signedOn || c.signedOn.slice(0, 7) !== month) continue;
    if (c.status === "cancelled") continue;
    if (c.price.currency !== currency) {
      excluded += 1;
      continue;
    }
    inMonth.push(contractValue(c));
  }
  return { total: sumMoney(inMonth, currency), excluded };
}

/** Standard receivables aging buckets, by how far past due each balance is. */
export interface AgingBuckets {
  current: Money; // not yet due
  d1to30: Money;
  d31to60: Money;
  d61to90: Money;
  d90plus: Money;
  total: Money;
}

/**
 * Age every unpaid balance into buckets. Only issued invoices count — a draft has
 * demanded nothing and a voided one has been withdrawn.
 *
 * ⚠ AND ONLY THE AGENCY'S OWN MONEY. This is the point of aggregation the
 * payee rule exists for: rent demanded on an agency-collected tenancy is the
 * landlord's money passing through, so it is not a receivable of this business
 * however overdue it is. Drop the `isAgencyMoney` filter below and this figure
 * — and the finance page reading it — inflates by the entire rent roll, which
 * on the seed alone is twelve invoices of 4,500,000 IQD each. The number would
 * look completely ordinary. See `isAgencyMoney`.
 *
 * Single-currency by design, for the same reason as `signedValueInMonth`:
 * `currency` says which slice of the book to age, and invoices in any other
 * currency are left out rather than converted.
 */
export function receivablesAging(
  currency: CurrencyCode = PLATFORM_CURRENCY,
  asOf: string = ANCHOR_ISO,
  invoices: InvoiceRecord[] = INVOICES,
  payments: PaymentRecord[] = PAYMENTS,
): AgingBuckets {
  const buckets: AgingBuckets = {
    current: zeroMoney(currency),
    d1to30: zeroMoney(currency),
    d31to60: zeroMoney(currency),
    d61to90: zeroMoney(currency),
    d90plus: zeroMoney(currency),
    total: zeroMoney(currency),
  };
  for (const inv of invoices) {
    if (inv.status !== "issued" || invoiceCurrency(inv) !== currency) continue;
    if (!isAgencyMoney(inv)) continue; // the landlord's money, not ours — see the note above
    const owed = outstanding(inv, payments);
    if (isZero(owed)) continue;
    const late = daysBetween(inv.dueOn, asOf);
    const key: keyof AgingBuckets = late <= 0 ? "current" : late <= 30 ? "d1to30" : late <= 60 ? "d31to60" : late <= 90 ? "d61to90" : "d90plus";
    buckets[key] = add(buckets[key], owed);
    buckets.total = add(buckets.total, owed);
  }
  return buckets;
}

/* Re-exported so a consumer of this module does not need a second import just to
   resolve the party a record points at. */
export { memberById, agentById, MEMBERS, AGENTS, PROPERTIES };
export { fromMinor };
