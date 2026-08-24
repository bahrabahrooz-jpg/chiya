import type { BadgeVariant } from "@/components/ui/badge";
import { ANCHOR_DATE } from "@/lib/dates";
import { MEMBERS, PROPERTIES } from "../_data/catalog";

export const ITEMS_PER_PAGE = 10;

/* ----------------------------------------------------------------------------
   Contact message record. Messages are sent from the public website's contact
   form and the mobile app's contact screen — they are enquiries from the
   outside world, not platform records, so most senders are strangers with no
   member account.

   Flow: a submission lands as "New". Opening it marks it "Read". Replying opens
   the admin's mail client (mailto:) and marks it "Replied". Anything handled or
   unwanted is "Archived". Nothing here is moderation — an enquiry is never
   "approved"; it is answered or filed away.
   ------------------------------------------------------------------------- */
export type MessageStatus = "New" | "Read" | "Replied" | "Archived";

/**
 * Where the message was typed.
 *
 * IMPORTANT — "Mobile" messages in this inbox are seeded, not transported. The
 * Expo bundle stores to the device's AsyncStorage and this app stores to the
 * browser's localStorage; they share no process, origin or filesystem, so
 * without a backend there is no channel between them. apps/mobile/lib/
 * contact-messages.ts retains mobile submissions on-device so that screen stops
 * discarding input and is ready to POST the day a backend exists — but a
 * message typed on a phone will NOT appear here. Do not assume a bridge.
 */
export type MessageSource = "Website" | "Mobile";

export interface MessageRecord {
  id: string;
  /** Sender's own name — real data, never translated. */
  name: string;
  email: string;
  subject: string;
  body: string;
  source: MessageSource;
  status: MessageStatus;
  /** Canonical English date ("Jun 28, 2026"), like ReviewRecord.submitted. */
  received: string;
  /** 24h clock ("09:42") — several messages can land on the same day. */
  receivedTime: string;
  daysAgo: number;
  /** The instant this arrived, in epoch ms — the only thing ordering uses.
      Seeded rows derive it from TODAY − daysAgo; a live submission uses the
      real clock, which is necessarily later than the demo anchor, so a message
      someone just sent always lands at the top of the queue. Comparing the
      seed's fictional clock times against a real one would not order them. */
  sortAt: number;
  /** Set when the sender's email matches the member roster; null for a stranger
      (a public contact form is open to anyone — most enquiries are strangers). */
  memberId: string | null;
  memberImg: string | null;
  /** The listing the enquiry is about, when it names one. */
  propertyId?: string;
  propertyTitle?: string;
}

/* Archived carries no dot so it visually recedes from the three live states. */
export const MESSAGE_STATUS: Record<MessageStatus, { variant: BadgeVariant; dot: boolean }> = {
  New: { variant: "info", dot: true },
  Read: { variant: "neutral", dot: true },
  Replied: { variant: "success", dot: true },
  Archived: { variant: "neutral", dot: false },
};

export const STATUS_TABS: { id: string; label: string }[] = [
  { id: "", label: "All" },
  { id: "New", label: "New" },
  { id: "Read", label: "Read" },
  { id: "Replied", label: "Replied" },
  { id: "Archived", label: "Archived" },
];

export const SOURCES: MessageSource[] = ["Website", "Mobile"];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** The inbox's demo "now" — a constant, not `new Date()`, so the server and
    client renders agree (and relative labels stay stable across reloads). */
export const TODAY = ANCHOR_DATE; // the shared seed anchor (Jun 30, 2026)
const dateFromDaysAgo = (d: number) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() - d);
  return MONTHS_SHORT[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear();
};
/** Epoch ms for a seeded message: the demo anchor, back `d` days, at `hhmm`. */
const instantFromDaysAgo = (d: number, hhmm: string) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() - d);
  const [h, min] = hhmm.split(":").map(Number);
  dt.setHours(h, min, 0, 0);
  return dt.getTime();
};

/* ----------------------------------------------------------------------------
   Hand-curated seed (12). Half the senders are real members from the catalog so
   the inbox cross-references records the admin can open elsewhere; the rest are
   strangers, which is what a public contact form actually receives.
   Coverage: all four statuses, both sources, member and stranger senders,
   property-linked and general enquiries, and one spam submission (MSG-2040)
   whose archived state is self-explanatory from its text — the same treatment
   the reviews seed gives its rejection-worthy entries.
   ------------------------------------------------------------------------- */
