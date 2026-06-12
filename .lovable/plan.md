## Goal
Make header and footer fixed; only the page content scrolls. Remove the "SAP S/4HANA · Connected" pill and show only "2026 © Sharviinfotech · All Rights Reserved" in a single app-level footer.

## Changes

1. **`src/components/le-footer.tsx`** — Remove the SAP S/4HANA connected chip. Keep only the copyright text, centered (or right-aligned, matching current style). Simplify to one line.

2. **`src/components/app-shell.tsx`** — Add `<LeFooter />` below `<main>` so it's app-wide and fixed at the bottom of the viewport. Layout already uses `h-screen overflow-hidden` with `<main className="flex-1 overflow-y-auto">`, so adding the footer as a sibling of `<main>` (non-shrinking) keeps TopBar fixed at top, footer fixed at bottom, and only main scrolls.

3. **`src/components/le-screen-shell.tsx`** — Remove the per-page `<LeFooter />` render (and its import) so the footer isn't duplicated. Any other places rendering `<LeFooter />` get the same treatment.

## Out of scope
No changes to colors, header, sidebar, or page content.

## Verification
Screenshot `/order-info` — confirm fixed top bar, fixed footer with only the copyright line, and scrollable middle content.
