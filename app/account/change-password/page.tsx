import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { ChangePasswordApp } from "@/app/_account/change-password-app";

export default function ChangePasswordPage() {
  return (
    <>
      <InteriorHeader />
      <ChangePasswordApp />
      <Footer />
    </>
  );
}
