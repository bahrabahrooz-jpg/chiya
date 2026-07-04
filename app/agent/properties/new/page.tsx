"use client";

import { AddPropertyApp } from "@/app/admin/_add-property/add-property-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/properties/new/ap.css";

export default function AgentAddPropertyPage() {
  const { agent } = useAgentSession();
  return <AddPropertyApp lockedAgentId={agent.id} />;
}
