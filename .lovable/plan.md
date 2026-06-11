In the Create Dispatch toolbar, comment out the "Inward" radio button so only "Outward" remains visible. This hides the inward option from the UI while preserving the code for future re-enablement.

File: `src/routes/dispatch.tsx`
- Wrap the `<label>` block containing the "Inward" radio input in JSX comments (`{/* … */}`).
- Lines to comment: the `<label>` starting at line 194 through `</label>` at line 205.