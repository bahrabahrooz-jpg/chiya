"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import "./error-screen.css";

/* ----------------------------------------------------------------------------
   The screen behind every dead end on the public website.

   There was none. A property that had been taken down called notFound() with
   nothing to render, so a visitor who followed an old WhatsApp link to a sold
   flat got the framework's bare grey page — no header, no footer, no way back
   into the site, and in English no matter which language they were reading in.
   The same page showed for a crash.

   ONE COMPONENT, TWO MEANINGS. A 404 and a crash are different things to say
   but the same thing to build: a mark, a sentence explaining what happened, and
   the way onward. Splitting them into two screens would be two things to keep
   in step for no gain, so the caller supplies the words and the exits.
   ------------------------------------------------------------------------- */

export interface ErrorScreenProps {
  /** Lucide icon for the mark. */
  icon: IconName;
  /** Big number or short code above the heading — "404" and the like. Optional:
      a crash has no code worth showing a visitor. */
  code?: string;
  title: string;
  body: string;
  /** Primary and secondary ways out. At least one, or the screen is a dead end
      with better manners than the one it replaced and no more use. */
  children: React.ReactNode;
  /** The error digest, shown small and last. It is the only string that helps
      anybody diagnose a production crash, and it is meaningless to the visitor,
      so it sits at the bottom looking like what it is: a reference number. */
  reference?: string;
}

export function ErrorScreen({ icon, code, title, body, children, reference }: ErrorScreenProps) {
  return (
    <main className="nf-main">
      <Container>
        <div className="nf-box">
          <span className="nf-art" aria-hidden="true">
            <Icon name={icon} size={40} strokeWidth={1.5} />
          </span>
          {code && <span className="nf-code">{code}</span>}
          <h1 className="nf-title">{title}</h1>
          <p className="nf-body">{body}</p>
          <div className="nf-actions">{children}</div>
          {reference && <p className="nf-ref">{reference}</p>}
        </div>
      </Container>
    </main>
  );
}

/** Re-exported so the pages below don't each import the button separately. */
export { Button };
