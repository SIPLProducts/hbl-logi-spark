## Change
In `src/components/transit-damage-info-sap-create.tsx`, reorder the without-SAP field array so **DC Reference Number** appears first and **Invoice Date** appears second.

## Details
Current without-SAP field order:
1. Invoice Date
2. DC Reference Number
3. FSR Report Date
...

Desired without-SAP field order:
1. DC Reference Number
2. Invoice Date
3. FSR Report Date
...

## Implementation
Swap the first two entries in the `fields` array construction for `isWithout`. No other code changes required.