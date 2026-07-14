"use client";

import { NotifScreen } from "@/components/admin/notif-screen";
import { useAdminNotifications } from "@/lib/admin-notifications";

export default function AdminNotificationsPage() {
  const data = useAdminNotifications();
  return (
    <NotifScreen
      data={data}
      homeHref="/admin"
      homeLabel="Dashboard"
      subtitle="Platform activity and updates across Chiya."
    />
  );
}
