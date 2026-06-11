## Goal
On the Service Level screen, after the user picks With SAP / Without SAP, show two toggle buttons — **Full Truck Load** and **Cargo**. The reference selection table and the Invoice Number + GET bar must stay hidden until one of the two is selected. Remove the secondary search bar (Select dropdown + free-text search + magnifier) entirely.

## Changes

### `src/routes/service-level.tsx`
- Drop the `extraTabs` prop (the FTL / Cargo toggle moves inside the create body so it can gate the rest of the UI).
- Keep `renderCreateBody` returning `<ServiceLevelSapCreate mode={sap === "with" ? "with" : "without"} />` for `direction === "outward"`.

### `src/components/service-level-sap-create.tsx`
- Add new state `loadType: "ftl" | "cargo" | null` (initial `null`).
- Render a new toolbar directly under the status chips:
  - Label "Load Type" plus two pill toggle buttons styled like the existing rating pills: **Full Truck Load** and **Cargo**. Selecting one sets `loadType`; clicking the active one again clears it (and collapses the rest).
  - When `loadType` is `null`, show a one-line hint: "Select Full Truck Load or Cargo to continue."
- Gate the rest of the form on `loadType !== null`:
  - Reference selection table
  - Invoice lookup bar (only the **Invoice Number** input + **GET** button remain — see removal below)
  - Shipment Feedback card + Submit (still additionally gated by `revealed`)
- Remove from the lookup bar: the `Select` dropdown (`searchType`), the free-text "Enter Reference / Invoice / ODN / SO Number" input, and the magnifier search button. Delete the now-unused `searchType` / `searchValue` state and the `Search` icon import.
- Keep all existing styling tokens, status chips, GET-gated reveal behavior, YesNo pills, ratings, and Submit button unchanged.

UI-only change. No data, routing, or shell modifications.
