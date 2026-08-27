/* The finance modals, and the write layer behind them.

   One import path for every screen that opens one: the contracts list, a
   property page, the add-property wizard, the contract detail screen and an
   invoice row. Nothing outside this folder reaches past the barrel — the
   generation rules and the store wiring are implementation, and the components
   below are the surface.

   WRITING A CONTRACT IS NOT HERE ANY MORE. NewContractModal is gone, replaced
   by a full page at /admin/contracts/new (app/admin/_contract-form). A lease
   asks about twenty questions, and a 460px panel could not hold them without
   putting three inputs on every row — which is what got the earlier design
   rejected. The screens that used to open the modal navigate to the page. */

export { RecordPaymentModal } from "./record-payment-modal";
export { AddInvoiceModal } from "./add-invoice-modal";
export { VoidInvoiceModal } from "./void-invoice-modal";
export { CancelContractModal } from "./cancel-contract-modal";
export { CloseLeaseModal } from "./close-lease-modal";
export { SettleEarlyModal } from "./settle-early-modal";

export { useFinanceActions, TODAY } from "./finance-actions";
export type {
  FinanceActions,
  PaymentInput,
  ExtraInvoiceInput,
  CancelResult,
  DepositOutcome,
  EarlySettlementInput,
  EarlySettlementResult,
} from "./finance-actions";
export type { ContractDraft, PlannedInvoice } from "./invoice-generation";
