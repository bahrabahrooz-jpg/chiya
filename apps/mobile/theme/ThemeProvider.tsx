import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { useThemeMode } from "@/lib/theme-mode";
import { useProfile } from "@/lib/profile";
import { isRtlLocale, localeFor } from "@/lib/i18n";
import { darkTheme, lightTheme, withArabicFonts, type Theme } from "./tokens";

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * ThemeProvider — resolves the active token set from the member's appearance
 * preference (Light / Dark / System) and language. "System" follows the OS
 * color scheme; the others force a theme. Arabic swaps in Arabic-capable fonts.
 * Every primitive reads from useTheme(), so the whole app restyles from here.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const mode = useThemeMode();
  const { language } = useProfile();
  const scheme = mode === "system" ? systemScheme ?? "light" : mode;
  // Arabic and Kurdish (Sorani) both use the Arabic-script font families.
  const usesArabicScript = isRtlLocale(localeFor(language));
  const theme = useMemo(() => {
    const base = scheme === "dark" ? darkTheme : lightTheme;
    return usesArabicScript ? withArabicFonts(base) : base;
  }, [scheme, usesArabicScript]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
