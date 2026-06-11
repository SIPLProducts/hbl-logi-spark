## Changes

### 1. Dispatch Creation — Search Type dropdown values
In `src/lib/dispatch-mock.ts`, replace `SEARCH_TYPES` with exactly:
```
Reference Number, LR Number, Transporter, Work Order
```
The Create Dispatch search bar's "Search Type" Select keeps its "Select" placeholder and renders these four options.

### 2. Remove "New Dispatch" button
In `src/routes/dispatch.tsx`, remove the "New Dispatch" button from the Create Dispatch toolbar / page header area. No replacement.

### 3. Refresh button → full page reload (all screens)
The shared top bar / screen shell hosts the Refresh icon button used across every Logistics Execution screen. Wire its onClick to `window.location.reload()` so the entire screen reloads. File: `src/components/top-bar.tsx` (or `src/components/le-screen-shell.tsx` — whichever currently renders the Refresh button; will confirm in build mode and edit the right one).

### Out of scope
No other layout, table, filter, or styling changes. No backend changes.
