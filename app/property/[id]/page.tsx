import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { PdpApp } from "../../_property/pdp-app";
import "./pdp.css";

export default function PropertyDetailPage() {
  return (
    <>
      <InteriorHeader active="buy" />
      <PdpApp />
      <Footer />
    </>
  );
}
