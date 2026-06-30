import { Suspense } from "react";
import { PropertyDetailApp } from "../../_property-detail/property-detail-app";
import "./pd.css";

export default async function AdminPropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PropertyDetailApp id={id} />
    </Suspense>
  );
}
