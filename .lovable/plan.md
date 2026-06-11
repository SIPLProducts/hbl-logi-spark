## Goal
Add a "User Creation" screen accessible after Insurance Claim Tracking in the sidebar, matching the existing LE app look & feel.

## Changes

### 1. New route: `src/routes/user-creation.tsx`
- `createFileRoute("/user-creation")` with `head()` setting title "User Creation · HBL LE" and matching description.
- Uses `LeScreenShell` for consistent header/Create+Search tabs styling.
- Provides `renderCreateBody` returning a custom `<UserCreationCreate />` component so the body matches the recent SAP create components (no SAP toggle is relevant here — but `LeScreenShell` always shows it; that's acceptable to keep the look consistent with sibling screens, same as Order Info / Insurance Claim).
- Passes a minimal `groups` array (used by Search & Reports view-mode fallback only).

### 2. New component: `src/components/user-creation-create.tsx`
A single create body styled the same as `insurance-claim-tracking-sap-create.tsx` (green-themed inputs, rounded surface cards). Sections:

- **Users list table** (reference table, same emerald/teal gradient header as other screens) with columns:
  Select, Sl.No, User ID, Full Name, Email, Role, Plant, Status, Action (⋮). One placeholder row.

- **Search bar**: Select (User ID / Name / Email / Role) + text input + search icon button (identical pattern to existing screens).

- **User details form** (field grid, 3-col on lg) — fields:
  - User ID
  - Full Name
  - Employee Code
  - Email (type=email)
  - Mobile Number
  - Designation
  - Department (select: Logistics / Finance / Sales / Plant Ops / IT)
  - Role (select: Admin / LE Operator / Approver / Viewer)
  - Plant (select: HBL NCPP-SHPT / HBL VSP-SHPT / HBL HYD-PLANT-04)
  - Division (select: NCPP / VSP / Industrial)
  - Reporting Manager
  - Joining Date (date)
  - Valid From (date)
  - Valid To (date)
  - Status (select: Active / Inactive / Suspended)
  - Username
  - Password (type=password)
  - Confirm Password (type=password)
  - Profile Photo (file)

- **Permissions table** (secondary table, same styled header) with columns:
  Select, Sl.No, Module, View, Create, Edit, Delete, Approve, Action (+ / ×). Prepopulate one row (e.g. "Order Info") with checkboxes per permission.

- **Footer**: Save / Save and Next / Save and Previous buttons (same three colored buttons used elsewhere).

No `revealed` GET-gating — fields/tables/footer always visible (this screen has no SAP-based reveal).

### 3. Edit: `src/components/app-sidebar.tsx`
- Add a new sidebar group below the existing Insurance Claim Tracking group containing one item:
  `{ title: "User Creation", to: "/user-creation", icon: UserPlus }` (import `UserPlus` from `lucide-react`).

No other files touched. Pure UI / route work; no backend changes.
