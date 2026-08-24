import type { IconName } from "@/components/ui/icon";
import type {
  CurrencyCode,
  LangCode,
  NotifChannel,
  StaffRole,
  ThemeChoice,
  WeekdayId,
} from "@/lib/platform-settings";
import { NOTIF_EVENTS } from "@/lib/platform-settings";

/* ----------------------------------------------------------------------------
   Static metadata behind the Settings hub — the grouped left-nav sections, the
   option lists for the many selects, and a couple of pure helpers. Labels are
   i18n keys resolved at render time (admin.psettings.*). Kept out of
   settings-app.tsx so the screen and its options don't drift.
   ------------------------------------------------------------------------- */

export type SettingsSectionId =
  | "general"
  | "branding"
  | "listings"
  | "viewings"
  | "members"
  | "notifications"
  | "localization"
  | "integrations"
  | "maintenance"
  | "team"
  | "security"
  | "preferences";

export interface SettingsNavItem {
  id: SettingsSectionId;
  labelKey: string;
  icon: IconName;
}

export interface SettingsNavGroup {
  labelKey: string;
  items: SettingsNavItem[];
  /** Trailing external links rendered after the group's section items. */
  links?: { labelKey: string; icon: IconName; href: string }[];
}

/** Three groups mirroring the screenshots: PLATFORM / ORGANIZATION / MY ACCOUNT. */
export const SETTINGS_GROUPS: SettingsNavGroup[] = [
  {
    labelKey: "admin.psettings.groups.platform",
    items: [
      { id: "general", labelKey: "admin.psettings.nav.general", icon: "sliders-horizontal" },
      { id: "branding", labelKey: "admin.psettings.nav.branding", icon: "palette" },
      { id: "listings", labelKey: "admin.psettings.nav.listings", icon: "building-2" },
      { id: "viewings", labelKey: "admin.psettings.nav.viewings", icon: "calendar-check" },
      { id: "members", labelKey: "admin.psettings.nav.members", icon: "users" },
      { id: "notifications", labelKey: "admin.psettings.nav.notifications", icon: "bell" },
      { id: "localization", labelKey: "admin.psettings.nav.localization", icon: "languages" },
      { id: "integrations", labelKey: "admin.psettings.nav.integrations", icon: "plug" },
      { id: "maintenance", labelKey: "admin.psettings.nav.maintenance", icon: "database" },
    ],
  },
  {
    labelKey: "admin.psettings.groups.organization",
    items: [{ id: "team", labelKey: "admin.psettings.nav.team", icon: "users-round" }],
  },
  {
    labelKey: "admin.psettings.groups.myAccount",
    items: [
      { id: "security", labelKey: "admin.psettings.nav.security", icon: "shield" },
      { id: "preferences", labelKey: "admin.psettings.nav.preferences", icon: "settings-2" },
    ],
    links: [{ labelKey: "admin.psettings.nav.profile", icon: "user", href: "/admin/profile" }],
  },
];

/* --------------------------------- Options -------------------------------- */

/* The platform supports USD and IQD and nothing else — see CurrencyCode in
   lib/platform-settings. This list is the display metadata for those two, not a
   second definition of which currencies exist. */
export const CURRENCY_OPTIONS: { value: CurrencyCode; nameKey: string; symbol: string }[] = [
  { value: "USD", nameKey: "admin.psettings.cur.usd", symbol: "$" },
  { value: "IQD", nameKey: "admin.psettings.cur.iqd", symbol: "IQD" },
];

export const AREA_UNIT_OPTIONS: { value: "sqm" | "sqft"; labelKey: string }[] = [
  { value: "sqm", labelKey: "admin.psettings.general.sqm" },
  { value: "sqft", labelKey: "admin.psettings.general.sqft" },
];

export const TIMEZONE_OPTIONS: { value: string; label: string }[] = [
  { value: "Asia/Baghdad", label: "Asia/Baghdad" },
  { value: "Asia/Dubai", label: "Asia/Dubai" },
  { value: "Europe/Istanbul", label: "Europe/Istanbul" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
];

export const DATE_FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: "MMM d, yyyy", label: "MMM d, yyyy" },
  { value: "dd/MM/yyyy", label: "dd/MM/yyyy" },
  { value: "MM/dd/yyyy", label: "MM/dd/yyyy" },
  { value: "yyyy-MM-dd", label: "yyyy-MM-dd" },
];

export const THEME_OPTIONS: { value: ThemeChoice; labelKey: string }[] = [
  { value: "system", labelKey: "admin.psettings.theme.system" },
  { value: "light", labelKey: "admin.psettings.theme.light" },
  { value: "dark", labelKey: "admin.psettings.theme.dark" },
];

export const SLOT_OPTIONS: { value: number; labelKey: string }[] = [
  { value: 30, labelKey: "admin.psettings.viewings.slot30" },
  { value: 45, labelKey: "admin.psettings.viewings.slot45" },
  { value: 60, labelKey: "admin.psettings.viewings.slot60" },
  { value: 90, labelKey: "admin.psettings.viewings.slot90" },
];

export const NEW_LISTING_OPTIONS: { value: "draft" | "pending" | "published"; labelKey: string }[] = [
  { value: "published", labelKey: "admin.psettings.listings.autoPublish" },
  { value: "pending", labelKey: "admin.psettings.listings.requireApproval" },
  { value: "draft", labelKey: "admin.psettings.listings.keepDraft" },
];

