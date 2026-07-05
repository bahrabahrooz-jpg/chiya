"use client";

import { useEffect, type ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { EmptyState } from "@/components/data";
import { Button } from "@/components/ui/button";
import { openAuth, useAuth } from "@/lib/auth";
import "./my-listings.css";

/**
 * SubmitGuard — gates the member submission flow behind authentication. Signed-
 * out visitors get the auth modal (redirecting back here after login) and a
 * sign-in prompt; signed-in members see the flow.
 */
export function SubmitGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) openAuth("login", { note: "Sign in to submit your property.", next: "/my-listings/new" });
  }, [user]);

  if (!user) {
    return (
      <main className="ml-main">
        <Container>
          <EmptyState
            icon="lock"
            title="Sign in to submit a property"
            description="Submitting a property on Chiya Estate requires a member account. Sign in or create one to get started."
            action={
              <Button hierarchy="primary" iconLeading="log-in" onClick={() => openAuth("login", { next: "/my-listings/new" })}>
                Sign in
              </Button>
            }
          />
        </Container>
      </main>
    );
  }

  return <main className="ml-main">{children}</main>;
}
