import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SavedApp } from "@/app/_account/saved-app";

export default function SavedPage() {
  return (
    <>
      <InteriorHeader />
      <SavedApp />
      <Footer />
    </>
  );
}
