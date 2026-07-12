import { Suspense } from "react";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SrpApp } from "../_search/srp-app";
import "./srp.css";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const deal = (await searchParams).deal === "rent" ? "rent" : "buy";
  return (
    <>
      <InteriorHeader active={deal} />
      <Suspense fallback={null}>
        <SrpApp />
      </Suspense>
      <Footer />
    </>
  );
}
