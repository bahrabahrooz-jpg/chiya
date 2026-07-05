import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { PropertiesProvider } from "@/app/admin/_shared/properties-store";
import { AddPropertyApp } from "@/app/admin/_add-property/add-property-app";
import { SubmitGuard } from "../../_my-listings/submit-guard";
import "@/app/admin/properties/new/ap.css";

/**
 * Member "Submit your property" flow — the exact multi-step form used in the
 * admin (AddPropertyApp), rendered inside the website layout. `mode="member"`
 * swaps the final "Publish" for "Submit property", files the listing as Pending
 * Review in the member store, and routes back to My Properties. Passing
 * `?edit=<id>` reopens an existing listing prefilled and saves in place.
 */
export default async function SubmitPropertyPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const sp = await searchParams;
  const editListingId = typeof sp.edit === "string" ? sp.edit : undefined;

  return (
    <>
      <InteriorHeader active="sell" />
      <SubmitGuard>
        <PropertiesProvider>
          <div className="cx-container" style={{ maxWidth: "var(--container-lg)" }}>
            <AddPropertyApp mode="member" editListingId={editListingId} />
          </div>
        </PropertiesProvider>
      </SubmitGuard>
      <Footer />
    </>
  );
}
