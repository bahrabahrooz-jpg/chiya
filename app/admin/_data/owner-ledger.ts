/* =============================================================================
   Chiya admin — the owner ledger.

   WHAT DO WE OWE THIS LANDLORD? On an agency-collected tenancy the tenant hands
   money to us, we keep our management fee, and the rest is the owner's. This
   file is the record of that, one line per movement.

   WHY IT IS WRITTEN AT THE MOMENT OF PAYMENT, AND NOT DERIVED LATER.

   It looks derivable. Take the paid rent invoices, apply the contract's
   management fee, subtract the payouts — and for a tenancy that never changed,
   that works. It stops working the first time anything real happens:

     · the fee changed mid-term, so the rate on the contract today is not the
       rate that applied to March's collection;
     · the tenant paid in dinars against a dollar invoice, so what the owner is
       owed depends on the rate used on the day the cash was taken;
     · the tenant paid part of a demand, so the fee came out of a part payment;
     · the contract was superseded by a renewal, and the old terms are gone.

   Every one of those makes the answer a fact about the day, not a calculation.
   A ledger line records what actually happened; a re-derivation records what
   would have happened if nothing ever changed. When an owner asks "why is this
   number what it is", only the first can answer.

   Nothing here is a payout. Money actually sent to the owner is its own act,
   with its own screen, and it is not part of this task — but the entries below
   are what that screen will read, which is why they have to exist now.
   ========================================================================== */

