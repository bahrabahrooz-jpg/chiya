"use client";

import { useCallback, useMemo } from "react";
import {
  onContractCancelled,
  onContractDrafted,
  onContractSigned,
  onLeaseEnded,
  reservesProperty,
} from "../_data/property-state";
import type { ContractRecord } from "../_data/contracts";
import { legacyStatus } from "../_data/catalog";
import { useContracts } from "./contracts-store";
import { useProperties } from "./properties-store";
import { logAudit } from "./audit-log";

/* ----------------------------------------------------------------------------
   Contract transitions — the one place a contract and its property change
   together.

   Contracts and properties live in two providers, and the rules connecting them
   are pure functions in ../_data/property-state.ts. This hook is the seam: it
   reads both stores, applies a rule, and writes BOTH records plus the audit
   trail in one call.

   Why a hook rather than logic in the click handler: writing a contract has to
   unpublish the property, and cancelling one has to put it back exactly where it
   was. Spread across call sites, half of those would get written once and the
   other half forgotten — and a listing that silently stays on the website after
   it has been sold is the failure this whole split exists to prevent.

   AUDIT IS SPLIT ON PURPOSE. A contract that reserves a property changes two
   things — what the public can see, and what has happened to the property — so
   it writes two events with two keys. One "changed status" line would hide which
   of them a person actually decided.
   ------------------------------------------------------------------------- */

/** Everything a caller has to decide when writing a contract. The transition
    supplies the rest (the reservation, the stored publication, the audit). */
export type NewContract = Omit<ContractRecord, "previousPublication">;

export interface ContractTransitions {
  /** Write a contract and apply its consequences to the property. */
  createContract: (contract: NewContract) => void;
  /** Record the signatures — the property becomes sold or rented. */
  signContract: (contractId: string, signedOn: string) => void;
  /** Abandon a contract — the property goes back where it was. */
  cancelContract: (contractId: string, reason: string, cancelledOn: string) => void;
  /** A tenancy has run out — the property is free, but stays off the website. */
  expireLease: (contractId: string) => void;
}

export function useContractTransitions(): ContractTransitions {
  const { contracts, createContract: storeCreate, updateContract } = useContracts();
  const { properties, updateProperty } = useProperties();

  /* The property a contract sits on, or undefined if it has been removed. Every
     transition no-ops rather than throwing on a missing property: a deleted
     listing must not stop a contract being cancelled. */
  const propertyFor = useCallback((propertyId: string) => properties.find((p) => p.id === propertyId), [properties]);

  /* Visibility is a separate event from availability (see the header note), and
     the properties store logs whichever of the two a patch names first. So the
     visibility line is written here, explicitly, before the patch goes in. */
  const logVisibility = useCallback((title: string, id: string, publication: string) => {
    logAudit({
      category: "property",
      actionKey: "audit.action.changedVisibility",
      actionParams: { status: "@status." + publication },
      target: title,
      targetId: id,
    });
  }, []);

  /* A rate that differs from the mandate is a decision someone made about the
     agency's own income. It gets its own event with the reason attached — the
     contract's "created" line would bury it. */
  const logCommissionOverride = useCallback((contract: NewContract, mandateRate: number) => {
    if (!contract.commissionOverrideReason) return;
    logAudit({
      category: "property",
      actionKey: "audit.action.overrodeCommission",
      target: contract.id,
      targetId: contract.id,
      metaKey: "audit.meta.commissionOverride",
      metaParams: { rate: String(contract.commissionRate), mandate: String(mandateRate), reason: contract.commissionOverrideReason },
    });
  }, []);

  const createContract = useCallback(
    (contract: NewContract) => {
      const property = propertyFor(contract.propertyId);
      if (!property) {
        storeCreate(contract as ContractRecord);
        return;
      }
      logCommissionOverride(contract, property.mandate?.commissionRate ?? 0);
      if (!reservesProperty(contract.status)) {
        /* A cancelled or completed contract created after the fact — a record
           of something that already ran its course — holds nothing. */
        storeCreate(contract as ContractRecord);
        return;
      }
      /* A contract can be born signed. The walk-in case is two people at the
         desk agreeing terms and signing on the spot, and making them save a
         draft and re-open it would be a ceremony invented by the software.
         Both paths still run onContractDrafted() first, because that is what
         captures where the listing was before the contract took it — without
         that reading, cancelling later could only guess. */
      const { property: reservation, contract: contractPatch } = onContractDrafted(property);
      const patch = contract.status === "signed" ? onContractSigned(contract) : reservation;
      storeCreate({ ...contract, ...contractPatch });
      logVisibility(property.title, property.id, patch.publication as string);
      updateProperty(property.id, patch);
    },
    [propertyFor, storeCreate, updateProperty, logVisibility, logCommissionOverride],
  );

  const signContract = useCallback(
    (contractId: string, signedOn: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;
      updateContract(contractId, { status: "signed", signedOn });
      const property = propertyFor(contract.propertyId);
      if (!property) return;
      const patch = onContractSigned(contract);
      /* Publication only moves if it was not already down — a drafted contract
         unpublished the property at that point, and logging the same change
         twice would put a no-op in the trail. */
      if (property.publication !== patch.publication) logVisibility(property.title, property.id, patch.publication as string);
      updateProperty(property.id, patch);
    },
    [contracts, propertyFor, updateContract, updateProperty, logVisibility],
  );

  const cancelContract = useCallback(
    (contractId: string, reason: string, cancelledOn: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;
      updateContract(contractId, { status: "cancelled", cancelledOn, cancelReason: reason });
      const property = propertyFor(contract.propertyId);
      if (!property) return;
      /* Release whatever this contract was holding — reserved by a draft, or
         sold/rented by a signed one. It used to release only reservations, which
         left a cancelled sale showing "Sold" on the property forever and the
         listing unreachable. A property that is already available is left alone:
         something else is the reason for that, and this is not the contract
         holding it. */
      if (!reservesProperty(contract.status) || property.availability === "available") return;
      const patch = onContractCancelled(contract);
      if (property.publication !== patch.publication) logVisibility(property.title, property.id, patch.publication as string);
      updateProperty(property.id, patch);
    },
    [contracts, propertyFor, updateContract, updateProperty, logVisibility],
  );

  /**
   * A tenancy past its end date frees the property.
   *
   * NOT ON A TIMER. There is no scheduler in this app, and inventing one that
   * rewrites records in the background would be worse than the gap — a lease
   * quietly expiring at 3am and changing what the admin sees the next morning
   * is the kind of thing nobody can debug. It is called from the contract
   * screens, which is where a person is already looking at the tenancy.
   */
  const expireLease = useCallback(
    (contractId: string) => {
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) return;
      const property = propertyFor(contract.propertyId);
      if (!property || property.availability !== "rented") return;
      // Publication is deliberately untouched, so there is no visibility event.
      updateProperty(property.id, onLeaseEnded(property));
    },
    [contracts, propertyFor, updateProperty],
  );

  return useMemo(
    () => ({ createContract, signContract, cancelContract, expireLease }),
    [createContract, signContract, cancelContract, expireLease],
  );
}

/** The deprecated `status` a state pair reads as — re-exported so callers that
    still show one string do not reach into the catalog for it. */
export { legacyStatus };
