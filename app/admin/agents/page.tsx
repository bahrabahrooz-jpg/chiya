import { Suspense } from "react";
import { AgentsApp } from "../_agents-admin/agents-app";
import "./agents.css";

export default function AdminAgentsPage() {
  return (
    <Suspense fallback={null}>
      <AgentsApp />
    </Suspense>
  );
}
