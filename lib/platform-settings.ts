"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Platform-settings store — the state behind the admin Settings screen
 * (/admin/settings). Covers the full 13-section surface (identity, branding,
 * listing vocabularies, viewings, member/agent policy, notification delivery,
 * localization, legal copy, integrations, maintenance, team, security,
 * preferences).
 *
 * Same hydration-safe pattern as lib/theme.ts: an external store read via
 * useSyncExternalStore, seeded from a deterministic default so the server
 * render and first client render agree, then filled in from localStorage after
 * mount. There is no backend — every section persists here and nowhere else.
 *
 * Appearance that must apply *live* (theme, language) is handled by its own
 * engines (lib/theme, lib/i18n); the Branding / Preferences sections bind to
 * those directly and this store only records the preference alongside.
 */

/* --------------------------------- Types ---------------------------------- */

export type CurrencyCode = "USD" | "IQD" | "EUR" | "GBP" | "TRY" | "AED";
export type ThemeChoice = "light" | "dark" | "system";
export type LangCode = "en" | "ar" | "ku";
export type WeekdayId = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export type NotifChannel = "inApp" | "email" | "sms" | "push";

export interface GeneralSettings {
  platformName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  officeAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  defaultCurrency: CurrencyCode;
  areaUnit: "sqm" | "sqft";
  timezone: string;
  dateFormat: string;
}

export interface BrandingSettings {
  logoLightUrl: string;
  logoDarkUrl: string;
  primaryColor: string; // hex, e.g. "#1F6F5C"
  defaultTheme: ThemeChoice;
}

export interface AmenityToggle {
  key: string;
  enabled: boolean;
}
export interface CurrencyToggle {
  code: CurrencyCode;
  enabled: boolean;
}

export interface ListingsSettings {
  propertyTypes: string[];
  conditions: string[];
  furnishing: string[];
  orientations: string[];
  amenities: AmenityToggle[];
  currencies: CurrencyToggle[];
  newListingStatus: "draft" | "pending" | "published";
  expiryDays: number;
  maxGalleryImages: number;
  featuredSlots: number;
}

export interface ViewingsSettings {
  workingDays: WeekdayId[];
  opensAt: string; // "09:00"
  closesAt: string; // "17:00"
  slotMinutes: number;
  breaks: string; // comma-separated start times to skip, e.g. "12:00"
  bookAheadDays: number;
  cancellationHours: number;
  autoConfirm: boolean;
}

export interface MembersSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  agentRequireIdDoc: boolean;
  agentRequireLicence: boolean;
  newReviewPolicy: "auto" | "manual" | "off";
  reviewMinLength: number;
}

export interface NotificationsSettings {
  // matrix[eventId][channel] = delivered?
  matrix: Record<string, Record<NotifChannel, boolean>>;
  senderName: string;
  replyTo: string;
}

export interface LanguageRow {
  code: LangCode;
  enabled: boolean;
  translatedPct: number;
}
export interface LocalizationSettings {
  languages: LanguageRow[];
  defaultLanguage: LangCode;
}

export interface LegalSettings {
  about: string;
  terms: string;
  privacy: string;
}

export interface IntegrationsSettings {
  tileProvider: "osm" | "mapbox" | "google";
  mapsApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smsGateway: string;
  storageProvider: "local" | "s3" | "cloudinary";
  analyticsId: string;
}

export interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  retentionDays: number;
}

export type StaffRole = "owner" | "admin" | "manager" | "agent" | "viewer";
export type StaffStatus = "active" | "suspended" | "invited";
export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  addedAt: string; // ISO date
  avatarUrl?: string;
}
export interface TeamSettings {
  staff: StaffMember[];
}

export interface SessionRow {
  id: string;
  device: string;
  location: string;
  browser: string;
  current: boolean;
}
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessions: SessionRow[];
  // Password itself is never persisted — the strength checklist is live UI and
  // "Update password" is a toast + audit entry only, since there is no backend.
}

export interface PreferencesSettings {
  theme: ThemeChoice;
  language: LangCode;
  density: "comfortable" | "compact";
  landingPage: "dashboard" | "properties" | "viewings";
  notifyWeeklyEmail: boolean;
  notifySound: boolean;
  mutedEvents: string[]; // event ids that are muted for this account
}

export interface PlatformSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  listings: ListingsSettings;
  viewings: ViewingsSettings;
  members: MembersSettings;
  notifications: NotificationsSettings;
  localization: LocalizationSettings;
  legal: LegalSettings;
  integrations: IntegrationsSettings;
  maintenance: MaintenanceSettings;
  team: TeamSettings;
  security: SecuritySettings;
  preferences: PreferencesSettings;
}

