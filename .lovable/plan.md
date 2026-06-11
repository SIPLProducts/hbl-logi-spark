## Goal

Rebuild the **Order Info → Create tab** so that when **With SAP** is selected, it renders exactly the layout shown in the reference screenshot — selection table at top, invoice lookup bar, a 3-column form grid with all the fields visible in the image, and a right-aligned Save / Save and Next / Save and Previous footer.

Only the Order Info screen is affected. Other 9 LE screens keep the current shell. Search & Reports tab is untouched.

## Scope

- `src/routes/order-info.tsx` — replace `LeScreenShell` usage with a new dedicated component for the SAP layout, or render its own Create body while still using the shell for header/tabs/footer.
- `src/components/le-screen-shell.tsx` — add an optional `createOverride?: ReactNode` prop; when supplied, the Create tab renders it instead of the default `groups`/`topFields`/`lineItems` block (keeps Direction + SAP toggle bar + action footer). No change to other screens, which don't pass the prop.
- New file `src/components/order-info-sap-create.tsx` — the bespoke layout.

## New layout (Order Info, With SAP)

Rendered inside the Create tab, below the existing Direction + SAP toggle row.

1. **Status chips row** (right of the SAP toggle): `Pending: 0` (amber pill) and `Completed: 1` (green pill).

2. **Selection table** — single row, columns:
   - Select (checkbox, checked)
   - Sl.No (1)
   - Reference Number (input, value `1000000001`)
   - Work Order Number (input, placeholder "Enter Work Order No.")
   - LR Number (input, value `1234`)
   - Transporter (input, placeholder "Enter Transporter")
   - Action (icon slot)

   Header band uses primary/teal gradient with white uppercase labels, matching the screenshot.

3. **Invoice lookup bar** — single horizontal strip:
   - `Invoice Number` input (value `900000080`)
   - Green **GET** button
   - `Select` dropdown (Reference / Invoice / ODN / SO Number / Work Order / LR Number)
   - Wide search input "Enter Reference / Invoice / ODN / SO Number"
   - Square primary search-icon button

4. **Field grid** — 3 columns, compact green-bordered inputs with small uppercase labels. Fields in order:
   - Tax Invoice (`900000080`), ODN Number (`900000080`), Invoice Date (`31-10-2014`, date)
   - Basic Shipment Value (`177421.96`), Invoice Value With GST (`180970.4`), Fiscal Year (`FY-27`)
   - Fiscal Quarter (`Q1 (Apr–Jun)`), Month (`June`), Required Date & Time (`05-03-2026 13:08`, date)
   - Reported Date & Time (`09-06-2026 13:08`, date), Physical Dispatch Date & Time (`10-06-2026 13:08`, date), Plant (`HBL NCPP-SHPT`, select)
   - Transaction Type (`FULL TRUCK LOAD`, select), Billing Transaction Type (`Domestic Invoice`, select), Division (`NCPP`, select)
   - Sub Division (`FUZE`, select), SO / Ref. Number (`1001141`), Customer Name (`EMERSON NETWORK POWER (PUNE) Private ltd`)
   - Customer Group (`HBL`), Consignee Name (`Senior Manager, Bandel Thermal Power Station`), Destination Location (`Hooghly 712503`)
   - Destination State (`West Bengal`), Destination Zone (`north`)

   Inputs use a thin green border + green text per the screenshot (subtle Tailwind: `border-emerald-400/70 text-emerald-700 dark:text-emerald-300`).

5. **Footer action bar** — right-aligned, replaces the existing shell footer for this view:
   - `Save` (green), `Save and Next` (teal/primary), `Save and Previous` (amber)
   - Order matches the reference (Save · Save and Next · Save and Previous).

## Conditional rendering

- The new layout is shown only when `sap === "with"` AND `direction === "outward"`.
- When `sap === "without"`, the existing default `groups` rendering is shown (current Order Info field groups remain as a fallback for the Without SAP view).

## Implementation notes

- Reuse `Input`, `Select`, `Popover + Calendar`, `Checkbox`, `Button` from `@/components/ui/*`.
- Status chips: pill `bg-amber-100 text-amber-800` and `bg-emerald-100 text-emerald-800` with a left dot.
- Table header gradient: `bg-gradient-to-r from-sky-500 to-teal-500 text-white`.
- All values are static demo data (no business-logic changes, frontend only).
- No data model or route registry changes; `order-info.tsx` keeps its `head()` metadata.

## Result

Selecting **With SAP** on Order Info shows the reference screen pixel-faithfully (selection grid, invoice lookup, full form grid, footer buttons). Switching to **Without SAP** falls back to the existing grouped layout. All other LE screens are untouched.
