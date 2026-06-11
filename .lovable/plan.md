## Dispatch screen — tweaks

Scope: `src/routes/dispatch.tsx` and `src/lib/dispatch-mock.ts` only. No other files touched. All other functionality (tabs, Create mode, filter form, pagination, sort, search, export buttons) stays as-is.

### 1. Remove KPI cards
In `src/routes/dispatch.tsx`, delete the 4-tile KPI strip (Total Dispatches / Pending / In Transit / Completed Today) that sits between the page header and the Tabs. Tabs move directly under the header. No other layout changes.

### 2. Replace Search & Reports results table columns
Replace the current 12-column results table with these 17 columns, in this exact order:

```
Sl.No · Reference No · Line No · Date · Plant · Division · Vehicle Type ·
No. of Trucks · Work Order · Vendor Code · Transporter · No. of LRs ·
LR Number · Loading Point · Unloading Point · No of Invoices · Created Date
```

Implementation:
- Rewrite `DispatchResultRow` in `src/lib/dispatch-mock.ts` to the new shape:
  `id, slNo, referenceNo, lineNo, date, plant, division, vehicleType, noOfTrucks, workOrder, vendorCode, transporter, noOfLRs, lrNumber, loadingPoint, unloadingPoint, noOfInvoices, createdDate`.
- Rewrite `sampleResultRows` to generate ~26 mock rows matching that shape (reuse `PLANTS`, `DIVISIONS`, `TRANSPORTERS`, new vehicle types below).
- Update the results table header, body cell rendering, sort keys, and the search filter (which fields the text search scans) in `src/routes/dispatch.tsx` to match the new columns. Sticky header, pagination, sort indicators, horizontal scroll all kept.

### 3. Vehicle Type dropdown values
Replace `VEHICLE_TYPES` in `src/lib/dispatch-mock.ts` with exactly:

```
CARGO, RATE CONTRACT, LOCAL TRANSPORTATION, CUSTOMER TRANSPORTER,
COMPANY VEHICLE, COURIER, BY HAND, FULL TRUCK LOAD
```

The Search & Reports filter "Vehicle Type" `Select` keeps its "Select Vehicle Type" placeholder and renders these options. The Create Dispatch grid's Vehicle Type cell uses the same list. Existing sample Create-mode rows are updated to use valid values from the new list (e.g. `FULL TRUCK LOAD`, `CARGO`).

### Out of scope
No backend wiring, no changes to sidebar/top bar/other routes, no design-token changes.
