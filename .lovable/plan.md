# Plan: Remove Synced Time & Export Button from Screen Headers

## Scope
All screens from Order Info through Insurance Claim Tracking use the shared `LeScreenShell` component, so a single edit covers them all.

## Change
In `src/components/le-screen-shell.tsx`:
- Remove the `<span>Synced · {syncedAt}</span>` element in the page header (line ~180-182)
- Remove the `<button>...Export</button>` element (line ~189-191)
- Keep the Refresh button intact
- Remove now-unused `syncedAt` state, the `useState`/`useEffect` for it, and the `Download` icon import if no longer used

## Files
- `src/components/le-screen-shell.tsx` only

## Out of Scope
- `src/routes/dispatch.tsx` and `src/routes/dispatch-orders.tsx` are not in the requested range (Order Info → Insurance Claim Tracking), so their Export buttons stay.