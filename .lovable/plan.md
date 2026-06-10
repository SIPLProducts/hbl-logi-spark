
# LE Module — 12 Screens per HBL Document

Rebuild the sidebar and routes around the exact 12 screens shown in the uploaded `LE-HBL Overall Screens.pdf`, keeping the existing Industrial Foundry visual style. All data stays mock/static (SAP HANA backend will be wired later).

## Navigation (sidebar, in this exact order)

| # | Screen | Icon (lucide) |
|---|--------|---------------|
| 1 | Dispatch Orders | ClipboardList |
| 2 | Dispatch | Truck |
| 3 | Order Info | FileText |
| 4 | Shipment Details | PackageOpen |
| 5 | Invoice Load Details | Receipt |
| 6 | Segment Info | Split |
| 7 | Vehicle Info | Bus |
| 8 | Transit Info | Route |
| 9 | Freight Billing | IndianRupee |
| 10 | Service Level (Shipment Feedback) | Gauge |
| 11 | Transit Damage Info | AlertTriangle |
| 12 | Insurance Claim Tracking | ShieldCheck |

A small "HBL" logo block stays in the sidebar header (matches current look). Existing Dashboard / Reports / Inbound / Outbound / Tracking links are removed — the app is now strictly the 12 LE screens. Home `/` redirects to `/dispatch-orders`.

## Common screen shell (applies to screens 3–12)

Every screen follows the same pattern visible in the PDF:

- Page header: title + `+ New`, `Export`, `Refresh` action buttons
- Mode tabs: **Outward** (active) | With SAP | Without SAP
- Status chips: 🟡 Pending: N   🟢 Completed: N
- Worklist table with `Select`, `Sl.No`, and screen-specific columns (see field list below); per-row delete action
- Lookup bar: Invoice Number dropdown · `GET` button · Select dropdown · "Enter Reference / Invoice / ODN / SO Number" search · 🔍
- Detail panel (shown when a row is selected) with grouped form fields
- Sticky action bar: `Save`, `Save and Next`, `Save and Previous`
- Footer: `2026 © Sharviinfotech All rights reserved.`

A reusable `LeScreenShell` component will render all of this; each route just passes columns, fields, and mock rows.

## Per-screen field capture (max fields from the PDF)

### 1. Dispatch Orders
Worklist columns: Sl.No, Vehicle Type, Workorder, No Of Trucks, No Of Invoices, Vendor Code, Transporter, Plant, Division, No. of LRs, LR Number, Loading Points, Unloading Points, Remarks, Action.

### 2. Dispatch
Same columns as Dispatch Orders plus a "Dispatch Status" pill (Planned / Dispatched / In Transit / Delivered) and `Dispatch Date`, `Gate-Out Time`.

### 3. Order Info
Worklist: Select, Sl.No, Reference Number, Work Order Number, LR Number, Transporter, Action.
Detail fields: Tax Invoice, ODN Number, Invoice Date, Basic Shipment Value, Invoice Value With GST, Required Date & Time, Reported Date & Time, Physical Dispatch Date & Time, Plant, Transaction Type, Billing Transaction Type, Division, Sub Division, SO / Ref. Number, Customer Name.

### 4. Shipment Details
Worklist: Select, Sl.No, Map ID, Reference Number, Work Order Number, LR Number, Transporter, Action.
Top fields: Invoice Number, Incoterms, Insurance Scope, Kilometres, DC Reference Number (Without SAP).
Line-items table: Sl.No, Map ID, Product, Type of Material, Material Description, No of Sets/No (Qty), Ah Loaded, Shipment Weight (kg), Battery Condition, Action.

### 5. Invoice Load Details
Worklist: standard columns. Detail: Invoice No., Invoice Date, HSN, UoM, Qty, Rate, Taxable Value, CGST, SGST, IGST, Total Invoice Value, Eway Bill No., Eway Bill Validity, Pack Type, No. of Packages, Gross Wt., Net Wt.

