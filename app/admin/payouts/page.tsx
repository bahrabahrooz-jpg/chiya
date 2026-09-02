import { Suspense } from "react";
import { PayoutsApp } from "../_payouts/payouts-app";
/* The contracts list's chrome — header, KPI strip, table card, footer —
   imported rather than reproduced, the same way the invoices list does it.
   payouts.css below holds only what differs. */
import "../contracts/contracts.css";
import "./payouts.css";

export default function AdminPayoutsPage() {
  return (
    <Suspense fallback={null}>
      <PayoutsApp />
    </Suspense>
  );
}
