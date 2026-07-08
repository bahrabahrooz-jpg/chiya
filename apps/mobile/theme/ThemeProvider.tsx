import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { useThemeMode } from "@/lib/theme-mode";
import { darkTheme, lightTheme, type Theme } from "./tokens";

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * ThemeProvider — resolves the active token set from the member's appearance
 * preference (Light / Dark / System). "System" follows the OS color scheme; the
 * others force a theme. Every primitive reads its colors from useTheme(), so the
 * whole app recolors from this one place.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeMode();
  const scheme = mode === "system" ? systemScheme ?? "light" : mode;
  const theme = useMemo(() => (scheme === "dark" ? darkTheme : lightTheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
