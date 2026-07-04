import { Suspense } from "react";
import { PropertyDetailApp } from "@/app/admin/_property-detail/property-detail-app";
import "@/app/admin/properties/[id]/pd.css";

export default async function AgentPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PropertyDetailApp id={id} />
    </Suspense>
  );
}
