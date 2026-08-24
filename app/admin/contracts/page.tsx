import { Suspense } from "react";
import { ContractsApp } from "../_contracts/contracts-app";
import "./contracts.css";

export default function AdminContractsPage() {
  return (
    <Suspense fallback={null}>
      <ContractsApp />
    </Suspense>
  );
}