interface MessageSpec {
  id: string;
  /** A catalog member (email + avatar are looked up), or… */
  member?: string;
  /** …a stranger: name + email given outright. */
  name?: string;
  email?: string;
  subject: string;
  body: string;
  source: MessageSource;
  status: MessageStatus;
  daysAgo: number;
  time: string;
  property?: string;
}

const MESSAGE_SPECS: MessageSpec[] = [
  {
    id: "MSG-2051", member: "Dara Kamal", source: "Website", status: "New", daysAgo: 0, time: "11:20", property: "CH-3200",
    subject: "Viewing request — Marble Hill Villa",
    body: "Hello, I saw the Marble Hill Villa listing in Empire World and I would like to arrange a viewing this week if possible. I am flexible on the day but afternoons work best for me. Could someone call me to confirm a time? Thank you.",
  },
  {
    id: "MSG-2050", name: "Hemin Star", email: "hemin.star@outlook.com", source: "Mobile", status: "New", daysAgo: 0, time: "09:05", property: "CH-3199",
    subject: "Is the Dream City flat still available?",
    body: "I found the Dream City Garden Flat on your app and the listing still shows as available. Is that up to date? I am relocating to Erbil next month and would need to move in fairly quickly.",
  },
  {
    id: "MSG-2049", member: "Sara Amin", source: "Website", status: "New", daysAgo: 1, time: "16:48", property: "CH-3191",
    subject: "Question about the rent on Malta Riverside Loft",
    body: "Could you tell me whether the monthly rent for the Malta Riverside Loft includes service charges and building maintenance? The listing does not say, and it makes a difference to my budget.",
  },
  {
    id: "MSG-2048", name: "Rezan Hiwa", email: "rezan.hiwa@gmail.com", source: "Website", status: "Read", daysAgo: 2, time: "10:12",
    subject: "Becoming an agent on Chiya",
    body: "I have been working in residential sales in Sulaymaniyah for six years and I would like to join Chiya as an agent. What documents do you need for verification, and how long does the process usually take?",
  },
  {
    id: "MSG-2047", member: "Nma Rashid", source: "Mobile", status: "Read", daysAgo: 3, time: "14:36", property: "CH-3199",
    subject: "Updating the photos on my listing",
    body: "I have repainted the living room and the current photos on my Dream City listing are out of date. I tried to replace them from the app but I could not find where to do it. Can someone help me update them?",
  },
  {
    id: "MSG-2046", name: "Bnar Kareem", email: "b.kareem@zagrosgroup.iq", source: "Website", status: "Replied", daysAgo: 5, time: "13:02", property: "CH-3196",
    subject: "Do you handle commercial leases?",
    body: "We are looking for around 200 square metres of office space in Erbil for a team of twenty. I noticed the Gulan Business Suite on your site. Do you handle commercial leases directly, and can we arrange a walkthrough?",
  },
  {
    id: "MSG-2045", member: "Aland Tariq", source: "Mobile", status: "Replied", daysAgo: 6, time: "18:55", property: "CH-3182",
    subject: "Thank you — the handover went smoothly",
    body: "Just wanted to say the move into the Sarchnar villa went perfectly. Everything was ready when we arrived and the agent stayed until we had the keys sorted. Please pass on our thanks to the team.",
  },
  {
    id: "MSG-2044", member: "Chiman Rasul", source: "Website", status: "Replied", daysAgo: 9, time: "08:40", property: "CH-3197",
    subject: "Price adjustment on English Village Court",
    body: "I would like to bring the asking price down slightly on my English Village listing — it has been on the market for a while now. What is the process for changing it, and how soon would the new price show on the site?",
  },
  {
    id: "MSG-2043", name: "Sipan Aziz", email: "sipan@rojfinance.example", source: "Website", status: "Read", daysAgo: 12, time: "15:27",
    subject: "Partnership enquiry — mortgage brokerage",
    body: "We are a mortgage brokerage based in Erbil and we would like to discuss referring financing options to your buyers. Is there someone on your side who handles partnerships?",
  },
  {
    id: "MSG-2042", member: "Kani Omar", source: "Mobile", status: "Replied", daysAgo: 16, time: "12:15", property: "CH-3181",
    subject: "Maintenance contact for the Ankawa suite",
    body: "The water heater in the Ankawa Tower Suite has stopped working. Who should I contact about repairs — the landlord directly, or does Chiya arrange maintenance for rented units?",
  },
  {
    id: "MSG-2041", name: "Havin Zrar", email: "havin.zrar@gmail.com", source: "Mobile", status: "Archived", daysAgo: 24, time: "20:31",
    subject: "Website feedback: search filters",
    body: "Small suggestion — it would be very useful to filter listings by floor number and whether there is a lift. I live in a building with neither and it is something I always have to check manually. Otherwise the app is great.",
  },
  {
    id: "MSG-2040", name: "Dijla Deals Team", email: "promo@dijla-deals.example", source: "Website", status: "Archived", daysAgo: 27, time: "03:14",
    subject: "50% OFF FURNITURE THIS WEEK ONLY!!!",
    body: "Best prices on furniture!! Call 0750 555 0123 or visit dijla-deals.example for 50% OFF sofas, beds and dining sets!!! Limited stock, order today!!! Wholesale enquiries welcome.",
  },
];

