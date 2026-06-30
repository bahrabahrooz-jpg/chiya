import { ADMIN } from "@/components/admin";

export function WelcomeHeader() {
  return (
    <header className="ax-welcome">
      <div className="ax-welcome__intro">
        <h1 className="ax-welcome__greeting">
          Hello, {ADMIN.first}
          <span className="ax-welcome__wave" role="img" aria-label="waving hand">
            👋
          </span>
        </h1>
        <p className="ax-welcome__sub">Welcome back. Here’s what’s happening across Chiya Estate today.</p>
      </div>
    </header>
  );
}
