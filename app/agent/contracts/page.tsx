"use client";

import { Suspense } from "react";
import { ContractsApp } from "@/app/admin/_contracts/contracts-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/contracts/contracts.css";

/**
 * The agent's own contracts.
 *
 * DELIBERATELY NOT IN THE AGENT NAV YET. The property page's Contracts tab
 * links here, so the route has to exist or those links 404 — but whether the
 * agent console gets a Contracts section of its own, and what an agent may do
 * once inside it, is a permissions decision. Contracts are gated on
 * `properties.view` for now (see lib/agent-permissions), which is what makes
 * this page reachable at all.
 *
 * TODO(contracts permissions task): decide the agent's contract scope, then
 * add the nav entry to components/agent/agent-data.
 */
export default function AgentContractsPage() {
  const { agent } = useAgentSession();
  return (
    <Suspense fallback={null}>
      <ContractsApp scopeAgentId={agent.id} basePath="/agent/contracts" />
    </Suspense>
  );
}
