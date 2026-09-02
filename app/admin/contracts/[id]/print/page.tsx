import { Suspense } from "react";
import { ContractDocApp } from "../../../_contract-doc/contract-doc-app";
import "./cd.css";

/**
 * THE CONTRACT ITSELF, on paper.
 *
 * The Print button on the contract page has been disabled since the screen was
 * written — there was no document behind it. This is the document: the parties,
 * the property, the money, the dates and the agreed terms, laid out to be
 * signed.
 *
 * Its own route rather than a modal, for the same reason the receipt has one —
 * it is a page somebody PRINTS, a print dialog raised out of a dialog gives the
 * browser two things to lay out, and it is a link an agent can reopen a year
 * later.
 *
 * ⚠ NOT A LEGAL TEMPLATE. See the note at the top of contract-doc-app: the
 * clause wording an Iraqi tenancy needs is a lawyer's work and is pending
 * review. What this prints is the agreed terms, stated plainly and accurately.
 */
export default async function AdminContractPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ContractDocApp id={decodeURIComponent(id)} />
    </Suspense>
  );
}
