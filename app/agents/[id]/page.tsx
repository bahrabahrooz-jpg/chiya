import { notFound } from "next/navigation";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { ProfileApp } from "../../_profile/profile-app";
import { profileFor } from "../../_profile/data";
import "./pro.css";

export default async function AgentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = profileFor(id);
  if (!profile) notFound();
  return (
    <>
      <InteriorHeader active="agents" />
      <ProfileApp profile={profile} />
      <Footer />
    </>
  );
}
