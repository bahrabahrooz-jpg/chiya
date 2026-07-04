"use client";

import { ViewingsApp } from "@/app/admin/_viewings/viewings-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/viewings/viewings.css";

export default function AgentViewingsPage() {
  const { agent } = useAgentSession();
  return <ViewingsApp scopeAgent={agent.name} basePath="/agent/viewings" />;
}
