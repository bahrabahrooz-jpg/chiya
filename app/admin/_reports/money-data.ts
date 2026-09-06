import { ANCHOR_ISO, daysBetween, fromIso } from "@/lib/dates";
import { add, isZero, sumMoney, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";
import {
  PLATFORM_CURRENCY,
  daysToExpiry,
  depositsHeld,
  invoiceCurrency,
  isActive,
  isAgencyMoney,
  outstanding,
  paidTotal,
  receivablesAging,
  type AgingBuckets,
  type ContractRecord,
  type InvoiceRecord,
  type PaymentRecord,
} from "../_data/contracts";
import { ledgerForOwner, ownerTotals, type OwnerLedgerEntry } from "../_data/owner-ledger";

/* =============================================================================
   The money report — the shape of the book, not a second copy of the lists.

   WHAT THIS FILE MAY AND MAY NOT PRODUCE. Reports carries a LIST only when that
   list exists nowhere else. The rent roll is one row per TENANCY and appears in
   no other screen, so it is built here. "What is due this month" is one row per
   DEMAND, which is the invoices list — so this file returns the TOTAL and the
   screen links through to it. Rebuilding those rows here would be a second
   place to read the same thing and a second place for it to go wrong.

   ⚠ FOUR TOTALS, NEVER ONE. Earned and owed are the agency's; money held for
   owners and deposits held are other people's, sitting in the agency's account.
   A figure spanning them would look entirely ordinary and mean nothing — the
   same trap `isAgencyMoney` and `receivablesAging` exist to avoid. They are
   returned as four fields and the screen keeps a rule between them.

   Single-currency, like every other total in this app: `currency` says which
   slice of the book is being read and anything else is left out rather than
   converted at a rate nobody agreed.
   ========================================================================== */

/* ----------------------------------------------------------------------------
   The four figures
   ------------------------------------------------------------------------- */

export interface MoneyHeadline {
  /** Commission the agency actually COLLECTED in the period. Not invoiced —
      collected is what can be spent. */
  earned: Money;
  /** The agency's own money still owed to it, at today. */
  owed: Money;
  /** Of that, the part already past its due date. */
  owedLate: Money;
  /** Rent and sale proceeds sitting in the agency's account for their owners. */
  heldForOwners: Money;
  /** Tenancy deposits held. The tenants' money, and a liability. */
  heldDeposits: Money;
}

/** Was this payment against the agency's own commission? The one test that
    decides what counts as income. */
function isCommissionIncome(inv: InvoiceRecord): boolean {
  return inv.category === "commission" && isAgencyMoney(inv);
}

export function buildHeadline(
  contracts: ContractRecord[],
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  ledger: OwnerLedgerEntry[],
  days: number,
  currency: CurrencyCode = PLATFORM_CURRENCY,
  asOf: string = ANCHOR_ISO,
): MoneyHeadline {
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));

  /* EARNED = commission that arrived, inside the period. A payment dated
     outside it belongs to the month it was received in, not to the one being
     looked at. */
  const earned = sumMoney(
    payments
      .filter((p) => {
        const inv = invoiceById.get(p.invoiceId);
        if (!inv || !isCommissionIncome(inv)) return false;
        if (p.amount.currency !== currency) return false;
        const ago = daysBetween(p.receivedOn, asOf);
        return ago >= 0 && ago < days;
      })
      .map((p) => p.amount),
    currency,
  );

  const aging = receivablesAging(currency, asOf, invoices, payments);
  const owedLate = [aging.d1to30, aging.d31to60, aging.d61to90, aging.d90plus].reduce(add, zeroMoney(currency));

  /* What we are holding for other people. Every owner's balance, summed —
     positive balances only: an owner who has been overpaid is a debt to the
     agency, not money in the drawer, and adding a negative here would quietly
     reduce what the agency reports holding. */
  const ownerIds = [...new Set(ledger.map((e) => e.ownerId))];
  const heldForOwners = sumMoney(
    ownerIds
      .map((id) => ownerTotals(id, currency, ledgerForOwner(id, ledger)).balance)
      .filter((m) => m.amount > 0),
    currency,
  );

  return {
    earned,
    owed: aging.total,
    owedLate,
    heldForOwners,
    heldDeposits: depositsHeld(currency, contracts),
  };
}

