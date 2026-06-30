import { Suspense } from "react";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SrpApp } from "../_search/srp-app";
import "./srp.css";

export default function SearchPage() {
  return (
    <>
      <InteriorHeader active="buy" />
      <Suspense fallback={null}>
        <SrpApp />
      </Suspense>
      <Footer />
    </>
  );
}
