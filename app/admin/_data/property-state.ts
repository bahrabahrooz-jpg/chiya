/* =============================================================================
   Chiya admin — how a contract moves a property.

   `catalog.ts` says what a property IS, `contracts.ts` says what was AGREED on
   it. This file is the one place that connects them: every rule about how a
   contract changes a property's publication and availability is a named
   function here, and nothing outside re-implements one inline.

   It has to be its own module. `contracts.ts` already imports `catalog.ts` (its
   seed cross-links properties, members and agents), so putting these rules in
   the catalog would close a cycle.

   THE SHAPE OF EVERY RULE. A transition takes the current records and returns a
   PATCH, never a mutated record and never a store call. Pure functions can be
   read, reasoned about and tested; the wiring that applies them and writes the
   audit trail lives in ../_shared/contract-transitions.ts. Keeping the two apart
   is what stops "cancelling a contract republishes the listing" from being a
   detail buried in a click handler.

   THE FOUR RULES, in the order a contract meets them:

     drafted    a contract is written → the property comes off the website and
                is held. The publication it had is STORED ON THE CONTRACT,
                because putting it back later is only possible if something
                remembers it.
     signed     the parties sign → availability becomes sold or rented by kind.
                Publication stays unpublished: a signed transaction is history.
     cancelled  abandoned → availability back to available, publication restored
                from what the contract stored when it reserved.
     lease end  a tenancy runs out → availability back to available, and
                publication is DELIBERATELY NOT restored. An expired lease must
                not silently put a listing back on the website; someone has to
                decide to re-market it.
   ========================================================================== */

import { daysAgo } from "@/lib/dates";
import {
  legacyStatus,
  type Availability,
  type CountPeriod,
  type Publication,
  type PropertyRecord,
  periodWindow,
} from "./catalog";
import { hasExpired, type ContractKind, type ContractRecord, type ContractStatus } from "./contracts";

/* ----------------------------------------------------------------------------
   Predicates
   ------------------------------------------------------------------------- */

/**
 * Contract states that take a property off the market.
 *
 * A DRAFT already reserves. Writing the contract is the moment the agency
 * commits the property to one party, and leaving it advertised from then until
 * signature collects enquiries nobody can act on. Cancelled and completed
 * contracts release it — for opposite reasons, handled by their own rules below.
 */
export const RESERVING_CONTRACT_STATUSES: ContractStatus[] = ["draft", "signed"];

export function reservesProperty(status: ContractStatus): boolean {
  return RESERVING_CONTRACT_STATUSES.includes(status);
}

/** What a signed contract leaves behind, by kind. */
export const AVAILABILITY_FOR_KIND: Record<ContractKind, Availability> = { sale: "sold", rent: "rented" };

/**
 * The availability a property should read while this contract stands.
 *
 * One function rather than a condition at each call site, because the four
 * answers are not obvious and two of them are easy to get backwards: a
 * completed SALE leaves the property sold forever, while a completed TENANCY
 * frees it — the term ran its course, which is the opposite of a sale closing.
 */
export function availabilityForContract(c: Pick<ContractRecord, "status" | "kind">): Availability {
  if (c.status === "draft") return "reserved";
  if (c.status === "signed") return AVAILABILITY_FOR_KIND[c.kind];
  if (c.status === "completed") return c.kind === "sale" ? "sold" : "available";
  return "available"; // cancelled
}

/** Is a tenancy past its end date? Sales never expire, so they are never true. */
export function leaseHasEnded(contract: ContractRecord, asOf?: string): boolean {
  return hasExpired(contract, asOf);
}

/**
 * May the public see this listing?
 *
 * Reserved stays VISIBLE. A property under offer is still the most useful thing
 * on the site for someone browsing the area, and hiding it the moment a contract
 * is drafted throws away every enquiry that would have become the back-up buyer
 * when the contract falls through. It is shown with an "under offer" treatment
 * instead.
 */
export function isPubliclyVisible(p: Pick<PropertyRecord, "publication" | "availability">): boolean {
  return p.publication === "published" && p.availability !== "sold" && p.availability !== "rented";
}

/* ----------------------------------------------------------------------------
   Guards
   ------------------------------------------------------------------------- */

export type PublishGuard = { ok: true } | { ok: false; reasonKey: string };

/**
 * May this property be published?
 *
 * A sold or rented property must not go back on the website — that is the whole
 * reason availability was split out of status. Blocked with an explanation
 * rather than silently ignored, so the person trying it learns why.
 */
export function canPublish(p: Pick<PropertyRecord, "availability">): PublishGuard {
  if (p.availability === "sold") return { ok: false, reasonKey: "admin.props.blockedSold" };
  if (p.availability === "rented") return { ok: false, reasonKey: "admin.props.blockedRented" };
  return { ok: true };
}

/* ----------------------------------------------------------------------------
   Transitions — each returns a patch, never a mutation
   ------------------------------------------------------------------------- */

/** A property patch, already carrying the re-derived deprecated `status`. */
type PropertyPatch = Partial<PropertyRecord>;

