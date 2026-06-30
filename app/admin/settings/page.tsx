import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  return (
    <div className="ax-empty">
      <div className="ax-empty__art">
        <Icon name="settings" size={44} strokeWidth={1.5} />
        <span className="ax-empty__badge">
          <Icon name="wrench" size={20} strokeWidth={2.25} />
        </span>
      </div>
      <h2>Settings coming soon</h2>
      <p>Platform configuration, branding, integrations, and notification preferences will live here. This module isn’t part of the current build yet.</p>
      <div className="ax-empty__actions">
        <Button href="/admin" hierarchy="primary" size="lg" iconLeading="layout-dashboard">
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}