export const REVIEW_POLICY_OPTIONS: { value: "auto" | "manual" | "off"; labelKey: string }[] = [
  { value: "manual", labelKey: "admin.psettings.members.holdModeration" },
  { value: "auto", labelKey: "admin.psettings.members.publishImmediately" },
  { value: "off", labelKey: "admin.psettings.members.reviewsOff" },
];

export const TILE_PROVIDER_OPTIONS: { value: "osm" | "mapbox" | "google"; labelKey: string }[] = [
  { value: "osm", labelKey: "admin.psettings.integrations.osm" },
  { value: "mapbox", labelKey: "admin.psettings.integrations.mapbox" },
  { value: "google", labelKey: "admin.psettings.integrations.googleMaps" },
];

export const STORAGE_OPTIONS: { value: "local" | "s3" | "cloudinary"; labelKey: string }[] = [
  { value: "local", labelKey: "admin.psettings.integrations.storageLocal" },
  { value: "s3", labelKey: "admin.psettings.integrations.storageS3" },
  { value: "cloudinary", labelKey: "admin.psettings.integrations.storageCloudinary" },
];

export const ROLE_OPTIONS: { value: StaffRole; labelKey: string }[] = [
  { value: "owner", labelKey: "admin.psettings.team.roleOwner" },
  { value: "admin", labelKey: "admin.psettings.team.roleAdmin" },
  { value: "manager", labelKey: "admin.psettings.team.roleManager" },
  { value: "agent", labelKey: "admin.psettings.team.roleAgent" },
  { value: "viewer", labelKey: "admin.psettings.team.roleViewer" },
];

export const DENSITY_OPTIONS: { value: "comfortable" | "compact"; labelKey: string }[] = [
  { value: "comfortable", labelKey: "admin.psettings.preferences.comfortable" },
  { value: "compact", labelKey: "admin.psettings.preferences.compact" },
];

export const LANDING_OPTIONS: { value: "dashboard" | "properties" | "viewings"; labelKey: string }[] = [
  { value: "dashboard", labelKey: "admin.psettings.preferences.landingDashboard" },
  { value: "properties", labelKey: "admin.psettings.preferences.landingProperties" },
  { value: "viewings", labelKey: "admin.psettings.preferences.landingViewings" },
];

/** Working-day chips, in the order shown in the screenshot (Sat → Fri). */
export const WEEKDAYS: { id: WeekdayId; labelKey: string }[] = [
  { id: "sat", labelKey: "admin.psettings.day.sat" },
  { id: "sun", labelKey: "admin.psettings.day.sun" },
  { id: "mon", labelKey: "admin.psettings.day.mon" },
  { id: "tue", labelKey: "admin.psettings.day.tue" },
  { id: "wed", labelKey: "admin.psettings.day.wed" },
  { id: "thu", labelKey: "admin.psettings.day.thu" },
  { id: "fri", labelKey: "admin.psettings.day.fri" },
];

/** Notification delivery-matrix channels, across the top. */
export const NOTIF_CHANNELS: { id: NotifChannel; labelKey: string }[] = [
  { id: "inApp", labelKey: "admin.psettings.notif.inApp" },
  { id: "email", labelKey: "admin.psettings.notif.email" },
  { id: "sms", labelKey: "admin.psettings.notif.sms" },
  { id: "push", labelKey: "admin.psettings.notif.push" },
];

/** The delivery-matrix event rows (reuse the seed order from the store). */
export const NOTIF_EVENT_ROWS = NOTIF_EVENTS.map((id) => ({
  id,
  labelKey: `admin.psettings.notif.event.${id}`,
}));

export const LANG_LABEL: Record<LangCode, { native: string; enKey: string }> = {
  en: { native: "English", enKey: "admin.psettings.lang.en" },
  ku: { native: "Kurdî · Soranî · سۆرانی", enKey: "admin.psettings.lang.ku" },
  ar: { native: "العربية", enKey: "admin.psettings.lang.ar" },
};

/* ------------------------- Password strength rules ------------------------ */

export interface PasswordRule {
  id: string;
  labelKey: string;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "len", labelKey: "admin.psettings.security.ruleLen", test: (pw) => pw.length >= 8 },
  { id: "upper", labelKey: "admin.psettings.security.ruleUpper", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", labelKey: "admin.psettings.security.ruleLower", test: (pw) => /[a-z]/.test(pw) },
  { id: "num", labelKey: "admin.psettings.security.ruleNum", test: (pw) => /\d/.test(pw) },
  { id: "special", labelKey: "admin.psettings.security.ruleSpecial", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

/* -------------------------------- Helpers --------------------------------- */

/** "09:00" → minutes since midnight; NaN-safe. */
function toMinutes(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return NaN;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** minutes → "09:00". */
function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * The bookable start times, derived the same way the public calendar would:
 * step from opensAt to closesAt by slot length, skipping any comma-separated
 * break start times. Pure — the Viewings section renders these as read-only
 * chips via a useMemo.
 */
export function computeSlots(
  opensAt: string,
  closesAt: string,
  slotMinutes: number,
  breaks: string,
): string[] {
  const start = toMinutes(opensAt);
  const end = toMinutes(closesAt);
  if (Number.isNaN(start) || Number.isNaN(end) || slotMinutes <= 0 || end <= start) return [];
  const skip = new Set(
    breaks
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  const out: string[] = [];
  for (let t = start; t < end; t += slotMinutes) {
    const label = toHHMM(t);
    if (!skip.has(label)) out.push(label);
  }
  return out;
}
