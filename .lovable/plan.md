## Goal
Add a Create-mode body for the Insurance Claim Tracking screen that mirrors the Order Info / Transit Damage Info layout, with With-SAP and Without-SAP variants matching the two reference screenshots.

## Changes

### 1. New file: `src/components/insurance-claim-tracking-sap-create.tsx`
Built from the same skeleton as `transit-damage-info-sap-create.tsx` (status chips, reference table, lookup bar, field grid, secondary vehicle table, footer Save / Save and Next / Save and Previous).

Differences from Transit Damage:

- **Field list (With SAP, 19 fields)** matching screenshot #1:
  Fiscal Year, Reported Date (date), Claim Reference, Invoice Date (date), Invoice Basic Value, Loss Declared, Claim Received (date), Salvage Value, Customer, SO Number, Location, Damage Remarks (select: Wet / Crushed / Broken / Leak), Claim Info Sent, Claim Status (select: Open / In Review / Approved / Rejected / Settled), Claim Document Status (select: Pending / Submitted / Verified), Courier Details, Payment Status (select: Pending / Partial / Paid), Payment Info, UTR, Claim Settlement Date (date), Supporting Document (file), Approve Document (file).

- **Field list (Without SAP)** = With-SAP list with `DC Reference Number` inserted as the first field (replaces the Invoice Number lookup bar, mirroring transit-damage pattern).

- **Secondary table columns** (per screenshots): Select, Sl.No, Map ID (select), Vehicle Line, Vehicle Type, Truck Number, LR Number, AH, No. of Sets, Transporter, Action (+ / ×).

- **Lookup bar behavior** (identical to transit-damage):
  - With-SAP: shows Invoice Number input + GET button. Fields/secondary table/footer hidden until GET clicked with a non-empty value.
  - Without-SAP: no lookup row; fields always visible.
  - `showFields = isWithout || revealed` so toggling SAP from with→without always reveals fields.

### 2. Edit: `src/routes/insurance-claim-tracking.tsx`
- Import `InsuranceClaimTrackingSapCreate`.
- Add `renderCreateBody={({ sap, direction }) => direction === "outward" ? <InsuranceClaimTrackingSapCreate mode={sap === "with" ? "with" : "without"} /> : null}` on the existing `LeScreenShell` (same wiring as Order Info / Transit Damage).
- Leave existing `groups` (view-mode content) untouched.

No other files touched. Pure UI work.
