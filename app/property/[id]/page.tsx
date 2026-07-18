import { notFound } from "next/navigation";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { buildPdp } from "../../_property/data";
import { PdpApp } from "../../_property/pdp-app";
import "./pdp.css";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = buildPdp(id);
  // Only public (Published) listings have a detail page — anything else 404s.
  if (!data) notFound();
  return (
    <>
      <InteriorHeader active={data.property.deal} />
      <PdpApp data={data} />
      <Footer />
    </>
  );
}
