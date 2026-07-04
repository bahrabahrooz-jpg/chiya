"use client";

import { MemberProfileApp } from "@/app/admin/_member-profile/member-profile-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/members/[id]/mpf.css";

export default function AgentMemberProfilePage() {
  const { agent } = useAgentSession();
  return <MemberProfileApp scopeAgent={agent.name} />;
}