import { add, subtract, sumMoney, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";

/**
 * What one line records.
 *
 *   collected  money arrived from the tenant, in the invoice's currency.
 *   fee        the agency's management fee out of that collection. NEGATIVE —
 *              it leaves the owner's balance.
 *   payout     money sent on to the owner. NEGATIVE. Nothing writes one yet.
 *   adjustment a correction someone made by hand. Nothing writes one yet.
 *
 * `fee` and `payout` are stored negative rather than positive-with-a-sign-rule
 * so a balance is a plain sum and no reader has to remember which kinds
 * subtract. A rule you have to remember is a rule that gets forgotten in the
 * second place it is needed.
 */
export type LedgerEntryKind = "collected" | "fee" | "payout" | "adjustment";

export interface OwnerLedgerEntry {
  id: string;
  /** MemberRecord id of the landlord this balance belongs to. */
  ownerId: string;
  contractId: string;
  /** The payment that produced this line, for `collected` and `fee`. */
  paymentId?: string;
  /** The invoice the money was collected against. */
  invoiceId?: string;
  kind: LedgerEntryKind;
  /** Signed: positive increases what we owe the owner, negative reduces it. */
  amount: Money;
  /** ISO — the day the money moved, never the day the row was written. */
  on: string;
  /**
   * Human description, frozen. Written in the language of the record rather
   * than through the i18n catalog for the same reason an invoice line is: it
   * describes one event that happened once, and re-rendering it later in
   * whatever language the reader happens to have picked would change what the
   * statement says about the past.
   */
  description: string;
}

/** Every line for one owner, newest first. */
export function ledgerForOwner(ownerId: string, entries: OwnerLedgerEntry[]): OwnerLedgerEntry[] {
  return entries.filter((e) => e.ownerId === ownerId).sort((a, b) => b.on.localeCompare(a.on));
}

/** Every line raised under one contract, oldest first — statement order. */
export function ledgerForContract(contractId: string, entries: OwnerLedgerEntry[]): OwnerLedgerEntry[] {
  return entries.filter((e) => e.contractId === contractId).sort((a, b) => a.on.localeCompare(b.on));
}

/**
 * What is owed to an owner right now, in one currency.
 *
 * Single-currency for the same reason every other total in this system is: an
 * owner with a dollar tenancy and a dinar one is owed two amounts, and adding
 * them needs a rate that belongs to a day, not to a screen. Ask twice.
 */
export function ownerBalance(ownerId: string, currency: CurrencyCode, entries: OwnerLedgerEntry[]): Money {
  return sumMoney(
    ledgerForOwner(ownerId, entries)
      .filter((e) => e.amount.currency === currency)
      .map((e) => e.amount),
    currency,
  );
}

export interface LedgerSplit {
  /** What the agency keeps out of this collection. */
  fee: Money;
  /** What is left for the owner. */
  toOwner: Money;
}

/**
 * Split one collection into the agency's fee and the owner's share.
 *
 * THE FEE IS TAKEN OUT OF WHAT ARRIVED, not out of what was demanded. A tenant
 * who pays half the rent has paid half of the owner's money and half of ours;
 * charging the whole month's fee against a half payment would quietly take it
 * out of the owner's side.
 *
 * `feeAmount` is the fee on a FULL cycle — what `managementFeeAmount` returns —
 * and `cycleRent` is the full cycle's rent it was calculated against. A part
 * payment scales the fee by the same proportion. A percentage fee would come
 * out the same either way; a FIXED fee would not, which is exactly why this is
 * a function and not a multiplication at the call site.
 */
export function splitCollection(received: Money, cycleRent: Money, feeAmount?: Money): LedgerSplit {
  const zero = zeroMoney(received.currency);
  if (!feeAmount || cycleRent.amount <= 0) return { fee: zero, toOwner: received };
  const proportion = Math.min(1, received.amount / cycleRent.amount);
  const fee: Money = { amount: Math.round(feeAmount.amount * proportion), currency: received.currency };
  return { fee, toOwner: subtract(received, fee) };
}

/**
 * The two lines one collection produces: the money in, and the fee out.
 *
 * Written as a pair rather than a single net line so a statement can show the
 * owner both halves. "We collected 1,400 and kept 70" is a sentence an owner
 * can check; "we owe you 1,330" is one they have to take on trust.
 */
export function collectionEntries(opts: {
  ownerId: string;
  contractId: string;
  invoiceId: string;
  paymentId: string;
  on: string;
  received: Money;
  split: LedgerSplit;
  /** Frozen text — the invoice's own line, so the two documents agree. */
  description: string;
  feeDescription: string;
  /** Ids come from the caller: this module never reads a clock. */
  ids: { collected: string; fee: string };
}): OwnerLedgerEntry[] {
  const base = {
    ownerId: opts.ownerId,
    contractId: opts.contractId,
    invoiceId: opts.invoiceId,
    paymentId: opts.paymentId,
    on: opts.on,
  };
  const entries: OwnerLedgerEntry[] = [
    { ...base, id: opts.ids.collected, kind: "collected", amount: opts.received, description: opts.description },
  ];
  /* No fee line when there is no fee. A row reading "0" on a statement invites
     the question of what it was for. */
  if (opts.split.fee.amount > 0) {
    entries.push({
      ...base,
      id: opts.ids.fee,
      kind: "fee",
      amount: { amount: -opts.split.fee.amount, currency: opts.split.fee.currency },
      description: opts.feeDescription,
    });
  }
  return entries;
}

/** Running totals for a statement header. Collected and fees are reported as
    positive figures — the sign is a storage detail, not something to show. */
export interface OwnerTotals {
  collected: Money;
  fees: Money;
  paidOut: Money;
  balance: Money;
}

export function ownerTotals(ownerId: string, currency: CurrencyCode, entries: OwnerLedgerEntry[]): OwnerTotals {
  const mine = ledgerForOwner(ownerId, entries).filter((e) => e.amount.currency === currency);
  const of = (kind: LedgerEntryKind) => sumMoney(mine.filter((e) => e.kind === kind).map((e) => e.amount), currency);
  const fees = of("fee");
  const paidOut = of("payout");
  return {
    collected: of("collected"),
    fees: { amount: -fees.amount, currency },
    paidOut: { amount: -paidOut.amount, currency },
    balance: add(add(of("collected"), fees), add(paidOut, of("adjustment"))),
  };
}
