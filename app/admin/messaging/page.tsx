import { Suspense } from "react";
import { MessagingApp } from "../_messaging/messaging-app";
/* Four sheets, none of them new:
     profile.css   the page header and the pf-card chrome
     settings.css  the st-split shell and the sx- section nav
     content.css   the EN/AR/KU language switch on the template editor
     contracts.css the log's table card, filter row, tabs and footer
   Only the columns and the messaging-specific pieces live in the messaging
   stylesheet, which the send modal imports for itself so the contract screen
   gets the contact card without knowing this route exists. */
import "../profile/profile.css";
import "../settings/settings.css";
import "../content/content.css";
import "../contracts/contracts.css";
import "../_shared/messaging/messaging.css";

export default function AdminMessagingPage() {
  return (
    <Suspense fallback={null}>
      <MessagingApp />
    </Suspense>
  );
}
