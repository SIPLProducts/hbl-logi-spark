In the Freight Billing screen, style the Finance Details field and its related fields (JV Number, JV Date, UTR Number, UTR Date) in red, matching the reference image's red-bordered dropdown.

Changes
- Add a reusable red-styled input class constant in `src/components/freight-billing-sap-create.tsx` (red border, red text, red focus ring).
- Apply the red styling to the Finance Details `<select>` dropdown.
- Apply the same red styling to the conditional JV Number, JV Date, UTR Number, and UTR Date inputs.
- Optionally tint the labels for those fields in red for visual consistency.
- Verify the component builds and renders correctly.

File affected
- `src/components/freight-billing-sap-create.tsx`
