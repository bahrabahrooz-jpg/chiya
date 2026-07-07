import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, type Theme } from "./tokens";

const ThemeContext = createContext<Theme>(lightTheme);

/**
 * ThemeProvider — resolves the active token set from the OS color scheme and
 * exposes it via useTheme(). Every primitive reads its colors from here, so the
 * whole app follows the device light/dark setting with no per-component logic.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const theme = useMemo(() => (scheme === "dark" ? darkTheme : lightTheme), [scheme]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