/* -------------------------------- Defaults -------------------------------- */

// Bump when the default schema/seed changes so stale caches are dropped.
export const PLATFORM_KEY = "chiya:platform-settings:v1";

/** The 16 amenities offered in the listing forms (matches the screenshots). */
export const AMENITY_KEYS = [
  "smartHome",
  "centralAc",
  "maidRoom",
  "fireplace",
  "security",
  "cctv",
  "generator",
  "elevator",
  "swimmingPool",
  "garden",
  "gym",
  "balcony",
  "bbqArea",
  "playArea",
  "storageRoom",
  "laundryRoom",
] as const;

/** Notification events shown down the left of the delivery matrix. */
export const NOTIF_EVENTS = [
  "agentVerification",
  "listingPending",
  "listingReported",
  "viewingBooked",
  "viewingCancelled",
  "newReview",
  "newMember",
] as const;

/** Seed the matrix from the screenshot's ticked cells. */
function seedMatrix(): NotificationsSettings["matrix"] {
  const off = { inApp: false, email: false, sms: false, push: false };
  const inAppEmail = { inApp: true, email: true, sms: false, push: false };
  const inAppOnly = { inApp: true, email: false, sms: false, push: false };
  return {
    agentVerification: { ...inAppEmail },
    listingPending: { ...inAppEmail },
    listingReported: { ...inAppEmail },
    viewingBooked: { ...inAppOnly },
    viewingCancelled: { ...inAppEmail },
    newReview: { ...inAppOnly },
    newMember: { ...off },
  };
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  general: {
    platformName: "Chiya Estate",
    tagline: "Discover exceptional properties across Kurdistan",
    contactEmail: "hello@chiya.estate",
    contactPhone: "+964 750 123 4567",
    officeAddress: "Gulan Street, Erbil, Kurdistan Region, Iraq",
    facebookUrl: "https://facebook.com/chiyaestate",
    instagramUrl: "https://instagram.com/chiyaestate",
    linkedinUrl: "https://linkedin.com/company/chiyaestate",
    defaultCurrency: "USD",
    areaUnit: "sqm",
    timezone: "Asia/Baghdad",
    dateFormat: "MMM d, yyyy",
  },
  branding: {
    logoLightUrl: "",
    logoDarkUrl: "",
    primaryColor: "#1F6F5C",
    defaultTheme: "system",
  },
  listings: {
    propertyTypes: ["Apartment", "House", "Land", "Office", "Villa"],
    conditions: ["New", "Good", "Needs renovation"],
    furnishing: ["Unfurnished", "Semi-furnished", "Fully furnished"],
    orientations: ["North facing", "South facing", "East facing", "West facing"],
    amenities: AMENITY_KEYS.map((key) => ({ key, enabled: true })),
    currencies: [
      { code: "USD", enabled: true },
      { code: "IQD", enabled: true },
      { code: "EUR", enabled: true },
      { code: "GBP", enabled: false },
      { code: "TRY", enabled: false },
      { code: "AED", enabled: false },
    ],
    newListingStatus: "pending",
    expiryDays: 90,
    maxGalleryImages: 20,
    featuredSlots: 6,
  },
  viewings: {
    workingDays: ["sat", "sun", "mon", "tue", "wed", "thu"],
    opensAt: "09:00",
    closesAt: "17:00",
    slotMinutes: 60,
    breaks: "12:00",
    bookAheadDays: 60,
    cancellationHours: 24,
    autoConfirm: false,
  },
  members: {
    allowSelfRegistration: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    agentRequireIdDoc: true,
    agentRequireLicence: true,
    newReviewPolicy: "manual",
    reviewMinLength: 40,
  },
  notifications: {
    matrix: seedMatrix(),
    senderName: "Chiya Estate",
    replyTo: "no-reply@chiya.estate",
  },
  localization: {
    languages: [
      { code: "en", enabled: true, translatedPct: 0 },
      { code: "ku", enabled: true, translatedPct: 100 },
      { code: "ar", enabled: true, translatedPct: 100 },
    ],
    defaultLanguage: "en",
  },
  legal: {
    about:
      "Chiya Estate is a curated property marketplace for the Kurdistan Region — verified listings, trusted agents, and a hand-picked collection of premium homes across Erbil, Duhok and Sulaymaniyah.",
    terms:
      "By using Chiya Estate you agree to list accurate information and to deal fairly with other members of the platform.",
    privacy:
      "We collect only what we need to run the marketplace, and we never sell personal data to third parties.",
  },
  integrations: {
    tileProvider: "osm",
    mapsApiKey: "",
    smtpHost: "",
    smtpPort: 587,
    smtpUsername: "",
    smsGateway: "",
    storageProvider: "local",
    analyticsId: "",
  },
  maintenance: {
    maintenanceMode: false,
    maintenanceMessage: "Chiya Estate is down for scheduled maintenance. We'll be back shortly.",
    retentionDays: 365,
  },
  team: {
    staff: [
      { id: "u-rebin", name: "Rêbîn Kawa", email: "rebin@chiya.estate", role: "owner", status: "active", addedAt: "2024-01-04" },
      { id: "u-lana", name: "Lana Aziz", email: "lana@chiya.estate", role: "agent", status: "active", addedAt: "2024-02-12" },
      { id: "u-sara", name: "Sara Hama", email: "sara@chiya.estate", role: "agent", status: "active", addedAt: "2024-03-03" },
      { id: "u-diyar", name: "Diyar Salih", email: "diyar@chiya.estate", role: "agent", status: "suspended", addedAt: "2024-04-21" },
      { id: "u-rawa", name: "Rawa Jamal", email: "rawa@chiya.estate", role: "agent", status: "invited", addedAt: "2026-06-08" },
    ],
  },
  security: {
    twoFactorEnabled: false,
    sessions: [
      { id: "s-1", device: "This device", location: "Erbil, Iraq", browser: "Chrome", current: true },
      { id: "s-2", device: "iPhone", location: "Erbil, Iraq", browser: "Safari (iPhone)", current: false },
    ],
  },
  preferences: {
    theme: "light",
    language: "en",
    density: "comfortable",
    landingPage: "dashboard",
    notifyWeeklyEmail: true,
    notifySound: false,
    mutedEvents: [],
  },
};

