import { Suspense } from "react";
import { ContractFormApp } from "../../_contract-form/contract-form-app";
/* The add-property wizard's chrome — breadcrumbs, centred title, progress rail,
   card and footer — imported rather than reproduced, so the two full-page admin
   workflows are the same product rather than two designs that resemble each
   other. Same pattern as the contract detail page importing pd.css. */
import "../../properties/new/ap.css";
import "./cn.css";

/**
 * Write a contract — a full page, not a modal.
 *
 * THE DOCUMENT TYPE ARRIVES IN THE URL. `?type=sale` and `?type=lease` are the
 * two things the `New contract ▾` menu opens, and a property page or the
 * add-property wizard passes the one that matches the listing so nobody is
 * asked a question the listing already answers.
 *
 *   ?type=sale|lease    which document. Defaults to sale.
 *   ?property=CH-3198   pre-selected and locked.
 *   ?edit=L-2026-0004   reopen a DRAFT with its values loaded.
 *   ?amend=L-2026-0004  amend a SIGNED contract — same form, plus a banner
 *                       and a required reason. See §10.
 */
export default async function AdminNewContractPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[]; property?: string | string[]; edit?: string | string[]; amend?: string | string[] }>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

  /* Anything that is not "lease" is a sale. A mistyped parameter opening the
     wrong document would be worse than a default nobody notices, and "sale" is
     the one a person can spot immediately from the heading. */
  const kind = one(sp.type) === "lease" || one(sp.type) === "rent" ? "rent" : "sale";

  return (
    <Suspense fallback={null}>
      <ContractFormApp
        kind={kind}
        lockedPropertyId={one(sp.property)}
        editingId={one(sp.edit)}
        amendingId={one(sp.amend)}
      />
    </Suspense>
  );
}
