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

/* v2: the seed gained hand-sent messages (SEED_SENT below), and `dryRun` flipped
   to false so the log shows a real mix of sent and delivered instead of one
   word repeated. A v1 blob predates both: it pins the settings to the old test
   mode, which collapses every delivered row back onto "Sent" and empties a tab
   that has data behind it. Settings and templates are small and re-authored in
   a minute, so this is discarded rather than migrated. */
const STORAGE_KEY = "chiya:messaging:v2";
/** Same-tab change signal — the DOM `storage` event only fires in OTHER tabs, so
    a send from the contract screen has to announce itself for a messaging screen
    mounted in the same tab to react. Mirrors messages-store's own event. */
const MESSAGING_EVENT = "chiya:messaging-changed";

/**
 * THE MESSAGES SOMEBODY TYPED, seeded.
 *
 * Nothing derives these — that is what makes them hand-sent — so without a seed
 * the "Sent" tab of the log holds only whatever the automatic schedule happened
 * to produce, and an office looking at a fresh demo sees a messaging screen that
 * has never been used by a person. Four notices over the last fortnight, each
 * against a real contract, in the shape the send modal writes them.
 *
 * ⚠ EVERY ONE IS "sent", NEVER "delivered" and never "failed", and both halves
 * of that are the same rule. A wa.me hand-off cannot be confirmed, so nothing
 * manual may claim delivery — see the MsgStatus note in ./types. And the modal
 * refuses to send to a number that is not on WhatsApp at all (see `canSend`
 * in ./send-modal), so a failed hand-send is a row the app cannot produce; the
 * failures in the log are the automatic ones, where nobody was there to be
 * stopped.
 *
 * Ids are prefixed `seed:` so `merge` can tell them from a real send and keep
 * them across a reload — see the note there.
 */
const SEED_SENT: MessageLogRow[] = [
  {
    id: "seed:man-01",
    templateId: "manual_notice",
    audience: "tenant",
    toName: "Kani Omar",
    toPhone: "+964 773 514 6098",
    lang: "en",
    body: "Hello Kani. The plumber will come to the Ankawa suite on Sunday between 10 and 12. Please let us know if that does not suit you.",
    on: "2026-06-26",
    hour: 11,
    held: false,
    status: "sent",
    contractId: "CT-0205",
    propertyTitle: "Ankawa Tower Suite",
    manual: true,
  },
  {
    id: "seed:man-02",
    templateId: "manual_notice",
    audience: "landlord",
    toName: "Tara Botan",
    toPhone: "+964 750 605 7812",
    lang: "en",
    body: "Good morning. The renewal on the Nizarke house is signed and starts on 20 June at the new rent of $900. A copy is on its way to you.",
    on: "2026-06-16",
    hour: 9,
    held: false,
    status: "sent",
    contractId: "CT-0206",
    propertyTitle: "Nizarke Sunset Terrace",
    manual: true,
  },
  {
    id: "seed:man-03",
    templateId: "manual_notice",
    audience: "landlord",
    toName: "Nma Rashid",
    toPhone: "+964 773 902 6641",
    lang: "en",
    body: "The keys to the Empire World loft were handed over this afternoon and the tenant has moved in. Everything on the inventory was signed off.",
    on: "2026-06-29",
    hour: 16,
    held: false,
    status: "sent",
    contractId: "CT-0210",
    propertyTitle: "Empire World Loft",
    manual: true,
  },
  {
    /* HELD BY QUIET HOURS — typed at half past ten at night and stamped for the
       morning instead. One row wearing the clock icon, so the setting on the
       WhatsApp pane can be seen doing something. */
    id: "seed:man-04",
    templateId: "manual_notice",
    audience: "tenant",
    toName: "Aland Tariq",
    toPhone: "+964 770 128 9903",
    lang: "en",
    body: "Aland — the landlord has agreed to look at the boiler this week. Someone will call you tomorrow to arrange a time.",
    on: "2026-06-23",
    hour: 8,
    held: true,
    status: "sent",
    contractId: "CT-0204",
    propertyTitle: "Sarchnar Cypress Villa",
    manual: true,
  },
];

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
  sent: SEED_SENT,
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
  /* THE SEEDED ROWS ARE DROPPED AND RE-ADDED, never merged in place. A stored
     blob written by an earlier session already CONTAINS them, so a plain concat
     would double every seeded row on the second reload; and taking the stored
     list as-is would freeze whatever the seed said the day that blob was
     written. Stripping the `seed:` ids and putting the current set back is the
     only form of this that is safe to run twice. */
  const typed = Array.isArray(saved.sent) ? saved.sent.filter((r) => !r.id.startsWith("seed:")) : [];
  return {
    settings: { ...DEFAULT_WHATSAPP, ...(saved.settings ?? {}) },
    templates,
    sent: [...typed, ...SEED_SENT],
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