/* --------------------------------- Store ---------------------------------- */

let current: PlatformSettings = DEFAULT_PLATFORM_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

/** Deep-merge stored partials over defaults so a field added in a later build
    is present even when the stored blob predates it. Arrays and the matrix
    object are replaced wholesale when present, else fall back to the default. */
function parse(raw: string | null): PlatformSettings {
  if (!raw) return DEFAULT_PLATFORM_SETTINGS;
  const d = DEFAULT_PLATFORM_SETTINGS;
  try {
    const p = JSON.parse(raw) as Partial<PlatformSettings>;
    return {
      general: { ...d.general, ...p.general },
      branding: { ...d.branding, ...p.branding },
      listings: { ...d.listings, ...p.listings },
      viewings: { ...d.viewings, ...p.viewings },
      members: { ...d.members, ...p.members },
      notifications: {
        ...d.notifications,
        ...p.notifications,
        matrix: p.notifications?.matrix ?? d.notifications.matrix,
      },
      localization: { ...d.localization, ...p.localization },
      legal: { ...d.legal, ...p.legal },
      integrations: { ...d.integrations, ...p.integrations },
      maintenance: { ...d.maintenance, ...p.maintenance },
      team: { ...d.team, ...p.team },
      security: { ...d.security, ...p.security },
      preferences: { ...d.preferences, ...p.preferences },
    };
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    current = parse(localStorage.getItem(PLATFORM_KEY));
  } catch {
    /* noop */
  }
}

function subscribe(onChange: () => void) {
  hydrate();
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === PLATFORM_KEY) {
      current = parse(e.newValue);
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  return current;
}

function getServerSnapshot() {
  return DEFAULT_PLATFORM_SETTINGS;
}

export function usePlatformSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Persist a whole settings object (used by the Save action on a section). */
  const save = useCallback((next: PlatformSettings) => {
    current = next;
    try {
      localStorage.setItem(PLATFORM_KEY, JSON.stringify(current));
    } catch {
      /* noop */
    }
    emit();
  }, []);

  /** Reset every stored value back to the seeded defaults. */
  const reset = useCallback(() => {
    current = DEFAULT_PLATFORM_SETTINGS;
    try {
      localStorage.removeItem(PLATFORM_KEY);
    } catch {
      /* noop */
    }
    emit();
  }, []);

  return { settings, save, reset };
}

/** How many localStorage keys the reset card reports it will clear. */
export function storedKeyCount(): number {
  try {
    return localStorage.getItem(PLATFORM_KEY) ? 1 : 0;
  } catch {
    return 0;
  }
}
