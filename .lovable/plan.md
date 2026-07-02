## Goal
Highlight the Finance Details dropdown and its four dependent fields (JV Number, JV Date, UTR Number, UTR Date) in red to match the reference image (soft pink fill, red border, red focus ring).

## Scope
Single file: `src/components/freight-billing-sap-create.tsx`

## Changes
1. Define a local `RED_INPUT` class string alongside the existing `GREEN_INPUT`, e.g.:
   `"h-7 w-full rounded-md border border-red-400 bg-red-50 px-2 text-[12px] text-foreground focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"`
2. Apply `RED_INPUT` (in place of `GREEN_INPUT`) on:
   - Finance Details `<select>`
   - JV Number `<input>`
   - JV Date `<input type="date">`
   - UTR Number `<input>`
   - UTR Date `<input type="date">`
3. Keep labels, grid placement, conditional rendering, and state logic unchanged.

## Out of scope
- Any other fields, dialogs, or screens.
- State, persistence, or validation changes.
