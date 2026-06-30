# Chiya Estate — Design System

> Luxury real estate platform for the Kurdistan Region of Iraq. Chiya Estate connects buyers, renters, owners, and **verified agents** through a premium experience across a responsive website, iOS, and Android.

This repository is the single source of truth for the Chiya Estate brand: design tokens, fonts, reusable React components, foundation specimens, and full-screen UI kits. An automated compiler bundles every component into `_ds_bundle.js` and indexes the tokens — consumers link one file (`styles.css`) and read components from `window.ChiyaEstateDesignSystem_686f57`.

**Brand personality:** Luxury · Premium · Elegant · Trustworthy · Modern · Minimal.
**Visual signature:** Light theme · Deep Forest Green · Warm Gold accent · premium photography · serif/sans pairing.

---

## Sources

- **Figma:** *"Chiya state design system.fig"* (attached as a virtual filesystem during authoring). The token values, type pairing, and component direction in this system were established from that file and the brand brief.
- **Inspiration references** (per brief): Untitled UI, Tailwind CSS, Ant Design, shadcn/ui, Apple, Airbnb, luxury real-estate brands.
- No production codebase was attached; component implementations here are original, brand-faithful primitives.

> ⚠️ The Figma virtual filesystem was **not reachable in the session that built out the component layer** — the system was extended from the already-established token foundations (which were derived from the Figma file in an earlier session). If the precise Figma component specs differ, re-attach the file and we'll reconcile.

---

## Content fundamentals — how Chiya writes

The voice is **warm, confident, and quietly luxurious** — an expert concierge, never a pushy salesperson.

- **Person:** Speak to the user as **"you"**; the brand is **"we"/"Chiya"**. ("Choose a time that suits you. A verified Chiya agent will confirm within 24 hours.")
- **Tone:** Aspirational but precise. Lead with the home and the lifestyle, support with hard facts (beds, m², price). Never hype-y; no exclamation marks in UI copy.
- **Casing:** **Sentence case** for everything — buttons, labels, headings, nav. Reserve UPPERCASE (with wide tracking) for tiny eyebrows/overlines and table headers only.
- **Trust language:** "Verified", "verified agent", "no obligation", "confirmed in 24h", "ID-checked". Trust is a core selling point — surface it.
- **Numbers:** Always formatted and tabular — `$620,000`, `420 m²`, `4.9 ★`. Prices use tabular figures (`.cx-tnum` / `font-variant-numeric: tabular-nums`). Use `m²` for area by default.
- **Microcopy examples:** "Book a viewing" · "Request a viewing" · "Get pre-approved" · "Explore homes" · "List property" · "Save listing" · "Free · no obligation · confirmed in 24h".
- **Headlines** use the serif display face for warmth ("Olive Grove Estate", "Find your place in Kurdistan"); **UI and data** use the grotesk sans.
- **Emoji:** Never in product UI. Iconography carries all glyph needs.

---

## Visual foundations

