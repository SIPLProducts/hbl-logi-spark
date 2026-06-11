## Freight Billing — Conditional Fields & Detail Modals

Update `src/components/freight-billing-sap-create.tsx` to add dynamic fields and two popup modals matching the reference images. No other files touched.

### Behavior

**When Provision checkbox is checked:**
- Show two new fields: **Provision Amount** (read-only text, click to open modal) and **Provision Date** (date input)
- Provision Amount field displays the computed total; clicking it opens the "Detailed Provision Amount Input" modal

**When Account checkbox is checked:**
- Show four new fields: **Freight Bill Number** (text), **Freight Bill Date** (date), **Bill Submission To F&A** (date), **Physical Submission Date** (date)
- **Freight Charges** field (read-only text, click to open modal) — displays the computed total; opens "Detailed Freight Charges Input" modal

Both checkboxes can be independent. Fields appear in the grid above the existing file-upload row, with smooth fade/slide transitions (Tailwind `animate-in fade-in slide-in-from-top-2`).

### Modals (shared layout, two instances)

Both modals share the same shape — only the title and label differ:
- **Header bar:** gradient purple/violet (`bg-gradient-to-r from-violet-500 to-purple-600`), white title text
- **Title:** "Detailed Provision Amount Input" / "Detailed Freight Charges Input"
- **3-column grid** of 9 numeric inputs (emerald green-bordered, label above):
  Basic Freight, Detention Loading, Detention Unloading, Loading Charges, Unloading Charges, Route Change, Transhipment Charges, Other Charges, Deduction
- **Total line** below grid: "Total Provision: X" / "Total Freight: X" — computed live as (sum of all 8 charges) − Deduction
- **Footer:** Cancel (red `bg-rose-500`) + Save (emerald) buttons, right-aligned
- Built with existing `Dialog` from `@/components/ui/dialog` with custom header styling

### Technical details

- New shared component `ChargesBreakdownDialog` inside the same file, props: `open`, `onOpenChange`, `title`, `totalLabel`, `value`, `onSave(breakdown, total)`
- Local state: `provision`, `account`, `provisionBreakdown`, `provisionTotal`, `provisionDate`, `freightBreakdown`, `freightTotal`, plus the new account text/date fields, plus two `*ModalOpen` booleans
- Provision Amount and Freight Charges fields rendered as read-only `<input>` with cursor-pointer + onClick opens modal (matching the empty-green-bordered field look in references)
- Layout: When Provision is on, Provision Amount + Provision Date occupy slots after Transportation Type row. When Account is on, Freight Bill Number / Freight Bill Date / Bill Submission To F&A appear, then Freight Charges + Physical Submission Date, before file uploads. Both modes co-exist cleanly in the 3-col grid.

### Files

- `src/components/freight-billing-sap-create.tsx` — edit only