/* Every transition ends here, so the compatibility field can never drift from
   the two fields it mirrors. */
function patch(next: { publication: Publication; availability: Availability }): PropertyPatch {
  return { ...next, status: legacyStatus(next), published: next.publication === "published" };
}

export interface ReservationResult {
  property: PropertyPatch;
  /** Applied to the contract — without this the publication is gone for good. */
  contract: Pick<ContractRecord, "previousPublication">;
}

/**
 * A contract is drafted: hold the property and take it off the website.
 *
 * The publication it had is written onto the CONTRACT, not stashed on the
 * property. A property can only be held by one contract at a time, and the
 * contract is what gets cancelled — so the contract is the record that has to
 * remember.
 */
export function onContractDrafted(p: Pick<PropertyRecord, "publication" | "availability">): ReservationResult {
  return {
    property: patch({ publication: "unpublished", availability: "reserved" }),
    contract: { previousPublication: p.publication },
  };
}

/** Signed: availability follows the contract's kind, publication stays down. */
export function onContractSigned(contract: Pick<ContractRecord, "kind">): PropertyPatch {
  return patch({ publication: "unpublished", availability: AVAILABILITY_FOR_KIND[contract.kind] });
}

/**
 * Abandoned: the property goes back exactly where it was.
 *
 * Falls back to `draft` when the contract carries no stored publication — draft
 * is the safe floor, and it never guesses "published". Re-advertising a listing
 * the owner had pulled would be worse than leaving it hidden.
 */
export function onContractCancelled(contract: Pick<ContractRecord, "previousPublication">): PropertyPatch {
  return patch({ publication: contract.previousPublication ?? "draft", availability: "available" });
}

/**
 * A tenancy ran out: the property is free again, but stays off the website.
 *
 * Publication is NOT restored, and that asymmetry with `onContractCancelled` is
 * the point. A cancelled contract means nothing happened, so putting the listing
 * back is right. An expired lease means a tenancy ran its course — the rent, the
 * photos and the owner's intentions are all a year older, and republishing it
 * without a person looking would put stale terms in front of the public.
 */
export function onLeaseEnded(p: Pick<PropertyRecord, "publication" | "availability">): PropertyPatch {
  return patch({ publication: p.publication, availability: "available" });
}

/* ----------------------------------------------------------------------------
   Contract-sourced counts — what the KPI cards and reports read
   ------------------------------------------------------------------------- */

export interface ClosedContractCounts {
  sold: number;
  rented: number;
}

/**
 * Which contracts count as a transaction that HAPPENED.
 *
 * Signed, not completed. A signed contract is one the parties are bound by, and
 * that is the point at which the agency has sold or let the property; whether
 * the keys have physically changed hands is a later, separate fact. Counting
 * only completed ones would show zero for every sale still in its handover
 * window, which is most of the recent ones.
 */
export function isClosed(c: Pick<ContractRecord, "status">): boolean {
  return c.status === "signed" || c.status === "completed";
}

/** The day a contract closed — its signing date. Never `createdOn`: a contract
    typed up in April and signed in June closed in June. */
export function closedOn(c: Pick<ContractRecord, "signedOn">): string | undefined {
  return c.signedOn;
}

/** Closed contracts split by kind, optionally narrowed to a set of property ids
    (the properties page scopes its KPIs to whatever the agent can see). */
export function closedContractCounts(contracts: ContractRecord[], propertyIds?: Set<string>): ClosedContractCounts {
  const counts: ClosedContractCounts = { sold: 0, rented: 0 };
  for (const c of contracts) {
    if (!isClosed(c)) continue;
    if (propertyIds && !propertyIds.has(c.propertyId)) continue;
    if (c.kind === "sale") counts.sold++;
    else counts.rented++;
  }
  return counts;
}

/**
 * Closed contracts inside a rolling dashboard window, dated by the contract's
 * own signing day rather than the property's "last touched" day. That is the
 * whole reason to source these from contracts: `property.updated` moves when
 * someone edits a photo, and a sale's date must not.
 */
export function closedContractsInPeriod(contracts: ContractRecord[], period: CountPeriod, propertyIds?: Set<string>): ClosedContractCounts {
  const max = periodWindow(period);
  const counts: ClosedContractCounts = { sold: 0, rented: 0 };
  for (const c of contracts) {
    const on = closedOn(c);
    if (!isClosed(c) || !on) continue;
    if (propertyIds && !propertyIds.has(c.propertyId)) continue;
    const ago = daysAgo(on);
    if (ago < 0 || ago > max) continue;
    if (c.kind === "sale") counts.sold++;
    else counts.rented++;
  }
  return counts;
}

/** Every closed contract's signing day, split by kind — what the reports bucket. */
export function closedContractDates(contracts: ContractRecord[]): { sold: string[]; rented: string[] } {
  const sold: string[] = [];
  const rented: string[] = [];
  for (const c of contracts) {
    const on = closedOn(c);
    if (!isClosed(c) || !on) continue;
    (c.kind === "sale" ? sold : rented).push(on);
  }
  return { sold, rented };
}
