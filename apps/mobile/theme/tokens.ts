/**
 * Chiya design tokens — ported from the web design system
 * (styles/tokens.css) into a typed JS theme for React Native.
 *
 * Values are 1:1 with the website so the app and site share one visual
 * language: forest-green brand, warm-gold accent, 4px spacing, the serif/sans
 * type pairing, and a full dark-mode override.
 */

/** Raw brand/neutral ramps (light-mode source values). */
const palette = {
  green: {
    25: "#F4F8F5",
    50: "#E7F0EA",
    100: "#C6DDCF",
    200: "#9FC4AE",
    300: "#6FA384",
    400: "#468062",
    500: "#2C6149",
    600: "#20503C",
    700: "#18402F", // primary brand
    800: "#112E22",
    900: "#0B2018",
    950: "#061410",
  },
  gold: {
    50: "#F9F2DF",
    100: "#F0E1B4",
    200: "#E5CB83",
    300: "#D8B45A",
    400: "#C9A24B", // accent base
    500: "#B68A3A",
    600: "#997031",
    700: "#79572A",
  },
  gray: {
    25: "#FCFCFD",
    50: "#F8F9FA",
    100: "#F1F2F4",
    200: "#E5E7EB",
    300: "#D2D5DB",
    400: "#9CA1AC",
    500: "#6F747E",
    600: "#545862",
    700: "#3F434C",
    800: "#292C33",
    900: "#191B20",
    950: "#0E0F13",
  },
  white: "#FFFFFF",
  black: "#000000",
  error: "#C0392B",
  success: "#1F8A5B",
} as const;

/** Semantic color set. Same keys for light and dark so components stay theme-agnostic. */
export interface Colors {
  brandPrimary: string;
  brandPrimaryPressed: string;
  /** A lighter/softer brand green (the "hover" green). */
  brandHover: string;
  brandSubtle: string;
  brandAccent: string;
  brandAccentPressed: string;

  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textPlaceholder: string;
  textOnBrand: string;
  textBrand: string;
  textError: string;

  surfacePage: string;
  surfaceCard: string;
  surfaceRaised: string;
  surfaceSunken: string;

  borderSubtle: string;
  borderDefault: string;
  borderStrong: string;
  borderFocus: string;

  ringBrand: string;
  ringError: string;
  error: string;
  success: string;

  /** Brand lockup */
  brandMarkStroke: string;
  brandWordmark: string;

  /** Scrim behind sheets/overlays */
  overlay: string;
}

const lightColors: Colors = {
  brandPrimary: palette.green[700],
  brandPrimaryPressed: palette.green[900],
  brandHover: palette.green[500], // #2C6149 — lighter brand green
  brandSubtle: palette.green[50],
  brandAccent: palette.gold[400],
  brandAccentPressed: palette.gold[500],

  textPrimary: palette.gray[900],
  textSecondary: palette.gray[600],
  textTertiary: palette.gray[500],
  textPlaceholder: palette.gray[400],
  textOnBrand: palette.white,
  textBrand: palette.green[700],
  textError: "#A02D21",

  surfacePage: palette.gray[50],
  surfaceCard: palette.white,
  surfaceRaised: palette.white,
  surfaceSunken: palette.gray[100],

  borderSubtle: palette.gray[200],
  borderDefault: palette.gray[300],
  borderStrong: palette.gray[400],
  borderFocus: palette.green[600],

  ringBrand: "rgba(24, 64, 47, 0.18)",
  ringError: "rgba(192, 57, 43, 0.18)",
  error: palette.error,
  success: palette.success,

  brandMarkStroke: palette.green[700],
  brandWordmark: palette.green[700],

  overlay: "rgba(11, 32, 24, 0.55)",
};

const darkColors: Colors = {
  brandPrimary: palette.green[700],
  brandPrimaryPressed: palette.green[600], // dark: pressed brightens
  brandHover: "#4E9B77",
  brandSubtle: "#17271F",
  brandAccent: palette.gold[400],
  brandAccentPressed: palette.gold[300],

  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#94A3B8",
  textPlaceholder: "#64748B",
  textOnBrand: "#FFFFFF",
  textBrand: "#7FB99B",
  textError: "#F87171",

  surfacePage: "#0F1115",
  surfaceCard: "#1E2432",
  surfaceRaised: "#252D3D",
  surfaceSunken: "#151922",

  borderSubtle: "#2B3446",
  borderDefault: "#364154",
  borderStrong: "#46546B",
  borderFocus: palette.green[400],

  ringBrand: "rgba(70, 128, 98, 0.45)",
  ringError: "rgba(248, 113, 113, 0.40)",
  error: "#EF4444",
  success: "#22C55E",

  brandMarkStroke: "#7FB99B",
  brandWordmark: "#F4F8F5",

  overlay: "rgba(4, 6, 10, 0.66)",
};

/** 4px-base spacing scale (subset used by the app). */
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/** Corner radii. */
export const radius = {
  xs: 4,
  sm: 6,
  control: 10, // buttons / inputs (web uses 8; nudged for touch)
  md: 8,
  lg: 12,
  card: 16,
  xl: 16,
  pill: 9999,
} as const;

/** Font family names — must match the keys registered via useFonts(). */
export const fontFamily = {
  display: "Cormorant_600SemiBold",
  displayMedium: "Cormorant_500Medium",
  sans: "HankenGrotesk_400Regular",
  sansMedium: "HankenGrotesk_500Medium",
  sansSemibold: "HankenGrotesk_600SemiBold",
  sansBold: "HankenGrotesk_700Bold",
} as const;

/** Named type presets (size / lineHeight / letterSpacing in points). */
export const type = {
  displayLg: { fontFamily: fontFamily.display, fontSize: 40, lineHeight: 46, letterSpacing: -0.6 },
  displayMd: { fontFamily: fontFamily.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },
  displaySm: { fontFamily: fontFamily.display, fontSize: 30, lineHeight: 38, letterSpacing: -0.4 },
  wordmark: { fontFamily: fontFamily.display, fontSize: 24, lineHeight: 26, letterSpacing: 3.6 },
  bodyLg: { fontFamily: fontFamily.sans, fontSize: 18, lineHeight: 28 },
  body: { fontFamily: fontFamily.sans, fontSize: 16, lineHeight: 24 },
  bodySm: { fontFamily: fontFamily.sans, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fontFamily.sansSemibold, fontSize: 13.5, lineHeight: 18, letterSpacing: 0.1 },
  button: { fontFamily: fontFamily.sansSemibold, fontSize: 16, lineHeight: 20, letterSpacing: -0.1 },
  caption: { fontFamily: fontFamily.sans, fontSize: 12.5, lineHeight: 18 },
  eyebrow: { fontFamily: fontFamily.sansSemibold, fontSize: 12, lineHeight: 16, letterSpacing: 1.4 },
} as const;

/** Platform-friendly elevation presets (iOS shadow + Android elevation). */
export const elevation = {
  card: {
    shadowColor: "#0B2018",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  button: {
    shadowColor: "#0B2018",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

export interface Theme {
  scheme: "light" | "dark";
  colors: Colors;
  space: typeof space;
  radius: typeof radius;
  type: typeof type;
  fontFamily: typeof fontFamily;
  elevation: typeof elevation;
}

export const lightTheme: Theme = {
  scheme: "light",
  colors: lightColors,
  space,
  radius,
  type,
  fontFamily,
  elevation,
};

export const darkTheme: Theme = {
  scheme: "dark",
  colors: darkColors,
  space,
  radius,
  type,
  fontFamily,
  elevation,
};
