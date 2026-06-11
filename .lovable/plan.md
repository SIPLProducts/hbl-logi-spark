## Goal
Reuse the existing Create New User popup for the Edit action on the User Management table. In Edit mode the popup shows "Edit User" header, prefilled user data, password fields disabled behind a "Change Password" checkbox, and an "Update" button instead of "Create".

## Changes

### 1. `src/components/create-user-dialog.tsx` — extend to support both modes
- Accept new optional props:
  - `mode?: "create" | "edit"` (default `"create"`)
  - `initialValues?: UserFormValues` — pre-populates every field when provided
- Drive the dialog from local state seeded from `initialValues` (via `useEffect` on `open`) so each open re-syncs the form. Reset to blank defaults in create mode.
- Header title becomes **"Edit User"** when `mode === "edit"` (same indigo→violet→purple gradient bar, same close button).
- Footer button:
  - create mode → existing dark-red **Create** button
  - edit mode → same dark-red button labelled **Update**
- Password section in edit mode:
  - Render both Password and Confirm Password fields prefilled with masked dots and **disabled** (greyed background, matches reference).
  - Add a **"Change Password"** checkbox under the form grid (left-aligned, above the footer divider). When checked, enable both password inputs and clear them so the user can type a new password.
  - In create mode the checkbox is hidden and the fields stay enabled as today.
- Keep all other fields, layout, validations, styling, and required-asterisk treatment identical to the create popup.

### 2. `src/routes/user-creation.tsx` — wire the Edit action
- Track dialog state as `{ open: boolean; mode: "create" | "edit"; values?: UserFormValues }`.
- "+ Create New User" button opens with `mode: "create"`, no initial values.
- The row's pencil (edit) icon button opens with `mode: "edit"` and the seed row's values:
  - userId `2424`, firstName `Admin`, lastName `User`, contact `7337283880`,
    email `inturimounika@sharviinfotech.com`, category `Internal`,
    employeeCode `2424`, inOutType `Outward`,
    plants `1100, 1101, 1102, 1105, 1106, 1200, 1300, ...`,
    divisions `NCPP, COMMON SERVICE, Corporate, ...`,
    role `ADMIN`, screensCount `23`, status `Active`,
    password/confirmPassword shown as 10 masked chars, disabled until Change Password is toggled.
- Pass these through to `<CreateUserDialog mode={...} initialValues={...} />`.

### 3. No other files touched
No sidebar, route, schema, or backend changes. Pure UI work in the two files above.
