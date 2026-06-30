import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { AgentsApp } from "../_agents/agents-app";
import "./agents.css";

export default function AgentsPage() {
  return (
    <>
      <InteriorHeader active="agents" />
      <AgentsApp />
      <Footer />
    </>
  );
}