/* ----------------------------------------------------------------------------
   What is coming — the look-ahead nothing else in the app has

   Every other screen reads today or the past. A tenancy that runs out with
   nobody having had the conversation is how an agency loses a year's fee, and
   an instalment nobody planned for is how a month goes short.
   ------------------------------------------------------------------------- */

export interface Upcoming {
  /** Unpaid demands falling due in the window, split by what they are for. */
  rent: Money;
  installments: Money;
  commission: Money;
  deposits: Money;
  /** How many demands make up those figures — the count links to the list. */
  count: number;
  /** Tenancies inside the renewal window, and those simply running out. */
  renewals: number;
  ending: number;
}

export const UPCOMING_DAYS = 30;
export const RENEWAL_DAYS = 60;
export const ENDING_DAYS = 90;

export function buildUpcoming(
  contracts: ContractRecord[],
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  currency: CurrencyCode = PLATFORM_CURRENCY,
  asOf: string = ANCHOR_ISO,
): Upcoming {
  let rent = zeroMoney(currency);
  let installments = zeroMoney(currency);
  let commission = zeroMoney(currency);
  let deposits = zeroMoney(currency);
  let count = 0;

  for (const inv of invoices) {
    if (inv.status !== "issued" || invoiceCurrency(inv) !== currency) continue;
    const owed = outstanding(inv, payments);
    if (isZero(owed)) continue;
    /* FORWARD ONLY. Anything already past its date is not "coming" — it is
       late, and it is counted in the headline instead. */
    const until = daysBetween(asOf, inv.dueOn);
    if (until < 0 || until > UPCOMING_DAYS) continue;
    count += 1;
    if (inv.category === "rent") rent = add(rent, owed);
    else if (inv.category === "commission") commission = add(commission, owed);
    else if (inv.category === "deposit") deposits = add(deposits, owed);
    else installments = add(installments, owed);
  }

  const live = contracts.filter((c) => c.kind === "rent" && isActive(c, asOf));
  const within = (c: ContractRecord, window: number) => {
    const left = daysToExpiry(c, asOf);
    return left !== undefined && left >= 0 && left <= window;
  };

  return {
    rent,
    installments,
    commission,
    deposits,
    count,
    renewals: live.filter((c) => within(c, RENEWAL_DAYS)).length,
    /* The ones running out but not yet inside the renewal window — counted
       separately so the two numbers do not double up. */
    ending: live.filter((c) => within(c, ENDING_DAYS) && !within(c, RENEWAL_DAYS)).length,
  };
}

/* ----------------------------------------------------------------------------
   Income, month by month
   ------------------------------------------------------------------------- */

export interface IncomeMonth {
  /** ISO first-of-month, for the key and the sort. */
  month: string;
  amount: Money;
}

/** How far back the income chart looks. Six months fits a laptop without
    scrolling and is long enough to show a direction. */
export const INCOME_MONTHS = 6;

