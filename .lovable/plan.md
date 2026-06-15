Move the "No. of Cases Reported: 0" chip from inside the Transit Damage Info and Insurance Claim Tracking create-body components to the shared `LeScreenShell` direction bar, placing it before the "Pending" count.

### Changes
1. **Remove** the "No. of Cases Reported: 0" status chip block from:
   - `src/components/transit-damage-info-sap-create.tsx`
   - `src/components/insurance-claim-tracking-sap-create.tsx`
2. **Add** `renderDirectionExtras` prop to both route files so the chip renders inside the `LeScreenShell` direction bar, immediately before the `Pending` / `Completed` badges.

### Files affected
- `src/components/transit-damage-info-sap-create.tsx`
- `src/components/insurance-claim-tracking-sap-create.tsx`
- `src/routes/transit-damage-info.tsx`
- `src/routes/insurance-claim-tracking.tsx`