**Color.** Light theme on a clean neutral off-white page (`--surface-page` #F8F9FA), white cards. **Deep Forest Green** (`--green-700` #18402F) is the primary brand and primary-button color; **Warm Gold** (`--gold-400` #C9A24B) is the accent for "Featured", verified rings, and premium emphasis — used sparingly as a jewel, never as a fill for large areas. Neutrals are **warm grays** (slightly green/brown cast), never cold blue-grays. Semantic colors: green=for-sale/success, blue=for-rent/info, amber=pending/warning, red=sold/error.

**Type.** Display = **Cormorant Garamond** (luxury serif) for headings, prices-as-hero, property names. UI/body = **Hanken Grotesk** (premium grotesk). Data/IDs = **IBM Plex Mono**. Display weights 500–600 with tight tracking (`-0.02em`); body 400–600 normal tracking. (See font substitution note below.)

**Spacing & layout.** 4px base unit. Generous, calm whitespace — luxury reads as *restraint*. 12-column grid, 1280px default container, 80px desktop gutters. Section vertical rhythm ~96px.

**Radii.** Soft but not bubbly. Controls/buttons = 8px (`--radius-control`); cards = 16px (`--radius-card`); featured/hero cards = 20px; pills/chips/badges = full. Images inside cards = 12px.

**Shadows.** Soft, warm-tinted, low-opacity — never harsh black. Cards rest on `--shadow-card` (a barely-there lift) and rise to `--shadow-card-hover` with a forest-green-tinted glow. Modals use `--shadow-2xl`. Focus rings are a 4px translucent brand/gold/error halo (`--shadow-focus-*`), never the default browser outline.

**Imagery.** Premium architectural & interior **photography** is the hero of the brand — warm, golden-hour, richly lit, aspirational. Cards are photo-led (4:3 covers); featured cards are two-pane with a gallery strip. A subtle top-down protection gradient (`rgba(11,32,24,…) → transparent`) sits over photos so white badges and glass buttons stay legible.

**Motion.** Restrained and smooth — `cubic-bezier(.2,.7,.2,1)` and short ease durations (.14–.25s). Cards lift `-3px` + scale their image `1.05` on hover. Buttons depress `~0.5px` on press. No bounce, no infinite loops, no parallax. Respect `prefers-reduced-motion`.

**Interaction states.**
- *Hover:* surfaces darken one step (`--gray-50`), brand buttons go to `--brand-primary-hover`, cards lift + image zooms.
- *Press/active:* darker brand step + tiny translateY.
- *Disabled:* 0.5 opacity, no shadow, `not-allowed`.
- *Focus-visible:* translucent halo ring; never a hard outline.

**Glass & transparency.** Used only for controls floating over photography — `IconButton variant="glass"` (favorite/share/gallery nav): translucent white + `backdrop-filter: blur`. Map/photo overlay pills use a dark forest-tinted glass.

**Cards.** White, 1px `--border-subtle` hairline, 16px radius, soft card shadow. They are the primary container — no colored left-border accents, no heavy outlines.

---

## Iconography

- **System:** [**Lucide**](https://lucide.dev) line icons, loaded via UMD CDN (`window.lucide`) and rendered by the `Icon` component (`<Icon name="search" />`). Stroke weight **1.75**, round caps/joins, `currentColor`.
- **Why Lucide:** clean, geometric, consistent 24×24 grid — matches the modern-minimal-luxury brief and pairs well with the grotesk UI face. *(Substitution note: no proprietary icon set was provided; Lucide is the chosen standard. Swap freely if the Figma ships a bespoke set.)*
- **Common glyphs:** `bed-double`, `bath`, `maximize-2` (area), `map-pin`, `heart`, `share-2`, `search`, `calendar-check`, `badge-check`/`shield-check` (verified/trust), `building-2`, `star`, `key`, `wallet`, `sparkles` (featured).
- **Emoji / unicode icons:** never used.
- **Logo:** `assets/chiya-logomark.svg` — forest-green rounded square with a gold arch mark. Use via `Wordmark` (`<Wordmark logoSrc="…/chiya-logomark.svg" />`).

> **Imagery note:** property photos & agent portraits in cards/kits are referenced from the Unsplash CDN (the authoring sandbox can't download binaries into the project). For production, replace with licensed Chiya photography and self-host.

---

## Font substitution — please confirm

Fonts load from **Google Fonts** (`tokens/fonts.css`): **Cormorant Garamond**, **Hanken Grotesk**, **IBM Plex Mono**. These were chosen to match the luxury-serif + premium-grotesk direction. **If the Figma specifies different families, send the font files and we'll self-host + swap the `@font-face`/import.**

---

## Index / manifest

**Root**
- `styles.css` — global entry (import list only). Consumers link this.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill manifest for using this system in Claude Code.

**`tokens/`** — `colors.css`, `typography.css`, `fonts.css`, `spacing.css`, `radius.css`, `shadows.css`, `grid.css`, `base.css`. (196 tokens.)

**`guidelines/`** — foundation specimen cards (Design System tab): colors (green / gold / neutral / semantic / tokens), type (families / display / text), spacing, radius, shadows, grid, brand/logo.

**`components/`** — reusable primitives (read via `window.ChiyaEstateDesignSystem_686f57`):
- `buttons/` — **Button**, **IconButton**
- `icon/` — **Icon** (Lucide wrapper)
- `forms/` — **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch**
- `feedback/` — **Badge**, **Tag**, **Avatar**, **AvatarGroup**, **Modal**
- `navigation/` — **Navbar**, **Wordmark**, **Breadcrumb**, **Tabs**
- `data/` — **Table**
- `realestate/` — **PropertyCard**, **FeaturedPropertyCard**, **AgentCard**, **SearchBar**, **SearchFilters**, **PropertyGallery**, **MapPanel**, **AppointmentWidget**
- `dashboard/` — **StatCard**, **Sparkline**, **AnalyticsCard**, **ApprovalCard**

**`ui_kits/`** — full-screen product recreations (see each kit's README):
- `website/` — marketing + listings + property detail
- `mobile/` — iOS & Android app screens

**`assets/`** — `chiya-logomark.svg`.

---

## Using the system

```html
<link rel="stylesheet" href="styles.css">
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<!-- React UMD + your bundle -->
<script src="_ds_bundle.js"></script>
<script>
  const { Button, PropertyCard } = window.ChiyaEstateDesignSystem_686f57;
</script>
```

Every component styles itself from the CSS custom properties — change a token, everything follows.
