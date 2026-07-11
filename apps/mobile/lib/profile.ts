import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { user } from "@/components/home/data";

/**
 * Profile — an app-wide store for the signed-in member's account: identity
 * fields plus their preferences (language + notification toggles). Persisted to
 * the device so edits and preferences survive app restarts.
 */
export type Language = "en" | "ku" | "ar";

export interface NotificationPrefs {
  viewings: boolean;
  savedSearches: boolean;
  messages: boolean;
  promotions: boolean;
}

export interface Profile {
  firstName: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  avatar: string | null;
  language: Language;
  notifications: NotificationPrefs;
}

/** Display labels for the language options (English functional; others display-only). */
export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "ku", label: "Kurdish", native: "Kurdî" },
  { value: "ar", label: "Arabic", native: "العربية" },
];

export const languageLabel = (v: Language) => LANGUAGES.find((l) => l.value === v)?.native ?? "English";

let profile: Profile = {
  firstName: user.name,
  fullName: user.fullName,
  email: "bahra.bahroz@gmail.com",
  phone: "+964 750 000 0000",
  location: user.location,
  avatar: null,
  language: "en",
  notifications: { viewings: true, savedSearches: true, messages: true, promotions: false },
};

export const STORAGE_KEY = "chiya.profile.v1";
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function persist() {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch(() => {});
}

async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw) {
      const saved = JSON.parse(raw) as Partial<Profile>;
      // Merge over defaults so newly added fields keep sensible values.
      profile = { ...profile, ...saved, notifications: { ...profile.notifications, ...saved.notifications } };
    }
  } catch {
    // ignore
  } finally {
    if (!hydrated) {
      hydrated = true;
      emit();
    }
  }
}
hydrate();

/** Merge a partial patch into the profile (top-level fields). */
export function updateProfile(patch: Partial<Omit<Profile, "notifications">>) {
  hydrated = true;
  profile = { ...profile, ...patch };
  persist();
  emit();
}

/** Toggle/set a single notification preference. */
export function setNotification(key: keyof NotificationPrefs, value: boolean) {
  hydrated = true;
  profile = { ...profile, notifications: { ...profile.notifications, [key]: value } };
  persist();
  emit();
}

export function useProfile(): Profile {
  return useSyncExternalStore(
    subscribe,
    () => profile,
    () => profile,
  );
}
