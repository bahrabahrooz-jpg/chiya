import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Theme mode — the member's appearance preference. "system" follows the device;
 * "light"/"dark" force a token set. Read by the ThemeProvider to pick the active
 * theme. Persisted to the device so the choice survives app restarts.
 */
export type ThemeMode = "light" | "dark" | "system";

export const THEME_MODES: { value: ThemeMode; label: string; sublabel: string }[] = [
  { value: "light", label: "Light", sublabel: "Always use the light theme" },
  { value: "dark", label: "Dark", sublabel: "Always use the dark theme" },
  { value: "system", label: "System", sublabel: "Match your device settings" },
];

export const themeModeLabel = (v: ThemeMode) => THEME_MODES.find((m) => m.value === v)?.label ?? "Light";

const STORAGE_KEY = "chiya.theme-mode.v1";
const MODES: ThemeMode[] = ["light", "dark", "system"];

let mode: ThemeMode = "light";
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

async function hydrate() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!hydrated && raw && MODES.includes(raw as ThemeMode)) {
      mode = raw as ThemeMode;
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

export function setThemeMode(next: ThemeMode) {
  hydrated = true;
  mode = next;
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  emit();
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    subscribe,
    () => mode,
    () => mode,
  );
}
