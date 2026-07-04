"use client";

import { MembersApp } from "@/app/admin/_members/members-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/members/members.css";

export default function AgentMembersPage() {
  const { agent } = useAgentSession();
  return <MembersApp scopeAgent={agent.name} basePath="/agent/members" />;
}
