"use client";

import { useSyncExternalStore } from "react";
import { ADMIN } from "@/components/admin/admin-data";

/* ----------------------------------------------------------------------------
   Contract files — the papers a PERSON put on a contract, as opposed to the
   ones the system printed from money that already moved.

   WHY THIS EXISTS AT ALL. The Documents tab used to be a pure view: every row
   was a receipt derived from a payment or a ledger line, which is why it could
   never drift and why nothing on it could be deleted. That property is worth
   keeping and it is kept — those rows still derive. But it left the tab unable
   to hold the one paper the tenancy actually turns on: the signed contract,
   scanned. The tab said so out loud, in a dashed grey row reading "Not
   available yet", and every other real paper — the tenant's ID, the title
   deed, the bank slip for a transfer nobody can otherwise evidence — had no
   home either.

   So there are two lists, not one, and the split is the whole design:

     DERIVED   receipts and the printable contract. Always current, cannot be
               wrong, cannot be deleted, regenerate on demand.
     FILED     whatever a member of staff uploaded. Can be wrong, can be
               replaced, can be deleted, and carries who put it there.

   Mixing them would let a deletable upload sit at the same weight as a receipt
   that must survive an audit, so they never share a list.

   DEMO SCOPE: there is no file storage behind this and no backend to hold
   bytes. Seeded rows are metadata only; a file uploaded in this session keeps
   its Blob in memory so Download hands back the real bytes, and that memory is
   gone on reload. Deliberately NOT persisted to localStorage — a stored row
   whose bytes had evaporated would be a download button that lies. Kept as a
   module singleton (like audit-log.ts) so the upload site and the tab share
   state without provider plumbing.
   ------------------------------------------------------------------------- */

/**
 * What the paper IS, which is not the same question as what the file format is.
 *
 * Drives the icon and the row's second line, and it is chosen by the uploader
 * rather than sniffed from the extension: a deed photographed on a phone and a
 * deed scanned to PDF are the same document, and "image/jpeg" would not say so.
 */
export type ContractFileKind = "signedContract" | "identity" | "deed" | "transfer" | "photo" | "other";

export const FILE_KINDS: ContractFileKind[] = ["signedContract", "identity", "deed", "transfer", "photo", "other"];

export interface ContractFile {
  id: string;
  contractId: string;
  /** The real filename, as uploaded. Real data — never translated. */
  name: string;
  kind: ContractFileKind;
  /** MIME type, used only to pick between the page icon and the picture icon. */
  mime: string;
  bytes: number;
  /** ISO date the file was put on the contract — not the date it was signed. */
  addedOn: string;
  /** The person who filed it. Real data — never translated. */
  addedBy: string;
  /**
   * Present only for a file uploaded in THIS session. Seeded rows have none,
   * and the download site is what decides what to do about that.
   */
  blob?: Blob;
}

/* --------------------------------- seed ---------------------------------
   Curated per scenario, in the house style: enough contracts carry files to
   show the list full, and enough carry none to keep the empty state reachable
   on a real record rather than only in a screenshot. */

