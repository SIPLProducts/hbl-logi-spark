## Plan: Add "Gate In and Out Process" Screen

Add a new screen mirroring the Order Info structure, placed after Order Info in the sidebar navigation.

### Files

1. **Create `src/routes/gate-in-out-process.tsx`** (single file)
   - Copy full structure of `src/routes/order-info.tsx` (905 lines) — same tabs, filters, table, SAP/Non-SAP create toggle, export/PDF actions, pagination.
   - Change route: `createFileRoute("/gate-in-out-process")`.
   - Change page title/header text to "Gate In and Out Process".
   - Reuse the same mock data and `OrderInfoSapCreate` component so the screen is fully functional out of the box (no new components, no new mock files).

2. **Edit `src/components/app-sidebar.tsx`**
   - In the second nav group, insert a new item `{ title: "Gate In & Out Process", to: "/gate-in-out-process", icon: DoorOpen }` immediately after the Order Info entry.
   - Add `DoorOpen` to the lucide-react imports.

### Notes
- No changes to business logic, services, or shared components.
- `routeTree.gen.ts` is auto-generated — do not edit.
- If you'd later like a dedicated create form (instead of reusing `OrderInfoSapCreate`), that's a follow-up.
