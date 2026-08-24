---
name: chiya-design
description: The Chiya house design system — tokens, colours, type, spacing, dark mode, RTL, and CSS naming. Read this BEFORE writing or changing ANY user interface in this repo: a screen, a component, a CSS file, a modal, a card, a button, a form, a table, a badge, an empty state. Also read it when asked to "make it look better", restyle something, pick a colour or size, match the design, fix spacing, fix dark mode, or fix Arabic/Kurdish layout. Covers all four surfaces — public website, /admin, /agent, and the Expo mobile app.
---

# Chiya design system

One visual language across four surfaces. Every value comes from a token.
Nothing is invented at the point of use.

## The five hard rules

Break these and the design drifts. They are not style preferences.

1. **No raw values in components.** No hex colours, no `rgba()`, no pixel
   radii, no shadows. Always `var(--token)`. The only pixel numbers allowed
   in a component CSS file are one-off layout sizes (grid widths, icon
   boxes, `height: 48px` on a control).
2. **Never write dark-mode colours in a component file.** Dark mode is
   token overrides only, in `styles/tokens.css` under
   `:root[data-theme="dark"]`. If a component looks wrong at night, the
   token is wrong or the component used a raw value. Fix the token.
3. **Logical properties only.** `margin-inline`, `padding-inline-start`,
   `inset-inline-start`, `text-align: start`. Never `margin-left`,
   `padding-right`, `left:`, `text-align: right`. The site runs in Arabic
   and Kurdish with `dir="rtl"` and physical properties do not flip.
4. **Headings are serif, body is sans.** `--font-display` (Cormorant) for
   every `h1`–`h6` and display text. `--font-sans` (Hanken) for everything
   else. `--font-mono` (IBM Plex) for IDs, codes, and figures that must line
   up. This is already the base rule in `globals.css` — do not override it.
5. **Change a token, change all four surfaces.** Web tokens live in
   `styles/tokens.css`; the mobile app mirrors them in
   `apps/mobile/theme/tokens.ts`. They are meant to hold the same values.
   Update both or say plainly that you only did one.

## Where things live

| What | File |
|---|---|
| All tokens, light + dark | [styles/tokens.css](styles/tokens.css) |
| Tailwind bridge + base + `cx-` helper classes | [app/globals.css](app/globals.css) |
| Arabic / Kurdish font swap and RTL fixes | [styles/rtl.css](styles/rtl.css) |
| Dark-mode component polish | [styles/dark-refinements.css](styles/dark-refinements.css) |
| Mobile app token mirror | [apps/mobile/theme/tokens.ts](apps/mobile/theme/tokens.ts) |
| JS breakpoints + `useIsMobile()` | [lib/breakpoints.ts](lib/breakpoints.ts) |
| UI text in 3 languages | [lib/i18n/](lib/i18n/) |

Read the token file rather than trusting this summary for exact values —
it is the single source of truth and it changes.

## Colour

**One brand colour: forest green.** Gold was retired. `--gold-*` tokens
still exist but they are aliases pointing at green — never reach for them
in new code, and never introduce a second accent colour.

Pick by role, not by shade:

- Brand action → `--brand-primary`, hover `--brand-primary-hover`,
  pressed `--brand-primary-active`
- Quiet brand fill → `--brand-subtle` / `--brand-subtle-hover`
- Page / card / raised / sunken → `--surface-page`, `--surface-card`,
  `--surface-raised`, `--surface-sunken`
- Text → `--text-primary`, `--text-secondary`, `--text-tertiary`,
  `--text-placeholder`, `--text-disabled`; on green use `--text-on-brand`;
  green text on a light surface uses `--text-brand`, icons and softer green
  use `--text-brand-muted`
- Borders → `--border-subtle` (dividers), `--border-default` (controls),
  `--border-strong` (hover), `--border-focus`
- Status → `--success-*`, `--warning-*`, `--error-*`, `--info-*`.
  The `50`/`100` steps are fills, `500`/`600`/`700` are text and icons.
