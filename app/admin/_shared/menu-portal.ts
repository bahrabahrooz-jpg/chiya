/**
 * Portal target for admin row-action menus.
 *
 * The menus are `position: fixed` and kept glued to their trigger on scroll, but
 * they must live *inside* the scrolling region (`.ax-content`) rather than on
 * `document.body`. If they hang off `<body>`, wheeling while the pointer is over
 * the menu finds no scrollable ancestor (the shell pins `body`/`.ax-app` at
 * `100vh; overflow: hidden`), so the page won't scroll until the pointer leaves
 * the menu. Parenting them to `.ax-content` lets wheel-over-menu scroll the table
 * normally. `.ax-content` has no transform/filter/contain, so `position: fixed`
 * still resolves against the viewport and escapes the container's overflow clip.
 *
 * Client-only — callers guard the `createPortal` call behind open/positioned
 * state, so this never runs during SSR.
 */
export function adminMenuRoot(): HTMLElement {
  return (document.querySelector(".ax-content") as HTMLElement | null) ?? document.body;
}
