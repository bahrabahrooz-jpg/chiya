import { Suspense } from "react";
import { PropertiesApp } from "../_properties/properties-app";
import "./properties.css";

export default function AdminPropertiesPage() {
  return (
    <Suspense fallback={null}>
      <PropertiesApp />
    </Suspense>
  );
}
