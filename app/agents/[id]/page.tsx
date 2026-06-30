import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { ProfileApp } from "../../_profile/profile-app";
import "./pro.css";

export default function AgentProfilePage() {
  return (
    <>
      <InteriorHeader active="agents" />
      <ProfileApp />
      <Footer />
    </>
  );
}
