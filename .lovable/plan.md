## Goal
Redesign the **Service Level (Shipment Feedback)** screen to match the reference image and follow the same selection flow as Freight Billing.

## Flow (Create tab)
1. User picks **Direction = Outward** (already in the shell).
2. User picks **With SAP** or **Without SAP** (already in the shell).
3. User picks **Full Truck Load** or **Cargo** (new sub-tab toggle added via `extraTabs`).
4. Reference selection table is shown (Select / Sl.No / Reference Number / Work Order Number / LR Number / Transporter — same look as Freight Billing).
5. **Invoice Number** input + **GET** button. Until a value is entered and GET pressed, the feedback section stays hidden.
6. After GET, render the **Shipment Feedback** card identical for both With SAP and Without SAP:
   - 1. On time delivery — Yes / No pill toggle
   - 2. Damage if any — Yes / No
   - 3. Accident if any — Yes / No
   - 4. On time POD submission — Yes / No
   - 5. On time freight bill submission — Yes / No
   - Overall Feedback from User — Poor / Avg / Good / Excellent pill group
   - **Submit** button bottom-right

## Implementation

### New file: `src/components/service-level-sap-create.tsx`
- Mirrors `freight-billing-sap-create.tsx` structure (status chips, selection table, lookup bar pattern).
- Accepts `mode: "with" | "without"` but renders the same feedback UI for both.
- Internal state: `invoiceNumber`, `revealed` (set true on GET click), `answers` map for the 5 yes/no rows, `overall` for the rating.
- Yes/No buttons styled as rounded pill toggles (emerald when active for Yes, rose for No) matching the screenshot.
- Overall rating buttons styled as 4 pill toggles (accent fill when selected).
- Submit button (emerald) bottom-right.

### Edit `src/routes/service-level.tsx`
- Replace the current `groups`-based config with `extraTabs` + `renderCreateBody`, identical pattern to `src/routes/freight-billing.tsx`:
```tsx
extraTabs={[{ label: "Full Truck Load", active: true }, { label: "Cargo" }]}
renderCreateBody={({ sap, direction }) =>
  direction === "outward"
    ? <ServiceLevelSapCreate mode={sap === "with" ? "with" : "without"} />
    : null
}
```
- Drop the old `groups` prop entirely.
- Keep route metadata (title/description) unchanged.

No changes to `le-screen-shell.tsx` (it already supports `extraTabs` + `renderCreateBody`). No backend/data changes — UI-only.
