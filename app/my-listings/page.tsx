import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { MyListingsApp } from "../_my-listings/my-listings-app";

export default function MyListingsPage() {
  return (
    <>
      <InteriorHeader active="sell" />
      <MyListingsApp />
      <Footer />
    </>
  );
}
