import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { NotificationsApp } from "@/app/_account/notifications-app";

export default function NotificationsPage() {
  return (
    <>
      <InteriorHeader />
      <NotificationsApp />
      <Footer />
    </>
  );
}
