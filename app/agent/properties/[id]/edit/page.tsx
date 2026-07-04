"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { EditPropertyApp } from "@/app/admin/_edit-property/edit-property-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/properties/[id]/edit/ep.css";

export default function AgentEditPropertyPage() {
  const params = useParams();
  const id = String((params?.id as string) ?? "");
  const { agent } = useAgentSession();
  return (
    <Suspense fallback={null}>
      <EditPropertyApp id={id} lockedAgentId={agent.id} />
    </Suspense>
  );
}
