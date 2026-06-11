# Plan: Remove Empty Top Bar Space

## Problem
The previous change commented out the inner contents of `TopBar`, but the `<header>` element itself still renders with `h-14` height, `border-b`, and `sticky top-0 z-20`, leaving an empty 56px bar at the top of every screen.

## Change
In `src/components/top-bar.tsx`, remove the `<header>` wrapper entirely so the component returns `null` (or a fragment). This eliminates the empty space and lets the page content sit flush at the top.

## Files
- `src/components/top-bar.tsx` — replace the `<header>...</header>` return with `return null;`

## Impact
- No visual top bar on any screen
- Main content area gains ~56px of vertical space
- Fully reversible by reverting the change