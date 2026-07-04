"use client";

import { Suspense } from "react";
import { PropertiesApp } from "@/app/admin/_properties/properties-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/properties/properties.css";

export default function AgentPropertiesPage() {
  const { agent } = useAgentSession();
  return (
    <Suspense fallback={null}>
      <PropertiesApp scopeAgent={agent.name} basePath="/agent/properties" />
    </Suspense>
  );
}
