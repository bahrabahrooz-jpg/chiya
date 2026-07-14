"use client";

import { NotifScreen } from "@/components/admin/notif-screen";
import { useAgentNotifications } from "@/lib/admin-notifications";

export default function AgentNotificationsPage() {
  const data = useAgentNotifications();
  return (
    <NotifScreen
      data={data}
      homeHref="/agent"
      homeLabel="Dashboard"
      subtitle="Updates on your listings, viewings, and activity."
    />
  );
}
