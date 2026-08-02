import type { IconName } from "@/components/ui/icon";
import type { CurrencyCode } from "@/lib/admin-settings";

/* ----------------------------------------------------------------------------
   Static metadata behind the Settings hub — the left-nav sections and the
   option lists for the General section's selects. Labels are i18n keys resolved
   at render time (admin.settings.*). Kept out of settings-app.tsx so the screen
   and its options don't drift.
   ------------------------------------------------------------------------- */

export type SettingsSectionId = "general" | "appearance" | "notifications" | "integrations";

export interface SettingsSection {
  id: SettingsSectionId;
  labelKey: string;
  descKey: string;
  icon: IconName;
}

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "general", labelKey: "admin.settings.nav.general", descKey: "admin.settings.nav.generalDesc", icon: "building-2" },
  { id: "appearance", labelKey: "admin.settings.nav.appearance", descKey: "admin.settings.nav.appearanceDesc", icon: "palette" },
  { id: "notifications", labelKey: "admin.settings.nav.notifications", descKey: "admin.settings.nav.notificationsDesc", icon: "bell" },
  { id: "integrations", labelKey: "admin.settings.nav.integrations", descKey: "admin.settings.nav.integrationsDesc", icon: "plug" },
];

/* Currency options mirror the symbols in lib/fmt.ts (USD/EUR/IQD). The label is
   built at render time as "US Dollar ($)" so the symbol stays with the code. */
export const CURRENCY_OPTIONS: { value: CurrencyCode; nameKey: string; symbol: string }[] = [
  { value: "USD", nameKey: "admin.settings.cur.usd", symbol: "$" },
  { value: "EUR", nameKey: "admin.settings.cur.eur", symbol: "€" },
  { value: "IQD", nameKey: "admin.settings.cur.iqd", symbol: "IQD" },
];

/* A curated short list — enough to be believable, not an exhaustive tz picker.
   Asia/Baghdad (the org's own zone) is the default and leads. */
export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Baghdad", label: "Baghdad · Erbil (GMT+3)" },
  { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
  { value: "Europe/Istanbul", label: "Istanbul (GMT+3)" },
  { value: "Europe/London", label: "London (GMT+0/+1)" },
  { value: "America/New_York", label: "New York (GMT−5/−4)" },
];

export const DATE_FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: "DD/MM/YYYY", label: "31/12/2026" },
  { value: "MM/DD/YYYY", label: "12/31/2026" },
  { value: "YYYY-MM-DD", label: "2026-12-31" },
];

/* Toggle rows for the Notifications section, grouped into cards. */
export type NotifKey = keyof import("@/lib/admin-settings").NotificationSettings;

export interface NotifGroup {
  titleKey: string;
  rows: { key: NotifKey; labelKey: string; descKey: string }[];
}

export const NOTIF_GROUPS: NotifGroup[] = [
  {
    titleKey: "admin.settings.notif.groupViewings",
    rows: [
      { key: "viewingBooked", labelKey: "admin.settings.notif.viewingBooked", descKey: "admin.settings.notif.viewingBookedDesc" },
      { key: "viewingCancelled", labelKey: "admin.settings.notif.viewingCancelled", descKey: "admin.settings.notif.viewingCancelledDesc" },
    ],
  },
  {
    titleKey: "admin.settings.notif.groupReviews",
    rows: [
      { key: "reviewSubmitted", labelKey: "admin.settings.notif.reviewSubmitted", descKey: "admin.settings.notif.reviewSubmittedDesc" },
      { key: "reviewNeedsModeration", labelKey: "admin.settings.notif.reviewNeedsModeration", descKey: "admin.settings.notif.reviewNeedsModerationDesc" },
    ],
  },
  {
    titleKey: "admin.settings.notif.groupCatalog",
    rows: [
      { key: "memberRegistered", labelKey: "admin.settings.notif.memberRegistered", descKey: "admin.settings.notif.memberRegisteredDesc" },
      { key: "propertySubmitted", labelKey: "admin.settings.notif.propertySubmitted", descKey: "admin.settings.notif.propertySubmittedDesc" },
    ],
  },
];
