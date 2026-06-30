import { Suspense } from "react";
import { EditPropertyApp } from "../../../_edit-property/edit-property-app";
import "./ep.css";

export default async function AdminEditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <EditPropertyApp id={id} />
    </Suspense>
  );
}
