import type { IconName } from "@/components/ui/icon";
import type { BadgeVariant } from "@/components/ui/badge";

export const VIEW_STATUS_META: Record<string, { variant: BadgeVariant; icon: IconName; cls: string }> = {
  Scheduled: { variant: "info", icon: "clock", cls: "vwd-st--scheduled" },
  Confirmed: { variant: "success", icon: "calendar-check", cls: "vwd-st--confirmed" },
  Completed: { variant: "brand", icon: "check-check", cls: "vwd-st--completed" },
  Cancelled: { variant: "error", icon: "circle-x", cls: "vwd-st--cancelled" },
  "No Show": { variant: "warning", icon: "user-x", cls: "vwd-st--noshow" },
};
export const VIEW_STATUS_DOT: Record<string, string> = {
  Scheduled: "var(--info-500)",
  Confirmed: "var(--success-500)",
  Completed: "var(--green-600)",
  Cancelled: "var(--error-500)",
  "No Show": "var(--warning-500)",
};
export const ROLE_META: Record<string, { variant: BadgeVariant }> = {
  Buyer: { variant: "info" },
  Seller: { variant: "success" },
  Landlord: { variant: "neutral" },
  Tenant: { variant: "brand" },
};

export interface ViewingDetail {
  id: string;
  status: string;
  date: string;
  dateLong: string;
  time: string;
  endTime: string;
  duration: string;
  created: string;
  updated: string;
  contactMethod: string;
  contactIcon: IconName;
  meetingLocation: string;
  notes: string;
  reminderSent: boolean;
  reminderWhen: string;
  property: { id: string; name: string; location: string; listing: string; type: string; price: string; img: string };
  member: { id: string; name: string; role: string; phone: string; email: string };
  agent: { id: string; name: string; phone: string; email: string; experience: number; img: string };
}

export const VIEWING: ViewingDetail = {
  id: "VW-1025",
  status: "Scheduled",
  date: "Jun 16, 2026",
  dateLong: "Monday, June 16, 2026",
  time: "10:00 AM",
  endTime: "10:45 AM",
  duration: "45 minutes",
  created: "Jun 12, 2026 · 2:10 PM",
  updated: "Jun 15, 2026 · 9:02 AM",
  contactMethod: "Phone call",
  contactIcon: "phone",
  meetingLocation: "On-site — Marble Hill Villa, Ankawa",
  notes: "Member is relocating from Dubai and wants to see the master suite, the garden, and the rooftop terrace. Prefers a morning appointment and asked whether the price is negotiable.",
  reminderSent: true,
  reminderWhen: "Jun 15, 2026 · 9:00 AM",
  property: { id: "CH-1042", name: "Marble Hill Villa", location: "Ankawa, Erbil", listing: "For sale", type: "Villa", price: "$1,450,000", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=520&q=75" },
  member: { id: "MEM-1087", name: "Sara Hassan", role: "Buyer", phone: "+964 750 112 4408", email: "sara.hassan@gmail.com" },
  agent: { id: "A-2041", name: "Lana Aziz", phone: "+964 770 552 1190", email: "lana.aziz@chiya.estate", experience: 8, img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=75" },
};

export interface TLItem { icon: IconName; tone: string; title: string; desc: string; time: string; by: string }
export const TIMELINE: TLItem[] = [
  { icon: "bell", tone: "gold", title: "Reminder sent", desc: "Automated viewing reminder delivered to the member by SMS and email.", time: "Jun 15, 2026 · 9:00 AM", by: "System" },
  { icon: "user-plus", tone: "brand", title: "Agent assigned", desc: "Lana Aziz assigned to host this viewing.", time: "Jun 12, 2026 · 2:15 PM", by: "Rêbîn Kawa" },
  { icon: "calendar-plus", tone: "info", title: "Viewing created", desc: "Viewing appointment created for Marble Hill Villa.", time: "Jun 12, 2026 · 2:10 PM", by: "Rêbîn Kawa" },
];

export interface NoteItem { author: string; role: string; time: string; kind: string; text: string }
export const INIT_NOTES: NoteItem[] = [
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 15, 2026 · 9:05 AM", kind: "note", text: "Serious buyer — pre-approved financing confirmed by the bank. Lana should bring the full spec sheet and the garden survey to the viewing." },
  { author: "Rêbîn Kawa", role: "Super Admin", time: "Jun 12, 2026 · 2:12 PM", kind: "review", text: "Member requested a morning slot. Confirmed 10:00 AM with the owner; gate access arranged with the building manager." },
];

export const NOTE_KIND: Record<string, { icon: IconName; cls: string }> = {
  approval: { icon: "circle-check", cls: "is-approval" },
  review: { icon: "shield-check", cls: "is-review" },
  note: { icon: "message-square", cls: "is-note" },
};

export function noteRoleLabel(role: string) {
  const r = (role || "").trim();
  if (!r) return "Note";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase() + " note";
}
