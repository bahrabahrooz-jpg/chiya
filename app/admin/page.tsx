import { WelcomeHeader } from "./_dashboard/welcome";
import { KpiSection } from "./_dashboard/kpi-section";
import { OpsSection } from "./_dashboard/ops-section";
import { PerformanceSection } from "./_dashboard/performance-section";
import { RecentSection } from "./_dashboard/recent-section";

export default function AdminDashboardPage() {
  return (
    <>
      <WelcomeHeader />
      <KpiSection />
      <OpsSection />
      <PerformanceSection />
      <RecentSection />
    </>
  );
}
