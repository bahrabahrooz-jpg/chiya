import { Suspense } from "react";
import { ContractDetailApp } from "@/app/admin/_contract-detail/contract-detail-app";
import "@/app/admin/properties/[id]/pd.css";
import "@/app/admin/contracts/[id]/ct.css";

export default async function AgentContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <ContractDetailApp id={id} agentSurface />
    </Suspense>
  );
}
