# Chiya Mobile

Native iOS/Android app for Chiya Estate, built with **Expo (SDK 54) + React Native
0.81 + Expo Router 6 + TypeScript** (React 19.1). It is a standalone project — the
Next.js web app at the repo root is untouched. Runs in the latest **Expo Go**.

## Status — v1

Only the **login screen** is built. It is the design-language anchor for the whole
app: it establishes the theme (color, spacing, typography, dark mode), the reusable
UI primitives, and the native UX patterns every future screen will inherit.

## Run it

From this folder (`apps/mobile`):

```bash
npm install          # first time only
npm start            # starts the Expo dev server + QR code
```

Then open it:

- **iPhone/Android** — install **Expo Go**, scan the QR from the terminal.
- **Android emulator** — press `a` in the Expo terminal.
- **iOS simulator** — press `i` (requires macOS; on Windows use Expo Go on a device).

**Launch flow:** Splash → Login. On launch the app shows a centered-logo splash
(clean white, subtle fade + scale) for ~1.4s, then cross-fades to the Login screen.
When auth is added later, the splash will branch to a home route if the user is
already signed in.

The app is locked to **Light Mode** (`userInterfaceStyle: "light"`); the dark tokens
remain in `theme/tokens.ts` for future use but are not triggered.

### Other scripts

```bash
npm run typecheck    # tsc --noEmit
```

## Structure

```
app/
  _layout.tsx     # root: loads fonts, ThemeProvider + SafeAreaProvider, Stack (fade)
  index.tsx       # splash screen (route "/") — logo only, auto-advances to Login
  login.tsx       # the login screen (route "/login")
theme/
  tokens.ts       # design tokens ported from web styles/tokens.css (light + dark)
  ThemeProvider.tsx  # follows the OS color scheme; exposes useTheme()
components/ui/
  Button.tsx      # primary / secondary / social, loading + press states
  TextField.tsx   # icon, focus border, password peek, inline error
  BrandLockup.tsx # arch mark (react-native-svg) + CHIYA wordmark
  Divider.tsx     # "or" separator
  GoogleIcon.tsx  # multicolor Google G
```

## Design source

Tokens, copy, field set, and icons are ported 1:1 from the web app so the two share
one visual language:

- Colors / spacing / type — `../../styles/tokens.css`
- Login copy & flow — `../../components/site/auth-modal.tsx`, `auth.*` in `../../lib/i18n.ts`
- Icons — `lucide-react-native` (matches the web's `lucide-react`)

## Notes / stubs

- Login submit is **simulated** (620 ms) and shows a success toast — there is no
  backend or home screen yet.
- "Forgot password?" and "Create an account" are present per the design but are
  placeholders (they show an "available soon" toast).
- English only for now; strings are inline but structured so i18n/RTL can follow.