const SEED: ContractFile[] = [
  /* CT-0205 — the Ankawa tenancy the agency collects for. The two files almost
     every tenancy has: the paper everyone signed, and the tenant's ID. */
  {
    id: "CF-0001",
    contractId: "CT-0205",
    name: "Signed tenancy — Ankawa Tower Suite.pdf",
    kind: "signedContract",
    mime: "application/pdf",
    bytes: 1_284_000,
    addedOn: "2026-05-04",
    addedBy: "Karwan Mahmoud",
  },
  {
    id: "CF-0002",
    contractId: "CT-0205",
    name: "Kani Omar — ID card.jpg",
    kind: "identity",
    mime: "image/jpeg",
    bytes: 412_000,
    addedOn: "2026-05-04",
    addedBy: "Karwan Mahmoud",
  },
  /* CT-0201 — a signed sale, which is where the paperwork gets thick: the deed
     is the point of the whole transaction. */
  {
    id: "CF-0003",
    contractId: "CT-0201",
    name: "Signed sale contract.pdf",
    kind: "signedContract",
    mime: "application/pdf",
    bytes: 2_140_000,
    addedOn: "2026-06-12",
    addedBy: "Lana Aziz",
  },
  {
    id: "CF-0004",
    contractId: "CT-0201",
    name: "Title deed — CH-3187.pdf",
    kind: "deed",
    mime: "application/pdf",
    bytes: 890_000,
    addedOn: "2026-06-30",
    addedBy: "Lana Aziz",
  },
  /* CT-0203 — THE CASE THAT PROVES FILES OUTLIVE THE DEAL. The sale was
     cancelled, but $5,000 really arrived and this slip is the only thing that
     says so. Cancelling a contract must never take its papers with it. */
  {
    id: "CF-0005",
    contractId: "CT-0203",
    name: "Deposit transfer — 5,000 USD.pdf",
    kind: "transfer",
    mime: "application/pdf",
    bytes: 96_000,
    addedOn: "2026-05-22",
    addedBy: "Lana Aziz",
  },
];

/* -------------------------------- store -------------------------------- */

let files: ContractFile[] = SEED;
const listeners = new Set<() => void>();
let seq = SEED.length;

function emit() {
  for (const l of listeners) l();
}

export function subscribeContractFiles(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ContractFile[] {
  return files;
}

/** Every file on one contract, newest first — the order the tab renders. */
export function filesForContract(contractId: string): ContractFile[] {
  return files
    .filter((f) => f.contractId === contractId)
    .sort((a, b) => b.addedOn.localeCompare(a.addedOn) || b.id.localeCompare(a.id));
}

export function useContractFiles(contractId: string): ContractFile[] {
  const all = useSyncExternalStore(subscribeContractFiles, getSnapshot, getSnapshot);
  return all
    .filter((f) => f.contractId === contractId)
    .sort((a, b) => b.addedOn.localeCompare(a.addedOn) || b.id.localeCompare(a.id));
}

/**
 * File one upload against a contract.
 *
 * The uploader is the signed-in admin rather than the contract's agent: the
 * question this line answers is "who do I ask about this file", and that is
 * whoever put it there, not whoever wrote the tenancy.
 */
export function addContractFile(contractId: string, file: File, kind: ContractFileKind, on: string): ContractFile {
  seq += 1;
  const rec: ContractFile = {
    id: `CF-${String(seq).padStart(4, "0")}`,
    contractId,
    name: file.name,
    kind,
    mime: file.type || "application/octet-stream",
    bytes: file.size,
    addedOn: on,
    addedBy: ADMIN.name,
    blob: file,
  };
  files = [rec, ...files];
  emit();
  return rec;
}

/**
 * Remove a filed paper. Uploads are deletable BY DESIGN — a wrong scan or a
 * duplicate is an ordinary mistake and leaving it there is worse. Nothing in
 * the derived list has an equivalent, and must not grow one.
 */
export function removeContractFile(id: string): void {
  files = files.filter((f) => f.id !== id);
  emit();
}

/* ------------------------------ presentation ------------------------------ */

/** The icon for a row — the picture icon for images, the page icon otherwise. */
export function fileIcon(f: ContractFile): "image" | "file-text" {
  return f.mime.startsWith("image/") ? "image" : "file-text";
}

/**
 * A file size a person can read. One decimal at most, because the exact byte
 * count of a scan is never the thing anyone came here to learn.
 */
export function fileSize(bytes: number): { n: number; unit: "kb" | "mb" } {
  if (bytes >= 1_000_000) return { n: Math.round((bytes / 1_000_000) * 10) / 10, unit: "mb" };
  return { n: Math.max(1, Math.round(bytes / 1000)), unit: "kb" };
}