export function buildIncome(
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  currency: CurrencyCode = PLATFORM_CURRENCY,
  asOf: string = ANCHOR_ISO,
): IncomeMonth[] {
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));
  const anchor = fromIso(asOf);

  const months: IncomeMonth[] = [];
  for (let i = INCOME_MONTHS - 1; i >= 0; i -= 1) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    months.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`,
      amount: zeroMoney(currency),
    });
  }
  const index = new Map(months.map((m, i) => [m.month.slice(0, 7), i]));

  for (const p of payments) {
    const inv = invoiceById.get(p.invoiceId);
    if (!inv || !isCommissionIncome(inv) || p.amount.currency !== currency) continue;
    const slot = index.get(p.receivedOn.slice(0, 7));
    if (slot === undefined) continue;
    months[slot].amount = add(months[slot].amount, p.amount);
  }
  return months;
}

/* ----------------------------------------------------------------------------
   The rent roll — the one list this screen owns

   One row per TENANCY, which no other screen shows. The invoices list is one
   row per demand and the contracts list is one row per document; neither
   answers "what is the whole book earning, and when does each one next pay".
   ------------------------------------------------------------------------- */

export interface RentRollRow {
  contract: ContractRecord;
  propertyTitle: string;
  tenant: string;
  rent: Money;
  /** Who physically takes the money — it changes what the agency has to chase. */
  collectedByAgency: boolean;
  /** The next demand still unpaid, whether or not it has fallen due yet. */
  nextDueOn?: string;
  nextAmount?: Money;
  /** True when that next demand is already past its date. */
  nextIsLate: boolean;
  endsOn?: string;
  /** Days until the term runs out — undefined on a tenancy with no end. */
  daysLeft?: number;
}

export function buildRentRoll(
  contracts: ContractRecord[],
  invoices: InvoiceRecord[],
  payments: PaymentRecord[],
  propertyTitle: (propertyId: string) => string,
  tenantName: (c: ContractRecord) => string,
  asOf: string = ANCHOR_ISO,
): RentRollRow[] {
  return contracts
    .filter((c) => c.kind === "rent" && isActive(c, asOf))
    .map((c) => {
      /* The oldest unpaid rent demand. Oldest rather than nearest: if last
         month is still open that is the one the office is chasing, and it is
         what the row should say is due. */
      const next = invoices
        .filter((i) => i.contractId === c.id && i.category === "rent" && i.status === "issued" && !isZero(outstanding(i, payments)))
        .sort((a, b) => a.dueOn.localeCompare(b.dueOn))[0];
      const left = daysToExpiry(c, asOf);
      return {
        contract: c,
        propertyTitle: propertyTitle(c.propertyId),
        tenant: tenantName(c),
        rent: c.monthlyRent ?? c.price,
        collectedByAgency: c.rentPaidTo === "agency",
        ...(next ? { nextDueOn: next.dueOn, nextAmount: outstanding(next, payments) } : {}),
        nextIsLate: !!next && daysBetween(next.dueOn, asOf) > 0,
        ...(c.endsOn ? { endsOn: c.endsOn } : {}),
        ...(left !== undefined ? { daysLeft: left } : {}),
      };
    })
    /* Soonest to run out first — the end of a term is the only thing on this
       table with a deadline attached. */
    .sort((a, b) => (a.daysLeft ?? 1e9) - (b.daysLeft ?? 1e9));
}

/* ----------------------------------------------------------------------------
   Owners — what each is owed, and what has gone to them
   ------------------------------------------------------------------------- */

export interface OwnerSummaryRow {
  ownerId: string;
  ownerName: string;
  collected: Money;
  fees: Money;
  paidOut: Money;
  balance: Money;
}

export function buildOwnerSummary(
  ledger: OwnerLedgerEntry[],
  ownerName: (id: string) => string,
  currency: CurrencyCode = PLATFORM_CURRENCY,
): OwnerSummaryRow[] {
  return [...new Set(ledger.map((e) => e.ownerId))]
    .map((ownerId) => {
      const t = ownerTotals(ownerId, currency, ledgerForOwner(ownerId, ledger));
      return { ownerId, ownerName: ownerName(ownerId), ...t };
    })
    .filter((r) => !isZero(r.collected) || !isZero(r.balance))
    .sort((a, b) => b.balance.amount - a.balance.amount);
}

export type { AgingBuckets };
export { paidTotal };

/* =============================================================================
   THE REPORT CATALOGUE

   Named reports rather than two broad tabs. An agency does not ask "show me the
   money"; it asks "what rent is due", "what did we take last month", "what have
   we earned", "whose deposit are we holding". Each of those is a report someone
   runs, reads down, and exports — so each is a tab with its own table.

   EVERY REPORT RETURNS ROWS OF PLAIN STRINGS AND MONEY. That is what lets one
   CSV writer serve all of them (see `toCsv`) and one table component render all
   of them, instead of eight bespoke tables that drift apart.
   ========================================================================== */

/** A period the reports are run over. Days back from the anchor; `all` is the
    whole book, which is what a commission or deposit report usually wants. */
export interface ReportPeriod {
  id: string;
  days: number;
}
export const REPORT_PERIODS: ReportPeriod[] = [
  { id: "month", days: 30 },
  { id: "q", days: 90 },
  { id: "half", days: 180 },
  { id: "year", days: 365 },
  { id: "all", days: 100_000 },
];

export type CellTone = "late" | "warn" | "strong" | undefined;

export interface ReportCell {
  text: string;
  tone?: CellTone;
  /** A second, quieter line under the value — an id, a property, a date. */
  sub?: string;
  href?: string;
}

export interface ReportTable {
  /** Column headings, already translated by the caller. */
  head: { key: string; num?: boolean }[];
  rows: { id: string; cells: ReportCell[] }[];
  /** Shown under the table when it is worth stating what the rows add up to. */
  total?: string;
}

/** One report's rows as CSV — headings from the caller, values as rendered.
    Quoted properly, so a property name with a comma in it survives. */
export function toCsv(headings: string[], table: ReportTable): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const lines = [headings.map(esc).join(",")];
  for (const r of table.rows) {
    lines.push(r.cells.map((c) => esc(c.sub ? `${c.text} (${c.sub})` : c.text)).join(","));
  }
  return lines.join("\r\n");
}

/* ----------------------------------------------------------------------------
   The reports themselves

   Each takes the live records and a formatter, and returns rows. They format
   here rather than in the component so the CSV and the screen cannot disagree
   about what a row says — the export IS the table.
   ------------------------------------------------------------------------- */

export interface ReportCtx {
  contracts: ContractRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  ledger: OwnerLedgerEntry[];
  days: number;
  asOf: string;
  money: (m: Money) => string;
  date: (iso: string) => string;
  propertyTitle: (contractId: string) => string;
  memberName: (id: string) => string;
  label: (key: string) => string;
}

const within = (iso: string, days: number, asOf: string) => {
  const ago = daysBetween(iso, asOf);
  return ago >= 0 && ago < days;
};

/** RENT DUE — every unpaid rent demand, latest trouble first. */
export function reportRentDue(c: ReportCtx): ReportTable {
  const rows = c.invoices
    .filter((i) => i.category === "rent" && i.status === "issued" && !isZero(outstanding(i, c.payments)))
    .map((i) => ({ inv: i, owed: outstanding(i, c.payments), late: daysBetween(i.dueOn, c.asOf) }))
    /* Late first, longest late at the top; then what is coming, soonest first. */
    .sort((a, b) => b.late - a.late)
    .map(({ inv, owed, late }) => ({
      id: inv.id,
      cells: [
        { text: c.date(inv.dueOn), tone: late > 0 ? ("late" as const) : undefined },
        { text: c.propertyTitle(inv.contractId), sub: inv.contractId, href: `/admin/contracts/${encodeURIComponent(inv.contractId)}` },
        { text: inv.billTo.name },
        { text: c.money(owed), tone: "strong" as const },
        { text: late > 0 ? c.label("late") : c.label("notdue"), tone: late > 0 ? ("late" as const) : undefined },
      ],
    }));
  return {
    head: [{ key: "due" }, { key: "property" }, { key: "tenant" }, { key: "amount", num: true }, { key: "state" }],
    rows,
    total: c.money(
      sumMoney(
        c.invoices
          .filter((i) => i.category === "rent" && i.status === "issued" && invoiceCurrency(i) === PLATFORM_CURRENCY)
          .map((i) => outstanding(i, c.payments))
          .filter((m) => !isZero(m)),
        PLATFORM_CURRENCY,
      ),
    ),
  };
}

/** PAYMENTS — everything that arrived in the period, newest first. */
export function reportPayments(c: ReportCtx): ReportTable {
  const byId = new Map(c.invoices.map((i) => [i.id, i]));
  const rows = c.payments
    .filter((p) => within(p.receivedOn, c.days, c.asOf))
    .sort((a, b) => b.receivedOn.localeCompare(a.receivedOn))
    .map((p) => {
      const inv = byId.get(p.invoiceId);
      return {
        id: p.id,
        cells: [
          { text: c.date(p.receivedOn) },
          { text: inv?.billTo.name ?? "—" },
          { text: inv ? c.label("cat." + inv.category) : "—", sub: inv?.number },
          { text: inv ? c.propertyTitle(inv.contractId) : "—", sub: inv?.contractId },
          { text: c.label("method." + p.method) },
          { text: c.money(p.receivedAmount), tone: "strong" as const },
        ],
      };
    });
  return {
    head: [{ key: "received" }, { key: "from" }, { key: "for" }, { key: "property" }, { key: "method" }, { key: "amount", num: true }],
    rows,
    total: c.money(
      sumMoney(
        c.payments.filter((p) => within(p.receivedOn, c.days, c.asOf) && p.amount.currency === PLATFORM_CURRENCY).map((p) => p.amount),
        PLATFORM_CURRENCY,
      ),
    ),
  };
}

/** COMMISSION — what the agency earned, and whether it has arrived. */
export function reportCommission(c: ReportCtx): ReportTable {
  const rows = c.invoices
    .filter((i) => i.category === "commission" && i.status !== "draft" && !i.creditNoteFor)
    .filter((i) => c.days > 9999 || within(i.issuedOn ?? i.dueOn, c.days, c.asOf))
    .sort((a, b) => (b.issuedOn ?? b.dueOn).localeCompare(a.issuedOn ?? a.dueOn))
    .map((i) => {
      const paid = paidTotal(i, c.payments);
      const owed = outstanding(i, c.payments);
      return {
        id: i.id,
        cells: [
          { text: c.date(i.issuedOn ?? i.dueOn), sub: i.number },
          { text: c.propertyTitle(i.contractId), sub: i.contractId, href: `/admin/contracts/${encodeURIComponent(i.contractId)}` },
          { text: i.billTo.name },
          { text: c.money(paid), tone: "strong" as const },
          { text: isZero(owed) ? c.label("settled") : c.money(owed), tone: isZero(owed) ? undefined : ("late" as const) },
        ],
      };
    });
  return {
    head: [{ key: "issued" }, { key: "property" }, { key: "billedTo" }, { key: "collected", num: true }, { key: "outstanding", num: true }],
    rows,
  };
}

/** DEPOSITS — whose money the agency is holding, and what became of it. */
export function reportDeposits(c: ReportCtx): ReportTable {
  const rows = c.contracts
    .filter((k) => k.kind === "rent" && k.insuranceDeposit && !isZero(k.insuranceDeposit))
    .sort((a, b) => (a.depositStatus === "held" ? -1 : 1) - (b.depositStatus === "held" ? -1 : 1))
    .map((k) => ({
      id: k.id,
      cells: [
        { text: c.propertyTitle(k.id), sub: k.id, href: `/admin/contracts/${encodeURIComponent(k.id)}` },
        { text: (k.buyerId ? c.memberName(k.buyerId) : null) ?? "—" },
        { text: c.money(k.insuranceDeposit!), tone: "strong" as const },
        { text: c.label("dep." + (k.depositStatus ?? "held")), tone: k.depositStatus === "held" ? ("warn" as const) : undefined },
        { text: k.depositDeduction ? c.money(k.depositDeduction) : "—", sub: k.depositDeductionReason },
      ],
    }));
  return {
    head: [{ key: "property" }, { key: "tenant" }, { key: "held", num: true }, { key: "state" }, { key: "deducted", num: true }],
    rows,
  };
}
