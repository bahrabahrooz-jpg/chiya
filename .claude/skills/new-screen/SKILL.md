---
name: new-screen
description: Build a new screen, page, or route in Chiya the house way — correct file layout, existing components reused, three languages, dark mode, and RTL from the first commit. Use when asked to add a new page, screen, route, tab, or admin section; when scaffolding a modal or panel large enough to need its own files; or when a new screen "should look like the rest of the site". Also read it before copying an existing page as a starting point.
---

# Building a new screen

Read `chiya-design` first for the visual rules. This skill is the file
layout and the reuse inventory.

## Step 1 — reuse before you build

Most of what a new screen needs already exists. Look here before writing
any component. Copying markup out of another screen and re-styling it is
how the design drifts.

| Need | Take it from |
|---|---|
| Button, icon button, badge, avatar, modal, input, select, field, choice, theme toggle, language switcher | `components/ui/` |
| Card, table, accordion, stat card, skeleton, empty state | `components/data/` |
| Alert, toast, popover, confirm dialog, dropdown menu | `components/feedback/` |
| Date picker, file upload, multi-select, range input, search bar, filter chips | `components/forms/` |
| Container, grid, section, hero, divider, page header, footer | `components/layout/` |
| Navbar, sidebar, tabs, pagination, mobile nav | `components/navigation/` |
| Property card, agent card, gallery, map panel, price block, status badge, favourite + share buttons, appointment widget | `components/real-estate/` |
| Admin shell, sidebar, topbar, page header, notifications | `components/admin/` |

Type helper classes (`.cx-display-lg`, `.cx-text-sm`, `.cx-eyebrow`,
`.cx-tnum`, `.cx-container`, `.cx-grid`) live in `app/globals.css`.

If a genuinely new shared piece is needed, it goes in the right
`components/` folder with its own CSS file — not inside the screen.

## Step 2 — lay out the files

Routes stay thin. The real work lives in a sibling underscore folder,
which Next.js does not treat as a route.

```
app/<route>/page.tsx        # thin: layout chrome + <Suspense> + the app component + the CSS import
app/<route>/<prefix>.css    # every class prefixed, e.g. srp- for search
app/_<route>/<name>-app.tsx # the actual screen, "use client"
app/_<route>/data.ts        # demo data / catalogue reads
app/_<route>/types.ts       # local types, if the screen needs them
```

Admin follows the same shape one level down: `app/admin/<route>/page.tsx`
plus `app/admin/_<route>/<name>-app.tsx`.

A real `page.tsx`, for reference:

```tsx
import { Suspense } from "react";
import { InteriorHeader } from "@/components/site/interior-header";
import { Footer } from "@/components/layout";
import { SrpApp } from "../_search/srp-app";
import "./srp.css";

export default function SearchPage() {
  return (
    <>
      <InteriorHeader />
      <Suspense fallback={null}>
        <SrpApp />
      </Suspense>
      <Footer />
    </>
  );
}
```

Pick a short CSS prefix nobody is using yet and put it on every class in
that file. Existing ones: `srp-`, `pdp-`, `pro-`, `ml-`, `acc-`, `al-`,
`agt-`, `au-`, `pp-`, `mp-`, plus the shared `cx-` family.

**This is Next.js with breaking changes from what you remember.** Check
`node_modules/next/dist/docs/` before using any routing, params, or
data-fetching API — `searchParams` and `params` are promises here.

## Step 3 — text in three languages

No English strings in the JSX. Every visible word goes through the
catalogue.

```tsx
"use client";
import { useLang } from "@/lib/i18n";

export function ThingApp() {
  const { t, lang } = useLang();
  return <h1 className="cx-display-md">{t("thing.title")}</h1>;
}
```

Add the key to all three of `lib/i18n/en.ts`, `ar.ts`, `ku.ts` in the same
change. Missing a language is a visible bug, not a to-do.

Canonical data (property titles, agent names, IDs) stays in English in the
catalogue — only the interface chrome is translated.

## Step 4 — the states, not just the happy path

Build these into the first version. Retrofitting them is worse work.

- Empty — use `EmptyState` from `components/data/`
- Loading — `Skeleton` from `components/data/`, matching the real layout
- Error — `Alert` from `components/feedback/`
- Permission — if this screen exists under `/agent` too, check
  `lib/agent-permissions.ts` and hide what that role cannot see

## Step 5 — check it before saying it is done

Run the `ux-review` skill against the new screen, or at minimum walk its
checklist: dark mode, Arabic RTL, 420px width, focus states, no raw hex.

Then verify it actually compiles and lints:

```bash
npx tsc --noEmit
npx eslint app/<route> app/_<route>
```
