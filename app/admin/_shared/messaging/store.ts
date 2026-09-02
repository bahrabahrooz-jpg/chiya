"use client";

import { useSyncExternalStore } from "react";
import {
  DEFAULT_TEMPLATES,
  DEFAULT_WHATSAPP,
  TEMPLATE_IDS,
  type MessageLogRow,
  type MessageTemplate,
  type MsgTemplateId,
  type WhatsAppSettings,
} from "./types";

/* ----------------------------------------------------------------------------
   The messaging store — the three things about messaging that are AUTHORED
   rather than derived:

     settings   how and when messages go out
     templates  what they say, in three languages
     sent       the messages a person sent by hand, which nothing implies

   Everything else on the Messaging screen is computed from the contracts, the
   invoices and the payments — see ./outbox and rule 1 in ./types.

   A module singleton with useSyncExternalStore, following _shared/audit-log and
   _messages/messages-store rather than the ContractsProvider context tier: the
   send modal is opened from the contract screen and from the messaging screen,
   and neither should have to be wrapped in a third provider to compose a
   sentence. Persisted to this browser's localStorage, like everything else here.
   ------------------------------------------------------------------------- */

const STORAGE_KEY = "chiya:messaging:v1";
/** Same-tab change signal — the DOM `storage` event only fires in OTHER tabs, so
    a send from the contract screen has to announce itself for a messaging screen
    mounted in the same tab to react. Mirrors messages-store's own event. */
const MESSAGING_EVENT = "chiya:messaging-changed";

interface Persisted {
  settings: WhatsAppSettings;
  templates: Record<MsgTemplateId, MessageTemplate>;
  sent: MessageLogRow[];
}

/* The seed is a stable reference: the server snapshot AND the first client
   snapshot, so hydration matches. localStorage is merged in after mount by
   ensureHydrated(), exactly like the audit log. */
const SEED: Persisted = {
  settings: DEFAULT_WHATSAPP,
  templates: DEFAULT_TEMPLATES,
  sent: [],
};

let state: Persisted = SEED;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Merge a stored blob over the defaults, field by field.
    Wholesale replacement would drop any setting or template added since the
    blob was written, leaving `undefined` where the screen expects a value. */
function merge(saved: Partial<Persisted> | null): Persisted {
  if (!saved) return SEED;
  const templates = { ...DEFAULT_TEMPLATES };
  for (const id of TEMPLATE_IDS) {
    const stored = saved.templates?.[id];
    if (stored) {
      templates[id] = {
        ...DEFAULT_TEMPLATES[id],
        ...stored,
        body: { ...DEFAULT_TEMPLATES[id].body, ...(stored.body ?? {}) },
      };
    }
  }
  return {
    settings: { ...DEFAULT_WHATSAPP, ...(saved.settings ?? {}) },
    templates,
    sent: Array.isArray(saved.sent) ? saved.sent : [],
  };
}

function readFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = merge(raw ? (JSON.parse(raw) as Partial<Persisted>) : null);
  } catch {
    state = SEED;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(MESSAGING_EVENT));
  } catch {
    /* a full or blocked storage quota must not take the screen down */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  readFromStorage();
  if (state !== SEED) emit();
}

/* ---- reads ---- */

function getSnapshot(): Persisted {
  return state;
}
function getServerSnapshot(): Persisted {
  return SEED;
}

function onLocalChange() {
  emit();
}
function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  readFromStorage();
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  ensureHydrated();
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener(MESSAGING_EVENT, onLocalChange);
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && typeof window !== "undefined") {
      window.removeEventListener(MESSAGING_EVENT, onLocalChange);
      window.removeEventListener("storage", onStorage);
    }
  };
}

/* ---- writes ---- */

export function saveWhatsAppSettings(patch: Partial<WhatsAppSettings>) {
  ensureHydrated();
  state = { ...state, settings: { ...state.settings, ...patch } };
  persist();
  emit();
}

export function saveTemplate(id: MsgTemplateId, patch: Partial<Omit<MessageTemplate, "id">>) {
  ensureHydrated();
  const current = state.templates[id];
  state = {
    ...state,
    templates: {
      ...state.templates,
      [id]: { ...current, ...patch, body: { ...current.body, ...(patch.body ?? {}) } },
    },
  };
  persist();
  emit();
}

let seq = 0;
/** Ids for hand-sent messages, distinct from the `auto:` ids ./outbox derives. */
function nextId(): string {
  seq += 1;
  return `man-${Date.now().toString(36)}-${seq.toString(36)}`;
}

/**
 * Record a message a person actually sent — from the contract screen, or the
 * test send on the WhatsApp settings pane.
 *
 * WHAT THIS DOES AND DOES NOT CLAIM: the wa.me link handed the text to the
 * sender's own WhatsApp, and this row records that they did it. It is not proof
 * the message was delivered, which is why nothing here ever writes `delivered`
 * — see the MsgStatus note in ./types.
 */
export function logSentMessage(row: Omit<MessageLogRow, "id" | "manual">): MessageLogRow {
  ensureHydrated();
  const rec: MessageLogRow = { ...row, id: nextId(), manual: true };
  state = { ...state, sent: [rec, ...state.sent] };
  persist();
  emit();
  return rec;
}

/* ---- hooks ---- */

/** The whole authored slice, reactive. */
export function useMessaging(): Persisted {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Delivery settings on their own — the common read. */
export function useWhatsAppSettings(): WhatsAppSettings {
  return useMessaging().settings;
}

/** Template bodies on their own. */
export function useTemplates(): Record<MsgTemplateId, MessageTemplate> {
  return useMessaging().templates;
}
