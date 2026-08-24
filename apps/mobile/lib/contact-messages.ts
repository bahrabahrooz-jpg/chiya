import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Contact messages — the member's own submissions from the Contact screen,
 * persisted to the device via AsyncStorage so a sent message survives an app
 * restart instead of vanishing the moment the form clears.
 *
 * IMPORTANT — this does NOT reach the admin inbox, and cannot. AsyncStorage is
 * a native device store; the web app's admin inbox lives in a browser's
 * localStorage. They share no process, origin or filesystem, so with no backend
 * there is no channel between them. The Mobile-source messages visible at
 * /admin/messages are seeded there deliberately (see the MessageSource note in
 * app/admin/_messages/data.ts) — they are not transported from here.
 *
 * What this store buys: the screen stops discarding what people type, and there
 * is one obvious place to POST from the day a backend exists.
 */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: number;
}

const STORAGE_KEY = "chiya.contact-messages.v1";

let items: ContactMessage[] = [];
let hydrated = false;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
}

/** Load persisted messages once at startup. A submission made before this
 *  resolves wins (we skip the stale load) so a fresh message is never clobbered. */
async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw) {
      items = JSON.parse(raw) as ContactMessage[];
    }
  } catch {
    // ignore corrupt/unavailable storage — start empty
  } finally {
    if (!hydrated) {
      hydrated = true;
      emit();
    }
  }
}
hydrate();

export function addContactMessage(input: { name: string; email: string; subject: string; message: string }): ContactMessage {
  hydrated = true;
  const msg: ContactMessage = {
    id: `cm-${Date.now()}`,
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    createdAt: Date.now(),
  };
  items = [msg, ...items];
  persist();
  emit();
  return msg;
}

export function useContactMessages(): ContactMessage[] {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => items,
  );
}
