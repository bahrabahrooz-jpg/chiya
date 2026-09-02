import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";
import type { StatTone } from "@/components/data/stat-card";
import { add, isZero, subtract, sumMoney, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";
import { PLATFORM_CURRENCY } from "../_data/contracts";
import { ledgerForOwner, ownerTotals, type LedgerEntryKind, type OwnerLedgerEntry, type OwnerTotals } from "../_data/owner-ledger";

export type { OwnerLedgerEntry, OwnerTotals, LedgerEntryKind } from "../_data/owner-ledger";

export const ITEMS_PER_PAGE = 12;

/* ----------------------------------------------------------------------------
   Ledger line presentation — the statement page
   ------------------------------------------------------------------------- */

/** What each kind of line looks like on a statement. Money in is brand; the two
    kinds that leave the balance are quieter, because an owner reading his own
    statement should see what arrived first. */
export const LEDGER_META: Record<LedgerEntryKind, { icon: IconName; tone: "in" | "out" }> = {
  collected: { icon: "arrow-down-left", tone: "in" },
  fee: { icon: "scissors", tone: "out" },
  expense: { icon: "wrench", tone: "out" },
  deposit: { icon: "shield-check", tone: "in" },
  refund: { icon: "undo-2", tone: "out" },
  payout: { icon: "arrow-up-right", tone: "out" },
  adjustment: { icon: "pencil", tone: "out" },
};

/* ----------------------------------------------------------------------------
   THE LIST — one row per month's rent

   NOT ONE ROW PER LANDLORD. An agency works in months: June's rent came in from
   the tenant, and June's rent goes out to the landlord. A single balance saying
   "Awat Faraj is owed 9,384" is a number nobody can act on — it cannot say
   which months it covers, and once paid it can never be lined up against June
   again. This is the shape the invoices list has, for the same reason: money
   is handled one item at a time.
   ------------------------------------------------------------------------- */

export type PayoutStatus = "waiting" | "part" | "paid";

export const STATUS_META: Record<PayoutStatus, { variant: BadgeVariant; dot?: boolean; icon?: IconName }> = {
  waiting: { variant: "warning", dot: true },
  part: { variant: "info", dot: true },
  paid: { variant: "success", icon: "circle-check" },
};

export const STATUS_TABS: ({ id: "all" } | { id: PayoutStatus })[] = [{ id: "all" }, { id: "waiting" }, { id: "part" }, { id: "paid" }];

export interface PayoutRow {
  /** The credit line this row is about — a rent collection, or a deposit
      deduction. Its ledger id, which is what a payout names in `settles`. */
  creditId: string;
  invoiceId?: string;
  ownerId: string;
  ownerName: string;
  contractId: string;
  propertyTitle: string;
  /** Frozen text off the collection line: "Rent, June — Bahra Tower". */
  what: string;
  /** The day the tenant's money arrived. */
  collectedOn: string;
  /** What arrived. */
  gross: Money;
  /** What the agency kept out of it. */
  fee: Money;
  /** The owner's share — gross less the fee. */
  net: Money;
  /** Handed over against this month so far. */
  paid: Money;
  /** Still to hand over. */
  owed: Money;
  status: PayoutStatus;
  /** The day the last hand-off against this month happened. */
  paidOn?: string;
}

/**
 * Everything of the owner's that has passed through the agency, most pressing
 * first — a month of rent, or a damages deduction off a tenant's deposit.
 *
 * BUILT FROM THE LEDGER, NEVER FROM THE CONTRACTS. A row appears because money
 * actually came through us for him, not because a tenancy exists on paper. A
 * landlord who collects his own rent never appears, and neither does a month
 * nobody has paid yet.
 *
 * MATCHED ON THE CREDIT'S OWN ID. The fee that came out of a collection is
 * found by `paymentId` — only collections have one — while a payout names the
 * credit it clears in `settles`. That is what lets a deposit deduction, which
 * has no payment behind it at all, be listed and handed over exactly like a
 * month of rent.
 */
export function buildPayoutRows(
  ledger: OwnerLedgerEntry[],
  ownerName: (id: string) => string,
  propertyTitleForContract: (contractId: string) => string,
): PayoutRow[] {
  const feesBy = new Map<string, Money>();
  const paidBy = new Map<string, { amount: Money; on: string }>();

  for (const e of ledger) {
    const abs = { amount: Math.abs(e.amount.amount), currency: e.amount.currency };
    if (e.kind === "fee" && e.paymentId) {
      const running = feesBy.get(e.paymentId);
      feesBy.set(e.paymentId, running ? add(running, abs) : abs);
    }
    if (e.kind === "payout" && e.settles) {
      const running = paidBy.get(e.settles);
      paidBy.set(e.settles, {
        amount: running ? add(running.amount, abs) : abs,
        /* The LAST hand-off, which is the date the row reports — a credit
           settled in two visits was finished on the second. */
        on: running && running.on > e.on ? running.on : e.on,
      });
    }
  }

  return ledger
    .filter((e) => e.kind === "collected" || e.kind === "deposit")
    .map((e) => {
      const creditId = e.id;
      const currency = e.amount.currency;
      const gross = e.amount;
      /* Only a rent collection carries a management fee. A deposit deduction is
         not something the agency collected for a service, so it passes whole. */
      const fee = (e.paymentId && feesBy.get(e.paymentId)) || zeroMoney(currency);
      const net = subtract(gross, fee);
      const settled = paidBy.get(creditId);
      const paid = settled?.amount ?? zeroMoney(currency);
      const owed = subtract(net, paid);
      const status: PayoutStatus = isZero(owed) ? "paid" : isZero(paid) ? "waiting" : "part";
      return {
        creditId,
        ...(e.invoiceId ? { invoiceId: e.invoiceId } : {}),
        ownerId: e.ownerId,
        ownerName: ownerName(e.ownerId),
        contractId: e.contractId,
        propertyTitle: propertyTitleForContract(e.contractId),
        what: e.description,
        collectedOn: e.on,
        gross,
        fee,
        net,
        paid,
        owed,
        status,
        ...(settled ? { paidOn: settled.on } : {}),
      };
    })
    /* What is still owed leads, oldest first — the longest a landlord has been
       waiting is the thing to deal with. Settled months sink and keep their own
       order so a question about March can still be answered. */
    .sort((a, b) => {
      const rank = (s: PayoutStatus) => (s === "paid" ? 1 : 0);
      const byStatus = rank(a.status) - rank(b.status);
      return byStatus !== 0 ? byStatus : a.collectedOn.localeCompare(b.collectedOn);
    });
}

/* ----------------------------------------------------------------------------
   A statement, oldest first, with the balance carried down
   ------------------------------------------------------------------------- */

export interface StatementLine {
  entry: OwnerLedgerEntry;
  /** The balance after this line. Carried, not recomputed per row. */
  balanceAfter: Money;
}

/**
 * One currency's worth of an owner's statement, in the order it happened.
 *
 * Oldest first with a running balance, because that is what makes a statement
 * checkable: an owner follows it down the page and arrives at the figure on the
 * bottom line. Newest-first is a feed, not a statement.
 */
export function statementFor(entries: OwnerLedgerEntry[], currency: CurrencyCode): StatementLine[] {
  const mine = entries.filter((e) => e.amount.currency === currency).sort((a, b) => a.on.localeCompare(b.on));
  let balance = zeroMoney(currency);
  return mine.map((entry) => {
    balance = add(balance, entry.amount);
    return { entry, balanceAfter: balance };
  });
}

export function currenciesIn(entries: OwnerLedgerEntry[]): CurrencyCode[] {
  const seen = new Set<CurrencyCode>();
  for (const e of entries) seen.add(e.amount.currency);
  return [...seen];
}

/** One owner's whole book, for the statement page. */
export interface OwnerBook {
  ownerId: string;
  ownerName: string;
  entries: OwnerLedgerEntry[];
  totals: { currency: CurrencyCode; totals: OwnerTotals }[];
  owing: boolean;
}

export function buildOwnerBook(ledger: OwnerLedgerEntry[], ownerId: string, ownerName: (id: string) => string): OwnerBook | undefined {
  const entries = ledgerForOwner(ownerId, ledger);
  if (!entries.length) return undefined;
  const totals = currenciesIn(entries).map((currency) => ({ currency, totals: ownerTotals(ownerId, currency, entries) }));
  return { ownerId, ownerName: ownerName(ownerId), entries, totals, owing: totals.some((t) => t.totals.balance.amount > 0) };
}

/* ----------------------------------------------------------------------------
   KPI cards
   ------------------------------------------------------------------------- */

export interface PayoutKpis {
  owed: Money;
  collected: Money;
  fees: Money;
  paidOut: Money;
  /** Months still waiting to go out. */
  waiting: number;
  /** Rows left out of the figures above because they are in another currency. */
  otherCurrency: number;
}

export function buildKpis(rows: PayoutRow[], currency: CurrencyCode = PLATFORM_CURRENCY): PayoutKpis {
  const mine = rows.filter((r) => r.gross.currency === currency);
  const sum = (pick: (r: PayoutRow) => Money) => sumMoney(mine.map(pick), currency);
  return {
    owed: sum((r) => r.owed),
    collected: sum((r) => r.gross),
    fees: sum((r) => r.fee),
    paidOut: sum((r) => r.paid),
    waiting: mine.filter((r) => r.status !== "paid").length,
    otherCurrency: rows.length - mine.length,
  };
}

export interface KpiCardDef {
  key: "owed" | "collected" | "fees" | "paidOut";
  icon: IconName;
  tone: StatTone;
}

/* Owed takes the gold: it is the only one of the four that is a job somebody
   has to do. The other three are history. */
export const KPI_CARDS: KpiCardDef[] = [
  { key: "owed", icon: "wallet", tone: "gold" },
  { key: "collected", icon: "arrow-down-left", tone: "brand" },
  { key: "fees", icon: "scissors", tone: "success" },
  { key: "paidOut", icon: "arrow-up-right", tone: "info" },
];
