"use client";

import { ReviewsApp } from "@/app/admin/_reviews/reviews-app";
import { useAgentSession } from "@/lib/agent-session";
import "@/app/admin/members/members.css";
import "@/app/admin/reviews/reviews.css";

export default function AgentReviewsPage() {
  const { agent } = useAgentSession();
  // Own-scope, read-only: the Agent role grants "View reviews" and nothing else,
  // so approving and rejecting stay with the admin.
  return <ReviewsApp scopeAgent={agent.name} readOnly />;
}
