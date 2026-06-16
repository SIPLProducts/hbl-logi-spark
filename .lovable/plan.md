## Update Inward/Outward and SAP/Non-SAP dropdowns in Reports screens

### What

All Reports screens render through `ReportPlaceholder`. Two filter dropdowns currently show only a disabled placeholder with no selectable values:

- Inward/Outward
- Sap/Nonsap

Update these to show actual dropdown options. All other filter dropdowns remain unchanged.

### How

File: `src/components/report-placeholder.tsx`

1. Change the `SELECTS` array from `{ label: string }[]` to `{ label: string; options?: string[] }[]`.
2. Populate the two entries with options:
   - `Select` → options: `["Inward", "Outward"]`
   - `Select` → options: `["SAP", "Non-SAP"]`
3. Update `SelectField` props to accept optional `options: string[]`.
4. In `SelectField`, when `options` are provided, render a disabled placeholder plus one `<option>` per value. When no options are provided, keep the existing behavior (disabled placeholder only).
5. Leave `SELECTS_ROW2`, `SELECTS_ROW3`, `SELECTS_ROW4` untouched — they continue passing only `label` to `SelectField`.

No other files are affected.
