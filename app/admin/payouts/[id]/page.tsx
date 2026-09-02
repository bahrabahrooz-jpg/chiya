import { Suspense } from "react";
import { OwnerStatementApp } from "../../_payouts/statement-app";
import "../../contracts/contracts.css";
import "../payouts.css";

export default async function AdminOwnerStatementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <OwnerStatementApp ownerId={id} />
    </Suspense>
  );
}
