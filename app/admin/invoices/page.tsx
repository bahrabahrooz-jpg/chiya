import { Suspense } from "react";
import { InvoicesApp } from "../_invoices/invoices-app";
/* The contracts list's chrome — header, KPI strip, table card, filter row,
   footer — imported rather than reproduced, so the two money lists are the same
   screen read two ways instead of two designs that resemble each other. Same
   pattern as the contract form importing the add-property wizard's ap.css.
   invoices.css below holds only what differs: the columns. */
import "../contracts/contracts.css";
import "./invoices.css";

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={null}>
      <InvoicesApp />
    </Suspense>
  );
}
