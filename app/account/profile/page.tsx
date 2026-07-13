import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { ProfileApp } from "@/app/_account/profile-app";

export default function ProfilePage() {
  return (
    <>
      <InteriorHeader />
      <ProfileApp />
      <Footer />
    </>
  );
}
