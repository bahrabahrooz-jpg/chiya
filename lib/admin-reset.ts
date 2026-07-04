"use client";

/**
 * Admin password-reset tokens — a client-only stand-in for the prototype.
 *
 * There's no backend or email service, so a "reset link" is faked with a
 * random token persisted to localStorage with a short expiry. A real backend
 * would instead: issue a signed, single-use token server-side, email the link,
 * and verify + hash the new password on submit. The three functions below are
 * the exact seams to swap for those API calls.
 */

export const ADMIN_RESET_KEY = "chiya:admin-reset";

/** Reset links are valid for 30 minutes, matching a typical real-world TTL. */
const TTL_MS = 30 * 60 * 1000;

interface ResetRecord {
  email: string;
  token: string;
  exp: number;
}

export type VerifyResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" };

function randomToken(): string {
  try {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

function readRecord(): ResetRecord | null {
  try {
    const raw = localStorage.getItem(ADMIN_RESET_KEY);
    return raw ? (JSON.parse(raw) as ResetRecord) : null;
  } catch {
    return null;
  }
}

/** Mint a reset token for `email`, persist it, and return the token string. */
export function createResetToken(email: string): string {
  const rec: ResetRecord = { email, token: randomToken(), exp: Date.now() + TTL_MS };
  try {
    localStorage.setItem(ADMIN_RESET_KEY, JSON.stringify(rec));
  } catch {
    /* noop */
  }
  return rec.token;
}

/** Check a token from a reset link: valid + not expired → returns the email. */
export function verifyResetToken(token: string): VerifyResult {
  const rec = readRecord();
  if (!rec || !token || rec.token !== token) return { ok: false, reason: "invalid" };
  if (Date.now() > rec.exp) {
    consumeResetToken(token);
    return { ok: false, reason: "expired" };
  }
  return { ok: true, email: rec.email };
}

/** Burn the token so a reset link can't be replayed. */
export function consumeResetToken(token: string): void {
  const rec = readRecord();
  if (rec && rec.token === token) {
    try {
      localStorage.removeItem(ADMIN_RESET_KEY);
    } catch {
      /* noop */
    }
  }
}
