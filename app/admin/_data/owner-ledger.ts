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

   PAYOUTS EXIST NOW. Money handed to the owner is its own act with its own
   screen — /admin/payouts — and `payoutEntry` below is the line it writes. The
   collection entries were built first so that screen would have something true
   to read when it arrived; it has arrived.
   ========================================================================== */

import { add, subtract, sumMoney, zeroMoney, type CurrencyCode, type Money } from "@/lib/money";

/**
 * What one line records.
 *
 *   collected  money arrived from the tenant, in the invoice's currency.
 *   fee        the agency's management fee out of that collection. NEGATIVE —
 *              it leaves the owner's balance.
 *   expense    money the agency SPENT ON THE OWNER'S BEHALF — a plumber, a
 *              locksmith, an end-of-tenancy clean. NEGATIVE. See `expenseEntry`.
 *   deposit    a damages deduction kept out of the tenant's deposit and handed
 *              on to the owner. POSITIVE. See `depositClaimEntry`.
 *   refund     money given back to the party who paid it, and therefore taken
 *              off the owner's balance — a holding deposit returned when a sale
 *              falls through. NEGATIVE. See `refundEntry`.
 *   payout     money handed to the owner. NEGATIVE. See `payoutEntry`.
 *   adjustment a correction someone made by hand. Nothing writes one yet.
 *
 * `fee`, `expense` and `payout` are stored negative rather than
 * positive-with-a-sign-rule so a balance is a plain sum and no reader has to
 * remember which kinds subtract. A rule you have to remember is a rule that
 * gets forgotten in the second place it is needed.
 */
export type LedgerEntryKind = "collected" | "fee" | "expense" | "refund" | "payout" | "deposit" | "adjustment";

