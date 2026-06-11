## Goal

Restructure all 10 LE screens (Order Info → Insurance Claim Tracking) to use the same **two-tab layout** as the Dispatch screen:

- **Create** tab — entry form (each screen keeps its own field groups).
- **Search & Reports** tab — filter bar + results worklist.

Each screen keeps its **own different fields** (no field changes); only the surrounding layout becomes tabbed.

## Affected screens (10, unchanged set)

`/order-info`, `/shipment-details`, `/invoice-load-details`, `/segment-info`, `/vehicle-info`, `/transit-info`, `/freight-billing`, `/service-level`, `/transit-damage-info`, `/insurance-claim-tracking`.

`/dispatch` and `/dispatch-orders` are not touched.

## Approach — refactor `src/components/le-screen-shell.tsx`

Add a Dispatch-style `Tabs` (Create / Search & Reports) wrapping the body. No per-route file changes.

### Header (unchanged)
- Page title, description, Refresh / Export buttons.
- Add an icon tile matching Dispatch (gradient square with screen-specific Lucide icon — falls back to a generic icon if none provided).

### New Tabs row (below header)
Reuses the Dispatch `TabsList` styling:
```
[ + Create ]   [ ⏚ Search & Reports ]
```
Active tab: `bg-gradient-primary text-primary-foreground shadow-cta rounded-lg`.

### Create tab content
1. **Direction + SAP toolbar** (already added last turn — keep as is).
2. **KPI cards** (if `kpis` provided).
3. **Field groups** (`groups` prop) — each rendered as the existing white card with uppercase section title and 4-col grid.
4. **Top fields** (`topFields` prop) if present.
5. **Line items** (`lineItems` prop) if present.
6. **Bottom action bar** — `Save and Previous` / `Save` / `Save and Next` (existing sticky bar).

### Search & Reports tab content
1. **Filter card** (mirrors Dispatch search):
   - Date From / Date To (`datetime-local`).
   - Search-type `Select` (Reference / Invoice / ODN / SO Number / Work Order / LR Number).
   - Search-value text input.
   - Status chips (All / Pending / Completed) — existing chip styling reused.
   - `Search` primary button + `Reset` ghost button.
2. **Worklist table** (existing `columns` + `rows`, with the filter row at the bottom of the card removed since filters now live above).
3. **No bottom Save bar** in this tab (matches Dispatch Search mode).

### Existing controls that move/get removed
- The current "Mode + chips" row (with-sap/without-sap pill + status chips + Filters button) is **removed** from the top — its SAP function is handled by the Direction/SAP toolbar in Create tab, and the chips move into the Search tab.
- The existing in-card filter strip at the bottom of the worklist (Invoice Number / Get / search row) is **removed** in favor of the new top filter card.
- `extraTabs` prop usage: none of the 10 routes pass it; safe to deprecate (kept in props but not rendered to avoid TS breakage).

### Fix runtime hydration warning (unrelated bug noticed)
The header renders `new Date().toLocaleTimeString(...)` at render time, causing SSR/CSR text mismatch. Wrap it in a `useState` + `useEffect` so the time is only rendered after mount (initial render shows an em dash placeholder). Small, isolated change in the same file.

## Files to edit

- `src/components/le-screen-shell.tsx` — only file. All 10 routes inherit the new layout automatically; their `groups` / `kpis` / `columns` props stay untouched.

## Out of scope

- No changes to individual route files (fields stay different per screen).
- No data model, backend, or routing changes.
- Dispatch / Dispatch Orders untouched.
