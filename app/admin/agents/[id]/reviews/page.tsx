"use client";

import { useParams } from "next/navigation";
import { ReviewsApp } from "@/app/admin/_reviews/reviews-app";
import { useProperties } from "@/app/admin/_shared/properties-store";
import "@/app/admin/members/members.css";
import "@/app/admin/reviews/reviews.css";

// Per-agent reviews screen opened from the agent detail page's rating summary
// card. Reuses the global ReviewsApp scoped to this one agent — admin scope, so
// no readOnly: approving/rejecting/deleting stay available here.
export default function AdminAgentReviewsPage() {
  const { agents } = useProperties();
  const params = useParams();
  const id = String((params?.id as string) ?? "");
  const agent = agents.find((a) => a.id === id) ?? agents[0];
  return <ReviewsApp scopeAgent={agent.name} />;
}