- Star ratings keep amber: `--rating-star`.

## Type

Display scale (serif) `--display-2xl` down to `--display-xs`, sizes 76px to
24px. Text scale (sans) `--text-xl` to `--text-xs`, 20px to 12px. Each has
a matching `-line` token — always set the line height with the size.

Ready-made classes exist in `globals.css`: `.cx-display-lg`, `.cx-text-sm`,
`.cx-eyebrow` (uppercase overline), `.cx-tnum` (tabular figures for prices
and tables), `.cx-mono`. Prefer them over re-declaring font rules.

Tracking: `--tracking-tight` on display, normal on body,
`--tracking-wider` on eyebrows. RTL zeroes all tracking automatically —
do not fight it.

## Spacing, radius, shadow

4px base unit: `--space-1` (4px) through `--space-40` (160px). Use the
scale, never a stray `13px`. Semantic shortcuts: `--pad-card`,
`--gap-control`, `--gap-inline`, `--pad-section`, `--container-pad`.

Radius by role, not by number: `--radius-control` (buttons, inputs, 8px),
`--radius-card` (16px), `--radius-card-lg` (featured, 20px),
`--radius-pill` (badges, chips, filters), `--radius-modal`, `--radius-image`.

Elevation: `--shadow-card` at rest, `--shadow-card-hover` on hover for
anything clickable. `--shadow-xs` to `--shadow-3xl` for everything else.
Focus rings are `--shadow-focus-brand` / `--shadow-focus-error`.

## Focus and keyboard

`globals.css` removes the default outline, so **every interactive element
must draw its own focus state**. The house pattern:

```css
.thing:focus-visible { border-color: var(--border-focus); box-shadow: var(--shadow-focus-brand); }
/* wrappers around an input use :focus-within instead */
.field:focus-within { border-color: var(--border-focus); box-shadow: var(--shadow-focus-brand); }
```

A control with no visible focus state is a bug, not a detail.

## CSS naming

Plain CSS files, no CSS modules, no Tailwind soup in markup for layout.

- One CSS file per route, sitting beside `page.tsx`, imported at the top of
  it: `import "./srp.css";`
- Every class in that file carries the route's short prefix: `srp-`
  (search), `pdp-` (property page), `pro-` (agent profile), `agt-`, `ml-`,
  `acc-`, and so on. This keeps global CSS from colliding.
- Shared design-system classes use `cx-`.
- BEM-ish inside the prefix: `.srp-bar`, `.srp-bar__input`,
  `.srp-bar--compact`.

## Responsive

Mobile is not an afterthought — the admin tables and the map view are the
usual breakage points. Breakpoint tokens are `--bp-sm` 640, `--bp-md` 768,
`--bp-lg` 1024, `--bp-xl` 1280, `--bp-2xl` 1440, mirrored in
`lib/breakpoints.ts` for JS. Existing CSS also uses hand-picked
`max-width` stops where a specific layout breaks; matching a neighbouring
file's stops is better than inventing a new one.

Use `useIsMobile()` for behaviour that must change (drawer instead of
sidebar), CSS media queries for everything visual.

## Motion

There are no motion tokens. The house convention is short and plain:
`transition: border-color .15s, box-shadow .15s;`. Keep durations between
.12s and .25s, transition only colour, shadow, opacity, and transform.
Wrap anything that moves or animates in
`@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }`.

## Before you call UI work done

- [ ] No hex, `rgba`, or raw radius/shadow in the component
- [ ] Looks right in light **and** dark (toggle it, do not assume)
- [ ] Looks right in Arabic — `dir="rtl"`, no physical properties
- [ ] All three languages have the text, not just English
- [ ] Every control has a visible `:focus-visible` state
- [ ] Works at 420px wide
- [ ] Tap targets at least 44px on mobile
- [ ] Empty, loading, and error states exist — not just the happy path
