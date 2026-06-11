# Plan: Make Only the Page Body Scroll

## Root cause
`AppShell` uses `min-h-screen` on the outer flex container. That lets the document grow taller than the viewport, so the **window** scrolls — `<main className="flex-1 overflow-y-auto">` never activates, and the sticky page header (and TopBar) scroll away with the page.

## Fix (single file)
In `src/components/app-shell.tsx`:
- Change the outer `<div>` from `flex min-h-screen` to `flex h-screen overflow-hidden`.

Effect:
- The shell now exactly fills the viewport.
- `<main className="flex-1 overflow-y-auto">` becomes the only scroll container.
- `TopBar` (already `sticky top-0`) and the per-screen sticky page header (already `sticky top-0 z-10`) stay pinned because the inner column no longer scrolls.
- Sidebar already uses `sticky top-0 h-screen` and is unaffected.

## Out of scope
- Login page (renders without AppShell — unaffected).
- No changes to individual route files; the previous sticky-header edits remain correct and now actually work.