export interface OwnerLedgerEntry {
  id: string;
  /** MemberRecord id of the landlord this balance belongs to. */
  ownerId: string;
  contractId: string;
  /**
   * The payment this line hangs off.
   *
   * On `collected` and `fee` it is the payment that produced them. On `payout`
   * it is the collection being handed over — the link that lets one month's
   * rent be followed from the tenant, through the fee, to the landlord. See
   * `payoutEntry`. Absent only on an `adjustment`, which belongs to no single
   * movement.
   */
  paymentId?: string;
  /** The invoice the money was collected against, carried on the payout too. */
  invoiceId?: string;
  /**
   * On a `payout`: the id of the CREDIT LINE it clears — a collection, or a
   * deposit deduction. That link is what lets a screen say "June's rent, paid
   * out on the 9th" rather than only quoting a total, and it is why a payout
   * can settle a deposit claim as readily as a month of rent. See `payoutEntry`.
   */
  settles?: string;
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

/**
 * A DAMAGES DEDUCTION, MOVED FROM THE TENANT TO THE LANDLORD.
 *
 * The deposit is the tenant's money the whole time the agency holds it. At the
 * end he is entitled to all of it back unless there is a claim with evidence
 * behind it — and whatever is deducted is then the LANDLORD'S, because it is
 * his property that was damaged and his cost to put right. The agency does not
 * keep it. That is how it works wherever deposits are regulated, and it is the
 * one movement this ledger was missing.
 *
 * POSITIVE: it increases what we owe him, exactly as a rent collection does,
 * and it goes out to him the same way. If the agency itself paid for the repair,
 * the cost comes straight back off through `expenseEntry` — two plain movements
 * rather than one netted figure nobody can query.
 *
 * ⚠ NOT AN INVOICE, to anybody. Nothing is demanded: the money is already in
 * the agency's hands, and closing the lease decides whose it now is.
 */
export function depositClaimEntry(opts: {
  id: string;
  ownerId: string;
  contractId: string;
  on: string;
  amount: Money;
  description: string;
}): OwnerLedgerEntry {
  return {
    id: opts.id,
    ownerId: opts.ownerId,
    contractId: opts.contractId,
    kind: "deposit",
    amount: { amount: Math.abs(opts.amount.amount), currency: opts.amount.currency },
    on: opts.on,
    description: opts.description,
  };
}

/**
 * MONEY THE AGENCY SPENT ON THE OWNER'S BEHALF — a plumber, a locksmith, an
 * end-of-tenancy clean.
 *
 * Only on a managed tenancy, where the agency arranges the work and pays the
 * contractor out of rent it is already holding. The cost then comes off what is
 * owed to the owner, which is how full management works everywhere: the agency
 * spends the owner's money within an agreed limit and accounts for it.
 *
 * ⚠ A COST, NOT A CHARGE. An expense records that the agency paid somebody and
 * is taking it back from money it holds. It is NOT an invoice to the owner —
 * nothing is demanded of him and nothing appears on the invoices list. Where
 * the agency wants to BILL an owner rather than deduct (because it is holding
 * nothing of his), that is an invoice, and `issueExtraInvoice` raises one.
 *
 * NEGATIVE, like the fee and the payout, because it leaves the balance.
 *
 * THE SUPPLIER LIVES IN THE DESCRIPTION for the same reason the payout's method
 * does: "Plumber — leaking tap, kitchen" is what the statement has to still say
 * in a year, and an owner querying a deduction is querying those words.
 */
export function expenseEntry(opts: {
  id: string;
  ownerId: string;
  contractId: string;
  on: string;
  /** Passed positive; stored negative. The caller states what was spent. */
  amount: Money;
  description: string;
}): OwnerLedgerEntry {
  return {
    id: opts.id,
    ownerId: opts.ownerId,
    contractId: opts.contractId,
    kind: "expense",
    amount: { amount: -Math.abs(opts.amount.amount), currency: opts.amount.currency },
    on: opts.on,
    description: opts.description,
  };
}

/**
 * MONEY GIVEN BACK TO THE PARTY WHO PAID IT.
 *
 * A sale's holding deposit when the deal falls through and the buyer is not the
 * one who walked away. The money was credited to the seller when it came in —
 * it is part of the price — so handing it back has to take it off his balance
 * again, or the agency shows as owing him money it no longer has.
 *
 * ⚠ WHO GETS THE DEPOSIT DEPENDS ON WHO PULLED OUT, and that is a decision, not
 * a default. A buyer who walks away forfeits it to the seller and no line is
 * written at all; a seller who walks away gives it back. Cancelling a sale asks
 * the question — see cancelContract.
 *
 * NEGATIVE, like every other kind that leaves the balance.
 */
export function refundEntry(opts: {
  id: string;
  ownerId: string;
  contractId: string;
  on: string;
  /** Passed positive; stored negative. */
  amount: Money;
  description: string;
}): OwnerLedgerEntry {
  return {
    id: opts.id,
    ownerId: opts.ownerId,
    contractId: opts.contractId,
    kind: "refund",
    amount: { amount: -Math.abs(opts.amount.amount), currency: opts.amount.currency },
    on: opts.on,
    description: opts.description,
  };
}

/**
 * Money handed to the owner — the mirror of `collectionEntries` above.
 *
 * ⚠ IT NAMES THE CREDIT IT SETTLES, through `settles`. That link is what
 * lets a screen say "June's rent — paid out on the 9th" instead of only "the
 * landlord is owed 3,128 in total". An agency thinks in months: the tenant paid
 * June, and June went to the landlord. A payout floating free of the collection
 * that produced it can never be lined up against one again, and an owner asking
 * "did you pass me June" has no answer.
 *
 * ONE LINE PER COLLECTION, therefore — a landlord taking June and July in one
 * visit gets two lines and one receipt. `invoiceId` rides along so the row can
 * name the demand without walking the payments.
 *
 * NEGATIVE, like the fee, because it leaves the balance — stored that way and
 * not positive-with-a-sign-rule, for the reason on LedgerEntryKind.
 *
 * THE METHOD LIVES IN THE DESCRIPTION rather than a field of its own — "Paid
 * out — cash" is what the statement has to still say in a year, and a stored
 * code re-rendered through a later catalogue would change what the record says
 * about the past. Same rule as an invoice line.
 */
export function payoutEntry(opts: {
  id: string;
  ownerId: string;
  contractId: string;
  /** The credit line being handed over — a collection or a deposit claim. */
  settles: string;
  /** Carried when the credit was a rent collection, so a row can name the
      demand without walking the payments. */
  invoiceId?: string;
  on: string;
  /** Passed positive; stored negative. The caller states what was handed over,
      not what it does to a balance. */
  amount: Money;
  description: string;
}): OwnerLedgerEntry {
  return {
    id: opts.id,
    ownerId: opts.ownerId,
    contractId: opts.contractId,
    settles: opts.settles,
    ...(opts.invoiceId ? { invoiceId: opts.invoiceId } : {}),
    kind: "payout",
    amount: { amount: -Math.abs(opts.amount.amount), currency: opts.amount.currency },
    on: opts.on,
    description: opts.description,
  };
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