### 6. Segment Info
Detail: Segment No., Origin, Destination, Mode (Road/Rail/Air/Sea), Distance (km), Planned Departure, Planned Arrival, Actual Departure, Actual Arrival, Carrier, Vehicle/Container No., Stage Cost, Remarks.

### 7. Vehicle Info
Detail: Vehicle Type, Vehicle Reg. No., Make/Model, Capacity (T), Driver Name, Driver Mobile, Driver Licence No., Licence Expiry, RC No., Fitness Validity, Insurance No., Insurance Validity, PUC Validity, GPS Device ID, Owner Type (Own/Hired), Vendor Code, Transporter.

### 8. Transit Info
Detail: Shipment No., Current Location, Last Ping Time, Next Stop, ETA, Delay (hrs), Temperature, Geofence Status, Exception (Breakdown/Detention/Re-routed/None), Remarks. Stops timeline (sequence, location, planned, actual, status).

### 9. Freight Billing
Sub-tabs: **Full Truck Load** | **Cargo**.
Worklist (FTL): Sl.No, Reference Number, LR Number, Work Order Number, Transporter, Action.
Detail: Basic Freight, Detention, Loading/Unloading Charges, Multi-point Charges, Toll, Other Charges, Sub Total, GST %, GST Value, TDS %, TDS Value, Total Payable, Invoice No. (Vendor), Invoice Date, PO Number, Payment Status.

### 10. Service Level (Shipment Feedback)
Detail: Shipment No., Customer, Delivery Date Planned/Actual, OTIF (Y/N), Delay Reason, Damage at Receipt (Y/N), Quantity Short, Customer Rating (1–5), Feedback Notes, Photo Upload (placeholder), POD Received (Y/N), POD Date.

### 11. Transit Damage Info
Detail: Shipment No., LR No., Material, Damaged Qty, Damage Type (Wet/Crushed/Broken/Leak), Stage Detected, Reported By, Reported Date, Photo/Evidence (placeholder), Cost Estimate, Recovery From (Transporter/Insurance/HBL), Remarks.

### 12. Insurance Claim Tracking
Detail: Claim No., Policy No., Insurer, Shipment No., LR No., Date of Loss, Date of Intimation, Surveyor, Survey Date, Claim Amount, Approved Amount, Status (Intimated/Surveyed/Approved/Settled/Rejected), Settlement Date, Remarks.

## Files to create / modify

```text
src/components/app-sidebar.tsx           (rewrite: only 12 LE items)
src/components/le-screen-shell.tsx       (new: shared layout for screens 3–12)
src/components/le-worklist-toolbar.tsx   (new: mode tabs + Pending/Completed chips + lookup bar)
src/components/le-footer.tsx             (new: Sharviinfotech footer)
src/lib/le-mock-data.ts                  (new: typed mock rows per screen)

src/routes/index.tsx                     (rewrite → redirect to /dispatch-orders)
src/routes/dispatch-orders.tsx           (new — screen 1)
src/routes/dispatch.tsx                  (new — screen 2)
src/routes/order-info.tsx                (new — screen 3)
src/routes/shipment-details.tsx          (new — screen 4)
src/routes/invoice-load-details.tsx      (new — screen 5)
src/routes/segment-info.tsx              (new — screen 6)
src/routes/vehicle-info.tsx              (new — screen 7)
src/routes/transit-info.tsx              (new — screen 8)
src/routes/freight-billing.tsx           (new — screen 9, with FTL/Cargo sub-tabs)
src/routes/service-level.tsx             (new — screen 10)
src/routes/transit-damage-info.tsx       (new — screen 11)
src/routes/insurance-claim-tracking.tsx  (new — screen 12)
```

Old route files (`inbound.*`, `outbound.*`, `transportation.*`, `reports.index.tsx`) are deleted along with their now-unused components so the route tree only contains the 12 screens + root.

## Out of scope

- Real SAP HANA data binding (all rows are mock arrays in `le-mock-data.ts`).
- Authentication / user-creation screen (item 13 in the PDF) — not in the 1–12 list.
- Filter & Download modal (PDF pages 41–43) — can be added in a follow-up if you want it.
