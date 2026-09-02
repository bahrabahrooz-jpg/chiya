import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ReceiptApp, type ReceiptKind } from "../../../_receipts/receipt-app";
import "../../receipt.css";

/**
 * A receipt for one movement of money.
 *
 *   /admin/receipts/payment/PAY-…   the tenant paid — his proof
 *   /admin/receipts/landlord/PAY-…  the landlord received it, on a tenancy he
 *                                   collects himself. Same event as above, the
 *                                   other party's paper.
 *   /admin/receipts/payout/LED-…    the landlord received it, on a tenancy the
 *                                   agency collects — a later, separate day.
 *   /admin/receipts/deposit/CT-…    the tenant got his deposit back. Keyed on
 *                                   the CONTRACT, because returning a deposit
 *                                   raises no invoice and moves no revenue —
 *                                   there is no payment record to hang it off,
 *                                   only what the contract already says
 *                                   happened. See the deposit branch in facts.
 *
 * EVERY MONTH'S RENT MAKES TWO PAPERS on every tenancy: one for whoever paid,
 * one for whoever was paid. Which of the last two applies depends only on who
 * physically took the money.
 *
 * Its own route rather than a modal because it is a page somebody PRINTS, and
 * a print dialog raised out of a dialog gives the browser two things to lay
 * out. It is also a link an agent can keep, reopen and print again.
 */
export default async function AdminReceiptPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (kind !== "payment" && kind !== "landlord" && kind !== "payout" && kind !== "deposit") notFound();
  return (
    <Suspense fallback={null}>
      <ReceiptApp kind={kind as ReceiptKind} id={decodeURIComponent(id)} />
    </Suspense>
  );
}
