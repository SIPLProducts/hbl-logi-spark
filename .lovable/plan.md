## Problem
On the Service Level screen, the Full Truck Load / Cargo selection currently appears inside the child component after status chips. The user wants it moved so it appears immediately after the With/Without SAP toggle in the shell's Direction+SAP card. They also want the Invoice Number input card made narrower.

## Files to change

### 1. `src/components/le-screen-shell.tsx`
- Add new optional prop `renderDirectionExtras?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode`
- Render it inside the Direction+SAP card, right after `<SapToggle />`

### 2. `src/routes/service-level.tsx`
- Lift `loadType` state (`"ftl" | "cargo" | null`) from `ServiceLevelSapCreate` up to the page component
- Pass the FTL/Cargo toggle pills via the new `renderDirectionExtras` prop
- Pass the current `loadType` value into `ServiceLevelSapCreate` as a prop

### 3. `src/components/service-level-sap-create.tsx`
- Accept `loadType?: "ftl" | "cargo" | null` as a prop instead of local state
- Remove the Load Type toggle UI block and the "Select Full Truck Load or Cargo" hint (the shell now renders the toggle)
- Keep the existing gating logic: table, invoice card, and feedback form only render when `loadType != null`
- Decrease the Invoice Number card width: change the input wrapper from `flex-1 min-w-[220px]` to `w-full max-w-xs` (or similar narrow constraint) so the card is compact

## Result
- Direction → SAP → FTL/Cargo shown in a single sequential row/card
- Table and invoice section appear only after a load type is chosen
- Invoice Number input sits in a noticeably narrower container