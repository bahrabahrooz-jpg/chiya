import { Suspense } from "react";
import { ContractDetailApp } from "../../_contract-detail/contract-detail-app";
import "../../properties/[id]/pd.css";
import "./ct.css";

export default async function AdminContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ContractDetailApp id={id} />
    </Suspense>
  );
}
