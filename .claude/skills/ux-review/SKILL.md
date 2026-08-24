---
name: ux-review
description: Review a screen or component for usability, accessibility, and design-system drift, then report what is actually broken. Use when asked to review, critique, audit, or check a screen's design or UX; when asked "does this look right", "is this accessible", "check the spacing", "review this page"; or before shipping a new screen. Checks light/dark, Arabic RTL, mobile width, focus states, empty and error states, and hardcoded values that bypass the tokens.
---

# UX review

Review one screen at a time. Report real problems with the file and line.
Do not pad the list with things that are already fine.

If `chiya-design` has not been read this session, read it first — this
review is checking against those rules.

## How to run it

Ask which screen if it is not obvious. Then work the passes below in
order. Each pass has a grep that finds most of it fast; read the CSS and
the component to judge the rest.

### 1. Token drift

Values written by hand instead of taken from the system. This is the most
common problem in this repo and the easiest to fix.

```bash
# hex colours and rgba in a screen's CSS
grep -nE "#[0-9a-fA-F]{3,8}\b|rgba?\(" app/<route>/<file>.css
# hardcoded radius and shadow
grep -nE "border-radius: *[0-9]|box-shadow: *[0-9]" app/<route>/<file>.css
```

Every hit is a finding unless it is a deliberate one-off (a gradient stop,
an overlay scrim). Name the token it should have used.

### 2. RTL safety

The site ships in Arabic and Kurdish. Physical properties do not flip.

```bash
grep -nE "margin-(left|right)|padding-(left|right)|(^|[^-])\b(left|right): |text-align: *(left|right)|border-(left|right):" app/<route>/<file>.css
```

Each hit needs the logical form: `margin-inline-start`,
`padding-inline-end`, `inset-inline-start`, `text-align: start`,
`border-inline-start`. Exceptions are rare and should be commented.

Then check the component: is every visible string coming from the i18n
catalogue, or is English hardcoded in the JSX?

### 3. Dark mode

```bash
grep -n "data-theme" app/<route>/<file>.css
```

Colour rules inside a `[data-theme="dark"]` block in a screen's CSS are
usually a sign that a raw value leaked in. The fix is almost always a
token, not a dark-mode override. Genuine component polish belongs in
`styles/dark-refinements.css`.

Also look for anything that only reads on white: light-grey text, a
shadow used as the only separator, a white-on-white card edge.

### 4. Keyboard and focus

`globals.css` kills the default outline, so a control with no focus rule
is invisible to keyboard users.

For every button, link, input, select, and clickable card in the screen,
confirm there is a `:focus-visible` (or `:focus-within` on a wrapper) rule
with `--border-focus` and `--shadow-focus-brand`.

Also check: is anything clickable a bare `<div>` with an `onClick`? It
needs to be a `<button>`, or carry `role`, `tabIndex`, and a key handler.
Do icon-only buttons have an `aria-label`? Do images have `alt`?

### 5. Mobile

Read the media queries in the CSS and picture the screen at 420px.

- Does a table, filter row, or map overflow sideways?
- Is any tap target smaller than 44px?
- Does a sticky sidebar or modal still fit the viewport height?
- Do long Arabic strings wrap, or do they blow out a fixed-width pill?

### 6. States

Real screens are not always full and happy. For the screen under review,
confirm each one exists and looks designed, not accidental:

- **Empty** — no results, no listings yet, no messages
- **Loading** — what shows while data resolves
- **Error** — failed save, failed fetch
- **Long content** — a 60-character property title, a 12-word agent name
- **Permission** — what an Agent-role user sees where an Admin sees more

### 7. Clarity

The judgement pass, and the one that matters most to the product:

- Is the main action on this screen the most visually prominent thing?
- Can someone tell what this screen is for in three seconds?
- Are there two things competing for "primary"?
- Is any label vague — "Manage", "Details", "Options" — where a specific
  verb would do?
- Is anything decorative pulling attention from the content?

## Reporting

Write findings as a short list, worst first. Each one gets: the file and
line, what is wrong in one sentence, and the fix. Plain words.

Then one line at the end: what you did **not** check and why (could not
run it, needed a real device, needed data).

Do not fix anything unless asked. Review first, fix on the follow-up.