/** Rank used for ordering: New first, then most recent. */
const STATUS_RANK: Record<MessageStatus, number> = { New: 0, Read: 1, Replied: 1, Archived: 2 };

function buildMessages(): MessageRecord[] {
  const out = MESSAGE_SPECS.map((s) => {
    const m = s.member ? MEMBERS.find((mm) => mm.name === s.member) : undefined;
    if (s.member && !m) throw new Error(`messages: unknown member "${s.member}"`);
    if (!m && !(s.name && s.email)) throw new Error(`messages: ${s.id} — a non-member sender needs both name and email`);
    // A member can't have written before they joined.
    if (m && m.daysAgo < s.daysAgo) throw new Error(`messages: ${s.id} — "${m.name}" joined after this message was sent`);

    let propertyTitle: string | undefined;
    if (s.property) {
      const p = PROPERTIES.find((pp) => pp.id === s.property);
      if (!p) throw new Error(`messages: ${s.id} — unknown property "${s.property}"`);
      if (p.daysAgo < s.daysAgo) throw new Error(`messages: ${s.id} — enquiry predates listing "${s.property}"`);
      // A stranger can only have found a listing that is publicly visible; a
      // member may legitimately write about their own or their rented property.
      if (!m && p.status !== "Published") throw new Error(`messages: ${s.id} — stranger enquiry about non-public listing "${s.property}" (${p.status})`);
      propertyTitle = p.title;
    }

    return {
      id: s.id,
      name: m ? m.name : s.name!,
      email: m ? m.email : s.email!,
      subject: s.subject,
      body: s.body,
      source: s.source,
      status: s.status,
      received: dateFromDaysAgo(s.daysAgo),
      receivedTime: s.time,
      daysAgo: s.daysAgo,
      sortAt: instantFromDaysAgo(s.daysAgo, s.time),
      memberId: m ? m.id : null,
      memberImg: m ? m.img : null,
      propertyId: s.property,
      propertyTitle,
    };
  });

  /* Coverage guards — the demo must exercise every control on the screen, so a
     seed edit that drops a status or the whole Mobile source fails the build
     rather than quietly making a filter look decorative. */
  for (const st of Object.keys(STATUS_RANK) as MessageStatus[]) {
    if (!out.some((x) => x.status === st)) throw new Error(`messages: no seed message with status "${st}"`);
  }
  for (const src of SOURCES) {
    if (!out.some((x) => x.source === src)) throw new Error(`messages: no seed message from source "${src}"`);
  }
  if (!out.some((x) => x.memberId)) throw new Error("messages: no seed message from a real member — the sender column would never link to a record");
  if (!out.some((x) => !x.memberId)) throw new Error("messages: no seed message from a stranger — unrealistic for a public contact form");

  return sortMessages(out);
}

/** Unread first, then newest — the order a queue should read in. */
export function sortMessages(list: MessageRecord[]): MessageRecord[] {
  return [...list].sort((a, b) => {
    const rank = STATUS_RANK[a.status] - STATUS_RANK[b.status];
    if (rank !== 0) return rank;
    return b.sortAt - a.sortAt;
  });
}

export const MESSAGES: MessageRecord[] = buildMessages();

export const EMPTY_FILTERS = { q: "", status: "", source: "" };
export type MessageFilters = typeof EMPTY_FILTERS;
