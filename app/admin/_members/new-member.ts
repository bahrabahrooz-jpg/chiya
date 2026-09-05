import type { IdKind, MemberRecord } from "../_data/catalog";
import type { Lang } from "@/lib/i18n/config";
import { toIso } from "@/lib/dates";

/* ----------------------------------------------------------------------------
   The member-record factory, on its own.

   IT LIVES HERE FOR A BUNDLE REASON, not a taste one. ./data.ts imports AGENTS
   from the catalogue at module scope, so importing ANYTHING from it pulls the
   entire admin dataset into whatever is asking. The public website's auth store
   creates members now (registering on the site produces a real one), and
   lib/auth.ts is imported by the site header — that is, by every page on the
   site, including the static ones that have no business shipping the agency's
   whole catalogue to a visitor reading the privacy policy.

   Everything below is types (erased at compile time) and a date helper, so this
   module pulls in nothing at runtime. ./data.ts re-exports it, so the two admin
   screens that were already using it never had to change.
   ------------------------------------------------------------------------- */

const NEW_MEMBER_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Turn what an add-member form collected into a member record.
 *
 * THREE PLACES CREATE MEMBERS — the members page, the contract form (which
 * offers it at the moment somebody's details are actually on the desk), and the
 * public website's registration. They must produce the same record: a member
 * added mid-contract that quietly defaulted `remindersOn` differently, or
 * skipped the ID, would be a second class of member that only some screens
 * understand.
 */
export function newMemberRecord(v: {
  name: string;
  phone: string;
  email: string;
  whatsapp: boolean;
  msgLang: Lang | null;
  remindersOn: boolean;
  idKind: IdKind | null;
  idNumber: string;
  city: string;
  area: string;
}): MemberRecord {
  const now = new Date();
  return {
    /* Random, and only good enough for a demo with no server behind it: two
       members created in the same session could collide. The catalogue's own
       ids are hand-assigned; this is the seam where a real backend takes over. */
    id: "M-" + (6000 + Math.floor(Math.random() * 9000)),
    name: v.name.trim() || "New member",
    /* Buyer until a property or contract links them to something else — roles
       are derived from those links, never typed. See deriveMemberRoles. */
    roles: ["Buyer"],
    phone: v.phone.trim(),
    email: v.email.trim(),
    properties: 0,
    joined: `${NEW_MEMBER_MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`,
    daysAgo: 0,
    joinedOn: toIso(now),
    status: "Active",
    img: null,
    whatsapp: v.whatsapp,
    msgLang: v.msgLang,
    remindersOn: v.remindersOn,
    idKind: v.idKind,
    ...(v.idNumber.trim() ? { idNumber: v.idNumber.trim() } : {}),
    ...(v.city ? { city: v.city } : {}),
    ...(v.area.trim() ? { area: v.area.trim() } : {}),
  };
}
