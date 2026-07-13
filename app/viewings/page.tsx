import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { ViewingsApp } from "@/app/_account/viewings-app";

export default function ViewingsPage() {
  return (
    <>
      <InteriorHeader />
      <ViewingsApp />
      <Footer />
    </>
  );
}
